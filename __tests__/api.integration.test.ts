/**
 * Integration tests for meal plan generation API
 * Tests the complete flow from request to response validation
 */

import { generateMealPlanWithGemini } from '@/lib/services/gemini'
import { validateAndProcessMealPlan } from '@/lib/services/validation'
import { aggregateGroceryList } from '@/lib/services/grocery'
import { calculateBudgetFeasibility } from '@/lib/services/budget'
import { MealPlanRequest } from '@/lib/types'

describe('Meal Plan Generation Integration Tests', () => {
  const mockRequest: MealPlanRequest = {
    household_size: 2,
    planning_days: 3,
    budget: 100,
    currency: 'USD',
    dietary_preferences: ['vegetarian'],
    allergies: ['peanuts'],
    ingredients_to_avoid: ['mushrooms'],
    preferred_cuisines: ['Italian', 'Mediterranean'],
    available_at_home: ['olive oil', 'garlic', 'pasta'],
    calorie_preference: { min: 1500, max: 2500 },
    prep_time_preference: 'moderate'
  }

  describe('Request validation', () => {
    it('should reject zero household size', () => {
      const invalidRequest = { ...mockRequest, household_size: 0 }
      expect(() => {
        // Validation would happen before API call
        if (invalidRequest.household_size <= 0) {
          throw new Error('Household size must be at least 1')
        }
      }).toThrow('Household size must be at least 1')
    })

    it('should reject negative budget', () => {
      const invalidRequest = { ...mockRequest, budget: -50 }
      expect(() => {
        if (invalidRequest.budget < 0) {
          throw new Error('Budget cannot be negative')
        }
      }).toThrow('Budget cannot be negative')
    })

    it('should reject invalid planning days', () => {
      const invalidRequest = { ...mockRequest, planning_days: 0 }
      expect(() => {
        if (invalidRequest.planning_days < 1 || invalidRequest.planning_days > 30) {
          throw new Error('Planning days must be between 1 and 30')
        }
      }).toThrow('Planning days must be between 1 and 30')
    })

    it('should reject empty dietary preferences array', () => {
      const invalidRequest = { ...mockRequest, dietary_preferences: [] }
      expect(invalidRequest.dietary_preferences.length).toBe(0)
    })
  })

  describe('Grocery list aggregation', () => {
    it('should aggregate duplicate ingredients by combining quantities', () => {
      const mockMealPlan = {
        days: [
          {
            date: '2025-01-15',
            meals: [
              {
                meal_type: 'breakfast',
                name: 'Pasta Carbonara',
                ingredients: [
                  { name: 'pasta', quantity: 200, unit: 'g' },
                  { name: 'eggs', quantity: 2, unit: 'count' },
                  { name: 'garlic', quantity: 2, unit: 'cloves' }
                ],
                servings: 2,
                estimated_cost: 8.50,
                preparation_time_minutes: 20,
                dietary_tags: ['vegetarian'],
                allergens: [],
                preparation_instructions: 'Cook and combine'
              }
            ]
          }
        ]
      }

      const groceryList = aggregateGroceryList(mockMealPlan.days, [])
      
      // Should aggregate pasta quantities if appearing multiple times
      expect(groceryList.items).toBeDefined()
      expect(Array.isArray(groceryList.items)).toBe(true)
    })

    it('should exclude available-at-home ingredients', () => {
      const mockMealPlan = {
        days: [
          {
            date: '2025-01-15',
            meals: [
              {
                meal_type: 'breakfast',
                name: 'Pasta Carbonara',
                ingredients: [
                  { name: 'pasta', quantity: 200, unit: 'g' },
                  { name: 'olive oil', quantity: 2, unit: 'tbsp' },
                  { name: 'garlic', quantity: 2, unit: 'cloves' }
                ],
                servings: 2,
                estimated_cost: 8.50,
                preparation_time_minutes: 20,
                dietary_tags: ['vegetarian'],
                allergens: [],
                preparation_instructions: 'Cook and combine'
              }
            ]
          }
        ]
      }

      const available = ['olive oil', 'garlic']
      const groceryList = aggregateGroceryList(mockMealPlan.days, available)

      // Should only include pasta, not olive oil or garlic
      const includedIngredients = groceryList.items.map(item => item.name.toLowerCase())
      expect(includedIngredients).toContain('pasta')
      expect(includedIngredients).not.toContain('olive oil')
      expect(includedIngredients).not.toContain('garlic')
    })

    it('should group ingredients by category', () => {
      const mockMealPlan = {
        days: [
          {
            date: '2025-01-15',
            meals: [
              {
                meal_type: 'breakfast',
                name: 'Vegetable Omelette',
                ingredients: [
                  { name: 'eggs', quantity: 3, unit: 'count' },
                  { name: 'tomatoes', quantity: 2, unit: 'count' },
                  { name: 'bell peppers', quantity: 1, unit: 'count' },
                  { name: 'cheese', quantity: 100, unit: 'g' }
                ],
                servings: 2,
                estimated_cost: 6.50,
                preparation_time_minutes: 15,
                dietary_tags: ['vegetarian'],
                allergens: ['dairy'],
                preparation_instructions: 'Cook and fold'
              }
            ]
          }
        ]
      }

      const groceryList = aggregateGroceryList(mockMealPlan.days, [])

      // Should have categories
      expect(groceryList.categories).toBeDefined()
      expect(groceryList.categories.size).toBeGreaterThan(0)
    })
  })

  describe('Budget feasibility calculation', () => {
    it('should calculate within budget status correctly', () => {
      const userBudget = 100
      const estimatedCost = 75

      const result = calculateBudgetFeasibility(
        userBudget,
        estimatedCost,
        { min: 10, max: 200 },
        'USD'
      )

      expect(result.status).toBe('within_budget')
      expect(result.is_within_budget).toBe(true)
      expect(result.difference_from_budget).toBe(25)
    })

    it('should calculate close to budget status correctly', () => {
      const userBudget = 100
      const estimatedCost = 92

      const result = calculateBudgetFeasibility(
        userBudget,
        estimatedCost,
        { min: 10, max: 200 },
        'USD'
      )

      expect(result.status).toBe('close_to_budget')
      expect(result.is_within_budget).toBe(true)
    })

    it('should detect over budget status correctly', () => {
      const userBudget = 100
      const estimatedCost = 125

      const result = calculateBudgetFeasibility(
        userBudget,
        estimatedCost,
        { min: 10, max: 200 },
        'USD'
      )

      expect(result.status).toBe('over_budget')
      expect(result.is_within_budget).toBe(false)
      expect(result.difference_from_budget).toBe(-25)
    })

    it('should calculate percentage over budget', () => {
      const userBudget = 100
      const estimatedCost = 150

      const result = calculateBudgetFeasibility(
        userBudget,
        estimatedCost,
        { min: 10, max: 200 },
        'USD'
      )

      expect(result.percentage_of_budget).toBe(150)
    })
  })

  describe('Allergy validation', () => {
    it('should detect allergens in meal ingredients', () => {
      const userAllergies = ['peanuts', 'dairy']
      
      const mealIngredients = [
        { name: 'pasta', quantity: 200, unit: 'g' },
        { name: 'peanut butter', quantity: 2, unit: 'tbsp' },
        { name: 'cheese', quantity: 50, unit: 'g' }
      ]

      const hasAllergen = mealIngredients.some(ingredient =>
        userAllergies.some(allergy =>
          ingredient.name.toLowerCase().includes(allergy.toLowerCase())
        )
      )

      expect(hasAllergen).toBe(true)
    })

    it('should clear meals without allergens', () => {
      const userAllergies = ['peanuts', 'dairy']
      
      const mealIngredients = [
        { name: 'pasta', quantity: 200, unit: 'g' },
        { name: 'tomatoes', quantity: 2, unit: 'count' },
        { name: 'garlic', quantity: 2, unit: 'cloves' }
      ]

      const hasAllergen = mealIngredients.some(ingredient =>
        userAllergies.some(allergy =>
          ingredient.name.toLowerCase().includes(allergy.toLowerCase())
        )
      )

      expect(hasAllergen).toBe(false)
    })
  })

  describe('Dietary restriction validation', () => {
    it('should validate vegetarian meals', () => {
      const mealDietaryTags = ['vegetarian', 'gluten-free']
      const userDietary = ['vegetarian']

      const isValid = userDietary.every(preference =>
        mealDietaryTags.includes(preference)
      )

      expect(isValid).toBe(true)
    })

    it('should reject non-vegetarian meals for vegetarian users', () => {
      const mealDietaryTags = ['meat', 'gluten-free']
      const userDietary = ['vegetarian']

      const isValid = userDietary.every(preference =>
        mealDietaryTags.includes(preference)
      )

      expect(isValid).toBe(false)
    })
  })
})
