import { NextRequest, NextResponse } from 'next/server'
import { MealPlanRequestSchema } from '@/lib/schemas'
import { generateMealPlanWithGemini } from '@/lib/services/gemini'
import { validateMealPlan, logValidationFailure } from '@/lib/services/validation'
import { calculateBudgetFeasibility } from '@/lib/services/budget'
import { aggregateGroceryList } from '@/lib/services/grocery'
import { getSupabaseAdmin } from '@/lib/supabase'
import { v4 as uuidv4 } from 'uuid'
import type { MealPlanResponse } from '@/lib/types'

export async function POST(request: NextRequest) {
  const requestId = uuidv4()

  try {
    // Parse and validate request
    const body = await request.json()
    const validatedRequest = MealPlanRequestSchema.parse(body)

    console.log(`[${requestId}] Meal plan request received`, {
      households: validatedRequest.households_size,
      days: validatedRequest.planning_days,
      budget: validatedRequest.total_budget,
    })

    // Call Gemini API with validated request
    let mealPlan
    try {
      mealPlan = await generateMealPlanWithGemini(validatedRequest)
      console.log(`[${requestId}] Gemini API call succeeded`)
    } catch (error) {
      console.error(`[${requestId}] Gemini API call failed:`, error)
      return NextResponse.json(
        {
          error: 'We could not generate a verified meal plan at this time. Please retry.',
          details:
            process.env.NODE_ENV === 'development'
              ? (error instanceof Error ? error.message : 'Unknown error')
              : undefined,
        },
        { status: 503 },
      )
    }

    // Validate meal plan against request requirements
    const validationResult = validateMealPlan(validatedRequest, mealPlan)
    if (!validationResult.valid) {
      logValidationFailure(requestId, validationResult, {
        requestId,
        daysRequested: validatedRequest.planning_days,
        daysGenerated: mealPlan.days.length,
      })

      return NextResponse.json(
        {
          error: 'Generated meal plan failed validation. Please retry.',
          validationDetails:
            process.env.NODE_ENV === 'development' ? validationResult.errors : undefined,
        },
        { status: 400 },
      )
    }

    // Aggregate grocery list
    const groceryList = aggregateGroceryList(mealPlan, validatedRequest)
    console.log(`[${requestId}] Grocery list aggregated:`, { itemCount: groceryList.length })

    // Calculate budget feasibility
    const budgetSummary = calculateBudgetFeasibility(validatedRequest, mealPlan, groceryList)
    console.log(`[${requestId}] Budget calculated:`, {
      status: budgetSummary.status,
      estimatedCost: budgetSummary.estimated_grocery_cost,
    })

    // Prepare response
    const response: MealPlanResponse = {
      id: requestId,
      created_at: new Date().toISOString(),
      user_preferences: validatedRequest,
      meal_plan: mealPlan,
      grocery_list: groceryList,
      budget_summary: budgetSummary,
      substitutions: extractSubstitutions(mealPlan),
      validation_passed: validationResult.valid,
      generation_timestamp: new Date().toISOString(),
    }

    // Store in database
    try {
      const supabaseAdmin = getSupabaseAdmin()
      const { data, error } = await supabaseAdmin.from('meal_plans').insert([
        {
          id: response.id,
          user_preferences: validatedRequest,
          meal_plan: mealPlan,
          grocery_list: groceryList,
          budget_summary: budgetSummary,
          validation_passed: validationResult.valid,
          created_at: new Date().toISOString(),
        },
      ])

      if (error) {
        console.error(`[${requestId}] Database insert failed:`, error)
        // Don't fail the request, just log the error
      }
    } catch (dbError) {
      console.error(`[${requestId}] Database error:`, dbError)
      // Continue with response even if database fails
    }

    return NextResponse.json(response, { status: 200 })
  } catch (error) {
    if (error instanceof Error && error.message.includes('Validation failed')) {
      return NextResponse.json(
        {
          error: 'Invalid request format. Please check your input.',
          details:
            process.env.NODE_ENV === 'development' ? error.message : undefined,
        },
        { status: 400 },
      )
    }

    console.error(`[${requestId}] Unexpected error:`, error)
    return NextResponse.json(
      {
        error: 'An unexpected error occurred. Please try again.',
      },
      { status: 500 },
    )
  }
}

/**
 * Extract substitutions from meal plan
 */
function extractSubstitutions(mealPlan: any) {
  const substitutions: any[] = []

  mealPlan.days?.forEach((day: any) => {
    const meals = [day.breakfast, day.lunch, day.dinner].filter(Boolean)
    meals.forEach((meal: any) => {
      meal.suggested_substitutions?.forEach((sub: any) => {
        substitutions.push(sub)
      })
    })
  })

  return substitutions
}

// Health check endpoint
export async function GET() {
  return NextResponse.json({ status: 'ok', service: 'meal-plan-generator' }, { status: 200 })
}
