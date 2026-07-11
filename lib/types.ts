// Meal Plan Types
export type DietaryPreference = 'omnivore' | 'vegetarian' | 'vegan' | 'keto' | 'paleo' | 'gluten-free'

export type Cuisine = 'italian' | 'asian' | 'mexican' | 'american' | 'mediterranean' | 'indian'

export type MealType = 'breakfast' | 'lunch' | 'dinner'

export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'CAD' | 'AUD' | 'INR'

export type GroceryCategory = 
  | 'vegetables'
  | 'fruits'
  | 'dairy'
  | 'grains'
  | 'pulses'
  | 'spices'
  | 'meat'
  | 'packaged'
  | 'other'

export type BudgetStatus = 'within' | 'close' | 'over' | 'unverified'

// Request Models
export interface MealPlanRequest {
  households_size: number
  planning_days: number
  total_budget: number
  currency: CurrencyCode
  dietary_preference: DietaryPreference
  allergies: string[]
  avoid_ingredients: string[]
  preferred_cuisines: Cuisine[]
  available_ingredients: string[]
  calorie_preference?: number
  prep_time_preference?: number
}

// GenAI Response Models
export interface GeneratedIngredient {
  name: string
  quantity: number
  unit: string
  estimated_cost?: number
  allergens?: string[]
}

export interface GeneratedMeal {
  name: string
  meal_type: MealType
  ingredients: GeneratedIngredient[]
  servings: number
  prep_time_minutes: number
  instructions: string
  dietary_tags: string[]
  allergen_info: string[]
  estimated_cost: number
  suggested_substitutions: Substitution[]
}

export interface GeneratedMealDay {
  day_number: number
  breakfast: GeneratedMeal
  lunch: GeneratedMeal
  dinner: GeneratedMeal
}

export interface GeneratedMealPlan {
  days: GeneratedMealDay[]
  total_estimated_cost: number
  validation_notes?: string[]
}

// Processed Models
export interface GroceryItem {
  id: string
  name: string
  quantity: number
  unit: string
  category: GroceryCategory
  estimated_price?: number
  is_purchased: boolean
  notes?: string
}

export interface Substitution {
  original_ingredient: string
  replacement_ingredient: string
  reason: string
  cost_impact: 'lower' | 'similar' | 'higher'
  affects_dietary?: boolean
  affects_allergens?: boolean
}

export interface BudgetSummary {
  total_budget: number
  estimated_grocery_cost: number
  cost_of_available_ingredients: number
  remaining_budget: number
  status: BudgetStatus
  expensive_items: Array<{ name: string; cost: number }>
  price_verification_status: 'verified' | 'estimated' | 'unverified'
}

export interface MealPlanResponse {
  id: string
  created_at: string
  user_preferences: MealPlanRequest
  meal_plan: GeneratedMealPlan
  grocery_list: GroceryItem[]
  budget_summary: BudgetSummary
  substitutions: Substitution[]
  validation_passed: boolean
  generation_timestamp: string
}

// Validation Response
export interface ValidationResult {
  valid: boolean
  errors: string[]
  warnings: string[]
}
