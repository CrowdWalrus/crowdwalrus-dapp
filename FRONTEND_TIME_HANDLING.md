# Frontend Time Handling Guide

**CrowdWalrus Smart Contracts - Time Integration Documentation**

This document explains how time is handled in the CrowdWalrus smart contracts and how your frontend should work with timestamps for campaigns, updates, and events.

---

## Overview

All timestamps in CrowdWalrus contracts use **Unix milliseconds (UTC)**. This means:
- Timestamps are `u64` integers representing milliseconds since January 1, 1970 00:00:00 UTC
- Compatible with JavaScript's `Date.now()` and `new Date().getTime()`
- All timezone interpretation happens client-side in your frontend
- The blockchain has no concept of timezones—only absolute millisecond values
- **All objects** (Campaign, Project, CampaignUpdate) consistently use `created_at_ms` for creation time

---

## Timestamp Fields

### Campaign Object

```typescript
interface Campaign {
  id: string;
  name: string;
  short_description: string;
  subdomain_name: string;
  metadata: Record<string, string>;
  recipient_address: string;
  start_date: number;        // Unix ms (UTC) - when donations open
  end_date: number;          // Unix ms (UTC) - when donations close
  created_at_ms: number;     // Unix ms (UTC) - when campaign was created
  is_verified: boolean;
  is_active: boolean;
  next_update_seq: number;
}
```

**Field Descriptions:**
- `start_date`: Campaign funding period begins. Donations should only be accepted after this time.
- `end_date`: Campaign funding period ends. Donations should not be accepted after this time.
- `created_at_ms`: When the campaign object was created on-chain. Useful for sorting/filtering.

### CampaignUpdate Object

```typescript
interface CampaignUpdate {
  id: string;
  parent_id: string;         // Campaign ID
  sequence: number;          // Update number (0, 1, 2, ...)
  author: string;            // Address who created the update
  metadata: Record<string, string>;
  created_at_ms: number;     // Unix ms (UTC) - when update was posted
}
```

### Project Object

```typescript
interface Project {
  id: string;
  admin_id: string;
  name: string;
  short_description: string;
  subdomain_name: string;
  created_at_ms: number;     // Unix ms (UTC) - when project was created
}
```

**Note:** Projects follow the same timestamp convention as Campaigns—all creation times use `created_at_ms` in Unix milliseconds.

### Events with Timestamps

All mutation events include timestamps:

```typescript
// When campaign status changes
interface CampaignStatusChanged {
  campaign_id: string;
  editor: string;
  timestamp_ms: number;      // Unix ms (UTC) - when status changed
  new_status: boolean;
}

// When campaign basics are updated
interface CampaignBasicsUpdated {
  campaign_id: string;
  editor: string;
  timestamp_ms: number;      // Unix ms (UTC) - when edit occurred
  name_updated: boolean;
  description_updated: boolean;
}

// When campaign metadata is updated
interface CampaignMetadataUpdated {
  campaign_id: string;
  editor: string;
  timestamp_ms: number;      // Unix ms (UTC) - when edit occurred
  keys_updated: string[];
}

// When a campaign update is added
interface CampaignUpdateAdded {
  campaign_id: string;
  update_id: string;
  sequence: number;
  author: string;
  metadata: Record<string, string>;
  created_at_ms: number;     // Unix ms (UTC) - when update was created
}
```

---

## Contract Validation Rules

### Campaign Creation

When creating a campaign, the contract validates at **two layers**:

**Layer 1: Entry Function Validation** (crowd_walrus.move:135-136)
```move
let current_time_ms = sui::clock::timestamp_ms(clock);
assert!(start_date >= current_time_ms, campaign::e_start_date_in_past());
```

**Layer 2: Constructor Validation** (campaign.move:143-145)
```move
let creation_time_ms = clock::timestamp_ms(clock);
// ...
assert!(start_date >= creation_time_ms, E_START_DATE_IN_PAST);
```

Both layers derive timestamps from the **same Clock object**, ensuring consistency. The constructor also validates `start_date < end_date`.

**Key Rules:**
1. `start_date` MUST be >= current blockchain time (validated twice)
2. `start_date` MUST be < `end_date` (validated in constructor)
3. Campaigns cannot be backdated
4. The `Clock` object (`0x6`) is the single source of truth for blockchain time

**Error Code:**
- If `start_date` is in the past, transaction fails with `E_START_DATE_IN_PAST` error

---

## Frontend Implementation Guide

### 1. Creating Campaigns

**User Experience Flow:**
1. User selects start/end dates and times in their local timezone
2. Frontend converts to UTC milliseconds
3. Frontend validates dates before sending transaction
4. Contract performs final validation on-chain

**TypeScript Example:**

```typescript
import { SuiClient } from '@mysten/sui.js/client';
import { Transaction } from '@mysten/sui.js/transactions';
import { SUI_CLOCK_OBJECT_ID } from '@mysten/sui.js/utils';

// User input (from date picker in user's timezone)
const userStartDate = '2025-10-11T09:00'; // From <input type="datetime-local">
const userEndDate = '2025-12-31T23:59';

// Convert to UTC milliseconds
const startDateMs = new Date(userStartDate).getTime();
const endDateMs = new Date(userEndDate).getTime();

// Client-side validation BEFORE sending transaction
const currentTimeMs = Date.now();

if (startDateMs < currentTimeMs) {
  throw new Error('Start date cannot be in the past');
}

if (startDateMs >= endDateMs) {
  throw new Error('End date must be after start date');
}

// Create transaction
const tx = new Transaction();
tx.moveCall({
  target: `${PACKAGE_ID}::crowd_walrus::create_campaign`,
  arguments: [
    tx.object(CROWD_WALRUS_ID),
    tx.object(SUINS_MANAGER_ID),
    tx.object(SUINS_ID),
    tx.object(SUI_CLOCK_OBJECT_ID), // Use SDK constant instead of hardcoded '0x6'
    tx.pure.string(campaignName),
    tx.pure.string(shortDescription),
    tx.pure.string(subdomainName),
    tx.pure.vector('string', metadataKeys),
    tx.pure.vector('string', metadataValues),
    tx.pure.address(recipientAddress),
    tx.pure.u64(startDateMs),    // Unix ms
    tx.pure.u64(endDateMs),      // Unix ms
  ],
});

// Execute transaction
const result = await client.signAndExecuteTransaction({
  transaction: tx,
  signer: keypair,
});
```

**Note:** Always use `SUI_CLOCK_OBJECT_ID` from the Sui SDK instead of hardcoding `'0x6'`. While the clock address is stable, using the SDK constant is more maintainable and self-documenting.

### 2. Displaying Timestamps

**Always show timezone context to users:**

```typescript
// Utility function for displaying times
function formatCampaignTime(timestampMs: number, userTimezone?: string): string {
  const date = new Date(timestampMs);

  // Get user's timezone or use their browser's default
  const timezone = userTimezone || Intl.DateTimeFormat().resolvedOptions().timeZone;

  const options: Intl.DateTimeFormatOptions = {
    timeZone: timezone,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short',
  };

  return date.toLocaleString('en-US', options);
}

// Usage in UI
const campaign: Campaign = await fetchCampaign(campaignId);

console.log(`Starts: ${formatCampaignTime(campaign.start_date)}`);
// Output: "Starts: October 11, 2025, 02:00 AM PDT"

console.log(`Ends: ${formatCampaignTime(campaign.end_date)}`);
// Output: "Ends: December 31, 2025, 04:59 PM PST"
```

**React Component Example:**

```tsx
import { formatDistanceToNow } from 'date-fns';

interface CampaignCardProps {
  campaign: Campaign;
}

function CampaignCard({ campaign }: CampaignCardProps) {
  const now = Date.now();
  const isActive = now >= campaign.start_date && now < campaign.end_date;
  const hasStarted = now >= campaign.start_date;
  const hasEnded = now >= campaign.end_date;

  return (
    <div className="campaign-card">
      <h2>{campaign.name}</h2>

      {/* Status badge */}
      {!hasStarted && (
        <span className="badge badge-upcoming">
          Starts {formatDistanceToNow(new Date(campaign.start_date), { addSuffix: true })}
        </span>
      )}
      {isActive && (
        <span className="badge badge-active">
          Active • Ends {formatDistanceToNow(new Date(campaign.end_date), { addSuffix: true })}
        </span>
      )}
      {hasEnded && (
        <span className="badge badge-ended">Ended</span>
      )}

      {/* Detailed times */}
      <div className="campaign-times">
        <div>
          <strong>Start:</strong> {formatCampaignTime(campaign.start_date)}
        </div>
        <div>
          <strong>End:</strong> {formatCampaignTime(campaign.end_date)}
        </div>
        <div className="text-muted">
          <small>Created: {formatCampaignTime(campaign.created_at_ms)}</small>
        </div>
      </div>

      {/* Show UTC for international clarity */}
      <div className="timezone-info">
        <small>
          {new Date(campaign.start_date).toUTCString()} (UTC)
        </small>
      </div>
    </div>
  );
}
```

### 3. Timezone Best Practices

**Option A: UTC Everywhere (Simplest)**

```typescript
// Force users to think in UTC
function DateTimePicker({ value, onChange }: Props) {
  return (
    <div>
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => {
          // Interpret as UTC
          const utcMs = new Date(e.target.value + 'Z').getTime();
          onChange(utcMs);
        }}
      />
      <span className="help-text">⏰ All times are in UTC</span>
    </div>
  );
}
```

**Option B: User Timezone with Conversion (Recommended)**

```typescript
function SmartDateTimePicker({ value, onChange }: Props) {
  const userTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  return (
    <div className="datetime-picker">
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => {
          // Browser automatically handles timezone conversion
          const localMs = new Date(e.target.value).getTime();
          onChange(localMs);
        }}
      />

      {/* Show conversion info */}
      <div className="timezone-info">
        <p>Your timezone: <strong>{userTimezone}</strong></p>
        {value && (
          <>
            <p>Local: {new Date(value).toLocaleString()}</p>
            <p>UTC: {new Date(value).toUTCString()}</p>
          </>
        )}
      </div>
    </div>
  );
}
```

### 4. Handling Events from Indexer

When subscribing to events or querying indexed data:

```typescript
// Event listener example
interface IndexedEvent {
  type: string;
  timestamp_ms?: number;
  created_at_ms?: number;
  // ... other fields
}

function processEvent(event: IndexedEvent) {
  // Events use either timestamp_ms or created_at_ms
  const eventTime = event.timestamp_ms || event.created_at_ms;

  if (!eventTime) {
    console.warn('Event missing timestamp:', event);
    return;
  }

  // Display to user
  const timeAgo = formatDistanceToNow(new Date(eventTime), { addSuffix: true });
  console.log(`Event occurred ${timeAgo}`);

  // Store in database with proper indexing
  await db.events.insert({
    ...event,
    timestamp: new Date(eventTime), // Convert to Date for DB
  });
}
```

---

## Edge Cases & Testing

### 1. Campaign Starting Near Midnight

**Issue:** User creates campaign at 11:59 PM thinking it starts "tomorrow"

**Solution:** Always show clear date AND time, with timezone

```typescript
// Bad: Only showing date
"Start Date: Oct 11, 2025"

// Good: Showing complete datetime with timezone
"Start Date: Oct 11, 2025 at 12:00 AM PDT"
```

### 2. Transaction Delay

**Issue:** User submits transaction, but it confirms 30 seconds later. The `start_date` might now be in the past.

**Solution:** Add buffer time in UI validation

```typescript
const TRANSACTION_BUFFER_MS = 60_000; // 60 seconds

// Add buffer to validation
if (startDateMs < currentTimeMs + TRANSACTION_BUFFER_MS) {
  throw new Error('Start date must be at least 1 minute in the future');
}
```

### 3. Daylight Saving Time

**Issue:** Users in DST zones might get confused

**Solution:** Always include timezone name in displays

```typescript
// Use 'long' timeZoneName during DST transitions
{
  timeZoneName: 'long' // Shows "Pacific Daylight Time" vs "Pacific Standard Time"
}
```

### 4. International Users

**Issue:** Campaign creator in Tokyo, viewer in New York see different times

**Solution:** Show both local time and UTC

```tsx
<div>
  <p>Starts: {formatCampaignTime(campaign.start_date)}</p>
  <p className="text-muted">
    ({new Date(campaign.start_date).toUTCString()})
  </p>
</div>
```

---

## Testing Checklist

Before deploying frontend, test these scenarios:

- [ ] Create campaign starting in 1 hour - verify milliseconds passed correctly
- [ ] Create campaign with start_date in past - verify error handling
- [ ] Create campaign with end_date before start_date - verify error
- [ ] Display campaign created in different timezone - verify correct conversion
- [ ] Check campaign status at exact start_date time - verify timing logic
- [ ] View campaign from different timezone - verify both users see same UTC time
- [ ] Create campaign at 11:59 PM - verify doesn't accidentally use next day
- [ ] Submit transaction with slight delay - verify buffer handling
- [ ] Test with dates far in future (year 2099) - verify u64 doesn't overflow
- [ ] Test event timestamps match object timestamps

---

## Common Pitfalls

### ❌ **Wrong: Passing seconds instead of milliseconds**

```typescript
// WRONG - JavaScript uses milliseconds, not seconds
const startDateMs = Math.floor(Date.now() / 1000);
tx.pure.u64(startDateMs); // This is seconds, contract expects ms!
```

### ✅ **Correct: Using milliseconds**

```typescript
const startDateMs = Date.now(); // Already in milliseconds
tx.pure.u64(startDateMs);
```

### ❌ **Wrong: Not showing timezone**

```typescript
// User sees: "Starts: Oct 11, 2025, 9:00 AM"
// But 9:00 AM in which timezone???
```

### ✅ **Correct: Always include timezone context**

```typescript
// User sees: "Starts: Oct 11, 2025, 9:00 AM PDT"
// Clear which timezone
```

### ❌ **Wrong: Trusting user's system clock**

```typescript
// User's clock could be wrong!
const now = Date.now();
if (campaign.start_date < now) {
  showAsStarted();
}
```

### ✅ **Correct: Trust blockchain time from events/queries**

```typescript
// Get blockchain time from latest block or event
const blockchainTime = await getLatestBlockTimestamp();
if (campaign.start_date < blockchainTime) {
  showAsStarted();
}
```

---

## Summary

### Key Takeaways

1. **Always use milliseconds** - All timestamps are Unix milliseconds (UTC)
2. **Always show timezone** - Never display times without timezone context
3. **Validate on frontend** - Check dates before sending transaction to save gas
4. **UTC is source of truth** - All times stored in UTC, convert for display only
5. **Buffer for delays** - Add buffer time to handle transaction confirmation delays
6. **Test internationally** - Verify timezone handling with users in different zones

### Quick Reference

```typescript
// ✅ Creating campaign
const startDateMs = new Date('2025-10-11T09:00').getTime();
const endDateMs = new Date('2025-12-31T23:59').getTime();

// ✅ Displaying time
const formatted = new Date(campaign.start_date).toLocaleString('en-US', {
  timeZone: userTimezone,
  timeZoneName: 'short',
});

// ✅ Checking status
const now = Date.now();
const isActive = now >= campaign.start_date && now < campaign.end_date;

// ✅ Relative time
import { formatDistanceToNow } from 'date-fns';
const relative = formatDistanceToNow(new Date(campaign.start_date), {
  addSuffix: true
});
```

---

**Questions?** Review the test files in `tests/campaign_tests.move` to see how timestamps are used in practice.

**Contract Source:** See `sources/campaign.move` and `sources/crowd_walrus.move` for implementation details.
