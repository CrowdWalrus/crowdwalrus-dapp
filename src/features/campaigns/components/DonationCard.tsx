/**
 * Donation Card Component
 * Campaign contribution and progress display with on-chain donation wiring.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  useCurrentAccount,
  useCurrentWallet,
  useSuiClient,
  useSuiClientQuery,
} from "@mysten/dapp-kit";
import type { Transaction } from "@mysten/sui/transactions";
import { SUI_TYPE_ARG } from "@mysten/sui/utils";
import { toast } from "sonner";
import { Share2, Clock, Loader2 } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Separator } from "@/shared/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { VerificationBadge } from "./CampaignBadges";
import { formatUsdLocaleFromMicros } from "@/shared/utils/currency";
import { useEnabledTokens } from "@/features/tokens/hooks";
import { useProfile } from "@/features/profiles/hooks/useProfile";
import {
  buildFirstTimeDonationTx,
  buildRepeatDonationTx,
  parseCoinInputToRawAmount,
  formatRawAmount,
  DEFAULT_SLIPPAGE_BPS,
  type DonationBuildResult,
} from "@/services/donations";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { TokenRegistryEntry } from "@/services/tokenRegistry";
import { isUserRejectedError } from "@/shared/utils/errors";
import { getContractConfig } from "@/shared/config/contracts";

interface DonationCardProps {
  campaignId: string;
  statsId: string;
  isVerified: boolean;
  startDateMs: number;
  endDateMs: number;
  raisedUsdMicro: bigint;
  contributorsCount: number;
  fundingGoalUsdMicro: bigint;
  recipientAddress: string;
  isActive: boolean;
  onDonationComplete?: () => Promise<void> | void;
}

export function DonationCard({
  campaignId,
  statsId,
  isVerified,
  startDateMs,
  endDateMs,
  raisedUsdMicro,
  contributorsCount,
  fundingGoalUsdMicro,
  recipientAddress,
  isActive,
  onDonationComplete,
}: DonationCardProps) {
  const network = DEFAULT_NETWORK;
  const contractConfig = useMemo(() => getContractConfig(network), [network]);
  const currentAccount = useCurrentAccount();
  const suiClient = useSuiClient();
  const { currentWallet } = useCurrentWallet();

  const signAndExecuteWithWallet = useCallback(
    async (
      transaction: Transaction,
      options?: {
        showEffects?: boolean;
        showEvents?: boolean;
      },
    ) => {
      if (!currentWallet) {
        throw new Error("No wallet connected");
      }
      if (!currentAccount) {
        throw new Error("No active account");
      }
      const feature =
        currentWallet.features["sui:signAndExecuteTransactionBlock"];
      if (!feature) {
        throw new Error("Connected wallet cannot execute transactions");
      }
      return feature.signAndExecuteTransactionBlock({
        transactionBlock: transaction,
        chain: `sui:${network}`,
        account: currentAccount,
        options,
      });
    },
    [currentWallet, currentAccount, network],
  );

  const {
    tokens: enabledTokens,
    isPending: isTokensLoading,
    error: tokensError,
  } = useEnabledTokens();

  const [selectedCoinType, setSelectedCoinType] = useState<string | null>(null);
  const [contributionAmount, setContributionAmount] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastUsdQuote, setLastUsdQuote] = useState<bigint | null>(null);
  const [quoteTimestamp, setQuoteTimestamp] = useState<number | null>(null);

  useEffect(() => {
    if (!selectedCoinType && enabledTokens.length > 0) {
      setSelectedCoinType(enabledTokens[0].coinType);
    }
  }, [enabledTokens, selectedCoinType]);

  const selectedToken: TokenRegistryEntry | null = useMemo(() => {
    if (!enabledTokens.length) {
      return null;
    }
    if (!selectedCoinType) {
      return enabledTokens[0];
    }
    return enabledTokens.find((token) => token.coinType === selectedCoinType) ??
      enabledTokens[0] ?? null;
  }, [enabledTokens, selectedCoinType]);

  const {
    profile,
    profileId,
    hasProfile,
    isLoading: isProfileLoading,
    error: profileError,
    refetch: refetchProfile,
  } = useProfile({
    ownerAddress: currentAccount?.address ?? null,
    enabled: Boolean(currentAccount?.address),
  });

  const {
    data: balanceData,
    isPending: isBalanceLoading,
    error: balanceError,
  } = useSuiClientQuery(
    "getBalance",
    {
      owner: currentAccount?.address ?? "",
      coinType: selectedToken?.coinType ?? "",
    },
    {
      enabled: Boolean(currentAccount?.address && selectedToken),
      refetchInterval: 10_000,
    },
  );

  const balanceRaw = useMemo(() => {
    if (!balanceData) {
      return null;
    }
    return BigInt(balanceData.totalBalance ?? "0");
  }, [balanceData]);

  const normalizedAccountAddress = useMemo(
    () => currentAccount?.address?.toLowerCase() ?? null,
    [currentAccount?.address],
  );

  const normalizedProfileOwner = useMemo(
    () => profile?.ownerAddress?.toLowerCase() ?? null,
    [profile?.ownerAddress],
  );

  const profileOwnershipMismatch = Boolean(
    hasProfile &&
      (!profileId ||
        !normalizedAccountAddress ||
        normalizedProfileOwner !== normalizedAccountAddress),
  );

  const parsedAmount = useMemo(() => {
    if (!selectedToken || !contributionAmount.trim()) {
      return null;
    }
    try {
      return parseCoinInputToRawAmount(
        contributionAmount,
        selectedToken.decimals,
      );
    } catch {
      return null;
    }
  }, [contributionAmount, selectedToken]);

  const insufficientBalance = Boolean(
    balanceRaw !== null &&
      parsedAmount !== null &&
      parsedAmount > balanceRaw,
  );

  const formattedRaised = formatUsdLocaleFromMicros(raisedUsdMicro);

  const formatDate = (timestampMs: number) => {
    if (!Number.isFinite(timestampMs) || timestampMs <= 0) {
      return null;
    }
    const formatter = new Intl.DateTimeFormat("en-US", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
    const parts = formatter.formatToParts(new Date(timestampMs));
    const partValue = (type: Intl.DateTimeFormatPartTypes) =>
      parts.find((part) => part.type === type)?.value ?? "";
    const day = partValue("day");
    const month = partValue("month");
    const year = partValue("year");
    if (!day || !month || !year) {
      return formatter.format(new Date(timestampMs));
    }
    return `${day} ${month} ${year}`;
  };

  const fundingPercentage =
    fundingGoalUsdMicro > 0n
      ? Number((raisedUsdMicro * 100n) / fundingGoalUsdMicro)
      : 0;

  const nowMs = Date.now();
  const hasValidStart = Number.isFinite(startDateMs) && startDateMs > 0;
  const hasValidEnd = Number.isFinite(endDateMs) && endDateMs > 0;
  const hasStarted = hasValidStart && startDateMs <= nowMs;
  const startDateLabel = hasValidStart ? formatDate(startDateMs) : null;
  const endDateLabel = hasValidEnd ? formatDate(endDateMs) : null;
  const campaignNotStarted = hasValidStart && startDateMs > nowMs;
  const campaignEnded = hasValidEnd && endDateMs < nowMs;

  const isSuiDonation = selectedToken?.coinType === SUI_TYPE_ARG;
  const donatingEntireSuiBalance = Boolean(
    isSuiDonation &&
      balanceRaw !== null &&
      parsedAmount !== null &&
      parsedAmount >= balanceRaw,
  );

  const formattedBalance = useMemo(() => {
    if (!selectedToken) {
      return "--";
    }
    if (!currentAccount) {
      return "Connect wallet";
    }
    if (isBalanceLoading) {
      return "Fetching…";
    }
    if (balanceRaw === null) {
      return "0";
    }
    return `${formatRawAmount(balanceRaw, selectedToken.decimals, 4)} ${selectedToken.symbol}`;
  }, [balanceRaw, currentAccount, isBalanceLoading, selectedToken]);

  const canDonate = Boolean(
    isActive &&
      statsId &&
      currentAccount?.address &&
      selectedToken &&
      parsedAmount &&
      !insufficientBalance &&
      !donatingEntireSuiBalance &&
      !isProfileLoading &&
      !isBalanceLoading &&
      !profileOwnershipMismatch &&
      !campaignNotStarted &&
      !campaignEnded &&
      (!hasProfile || profileId) &&
      !isProcessing,
  );

  const donationEventType = `${contractConfig.contracts.packageId}::donations::DonationReceived`;
  const badgeEventType = `${contractConfig.contracts.packageId}::badge_rewards::BadgeMinted`;

  async function handleDonate() {
    setValidationError(null);

    console.log("[donation] submit requested", {
      campaignId,
      statsId,
      isActive,
      startDateMs,
      endDateMs,
      selectedToken: selectedToken?.symbol,
      contributionAmount,
      hasProfile,
      profileId,
      profileOwnershipMismatch,
      balanceRaw: balanceRaw?.toString() ?? null,
    });

    if (!currentAccount?.address) {
      toast.error("Connect your wallet to donate.");
      return;
    }
    if (!isActive) {
      setValidationError("This campaign is not accepting donations right now.");
      return;
    }
    if (campaignNotStarted) {
      setValidationError(
        startDateLabel
          ? `Campaign accepts donations starting ${startDateLabel}.`
          : "Campaign has not opened for donations yet.",
      );
      return;
    }
    if (campaignEnded) {
      setValidationError(
        endDateLabel
          ? `Campaign ended on ${endDateLabel}.`
          : "Campaign funding window has closed.",
      );
      return;
    }
    if (!statsId) {
      toast.error("Campaign stats are still initializing. Please try again.");
      return;
    }
    if (!selectedToken) {
      toast.error("No donation tokens are currently available.");
      return;
    }
    if (!contributionAmount.trim()) {
      setValidationError("Enter an amount to donate.");
      return;
    }
    if (isBalanceLoading) {
      setValidationError("Fetching your wallet balance. Please try again in a moment.");
      return;
    }
    if (profileOwnershipMismatch) {
      setValidationError(
        "Connected wallet does not own the loaded donor profile. Refresh or reconnect your wallet.",
      );
      return;
    }

    let rawAmount: bigint;
    try {
      rawAmount = parseCoinInputToRawAmount(
        contributionAmount,
        selectedToken.decimals,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Invalid donation amount.";
      setValidationError(message);
      return;
    }

    if (balanceRaw !== null && rawAmount > balanceRaw) {
      const message = `Insufficient ${selectedToken.symbol} balance for this donation.`;
      setValidationError(message);
      return;
    }

    if (isSuiDonation && balanceRaw !== null && rawAmount >= balanceRaw) {
      setValidationError("Leave some SUI in your wallet to cover gas fees.");
      return;
    }

    if (isProfileLoading) {
      toast.info("Resolving your donor profile. Please try again in a moment.");
      return;
    }

    if (hasProfile && !profileId) {
      toast.error("Unable to load your donor profile. Refresh and try again.");
      return;
    }

    setIsProcessing(true);

    const donationFlow: DonationFlow = hasProfile && profileId ? "repeat" : "firstTime";
    const shouldRefreshProfile = donationFlow === "firstTime";
    let buildResult: DonationBuildResult;
    try {
      buildResult = donationFlow === "repeat"
        ? await buildRepeatDonationTx({
            suiClient,
            accountAddress: currentAccount.address,
            campaignId,
            statsId,
            token: selectedToken,
            rawAmount,
            network,
            slippageBps: DEFAULT_SLIPPAGE_BPS,
            profileId: profileId!,
          })
        : await buildFirstTimeDonationTx({
            suiClient,
            accountAddress: currentAccount.address,
            campaignId,
            statsId,
            token: selectedToken,
            rawAmount,
            network,
            slippageBps: DEFAULT_SLIPPAGE_BPS,
          });
    } catch (error) {
      const message = formatDonationError(error, {
        flow: donationFlow,
      });
      setValidationError(message);
      setIsProcessing(false);
      console.error("[donation] failed to build transaction", {
        error,
        donationFlow,
      });
      return;
    }

    console.log("[donation] transaction prepared", {
      flow: donationFlow,
      rawAmount: rawAmount.toString(),
      coinType: selectedToken.coinType,
      quotedUsdMicro: buildResult.quotedUsdMicro.toString(),
      expectedMinUsdMicro: buildResult.expectedMinUsdMicro.toString(),
    });

    setLastUsdQuote(buildResult.quotedUsdMicro);
    setQuoteTimestamp(buildResult.pricePublishTimeMs ?? Date.now());

    try {
      const response = await signAndExecuteWithWallet(
        buildResult.transaction,
        {
          showEffects: true,
          showEvents: true,
        },
      );

      console.log("[donation] transaction executed", {
        digest: response.digest,
        eventsCount: response.events?.length ?? 0,
      });

      const events = response.events ?? [];
      const donationEvent = events.find(
        (event) => event.type === donationEventType,
      );

      const mintedLevels = events
        .filter((event) => event.type === badgeEventType)
        .map((event) => {
          const levelRaw = (event.parsedJson as { level?: number | string })?.level;
          if (typeof levelRaw === "number" && Number.isFinite(levelRaw)) {
            return levelRaw;
          }
          if (typeof levelRaw === "string") {
            const parsedLevel = Number(levelRaw);
            return Number.isFinite(parsedLevel) ? parsedLevel : null;
          }
          return null;
        })
        .filter((level): level is number => level !== null);

      const amountUsdMicro = donationEvent
        ? parseBigIntField(
            (donationEvent.parsedJson as { amount_usd_micro?: string })
              ?.amount_usd_micro,
          )
        : null;

      const amountRawFromEvent = donationEvent
        ? parseBigIntField(
            (donationEvent.parsedJson as { amount_raw?: string })?.amount_raw,
          )
        : rawAmount;

      const amountHuman = selectedToken
        ? formatRawAmount(
            amountRawFromEvent ?? rawAmount,
            selectedToken.decimals,
            6,
          )
        : contributionAmount;

      const usdDisplay = amountUsdMicro
        ? `$${formatUsdLocaleFromMicros(amountUsdMicro)}`
        : null;

      const parts = [
        `Sent ${amountHuman} ${selectedToken.symbol}`,
        usdDisplay ? `≈ ${usdDisplay}` : null,
        mintedLevels.length
          ? `Earned badge level${mintedLevels.length > 1 ? "s" : ""} ${mintedLevels.join(", ")}`
          : null,
      ].filter(Boolean);

      toast.success("Donation submitted", {
        description: parts.join(" · "),
      });

      setContributionAmount("");
      setValidationError(null);

      if (shouldRefreshProfile) {
        try {
          await refetchProfile();
        } catch (profileRefreshError) {
          console.warn(
            "[donation] failed to refresh profile after first-time donation",
            profileRefreshError,
          );
        }
      }

      await onDonationComplete?.();
    } catch (error) {
      if (isUserRejectedError(error)) {
        toast.info("Transaction cancelled. No funds were sent.");
      } else {
        const message = formatDonationError(error, {
          flow: donationFlow,
        });
        toast.error(message);
        console.error("[donation] transaction execution failed", {
          error,
          donationFlow,
        });
      }
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="bg-white rounded-3xl p-10 flex flex-col gap-6 w-full shadow-[0px_0px_16px_0px_rgba(0,0,0,0.16)]">
      {/* Verification Badge */}
      <div className="flex items-start">
        <VerificationBadge isVerified={isVerified} />
      </div>

      {/* Timeline */}
      {(startDateLabel || endDateLabel) && (
        <div
          className={`flex flex-wrap items-center gap-4 ${
            hasStarted && endDateLabel ? "justify-between" : "justify-start"
          }`}
        >
          {startDateLabel && (
            <Badge
              variant="outline"
              className="flex items-center bg-black-50 border-transparent text-black-500 text-xs font-medium leading-[1.5] tracking-[0.18px] px-2 py-0.5 h-6 rounded-lg gap-1.5"
            >
              <Clock className="size-3" />
              {hasStarted
                ? `Started on ${startDateLabel}`
                : `Starts ${startDateLabel}`}
            </Badge>
          )}
          {hasStarted && endDateLabel && (
            <Badge
              variant="outline"
              className="flex items-center bg-black-50 border-transparent text-black-500 text-xs font-medium leading-[1.5] tracking-[0.18px] px-2 py-0.5 h-6 rounded-lg gap-1.5"
            >
              <Clock className="size-3" />
              {`Ends on ${endDateLabel}`}
            </Badge>
          )}
        </div>
      )}

      {/* Amount Raised */}
      <div className="flex flex-col gap-2">
        <h2 className="font-['Inter_Tight'] text-[40px] font-bold leading-[1.2] tracking-[0.4px] ">
          {`$${formattedRaised} raised`}
        </h2>
        <p className="text-xl  ">from {contributorsCount} contributors</p>
      </div>

      {/* Progress Bar */}
      <div className="flex flex-col gap-4 w-full">
        <div className="h-2.5 w-full bg-black-50 rounded-[10px] overflow-hidden relative">
          {fundingPercentage > 0 && (
            <div
              className="h-full bg-green-700 rounded-[10px] absolute top-0 left-0"
              style={{ width: `${Math.min(fundingPercentage, 100)}%` }}
            />
          )}
        </div>
        <div className="flex items-center justify-between text-xl ">
          <p className="font-semibold">
            Goal {formatUsdLocaleFromMicros(fundingGoalUsdMicro)}
          </p>
          <p>{fundingPercentage.toFixed(0)}% funded</p>
        </div>
      </div>

      {/* Recipient Address */}
      <div className="flex flex-col gap-2">
        <p className="text-sm  text-black-400">Recipient Address</p>
        <p className="text-base font-medium  break-all">{recipientAddress}</p>
      </div>

      <Separator className="bg-white-600" />

      {/* Contribution Form */}
      <div className="flex flex-col gap-4 w-full">
        <p className="text-base font-semibold ">Make your contribution</p>

        <div className="flex flex-col gap-2 w-full">
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 w-full">
              <input
                type="text"
                inputMode="decimal"
                value={contributionAmount}
                onChange={(e) => {
                  setContributionAmount(e.target.value);
                  setValidationError(null);
                }}
                placeholder="0.00"
                className="flex-1 h-[54px] bg-white border border-black-50 rounded-lg px-4 text-lg font-semibold  placeholder:text-black-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={
                  !isActive ||
                  !currentAccount?.address ||
                  !selectedToken ||
                  isProcessing
                }
              />
              <Select
                value={selectedToken?.coinType ?? ""}
                onValueChange={(value) => {
                  setSelectedCoinType(value);
                  setValidationError(null);
                }}
                disabled={
                  isTokensLoading ||
                  !enabledTokens.length ||
                  isProcessing
                }
              >
                <SelectTrigger className="w-40 h-[54px] bg-white border border-black-50 rounded-lg px-3 text-sm font-semibold text-foreground">
                  <SelectValue placeholder="Token" />
                </SelectTrigger>
                <SelectContent>
                  {enabledTokens.map((token) => (
                    <SelectItem key={token.coinType} value={token.coinType}>
                      {token.symbol} · {token.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-xs text-black-400">
              <span>Balance:</span>
              <span className="font-semibold">{formattedBalance}</span>
            </div>
            {validationError && (
              <p className="text-xs text-red-600">{validationError}</p>
            )}
            {profileOwnershipMismatch && (
              <p className="text-xs text-red-600">
                Connected wallet does not own the loaded donor profile. Refresh
                or reconnect your wallet.
              </p>
            )}
            {campaignNotStarted && startDateLabel && (
              <p className="text-xs text-orange-600">
                Campaign accepts donations starting {startDateLabel}.
              </p>
            )}
            {campaignEnded && endDateLabel && (
              <p className="text-xs text-orange-600">
                Campaign ended on {endDateLabel}. Donations are closed.
              </p>
            )}
            {insufficientBalance && selectedToken && (
              <p className="text-xs text-orange-600">
                Insufficient {selectedToken.symbol} balance.
              </p>
            )}
            {donatingEntireSuiBalance && (
              <p className="text-xs text-orange-600">
                Leave a small amount of SUI in your wallet to cover gas fees.
              </p>
            )}
            {balanceError && (
              <p className="text-xs text-orange-600">
                Failed to load balance. {balanceError.message}
              </p>
            )}
            {tokensError && (
              <p className="text-xs text-orange-600">
                Unable to load donation tokens. {tokensError.message}
              </p>
            )}
            {profileError && (
              <p className="text-xs text-orange-600">
                {profileError.message}
              </p>
            )}
            {lastUsdQuote !== null && (
              <p className="text-xs text-black-400">
                Last quoted value: ≈ ${
                  formatUsdLocaleFromMicros(lastUsdQuote)
                }
                {quoteTimestamp
                  ? ` (as of ${new Date(quoteTimestamp).toLocaleTimeString()})`
                  : ""}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col gap-4 w-full">
        <Button
          className="w-full h-10 bg-primary text-primary-foreground  text-sm font-medium tracking-[0.07px] rounded-lg hover:bg-primary/90 disabled:opacity-50"
          disabled={!canDonate}
          onClick={handleDonate}
        >
          {isProcessing ? (
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" />
              Processing...
            </span>
          ) : (
            "Contribute Now"
          )}
        </Button>
        {!currentAccount?.address && (
          <p className="text-xs text-center text-black-400">
            Connect your wallet to donate.
          </p>
        )}
        {!isActive && (
          <p className="text-xs text-center text-black-400">
            Campaign is not accepting donations right now.
          </p>
        )}
        {!enabledTokens.length && !isTokensLoading && (
          <p className="text-xs text-center text-black-400">
            No donation tokens are enabled yet.
          </p>
        )}
        <Button
          variant="secondary"
          className="w-full h-10 bg-blue-50 text-blue-500  text-sm font-medium tracking-[0.07px] rounded-lg hover:bg-[#e0d9ff] gap-2"
        >
          Share
          <Share2 className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}

function parseBigIntField(value?: string | number | null): bigint | null {
  if (typeof value === "string" && value.length > 0) {
    try {
      return BigInt(value);
    } catch {
      return null;
    }
  }
  if (typeof value === "number" && Number.isFinite(value)) {
    return BigInt(Math.floor(value));
  }
  return null;
}

type DonationFlow = "firstTime" | "repeat";

const DONATION_ABORT_MESSAGES: Record<number, string> = {
  1: "Campaign is not active right now. Please refresh and try again.",
  2: "Campaign is outside its donation window.",
  3: "This token is not enabled for donations.",
  4: "Donation amount must be greater than zero.",
  5: "Selected coin type is not registered for this campaign.",
  6: "Donation routing failed. Refresh and try again.",
  7: "Price moved too much during checkout. Increase the allowed slippage and retry.",
  8: "Campaign totals desynced. Refresh the page and try again.",
};

function formatDonationError(
  error: unknown,
  options: { flow: DonationFlow },
): string {
  const fallback =
    error instanceof Error ? error.message : "Donation failed. Please try again.";
  const abortCode = extractAbortCode(fallback);

  if (abortCode !== null) {
    if (options.flow === "firstTime" && abortCode === 6) {
      return "A donor profile already exists for this wallet. Refresh and donate again so we can route you through the repeat-donor flow.";
    }
    return DONATION_ABORT_MESSAGES[abortCode] ?? fallback;
  }

  return fallback;
}

function extractAbortCode(message: string): number | null {
  const match = message.match(/abort_code\s+([0-9a-fx]+)/i);
  if (!match) {
    return null;
  }

  const raw = match[1];
  if (raw.startsWith("0x")) {
    return Number.parseInt(raw, 16);
  }

  const parsed = Number(raw);
  return Number.isNaN(parsed) ? null : parsed;
}
