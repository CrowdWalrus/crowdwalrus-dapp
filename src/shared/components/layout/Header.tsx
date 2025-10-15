import {
  useCurrentAccount,
  ConnectButton,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";

import { PlusIcon, WalletMinimal, Menu } from "lucide-react";
import { useRef, useState } from "react";
import { ROUTES } from "@/shared/config/routes";

export function Header() {
  const account = useCurrentAccount();
  const connectButtonRef = useRef<HTMLDivElement>(null);
  const { mutate: disconnect } = useDisconnectWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleConnectClick = () => {
    connectButtonRef.current?.querySelector("button")?.click();
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/about", label: "About" },
    { to: "/campaigns", label: "Campaigns" },
    { to: "/contact", label: "Contact Us" },
  ];

  return (
    <header className="border-b shadow-sm">
      <div className="container px-4">
        <div className="flex justify-between items-center pb-4 pt-6 md:pb-6 md:pt-10">
          {/* Logo */}
          <Link to="/" className="flex items-center h-[40px] md:h-[50px]">
            <img
              src="/assets/images/brand/logotype.png"
              alt="CrowdWalrus"
              className="h-full"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:block">
            <div className="flex gap-12 items-center">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="font-medium text-lg hover:text-primary transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex gap-4 items-center">
            <Button asChild>
              <Link to={ROUTES.CAMPAIGNS_NEW}>
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

          {/* Mobile Menu */}
          <div className="flex md:hidden gap-2 items-center">
            {/* Mobile Launch Campaign Button - Icon Only */}
            <Button asChild size="icon" className="size-9">
              <Link to={ROUTES.CAMPAIGNS_NEW}>
                <PlusIcon className="size-5" />
              </Link>
            </Button>

            {/* Mobile Menu Trigger */}
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="icon" className="size-9">
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-6 mt-8">
                  {/* Mobile Navigation Links */}
                  <nav className="flex flex-col gap-4">
                    {navLinks.map((link) => (
                      <Link
                        key={link.to}
                        to={link.to}
                        className="font-medium text-lg hover:text-primary transition-colors"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </nav>

                  {/* Mobile Wallet Actions */}
                  <div className="flex flex-col gap-3 pt-4 border-t">
                    {account ? (
                      <Button
                        variant="outline"
                        className="w-full hover:bg-white cursor-pointer justify-start"
                        onClick={() => {
                          disconnect();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <div className="size-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                        {formatAddress(account.address)}
                      </Button>
                    ) : (
                      <>
                        <Button
                          className="w-full bg-blue-50 text-blue-500 hover:bg-white cursor-pointer"
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
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
