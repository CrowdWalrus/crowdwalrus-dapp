import { Mail, ArrowRight } from "lucide-react";
import { Button } from "@/shared/components/ui/button";

export function ContactCtaSection() {
  return (
    <section className="bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600">
      <div className="container px-4">
        <div className="flex flex-col items-center gap-8 py-20 text-center sm:py-28 lg:py-32">
          <div className="flex max-w-[800px] flex-col gap-6">
            <h2 className="text-3xl font-bold leading-tight text-white-50 sm:text-4xl lg:text-5xl">
              Not Sure Where to Start?
            </h2>
            <p className="mx-auto max-w-[600px] text-lg text-white-50/90">
              Just email us at{" "}
              <strong className="text-white-50">hello@crowdwalrus.xyz</strong>{" "}
              and we'll take it from there.
            </p>
          </div>

          <div className="flex flex-col items-center gap-4 pt-4 sm:flex-row sm:gap-6">
            <Button
              asChild
              className="h-14 gap-3 rounded-xl bg-white-50 px-8 text-lg font-semibold text-blue-500 shadow-lg transition-all hover:scale-105 hover:bg-white-100 hover:shadow-xl [&_svg]:size-5"
            >
              <a href="mailto:hello@crowdwalrus.xyz">
                <Mail className="h-5 w-5" />
                Email Us Now
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
          </div>

          {/* Tagline */}
          <div className="flex flex-col items-center gap-4 pt-8">
            <div className="h-px w-16 bg-white-50/30" />
            <p className="text-xl font-bold text-white-50">
              No gatekeepers. No middlemen.
              <br />
              <span className="text-sky-300">
                Just you and your community.
              </span>{" "}
              🐘
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
