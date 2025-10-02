import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext";
import { $getSelection, $isRangeSelection, $isTextNode, FORMAT_TEXT_COMMAND } from "lexical";
import { Bold, Italic, Underline, Strikethrough, Palette, Image } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Separator } from "@/shared/components/ui/separator";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/shared/components/ui/popover";
import { useState, useRef } from "react";
import { HexColorPicker } from "react-colorful";
import { INSERT_IMAGE_COMMAND } from "./ImagePlugin";

export function ToolbarPlugin() {
  const [editor] = useLexicalComposerContext();
  const [color, setColor] = useState("#000000");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const formatText = (format: "bold" | "italic" | "underline" | "strikethrough") => {
    editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
  };

  const handleColorChange = (newColor: string) => {
    setColor(newColor);
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        selection.getNodes().forEach((node) => {
          if ($isTextNode(node)) {
            node.setStyle(`color: ${newColor}`);
          }
        });
      }
    });
  };

  const handleImageUpload = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const src = e.target?.result as string;
        if (src) {
          editor.dispatchCommand(INSERT_IMAGE_COMMAND, {
            src,
            altText: file.name,
          });
        }
      };
      reader.readAsDataURL(file);
    }
    // Reset input so same file can be uploaded again
    event.target.value = "";
  };

  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText("bold")}
        className="size-8 p-0"
      >
        <Bold className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText("italic")}
        className="size-8 p-0"
      >
        <Italic className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText("underline")}
        className="size-8 p-0"
      >
        <Underline className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => formatText("strikethrough")}
        className="size-8 p-0"
      >
        <Strikethrough className="size-4" />
      </Button>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="sm" className="size-8 p-0">
            <Palette className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto">
          <HexColorPicker color={color} onChange={handleColorChange} />
        </PopoverContent>
      </Popover>
      <Separator orientation="vertical" className="h-6 mx-1" />
      <Button
        variant="ghost"
        size="sm"
        onClick={handleImageUpload}
        className="size-8 p-0"
      >
        <Image className="size-4" />
      </Button>
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </>
  );
}
