import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

import { Button } from "@/shared/components/ui/button";
import { ROUTES } from "@/shared/config/routes";
import { DOCS_BASE_URL } from "@/shared/config/docsLinks";

export function AboutCtaSection() {
  return (
    <section className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600">
      <div className="container px-4">
        <div className="flex flex-col items-center gap-8 py-20 text-center sm:py-28 lg:py-32">
          <h2 className="max-w-[800px] text-3xl font-bold leading-tight text-white-50 sm:text-4xl lg:text-5xl">
            Thank You for Being Part of the Journey
          </h2>
          <p className="max-w-[600px] text-lg text-white-50/90">
            CrowdWalrus is no longer accepting new campaigns or contributions.
            This website remains available as an archive of the project. Have a
            question or want to stay in touch? We&apos;d love to hear from you.
          </p>

          <div className="flex flex-col gap-4 pt-4 sm:flex-row sm:gap-6">
            <Button
              asChild
              className="h-[56px] justify-center rounded-[10px] bg-white-50 px-8 py-4 text-base font-semibold text-blue-500 shadow-none hover:bg-white-100"
            >
              <Link to={ROUTES.CONTACT}>Contact Us</Link>
            </Button>
            <Button
              asChild
              className="h-[56px] justify-center gap-3 rounded-[10px] border-2 border-white-50 bg-transparent px-8 py-4 text-base font-semibold text-white-50 shadow-none hover:bg-white-50/10 [&_svg]:size-5"
            >
              <a href={DOCS_BASE_URL} target="_blank" rel="noopener noreferrer">
                Read Docs
                <ArrowRight />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
