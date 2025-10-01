import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { AppRoutes } from "./app/router";
import { Header } from "./shared/components/layout/Header";

function App() {
  return (
    <>
      <Header />
      <Container>
        <AppRoutes />
      </Container>
    </>
  );
}

export default App;
