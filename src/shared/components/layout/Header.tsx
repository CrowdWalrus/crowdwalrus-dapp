import { useCurrentAccount, ConnectButton } from "@mysten/dapp-kit";
import { Container, Flex } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { Button } from "@/shared/components/ui/button";
import { RocketIcon, ChevronDownIcon } from "@radix-ui/react-icons";

export function Header() {
  const account = useCurrentAccount();

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <header className="bg-white border-b shadow-sm">
      <Container>
        <Flex justify="between" align="center" pb="6" pt="9">
          {/* Logo */}
          <Link to="/" className="flex items-center h-[50px]">
            <img src="/logo.svg" alt="CrowdWalrus" className="h-full" />
          </Link>

          {/* Navigation */}
          <nav>
            <Flex gap="12" align="center">
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
            </Flex>
          </nav>

          {/* Actions */}
          <Flex gap="4" align="center">
            <Button asChild>
              <Link to="/campaigns/new">
                <RocketIcon />
                Launch Campaign
              </Link>
            </Button>

            {account ? (
              <Button variant="outline">
                <div className="size-6 rounded-full bg-gradient-to-br from-blue-500 to-purple-500" />
                {formatAddress(account.address)}
                <ChevronDownIcon />
              </Button>
            ) : (
              <ConnectButton />
            )}
          </Flex>
        </Flex>
      </Container>
    </header>
  );
}
