import { calculateBudgetFeasibility, calculateSubstitutionSavings } from '@/lib/services/budget'
import type { MealPlanRequest, GeneratedMealPlan, GroceryItem } from '@/lib/types'

describe('Budget Calculation', () => {
  const mockRequest: MealPlanRequest = {
    households_size: 2,
    planning_days: 3,
    total_budget: 100,
    currency: 'USD',
    dietary_preference: 'omnivore',
    allergies: [],
    avoid_ingredients: [],
    preferred_cuisines: ['italian'],
    available_ingredients: ['rice', 'oil'],
  }

  const mockMealPlan: GeneratedMealPlan = {
    days: [
      {
        day_number: 1,
        breakfast: {
          name: 'Eggs',
          meal_type: 'breakfast',
          ingredients: [{ name: 'egg', quantity: 2, unit: 'each' }],
          servings: 2,
          prep_time_minutes: 10,
          instructions: 'Fry eggs',
          dietary_tags: [],
          allergen_info: [],
          estimated_cost: 2,
        },
        lunch: {
          name: 'Chicken Salad',
          meal_type: 'lunch',
          ingredients: [
            { name: 'chicken', quantity: 200, unit: 'g' },
            { name: 'lettuce', quantity: 100, unit: 'g' },
          ],
          servings: 2,
          prep_time_minutes: 15,
          instructions: 'Mix salad',
          dietary_tags: [],
          allergen_info: [],
          estimated_cost: 8,
        },
        dinner: {
          name: 'Pasta',
          meal_type: 'dinner',
          ingredients: [
            { name: 'pasta', quantity: 300, unit: 'g' },
            { name: 'tomato sauce', quantity: 200, unit: 'ml' },
          ],
          servings: 2,
          prep_time_minutes: 20,
          instructions: 'Boil pasta',
          dietary_tags: [],
          allergen_info: [],
          estimated_cost: 6,
        },
      },
    ],
    total_estimated_cost: 16,
  }

  const mockGroceryItems: GroceryItem[] = [
    {
      id: '1',
      name: 'Chicken',
      quantity: 600,
      unit: 'g',
      category: 'meat',
      estimated_price: 24,
      is_purchased: false,
    },
    {
      id: '2',
      name: 'Lettuce',
      quantity: 300,
      unit: 'g',
      category: 'vegetables',
      estimated_price: 3,
      is_purchased: false,
    },
    {
      id: '3',
      name: 'Tomato Sauce',
      quantity: 600,
      unit: 'ml',
      category: 'packaged',
      estimated_price: 6,
      is_purchased: false,
    },
  ]

  test('should calculate budget within limits', () => {
    const summary = calculateBudgetFeasibility(mockRequest, mockMealPlan, mockGroceryItems)

    expect(summary.total_budget).toBe(100)
    expect(summary.status).toBe('within')
    expect(summary.remaining_budget).toBeGreaterThan(0)
  })

  test('should calculate over budget when costs exceed', () => {
    const expensiveItems: GroceryItem[] = [
      {
        id: '1',
        name: 'Expensive Meat',
        quantity: 1,
        unit: 'each',
        category: 'meat',
        estimated_price: 120,
        is_purchased: false,
      },
    ]

    const summary = calculateBudgetFeasibility(mockRequest, mockMealPlan, expensiveItems)

    expect(summary.status).toBe('over')
    expect(summary.remaining_budget).toBeLessThan(0)
  })

  test('should mark as unverified when no prices available', () => {
    const unpriced: GroceryItem[] = [
      {
        id: '1',
        name: 'Unknown Item',
        quantity: 1,
        unit: 'unit',
        category: 'other',
        is_purchased: false,
      },
    ]

    const summary = calculateBudgetFeasibility(mockRequest, mockMealPlan, unpriced)

    expect(summary.price_verification_status).toBe('unverified')
  })

  test('should calculate substitution savings', () => {
    const savings = calculateSubstitutionSavings(10, 'chicken', 'beans', 'lower')
    expect(savings).toBe(-2) // 20% savings

    const similar = calculateSubstitutionSavings(10, 'chicken', 'turkey', 'similar')
    expect(similar).toBe(0)

    const higher = calculateSubstitutionSavings(10, 'chicken', 'organic chicken', 'higher')
    expect(higher).toBe(1.5) // 15% increase
  })
})
