import { Users, ArrowUpRight } from "lucide-react";
import DiscordSocial from "@/shared/icons/socials/DiscordSocial";
import GithubSocial from "@/shared/icons/socials/GithubSocial";
import XSocial from "@/shared/icons/socials/XSocial";
import TelegramSocial from "@/shared/icons/socials/TelegramSocial";

const COMMUNITY_LINKS = [
  {
    icon: DiscordSocial,
    name: "Discord",
    description: "Join our community server for real-time chat and support",
    url: "https://discord.gg/EECHcV2n7A",
    gradient: "from-[#5865F2] to-[#7289DA]",
    hoverBg: "hover:bg-[#5865F2]/10",
  },
  {
    icon: GithubSocial,
    name: "GitHub Discussions",
    description: "Share feedback, ideas, and participate in development",
    url: "https://github.com/crowdwalrus/discussions",
    gradient: "from-black-500 to-black-400",
    hoverBg: "hover:bg-black-500/10",
  },
  {
    icon: XSocial,
    name: "X (Twitter)",
    description: "Follow us for updates, announcements, and news",
    url: "https://x.com/crowdwalrus",
    gradient: "from-black-500 to-black-400",
    hoverBg: "hover:bg-black-500/10",
  },
  {
    icon: TelegramSocial,
    name: "Telegram",
    description: "Join our Telegram group for discussions and alerts",
    url: "https://t.me/crowdwalrus",
    gradient: "from-[#0088cc] to-[#229ED9]",
    hoverBg: "hover:bg-[#0088cc]/10",
  },
];

export function ContactCommunitySection() {
  return (
    <section className="bg-white-50">
      <div className="container px-4">
        <div className="flex flex-col gap-16 py-20 sm:py-28 lg:py-32">
          <div className="flex flex-col items-center gap-6 text-center">
            <div className="inline-flex items-center gap-2 rounded-full bg-purple-500/20 px-4 py-2 text-sm font-medium text-purple-600">
              <Users className="h-4 w-4" />
              Community & Feedback
            </div>
            <h2 className="max-w-[700px] text-3xl font-bold leading-tight text-black-500 sm:text-4xl lg:text-5xl">
              💬 Join the Conversation
            </h2>
            <p className="max-w-[600px] text-lg text-black-300">
              Join the community, ask questions, and help shape CrowdWalrus.
              We're building this together.
            </p>
          </div>

          {/* Social Links Grid */}
          <div className="grid gap-6 sm:grid-cols-2">
            {COMMUNITY_LINKS.map((link, idx) => (
              <a
                key={idx}
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`group relative flex items-start gap-5 rounded-2xl border border-black-50 bg-white-50 p-6 shadow-sm transition-all hover:border-purple-200 hover:shadow-lg ${link.hoverBg}`}
              >
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br ${link.gradient} text-white-50`}
                >
                  <link.icon size={24} />
                </div>
                <div className="flex flex-1 flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-black-500">
                      {link.name}
                    </h3>
                    <ArrowUpRight className="h-4 w-4 text-black-300 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-purple-500" />
                  </div>
                  <p className="text-sm text-black-300">{link.description}</p>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
