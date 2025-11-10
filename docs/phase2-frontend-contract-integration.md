# Crowd Walrus — Phase 2 Frontend Contract Integration Plan

Version: 2025-11-04
Scope: Update the existing Phase 1 frontend to integrate Phase 2 contract changes and expose new on-chain features. This plan is ordered, focuses strictly on contract interactions (no UI work), and calls out concrete file touch points.

## 1) Contract Addresses & Network Config ✅ Completed – 2025-11-08

- Update `src/shared/config/contracts.ts` to include new shared object IDs that Phase 2 entries require.
  - Add to `ContractAddresses` and each network config:
    - `policyRegistryObjectId: string`
    - `profilesRegistryObjectId: string`
    - `tokenRegistryObjectId: string`
    - `badgeConfigObjectId: string`
  - Keep existing: `packageId`, `crowdWalrusObjectId`, `suinsManagerObjectId`, `suinsObjectId`.
- Update `src/shared/config/networkConfig.ts` variables passed to `createNetworkConfig` to surface these new IDs under `contracts` per network.
- Note: After deploying Phase 2, populate these IDs from deployment outputs or the emitted creation events:
  - `crowd_walrus::PolicyRegistryCreated`
  - `crowd_walrus::ProfilesRegistryCreated`
  - `crowd_walrus::TokenRegistryCreated`
  - `crowd_walrus::BadgeConfigCreated`

Deliverable: contracts config compiles with extended shape; no runtime lookups of these IDs. **Done** – see `src/shared/config/contracts.ts` and `src/shared/config/networkConfig.ts`.

Notes:
- Each environment now includes Policy/Profiles/Token/Badge object IDs alongside package + CrowdWalrus IDs.
- IDs were verified on Sui testnet using `sui client object <id>` and are surfaced through `getContractConfig` for downstream services.

## 2) Campaign Creation (breaking changes) ✅ Completed – 2025-11-09

Contracts: `crowd_walrus::create_campaign` signature changed and core fields are now typed.

- Update builder in `src/services/campaign-transaction.ts: buildCreateCampaignTransaction`:
  - New argument order (must match exactly):
    1. `&CrowdWalrus` (shared)
    2. `&platform_policy::PolicyRegistry` (shared)
    3. `&mut profiles::ProfilesRegistry` (shared)
    4. `&suins_manager::SuiNSManager` (shared)
    5. `&mut suins::SuiNS` (shared)
    6. `&Clock` (shared)
    7. `name: String`
    8. `short_description: String`
    9. `subdomain_name: String`
    10. `metadata_keys: vector<String>`
    11. `metadata_values: vector<String>`
    12. `funding_goal_usd_micro: u64` (typed)
    13. `recipient_address: address`
    14. `policy_name: Option<String>` (preset or `None` for default "standard")
    15. `start_date: u64` (ms UTC)
    16. `end_date: u64` (ms UTC)
    17. `&mut TxContext`
  - Compute `funding_goal_usd_micro` from the form’s USD value using integer math only (see Types below). Parse the user’s decimal string and convert to micros with bigint (avoid `Number`/`Math.floor` to prevent precision loss), e.g. `parseUsdToMicros(value: string): bigint`.
  - Provide `policy_name` via `tx.pure.option('string', presetOrNull)`; until a selector exists, pass `null` to use the default preset.
  - Pass `tx.object(config.contracts.policyRegistryObjectId)` and `tx.object(config.contracts.profilesRegistryObjectId)` as the 2nd and 3rd args.
- Stop writing `funding_goal` into metadata during creation.
  - In `prepareMetadataVectors(...)` remove the `funding_goal` key entirely.
- Keep writing Walrus keys (`walrus_quilt_id`, `walrus_storage_epochs`, `cover_image_id`), plus non-critical keys like `category`, `campaign_type`, `socials_json`.

Deliverables:
- `buildCreateCampaignTransaction` compiles with the new signature and uses the two new shared objects. **Done** – see `src/services/campaign-transaction.ts`.
- Creation wizard continues to work with unchanged UI; the contract now sets `Campaign.stats_id` and auto-creates a Profile for the owner. **Done** – funding goal now typed, metadata cleansed, policy preset selector wired to live registry.

Notes:
- Policy presets are fetched at runtime (no hard-coded defaults); campaign creation/edit flows now preserve any custom presets defined on-chain.
- All funding goal math uses bigint micros (`parseUsdToMicros`), and UI components render `fundingGoalUsdMicro` to prevent precision loss.

## 3) Types and parsing (typed core fields) ✅ Completed – 2025-11-09

- Update `src/features/campaigns/types/campaign.ts`:
  - In `CampaignFormData`, clarify `funding_goal` is denominated in USD (not SUI). Add optional `policyPresetName?: string` if you want to wire presets later.
- Update `useCampaign` (src/features/campaigns/hooks/useCampaign.ts) and `useAllCampaigns` parsing to read new fields:
  - Funding goal: read from typed `fields.funding_goal_usd_micro` (u64), not metadata. Surface as `fundingGoalUsdMicro: bigint` in your internal `CampaignData` and compute display dollars client-side (avoid JS `number`). Treat all `*_usd_micro` values as `bigint` end‑to‑end.
  - Recipient address: nested under `fields.payout_policy.fields.recipient_address` (payout policy moved into a struct). Remove fallback to metadata.
  - Optional (expose payout policy): add `payoutPlatformBps` and `payoutPlatformAddress` from `payout_policy` for downstream logic/labels.
- Do not attempt to edit/start/end/funding/policy via metadata. Those are immutable from creation; metadata updates remain allowed for other keys.

Deliverables: hooks compile and return accurate values for funding goal and recipient, matching Phase 2 object layout. **Done** – see `src/features/campaigns/types/campaign.ts`, `useCampaign.ts`, `useAllCampaigns.ts`.

Notes:
- Funding goals are parsed/stored as `bigint` micros end-to-end; UI formatting happens only at display time via `currency.ts`.
- Recipient and policy data come directly from the typed `payout_policy` struct (no metadata fallback), and `payoutPlatformBps` / `payoutPlatformAddress` are exposed for future logic.

## 4) Campaign Stats (new shared aggregate) ✅ Completed – 2025-11-09

Contracts create a per-campaign `CampaignStats` shared object and link it via `Campaign.stats_id`.

- Add `src/features/campaigns/hooks/useCampaignStats.ts`:
  - Fetch the `Campaign` to read `stats_id`.
  - `getObject(stats_id, { showContent: true })` to read:
    - `total_usd_micro: u64`
    - `total_donations_count: u64`
  - Optional per-coin breakdowns:
    - If needed, iterate enabled coins from TokenRegistry (see Section 5) and query dynamic fields keyed by `PerCoinKey<T>` via `getDynamicFieldObject` to read `PerCoinStats<T> { total_raw, donation_count }`.
- Backfill existing places showing “supporters” or totals to consume this hook rather than recomputing from events.

Deliverables: a reusable hook that provides `totalUsdMicro`, `totalDonationsCount`, and optionally coin-specific totals. **Done** – `useCampaignStats` now powers campaign detail, profile, explore, and admin surfaces with live totals (plus per-coin helpers when needed). All consumers log stats errors and fall back to safe zero states so list/grid views never show stale data while still surfacing the issues for debugging.

## 5) Token Registry (read-only) ✅ Completed – 2025-11-09

- Add `src/features/tokens/hooks/useEnabledTokens.ts` to derive the list of enabled token types and metadata by querying owned/shared `TokenRegistry` object (ID from config) dynamic fields or by consuming `Token*` events.
- Expose `{ coinType, symbol, decimals, pythFeedId, maxAgeMs }` and an `isEnabled` flag; cache with React Query.

Deliverables: read-only hooks to list enabled tokens for donors and stats. **Done** – `useEnabledTokens` now fetches every `token_registry::TokenMetadata` dynamic field from the shared registry, parses coin metadata (including 32-byte `pyth_feed_id`, decimals, `max_age_ms`, enablement), and caches the results via React Query for downstream donation + stats flows. A feature-level barrel export (`src/features/tokens/index.ts`) and shared dynamic-field paginator keep the hook composable for future admin + oracle wiring.

## 6) Profiles (new feature and auto-creation) ✅ Completed – 2025-11-09

- Auto-creation touchpoints:
  - `create_campaign` now calls `profiles::create_or_get_profile_for_sender` automatically.
  - First-time donation path creates and transfers a `Profile` to the donor.
- Add profile utilities:
  - `src/features/profiles/hooks/useProfile.ts`:
    - Read `ProfilesRegistry` (ID from config) to resolve `profile_id` by owner address, then `getObject(profile_id)` for totals and metadata.
  - `src/services/profile.ts`:
    - `createProfile()` → `profiles::create_profile` (registry + clock)
    - `updateProfileMetadata(key: string, value: string)` → `profiles::update_profile_metadata` (profile + clock). For batching, issue multiple calls in a single PTB.

Deliverables: basic hooks and transactions for profile read/update flows; reuse in donation flow selection logic.
**Done** – `useProfile` now resolves profile IDs via the shared registry, exposes both raw and sanitized metadata, and normalizes the `__cw_removed__` sentinel so UI surfaces blanks consistently. `profile.ts` provides create/update builders plus batching helpers, and `ProfileCreatePage` consumes them to create-or-update profiles while allowing users to clear stored metadata (by writing the sentinel) without regressions in future detail views.

## 7) Pyth Price Oracle wiring (required for donations) ✅ Completed – 2025-11-10

- Create `src/services/priceOracle.ts`:
  - Off-chain: fetch a fresh Pyth price update (VAAs) for the selected coin’s `pyth_feed_id` (from Token Registry) from a supported endpoint.
  - In-PTB: add the Pyth entry call that materializes a `PriceInfoObject` (e.g., `pyth::update_price_feeds(...)`) and capture its `Result` handle for the subsequent donation call in the same transaction.
  - Pass that `PriceInfoObject` into `donate_*` builder as an argument.
- Respect registry staleness policy: leave `opt_max_age_ms = null` by default so the contract uses `TokenRegistry.max_age_ms<T>`. Allow overrides later.

Deliverables: a minimal service that returns `{ priceInfoObjectArg, quotedUsdMicroPreview }` to the donation builders.
**Done** – `src/services/priceOracle.ts` now fetches fresh VAAs from Hermes, wires `SuiPythClient.updatePriceFeeds` into the caller’s PTB, mirrors Move’s `quote_usd` math with bigint, and returns the hydrated `PriceInfoObject`, USD micro preview, and registry `max_age_ms`. A shared `applySlippageTolerance` helper and u64 overflow guard prep Task 8 to derive `expected_min_usd_micro` while still defaulting `opt_max_age_ms` to the registry value.

## 8) Donation Flows (new features)

Contracts: `donations::donate_and_award_first_time<T>` and `donations::donate_and_award<T>` with price oracle and slippage protection.

- Prerequisites: Sections 5 (Token Registry – read-only), 6 (Profiles), 7 (Price Oracle).

- Add `src/services/donations.ts` with two builders:
  - `buildFirstTimeDonationTx<T>` calling `donations::donate_and_award_first_time<T>`.
  - `buildRepeatDonationTx<T>` calling `donations::donate_and_award<T>`.
- Required references/args (both flows):
  - `&mut campaign::Campaign` (campaign object)
  - `&mut campaign_stats::CampaignStats` (use `stats_id` from campaign)
  - `&token_registry::TokenRegistry` (`config.contracts.tokenRegistryObjectId`)
  - `&badge_rewards::BadgeConfig` (`config.contracts.badgeConfigObjectId`)
  - `&Clock`
  - `Coin<T>` (assemble coin objects of the selected `T`)
  - `&pyth::price_info::PriceInfoObject` (fresh)
  - `expected_min_usd_micro: u64` (slippage floor)
  - `opt_max_age_ms: Option<u64>` (use `null` to defer to registry defaults; allow user override later)
- Extra refs:
  - First‑time flow only: `&mut profiles::ProfilesRegistry` (`config.contracts.profilesRegistryObjectId`).
  - Repeat flow only: `&mut profiles::Profile` (resolve sender’s profile ID; caller must pass the owned, mutable Profile object).
- Coin selection: select and merge coin objects of type `T` using the dapp-kit client (`selectCoins` + `tx.mergeCoins` or `tx.splitCoins`) to reach the target raw amount.
- Slippage: derive `expected_min_usd_micro` from the quoted USD returned by the off-chain price preview (see Section 7) multiplied by `(1 - tolerance)`; recommend default tolerance 1–2%.

- Routing: if a Profile already exists for the signer, call the repeat path; otherwise call the first‑time path (the first‑time entry aborts if a profile already exists).
- Return value: both donation entries return `DonationAwardOutcome { usd_micro, minted_levels }`. Plumb this through the service for analytics/UX.

Deliverables: donation service builds valid PTBs for both new and returning donors, parametrized by coin type `T`, and returns `DonationAwardOutcome`.

_Notes (2025-11-10):_
- `src/services/priceOracle.ts` already exposes `attachPriceOracleQuote` + `applySlippageTolerance`, returning the hydrated `PriceInfoObject`, USD micros, and registry `max_age_ms`; donation builders can call it directly before `donate_*`.
- Token metadata (`symbol`, `decimals`, `pyth_feed_id`, `max_age_ms`, `enabled`) is available via `useEnabledTokens` → `fetchTokenRegistryEntries`, so Task 8 just needs to plumb the selected `TokenRegistryEntry` forward.
- Profiles: `useProfile` and `profile.ts` builders handle creation/updates; repeat donations must load the owned `Profile` object to satisfy the `&mut profiles::Profile` argument.

## 9) Badges (non-transferable rewards)

- Read-only:
  - Add `src/features/badges/hooks/useDonorBadges.ts` to list owned `badge_rewards::DonorBadge` objects for the connected wallet.
- Admin wrapper:
  - `updateBadgeConfig(amountThresholdsMicro: u64[5], paymentThresholds: u64[5], imageUris: string[5])` → `crowd_walrus::update_badge_config` (requires `&mut BadgeConfig`, `&AdminCap`, `&Clock`).
- Display registration (one-time publisher task): if needed post-publish, call `badge_rewards::setup_badge_display` with package `Publisher`.

Deliverables: badge read hook and admin transaction builder.

## 10) Token Registry (admin)

- Add transactions in `src/services/admin.ts` and export helpers:
  - `addToken<T>(symbol, name, decimals, pythFeedId: Uint8Array, maxAgeMs)` → `crowd_walrus::add_token<T>`
  - `updateTokenMetadata<T>(...)` → `crowd_walrus::update_token_metadata<T>`
  - `setTokenEnabled<T>(enabled)` → `crowd_walrus::set_token_enabled<T>`
  - `setTokenMaxAge<T>(maxAgeMs)` → `crowd_walrus::set_token_max_age<T>`
- Each requires `&mut TokenRegistry`, `&AdminCap`, and `&Clock`.

Deliverables: admin wrappers to manage tokens.

## 11) Platform Policy Presets (admin)

- Read-only for creation: creation now accepts only presets by name. Until a selector exists, pass `None` to use the default preset name (`crowd_walrus::default_policy_name()` returns "standard").
- Admin wrappers in `src/services/admin.ts`:
  - `addPlatformPolicy(name, platformBps, platformAddress)` → `crowd_walrus::add_platform_policy`
  - `updatePlatformPolicy(name, platformBps, platformAddress)` → `crowd_walrus::update_platform_policy`
  - `enablePlatformPolicy(name)` → `crowd_walrus::enable_platform_policy`
  - `disablePlatformPolicy(name)` → `crowd_walrus::disable_platform_policy`
- Each requires `&mut PolicyRegistry`, `&AdminCap`, and `&Clock`.

Deliverables: policy management transaction builders; creation builder already wires preset usage.

## 12) Events & Indexing (optional hooks)

- Add event hooks for new signals when helpful for UX or analytics:
  - `donations::DonationReceived` — canonical per-donation record.
  - `campaign::CampaignParametersLocked` — emitted on first donation; can be watched to gate edits.
  - `campaign_stats::CampaignStatsCreated` — created at campaign creation time.
  - `profiles::ProfileCreated`, `profiles::ProfileMetadataUpdated` — reflect profile lifecycle.
  - `badge_rewards::BadgeMinted`, `BadgeConfigUpdated` — reward tracking.
  - `platform_policy::*` and `token_registry::*` — admin audit trail.
- Use `useSuiClient().queryEvents({ query: { MoveEventType }, order: 'descending' })` mirroring the existing `useCampaignUpdates` pattern.

Deliverables: event constants and optional hooks; no UI consumption required now.

## 13) Existing mutation helpers (verify/unverify/activate/deactivate/delete)

- No signature changes beyond create/delete argument reorder already aligned in `campaign-transaction.ts`:
  - Verify/Unverify: unchanged (`crowd_walrus::verify_campaign`, `unverify_campaign`).
  - Activate/Deactivate: unchanged (`campaign::update_active_status`).
  - Delete: still requires `crowd_walrus`, `suins_manager`, `suins`, `&Clock`, `Campaign`, `CampaignOwnerCap`.

Deliverables: confirm current helpers compile against Phase 2.

## 14) Search-and-update touch points (precise diffs)

- `src/services/campaign-transaction.ts`
  - Create: add policy + profiles registries args; add `funding_goal_usd_micro`; add `policy_name: Option<String>`.
  - `prepareMetadataVectors`: remove `funding_goal` key; keep Walrus keys and other non-critical keys.
- `src/features/campaigns/hooks/useCampaign.ts`
  - Parse `fields.funding_goal_usd_micro` → `fundingGoalUsdMicro`.
  - Parse `fields.payout_policy.fields.recipient_address` → `recipientAddress`.
- `src/features/campaigns/hooks/useAllCampaigns.ts`
  - Same parsing updates as above; drop metadata fallbacks for funding/recipient.
- Add new files:
  - `src/features/campaigns/hooks/useCampaignStats.ts`
  - `src/services/donations.ts`
  - `src/services/priceOracle.ts`
  - `src/features/tokens/hooks/useEnabledTokens.ts`
  - `src/services/admin.ts`
  - `src/features/profiles/hooks/useProfile.ts`
  - `src/services/profile.ts`
  - `src/features/badges/hooks/useDonorBadges.ts`
- `src/shared/config/contracts.ts` and `src/shared/config/networkConfig.ts`
  - Extend shapes and wire new IDs across `devnet/testnet/mainnet`.

Deliverables: compile-time-safe mappings to Phase 2 data and entries.

## 15) Runtime safeguards

- Respect parameter immutability after first donation:
  - Frontend should already avoid editing funding goal/recipient via metadata; keep server-side guards intact.
- Slippage safety: always pass `expected_min_usd_micro` for donations; derive from preview with a tolerance (1–2%).
- Staleness: default to `opt_max_age_ms = null` unless the user chose a stricter limit.
- Indexer drift: prefer on-chain `CampaignStats` for totals instead of event sums.

Deliverables: safer default behaviors for new flows.

## 16) Post-deploy configuration checklist (ops)

- Fill in all new shared object IDs in `contracts.ts` once Phase 2 is deployed.
- Seed or update platform policy presets via admin transactions (e.g., `"standard"`, `"commercial"`).
- Onboard tokens in `TokenRegistry` (symbol/name/decimals/feed, enable, set max_age_ms).
- Configure `BadgeConfig` thresholds and image URIs.

---

## Reference: Phase 2 modules and key entries

- Creation: `crowd_walrus::create_campaign(...) → campaign_id`
- Donations: `donations::donate_and_award_first_time<T>(...) → DonationAwardOutcome`, `donations::donate_and_award<T>(...) → DonationAwardOutcome`
- Stats: `campaign_stats::CampaignStatsCreated` event; `Campaign.stats_id` field; `CampaignStats.total_usd_micro`, `total_donations_count`
- Policies: `crowd_walrus::{add,update,enable,disable}_platform_policy`
- Token registry: `crowd_walrus::{add_token,update_token_metadata,set_token_enabled,set_token_max_age}<T>`
- Profiles: `profiles::{create_profile,update_profile_metadata}`; auto-creation in create_campaign and first-time donate
- Badges: `badge_rewards::setup_badge_display`, `crowd_walrus::update_badge_config`

This plan contains only contract interaction tasks. UI wiring (selectors, buttons, toasts, etc.) is intentionally out of scope and can be layered on after these services and hooks land.
