import { Container, Heading } from "@radix-ui/themes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function TestPage() {
  return (
    <Container mt="5" pt="2" px="4" className="max-w-4xl">
      <Heading size="8" mb="6">
        Create Campaign
      </Heading>

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
              <Input id="name" placeholder="Enter campaign name" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description</Label>
              <Textarea
                id="short_description"
                placeholder="Brief summary (max ~280 chars)"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain Name</Label>
              <Input
                id="subdomain"
                placeholder="my-campaign"
              />
              <p className="text-sm text-muted-foreground">
                Your campaign will be accessible at: subdomain.crowdwalrus.sui
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select>
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
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
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
                placeholder="Complete campaign story with rich formatting"
                rows={8}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="cover_image">Cover Image</Label>
              <Input
                id="cover_image"
                type="file"
                accept="image/*"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contact & Social */}
        <Card>
          <CardHeader>
            <CardTitle>Social Links</CardTitle>
            <CardDescription>Connect with your backers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="social_twitter">Twitter/X</Label>
              <Input
                id="social_twitter"
                type="url"
                placeholder="https://twitter.com/..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="social_discord">Discord</Label>
              <Input
                id="social_discord"
                type="url"
                placeholder="https://discord.gg/..."
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4 justify-end pb-8">
          <Button variant="outline">Preview</Button>
          <Button>Create Campaign</Button>
        </div>
      </div>
    </Container>
  );
}
