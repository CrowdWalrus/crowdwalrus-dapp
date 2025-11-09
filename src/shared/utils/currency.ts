const USD_MICROS_PER_DOLLAR = 1_000_000n;
const MAX_U64 = (1n << 64n) - 1n;

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
 * Locale-aware formatter for USD micro values with sensible 2-decimal defaults.
 */
export function formatUsdLocaleFromMicros(
  value: bigint,
  locale = "en-US",
  options: Intl.NumberFormatOptions = {},
): string {
  const formatter = new Intl.NumberFormat(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    ...options,
  });
  return formatter.format(usdMicrosToNumber(value));
}

export const USD_MICROS = {
  PER_DOLLAR: USD_MICROS_PER_DOLLAR,
};
