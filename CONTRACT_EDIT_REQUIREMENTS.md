# Contract Update Requirements for Campaign Editing

## Background
We are introducing an on-chain edit flow so campaign owners can adjust certain fields after creation while keeping immutable data (e.g., subdomain, creation timestamp) intact. The current `crowd_walrus` Move package only exposes `create_campaign` and auxiliary functions for updates history, which means any edit attempt must be encoded as a brand-new campaign. The new front-end will depend on contract support for partial edits that:

- Separate inexpensive Sui-only updates (title, short description, status) from storage-heavy Walrus metadata.
- Enforce the same or stricter validation rules as creation at the time of edit.
- Emit structured events so downstream indexers can reconcile diffs.
- Preserve capability-based ownership checks via `CampaignOwnerCap`.

The changes below describe what must be added or adjusted in the Move codebase **without supplying the final implementation**; each item explains _what_ to build and _why_ it matters for the product.

### Walrus Metadata Snapshot
When a campaign is created or edited, the front-end serializes the Lexical rich-text editor state (JSON string) and packages that JSON plus the cover image into a Walrus quilt upload. The contract does not store the blob itself; it only keeps references inside `campaign.metadata` so off-chain clients can fetch the quilt, download `description.json` (serialized Lexical editor state), and rebuild the editor state.

- `walrus_quilt_id`: String-encoded u256 returned by Walrus that points to the quilt bundle containing the serialized description JSON and embedded assets.
- `walrus_storage_epochs`: String representing the number of epochs we prepay Walrus to retain the quilt.
- `cover_image_id`: String handle for the primary image inside the quilt bundle (defaults to `cover.jpg` unless the UI names it differently).
- Additional keys like `category`, `social_twitter`, and `social_discord` stay alongside the Walrus entries so the contract keeps one metadata map for both storage pointers and ancillary campaign details.

## Required Changes

### 1. Add Entry Function for Editing Core Fields (`update_campaign_basics`)
- **What:** Introduce a new `entry fun update_campaign_basics` that accepts mutable `Campaign`, the caller’s `CampaignOwnerCap`, optional new name and optional new short description, plus `Clock`/`TxContext` for validation and event emission. Optionality should be expressed as `option::Option<String>` parameters (`None` = do not change, `Some(value)` = update). The `Campaign` struct now stores the donation destination as a dedicated `recipient_address: address` field (moved out of metadata).
- **Why:** The UI needs a lightweight transaction when owners only tweak Sui-stored strings. Bundling both fields in one function reduces round trips, keeps edits atomic, and avoids forcing a Walrus upload when the user changes text copy only.
- **Business Rules to Enforce:** Validate string length ranges (see validation constants below), ensure the campaign is active (or decide on a relaxed rule and document it), and emit a `CampaignBasicsUpdated` event containing campaign ID, editor address, timestamp, and flags for the fields that changed.

### 2. Add Entry Function for Editing Metadata (`update_campaign_metadata`)
- **What:** Expose `entry fun update_campaign_metadata` that updates or inserts key/value pairs in `campaign.metadata`. It must accept parallel vectors of keys and values, guard that their lengths match, and loop through to mutate existing entries or append new ones.
- **Why:** Metadata holds Walrus blob identifiers, category, and social links. The edit page will call this function after finishing a Walrus upload or changing any metadata-backed field, so the contract must allow targeted updates without recreating the whole object.
- **Additional Requirements:**
  - Cap total metadata size (e.g., max keys) to prevent denial-of-service (see implementation note on counting inserts below).
  - Require both `walrus_quilt_id` and `walrus_storage_epochs` when either changes to keep storage state consistent. Solo updates are disallowed in MVP; edits to Walrus-backed content must upload a fresh blob and update both fields together.
  - Reject attempts to mutate `funding_goal`; that key is immutable after creation to block bait-and-switch behaviour.
  - Metadata deletions are **out of scope** for MVP. Empty strings (`""`) are the intended mechanism for blanking metadata values. Frontend should only send empty strings when users explicitly clear fields. Contract treats `""` as a valid value and stores it normally in the `VecMap`.
  - Preserve existing insertion order (`VecMap` maintains first-write order). New keys append to the end; overwrites leave the original position unchanged.
  - Emit a `CampaignMetadataUpdated` event listing changed keys, timestamp, and editor address.

### 3. Promote Status Toggle to an Entry Function
- **What:** Convert the existing `set_is_active` helper into an `entry fun toggle_active` (or equivalent) that flips `campaign.isActive` while checking the owner capability.
- **Why:** The UI already surfaces enable/disable actions. Without an entry function the front-end cannot call this logic, leading to mismatched behavior between creation and maintenance. The new event (`CampaignStatusChanged`) includes only `new_status`; indexers can derive the previous `isActive` value by querying the Campaign object state immediately prior to this transaction, or by inverting `new_status` since this is a toggle operation.

### 4. Strengthen Validation in `create_campaign`
- **What:** Update `create_campaign` to replicate the same string-length, date ordering, and Walrus field requirements we plan to enforce during edits. Validations should cover name/description ranges, `start_date < end_date`, `start_date` not in the past, a non-zero `recipient_address` argument (`recipient_address != @0x0`), and required metadata keys such as `walrus_quilt_id`, `walrus_storage_epochs`, and `cover_image_id`. The entry function should accept `recipient_address: address` explicitly instead of relying on metadata.
- **Why:** The edit functions will rely on these invariants holding. If creation is more permissive than edits, we risk legacy data becoming uneditable or failing validation later. Bringing both paths to parity prevents divergence. These rules apply starting with the October 2025 redeploy; no legacy campaigns exist.

### 5. Enforce Immutability Constraints
- **What:** Add inline documentation and asserts clarifying which fields cannot change (subdomain, start date, creation timestamp, validation status, admin ID, funding goal, and recipient address). Guard `update_campaign_metadata` with a runtime abort (`E_FUNDING_GOAL_IMMUTABLE`) if the request includes the `funding_goal` key, and ensure the new struct field has no mutator.
- **Why:** Future contributors need guidance when modifying the module. Explicit checks prevent accidental relaxations that would break front-end assumptions or governance rules.

### 6. Emit New Events for Every Edit Path
- **What:** Define new structs and emit them from the corresponding entry functions:
  - `struct CampaignBasicsUpdated has copy, drop { campaign_id: ID, editor: address, timestamp_ms: u64, name_updated: bool, description_updated: bool }`
  - `struct CampaignMetadataUpdated has copy, drop { campaign_id: ID, editor: address, timestamp_ms: u64, keys_updated: vector<String> }`
  - `struct CampaignStatusChanged has copy, drop { campaign_id: ID, editor: address, timestamp_ms: u64, new_status: bool }`
- **Timestamp semantics:** The `timestamp_ms: u64` field stores Unix epoch milliseconds obtained from `Clock::timestamp_ms(&clock)`, NOT the Sui epoch number. This value updates once per checkpoint and remains identical for all calls within the same transaction.
- **Implementation note:** Move events must own their payloads. When emitting vectors you still read afterwards, copy them first, for example:
  ```
  let mut keys_for_event = vector::empty<String>();
  vector::extend(&mut keys_for_event, &keys);
  event::emit(CampaignMetadataUpdated { keys_updated: keys_for_event, ... });
  ```
  This avoids borrow-checker issues and makes ownership explicit.
- **Why:** Indexers and analytics need to track history with minimal replay work while keeping gas costs predictable.

### 7. Guard Against Oversized Metadata Updates
- **What:** Introduce checks for maximum vector lengths and string sizes inside metadata updates. Count only newly inserted keys (`new_inserts`) when enforcing the `MAX_METADATA_KEYS` limit so overwriting existing entries does not hit false positives. Optionally log or abort when keys exceed a predefined set if we decide to maintain a whitelist.
- **Why:** `VecMap` lookups are O(n); unbounded growth can cause gas spikes or timeouts. Sui documentation recommends vector-backed collections remain under 1,000 items for optimal performance. Early safeguards keep the contract performant until a more scalable structure (e.g., `sui::table`) is introduced if needed.

### 8. Add Unit/Integration Tests Covering New Paths
- **What:** Extend Move test suite to cover happy and failure cases for each new entry function, ensuring capability checks, validation, and event emission behave as expected.
- **Why:** Contract changes are security-sensitive. Automated tests will prevent regressions while we iterate on front-end features tied to these functions.

## Error Codes
Reserve the following abort codes for the edit feature (existing codes 0–3 remain unchanged, future work can use higher numbers):

```
const E_CAMPAIGN_NOT_ACTIVE: u64 = 4;
const E_INVALID_NAME_LENGTH: u64 = 5;
const E_INVALID_DESCRIPTION_LENGTH: u64 = 6;
const E_KEY_VALUE_MISMATCH: u64 = 7;
const E_METADATA_TOO_LARGE: u64 = 8;
const E_INVALID_DATE_RANGE: u64 = 9;
const E_START_DATE_IN_PAST: u64 = 10;
const E_MISSING_STORAGE_EPOCHS: u64 = 11;
const E_CANNOT_CHANGE_GOAL_WITH_DONATIONS: u64 = 12; // reserved for future donation metrics
const E_FUNDING_GOAL_IMMUTABLE: u64 = 13;
const E_RECIPIENT_ADDRESS_INVALID: u64 = 14;
const E_RECIPIENT_ADDRESS_IMMUTABLE: u64 = 15;
```

### Constants

Define these constants in the `crowd_walrus::campaign` module at the top level (below imports, above structs):

```
const NAME_MIN_LEN: u64 = 3;
const NAME_MAX_LEN: u64 = 80;
const DESCRIPTION_MIN_LEN: u64 = 10;
const DESCRIPTION_MAX_LEN: u64 = 280;
const MAX_METADATA_KEYS: u64 = 32;
```

Use these bounds in both `create_campaign` and `update_campaign_basics`.

## Testing Expectations
Add Move tests that:

- Succeed and emit events for happy-path basics and metadata edits.
- Abort with the appropriate error codes for each guard (inactive campaign, missing Walrus fields, metadata overflow, funding goal immutability, recipient address validation, etc.).
- Exercise the new `create_campaign` validations to ensure new campaigns still pass creation after the stricter checks.
- Verify event field values match expected behavior:
  - `CampaignBasicsUpdated`: `name_updated` and `description_updated` flags correctly reflect which fields changed (true when `Some(value)` provided, false when `None`)
  - `CampaignMetadataUpdated`: `keys_updated` vector correctly lists all modified keys and preserves ordering
  - All events: `timestamp_ms` values are non-zero and identical within same transaction
  - All events: `editor` address matches transaction sender from `TxContext`

## Deferred Features
The following features were discussed during planning but are **out of scope for MVP** and may be implemented in future phases:

- **Funding Goal Edits:** Initially considered with locking mechanism after first donation, but ultimately decided to make `funding_goal` completely immutable to eliminate bait-and-switch attacks.
- **Grace Period for Deadline Reductions:** Considered implementing a 7-day notice period before `end_date` reductions take effect, but deferred due to MVP timeline constraints.
- **Walrus Storage Extension:** Extending blob storage epochs without re-uploading content is not supported in MVP. All Walrus content edits require new blob uploads with updated `walrus_quilt_id` and `walrus_storage_epochs`.

## Summary
The contract must grow a dedicated edit surface that respects capability-based ownership, maintains immutable invariants, and cleanly separates Sui-only edits from Walrus-dependent metadata changes. Implementing the entry functions, validations, and events above enables the front-end edit page, keeps storage costs predictable, and provides auditable history for every change.
