# Testing Guide

## Overview

This document describes the comprehensive testing strategy for the Meal Planner application, covering unit tests, integration tests, and end-to-end tests.

## Test Structure

```
project/
├── __tests__/
│   ├── budget.test.ts              # Unit tests for budget calculations
│   └── api.integration.test.ts      # Integration tests for API
├── e2e/
│   └── meal-plan.spec.ts            # End-to-end Playwright tests
├── jest.config.js                   # Jest configuration
├── jest.setup.js                    # Jest test setup
└── playwright.config.ts             # Playwright configuration
```

## Unit Tests

### Running Unit Tests

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test budget.test.ts

# Run with coverage
pnpm test --coverage
```

### Test Files

#### budget.test.ts

Tests budget calculation logic:

- **Positive cases**: Within budget, close to budget, over budget detection
- **Edge cases**: Zero budget, very large budgets, rounding errors
- **Percentage calculations**: Correct budget utilization percentages

Example test:
```typescript
it('should calculate within budget status correctly', () => {
  const result = calculateBudgetFeasibility(100, 75, {}, 'USD')
  expect(result.status).toBe('within_budget')
  expect(result.difference_from_budget).toBe(25)
})
```

### Coverage Goals

- Line coverage: >80%
- Branch coverage: >75%
- Function coverage: >85%

Run coverage report:
```bash
pnpm test --coverage
```

## Integration Tests

### Running Integration Tests

```bash
# Run integration tests
pnpm test api.integration.test.ts

# Watch mode
pnpm test:watch api.integration.test.ts
```

### Test Categories

#### Request Validation

Tests that invalid inputs are rejected:

- Zero household size
- Negative budgets
- Invalid planning days
- Empty required fields

#### Grocery List Aggregation

Tests grocery list generation:

- Duplicate ingredient combination
- Available-at-home ingredient exclusion
- Category grouping
- Quantity summation

#### Budget Feasibility

Tests budget calculation:

- Within budget detection
- Close to budget detection (90-100%)
- Over budget detection
- Percentage calculations

#### Allergy Validation

Tests allergen safety:

- Detection of allergens in meals
- Confirmation of allergen-free meals
- Multiple allergen checking

#### Dietary Restriction Validation

Tests dietary compliance:

- Vegetarian meal validation
- Vegan meal validation
- Keto diet validation
- Multiple restriction combinations

## End-to-End Tests

### Prerequisites

```bash
# Install Playwright browsers
pnpm exec playwright install
```

### Running E2E Tests

```bash
# Run E2E tests headless
pnpm test:e2e

# Run with browser visible
pnpm test:e2e:headed

# Debug mode
pnpm test:e2e:debug

# Run specific test file
pnpm test:e2e meal-plan.spec.ts

# Run specific test
pnpm test:e2e -g "should display the meal preference form"
```

### Test Scenarios

#### Form Validation

- Page loads with form visible
- Form contains all required fields
- Form validation prevents invalid submissions
- Error messages display clearly

#### Input Validation

- Rejects zero household size
- Rejects negative budget
- Validates all required fields
- Shows appropriate error messages

#### Accessibility

- Form has keyboard navigation
- Labels associated with inputs
- Focus indicators visible
- Screen reader friendly

#### Responsive Design

- Mobile viewport (375x667): all elements visible
- Tablet viewport (768x1024): proper layout
- Desktop viewport (1920x1080): optimal layout

#### API Integration

- Form submission sends valid request
- Loading state displays during request
- Success response processed correctly
- Error response handled gracefully

### Example E2E Test

```typescript
test('should reject invalid household size', async ({ page }) => {
  await page.goto('/')
  const householdInput = page.locator('input[placeholder*="household"]')
  
  await householdInput.fill('0')
  const submitButton = page.locator('button[type="submit"]')
  await submitButton.click()

  // Form should still be visible (validation failed)
  const form = page.locator('form')
  await expect(form).toBeVisible()
})
```

## Manual Testing Checklist

### Pre-deployment Verification

- [ ] Form loads without errors
- [ ] All input fields are functional
- [ ] Form validation works correctly
- [ ] API responds to requests
- [ ] Error messages are user-friendly
- [ ] Loading states display
- [ ] Mobile layout is responsive
- [ ] Keyboard navigation works
- [ ] Color contrast is adequate
- [ ] All links function correctly

### Features Verification

- [ ] Meal preferences saved correctly
- [ ] Meal plan displays all days
- [ ] Each day has breakfast, lunch, dinner
- [ ] Grocery list is complete and accurate
- [ ] Budget status matches calculation
- [ ] Substitutions are relevant
- [ ] Allergies are respected
- [ ] Dietary restrictions are enforced

### Browser Compatibility

- [ ] Chrome/Chromium (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Chrome
- [ ] Mobile Safari

### Performance Checks

- [ ] Page loads in <2 seconds
- [ ] Form submission <5 seconds
- [ ] No console errors
- [ ] No layout shifts
- [ ] Images load correctly
- [ ] No memory leaks during extended use

## Continuous Integration

### GitHub Actions

Tests run automatically on:
- Push to main or develop branches
- Pull requests to main or develop

Test pipeline includes:
1. Lint check
2. Unit tests with coverage
3. Build verification
4. E2E tests

### CI Configuration

See `.github/workflows/ci.yml` for details.

### Coverage Reports

Coverage reports are uploaded to Codecov:
- View at: https://codecov.io/github/[your-repo]
- Badge included in README

## Test Data

### Mock User Preferences

```typescript
const mockRequest: MealPlanRequest = {
  household_size: 2,
  planning_days: 3,
  budget: 100,
  currency: 'USD',
  dietary_preferences: ['vegetarian'],
  allergies: ['peanuts'],
  ingredients_to_avoid: ['mushrooms'],
  preferred_cuisines: ['Italian', 'Mediterranean'],
  available_at_home: ['olive oil', 'garlic', 'pasta'],
  calorie_preference: { min: 1500, max: 2500 },
  prep_time_preference: 'moderate'
}
```

### Mock Meal Plan

See integration tests for complete mock structures.

## Debugging Tests

### Common Issues

**Tests timeout:**
- Increase timeout: `test.setTimeout(10000)`
- Check network connectivity
- Verify API is responding

**Element not found:**
- Verify selector using browser dev tools
- Check element is visible and not hidden
- Wait for element: `await page.waitForSelector()`

**Flaky tests:**
- Add explicit waits instead of timeouts
- Use `waitForLoadState('networkidle')`
- Ensure deterministic test data

### Debug Commands

```bash
# Run tests with debugging
pnpm test:e2e:debug

# View test report after run
pnpm test:e2e
# Then open: playwright-report/index.html

# Run specific test with extra logging
DEBUG=pw:api pnpm test:e2e meal-plan.spec.ts
```

## Best Practices

1. **Keep tests focused**: One assertion per test
2. **Use meaningful names**: Describe what is being tested
3. **Test edge cases**: Boundary values and error conditions
4. **DRY principle**: Avoid test code duplication
5. **Mock external services**: Don't rely on real APIs
6. **Clean up**: Use beforeEach/afterEach for setup/teardown
7. **Test user flows**: Not just individual components
8. **Maintain tests**: Update tests when requirements change

## Known Limitations

- E2E tests require browser automation (slower than unit tests)
- Playwright tests run in CI with limited parallelization
- Mock data doesn't guarantee real-world behavior
- Performance tests require consistent CI environment

## Future Improvements

- [ ] Add visual regression tests
- [ ] Implement performance benchmarks
- [ ] Add cross-browser testing
- [ ] Increase coverage to 90%+
- [ ] Add API contract testing
- [ ] Implement load testing
- [ ] Add security scanning in CI

## Support

For test-related questions:
1. Check this documentation
2. Review test files for examples
3. Check Playwright documentation: https://playwright.dev
4. Check Jest documentation: https://jestjs.io

---

Last Updated: January 2025
