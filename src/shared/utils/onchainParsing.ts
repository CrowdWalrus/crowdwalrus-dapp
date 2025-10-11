/**
 * On-chain Value Parsing Helpers
 *
 * Utility functions for safely converting Move values returned by the Sui RPC
 * into JavaScript primitives. These helpers handle mixed representations
 * (string, number, bigint, structured Move options) while keeping the parsing
 * rules centralized and consistent between hooks.
 */

/**
 * Convert a Move timestamp (stored as u64 milliseconds) to a JavaScript number.
 * Legacy seconds-based values (< 1e12) are up-converted to milliseconds.
 *
 * @param value - Raw timestamp value from the Move object or event payload.
 * @returns Timestamp in milliseconds (0 if the value cannot be parsed).
 */
export function parseTimestampFromMove(value: unknown): number {
  if (typeof value === "string" || typeof value === "number") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    if (parsed > 0 && parsed < 1_000_000_000_000) {
      return parsed * 1000;
    }
    return parsed;
  }
  if (typeof value === "bigint") {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
      return 0;
    }
    if (parsed > 0 && parsed < 1_000_000_000_000) {
      return parsed * 1000;
    }
    return parsed;
  }
  return 0;
}

/**
 * Convert an optional Move timestamp to a JavaScript number, preserving null
 * when no value is present. Supports different Move option shapes.
 *
 * @param optionValue - Raw optional timestamp value from Move.
 * @returns Timestamp in milliseconds, or null if no value is present.
 */
export function parseOptionalTimestampFromMove(
  optionValue: unknown,
): number | null {
  if (!optionValue) {
    return null;
  }
  if (typeof optionValue === "string" || typeof optionValue === "number") {
    const parsed = Number(optionValue);
    if (!Number.isFinite(parsed)) {
      return null;
    }
    if (parsed > 0 && parsed < 1_000_000_000_000) {
      return parsed * 1000;
    }
    return parsed;
  }
  if (typeof optionValue === "object") {
    const valueObj = optionValue as Record<string, unknown>;
    if ("fields" in valueObj && valueObj.fields) {
      const fieldsRecord = valueObj.fields as Record<string, unknown>;
      const candidates = [
        fieldsRecord.value,
        fieldsRecord.some,
        Array.isArray(fieldsRecord.vec) && fieldsRecord.vec.length > 0
          ? fieldsRecord.vec[0]
          : undefined,
      ];
      for (const candidate of candidates) {
        if (candidate !== undefined && candidate !== null) {
          const parsedCandidate = Number(candidate);
          if (Number.isFinite(parsedCandidate)) {
            if (
              parsedCandidate > 0 &&
              parsedCandidate < 1_000_000_000_000
            ) {
              return parsedCandidate * 1000;
            }
            return parsedCandidate;
          }
        }
      }
    }
    if ("Some" in valueObj && valueObj.Some !== undefined) {
      const parsed = Number(
        (valueObj as { Some: unknown }).Some ?? undefined,
      );
      if (!Number.isFinite(parsed)) {
        return null;
      }
      if (parsed > 0 && parsed < 1_000_000_000_000) {
        return parsed * 1000;
      }
      return parsed;
    }
  }
  return null;
}

/**
 * Parse a Move u64 value (counter/index) into a JavaScript number without
 * applying timestamp conversions.
 *
 * @param value - Raw u64 value from Move.
 * @param fallback - Value to return when parsing fails.
 * @returns Parsed number or the provided fallback.
 */
export function parseU64FromMove(
  value: unknown,
  fallback = 0,
): number {
  if (typeof value === "string" || typeof value === "number") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  if (typeof value === "bigint") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
}
