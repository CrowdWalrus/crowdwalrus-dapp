/**
 * Utilities for translating Move abort codes into user-friendly messages.
 */

const CAMPAIGN_ERROR_MESSAGES: Record<number, string> = {
  1: "You are not authorized to edit this campaign.",
  4: "Metadata update failed: keys and values mismatch.",
  5: "Start date must be before end date.",
  6: "Start date cannot be in the past.",
  8: "Funding goal cannot be modified after campaign creation.",
  9: "Recipient address must be a valid, non-zero Sui address.",
  10: "Recipient address cannot be modified after campaign creation.",
  11: "This campaign has been deleted and can no longer be edited.",
};

export function mapCampaignError(code: number): string {
  return (
    CAMPAIGN_ERROR_MESSAGES[code] ||
    `An error occurred while updating the campaign (code: ${code}).`
  );
}

/**
 * Attempt to extract a Move abort code from an error object.
 */
export function extractMoveAbortCode(error: unknown): number | null {
  const message =
    typeof error === "string"
      ? error
      : error instanceof Error
        ? error.message
        : null;

  if (!message) {
    return null;
  }

  const match = message.match(/MoveAbort.*code:\s*(\d+)/i);
  if (match && match[1]) {
    const parsed = Number.parseInt(match[1], 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  const fallbackMatch = message.match(/abort code (\d+)/i);
  if (fallbackMatch && fallbackMatch[1]) {
    const parsed = Number.parseInt(fallbackMatch[1], 10);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
}
