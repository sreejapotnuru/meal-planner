# Architecture Documentation

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Browser                              │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  React/Next.js Frontend (TypeScript + Tailwind CSS)        │  │
│  │  ├─ pages/index.tsx (Main entry point, tab navigation)     │  │
│  │  ├─ components/meal-preference-form.tsx (Input validation) │  │
│  │  ├─ components/meal-plan-display.tsx (Results display)     │  │
│  │  └─ components/grocery-list-display.tsx (Interactive list) │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              ↓ (HTTP/JSON)
┌─────────────────────────────────────────────────────────────────┐
│                      Next.js API Routes                           │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  /api/meal-plans/generate (POST)                           │  │
│  │  ├─ Input validation (Zod schemas)                         │  │
│  │  ├─ Call Google Gemini API (Real request)                  │  │
│  │  ├─ Response validation (Schema check)                     │  │
│  │  ├─ Allergy & dietary validation                           │  │
│  │  ├─ Grocery aggregation                                    │  │
│  │  ├─ Budget calculation (deterministic)                     │  │
│  │  └─ Store in Supabase                                      │  │
│  │                                                             │  │
│  │  /api/health (GET)                                         │  │
│  │  └─ Health check (server, database, GenAI)                 │  │
│  └────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
     ↓                           ↓                           ↓
┌──────────────┐    ┌──────────────────┐    ┌─────────────────┐
│ Google Cloud │    │    Supabase      │    │  Google Gemini  │
│   Console    │    │   PostgreSQL     │    │      API        │
│              │    │                  │    │                 │
│ GenAI API    │    │ meal_plans table │    │ Real-time text  │
│ Configuration│    │ Indexes & RLS    │    │ generation      │
│              │    │                  │    │                 │
└──────────────┘    └──────────────────┘    └─────────────────┘
```

---

## Component Architecture

### Frontend Components

#### 1. **Main Page (`pages/index.tsx`)**

**Responsibility:** Page layout, tab navigation, state management

```typescript
State:
- mealPlan: MealPlanResponse | null
- isLoading: boolean
- error: string | null
- activeTab: 'form' | 'meals' | 'grocery'

Flow:
User fills form → Submit → API call → Response → Display results
```

**Data Flow:**
```
Form Component → handleSubmit
    ↓
fetch('/api/meal-plans/generate', { method: 'POST', body: formData })
    ↓
Response: MealPlanResponse
    ↓
setMealPlan(result) → Render meal plan/grocery tabs
```

#### 2. **Meal Preference Form (`components/meal-preference-form.tsx`)**

**Responsibility:** Collect user inputs with real-time validation

```typescript
Features:
- react-hook-form for efficient form management
- Zod schema validation
- Dynamic tag inputs (allergies, avoid ingredients, available items)
- Toggle buttons (dietary preference, cuisines)
- Number inputs (household, days, budget)
- Select dropdown (currency)

Validation:
- Client-side: Immediate feedback
- Min/max checks: Ranges enforced
- Type checking: TypeScript safety
```

**Key Methods:**
```typescript
addAllergy() → Add to allergies array
removeAllergy(index) → Remove from array
toggleCuisine(cuisine) → Add/remove from cuisines
handleSubmit() → Call onSubmit prop with validated data
```

#### 3. **Meal Plan Display (`components/meal-plan-display.tsx`)**

**Responsibility:** Show generated meals and budget details

```typescript
Structure:
- Budget Summary Card (status, remaining, expensive items)
- Days Grid (one section per day)
  - Breakfast Card (name, ingredients, instructions, cost)
  - Lunch Card (same)
  - Dinner Card (same)

Each meal card shows:
- Name and meal type
- Servings, prep time, cost (icons + values)
- Full ingredient list
- Cooking instructions
- Dietary tags and allergen warnings
- Suggested substitutions (if available)
```

#### 4. **Grocery List Display (`components/grocery-list-display.tsx`)**

**Responsibility:** Show interactive shopping list grouped by category

```typescript
Features:
- Summary stats (total items, checked count, estimated cost)
- Category grouping (vegetables, fruits, dairy, etc.)
- Per-item checkboxes (mark as purchased)
- Item quantity and unit
- Estimated price per item

State:
- checkedItems: Set<string> (locally tracked, not persisted)
- toggleItem(id) → Add/remove from checked set
```

### Backend Services

#### 1. **Gemini Service (`lib/services/gemini.ts`)**

**Responsibility:** Call Google Generative AI API

```typescript
Functions:
- getGeminiClient() → Lazy-load API client
- generateMealPlanWithGemini(preferences) → Main generation
- testGeminiConnection() → Health check

generateMealPlanWithGemini flow:
1. Build detailed prompt with user preferences
2. Send to Google Gemini API
3. Parse JSON response (handle markdown code blocks)
4. Validate against GeneratedMealPlanSchema
5. Return validated plan or throw error

Error handling:
- No API key → Throw error (buildtime fails gracefully)
- Invalid JSON → Try markdown extraction fallback
- Schema validation fails → Throw detailed error
- Timeout → Return generic error message
```

#### 2. **Validation Service (`lib/services/validation.ts`)**

**Responsibility:** Validate meal plans meet requirements

```typescript
Functions:
- validateMealPlan(request, plan) → Full validation
- ingredientContainsAllergen(name, allergens) → Check
- mealViolatesDietaryPreference(name, ingredients, pref) → Check
- logValidationFailure(requestId, result) → Audit log

Validation checks:
1. Day count matches request
2. Each day has breakfast, lunch, dinner
3. No allergies in any ingredient
4. No avoided ingredients
5. Meals match dietary preference
6. Cost reasonableness checks
7. Total cost vs budget sanity check

Returns: ValidationResult { valid, errors[], warnings[] }
```

#### 3. **Budget Service (`lib/services/budget.ts`)**

**Responsibility:** Calculate budget feasibility deterministically

```typescript
Functions:
- calculateBudgetFeasibility(request, plan, items) → BudgetSummary
- estimateIngredientPrice(name, qty, unit) → {price, verified}
- convertPrice(qty, fromUnit, pricePerUnit, priceUnit) → number
- calculateSubstitutionSavings(cost, original, replacement, impact) → number

calculateBudgetFeasibility algorithm:
1. Cost of available ingredients = availableIngredients.length × $1.50
2. Budget for groceries = total_budget - cost_of_available
3. Estimated grocery cost = sum(item.estimated_price for item in list)
4. Remaining budget = budget_for_groceries - estimated_grocery_cost

Budget status logic:
- remaining < 0 → 'over'
- remaining < budget_for_groceries * 0.1 → 'close'
- no verified prices → 'unverified'
- else → 'within'

Returns: BudgetSummary with:
- total_budget
- estimated_grocery_cost
- cost_of_available_ingredients
- remaining_budget
- status
- expensive_items (top 5)
- price_verification_status
```

#### 4. **Grocery Service (`lib/services/grocery.ts`)**

**Responsibility:** Aggregate and categorize groceries

```typescript
Functions:
- aggregateGroceryList(plan, request) → GroceryItem[]
- groupGroceryByCategory(items) → Record<Category, GroceryItem[]>
- calculateGroceryTotals(items) → {totalItems, verifiedCount, total}
- markItemPurchased(item, bool) → GroceryItem
- getUnpurchasedItems(items) → GroceryItem[]

aggregateGroceryList algorithm:
1. Create ingredient map: { lowercase_name → {qty, unit, allergens} }
2. For each meal in each day:
   - For each ingredient:
     - Check if available at home (skip if yes)
     - If already in map: add quantity
     - Else: create new entry
3. Convert map to sorted GroceryItem array
4. Estimate price for each item
5. Assign category
6. Sort by category, then name

Returns: GroceryItem[]
- Deduplicated
- Excluded available items
- Categorized
- Priced (when available)
```

#### 5. **Pricing Service (`lib/services/pricing.ts`)**

**Responsibility:** Reference pricing database and lookups

```typescript
Data structure:
REFERENCE_PRICES: Record<string, {pricePerUnit, unit, category}>

Example entries:
- 'chicken breast': {pricePerUnit: 6.99, unit: 'lb', category: 'meat'}
- 'tomato': {pricePerUnit: 0.3, unit: 'each', category: 'vegetables'}

Functions:
- estimateIngredientPrice() → Uses reference prices
- getPriceVerificationMessage(status) → User-facing text
- findSimilarPricedItem(search, category) → Fallback lookup

Fallback pricing by category:
- Vegetables/Fruits: $0.50-$0.60 per unit
- Meat/Proteins: $3.00-$8.00 per unit
- Dairy: $1.50 per unit
- Grains: $0.30 per unit
- Spices: $0.10 per unit
- Packaged: $1.00 per unit
```

### API Route

#### **POST /api/meal-plans/generate**

**Flow:**

```
1. Receive request body
   ↓
2. Validate with MealPlanRequestSchema
   → If invalid: return 400 with validation errors
   ↓
3. Log request: households, days, budget
   ↓
4. Call generateMealPlanWithGemini(validatedRequest)
   → If error: return 503 with user-friendly message
   ↓
5. Validate meal plan against request
   → If validation fails: return 400 with details
   → Log failure details (no PII)
   ↓
6. aggregateGroceryList(plan, request)
   ↓
7. calculateBudgetFeasibility(request, plan, groceryList)
   ↓
8. Extract substitutions from plan
   ↓
9. Build MealPlanResponse
   ↓
10. Store in Supabase meal_plans table
    → If database error: log and continue (don't fail API)
    ↓
11. Return 200 + MealPlanResponse
```

**Error Handling:**

```
Input validation error
  → 400 Bad Request
  → "Invalid request format. Please check your input."

Gemini API error
  → 503 Service Unavailable
  → "We could not generate a verified meal plan at this time. Please retry."

Meal plan validation error
  → 400 Bad Request
  → "Generated meal plan failed validation. Please retry."

Unexpected error
  → 500 Internal Server Error
  → "An unexpected error occurred. Please try again."
  → Stack trace logged server-side only
```

### Database Schema

**Table: `meal_plans`**

```sql
CREATE TABLE meal_plans (
  id uuid PRIMARY KEY,
  user_id uuid,
  user_preferences jsonb,      -- MealPlanRequest
  meal_plan jsonb,              -- GeneratedMealPlan
  grocery_list jsonb,           -- GroceryItem[]
  budget_summary jsonb,         -- BudgetSummary
  validation_passed boolean,
  created_at timestamp,
  updated_at timestamp
);

Indexes:
- meal_plans_user_id_idx: Faster user lookups
- meal_plans_created_at_idx: Time-based queries

RLS Policies:
- SELECT: Users see only own plans (user_id = auth.uid())
- INSERT: Users create only own plans
- UPDATE: Users modify only own plans
```

---

## Data Flow Examples

### Scenario 1: Generate Meal Plan for Vegetarians

```
User Input:
{
  households_size: 2,
  planning_days: 2,
  total_budget: 60,
  dietary_preference: "vegetarian",
  allergies: ["shellfish"],
  avoid_ingredients: ["mushrooms"],
  preferred_cuisines: ["mediterranean"]
}
    ↓
Form validation (client)
    ↓
POST /api/meal-plans/generate
    ↓
Backend validates schema ✓
    ↓
Build Gemini prompt:
  "Generate 2 days of vegetarian meals, serves 2,
   avoid shellfish, avoid mushrooms, mediterranean cuisine,
   budget $60, return strict JSON..."
    ↓
Call Gemini API
    ↓
Response:
{
  "days": [
    {
      "day_number": 1,
      "breakfast": {name: "Vegetable Frittata", ...},
      "lunch": {name: "Greek Salad", ...},
      "dinner": {name: "Pasta Primavera", ...}
    },
    ...
  ],
  "total_estimated_cost": 45.00
}
    ↓
Validate schema ✓
    ↓
Check allergies:
  - Shellfish NOT in any ingredient ✓
    ↓
Check dietary:
  - No meat in any meal ✓
    ↓
Aggregate groceries:
  [Tomato, Cucumber, Bell Pepper, Feta, Pasta, ...]
    ↓
Calculate budget:
  - Available ingredients cost: $3
  - Grocery cost: $42
  - Remaining: $15
  - Status: "within"
    ↓
Store in Supabase
    ↓
Return MealPlanResponse
    ↓
Frontend displays results ✓
```

### Scenario 2: Over Budget Detection

```
Generated plan costs: $80
User budget: $60
Available at home: Rice, Oil ($3)

Budget calculation:
1. Available cost: $3
2. Budget for groceries: $60 - $3 = $57
3. Estimated grocery cost: $80
4. Remaining: $57 - $80 = -$23
5. Status: "over"

Response shows:
- Total Budget: $60
- Estimated Cost: $80
- Remaining: -$23 (in red)
- Status Badge: "Over Budget"
- Suggestions: "Most expensive items: Beef ($25), Salmon ($18), ..."
```

---

## Type System

```typescript
// Request types
MealPlanRequest {
  households_size: number (1-20)
  planning_days: number (1-30)
  total_budget: number (>0)
  currency: CurrencyCode
  dietary_preference: DietaryPreference
  allergies: string[]
  avoid_ingredients: string[]
  preferred_cuisines: Cuisine[]
  available_ingredients: string[]
  calorie_preference?: number
  prep_time_preference?: number
}

// Response types
MealPlanResponse {
  id: string (UUID)
  created_at: string (ISO 8601)
  user_preferences: MealPlanRequest
  meal_plan: GeneratedMealPlan
  grocery_list: GroceryItem[]
  budget_summary: BudgetSummary
  substitutions: Substitution[]
  validation_passed: boolean
  generation_timestamp: string
}

// Meal types
GeneratedMealDay {
  day_number: number
  breakfast: GeneratedMeal
  lunch: GeneratedMeal
  dinner: GeneratedMeal
}

GeneratedMeal {
  name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner'
  ingredients: GeneratedIngredient[]
  servings: number
  prep_time_minutes: number
  instructions: string
  dietary_tags: string[]
  allergen_info: string[]
  estimated_cost: number
  suggested_substitutions?: Substitution[]
}

// Grocery types
GroceryItem {
  id: string (UUID)
  name: string
  quantity: number
  unit: string
  category: GroceryCategory
  estimated_price?: number
  is_purchased: boolean
  notes?: string
}

// Budget types
BudgetSummary {
  total_budget: number
  estimated_grocery_cost: number
  cost_of_available_ingredients: number
  remaining_budget: number
  status: 'within' | 'close' | 'over' | 'unverified'
  expensive_items: {name, cost}[]
  price_verification_status: 'verified' | 'estimated' | 'unverified'
}
```

---

## Error Handling Strategy

```
Tier 1: Input Validation
├─ Client-side: Form validation, immediate feedback
├─ Server-side: Zod schema validation
└─ Result: 400 Bad Request with field errors

Tier 2: Service Errors
├─ Gemini API down: Return 503, "Please retry"
├─ Database error: Log and continue (don't cascade failure)
├─ Network timeout: 30-second timeout, return error
└─ Result: Appropriate HTTP status + user message

Tier 3: Validation Failures
├─ Allergy found in meal: Reject plan
├─ Dietary mismatch: Log warning, may continue
├─ Cost sanity check: Warning, doesn't reject
└─ Result: 400 Bad Request with details

Tier 4: Unexpected
├─ Log full error server-side
├─ Return generic message to client
├─ Never expose stack traces
└─ Result: 500 Internal Server Error
```

---

## Security Layers

```
Layer 1: Secrets Management
├─ Env vars only (never hardcoded)
├─ Lazy loading (fail at runtime, not build)
├─ Server-side only (no frontend access)
└─ Marked sensitive in deployment platform

Layer 2: Input Validation
├─ Type checking (TypeScript)
├─ Schema validation (Zod)
├─ Range checks (min/max)
└─ String sanitization (trim, lowercase for comparisons)

Layer 3: API Security
├─ HTTPS only (in production)
├─ CORS: Same-origin default
├─ No API key in responses
├─ Safe error messages
└─ Rate limiting (on Gemini calls)

Layer 4: Data Security
├─ Database RLS policies
├─ User_id scoping on queries
├─ No sensitive data in logs
├─ No complete PII stored
└─ Parameterized queries (Supabase ORM)

Layer 5: GenAI Safety
├─ Validate all AI output
├─ Never trust AI totals/calculations
├─ Reject unvalidated responses
├─ Allergy checks are backend responsibility
└─ Cost calculations are deterministic
```

---

## Performance Considerations

### Request Lifecycle Timing

```
Client form submit: 0ms
├─ Validation: <10ms
├─ Network latency: ~100ms
├─ Server processing: <50ms
├─ Gemini API call: 10,000-20,000ms (largest contributor)
├─ Response validation: <50ms
├─ Grocery aggregation: <100ms
├─ Budget calculation: <10ms
├─ Database insert: ~50ms
└─ Response serialization: <10ms

Total: ~10-20 seconds (Gemini latency dominates)
```

### Optimization Strategies

1. **Frontend**
   - React memoization prevents unnecessary renders
   - Form validation before submit (fast feedback)
   - Lazy load components

2. **Backend**
   - Gemini: Single call per request (no retry loops)
   - Grocery aggregation: O(n) algorithm
   - Database: Indexed queries on user_id, created_at

3. **Database**
   - Indexes on frequently queried columns
   - JSON storage for flexibility
   - RLS policies efficient filtering

---

## Extensibility Points

### Adding New Dietary Preferences

1. Add to `DietaryPreference` type
2. Update validation logic in `validation.ts`
3. Update Gemini prompt template
4. Update meal validation checks
5. Add test cases

### Adding Real-Time Pricing

1. Create `PricingProvider` interface
2. Implement USDA, Kroger, or other API
3. Update `estimateIngredientPrice()` to call provider
4. Cache results in Redis (Upstash)
5. Fall back to reference prices on timeout

### Adding User Authentication

1. Integrate Supabase Auth (email/password)
2. Add authentication middleware
3. Update API to check `auth.uid()`
4. Update RLS policies (already in place)
5. Add user preferences/favorite meals

### Adding Nutrition Tracking

1. Create `NutritionService`
2. Call nutrition API (USDA FoodData Central)
3. Aggregate per meal and per day
4. Store in `MealPlanResponse`
5. Display in UI

---

## Testing Strategy

### Unit Tests

```
Budget calculation:
- Within budget scenario
- Over budget scenario
- Unverified pricing scenario
- Substitution savings

Grocery aggregation:
- Deduplication
- Available item exclusion
- Category assignment
- Price lookup

Validation:
- Allergy detection
- Dietary preference check
- Schema validation
```

### Integration Tests

```
Full API flow:
- Request validation
- Gemini response handling
- All service coordination
- Database persistence
- Response format
```

### E2E Tests (Playwright)

```
Critical user flow:
- Navigate to form
- Fill preferences
- Submit
- See meal plan
- View groceries
- Mark items purchased
- No errors in console
```

---

This architecture supports the MVP while remaining extensible for future features.
