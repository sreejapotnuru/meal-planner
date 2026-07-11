'use client'

import { useState } from 'react'
import { useForm, Controller } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import type { MealPlanRequest } from '@/lib/types'

interface FormProps {
  onSubmit: (data: MealPlanRequest) => Promise<void>
  isLoading?: boolean
}

export function MealPreferenceForm({ onSubmit, isLoading }: FormProps) {
  const { control, handleSubmit, formState: { errors }, watch } = useForm<MealPlanRequest>({
    defaultValues: {
      households_size: 2,
      planning_days: 3,
      total_budget: 100,
      currency: 'USD',
      dietary_preference: 'omnivore',
      allergies: [],
      avoid_ingredients: [],
      preferred_cuisines: ['italian'],
      available_ingredients: [],
    },
  })

  const [allergyInput, setAllergyInput] = useState('')
  const [avoidInput, setAvoidInput] = useState('')
  const [availableInput, setAvailableInput] = useState('')
  const allergies = watch('allergies')
  const avoid = watch('avoid_ingredients')
  const available = watch('available_ingredients')
  const cuisines = watch('preferred_cuisines')

  const addAllergy = () => {
    if (allergyInput.trim() && allergies.length < 10) {
      control._formValues.allergies = [...allergies, allergyInput.trim()]
      setAllergyInput('')
    }
  }

  const removeAllergy = (index: number) => {
    control._formValues.allergies = allergies.filter((_, i) => i !== index)
  }

  const addAvoidIngredient = () => {
    if (avoidInput.trim() && avoid.length < 20) {
      control._formValues.avoid_ingredients = [...avoid, avoidInput.trim()]
      setAvoidInput('')
    }
  }

  const removeAvoidIngredient = (index: number) => {
    control._formValues.avoid_ingredients = avoid.filter((_, i) => i !== index)
  }

  const addAvailableIngredient = () => {
    if (availableInput.trim() && available.length < 50) {
      control._formValues.available_ingredients = [...available, availableInput.trim()]
      setAvailableInput('')
    }
  }

  const removeAvailableIngredient = (index: number) => {
    control._formValues.available_ingredients = available.filter((_, i) => i !== index)
  }

  const toggleCuisine = (cuisine: string) => {
    if (cuisines.includes(cuisine as any)) {
      control._formValues.preferred_cuisines = cuisines.filter((c) => c !== cuisine)
    } else if (cuisines.length < 5) {
      control._formValues.preferred_cuisines = [...cuisines, cuisine as any]
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-2xl mx-auto">
      {/* Household & Duration */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Household & Duration</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="households_size"
            control={control}
            rules={{
              required: 'Household size is required',
              min: { value: 1, message: 'Must be at least 1' },
              max: { value: 20, message: 'Maximum 20 people' },
            }}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Number of People
                </label>
                <input
                  {...field}
                  type="number"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
                {errors.households_size && (
                  <p className="text-sm text-destructive mt-1">{errors.households_size.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="planning_days"
            control={control}
            rules={{
              required: 'Planning days is required',
              min: { value: 1, message: 'Must be at least 1' },
              max: { value: 30, message: 'Maximum 30 days' },
            }}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Days to Plan
                </label>
                <input
                  {...field}
                  type="number"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  onChange={(e) => field.onChange(parseInt(e.target.value))}
                />
                {errors.planning_days && (
                  <p className="text-sm text-destructive mt-1">{errors.planning_days.message}</p>
                )}
              </div>
            )}
          />
        </div>
      </div>

      {/* Budget */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Budget</h2>
        
        <div className="grid grid-cols-2 gap-4">
          <Controller
            name="total_budget"
            control={control}
            rules={{
              required: 'Budget is required',
              min: { value: 1, message: 'Budget must be greater than 0' },
            }}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Total Budget
                </label>
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  onChange={(e) => field.onChange(parseFloat(e.target.value))}
                />
                {errors.total_budget && (
                  <p className="text-sm text-destructive mt-1">{errors.total_budget.message}</p>
                )}
              </div>
            )}
          />

          <Controller
            name="currency"
            control={control}
            render={({ field }) => (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Currency
                </label>
                <select
                  {...field}
                  className="w-full px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option>USD</option>
                  <option>EUR</option>
                  <option>GBP</option>
                  <option>CAD</option>
                  <option>AUD</option>
                  <option>INR</option>
                </select>
              </div>
            )}
          />
        </div>
      </div>

      {/* Dietary Preference */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Dietary Preference</h2>
        
        <Controller
          name="dietary_preference"
          control={control}
          render={({ field }) => (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {['omnivore', 'vegetarian', 'vegan', 'keto', 'paleo', 'gluten-free'].map((diet) => (
                <button
                  key={diet}
                  type="button"
                  onClick={() => field.onChange(diet)}
                  className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                    field.value === diet
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border bg-card text-foreground hover:bg-secondary'
                  }`}
                >
                  {diet.charAt(0).toUpperCase() + diet.slice(1)}
                </button>
              ))}
            </div>
          )}
        />
      </div>

      {/* Allergies */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Allergies</h2>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={allergyInput}
            onChange={(e) => setAllergyInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAllergy())}
            placeholder="e.g., peanuts"
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            type="button"
            onClick={addAllergy}
            variant="outline"
            disabled={allergies.length >= 10}
          >
            Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {allergies.map((allergy, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1 bg-accent rounded-full text-accent-foreground text-sm"
            >
              {allergy}
              <button
                type="button"
                onClick={() => removeAllergy(index)}
                className="font-bold hover:opacity-70"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Preferred Cuisines */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Preferred Cuisines</h2>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {['italian', 'asian', 'mexican', 'american', 'mediterranean', 'indian'].map((cuisine) => (
            <button
              key={cuisine}
              type="button"
              onClick={() => toggleCuisine(cuisine)}
              className={`px-4 py-2 rounded-lg border-2 text-sm font-medium transition-colors ${
                cuisines.includes(cuisine as any)
                  ? 'bg-secondary text-secondary-foreground border-secondary'
                  : 'border-border bg-card text-foreground hover:bg-muted'
              }`}
            >
              {cuisine.charAt(0).toUpperCase() + cuisine.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Ingredients to Avoid */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Ingredients to Avoid</h2>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={avoidInput}
            onChange={(e) => setAvoidInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAvoidIngredient())}
            placeholder="e.g., mushrooms"
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            type="button"
            onClick={addAvoidIngredient}
            variant="outline"
            disabled={avoid.length >= 20}
          >
            Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {avoid.map((ingredient, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1 bg-muted rounded-full text-muted-foreground text-sm"
            >
              {ingredient}
              <button
                type="button"
                onClick={() => removeAvoidIngredient(index)}
                className="font-bold hover:opacity-70"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Available Ingredients */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-foreground">Available Ingredients at Home</h2>
        
        <div className="flex gap-2">
          <input
            type="text"
            value={availableInput}
            onChange={(e) => setAvailableInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addAvailableIngredient())}
            placeholder="e.g., rice, oil"
            className="flex-1 px-4 py-2 border border-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <Button
            type="button"
            onClick={addAvailableIngredient}
            variant="outline"
            disabled={available.length >= 50}
          >
            Add
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {available.map((ingredient, index) => (
            <div
              key={index}
              className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-primary text-sm"
            >
              {ingredient}
              <button
                type="button"
                onClick={() => removeAvailableIngredient(index)}
                className="font-bold hover:opacity-70"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Submit */}
      <Button
        type="submit"
        disabled={isLoading}
        className="w-full py-3 text-lg font-semibold"
      >
        {isLoading ? 'Generating Meal Plan...' : 'Generate Meal Plan'}
      </Button>
    </form>
  )
}
