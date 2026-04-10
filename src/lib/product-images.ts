/**
 * Product image utility service
 * Handles product image URLs from ImageKit
 * Products without images will display a simple placeholder
 */

interface Product {
  imageUrl?: string;
  category: string;
}

/**
 * Simple placeholder SVG for products without images
 * Shows a minimal pharmacy/product icon on dark background
 */
const PLACEHOLDER_IMAGE = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200"%3E%3Crect width="200" height="200" fill="%231a1f2e"/%3E%3Cg opacity="0.3"%3E%3Ccircle cx="100" cy="100" r="40" fill="none" stroke="%2310b981" stroke-width="3"/%3E%3Cpath d="M100 70 L100 130 M70 100 L130 100" stroke="%2310b981" stroke-width="3" stroke-linecap="round"/%3E%3C/g%3E%3C/svg%3E';

/**
 * Get the appropriate image URL for a product
 * Returns the product's imageUrl if available (from ImageKit), otherwise returns placeholder
 * 
 * @param product - Product object with optional imageUrl and category
 * @returns Image URL string
 */
export function getProductImage(product: Product): string {
  // If product has a valid imageUrl (from ImageKit), use it
  if (product.imageUrl && product.imageUrl.trim() !== '') {
    return product.imageUrl;
  }

  // Otherwise, return placeholder
  return PLACEHOLDER_IMAGE;
}

/**
 * Handle image load errors by showing placeholder
 * Can be used in onError handlers for img elements
 * 
 * @param event - Image error event
 */
export function handleImageError(event: React.SyntheticEvent<HTMLImageElement>): void {
  // On error, use placeholder
  event.currentTarget.src = PLACEHOLDER_IMAGE;
}
