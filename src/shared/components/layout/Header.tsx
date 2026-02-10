import {
  useCurrentAccount,
  ConnectButton,
  useDisconnectWallet,
} from "@mysten/dapp-kit";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PlusIcon, WalletMinimal, Menu, LogOut, ChevronDown } from "lucide-react";

import { useWalrusImage } from "@/features/campaigns/hooks/useWalrusImage";
import {
  PROFILE_METADATA_KEYS,
  useProfile,
} from "@/features/profiles/hooks/useProfile";
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
import { Skeleton } from "@/shared/components/ui/skeleton";
import { ROUTES } from "@/shared/config/routes";
import { useNetworkVariable } from "@/shared/config/networkConfig";
import { cn } from "@/shared/lib/utils";
import { buildProfileDetailPath } from "@/shared/utils/routes";
import { formatSubdomain } from "@/shared/utils/subdomain";

type NavLink =
  | { label: string; to: string }
  | { label: string; href: string; external: true };

const formatAddress = (address: string) => `${address.slice(0, 4)}...${address.slice(-4)}`;

function resolveProfileIdentityLabel(
  subdomainName: string | null,
  campaignDomain: string | null,
): string | null {
  const normalizedSubdomain = subdomainName?.trim() ?? "";
  if (!normalizedSubdomain) {
    return null;
  }

  if (!campaignDomain) {
    return normalizedSubdomain;
  }

  const normalizedDomain = campaignDomain.toLowerCase();
  const lowerSubdomain = normalizedSubdomain.toLowerCase();

  if (lowerSubdomain.endsWith(`.${normalizedDomain}`)) {
    return normalizedSubdomain;
  }

  if (lowerSubdomain.endsWith(`@${normalizedDomain}`)) {
    const [label] = normalizedSubdomain.split("@");
    return label?.trim() ? formatSubdomain(label, campaignDomain) : normalizedSubdomain;
  }

  if (normalizedSubdomain.includes(".") || normalizedSubdomain.includes("@")) {
    return normalizedSubdomain;
  }

  return formatSubdomain(normalizedSubdomain, campaignDomain);
}

interface HeaderAccountAvatarProps {
  imageUrl: string | null;
  isLoading: boolean;
  alt: string;
}

function HeaderAccountAvatar({ imageUrl, isLoading, alt }: HeaderAccountAvatarProps) {
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isImageErrored, setIsImageErrored] = useState(false);

  useEffect(() => {
    setIsImageLoaded(false);
    setIsImageErrored(false);
  }, [imageUrl]);

  if (isLoading) {
    return <Skeleton className="size-6 shrink-0 rounded-full bg-black-50" />;
  }

  if (imageUrl && !isImageErrored) {
    return (
      <div className="relative size-6 shrink-0 overflow-hidden rounded-full bg-black-50">
        {!isImageLoaded ? (
          <Skeleton className="absolute inset-0 rounded-none bg-black-50" />
        ) : null}
        <img
          src={imageUrl}
          alt={alt}
          className={cn(
            "h-full w-full object-cover transition-opacity duration-200",
            isImageLoaded ? "opacity-100" : "opacity-0",
          )}
          loading="lazy"
          onLoad={() => setIsImageLoaded(true)}
          onError={() => setIsImageErrored(true)}
        />
      </div>
    );
  }

  return (
    <div className="size-6 shrink-0 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
  );
}

export function Header() {
  const account = useCurrentAccount();
  const connectButtonRef = useRef<HTMLDivElement>(null);
  const { mutate: disconnect } = useDisconnectWallet();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [desktopAccountMenuOpen, setDesktopAccountMenuOpen] = useState(false);
  const [mobileAccountMenuOpen, setMobileAccountMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const campaignDomain = (useNetworkVariable("campaignDomain") as string | undefined) ?? null;
  const { subdomainName, metadata } = useProfile({
    ownerAddress: account?.address ?? null,
    enabled: Boolean(account?.address),
    pageSize: 1,
  });
  const avatarWalrusUrl = (metadata[PROFILE_METADATA_KEYS.AVATAR_WALRUS_ID] ?? "").trim();
  const { data: avatarImageUrl, isError: isAvatarError } = useWalrusImage(
    avatarWalrusUrl || null,
  );
  const resolvedProfileIdentity = useMemo(
    () => resolveProfileIdentityLabel(subdomainName, campaignDomain),
    [campaignDomain, subdomainName],
  );
  const headerIdentityLabel = account
    ? resolvedProfileIdentity || formatAddress(account.address)
    : "";
  const isAvatarSourceLoading = Boolean(
    account && avatarWalrusUrl && !avatarImageUrl && !isAvatarError,
  );
  const resolvedAvatarImageUrl =
    avatarWalrusUrl && avatarImageUrl && !isAvatarError ? avatarImageUrl : null;

  const handleConnectClick = () => {
    connectButtonRef.current?.querySelector("button")?.click();
  };

  const navLinks: NavLink[] = [
    { to: ROUTES.HOME, label: "Home" },
    { to: ROUTES.EXPLORE, label: "Campaigns" },
    { to: ROUTES.ABOUT, label: "About" },
    { to: ROUTES.CONTACT, label: "Contact Us" },
  ];

  const baseNavLinkClassName =
    "font-medium text-lg hover:text-primary transition-colors";

  const getNavLinkClassName = (linkTo: string) => {
    const isExploreLink = linkTo === ROUTES.EXPLORE;
    const isActive = isExploreLink
      ? location.pathname.startsWith(ROUTES.EXPLORE)
      : location.pathname === linkTo;

    return isActive
      ? `${baseNavLinkClassName} text-primary`
      : baseNavLinkClassName;
  };

  const renderNavLink = (link: NavLink, onClick?: () => void) => {
    if ("href" in link) {
      return (
        <a
          key={link.label}
          href={link.href}
          target="_blank"
          rel="noopener noreferrer"
          className={baseNavLinkClassName}
          onClick={onClick}
        >
          {link.label}
        </a>
      );
    }

    return (
      <Link
        key={link.to}
        to={link.to}
        className={getNavLinkClassName(link.to)}
        onClick={onClick}
      >
        {link.label}
      </Link>
    );
  };

  const profileBasePath = account
    ? buildProfileDetailPath(account.address, {
        subdomainName,
        campaignDomain,
      })
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
            <div className="flex gap-8 xl:gap-12 items-center">
              {navLinks.map((link) => renderNavLink(link))}
            </div>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex gap-2 xl:gap-4 items-center">
            <Button asChild size="icon" className="size-9 xl:hidden">
              <Link
                to={ROUTES.CAMPAIGNS_NEW}
                aria-label="Launch your campaign"
              >
                <PlusIcon className="size-5" />
              </Link>
            </Button>
            <Button asChild className="hidden xl:inline-flex">
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
                      className="hover:bg-white cursor-pointer gap-2 min-w-0 max-w-[290px] xl:max-w-[380px]"
                    >
                      <HeaderAccountAvatar
                        imageUrl={resolvedAvatarImageUrl}
                        isLoading={isAvatarSourceLoading}
                        alt={headerIdentityLabel}
                      />
                      <span
                        className="max-w-[180px] truncate text-left xl:max-w-[260px]"
                        title={headerIdentityLabel}
                      >
                        {headerIdentityLabel}
                      </span>
                      <ChevronDown
                        className={`size-4 shrink-0 text-black-200 transition-transform duration-200 ${
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
                    <DropdownMenuLabel className="px-2 py-1.5">
                      <div className="flex flex-col gap-1">
                        <span className="text-xs font-normal text-black-200">
                          My account
                        </span>
                        <span className="text-xs font-medium text-black-400 leading-relaxed break-all">
                          {headerIdentityLabel}
                        </span>
                      </div>
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
                      className="h-9 gap-2 rounded-lg px-2 sm:px-3 min-w-0 max-w-[220px]"
                      aria-label="Open wallet menu"
                    >
                      <HeaderAccountAvatar
                        imageUrl={resolvedAvatarImageUrl}
                        isLoading={isAvatarSourceLoading}
                        alt={headerIdentityLabel}
                      />
                      <span
                        className="hidden sm:block max-w-[130px] md:max-w-[160px] truncate text-left text-sm"
                        title={headerIdentityLabel}
                      >
                        {headerIdentityLabel}
                      </span>
                      <ChevronDown
                        className={`size-4 shrink-0 text-black-200 transition-transform duration-200 ${
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
                  <DropdownMenuLabel className="px-2 py-1.5">
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-normal text-black-200">
                        My account
                      </span>
                      <span className="text-xs font-medium text-black-400 leading-relaxed break-all">
                        {headerIdentityLabel}
                      </span>
                    </div>
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
                    {navLinks.map((link) =>
                      renderNavLink(link, () => setMobileMenuOpen(false)),
                    )}
                  </nav>

                  {/* Mobile Wallet Actions */}
                  <div className="flex flex-col gap-3 pt-4 border-t">
                    {account ? (
                      <Button
                        variant="outline"
                        className="w-full hover:bg-white cursor-pointer justify-start gap-2 min-w-0"
                        onClick={() => {
                          disconnect();
                          setMobileMenuOpen(false);
                        }}
                      >
                        <HeaderAccountAvatar
                          imageUrl={resolvedAvatarImageUrl}
                          isLoading={isAvatarSourceLoading}
                          alt={headerIdentityLabel}
                        />
                        <span className="min-w-0 flex-1 truncate text-left" title={headerIdentityLabel}>
                          {headerIdentityLabel}
                        </span>
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
