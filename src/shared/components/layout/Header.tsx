import {
  useCurrentAccount,
  ConnectButton,
  useSwitchAccount,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { PlusIcon, Wallet, WalletMinimal } from "lucide-react";
import { useRef } from "react";

export function Header() {
  const account = useCurrentAccount();
  const connectButtonRef = useRef<HTMLDivElement>(null);
  const { mutate: disconnect } = useDisconnectWallet();
  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleConnectClick = () => {
    connectButtonRef.current?.querySelector("button")?.click();
  };

  return (
    <header className="border-b shadow-sm">
      <div className="container px-4">
        <div className="flex justify-between items-center pb-6 pt-10">
          {/* Logo */}
          <Link to="/" className="flex items-center h-[50px]">
            <img
              src="/assets/images/brand/logotype.png"
              alt="CrowdWalrus"
              className="h-full"
            />
          </Link>

          {/* Navigation */}
          <nav>
            <div className="flex gap-12 items-center">
              <Link
                to="/"
                className="font-medium text-lg hover:text-primary transition-colors"
              >
                Home
              </Link>
              <Link
                to="/about"
                className="font-medium text-lg hover:text-primary transition-colors"
              >
                About
              </Link>
              <Link
                to="/campaigns"
                className="font-medium text-lg hover:text-primary transition-colors"
              >
                Campaigns
              </Link>
              <Link
                to="/contact"
                className="font-medium text-lg hover:text-primary transition-colors"
              >
                Contact Us
              </Link>
            </div>
          </nav>

          {/* Actions */}
          <div className="flex gap-4 items-center">
            <Button asChild>
              <Link to="/campaigns/new">
                <PlusIcon />
                Launch Campaign
              </Link>
            </Button>

            {account ? (
              <Button
                variant="outline"
                className="hover:bg-white cursor-pointer"
                onClick={() => disconnect()}
              >
                <div className="size-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                {formatAddress(account.address)}
                {/* <ChevronDownIcon /> */}
              </Button>
            ) : (
              <>
                <Button
                  className="bg-blue-50 text-blue-500 hover:bg-white cursor-pointer"
                  onClick={handleConnectClick}
                >
                  <WalletMinimal />
                  Connect Wallet
                </Button>
                <div ref={connectButtonRef} className="hidden">
                  <ConnectButton />
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
