import { useEffect } from "react";

import { Button } from "@/shared/components/ui/button";
import { DOCS_LINKS } from "@/shared/config/docsLinks";
import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";

export function TermsOfServicePage() {
  useDocumentTitle("Terms of Use");

  useEffect(() => {
    window.location.replace(DOCS_LINKS.legal.termsOfUse);
  }, []);

  return (
    <main className="bg-white">
      <div className="container px-4 py-12 sm:py-16">
        <article className="flex w-full max-w-3xl flex-col gap-6 rounded-3xl border border-black-50 bg-white px-6 py-10 text-base leading-relaxed text-black-400 shadow-sm sm:px-10 sm:py-12">
          <header className="flex flex-col gap-4">
            <h1 className="text-3xl font-semibold tracking-tight text-black-500 sm:text-4xl">
              Terms of Use
            </h1>
            <p>
              Our Terms of Use are hosted on our documentation site so the latest
              version is always available.
            </p>
            <p className="text-sm text-black-300">
              You should be redirected automatically. If not, use the button
              below.
            </p>
          </header>
          <div>
            <Button asChild className="rounded-xl px-6">
              <a
                href={DOCS_LINKS.legal.termsOfUse}
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Terms of Use
              </a>
            </Button>
          </div>
        </article>
      </div>
    </main>
  );
}
