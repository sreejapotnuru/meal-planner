/**
 * Reference prices for common grocery items
 * Based on USDA Average Retail Food Prices and public grocery data
 * This is a simplified reference database for MVP
 * In production, this could be expanded or connected to real grocery APIs
 */

export const REFERENCE_PRICES: Record<
  string,
  { pricePerUnit: number; unit: string; category: string; lastUpdated: string }
> = {
  // Vegetables
  'tomato': { pricePerUnit: 0.3, unit: 'each', category: 'vegetables', lastUpdated: '2024-01-01' },
  'onion': { pricePerUnit: 0.25, unit: 'each', category: 'vegetables', lastUpdated: '2024-01-01' },
  'garlic': { pricePerUnit: 0.15, unit: 'clove', category: 'vegetables', lastUpdated: '2024-01-01' },
  'carrot': { pricePerUnit: 0.2, unit: 'each', category: 'vegetables', lastUpdated: '2024-01-01' },
  'broccoli': { pricePerUnit: 1.5, unit: 'head', category: 'vegetables', lastUpdated: '2024-01-01' },
  'spinach': { pricePerUnit: 2.5, unit: 'bunch', category: 'vegetables', lastUpdated: '2024-01-01' },
  'potato': { pricePerUnit: 0.15, unit: 'each', category: 'vegetables', lastUpdated: '2024-01-01' },
  'bell pepper': { pricePerUnit: 0.8, unit: 'each', category: 'vegetables', lastUpdated: '2024-01-01' },
  'cucumber': { pricePerUnit: 0.5, unit: 'each', category: 'vegetables', lastUpdated: '2024-01-01' },
  'mushroom': { pricePerUnit: 3.99, unit: 'lb', category: 'vegetables', lastUpdated: '2024-01-01' },

  // Fruits
  'apple': { pricePerUnit: 0.5, unit: 'each', category: 'fruits', lastUpdated: '2024-01-01' },
  'banana': { pricePerUnit: 0.3, unit: 'each', category: 'fruits', lastUpdated: '2024-01-01' },
  'orange': { pricePerUnit: 0.6, unit: 'each', category: 'fruits', lastUpdated: '2024-01-01' },
  'lemon': { pricePerUnit: 0.4, unit: 'each', category: 'fruits', lastUpdated: '2024-01-01' },
  'strawberry': { pricePerUnit: 3.5, unit: 'lb', category: 'fruits', lastUpdated: '2024-01-01' },
  'blueberry': { pricePerUnit: 4.5, unit: 'lb', category: 'fruits', lastUpdated: '2024-01-01' },

  // Dairy
  'milk': { pricePerUnit: 2.5, unit: 'gallon', category: 'dairy', lastUpdated: '2024-01-01' },
  'cheese': { pricePerUnit: 4.5, unit: 'lb', category: 'dairy', lastUpdated: '2024-01-01' },
  'butter': { pricePerUnit: 3.5, unit: 'lb', category: 'dairy', lastUpdated: '2024-01-01' },
  'yogurt': { pricePerUnit: 0.4, unit: 'each', category: 'dairy', lastUpdated: '2024-01-01' },
  'egg': { pricePerUnit: 2.5, unit: 'dozen', category: 'dairy', lastUpdated: '2024-01-01' },

  // Proteins
  'chicken breast': { pricePerUnit: 6.99, unit: 'lb', category: 'meat', lastUpdated: '2024-01-01' },
  'ground beef': { pricePerUnit: 7.99, unit: 'lb', category: 'meat', lastUpdated: '2024-01-01' },
  'salmon': { pricePerUnit: 8.99, unit: 'lb', category: 'meat', lastUpdated: '2024-01-01' },
  'beans': { pricePerUnit: 1.0, unit: 'can', category: 'pulses', lastUpdated: '2024-01-01' },
  'tofu': { pricePerUnit: 2.5, unit: 'block', category: 'meat', lastUpdated: '2024-01-01' },

  // Grains
  'rice': { pricePerUnit: 0.008, unit: 'g', category: 'grains', lastUpdated: '2024-01-01' },
  'pasta': { pricePerUnit: 1.0, unit: 'lb', category: 'grains', lastUpdated: '2024-01-01' },
  'bread': { pricePerUnit: 2.5, unit: 'loaf', category: 'grains', lastUpdated: '2024-01-01' },
  'oats': { pricePerUnit: 3.5, unit: 'lb', category: 'grains', lastUpdated: '2024-01-01' },
  'flour': { pricePerUnit: 2.5, unit: 'lb', category: 'grains', lastUpdated: '2024-01-01' },

  // Pantry
  'olive oil': { pricePerUnit: 7.5, unit: 'liter', category: 'packaged', lastUpdated: '2024-01-01' },
  'salt': { pricePerUnit: 1.0, unit: 'lb', category: 'spices', lastUpdated: '2024-01-01' },
  'sugar': { pricePerUnit: 2.0, unit: 'lb', category: 'packaged', lastUpdated: '2024-01-01' },
  'canned tomato': { pricePerUnit: 0.8, unit: 'can', category: 'packaged', lastUpdated: '2024-01-01' },
  'peanut butter': { pricePerUnit: 3.0, unit: 'jar', category: 'packaged', lastUpdated: '2024-01-01' },
  'honey': { pricePerUnit: 6.0, unit: 'jar', category: 'packaged', lastUpdated: '2024-01-01' },
}

/**
 * Get price verification message based on status
 */
export function getPriceVerificationMessage(status: 'verified' | 'estimated' | 'unverified'): string {
  switch (status) {
    case 'verified':
      return 'Prices are based on verified local data'
    case 'estimated':
      return 'Prices are estimated based on typical market rates'
    case 'unverified':
      return 'Accurate local pricing is currently unavailable. Budget feasibility could not be fully verified.'
    default:
      return 'Price verification status unknown'
  }
}

/**
 * Search for similar items if exact match not found
 */
export function findSimilarPricedItem(
  searchTerm: string,
  category?: string,
): { name: string; price: number } | null {
  const searchLower = searchTerm.toLowerCase()

  for (const [name, data] of Object.entries(REFERENCE_PRICES)) {
    if (category && data.category !== category) continue

    if (name.includes(searchLower) || searchLower.includes(name)) {
      return { name, price: data.pricePerUnit }
    }
  }

  return null
}
