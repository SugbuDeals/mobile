# Promotion CRUD Operations - Frontend Documentation

## Overview
This document outlines how the frontend handles Promotion CRUD operations and the required backend API contract.

---

## Frontend Operations

### 1. **READ Operations**

#### Get All Promotions
- **Endpoint**: `GET /promotions`
- **Frontend Function**: `findPromotions()`
- **Usage**: Admin view to see all promotions (active and inactive)
- **Location**: `app/(admin)/view-promotion.tsx`

#### Get Active Promotions
- **Endpoint**: `GET /promotions/active`
- **Frontend Function**: `findActivePromotions(storeId?: number)`
- **Usage**: 
  - Consumer home page
  - Retailer dashboard
  - Store details page
- **Filtering**: If `storeId` is provided, frontend filters by store ownership

#### Get Promotion by ID
- **Endpoint**: `GET /promotions/{id}`
- **Frontend Function**: `findPromotionById(promotionId)`
- **Usage**: Fetch single promotion details

---

### 2. **CREATE Operation**

#### Create Promotion
- **Endpoint**: `POST /promotions`
- **Frontend Function**: `createPromotion(data)`
- **Request Payload**:
```typescript
{
  title: string;
  type: string; // "percentage" | "fixed" (case-insensitive)
  description: string;
  discount: number;
  productIds: number[]; // Array of product IDs
  startsAt?: string; // ISO 8601 format
  endsAt?: string | null; // ISO 8601 format
  active?: boolean;
}
```

- **Usage**: 
  - Retailers create promotions via `app/(retailers)/promotions.tsx`
  - Frontend sends `productIds` array (not `productId`)
  - Creates one promotion per product with individual discounts

#### Add Products to Promotion
- **Endpoint**: `POST /promotions/{id}/products`
- **Frontend Function**: `addProductsToPromotion(promotionId, data)`
- **Request Payload**:
```typescript
{
  productIds: number[];
}
```
- **Usage**: Add additional products to existing promotion
- **Tier Restrictions**: 
  - BASIC tier: max 10 products per promotion
  - PRO tier: unlimited products

---

### 3. **UPDATE Operation**

#### Update Promotion
- **Endpoint**: `PATCH /promotions/{id}`
- **Frontend Function**: `updatePromotion({ id, ...data })`
- **Request Payload** (all fields optional):
```typescript
{
  id: number;
  title?: string;
  type?: string;
  description?: string;
  discount?: number;
  startsAt?: string;
  endsAt?: string | null;
  active?: boolean;
}
```

- **Usage**: 
  - Admin can toggle `active` status in `app/(admin)/view-promotion.tsx`
  - Retailers can edit promotions in `app/(retailers)/promotions.tsx`

---

### 4. **DELETE Operation**

#### Delete Promotion
- **Endpoint**: `DELETE /promotions/{id}`
- **Frontend Function**: `deletePromotion(promotionId)`
- **Usage**: Admin can delete promotions from `app/(admin)/view-promotion.tsx`

---

## Expected Response Structure

### PromotionResponseDto
According to the OpenAPI schema, the backend should return:

```typescript
{
  id: number;
  title: string;
  type: string; // "PERCENTAGE" or "FIXED" (uppercase from API, frontend handles case-insensitive)
  description: string;
  startsAt: string; // ISO 8601 format date-time
  endsAt: string | null; // ISO 8601 format date-time
  active: boolean;
  discount: number;
  productId: number | null; // ⚠️ CRITICAL: Must be populated for frontend to work
}
```

**OpenAPI Schema Reference**: The schema defines `productId` as nullable (`"nullable": true`), but it should be populated with a value (not null) when the promotion has products.

---

## ⚠️ CRITICAL BACKEND REQUIREMENTS

### Issue: Missing `productId` Field

**Problem**: The frontend code relies on `productId` field to:
1. Display product names in promotion lists
2. Filter promotions by product
3. Search promotions by product name
4. Determine if promotion is "orphaned" (product/store doesn't exist)

**Current Backend Response** (❌ Broken):
```json
{
  "id": 28,
  "title": "Sueu",
  "type": "percentage",
  "productId": null,  // ❌ This is null (schema allows nullable but frontend needs a value)
  "promotionProducts": [  // Products are here but frontend doesn't use this
    {
      "productId": 81,
      "product": { ... }
    }
  ]
}
```

**Required Backend Response** (✅ Fixed):
```json
{
  "id": 28,
  "title": "Sueu",
  "type": "percentage",
  "productId": 81,  // ✅ Must be populated (first product's ID from promotionProducts)
  // Note: promotionProducts array can still be included for detailed product info
}
```

### Backend Fix Required

**According to OpenAPI Schema**: The `PromotionResponseDto` schema defines `productId` as:
- Type: `object` (should be `number`)
- Nullable: `true`
- Description: "Product ID (nullable)"

**Required Implementation**:
1. **Populate `productId` from `promotionProducts` array**
   - When building the response, extract the first product's ID from the `promotionProducts` relationship
   - Set `productId` to that value (not null)
   - If `promotionProducts` is empty, then `productId` can be `null`

2. **Implementation Logic**:
   ```typescript
   // Pseudo-code for backend
   productId: promotion.promotionProducts?.length > 0 
     ? promotion.promotionProducts[0].productId 
     : null
   ```

3. **Why This Matters**:
   - Frontend uses `productId` to look up product names in the products list
   - Without it, promotions show "No product" or "Product #81" instead of actual product names
   - Frontend filtering and search functionality breaks without this field

---

## Frontend Code Locations

### Key Files

1. **API Client**: `services/api/endpoints/promotions.ts`
   - Defines all API endpoints
   - Uses Swagger types from `services/api/types/swagger.ts`

2. **Redux Thunks**: `features/store/promotions/thunks.ts`
   - `findPromotions()` - Get all promotions
   - `findActivePromotions()` - Get active promotions (with optional store filtering)
   - `createPromotion()` - Create new promotion
   - `updatePromotion()` - Update existing promotion
   - `deletePromotion()` - Delete promotion

3. **Redux Slice**: `features/store/promotions/slice.ts`
   - Manages promotion state in Redux store
   - Handles loading/error states

4. **Admin View**: `app/(admin)/view-promotion.tsx`
   - Displays all promotions
   - Allows toggling active status
   - Allows deleting promotions
   - **Uses**: `promo.productId` to get product name (line 141, 50)

5. **Retailer Promotions**: `app/(retailers)/promotions.tsx`
   - Create/edit promotions
   - Sends `productIds` array in create request (line 409)

6. **Consumer Views**: 
   - `app/(consumers)/index.tsx` - Shows active promotions on home
   - `app/(consumers)/storedetails.tsx` - Shows promotions for a store
   - `app/(consumers)/explore.tsx` - Shows promotions in explore view

---

## Type Handling

### Type Field
- **Backend sends**: `"PERCENTAGE"` or `"FIXED"` (uppercase)
- **Frontend handles**: Case-insensitive comparison using `.toLowerCase()`
- **Display**: 
  - Percentage: `"20%"` 
  - Fixed: `"₱50"`

### Date Fields
- **Format**: ISO 8601 strings (e.g., `"2025-12-11T00:33:00.000Z"`)
- **Frontend expects**: String format, not Date objects
- **Nullable**: `endsAt` can be `null` for ongoing promotions

---

## Filtering & Search

### Active Promotions Filtering
- Frontend filters by `active === true`
- Also checks `startsAt` and `endsAt` dates (handled by backend `/promotions/active` endpoint)

### Store-Based Filtering
- If `storeId` provided to `findActivePromotions(storeId)`:
  1. Frontend fetches all active promotions
  2. Frontend fetches products for that store
  3. Frontend filters promotions where `promotion.productId` matches a product from that store

### Search Functionality
- Admin view searches by:
  - Promotion title
  - Product name (looked up via `productId`)

---

## Summary of Required Backend Changes

1. ✅ **Populate `productId` field** in all promotion responses
   - Use first product from `promotionProducts` array if available
   - This field is critical for frontend to display and filter promotions

2. ✅ **Maintain `promotionProducts` array** (optional but recommended)
   - Can be used for detailed product information
   - Frontend can be enhanced later to use this for multi-product display

3. ✅ **Ensure `type` field** is consistent (uppercase is fine, frontend handles it)

4. ✅ **Ensure date fields** are ISO 8601 strings

---

## Testing Checklist

After backend changes, verify:
- [ ] Promotions display in admin view (`/admin/view-promotion`)
- [ ] Product names show correctly (not "No product" or "Product #81")
- [ ] Search by product name works
- [ ] Active promotions filter works
- [ ] Store-based filtering works (retailer dashboard)
- [ ] Consumer views show promotions correctly
- [ ] Creating promotions works (retailer flow)
- [ ] Updating promotion active status works
- [ ] Deleting promotions works

