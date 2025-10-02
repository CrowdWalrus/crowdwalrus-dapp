import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { LinkPlugin as LexicalLinkPlugin } from "@lexical/react/LexicalLinkPlugin"

import { ContentEditable } from "@/shared/components/editor/editor-ui/content-editable"
import { ToolbarPlugin } from "@/shared/components/editor/plugins/ToolbarPlugin"
import { ImagePlugin } from "@/shared/components/editor/plugins/ImagePlugin"
import { BlockFormatToolbarPlugin } from "@/shared/components/editor/plugins/BlockFormatToolbarPlugin"
import { LinkToolbarPlugin } from "@/shared/components/editor/plugins/LinkPlugin"

export function Plugins() {
  return (
    <>
      {/* toolbar plugins */}
      <div className="flex items-center gap-1 border-b border-border p-2 bg-background">
        <BlockFormatToolbarPlugin />
        <ToolbarPlugin />
        <LinkToolbarPlugin />
      </div>
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <div className="">
              <div className="">
                <ContentEditable placeholder={"Start typing ..."} />
              </div>
            </div>
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
      </div>
      {/* editor plugins */}
      <ListPlugin />
      <LexicalLinkPlugin />
      <ImagePlugin />
    </>
  )
}
