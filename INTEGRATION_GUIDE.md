# Promotion Deal Types Integration Guide

## Quick Start

This guide shows how to integrate the new deal types into your existing promotions UI.

## Option 1: Use the New Component (Recommended)

### Step 1: Import the Component

```typescript
import PromotionDealTypeForm from "@/components/retailers/promotions/PromotionDealTypeForm";
import type { DealType, CreatePromotionDto } from "@/services/api/types/swagger";
import { validatePromotionData } from "@/utils/dealTypes";
```

### Step 2: Add State Management

```typescript
const [dealType, setDealType] = useState<DealType>("PERCENTAGE_DISCOUNT");
const [formData, setFormData] = useState<Partial<CreatePromotionDto>>({
  title: "",
  description: "",
  dealType: "PERCENTAGE_DISCOUNT",
  productIds: [],
  active: true,
});

const handleFieldChange = (field: keyof CreatePromotionDto, value: any) => {
  setFormData(prev => ({ ...prev, [field]: value }));
};
```

### Step 3: Add the Component to Your Form

```typescript
<View style={styles.formCard}>
  {/* Title Input */}
  <View style={styles.inputGroup}>
    <Text style={styles.label}>Promotion Title</Text>
    <TextInput
      style={styles.textInput}
      placeholder="e.g. Summer Sale"
      value={formData.title}
      onChangeText={(text) => handleFieldChange("title", text)}
    />
  </View>

  {/* Description Input */}
  <View style={styles.inputGroup}>
    <Text style={styles.label}>Description</Text>
    <TextInput
      style={styles.textInput}
      placeholder="Describe your promotion"
      value={formData.description}
      onChangeText={(text) => handleFieldChange("description", text)}
      multiline
    />
  </View>

  {/* Deal Type Form - NEW COMPONENT */}
  <PromotionDealTypeForm
    selectedDealType={dealType}
    onDealTypeChange={(newDealType) => {
      setDealType(newDealType);
      handleFieldChange("dealType", newDealType);
    }}
    formData={formData}
    onFieldChange={handleFieldChange}
  />

  {/* Date Selection */}
  {/* ... your existing date picker code ... */}

  {/* Product Selection */}
  {/* ... your existing product selection code ... */}

  {/* Submit Button */}
  <TouchableOpacity
    style={styles.createButton}
    onPress={handleCreatePromotion}
  >
    <Text style={styles.createButtonText}>Create Promotion</Text>
  </TouchableOpacity>
</View>
```

### Step 4: Update Submit Handler

```typescript
const handleCreatePromotion = async () => {
  // Validate basic fields
  if (!formData.title?.trim()) {
    Alert.alert("Error", "Please enter a promotion title");
    return;
  }

  if (!formData.productIds || formData.productIds.length === 0) {
    Alert.alert("Error", "Please select at least one product");
    return;
  }

  // Validate deal-specific fields
  const validationErrors = validatePromotionData(formData);
  if (validationErrors.length > 0) {
    const errorMessages = validationErrors.map(e => e.message).join("\n");
    Alert.alert("Validation Error", errorMessages);
    return;
  }

  // Bundle deals require at least 2 products
  if (formData.dealType === "BUNDLE" && formData.productIds.length < 2) {
    Alert.alert("Error", "Bundle deals require at least 2 products");
    return;
  }

  try {
    await createPromotion(formData as CreatePromotionDto).unwrap();
    Alert.alert("Success", "Promotion created successfully!");
    // Reset form...
  } catch (error: any) {
    Alert.alert("Error", error?.message || "Failed to create promotion");
  }
};
```

## Option 2: Update Existing Form

If you prefer to keep your existing form structure, here's how to add support for all deal types:

### Step 1: Update State

Replace your existing discount state with deal-type-specific states:

```typescript
// Old way (remove this)
const [discount, setDiscount] = useState("");
const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');

// New way (add this)
const [dealType, setDealType] = useState<DealType>("PERCENTAGE_DISCOUNT");
const [percentageOff, setPercentageOff] = useState("");
const [fixedAmountOff, setFixedAmountOff] = useState("");
const [buyQuantity, setBuyQuantity] = useState("");
const [getQuantity, setGetQuantity] = useState("");
const [bundlePrice, setBundlePrice] = useState("");
const [minQuantity, setMinQuantity] = useState("");
const [quantityDiscount, setQuantityDiscount] = useState("");
const [voucherValue, setVoucherValue] = useState("");
```

### Step 2: Add Deal Type Selector

```typescript
const dealTypeOptions: { value: DealType; label: string }[] = [
  { value: "PERCENTAGE_DISCOUNT", label: "% Discount" },
  { value: "FIXED_DISCOUNT", label: "₱ Discount" },
  { value: "BOGO", label: "BOGO" },
  { value: "BUNDLE", label: "Bundle" },
  { value: "QUANTITY_DISCOUNT", label: "Bulk Discount" },
  { value: "VOUCHER", label: "Voucher" },
];

<View style={styles.dealTypeSelector}>
  <Text style={styles.label}>Deal Type</Text>
  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
    {dealTypeOptions.map((option) => (
      <TouchableOpacity
        key={option.value}
        style={[
          styles.dealTypeButton,
          dealType === option.value && styles.dealTypeButtonSelected
        ]}
        onPress={() => setDealType(option.value)}
      >
        <Text style={[
          styles.dealTypeButtonText,
          dealType === option.value && styles.dealTypeButtonTextSelected
        ]}>
          {option.label}
        </Text>
      </TouchableOpacity>
    ))}
  </ScrollView>
</View>
```

### Step 3: Add Conditional Fields

```typescript
{/* Deal-specific fields */}
{dealType === "PERCENTAGE_DISCOUNT" && (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>Percentage Off (0-100)</Text>
    <TextInput
      style={styles.textInput}
      placeholder="25"
      value={percentageOff}
      onChangeText={setPercentageOff}
      keyboardType="decimal-pad"
    />
  </View>
)}

{dealType === "FIXED_DISCOUNT" && (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>Fixed Amount Off (₱)</Text>
    <TextInput
      style={styles.textInput}
      placeholder="10.00"
      value={fixedAmountOff}
      onChangeText={setFixedAmountOff}
      keyboardType="decimal-pad"
    />
  </View>
)}

{dealType === "BOGO" && (
  <View style={styles.row}>
    <View style={styles.column}>
      <Text style={styles.label}>Buy Quantity</Text>
      <TextInput
        style={styles.textInput}
        placeholder="1"
        value={buyQuantity}
        onChangeText={setBuyQuantity}
        keyboardType="number-pad"
      />
    </View>
    <View style={styles.column}>
      <Text style={styles.label}>Get Quantity</Text>
      <TextInput
        style={styles.textInput}
        placeholder="1"
        value={getQuantity}
        onChangeText={setGetQuantity}
        keyboardType="number-pad"
      />
    </View>
  </View>
)}

{/* ... similar blocks for BUNDLE, QUANTITY_DISCOUNT, VOUCHER ... */}
```

### Step 4: Update Submit Logic

```typescript
const handleCreatePromotion = async () => {
  // Build promotion data based on deal type
  const promotionData: CreatePromotionDto = {
    title: promotionTitle,
    dealType: dealType,
    description: description,
    startsAt: startDate.toISOString(),
    endsAt: endDate.toISOString(),
    productIds: selectedProductIds,
    active: true,
  };

  // Add deal-specific fields
  switch (dealType) {
    case "PERCENTAGE_DISCOUNT":
      promotionData.percentageOff = parseFloat(percentageOff);
      break;
    case "FIXED_DISCOUNT":
      promotionData.fixedAmountOff = parseFloat(fixedAmountOff);
      break;
    case "BOGO":
      promotionData.buyQuantity = parseInt(buyQuantity, 10);
      promotionData.getQuantity = parseInt(getQuantity, 10);
      break;
    case "BUNDLE":
      promotionData.bundlePrice = parseFloat(bundlePrice);
      break;
    case "QUANTITY_DISCOUNT":
      promotionData.minQuantity = parseInt(minQuantity, 10);
      promotionData.quantityDiscount = parseFloat(quantityDiscount);
      break;
    case "VOUCHER":
      promotionData.voucherValue = parseFloat(voucherValue);
      break;
  }

  // Validate
  const errors = validatePromotionData(promotionData);
  if (errors.length > 0) {
    Alert.alert("Validation Error", errors[0].message);
    return;
  }

  // Submit
  try {
    await createPromotion(promotionData).unwrap();
    Alert.alert("Success", "Promotion created!");
  } catch (error: any) {
    Alert.alert("Error", error?.message || "Failed to create promotion");
  }
};
```

## Displaying Promotions

### Format Deal Details

Use the utility function to display deal information:

```typescript
import { formatDealDetails, getDealTypeLabel } from "@/utils/dealTypes";

function PromotionItem({ promotion }: { promotion: PromotionResponseDto }) {
  return (
    <View style={styles.promotionCard}>
      <Text style={styles.title}>{promotion.title}</Text>
      <Text style={styles.dealType}>{getDealTypeLabel(promotion.dealType)}</Text>
      <Text style={styles.dealDetails}>{formatDealDetails(promotion)}</Text>
    </View>
  );
}
```

### Calculate Prices

```typescript
import { calculatePromotionPrice } from "@/utils/dealTypes";

function ProductWithPromotion({ product, promotion, quantity = 1 }) {
  const originalPrice = parseFloat(product.price);
  const finalPrice = calculatePromotionPrice(originalPrice, promotion, quantity);
  const savings = originalPrice * quantity - finalPrice;

  return (
    <View>
      <Text>Original: ₱{(originalPrice * quantity).toFixed(2)}</Text>
      <Text>Final: ₱{finalPrice.toFixed(2)}</Text>
      <Text>You save: ₱{savings.toFixed(2)}</Text>
    </View>
  );
}
```

## Testing Checklist

- [ ] Can create percentage discount promotion
- [ ] Can create fixed discount promotion
- [ ] Can create BOGO promotion
- [ ] Can create bundle promotion (with 2+ products)
- [ ] Can create quantity discount promotion
- [ ] Can create voucher promotion
- [ ] Validation prevents invalid data
- [ ] Deal details display correctly
- [ ] Price calculation works for each type
- [ ] Admin can view all deal types
- [ ] Existing promotions still work (backward compatibility)

## Common Pitfalls

1. **Not validating before submit**: Always use `validatePromotionData()`
2. **Forgetting productIds**: All promotions need at least 1 product
3. **Bundle with 1 product**: Bundles require at least 2 products
4. **Wrong field types**: Use numbers for numeric fields, not strings
5. **Missing dealType**: Always set the dealType
6. **Not handling errors**: Wrap API calls in try-catch

## Need Help?

Refer to:
- `PROMOTION_DEAL_TYPES.md` - Full documentation
- `utils/dealTypes.ts` - Utility functions
- `components/retailers/promotions/PromotionDealTypeForm.tsx` - Example component
- API specification in the OpenAPI document

## Summary

The key changes are:

1. ✅ Replace `type`/`discount` with `dealType` and specific fields
2. ✅ Use `PromotionDealTypeForm` component or add conditional fields
3. ✅ Validate with `validatePromotionData()`
4. ✅ Display with `formatDealDetails()` and `getDealTypeLabel()`
5. ✅ Calculate prices with `calculatePromotionPrice()`

That's it! Your promotions feature now supports all 6 deal types. 🎉


