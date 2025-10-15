"use client";

import type { ReactNode } from "react";
import { ToolbarContext, type ToolbarContextValue } from "./useToolbarContext";

export interface ToolbarContextProviderProps extends ToolbarContextValue {
  children: ReactNode;
}

export function ToolbarContextProvider({
  activeEditor,
  $updateToolbar,
  blockType,
  setBlockType,
  showModal,
  children,
}: ToolbarContextProviderProps) {
  return (
    <ToolbarContext.Provider
      value={{
        activeEditor,
        $updateToolbar,
        blockType,
        setBlockType,
        showModal,
      }}
    >
      {children}
    </ToolbarContext.Provider>
  );
}
