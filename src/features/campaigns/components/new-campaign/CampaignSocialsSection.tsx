import { Plus, Globe, X } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import XSocial from "@/shared/icons/socials/XSocial";
import FacebookSocial from "@/shared/icons/socials/FacebookSocial";
import GithubSocial from "@/shared/icons/socials/GithubSocial";
import TelegramSocial from "@/shared/icons/socials/TelegramSocial";
import DiscordSocial from "@/shared/icons/socials/DiscordSocial";
import InstagramSocial from "@/shared/icons/socials/InstagramSocial";
import LinkedInSocial from "@/shared/icons/socials/LinkedInSocial";
import SlackSocial from "@/shared/icons/socials/SlackSocial";

export interface Social {
  platform: string;
  url: string;
}

interface CampaignSocialsSectionProps {
  value: Social[];
  onChange: (socials: Social[]) => void;
}

const PLATFORM_CONFIG = {
  website: {
    label: "Website",
    icon: Globe,
    placeholder: "www.yourwebsite.com",
  },
  twitter: {
    label: "Twitter (X)",
    icon: XSocial,
    placeholder: "x.com/username",
  },
  instagram: {
    label: "Instagram",
    icon: InstagramSocial,
    placeholder: "instagram.com/username",
  },
  facebook: {
    label: "Facebook",
    icon: FacebookSocial,
    placeholder: "facebook.com/username",
  },
  linkedin: {
    label: "LinkedIn",
    icon: LinkedInSocial,
    placeholder: "linkedin.com/username",
  },
  discord: {
    label: "Discord",
    icon: DiscordSocial,
    placeholder: "discord.gg/username",
  },
  github: {
    label: "GitHub",
    icon: GithubSocial,
    placeholder: "github.com/username",
  },
  telegram: {
    label: "Telegram",
    icon: TelegramSocial,
    placeholder: "t.me/username",
  },
  slack: {
    label: "Slack",
    icon: SlackSocial,
    placeholder: "slack.com/workspace",
  },
} as const;

export function CampaignSocialsSection({
  value,
  onChange,
}: CampaignSocialsSectionProps) {
  const handleAddMore = () => {
    onChange([...value, { platform: "website", url: "" }]);
  };

  const handlePlatformChange = (index: number, platform: string) => {
    const newSocials = [...value];
    newSocials[index].platform = platform;
    onChange(newSocials);
  };

  const handleUrlChange = (index: number, url: string) => {
    const newSocials = [...value];
    newSocials[index].url = url;
    onChange(newSocials);
  };

  const handleRemove = (index: number) => {
    const newSocials = value.filter((_, i) => i !== index);
    onChange(newSocials);
  };

  return (
    <div className="flex flex-col gap-4">
      <p className="font-medium text-base leading-[1.6]">Add socials</p>
      <div className="flex flex-col gap-4 w-full">
        {value.map((social, index) => {
          const config =
            PLATFORM_CONFIG[social.platform as keyof typeof PLATFORM_CONFIG];
          const Icon = config?.icon;

          return (
            <div key={index} className="flex gap-4 items-center w-full">
              <Select
                value={social.platform}
                onValueChange={(platform) =>
                  handlePlatformChange(index, platform)
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PLATFORM_CONFIG).map(([value, config]) => {
                    const ItemIcon = config.icon;
                    return (
                      <SelectItem key={value} value={value}>
                        <div className="flex gap-3 items-center">
                          {ItemIcon ? (
                            <ItemIcon className="size-5 shrink-0" />
                          ) : (
                            <div className="size-5 shrink-0" />
                          )}
                          <span>{config.label}</span>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <Input
                placeholder={config?.placeholder || "https://"}
                className="flex-1"
                value={social.url}
                onChange={(e) => handleUrlChange(index, e.target.value)}
              />
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="shrink-0 size-5 flex items-center justify-center text-red-300 hover:text-red-400 transition-colors"
              >
                <X className="size-[15.417px]" />
              </button>
            </div>
          );
        })}

        <Button
          variant="outline"
          size="sm"
          className="w-40"
          onClick={handleAddMore}
          type="button"
        >
          <Plus className="size-[13.25px]" />
          Add more
        </Button>
      </div>
    </div>
  );
}
