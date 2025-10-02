"use client";

import {
  InitialConfigType,
  LexicalComposer,
} from "@lexical/react/LexicalComposer";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ContentEditable as LexicalContentEditable } from "@lexical/react/LexicalContentEditable";
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin";
import { SerializedEditorState } from "lexical";

import { editorTheme } from "@/shared/components/editor/themes/editor-theme";
import { ImagePlugin } from "@/shared/components/editor/plugins/ImagePlugin";
import { nodes } from "./nodes";

const viewerConfig: InitialConfigType = {
  namespace: "EditorViewer",
  theme: editorTheme,
  nodes,
  editable: false,
  onError: (error: Error) => {
    console.error(error);
  },
};

export function EditorViewer({
  editorSerializedState,
}: {
  editorSerializedState: SerializedEditorState;
}) {
  return (
    <div className="bg-background overflow-hidden rounded-lg">
      <LexicalComposer
        initialConfig={{
          ...viewerConfig,
          editorState: JSON.stringify(editorSerializedState),
        }}
      >
        <RichTextPlugin
          contentEditable={
            <LexicalContentEditable className="ContentEditable__root relative block min-h-24 overflow-auto px-2 py-2 focus:outline-none prose prose-sm max-w-none" />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <ListPlugin />
        <LinkPlugin />
        <ImagePlugin />
      </LexicalComposer>
    </div>
  );
}
