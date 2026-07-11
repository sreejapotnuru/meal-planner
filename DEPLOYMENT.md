# Deployment Guide

## Overview

The Meal Planner application consists of:
1. **Frontend + API**: Deployed to Vercel (Next.js)
2. **Database**: Supabase (PostgreSQL)
3. **GenAI Service**: Google Generative AI (called server-side)

All components are configured for production deployment with zero hardcoded secrets.

---

## Prerequisites

- Vercel account (free tier sufficient)
- Supabase account (free tier sufficient)
- Google Cloud project with Gemini API enabled
- GitHub repository (for Vercel CI/CD)

---

## Step 1: Set Up Supabase

### 1.1 Create Project

1. Visit [supabase.com](https://supabase.com)
2. Click "New Project"
3. Select region closest to users
4. Create strong database password
5. Wait for project creation (2-3 minutes)

### 1.2 Get Connection Details

1. Go to Project Settings → API
2. Copy:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Go to Project Settings → Database → Connection pooling
4. Copy `Connection string (Node.js)` → `POSTGRES_URL`

### 1.3 Get Service Role Key

1. Go to Project Settings → API
2. Copy `service_role` key → `SUPABASE_SERVICE_ROLE_KEY`
3. **⚠️ Keep this secret, never commit to Git**

### 1.4 Apply Database Migrations

```bash
# Option A: Using psql (if you have PostgreSQL installed)
psql "postgresql://postgres:[PASSWORD]@[PROJECT_REF].supabase.co:5432/postgres" \
  < supabase/migrations/001_create_meal_plans.sql

# Option B: Using Supabase SQL Editor
1. Go to your Supabase project
2. Click "SQL Editor"
3. Click "New Query"
4. Copy contents of supabase/migrations/001_create_meal_plans.sql
5. Click "Run"
```

### 1.5 Verify Database Setup

```bash
curl -s "https://[PROJECT_URL]/rest/v1/meal_plans" \
  -H "Authorization: Bearer [ANON_KEY]" \
  -H "Accept: application/json" | jq .
```

Expected: Empty array `[]` (table exists but empty)

---

## Step 2: Set Up Google Gemini API

### 2.1 Create Google Cloud Project

1. Visit [console.cloud.google.com](https://console.cloud.google.com)
2. Create new project
3. Go to APIs & Services → Library
4. Search "Generative Language API"
5. Click "Enable"

### 2.2 Create API Key

1. Go to APIs & Services → Credentials
2. Click "Create Credentials" → "API Key"
3. Copy key → `GOOGLE_GENERATIVE_AI_API_KEY`
4. Go to API Key settings:
   - Restrict to "Generative Language API"
   - Set HTTP referrer restrictions (production URL)

### 2.3 Test Connection

```bash
curl -X POST "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=$GOOGLE_GENERATIVE_AI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Say hello"}]}]}' | jq .
```

Expected: Generated text response

---

## Step 3: Deploy to Vercel

### 3.1 Connect GitHub Repository

1. Push code to GitHub repository
2. Visit [vercel.com](https://vercel.com)
3. Click "New Project"
4. Select GitHub repository
5. Configure project:
   - Framework: "Next.js"
   - Root directory: "./" (if monorepo, select correct path)

### 3.2 Set Environment Variables

In Vercel dashboard, go to Project → Settings → Environment Variables

Add all variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://[PROJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[ANON_KEY]
SUPABASE_SERVICE_ROLE_KEY=[SERVICE_ROLE_KEY]
SUPABASE_JWT_SECRET=[JWT_SECRET]
POSTGRES_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
POSTGRES_PRISMA_URL=postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres
GOOGLE_GENERATIVE_AI_API_KEY=[GEMINI_API_KEY]
NODE_ENV=production
```

**⚠️ Critical:** Mark `SUPABASE_SERVICE_ROLE_KEY` and `GOOGLE_GENERATIVE_AI_API_KEY` as "sensitive"

### 3.3 Deploy

1. Click "Deploy"
2. Wait for build (3-5 minutes)
3. Production URL assigned (e.g., `meal-planner.vercel.app`)

### 3.4 Verify Deployment

```bash
# Test health endpoint
curl https://[your-vercel-url].vercel.app/api/health

# Test meal plan generation (requires API key set)
curl -X POST https://[your-vercel-url].vercel.app/api/meal-plans/generate \
  -H "Content-Type: application/json" \
  -d '{
    "households_size": 2,
    "planning_days": 1,
    "total_budget": 50,
    "currency": "USD",
    "dietary_preference": "omnivore",
    "allergies": [],
    "avoid_ingredients": [],
    "preferred_cuisines": ["italian"],
    "available_ingredients": ["rice", "oil"]
  }' | jq '.meal_plan.days[0].breakfast.name'
```

---

## Step 4: Custom Domain (Optional)

1. In Vercel project settings
2. Go to Domains
3. Add your domain
4. Follow DNS configuration steps
5. Wait for SSL certificate (5-10 minutes)

---

## Monitoring & Logs

### Vercel Logs

1. Project → Deployments
2. Click deployment to view build logs
3. Function logs appear in real-time

### Supabase Logs

1. Project Settings → Logs → Postgres Logs
2. View all SQL queries
3. Check for performance issues

### Gemini API Logs

1. Google Cloud Console → Logs Explorer
2. Filter by `resource.type="api"`
3. View request/response data

---

## Troubleshooting

### "Missing environment variables" Error

**Symptom:** Deployment fails with environment variable errors

**Solution:**
1. Go to Vercel Project → Settings → Environment Variables
2. Verify all required variables are set
3. Redeploy (`git push` or click "Redeploy")

### "Database connection failed" Error

**Symptom:** API returns database error

**Solution:**
```bash
# Test connection string
psql $POSTGRES_URL -c "SELECT 1"

# Check IP whitelisting (Supabase dashboard):
# Project Settings → Network → Allowed addresses
# Add Vercel IP ranges or 0.0.0.0/0 for all
```

### "Gemini API key invalid" Error

**Symptom:** Meal plan generation fails with auth error

**Solution:**
1. Verify key exists in Google Cloud Console
2. Check API is enabled (Generative Language API)
3. Check key restrictions don't block requests
4. Try regenerating API key

### "Meal plan validation failed" Error

**Symptom:** Generation succeeds but validation rejects result

**Solution:**
1. Check `[your-url]/api/health` for Gemini status
2. Review console logs for validation details
3. Adjust allergies/dietary preferences in test request
4. May be AI hallucination; try again

---

## Performance Monitoring

### Key Metrics

```bash
# Monitor API latency
curl -w "\nTotal time: %{time_total}s\n" \
  https://[your-url]/api/meal-plans/generate \
  -d '...' > /dev/null

# Check database query performance
# Supabase Dashboard → SQL Editor → Explain queries
```

**Target Performance:**
- API response time: < 30 seconds (Gemini can take 10-20s)
- Database insert: < 100ms
- Frontend rendering: < 2s

### Cost Estimation

- **Vercel:** $0-20/month (free tier sufficient for ~1000 requests/day)
- **Supabase:** $0-50/month (free tier: 50GB storage, 500MB bandwidth)
- **Gemini API:** ~$0.05 per 1M input tokens ($0.001-$0.01 per meal plan)

---

## Security Checklist

Before production:

- [ ] All secrets stored in Vercel environment (not .env files)
- [ ] No secrets in Git history (`git log --all -p | grep API_KEY`)
- [ ] HTTPS enforced (automatic on Vercel)
- [ ] CORS configured (default: same-origin only)
- [ ] Database RLS policies active
- [ ] API keys restricted to appropriate APIs
- [ ] Rate limiting considered (add if needed)
- [ ] Error messages don't expose internals
- [ ] Logs sanitized (no PII, no secrets)

---

## Rollback

### Rollback to Previous Deployment

1. Vercel Project → Deployments
2. Find previous working deployment
3. Click "..." → "Redeploy"
4. Wait for rebuild

### Rollback Code

```bash
git revert HEAD        # Create reverse commit
git push               # Vercel auto-deploys
```

---

## Scaling for Production

### Database Optimization

```sql
-- Add indexes for large datasets
CREATE INDEX meal_plans_user_created_idx ON meal_plans(user_id, created_at);
CREATE INDEX meal_plans_budget_status_idx ON meal_plans USING GIN(budget_summary);
```

### API Rate Limiting

Add to `app/api/meal-plans/generate/route.ts`:

```typescript
// Middleware example (pseudocode)
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 100, // 100 requests per minute
})

export async function POST(request: NextRequest) {
  await limiter(request)
  // ... rest of handler
}
```

### CDN Caching

- Static pages: Cached at edge
- API responses: Not cached (always fresh)
- Consider Redis for session/cache (Upstash)

---

## Disaster Recovery

### Backup Strategy

**Supabase automated backups:**
- Free tier: 7-day point-in-time recovery
- Pro tier: 30-day retention

**Manual backup:**
```bash
pg_dump $POSTGRES_URL > backup_$(date +%Y%m%d).sql
gzip backup_*.sql
# Store securely (S3, Dropbox, etc.)
```

### Restore from Backup

```bash
psql $POSTGRES_URL < backup_20260711.sql
```

---

## Post-Deployment Testing

### 1. Health Check

```bash
curl https://[your-url]/api/health | jq '.'
# Expect all checks to show "ok" or "error" (not crashed)
```

### 2. Full Flow Test

```bash
curl -X POST https://[your-url]/api/meal-plans/generate \
  -H "Content-Type: application/json" \
  -d '{
    "households_size": 2,
    "planning_days": 2,
    "total_budget": 80,
    "currency": "USD",
    "dietary_preference": "vegetarian",
    "allergies": ["peanuts"],
    "avoid_ingredients": ["mushrooms"],
    "preferred_cuisines": ["mediterranean", "italian"],
    "available_ingredients": ["rice", "oil", "salt"]
  }' | jq '.'
```

### 3. Manual Testing

1. Visit frontend at `https://[your-url]`
2. Fill form with diverse inputs
3. Submit and verify:
   - Loading state appears
   - Meal plan displays
   - Grocery list generates
   - Budget calculated
   - No errors in console
   - Can navigate between tabs

---

## Support

For deployment issues:
- Check Vercel deployment logs
- Check Supabase dashboard for database errors
- Review Google Cloud API quotas
- Enable verbose logging temporarily for debugging
