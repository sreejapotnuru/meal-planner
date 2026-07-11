import { MealIngredient } from '../types'

export interface SubstitutionSuggestion {
  original_ingredient: string
  suggested_replacement: string
  reason: string
  cost_impact: 'lower' | 'similar' | 'higher'
  estimated_cost_change?: number
  affects_allergens: boolean
  affects_dietary: boolean
  dietary_impact?: string
  allergen_impact?: string
  confidence_score: number
}

/**
 * Common allergen substitutions
 */
const ALLERGEN_SUBSTITUTIONS: Record<string, string[]> = {
  'dairy': ['coconut milk', 'almond milk', 'oat milk', 'cashew cream'],
  'nuts': ['seeds', 'legumes', 'tahini'],
  'gluten': ['rice', 'corn', 'quinoa', 'potatoes'],
  'eggs': ['applesauce', 'mashed banana', 'flax seeds', 'chia seeds'],
  'soy': ['coconut aminos', 'tamari'],
  'shellfish': ['fish', 'tofu', 'legumes'],
  'peanuts': ['tree nuts', 'seeds'],
}

/**
 * Common dietary restriction substitutions
 */
const DIETARY_SUBSTITUTIONS: Record<string, Record<string, string[]>> = {
  vegetarian: {
    'chicken': ['tofu', 'tempeh', 'seitan', 'chickpeas', 'lentils'],
    'beef': ['mushrooms', 'lentils', 'walnuts', 'beans'],
    'fish': ['tofu', 'seaweed', 'mushrooms'],
    'pork': ['tempeh', 'beans', 'lentils'],
  },
  vegan: {
    'chicken': ['tofu', 'tempeh', 'seitan', 'chickpeas', 'lentils'],
    'beef': ['mushrooms', 'lentils', 'walnuts', 'beans'],
    'fish': ['tofu', 'seaweed', 'mushrooms'],
    'pork': ['tempeh', 'beans', 'lentils'],
    'milk': ['coconut milk', 'almond milk', 'oat milk', 'cashew cream'],
    'cheese': ['nutritional yeast', 'cashew cheese', 'tofu'],
    'butter': ['coconut oil', 'olive oil', 'vegan butter'],
    'eggs': ['applesauce', 'mashed banana', 'flax seeds', 'chia seeds'],
  },
  'gluten-free': {
    'wheat flour': ['rice flour', 'almond flour', 'coconut flour'],
    'pasta': ['rice pasta', 'corn pasta', 'chickpea pasta'],
    'bread': ['gluten-free bread', 'rice cakes'],
  },
  'keto': {
    'rice': ['cauliflower rice', 'zucchini noodles'],
    'pasta': ['zucchini noodles', 'shirataki noodles'],
    'sugar': ['stevia', 'erythritol', 'monk fruit sweetener'],
    'flour': ['almond flour', 'coconut flour'],
  },
}

/**
 * Cost reference for common substitutions
 * Estimated relative costs: 1 = base, 0.5 = cheaper, 1.5 = more expensive
 */
const COST_MULTIPLIERS: Record<string, number> = {
  // Protein replacements
  'tofu': 0.8,
  'tempeh': 1.1,
  'seitan': 1.3,
  'lentils': 0.5,
  'chickpeas': 0.6,
  'beans': 0.5,

  // Dairy alternatives
  'coconut milk': 1.0,
  'almond milk': 1.1,
  'oat milk': 1.2,
  'cashew cream': 1.5,
  'nutritional yeast': 1.8,

  // Grain alternatives
  'rice flour': 0.9,
  'almond flour': 2.0,
  'coconut flour': 1.8,
  'rice pasta': 1.1,
  'corn pasta': 1.0,
  'chickpea pasta': 1.2,

  // Sweeteners
  'stevia': 1.3,
  'erythritol': 1.4,
  'monk fruit sweetener': 1.6,

  // Misc
  'cauliflower rice': 1.2,
  'zucchini noodles': 1.1,
  'shirataki noodles': 1.4,
}

/**
 * Generate substitution suggestions for a meal
 */
export function generateSubstitutions(
  ingredients: MealIngredient[],
  userAllergies: string[],
  userDietary: string[],
  userAvoidIngredients: string[]
): SubstitutionSuggestion[] {
  const suggestions: SubstitutionSuggestion[] = []

  for (const ingredient of ingredients) {
    const ingredientLower = ingredient.name.toLowerCase()

    // Check for allergen substitutions
    for (const allergen of userAllergies) {
      if (ingredientLower.includes(allergen.toLowerCase())) {
        const replacements = ALLERGEN_SUBSTITUTIONS[allergen.toLowerCase()] || []
        for (const replacement of replacements.slice(0, 2)) {
          suggestions.push({
            original_ingredient: ingredient.name,
            suggested_replacement: replacement,
            reason: `Contains ${allergen}, which is in your allergies list`,
            cost_impact: getCostImpact(ingredient.name, replacement),
            affects_allergens: true,
            affects_dietary: false,
            confidence_score: 0.95,
          })
        }
      }
    }

    // Check for dietary restriction substitutions
    for (const dietary of userDietary) {
      const dietaryLower = dietary.toLowerCase()
      const substitutionMap = DIETARY_SUBSTITUTIONS[dietaryLower]

      if (substitutionMap) {
        for (const [sourceIng, targets] of Object.entries(substitutionMap)) {
          if (ingredientLower.includes(sourceIng.toLowerCase())) {
            for (const replacement of targets.slice(0, 2)) {
              suggestions.push({
                original_ingredient: ingredient.name,
                suggested_replacement: replacement,
                reason: `Not suitable for ${dietary} diet`,
                cost_impact: getCostImpact(ingredient.name, replacement),
                affects_allergens: false,
                affects_dietary: true,
                dietary_impact: `Complies with ${dietary} requirements`,
                confidence_score: 0.90,
              })
            }
          }
        }
      }
    }

    // Check for user-avoided ingredients
    for (const avoided of userAvoidIngredients) {
      if (ingredientLower.includes(avoided.toLowerCase())) {
        // Find a generic alternative
        const alternatives = getGenericAlternative(ingredient.name)
        for (const alternative of alternatives.slice(0, 1)) {
          suggestions.push({
            original_ingredient: ingredient.name,
            suggested_replacement: alternative,
            reason: `You prefer to avoid ${avoided}`,
            cost_impact: 'similar',
            affects_allergens: false,
            affects_dietary: false,
            confidence_score: 0.85,
          })
        }
      }
    }
  }

  // Remove duplicates and return top suggestions
  const uniqueSuggestions = Array.from(
    new Map(
      suggestions.map(s => [
        `${s.original_ingredient}:${s.suggested_replacement}`,
        s,
      ])
    ).values()
  )

  return uniqueSuggestions.slice(0, 10)
}

/**
 * Determine cost impact of substitution
 */
function getCostImpact(original: string, replacement: string): 'lower' | 'similar' | 'higher' {
  const origMultiplier = COST_MULTIPLIERS[original.toLowerCase()] || 1
  const replMultiplier = COST_MULTIPLIERS[replacement.toLowerCase()] || 1

  const difference = replMultiplier - origMultiplier
  const percentChange = difference / origMultiplier

  if (percentChange < -0.2) return 'lower'
  if (percentChange > 0.2) return 'higher'
  return 'similar'
}

/**
 * Get generic alternatives for expensive ingredients
 */
function getGenericAlternative(ingredient: string): string[] {
  const lower = ingredient.toLowerCase()

  // Protein alternatives
  if (lower.includes('salmon') || lower.includes('fish'))
    return ['chicken', 'tofu', 'eggs']
  if (lower.includes('beef')) return ['chicken', 'pork', 'ground turkey']
  if (lower.includes('shrimp')) return ['chicken', 'fish', 'tofu']

  // Expensive vegetables
  if (lower.includes('asparagus')) return ['green beans', 'zucchini', 'broccoli']
  if (lower.includes('truffle')) return ['mushrooms', 'garlic']

  // Expensive fruits
  if (lower.includes('pomegranate')) return ['berries', 'grapes', 'apple']
  if (lower.includes('dragon fruit')) return ['mango', 'pineapple', 'papaya']

  // Expensive dairy
  if (lower.includes('mascarpone')) return ['ricotta', 'cream cheese', 'greek yogurt']
  if (lower.includes('burrata')) return ['mozzarella', 'feta', 'fresh cheese']

  return [ingredient]
}

/**
 * Validate that substitution doesn't violate restrictions
 */
export function validateSubstitutionSafety(
  substitution: SubstitutionSuggestion,
  userAllergies: string[],
  userDietary: string[],
  userAvoidIngredients: string[]
): boolean {
  const replacementLower = substitution.suggested_replacement.toLowerCase()

  // Check against allergies
  for (const allergen of userAllergies) {
    if (replacementLower.includes(allergen.toLowerCase())) {
      return false
    }
  }

  // Check against avoided ingredients
  for (const avoided of userAvoidIngredients) {
    if (replacementLower.includes(avoided.toLowerCase())) {
      return false
    }
  }

  // Check against dietary restrictions (basic check)
  if (userDietary.includes('vegetarian')) {
    if (
      replacementLower.includes('meat') ||
      replacementLower.includes('chicken') ||
      replacementLower.includes('beef')
    ) {
      return false
    }
  }

  if (userDietary.includes('vegan')) {
    if (
      replacementLower.includes('meat') ||
      replacementLower.includes('dairy') ||
      replacementLower.includes('egg') ||
      replacementLower.includes('honey')
    ) {
      return false
    }
  }

  return true
}

/**
 * Generate lower-cost substitution recommendations for over-budget plans
 */
export function generateLowerCostSubstitutions(
  ingredients: MealIngredient[],
  targetCostReduction: number,
  userAllergies: string[],
  userDietary: string[],
  userAvoidIngredients: string[]
): SubstitutionSuggestion[] {
  const suggestions = generateSubstitutions(
    ingredients,
    userAllergies,
    userDietary,
    userAvoidIngredients
  )

  // Filter for lower-cost suggestions only
  const lowerCost = suggestions
    .filter(s => s.cost_impact === 'lower')
    .filter(s => validateSubstitutionSafety(s, userAllergies, userDietary, userAvoidIngredients))
    .sort((a, b) => b.confidence_score - a.confidence_score)

  return lowerCost
}

/**
 * Estimate total savings from substitutions
 */
export function estimateSavings(
  substitutions: SubstitutionSuggestion[],
  unitPrice: number
): number {
  const totalSavings = substitutions
    .filter(s => s.cost_impact === 'lower')
    .reduce((sum, s) => {
      const multiplier = COST_MULTIPLIERS[s.suggested_replacement.toLowerCase()] || 1
      const originalMultiplier = COST_MULTIPLIERS[s.original_ingredient.toLowerCase()] || 1
      const savings = unitPrice * (originalMultiplier - multiplier)
      return sum + Math.max(0, savings)
    }, 0)

  return Math.round(totalSavings * 100) / 100
}
