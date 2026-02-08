const USER_REJECTION_CODES = new Set([
  "USER_REJECTED_REQUEST",
  "USER_REJECTED",
  "WALLET_USER_REJECTED",
]);

const USER_REJECTION_MESSAGES = [
  "user rejected",
  "rejected the request",
  "user cancelled",
  "user canceled",
  "request rejected",
  "user declined",
];

const STALE_OBJECT_ERROR_PATTERNS = [
  "could not find the referenced object",
  "at version none",
  "object version unavailable",
  "object not found",
];

const INSUFFICIENT_BALANCE_PATTERNS = [
  "not enough coins",
  "insufficient balance",
  "insufficient",
  "coin balance",
  "balance too low",
];

const INSUFFICIENT_GAS_ERROR_PATTERNS = [
  "insufficient gas",
  "gas balance too low",
  "no valid gas coins found",
  "could not automatically find a budget",
  "gasbudgettoohigh",
  "balance of gas object",
  "lower than the needed amount",
];

const SUI_GAS_MARKERS = ["0x2::sui::sui", "::sui::sui", " sui ", "gas coin"];
const SIMPLE_COIN_MARKER_PATTERN = /^[a-z0-9._-]+$/;

/**
 * Returns a normalized message string for unknown errors.
 */
export const getErrorMessage = (error: unknown): string => {
  if (!error) {
    return "";
  }

  if (error instanceof Error) {
    return error.message ?? "";
  }

  if (typeof error === "string") {
    return error;
  }

  if (typeof error === "object" && "message" in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === "string") {
      return message;
    }
  }

  return "";
};

function collectErrorFragments(error: unknown, fragments: string[], depth = 0) {
  if (!error || depth > 5) {
    return;
  }

  if (typeof error === "string") {
    if (error.trim().length > 0) {
      fragments.push(error);
    }
    return;
  }

  if (error instanceof Error) {
    if (error.message.trim().length > 0) {
      fragments.push(error.message);
    }
    const errorWithCause = error as Error & { cause?: unknown };
    if (errorWithCause.cause) {
      collectErrorFragments(errorWithCause.cause, fragments, depth + 1);
    }
    return;
  }

  if (typeof error !== "object") {
    return;
  }

  const candidate = error as Record<string, unknown>;

  if (typeof candidate.message === "string" && candidate.message.trim().length) {
    fragments.push(candidate.message);
  }

  if (typeof candidate.details === "string" && candidate.details.trim().length) {
    fragments.push(candidate.details);
  }

  if (typeof candidate.error === "string" && candidate.error.trim().length) {
    fragments.push(candidate.error);
  }

  if (Array.isArray(candidate.errors)) {
    candidate.errors.forEach((nestedError) => {
      collectErrorFragments(nestedError, fragments, depth + 1);
    });
  }

  if (candidate.cause) {
    collectErrorFragments(candidate.cause, fragments, depth + 1);
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function hasCoinMarkerMatch(normalizedError: string, marker: string): boolean {
  const normalizedMarker = marker.trim().toLowerCase();
  if (!normalizedMarker) {
    return false;
  }

  if (
    normalizedMarker.includes("0x") ||
    normalizedMarker.includes("::") ||
    !SIMPLE_COIN_MARKER_PATTERN.test(normalizedMarker)
  ) {
    return normalizedError.includes(normalizedMarker);
  }

  const escapedMarker = escapeRegExp(normalizedMarker);
  const boundaryRegex = new RegExp(
    `(^|[^a-z0-9_])${escapedMarker}([^a-z0-9_]|$)`,
  );

  return boundaryRegex.test(normalizedError);
}

export const getErrorText = (error: unknown): string => {
  const fragments: string[] = [];
  collectErrorFragments(error, fragments);
  if (!fragments.length) {
    return "";
  }
  return fragments.join(" ").toLowerCase();
};

/**
 * Detects whether an unknown error value represents a user-initiated rejection
 * in a connected wallet. Wallet providers are not consistent about the error
 * shape, so we check both well-known codes and common message fragments.
 */
export const isUserRejectedError = (error: unknown): boolean => {
  if (!error) {
    return false;
  }

  if (
    typeof error === "object" &&
    "code" in error &&
    typeof (error as { code?: unknown }).code === "string"
  ) {
    if (USER_REJECTION_CODES.has((error as { code: string }).code)) {
      return true;
    }
  }

  const message = getErrorMessage(error).toLowerCase();
  if (!message) {
    return false;
  }

  return USER_REJECTION_MESSAGES.some((fragment) =>
    message.includes(fragment),
  );
};

export const isStaleObjectError = (error: unknown): boolean => {
  const normalizedError = getErrorText(error);
  if (!normalizedError) {
    return false;
  }

  return STALE_OBJECT_ERROR_PATTERNS.some((pattern) =>
    normalizedError.includes(pattern),
  );
};

export const isInsufficientCoinBalanceError = (
  error: unknown,
  options?: {
    expectedCoinMarkers?: string[];
  },
): boolean => {
  const normalizedError = getErrorText(error);
  if (!normalizedError) {
    return false;
  }

  const hasInsufficientMarker = INSUFFICIENT_BALANCE_PATTERNS.some((pattern) =>
    normalizedError.includes(pattern),
  );

  if (!hasInsufficientMarker) {
    return false;
  }

  const expectedMarkers = options?.expectedCoinMarkers ?? [];
  if (!expectedMarkers.length) {
    return true;
  }

  return expectedMarkers.some((marker) =>
    hasCoinMarkerMatch(normalizedError, marker),
  );
};

export const isInsufficientSuiGasError = (error: unknown): boolean => {
  const normalizedError = getErrorText(error);
  if (!normalizedError) {
    return false;
  }

  if (
    INSUFFICIENT_GAS_ERROR_PATTERNS.some((pattern) =>
      normalizedError.includes(pattern),
    )
  ) {
    return true;
  }

  const hasGasMarker = normalizedError.includes("gas");
  const hasBalanceMarker = INSUFFICIENT_BALANCE_PATTERNS.some((pattern) =>
    normalizedError.includes(pattern),
  );
  const hasSuiMarker = SUI_GAS_MARKERS.some((marker) =>
    normalizedError.includes(marker),
  );

  return hasGasMarker && hasBalanceMarker && hasSuiMarker;
};

export interface StaleObjectRetryOptions<T> {
  execute: (attempt: number) => Promise<T>;
  maxRetries?: number;
  retryDelayMs?: number;
  shouldRetryError?: (error: unknown) => boolean;
  onRetry?: (error: unknown, nextAttempt: number) => void;
}

const wait = (ms: number) =>
  new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });

export async function executeWithStaleObjectRetry<T>({
  execute,
  maxRetries = 1,
  retryDelayMs = 1000,
  shouldRetryError = isStaleObjectError,
  onRetry,
}: StaleObjectRetryOptions<T>): Promise<T> {
  let attempt = 0;

  while (true) {
    try {
      return await execute(attempt);
    } catch (error) {
      if (isUserRejectedError(error)) {
        throw error;
      }

      const canRetry = attempt < maxRetries && shouldRetryError(error);
      if (!canRetry) {
        throw error;
      }

      const nextAttempt = attempt + 1;
      onRetry?.(error, nextAttempt);
      await wait(retryDelayMs * nextAttempt);
      attempt = nextAttempt;
    }
  }
}
