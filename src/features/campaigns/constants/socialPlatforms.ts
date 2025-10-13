import { Globe } from "lucide-react";
import DiscordSocial from "@/shared/icons/socials/DiscordSocial";
import FacebookSocial from "@/shared/icons/socials/FacebookSocial";
import GithubSocial from "@/shared/icons/socials/GithubSocial";
import InstagramSocial from "@/shared/icons/socials/InstagramSocial";
import LinkedInSocial from "@/shared/icons/socials/LinkedInSocial";
import SlackSocial from "@/shared/icons/socials/SlackSocial";
import TelegramSocial from "@/shared/icons/socials/TelegramSocial";
import XSocial from "@/shared/icons/socials/XSocial";

export const SOCIAL_PLATFORM_CONFIG = {
  website: {
    label: "Website",
    icon: Globe,
    placeholder: "https://www.yourwebsite.com",
  },
  twitter: {
    label: "Twitter (X)",
    icon: XSocial,
    placeholder: "https://x.com/username",
  },
  instagram: {
    label: "Instagram",
    icon: InstagramSocial,
    placeholder: "https://instagram.com/username",
  },
  facebook: {
    label: "Facebook",
    icon: FacebookSocial,
    placeholder: "https://facebook.com/username",
  },
  linkedin: {
    label: "LinkedIn",
    icon: LinkedInSocial,
    placeholder: "https://linkedin.com/username",
  },
  discord: {
    label: "Discord",
    icon: DiscordSocial,
    placeholder: "https://discord.gg/username",
  },
  github: {
    label: "GitHub",
    icon: GithubSocial,
    placeholder: "https://github.com/username",
  },
  telegram: {
    label: "Telegram",
    icon: TelegramSocial,
    placeholder: "https://t.me/username",
  },
  slack: {
    label: "Slack",
    icon: SlackSocial,
    placeholder: "https://slack.com/workspace",
  },
} as const;

export type SocialPlatform = keyof typeof SOCIAL_PLATFORM_CONFIG;

export const SOCIAL_PLATFORM_KEYS = Object.keys(
  SOCIAL_PLATFORM_CONFIG,
) as SocialPlatform[];
