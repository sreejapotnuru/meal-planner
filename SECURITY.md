# Security Policy

## Overview

This meal planning application implements comprehensive security measures to protect user data and ensure safe operation. All sensitive data is handled through secure channels with proper encryption and validation.

## Environment Variable Security

### Server-Side Only

All API keys and secrets are stored exclusively on the server:

- `GOOGLE_GENERATIVE_AI_API_KEY`: GenAI API key (server-only, never exposed to client)
- `SUPABASE_SERVICE_ROLE_KEY`: Database admin key (server-only)

### Public Client Variables

Only non-sensitive Supabase configuration is exposed to the client:

- `NEXT_PUBLIC_SUPABASE_URL`: Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anon key (limited access, scoped by RLS)

### Never Committed

- All `.env` files are in `.gitignore`
- Real keys are never committed to GitHub
- Use `.env.example` as a template only

## Input Validation

### Frontend Validation

- Numeric ranges: household size (1-50), planning days (1-30), budget (0-10000)
- Required fields: All user preferences validated before submission
- Array validation: Dietary preferences, allergies checked for empty values

### Backend Validation

- Schema validation using Zod
- Type checking on all API requests
- Rejection of invalid or malicious data
- Request size limits: maximum 1MB payload

## API Security

### Rate Limiting

GenAI endpoint (`/api/meal-plans/generate`) implements:
- Per-user rate limiting (5 requests per 60 seconds)
- Global circuit breaker (1000 requests per hour)
- Exponential backoff for retries

### CORS Configuration

- Frontend domain whitelist enforced
- Credentials not allowed cross-origin
- Preflight requests required

### HTTPS Only

- All deployments enforce HTTPS
- Secure cookies with httpOnly and sameSite flags
- HSTS headers enabled

## Database Security

### Row-Level Security (RLS)

- Supabase RLS policies enforce data isolation
- Users cannot access other users' meal plans
- Service role key used only for backend operations

### Parameterized Queries

- All database queries use parameterized statements
- No string concatenation for SQL queries
- Prepared statements prevent SQL injection

### Data Minimization

- Only required user data is stored
- Complete GenAI prompts not persisted
- Audit logs avoid storing sensitive details

## GenAI Security

### Request Sanitization

- Input validation before AI request
- No sensitive user info in AI prompts (IDs used instead)
- Token limit enforcement (max 2000 output tokens)

### Response Validation

- Strict schema validation before using AI output
- AllErg/dietary restriction double-check after AI generation
- Budget calculation never trusts AI numbers

### API Key Protection

- Key stored server-side only
- Never sent to frontend
- Rotated regularly in production
- Separate key for development/testing

## Error Handling

### Safe Error Messages

- Stack traces never shown to clients
- Generic error messages displayed to users
- Detailed errors logged server-side only

### Logging

- Errors logged with context but no sensitive data
- No passwords, tokens, or complete personal info logged
- Access logs kept for 30 days
- Audit trail for data modifications

## Dependency Security

### Vulnerability Scanning

- Regular `npm audit` and `pnpm audit` checks
- Dependabot enabled for automated alerts
- Security patches applied promptly

### Minimal Dependencies

- Only necessary packages included
- Pinned versions for stability
- Regular updates and deprecation reviews

## Deployment Security

### Build Time

- Secrets not baked into container images
- Build-time environment variables scoped appropriately
- No development keys in production builds

### Runtime

- Environment variables injected at runtime
- Secrets managed through deployment platform
- No credentials in logs or error messages

### Infrastructure

- Latest Node.js LTS version
- Security patches applied automatically
- DDoS protection via Vercel/deployment service

## Data Privacy

### User Data

- Only essential data collected (preferences, allergies, etc.)
- No tracking or analytics on personal data
- User can request data deletion via support

### Retention

- Meal plans retained only as long as needed
- Deleted plans removed from database
- Logs retained 30 days maximum

## Incident Response

### Reporting

- Report security issues to: [add security contact email]
- Do not create public GitHub issues for vulnerabilities
- 48-hour response target

### Response Process

1. Acknowledge receipt within 24 hours
2. Investigate and confirm vulnerability
3. Develop and test fix
4. Deploy fix and notify users if needed
5. Publish security advisory

## Compliance

### Standards

- OWASP Top 10 principles followed
- GDPR-compliant for EU users
- Data minimization and encryption best practices

### Audit Trail

- All data modifications logged
- User actions tracked for security
- Regular security reviews conducted

## Best Practices for Users

### When Using the Application

1. Use a strong, unique password (when login enabled)
2. Don't share your session in untrusted browsers
3. Log out when finished, especially on shared devices
4. Verify HTTPS is active (green lock in browser)

### When Reporting Issues

1. Never share API keys or secrets
2. Redact personal information from examples
3. Provide steps to reproduce
4. Include your environment details

## Security Updates

- Follow GitHub releases for updates
- Subscribe to security advisories
- Deploy patches within 7 days of release
- Test updates in staging first

## Responsible Disclosure

We follow responsible disclosure principles:

- Fix vulnerabilities before public disclosure
- Provide 30-day notice to affected users
- Credit security researchers who report issues responsibly
- Maintain transparent communication

---

Last Updated: January 2025

For questions about security practices, please contact: [security contact]
