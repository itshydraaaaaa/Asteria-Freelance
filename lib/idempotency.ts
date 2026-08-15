/**
 * lib/idempotency.ts — Request Idempotency Guard
 *
 * Prevents double-charge / double-release on fund-moving endpoints.
 * Clients pass an `Idempotency-Key` header (UUID) with every mutating
 * request to a fund-moving endpoint. The server checks this table before
 * processing and returns the cached result if already seen.
 *
 * Usage in API route:
 *   const key = req.headers.get('Idempotency-Key')
 *   if (key) {
 *     const cached = await idempotency.check(key, '/api/orders/[id]/complete')
 *     if (cached) return NextResponse.json(cached.result, { status: 200 })
 *   }
 *   // ... do work ...
 *   if (key) await idempotency.save(key, '/api/orders/[id]/complete', result)
 */

import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export interface IdempotencyRecord {
  idempotencyKey: string
  endpoint: string
  result: any
  createdAt: Date
}

// ─── check ────────────────────────────────────────────────────────────────────
/**
 * Checks if a request with this key has already been processed.
 * Returns the cached result if found, null if this is a new request.
 */
export async function check(
  key: string,
  endpoint: string
): Promise<IdempotencyRecord | null> {
  if (!key || key.length < 8) return null

  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('processed_requests')
    .select('*')
    .eq('idempotency_key', key)
    .eq('endpoint', endpoint)
    .single()

  if (error || !data) return null
  return {
    idempotencyKey: data.idempotency_key,
    endpoint: data.endpoint,
    result: data.result,
    createdAt: new Date(data.created_at),
  }
}

// ─── save ─────────────────────────────────────────────────────────────────────
/**
 * Records a successfully processed request so future duplicates are no-ops.
 */
export async function save(
  key: string,
  endpoint: string,
  result: any,
  userId?: string
): Promise<void> {
  if (!key || key.length < 8) return

  const supabase = getServiceClient()
  await supabase
    .from('processed_requests')
    .upsert({
      idempotency_key: key,
      endpoint,
      user_id: userId ?? null,
      result,
    }, { onConflict: 'idempotency_key' })
}

// ─── withIdempotency ─────────────────────────────────────────────────────────
/**
 * Higher-order helper that wraps an async function with idempotency checking.
 * If the key was already processed, returns cached result immediately.
 * Otherwise executes fn() and caches the result.
 */
export async function withIdempotency<T>(
  key: string | null | undefined,
  endpoint: string,
  userId: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  if (key) {
    const cached = await check(key, endpoint)
    if (cached) return cached.result as T
  }

  const result = await fn()

  if (key) {
    await save(key, endpoint, result, userId)
  }

  return result
}
