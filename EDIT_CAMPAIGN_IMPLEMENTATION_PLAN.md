# Edit Campaign Page Implementation Plan

This document outlines the work required to deliver the new **Campaign Edit**
experience. Use it to coordinate engineering tasks and keep implementation
consistent with current contract capabilities.

---

## 1. Routing & Data Loading

- **Add Route:** Extend `src/shared/config/routes.ts` and
  `src/app/router/routes.tsx` with
  `ROUTES.CAMPAIGNS_EDIT = "/campaigns/:id/edit"`.
- **Page Shell:** Create `src/pages/EditCampaignPage.tsx` using the same layout
  conventions as `NewCampaignPage`.
- **Data Fetching:** Reuse `useCampaign` hook from
  `src/features/campaigns/hooks/useCampaign.ts` (provides on-chain metadata)
  plus `useWalrusDescription` / `useWalrusImage` patterns from `CampaignPage`.
  Treat the page as loading until campaign data, owner cap, and Walrus payload
  are all available.
- **Owner Capability Hook:** Implement
  `useOwnedCampaignCap(campaignId: string, network: 'devnet' | 'testnet' | 'mainnet')`
  in `src/features/campaigns/hooks/useOwnedCampaignCap.ts` using
  `useSuiClientQuery` with `getOwnedObjects`. **IMPORTANT:** Must pass `owner`
  parameter with current account address (use `useCurrentAccount()` from
  `@mysten/dapp-kit`). Filter results by type
  `${packageId}::campaign::CampaignOwnerCap` and match against `campaignId` by
  checking the cap's `campaign_id` field. Get `packageId` via
  `getContractConfig(network).contracts.packageId`. Return the matching cap's
  `objectId` or `null`. Show a dedicated "Not authorized" state (no edit form)
  when the cap is absent. Default React Query caching is fine; refetch when the
  connected wallet changes.
  ```ts
  // Example implementation
  export function useOwnedCampaignCap(campaignId: string, network: ...) {
    const account = useCurrentAccount();
    return useSuiClientQuery(
      "getOwnedObjects",
      {
        owner: account?.address as string, // REQUIRED!
        filter: {
          StructType: `${packageId}::campaign::CampaignOwnerCap`,
        },
        options: { showContent: true },
      },
      { enabled: !!account && !!campaignId }
    );
    // Then filter results to find cap where cap.campaign_id === campaignId
  }
  ```
- **Loading Coordination:** Gate render on
  `isLoadingCampaign || isLoadingCap || isLoadingWalrus`. Display skeletons
  while loading, "Not authorized" when the cap is missing, and "Not found" if
  campaign fetch fails. If the Walrus fetch fails but Sui data succeeds, render
  basics-only view with Walrus sections disabled and provide a retry affordance.
- **Deleted Campaign Guard:** If the fetched campaign has `isDeleted === true`,
  treat it the same as "Not found" - do not show the campaign at all. Return a
  404-style message or redirect to the campaigns list.

## 2. Form Schema & Transformation

- **Schema:** Create `buildEditCampaignSchema()` in
  `src/features/campaigns/schemas/editCampaignSchema.ts` by forking
  `newCampaignSchema` (from
  `src/features/campaigns/schemas/newCampaignSchema.ts`) to remove creation-only
  fields and respect immutability rules enforced by the contract:
  ```ts
  export const buildEditCampaignSchema = () =>
    newCampaignSchema
      .omit({
        termsAccepted: true,
        coverImage: true,
        startDate: true,
        endDate: true, // timeline is read-only on-chain
        targetAmount: true, // funding goal is immutable
        subdomain: true, // subdomain cannot be changed
        walletAddress: true, // recipient address is immutable
      })
      .extend({
        coverImage: z.instanceof(File).optional(),
        campaignDetails: z
          .string()
          .optional()
          .refine(
            (val) => {
              if (!val || val === "") return true; // Allow empty/undefined
              try {
                JSON.parse(val);
                return true;
              } catch {
                return false;
              }
            },
            { message: "Invalid campaign details format (must be valid JSON)" },
          ),
      });
  ```
  Timeline and funding goal edits are out of scope because the contract does not
  expose entry functions to mutate `start_date`, `end_date`, or funding goal.
- **Default Values:** After data load, call `form.reset` with normalized values
  from the campaign data. Map the following fields:
  - `campaignName` → `campaign.name`
  - `description` → `campaign.shortDescription`
  - `campaignType` → Extract from `campaign.metadata['campaign_type']` (note:
    this field will be added to metadata soon; currently not stored)
  - `categories` → Parse from `campaign.category` by splitting comma-separated
    string: `campaign.category.split(',')` → array
  - `socials` → Reconstruct array from `campaign.socialTwitter`,
    `campaign.socialDiscord`, `campaign.socialWebsite`
  - `campaignDetails` → Fetched from `useWalrusDescription` (Lexical JSON
    string)
  - **Note on cover image:** The hook only provides the Walrus URL, not the
    original File object metadata. For dirty detection, treat any new file
    selection as requiring an upload (see Section 4).
- **Metadata Storage Clarification:**
  - `campaign_type`: Stores the campaign type ("flexible", "nonprofit",
    "commercial"). This is a separate concept from category and will have
    contract logic soon. Store in metadata as `campaign_type` key.
  - `category`: Stores categories as comma-separated string (e.g.,
    "environment,tech"). Parsed from the `categories` array in the form.
  - Both are stored as separate metadata keys and serve different purposes.
- **Transformers:** Add `transformEditCampaignFormData` in
  `src/features/campaigns/utils/transformEditCampaignFormData.ts` that returns:
  - Sui-only updates (`name`, `short_description`), matching the fields mutated
    by the contract's `update_campaign_basics` function
  - A `MetadataPatch` describing key/value updates
  - `shouldUploadWalrus` boolean derived from dirty detection

## 3. Editable UI Wrappers

- **EditableSection Component:** Create
  `src/features/campaigns/components/EditableSection.tsx`:
  ```ts
  interface EditableSectionProps {
    label: string;
    isEditing: boolean;
    onToggleEdit: () => void;
    requiresWalrusWarning?: boolean;
    onWalrusWarningAccepted?: () => void;
    disabled?: boolean;
    children: React.ReactNode;
  }
  ```
  The wrapper always renders its children but applies `pointer-events-none`,
  `aria-disabled`, and faded styling when `isEditing` is false. Parents own
  Save/Cancel actions and persistence. Every editable field renders with an
  inline "Edit" button that flips `isEditing` when clicked; all sections start
  disabled by default.
- **Editable vs Read-only Fields:**
  - **Editable:** title, short description, cover image, campaign type,
    categories, social links, rich text description (Walrus-backed)
  - **Read-only (permanently locked):** subdomain, funding target, recipient
    address, timeline (start/end dates)
- **Walrus Warning Flow:** When `requiresWalrusWarning` is true, `onToggleEdit`
  should open `WalrusReuploadWarningModal` component (create in
  `src/features/campaigns/components/modals/WalrusReuploadWarningModal.tsx`).
  Only after the user confirms should `onWalrusWarningAccepted` flip `isEditing`
  to true. The modal copy should use Tailwind classes (no inline styles) and
  read:
  ```
  oops!
  All CrowdWalrus media is stored on Walrus.
  Changing this field requires purchasing a new
  storage subscription.
  Are you sure you want to proceed?
  [Cancel]  [Proceed]
  ```
- **Component Reuse & Audit:**
  - ✅ `CampaignCoverImageUpload`, `CampaignDetailsEditor` - reuse with
    `disabled` prop
  - ⚠️ `CampaignStorageRegistrationCard` - needs new `hideRegisterButton` prop
    to conditionally hide "Register Storage" button
  - ⚠️ `CampaignTimeline`, `CampaignSocialsSection` - require adapters to honor
    `disabled` prop (disable popovers/triggers when not editing)
  - ℹ️ `CampaignFundingTargetSection` - becomes read-only (funding goal
    immutable)
  - ✅ `CampaignTypeSelector` - can be editable (stored in metadata as
    `campaign_type`)
  - ✅ `CampaignCategorySelector` - can be editable (stored in metadata as
    `category` comma-separated string)
  - ❌ `CampaignTermsAndConditionsSection` - skip (creation-only requirement)
  - For each reused component, verify it threads `disabled` through popovers,
    buttons, and form controls; patch gaps before wiring the edit wrapper.

## 4. Dirty-Field Detection & UX

- **RHF Dirty Fields:** Use `formState.dirtyFields` from React Hook Form to
  detect edits:
  - **Sui-only fields:** `campaignName`, `description`
  - **Metadata-backed fields:** `campaignType` (stored as `campaign_type`),
    `categories` (stored as `category`), social links (`socials`)
  - **Walrus-backed fields:** `coverImage`, `campaignDetails`, storage epochs
- **File Comparison:** Since we only have the Walrus URL (not the original File
  object), we cannot compare file metadata. Therefore, treat **any** file
  re-selection as requiring a new Walrus upload. This is safe and ensures
  changed files are always uploaded. If no file is selected (field is
  `undefined`), the cover image remains unchanged.
- **Lexical JSON:** Use string comparison for `campaignDetails`, treating
  `undefined` and `""` equivalently when both represent "unchanged".
- **Feedback:** Each `EditableSection` should display "Unsaved changes" when
  dirty and "Saved" after successful mutation. Disabled sections should
  highlight why (e.g., "Funding goal cannot be edited after launch").

## 5. Walrus Flow Integration

- **Hook Usage:** The existing `useWalrusUpload` hook (in
  `src/features/campaigns/hooks/useWalrusUpload.ts`) provides four separate
  mutations: `prepare`, `register`, `upload`, and `certify`. **Do not modify the
  hook** - it's designed for stepwise control. Instead, handle conditional logic
  in `EditCampaignPage`:
  - If Walrus-backed fields are unchanged (`coverImage` and `campaignDetails`
    both clean), skip the entire Walrus flow and reuse the existing
    `walrus_quilt_id`.
  - If either field is dirty, run the full prepare → register → upload → certify
    pipeline with the updated files.
- **Upload Pipeline:** When Walrus fields changed, run prepare → register →
  upload → certify. Capture the new `walrus_quilt_id`, `walrus_storage_epochs`,
  and `cover_image_id`.
  - **For partial edits (description-only):** If the user hasn't selected a new
    cover image but `campaignDetails` is dirty, you must download the existing
    cover image from `campaign.coverImageUrl` (which is derived from
    `walrus_quilt_id` + `cover_image_id` metadata by the `useCampaign` hook) and
    convert it to a File object before calling `prepareCampaignFiles`:
    ```ts
    // Download existing cover image from Walrus
    const coverResponse = await fetch(campaign.coverImageUrl);
    if (!coverResponse.ok) {
      throw new Error('Failed to fetch existing cover image from Walrus');
    }
    const coverBlob = await coverResponse.blob();
    const coverFile = new File([coverBlob], 'cover.jpg', {
      type: coverBlob.type || 'image/jpeg',
    });

    // Now prepare campaign files with existing cover + new description
    const formDataForUpload: CampaignFormData = {
      ...existingCampaignData,
      cover_image: coverFile, // Reconstructed from Walrus URL
      full_description: newDescriptionJSON, // Updated
    };
    const files = await prepareCampaignFiles(formDataForUpload);
    ```
  - This is necessary because `prepareCampaignFiles` (in
    `src/services/walrus.ts`) expects `formData.cover_image` to be a File
    object, not a URL. Without this step, description-only edits would fail at
    the prepare stage.
- **Storage Card:** Reuse `CampaignStorageRegistrationCard` to display WAL cost
  and epochs. **Component modification required:** Add a new prop
  `hideRegisterButton?: boolean` to the component (in
  `src/features/campaigns/components/new-campaign/CampaignStorageRegistrationCard.tsx`)
  because it currently always shows the "Register Storage" button when
  `!storageRegistered`. Lock the card when unchanged; unlocking should invoke
  the Walrus warning modal first.
  - If no Walrus-backed field is dirty (`shouldUploadWalrus === false`), pass
    `hideRegisterButton={true}` to hide the "Register Storage" button and
    surface only a "Publish Update" primary CTA outside the card.

## 6. Transaction Builders & Mutations

### Contract Error Codes Reference

For debugging and error handling, here are the relevant Move abort codes from
the campaign module:

| Error Code | Constant Name                   | Description                                      |
| ---------- | ------------------------------- | ------------------------------------------------ |
| 1          | `E_APP_NOT_AUTHORIZED`          | Unauthorized operation (wrong owner cap)         |
| 4          | `E_KEY_VALUE_MISMATCH`          | Metadata keys/values vectors have different lengths |
| 5          | `E_INVALID_DATE_RANGE`          | Start date >= end date                           |
| 6          | `E_START_DATE_IN_PAST`          | Start date is before current time                |
| 8          | `E_FUNDING_GOAL_IMMUTABLE`      | Attempted to modify immutable funding_goal       |
| 9          | `E_RECIPIENT_ADDRESS_INVALID`   | Recipient address is zero address                |
| 10         | `E_RECIPIENT_ADDRESS_IMMUTABLE` | Attempted to modify immutable recipient_address  |
| 11         | `E_CAMPAIGN_DELETED`            | Campaign has been deleted                        |

### MetadataPatch Type

Define in `src/features/campaigns/types/campaign.ts`:

```ts
export interface MetadataPatch {
  walrus_quilt_id?: string;
  walrus_storage_epochs?: string;
  cover_image_id?: string;
  campaign_type?: string; // "flexible", "nonprofit", "commercial"
  category?: string; // Comma-separated categories (e.g., "environment,tech")
  social_twitter?: string;
  social_discord?: string;
  social_website?: string;
}
```

Validate client-side that `walrus_quilt_id` and `walrus_storage_epochs` appear
together. Metadata deletion is out of scope; pass empty strings if needed.
Immutable keys (`funding_goal`, `recipient_address`) should not be included.

### Transaction Builders

Add to `src/services/campaign-transaction.ts`:

#### 1. Update Campaign Basics

```ts
/**
 * Build transaction to update campaign name and/or short description
 * Contract signature:
 *   entry fun update_campaign_basics(
 *     campaign: &mut Campaign,
 *     cap: &CampaignOwnerCap,
 *     new_name: Option<String>,
 *     new_description: Option<String>,
 *     clock: &Clock,
 *     ctx: &tx_context::TxContext,
 *   )
 */
export function buildUpdateCampaignBasicsTransaction(
  campaignId: string,
  ownerCapId: string,
  updates: {
    name?: string;
    short_description?: string;
  },
  network: "devnet" | "testnet" | "mainnet",
): Transaction {
  const config = getContractConfig(network);
  const tx = new Transaction();

  // Prepare Option<String> values
  // Use tx.pure.option('string', value) for Some, tx.pure.option('string', null) for None
  const newName = updates.name
    ? tx.pure.option("string", updates.name)
    : tx.pure.option("string", null);

  const newDescription = updates.short_description
    ? tx.pure.option("string", updates.short_description)
    : tx.pure.option("string", null);

  tx.moveCall({
    target: `${config.contracts.packageId}::campaign::update_campaign_basics`,
    arguments: [
      tx.object(campaignId), // Campaign shared object
      tx.object(ownerCapId), // CampaignOwnerCap
      newName, // Option<String>
      newDescription, // Option<String>
      tx.object(CLOCK_OBJECT_ID), // Clock object (0x6)
      // ctx is automatically provided by the transaction context
    ],
  });

  return tx;
}
```

#### 2. Update Campaign Metadata

```ts
/**
 * Build transaction to update campaign metadata (key-value pairs)
 * Contract signature:
 *   entry fun update_campaign_metadata(
 *     campaign: &mut Campaign,
 *     cap: &CampaignOwnerCap,
 *     keys: vector<String>,
 *     values: vector<String>,
 *     clock: &Clock,
 *     ctx: &tx_context::TxContext,
 *   )
 *
 * Note: funding_goal and recipient_address are immutable and will abort if included
 */
export function buildUpdateCampaignMetadataTransaction(
  campaignId: string,
  ownerCapId: string,
  patch: MetadataPatch,
  network: "devnet" | "testnet" | "mainnet",
): Transaction {
  const config = getContractConfig(network);
  const tx = new Transaction();

  // Filter out immutable keys and convert patch to parallel arrays
  const keys: string[] = [];
  const values: string[] = [];

  Object.entries(patch).forEach(([key, value]) => {
    // Skip immutable keys
    if (key === "funding_goal" || key === "recipient_address") {
      console.warn(
        `Skipping immutable metadata key: ${key}. This will cause E_FUNDING_GOAL_IMMUTABLE or E_RECIPIENT_ADDRESS_IMMUTABLE if sent.`,
      );
      return;
    }

    if (value !== undefined) {
      keys.push(key);
      values.push(value);
    }
  });

  // Validate that we have matching key/value pairs
  if (keys.length !== values.length) {
    throw new Error(
      `Metadata key/value mismatch: ${keys.length} keys, ${values.length} values`,
    );
  }

  tx.moveCall({
    target: `${config.contracts.packageId}::campaign::update_campaign_metadata`,
    arguments: [
      tx.object(campaignId), // Campaign shared object
      tx.object(ownerCapId), // CampaignOwnerCap
      tx.pure.vector("string", keys), // vector<String>
      tx.pure.vector("string", values), // vector<String>
      tx.object(CLOCK_OBJECT_ID), // Clock object (0x6)
      // ctx is automatically provided by the transaction context
    ],
  });

  return tx;
}
```

### Mutation Hooks

Create in `src/features/campaigns/hooks/useCampaignMutations.ts`:

```ts
import { useSignAndExecuteTransaction } from "@mysten/dapp-kit";
import { Transaction } from "@mysten/sui/transactions";
import {
  buildUpdateCampaignBasicsTransaction,
  buildUpdateCampaignMetadataTransaction,
  buildToggleActiveTransaction,
  getTransactionOptions,
} from "@/services/campaign-transaction";
import { DEFAULT_NETWORK } from "@/shared/config/networkConfig";
import type { MetadataPatch } from "../types/campaign";

/**
 * Hook to update campaign name and/or description
 */
export function useUpdateCampaignBasics() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  return async (
    campaignId: string,
    ownerCapId: string,
    updates: { name?: string; short_description?: string },
  ) => {
    const tx = buildUpdateCampaignBasicsTransaction(
      campaignId,
      ownerCapId,
      updates,
      DEFAULT_NETWORK,
    );

    return await signAndExecute(
      {
        transaction: tx,
      },
      {
        ...getTransactionOptions(),
      },
    );
  };
}

/**
 * Hook to update campaign metadata
 */
export function useUpdateCampaignMetadata() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  return async (
    campaignId: string,
    ownerCapId: string,
    patch: MetadataPatch,
  ) => {
    const tx = buildUpdateCampaignMetadataTransaction(
      campaignId,
      ownerCapId,
      patch,
      DEFAULT_NETWORK,
    );

    return await signAndExecute(
      {
        transaction: tx,
      },
      {
        ...getTransactionOptions(),
      },
    );
  };
}

/**
 * Hook to toggle campaign active status
 */
export function useToggleCampaignStatus() {
  const { mutateAsync: signAndExecute } = useSignAndExecuteTransaction();

  return async (
    campaignId: string,
    ownerCapId: string,
    newStatus: boolean,
  ) => {
    const tx = buildToggleActiveTransaction(
      campaignId,
      ownerCapId,
      newStatus,
      DEFAULT_NETWORK,
    );

    return await signAndExecute(
      {
        transaction: tx,
      },
      {
        ...getTransactionOptions(),
      },
    );
  };
}
```

### Batching Logic

Compute `hasBasicsChanges` and `hasMetadataChanges`. Batch both Move calls into
a single PTB only when both flags are true:

```ts
if (hasBasicsChanges && hasMetadataChanges) {
  // Create a single transaction with both move calls
  const tx = new Transaction();

  // Prepare Option values for basics
  const newName = basicsUpdates.name
    ? tx.pure.option("string", basicsUpdates.name)
    : tx.pure.option("string", null);

  const newDescription = basicsUpdates.short_description
    ? tx.pure.option("string", basicsUpdates.short_description)
    : tx.pure.option("string", null);

  // Add basics update call
  tx.moveCall({
    target: `${packageId}::campaign::update_campaign_basics`,
    arguments: [
      tx.object(campaignId),
      tx.object(ownerCapId),
      newName,
      newDescription,
      tx.object(CLOCK_OBJECT_ID),
    ],
  });

  // Prepare metadata vectors
  const keys = Object.keys(metadataPatch);
  const values = Object.values(metadataPatch);

  // Add metadata update call
  tx.moveCall({
    target: `${packageId}::campaign::update_campaign_metadata`,
    arguments: [
      tx.object(campaignId),
      tx.object(ownerCapId),
      tx.pure.vector("string", keys),
      tx.pure.vector("string", values),
      tx.object(CLOCK_OBJECT_ID),
    ],
  });

  // Execute batched transaction
  await signAndExecute({ transaction: tx });
} else if (hasBasicsChanges) {
  // Execute basics-only transaction
  await updateBasics(campaignId, ownerCapId, basicsUpdates);
} else if (hasMetadataChanges) {
  // Execute metadata-only transaction
  await updateMetadata(campaignId, ownerCapId, metadataPatch);
}
```

Otherwise, execute the single relevant transaction to minimize gas.

- When neither basics nor metadata changed, keep the CTA disabled to prevent
  no-op submissions; otherwise label the final button "Publish Update" instead
  of "Publish Campaign".

## 7. Validation & Messaging

- **Client Guards:** Mirror contract checks (string lengths, Walrus pairing,
  immutable metadata keys). Pre-validate before signing to avoid RPC costs.
  Reuse validation patterns from `newCampaignSchema.ts` and
  `validateCampaignFormData` in `campaign-transaction.ts`.
- **Funding Goal:** Treat funding goal as immutable—render in a read-only info
  box with copy explaining the policy (e.g., "Funding goal cannot be changed
  after campaign creation").
- **Recipient Address:** Display the donation address as static text (copyable)
  with helper messaging that it was set during creation and cannot change.
- **Error Handling:** Map Move abort codes to friendly text using the error
  codes table above. Distinguish wallet cancellations from execution failures,
  and provide retry UI for Walrus upload issues. Reuse error handling patterns
  from `src/features/campaigns/components/campaign-creation-modal/` where
  possible.
- **Deleted Campaign Messaging:** If contract returns `E_CAMPAIGN_DELETED`
  (code 11) failure during edit, surface a dedicated banner or toast instructing
  the owner to contact support if this is unexpected. However, this should be
  rare since we gate the UI at load time.

## 8. Testing & QA

- **Unit Tests:** Cover transformer logic, metadata patch building, dirty
  detection (including file comparison), transaction batching decisions, and
  Option type handling. Use Vitest.
- **Integration Tests:** Add smoke tests (Vitest + mocked RPC) for:
  - Basics-only edit
  - Metadata-only edit
  - Combined edits (batched PTB)
  - Walrus skip (no re-upload)
  - Unauthorized access (no owner cap)
  - Deleted campaign (treated as not found)
  - Walrus fetch failure fallback
- **Manual QA:** Verify flows for:
  - Basics edit (name, description)
  - Metadata edit (campaign type, categories, socials)
  - Metadata edit with new Walrus upload
  - Combined edit (basics + metadata)
  - Unauthorized access
  - Walrus fetch failure fallback
  - Deleted campaign guard
  - Wallet rejection path
  - Immutable field rejection (funding_goal, recipient_address)
- **Telemetry (optional):** Emit analytics when sections enter edit mode or WAL
  uploads occur to monitor feature adoption.

## 9. Error & State Feedback

- Centralize abort-code → message mapping using the error codes table in
  Section 6. Consider creating `src/features/campaigns/utils/errorMapping.ts`
  with a helper function:
  ```ts
  export function mapCampaignError(code: number): string {
    const errorMessages: Record<number, string> = {
      1: "You are not authorized to edit this campaign.",
      4: "Metadata update failed: keys and values mismatch.",
      8: "Funding goal cannot be modified after campaign creation.",
      10: "Recipient address cannot be modified after campaign creation.",
      11: "This campaign has been deleted.",
    };
    return (
      errorMessages[code] ||
      `An error occurred while updating the campaign (code: ${code}).`
    );
  }
  ```
- Use inline field errors from React Hook Form, toast notifications for general
  failures (using `@/shared/components/ui/sonner` or similar), and keep the
  Walrus warning modal dedicated to cost disclosures.
- Display contextual banners when Walrus description fails to load but Sui data
  is available (can reuse Card components with warning styling).

## 10. Component Reference

| Component                           | Reuse Strategy                | Notes                                                                   |
| ----------------------------------- | ----------------------------- | ----------------------------------------------------------------------- |
| `CampaignCoverImageUpload`          | ✅ Reuse with `disabled` prop | Seed preview URL from existing blob; block drag/drop when locked        |
| `CampaignDetailsEditor`             | ✅ Reuse                      | Use `readOnly` flag when section locked                                 |
| `CampaignTimeline`                  | ⚠️ Make read-only             | Timeline cannot be edited (no contract support); always show as locked  |
| `CampaignFundingTargetSection`      | ℹ️ Read-only                  | Display funding goal; remove inputs (immutable on-chain)                |
| `CampaignSocialsSection`            | ⚠️ Needs wrapper              | Disable selects, inputs, and add/remove buttons when not editing        |
| `CampaignStorageRegistrationCard`   | ⚠️ Needs new prop             | Add `hideRegisterButton` prop to conditionally hide button; toggle edit mode + Walrus warning |
| `CampaignTypeSelector`              | ✅ Reuse                      | Editable; stored in metadata as `campaign_type`                         |
| `CampaignCategorySelector`          | ✅ Reuse                      | Editable; stored in metadata as `category` (comma-separated)            |
| `CampaignTermsAndConditionsSection` | ❌ Skip                       | Creation-only requirement                                               |

## 11. Backward Compatibility

- Coordinate release with contract deployment; ensure legacy campaigns satisfy
  new validation (QA a sample from testnet).
- Handle missing metadata keys gracefully (default to empty strings). The
  `useCampaign` hook already handles this pattern.
- **Migration Note:** Existing campaigns may not have `campaign_type` in
  metadata (since it's not currently stored). Handle gracefully with fallback to
  default or empty value in the edit form.
- Document migration considerations if future contract updates add fields.

## 12. Out-of-Scope / Follow-Up

- WAL storage extension without re-upload
- Ownership transfer
- Admin bulk actions
- Automatic expiration warnings
- Timeline editing (requires contract changes to support `start_date` and
  `end_date` mutation)
- These features are outside MVP—track separately.

---

## File Structure Summary

```
src/
├── features/campaigns/
│   ├── components/
│   │   ├── EditableSection.tsx (new)
│   │   ├── modals/
│   │   │   └── WalrusReuploadWarningModal.tsx (new)
│   │   └── [existing components to audit/reuse]
│   ├── hooks/
│   │   ├── useCampaign.ts (existing, reuse)
│   │   ├── useOwnedCampaignCap.ts (new)
│   │   ├── useCampaignMutations.ts (new)
│   │   └── useWalrusUpload.ts (existing, extend)
│   ├── schemas/
│   │   ├── newCampaignSchema.ts (existing)
│   │   └── editCampaignSchema.ts (new)
│   ├── types/
│   │   └── campaign.ts (existing, add MetadataPatch)
│   └── utils/
│       ├── transformEditCampaignFormData.ts (new)
│       └── errorMapping.ts (new)
├── pages/
│   ├── CampaignPage.tsx (existing, reference patterns)
│   ├── NewCampaignPage.tsx (existing, reference layout)
│   └── EditCampaignPage.tsx (new)
├── services/
│   └── campaign-transaction.ts (existing, extend with new builders)
└── shared/
    └── config/
        ├── routes.ts (extend)
        └── contracts.ts (existing, use getContractConfig)
```

---

## Key Implementation Notes

### Option Type Handling in TypeScript

When calling Move functions that accept `Option<T>`, use the Sui TypeScript SDK
methods:

```ts
// For Some(value)
tx.pure.option("string", "my value");

// For None
tx.pure.option("string", null);
```

This applies to `update_campaign_basics` where both `new_name` and
`new_description` are `Option<String>`.

### Metadata Key Naming Convention

Follow snake_case for metadata keys to match contract conventions:

- `campaign_type` (not `campaignType`)
- `category` (not `categories`)
- `social_twitter`, `social_discord`, `social_website`
- `walrus_quilt_id`, `walrus_storage_epochs`, `cover_image_id`
- `funding_goal`, `recipient_address` (immutable)

### Campaign Type vs Category

These are distinct metadata fields with different purposes:

- **`campaign_type`**: The type of campaign ("flexible", "nonprofit",
  "commercial"). This will have contract logic in the future. Currently defined
  in the form schema but not yet stored in metadata during creation. When
  implementing edit, add logic to store this field.
- **`category`**: The campaign categories as a comma-separated string (e.g.,
  "environment,tech"). Parsed from the `categories` array field in the form
  schema.

When transforming form data, ensure BOTH are included in metadata:

```ts
const metadata: MetadataPatch = {
  campaign_type: formData.campaignType, // "flexible", etc.
  category: formData.categories.join(","), // "environment,tech"
  // ... other fields
};
```

---

Use this plan to create tickets, assign ownership, and track progress toward
shipping the edit campaign experience. As new contract features land, update the
plan to keep front-end and on-chain behavior aligned.
