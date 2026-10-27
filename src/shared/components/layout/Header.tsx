import { Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Menu } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/shared/components/ui/sheet";
import { ROUTES } from "@/shared/config/routes";
import { DOCS_BASE_URL } from "@/shared/config/docsLinks";

type NavLink =
  | { label: string; to: string }
  | { label: string; href: string; external: true };

const NAV_LINKS: NavLink[] = [
  { to: ROUTES.HOME, label: "Home" },
  { to: ROUTES.ABOUT, label: "About" },
  { href: DOCS_BASE_URL, label: "Docs", external: true },
  { to: ROUTES.CONTACT, label: "Contact Us" },
];

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  const baseNavLinkClassName =
    "font-medium text-lg hover:text-primary transition-colors";

  const getNavLinkClassName = (linkTo: string) =>
    location.pathname === linkTo
      ? `${baseNavLinkClassName} text-primary`
      : baseNavLinkClassName;

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
              {NAV_LINKS.map((link) => renderNavLink(link))}
            </div>
          </nav>

          {/* Mobile Menu */}
          <div className="flex lg:hidden gap-2 items-center">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="size-9"
                  aria-label="Open menu"
                >
                  <Menu className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[280px] sm:w-[320px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <nav className="flex flex-col gap-4 mt-8">
                  {NAV_LINKS.map((link) =>
                    renderNavLink(link, () => setMobileMenuOpen(false)),
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
