import { Container } from "@radix-ui/themes";
import { WalletStatus } from "../WalletStatus";

export function HomePage() {
  return (
    <Container
      mt="5"
      pt="2"
      px="4"
      style={{ background: "var(--gray-a2)", minHeight: 500 }}
    >
      <WalletStatus />
    </Container>
  );
}