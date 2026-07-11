'use client'

import { MealPlanResponse } from '@/lib/types'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Clock, Users, DollarSign } from 'lucide-react'

interface MealPlanDisplayProps {
  mealPlan: MealPlanResponse
}

export function MealPlanDisplay({ mealPlan }: MealPlanDisplayProps) {
  const budget = mealPlan.budget_summary

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Budget Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Budget Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Budget</p>
              <p className="text-2xl font-bold text-foreground">
                {budget.total_budget.toFixed(2)} {mealPlan.user_preferences.currency}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Estimated Cost</p>
              <p className="text-2xl font-bold text-foreground">
                {budget.estimated_grocery_cost.toFixed(2)} {mealPlan.user_preferences.currency}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Remaining</p>
              <p className={`text-2xl font-bold ${budget.remaining_budget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {budget.remaining_budget.toFixed(2)} {mealPlan.user_preferences.currency}
              </p>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold text-white ${
                budget.status === 'within' ? 'bg-green-600' :
                budget.status === 'close' ? 'bg-yellow-600' :
                budget.status === 'over' ? 'bg-red-600' :
                'bg-gray-600'
              }`}>
                {budget.status === 'within' ? 'Within Budget' :
                 budget.status === 'close' ? 'Close to Budget' :
                 budget.status === 'over' ? 'Over Budget' :
                 'Unverified'}
              </div>
            </div>
          </div>

          {budget.expensive_items.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <p className="text-sm font-medium text-muted-foreground mb-2">Most Expensive Items</p>
              <div className="space-y-1">
                {budget.expensive_items.map((item, i) => (
                  <div key={i} className="flex justify-between text-sm">
                    <span>{item.name}</span>
                    <span className="font-medium">${item.cost.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              {budget.price_verification_status === 'unverified' 
                ? '⚠️ Accurate local pricing is currently unavailable. Budget feasibility could not be fully verified.'
                : budget.price_verification_status === 'estimated'
                ? 'ℹ️ Prices are estimated based on typical market rates.'
                : '✓ Prices are based on verified data.'}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Meal Plan by Days */}
      <div className="space-y-6">
        <h2 className="text-3xl font-bold text-foreground">Your Meal Plan</h2>
        
        {mealPlan.meal_plan.days.map((day) => (
          <div key={day.day_number} className="space-y-4">
            <h3 className="text-2xl font-bold text-primary">Day {day.day_number}</h3>
            
            <div className="grid md:grid-cols-3 gap-4">
              {/* Breakfast */}
              <MealCard meal={day.breakfast} currency={mealPlan.user_preferences.currency} />
              
              {/* Lunch */}
              <MealCard meal={day.lunch} currency={mealPlan.user_preferences.currency} />
              
              {/* Dinner */}
              <MealCard meal={day.dinner} currency={mealPlan.user_preferences.currency} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface MealCardProps {
  meal: any
  currency: string
}

function MealCard({ meal, currency }: MealCardProps) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle className="text-lg">{meal.name}</CardTitle>
          <p className="text-xs text-muted-foreground uppercase mt-1">
            {meal.meal_type}
          </p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Key Info */}
        <div className="flex flex-wrap gap-3 text-sm">
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{meal.servings} servings</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span>{meal.prep_time_minutes}m</span>
          </div>
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-muted-foreground" />
            <span>${meal.estimated_cost.toFixed(2)}</span>
          </div>
        </div>

        {/* Ingredients */}
        <div>
          <p className="font-medium text-sm mb-2">Ingredients</p>
          <ul className="space-y-1 text-sm">
            {meal.ingredients.map((ing: any, idx: number) => (
              <li key={idx} className="text-muted-foreground">
                • {ing.quantity} {ing.unit} {ing.name}
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions */}
        <div>
          <p className="font-medium text-sm mb-2">Instructions</p>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {meal.instructions}
          </p>
        </div>

        {/* Tags */}
        {(meal.dietary_tags?.length > 0 || meal.allergen_info?.length > 0) && (
          <div className="pt-2 border-t border-border">
            <div className="flex flex-wrap gap-1">
              {meal.dietary_tags?.map((tag: string, idx: number) => (
                <span key={idx} className="px-2 py-1 bg-secondary/20 text-secondary-foreground text-xs rounded">
                  {tag}
                </span>
              ))}
              {meal.allergen_info?.map((allergen: string, idx: number) => (
                <span key={idx} className="px-2 py-1 bg-destructive/20 text-destructive text-xs rounded">
                  ⚠️ {allergen}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
