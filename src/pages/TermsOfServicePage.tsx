import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";

export function TermsOfServicePage() {
  useDocumentTitle("Terms of Service");

  return (
    <main className="bg-white">
      <div className="container px-4 py-12 sm:py-16">
        <div className="flex justify-center">
          <article className="flex w-full max-w-4xl flex-col gap-12 rounded-3xl border border-black-50 bg-white px-6 py-10 text-base leading-relaxed text-black-400 shadow-sm sm:px-10 sm:py-12">
            <header className="flex flex-col gap-6">
              <h1 className="text-3xl font-semibold tracking-tight text-black-500 sm:text-4xl">
                CrowdWalrus Privacy Policy
              </h1>
              <p className="text-sm text-black-300">Last updated: 2026-01-06</p>
              <p>
                This Privacy Policy explains how we collect, use, disclose and
                protect personal data when you use the CrowdWalrus crowdfunding
                platform (the “Platform”).
              </p>
              <p>The Platform is operated by:</p>
              <address className="flex flex-col gap-1 border-l-2 border-black-50 pl-4 text-black-500 not-italic">
                <p>
                  <strong>General Magic AG</strong>
                </p>
                <p>c/o MJP Partners AG</p>
                <p>Bahnhofstrasse 20</p>
                <p>6300 Zug</p>
                <p>Switzerland</p>
                <p>Email: info@generalmagic.io</p>
              </address>
              <p>
                In this Privacy Policy, “CrowdWalrus”, “we”, “us” or “our” refers
                to General Magic AG as the controller of your personal data for
                the processing described here.
              </p>
              <p>
                We design this Privacy Policy to comply with the
                <strong>
                  {" "}
                  Swiss Federal Act on Data Protection (FADP/nFADP)
                </strong>
                {" "}
                and, where applicable, with the
                <strong> EU/EEA General Data Protection Regulation (GDPR)</strong>
                {" "}
                and similar laws.
              </p>
              <p>
                If you do not agree with this Policy, you should not use the
                Platform.
              </p>
            </header>

            <section className="flex flex-col gap-5">
              <h2 className="text-2xl font-semibold tracking-tight text-black-500">
                1. Scope
              </h2>
              <p>This Privacy Policy applies when you:</p>
              <ul className="flex flex-col gap-2 list-disc pl-6">
                <li>
                  visit or browse <strong>crowdwalrus.xyz</strong> (and related
                  subdomains)
                </li>
                <li>connect a Sui wallet and interact with the Platform</li>
                <li>create or support campaigns as a Raiser or Backer</li>
                <li>communicate with us (e.g. via email or social media)</li>
              </ul>
              <p>It does <strong>not</strong> apply to:</p>
              <ul className="flex flex-col gap-2 list-disc pl-6">
                <li>
                  third-party services you use in connection with CrowdWalrus
                  (for example: your wallet provider, Sui explorers, Walrus
                  storage node operators, analytics providers, social platforms);
                  or
                </li>
                <li>
                  on-chain data on the <strong>Sui blockchain</strong> itself that
                  we do not control.
                </li>
              </ul>
              <p>Those third parties have their own privacy practices.</p>
            </section>

            <section className="flex flex-col gap-7">
              <h2 className="text-2xl font-semibold tracking-tight text-black-500">
                2. Types of data we collect
              </h2>

              <div className="flex flex-col gap-5">
                <h3 className="text-xl font-semibold text-black-500">
                  2.1 Data you provide directly
                </h3>

                <div className="flex flex-col gap-3">
                  <p>
                    <strong>Contact details</strong>
                  </p>
                  <ul className="flex flex-col gap-2 list-disc pl-6">
                    <li>Email address</li>
                    <li>Name or alias (if you provide one)</li>
                    <li>Social profiles or website links you choose to share</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <p>
                    <strong>Profile and campaign data</strong>
                  </p>
                  <ul className="flex flex-col gap-2 list-disc pl-6">
                    <li>Username / display name</li>
                    <li>Profile bio, links and images</li>
                    <li>Campaign title, description, categories, tags and media</li>
                    <li>
                      Any other content you voluntarily submit (text, images,
                      documents, links)
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <p>
                    <strong>Support / communications</strong>
                  </p>
                  <ul className="flex flex-col gap-2 list-disc pl-6">
                    <li>Messages you send to us (support emails, feedback, questions)</li>
                    <li>
                      Our notes about your requests, so we can respond and follow
                      up
                    </li>
                    <li>Your responses to any surveys or research we might run</li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <p>
                    <strong>KYC / compliance data (not by default)</strong>
                  </p>
                  <p>
                    At launch, we do <strong>not</strong> systematically perform
                    KYC checks on users. However, if we are
                    <strong> legally required</strong> to do so in specific cases
                    (for example, by a court order or competent authority), or if
                    future law classifies us as an obliged entity, we may
                    collect:
                  </p>
                  <ul className="flex flex-col gap-2 list-disc pl-6">
                    <li>copies of ID documents</li>
                    <li>proof of address, company documents, beneficial owner details</li>
                    <li>any other information we are legally required to obtain</li>
                  </ul>
                  <p>
                    We will only collect such data when necessary and will
                    explain the purpose and legal basis when we do.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <h3 className="text-xl font-semibold text-black-500">
                  2.2 Data we obtain when you use the Platform
                </h3>

                <div className="flex flex-col gap-3">
                  <p>
                    <strong>Wallet and on-chain identifiers</strong>
                  </p>
                  <ul className="flex flex-col gap-2 list-disc pl-6">
                    <li>Sui wallet address(es) that you connect</li>
                    <li>Campaign IDs linked to your address</li>
                    <li>
                      Transactions, contributions and other interactions that are
                      publicly visible on the Sui blockchain
                    </li>
                  </ul>
                </div>

                <div className="flex flex-col gap-3">
                  <p>
                    <strong>Usage and log data (off-chain)</strong>
                  </p>
                  <p>
                    When you access crowdwalrus.xyz, our infrastructure (e.g.
                    Cloudflare, Walrus-site and our indexer) may automatically
                    collect:
                  </p>
                  <ul className="flex flex-col gap-2 list-disc pl-6">
                    <li>Browser type, operating system, basic device information</li>
                    <li>IP address (stored in server logs)</li>
                    <li>Date and time of access</li>
                    <li>Pages viewed and basic interaction events</li>
                    <li>Referring website / campaign links</li>
                  </ul>
                  <p>
                    We use this primarily for security, debugging and basic usage
                    metrics.
                  </p>
                </div>

                <div className="flex flex-col gap-3">
                  <p>
                    <strong>Cookies and similar technologies</strong>
                  </p>
                  <p>At launch:</p>
                  <ul className="flex flex-col gap-2 list-disc pl-6">
                    <li>
                      We use <strong>only essential cookies/technologies</strong>
                      {" "}
                      needed to operate the site (e.g. security, basic session
                      functionality).
                    </li>
                    <li>
                      We use <strong>privacy-friendly, cookieless analytics</strong>
                      {" "}
                      that do not track you across websites and do not use
                      third-party marketing cookies.
                    </li>
                  </ul>
                  <p>
                    We <strong>do not</strong> use ad/retargeting pixels (e.g.
                    X/Twitter, Meta, Google Ads) at launch.
                  </p>
                  <p>
                    If we introduce additional, non-essential cookies or tracking
                    technologies (e.g. for marketing) in the future, we will:
                  </p>
                  <ul className="flex flex-col gap-2 list-disc pl-6">
                    <li>update this Privacy Policy and our cookie notice, and</li>
                    <li>
                      show you a cookie banner where required by law, allowing
                      you to consent or refuse.
                    </li>
                  </ul>
                </div>
              </div>

              <div className="flex flex-col gap-5">
                <h3 className="text-xl font-semibold text-black-500">
                  2.3 Data from third parties
                </h3>
                <p>Depending on your interactions, we may receive:</p>
                <ul className="flex flex-col gap-2 list-disc pl-6">
                  <li>
                    Basic aggregated analytics about visits and flows from our
                    privacy-friendly analytics tools
                  </li>
                  <li>
                    Error monitoring / crash reports from our infrastructure
                    providers
                  </li>
                  <li>
                    Public information from block explorers or Sui indexing
                    services
                  </li>
                  <li>
                    Public profile data from social networks if you interact with
                    our official accounts there
                  </li>
                </ul>
                <p>We do <strong>not</strong> buy marketing databases from data brokers.</p>
              </div>
            </section>

            <section className="flex flex-col gap-7">
              <h2 className="text-2xl font-semibold tracking-tight text-black-500">
                3. For what purposes do we use your data?
              </h2>
              <p>
                We use your personal data for the following purposes and, where
                necessary, on the following legal bases:
              </p>

              <div className="flex flex-col gap-5">
                <h3 className="text-xl font-semibold text-black-500">
                  3.1 Operating the Platform and providing services
                </h3>
                <ul className="flex flex-col gap-2 list-disc pl-6">
                  <li>Allow you to browse and use the Platform at <strong>crowdwalrus.xyz</strong></li>
                  <li>Enable you to connect your Sui wallet and interact with campaigns</li>
                  <li>Allow you to create, update and display campaigns and profiles</li>
                  <li>Facilitate peer-to-peer contributions between Backers and Raisers</li>
                  <li>Render and serve campaign content stored via <strong>Walrus storage</strong></li>
                </ul>
                <p>
                  <strong>Legal basis</strong>: performance of a contract or
                  pre-contractual steps (Art. 6(1)(b) GDPR, where applicable) and
                  our legitimate interest in providing and growing a functional
                  web3 platform.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <h3 className="text-xl font-semibold text-black-500">
                  3.2 Security, abuse prevention and compliance
                </h3>
                <ul className="flex flex-col gap-2 list-disc pl-6">
                  <li>Protect the Platform, users and infrastructure from abuse and attacks</li>
                  <li>Detect and prevent fraud, spam, technical attacks or other misuse</li>
                  <li>Investigate suspicious activity or violations of our Terms</li>
                  <li>
                    Maintain logs and records reasonably necessary for security and
                    legal/compliance purposes
                  </li>
                  <li>
                    Comply with legal obligations that apply directly to us, including
                    responding to valid court orders or authority requests
                  </li>
                </ul>
                <p>
                  <strong>Legal basis</strong>: our legitimate interests in security
                  and abuse prevention and, where applicable, legal obligations.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <h3 className="text-xl font-semibold text-black-500">
                  3.3 Analytics and product improvement
                </h3>
                <ul className="flex flex-col gap-2 list-disc pl-6">
                  <li>
                    Understand how the Platform is used in aggregate (e.g. page views,
                    popular features, referrers)
                  </li>
                  <li>Measure performance and reliability of features and flows</li>
                  <li>Debug issues and improve stability</li>
                  <li>Develop and prioritise new features and products</li>
                </ul>
                <p>
                  Our analytics are designed to be <strong>privacy-friendly</strong>
                  {" "}
                  (e.g. no cross-site tracking, no third-party marketing cookies,
                  aggregated metrics where possible).
                </p>
                <p>
                  <strong>Legal basis</strong>: our legitimate interest in improving
                  the Platform.
                </p>
                <p>
                  If, in the future, we use cookies or tools that require consent
                  under Swiss/EU law, we will request your consent via a cookie
                  banner.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <h3 className="text-xl font-semibold text-black-500">
                  3.4 Communication with you
                </h3>
                <ul className="flex flex-col gap-2 list-disc pl-6">
                  <li>Respond to your questions and support requests</li>
                  <li>
                    Send important transactional messages (e.g. security notices,
                    critical changes to Terms or this Policy, important service
                    changes)
                  </li>
                  <li>
                    Send occasional <strong>product news and feature updates</strong>
                    {" "}
                    about CrowdWalrus, where permitted
                  </li>
                </ul>
                <p>
                  You can opt out of non-essential product news and updates at any
                  time by using the unsubscribe link in the email or contacting us
                  directly.
                </p>
                <p>
                  <strong>Legal basis</strong>: performance of a contract and our
                  legitimate interest (for operational messages); consent or
                  legitimate interest (for product news/updates, depending on your
                  jurisdiction), with the ability to opt out.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <h3 className="text-xl font-semibold text-black-500">
                  3.5 Legal claims and defence
                </h3>
                <ul className="flex flex-col gap-2 list-disc pl-6">
                  <li>Establish, exercise or defend legal claims</li>
                  <li>
                    Cooperate with competent authorities and regulators where legally
                    required
                  </li>
                </ul>
                <p>
                  <strong>Legal basis</strong>: our legitimate interests and, where
                  applicable, legal obligations.
                </p>
              </div>
            </section>

            <section className="flex flex-col gap-5">
              <h2 className="text-2xl font-semibold tracking-tight text-black-500">
                4. Special note on on-chain and Walrus storage data
              </h2>
              <p>When you interact with the Platform:</p>
              <ul className="flex flex-col gap-2 list-disc pl-6">
                <li>
                  your wallet address, campaign IDs and transaction details are
                  written to the <strong>public Sui blockchain</strong>; and
                </li>
                <li>
                  much of your campaign content (text, images, media) is stored via
                  <strong> Walrus storage</strong>, a decentralised blob storage
                  network.
                </li>
              </ul>
              <p>This has important consequences:</p>
              <ul className="flex flex-col gap-2 list-disc pl-6">
                <li>
                  On-chain and Walrus-stored data may be <strong>public, replicated
                  and content-addressed</strong>.
                </li>
                <li>
                  This data <strong>cannot be fully altered or deleted</strong> by
                  us once published; it may remain available through nodes and
                  mirrors beyond our control.
                </li>
                <li>
                  We cannot “undo” blockchain transactions or retroactively remove
                  content from all Walrus nodes.
                </li>
              </ul>
              <p>We design the Platform so that:</p>
              <ul className="flex flex-col gap-2 list-disc pl-6">
                <li>we don’t require you to put unnecessary personal data on-chain, and</li>
                <li>
                  campaign and profile data stored through Walrus can be
                  <strong> minimised</strong> and controlled by you at the application
                  layer where possible.
                </li>
              </ul>
              <p>
                You should <strong>avoid embedding personal information</strong>
                {" "}
                (e.g. real names, email addresses or IDs) directly in transaction
                memos, campaign IDs or other on-chain or Walrus-level fields that
                are not meant for that.
              </p>
            </section>

            <section className="flex flex-col gap-5">
              <h2 className="text-2xl font-semibold tracking-tight text-black-500">
                5. Cookies, tracking and analytics
              </h2>
              <p>At launch:</p>
              <ul className="flex flex-col gap-2 list-disc pl-6">
                <li>
                  We use only <strong>strictly necessary cookies/technologies</strong>
                  {" "}
                  required to run crowdwalrus.xyz securely (e.g. protection against
                  abuse, basic application state).
                </li>
                <li>
                  We use <strong>privacy-friendly, cookieless analytics</strong> to
                  measure aggregate usage (for example, page views, referrer domains,
                  approximate region), without building behavioural profiles or
                  selling data.
                </li>
              </ul>
              <p>We do <strong>not</strong>:</p>
              <ul className="flex flex-col gap-2 list-disc pl-6">
                <li>
                  use third-party marketing / retargeting pixels (X/Twitter, Meta,
                  Google Ads, LinkedIn, etc.) at launch; or
                </li>
                <li>sell or rent your personal data to advertisers.</li>
              </ul>
              <p>
                If we introduce non-essential cookies or tracking in the future, we
                will update this Policy and provide a cookie banner and/or other
                consent mechanisms where required by law.
              </p>
              <p>You can usually control or delete cookies via your browser settings.</p>
            </section>

            <section className="flex flex-col gap-7">
              <h2 className="text-2xl font-semibold tracking-tight text-black-500">
                6. With whom do we share your personal data?
              </h2>
              <p>We do <strong>not</strong> sell your personal data.</p>
              <p>
                We may share your data with the following categories of recipients:
              </p>

              <div className="flex flex-col gap-5">
                <h3 className="text-xl font-semibold text-black-500">
                  6.1 Service providers (processors)
                </h3>
                <p>
                  Trusted third-party providers who help us run the Platform, such
                  as:
                </p>
                <ul className="flex flex-col gap-2 list-disc pl-6">
                  <li>Hosting and static site delivery (e.g. <strong>Walrus-site</strong>)</li>
                  <li>
                    Edge/network and indexer infrastructure (e.g. <strong>Cloudflare-based
                    indexer</strong>)
                  </li>
                  <li>Logging, monitoring and analytics tools</li>
                  <li>Email delivery providers</li>
                </ul>
                <p>
                  These providers process data only on our instructions and under
                  contracts that include confidentiality and data protection
                  obligations.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <h3 className="text-xl font-semibold text-black-500">
                  6.2 Other users and the public
                </h3>
                <p>Because the Platform is <strong>public by design</strong>:</p>
                <ul className="flex flex-col gap-2 list-disc pl-6">
                  <li>
                    Your <strong>campaigns, profile name, images and descriptions</strong>
                    {" "}
                    will be visible to visitors and other users once you publish
                    them.
                  </li>
                  <li>
                    Your <strong>wallet address and on-chain actions</strong> are
                    inherently public on the Sui blockchain and may be visible via
                    block explorers and third-party indexers.
                  </li>
                  <li>
                    Content stored via Walrus storage is accessible through its
                    content addresses and may be mirrored by third parties.
                  </li>
                </ul>
                <p>
                  You are responsible for choosing what to publish in your public
                  profile and campaign content.
                </p>
              </div>

              <div className="flex flex-col gap-5">
                <h3 className="text-xl font-semibold text-black-500">
                  6.3 Legal and compliance recipients
                </h3>
                <p>We may disclose data where reasonably necessary to:</p>
                <ul className="flex flex-col gap-2 list-disc pl-6">
                  <li>comply with applicable law, court orders or regulatory requests;</li>
                  <li>
                    respond to valid requests from law enforcement or supervisory
                    authorities;
                  </li>
                  <li>
                    detect, prevent or respond to fraud, security incidents or misuse;
                  </li>
                  <li>
                    protect our rights, property or safety, or those of users or third
                    parties.
                  </li>
                </ul>
              </div>
            </section>

            <section className="flex flex-col gap-5">
              <h2 className="text-2xl font-semibold tracking-tight text-black-500">
                7. International transfers
              </h2>
              <p>
                We are based in <strong>Switzerland</strong>, which is recognised by
                the EU as providing an <strong>adequate level of data protection</strong>.
              </p>
              <p>
                However, some of our service providers and infrastructure (including
                Walrus storage and Cloudflare-based services) may process or store
                data on servers located outside Switzerland and the EEA, in various
                regions.
              </p>
              <p>
                Where we transfer personal data to such countries, we take
                appropriate steps to protect it, for example by:
              </p>
              <ul className="flex flex-col gap-2 list-disc pl-6">
                <li>selecting providers with strong security and privacy practices;</li>
                <li>using standard contractual clauses or similar safeguards where required; and</li>
                <li>
                  implementing technical measures (e.g. encryption in transit and at
                  rest) where appropriate.
                </li>
              </ul>
              <p>
                You can contact us for more information about international transfers
                and applicable safeguards.
              </p>
            </section>

            <section className="flex flex-col gap-5">
              <h2 className="text-2xl font-semibold tracking-tight text-black-500">
                8. How long do we keep your data?
              </h2>
              <p>
                We keep personal data only for as long as necessary for the purposes
                described in this Policy, in particular:
              </p>
              <ul className="flex flex-col gap-4 pl-6">
                <li className="list-disc">
                  <strong>
                    Account / profile / campaign data (off-chain application layer)
                  </strong>
                  : for as long as your account is active and for a reasonable period
                  afterwards, for example to handle disputes, logs or audits.
                </li>
                <li className="list-disc">
                  <strong>Communication and support data</strong>: for as long as your
                  account exists and we reasonably need the records for support history
                  and legal purposes.
                </li>
                <li className="list-disc">
                  <strong>Log data (server / infrastructure logs)</strong>: for{" "}
                  <strong>30 days</strong> by default, unless a shorter or longer
                  period is justified to investigate a specific security incident or
                  comply with legal obligations.
                </li>
                <li className="list-disc">
                  <strong>KYC / compliance data (if ever collected)</strong>: only if
                  and when we are legally required to collect it (e.g. by an authority)
                  and then for as long as applicable laws require.
                </li>
              </ul>
              <p>
                After the relevant retention period, we will delete or irreversibly
                anonymise the data we control, unless we are required to keep it
                longer by law.
              </p>
              <p>
                <strong>On-chain and Walrus-level data is not subject to deletion by us</strong>
                {" "}
                (see Section 4).
              </p>
            </section>

            <section className="flex flex-col gap-5">
              <h2 className="text-2xl font-semibold tracking-tight text-black-500">
                9. Security
              </h2>
              <p>
                We take appropriate technical and organisational measures to protect
                personal data against unauthorised access, loss, misuse or alteration,
                including:
              </p>
              <ul className="flex flex-col gap-2 list-disc pl-6">
                <li>encrypted connections (HTTPS)</li>
                <li>access controls and least-privilege principles</li>
                <li>regular security updates and monitoring</li>
                <li>logging and rate limiting on critical endpoints</li>
                <li>backups and disaster recovery processes for essential systems</li>
              </ul>
              <p>
                However, no online service can be completely secure. You are
                responsible for:
              </p>
              <ul className="flex flex-col gap-2 list-disc pl-6">
                <li>keeping your devices and software up to date and secure;</li>
                <li>protecting your wallet, private keys and seed phrase;</li>
                <li>using strong, unique passwords for any associated accounts;</li>
                <li>being careful with phishing attempts and malicious links.</li>
              </ul>
            </section>

            <section className="flex flex-col gap-5">
              <h2 className="text-2xl font-semibold tracking-tight text-black-500">
                10. Your rights
              </h2>
              <p>
                Depending on the law that applies to you (for example Swiss FADP /
                nFADP and, where applicable, GDPR), you may have the following rights
                in relation to your personal data:
              </p>
              <ul className="flex flex-col gap-3 pl-6">
                <li className="list-disc">
                  <strong>Right of access</strong> – to obtain confirmation and
                  information about whether we process your personal data and, where
                  applicable, a copy.
                </li>
                <li className="list-disc">
                  <strong>Right to rectification</strong> – to correct inaccurate or
                  incomplete data.
                </li>
                <li className="list-disc">
                  <strong>Right to erasure</strong> – to ask us to delete your personal
                  data where legally permitted. This does <strong>not</strong> apply
                  to data stored on the Sui blockchain or Walrus storage that we
                  cannot control or remove.
                </li>
                <li className="list-disc">
                  <strong>Right to restriction of processing</strong> – to request
                  that we limit our use of certain data in specific circumstances.
                </li>
                <li className="list-disc">
                  <strong>Right to data portability</strong> – to receive certain data
                  in a structured, commonly used machine-readable format and transmit
                  it to another controller, where applicable.
                </li>
                <li className="list-disc">
                  <strong>Right to object</strong> – to object to processing based on
                  our legitimate interests (for example, analytics or product
                  improvement), in which case we will stop unless we have compelling
                  legitimate reasons.
                </li>
                <li className="list-disc">
                  <strong>Right to withdraw consent</strong> – where we process data
                  based on your consent (for example, future marketing emails or
                  non-essential cookies), you can withdraw consent at any time; this
                  will not affect processing already carried out.
                </li>
              </ul>
              <p>
                To exercise these rights, please contact us at{" "}
                <strong>info@generalmagic.io</strong>. We may need to verify your
                identity before responding.
              </p>
              <p>
                You also have the right to lodge a complaint with your local data
                protection authority. In Switzerland, this is the{" "}
                <strong>
                  Federal Data Protection and Information Commissioner (FDPIC)
                </strong>
                .
              </p>
            </section>

            <section className="flex flex-col gap-5">
              <h2 className="text-2xl font-semibold tracking-tight text-black-500">
                11. Children
              </h2>
              <p>
                The Platform is intended for <strong>adults (18+) only</strong>.
              </p>
              <p>
                We do not knowingly collect personal data from children under 18. If
                you believe that a child under 18 has provided us with personal data,
                please contact us at <strong>info@generalmagic.io</strong> and we
                will take appropriate steps.
              </p>
            </section>

            <section className="flex flex-col gap-5">
              <h2 className="text-2xl font-semibold tracking-tight text-black-500">
                12. Changes to this Privacy Policy
              </h2>
              <p>
                We may update this Privacy Policy from time to time, for example to
                reflect changes in our services, infrastructure, laws or guidance.
              </p>
              <p>When we make material changes, we will:</p>
              <ul className="flex flex-col gap-2 list-disc pl-6">
                <li>update the “Last updated” date at the top; and</li>
                <li>
                  take reasonable steps to inform you (for example, by posting a
                  notice on crowdwalrus.xyz or sending an email where appropriate).
                </li>
              </ul>
              <p>
                Your continued use of the Platform after the updated Policy is
                posted means you accept the changes.
              </p>
            </section>

            <section className="flex flex-col gap-5">
              <h2 className="text-2xl font-semibold tracking-tight text-black-500">
                13. Contact
              </h2>
              <p>
                If you have any questions or concerns about this Privacy Policy or
                CrowdWalrus data practices, you can contact us at:
              </p>
              <address className="flex flex-col gap-1 border-l-2 border-black-50 pl-4 text-black-500 not-italic">
                <p>
                  <strong>General Magic AG</strong>
                </p>
                <p>c/o MJP Partners AG</p>
                <p>Bahnhofstrasse 20</p>
                <p>6300 Zug</p>
                <p>Switzerland</p>
                <p>Email: info@generalmagic.io</p>
              </address>
            </section>
          </article>
        </div>
      </div>
    </main>
  );
}
