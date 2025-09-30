import { useState } from "react";
import { Container, Heading } from "@radix-ui/themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentAccount } from "@mysten/dapp-kit";
import { useCreateCampaign } from "@/hooks/useCreateCampaign";
import type { CampaignFormData, CampaignCreationProgress } from "@/types/campaign";

export function TestPage() {
  const currentAccount = useCurrentAccount();
  const { mutate: createCampaign, isPending, currentStep, error, data } = useCreateCampaign();

  // Default test values
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setHours(date.getHours() + 1);
    return date.toISOString().slice(0, 16);
  };

  const getDefaultEndDate = () => {
    const date = new Date();
    date.setDate(date.getDate() + 30);
    return date.toISOString().slice(0, 16);
  };

  // Form state (prefilled for testing)
  const [name, setName] = useState("Save the Ocean Campaign");
  const [shortDescription, setShortDescription] = useState("Help us protect marine life and clean our oceans. Join us in making a difference for future generations!");
  const [subdomain, setSubdomain] = useState("save-the-ocean");
  const [category, setCategory] = useState("social");
  const [fundingGoal, setFundingGoal] = useState("10000");
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [fullDescription, setFullDescription] = useState("This is a comprehensive campaign to save our oceans. We will focus on cleaning up plastic waste, protecting endangered marine species, and educating communities about ocean conservation. Your contribution will directly support our cleanup efforts and research programs.");
  const [coverImage, setCoverImage] = useState<File | null>(null);
  const [socialTwitter, setSocialTwitter] = useState("https://twitter.com/savetheocean");
  const [socialDiscord, setSocialDiscord] = useState("https://discord.gg/savetheocean");

  // Progress tracking
  const [progressMessage, setProgressMessage] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentAccount) {
      alert("Please connect your wallet first!");
      return;
    }

    if (!coverImage) {
      alert("Please select a cover image!");
      return;
    }

    const formData: CampaignFormData = {
      name,
      short_description: shortDescription,
      subdomain_name: subdomain,
      category,
      funding_goal: fundingGoal,
      start_date: new Date(startDate),
      end_date: new Date(endDate),
      full_description: fullDescription,
      cover_image: coverImage,
      social_twitter: socialTwitter || undefined,
      social_discord: socialDiscord || undefined,
    };

    console.log("=== CAMPAIGN CREATION START ===");
    console.log("Connected Wallet:", currentAccount.address);
    console.log("Network:", "testnet");
    console.log("\n--- Form Data ---");
    console.log("Name:", formData.name);
    console.log("Short Description:", formData.short_description);
    console.log("Subdomain:", formData.subdomain_name);
    console.log("Category:", formData.category);
    console.log("Funding Goal:", formData.funding_goal, "SUI");
    console.log("Start Date:", formData.start_date.toISOString());
    console.log("End Date:", formData.end_date.toISOString());
    console.log("Start Date (Unix):", Math.floor(formData.start_date.getTime() / 1000));
    console.log("End Date (Unix):", Math.floor(formData.end_date.getTime() / 1000));
    console.log("Full Description Length:", formData.full_description.length, "chars");
    console.log("Cover Image:", {
      name: coverImage.name,
      size: coverImage.size,
      type: coverImage.type,
    });
    console.log("Social Twitter:", formData.social_twitter || "Not provided");
    console.log("Social Discord:", formData.social_discord || "Not provided");
    console.log("================================\n");

    createCampaign(
      { formData, options: {
        network: 'testnet',
        onProgress: (progress: CampaignCreationProgress) => {
          console.log(`[Progress] ${progress.step}: ${progress.message}`);
          setProgressMessage(progress.message);
        }
      }},
      {
        onSuccess: (result) => {
          console.log("\n=== CAMPAIGN CREATED SUCCESSFULLY ===");
          console.log("Campaign ID:", result.campaignId);
          console.log("Transaction Digest:", result.transactionDigest);
          console.log("Walrus Blob ID:", result.walrusBlobId);
          console.log("Subdomain:", result.subdomain);
          console.log("Description URL:", result.walrusDescriptionUrl);
          console.log("Cover Image URL:", result.walrusCoverImageUrl);
          console.log("=====================================\n");
        },
        onError: (error) => {
          console.error("\n=== CAMPAIGN CREATION FAILED ===");
          console.error("Error:", error);
          console.error("================================\n");
        },
      }
    );
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverImage(file);
    }
  };

  const handleReset = () => {
    setName("Save the Ocean Campaign");
    setShortDescription("Help us protect marine life and clean our oceans. Join us in making a difference for future generations!");
    setSubdomain("save-the-ocean");
    setCategory("social");
    setFundingGoal("10000");
    setStartDate(getDefaultStartDate());
    setEndDate(getDefaultEndDate());
    setFullDescription("This is a comprehensive campaign to save our oceans. We will focus on cleaning up plastic waste, protecting endangered marine species, and educating communities about ocean conservation. Your contribution will directly support our cleanup efforts and research programs.");
    setCoverImage(null);
    setSocialTwitter("https://twitter.com/savetheocean");
    setSocialDiscord("https://discord.gg/savetheocean");
  };

  return (
    <Container mt="5" pt="2" px="4" className="max-w-4xl">
      <Heading size="8" mb="6">
        Create Campaign
      </Heading>

      {/* Wallet Status */}
      {!currentAccount && (
        <Card className="mb-6 border-yellow-500">
          <CardContent className="pt-6">
            <p className="text-yellow-600">Please connect your wallet to create a campaign</p>
          </CardContent>
        </Card>
      )}

      {/* Status Display */}
      {isPending && (
        <Card className="mb-6 border-blue-500">
          <CardContent className="pt-6">
            <p className="font-semibold">Status: {currentStep}</p>
            <p className="text-sm text-muted-foreground">{progressMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-red-500">
          <CardContent className="pt-6">
            <p className="text-red-600 font-semibold">Error: {error.message}</p>
          </CardContent>
        </Card>
      )}

      {/* Success Display */}
      {data && (
        <Card className="mb-6 border-green-500">
          <CardContent className="pt-6">
            <p className="text-green-600 font-semibold mb-4">Campaign Created Successfully!</p>
            <div className="space-y-2 text-sm">
              <p><strong>Campaign ID:</strong> {data.campaignId}</p>
              <p><strong>Subdomain:</strong> {data.subdomain}.crowdwalrus-test.sui</p>
              <p><strong>Transaction:</strong> {data.transactionDigest}</p>
              <p><strong>Walrus Blob ID:</strong> {data.walrusBlobId}</p>
              <p><strong>Description URL:</strong> {data.walrusDescriptionUrl}</p>
              <p><strong>Cover Image URL:</strong> {data.walrusCoverImageUrl}</p>
            </div>
          </CardContent>
        </Card>
      )}

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Essential details about your campaign</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Campaign Name</Label>
                <Input
                  id="name"
                  placeholder="Enter campaign name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="short_description">Short Description</Label>
                <Textarea
                  id="short_description"
                  placeholder="Brief summary (max ~280 chars)"
                  rows={3}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  maxLength={280}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="subdomain">Subdomain Name</Label>
                <Input
                  id="subdomain"
                  placeholder="my-campaign"
                  value={subdomain}
                  onChange={(e) => setSubdomain(e.target.value.toLowerCase())}
                  pattern="[a-z0-9-]+"
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Your campaign will be accessible at: {subdomain || 'subdomain'}.crowdwalrus-test.sui
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={category} onValueChange={setCategory} required>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="art">Art</SelectItem>
                    <SelectItem value="games">Games</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="social">Social Impact</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Fundraising Details */}
          <Card>
            <CardHeader>
              <CardTitle>Fundraising Details</CardTitle>
              <CardDescription>Set your funding goals and timeline</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="funding_goal">Funding Goal (SUI)</Label>
                <Input
                  id="funding_goal"
                  type="number"
                  placeholder="10000"
                  value={fundingGoal}
                  onChange={(e) => setFundingGoal(e.target.value)}
                  min="0"
                  step="0.01"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Start Date</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="end_date">End Date</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Rich Content */}
          <Card>
            <CardHeader>
              <CardTitle>Rich Content</CardTitle>
              <CardDescription>Tell your campaign story with text and images</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="full_description">Full Description</Label>
                <Textarea
                  id="full_description"
                  placeholder="Complete campaign story"
                  rows={8}
                  value={fullDescription}
                  onChange={(e) => setFullDescription(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cover_image">Cover Image</Label>
                <Input
                  id="cover_image"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  required
                />
                {coverImage && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {coverImage.name} ({(coverImage.size / 1024).toFixed(2)} KB)
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact & Social */}
          <Card>
            <CardHeader>
              <CardTitle>Social Links</CardTitle>
              <CardDescription>Connect with your backers (optional)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="social_twitter">Twitter/X</Label>
                <Input
                  id="social_twitter"
                  type="url"
                  placeholder="https://twitter.com/..."
                  value={socialTwitter}
                  onChange={(e) => setSocialTwitter(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="social_discord">Discord</Label>
                <Input
                  id="social_discord"
                  type="url"
                  placeholder="https://discord.gg/..."
                  value={socialDiscord}
                  onChange={(e) => setSocialDiscord(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-4 justify-end pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isPending}
            >
              Reset Form
            </Button>
            <Button
              type="submit"
              disabled={isPending || !currentAccount}
            >
              {isPending ? "Creating..." : "Create Campaign"}
            </Button>
          </div>
        </div>
      </form>
    </Container>
  );
}
