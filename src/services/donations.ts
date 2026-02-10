import { Transaction, type TransactionObjectArgument } from "@mysten/sui/transactions";
import type { PaginatedCoins, SuiClient } from "@mysten/sui/client";
import { normalizeSuiAddress, SUI_TYPE_ARG } from "@mysten/sui/utils";

import {
  CLOCK_OBJECT_ID,
  getContractConfig,
} from "@/shared/config/contracts";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { SupportedNetwork } from "@/shared/types/network";
import {
  applySlippageTolerance,
  attachPriceOracleQuote,
} from "@/services/priceOracle";
import type { TokenRegistryEntry } from "@/services/tokenRegistry";
import { canonicalizeCoinType, isSuiCoinType } from "@/shared/utils/sui";

const MAX_U64 = (1n << 64n) - 1n;
const DEFAULT_SLIPPAGE_BPS = 100; // 1%
const SUI_GAS_RESERVE_FALLBACK = 30_000_000n; // Use 0.03 SUI only when gas estimation is unavailable.
const SUI_GAS_RESERVE_MULTIPLIER_BPS = 13_000n; // 1.3x estimated gas budget.
const SUI_GAS_RESERVE_FLAT_OVERHEAD = 2_000_000n; // Add 0.002 SUI on top of scaled gas budget.
const MAX_SUI_GAS_RESERVE_ATTEMPTS = 3;

export interface DonationBuildResult {
  transaction: Transaction;
  quotedUsdMicro: bigint;
  expectedMinUsdMicro: bigint;
  rawAmount: bigint;
  pricePublishTimeMs: number;
  priceFeedId: string;
  registryMaxAgeMs: number;
  token: TokenRegistryEntry;
}

interface BaseDonationBuilderParams {
  suiClient: SuiClient;
  accountAddress: string;
  campaignId: string;
  statsId: string;
  token: TokenRegistryEntry;
  rawAmount: bigint;
  network?: SupportedNetwork;
  slippageBps?: number;
  maxAgeMsOverride?: number | null;
}

interface RepeatDonationBuilderParams extends BaseDonationBuilderParams {
  profileId: string;
}

export type DonationBuildFlow = "firstTime" | "repeat";

export interface BuildDonationTransactionParams
  extends BaseDonationBuilderParams {
  flow: DonationBuildFlow;
  profileId?: string | null;
}

export async function buildDonationTransaction(
  params: BuildDonationTransactionParams,
): Promise<DonationBuildResult> {
  const { flow, profileId, ...common } = params;

  if (flow === "repeat") {
    if (!profileId) {
      throw new Error("Profile ID is required for repeat donations.");
    }
    return await buildRepeatDonationTx({
      ...common,
      profileId,
    });
  }

  return await buildFirstTimeDonationTx(common);
}

export async function buildFirstTimeDonationTx(
  params: BaseDonationBuilderParams,
): Promise<DonationBuildResult> {
  const {
    suiClient,
    accountAddress,
    campaignId,
    statsId,
    token,
    rawAmount,
    network = DEFAULT_NETWORK,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
    maxAgeMsOverride = null,
  } = params;

  validateCommonInputs({
    accountAddress,
    campaignId,
    statsId,
    profileId: null,
    token,
    rawAmount,
  });

  const config = getContractConfig(network);
  return await buildDonationTxWithGasRetry({
    suiClient,
    accountAddress,
    campaignId,
    statsId,
    token,
    rawAmount,
    network,
    slippageBps,
    maxAgeMsOverride,
    configureMoveCall: ({
      tx,
      campaignId,
      statsId,
      coinType,
      donationCoin,
      priceInfoObject,
      expectedMinUsdMicro,
      maxAgeArg,
    }) => {
      tx.moveCall({
        target: `${config.contracts.packageId}::donations::donate_and_award_first_time`,
        typeArguments: [coinType],
        arguments: [
          tx.object(campaignId),
          tx.object(statsId),
          tx.object(config.contracts.tokenRegistryObjectId),
          tx.object(config.contracts.badgeConfigObjectId),
          tx.object(config.contracts.profilesRegistryObjectId),
          tx.object(CLOCK_OBJECT_ID),
          donationCoin,
          priceInfoObject,
          tx.pure.u64(expectedMinUsdMicro),
          maxAgeArg,
        ],
      });
    },
  });
}

export async function buildRepeatDonationTx(
  params: RepeatDonationBuilderParams,
): Promise<DonationBuildResult> {
  const {
    suiClient,
    accountAddress,
    campaignId,
    statsId,
    token,
    rawAmount,
    profileId,
    network = DEFAULT_NETWORK,
    slippageBps = DEFAULT_SLIPPAGE_BPS,
    maxAgeMsOverride = null,
  } = params;

  validateCommonInputs({
    accountAddress,
    campaignId,
    statsId,
    profileId,
    token,
    rawAmount,
  });

  const config = getContractConfig(network);
  return await buildDonationTxWithGasRetry({
    suiClient,
    accountAddress,
    campaignId,
    statsId,
    token,
    rawAmount,
    network,
    slippageBps,
    maxAgeMsOverride,
    configureMoveCall: ({
      tx,
      campaignId,
      statsId,
      coinType,
      donationCoin,
      priceInfoObject,
      expectedMinUsdMicro,
      maxAgeArg,
    }) => {
      tx.moveCall({
        target: `${config.contracts.packageId}::donations::donate_and_award`,
        typeArguments: [coinType],
        arguments: [
          tx.object(campaignId),
          tx.object(statsId),
          tx.object(config.contracts.tokenRegistryObjectId),
          tx.object(config.contracts.badgeConfigObjectId),
          tx.object(CLOCK_OBJECT_ID),
          tx.object(profileId),
          donationCoin,
          priceInfoObject,
          tx.pure.u64(expectedMinUsdMicro),
          maxAgeArg,
        ],
      });
    },
  });
}

interface BuildDonationTxWithGasRetryParams extends BaseDonationBuilderParams {
  configureMoveCall: (params: {
    tx: Transaction;
    campaignId: string;
    statsId: string;
    coinType: string;
    donationCoin: TransactionObjectArgument;
    priceInfoObject: TransactionObjectArgument;
    expectedMinUsdMicro: bigint;
    maxAgeArg: ReturnType<typeof resolveMaxAgeOption>;
  }) => void;
}

async function buildDonationTxWithGasRetry({
  suiClient,
  accountAddress,
  campaignId,
  statsId,
  token,
  rawAmount,
  network = DEFAULT_NETWORK,
  slippageBps = DEFAULT_SLIPPAGE_BPS,
  maxAgeMsOverride = null,
  configureMoveCall,
}: BuildDonationTxWithGasRetryParams): Promise<DonationBuildResult> {
  const coinType = canonicalizeCoinType(token.coinType);
  const isSuiDonation = isSuiCoinType(coinType);
  let suiGasReserveHint: bigint | null = null;

  for (let attempt = 0; attempt < MAX_SUI_GAS_RESERVE_ATTEMPTS; attempt += 1) {
    const tx = new Transaction();
    tx.setSenderIfNotSet(accountAddress);

    const preparedCoin = await prepareDonationCoin({
      tx,
      suiClient,
      ownerAddress: accountAddress,
      coinType,
      rawAmount,
      suiGasReserveHint: isSuiDonation ? suiGasReserveHint : null,
    });

    const priceQuote = await attachPriceOracleQuote({
      network,
      token,
      suiClient,
      transaction: tx,
      rawAmount,
    });

    const expectedMinUsdMicro = deriveExpectedMinUsdMicro(
      priceQuote.quotedUsdMicro,
      slippageBps,
    );
    const maxAgeArg = resolveMaxAgeOption(tx, maxAgeMsOverride);

    configureMoveCall({
      tx,
      campaignId,
      statsId,
      coinType,
      donationCoin: preparedCoin.coin,
      priceInfoObject: priceQuote.priceInfoObject,
      expectedMinUsdMicro,
      maxAgeArg,
    });

    const buildResult: DonationBuildResult = {
      transaction: tx,
      quotedUsdMicro: priceQuote.quotedUsdMicro,
      expectedMinUsdMicro,
      rawAmount,
      pricePublishTimeMs: priceQuote.publishTimeMs,
      priceFeedId: priceQuote.feedId,
      registryMaxAgeMs: priceQuote.registryMaxAgeMs,
      token,
    };

    if (!isSuiDonation) {
      return buildResult;
    }

    const dynamicReserve = await estimateSuiGasReserve({
      tx,
      suiClient,
    });
    const requiredReserve = dynamicReserve ?? SUI_GAS_RESERVE_FALLBACK;
    const selectedSuiBalance = preparedCoin.selectedSuiBalance ?? 0n;
    const requiredTotal = rawAmount + requiredReserve;

    if (selectedSuiBalance >= requiredTotal) {
      return buildResult;
    }

    if (attempt === MAX_SUI_GAS_RESERVE_ATTEMPTS - 1) {
      throw new Error("Insufficient SUI to cover the donation plus gas fees.");
    }

    suiGasReserveHint = requiredReserve;
  }

  throw new Error("Failed to build donation transaction.");
}

export function parseCoinInputToRawAmount(
  value: string,
  decimals: number,
): bigint {
  const sanitized = value.replace(/,/g, "").trim();
  if (!sanitized || sanitized === ".") {
    throw new Error("Enter an amount to donate.");
  }

  const match = sanitized.match(/^(\d*)(?:\.(\d*))?$/);
  if (!match) {
    throw new Error("Enter a valid decimal amount.");
  }

  const wholePart = match[1] ?? "";
  const fractionPart = match[2] ?? "";

  if (!wholePart && !fractionPart) {
    throw new Error("Enter a valid decimal amount.");
  }

  if (fractionPart.length > decimals) {
    throw new Error(
      `This token supports at most ${decimals} decimal places.`,
    );
  }

  const scale = pow10BigInt(decimals);
  const whole = BigInt(wholePart || "0");
  const normalizedFraction = (fractionPart + "0".repeat(decimals)).slice(0, decimals);
  const fraction = normalizedFraction ? BigInt(normalizedFraction) : 0n;
  const raw = whole * scale + fraction;

  if (raw <= 0n) {
    throw new Error("Donation amount must be greater than zero.");
  }

  if (raw > MAX_U64) {
    throw new Error("Donation amount exceeds supported range.");
  }

  return raw;
}

async function prepareDonationCoin({
  tx,
  suiClient,
  ownerAddress,
  coinType,
  rawAmount,
  suiGasReserveHint = null,
}: {
  tx: Transaction;
  suiClient: SuiClient;
  ownerAddress: string;
  coinType: string;
  rawAmount: bigint;
  suiGasReserveHint?: bigint | null;
}): Promise<{
  coin: TransactionObjectArgument;
  selectedSuiBalance?: bigint;
}> {
  const normalizedCoinType = canonicalizeCoinType(coinType);

  if (isSuiCoinType(normalizedCoinType)) {
    return await prepareSuiDonationCoin({
      tx,
      suiClient,
      ownerAddress,
      rawAmount,
      suiGasReserveHint,
    });
  }

  const normalizedOwner = normalizeSuiAddress(ownerAddress);
  const coins = await selectCoinsForAmount({
    suiClient,
    owner: normalizedOwner,
    coinType: normalizedCoinType,
    rawAmount,
  });

  if (!coins.length) {
    throw new Error("No spendable coins found for the selected token.");
  }

  const totalBalance = coins.reduce((sum, coin) => {
    const balance = coin.balance ? BigInt(coin.balance) : 0n;
    return sum + balance;
  }, 0n);

  if (totalBalance < rawAmount) {
    throw new Error("Insufficient balance for this donation amount.");
  }

  const [firstCoin, ...extraCoins] = coins;
  const primaryCoin = tx.object(firstCoin.coinObjectId);

  extraCoins.forEach((coin) => {
    tx.mergeCoins(primaryCoin, [tx.object(coin.coinObjectId)]);
  });

  if (totalBalance === rawAmount) {
    return { coin: primaryCoin };
  }

  const [donationCoin] = tx.splitCoins(primaryCoin, [rawAmount]);
  return { coin: donationCoin };
}

async function prepareSuiDonationCoin({
  tx,
  suiClient,
  ownerAddress,
  rawAmount,
  suiGasReserveHint,
}: {
  tx: Transaction;
  suiClient: SuiClient;
  ownerAddress: string;
  rawAmount: bigint;
  suiGasReserveHint?: bigint | null;
}): Promise<{
  coin: TransactionObjectArgument;
  selectedSuiBalance: bigint;
}> {
  tx.setSenderIfNotSet(ownerAddress);
  const normalizedOwner = normalizeSuiAddress(ownerAddress);
  const reserve =
    typeof suiGasReserveHint === "bigint" && suiGasReserveHint > 0n
      ? suiGasReserveHint
      : 0n;
  const requiredAmountWithBuffer = rawAmount + reserve;
  if (requiredAmountWithBuffer > MAX_U64) {
    throw new Error("Donation amount exceeds supported range.");
  }

  const coins = await selectCoinsForAmount({
    suiClient,
    owner: normalizedOwner,
    coinType: SUI_TYPE_ARG,
    rawAmount: requiredAmountWithBuffer,
  });

  if (!coins.length) {
    throw new Error("No spendable SUI coins found for this wallet.");
  }

  const sortedCoins = [...coins].sort((a, b) => {
    const balanceA = BigInt(a.balance ?? "0");
    const balanceB = BigInt(b.balance ?? "0");
    return balanceB > balanceA ? 1 : balanceB < balanceA ? -1 : 0;
  });

  const totalBalance = sortedCoins.reduce((sum, coin) => {
    const balance = coin.balance ? BigInt(coin.balance) : 0n;
    return sum + balance;
  }, 0n);

  if (totalBalance < requiredAmountWithBuffer) {
    throw new Error("Insufficient SUI to cover the donation plus gas fees.");
  }

  const gasPayments = sortedCoins.map((coin) => {
    if (!coin.digest || !coin.version) {
      throw new Error("Unable to resolve metadata for the selected SUI coins.");
    }
    return {
      objectId: coin.coinObjectId,
      digest: coin.digest,
      version: coin.version,
    };
  });

  tx.setGasPayment(gasPayments);

  const [donationCoin] = tx.splitCoins(tx.gas, [rawAmount]);
  return {
    coin: donationCoin,
    selectedSuiBalance: totalBalance,
  };
}

async function estimateSuiGasReserve({
  tx,
  suiClient,
}: {
  tx: Transaction;
  suiClient: SuiClient;
}): Promise<bigint | null> {
  const estimationTx = Transaction.from(tx);
  try {
    await estimationTx.build({ client: suiClient });
  } catch {
    return null;
  }

  const gasBudget = readGasBudgetFromTransaction(estimationTx);
  if (gasBudget === null || gasBudget <= 0n) {
    return null;
  }

  const scaledBudget =
    (gasBudget * SUI_GAS_RESERVE_MULTIPLIER_BPS + 9_999n) / 10_000n;
  const reserve = scaledBudget + SUI_GAS_RESERVE_FLAT_OVERHEAD;

  return reserve > 0n ? reserve : null;
}

function readGasBudgetFromTransaction(tx: Transaction): bigint | null {
  const snapshot = tx.getData();
  if (!snapshot || typeof snapshot !== "object") {
    return null;
  }

  const gasData = (snapshot as { gasData?: unknown }).gasData;
  if (!gasData || typeof gasData !== "object") {
    return null;
  }

  const budgetRaw = (gasData as { budget?: unknown }).budget;
  if (
    typeof budgetRaw !== "string" &&
    typeof budgetRaw !== "number" &&
    typeof budgetRaw !== "bigint"
  ) {
    return null;
  }

  try {
    return BigInt(budgetRaw);
  } catch {
    return null;
  }
}

function deriveExpectedMinUsdMicro(
  quotedUsdMicro: bigint,
  slippageBps: number,
): bigint {
  if (quotedUsdMicro <= 0n) {
    throw new Error("Price oracle returned a zero-value quote.");
  }
  const adjusted = applySlippageTolerance(quotedUsdMicro, slippageBps);
  if (adjusted <= 0n) {
    throw new Error("Slippage tolerance is too strict for this quote.");
  }
  return adjusted;
}

function resolveMaxAgeOption(
  tx: Transaction,
  maxAgeMsOverride: number | null,
) {
  if (
    typeof maxAgeMsOverride === "number" &&
    Number.isFinite(maxAgeMsOverride) &&
    maxAgeMsOverride > 0
  ) {
    return tx.pure.option("u64", BigInt(Math.floor(maxAgeMsOverride)));
  }
  return tx.pure.option("u64", null);
}

function pow10BigInt(exp: number): bigint {
  if (exp <= 0) {
    return 1n;
  }
  let result = 1n;
  for (let i = 0; i < exp; i += 1) {
    result *= 10n;
  }
  return result;
}

function validateCommonInputs({
  accountAddress,
  campaignId,
  statsId,
  profileId,
  token,
  rawAmount,
}: {
  accountAddress: string;
  campaignId: string;
  statsId: string;
  profileId: string | null;
  token: TokenRegistryEntry;
  rawAmount: bigint;
}) {
  if (!accountAddress) {
    throw new Error("Wallet connection is required to donate.");
  }
  if (!campaignId) {
    throw new Error("Campaign ID is missing.");
  }
  if (!statsId) {
    throw new Error("Campaign stats object ID is missing.");
  }
  if (!token?.coinType) {
    throw new Error("Select a valid donation token.");
  }
  if (rawAmount <= 0n) {
    throw new Error("Donation amount must be greater than zero.");
  }
  if (!token.isEnabled) {
    throw new Error(`${token.symbol} is currently disabled for donations.`);
  }
  if (profileId !== null && !profileId) {
    throw new Error("Profile ID is required for repeat donations.");
  }
}

export { DEFAULT_SLIPPAGE_BPS };

interface SelectedCoin {
  coinObjectId: string;
  balance: string;
  digest?: string;
  version?: string;
}

interface SelectCoinsParams {
  owner: string;
  coinType?: string;
  amount: string | number | bigint;
}

async function selectCoinsForAmount({
  suiClient,
  owner,
  coinType,
  rawAmount,
}: {
  suiClient: SuiClient;
  owner: string;
  coinType: string;
  rawAmount: bigint;
}): Promise<SelectedCoin[]> {
  if (hasSelectCoins(suiClient)) {
    return await suiClient.selectCoins({
      owner,
      coinType,
      amount: rawAmount.toString(),
    });
  }
  return await fetchCoinsManually({
    suiClient,
    owner,
    coinType,
    requiredAmount: rawAmount,
  });
}

async function fetchCoinsManually({
  suiClient,
  owner,
  coinType,
  requiredAmount,
}: {
  suiClient: SuiClient;
  owner: string;
  coinType: string;
  requiredAmount: bigint;
}): Promise<SelectedCoin[]> {
  const coins: SelectedCoin[] = [];
  let cursor: string | null = null;
  let aggregated = 0n;

  do {
    const page: PaginatedCoins = await suiClient.getCoins({
      owner,
      coinType,
      cursor: cursor ?? undefined,
      limit: 50,
    });

    page.data.forEach((coin) => {
      coins.push({
        coinObjectId: coin.coinObjectId,
        balance: coin.balance,
        digest: coin.digest,
        version: coin.version,
      });
      aggregated += BigInt(coin.balance ?? "0");
    });

    cursor = page.hasNextPage ? page.nextCursor ?? null : null;
  } while (aggregated < requiredAmount && cursor);

  return coins;
}

function hasSelectCoins(client: SuiClient): client is SuiClient & {
  selectCoins: (params: SelectCoinsParams) => Promise<SelectedCoin[]>;
} {
  const candidate = client as unknown as { selectCoins?: unknown };
  return typeof candidate.selectCoins === "function";
}
