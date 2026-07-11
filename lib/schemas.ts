import { z } from 'zod'

// Input validation schemas
export const MealPlanRequestSchema = z.object({
  households_size: z.number().int().min(1, 'Household size must be at least 1').max(20, 'Household size cannot exceed 20'),
  planning_days: z.number().int().min(1, 'Must plan for at least 1 day').max(30, 'Cannot plan more than 30 days'),
  total_budget: z.number().positive('Budget must be greater than 0'),
  currency: z.enum(['USD', 'EUR', 'GBP', 'CAD', 'AUD', 'INR']),
  dietary_preference: z.enum(['omnivore', 'vegetarian', 'vegan', 'keto', 'paleo', 'gluten-free']),
  allergies: z.array(z.string().min(1)).max(10, 'Maximum 10 allergies'),
  avoid_ingredients: z.array(z.string().min(1)).max(20, 'Maximum 20 ingredients to avoid'),
  preferred_cuisines: z.array(z.enum(['italian', 'asian', 'mexican', 'american', 'mediterranean', 'indian'])).min(1).max(5),
  available_ingredients: z.array(z.string().min(1)).max(50, 'Maximum 50 available ingredients'),
  calorie_preference: z.number().int().min(800).max(5000).optional(),
  prep_time_preference: z.number().int().min(5).max(120).optional(),
})

// GenAI Response validation schemas
export const GeneratedIngredientSchema = z.object({
  name: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.string().min(1),
  estimated_cost: z.number().nonnegative().optional(),
  allergens: z.array(z.string()).optional(),
})

export const GeneratedMealSchema = z.object({
  name: z.string().min(1),
  meal_type: z.enum(['breakfast', 'lunch', 'dinner']),
  ingredients: z.array(GeneratedIngredientSchema).min(1),
  servings: z.number().int().min(1),
  prep_time_minutes: z.number().int().min(1),
  instructions: z.string().min(10),
  dietary_tags: z.array(z.string()),
  allergen_info: z.array(z.string()),
  estimated_cost: z.number().nonnegative(),
  suggested_substitutions: z.array(z.object({
    original_ingredient: z.string(),
    replacement_ingredient: z.string(),
    reason: z.string(),
    cost_impact: z.enum(['lower', 'similar', 'higher']),
    affects_dietary: z.boolean().optional(),
    affects_allergens: z.boolean().optional(),
  })).optional(),
})

export const GeneratedMealDaySchema = z.object({
  day_number: z.number().int().min(1),
  breakfast: GeneratedMealSchema,
  lunch: GeneratedMealSchema,
  dinner: GeneratedMealSchema,
})

export const GeneratedMealPlanSchema = z.object({
  days: z.array(GeneratedMealDaySchema).min(1),
  total_estimated_cost: z.number().nonnegative(),
  validation_notes: z.array(z.string()).optional(),
})

// Type exports
export type MealPlanRequest = z.infer<typeof MealPlanRequestSchema>
export type GeneratedMeal = z.infer<typeof GeneratedMealSchema>
export type GeneratedMealPlan = z.infer<typeof GeneratedMealPlanSchema>
