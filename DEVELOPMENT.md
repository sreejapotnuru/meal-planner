# Development Guide

## Quick Start

### Prerequisites

- Node.js 18+ (check with `node --version`)
- pnpm (check with `pnpm --version`)
- Google Cloud account with Generative AI API enabled
- Supabase account with PostgreSQL database
- Basic TypeScript and React knowledge

### Initial Setup

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd meal-plan-generator

# 2. Install dependencies
pnpm install

# 3. Set up environment variables (see .env.example)
cp .env.example .env.local

# 4. Fill in your credentials:
# - GOOGLE_GENAI_API_KEY: From Google Cloud Console
# - NEXT_PUBLIC_SUPABASE_URL: From Supabase dashboard
# - NEXT_PUBLIC_SUPABASE_ANON_KEY: From Supabase settings
# - SUPABASE_SERVICE_ROLE_KEY: From Supabase settings (admin)

# 5. Run database migrations
pnpm run db:setup

# 6. Start the dev server
pnpm dev

# 7. Open http://localhost:3000 in your browser
```

---

## Project Structure

```
meal-plan-generator/
├── app/
│   ├── api/
│   │   ├── meal-plans/
│   │   │   └── generate/
│   │   │       └── route.ts (API endpoint)
│   │   ├── health/
│   │   │   └── route.ts (Health check)
│   │   └── middleware.ts (Auth, logging)
│   ├── layout.tsx (Root layout, metadata, fonts)
│   ├── page.tsx (Main page, tabs, state)
│   ├── globals.css (Tailwind, design tokens)
│   └── favicon.ico
├── components/
│   ├── meal-preference-form.tsx (Input form)
│   ├── meal-plan-display.tsx (Results)
│   ├── grocery-list-display.tsx (Shopping list)
│   ├── ui/
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── select.tsx
│   │   ├── tabs.tsx
│   │   └── ... (shadcn components)
│   └── icons/
│       └── check-circle.tsx
├── lib/
│   ├── services/
│   │   ├── gemini.ts (Generative AI service)
│   │   ├── validation.ts (Meal plan validation)
│   │   ├── budget.ts (Budget calculations)
│   │   ├── grocery.ts (Grocery aggregation)
│   │   └── pricing.ts (Reference prices)
│   ├── schemas/
│   │   ├── request.ts (Zod schemas for validation)
│   │   ├── response.ts (Response types)
│   │   └── types.ts (Type definitions)
│   ├── constants/
│   │   ├── dietary-preferences.ts
│   │   ├── cuisines.ts
│   │   ├── currencies.ts
│   │   └── errors.ts
│   ├── utils/
│   │   ├── price-converter.ts (Unit conversion)
│   │   ├── logger.ts (Logging utility)
│   │   └── error-handler.ts (Error formatting)
│   └── db/
│       └── supabase.ts (Database client)
├── public/
│   ├── images/
│   │   └── logo.png
│   └── favicon.ico
├── scripts/
│   ├── setup-db.ts (Database schema creation)
│   ├── seed-db.ts (Test data)
│   └── check-env.ts (Environment validation)
├── .env.example (Template for env vars)
├── .gitignore (Git ignore rules)
├── ARCHITECTURE.md (This file)
├── DEVELOPMENT.md (Development guide)
├── CODE_STANDARDS.md (Coding conventions)
├── next.config.mjs (Next.js configuration)
├── tailwind.config.ts (Tailwind configuration)
├── tsconfig.json (TypeScript configuration)
├── package.json (Dependencies and scripts)
└── pnpm-lock.yaml (Dependency lock file)
```

---

## Common Development Tasks

### Adding a New Dietary Preference

**1. Update types**

```typescript
// lib/constants/dietary-preferences.ts
export const DIETARY_PREFERENCES = [
  'omnivore',
  'vegetarian',
  'vegan',
  'keto', // NEW
  'paleo', // NEW
] as const;
```

**2. Update validation schema**

```typescript
// lib/schemas/request.ts
export const MealPlanRequestSchema = z.object({
  dietary_preference: z.enum(['omnivore', 'vegetarian', 'vegan', 'keto', 'paleo']),
  // ... rest of fields
});
```

**3. Add validation logic**

```typescript
// lib/services/validation.ts
export function mealViolatesDietaryPreference(meal, ingredients, preference) {
  if (preference === 'keto') {
    // Check if total carbs exceed threshold
    // Return violation details
  }
  if (preference === 'paleo') {
    // Check for grains, legumes, etc.
  }
  // ... existing logic
}
```

**4. Update Gemini prompt**

```typescript
// lib/services/gemini.ts - in buildMealGenerationPrompt()
const dietaryConstraints = {
  keto: 'All meals must be very low carb (< 20g net carbs per meal). Emphasize fats and proteins.',
  paleo: 'Avoid grains, legumes, dairy, and processed foods. Focus on whole foods.',
  // ... existing
};
```

**5. Update UI**

```typescript
// components/meal-preference-form.tsx
<Select name="dietary_preference">
  <option value="omnivore">Omnivore</option>
  <option value="vegetarian">Vegetarian</option>
  <option value="vegan">Vegan</option>
  <option value="keto">Keto</option> {/* NEW */}
  <option value="paleo">Paleo</option> {/* NEW */}
</Select>
```

**6. Test end-to-end**

```bash
pnpm test -- meal-plan --watch
# Verify keto/paleo meals are generated correctly
```

### Debugging a Failed Meal Generation

**When the API returns an error:**

```bash
# 1. Check the console for error messages
# 2. Look in the Network tab of browser DevTools
# 3. Inspect the full error response

# 4. Enable debug logging
NEXT_PUBLIC_DEBUG=true pnpm dev

# 5. Check server logs in terminal
# Look for: "[Gemini Error]", "[Validation Error]", "[API Error]"

# 6. Test the Gemini API directly
pnpm run test:gemini
```

**Common issues:**

```
"Invalid API key" 
  → Check GOOGLE_GENAI_API_KEY in .env.local
  → Regenerate from Google Cloud Console
  → Make sure API is enabled in project

"JSON parsing error"
  → Gemini response isn't valid JSON
  → Check the response in /api/logs
  → Try regenerating with new prompt version

"Validation failed: Allergy found"
  → Meal plan contains a banned allergen
  → Check allergen detection logic in validation.ts
  → May need to expand allergy synonyms

"Budget calculation error"
  → Check pricing service returned bad data
  → Verify reference prices in pricing.ts
  → Try with estimated prices only
```

### Adding a New Reference Price

```typescript
// lib/services/pricing.ts
export const REFERENCE_PRICES: Record<string, PriceEntry> = {
  'chicken breast': {
    pricePerUnit: 6.99,
    unit: 'lb',
    category: 'meat',
    verified: true,
    lastUpdated: '2024-01-15',
  },
  // Add your price:
  'broccoli': {
    pricePerUnit: 0.80,
    unit: 'lb',
    category: 'vegetables',
    verified: false,
    lastUpdated: '2024-01-10',
  },
  // ... more prices
};
```

### Running Database Migrations

```bash
# Create a new migration
pnpm run db:create-migration add_substitutions_table

# This creates: migrations/YYYY_MM_DD_add_substitutions_table.sql

# Apply pending migrations
pnpm run db:migrate

# Rollback last migration
pnpm run db:rollback

# View migration status
pnpm run db:status
```

---

## Testing

### Running All Tests

```bash
# Run all tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode (re-run on file change)
pnpm test:watch

# Run specific test file
pnpm test -- budget.test.ts

# Run tests matching pattern
pnpm test -- --testNamePattern="budget"
```

### Writing Unit Tests

```typescript
// lib/services/budget.test.ts
import { calculateBudgetFeasibility } from './budget';
import { describe, it, expect } from 'vitest';

describe('calculateBudgetFeasibility', () => {
  it('should return "within" when budget is sufficient', () => {
    const request = {
      total_budget: 100,
      households_size: 2,
      planning_days: 3,
      // ... other fields
    };

    const plan = {
      total_estimated_cost: 60,
      // ... meal data
    };

    const items = [
      { name: 'chicken', quantity: 2, unit: 'lb', estimated_price: 20 },
      { name: 'rice', quantity: 1, unit: 'lb', estimated_price: 2 },
    ];

    const result = calculateBudgetFeasibility(request, plan, items);

    expect(result.status).toBe('within');
    expect(result.remaining_budget).toBeGreaterThan(0);
  });

  it('should return "over" when expenses exceed budget', () => {
    // ... setup with budget = $30, estimated_cost = $80
    const result = calculateBudgetFeasibility(request, plan, items);
    expect(result.status).toBe('over');
    expect(result.remaining_budget).toBeLessThan(0);
  });
});
```

### Writing Integration Tests

```typescript
// lib/services/gemini.integration.test.ts
import { generateMealPlanWithGemini } from './gemini';
import { describe, it, expect, beforeAll } from 'vitest';

describe('Gemini Integration', () => {
  beforeAll(() => {
    expect(process.env.GOOGLE_GENAI_API_KEY).toBeDefined();
  });

  it('should generate a valid meal plan for vegetarians', async () => {
    const request = {
      households_size: 2,
      planning_days: 2,
      total_budget: 100,
      dietary_preference: 'vegetarian',
      allergies: [],
      avoid_ingredients: [],
      preferred_cuisines: [],
    };

    const result = await generateMealPlanWithGemini(request);

    expect(result.days).toHaveLength(2);
    expect(result.days[0].breakfast).toBeDefined();
    expect(result.days[0].lunch).toBeDefined();
    expect(result.days[0].dinner).toBeDefined();
  });
});
```

### E2E Testing with Playwright

```typescript
// e2e/meal-plan-flow.spec.ts
import { test, expect } from '@playwright/test';

test('generate meal plan flow', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:3000');

  // Fill form
  await page.fill('input[name="households_size"]', '2');
  await page.fill('input[name="planning_days"]', '3');
  await page.fill('input[name="total_budget"]', '150');

  // Select dietary preference
  await page.selectOption('select[name="dietary_preference"]', 'vegetarian');

  // Add an allergy
  await page.fill('input[placeholder="Add allergy"]', 'peanuts');
  await page.press('input[placeholder="Add allergy"]', 'Enter');

  // Submit form
  await page.click('button[type="submit"]');

  // Wait for results
  await page.waitForSelector('[data-testid="meal-plan-results"]');

  // Verify meal plan appears
  const mealPlan = page.locator('[data-testid="meal-plan-results"]');
  expect(await mealPlan.isVisible()).toBe(true);

  // Verify meals are displayed
  const mealCards = page.locator('[data-testid="meal-card"]');
  expect(await mealCards.count()).toBeGreaterThan(0);

  // Switch to grocery tab
  await page.click('button[role="tab"]:has-text("Grocery List")');

  // Verify groceries appear
  const groceryItems = page.locator('[data-testid="grocery-item"]');
  expect(await groceryItems.count()).toBeGreaterThan(0);

  // Check an item
  await groceryItems.first().locator('input[type="checkbox"]').check();
  expect(await groceryItems.first().locator('input[type="checkbox"]').isChecked()).toBe(true);
});
```

---

## Environment Variables

### Required Variables

```bash
# Google Generative AI
GOOGLE_GENAI_API_KEY=your_api_key_here
# Get from: https://console.cloud.google.com/

# Supabase Database
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_key
# Get from: https://app.supabase.com/projects/

# Optional: Feature flags
NEXT_PUBLIC_DEBUG=false
NEXT_PUBLIC_ENABLE_ADVANCED_FEATURES=false
```

### During Development

```bash
# Start dev server with debug logs
NEXT_PUBLIC_DEBUG=true pnpm dev

# Disable Gemini API calls (use mock responses)
GEMINI_MOCK_ENABLED=true pnpm dev

# Run with production-like env vars
NODE_ENV=production pnpm dev
```

---

## Performance Profiling

### Browser DevTools

```typescript
// Add performance markers
performance.mark('form-submit');
// ... some work happens
performance.measure('form-submit-duration', 'form-submit');
console.log(performance.measure('form-submit-duration'));
```

### Analyzing Build Size

```bash
# Generate build analysis
pnpm run build:analyze

# Check which dependencies increased size
pnpm run deps:size
```

### API Performance

```typescript
// Add to route.ts
const startTime = Date.now();
const result = await generateMealPlanWithGemini(request);
const duration = Date.now() - startTime;

console.log(`[Gemini API] Completed in ${duration}ms`);
// Returns: [Gemini API] Completed in 15234ms
```

---

## Debugging Tips

### 1. Browser Console Errors

- Open DevTools (F12)
- Check Console tab for JavaScript errors
- Check Network tab for failed API calls
- Look for red errors, yellow warnings

### 2. Server-Side Logs

- Terminal where `pnpm dev` is running
- Look for error messages
- Search for your request ID in logs
- Check timestamps for correlation

### 3. Database Issues

```bash
# Test Supabase connection
pnpm run test:db

# Check table schema
pnpm run db:schema

# View recent meal plan records
pnpm run db:query "SELECT * FROM meal_plans ORDER BY created_at DESC LIMIT 5;"
```

### 4. Gemini API Issues

```typescript
// lib/services/gemini.ts - add detailed logging
console.log('[Gemini Request] Sending:', JSON.stringify(request, null, 2));
const response = await client.generateContent(content);
console.log('[Gemini Response] Received:', JSON.stringify(response, null, 2));
```

### 5. Validation Failures

- Check `validation.ts` for detailed error messages
- Enable logging: `NEXT_PUBLIC_DEBUG=true`
- Look for specific validation failures in console
- Test individual validation functions in isolation

---

## Code Formatting and Linting

### Format Code

```bash
# Format all files
pnpm run format

# Format a specific file
pnpm run format -- lib/services/budget.ts

# Check formatting without changing
pnpm run format:check
```

### Lint Code

```bash
# Run linter
pnpm run lint

# Fix linting errors automatically
pnpm run lint:fix

# Check specific file
pnpm run lint -- app/api/meal-plans/generate/route.ts
```

### TypeScript Checking

```bash
# Check types
pnpm run type-check

# Watch mode
pnpm run type-check:watch

# With verbose output
pnpm run type-check -- --diagnostics
```

---

## Deployment

### Preview Deployment (Vercel)

```bash
# Create pull request to trigger preview
git push origin feature-branch
# Preview auto-deploys via GitHub integration

# After review, merge to main
# Production deployment auto-triggers
```

### Manual Deployment

```bash
# Verify everything builds locally
pnpm run build

# Verify no TypeScript errors
pnpm run type-check

# Deploy to Vercel
vercel --prod

# Check deployment status
vercel inspect
```

### Post-Deployment Checks

```bash
# Check health endpoint
curl https://your-app.vercel.app/api/health

# Expected response:
{
  "status": "ok",
  "timestamp": "2024-01-15T10:00:00Z",
  "checks": {
    "gemini_api": "ok",
    "database": "ok"
  }
}

# Monitor logs in Vercel dashboard
# Check error rates and latencies
```

---

## Troubleshooting Common Issues

### Issue: "Cannot find module 'next/font/google'"

**Solution:**
```bash
# Make sure you're using Next.js 13+
npm list next

# Reinstall next with correct version
pnpm add next@latest
pnpm install
```

### Issue: Supabase Connection Error

**Solution:**
```bash
# Verify environment variables
echo $NEXT_PUBLIC_SUPABASE_URL
echo $NEXT_PUBLIC_SUPABASE_ANON_KEY

# Test connection
pnpm run test:db

# Check network tab in DevTools for CORS issues
# May need to add Vercel domain to Supabase CORS settings
```

### Issue: Gemini API Rate Limiting

**Solution:**
```typescript
// Implement exponential backoff in gemini.ts
let retries = 0;
while (retries < MAX_RETRIES) {
  try {
    return await generateContent(content);
  } catch (error) {
    if (error.status === 429) { // Rate limit
      const delay = Math.pow(2, retries) * 1000; // 1s, 2s, 4s...
      await sleep(delay);
      retries++;
    } else {
      throw error;
    }
  }
}
```

### Issue: High Memory Usage in Development

**Solution:**
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 pnpm dev

# Or set in package.json
"dev": "NODE_OPTIONS=--max-old-space-size=4096 next dev"
```

---

## Useful Commands Reference

```bash
# Development
pnpm dev              # Start dev server
pnpm build            # Build for production
pnpm start            # Start production server
pnpm lint             # Check code quality
pnpm type-check       # Check types
pnpm test             # Run tests

# Database
pnpm run db:setup     # Create schema
pnpm run db:migrate   # Run migrations
pnpm run db:seed      # Populate test data
pnpm run db:status    # Check status

# Utilities
pnpm run format       # Format code
pnpm run check-env    # Verify env vars
pnpm run test:gemini  # Test Gemini API
pnpm run test:db      # Test database

# Deployment
vercel               # Deploy to Vercel
vercel --prod        # Deploy to production
vercel inspect       # Check deployment status
```

---

This guide provides everything needed to develop, test, and deploy the meal plan generator.
