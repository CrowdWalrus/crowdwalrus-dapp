const USD_MICROS_PER_DOLLAR = 1_000_000n;
const USD_MICROS_PER_CENT = USD_MICROS_PER_DOLLAR / 100n;
const MAX_U64 = (1n << 64n) - 1n;
const DEFAULT_LOCALE = "en-US";

const groupWithCommas = (value: bigint): string =>
  value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");

const formatWholeNumber = (value: bigint, locale: string): string => {
  if (locale === DEFAULT_LOCALE) {
    return groupWithCommas(value);
  }
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 });
  return formatter.format(Number(value));
};

const getDecimalSeparator = (locale: string): string => {
  const parts = new Intl.NumberFormat(locale).formatToParts(1.1);
  return parts.find((part) => part.type === "decimal")?.value ?? ".";
};

const sanitizeUsdInput = (value: string) => value.replace(/,/g, "").trim();

/**
 * Parse a USD string (optional decimals up to 6 places) into micro-denominated
 * bigint math that matches the Move contract.
 */
export function parseUsdToMicros(value: string): bigint {
  const sanitized = sanitizeUsdInput(value);
  if (!sanitized) {
    throw new Error("Funding goal is required.");
  }

  const match = sanitized.match(/^(\d+)(?:\.(\d{0,6})?)?$/);
  if (!match) {
    throw new Error(
      "Funding goal must be a valid USD amount with up to 6 decimal places.",
    );
  }

  const [, dollarsPart, fractionalPart = ""] = match;
  const paddedFractional = fractionalPart.padEnd(6, "0").slice(0, 6);

  const wholeMicros = BigInt(dollarsPart) * USD_MICROS_PER_DOLLAR;
  const fractionalMicros = BigInt(paddedFractional || "0");
  const total = wholeMicros + fractionalMicros;

  if (total > MAX_U64) {
    throw new Error("Funding goal exceeds Move u64 range.");
  }

  return total;
}

/**
 * Convert micro-denominated USD into a plain string (no grouping, trimmed decimals).
 */
export function formatUsdFromMicros(value: bigint): string {
  const isNegative = value < 0n;
  const absolute = isNegative ? -value : value;
  const dollars = absolute / USD_MICROS_PER_DOLLAR;
  const fractional = absolute % USD_MICROS_PER_DOLLAR;
  const fractionalString = fractional
    .toString()
    .padStart(6, "0")
    .replace(/0+$/, "");

  const formatted =
    fractionalString.length > 0
      ? `${dollars.toString()}.${fractionalString}`
      : dollars.toString();

  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Convert micro-denominated USD to a floating-point number (USD units).
 * Safe because funding goals are capped well below MAX_SAFE_INTEGER.
 */
export function usdMicrosToNumber(value: bigint): number {
  return Number(value) / Number(USD_MICROS_PER_DOLLAR);
}

/**
 * Locale-aware formatter for USD micro values.
 * - Rounds to cents.
 * - Drops decimals when .00.
 * - Shows "<0.01" for non-zero values below one cent.
 */
export function formatUsdLocaleFromMicros(
  value: bigint,
  locale = DEFAULT_LOCALE,
): string {
  const sign = value < 0n ? "-" : "";
  const absolute = value < 0n ? -value : value;

  if (absolute > 0n && absolute < USD_MICROS_PER_CENT) {
    const lessThan = new Intl.NumberFormat(locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(0.01);
    return `${sign}<${lessThan}`;
  }

  const roundedCents = (absolute + USD_MICROS_PER_CENT / 2n) / USD_MICROS_PER_CENT;
  const dollars = roundedCents / 100n;
  const cents = roundedCents % 100n;
  const wholeFormatted = formatWholeNumber(dollars, locale);

  if (cents === 0n) {
    return `${sign}${wholeFormatted}`;
  }

  const decimalSeparator = getDecimalSeparator(locale);
  const centsString = cents.toString().padStart(2, "0");
  return `${sign}${wholeFormatted}${decimalSeparator}${centsString}`;
}

/**
 * Format a token amount from raw units (bigint) to 2 decimal places.
 */
export function formatTokenAmount(rawAmount: bigint, decimals: number): string {
  if (rawAmount === 0n) {
    return "0";
  }

  const sign = rawAmount < 0n ? "-" : "";
  const absolute = rawAmount < 0n ? -rawAmount : rawAmount;
  const safeDecimals = Math.max(decimals, 0);
  const scale = 10n ** BigInt(safeDecimals);
  const whole = absolute / scale;
  const remainder = absolute % scale;

  const fractionScale = 100n;
  let roundedFraction = (remainder * fractionScale + scale / 2n) / scale;
  let adjustedWhole = whole;

  if (roundedFraction === fractionScale) {
    adjustedWhole += 1n;
    roundedFraction = 0n;
  }

  const wholeFormatted = groupWithCommas(adjustedWhole);
  if (adjustedWhole === 0n && roundedFraction === 0n) {
    return "0";
  }
  if (roundedFraction === 0n) {
    return `${sign}${wholeFormatted}`;
  }

  const fractionStr = roundedFraction.toString().padStart(2, "0");
  return `${sign}${wholeFormatted}.${fractionStr}`;
}

/**
 * Format a token amount already expressed in token units (number).
 */
export function formatTokenAmountFromNumber(
  value: number,
  locale = DEFAULT_LOCALE,
): string {
  if (!Number.isFinite(value)) {
    return "0";
  }

  const sign = value < 0 ? "-" : "";
  const absolute = Math.abs(value);
  const fixed = absolute.toFixed(2);
  if (fixed === "0.00") {
    return "0";
  }
  const [wholePart, fractionPart = "00"] = fixed.split(".");
  const wholeFormatted = new Intl.NumberFormat(locale, {
    maximumFractionDigits: 0,
  }).format(Number(wholePart));

  if (fractionPart === "00") {
    return `${sign}${wholeFormatted}`;
  }

  const decimalSeparator = getDecimalSeparator(locale);
  return `${sign}${wholeFormatted}${decimalSeparator}${fractionPart}`;
}

export const USD_MICROS = {
  PER_DOLLAR: USD_MICROS_PER_DOLLAR,
};
