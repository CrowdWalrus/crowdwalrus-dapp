import { Link } from "react-router-dom";
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ROUTES } from "@/shared/config/routes";
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbSeparator,
  BreadcrumbPage,
} from "@/shared/components/ui/breadcrumb";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Textarea } from "@/shared/components/ui/textarea";
import { Separator } from "@/shared/components/ui/separator";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  CampaignCoverImageUpload,
  CampaignTypeSelector,
  CampaignCategorySelector,
  CampaignTimeline,
  CampaignFundingTargetSection,
  CampaignSocialsSection,
  CampaignDetailsEditor,
  CampaignStorageRegistrationCard,
  CampaignTermsAndConditionsSection,
  type StorageCost,
} from "@/features/campaigns/components/new-campaign";
import {
  newCampaignSchema,
  type NewCampaignFormData,
} from "@/features/campaigns/schemas/newCampaignSchema";
import { AlertCircleIcon } from "lucide-react";

export default function NewCampaignPage() {
  const form = useForm<NewCampaignFormData>({
    resolver: zodResolver(newCampaignSchema),
    defaultValues: {
      campaignName: "",
      description: "",
      subdomain: "",
      coverImage: "",
      campaignType: "",
      categories: [],
      startDate: "",
      endDate: "",
      targetAmount: "",
      walletAddress: "",
      socials: [
        { platform: "website", url: "" },
        { platform: "twitter", url: "" },
        { platform: "instagram", url: "" },
      ],
      campaignDetails: "",
      termsAccepted: false,
    },
  });

  const onSubmit = (data: NewCampaignFormData) => {
    console.log("Form submitted:", data);
    // TODO: Implement campaign registration logic
  };

  const storageCosts: StorageCost[] = [
    { label: "Campaign metadata", amount: "0.0024 SUI" },
    { label: "Cover image (2.3 MB)", amount: "0.0156 SUI" },
    { label: "Campaign description", amount: "0.0048 SUI" },
    { label: "Storage epoch (100 years)", amount: "2.5000 SUI" },
  ];

  return (
    <FormProvider {...form}>
      <div className="py-8">
        <div className="container">
          {/* Breadcrumb */}
          <Breadcrumb className="mb-8">
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to={ROUTES.HOME}>Home</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Launch Campaign</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>

        <div className="container flex justify-center">
          <div className="w-full max-w-3xl px-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                {/* Page Header */}
                <div className="flex flex-col gap-16">
                  <div className="flex flex-col items-center text-center gap-4 mb-16">
                    <h1 className="text-4xl font-bold mb-4">Launch Campaign</h1>
                    <p className="text-muted-foreground text-base">
                      Enter your campaign details. You can edit campaign details
                      anytime after your publish your campaign, but the transaction
                      will cost gas.
                    </p>
                  </div>

                  {/* Campaign Details Section */}
                  <section className="flex flex-col mb-12 gap-8">
                    <h2 className="text-2xl font-semibold mb-8">Campaign Details</h2>

                    <div className="flex flex-col gap-8">
                      {/* Campaign Name */}
                      <FormField
                        control={form.control}
                        name="campaignName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Title <span className="text-red-300">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Enter your campaign name"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Description */}
                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Short description <span className="text-red-300">*</span>
                            </FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Brief description of your campaign"
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Subdomain */}
                      <FormField
                        control={form.control}
                        name="subdomain"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Sub-name <span className="text-red-300">*</span>
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="yourcampaign" {...field} />
                            </FormControl>
                            <p className="text-sm text-muted-foreground pt-2">
                              yourcampaign.crowdwalrus.site
                            </p>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Cover Image */}
                      <CampaignCoverImageUpload />
                    </div>
                  </section>

                  <Separator />

                  {/* Campaign Type Section */}
                  <CampaignTypeSelector />

                  {/* Select Category Section */}
                  <CampaignCategorySelector />

                  <Separator />

                  {/* Campaign Timeline Section */}
                  <CampaignTimeline />

                  {/* Funding Target Section */}
                  <CampaignFundingTargetSection />

                  <Separator />

                  {/* Additional Details Section */}
                  <section className="flex flex-col gap-8 mb-12">
                    <h2 className="text-2xl font-semibold">Additional Details</h2>

                    {/* Add Socials */}
                    <CampaignSocialsSection />

                    {/* Rich Text Editor */}
                    <CampaignDetailsEditor />
                  </section>

                  <Separator />

                  {/* Terms and Conditions Section */}
                  <CampaignTermsAndConditionsSection />

                  {/* Storage Registration Section */}
                  <CampaignStorageRegistrationCard
                    costs={storageCosts}
                    totalCost="2.5228 SUI"
                  />

                  <Separator />

                  {/* Final Submit Section */}
                  <section className="flex flex-col gap-6">
                    <Alert className="mb-6">
                      <AlertDescription className="flex items-center gap-2">
                        <span className="flex items-center gap-2">
                          <AlertCircleIcon className="size-4" />
                          You can publish campaign after completing the "Register
                          Storage" step
                        </span>
                      </AlertDescription>
                    </Alert>

                    <div className="flex justify-end">
                      <Button type="submit" size="lg" className="min-w-[168px]">
                        Register Campaign
                      </Button>
                    </div>
                  </section>
                </div>
              </form>
            </Form>
          </div>
        </div>
      </div>
    </FormProvider>
  );
}
