import type { ComponentType } from "react";
import { ReceiptText } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { cn } from "@/shared/lib/utils";

const SUCCESS_ICON = "/assets/images/modal-icons/modal-donation-success.png";

export interface DonationReceiptSummary {
  amountDisplay: string;
  tokenSymbol: string;
  tokenLabel: string;
  approxUsdDisplay?: string | null;
  explorerUrl?: string | null;
  transactionDigest: string;
  TokenIcon?: ComponentType<{ className?: string }> | null;
}

interface DonationSuccessModalProps {
  open: boolean;
  receipt: DonationReceiptSummary | null;
  onClose: () => void;
  onViewContributions?: () => void;
}

export function DonationSuccessModal({
  open,
  receipt,
  onClose,
  onViewContributions,
}: DonationSuccessModalProps) {
  const canViewContributions = Boolean(onViewContributions);
  const netAmount = receipt?.amountDisplay ?? "--";
  const tokenSymbol = receipt?.tokenSymbol ?? "";

  const approxUsd = receipt?.approxUsdDisplay ?? null;
  const TokenIcon = receipt?.TokenIcon ?? null;
  const explorerHref = receipt?.explorerUrl ?? null;

  return (
    <Dialog
      open={open}
      onOpenChange={(state) => (!state ? onClose() : undefined)}
    >
      <DialogContent className="max-w-lg px-10 py-12 rounded-2xl bg-white [&>button]:hidden">
        <div className="flex flex-col items-center text-center gap-6">
          <div className="size-[120px]">
            <img
              src={SUCCESS_ICON}
              alt="Donation success"
              className="size-full object-contain"
            />
          </div>

          <div className="flex flex-col gap-4 w-full">
            <div className="flex flex-col gap-2">
              <DialogTitle className="text-2xl font-semibold text-black-500">
                Payment received 🙏🏻
              </DialogTitle>
            </div>

            <div className="flex flex-col gap-3 rounded-2xl bg-[#f7f7f7] px-6 py-4">
              <div className="flex flex-wrap items-center justify-center gap-3">
                <p className="text-base pr-3 font-medium text-black-400">
                  Net Amount
                </p>
                <div className="flex flex-wrap items-center gap-1 text-xl font-semibold text-black-500">
                  <span>{netAmount}</span>
                  <TokenSymbolBadge
                    TokenIcon={TokenIcon}
                    fallback={tokenSymbol}
                  />
                  <span>{tokenSymbol}</span>
                  {approxUsd ? (
                    <span className="text-sm font-medium text-black-200">
                      ≈ {approxUsd}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <DialogDescription className="text-base text-black-300 pb-10">
              Thank you for your contribution, <br /> your help makes a real
              difference.
            </DialogDescription>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="ghost"
            className="flex-1 h-10 px-6 py-2.5 bg-black-50 border border-black-50 text-black-500 text-sm font-medium tracking-[0.07px] rounded-lg hover:bg-white-300"
            type="button"
            disabled={!canViewContributions}
            onClick={() => {
              if (canViewContributions && onViewContributions) {
                onViewContributions();
              }
            }}
          >
            View all Contributions
          </Button>
          <Button
            className="flex-1 h-10 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
            type="button"
            onClick={onClose}
          >
            Done
          </Button>
        </div>

        <a
          className={cn(
            "pt-2 inline-flex items-center justify-center align-middle gap-2 text-sm font-medium text-black-300",
            explorerHref
              ? "text-black-300 hover:text-black-500"
              : "text-black-300 cursor-not-allowed",
          )}
          href={explorerHref ?? undefined}
          target={explorerHref ? "_blank" : undefined}
          rel={explorerHref ? "noopener noreferrer" : undefined}
          aria-disabled={!explorerHref}
          onClick={(event) => {
            if (!explorerHref) {
              event.preventDefault();
            }
          }}
        >
          <ReceiptText className="size-4 text-black-300" aria-hidden="true" />
          View transaction in explorer
        </a>
      </DialogContent>
    </Dialog>
  );
}

function TokenSymbolBadge({
  TokenIcon,
  fallback,
}: {
  TokenIcon: ComponentType<{ className?: string }> | null;
  fallback: string;
}) {
  if (TokenIcon) {
    return (
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-black-500 shadow-inner">
        <TokenIcon className="h-4 w-4" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-white text-[10px] font-semibold uppercase text-black-300 shadow-inner">
      {fallback.slice(0, 3).toUpperCase()}
    </span>
  );
}
