import { MealPlanRequest, GeneratedMealPlan, ValidationResult } from '../types'

/**
 * Validate that the generated meal plan meets all requirements
 */
export function validateMealPlan(
  request: MealPlanRequest,
  mealPlan: GeneratedMealPlan,
): ValidationResult {
  const errors: string[] = []
  const warnings: string[] = []

  // Check day count
  if (mealPlan.days.length !== request.planning_days) {
    errors.push(`Expected ${request.planning_days} days, but got ${mealPlan.days.length}`)
  }

  // Check each day
  mealPlan.days.forEach((day, index) => {
    if (!day.breakfast) {
      errors.push(`Day ${index + 1} is missing breakfast`)
    }
    if (!day.lunch) {
      errors.push(`Day ${index + 1} is missing lunch`)
    }
    if (!day.dinner) {
      errors.push(`Day ${index + 1} is missing dinner`)
    }

    // Check each meal for restricted ingredients
    const meals = [day.breakfast, day.lunch, day.dinner].filter(Boolean)
    meals.forEach((meal) => {
      if (!meal) return

      meal.ingredients?.forEach((ingredient) => {
        const ingredientLower = ingredient.name.toLowerCase()
        
        // Check allergies
        const hasAllergen = request.allergies.some(
          (allergy) => ingredientLower.includes(allergy.toLowerCase())
        )
        if (hasAllergen) {
          errors.push(
            `Day ${index + 1} ${meal.meal_type} contains "${ingredient.name}" which conflicts with allergen "${
              request.allergies.find((a) => ingredientLower.includes(a.toLowerCase()))
            }"`
          )
        }

        // Check avoided ingredients
        const isAvoided = request.avoid_ingredients.some(
          (avoid) => ingredientLower.includes(avoid.toLowerCase())
        )
        if (isAvoided) {
          errors.push(
            `Day ${index + 1} ${meal.meal_type} contains "${ingredient.name}" which is in the avoid list`
          )
        }
      })

      // Check dietary restrictions
      if (request.dietary_preference === 'vegetarian') {
        const hasNonVegetarianMeat = ['beef', 'chicken', 'fish', 'pork', 'seafood', 'meat'].some((meat) =>
          meal.ingredients?.some((i) => i.name.toLowerCase().includes(meat))
        )
        if (hasNonVegetarianMeat && !meal.dietary_tags?.includes('vegetarian')) {
          warnings.push(`Day ${index + 1} ${meal.meal_type} may not be vegetarian`)
        }
      }

      if (request.dietary_preference === 'vegan') {
        const hasAnimalProducts = ['milk', 'cheese', 'butter', 'egg', 'honey', 'dairy'].some((product) =>
          meal.ingredients?.some((i) => i.name.toLowerCase().includes(product))
        )
        if (hasAnimalProducts && !meal.dietary_tags?.includes('vegan')) {
          warnings.push(`Day ${index + 1} ${meal.meal_type} may not be vegan`)
        }
      }

      // Check cost is reasonable
      if (meal.estimated_cost > request.total_budget / request.planning_days * 1.5) {
        warnings.push(
          `Day ${index + 1} ${meal.meal_type} (${meal.name}) costs $${meal.estimated_cost.toFixed(2)}, which is high for the budget`
        )
      }
    })
  })

  // Check total cost vs budget
  if (mealPlan.total_estimated_cost > request.total_budget * 1.2) {
    errors.push(
      `Total meal plan cost ($${mealPlan.total_estimated_cost.toFixed(2)}) significantly exceeds budget ($${request.total_budget.toFixed(2)})`
    )
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  }
}

/**
 * Check if a specific ingredient contains an allergen
 */
export function ingredientContainsAllergen(
  ingredientName: string,
  allergens: string[] | undefined,
): boolean {
  if (!allergens || allergens.length === 0) return false

  const ingredientLower = ingredientName.toLowerCase()
  return allergens.some((allergen) => ingredientLower.includes(allergen.toLowerCase()))
}

/**
 * Check if meal violates dietary preferences
 */
export function mealViolatesDietaryPreference(
  mealName: string,
  ingredients: Array<{ name: string }>,
  dietaryPreference: string,
): boolean {
  const ingredientsLower = ingredients.map((i) => i.name.toLowerCase()).join(' ')

  switch (dietaryPreference) {
    case 'vegetarian':
      return ['beef', 'chicken', 'fish', 'pork', 'meat', 'seafood'].some((meat) =>
        ingredientsLower.includes(meat)
      )
    case 'vegan':
      return [
        'beef',
        'chicken',
        'fish',
        'pork',
        'meat',
        'seafood',
        'milk',
        'cheese',
        'butter',
        'egg',
        'honey',
      ].some((item) => ingredientsLower.includes(item))
    case 'keto':
      return ['bread', 'pasta', 'rice', 'sugar', 'grain', 'cereal'].some((carb) =>
        ingredientsLower.includes(carb)
      )
    case 'gluten-free':
      return ['wheat', 'gluten', 'bread', 'pasta', 'cereal'].some((gluten) =>
        ingredientsLower.includes(gluten)
      )
    default:
      return false
  }
}

/**
 * Log validation failure without exposing sensitive data
 */
export function logValidationFailure(
  requestId: string,
  validationResult: ValidationResult,
  metadata?: Record<string, unknown>,
) {
  const safeLog = {
    requestId,
    timestamp: new Date().toISOString(),
    errorCount: validationResult.errors.length,
    warningCount: validationResult.warnings.length,
    errors: validationResult.errors,
    metadata: metadata ? sanitizeMetadata(metadata) : undefined,
  }

  console.error('[VALIDATION_FAILURE]', JSON.stringify(safeLog))
}

/**
 * Remove sensitive data from logs
 */
function sanitizeMetadata(metadata: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...metadata }
  
  // Remove common sensitive fields
  const sensitiveKeys = ['password', 'token', 'secret', 'apiKey', 'api_key', 'email', 'address']
  sensitiveKeys.forEach((key) => {
    if (key in sanitized) {
      delete sanitized[key]
    }
  })

  return sanitized
}
