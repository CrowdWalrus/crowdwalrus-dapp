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
  `useSuiClientQuery` with `getOwnedObjects` filtered on
  `${packageId}::campaign::CampaignOwnerCap`. Get `packageId` via
  `getContractConfig(network).contracts.packageId`. Return the matching
  `objectId` or `null`. Show a dedicated "Not authorized" state (no edit form)
  when the cap is absent. Default React Query caching is fine; refetch when the
  connected wallet changes.
- **Loading Coordination:** Gate render on
  `isLoadingCampaign || isLoadingCap || isLoadingWalrus`. Display skeletons
  while loading, "Not authorized" when the cap is missing, and "Not found" if
  campaign fetch fails. If the Walrus fetch fails but Sui data succeeds, render
  basics-only view with Walrus sections disabled and provide a retry affordance.
- **Deleted Campaign Guard:** If the fetched campaign has `isDeleted === true`,
  treat it the same as "Not found" - do not show the campaign at all. The
  contract rejects edits on deleted campaigns (`E_CAMPAIGN_DELETED`).

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
        campaignDetails: z.string().optional(),
      });
  ```
  Timeline and funding goal edits are out of scope because the contract does not
  expose entry functions to mutate `start_date`, `end_date`, or funding goal.
- **Default Values:** After data load, call `form.reset` with normalized values
  from the campaign data. Map the following fields:
  - `campaignName` → `campaign.name`
  - `description` → `campaign.shortDescription`
  - `campaignType` → Extracted from campaign type field
  - `categories` → Parse from `campaign.category` metadata
  - `socials` → Reconstruct array from `campaign.socialTwitter`,
    `campaign.socialDiscord`, `campaign.socialWebsite`
  - `campaignDetails` → Fetched from `useWalrusDescription` (Lexical JSON
    string)
  - Keep the original cover metadata (`name`, `size`, `lastModified`) for dirty
    comparison.
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
  - ✅ `CampaignCoverImageUpload`, `CampaignDetailsEditor`,
    `CampaignStorageRegistrationCard` - reuse with `disabled` prop
  - ⚠️ `CampaignTimeline`, `CampaignSocialsSection` - require adapters to honor
    `disabled` prop (disable popovers/triggers when not editing)
  - ℹ️ `CampaignFundingTargetSection` - becomes read-only (funding goal
    immutable)
  - ✅ `CampaignTypeSelector` - treat as read-only if the type is immutable
  - ❌ `CampaignTermsAndConditionsSection` - skip (creation-only requirement)
  - For each reused component, verify it threads `disabled` through popovers,
    buttons, and form controls; patch gaps before wiring the edit wrapper.

## 4. Dirty-Field Detection & UX

- **RHF Dirty Fields:** Use `formState.dirtyFields` from React Hook Form to
  detect edits:
  - **Sui-only fields:** `campaignName`, `description`
  - **Metadata-backed fields:** campaign type, `categories`, social links
    (`socials`)
  - **Walrus-backed fields:** `coverImage`, `campaignDetails`, storage epochs
- **File Comparison:** Because RHF treats any `File` re-selection as dirty,
  compare the new file against the original metadata (name, size, lastModified)
  to decide if an upload is truly required.
- **Lexical JSON:** Use string comparison for `campaignDetails`, treating
  `undefined` and `""` equivalently when both represent "unchanged".
- **Feedback:** Each `EditableSection` should display "Unsaved changes" when
  dirty and "Saved" after successful mutation. Disabled sections should
  highlight why (e.g., "Funding goal cannot be edited after launch").

## 5. Walrus Flow Integration

- **Hook Augmentation:** Extend `useWalrusUpload` hook (in
  `src/features/campaigns/hooks/useWalrusUpload.ts`) to accept
  `{ existingBlobId?: string, shouldUpload: boolean }`. When `shouldUpload` is
  false, short-circuit and return `{ blobId: existingBlobId }`. When true but no
  content is provided, throw a descriptive error before signing any transaction.
- **Upload Pipeline:** When Walrus fields changed, run prepare → register →
  upload → certify. Capture the new `walrus_quilt_id`, `walrus_storage_epochs`,
  and `cover_image_id`. Partial edits (description only) still use the same
  pipeline—cover image re-upload is optional.
- **Storage Card:** Reuse `CampaignStorageRegistrationCard` to display WAL cost
  and epochs. Lock it when unchanged; unlocking should invoke the Walrus warning
  modal first.
  - If no Walrus-backed field is dirty (`shouldUploadWalrus === false`), hide
    the "Register Storage" action and surface only a "Publish Update" primary
    CTA.

## 6. Transaction Builders & Mutations

- **MetadataPatch Type:** Define in `src/features/campaigns/types/campaign.ts`:
  ```ts
  export interface MetadataPatch {
    walrus_quilt_id?: string;
    walrus_storage_epochs?: string;
    cover_image_id?: string;
    category?: string;
    social_twitter?: string;
    social_discord?: string;
    social_website?: string;
  }
  ```
  Validate client-side that `walrus_quilt_id` and `walrus_storage_epochs` appear
  together. Metadata deletion is out of scope; pass empty strings if needed.
  Immutable keys (`funding_goal`, `recipient_address`) should not be included.
- **Transaction Builders:** Add to `src/services/campaign-transaction.ts`:
  - `buildUpdateCampaignBasicsTransaction(campaignId, ownerCapId, updates, network)`
    - Only pass optional `name` and `short_description` parameters; these are
      the sole struct fields the contract exposes for editing
    - Target: `${packageId}::campaign::update_campaign_basics`
  - `buildUpdateCampaignMetadataTransaction(campaignId, ownerCapId, patch, network)`
    - Convert the `MetadataPatch` into parallel `vector<string>` inputs for keys
      and values, omitting immutable keys
    - Target: `${packageId}::campaign::update_campaign_metadata`
- **Mutation Hooks:** Create in
  `src/features/campaigns/hooks/useCampaignMutations.ts`:
  - `useUpdateCampaignBasics()` - wraps `useSignAndExecuteTransaction` with
    `buildUpdateCampaignBasicsTransaction`
  - `useUpdateCampaignMetadata()` - wraps `useSignAndExecuteTransaction` with
    `buildUpdateCampaignMetadataTransaction`
  - `useToggleCampaignStatus()` - reuse existing `buildToggleActiveTransaction`
    from `campaign-transaction.ts`
  - Follow the pattern from `useCreateCampaign` for consistency
- **Batching Logic:** Compute `hasBasicsChanges` and `hasMetadataChanges`. Batch
  both Move calls into a single PTB only when both flags are true:
  ```ts
  if (hasBasicsChanges && hasMetadataChanges) {
    // Create a single transaction
    const tx = new Transaction();
    // Append basics call
    tx.moveCall({ /* update_campaign_basics */ });
    // Append metadata call
    tx.moveCall({ /* update_campaign_metadata */ });
    // Execute batched transaction
  } else if (hasBasicsChanges) {
    // Execute basics-only transaction
  } else if (hasMetadataChanges) {
    // Execute metadata-only transaction
  }
  ```
  Otherwise, execute the single relevant transaction to minimize gas.
  - When neither basics nor metadata changed, keep the CTA disabled to prevent
    no-op submissions; otherwise label the final button "Publish Update" instead
    of "Publish Campaign".

## 7. Validation & Messaging

- **Client Guards:** Mirror contract checks (string lengths, Walrus pairing,
  immutable metadata keys). Pre-validate before signing to avoid RPC costs. Reuse
  validation patterns from `newCampaignSchema.ts` and
  `validateCampaignFormData` in `campaign-transaction.ts`.
- **Funding Goal:** Treat funding goal as immutable—render in a read-only info
  box with copy explaining the policy (e.g., "Funding goal cannot be changed
  after campaign creation").
- **Recipient Address:** Display the donation address as static text (copyable)
  with helper messaging that it was set during creation and cannot change.
- **Error Handling:** Map Move abort codes to friendly text, distinguish wallet
  cancellations from execution failures, and provide retry UI for Walrus upload
  issues. Reuse error handling patterns from
  `src/features/campaigns/components/campaign-creation-modal/` where possible.
- **Deleted Campaign Messaging:** If contract returns `E_CAMPAIGN_DELETED`
  failure during edit, surface a dedicated banner or toast instructing the owner
  to contact support if this is unexpected. However, this should be rare since
  we gate the UI at load time.

## 8. Testing & QA

- **Unit Tests:** Cover transformer logic, metadata patch building, dirty
  detection (including file comparison), and transaction batching decisions. Use
  Vitest.
- **Integration Tests:** Add smoke tests (Vitest + mocked RPC) for:
  - Basics-only edit
  - Metadata-only edit
  - Combined edits
  - Walrus skip (no re-upload)
  - Unauthorized access (no owner cap)
  - Deleted campaign (treated as not found)
  - Walrus fetch failure fallback
- **Manual QA:** Verify flows for:
  - Basics edit (name, description)
  - Metadata edit with new Walrus upload
  - Combined edit (basics + metadata)
  - Unauthorized access
  - Walrus fetch failure fallback
  - Deleted campaign guard
  - Wallet rejection path
- **Telemetry (optional):** Emit analytics when sections enter edit mode or WAL
  uploads occur to monitor feature adoption.

## 9. Error & State Feedback

- Centralize abort-code → message mapping alongside the creation flow (consider
  creating `src/features/campaigns/utils/errorMapping.ts`).
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
| `CampaignStorageRegistrationCard`   | ✅ Reuse                      | Toggle edit mode + Walrus warning                                       |
| `CampaignTypeSelector`              | ✅ Reuse                      | Can be editable if contract supports (verify metadata update capability) |
| `CampaignTermsAndConditionsSection` | ❌ Skip                       | Creation-only requirement                                               |

## 11. Backward Compatibility

- Coordinate release with contract deployment; ensure legacy campaigns satisfy
  new validation (QA a sample from testnet).
- Handle missing metadata keys gracefully (default to empty strings). The
  `useCampaign` hook already handles this pattern.
- Document migration considerations if future contract updates add fields.

## 12. Out-of-Scope / Follow-Up

- WAL storage extension without re-upload
- Ownership transfer
- Admin bulk actions
- Automatic expiration warnings
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
│       └── errorMapping.ts (optional, new)
├── pages/
│   ├── CampaignPage.tsx (existing, reference patterns)
│   ├── NewCampaignPage.tsx (existing, reference layout)
│   └── EditCampaignPage.tsx (new)
├── services/
│   └── campaign-transaction.ts (existing, extend)
└── shared/
    └── config/
        ├── routes.ts (extend)
        └── contracts.ts (existing, use getContractConfig)
```

---

Use this plan to create tickets, assign ownership, and track progress toward
shipping the edit campaign experience. As new contract features land, update the
plan to keep front-end and on-chain behavior aligned.
