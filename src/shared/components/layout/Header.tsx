import {
  useCurrentAccount,
  ConnectButton,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useRef, useState } from "react";
import { PlusIcon, WalletMinimal, Menu, LogOut, ChevronDown } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { ROUTES } from "@/shared/config/routes";
import { buildProfileDetailPath } from "@/shared/utils/routes";

export function Header() {
  const account = useCurrentAccount();
  const connectButtonRef = useRef<HTMLDivElement>(null);
  const { mutate: disconnect } = useDisconnectWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopAccountMenuOpen, setDesktopAccountMenuOpen] = useState(false);
  const [mobileAccountMenuOpen, setMobileAccountMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const handleConnectClick = () => {
    connectButtonRef.current?.querySelector("button")?.click();
  };

  const navLinks = [
    { to: ROUTES.HOME, label: "Home" },
    { to: ROUTES.EXPLORE, label: "Campaigns" },
    { to: "/about", label: "About" },
    { to: "/contact", label: "Contact Us" },
  ];

  const getNavLinkClassName = (linkTo: string) => {
    const baseClassName =
      "font-medium text-lg hover:text-primary transition-colors";
    const isExploreLink = linkTo === ROUTES.EXPLORE;
    const isActive = isExploreLink
      ? location.pathname.startsWith(ROUTES.EXPLORE)
      : location.pathname === linkTo;

    return isActive ? `${baseClassName} text-primary` : baseClassName;
  };

  const profileBasePath = account
    ? buildProfileDetailPath(account.address)
    : null;

  const accountMenuLinks =
    profileBasePath !== null
      ? [
          { label: "My Profile", to: profileBasePath },
          { label: "My Campaigns", to: `${profileBasePath}?tab=campaigns` },
          {
            label: "My Contributions",
            to: `${profileBasePath}?tab=contributions`,
          },
        ]
      : [];

  const closeAccountMenus = useCallback(() => {
    setDesktopAccountMenuOpen(false);
    setMobileAccountMenuOpen(false);
  }, []);

  const handleAccountNavigate = useCallback(
    (path: string) => {
      navigate(path);
      closeAccountMenus();
      setMobileMenuOpen(false);
    },
    [navigate, closeAccountMenus],
  );

  const handleDisconnect = useCallback(() => {
    disconnect();
    closeAccountMenus();
    setMobileMenuOpen(false);
  }, [disconnect, closeAccountMenus]);

  return (
    <header className="border-b shadow-sm">
      <div className="container px-4">
        <div className="flex justify-between items-center pb-4 pt-6 md:pb-6 md:pt-10">
          {/* Logo */}
          <Link to="/" className="flex items-center h-[40px] md:h-[50px]">
            {/* Logo for screens < 1280px */}
            <img
              src="/assets/images/brand/logo.png"
              alt="CrowdWalrus"
              className="h-full block xl:!hidden"
            />
            {/* Logotype for screens >= 1280px */}
            <img
              src="/assets/images/brand/logotype.png"
              alt="CrowdWalrus"
              className="h-full !hidden xl:!block"
            />
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:block">
            <div className="flex gap-12 items-center">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={getNavLinkClassName(link.to)}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex gap-4 items-center">
            <Button asChild>
              <Link to={ROUTES.CAMPAIGNS_NEW}>
                <PlusIcon />
                Launch Your Campaign
              </Link>
            </Button>

            {account ? (
              <div
                className="relative"
                onMouseEnter={() => setDesktopAccountMenuOpen(true)}
                onMouseLeave={() => setDesktopAccountMenuOpen(false)}
              >
                <DropdownMenu
                  open={desktopAccountMenuOpen}
                  onOpenChange={setDesktopAccountMenuOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="hover:bg-white cursor-pointer gap-2"
                    >
                      <div className="size-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                      {formatAddress(account.address)}
                      <ChevronDown
                        className={`size-4 text-black-200 transition-transform duration-200 ${
                          desktopAccountMenuOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="end"
                    sideOffset={10}
                    className="w-56 rounded-2xl border border-black-50 bg-white p-2 shadow-lg"
                  >
                    <DropdownMenuLabel className="px-2 py-1.5 text-xs font-normal text-black-200">
                      My account
                    </DropdownMenuLabel>
                    {accountMenuLinks.map((item) => (
                      <DropdownMenuItem
                        key={item.label}
                        className="rounded-lg px-2 py-2 text-sm font-normal text-black-500 focus:bg-white-100 focus:text-black-500 cursor-pointer"
                        onSelect={(event) => {
                          event.preventDefault();
                          handleAccountNavigate(item.to);
                        }}
                      >
                        {item.label}
                      </DropdownMenuItem>
                    ))}
                    <div className="py-1">
                      <DropdownMenuSeparator className="my-1 bg-black-50" />
                    </div>
                    <DropdownMenuItem
                      className="rounded-lg px-2 py-2 text-sm font-normal text-red-500 cursor-pointer"
                      onSelect={(event) => {
                        event.preventDefault();
                        handleDisconnect();
                      }}
                    >
                      <LogOut className="mr-2 size-4" />
                      Disconnect
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
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
          <div className="flex lg:hidden gap-2 items-center">
            {/* Mobile Launch Your Campaign Button - Icon Only */}
            <Button asChild size="icon" className="size-9">
              <Link to={ROUTES.CAMPAIGNS_NEW}>
                <PlusIcon className="size-5" />
              </Link>
            </Button>

            {/* Mobile Wallet Button - Icon Only */}
            {account ? (
              <DropdownMenu
                open={mobileAccountMenuOpen}
                onOpenChange={setMobileAccountMenuOpen}
              >
                <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="default"
                      className="h-9 gap-2 rounded-lg px-3"
                      aria-label="Open wallet menu"
                    >
                      <div className="size-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                      <ChevronDown
                        className={`size-4 text-black-200 transition-transform duration-200 ${
                          mobileAccountMenuOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="end"
                  sideOffset={12}
                  className="w-[220px] rounded-2xl border border-black-50 bg-white p-2 shadow-lg"
                >
                  <DropdownMenuLabel className="px-2 py-1.5 text-xs font-normal text-black-200">
                    My account
                  </DropdownMenuLabel>
                  {accountMenuLinks.map((item) => (
                    <DropdownMenuItem
                      key={item.label}
                      className="rounded-lg px-2 py-2 text-sm font-normal text-black-500 focus:bg-white-100 focus:text-black-500 cursor-pointer"
                      onSelect={(event) => {
                        event.preventDefault();
                        handleAccountNavigate(item.to);
                      }}
                    >
                      {item.label}
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="my-1 bg-black-50" />
                  <DropdownMenuItem
                    className="rounded-lg px-2 py-2 text-sm font-normal text-red-500 focus:bg-red-50 focus:text-red-500 cursor-pointer"
                    onSelect={(event) => {
                      event.preventDefault();
                      handleDisconnect();
                    }}
                  >
                    <LogOut className="mr-2 size-4" />
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button
                  size="icon"
                  className="size-9 bg-blue-50 text-blue-500 hover:bg-white cursor-pointer"
                  onClick={handleConnectClick}
                >
                  <WalletMinimal className="size-5" />
                </Button>
                <div ref={connectButtonRef} className="hidden">
                  <ConnectButton />
                </div>
              </>
            )}

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
                        className={getNavLinkClassName(link.to)}
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
