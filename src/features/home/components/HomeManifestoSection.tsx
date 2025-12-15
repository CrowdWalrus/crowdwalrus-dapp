export function HomeManifestoSection() {
  return (
    <section className="relative overflow-hidden bg-blue-600">
      {/* Background pattern */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.14]">
        <img
          src="/assets/images/background-images/manifesto-bg-pattern.svg"
          alt=""
          className="h-full w-full object-cover"
        />
      </div>

      <div className="relative">
        <div className="container px-4">
          <div className="flex flex-col gap-8 py-[100px] text-white-50">
            <h2 className="text-4xl font-semibold leading-[1.2] tracking-[0.48px] sm:text-5xl">
              Our Manifesto
            </h2>

            <div className="flex max-w-[1000px] flex-col gap-5 text-base leading-[1.8] text-white-50/90 sm:text-lg">
              <p>
                We believe fundraising should be open, verifiable, and owned by
                the people doing the work—not gated by platforms or hidden
                rules.
              </p>
              <p>
                CrowdWalrus is built on Sui and Walrus so every campaign can
                have a permanent home, a human-readable subname, and transparent
                contribution tracking—without sacrificing the simplicity people
                expect from Web2.
              </p>
              <p>
                Whether you&apos;re supporting a cause, launching a community
                initiative, or building something new, we&apos;re here to help
                you rally supporters and deliver impact with clarity and
                control.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
