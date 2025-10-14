interface LexicalNode {
  text?: string;
  children?: LexicalNode[];
  [key: string]: unknown;
}

interface LexicalSerializedState {
  root?: {
    children?: LexicalNode[];
  };
  [key: string]: unknown;
}

function collectText(node: LexicalNode | null | undefined, buffer: string[]) {
  if (!node) {
    return;
  }

  if (typeof node.text === "string" && node.text.trim().length > 0) {
    buffer.push(node.text.trim());
  }

  if (Array.isArray(node.children)) {
    node.children.forEach((child) => collectText(child, buffer));
  }
}

/**
 * Convert a Lexical editor serialized state (JSON string) into plain text.
 * Falls back to empty string if parsing fails.
 */
export function lexicalToPlainText(serialized: string | null | undefined): string {
  if (!serialized) {
    return "";
  }

  try {
    const parsed = JSON.parse(serialized) as LexicalSerializedState;
    const rootChildren = Array.isArray(parsed?.root?.children)
      ? parsed.root?.children
      : [];

    const parts: string[] = [];
    rootChildren.forEach((child) => collectText(child, parts));

    return parts.join(" ").replace(/\s+/g, " ").trim();
  } catch (error) {
    console.warn("Failed to parse Lexical state for plain text conversion:", error);
    return "";
  }
}

export function lexicalToSummary(
  serialized: string | null | undefined,
  maxLength = 220,
): string {
  const plain = lexicalToPlainText(serialized);
  if (!plain) {
    return "";
  }

  if (plain.length <= maxLength) {
    return plain;
  }

  return `${plain.slice(0, maxLength - 1).trimEnd()}…`;
}
