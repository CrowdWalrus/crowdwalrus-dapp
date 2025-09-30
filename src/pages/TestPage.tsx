import { Container, Heading, Text } from "@radix-ui/themes";

export function TestPage() {
  return (
    <Container mt="5" pt="2" px="4">
      <Heading size="8" mb="4">
        Test Page
      </Heading>
      <Text>
        This is a test page. You can create similar pages in src/pages/
      </Text>
    </Container>
  );
}
