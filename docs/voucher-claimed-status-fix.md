# Voucher Claimed Status Fix

## Issue
Consumers are being labeled as "voucher claimed" even when there's no retailer confirmation. The "Voucher Already Claimed" banner appears when a consumer generates a voucher (status: PENDING) or when a retailer verifies it (status: VERIFIED), before the retailer confirms the redemption.

## Expected Behavior
A voucher should only be considered "claimed" when its status is **REDEEMED** (i.e., after the retailer scans the QR code AND confirms the redemption). 

Vouchers with status **PENDING** or **VERIFIED** should NOT count as "claimed" because:
- **PENDING**: Consumer generated QR code, but retailer hasn't scanned it yet
- **VERIFIED**: Retailer scanned QR code, but hasn't confirmed redemption yet
- **REDEEMED**: Retailer confirmed redemption - this is when the voucher is truly "claimed"

## Root Cause
The backend endpoint `GET /promotions/voucher/check/{storeId}` is likely checking for vouchers with any status (PENDING, VERIFIED, or REDEEMED) instead of only checking for **REDEEMED** status.

## Required Backend Fix

The endpoint should only return `hasClaimed: true` if a voucher with **REDEEMED** status exists for that consumer-store combination.

### Current (Incorrect) Logic
```typescript
// ❌ WRONG - Checks for any voucher status
const existingVoucher = await voucherRedemptionRepository.findFirst({
  where: {
    userId: currentUser.id,
    storeId: storeId,
    // Missing status filter - returns vouchers with any status
  },
});
```

### Correct Logic
```typescript
// ✅ CORRECT - Only checks for REDEEMED vouchers
const existingRedeemedVoucher = await voucherRedemptionRepository.findFirst({
  where: {
    userId: currentUser.id,
    storeId: storeId,
    status: 'REDEEMED', // Only REDEEMED vouchers count as "claimed"
  },
});

return {
  hasClaimed: !!existingRedeemedVoucher,
  redemptionId: existingRedeemedVoucher?.id || null,
  status: existingRedeemedVoucher?.status || null,
  storeId: storeId,
};
```

## Voucher Lifecycle Reference

1. **PENDING** → Consumer generates QR code (NOT claimed)
2. **VERIFIED** → Retailer scans QR code (NOT claimed)
3. **REDEEMED** → Retailer confirms redemption (**CLAIMED** ✅)
4. **CANCELLED** → Voucher cancelled (NOT claimed)

## Testing
After the fix:
- Consumer generates voucher (PENDING) → `hasClaimed: false` ✅
- Retailer verifies voucher (VERIFIED) → `hasClaimed: false` ✅
- Retailer confirms redemption (REDEEMED) → `hasClaimed: true` ✅

