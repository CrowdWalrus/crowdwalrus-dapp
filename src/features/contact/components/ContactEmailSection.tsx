import {
  Mail,
  ArrowRight,
  Send,
  HelpCircle,
  Handshake,
  Bug,
} from "lucide-react";
import { Button } from "@/shared/components/ui/button";

const INQUIRY_TYPES = [
  {
    icon: Send,
    title: "Campaigns",
    description: "Questions about launching or managing campaigns",
  },
  {
    icon: HelpCircle,
    title: "Support",
    description: "Technical help and troubleshooting",
  },
  {
    icon: Handshake,
    title: "Partnerships",
    description: "Collaboration and business inquiries",
  },
  {
    icon: Bug,
    title: "Feedback",
    description: "Share ideas and report issues",
  },
];

export function ContactEmailSection() {
  return (
    <>
      {/* Main Email Section - Full Width */}
      <section className="bg-white-50">
        <div className="container px-4">
          <div className="flex flex-col items-center gap-10 py-20 text-center sm:py-28 lg:py-32">
            {/* Icon */}
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-500 shadow-lg shadow-blue-500/25">
              <Mail className="h-10 w-10 text-white-50" />
            </div>

            {/* Title & Description */}
            <div className="flex flex-col gap-4">
              <h2 className="text-3xl font-bold text-black-500 sm:text-4xl lg:text-5xl">
                📬 Get in Touch
              </h2>
              <p className="mx-auto max-w-[550px] text-lg text-black-300">
                For <strong className="text-black-500">all inquiries</strong>{" "}
                including campaigns, verification, partnerships, technical
                support, or general questions
              </p>
            </div>

            {/* Email Button */}
            <div className="flex flex-col items-center gap-4">
              <Button
                asChild
                className="h-14 gap-3 rounded-xl bg-blue-500 px-8 text-lg font-semibold text-white-50 shadow-lg shadow-blue-500/25 transition-all hover:scale-105 hover:bg-blue-600 hover:shadow-xl [&_svg]:size-5"
              >
                <a href="mailto:hello@crowdwalrus.xyz">
                  <Mail className="h-5 w-5" />
                  hello@crowdwalrus.xyz
                  <ArrowRight className="h-5 w-5" />
                </a>
              </Button>
              <span className="text-sm text-black-300">
                We typically respond within 24-48 hours
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Inquiry Types Section */}
      <section className="border-t border-black-50 bg-white-500">
        <div className="container px-4">
          <div className="py-16 sm:py-20">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {INQUIRY_TYPES.map((type, idx) => (
                <div
                  key={idx}
                  className="group flex flex-col items-center gap-4 rounded-2xl border border-black-50 bg-white-50 p-6 text-center shadow-sm transition-all hover:border-blue-200 hover:shadow-lg"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-blue-50 text-blue-500 transition-colors group-hover:bg-blue-500 group-hover:text-white-50">
                    <type.icon className="h-6 w-6" />
                  </div>
                  <div className="flex flex-col gap-2">
                    <h3 className="text-lg font-bold text-black-500">
                      {type.title}
                    </h3>
                    <p className="text-sm text-black-300">{type.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
