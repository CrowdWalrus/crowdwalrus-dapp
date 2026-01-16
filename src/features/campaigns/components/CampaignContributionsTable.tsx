import { useEffect, useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  AlertTriangleIcon,
  Clock,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/shared/components/ui/pagination";
import { Skeleton } from "@/shared/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/table";
import { cn } from "@/shared/lib/utils";
import { formatUsdLocaleFromMicros } from "@/shared/utils/currency";
import { buildExplorerTxUrl } from "@/shared/utils/explorer";
import { canonicalizeCoinType } from "@/shared/utils/sui";
import { getPaginationItems } from "@/shared/lib/pagination";
import {
  formatContributionDate,
  formatTokenAmount,
  resolveTokenInfo,
} from "@/features/donations/utils";
import {
  fetchCampaignDonationsPage,
  campaignDonationsPageQueryKey,
  useCampaignDonationsPage,
} from "@/hooks/indexer/useCampaignDonationsPage";
import { useEnabledTokens } from "@/features/tokens/hooks";
import { DEFAULT_NETWORK, useNetworkVariable } from "@/shared/config/networkConfig";
import { resolveProfileLink } from "@/shared/utils/profile";
import type { PendingCampaignDonation } from "../types/donation";

interface CampaignContributionsTableProps {
  campaignId: string;
  pendingDonation?: PendingCampaignDonation | null;
  onPendingResolved?: () => void;
}

const PAGE_SIZE = 10;
const PENDING_TIMEOUT_MS = 2 * 60_000;
const PENDING_REFETCH_MS = 5000;
const PENDING_STALE_REFETCH_MS = 30_000;

function formatContributor(address: string): string {
  if (!address) return "—";
  const value = address.trim();
  if (value.length <= 10) return value;
  return `${value.slice(0, 5)}...${value.slice(-4)}`;
}

function ContributorNameCell({
  address,
  subdomainName,
  campaignDomain,
}: {
  address: string;
  subdomainName?: string | null;
  campaignDomain?: string | null;
}) {
  const trimmed = address.trim();
  const hasAddress = trimmed.length >= 10 && trimmed.startsWith("0x");
  const { handle, profilePath } = resolveProfileLink({
    address: hasAddress ? trimmed : null,
    subdomainName,
    campaignDomain: campaignDomain ?? null,
  });
  const label = handle ?? formatContributor(trimmed);

  if (!profilePath) {
    return <span>{label}</span>;
  }

  return (
    <Link
      to={profilePath}
      className="underline-offset-2 hover:text-black-500 hover:underline"
    >
      {label}
    </Link>
  );
}

export function CampaignContributionsTable({
  campaignId,
  pendingDonation,
  onPendingResolved,
}: CampaignContributionsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();
  const pendingResolvedRef = useRef(false);
  const campaignDomain = useNetworkVariable("campaignDomain") as
    | string
    | undefined;

  useEffect(() => {
    setCurrentPage(1);
  }, [campaignId]);

  useEffect(() => {
    if (pendingDonation) {
      setCurrentPage(1);
    }
  }, [pendingDonation]);

  useEffect(() => {
    pendingResolvedRef.current = false;
  }, [pendingDonation?.txDigest]);

  const [isPendingStale, setIsPendingStale] = useState(false);

  useEffect(() => {
    if (!pendingDonation) {
      setIsPendingStale(false);
      return;
    }

    const elapsedMs = Math.max(
      0,
      Date.now() - pendingDonation.timestampMs,
    );
    if (elapsedMs >= PENDING_TIMEOUT_MS) {
      setIsPendingStale(true);
      return;
    }

    setIsPendingStale(false);
    const timeoutId = window.setTimeout(
      () => setIsPendingStale(true),
      PENDING_TIMEOUT_MS - elapsedMs,
    );

    return () => window.clearTimeout(timeoutId);
  }, [pendingDonation]);

  const {
    tokens: enabledTokens,
    isPending: tokensPending,
    error: tokensError,
  } = useEnabledTokens({ enabled: Boolean(campaignId) });

  const tokenRegistry = useMemo(
    () =>
      new Map(
        (enabledTokens ?? []).map((token) => [
          canonicalizeCoinType(token.coinType),
          token,
        ]),
      ),
    [enabledTokens],
  );

  const {
    data,
    isPending: donationsPending,
    isFetching: donationsFetching,
    isPlaceholderData: donationsPlaceholder,
    error: donationsError,
    refetch,
  } = useCampaignDonationsPage(campaignId, {
    page: currentPage,
    pageSize: PAGE_SIZE,
    refetchIntervalMs: pendingDonation
      ? isPendingStale
        ? PENDING_STALE_REFETCH_MS
        : PENDING_REFETCH_MS
      : false,
  });

  const totalCount = data?.totalCount ?? 0;
  const totalPages = totalCount > 0 ? Math.ceil(totalCount / PAGE_SIZE) : 0;
  const paginationItems = useMemo(
    () =>
      getPaginationItems({
        currentPage,
        totalPages,
      }),
    [currentPage, totalPages],
  );

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    if (!campaignId || totalPages <= 1) return;

    const nextPage = currentPage + 1;
    const prevPage = currentPage - 1;

    if (nextPage <= totalPages) {
      void queryClient.prefetchQuery({
        queryKey: campaignDonationsPageQueryKey(
          campaignId,
          nextPage,
          PAGE_SIZE,
        ),
        queryFn: () =>
          fetchCampaignDonationsPage(campaignId, nextPage, PAGE_SIZE),
        staleTime: 30_000,
      });
    }

    if (prevPage >= 1) {
      void queryClient.prefetchQuery({
        queryKey: campaignDonationsPageQueryKey(
          campaignId,
          prevPage,
          PAGE_SIZE,
        ),
        queryFn: () =>
          fetchCampaignDonationsPage(campaignId, prevPage, PAGE_SIZE),
        staleTime: 30_000,
      });
    }
  }, [queryClient, campaignId, currentPage, totalPages]);

  const currentPageData = data?.data ?? [];

  const pendingInData = useMemo(() => {
    if (!pendingDonation || currentPage !== 1) return false;
    return currentPageData.some(
      (donation) => donation.txDigest === pendingDonation.txDigest,
    );
  }, [currentPage, currentPageData, pendingDonation]);

  useEffect(() => {
    if (pendingDonation && pendingInData) {
      onPendingResolved?.();
    }
  }, [pendingDonation, pendingInData, onPendingResolved]);

  useEffect(() => {
    if (!pendingDonation || !campaignId || currentPage === 1) {
      return;
    }

    const pollInterval = isPendingStale
      ? PENDING_STALE_REFETCH_MS
      : PENDING_REFETCH_MS;
    let active = true;

    const checkPageOne = async () => {
      if (!active || pendingResolvedRef.current) {
        return;
      }

      try {
        const result = await queryClient.fetchQuery({
          queryKey: campaignDonationsPageQueryKey(
            campaignId,
            1,
            PAGE_SIZE,
          ),
          queryFn: () =>
            fetchCampaignDonationsPage(campaignId, 1, PAGE_SIZE),
          staleTime: 0,
        });

        if (!active || pendingResolvedRef.current) {
          return;
        }

        const found = result.data?.some(
          (donation) => donation.txDigest === pendingDonation.txDigest,
        );
        if (found) {
          pendingResolvedRef.current = true;
          onPendingResolved?.();
        }
      } catch (error) {
        console.warn(
          "[CampaignContributionsTable] Failed to refresh page 1 while pending",
          error,
        );
      }
    };

    void checkPageOne();
    const intervalId = window.setInterval(checkPageOne, pollInterval);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [
    campaignId,
    currentPage,
    isPendingStale,
    onPendingResolved,
    pendingDonation,
    queryClient,
  ]);

  const showPendingRow =
    Boolean(pendingDonation) && currentPage === 1 && !pendingInData;

  const isLoadingPage =
    donationsPending ||
    tokensPending ||
    (donationsFetching && donationsPlaceholder && currentPageData.length === 0);

  const showEmptyState =
    !isLoadingPage &&
    !donationsError &&
    currentPageData.length === 0 &&
    !showPendingRow;

  const errorMessage =
    donationsError?.message ??
    (tokensError instanceof Error ? tokensError.message : null);

  function handleSelectPage(targetPage: number) {
    if (
      targetPage < 1 ||
      targetPage === currentPage ||
      (totalPages > 0 && targetPage > totalPages)
    ) {
      return;
    }

    setCurrentPage(targetPage);
  }

  function renderPendingRow() {
    if (!showPendingRow || !pendingDonation) {
      return null;
    }

    const tokenInfo = resolveTokenInfo(pendingDonation, tokenRegistry);
    const Icon = tokenInfo.Icon;
    const amountRaw = pendingDonation.amountRaw;
    const amountDisplay = `${formatTokenAmount(amountRaw, tokenInfo.decimals)} ${tokenInfo.label}`;

    const totalUsd = pendingDonation.amountUsdMicro;
    const platformBps = pendingDonation.platformBps ?? 0;
    const platformUsd =
      totalUsd !== null
        ? (totalUsd * BigInt(platformBps)) / 10000n
        : null;
    const netUsd =
      totalUsd !== null && platformUsd !== null ? totalUsd - platformUsd : null;
    const netUsdSafe = netUsd !== null && netUsd >= 0n ? netUsd : 0n;
    const explorerUrl = buildExplorerTxUrl(
      pendingDonation.txDigest,
      DEFAULT_NETWORK,
    );

    return (
      <TableRow className="border-b border-white-600 last:border-b-0 bg-white-100/60 hover:bg-transparent">
        <TableCell className="px-4 py-4 text-black-500">
          <div className="flex items-center gap-2">
            {isPendingStale ? (
              <AlertTriangleIcon
                className="h-4 w-4 text-orange-500"
                aria-label="Pending contribution delayed"
              />
            ) : (
              <Clock
                className="h-4 w-4 animate-pulse text-black-300"
                aria-label="Pending contribution"
              />
            )}
            <span>{formatContributionDate(pendingDonation.timestampMs)}</span>
          </div>
        </TableCell>
        <TableCell className="px-4 py-4 text-black-500">
          <ContributorNameCell
            address={pendingDonation.donor}
            campaignDomain={campaignDomain ?? null}
          />
        </TableCell>
        <TableCell className="px-4 py-4 text-black-500">
          <div className="flex items-center gap-2">
            {Icon ? (
              <Icon className="h-6 w-6" aria-hidden />
            ) : (
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white-400 text-xs font-semibold text-black-400">
                {tokenInfo.label.slice(0, 1).toUpperCase()}
              </span>
            )}
            <span className="whitespace-nowrap">{tokenInfo.label}</span>
          </div>
        </TableCell>
        <TableCell className="px-4 py-4 text-black-500">
          {amountDisplay}
        </TableCell>
        <TableCell className="px-4 py-4 text-black-500">
          <div className="flex items-center gap-2">
            {totalUsd !== null ? (
              <span>${formatUsdLocaleFromMicros(totalUsd)}</span>
            ) : isPendingStale ? (
              <AlertTriangleIcon
                className="h-4 w-4 text-orange-500"
                aria-label="Pending value delayed"
              />
            ) : (
              <Loader2
                className="h-4 w-4 animate-spin text-black-300"
                aria-label="Pending value"
              />
            )}
            {explorerUrl ? (
              <a
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-primary hover:text-primary/80"
                aria-label="View transaction in explorer"
                title="View transaction in explorer"
              >
                <ExternalLink className="h-4 w-4" aria-hidden="true" />
              </a>
            ) : null}
          </div>
        </TableCell>
        <TableCell className="px-4 py-4 text-black-500 font-medium">
          {totalUsd !== null ? (
            `$${formatUsdLocaleFromMicros(netUsdSafe)}`
          ) : isPendingStale ? (
            <AlertTriangleIcon
              className="h-4 w-4 text-orange-500"
              aria-label="Pending value delayed"
            />
          ) : (
            <Loader2
              className="h-4 w-4 animate-spin text-black-300"
              aria-label="Pending value"
            />
          )}
        </TableCell>
      </TableRow>
    );
  }

  function renderRows() {
    if (isLoadingPage) {
      const skeletonRows = Array.from({ length: PAGE_SIZE }).map((_, index) => (
        <TableRow
          key={`skeleton-${index}`}
          className="border-b border-white-600 last:border-b-0 hover:bg-transparent"
        >
          <TableCell className="px-4 py-4">
            <Skeleton className="h-5 w-32" />
          </TableCell>
          <TableCell className="px-4 py-4">
            <Skeleton className="h-5 w-36" />
          </TableCell>
          <TableCell className="px-4 py-4">
            <div className="flex items-center gap-2">
              <Skeleton className="h-6 w-6 rounded-full" />
              <Skeleton className="h-5 w-14" />
            </div>
          </TableCell>
          <TableCell className="px-4 py-4">
            <Skeleton className="h-5 w-24" />
          </TableCell>
          <TableCell className="px-4 py-4">
            <Skeleton className="h-5 w-24" />
          </TableCell>
          <TableCell className="px-4 py-4">
            <Skeleton className="h-5 w-24" />
          </TableCell>
        </TableRow>
      ));

      return (
        <>
          {renderPendingRow()}
          {skeletonRows}
        </>
      );
    }

    if (donationsError) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={6} className="px-4 py-6">
            <div className="flex w-full items-center justify-center gap-3 text-sm text-red-600">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <div className="flex flex-col gap-1">
                <span>Unable to load contributions.</span>
                <button
                  type="button"
                  onClick={() => refetch()}
                  className="text-black-500 underline-offset-4 hover:underline"
                >
                  Retry
                </button>
              </div>
            </div>
          </TableCell>
        </TableRow>
      );
    }

    if (showEmptyState) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={6} className="px-4 py-6">
            <p className="text-sm text-black-300">
              No contributions yet. Be the first to support this campaign.
            </p>
          </TableCell>
        </TableRow>
      );
    }

    return (
      <>
        {renderPendingRow()}
        {currentPageData.map((donation) => {
          const tokenInfo = resolveTokenInfo(donation, tokenRegistry);
          const Icon = tokenInfo.Icon;
          const amountRaw = BigInt(donation.amountRaw ?? 0);
          const amountDisplay = `${formatTokenAmount(amountRaw, tokenInfo.decimals)} ${tokenInfo.label}`;

          const totalUsd = BigInt(donation.amountUsdMicro ?? 0);
          const platformUsd = BigInt(donation.platformAmountUsdMicro ?? 0);
          const recipientUsd =
            donation.recipientAmountUsdMicro !== undefined
              ? BigInt(donation.recipientAmountUsdMicro)
              : totalUsd - platformUsd;
          const netUsd = recipientUsd < 0 ? 0n : recipientUsd;
          const explorerUrl = buildExplorerTxUrl(
            donation.txDigest,
            DEFAULT_NETWORK,
          );

          return (
            <TableRow
              key={`${donation.txDigest}-${donation.id}`}
              className="border-b border-white-600 last:border-b-0 hover:bg-transparent"
            >
              <TableCell className="px-4 py-4 text-black-500">
                {formatContributionDate(donation.timestampMs)}
              </TableCell>
              <TableCell className="px-4 py-4 text-black-500">
                <ContributorNameCell
                  address={donation.donor}
                  subdomainName={donation.donorProfileSubdomainName}
                  campaignDomain={campaignDomain ?? null}
                />
              </TableCell>
              <TableCell className="px-4 py-4 text-black-500">
                <div className="flex items-center gap-2">
                  {Icon ? (
                    <Icon className="h-6 w-6" aria-hidden />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white-400 text-xs font-semibold text-black-400">
                      {tokenInfo.label.slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  <span className="whitespace-nowrap">{tokenInfo.label}</span>
                </div>
              </TableCell>
              <TableCell className="px-4 py-4 text-black-500">
                {amountDisplay}
              </TableCell>
              <TableCell className="px-4 py-4 text-black-500">
                <div className="flex items-center gap-2">
                  <span>${formatUsdLocaleFromMicros(totalUsd)}</span>
                  {explorerUrl ? (
                    <a
                      href={explorerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-primary hover:text-primary/80"
                      aria-label="View transaction in explorer"
                      title="View transaction in explorer"
                    >
                      <ExternalLink className="h-4 w-4" aria-hidden="true" />
                    </a>
                  ) : null}
                </div>
              </TableCell>
              <TableCell className="px-4 py-4 text-black-500 font-medium">
                ${formatUsdLocaleFromMicros(netUsd)}
              </TableCell>
            </TableRow>
          );
        })}
      </>
    );
  }

  const canGoPrev = currentPage > 1;
  const canGoNext = totalPages > 0 && currentPage < totalPages;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div>
        <div className="flex items-center gap-2">
          <h3 className="text-2xl sm:text-[26px] font-bold leading-tight text-black-500">
            Contributors
          </h3>
          {showPendingRow &&
            (isPendingStale ? (
              <AlertTriangleIcon
                className="h-4 w-4 text-orange-500"
                aria-label="Pending contribution delayed"
              />
            ) : (
              <Loader2
                className="h-4 w-4 animate-spin text-black-300"
                aria-label="Syncing contributions"
              />
            ))}
        </div>
        {errorMessage &&
          !donationsError &&
          !donationsPending &&
          !tokensPending && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
      </div>

      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white-200 rounded-lg">
          <p className="text-lg font-medium text-black-400">
            No contributions yet
          </p>
          <p className="mt-1 text-sm text-black-300">
            Be the first to support this campaign.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden bg-white-50">
          <Table className="min-w-[760px] text-base text-black-500">
            <TableHeader className="bg-white-400">
              <TableRow className="hover:bg-transparent border-white">
                <TableHead className="px-4 py-3 text-left text-black-500 font-medium ">
                  Paid at
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-black-500 font-medium">
                  Contributor
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-black-500 font-medium">
                  Token
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-black-500 font-medium">
                  Amount
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-black-500 font-medium">
                  USD Value
                </TableHead>
                <TableHead className="px-4 py-3 text-left text-black-500 font-medium">
                  Net USD Value
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>{renderRows()}</TableBody>
          </Table>
        </div>
      )}

      {totalPages > 1 && (
        <Pagination className="pt-2">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                className={cn(
                  "gap-1 pl-2.5",
                  !canGoPrev && "pointer-events-none opacity-50",
                )}
                onClick={(event) => {
                  event.preventDefault();
                  if (canGoPrev) {
                    void handleSelectPage(currentPage - 1);
                  }
                }}
              />
            </PaginationItem>
            {paginationItems.map((item, index) =>
              item === "ellipsis" ? (
                <PaginationItem key={`ellipsis-${index}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={item}>
                  <PaginationLink
                    href="#"
                    isActive={item === currentPage}
                    onClick={(event) => {
                      event.preventDefault();
                      void handleSelectPage(item);
                    }}
                  >
                    {item}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}
            <PaginationItem>
              <PaginationNext
                href="#"
                className={cn(
                  "gap-1 pr-2.5",
                  !canGoNext && "pointer-events-none opacity-50",
                )}
                onClick={(event) => {
                  event.preventDefault();
                  if (canGoNext) {
                    void handleSelectPage(currentPage + 1);
                  }
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
