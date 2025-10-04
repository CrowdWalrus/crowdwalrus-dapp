import { useCurrentAccount, useSuiClientQuery } from "@mysten/dapp-kit";
import { useNetworkVariable } from "@/shared/config/networkConfig";
import { CoinStruct } from "@mysten/sui/client";

/**
 * Hook to fetch the WAL token balance for the current account
 * @returns Formatted WAL balance string (e.g., "1,234.56 WAL") or loading/error state
 */
export function useWalBalance() {
  const currentAccount = useCurrentAccount();
  const walCoinType = useNetworkVariable("walCoinType");

  const { data, isLoading, isError, error } = useSuiClientQuery(
    "getAllBalances",
    {
      owner: currentAccount?.address || "",
    },
    {
      enabled: !!currentAccount?.address,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  );

  // Find WAL balance from all balances
  const walBalanceData = data?.find(
    (balance) => balance.coinType === walCoinType,
  );

  // Format balance with proper decimals (WAL has 9 decimals like SUI)
  const formatWalBalance = (balance: string | undefined): string => {
    if (!balance) return "0 WAL";

    const balanceNum = BigInt(balance);
    const decimals = 9; // WAL has 9 decimals (1 WAL = 1,000,000,000 FROST)
    const divisor = BigInt(10 ** decimals);

    const integerPart = balanceNum / divisor;
    const fractionalPart = balanceNum % divisor;

    // Format with commas and up to 6 decimal places
    const formattedInteger = integerPart.toLocaleString("en-US");
    const formattedFractional = fractionalPart
      .toString()
      .padStart(decimals, "0")
      .slice(0, 6)
      .replace(/0+$/, ""); // Remove trailing zeros

    if (formattedFractional) {
      return `${formattedInteger}.${formattedFractional} WAL`;
    }

    return `${formattedInteger} WAL`;
  };

  const formattedBalance = formatWalBalance(walBalanceData?.totalBalance);

  return {
    balance: walBalanceData?.totalBalance || "0",
    formattedBalance,
    isLoading,
    isError,
    error,
    hasBalance: !!walBalanceData && BigInt(walBalanceData.totalBalance) > 0n,
  };
}

/**
 * Hook to check if the current account has sufficient WAL balance
 * @param requiredAmount - Required amount in WAL (as a number or string)
 * @returns Boolean indicating if balance is sufficient
 */
export function useHasSufficientWalBalance(requiredAmount: number | string) {
  const { balance, isLoading } = useWalBalance();

  if (isLoading) return false;

  const required = BigInt(
    Math.floor(Number(requiredAmount) * 10 ** 9).toString(),
  );
  const current = BigInt(balance);

  return current >= required;
}
