'use client'

import { useState } from 'react'
import { MealPreferenceForm } from '@/components/meal-preference-form'
import { MealPlanDisplay } from '@/components/meal-plan-display'
import { GroceryListDisplay } from '@/components/grocery-list-display'
import { MealPlanRequest, MealPlanResponse } from '@/lib/types'

export default function Page() {
  const [mealPlan, setMealPlan] = useState<MealPlanResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'form' | 'meals' | 'grocery'>('form')

  const handleSubmit = async (data: MealPlanRequest) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/meal-plans/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to generate meal plan')
      }

      const result = await response.json()
      setMealPlan(result)
      setActiveTab('meals')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <h1 className="text-4xl font-bold text-primary">🍽️ Meal Planner</h1>
          <p className="text-muted-foreground mt-2">
            Create personalized meal plans within your budget
          </p>
        </div>
      </header>

      {/* Navigation Tabs */}
      {mealPlan && (
        <div className="border-b border-border bg-card">
          <div className="max-w-6xl mx-auto px-4 flex gap-4">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'form'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Preferences
            </button>
            <button
              onClick={() => setActiveTab('meals')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'meals'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Meal Plan
            </button>
            <button
              onClick={() => setActiveTab('grocery')}
              className={`px-4 py-3 border-b-2 font-medium transition-colors ${
                activeTab === 'grocery'
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Shopping List
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6">
            <p className="text-destructive font-medium">Error</p>
            <p className="text-destructive/80 text-sm mt-1">{error}</p>
          </div>
        )}

        {activeTab === 'form' && (
          <div>
            <MealPreferenceForm onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        )}

        {activeTab === 'meals' && mealPlan && (
          <div>
            <MealPlanDisplay mealPlan={mealPlan} />
          </div>
        )}

        {activeTab === 'grocery' && mealPlan && (
          <div>
            <GroceryListDisplay
              groceryItems={mealPlan.grocery_list}
              currency={mealPlan.user_preferences.currency}
            />
          </div>
        )}
      </div>
    </main>
  )
}
