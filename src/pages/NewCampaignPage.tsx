import { useState } from "react";
import { Link } from "react-router-dom";
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
import { Label } from "@/shared/components/ui/label";
import { Textarea } from "@/shared/components/ui/textarea";
import { Separator } from "@/shared/components/ui/separator";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
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
  type Social,
  type StorageCost,
} from "@/features/campaigns/components/new-campaign";

export default function NewCampaignPage() {
  const [coverImage, setCoverImage] = useState<string | null>(null);
  const [campaignType, setCampaignType] = useState("flexible");
  const [categories, setCategories] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [socials, setSocials] = useState<Social[]>([
    { platform: "website", url: "" },
    { platform: "twitter", url: "" },
    { platform: "instagram", url: "" },
  ]);
  const [campaignDetails, setCampaignDetails] = useState("");
  const [termsAccepted, setTermsAccepted] = useState(false);

  const storageCosts: StorageCost[] = [
    { label: "Campaign metadata", amount: "0.0024 SUI" },
    { label: "Cover image (2.3 MB)", amount: "0.0156 SUI" },
    { label: "Campaign description", amount: "0.0048 SUI" },
    { label: "Storage epoch (100 years)", amount: "2.5000 SUI" },
  ];

  return (
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
                <div className="flex flex-col gap-4">
                  <Label htmlFor="campaign-name">
                    Title <span className="text-red-300">*</span>
                  </Label>
                  <Input
                    id="campaign-name"
                    placeholder="Enter your campaign name"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-4">
                  <Label htmlFor="description">
                    Short description <span className="text-red-300">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your campaign"
                    rows={4}
                  />
                </div>

                {/* Subdomain */}
                <div>
                  <Label htmlFor="subdomain" className="block pb-4">
                    Sub-name <span className="text-red-300">*</span>
                  </Label>
                  <Input id="subdomain" placeholder="yourcampaign" />
                  <p className="text-sm text-muted-foreground pt-2">
                    yourcampaign.crowdwalrus.site
                  </p>
                </div>

                {/* Cover Image */}
                <CampaignCoverImageUpload
                  value={coverImage}
                  onChange={setCoverImage}
                />
              </div>
            </section>

            <Separator />

            {/* Campaign Type Section */}
            <CampaignTypeSelector
              value={campaignType}
              onChange={setCampaignType}
            />

            {/* Select Category Section */}
            <CampaignCategorySelector
              value={categories}
              onChange={setCategories}
            />

            <Separator />

            {/* Campaign Timeline Section */}
            <CampaignTimeline
              startDate={startDate}
              endDate={endDate}
              onStartDateChange={setStartDate}
              onEndDateChange={setEndDate}
            />

            {/* Funding Target Section */}
            <CampaignFundingTargetSection
              targetAmount={targetAmount}
              walletAddress={walletAddress}
              onTargetAmountChange={setTargetAmount}
              onWalletAddressChange={setWalletAddress}
            />

            <Separator />

            {/* Additional Details Section */}
            <section className="flex flex-col gap-8 mb-12">
              <h2 className="text-2xl font-semibold">Additional Details</h2>

              {/* Add Socials */}
              <CampaignSocialsSection value={socials} onChange={setSocials} />

              {/* Rich Text Editor */}
              <CampaignDetailsEditor
                value={campaignDetails}
                onChange={setCampaignDetails}
              />
            </section>

            <Separator />

            {/* Terms and Conditions Section */}
            <CampaignTermsAndConditionsSection
              accepted={termsAccepted}
              onAcceptedChange={setTermsAccepted}
            />

            {/* Storage Registration Section */}
            <CampaignStorageRegistrationCard
              costs={storageCosts}
              totalCost="2.5228 SUI"
            />

            <Separator />

            {/* Final Submit Section */}
            <section className="mb-8">
              <Alert className="mb-6">
                <AlertDescription>
                  Registering your campaign will require a blockchain
                  transaction. Make sure you have enough SUI in your wallet to
                  cover gas fees and storage costs.
                </AlertDescription>
              </Alert>

              <div className="flex justify-end">
                <Button size="lg" className="min-w-[168px]">
                  Register Campaign
                </Button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
