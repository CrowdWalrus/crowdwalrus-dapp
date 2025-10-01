import { Link } from "react-router-dom";
import { Upload, X, Plus } from "lucide-react";
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
import { RadioGroup, RadioGroupItem } from "@/shared/components/ui/radio-group";
import { Checkbox } from "@/shared/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Alert, AlertDescription } from "@/shared/components/ui/alert";
import { Card, CardContent } from "@/shared/components/ui/card";

export default function NewCampaignPage() {
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
                  <Label htmlFor="campaign-name">Title *</Label>
                  <Input
                    id="campaign-name"
                    placeholder="Enter your campaign name"
                  />
                </div>

                {/* Description */}
                <div className="flex flex-col gap-4">
                  <Label htmlFor="description">Short description *</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your campaign"
                    rows={4}
                  />
                </div>

                {/* Subdomain */}
                <div>
                  <Label htmlFor="subdomain" className="block pb-4">
                    Sub-name *
                  </Label>
                  <Input id="subdomain" placeholder="yourcampaign" />
                  <p className="text-sm text-muted-foreground pt-2">
                    yourcampaign.crowdwalrus.site
                  </p>
                </div>

                {/* Cover Image */}
                <div>
                  <Label htmlFor="cover-image" className="block pb-4">
                    Cover image *
                  </Label>
                  <Input id="cover-image" type="file" accept="image/*" className="py-1.5" />
                  <p className="text-sm text-muted-foreground pt-2 pb-3">
                    Upload an image minimum 946x432px resolution. JPEG and PNG
                    format. Max up to 5MB.
                  </p>
                  <div className="relative w-full h-[360px] rounded-lg border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden">
                    <img
                      src="https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=946&h=432&fit=crop"
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                    />
                    <Button
                      size="icon"
                      variant="destructive"
                      className="absolute top-5 right-5"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            <Separator className="my-12" />

            {/* Campaign Type Section */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-8">Campaign Type *</h2>

              <RadioGroup defaultValue="flexible" className="flex gap-6">
                <div className="flex items-start space-x-3 flex-1">
                  <RadioGroupItem
                    value="flexible"
                    id="flexible"
                    className="mt-1"
                  />
                  <div className="space-y-1">
                    <Label
                      htmlFor="flexible"
                      className="font-medium cursor-pointer"
                    >
                      Flexible
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      You will receive all funds raised, even if you don't reach
                      your goal
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-3 flex-1">
                  <RadioGroupItem value="fixed" id="fixed" className="mt-1" />
                  <div className="space-y-1">
                    <Label
                      htmlFor="fixed"
                      className="font-medium cursor-pointer"
                    >
                      Fixed (All-or-Nothing)
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      You only receive funds if you reach your goal by the
                      deadline
                    </p>
                  </div>
                </div>
              </RadioGroup>
            </section>

            {/* Select Category Section */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-8">Select Category *</h2>
              <p className="text-muted-foreground mb-6">
                Pick a category that best describes your campaign. You can
                select multiple category options.
              </p>

              <div className="grid grid-cols-2 gap-x-6 gap-y-6">
                {/* Column 1 */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="tech" />
                    <Label
                      htmlFor="tech"
                      className="cursor-pointer font-normal"
                    >
                      Technology
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="education" />
                    <Label
                      htmlFor="education"
                      className="cursor-pointer font-normal"
                    >
                      Education
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="community" />
                    <Label
                      htmlFor="community"
                      className="cursor-pointer font-normal"
                    >
                      Community
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="health" />
                    <Label
                      htmlFor="health"
                      className="cursor-pointer font-normal"
                    >
                      Health
                    </Label>
                  </div>
                </div>

                {/* Column 2 */}
                <div className="space-y-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox id="environment" />
                    <Label
                      htmlFor="environment"
                      className="cursor-pointer font-normal"
                    >
                      Environment
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="arts" />
                    <Label
                      htmlFor="arts"
                      className="cursor-pointer font-normal"
                    >
                      Arts
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="sports" />
                    <Label
                      htmlFor="sports"
                      className="cursor-pointer font-normal"
                    >
                      Sports
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox id="other" />
                    <Label
                      htmlFor="other"
                      className="cursor-pointer font-normal"
                    >
                      Other
                    </Label>
                  </div>
                </div>
              </div>
            </section>

            <Separator className="my-12" />

            {/* Campaign Timeline Section */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-8">
                Campaign Timeline *
              </h2>
              <p className="text-muted-foreground mb-6">
                Set a timeline for your campaign to start and end
              </p>

              <div className="flex gap-4">
                <div className="flex-1">
                  <Input type="date" placeholder="Start date" />
                </div>
                <div className="flex-1">
                  <Input type="date" placeholder="End date" />
                </div>
              </div>
            </section>

            {/* Funding Target Section */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-8">Funding Target *</h2>

              <div className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="target-amount">Target amount (SUI)</Label>
                  <Input
                    id="target-amount"
                    type="number"
                    placeholder="Enter target amount"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="wallet-address">
                    Recipient wallet address *
                  </Label>
                  <Input
                    id="wallet-address"
                    placeholder="0x..."
                    className="font-mono"
                  />
                  <p className="text-sm text-muted-foreground">
                    This is the wallet that will receive all donation funds
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-12" />

            {/* Additional Details Section */}
            <section className="mb-12">
              <h2 className="text-2xl font-semibold mb-8">
                Additional Details
              </h2>

              {/* Add Socials */}
              <div className="mb-10">
                <h3 className="text-lg font-medium mb-6">Add socials</h3>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Select defaultValue="website">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="https://" className="flex-1" />
                  </div>

                  <div className="flex gap-4">
                    <Select defaultValue="twitter">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="https://" className="flex-1" />
                  </div>

                  <div className="flex gap-4">
                    <Select defaultValue="instagram">
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="website">Website</SelectItem>
                        <SelectItem value="twitter">Twitter</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input placeholder="https://" className="flex-1" />
                  </div>

                  <Button variant="outline" size="sm" className="w-40">
                    <Plus className="h-4 w-4" />
                    Add more
                  </Button>
                </div>
              </div>

              {/* Rich Text Editor */}
              <div>
                <div className="mb-4">
                  <Label htmlFor="campaign-details">Campaign details *</Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Add a detailed campaign description, images, links, and
                    attachments.
                  </p>
                </div>
                <div className="border border-border rounded-lg p-4 bg-muted/30 min-h-[400px]">
                  <p className="text-muted-foreground">
                    Rich text editor placeholder
                  </p>
                </div>
              </div>
            </section>

            <Separator className="my-12" />

            {/* Terms and Conditions Section */}
            <section className="mb-12">
              <h3 className="text-lg font-medium mb-6">Terms and conditions</h3>

              <div className="space-y-4">
                <div className="flex items-start space-x-2">
                  <Checkbox id="terms" className="mt-1" />
                  <Label htmlFor="terms" className="cursor-pointer font-normal">
                    By publishing campaign at CrowdWalrus you agree to our Terms
                    and Conditions.
                  </Label>
                </div>

                <Alert>
                  <AlertDescription>
                    Please review your campaign details carefully before
                    registration. Once registered, some details cannot be
                    changed without additional transactions.
                  </AlertDescription>
                </Alert>
              </div>
            </section>

            {/* Storage Registration Section */}
            <section className="mb-12">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold mb-2">
                  Storage registration
                </h2>
                <p className="text-muted-foreground">
                  Review your storage costs, which are based on the files and
                  content occupying space.
                </p>
              </div>

              <Card>
                <CardContent className="p-6">
                  <div className="space-y-4">
                    <div className="flex justify-between py-3 border-b border-border">
                      <span className="font-medium">Campaign metadata</span>
                      <span className="font-mono">0.0024 SUI</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-border">
                      <span className="font-medium">Cover image (2.3 MB)</span>
                      <span className="font-mono">0.0156 SUI</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-border">
                      <span className="font-medium">Campaign description</span>
                      <span className="font-mono">0.0048 SUI</span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-border">
                      <span className="font-medium">
                        Storage epoch (100 years)
                      </span>
                      <span className="font-mono">2.5000 SUI</span>
                    </div>
                    <div className="flex justify-between pt-4">
                      <span className="text-lg font-semibold">
                        Total storage cost
                      </span>
                      <span className="text-lg font-bold font-mono">
                        2.5228 SUI
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>

            <Separator className="my-12" />

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
