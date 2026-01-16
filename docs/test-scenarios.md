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
