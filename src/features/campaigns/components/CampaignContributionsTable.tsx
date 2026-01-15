import { useEffect, useMemo, useState } from "react";
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
import {
  formatContributionDate,
  formatTokenAmount,
  resolveTokenInfo,
} from "@/features/donations/utils";
import { useCampaignDonations } from "@/hooks/indexer/useCampaignDonations";
import { useEnabledTokens } from "@/features/tokens/hooks";
import { useProfileHandle } from "@/features/profiles/hooks/useProfileHandle";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
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

function ContributorNameCell({ address }: { address: string }) {
  const trimmed = address.trim();
  const hasAddress = trimmed.length >= 10 && trimmed.startsWith("0x");
  const { handle, profilePath } = useProfileHandle(hasAddress ? trimmed : null);
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

  useEffect(() => {
    setCurrentPage(1);
  }, [campaignId]);

  useEffect(() => {
    if (pendingDonation) {
      setCurrentPage(1);
    }
  }, [pendingDonation]);

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
    isFetchingNextPage,
    fetchNextPage,
    hasNextPage,
    error: donationsError,
    refetch,
  } = useCampaignDonations(campaignId, {
    pageSize: PAGE_SIZE,
    refetchIntervalMs: pendingDonation
      ? isPendingStale
        ? PENDING_STALE_REFETCH_MS
        : PENDING_REFETCH_MS
      : false,
  });

  const pages = useMemo(() => data?.pages ?? [], [data?.pages]);
  const lastPage = pages.length > 0 ? pages[pages.length - 1] : undefined;
  const lastLoadedPage = lastPage?.page ?? 1;
  const pageNumbers = useMemo(() => {
    const count = lastLoadedPage + (lastPage?.hasMore ? 1 : 0);
    return Array.from({ length: Math.max(count, 1) }, (_, index) => index + 1);
  }, [lastLoadedPage, lastPage?.hasMore]);

  const currentPageData =
    pages.find((page) => page.page === currentPage)?.data ?? [];

  const pendingInData = useMemo(() => {
    if (!pendingDonation) return false;
    return pages.some((page) =>
      page.data.some((donation) => donation.txDigest === pendingDonation.txDigest),
    );
  }, [pages, pendingDonation]);

  useEffect(() => {
    if (pendingDonation && pendingInData) {
      onPendingResolved?.();
    }
  }, [pendingDonation, pendingInData, onPendingResolved]);

  const showPendingRow =
    Boolean(pendingDonation) && currentPage === 1 && !pendingInData;

  const isLoadingPage =
    donationsPending ||
    tokensPending ||
    (currentPageData.length === 0 &&
      (isFetchingNextPage || (hasNextPage && currentPage > lastLoadedPage)));

  const showEmptyState =
    !isLoadingPage &&
    !donationsError &&
    currentPageData.length === 0 &&
    !showPendingRow;

  const errorMessage =
    donationsError?.message ??
    (tokensError instanceof Error ? tokensError.message : null);

  async function handleSelectPage(targetPage: number) {
    if (targetPage < 1 || targetPage === currentPage) return;

    const needsFetch =
      targetPage > lastLoadedPage && hasNextPage && !isFetchingNextPage;

    if (needsFetch) {
      try {
        await fetchNextPage();
      } catch {
        return;
      }
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
          <ContributorNameCell address={pendingDonation.donor} />
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
                <ContributorNameCell address={donation.donor} />
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
  const canGoNext =
    (hasNextPage ?? false) ||
    currentPage < lastLoadedPage ||
    isFetchingNextPage;

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

      {(pageNumbers.length > 1 || (lastPage?.hasMore ?? false)) && (
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
            {pageNumbers.map((pageNumber) => (
              <PaginationItem key={pageNumber}>
                <PaginationLink
                  href="#"
                  isActive={pageNumber === currentPage}
                  onClick={(event) => {
                    event.preventDefault();
                    void handleSelectPage(pageNumber);
                  }}
                >
                  {pageNumber}
                </PaginationLink>
              </PaginationItem>
            ))}
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
