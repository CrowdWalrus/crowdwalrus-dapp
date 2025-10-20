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

