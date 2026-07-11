'use client'

import { GroceryItem, GroceryCategory } from '@/lib/types'
import { groupGroceryByCategory } from '@/lib/services/grocery'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useState } from 'react'
import { CheckCircle2, Circle } from 'lucide-react'

interface GroceryListDisplayProps {
  groceryItems: GroceryItem[]
  currency: string
}

const CATEGORY_LABELS: Record<GroceryCategory, string> = {
  vegetables: '🥬 Vegetables',
  fruits: '🍎 Fruits',
  dairy: '🥛 Dairy',
  grains: '🌾 Grains',
  pulses: '🫘 Pulses & Legumes',
  spices: '🧂 Spices & Seasonings',
  meat: '🍗 Proteins',
  packaged: '📦 Packaged Items',
  other: '📝 Other',
}

export function GroceryListDisplay({ groceryItems, currency }: GroceryListDisplayProps) {
  const grouped = groupGroceryByCategory(groceryItems)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())

  const toggleItem = (itemId: string) => {
    const newChecked = new Set(checkedItems)
    if (newChecked.has(itemId)) {
      newChecked.delete(itemId)
    } else {
      newChecked.add(itemId)
    }
    setCheckedItems(newChecked)
  }

  const totalPrice = groceryItems.reduce((sum, item) => sum + (item.estimated_price || 0), 0)
  const itemsWithPrice = groceryItems.filter((item) => item.estimated_price && item.estimated_price > 0).length
  const checkedCount = checkedItems.size

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Shopping List Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Total Items</p>
              <p className="text-2xl font-bold">{groceryItems.length}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Checked Off</p>
              <p className="text-2xl font-bold">{checkedCount}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Items with Prices</p>
              <p className="text-2xl font-bold">{itemsWithPrice}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Estimated Total</p>
              <p className="text-2xl font-bold">{totalPrice.toFixed(2)} {currency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grocery List by Category */}
      <div className="space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Shopping List</h2>

        {Object.entries(grouped).map(([category, items]) => {
          if (items.length === 0) return null

          return (
            <Card key={category}>
              <CardHeader>
                <CardTitle className="text-lg">
                  {CATEGORY_LABELS[category as GroceryCategory]}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {items.map((item) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-3 p-3 rounded-lg border border-border transition-colors cursor-pointer hover:bg-muted ${
                        checkedItems.has(item.id) ? 'bg-muted' : ''
                      }`}
                      onClick={() => toggleItem(item.id)}
                    >
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleItem(item.id)
                        }}
                        className="flex-shrink-0 text-primary hover:text-primary/80"
                      >
                        {checkedItems.has(item.id) ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : (
                          <Circle className="w-5 h-5" />
                        )}
                      </button>

                      <div className="flex-grow">
                        <p
                          className={`font-medium ${
                            checkedItems.has(item.id)
                              ? 'line-through text-muted-foreground'
                              : 'text-foreground'
                          }`}
                        >
                          {item.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity} {item.unit}
                        </p>
                      </div>

                      {item.estimated_price && item.estimated_price > 0 && (
                        <div className="flex-shrink-0 text-right">
                          <p className="font-semibold text-foreground">
                            ${item.estimated_price.toFixed(2)}
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
