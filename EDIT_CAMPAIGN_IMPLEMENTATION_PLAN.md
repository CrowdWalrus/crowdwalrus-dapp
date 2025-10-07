# Edit Campaign Page Implementation Plan

This document outlines the work required to deliver the new **Campaign Edit**
experience. Use it to coordinate engineering tasks and keep implementation
consistent with contract capabilities.

---

## 1. Routing & Data Loading

- **Add Route:** Extend `src/shared/config/routes.ts` and
  `src/app/router/routes.tsx` with
  `ROUTES.CAMPAIGNS_EDIT = "/campaigns/:id/edit"`.
- **Page Shell:** Create `src/pages/EditCampaignPage.tsx` using the same layout
  conventions as `NewCampaignPage`.
- **Data Fetching:** Reuse `useCampaign` (on-chain metadata) plus
  `useWalrusDescription` / `useWalrusImage` patterns from `CampaignPage`. Treat
  the page as loading until campaign data, owner cap, and Walrus payload are all
  available.
- **Owner Capability Hook:** Implement `useOwnedCampaignCap(campaignId)` via
  `getOwnedObjects` filtered on `${PACKAGE_ID}::campaign::CampaignOwnerCap`.
  Return the matching `objectId` or `null`. Show a dedicated “Not authorized”
  state (no edit form) when the cap is absent. Default React Query caching is
  fine; refetch when the connected wallet changes.
- **Loading Coordination:** Gate render on
  `isLoadingCampaign || isLoadingCap || isLoadingWalrus`. Display skeletons
  while loading, “Not authorized” when the cap is missing, and “Not found” if
  campaign fetch fails. If the Walrus fetch fails but Sui data succeeds, render
  basics-only view with Walrus sections disabled and provide a retry affordance.

## 2. Form Schema & Transformation

- **Schema:** Fork `newCampaignSchema` into a builder that accepts the original
  end date:
  ```ts
  export const buildEditCampaignSchema = (originalEndDate: Date) =>
    newCampaignSchema
      .omit({
        termsAccepted: true,
        coverImage: true,
        startDate: true,
        targetAmount: true,
      })
      .extend({
        coverImage: z.instanceof(File).optional(),
        campaignDetails: z.string().optional(),
        endDate: z
          .string()
          .optional()
          .refine(
            (val) => !val || new Date(val) >= originalEndDate,
            "End date can only be extended, not reduced",
          ),
      });
  ```
- **Default Values:** After data load, call `form.reset` with normalized values
  (ISO strings, socials array reconstructed from metadata, serialized Lexical
  JSON). Keep the original cover metadata (`name`, `size`, `lastModified`) for
  dirty comparison.
- **Transformers:** Add `transformEditCampaignFormData` that returns:
  - Sui-only updates (name, short description, campaign type selections).
  - A `MetadataPatch` describing key/value updates.
  - `shouldUploadWalrus` boolean derived from dirty detection.

## 3. Editable UI Wrappers

- **EditableSection Interface:**
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
  The wrapper always renders its children but applies `pointer-events: none`,
  `aria-disabled`, and faded styling when `isEditing` is false. Parents own
  Save/Cancel actions and persistence. Every editable field renders with an
  inline “Edit” button that flips `isEditing` when clicked; all sections start
  disabled by default.
- **Editable vs Read-only Fields:** Enable toggles for title, short description,
  cover image, campaign type, categories, social links, rich text description,
  and any other metadata-backed Walrus content. Keep subdomain, funding target,
  recipient address, and timeline (start/end dates) permanently locked with
  read-only messaging.
- **Walrus Warning Flow:** When `requiresWalrusWarning` is true, `onToggleEdit`
  should open a shared `WalrusReuploadWarningModal`. Only after the user
  confirms should `onWalrusWarningAccepted` flip `isEditing` to true. The modal
  copy should read:
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
    `CampaignStorageRegistrationCard`.
  - ⚠️ `CampaignTimeline`, `CampaignSocialsSection` require adapters to honour
    `disabled`.
  - ℹ️ `CampaignFundingTargetSection` becomes read-only (funding goal
    immutable).
  - ✅ `CampaignTypeSelector` (treat as read-only if the type is immutable).
  - ❌ Skip creation-only UI such as `CampaignTermsAndConditionsSection`. For
    each reused component, verify it threads `disabled` through popovers,
    buttons, and form controls; patch gaps before wiring the edit wrapper.

## 4. Dirty-Field Detection & UX

- **RHF Dirty Fields:** Use `formState.dirtyFields` to detect edits. Sui-only
  fields include `campaignName`, `description`, `campaignType`, category
  selections, and social links. Walrus-backed fields include `coverImage`,
  `campaignDetails`, and storage epochs.
- **File Comparison:** Because RHF treats any `File` re-selection as dirty,
  compare the new file against the original metadata to decide if an upload is
  truly required.
- **Lexical JSON:** Use string comparison, treating `undefined` and `""`
  equivalently when both represent “unchanged”.
- **Feedback:** Each `EditableSection` should display “Unsaved changes” when
  dirty and “Saved” after successful mutation. Disabled sections should
  highlight why (e.g., “Funding goal cannot be edited after launch”).

## 5. Walrus Flow Integration

- **Hook Augmentation:** Extend `useWalrusUpload` to accept
  `{ existingBlobId, shouldUpload }`. When `shouldUpload` is false,
  short-circuit and return `{ blobId: existingBlobId }`. When true but no
  content is provided, throw a descriptive error before signing any transaction.
- **Upload Pipeline:** When Walrus fields changed, run prepare → register →
  upload → certify. Capture the new `walrus_quilt_id`, `walrus_storage_epochs`,
  and `cover_image_id`. Partial edits (description only) still use the same
  pipeline—cover image re-upload is optional.
- **Storage Card:** Reuse `CampaignStorageRegistrationCard` to display WAL cost
  and epochs. Lock it when unchanged; unlocking should invoke the Walrus warning
  modal first.
  - If no Walrus-backed field is dirty (`shouldUploadWalrus === false`), hide
    the “Register Storage” action and surface only a “Publish Update” primary
    CTA.

## 6. Transaction Builders & Mutations

- **MetadataPatch Type:**
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
- **Helpers:** Add `buildUpdateCampaignBasicsTransaction` and
  `buildUpdateCampaignMetadataTransaction` in
  `src/services/campaign-transaction.ts`. Expose `useUpdateCampaignBasics`,
  `useUpdateCampaignMetadata`, and `useToggleCampaignStatus` hooks mirroring
  `useCreateCampaign`.
- **Batching Logic:** Compute `hasBasicsChanges` and `hasMetadataChanges`. Batch
  both move calls into a single PTB only when both flags are true:
  ```ts
  if (hasBasicsChanges && hasMetadataChanges) {
    appendBasicsCall(tx);
    appendMetadataCall(tx);
  }
  ```
  Otherwise, execute the single relevant transaction to minimize gas.
  - When neither basics nor Walrus metadata changed, keep the CTA disabled to
    prevent no-op submissions; otherwise label the final button “Publish Update”
    instead of “Publish Campaign”.

## 7. Validation & Messaging

- **Client Guards:** Mirror contract checks (string lengths, extend-only end
  date, Walrus pairing). Pre-validate before signing to avoid RPC costs.
- **Funding Goal:** Treat funding goal as immutable—render in a read-only info
  box with copy explaining the policy.
- **Recipient Address:** Display the donation address as static text (copyable)
  with helper messaging that it was set during creation and cannot change.
- **Error Handling:** Map Move abort codes to friendly text, distinguish wallet
  cancellations from execution failures, and provide retry UI for Walrus upload
  issues. Reuse `CampaignCreationModal` error state styles where possible.

## 8. Testing & QA

- **Unit Tests:** Cover transformer logic, metadata patch building, dirty
  detection (including file comparison), and transaction batching decisions.
- **Integration Tests:** Add smoke tests (Vitest + mocked RPC) for basics-only,
  metadata-only, combined edits, Walrus skip, and unauthorized scenarios.
- **Manual QA:** Verify flows for: basics edit, metadata edit with new Walrus
  upload, combined edit, unauthorized access, Walrus fetch failure fallback, and
  wallet rejection path.
- **Telemetry (optional):** Emit analytics when sections enter edit mode or WAL
  uploads occur to monitor feature adoption.

## 9. Error & State Feedback

- Centralise abort-code → message mapping alongside the creation flow.
- Prefill inline field errors, use toast notifications for general failures, and
  keep the Walrus warning modal dedicated to cost disclosures.
- Display contextual banners when Walrus description fails to load but Sui data
  is available.

## 10. Component Reference

| Component                           | Reuse Strategy                | Notes                                                            |
| ----------------------------------- | ----------------------------- | ---------------------------------------------------------------- |
| `CampaignCoverImageUpload`          | ✅ Reuse with `disabled` prop | Seed preview URL from existing blob; block drag/drop when locked |
| `CampaignDetailsEditor`             | ✅ Reuse                      | Use `readOnly` flag when section locked                          |
| `CampaignTimeline`                  | ⚠️ Needs wrapper              | Disable popovers/triggers when not editing                       |
| `CampaignFundingTargetSection`      | ℹ️ Read-only                  | Display funding goal; remove inputs                              |
| `CampaignSocialsSection`            | ⚠️ Needs wrapper              | Disable selects, inputs, and add/remove buttons                  |
| `CampaignStorageRegistrationCard`   | ✅ Reuse                      | Toggle edit mode + Walrus warning                                |
| `CampaignTypeSelector`              | ✅ Reuse                      | Leave read-only if type immutable                                |
| `CampaignTermsAndConditionsSection` | ❌ Skip                       | Creation-only requirement                                        |

## 11. Backward Compatibility

- Coordinate release with contract deployment; ensure legacy campaigns satisfy
  new validation (QA a sample).
- Handle missing metadata keys gracefully (default to empty strings).
- Document migration considerations if future contract updates add fields.

## 12. Out-of-Scope / Follow-Up

- WAL storage extension without re-upload, ownership transfer, admin bulk
  actions, and automatic expiration are outside MVP—track separately.

---

Use this plan to create tickets, assign ownership, and track progress toward
shipping the edit campaign experience. As new contract features land, update the
plan to keep front-end and on-chain behaviour aligned.
