/**
 * Parse a date-only input (`YYYY-MM-DD`) as midnight in the user's local timezone.
 *
 * Why this helper exists:
 * - `new Date("YYYY-MM-DD")` is parsed as UTC by JavaScript.
 * - For date-only UX (calendar pickers), we want local-midnight semantics instead.
 * - Using `new Date(year, monthIndex, day, ...)` preserves local user intent.
 *
 * Returns `null` for missing/invalid input and guards against overflow dates
 * like `2026-02-31`.
 *
 * @example
 * // User in Toronto selects "2026-03-08"
 * // Result is local midnight in America/Toronto, then represented as UTC internally.
 * const d = parseDateInputAsLocalDate("2026-03-08");
 *
 * @example
 * // Invalid values safely return null.
 * parseDateInputAsLocalDate("") // null
 * parseDateInputAsLocalDate("2026-02-31") // null
 */
export function parseDateInputAsLocalDate(
  value: string | null | undefined,
): Date | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  const date = new Date(year, month - 1, day, 0, 0, 0, 0);

  // Guard against overflow values like 2026-02-31.
  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}
