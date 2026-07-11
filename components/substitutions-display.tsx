'use client'

import { SubstitutionSuggestion } from '@/lib/services/substitutions'
import { Card } from './ui/card'

interface SubstitutionsDisplayProps {
  substitutions: SubstitutionSuggestion[]
  onApply?: (substitution: SubstitutionSuggestion) => void
}

const costImpactColors: Record<'lower' | 'similar' | 'higher', string> = {
  lower: 'text-green-600 bg-green-50',
  similar: 'text-blue-600 bg-blue-50',
  higher: 'text-orange-600 bg-orange-50',
}

const costImpactLabels: Record<'lower' | 'similar' | 'higher', string> = {
  lower: 'Lower Cost',
  similar: 'Similar Cost',
  higher: 'Higher Cost',
}

export function SubstitutionsDisplay({
  substitutions,
  onApply,
}: SubstitutionsDisplayProps) {
  if (substitutions.length === 0) {
    return (
      <Card className="p-6">
        <p className="text-muted-foreground">
          No substitutions available for this meal plan.
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold mb-2">Alternative Ingredients</h2>
        <p className="text-muted-foreground">
          Consider these alternatives to adapt meals to your preferences and budget.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {substitutions.map((substitution, index) => (
          <Card key={index} className="p-4 hover:shadow-md transition-shadow">
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground">Original</p>
                <p className="font-semibold text-foreground">
                  {substitution.original_ingredient}
                </p>
              </div>

              <div className="flex items-center justify-center">
                <div className="w-8 h-px bg-border"></div>
                <span className="px-2 text-xs text-muted-foreground">replace</span>
                <div className="w-8 h-px bg-border"></div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Alternative</p>
                <p className="font-semibold text-accent">
                  {substitution.suggested_replacement}
                </p>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {substitution.reason}
              </p>

              <div className="flex flex-wrap gap-2">
                <span
                  className={`px-2 py-1 text-xs font-medium rounded ${
                    costImpactColors[substitution.cost_impact]
                  }`}
                >
                  {costImpactLabels[substitution.cost_impact]}
                </span>

                {substitution.affects_allergens && (
                  <span className="px-2 py-1 text-xs font-medium rounded bg-amber-50 text-amber-700">
                    Allergen-free
                  </span>
                )}

                {substitution.affects_dietary && (
                  <span className="px-2 py-1 text-xs font-medium rounded bg-green-50 text-green-700">
                    {substitution.dietary_impact || 'Dietary compliant'}
                  </span>
                )}
              </div>

              <div className="pt-2 border-t border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Confidence</span>
                  <div className="flex items-center gap-2">
                    <div className="w-12 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary rounded-full transition-all"
                        style={{
                          width: `${substitution.confidence_score * 100}%`,
                        }}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold">
                      {Math.round(substitution.confidence_score * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {onApply && (
                <button
                  onClick={() => onApply(substitution)}
                  className="w-full mt-2 px-3 py-2 text-sm font-medium rounded bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
                >
                  Apply This Alternative
                </button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  )
}
