import { GoogleGenerativeAI } from '@google/generative-ai'
import { MealPlanRequest } from '../types'
import { GeneratedMealPlanSchema } from '../schemas'

let clientInstance: GoogleGenerativeAI | null = null

function getGeminiClient() {
  if (!clientInstance) {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    if (!apiKey) {
      throw new Error('GOOGLE_GENERATIVE_AI_API_KEY is not set')
    }
    clientInstance = new GoogleGenerativeAI(apiKey)
  }
  return clientInstance
}

export async function generateMealPlanWithGemini(preferences: MealPlanRequest) {
  const client = getGeminiClient()
  const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' })

  const prompt = buildMealPlanPrompt(preferences)

  try {
    const result = await model.generateContent(prompt)
    const responseText = result.response.text()

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = responseText.match(/```json\n?([\s\S]*?)\n?```/) || 
                      responseText.match(/\{[\s\S]*\}/)
    
    if (!jsonMatch) {
      throw new Error('No JSON found in AI response')
    }

    const jsonString = jsonMatch[1] || jsonMatch[0]
    const parsedResponse = JSON.parse(jsonString)

    // Validate against schema
    const validatedPlan = GeneratedMealPlanSchema.parse(parsedResponse)

    return validatedPlan
  } catch (error) {
    console.error('Gemini API error:', error)
    throw new Error(`Failed to generate meal plan: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

function buildMealPlanPrompt(preferences: MealPlanRequest): string {
  const { 
    households_size,
    planning_days,
    total_budget,
    currency,
    dietary_preference,
    allergies,
    avoid_ingredients,
    preferred_cuisines,
    available_ingredients,
    calorie_preference,
    prep_time_preference,
  } = preferences

  return `You are a professional meal planner. Generate a detailed meal plan in valid JSON format.

REQUIREMENTS:
- Generate exactly ${planning_days} days of meal plans
- Each day must have breakfast, lunch, and dinner
- Meals must serve ${households_size} people
- Total budget: ${total_budget} ${currency}
- Dietary preference: ${dietary_preference}
- Allergies to AVOID: ${allergies.join(', ') || 'None'}
- Ingredients to AVOID: ${avoid_ingredients.join(', ') || 'None'}
- Preferred cuisines: ${preferred_cuisines.join(', ')}
- Already available ingredients: ${available_ingredients.join(', ') || 'None'}
${calorie_preference ? `- Target calories per day: ${calorie_preference}` : ''}
${prep_time_preference ? `- Maximum prep time per meal: ${prep_time_preference} minutes` : ''}

IMPORTANT RULES:
1. NEVER include any ingredients from the allergies list
2. NEVER include any ingredients from the avoid_ingredients list
3. NEVER include ingredients that conflict with the dietary preference
4. All ingredients must be realistic and commonly available
5. Include realistic estimated costs for ingredients
6. Provide accurate preparation instructions
7. Include allergen warnings for common allergens

RESPONSE FORMAT - Return ONLY valid JSON (no markdown, no explanation):
{
  "days": [
    {
      "day_number": 1,
      "breakfast": {
        "name": "Oatmeal with berries",
        "meal_type": "breakfast",
        "ingredients": [
          {
            "name": "rolled oats",
            "quantity": 1,
            "unit": "cup",
            "estimated_cost": 0.50,
            "allergens": ["gluten"]
          }
        ],
        "servings": ${households_size},
        "prep_time_minutes": 10,
        "instructions": "Step-by-step cooking instructions",
        "dietary_tags": ["vegetarian", "high-protein"],
        "allergen_info": ["gluten", "tree nuts"],
        "estimated_cost": 3.50,
        "suggested_substitutions": [
          {
            "original_ingredient": "honey",
            "replacement_ingredient": "maple syrup",
            "reason": "Similar sweetness and texture",
            "cost_impact": "similar",
            "affects_dietary": false,
            "affects_allergens": false
          }
        ]
      },
      "lunch": { /* same structure */ },
      "dinner": { /* same structure */ }
    }
  ],
  "total_estimated_cost": 120.00,
  "validation_notes": ["All ingredients check for allergies", "Meals are budget-conscious"]
}

Generate the meal plan now:`;
}

// Test the API connection
export async function testGeminiConnection(): Promise<boolean> {
  try {
    const client = getGeminiClient()
    const model = client.getGenerativeModel({ model: 'gemini-2.0-flash' })
    const result = await model.generateContent('Say "ok"')
    return result.response.text().toLowerCase().includes('ok')
  } catch (error) {
    console.error('Gemini connection test failed:', error)
    return false
  }
}
