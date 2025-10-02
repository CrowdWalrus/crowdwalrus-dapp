import { useFormContext, useFieldArray, Controller } from "react-hook-form";
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

export function CampaignSocialsSection() {
  const { control, watch } = useFormContext();
  const { fields, append, remove } = useFieldArray({
    control,
    name: "socials",
  });

  const handleAddMore = () => {
    append({ platform: "website", url: "" });
  };

  const socials = watch("socials");

  return (
    <div className="flex flex-col gap-4">
      <p className="font-medium text-base leading-[1.6]">Add socials</p>
      <div className="flex flex-col gap-4 w-full">
        {fields.map((field, index) => {
          const platformValue = socials?.[index]?.platform || "website";
          const config =
            PLATFORM_CONFIG[platformValue as keyof typeof PLATFORM_CONFIG];

          return (
            <div key={field.id} className="flex gap-4 items-center w-full">
              <Controller
                control={control}
                name={`socials.${index}.platform`}
                render={({ field: controllerField }) => (
                  <Select
                    value={controllerField.value}
                    onValueChange={controllerField.onChange}
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(PLATFORM_CONFIG).map(
                        ([value, config]) => {
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
                        },
                      )}
                    </SelectContent>
                  </Select>
                )}
              />
              <Controller
                control={control}
                name={`socials.${index}.url`}
                render={({ field: controllerField }) => (
                  <Input
                    placeholder={config?.placeholder || "https://"}
                    className="flex-1"
                    {...controllerField}
                  />
                )}
              />
              <button
                type="button"
                onClick={() => remove(index)}
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
