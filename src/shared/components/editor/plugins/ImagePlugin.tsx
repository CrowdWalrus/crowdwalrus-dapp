import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $createParagraphNode, $insertNodes, COMMAND_PRIORITY_EDITOR, createCommand } from "lexical";
import { useEffect } from "react";
import { $createImageNode, ImageNode } from "../nodes/ImageNode";

export const INSERT_IMAGE_COMMAND = createCommand<{ src: string; altText: string }>("INSERT_IMAGE_COMMAND");

export function ImagePlugin() {
  const [editor] = useLexicalComposerContext();

  useEffect(() => {
    if (!editor.hasNodes([ImageNode])) {
      throw new Error("ImagePlugin: ImageNode not registered on editor");
    }

    return editor.registerCommand(
      INSERT_IMAGE_COMMAND,
      (payload) => {
        editor.update(() => {
          const imageNode = $createImageNode(payload);
          $insertNodes([imageNode, $createParagraphNode()]);
        });
        return true;
      },
      COMMAND_PRIORITY_EDITOR
    );
  }, [editor]);

  return null;
}
