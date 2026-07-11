import { MealPlanRequest, GeneratedMealPlan, BudgetSummary, BudgetStatus, GroceryItem } from '../types'
import { REFERENCE_PRICES } from './pricing'

/**
 * Calculate budget feasibility based on deterministic logic
 * Formula: total_budget - cost_of_available_ingredients = available_for_purchase
 * Then compare available_for_purchase with grocery_cost
 */
export function calculateBudgetFeasibility(
  request: MealPlanRequest,
  mealPlan: GeneratedMealPlan,
  groceryItems: GroceryItem[],
): BudgetSummary {
  // Calculate cost of ingredients already available at home
  const costOfAvailableIngredients = calculateAvailableIngredientsCost(request.available_ingredients)

  // Calculate estimated grocery cost from meal plan
  const estimatedGroceryCost = calculateGroceryListCost(groceryItems)

  // Determine if prices are verified
  const hasVerifiedPrices = groceryItems.some((item) => item.estimated_price !== undefined && item.estimated_price > 0)
  const priceVerificationStatus: 'verified' | 'estimated' | 'unverified' = hasVerifiedPrices
    ? 'estimated'
    : 'unverified'

  // Calculate remaining budget
  const budgetForGroceries = request.total_budget - costOfAvailableIngredients
  const remainingBudget = budgetForGroceries - estimatedGroceryCost

  // Determine budget status
  let status: BudgetStatus = 'within'
  if (priceVerificationStatus === 'unverified') {
    status = 'unverified'
  } else if (remainingBudget < 0) {
    status = 'over'
  } else if (remainingBudget < budgetForGroceries * 0.1) {
    // Less than 10% of budget remaining
    status = 'close'
  }

  // Find most expensive items
  const expensiveItems = groceryItems
    .filter((item) => item.estimated_price && item.estimated_price > 0)
    .sort((a, b) => (b.estimated_price || 0) - (a.estimated_price || 0))
    .slice(0, 5)
    .map((item) => ({
      name: item.name,
      cost: item.estimated_price || 0,
    }))

  return {
    total_budget: request.total_budget,
    estimated_grocery_cost: Math.max(0, estimatedGroceryCost),
    cost_of_available_ingredients: costOfAvailableIngredients,
    remaining_budget: Math.max(0, remainingBudget),
    status,
    expensive_items: expensiveItems,
    price_verification_status: priceVerificationStatus,
  }
}

/**
 * Calculate the cost of ingredients already available at home
 */
function calculateAvailableIngredientsCost(availableIngredients: string[]): number {
  // Use reference prices for available ingredients
  // This assumes pantry staples and basic items
  const baseStaplePrice = 1.5 // Average price per available ingredient

  return availableIngredients.length * baseStaplePrice
}

/**
 * Calculate total cost of grocery items
 */
function calculateGroceryListCost(groceryItems: GroceryItem[]): number {
  return groceryItems.reduce((total, item) => {
    const itemCost = item.estimated_price || 0
    return total + itemCost
  }, 0)
}

/**
 * Estimate price for an ingredient based on reference data
 */
export function estimateIngredientPrice(
  name: string,
  quantity: number,
  unit: string,
): { price: number; verified: boolean } {
  const nameLower = name.toLowerCase()

  // First, check reference prices
  const referencePrice = REFERENCE_PRICES[nameLower]
  if (referencePrice) {
    return {
      price: convertPrice(quantity, unit, referencePrice.pricePerUnit, referencePrice.unit),
      verified: true,
    }
  }

  // If not found in reference, provide estimation
  const estimatedPrice = estimatePriceByCategory(name, quantity, unit)
  return {
    price: estimatedPrice,
    verified: false,
  }
}

/**
 * Convert price based on unit conversion
 */
function convertPrice(quantity: number, fromUnit: string, pricePerUnit: number, priceUnit: string): number {
  const unitConversions: Record<string, number> = {
    'g': 1,
    'oz': 28.35,
    'kg': 1000,
    'lb': 453.6,
    'ml': 1,
    'cup': 240,
    'tbsp': 15,
    'tsp': 5,
    'l': 1000,
  }

  const fromGrams = (unitConversions[fromUnit.toLowerCase()] || 1) * quantity
  const priceUnitGrams = unitConversions[priceUnit.toLowerCase()] || 1
  const normalizedQuantity = fromGrams / priceUnitGrams

  return normalizedQuantity * pricePerUnit
}

/**
 * Estimate price by category when reference data is unavailable
 */
function estimatePriceByCategory(name: string, quantity: number, unit: string): number {
  const nameLower = name.toLowerCase()

  // Category-based estimation
  if (nameLower.includes('vegetable') || nameLower.includes('broccoli') || nameLower.includes('carrot')) {
    return quantity * 0.5 // $0.50 per unit
  }
  if (nameLower.includes('fruit') || nameLower.includes('apple') || nameLower.includes('banana')) {
    return quantity * 0.6
  }
  if (nameLower.includes('meat') || nameLower.includes('chicken') || nameLower.includes('beef')) {
    return quantity * 3.0 // $3.00 per unit
  }
  if (nameLower.includes('dairy') || nameLower.includes('milk') || nameLower.includes('cheese')) {
    return quantity * 1.5
  }
  if (nameLower.includes('grain') || nameLower.includes('rice') || nameLower.includes('pasta')) {
    return quantity * 0.3
  }
  if (nameLower.includes('spice') || nameLower.includes('salt')) {
    return quantity * 0.1
  }

  // Default estimation
  return quantity * 1.0
}

/**
 * Calculate savings potential with substitutions
 */
export function calculateSubstitutionSavings(
  originalCost: number,
  originalIngredient: string,
  replacementIngredient: string,
  costImpact: string,
): number {
  const costImpactMap: Record<string, number> = {
    lower: -0.2, // 20% savings
    similar: 0,
    higher: 0.15, // 15% increase
  }

  const impactMultiplier = costImpactMap[costImpact] || 0
  return originalCost * impactMultiplier
}
