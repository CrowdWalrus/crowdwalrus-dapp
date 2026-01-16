# CrowdWalrus Dapp - Minimal Test Scenarios and Success Criteria

This document defines code-aligned test scenarios for the current frontend
features. All scenarios below are based on the validation and flow logic in the
codebase and are intended as manual acceptance tests.

## Preconditions and Test Data

- Use a wallet that can sign Sui transactions and has enough gas.
- Have WAL available to cover Walrus storage registration (campaigns, updates,
  profile avatar).
- Have at least two wallets for donor vs campaign owner testing.
- Have at least one verified campaign and one unverified campaign for
  verification filters.
- Have at least one campaign in each status bucket when possible (open soon,
  funding, active, ended).
- Use valid Sui addresses (0x... format) for wallet and admin actions.
- Have at least one commercial-fee campaign and one nonprofit (0-fee) campaign for fee math verification.
- Have at least one donor wallet holding WAL and USDC (or the two supported tokens you want to QA) to validate decimals + USD pricing.
- Have a third wallet for unique-donor counting (unique donors != donation count).
- Have a verifier/admin wallet (VerifyCap) for verify/unverify + listing tests (if applicable).
- Have a campaign with 0 donations and a campaign with 0 updates to validate empty states.
- Have a multi-category campaign (2+ categories) to validate badge rendering and overflow handling.
- Use at least two wallet providers to validate user-rejection handling across providers.
- Use a Sui explorer to verify on-chain payout splits and oracle-priced USD records.

---

## Navigation and Static Pages

**TC-NAV-01: Primary navigation routes**

- Steps: Open the app header links for Home, Campaigns, About, Contact, and the
  CTA to create a campaign.
- Success criteria: Each link routes to its page; the active link styling
  updates; no console errors.

**TC-NAV-02: Wallet connect / disconnect menu**

- Steps: Connect a wallet via the header button, open the account menu, navigate
  to profile and disconnect.
- Success criteria: Wallet address displays in the header; account menu items
  navigate correctly; disconnect returns UI to connect state.


**TC-RESP-01: Header responsiveness**

- Steps: Resize viewport to mobile widths (e.g., 375px) and tablet widths.
- Success criteria:
  - Logo scales down (no overlap).
  - Header items collapse into a burger menu as designed.
  - Primary CTAs (Launch Campaign / Connect Wallet) remain accessible (icons on small widths if designed).
  - No header overflow/overlap.

**TC-HOME-01: Home page featured campaigns sorting policy**

- Steps: Open Home page and locate the Featured campaigns section.
- Success criteria:
  - Campaigns are bucketed and ordered by status priority: Funding → Active → Open Soon → Ended.
  - Within each bucket, campaigns are sorted by highest funded amount first.
  - If Featured list capacity isn't filled by one bucket, the next bucket is appended (same sorting).

**TC-HOME-02: Home page token list renders correctly**

- Steps: Open Home page section that lists supported tokens.
- Success criteria:
  - Tokens shown match the expected UI list for the current environment (testnet/mainnet).
  - Token labels and icons render (no broken images).

**TC-BRAND-01: Browser tab title + favicon**

- Steps: Open the dApp in a fresh browser tab.
- Success criteria:
  - Page title matches the product name (no default template title).
  - Favicon appears and matches the brand icon.



---

## Explore (Campaign Discovery)

**TC-EX-01: Explore page load and verified-only listing**

- Steps: Visit Campaigns (Explore) page.
- Success criteria: Campaign cards render; only verified campaigns are shown;
  loading and empty states render when applicable.

**TC-EX-02: Status tabs filter**

- Steps: Switch between All, Open soon, Funding, Active, Ended tabs.
- Success criteria: The list updates to match the selected status; empty state
  appears when no campaigns match.

**TC-EX-03: Show more pagination**

- Steps: Click Show more on any tab with additional campaigns.
- Success criteria: Additional cards are appended; button disables while
  loading.


**TC-EX-04: Verified-only listing regression**

- Steps:
  1) Confirm Explore shows verified campaigns only.
  2) Open a known unverified campaign via a direct link (id/subdomain route).
- Success criteria:
  - Unverified campaigns do NOT appear in Explore.
  - Unverified campaigns remain reachable by direct link.


---

## Campaign Creation

**TC-CC-01: Create campaign - happy path**

- Steps: Fill required fields with valid values, upload a <=5MB image, select a
  valid subdomain, accept terms, register Walrus storage, then publish.
- Success criteria: Form validates; Walrus upload completes; on-chain
  transaction succeeds; success state displays and campaign detail page opens.

**TC-CC-02: Required field validation**

- Steps: Submit with missing required fields or invalid values.
- Success criteria: Field-level errors display for required items and invalid
  values; submission is blocked.

**TC-CC-03: Validation boundaries**

- Steps: Use a target amount outside 1 to 9,000,000, a non-integer target, an
  invalid Sui wallet address, invalid subdomain format.
- Success criteria: Each invalid input shows its specific validation error and
  prevents publish.


**TC-CC-04: Recipient address defaults to connected wallet + input hardening**

- Steps:
  1) Connect a wallet.
  2) Open Launch/Create Campaign and inspect the recipient/payout address field.
  3) Paste a valid address with leading/trailing spaces.
  4) Try pasting with internal spaces.
- Success criteria:
  - Field defaults to the connected address (and remains editable).
  - Leading/trailing spaces are trimmed.
  - Internal spaces are rejected/removed; validation explains why.
  - Address value stays identical after copy/paste (no lost characters).
  - Empty state uses a clean placeholder (no confusing watermark text).

**TC-CC-05: Primary CTA shows 'Connect wallet' when disconnected**

- Steps: Open Launch/Create Campaign with no wallet connected.
- Success criteria:
  - Main CTA communicates wallet connection (e.g., label changes to 'Connect wallet').
  - Clicking triggers wallet connect flow (no form submission attempt).

**TC-CC-06: Copy/terminology regression (Create Campaign)**

- Steps: Review the Launch/Create Campaign form labels/headings after recent copy updates.
- Success criteria:
  - Key headings and labels match the latest copy spec (terminology consistency).
  - No broken/missing labels, placeholders, or tooltips.


---

## Campaign Detail View

**TC-CD-01: Campaign lookup by id or subdomain**

- Steps: Open a campaign using both its id and its subdomain route.
- Success criteria: Campaign resolves and loads; breadcrumb, hero, and content
  render; no resolution error state.

**TC-CD-02: Tabs and data states**

- Steps: Switch between About, Contributions, Updates tabs.
- Success criteria: Each tab displays its content; empty or loading states
  appear when data is missing.

**TC-CD-03: Owner view toggle**

- Steps: As the campaign owner, toggle between Owner View and Public View.
- Success criteria: Banner text and actions update accordingly without
  navigation errors.

**TC-CD-04: Goal/amount display formatting (currency sign + separators)**

- Steps: Open a campaign card and campaign detail page for a campaign with a non-trivial goal (e.g., 12000).
- Success criteria:
  - Goal/target amounts display with the correct currency sign ($ where applicable).
  - Large numbers use separators for readability (e.g., 12,000).
  - No missing symbols or formatting regressions across card + detail views.


---

## Donations

**TC-DO-01: First-time donation (no existing profile)**

- Steps: Connect a wallet with no profile, select an enabled token, enter a
  valid amount within balance, and donate to an active campaign within its
  funding window.
- Success criteria: Donation builds and submits successfully; success modal
  shows; campaign stats refresh; badge modal appears if a badge is awarded.

**TC-DO-02: Repeat donation (existing profile)**

- Steps: Connect a wallet with an existing profile and donate again.
- Success criteria: Donation succeeds using the repeat flow; success modal
  shows; stats and profile data refresh.

**TC-DO-03: Donation validation guardrails**

- Steps: Attempt to donate when the wallet is disconnected, amount is
  empty/invalid, amount exceeds balance, campaign is inactive, or funding window
  is closed.
- Success criteria: Donation is blocked with the correct error message and no
  transaction is submitted.

**TC-DO-04: Self-contribution blocked**

- Steps: Attempt to donate from the campaign owner wallet or recipient wallet.
- Success criteria: Donation input is disabled or blocked; error messaging
  indicates self-contribution is not allowed.


**TC-DO-05: Donation amount input UX + validation hardening**

- Steps:
  1) Enter an amount and observe helper text.
  2) Try entering decimals, scientific notation (e.g., 'e'), leading zero, and extremely large values.
  3) Enter amount > balance.
- Success criteria:
  - Gas reminder/helper text is visible whenever the input has a value.
  - Decimals are blocked if not supported.
  - Scientific notation is blocked.
  - Leading zero is normalized/blocked (as designed).
  - Large values are constrained (length + max cap) and show clear errors.
  - When insufficient balance, copy matches: 'Entered amount exceeds current balance!'
  - Insufficient-balance state visually highlights the input (red styling) as designed.

**TC-DO-06: Wallet disconnected messaging in donation card**

- Steps: Open a campaign donation card with wallet disconnected.
- Success criteria:
  - Primary CTA communicates 'Connect wallet' (not buried in secondary UI near balance).
  - No tx is attempted.

**TC-DO-07: Transaction receipt links (SuiScan) in contribution tables**

- Steps:
  1) Make a donation.
  2) Open Campaign → Contributions tab and find your row.
  3) Open Profile → My Contributions and find the same donation.
- Success criteria:
  - Each row includes a transaction receipt link.
  - Link opens in a new tab.
  - Destination is correct (SuiScan) and points to the correct digest/tx.

**TC-NFT-01: Badge/NFT modal assets load reliably**

- Steps: Complete a donation that triggers a badge/NFT winning modal.
- Success criteria:
  - Images load (no broken thumbnails).
  - If an image fails, a graceful fallback is shown (placeholder + retry) instead of a blank/broken UI.


---

## Campaign Updates (Add Update)

**TC-CU-01: Post update - happy path**

- Steps: Enter non-empty update content, register storage, and publish.
- Success criteria: Content validation passes; Walrus upload completes; on-chain
  transaction succeeds; update appears in campaign Updates tab.

**TC-CU-02: Empty update validation**

- Steps: Try to publish with empty or whitespace-only content.
- Success criteria: Validation error appears and submission is blocked.

---

## Campaign Editing

**TC-CE-01: Edit mutable fields**

- Steps: Edit name, description, categories, socials, details, and/or cover
  image; publish.
- Success criteria: Validation passes; updated data is reflected on the campaign
  detail page.

**TC-CE-02: Walrus reupload warning**

- Steps: Modify cover image or details (Walrus-backed fields) and attempt to
  publish.
- Success criteria: Reupload warning modal appears; confirming proceeds with
  upload and publish.


**TC-CE-03: Verified campaign edit warning (verification/listing impact)**

- Steps:
  1) Open a VERIFIED campaign in owner view.
  2) Edit a field that triggers an update (especially Walrus-backed fields).
  3) Attempt to publish.
- Success criteria:
  - UI warns if editing will cause the campaign to become unverified/unlisted (if that is the platform rule).
  - Warning is clear, requires explicit confirmation, and the outcome is reflected in the UI after publishing.


---

## Campaign Lifecycle Actions

**TC-CL-01: Deactivate campaign**

- Steps: As the owner, deactivate an active campaign.
- Success criteria: Campaign becomes inactive; donate action becomes disabled.

**TC-CL-02: Activate campaign**

- Steps: As the owner, activate a deactivated campaign within its date range.
- Success criteria: Campaign becomes active; donation UI becomes enabled if
  within window.

**TC-CL-03: Delete campaign**

- Steps: As the owner, delete a campaign.
- Success criteria: Campaign state updates to deleted; delete confirmation modal
  completes without errors.

---

## Profile Creation / Editing

**TC-PC-01: Create or update profile - happy path**

- Steps: Enter valid profile data (optional fields allowed), optionally upload a
  valid avatar, and save.
- Success criteria: Form validates; Walrus upload completes if avatar is
  present; profile metadata updates; profile page reflects changes.

**TC-PC-02: Profile image validation**

- Steps: Upload a non-JPG/PNG image or a file >5MB.
- Success criteria: Validation error displays; upload is blocked.

**TC-PC-03: Subdomain validation and availability**

- Steps: Enter a subdomain that is invalid or already taken.
- Success criteria: Inline error appears and save is blocked until resolved.

**TC-PC-04: Social link validation**

- Steps: Enter more than 5 social links or a link with spaces/invalid URL.
- Success criteria: Validation error displays and save is blocked.

---

## Profile View

**TC-PV-01: View own profile**

- Steps: Open your profile by address; switch between Overview, Campaigns,
  Contributions.
- Success criteria: Summary data renders; tabs show correct sections; empty
  states show when no data.

**TC-PV-02: View public profile**

- Steps: Open another user's profile by address or subdomain.
- Success criteria: Public view renders without owner-only actions; campaigns
  list loads (or empty state).


**TC-PV-03: My contributions table includes net amount column**

- Steps: Open Profile → My Contributions for a wallet that donated to a commercial campaign.
- Success criteria:
  - Table includes a Net Amount column (matching the campaign contributions table style).
  - Net amount values match fee policy (commercial vs nonprofit).

**TC-PV-04: Contribution header counts are accurate**

- Steps:
  1) Open Campaign → Contributions tab and note the count in the header/tab.
  2) Open Profile → My Contributions and note the count.
- Success criteria:
  - Header/tab counts match the rendered rows (after indexer refresh).


---

## Admin Dashboard

**TC-AD-01: Access control**

- Steps: Open Admin without a wallet, then with a non-verifier wallet.
- Success criteria: Connect prompt appears for no wallet; access denied message
  appears without verify cap.

**TC-AD-02: Verify and unverify campaigns**

- Steps: Verify an unverified campaign and unverify a verified campaign.
- Success criteria: Confirmation modal appears; status updates; campaign lists
  update in tabs.

---

## Sharing

**TC-SH-01: Share campaign**

- Steps: Open the Share modal and copy link; click each social share button.
- Success criteria: Clipboard contains the campaign URL; share links open with
  the correct URL and title.

---

---

# Expanded QA Hardening Scenarios

## Global Wallet and Transaction Edge-Case Handling (All Tx-Based Flows)


## Form Input Hardening (Numeric Fields)

Applies to: campaign goal/target amount, donation amount, any USD display inputs.

**TC-FORM-01: Numeric input sanitization**
- Steps:
  1) Try entering: letters, 'e', '+', '-', spaces, and pasted formatted numbers.
  2) Try leading zeros (e.g., 000123).
  3) Try decimals (e.g., 10.5) if not allowed.
  4) Try values beyond UI max (length cap) and beyond business max (e.g., > 9,000,000).
- Success criteria:
  - Invalid characters are blocked/stripped (no scientific notation).
  - Separators are formatted for readability where applicable (e.g., 12,000,456).
  - Values are clamped or rejected at max caps with clear error.
  - Minimum of $1 (or defined min) enforced.


Applies to: create campaign, create/update profile, donate, post updates, edit campaign, activate/deactivate, delete.

**TC-WALLET-01: Missing wallet / disconnected state**
- Steps: Visit a tx-gated page (Create Campaign / Create Profile / Donate modal) with no wallet connected.
- Success criteria:
  - UI shows a clear "Connect wallet" prompt.
  - No tx builder starts.
  - Primary CTA is disabled until connected.

**TC-WALLET-02: No active account selected**
- Steps: Connect wallet provider but select no account (or switch to an empty/locked state if wallet supports it).
- Success criteria:
  - UI detects missing active account and blocks tx.
  - Clear message: "Select an account" (or equivalent).

**TC-WALLET-03: Missing signing capability**
- Steps: Connect via a wallet/session that cannot sign (read-only mode / hardware not unlocked).
- Success criteria:
  - UI blocks tx before submit OR fails gracefully on sign.
  - Message is actionable (unlock wallet / enable signing).

**TC-WALLET-04: User rejects transaction (multi-wallet)**
- Steps: For each wallet provider, start a tx and click "Reject" (or close popup) on:
  1) Walrus registration step (where applicable)
  2) Walrus certify step (where applicable)
  3) Final on-chain action step (create/donate/update/etc)
- Success criteria:
  - UI exits loading state.
  - No partial success state is shown.
  - User sees a friendly "Transaction rejected" message.
  - Retrying works (no stuck/duplicate pending state).

**TC-WALLET-05: Network mismatch (testnet vs mainnet)**
- Steps: Set wallet network different from the app network and attempt a tx.
- Success criteria:
  - UI blocks or fails with a specific network mismatch message.
  - Message includes required network.

**TC-WALLET-06: Insufficient SUI for gas (warning + blocking)**
- Steps: Drain SUI to below practical gas minimum; attempt each tx type.
- Success criteria:
  - UI warns before submit (gas warning).
  - If tx fails, message clearly indicates gas issue.

**TC-WALLET-07: Insufficient donation token balance**
- Steps: Select WAL or USDC, enter amount > balance; attempt donate.
- Success criteria:
  - Inline validation blocks submit.
  - Message shows required vs available (or clear "Insufficient balance").

**TC-WALLET-08: Contract abort -> user-friendly message**
- Steps: Trigger known abort conditions (self-donation, campaign inactive, subname taken, stale oracle if possible).
- Success criteria:
  - UI displays a human-readable explanation.
  - UI does NOT surface raw abort codes as the primary text.

**TC-WALLET-09: Profile ownership mismatch**
- Steps: Attempt profile edit with a wallet that does not own the profile.
- Success criteria:
  - UI blocks edit/save.
  - Clear "You are not the owner" message.

**TC-WALLET-10: Campaign state restrictions block tx**
- Steps: Attempt donate/edit/update on campaigns in each restricted state:
  - Open Soon (not started)
  - Completed/After end
  - Deactivated
  - Deleted
- Success criteria:
  - Actions are disabled where appropriate.
  - Tooltip/banner explains why.

**TC-WALLET-11: Auto-retry donation when profile already exists**
- Steps:
  1) Ensure Wallet C has no profile.
  2) In a separate tab/session, create a profile for Wallet C right before donating.
  3) In the original donate flow (Wallet C), donate as "first-time".
- Success criteria:
  - If the first donation attempt fails because profile exists, UI auto-retries using existing-profile path.
  - Only one donation is created on-chain.
  - User sees a single success flow.

---

## SuiNS Subname Lookup and Availability (Campaign Slug / Profile Username)

Subname rules (from docs): lowercase letters + numbers, interior hyphens allowed, no leading/trailing hyphens.

**TC-SUINS-01: Campaign subname - format validation**
- Steps: In Create Campaign, enter invalid values:
  - uppercase letters
  - spaces
  - leading/trailing hyphen
  - special chars
  - too short/too long (if limited)
- Success criteria:
  - Inline error message explains allowed format.
  - Publish is blocked.

**TC-SUINS-02: Profile subname - format validation**
- Steps: Same invalid inputs in Create/Update Profile.
- Success criteria: Same as TC-SUINS-01.

**TC-SUINS-03: Availability check - available**
- Steps: Enter a unique subname.
- Success criteria:
  - UI shows "Available" state.
  - Submit is allowed.

**TC-SUINS-04: Availability check - taken**
- Steps: Enter a known-taken subname.
- Success criteria:
  - UI shows "Taken" state.
  - Submit is blocked.

**TC-SUINS-05: Availability check - race condition**
- Steps:
  1) Two sessions attempt the same subname.
  2) Session A successfully registers.
  3) Session B attempts to register after seeing "Available".
- Success criteria:
  - Session B fails gracefully.
  - UI shows "Subname taken" (or equivalent) and instructs user to choose a different one.

**TC-SUINS-06: Case-insensitivity + normalization**
- Steps: Try `MyName` vs `myname`.
- Success criteria:
  - Input normalizes to lowercase.
  - Availability result is consistent.

---

## Media Upload: Validation + Cropping (Maintain Aspect Ratio)

**TC-MEDIA-01: Campaign cover upload - file type + size**
- Steps: Upload unsupported type and a file > max size.
- Success criteria:
  - Block with clear validation message.
  - No Walrus upload starts.

**TC-MEDIA-02: Profile avatar upload - file type + size**
- Steps: Same as TC-MEDIA-01 for avatar.
- Success criteria: Same.

**TC-MEDIA-03: Campaign cover cropper preserves aspect ratio**
- Steps:
  1) Upload a very wide image and a very tall image.
  2) Use crop UI to select area.
  3) Save/publish.
- Success criteria:
  - Preview matches final render (no stretching).
  - Output keeps a consistent aspect ratio (as designed).
  - No visible distortion on campaign card + detail hero.

**TC-MEDIA-04: Profile avatar cropper outputs square (or designed ratio)**
- Steps: Upload non-square image, crop, save.
- Success criteria:
  - Output is rendered correctly in all avatar locations (header, profile page, donor list).
  - No distortion.


**TC-MEDIA-05: Campaign cover upload does not hard-block on min resolution (cropper assists)**
- Steps:
  1) Upload an image smaller than the legacy min-res error threshold (e.g., below 946x432).
  2) Attempt to proceed.
  3) Use crop/zoom to fit the required aspect.
- Success criteria:
  - Upload is accepted into the cropper (no immediate hard error that blocks progress).
  - Cropper guides user to meet the required aspect (e.g., 946x432 or equivalent).
  - Final saved image meets the expected aspect ratio and renders correctly.


---

## WAL Requirements and "Get WAL" / DEX Links

**TC-WAL-01: No WAL when Walrus storage is required**
- Steps: Attempt any Walrus-backed action (create campaign with cover/story, upload avatar, post update) with 0 WAL.
- Success criteria:
  - UI detects insufficient WAL.
  - UI shows actionable message and CTA(s) to acquire WAL.
  - User can retry after acquiring WAL without reloading the app.

**TC-WAL-02: "Get WAL" link destinations**
- Steps: Click all "Get WAL" / "Swap" / "DEX" links shown in WAL-insufficient flows.
- Success criteria:
  - Links open in a new tab.
  - Destinations are correct and safe (official docs / known DEX routes).


**TC-WAL-03: Bluefin swap route opens in new tab (testnet)**
- Steps: Trigger the WAL-insufficient flow and click the 'Get $WAL' link.
- Success criteria:
  - Opens in a new tab.
  - Routes to the intended swap pair page (e.g., SUI↔WAL) on the configured DEX.

**TC-WAL-04: WAL balance detection and refresh**
- Steps:
  1) Use a wallet that just received WAL (faucet or swap) without reloading the app.
  2) Return to the blocked flow (create campaign/profile/update) and retry.
- Success criteria:
  - WAL balance is detected correctly.
  - UI unblocks without requiring hard refresh (or clearly instructs if a refresh is required).


---

## Empty States (No Records) - Tables and Lists

Validate that empty data does not crash UI and shows correct messaging in BOTH public and owner views.

**TC-EMPTY-01: Campaign single page - Donations table empty**
- Steps: Open a new campaign with 0 donations.
- Success criteria:
  - Contributions tab shows an empty-state component.
  - No broken pagination controls.

**TC-EMPTY-02: Campaign single page - Updates empty**
- Steps: Open Updates tab on a campaign with no updates.
- Success criteria: Empty-state shown; Post Update CTA visible only in owner view.

**TC-EMPTY-03: Profile - My Donations empty**
- Steps: Open Wallet B profile (or Wallet with no donations).
- Success criteria: Empty-state shown; no errors.

**TC-EMPTY-04: Profile - My Campaigns empty**
- Steps: Open a profile that never created campaigns.
- Success criteria: Empty-state shown.

**TC-EMPTY-05: Public profile - campaigns and donations empty**
- Steps: Open public profile for a wallet with no records.
- Success criteria: Empty-state shown; no owner-only actions.

---

## Status Logic and UI: Donation Card

Covers input enablement, progress bar, labels, timing and messaging.

**TC-DOCARD-01: Open Soon (not started)**
- Steps: Open donation card for Campaign P0-3.
- Success criteria:
  - Amount input disabled.
  - CTA indicates donations not open yet.
  - Status badge shows "Open soon".

**TC-DOCARD-02: Funding (within window)**
- Steps: Open donation card for Campaign P0-1.
- Success criteria:
  - Amount input enabled.
  - Token selector enabled for supported tokens.
  - Progress bar renders correctly.

**TC-DOCARD-03: After end date (completed/"Active")**
- Steps: Open donation card for Campaign P0-4.
- Success criteria:
  - Donation disabled (if designed).
  - Status messaging explains fundraising window ended.

**TC-DOCARD-04: Deactivated**
- Steps: Open donation card for Campaign P0-5.
- Success criteria:
  - Donation disabled.
  - Message indicates campaign is deactivated.

**TC-DOCARD-05: Deleted**
- Steps: Open donation card for Campaign P0-6.
- Success criteria:
  - Donation disabled.
  - Page clearly indicates deleted state.

**TC-DOCARD-06: Progress bar edge cases**
- Steps: Validate progress display when:
  - raised = 0
  - raised just below goal
  - raised exactly equals goal
  - raised > goal (overfunding)
- Success criteria:
  - No negative or >100% visual glitches.
  - Text values match calculations.

---

## Status Logic and UI: Campaign Card + Campaign Single Page (Public vs Owner View)

**TC-CARD-01: Campaign card rendering by status**
- Steps: View cards for campaigns in each status bucket.
- Success criteria:
  - Correct status badge and CTA.
  - Correct progress / totals shown.

**TC-CARD-02: Owner view vs public view differences**
- Steps: Open campaign detail as owner and toggle Owner/Public view.
- Success criteria:
  - Owner-only actions appear only in owner view.
  - Public view never shows admin/owner controls.

**TC-CARD-03: Verified badge displayed consistently**
- Steps: Compare a verified vs unverified campaign on:
  - Explore card
  - Campaign hero
  - Owner view
- Success criteria:
  - Verified badge appears only for verified campaigns.
  - No incorrect badge leakage.

---

## Verification Badge: Listing / Unlisting + Owner "Apply" Flow

**TC-VER-01: Explore shows verified-only**
- Steps: Open Explore and confirm listings.
- Success criteria:
  - Only verified campaigns are shown.
  - Unverified campaigns are not listed (but still reachable via direct link).

**TC-VER-02: Admin verify campaign**
- Steps: As verifier/admin, verify an unverified campaign.
- Success criteria:
  - Status updates on-chain.
  - Campaign appears in Explore after refresh/pagination.

**TC-VER-03: Admin unverify campaign**
- Steps: Unverify a previously verified campaign.
- Success criteria:
  - Campaign disappears from Explore.
  - Direct links still work.

**TC-VER-04: Owner view shows "Apply for verification" when unverified**
- Steps: Open an unverified campaign as owner.
- Success criteria:
  - CTA to apply is visible.
  - CTA opens correct destination (Typeform or equivalent).


**TC-VER-06: Unverified badge opens explainer modal (benefits + apply link)**
- Steps:
  1) Open an unverified campaign in owner view.
  2) Click the Unverified badge.
- Success criteria:
  - A modal opens that explains what unverified means.
  - Modal clearly explains benefits of verification/listing.
  - Modal provides a clear CTA to apply for verification.


**TC-VER-05: Regression - all verified campaigns appear in Explore pagination**
- Steps: Ensure many verified campaigns exist (>= page size). Scroll/"Show more".
- Success criteria:
  - Pagination eventually returns ALL verified campaigns, not a partial subset.

---

## Donations: Multi-token (WAL + USDC) + Oracle USD Accuracy

**TC-TOKEN-01: Token selector shows only enabled tokens**
- Steps: Open donation modal.
- Success criteria:
  - Disabled tokens do not appear.

**TC-TOKEN-02: Donate with WAL**
- Steps: Donate WAL to a funding campaign.
- Success criteria:
  - Tx succeeds.
  - USD value is displayed and saved.

**TC-TOKEN-03: Donate with USDC**
- Steps: Donate USDC to a funding campaign.
- Success criteria:
  - Tx succeeds.
  - Decimals/amount displayed correctly.

**TC-TOKEN-04: USD quote plausibility check**
- Steps: For WAL and USDC donations, compare UI USD estimate vs oracle reference (explorer/event, if available).
- Success criteria:
  - USD estimate is within an acceptable tolerance.
  - Stale price behavior is handled (error if price too old, if designed).

**TC-TOKEN-05: Price display consistency across views**
- Steps: Confirm USD totals match across:
  - Campaign card
  - Campaign detail stats
  - Profile totals
- Success criteria:
  - Same donation results in consistent totals after indexer refresh.

---

## Fee Calculations and Payout Split (Commercial vs Nonprofit)

**TC-FEE-01: Commercial campaign shows fee breakdown before signing**
- Steps: Open donation card on commercial campaign.
- Success criteria:
  - UI shows platform fee, net amount to recipient, and total.
  - Fee math matches configured bps.

**TC-FEE-02: Nonprofit campaign shows no fee**
- Steps: Open donation card on nonprofit campaign.
- Success criteria:
  - Platform fee is 0.
  - UI clearly indicates fee-free policy.

**TC-FEE-03: On-chain split accuracy (commercial)**
- Steps: Make a donation, then verify in explorer:
  - recipient receives net
  - platform receives fee
- Success criteria:
  - Amounts match UI.

**TC-FEE-04: On-chain split accuracy (nonprofit)**
- Steps: Donate on nonprofit campaign; verify explorer.
- Success criteria:
  - Full amount to recipient (excluding gas).
  - No platform fee transfer.

---

## Categories: Badges on Cards + Multiple Categories

**TC-CAT-01: Category badges render on campaign card**
- Steps: Open Explore; inspect cards.
- Success criteria:
  - Category badges are visible and readable.

**TC-CAT-02: Multi-category behavior**
- Steps: Use Campaign P0-9 with 2+ categories.
- Success criteria:
  - UI displays multiple categories without layout break.
  - If UI limits badges, it shows "+N" (or similar) correctly.

---

## Stats and Aggregations: Totals + Counts + Unique Donors

**TC-STATS-01: Campaign raised funds total is accurate**
- Steps:
  1) Make 2+ donations with known amounts.
  2) Wait for indexer refresh.
- Success criteria:
  - Campaign total equals sum of donation USD values.

**TC-STATS-02: Profile total donated + donation count**
- Steps: Donate multiple times from Wallet B.
- Success criteria:
  - Profile shows correct total USD donated and number of donations.

**TC-STATS-03: Unique donors count**
- Steps:
  1) Wallet B donates twice.
  2) Wallet C donates once.
- Success criteria:
  - Unique donors count = 2.
  - It is consistent on campaign card and campaign detail.

**TC-STATS-04: Rounding and formatting**
- Steps: Donate values that create repeating decimals after conversion.
- Success criteria:
  - UI rounding is consistent across all components.

---

## Updates Feed: Display + Sorting

**TC-UPD-01: Post update shows on campaign**
- Steps: As owner, post 2 updates with different timestamps.
- Success criteria:
  - Both appear in Updates tab.

**TC-UPD-02: Updates sorted newest-first**
- Steps: Ensure update A older than update B.
- Success criteria:
  - Update B appears above update A.

---

## Tab Counters (Campaign + Profile)

**TC-COUNT-01: Campaign detail tab counters match data**
- Steps: On a campaign with donations + updates, check tab labels/counters.
- Success criteria:
  - Counts match the list lengths.

**TC-COUNT-02: Profile tab counters match data**
- Steps: On a profile with campaigns + donations, check tab labels/counters.
- Success criteria:
  - Counts match list lengths.

---

## Static Pages + Footer (From Issues)

**TC-STATIC-01: Terms of Use page loads and renders correctly**
- Steps: Navigate to Terms of Use.
- Success criteria:
  - Page renders as static HTML/text.
  - "Last updated" is displayed.

**TC-STATIC-02: Privacy Policy page loads and renders correctly**
- Steps: Navigate to Privacy Policy.
- Success criteria: Same as TC-STATIC-01.

**TC-STATIC-03: Disclaimer page loads and renders correctly**
- Steps: Navigate to Disclaimer.
- Success criteria: Same as TC-STATIC-01.


**TC-STATIC-04: About Us page loads and renders correctly**
- Steps: Navigate to About Us.
- Success criteria:
  - Page loads without console errors.
  - Content renders and matches expected layout.

**TC-STATIC-05: Contact Us page loads and renders correctly**
- Steps: Navigate to Contact Us.
- Success criteria:
  - Page loads without console errors.
  - Content renders and includes intended contact channels.


**TC-FOOTER-01: Footer appears on ALL pages**
- Steps: Visit:
  - Home
  - Explore
  - Campaign single page
  - Profile page
  - Admin page
  - Static/legal pages
- Success criteria:
  - Footer is present consistently.

**TC-FOOTER-02: Footer links are correct**
- Steps: Click each footer link:
  - Socials (GitHub, Discord, Telegram, Twitter/X, Paragraph, LinkedIn)
  - Legal (Terms, Privacy, Disclaimer)
  - Docs links (What is CrowdWalrus, How to contribute, etc.)
  - Report issue / Feedback
  - Verification Typeform
- Success criteria:
  - Links open successfully.
  - External links open in new tabs.

---

## Regression Tests from Recent Releases

(Use these as a quick smoke/regression pack after each deploy.)

**TC-REG-01: Donation flow hardening (profile lookup + retry)**
- Steps: Repeat TC-WALLET-11 and ensure no duplicate donations.
- Success criteria: Retry works and UI remains consistent.

**TC-REG-02: Contributions table sync after donation (pending row + polling)**
- Steps: Donate and immediately open Contributions tab.
- Success criteria:
  - A pending row appears quickly.
  - It resolves to confirmed once indexed.

**TC-REG-03: Verified campaigns in Explore pagination**
- Steps: Same as TC-VER-05.
- Success criteria: All verified campaigns appear.

**TC-REG-04: Epoch handling clamp (min/max) in Walrus-related components**
- Steps: In any epoch/duration selector, try min below allowed and max above allowed.
- Success criteria:
  - UI clamps values.
  - No crashes.

**TC-REG-05: Campaign description length validation + warning**
- Steps: Enter overly long description (or boundary values) in campaign create/edit forms.
- Success criteria:
  - Inline validation or warning appears.
  - Publish blocked if invalid.

---

# Footer / Docs Links Verification Status

> Marked as **(ongoing)** per QA tracking. Treat as *not yet passed* until you explicitly run through and sign off.

## Footer links (ongoing)

- [ ] Terms of Use (ongoing)
- [ ] Privacy Policy (ongoing)
- [ ] Disclaimer (ongoing)
- [ ] About Us (ongoing)
- [ ] Contact Us (ongoing)
- [ ] Social links (GitHub / X / LinkedIn / Telegram / Discord / Paragraph) (ongoing)

## Docs links (ongoing)

- [ ] What is CrowdWalrus (ongoing)
- [ ] How CrowdWalrus Works (Sui + Walrus + SuiNS) (ongoing)
- [ ] Getting Started / Install wallet (ongoing)
- [ ] How to contribute (ongoing)
- [ ] Campaign Owner docs links (ongoing)
- [ ] Donor docs links (ongoing)

## Support / workflows (ongoing)

- [ ] Apply for verification badge link (Typeform) (ongoing)
- [ ] Report an issue (GitHub) (ongoing)
- [ ] Send feedback (GitHub) (ongoing)

