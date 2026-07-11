# Hackathon Demo Checklist

This checklist ensures the application is ready for live demonstration and meets all judging criteria.

---

## Pre-Demo Verification (1 hour before)

### ✅ Deployments Online

- [ ] Frontend: Visit deployed URL (should load in < 2 seconds)
- [ ] Health endpoint: `curl https://[url]/api/health`
- [ ] All checks show "ok" or "error" (never "unknown")

### ✅ Environment Configured

- [ ] Supabase credentials active
- [ ] Gemini API key valid (test API)
- [ ] No secrets in browser DevTools
- [ ] Database tables created

### ✅ Data Connection

- [ ] Database: Can insert and read records
- [ ] API: Generate endpoint responds
- [ ] Gemini: Can make real API calls
- [ ] No cached/hardcoded responses

---

## Live Demo Flow (5-10 minutes)

### Part 1: Introduction (1 minute)

**Say:**
> "This is the AI Meal Planner - a full-stack application that generates personalized meal plans using real GenAI, validates them for allergies and dietary requirements, calculates budget feasibility deterministically, and creates consolidated grocery lists."

**Show:**
- Application loaded on screen
- Clean, modern UI with three tabs (Preferences, Meal Plan, Shopping List)
- No console errors (open DevTools to show)

### Part 2: Fill Form (2 minutes)

**Demo diverse inputs to showcase validation:**

```
Household: 3 people
Days: 2 days
Budget: $60 USD
Dietary: Vegetarian
Allergies: peanuts, shellfish
Avoid: mushrooms
Cuisines: Italian, Mediterranean
Available: rice, olive oil, salt
```

**Point out:**
- Form validation (real-time feedback)
- Multiple input types (numbers, selects, tags, checkboxes)
- Allergy/avoid ingredients interface
- "Add" buttons are responsive
- Can remove items with × button

### Part 3: Submit & Wait (1 minute)

**Click "Generate Meal Plan"**

**Say:**
> "Now we're making a real API call to Google Gemini to generate meal suggestions based on all these preferences."

**Show:**
- Loading state appears
- "Generating Meal Plan..." button
- User can see network request in DevTools (Network tab)
- Real API response, not mock data

**Wait time:** 10-20 seconds for Gemini response

### Part 4: Review Meal Plan (2 minutes)

**Click "Meal Plan" tab**

**Show and explain:**

```
Budget Summary:
- Total Budget: $60
- Estimated Grocery Cost: $42.50
- Remaining Budget: $17.50
- Status: Within Budget ✓
- Price Verification: Estimated
```

**Point out:**
- Status clearly displayed with color indicator
- Price verification message (honest about data limitations)
- Expensive items listed (shows calculations performed)

**Scroll to view meals:**

**Day 1:**
- **Breakfast** card: Name, servings, prep time, cost, ingredients, instructions, tags
- **Lunch** card: Similar structure
- **Dinner** card: Similar structure

**Emphasize:**
- All meals are vegetarian (no meat despite it being an option)
- No peanuts or shellfish (allergies validated)
- No mushrooms (avoid list respected)
- Italian/Mediterranean cuisines chosen
- Every meal has full instructions and ingredient list

### Part 5: Grocery List (2 minutes)

**Click "Shopping List" tab**

**Show:**
- Summary at top: Total items, checked off count, items with prices, estimated total
- Grouped by category:
  - 🥬 Vegetables (carrots, tomatoes, etc.)
  - 🍎 Fruits (apples, berries)
  - 🥛 Dairy (cheese, milk)
  - 🌾 Grains (pasta, bread)
  - 📦 Packaged (sauce, oil)

**Point out:**
- Ingredients deduplicated (if two recipes use tomatoes, combined)
- Rice and oil NOT shown (already available at home, excluded)
- Prices estimated from reference database
- Interactive checkboxes to mark items purchased
- Color-coded by category for easy shopping

**Interact:**
- Click checkbox for one item
- Show line-through styling and updated count
- Show how easy it is to track shopping progress

### Part 6: Show Architecture/Code (optional, 2 minutes)

**Open GitHub repository:**
- Show monorepo structure
- Highlight key services:
  - `lib/services/gemini.ts` - Real API integration
  - `lib/services/validation.ts` - Allergy validation logic
  - `lib/services/budget.ts` - Deterministic budget calculation
  - `lib/services/grocery.ts` - Aggregation logic
  - `app/api/meal-plans/generate/route.ts` - API endpoint

**Explain:**
> "The backend validates every Gemini response, checks for allergies, consolidates ingredients, and calculates budget using deterministic logic - we never trust the AI's cost totals."

### Part 7: Try New Preferences (optional, 1 minute)

**Return to Preferences tab and show:**
- Can generate unlimited plans
- Different dietary preferences available
- Easy to modify preferences
- Each submission uses real API (no caching)

---

## Judge Questions (Likely Asked)

### Q: "Why not trust the AI's budget calculations?"

**Answer:**
> "The AI can make mistakes or hallucinate costs. Our backend recalculates deterministically: Budget minus the cost of available ingredients at home equals what we have for shopping. Then grocery cost minus that tells us if we're within budget. This logic is written in code, not dependent on AI estimates."

### Q: "How do you handle allergies?"

**Answer:**
> "After Gemini generates meals, our validation service checks every single ingredient against the user's allergy list. If ANY ingredient matches, the entire meal plan is rejected and we return an error. We never show potentially unsafe plans to users."

### Q: "What about pricing - is it real?"

**Answer:**
> "We use USDA reference pricing for common items. If an ingredient isn't in our database, we mark the plan as 'unverified' pricing - we don't make up prices to pretend we have accurate data. That's honest feedback to the user."

### Q: "Can users save meal plans?"

**Answer:**
> "Yes, meal plans are saved to Supabase after successful generation. The database stores the preferences, generated meals, grocery list, and budget status for future retrieval."

### Q: "Does it work on mobile?"

**Answer:**
> "Yes, the interface is responsive. [Optionally: resize browser window to show mobile layout]"

### Q: "How are secrets secured?"

**Answer:**
> "All API keys and secrets are stored in Vercel environment variables, not in the codebase. Server-side only. The frontend never sees API keys. [Show .env.example without real values]"

### Q: "Can this scale?"

**Answer:**
> "For a hackathon, it's optimized for 1-5 users. For production scaling: add database indexes, implement rate limiting on Gemini calls, cache frequent patterns, potentially split into microservices."

---

## Contingency Plans

### If Gemini API is Down

**Fallback:**
```
Show prepared mock response in development mode
Explain: "The Gemini API appears to be unavailable. 
In production, this returns: 'We could not generate a verified meal plan 
at this time. Please retry.'"
```

**Still demonstrate:**
- Show hardcoded valid meal plan from previous successful run
- Walk through validation and calculation logic
- Show how errors are handled honestly

### If Deployment is Unreachable

**Fallback:**
- Show local development version (`pnpm dev` running locally)
- Explain: "Same application, running locally with same logic"
- All functionality works identically

### If Database is Slow

**Workaround:**
- Make API call and wait
- If timeout: Show cached previous response
- Explain: "In production, would implement query optimization and caching"

### If User's Internet is Slow

**Alternative:**
- Use local version instead
- Pre-generate test meal plans
- Show screenshots

---

## Demo Talking Points

### What Makes This Different

1. **Real GenAI Integration**
   - Actually calls Gemini API
   - Validates every response
   - Rejects invalid responses (doesn't fake success)

2. **Deterministic Budget Logic**
   - Backend calculates costs, not AI
   - Honest "unverified" status when data missing
   - Never fabricates pricing

3. **Safety Validation**
   - Post-generation allergy checking
   - Rejects plans with prohibited ingredients
   - Logged for debugging without exposing PII

4. **Smart Aggregation**
   - Consolidates duplicate ingredients
   - Deduplicates across all meals and days
   - Excludes already-available items
   - Saves money

5. **User-Focused Design**
   - Clear error messages
   - Loading states
   - Easy form interactions
   - Mobile-responsive
   - Accessibility built-in

### Key Statistics

- **Response time:** ~15-20 seconds (Gemini API call)
- **Meals generated:** 3 per day (breakfast, lunch, dinner)
- **Ingredients consolidated:** Average 35-50 items per week
- **Code quality:** Type-safe (TypeScript), validated (Zod), tested
- **Security:** All secrets server-side, no keys exposed

---

## Post-Demo Actions

### Immediately After

- [ ] Thank judges for time
- [ ] Ask for questions
- [ ] Take notes on feedback
- [ ] Offer to demonstrate specific features again
- [ ] Leave contact information

### After Judging

- [ ] Check API logs for any errors during demo
- [ ] Review Supabase database for inserted records
- [ ] Note any issues for improvement
- [ ] Update based on feedback if time permits

---

## Demo Success Criteria

✅ **The application is considered successful if:**

1. Frontend loads and displays form
2. User can submit meal preferences
3. Real Gemini API call is made (visible in network logs)
4. Meal plan displays with breakfast, lunch, dinner for each day
5. Budget calculation is shown (with status: within/over/unverified)
6. Grocery list displays and consolidates ingredients
7. Available ingredients are excluded from grocery list
8. No console errors (JavaScript errors)
9. No hardcoded/fake data (all real or validated)
10. Judges can understand the flow in 5 minutes

**Bonus points:**

✨ Show actual repository structure
✨ Demonstrate code quality (TypeScript, type safety)
✨ Show testing (unit tests passing)
✨ Explain architecture decisions
✨ Discuss security and privacy

---

## Time Management

| Phase | Time | Activity |
|-------|------|----------|
| Intro | 1 min | Explain project |
| Form | 2 min | Fill preferences |
| Wait | 1 min | Gemini API response |
| Meals | 2 min | Review plan |
| Grocery | 2 min | Show shopping list |
| Code | 1 min | (Optional) Show architecture |
| Questions | 1 min | Answer judge questions |
| **Total** | **10 min** | |

---

## Final Checklist

48 hours before demo:

- [ ] Run `pnpm build` - production build succeeds
- [ ] Run `pnpm test` - all tests pass
- [ ] Test API endpoint with curl - generates real meal plan
- [ ] Check deployed URL - all pages load
- [ ] Clear browser cache - see fresh content
- [ ] Test on mobile device - responsive layout works
- [ ] Check browser console - no errors or warnings
- [ ] Verify all environment variables set
- [ ] Prepare demo script (above)
- [ ] Have GitHub link ready
- [ ] Have deployed URL ready
- [ ] Have local development backup ready
- [ ] Close unnecessary browser tabs (keep focus)
- [ ] Update system - no OS dialogs during demo
- [ ] Silence phone/notifications
- [ ] Have water nearby (for speaking)

**You're ready! Good luck! 🚀**
