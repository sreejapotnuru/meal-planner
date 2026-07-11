import { GeneratedMealPlan, GroceryItem, GroceryCategory, MealPlanRequest } from '../types'
import { estimateIngredientPrice } from './budget'
import { v4 as uuidv4 } from 'uuid'

const CATEGORY_MAPPING: Record<string, GroceryCategory> = {
  // Vegetables
  tomato: 'vegetables',
  onion: 'vegetables',
  garlic: 'vegetables',
  carrot: 'vegetables',
  broccoli: 'vegetables',
  spinach: 'vegetables',
  potato: 'vegetables',
  'bell pepper': 'vegetables',
  cucumber: 'vegetables',
  mushroom: 'vegetables',
  lettuce: 'vegetables',
  cabbage: 'vegetables',
  celery: 'vegetables',
  kale: 'vegetables',

  // Fruits
  apple: 'fruits',
  banana: 'fruits',
  orange: 'fruits',
  lemon: 'fruits',
  strawberry: 'fruits',
  blueberry: 'fruits',
  grape: 'fruits',
  watermelon: 'fruits',

  // Dairy
  milk: 'dairy',
  cheese: 'dairy',
  butter: 'dairy',
  yogurt: 'dairy',
  egg: 'dairy',
  cream: 'dairy',

  // Proteins
  'chicken breast': 'meat',
  'ground beef': 'meat',
  salmon: 'meat',
  tofu: 'meat',
  'pork chop': 'meat',
  turkey: 'meat',
  fish: 'meat',
  beef: 'meat',
  chicken: 'meat',

  // Pulses
  beans: 'pulses',
  lentils: 'pulses',
  chickpeas: 'pulses',
  'black beans': 'pulses',
  peas: 'pulses',

  // Grains
  rice: 'grains',
  pasta: 'grains',
  bread: 'grains',
  oats: 'grains',
  flour: 'grains',
  cereal: 'grains',
  quinoa: 'grains',

  // Spices
  salt: 'spices',
  pepper: 'spices',
  cumin: 'spices',
  paprika: 'spices',
  cinnamon: 'spices',
  turmeric: 'spices',
  oregano: 'spices',
  basil: 'spices',

  // Packaged
  'olive oil': 'packaged',
  'peanut butter': 'packaged',
  honey: 'packaged',
  'canned tomato': 'packaged',
  sugar: 'packaged',
}

/**
 * Aggregate grocery items from meal plan
 * - Consolidates duplicate ingredients
 * - Sums quantities
 * - Groups by category
 * - Excludes available-at-home ingredients
 */
export function aggregateGroceryList(
  mealPlan: GeneratedMealPlan,
  request: MealPlanRequest,
): GroceryItem[] {
  // Collect all ingredients with their quantities
  const ingredientMap = new Map<string, { quantity: number; unit: string; allergens?: string[] }>()

  mealPlan.days.forEach((day) => {
    const meals = [day.breakfast, day.lunch, day.dinner].filter(Boolean)
    meals.forEach((meal) => {
      meal.ingredients?.forEach((ingredient) => {
        const key = ingredient.name.toLowerCase()

        // Skip if ingredient is available at home
        if (isIngredientAvailable(ingredient.name, request.available_ingredients)) {
          return
        }

        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!
          // Simple quantity addition (same unit assumption)
          existing.quantity += ingredient.quantity
        } else {
          ingredientMap.set(key, {
            quantity: ingredient.quantity,
            unit: ingredient.unit,
            allergens: ingredient.allergens,
          })
        }
      })
    })
  })

  // Convert to GroceryItem array with pricing
  const groceryItems: GroceryItem[] = Array.from(ingredientMap.entries()).map(([name, data]) => {
    const { price: estimatedPrice, verified } = estimateIngredientPrice(name, data.quantity, data.unit)
    const category = getCategoryForIngredient(name)

    return {
      id: uuidv4(),
      name: capitalizeWords(name),
      quantity: Math.round(data.quantity * 100) / 100, // Round to 2 decimals
      unit: data.unit,
      category,
      estimated_price: verified ? estimatedPrice : undefined,
      is_purchased: false,
    }
  })

  // Sort by category then by name
  return groceryItems.sort((a, b) => {
    if (a.category !== b.category) {
      return a.category.localeCompare(b.category)
    }
    return a.name.localeCompare(b.name)
  })
}

/**
 * Check if ingredient is already available at home
 */
function isIngredientAvailable(ingredientName: string, availableIngredients: string[]): boolean {
  const ingredientLower = ingredientName.toLowerCase()
  return availableIngredients.some((available) =>
    ingredientLower.includes(available.toLowerCase()) || available.toLowerCase().includes(ingredientLower)
  )
}

/**
 * Get category for an ingredient
 */
function getCategoryForIngredient(ingredientName: string): GroceryCategory {
  const nameLower = ingredientName.toLowerCase()

  for (const [keyword, category] of Object.entries(CATEGORY_MAPPING)) {
    if (nameLower.includes(keyword)) {
      return category
    }
  }

  // Default to 'other' if no category found
  return 'other'
}

/**
 * Capitalize words in a string
 */
function capitalizeWords(str: string): string {
  return str
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ')
}

/**
 * Group grocery items by category
 */
export function groupGroceryByCategory(items: GroceryItem[]): Record<GroceryCategory, GroceryItem[]> {
  const grouped: Record<GroceryCategory, GroceryItem[]> = {
    vegetables: [],
    fruits: [],
    dairy: [],
    grains: [],
    pulses: [],
    spices: [],
    meat: [],
    packaged: [],
    other: [],
  }

  items.forEach((item) => {
    grouped[item.category].push(item)
  })

  return grouped
}

/**
 * Calculate grocery list totals
 */
export function calculateGroceryTotals(items: GroceryItem[]): {
  totalItems: number
  verifiedPriceCount: number
  estimatedTotal: number
} {
  const totalItems = items.length
  const verifiedPriceCount = items.filter((item) => item.estimated_price !== undefined).length
  const estimatedTotal = items.reduce((sum, item) => sum + (item.estimated_price || 0), 0)

  return {
    totalItems,
    verifiedPriceCount,
    estimatedTotal,
  }
}

/**
 * Mark item as purchased
 */
export function markItemPurchased(item: GroceryItem, purchased: boolean): GroceryItem {
  return { ...item, is_purchased: purchased }
}

/**
 * Get unpurchased items for shopping list
 */
export function getUnpurchasedItems(items: GroceryItem[]): GroceryItem[] {
  return items.filter((item) => !item.is_purchased)
}
