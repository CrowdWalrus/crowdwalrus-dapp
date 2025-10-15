/**
 * Campaign Status Utility
 *
 * Determines the current status of a campaign based on dates and flags
 */

export type CampaignStatus = "open_soon" | "funding" | "active" | "ended";

export interface CampaignStatusInfo {
  status: CampaignStatus;
  label: string;
  dateLabel: string;
  dateValue: string;
  showProgress: boolean;
  buttonText: string;
  buttonVariant: "primary" | "secondary";
}

/**
 * Calculate campaign status based on dates and active flags
 */
export function getCampaignStatus(
  startDateMs: number,
  endDateMs: number,
  isActive: boolean,
  isDeleted: boolean
): CampaignStatus {
  const now = Date.now();

  // Deleted or inactive campaigns are ended
  if (isDeleted || !isActive) {
    return "ended";
  }

  // Campaign hasn't started yet
  if (now < startDateMs) {
    return "open_soon";
  }

  // Campaign is currently accepting donations
  if (now >= startDateMs && now < endDateMs) {
    return "funding";
  }

  // Campaign has ended but might still be active (showing updates)
  return "active";
}

/**
 * Format date for display in campaign cards
 */
export function formatCampaignDate(timestampMs: number): string {
  if (!Number.isFinite(timestampMs) || timestampMs <= 0) {
    return "Unknown";
  }

  const date = new Date(timestampMs);
  return date.toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/**
 * Calculate days until/since a date
 */
export function getDaysUntil(timestampMs: number): number {
  const now = Date.now();
  const diff = timestampMs - now;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

/**
 * Get human-readable time remaining text
 */
export function getTimeRemainingText(endDateMs: number): string {
  const days = getDaysUntil(endDateMs);

  if (days < 0) {
    return "Ended";
  } else if (days === 0) {
    return "Ends today";
  } else if (days === 1) {
    return "Ends tomorrow";
  } else if (days <= 7) {
    return `Ends in ${days} days`;
  } else {
    return `Ends ${formatCampaignDate(endDateMs)}`;
  }
}

/**
 * Get comprehensive status information for a campaign
 */
export function getCampaignStatusInfo(
  startDateMs: number,
  endDateMs: number,
  isActive: boolean,
  isDeleted: boolean
): CampaignStatusInfo {
  const status = getCampaignStatus(startDateMs, endDateMs, isActive, isDeleted);

  switch (status) {
    case "open_soon":
      return {
        status,
        label: "Open Soon",
        dateLabel: "Starts",
        dateValue: formatCampaignDate(startDateMs),
        showProgress: false,
        buttonText: "Read more",
        buttonVariant: "secondary",
      };

    case "funding":
      return {
        status,
        label: "Funding",
        dateLabel: getDaysUntil(endDateMs) <= 7 ? "Ends in" : "Ends",
        dateValue:
          getDaysUntil(endDateMs) <= 7
            ? `${getDaysUntil(endDateMs)} days`
            : formatCampaignDate(endDateMs),
        showProgress: true,
        buttonText: "Contribute Now",
        buttonVariant: "primary",
      };

    case "active":
      return {
        status,
        label: "Active",
        dateLabel: "Completed on",
        dateValue: formatCampaignDate(endDateMs),
        showProgress: false,
        buttonText: "View Updates",
        buttonVariant: "secondary",
      };

    case "ended":
      return {
        status,
        label: "Ended",
        dateLabel: "Delivered on",
        dateValue: formatCampaignDate(endDateMs),
        showProgress: false,
        buttonText: "View Updates",
        buttonVariant: "secondary",
      };

    default:
      return {
        status: "ended",
        label: "Ended",
        dateLabel: "Ended",
        dateValue: formatCampaignDate(endDateMs),
        showProgress: false,
        buttonText: "Read more",
        buttonVariant: "secondary",
      };
  }
}
