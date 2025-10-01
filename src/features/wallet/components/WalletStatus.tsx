import { useCurrentAccount } from "@mysten/dapp-kit";
import { OwnedObjects } from "@/features/wallet/components/OwnedObjects";

export function WalletStatus() {
  const account = useCurrentAccount();

  return (
    <div className="my-2 container">
      <h2 className="mb-2 text-2xl font-semibold">Wallet Status</h2>

      {account ? (
        <div className="flex flex-col">
          <p className="text-base">Wallet connected</p>
          <p className="text-base">Address: {account.address}</p>
        </div>
      ) : (
        <p className="text-base">Wallet not connected</p>
      )}
      <OwnedObjects />
    </div>
  );
}
