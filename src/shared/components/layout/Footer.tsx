import DiscordSocial from "@/shared/icons/socials/DiscordSocial";
import GithubSocial from "@/shared/icons/socials/GithubSocial";
import TelegramSocial from "@/shared/icons/socials/TelegramSocial";
import XSocial from "@/shared/icons/socials/XSocial";
import { DOCS_BASE_URL, DOCS_LINKS } from "@/shared/config/docsLinks";

const SOCIAL_LINKS = [
  {
    icon: DiscordSocial,
    label: "Discord",
    href: "https://discord.gg/EECHcV2n7A",
  },
  {
    icon: GithubSocial,
    label: "GitHub",
    href: "https://github.com/CrowdWalrus",
  },
  {
    icon: XSocial,
    label: "X (Twitter)",
    href: "https://x.com/crowdwalrus",
  },
  {
    icon: TelegramSocial,
    label: "Telegram",
    href: "https://t.me/crowdwalrus",
  },
];

const FOOTER_LINK_GROUPS = [
  {
    title: "Platform Overview",
    links: [
      { label: "What is CrowdWalrus", href: DOCS_LINKS.startHere.whatIsCrowdWalrus },
      {
        label: "How CrowdWalrus Works",
        href: DOCS_LINKS.startHere.howCrowdWalrusWorks,
      },
      {
        label: "Key Concepts Glossary",
        href: DOCS_LINKS.startHere.keyConceptsGlossary,
      },
      {
        label: "Install a Sui Wallet",
        href: DOCS_LINKS.gettingStarted.installSuiWallet,
      },
      { label: "Get SUI for Gas", href: DOCS_LINKS.gettingStarted.getSuiForGas },
    ],
  },
  {
    title: "Support Center",
    links: [
      { label: "FAQ", href: DOCS_LINKS.help.faq },
      { label: "Troubleshooting", href: DOCS_LINKS.help.troubleshooting },
      {
        label: "Verification Overview",
        href: DOCS_LINKS.trustSafety.verificationOverview,
      },
      { label: "Reporting Abuse", href: DOCS_LINKS.trustSafety.reportingAbuse },
    ],
  },
  {
    title: "Resources",
    links: [
      {
        label: "Launch a Campaign",
        href: DOCS_LINKS.campaignOwners.launchCampaign,
      },
      {
        label: "Campaign Writing Toolkit",
        href: DOCS_LINKS.campaignOwners.campaignWritingToolkit,
      },
      {
        label: "Managing Your Campaign",
        href: DOCS_LINKS.campaignOwners.managingCampaign,
      },
      {
        label: "How to Contribute",
        href: DOCS_LINKS.donors.howToContribute,
      },
      {
        label: "Developer APIs",
        href: DOCS_LINKS.developers.indexerAndApis,
      },
    ],
  },
  {
    title: "Compliance",
    links: [
      { label: "Terms of Use", href: DOCS_LINKS.legal.termsOfUse },
      { label: "Privacy Policy", href: DOCS_LINKS.legal.privacyPolicy },
      { label: "Disclaimer", href: DOCS_LINKS.legal.disclaimer },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="border-t border-black-50 bg-white-50">
      <div className="container px-4">
        <div className="flex flex-col gap-12 py-16">
          <div className="flex flex-col gap-12 lg:flex-row lg:gap-[90px]">
            <div className="flex w-full max-w-[384px] flex-col gap-5">
              <a
                href={DOCS_BASE_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2"
                aria-label="CrowdWalrus documentation"
              >
                <img
                  src="/assets/images/brand/logo.png"
                  alt="CrowdWalrus logo"
                  className="h-12 w-auto"
                />
                <span className="text-2xl font-bold leading-[1.5]">
                  <span className="text-black-500">Crowd</span>
                  <span className="text-blue-500">Walrus</span>
                </span>
              </a>
              <p className="text-base leading-[1.5] text-black-200">
                Introducing a revolutionary web3 crowdfunding platform that
                empowers creators and innovators to raise funds directly from
                their community.
              </p>
              <div className="flex items-center gap-4">
                {SOCIAL_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-black-200 transition-colors hover:text-black-500"
                    aria-label={link.label}
                  >
                    <link.icon size={24} />
                  </a>
                ))}
              </div>
            </div>

            <div className="flex-1">
              <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
                {FOOTER_LINK_GROUPS.map((group) => (
                  <div key={group.title} className="flex flex-col gap-4">
                    <p className="text-sm font-semibold uppercase leading-[1.5] text-black-500">
                      {group.title}
                    </p>
                    <div className="flex flex-col gap-4">
                      {group.links.map((link) => (
                        <a
                          key={link.label}
                          href={link.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-base leading-[1.5] text-black-200 transition-colors hover:text-black-500"
                        >
                          {link.label}
                        </a>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="border-t border-black-50 pt-8">
            <p className="text-center text-base leading-[1.5] text-black-200">
              © {new Date().getFullYear()} CrowdWalrus, Inc. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
