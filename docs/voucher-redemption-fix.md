# Voucher Redemption Decrementation Fix

## Problem
When a voucher is redeemed via `/promotions/voucher/confirm`, the `voucherQuantity` field on the promotion is not being decremented, causing incorrect remaining voucher counts to be displayed.

## Solution
Created an enhanced voucher redemption confirmation endpoint that ensures the voucher quantity is properly decremented and the updated promotion is returned.

## Frontend Changes

### 1. Updated Types (`services/api/types/swagger.ts`)
- Added `promotion?: PromotionResponseDto` to `ConfirmVoucherRedemptionResponseDto` to allow backend to return the updated promotion
- Added `promotionId?: number` to `VoucherVerificationResponseDto` for better tracking (optional for backward compatibility)

### 2. Enhanced API Endpoint (`services/api/endpoints/promotions.ts`)
- Created `confirmVoucherRedemptionWithUpdate()` method that:
  - Confirms the voucher redemption
  - Checks if backend returns updated promotion in response
  - If not, fetches the updated promotion separately using `promotionId`
  - Returns the confirmation result with the updated promotion

### 3. Updated Voucher Scanner (`app/(retailers)/voucher-scanner.tsx`)
- Updated `handleConfirmRedemption()` to use the enhanced `confirmVoucherRedemptionWithUpdate()` method
- Passes `promotionId` from verification result to ensure updated promotion is fetched

## Backend Requirements

The backend `/promotions/voucher/confirm` endpoint should:

1. **Decrement `voucherQuantity`** when a voucher is successfully redeemed:
   ```typescript
   // Pseudo-code
   if (promotion.voucherQuantity !== null && promotion.voucherQuantity > 0) {
     promotion.voucherQuantity -= 1;
     await promotionRepository.save(promotion);
   }
   ```

2. **Return updated promotion** in the confirmation response:
   ```json
   {
     "message": "Voucher redeemed successfully",
     "redemptionId": 1,
     "promotion": {
       "id": 1,
       "title": "Holiday Gift Voucher",
       "voucherQuantity": 99,  // Decremented from 100
       // ... other promotion fields
     }
   }
   ```

3. **Include `promotionId`** in the verification response (`/promotions/voucher/verify`):
   ```json
   {
     "valid": true,
     "userId": 1,
     "userName": "John Doe",
     "promotionId": 1,  // Add this field
     "promotionTitle": "Holiday Gift Voucher",
     // ... other fields
   }
   ```

## OpenAPI Spec Update

Update the `/promotions/voucher/confirm` endpoint response schema:

```yaml
/promotions/voucher/confirm:
  post:
    responses:
      201:
        description: "Voucher redeemed successfully"
        content:
          application/json:
            schema:
              type: object
              properties:
                message:
                  type: string
                  example: "Voucher redeemed successfully"
                redemptionId:
                  type: number
                  example: 1
                promotion:
                  $ref: "#/components/schemas/PromotionResponseDto"
                  description: "Updated promotion with decremented voucherQuantity"
```

Update the `/promotions/voucher/verify` endpoint response schema:

```yaml
/promotions/voucher/verify:
  post:
    responses:
      201:
        description: "Voucher verified successfully"
        content:
          application/json:
            schema:
              type: object
              properties:
                # ... existing properties
                promotionId:
                  type: number
                  description: "Promotion ID for tracking"
                  example: 1
```

## Testing

1. Create a voucher promotion with `voucherQuantity: 10`
2. Generate a voucher token
3. Verify the voucher (should show 10 remaining)
4. Confirm the redemption
5. Verify the promotion now shows `voucherQuantity: 9`
6. Check that the confirmation response includes the updated promotion

## Migration Notes

- The frontend changes are backward compatible
- If backend doesn't return `promotion` in confirmation response, the enhanced method will attempt to fetch it separately using `promotionId`
- If `promotionId` is not available, the method will still work but won't return the updated promotion (graceful degradation)
