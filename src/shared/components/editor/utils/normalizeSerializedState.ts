import type { SerializedEditorState } from "lexical";

type SerializedStateWithSelection = SerializedEditorState & {
  selection?: unknown;
};

export function normalizeSerializedEditorState(
  state: SerializedEditorState | null | undefined,
): SerializedEditorState | null {
  if (!state || typeof state !== "object") {
    return state ?? null;
  }

  const stateWithSelection = state as SerializedStateWithSelection;
  const normalized = {
    ...(stateWithSelection as unknown as Record<string, unknown>),
  };

  delete normalized.selection;

  return normalized as unknown as SerializedEditorState;
}

export function normalizeSerializedEditorStateString(
  value: string | null | undefined,
): string {
  if (!value) {
    return "";
  }

  try {
    const parsed = JSON.parse(value) as SerializedEditorState;
    const normalized = normalizeSerializedEditorState(parsed);
    return JSON.stringify(normalized);
  } catch {
    return value;
  }
}
