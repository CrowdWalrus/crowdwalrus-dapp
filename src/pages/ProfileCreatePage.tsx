import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm, FormProvider, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { useDocumentTitle } from "@/shared/hooks/useDocumentTitle";
import { ROUTES } from "@/shared/config/routes";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/shared/components/ui/breadcrumb";
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/shared/components/ui/form";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { ProfileAvatarUpload } from "@/features/profiles/components/ProfileAvatarUpload";
import {
  profileCreateSchema,
  type ProfileCreateFormData,
} from "@/features/profiles/schemas/profileCreateSchema";
import { SubnameField } from "@/features/suins/components/SubnameField";
import {
  CampaignSocialsSection,
  CampaignStorageRegistrationCard,
  type StorageCost,
} from "@/features/campaigns/components/new-campaign";
import {
  DEFAULT_NETWORK,
  WALRUS_EPOCH_CONFIG,
} from "@/shared/config/networkConfig";
import { useWalBalance } from "@/shared/hooks/useWalBalance";

const DEFAULT_VALUES: ProfileCreateFormData = {
  profileImage: null,
  fullName: "",
  email: "",
  subdomain: "",
  bio: "",
  socials: [],
};

export default function ProfileCreatePage() {
  useDocumentTitle("Create Profile");

  const form = useForm<ProfileCreateFormData>({
    resolver: zodResolver(profileCreateSchema),
    mode: "onChange",
    defaultValues: DEFAULT_VALUES,
  });

  const profileImageValue = useWatch({
    control: form.control,
    name: "profileImage",
  });

  const [selectedEpochs, setSelectedEpochs] = useState<number>(
    WALRUS_EPOCH_CONFIG[DEFAULT_NETWORK].defaultEpochs,
  );

  const { formattedBalance, isLoading: isBalanceLoading } = useWalBalance();

  const hasProfileImage = profileImageValue instanceof File;

  const storageCosts: StorageCost[] = [];
  const totalCost = hasProfileImage ? "0.00 WAL" : "0.00 WAL";

  const handleEpochsChange = (epochs: number) => {
    const config = WALRUS_EPOCH_CONFIG[DEFAULT_NETWORK];
    const clampedEpochs = Math.min(Math.max(1, epochs), config.maxEpochs);
    setSelectedEpochs(clampedEpochs);
  };

  const handleSubmit = form.handleSubmit((values) => {
    toast.info("Saving profile coming soon.", {
      description:
        "UI and validation are ready. Wallet integration will be added later.",
    });
    console.debug("Profile form submission", values);
  });

  return (
    <FormProvider {...form}>
      <div className="py-8">
        <div className="container px-4">
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={ROUTES.HOME}>Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Create Profile</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="container px-4 flex justify-center">
          <div className="w-full max-w-3xl px-4">
            <Form {...form}>
              <form onSubmit={handleSubmit} className="flex flex-col gap-12">
                <header className="flex flex-col items-center gap-4 text-center">
                  <h1 className="text-4xl font-bold">Create Profile</h1>
                </header>

                <Card className="border-black-50 bg-white">
                  <CardContent className="flex flex-col gap-10 p-6 sm:py-8 sm:px-6">
                    <ProfileAvatarUpload />

                    <div className="grid gap-6 md:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="fullName"
                        render={({ field }) => (
                          <FormItem className="flex flex-col gap-2">
                            <FormLabel className="font-medium text-base">
                              Name
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Add your full name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem className="flex flex-col gap-2">
                            <FormLabel className="font-medium text-base">
                              Email
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Add your email address"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <SubnameField
                      label="Setup your nick name"
                      placeholder="your-name"
                    />

                    <FormField
                      control={form.control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem className="flex flex-col gap-2">
                          <FormLabel className="font-medium text-base">
                            Bio
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Add something about yourself"
                              rows={4}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="socials"
                      render={() => (
                        <FormItem className="flex flex-col gap-2">
                          <CampaignSocialsSection />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>

                <CampaignStorageRegistrationCard
                  costs={storageCosts}
                  totalCost={totalCost}
                  walBalance={
                    isBalanceLoading ? "Loading..." : formattedBalance
                  }
                  selectedEpochs={selectedEpochs}
                  onEpochsChange={handleEpochsChange}
                  disabled={!hasProfileImage}
                  hideRegisterButton={!hasProfileImage}
                  onRegister={() =>
                    toast.info("Walrus storage registration coming soon.")
                  }
                  registrationPeriodSummary="Profile images follow the default storage duration."
                  registrationPeriodHint="Adjustable once profile storage is implemented."
                />

                <div className="flex justify-end">
                  <Button type="submit" size="lg" className="min-w-[160px]">
                    Save Changes
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
