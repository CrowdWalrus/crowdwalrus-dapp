import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import {
  $getSelection,
  $isRangeSelection,
  $createParagraphNode,
  FORMAT_ELEMENT_COMMAND,
} from "lexical";
import {
  INSERT_ORDERED_LIST_COMMAND,
  INSERT_UNORDERED_LIST_COMMAND,
  REMOVE_LIST_COMMAND,
  $isListNode,
  ListNode,
} from "@lexical/list";
import { $createHeadingNode, $createQuoteNode, $isHeadingNode, HeadingTagType } from "@lexical/rich-text";
import { $setBlocksType } from "@lexical/selection";
import {
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Type,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import { useCallback, useState, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";

const BLOCK_TYPES = [
  { label: "Paragraph", value: "paragraph", icon: Type },
  { label: "Heading 1", value: "h1", icon: Heading1 },
  { label: "Heading 2", value: "h2", icon: Heading2 },
  { label: "Heading 3", value: "h3", icon: Heading3 },
  { label: "Quote", value: "quote", icon: Quote },
  { label: "Bulleted List", value: "bullet", icon: List },
  { label: "Numbered List", value: "number", icon: ListOrdered },
];

export function BlockFormatToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [blockType, setBlockType] = useState("paragraph");

  const formatParagraph = () => {
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $setBlocksType(selection, () => $createParagraphNode());
      }
    });
  };

  const formatHeading = (headingSize: HeadingTagType) => {
    if (blockType !== headingSize) {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createHeadingNode(headingSize));
        }
      });
    }
  };

  const formatQuote = () => {
    if (blockType !== "quote") {
      editor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $setBlocksType(selection, () => $createQuoteNode());
        }
      });
    }
  };

  const formatBulletList = () => {
    if (blockType !== "bullet") {
      editor.dispatchCommand(INSERT_UNORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatNumberedList = () => {
    if (blockType !== "number") {
      editor.dispatchCommand(INSERT_ORDERED_LIST_COMMAND, undefined);
    } else {
      editor.dispatchCommand(REMOVE_LIST_COMMAND, undefined);
    }
  };

  const formatAlign = (alignment: "left" | "center" | "right") => {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
  };

  const handleBlockTypeChange = (value: string) => {
    switch (value) {
      case "paragraph":
        formatParagraph();
        break;
      case "h1":
        formatHeading("h1");
        break;
      case "h2":
        formatHeading("h2");
        break;
      case "h3":
        formatHeading("h3");
        break;
      case "quote":
        formatQuote();
        break;
      case "bullet":
        formatBulletList();
        break;
      case "number":
        formatNumberedList();
        break;
    }
  };

  useEffect(() => {
    return editor.registerUpdateListener(({ editorState }) => {
      editorState.read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchorNode = selection.anchor.getNode();
          const element =
            anchorNode.getKey() === "root"
              ? anchorNode
              : anchorNode.getTopLevelElementOrThrow();

          const elementKey = element.getKey();
          const elementDOM = editor.getElementByKey(elementKey);

          if (elementDOM !== null) {
            if ($isListNode(element)) {
              const parentList = (element as ListNode).getListType();
              setBlockType(parentList);
            } else {
              const type = $isHeadingNode(element)
                ? element.getTag()
                : element.getType();
              setBlockType(type);
            }
          }
        }
      });
    });
  }, [editor]);

  return (
    <>
      <Select value={blockType} onValueChange={handleBlockTypeChange}>
        <SelectTrigger className="w-[140px] h-8">
          <SelectValue placeholder="Block type" />
        </SelectTrigger>
        <SelectContent>
          {BLOCK_TYPES.map((type) => {
            const Icon = type.icon;
            return (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <Icon className="size-4" />
                  <span>{type.label}</span>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatAlign("left")}
        className="size-8 p-0"
      >
        <AlignLeft className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatAlign("center")}
        className="size-8 p-0"
      >
        <AlignCenter className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatAlign("right")}
        className="size-8 p-0"
      >
        <AlignRight className="size-4" />
      </Button>
      <Separator orientation="vertical" className="h-6 mx-1" />
    </>
  );
}
