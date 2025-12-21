import { Mail, MessageCircle, Sparkles } from "lucide-react";

export function ContactHeroSection() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600">
      {/* Background Pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-10">
        <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-white-50" />
        <div className="absolute -bottom-48 -left-32 h-[400px] w-[400px] rounded-full bg-purple-500" />
        <div className="absolute left-1/2 top-1/2 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-sky-500" />
      </div>

      <div className="relative">
        <div className="container px-4">
          <div className="flex flex-col items-center gap-8 py-20 text-center text-white-50 sm:py-28 lg:py-36">
            <div className="flex max-w-[900px] flex-col gap-6">
              <div className="flex justify-center">
                <div className="inline-flex items-center gap-2 rounded-full bg-white-50/15 px-4 py-2 text-sm font-medium backdrop-blur-sm">
                  <Sparkles className="h-4 w-4" />
                  We'd love to hear from you
                </div>
              </div>

              <h1 className="text-3xl font-bold leading-[1.2] sm:text-5xl lg:text-6xl">
                Get in Touch with{" "}
                <span className="text-sky-300">CrowdWalrus</span>
              </h1>
              <p className="mx-auto max-w-[750px] text-lg font-medium leading-relaxed text-white-50/90 sm:text-xl">
                Whether you're launching a campaign, supporting a project,
                exploring partnerships, or sharing feedback, we're here to help.
              </p>
            </div>

            <div className="flex flex-col gap-3 pt-4 sm:flex-row sm:gap-4">
              <div className="inline-flex items-center gap-2 rounded-full bg-white-50/15 px-5 py-2.5 text-sm font-medium backdrop-blur-sm">
                <Mail className="h-4 w-4" />
                Quick Responses
              </div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white-50/15 px-5 py-2.5 text-sm font-medium backdrop-blur-sm">
                <MessageCircle className="h-4 w-4" />
                Open Communication
              </div>
            </div>

            <p className="pt-6 text-base font-medium text-white-50/80">
              Built on <span className="text-sky-300">Sui blockchain</span> and
              the <span className="text-sky-300">Walrus ecosystem</span>
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
