import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary";
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin";
import { ListPlugin } from "@lexical/react/LexicalListPlugin";
import { LinkPlugin as LexicalLinkPlugin } from "@lexical/react/LexicalLinkPlugin";

import { ContentEditable } from "@/shared/components/editor/editor-ui/content-editable";
import { ToolbarPlugin } from "@/shared/components/editor/plugins/ToolbarPlugin";
import { ImagePlugin } from "@/shared/components/editor/plugins/ImagePlugin";
import { BlockFormatToolbarPlugin } from "@/shared/components/editor/plugins/BlockFormatToolbarPlugin";
import { LinkToolbarPlugin } from "@/shared/components/editor/plugins/LinkPlugin";

interface PluginsProps {
  readOnly?: boolean;
}

export function Plugins({ readOnly = false }: PluginsProps) {
  return (
    <>
      {/* toolbar plugins */}
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2 bg-background overflow-x-auto">
        <BlockFormatToolbarPlugin disabled={readOnly} />
        <ToolbarPlugin disabled={readOnly} />
        <LinkToolbarPlugin disabled={readOnly} />
      </div>
      <div className="relative">
        <RichTextPlugin
          contentEditable={
            <div>
              <div>
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
  );
}
