import { WalletStatus } from "@/features/wallet/components/WalletStatus";

export function HomePage() {
  return (
    <div className="mt-5 pt-2 px-4 bg-gray-50 min-h-[500px]">
      <WalletStatus />
    </div>
  );
}