import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AlertCircle, ExternalLink } from "lucide-react";
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
import {
  fetchProfileDonationsPage,
  profileDonationsPageQueryKey,
  useProfileDonationsPage,
} from "@/hooks/indexer/useProfileDonationsPage";
import { useEnabledTokens } from "@/features/tokens/hooks";
import {
  formatContributionDate,
  formatTokenAmount,
  resolveTokenInfo,
} from "@/features/donations/utils";
import { getPaginationItems } from "@/shared/lib/pagination";
import { cn } from "@/shared/lib/utils";
import { formatUsdLocaleFromMicros } from "@/shared/utils/currency";
import { buildExplorerTxUrl } from "@/shared/utils/explorer";
import { canonicalizeCoinType } from "@/shared/utils/sui";
import { buildCampaignDetailPath } from "@/shared/utils/routes";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";

interface ProfileDonationsTableProps {
  ownerAddress: string;
  campaignDomain?: string | null;
  title?: string;
}

const PAGE_SIZE = 10;

export function ProfileDonationsTable({
  ownerAddress,
  campaignDomain,
  title = "Contributions",
}: ProfileDonationsTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const queryClient = useQueryClient();

  useEffect(() => {
    setCurrentPage(1);
  }, [ownerAddress]);

  const {
    tokens: enabledTokens,
    isPending: tokensPending,
    error: tokensError,
  } = useEnabledTokens({ enabled: Boolean(ownerAddress) });

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
  } = useProfileDonationsPage(ownerAddress, {
    page: currentPage,
    pageSize: PAGE_SIZE,
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
    if (!ownerAddress || totalPages <= 1) return;

    const nextPage = currentPage + 1;
    const prevPage = currentPage - 1;

    if (nextPage <= totalPages) {
      void queryClient.prefetchQuery({
        queryKey: profileDonationsPageQueryKey(
          ownerAddress,
          nextPage,
          PAGE_SIZE,
        ),
        queryFn: () =>
          fetchProfileDonationsPage(ownerAddress, nextPage, PAGE_SIZE),
        staleTime: 30_000,
      });
    }

    if (prevPage >= 1) {
      void queryClient.prefetchQuery({
        queryKey: profileDonationsPageQueryKey(
          ownerAddress,
          prevPage,
          PAGE_SIZE,
        ),
        queryFn: () =>
          fetchProfileDonationsPage(ownerAddress, prevPage, PAGE_SIZE),
        staleTime: 30_000,
      });
    }
  }, [queryClient, ownerAddress, currentPage, totalPages]);

  const currentPageData = data?.data ?? [];

  const isLoadingPage =
    donationsPending ||
    tokensPending ||
    (donationsFetching && donationsPlaceholder && currentPageData.length === 0);

  const showEmptyState =
    !isLoadingPage && !donationsError && currentPageData.length === 0;

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

  function renderRows() {
    if (isLoadingPage) {
      return Array.from({ length: PAGE_SIZE }).map((_, index) => (
        <TableRow
          key={`skeleton-${index}`}
          className="border-b border-white-600 last:border-b-0 hover:bg-transparent"
        >
          <TableCell className="px-4 py-4">
            <Skeleton className="h-5 w-32" />
          </TableCell>
          <TableCell className="px-4 py-4">
            <Skeleton className="h-5 w-48" />
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
        </TableRow>
      ));
    }

    if (donationsError) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={5} className="px-4 py-6">
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
          <TableCell colSpan={5} className="px-4 py-6">
            <p className="text-sm text-black-300">
              No contributions yet.
            </p>
          </TableCell>
        </TableRow>
      );
    }

    return currentPageData.map((contribution) => {
      const tokenInfo = resolveTokenInfo(contribution, tokenRegistry);
      const Icon = tokenInfo.Icon;
      const amountRaw = BigInt(contribution.amountRaw ?? 0);
      const amountDisplay = `${formatTokenAmount(amountRaw, tokenInfo.decimals)} ${tokenInfo.label}`;
      const totalUsd = BigInt(contribution.amountUsdMicro ?? 0);
      const explorerUrl = buildExplorerTxUrl(
        contribution.txDigest,
        DEFAULT_NETWORK,
      );

      const campaignPath = buildCampaignDetailPath(contribution.campaignId, {
        subdomainName: contribution.campaignSubdomainName,
        campaignDomain: campaignDomain ?? undefined,
      });

      return (
        <TableRow
          key={`${contribution.txDigest}-${contribution.id}`}
          className="border-b border-white-600 last:border-b-0 hover:bg-transparent"
        >
          <TableCell className="px-4 py-4 text-black-500">
            {formatContributionDate(contribution.timestampMs)}
          </TableCell>
          <TableCell className="px-4 py-4 text-black-500">
            <Link
              to={campaignPath}
              className="text-black-500 underline-offset-4 hover:underline max-w-[260px] truncate align-middle inline-block"
              title={contribution.campaignName}
            >
              {contribution.campaignName}
            </Link>
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
          <TableCell className="px-4 py-4 text-black-500 font-medium">
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
        </TableRow>
      );
    });
  }

  const canGoPrev = currentPage > 1;
  const canGoNext = totalPages > 0 && currentPage < totalPages;

  return (
    <div className="flex flex-col gap-4 sm:gap-6">
      <div>
        <h3 className="text-2xl sm:text-[26px] font-bold leading-tight text-black-500">
          {title}
        </h3>
        {errorMessage &&
          !donationsError &&
          !donationsPending &&
          !tokensPending && (
            <p className="text-sm text-red-600">{errorMessage}</p>
          )}
      </div>

      <div className="overflow-hidden bg-white-50">
        <Table className="min-w-[760px] text-base text-black-500">
          <TableHeader className="bg-white-400">
            <TableRow className="hover:bg-transparent border-white">
              <TableHead className="px-4 py-3 text-left text-black-500 font-medium ">
                Paid at
              </TableHead>
              <TableHead className="px-4 py-3 text-left text-black-500 font-medium">
                Campaign
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
            </TableRow>
          </TableHeader>
          <TableBody>{renderRows()}</TableBody>
        </Table>
      </div>

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
