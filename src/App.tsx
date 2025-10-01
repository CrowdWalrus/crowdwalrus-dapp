import { ConnectButton } from "@mysten/dapp-kit";
import { Box, Container, Flex, Heading } from "@radix-ui/themes";
import { Link } from "react-router-dom";
import { AppRoutes } from "./app/router";

function App() {
  return (
    <>
      <Flex
        position="sticky"
        px="4"
        py="2"
        justify="between"
        style={{
          borderBottom: "1px solid var(--gray-a2)",
        }}
      >
        <Box>
          <Heading>dApp Starter Template</Heading>
        </Box>

        <Flex gap="4" align="center">
          <Link to="/">Home</Link>
          <Link to="/test">Test</Link>
          <ConnectButton />
        </Flex>
      </Flex>
      <Container>
        <AppRoutes />
      </Container>
    </>
  );
}

export default App;
