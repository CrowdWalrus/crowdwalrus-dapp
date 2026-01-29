import {
  BookOpen,
  ArrowRight,
  FileText,
  Code,
  Shield,
  Rocket,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { DOCS_BASE_URL, DOCS_LINKS } from "@/shared/config/docsLinks";

const DOC_CATEGORIES = [
  {
    icon: Rocket,
    title: "Getting Started",
    description: "Platform basics and first steps",
    href: DOCS_LINKS.startHere.whatIsCrowdWalrus,
  },
  {
    icon: FileText,
    title: "Campaign Creation",
    description: "How to launch your campaign",
    href: DOCS_LINKS.campaignOwners.launchCampaign,
  },
  {
    icon: Shield,
    title: "Verification",
    description: "Badge and trust process",
    href: DOCS_LINKS.trustSafety.verificationOverview,
  },
  {
    icon: Code,
    title: "Developer Resources",
    description: "APIs and integration guides",
    href: DOCS_LINKS.developers.indexerAndApis,
  },
];

export function ContactDocsSection() {
  return (
    <section className="relative overflow-hidden bg-black-500">
      {/* Background Decoration */}
      <div className="pointer-events-none absolute inset-0">
        {/* Top right glow */}
        <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-sky-500/10 blur-3xl" />
        {/* Bottom left glow */}
        <div className="absolute -bottom-32 -left-32 h-[400px] w-[400px] rounded-full bg-purple-500/10 blur-3xl" />
        {/* Center subtle glow */}
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-blue-500/5 blur-3xl" />
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                              linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: "64px 64px",
          }}
        />
      </div>

      <div className="container relative px-4">
        <div className="flex flex-col gap-16 py-20 sm:py-28 lg:py-32">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/20 px-4 py-2 text-sm font-medium text-sky-300">
              <BookOpen className="h-4 w-4" />
              Documentation
            </div>
            <h2 className="max-w-[700px] text-3xl font-bold leading-tight text-white-50 sm:text-4xl lg:text-5xl">
              📚 Everything You Need to Know
            </h2>
            <p className="max-w-[600px] text-lg text-white-700">
              Looking for guides, explanations, or technical details? Our
              documentation covers everything from platform usage to developer
              resources.
            </p>
          </div>

          {/* Doc Categories Grid */}
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {DOC_CATEGORIES.map((category, idx) => (
              <a
                key={idx}
                href={category.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex flex-col gap-4 rounded-2xl border border-black-400 bg-black-400/50 p-6 transition-all hover:border-sky-500/50 hover:bg-black-400/80"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-sky-600 text-white-50">
                  <category.icon className="h-6 w-6" />
                </div>
                <div className="flex flex-col gap-2">
                  <h3 className="text-lg font-bold text-white-50">
                    {category.title}
                  </h3>
                  <p className="text-sm text-white-700">
                    {category.description}
                  </p>
                </div>
              </a>
            ))}
          </div>

          {/* CTA Button */}
          <div className="flex justify-center">
            <Button
              asChild
              className="h-14 gap-3 rounded-xl bg-sky-500 px-8 text-lg font-semibold text-black-500 shadow-lg transition-all hover:scale-105 hover:bg-sky-400 hover:shadow-xl [&_svg]:size-5"
            >
              <a
                href={DOCS_BASE_URL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <BookOpen className="h-5 w-5" />
                Visit Documentation
                <ArrowRight className="h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
