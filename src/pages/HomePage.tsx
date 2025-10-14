import { WalletStatus } from "@/features/wallet/components/WalletStatus";

export function HomePage() {
  return (
    <div className="container px-4">
      <div className="mt-5 pt-2 bg-gray-50">
        <WalletStatus />
      </div>
    </div>
  );
}
