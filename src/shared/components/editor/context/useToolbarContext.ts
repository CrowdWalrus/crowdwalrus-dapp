import { createContext, useContext } from "react";
import type { JSX } from "react";
import { LexicalEditor } from "lexical";

export interface ToolbarContextValue {
  activeEditor: LexicalEditor;
  $updateToolbar: () => void;
  blockType: string;
  setBlockType: (blockType: string) => void;
  showModal: (
    title: string,
    showModal: (onClose: () => void) => JSX.Element,
  ) => void;
}

export const ToolbarContext = createContext<ToolbarContextValue>({
  activeEditor: {} as LexicalEditor,
  $updateToolbar: () => {},
  blockType: "paragraph",
  setBlockType: () => {},
  showModal: () => {},
});

export function useToolbarContext(): ToolbarContextValue {
  return useContext(ToolbarContext);
}
