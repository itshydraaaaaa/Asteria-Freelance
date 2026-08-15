/**
 * lib/rateLimit.ts — Per-User Rate Limiting
 *
 * DB-backed rate limiter using the rate_limit_log table (migration 003).
 * Counts requests per user per endpoint in a sliding window.
 *
 * Usage:
 *   const limited = await rateLimit(userId, '/api/proposals', { limit: 5, windowSecs: 60 })
 *   if (limited) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })
 */

import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

interface RateLimitOptions {
  limit: number       // max requests allowed in the window
  windowSecs: number  // sliding window in seconds
}

/**
 * Default limits per endpoint (tunable after launch).
 */
export const RATE_LIMITS: Record<string, RateLimitOptions> = {
  '/api/jobs':            { limit: 3,  windowSecs: 60 },
  '/api/proposals':       { limit: 5,  windowSecs: 60 },
  '/api/reviews':         { limit: 2,  windowSecs: 60 },
  '/api/messages/offer':  { limit: 10, windowSecs: 60 },
}

/**
 * Returns a 429 NextResponse if the user has exceeded their rate limit for
 * the given endpoint. Returns null if within limit (caller can proceed).
 *
 * Also records this request in rate_limit_log for the sliding window.
 */
export async function rateLimit(
  userId: string,
  endpoint: string,
  opts?: RateLimitOptions
): Promise<NextResponse | null> {
  const options = opts ?? RATE_LIMITS[endpoint]
  if (!options) return null  // no limit defined for this endpoint

  const supabase = getServiceClient()
  const windowStart = new Date(Date.now() - options.windowSecs * 1000).toISOString()

  // Count requests in sliding window
  const { count, error } = await supabase
    .from('rate_limit_log')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('endpoint', endpoint)
    .gte('created_at', windowStart)

  if (error) {
    console.error('[rateLimit] Error reading rate_limit_log:', error.message)
    return null  // fail open — don't block users if rate limiting itself fails
  }

  if ((count ?? 0) >= options.limit) {
    return NextResponse.json(
      {
        error: 'Too many requests. Please wait before trying again.',
        retryAfterSecs: options.windowSecs,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(options.windowSecs),
          'X-RateLimit-Limit': String(options.limit),
          'X-RateLimit-Window': `${options.windowSecs}s`,
        },
      }
    )
  }

  // Record this request
  await supabase.from('rate_limit_log').insert({
    user_id:  userId,
    endpoint,
  })

  return null
}
