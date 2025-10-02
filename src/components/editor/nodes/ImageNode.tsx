import {
  $applyNodeReplacement,
  DecoratorNode,
  DOMExportOutput,
  LexicalNode,
  NodeKey,
  SerializedLexicalNode,
  Spread,
} from "lexical";
import { ReactNode } from "react";

export interface ImagePayload {
  altText: string;
  src: string;
  key?: NodeKey;
}

export type SerializedImageNode = Spread<
  {
    altText: string;
    src: string;
  },
  SerializedLexicalNode
>;

export class ImageNode extends DecoratorNode<ReactNode> {
  __src: string;
  __altText: string;

  static getType(): string {
    return "image";
  }

  static clone(node: ImageNode): ImageNode {
    return new ImageNode(node.__src, node.__altText, node.__key);
  }

  constructor(src: string, altText: string, key?: NodeKey) {
    super(key);
    this.__src = src;
    this.__altText = altText;
  }

  createDOM(): HTMLElement {
    const span = document.createElement("span");
    return span;
  }

  updateDOM(): false {
    return false;
  }

  exportDOM(): DOMExportOutput {
    const element = document.createElement("img");
    element.setAttribute("src", this.__src);
    element.setAttribute("alt", this.__altText);
    return { element };
  }

  static importJSON(serializedNode: SerializedImageNode): ImageNode {
    const { altText, src } = serializedNode;
    return $createImageNode({ altText, src });
  }

  exportJSON(): SerializedImageNode {
    return {
      altText: this.__altText,
      src: this.__src,
      type: "image",
      version: 1,
    };
  }

  decorate(): ReactNode {
    return (
      <img
        src={this.__src}
        alt={this.__altText}
        className="max-w-full h-auto rounded-lg"
      />
    );
  }
}

export function $createImageNode({ altText, src, key }: ImagePayload): ImageNode {
  return $applyNodeReplacement(new ImageNode(src, altText, key));
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
  return node instanceof ImageNode;
}
