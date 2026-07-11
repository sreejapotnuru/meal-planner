import { NextRequest, NextResponse } from 'next/server'
import { generateSubstitutions, validateSubstitutionSafety } from '@/lib/services/substitutions'
import { MealIngredient, MealPlanRequest } from '@/lib/types'

interface SubstitutionsRequest {
  ingredients: MealIngredient[]
  allergies?: string[]
  dietary_preferences?: string[]
  ingredients_to_avoid?: string[]
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body: SubstitutionsRequest = await request.json()

    // Validate request
    if (!Array.isArray(body.ingredients) || body.ingredients.length === 0) {
      return NextResponse.json(
        { error: 'Ingredients array is required and must not be empty' },
        { status: 400 }
      )
    }

    // Generate substitutions
    const substitutions = generateSubstitutions(
      body.ingredients,
      body.allergies || [],
      body.dietary_preferences || [],
      body.ingredients_to_avoid || []
    )

    // Validate each substitution
    const validatedSubstitutions = substitutions.filter(sub =>
      validateSubstitutionSafety(
        sub,
        body.allergies || [],
        body.dietary_preferences || [],
        body.ingredients_to_avoid || []
      )
    )

    return NextResponse.json({
      id: params.id,
      substitutions_count: validatedSubstitutions.length,
      substitutions: validatedSubstitutions,
      generated_at: new Date().toISOString(),
    })
  } catch (error) {
    console.error('Error generating substitutions:', error)
    return NextResponse.json(
      { error: 'Failed to generate substitutions' },
      { status: 500 }
    )
  }
}
