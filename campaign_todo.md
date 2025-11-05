# Campaign Creation & Management - TODO List

This document tracks missing features and improvements for the CrowdWalrus campaign system.

---

## 🚨 Critical Issues (Blockers)

### 1. ✅ Wallet Keypair Integration Problem - RESOLVED
- [x] **Research Walrus upload relay solution** - Wallet signs, relay handles upload
  - Confirmed `@mysten/walrus` SDK supports `writeFilesFlow()` for browser wallets
- [x] **Implement workaround for production**
  - ✅ Implemented `writeFilesFlow()` approach (Option D)
  - Uses multi-step upload: encode → register (sign) → upload → certify (sign)
  - Each wallet signature triggered by separate transaction, avoiding popup blocking
- [x] **Update `useCreateCampaign` hook** to remove direct keypair requirement
  - Removed `signer: Keypair` parameter
  - Now uses `signAndExecuteTransaction` from @mysten/dapp-kit
  - Works with standard wallet extensions (Sui Wallet, Ethos, etc.)
- [x] **Refactored Walrus service** with flow-based functions
  - `createWalrusUploadFlow()` - Creates and encodes flow
  - `buildRegisterTransaction()` - Returns tx for wallet signing
  - `uploadToWalrusNodes()` - Uploads to storage
  - `buildCertifyTransaction()` - Returns tx for wallet signing
  - `getUploadedFilesInfo()` - Gets final blob ID

**Solution Summary**: The dApp now works securely with browser wallet extensions without requiring private key access. The multi-step flow ensures wallet popups aren't blocked and provides clear progress feedback to users.

### 2. ✅ Real Storage Cost Calculation - RESOLVED
- [x] **Implemented Walrus pricing service** (`src/services/walrus-pricing.ts`)
  - Queries Walrus system object on Sui for real-time pricing
  - 5-minute cache to minimize RPC calls
  - Accurate calculation with 64MB metadata + 5x encoding overhead
  - Both storage (per-epoch) and upload (one-time) costs
- [x] **Updated `calculateStorageCost()` in `walrus.ts`**
  - Now uses real pricing from system object queries
  - Returns detailed cost breakdown (storage, upload, metadata)
  - Uses centralized config for system object IDs
- [x] **Error handling with automatic fallback**
  - Falls back to hardcoded Mainnet pricing (March 2025) if RPC fails
  - Graceful degradation ensures cost estimates always available
- [x] **Enhanced `StorageCostEstimate` type**
  - Added `rawSize`, `encodedSize`, `metadataSize`
  - Separate `storageCostWal` and `uploadCostWal` fields
  - Pricing timestamp and network info included

**Implementation Details:**
- **Mainnet Pricing**: 100,000 FROST/MB storage + 20,000 FROST/MB upload
- **Testnet System Object**: `0x98ebc...1255c1`
- **Mainnet System Object**: `0x2134d52...3ddd2`
- Cost calculation: `(rawSize × 5 + 64MB) × pricing × epochs`

### 3. Contract Address Configuration
- [ ] Fill in all TODO placeholders in `src/config/contracts.ts`
  - [ ] `PACKAGE_ID_DEVNET`
  - [ ] `PACKAGE_ID_TESTNET`
  - [ ] `PACKAGE_ID_MAINNET`
  - [ ] `CROWD_WALRUS_OBJECT_ID_*` for all networks
  - [ ] `SUINS_MANAGER_OBJECT_ID_*` for all networks
  - [ ] `SUINS_OBJECT_ID_*` for all networks
- [ ] Move sensitive config to environment variables
- [ ] Create `.env.example` file with required variables

---

## ⚠️ Essential Missing Features

### 4. Campaign Retrieval & Display
- [ ] **Create campaign query services** (`src/services/campaign-query.ts`)
  - [ ] `getCampaignById(campaignId)` - Fetch single campaign from Sui
  - [ ] `getAllCampaigns()` - List all campaigns
  - [ ] `getValidatedCampaigns()` - Only validated campaigns
  - [ ] `getUserCampaigns(address)` - User's created campaigns
  - [ ] `getCampaignsByCategory(category)` - Filter by category
  - [ ] `searchCampaigns(query)` - Search by name/description

- [ ] **Create campaign query hooks** (`src/hooks/useCampaign.ts`)
  ```typescript
  useCampaign(campaignId)           // Single campaign
  useCampaigns({ filters })         // List with filters
  useUserCampaigns(address)         // User's campaigns
  useCampaignContent(blobId)        // Fetch from Walrus
  ```

- [ ] **Create Walrus content fetching service**
  - [x] Fetch `description.json` from Quilt (Lexical editor state)
  - [x] Fetch `cover.jpg` from Quilt
  - [ ] Handle CORS issues with aggregator
  - [x] Add caching strategy
  - [x] Error handling for expired/missing blobs

### 5. Donation Functionality (Core Feature!)
- [ ] **Create donation service** (`src/services/donation.ts`)
  - [ ] Build donation transaction
  - [ ] Validate campaign is active and not expired
  - [ ] Handle minimum donation amounts
  - [ ] Gas estimation for donations

- [ ] **Create donation hook** (`src/hooks/useDonate.ts`)
  ```typescript
  useDonate(campaignId, amount)
  ```

- [ ] **Add donation tracking**
  - [ ] Track total donations per campaign
  - [ ] Track individual user donations
  - [ ] Display funding progress (current / goal)

### 6. Campaign Management Features
- [ ] **Campaign updates** hook (`src/hooks/useAddCampaignUpdate.ts`)
  - Service already exists in `campaign-transaction.ts`
  - Need React hook wrapper
  - Validate user owns campaign (has CampaignOwnerCap)

- [ ] **Campaign state management**
  - [x] Toggle active/inactive hook
  - [ ] Handle campaign ended state
  - [ ] Handle goal reached state
  - [ ] Withdrawal mechanism for creators

- [ ] **Subdomain availability check**
  - [x] Query SuiNS before campaign creation
  - [ ] Suggest alternatives if taken
  - [x] Real-time validation in form

### 7. Security Improvements
- [ ] **HTML Sanitization** - Critical XSS risk!
  ```bash
  pnpm add dompurify
  pnpm add -D @types/dompurify
  ```
  - [ ] Sanitize rich text on display
  - [ ] Configure allowed HTML tags
  - [ ] Test with malicious inputs

- [ ] **Content Validation**
  - [ ] Enforce max file sizes (currently 10MB for image, add for HTML)
  - [ ] Validate rich text HTML structure
  - [ ] Prevent gigantic descriptions (DoS risk)
  - [ ] Image format validation (only jpg, png, webp)

- [ ] **Type Safety**
  - [x] Remove `any` types in `extractCampaignIdFromEffects`
  - [ ] Properly type transaction effects
  - [x] Strict null checks

---

## 📈 Important UX Improvements

### 8. Better Error Handling
- [ ] **User-friendly error messages**
  - [ ] Map blockchain errors to readable text
  - [ ] Show actionable solutions (e.g., "Insufficient balance - need 0.5 SUI more")
  - [ ] Error recovery flows

- [ ] **Retry Logic**
  - [ ] Retry failed Walrus uploads (network issues)
  - [ ] Retry failed transaction submissions
  - [ ] Exponential backoff strategy
  - [ ] Max retry limits

### 9. Campaign Creation UX
- [ ] **Progress Persistence**
  - [ ] Save form state to localStorage
  - [ ] Restore if user closes/refreshes page
  - [ ] Clear on successful creation

- [ ] **Preview Mode**
  - [ ] Show campaign preview before creation
  - [ ] Preview how it will look in your app
  - [ ] Edit from preview

- [ ] **Image Processing**
  - [ ] Client-side image compression
  - [ ] Automatic resize for optimal storage
  - [ ] Crop/edit UI before upload
  - [ ] Multiple image support (gallery)

- [ ] **Rich Text Editor Integration**
  - [ ] Example with Quill.js or TipTap
  - [ ] Toolbar customization
  - [ ] Image embedding in description
  - [ ] Character/word count

- [ ] **Gas Estimation**
  - [ ] Show estimated gas before transaction
  - [ ] Check user balance vs required amount
  - [ ] Suggest adding funds if insufficient

### 10. Campaign Discovery
- [ ] **Filtering & Sorting**
  - [ ] By category
  - [ ] By funding status (funded %, ending soon)
  - [ ] By validation status
  - [ ] Sort by newest, most funded, ending soon

- [ ] **Search Functionality**
  - [ ] Search by name/description
  - [ ] Tag-based search
  - [ ] Creator search

- [ ] **Pagination**
  - [ ] Infinite scroll or page-based
  - [ ] Limit API calls
  - [ ] Loading states

---

## 🎨 Nice to Have

### 11. Advanced Features
- [ ] **Campaign Analytics** (for creators)
  - [ ] View count
  - [ ] Donation history
  - [ ] Donor list
  - [ ] Funding velocity graph

- [ ] **Social Features**
  - [ ] Comments on campaigns
  - [ ] Share to social media (with OG tags)
  - [ ] Follow/favorite campaigns
  - [ ] Email notifications for updates

- [ ] **Refund Mechanism**
  - [ ] Auto-refund if goal not met
  - [ ] Creator can cancel campaign
  - [ ] Handle partial refunds

- [ ] **Campaign Milestones**
  - [ ] Set funding milestones
  - [ ] Unlock features at thresholds
  - [ ] Celebrate reaching goals

### 12. Developer Experience
- [ ] **Testing**
  - [ ] Unit tests for services
  - [ ] Integration tests for hooks
  - [ ] E2E tests for campaign creation flow
  - [ ] Mock Walrus/Sui for testing

- [ ] **Documentation**
  - [ ] API documentation for hooks
  - [ ] Example usage in TestPage
  - [ ] Deployment guide
  - [ ] Troubleshooting guide

- [ ] **Performance**
  - [ ] Caching strategy for Walrus content
  - [ ] React Query cache configuration
  - [ ] Image lazy loading
  - [ ] Optimistic UI updates

- [ ] **Monitoring**
  - [ ] Error tracking (Sentry)
  - [ ] Analytics (user behavior)
  - [ ] Performance monitoring
  - [ ] Uptime monitoring for Walrus aggregator

### 13. Additional Integrations
- [ ] **Wallet Balance Display**
  - [ ] Show user's SUI balance
  - [ ] Warn if insufficient for creation
  - [ ] Link to faucet for testnet

- [ ] **Network Switching**
  - [ ] UI to switch between devnet/testnet/mainnet
  - [ ] Persist network preference
  - [ ] Show current network in UI

- [ ] **CORS Proxy** (if needed)
  - [ ] Set up proxy for Walrus aggregator
  - [ ] Handle if browser blocks direct access
  - [ ] Cloudflare Workers or similar

---

## 📋 Implementation Priority

### Phase 1 - MVP (Minimum Viable Product)
1. ✅ Campaign creation (Done)
2. ✅ Solve wallet keypair issue (#1) - COMPLETED
3. Campaign retrieval hooks (#4)
4. Donation functionality (#5)
5. ✅ Real storage costs (#2) - COMPLETED
6. HTML sanitization (#7)
7. Fill contract addresses (#3)

### Phase 2 - Essential Features
8. Campaign updates (#6)
9. Campaign listing/filtering (#10)
10. Better error messages (#8)
11. Preview mode (#9)
12. Subdomain validation (#6)

### Phase 3 - Polish
13. Image processing (#9)
14. Progress persistence (#9)
15. Analytics (#11)
16. Testing (#12)
17. Documentation (#12)

### Phase 4 - Advanced
18. Social features (#11)
19. Refunds (#11)
20. Milestones (#11)
21. Performance optimization (#12)

---

## 🔧 Technical Debt

- [ ] Remove unused `getTransactionOptions()` export
- [ ] Consistent error naming conventions
- [ ] Add JSDoc comments to all public functions
- [ ] Extract magic numbers to constants
- [ ] Improve type safety (remove all `any`)
- [ ] Add input validation helpers
- [ ] Centralize date/time utilities
- [ ] Create shared UI components for campaign display
- [ ] Break down `CampaignCoverImageUpload` into smaller modules (drop zone, crop dialog, helpers) once the flow stabilizes
- [ ] Cover image polish pass: tighten alt text, refine error copy, replace ad-hoc constants with named exports, and remove the temporary `as UseQueryResult` cast in `useWalrusImage`

---

## 📝 Notes

**Current Completion: ~50%**

The foundation is solid:
- ✅ Architecture (services, hooks, types)
- ✅ Walrus Quilt integration with writeFilesFlow()
- ✅ Transaction building
- ✅ Network configuration
- ✅ Error handling structure
- ✅ Wallet integration (browser-compatible, production-ready)
- ✅ Real storage cost calculation with Walrus pricing queries

**Biggest Gaps:**
1. No way to view/browse campaigns
2. No donation mechanism (the main purpose!)
3. Security not production-ready (HTML sanitization needed)
4. Contract addresses not configured

**Next Steps:**
Start with Phase 1 items in order. #4 (Campaign retrieval hooks) and #5 (Donation functionality) are the most critical blockers for a working MVP.

---

*Last Updated: 2025-09-30*
