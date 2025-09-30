# CrowdWalrus Frontend - Project Overview

This document defines the complete data architecture, technical implementation details, and user flows for the CrowdWalrus decentralized crowdfunding platform frontend.

## Table of Contents

1. [Data Architecture](#data-architecture)
2. [Campaign Data Structure](#campaign-data-structure)
3. [Walrus Storage Integration](#walrus-storage-integration)
4. [Sui Blockchain Integration](#sui-blockchain-integration)
5. [Campaign Creation Flow](#campaign-creation-flow)
6. [Technical Implementation Details](#technical-implementation-details)
7. [Campaign Features](#campaign-features)
8. [Campaign Updates System](#campaign-updates-system)
9. [Campaign Discovery & Querying](#campaign-discovery--querying)

---

## Data Architecture

### Storage Strategy

CrowdWalrus uses a hybrid storage approach leveraging both Sui blockchain and Walrus decentralized storage:

#### **On Sui Blockchain** (Smart Contract State)
- Campaign metadata (name, description, dates)
- Fundraising parameters (goal amounts, dates)
- Ownership and authorization
- Campaign updates (title, description, metadata)
- Validation status
- **Walrus Quilt reference ID** (blob_id as u256)
- SuiNS subdomain mapping

#### **On Walrus Storage** (Decentralized File Storage)
- Campaign HTML page (full description, rich content)
- Campaign images (cover image, gallery, media)
- Campaign video embeds (as HTML)
- Rich text content
- Any large media files

### Why This Separation?

| Aspect | Sui Blockchain | Walrus Storage |
|--------|---------------|----------------|
| **Cost** | Expensive for large data | ~5x blob size (very affordable) |
| **Mutability** | Immutable by default | Immutable (but new versions can be created) |
| **Query Speed** | Fast indexed queries | Fast retrieval by blob ID |
| **Use Case** | Critical metadata, state | Large content, media |
| **Gas Fees** | Sui computation gas | Minimal (only for registration) |

---

## Campaign Data Structure

### Complete Campaign Fields

#### **Essential Campaign Information**

| Field | Location | Type | Description |
|-------|----------|------|-------------|
| `name` | Sui | String | Campaign title (max ~100 chars recommended) |
| `short_description` | Sui | String | Brief summary (max ~280 chars recommended) |
| `subdomain_name` | Sui | String | SuiNS subdomain (e.g., "my-campaign") |
| `admin_id` | Sui | ID | Creator's wallet address ID |
| `campaign_id` | Sui | ID | Unique campaign identifier |

#### **Fundraising Parameters**

| Field | Location | Type | Description |
|-------|----------|------|-------------|
| `funding_goal` | Sui (metadata) | String | Target amount in SUI |
| `minimum_donation` | Sui (metadata) | String | Minimum contribution amount |
| `donation_tiers` | Sui (metadata) | JSON String | Suggested donation amounts with descriptions |
| `start_date` | Sui | u64 | Campaign start epoch |
| `end_date` | Sui | u64 | Campaign end epoch |

#### **Campaign Status**

| Field | Location | Type | Description |
|-------|----------|------|-------------|
| `validated` | Sui | bool | Platform validation status |
| `isActive` | Sui | bool | Campaign active/paused status |
| `created_at` | Sui | u64 | Creation epoch timestamp |

#### **Walrus Storage Reference**

| Field | Location | Type | Description |
|-------|----------|------|-------------|
| `walrus_quilt_id` | Sui (metadata) | String (u256) | Quilt blob ID containing HTML + images |
| `walrus_storage_epochs` | Sui (metadata) | String | Number of epochs data is stored |

#### **Rich Content (Stored in Walrus)**

| Content | Storage | Format | Description |
|---------|---------|--------|-------------|
| `full_description` | Walrus | HTML | Complete campaign story with rich formatting |
| `cover_image` | Walrus | Image | Main campaign image (JPG/PNG) |
| `gallery_images` | Walrus | Images | Additional campaign images |
| `video_url` | Walrus | HTML embed | YouTube/Vimeo embed code |
| `impact_description` | Walrus | HTML | What donations will accomplish |
| `creator_bio` | Walrus | HTML | About the campaign creator |

#### **Additional Metadata (VecMap on Sui)**

The `metadata: VecMap<String, String>` field in the smart contract stores key-value pairs:

```typescript
metadata: {
  "funding_goal": "10000",
  "minimum_donation": "10",
  "walrus_quilt_id": "123456789...", // u256 as string
  "walrus_storage_epochs": "100",
  "donation_tiers": JSON.stringify([
    { amount: "25", description: "Supporter tier" },
    { amount: "100", description: "Backer tier" },
    { amount: "500", description: "Sponsor tier" }
  ]),
  "category": "Technology",
  "tags": "blockchain,crowdfunding,web3",
  "cover_image_quilt_id": "image_identifier", // Identifier within Quilt
  "contact_email": "creator@example.com",
  "social_twitter": "https://twitter.com/...",
  "social_discord": "https://discord.gg/...",
  // ... any other custom fields
}
```

**Important VecMap Considerations:**
- Keys and values are both `String` type
- Store complex data as JSON strings
- All numeric values must be converted to strings
- VecMap has O(N) lookup performance - avoid storing too many keys
- Best practice: Keep VecMap to ~10-20 keys maximum

---

## Walrus Storage Integration

### Walrus Quilt for Batch Storage

**What is Quilt?**
Quilt is a Walrus batch storage solution that bundles multiple small files (up to ~660 files) into a single storage unit, reducing:
- Storage overhead by ~106x for 100KB files
- Sui gas fees (single transaction for multiple files)
- Network requests (batch operations)

**Why Use Quilt for CrowdWalrus?**
Each campaign has multiple files (HTML page + images), making Quilt perfect for:
- Storing campaign HTML + all images together
- Adding metadata/identifiers to each file
- Efficient retrieval of individual files
- Cost-effective storage (~5x blob size vs traditional methods)

### Using @mysten/walrus SDK

#### Installation
```bash
npm install @mysten/walrus@^0.7.0
```

#### Create WalrusClient

```typescript
import { WalrusClient } from '@mysten/walrus';
import { getFullnodeUrl, SuiClient } from '@mysten/sui/client';

const suiClient = new SuiClient({ url: getFullnodeUrl('testnet') });

const walrusClient = new WalrusClient({
  suiClient,
  // Optional: Use upload relay to reduce client load
  uploadRelay: 'https://relay.walrus.site'
});
```

#### Upload Campaign Files to Quilt

```typescript
// Prepare campaign files
const campaignFiles = [
  {
    data: new Uint8Array(htmlContent), // Campaign HTML
    identifier: 'index.html', // Unique identifier
    tags: { 'content-type': 'text/html', 'file-type': 'page' }
  },
  {
    data: new Uint8Array(coverImageBuffer), // Cover image
    identifier: 'cover.jpg',
    tags: { 'content-type': 'image/jpeg', 'file-type': 'cover' }
  },
  {
    data: new Uint8Array(galleryImage1Buffer),
    identifier: 'gallery-1.jpg',
    tags: { 'content-type': 'image/jpeg', 'file-type': 'gallery' }
  },
  // ... more images
];

// Upload to Walrus Quilt
const results = await walrusClient.writeFiles({
  files: campaignFiles,
  epochs: 100, // Storage duration (testnet: 1 day/epoch, mainnet: 14 days/epoch)
  deletable: false, // Campaign content should be permanent
  signer: keypair // User's wallet keypair
});

// Get the Quilt blob ID
const quiltBlobId = results.blobId; // u256 type
const quiltBlobObject = results.blobObject; // Sui object ID
```

#### Retrieve Files from Quilt

```typescript
// Get all files from Quilt
const blob = await walrusClient.getBlob({ blobId: quiltBlobId });
const allFiles = await blob.files();

// Get specific file by identifier
const [htmlFile] = await blob.files({ identifiers: ['index.html'] });
const htmlContent = await htmlFile.arrayBuffer();

// Get files by tag
const galleryImages = await blob.files({
  tags: [{ 'file-type': 'gallery' }]
});
```

### Quilt Storage Considerations

| Aspect | Details |
|--------|---------|
| **Max files per Quilt** | ~666 files |
| **File size limits** | Individual files up to ~10MB |
| **Total Quilt size** | Larger quilts = better cost efficiency |
| **Immutability** | Individual files in Quilt cannot be deleted/extended |
| **Metadata limit** | 64KB total metadata per Quilt |
| **ID type** | `QuiltPatchId` (different from regular `BlobId`) |

---

## Sui Blockchain Integration

### Campaign Smart Contract Structure

From `campaign.move`:

```rust
public struct Campaign has key, store {
    id: UID,
    admin_id: ID,
    name: String,
    short_description: String,
    subdomain_name: String,
    metadata: VecMap<String, String>, // Store Walrus ID + custom data
    start_date: u64,
    end_date: u64,
    created_at: u64,
    validated: bool,
    isActive: bool,
    updates: vector<CampaignUpdate>,
}
```

### Creating a Campaign on Sui

#### Using @mysten/dapp-kit and @mysten/sui

```typescript
import { Transaction } from '@mysten/sui/transactions';
import { useSignAndExecuteTransaction } from '@mysten/dapp-kit';

// Prepare metadata with Walrus Quilt ID
const metadataKeys = [
  'funding_goal',
  'minimum_donation',
  'walrus_quilt_id',
  'walrus_storage_epochs',
  'donation_tiers',
  'category',
  'cover_image_id'
];

const metadataValues = [
  '10000',
  '10',
  quiltBlobId.toString(), // Convert u256 to string
  '100',
  JSON.stringify(donationTiers),
  'Technology',
  'cover.jpg'
];

// Build Sui transaction
const tx = new Transaction();

tx.moveCall({
  target: `${PACKAGE_ID}::crowd_walrus::create_campaign`,
  arguments: [
    tx.object(CROWD_WALRUS_OBJECT_ID), // CrowdWalrus shared object
    tx.object(SUINS_MANAGER_OBJECT_ID), // SuiNS Manager
    tx.object(SUINS_OBJECT_ID), // SuiNS registry
    tx.object('0x6'), // Clock object
    tx.pure.string(campaignName),
    tx.pure.string(shortDescription),
    tx.pure.string(subdomainName),
    tx.pure.vector('string', metadataKeys),
    tx.pure.vector('string', metadataValues),
    tx.pure.u64(startDate),
    tx.pure.u64(endDate),
  ],
});

// Execute with wallet
const { mutate: signAndExecute } = useSignAndExecuteTransaction();
signAndExecute({
  transaction: tx,
});
```

### SuiNS Subdomain Registration

When a campaign is created, the smart contract automatically:
1. Registers a subdomain under the CrowdWalrus parent domain
2. Maps `subdomain_name.crowdwalrus.sui` to the campaign's Sui address
3. Enables users to access campaigns via human-readable names

Example: `save-the-whales.crowdwalrus.sui` → Campaign Object ID

---

## Campaign Creation Flow

### User Journey (Step-by-Step)

#### **1. Connect Wallet**
- User connects Sui wallet (via `@mysten/dapp-kit`)
- Check wallet balance (for gas fees + storage costs)

#### **2. Fill Campaign Form**

**Basic Information:**
- Campaign name
- Short description (280 chars)
- Subdomain name (validate availability)
- Category selection
- Tags (optional)

**Fundraising Details:**
- Funding goal (in SUI)
- Minimum donation amount
- Donation tiers (optional: amount + description)
- Campaign duration (start/end dates)

**Rich Content:**
- Full description (HTML editor - can use Quill.js or similar)
- Cover image upload
- Gallery images upload (optional)
- Video embed URL (optional)
- Creator bio

**Contact & Social:**
- Contact email
- Social media links (Twitter, Discord, etc.)

#### **3. Preview Campaign**
- Show user what their campaign will look like
- Allow editing before submission

#### **4. Purchase Walrus Storage**

Calculate storage cost:
```typescript
// Estimate storage size
const htmlSize = new Blob([htmlContent]).size;
const totalImageSize = images.reduce((sum, img) => sum + img.size, 0);
const totalSize = htmlSize + totalImageSize;

// Walrus storage cost: ~5x blob size
const estimatedCost = totalSize * 5 * WALRUS_PRICE_PER_BYTE * epochs;
```

**User Confirmation:**
- Show storage cost in SUI
- Show storage duration (epochs)
- Get user approval

#### **5. Upload to Walrus**

```typescript
// Step 1: Prepare files
const files = [
  { data: htmlBuffer, identifier: 'index.html', tags: {...} },
  { data: coverImage, identifier: 'cover.jpg', tags: {...} },
  // ... more files
];

// Step 2: Upload to Walrus Quilt
const { blobId, blobObject } = await walrusClient.writeFiles({
  files,
  epochs: storageEpochs,
  deletable: false,
  signer: wallet.keypair
});

// Step 3: Store blobId for Sui transaction
const quiltBlobId = blobId.toString();
```

**UI States:**
- Show upload progress
- Handle errors (insufficient funds, network issues)
- Display success with Quilt blob ID

#### **6. Create Campaign on Sui**

```typescript
// Build transaction with Walrus blob ID in metadata
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::crowd_walrus::create_campaign`,
  arguments: [/* ... metadata includes quiltBlobId */],
});

// Execute transaction
await signAndExecuteTransaction({ transaction: tx });
```

**UI States:**
- Show transaction pending
- Handle errors (gas estimation, transaction failure)
- Display success with campaign ID and subdomain

#### **7. Success Screen**

Display:
- Campaign created successfully
- Campaign URL: `subdomain.crowdwalrus.sui`
- Campaign Sui Object ID
- Walrus Quilt blob ID
- Share buttons (Twitter, Discord, etc.)
- "Go to Campaign" button

---

## Technical Implementation Details

### SDK and Package Versions

From `package.json`:
- `@mysten/dapp-kit`: `0.18.0` (Wallet integration, hooks)
- `@mysten/sui`: `1.38.0` (Sui client, transactions)
- `@mysten/walrus`: `^0.7.0` (Walrus storage)
- `@tanstack/react-query`: `^5.87.1` (Data fetching)

### Blob ID Structure

**Walrus Blob ID:**
- Type: `u256` (256-bit unsigned integer)
- On Sui: Stored as `u256` in Blob struct
- In JavaScript: Handle as `BigInt` or string
- In metadata VecMap: Store as string

**QuiltPatchId vs BlobId:**
- `BlobId`: Regular blob identifier
- `QuiltPatchId`: Identifier for files within a Quilt
- QuiltPatchId changes if file is stored in different Quilt
- Both are `u256` type

### Storage Epochs and Pricing

| Network | Epoch Duration | Storage Cost |
|---------|----------------|--------------|
| **Testnet** | 1 day | ~Free (test WAL tokens) |
| **Mainnet** | 14 days | ~5x blob size in WAL tokens |

**Cost Calculation:**
```typescript
// Storage cost = blob_size * 5 * price_per_byte * epochs
const storageCost = blobSize * 5 * WALRUS_PRICE * epochs;
```

**Best Practices:**
- Store campaigns for at least 100 epochs (~4.5 months on testnet, ~3.8 years on mainnet)
- Allow campaign creators to extend storage later
- Warn users when storage is expiring

### Frontend Data Flow

```
User Form Input
    ↓
Validate & Preview
    ↓
Generate HTML Content
    ↓
Upload to Walrus Quilt ← [HTML, Images]
    ↓
Get Quilt Blob ID (u256)
    ↓
Create Sui Transaction ← [Metadata + Blob ID]
    ↓
Execute Transaction
    ↓
Campaign Created ✓
```

### Error Handling

| Error Type | Cause | Solution |
|------------|-------|----------|
| **Insufficient Balance** | Not enough SUI for gas/storage | Show balance, suggest amounts |
| **Subdomain Taken** | Subdomain already exists | Suggest alternatives |
| **Walrus Upload Failed** | Network/storage node issues | Retry mechanism, fallback nodes |
| **Transaction Failed** | Gas estimation, contract error | Show clear error messages |
| **Storage Expired** | Campaign storage expired | Allow extending storage |

---

## Campaign Features

### Based on Crowdfunding Best Practices

#### **Goal Tracking**

**Implementation:**
- Store `funding_goal` in metadata
- Query donation transactions on Sui
- Calculate `current_amount` / `funding_goal` = progress %
- Display thermometer/progress bar

**Formula:**
```typescript
const progress = (totalDonations / fundingGoal) * 100;
const percentageFunded = Math.min(progress, 100);
const backersCount = uniqueDonors.length;
const avgDonation = totalDonations / backersCount;
```

#### **Donation Tiers**

Store as JSON in metadata:
```typescript
const donationTiers = [
  {
    amount: "25",
    title: "Supporter",
    description: "Get updates + thank you message",
    estimatedDelivery: "Immediately"
  },
  {
    amount: "100",
    title: "Backer",
    description: "Everything above + exclusive NFT",
    estimatedDelivery: "1 month after campaign ends"
  },
  {
    amount: "500",
    title: "Sponsor",
    description: "Everything above + your name on website",
    estimatedDelivery: "2 months after campaign ends"
  }
];
```

**UI Features:**
- Display tiers as cards
- Highlight popular tier
- Show estimated delivery
- Quick select buttons

#### **Campaign Updates**

From `campaign.move`:
```rust
public struct CampaignUpdate has copy, drop, store {
    title: String,
    short_description: String,
    metadata: VecMap<String, String>,
    created_at: u64,
}
```

**Add Update Function:**
```typescript
tx.moveCall({
  target: `${PACKAGE_ID}::campaign::add_update`,
  arguments: [
    tx.object(campaignId),
    tx.object(campaignOwnerCapId), // Authorization
    tx.pure.string(updateTitle),
    tx.pure.string(updateDescription),
    tx.pure.vector('string', metadataKeys),
    tx.pure.vector('string', metadataValues),
  ],
});
```

**Update Metadata Can Include:**
- Walrus blob ID for rich content/images
- Video URLs
- Milestone reached
- Problem/solution updates

#### **Activity Feed**

Display:
- Recent donations (amount, donor name/address, timestamp)
- Campaign updates
- Milestones reached (50%, 75%, 100%)
- Comments (if implemented)

#### **Social Sharing**

Metadata fields:
```typescript
{
  "og_title": "Campaign Name",
  "og_description": "Short description",
  "og_image_url": "https://aggregator.walrus.site/v1/[blob_id]/cover.jpg",
  "twitter_card": "summary_large_image"
}
```

Generate share URLs:
```typescript
const shareUrl = `https://${subdomain}.crowdwalrus.sui`;
const twitterShare = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`;
```

---

## Campaign Updates System

### Add Update Transaction

**Only campaign owner** (with `CampaignOwnerCap`) can add updates.

```typescript
// Check ownership
const campaignOwnerCap = await getUserCampaignOwnerCap(walletAddress);

// Build transaction
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::campaign::add_update`,
  arguments: [
    tx.object(campaign.id),
    tx.object(campaignOwnerCap.id),
    tx.pure.string("Milestone Reached!"),
    tx.pure.string("We've reached 50% of our funding goal!"),
    tx.pure.vector('string', ['image_blob_id', 'update_type']),
    tx.pure.vector('string', ['123456789...', 'milestone']),
  ],
});

await signAndExecuteTransaction({ transaction: tx });
```

### Update Event Listening

The contract emits `CampaignUpdateAdded` event:
```rust
public struct CampaignUpdateAdded has copy, drop {
    campaign_id: ID,
    update: CampaignUpdate,
}
```

**Listen to events:**
```typescript
const events = await suiClient.queryEvents({
  query: {
    MoveEventType: `${PACKAGE_ID}::campaign::CampaignUpdateAdded`
  },
  order: 'descending'
});

const campaignUpdates = events.data
  .filter(e => e.parsedJson.campaign_id === campaignId)
  .map(e => e.parsedJson.update);
```

---

## Campaign Discovery & Querying

### Get All Campaigns

```typescript
// Query all Campaign objects
const campaigns = await suiClient.getOwnedObjects({
  filter: {
    StructType: `${PACKAGE_ID}::campaign::Campaign`
  },
  options: {
    showContent: true,
    showType: true
  }
});
```

### Get Validated Campaigns

```typescript
// Get validated campaigns list from CrowdWalrus object
const crowdWalrus = await suiClient.getObject({
  id: CROWD_WALRUS_OBJECT_ID,
  options: { showContent: true }
});

const validatedCampaignIds = crowdWalrus.content.fields.validated_campaigns_list;

// Fetch each campaign
const validatedCampaigns = await Promise.all(
  validatedCampaignIds.map(id =>
    suiClient.getObject({ id, options: { showContent: true } })
  )
);
```

### Filter Campaigns

```typescript
// Filter by category
const techCampaigns = campaigns.filter(c =>
  c.content.fields.metadata.find(kv =>
    kv.key === 'category' && kv.value === 'Technology'
  )
);

// Filter by active status
const activeCampaigns = campaigns.filter(c =>
  c.content.fields.isActive && c.content.fields.validated
);

// Filter by date range
const currentEpoch = Date.now() / 1000;
const ongoingCampaigns = campaigns.filter(c =>
  c.content.fields.start_date <= currentEpoch &&
  c.content.fields.end_date >= currentEpoch
);
```

### Use React Query for Caching

```typescript
import { useQuery } from '@tanstack/react-query';

function useCampaigns() {
  return useQuery({
    queryKey: ['campaigns'],
    queryFn: async () => {
      const result = await suiClient.getOwnedObjects({
        filter: { StructType: `${PACKAGE_ID}::campaign::Campaign` },
        options: { showContent: true }
      });
      return result.data;
    },
    staleTime: 30000, // 30 seconds
  });
}
```

---

## Additional Considerations

### Campaign Page Rendering

**Option 1: Fetch and Render HTML**
```typescript
// Get Quilt blob ID from campaign metadata
const quiltBlobId = campaign.metadata.find(kv => kv.key === 'walrus_quilt_id')?.value;

// Fetch HTML from Walrus
const blob = await walrusClient.getBlob({ blobId: quiltBlobId });
const [htmlFile] = await blob.files({ identifiers: ['index.html'] });
const htmlContent = await htmlFile.text();

// Render in iframe or sanitized div
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(htmlContent) }} />
```

**Option 2: Walrus Site URL**
```typescript
// Access via Walrus Site portal
const campaignUrl = `https://wal.app/${campaign.sui_object_id}`;
```

### Image URLs

```typescript
// Get image from Quilt by identifier
const imageUrl = `https://aggregator.walrus.site/v1/${quiltBlobId}/cover.jpg`;

// Or fetch programmatically
const blob = await walrusClient.getBlob({ blobId: quiltBlobId });
const [coverImage] = await blob.files({ identifiers: ['cover.jpg'] });
const imageBlob = await coverImage.blob();
const imageUrl = URL.createObjectURL(imageBlob);
```

### Donation Tracking

**Method 1: Custom Smart Contract**
- Create a donation contract that tracks contributions
- Link donations to campaign ID
- Query donation objects by campaign

**Method 2: Direct SUI Transfers**
- Users send SUI directly to campaign creator's wallet
- Track via Sui transaction history
- Query transactions with recipient = creator's address

**Recommendation:** Implement custom donation contract for:
- Better tracking and analytics
- Refund capability
- Platform features (quadratic funding, etc.)

---

## Summary Checklist

### Frontend Must Implement

- [ ] Campaign creation form (all fields)
- [ ] Walrus Quilt upload flow with progress
- [ ] Sui transaction creation and execution
- [ ] Campaign preview before submission
- [ ] Campaign page rendering (HTML + images from Walrus)
- [ ] Campaign listing and filtering
- [ ] Campaign detail page with progress tracker
- [ ] Campaign updates feed
- [ ] Donation UI (if implementing donation contract)
- [ ] SuiNS subdomain display and resolution
- [ ] Error handling for all operations
- [ ] Wallet connection and balance checking
- [ ] Storage cost estimation and display
- [ ] Campaign owner dashboard
- [ ] Social sharing functionality

### Data to Collect in Form

**Required:**
- [x] Campaign name
- [x] Short description
- [x] Subdomain name
- [x] Full description (HTML)
- [x] Cover image
- [x] Funding goal
- [x] Campaign duration (start/end dates)

**Optional but Recommended:**
- [x] Minimum donation
- [x] Donation tiers
- [x] Gallery images
- [x] Video embed
- [x] Category
- [x] Tags
- [x] Creator bio
- [x] Contact email
- [x] Social media links

### Technical Integration Points

- [x] `@mysten/dapp-kit` for wallet integration
- [x] `@mysten/sui` for blockchain queries and transactions
- [x] `@mysten/walrus` for storage
- [x] `@tanstack/react-query` for data caching
- [x] HTML editor library (e.g., Quill.js, TipTap, or Lexical)
- [x] Image upload and compression library
- [x] Form validation library

---

## References

- **Sui Documentation:** https://docs.sui.io
- **Walrus Documentation:** https://docs.wal.app
- **Walrus TypeScript SDK:** https://sdk.mystenlabs.com/walrus
- **dApp Kit Documentation:** https://sdk.mystenlabs.com/dapp-kit
- **Smart Contract Code:** See `contracts/` directory

---

*Last Updated: 2025-09-30*