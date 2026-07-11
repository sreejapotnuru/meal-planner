import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase'
import { testGeminiConnection } from '@/lib/services/gemini'

export async function GET() {
  const checks: Record<string, { status: 'ok' | 'error'; message?: string }> = {
    server: { status: 'ok' },
  }

  // Check Supabase connection
  try {
    const supabaseAdmin = getSupabaseAdmin()
    await supabaseAdmin.from('meal_plans').select('id').limit(1)
    checks.database = { status: 'ok' }
  } catch (error) {
    checks.database = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  // Check Gemini connection
  try {
    const canConnect = await testGeminiConnection()
    checks.gemini_api = { status: canConnect ? 'ok' : 'error' }
  } catch (error) {
    checks.gemini_api = {
      status: 'error',
      message: error instanceof Error ? error.message : 'Unknown error',
    }
  }

  const allHealthy = Object.values(checks).every((check) => check.status === 'ok')

  return NextResponse.json(
    {
      status: allHealthy ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      checks,
    },
    { status: allHealthy ? 200 : 503 },
  )
}
