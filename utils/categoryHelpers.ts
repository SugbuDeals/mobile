/**
 * Category Helper Functions
 * Utilities for handling custom category names stored in product descriptions
 */

/**
 * Extract custom category name from product description
 * Format: [Category: CustomName] at the end of description
 */
export function extractCustomCategory(description: string | null | undefined): {
  cleanDescription: string;
  customCategory: string | null;
} {
  if (!description) {
    return { cleanDescription: "", customCategory: null };
  }

  const categoryPattern = /\n\n\[Category:\s*(.+?)\]\s*$/;
  const match = description.match(categoryPattern);

  if (match && match[1]) {
    const customCategory = match[1].trim();
    const cleanDescription = description.replace(categoryPattern, "").trim();
    return { cleanDescription, customCategory };
  }

  return { cleanDescription: description.trim(), customCategory: null };
}

/**
 * Append custom category to description in structured format
 */
export function appendCustomCategory(description: string, customCategoryName: string): string {
  const trimmedDesc = description.trim();
  const trimmedCategory = customCategoryName.trim();
  
  if (!trimmedCategory) {
    return trimmedDesc;
  }

  // Remove existing category tag if present
  const { cleanDescription } = extractCustomCategory(trimmedDesc);
  
  // Append new category tag
  return `${cleanDescription}\n\n[Category: ${trimmedCategory}]`;
}

/**
 * Get category name for a product, checking both categoryId and custom category in description
 */
export function getProductCategoryName(
  product: { categoryId?: number | null; description?: string | null },
  categories: Array<{ id: number; name: string }>
): string {
  // First check for custom category in description
  if (product.description) {
    const { customCategory } = extractCustomCategory(product.description);
    if (customCategory) {
      return customCategory;
    }
  }

  // Fall back to categoryId lookup
  if (product.categoryId != null) {
    const match = categories.find((cat) => cat.id === product.categoryId);
    if (match) {
      return match.name;
    }
  }

  return "";
}



