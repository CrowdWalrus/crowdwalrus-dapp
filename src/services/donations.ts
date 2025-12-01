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

const MAX_U64 = (1n << 64n) - 1n;
const DEFAULT_SLIPPAGE_BPS = 100; // 1%
const SUI_DONATION_GAS_BUFFER = 200_000_000n; // Reserve ~0.2 SUI so the gas coin retains enough balance after splitting.

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
  const tx = new Transaction();
  tx.setSenderIfNotSet(accountAddress);

  const donationCoin = await prepareDonationCoin({
    tx,
    suiClient,
    ownerAddress: accountAddress,
    coinType: token.coinType,
    rawAmount,
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

  tx.moveCall({
    target: `${config.contracts.packageId}::donations::donate_and_award_first_time`,
    typeArguments: [token.coinType],
    arguments: [
      tx.object(campaignId),
      tx.object(statsId),
      tx.object(config.contracts.tokenRegistryObjectId),
      tx.object(config.contracts.badgeConfigObjectId),
      tx.object(config.contracts.profilesRegistryObjectId),
      tx.object(CLOCK_OBJECT_ID),
      donationCoin,
      priceQuote.priceInfoObject,
      tx.pure.u64(expectedMinUsdMicro),
      maxAgeArg,
    ],
  });

  return {
    transaction: tx,
    quotedUsdMicro: priceQuote.quotedUsdMicro,
    expectedMinUsdMicro,
    rawAmount,
    pricePublishTimeMs: priceQuote.publishTimeMs,
    priceFeedId: priceQuote.feedId,
    registryMaxAgeMs: priceQuote.registryMaxAgeMs,
    token,
  };
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
  const tx = new Transaction();
  tx.setSenderIfNotSet(accountAddress);

  const donationCoin = await prepareDonationCoin({
    tx,
    suiClient,
    ownerAddress: accountAddress,
    coinType: token.coinType,
    rawAmount,
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

  tx.moveCall({
    target: `${config.contracts.packageId}::donations::donate_and_award`,
    typeArguments: [token.coinType],
    arguments: [
      tx.object(campaignId),
      tx.object(statsId),
      tx.object(config.contracts.tokenRegistryObjectId),
      tx.object(config.contracts.badgeConfigObjectId),
      tx.object(CLOCK_OBJECT_ID),
      tx.object(profileId),
      donationCoin,
      priceQuote.priceInfoObject,
      tx.pure.u64(expectedMinUsdMicro),
      maxAgeArg,
    ],
  });

  return {
    transaction: tx,
    quotedUsdMicro: priceQuote.quotedUsdMicro,
    expectedMinUsdMicro,
    rawAmount,
    pricePublishTimeMs: priceQuote.publishTimeMs,
    priceFeedId: priceQuote.feedId,
    registryMaxAgeMs: priceQuote.registryMaxAgeMs,
    token,
  };
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

export function formatRawAmount(
  rawAmount: bigint,
  decimals: number,
  maximumFractionDigits = 6,
): string {
  if (rawAmount === 0n) {
    return "0";
  }

  const scale = pow10BigInt(decimals);
  const whole = rawAmount / scale;
  const fraction = rawAmount % scale;
  if (fraction === 0n) {
    return whole.toString();
  }

  const fractionStr = fraction
    .toString()
    .padStart(decimals, "0")
    .slice(0, maximumFractionDigits)
    .replace(/0+$/, "");

  return fractionStr.length > 0
    ? `${whole.toString()}.${fractionStr}`
    : whole.toString();
}

async function prepareDonationCoin({
  tx,
  suiClient,
  ownerAddress,
  coinType,
  rawAmount,
}: {
  tx: Transaction;
  suiClient: SuiClient;
  ownerAddress: string;
  coinType: string;
  rawAmount: bigint;
}): Promise<TransactionObjectArgument> {
  if (coinType === SUI_TYPE_ARG) {
    return await prepareSuiDonationCoin({
      tx,
      suiClient,
      ownerAddress,
      rawAmount,
    });
  }

  const normalizedOwner = normalizeSuiAddress(ownerAddress);
  const coins = await selectCoinsForAmount({
    suiClient,
    owner: normalizedOwner,
    coinType,
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
    return primaryCoin;
  }

  const [donationCoin] = tx.splitCoins(primaryCoin, [rawAmount]);
  return donationCoin;
}

async function prepareSuiDonationCoin({
  tx,
  suiClient,
  ownerAddress,
  rawAmount,
}: {
  tx: Transaction;
  suiClient: SuiClient;
  ownerAddress: string;
  rawAmount: bigint;
}): Promise<TransactionObjectArgument> {
  tx.setSenderIfNotSet(ownerAddress);
  const normalizedOwner = normalizeSuiAddress(ownerAddress);
  const requiredAmountWithBuffer = rawAmount + SUI_DONATION_GAS_BUFFER;
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

  const [gasCoin, ...extraCoins] = sortedCoins;
  if (!gasCoin?.digest || !gasCoin?.version) {
    throw new Error("Unable to resolve metadata for the selected SUI coin.");
  }

  tx.setGasPayment([
    {
      objectId: gasCoin.coinObjectId,
      digest: gasCoin.digest,
      version: gasCoin.version,
    },
  ]);

  extraCoins.forEach((coin) => {
    tx.mergeCoins(tx.gas, [tx.object(coin.coinObjectId)]);
  });

  const [donationCoin] = tx.splitCoins(tx.gas, [rawAmount]);
  return donationCoin;
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
