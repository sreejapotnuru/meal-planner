# Quick Start Guide

Get the Meal Planner app running in 5 minutes.

## Prerequisites

- Node.js 20+ installed
- pnpm 10+ installed
- Supabase account
- Google Gemini API key

## 1. Setup Environment Variables

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Then fill in the actual values in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
GOOGLE_GENERATIVE_AI_API_KEY=your-gemini-api-key
```

## 2. Install Dependencies

```bash
pnpm install
```

## 3. Run Development Server

```bash
pnpm dev
```

The app opens at `http://localhost:3000`

## 4. Set Up Database (First Time Only)

In Supabase dashboard:

1. Go to SQL Editor
2. Copy all SQL from `supabase/migrations/001_create_meal_plans.sql`
3. Run the SQL

Or use Supabase CLI:

```bash
supabase db push
```

## 5. Test the Application

1. Open http://localhost:3000
2. Fill in meal preferences form
3. Click "Generate Meal Plan"
4. View the generated plan

## Useful Commands

```bash
# Start dev server
pnpm dev

# Build for production
pnpm build

# Start production server
pnpm start

# Run tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Format code
pnpm exec prettier --write .

# Lint code
pnpm lint
```

## Troubleshooting

### "API key not found" error

- Check `.env.local` exists and has correct values
- Don't commit `.env.local` to Git
- Use `.env.example` as reference

### Database errors

- Verify Supabase URL and keys are correct
- Run SQL migrations in Supabase dashboard
- Check network connectivity

### Gemini API errors

- Verify API key is valid
- Check API quota in Google Cloud Console
- Ensure API is enabled in project

### Port 3000 already in use

Use a different port:

```bash
pnpm dev -- -p 3001
```

## Next Steps

- Read [DEVELOPMENT.md](./DEVELOPMENT.md) for architecture
- Check [DEMO_CHECKLIST.md](./DEMO_CHECKLIST.md) for testing
- Review [SECURITY.md](./SECURITY.md) for security info
- See [README.md](./README.md) for full documentation

## Getting Help

- GitHub Issues: Report bugs
- Discussions: Ask questions
- Documentation: Check .md files in root
