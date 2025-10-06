import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection } from "lexical";
import { TOGGLE_LINK_COMMAND, $isLinkNode } from "@lexical/link";
import { Link, Unlink } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { useEffect, useState } from "react";
import { Input } from "@/shared/components/ui/input";

interface LinkToolbarPluginProps {
  disabled?: boolean;
}

export function LinkToolbarPlugin({ disabled = false }: LinkToolbarPluginProps) {
  const [editor] = useLexicalComposerContext();
  const [linkUrl, setLinkUrl] = useState("");
  const [isLink, setIsLink] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const insertLink = () => {
    if (disabled) return;
    if (linkUrl) {
      // Ensure URL has protocol
      let url = linkUrl;
      if (!url.startsWith("http://") && !url.startsWith("https://")) {
        url = "https://" + url;
      }
      editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
      setLinkUrl("");
      setIsOpen(false);
    }
  };

  const removeLink = () => {
    if (disabled) return;
    editor.dispatchCommand(TOGGLE_LINK_COMMAND, null);
  };

  const checkForLink = () => {
    if (disabled) return;
    editor.getEditorState().read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const node = selection.anchor.getNode();
        const parent = node.getParent();
        if ($isLinkNode(parent) || $isLinkNode(node)) {
          setIsLink(true);
        } else {
          setIsLink(false);
        }
      }
    });
  };

  useEffect(() => {
    if (disabled) {
      setIsOpen(false);
    }
  }, [disabled]);

  return (
    <>
      <Separator orientation="vertical" className="h-6 mx-1" />
      {isLink ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={removeLink}
          className="size-8 p-0"
          disabled={disabled}
        >
          <Unlink className="size-4" />
        </Button>
      ) : (
        <Popover
          open={disabled ? false : isOpen}
          onOpenChange={disabled ? undefined : setIsOpen}
        >
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkForLink}
              className="size-8 p-0"
              disabled={disabled}
            >
              <Link className="size-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Insert Link</h4>
              <Input
                placeholder="https://example.com"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    insertLink();
                  }
                }}
                disabled={disabled}
              />
              <Button
                onClick={insertLink}
                size="sm"
                className="w-full"
                disabled={disabled}
              >
                Insert
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </>
  );
}
