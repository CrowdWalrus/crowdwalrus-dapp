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
                We believe fundraising should be open, transparent, and free
                from gatekeepers. CrowdWalrus bridges usability and
                decentralization: you own your campaign, your identity, and your
                impact. By combining the accessibility of Web2 with the
                sovereignty of Web3, we ensure that every creator—whether a
                startup founder, a public good provider, or an artist—can raise
                support without hidden fees, platform lock-ins, or arbitrary
                takedowns.
              </p>
              <p>
                Fundraising should not be limited by geography, privilege, or
                technical expertise. With CrowdWalrus, campaigns become
                permanent, tamper-proof, and owned directly by their creators.
                Every contribution is recorded on-chain, every campaign has a
                clear and auditable history, and every supporter knows their
                impact is real. Our mission is to empower individuals and
                communities to fund on their own terms, building a more
                resilient, transparent, and borderless future for collective
                creation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
