/**
 * lib/idempotency.ts — Request Idempotency Guard
 *
 * Prevents double-charge / double-release on fund-moving endpoints.
 */

import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

export interface IdempotencyRecord {
  idempotencyKey: string
  endpoint: string
  result: any
  createdAt: Date
}

// ─── check ────────────────────────────────────────────────────────────────────
export async function check(
  key: string,
  endpoint: string
): Promise<IdempotencyRecord | null> {
  if (!key || key.length < 8) return null

  try {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('processed_requests')
      .select('*')
      .eq('idempotency_key', key)
      .eq('endpoint', endpoint)
      .single()

    if (!error && data) {
      return {
        idempotencyKey: data.idempotency_key,
        endpoint: data.endpoint,
        result: data.result,
        createdAt: new Date(data.created_at),
      }
    }
  } catch {}

  return null
}

// ─── save ─────────────────────────────────────────────────────────────────────
export async function save(
  key: string,
  endpoint: string,
  result: any,
  userId?: string
): Promise<void> {
  if (!key || key.length < 8) return

  try {
    const supabase = getServiceClient()
    await supabase
      .from('processed_requests')
      .upsert({
        idempotency_key: key,
        endpoint,
        user_id: userId ?? null,
        result,
      }, { onConflict: 'idempotency_key' })
  } catch {}
}

// ─── withIdempotency ─────────────────────────────────────────────────────────
export async function withIdempotency<T>(
  key: string | null | undefined,
  endpoint: string,
  userId: string | undefined,
  fn: () => Promise<T>
): Promise<T> {
  if (key) {
    try {
      const cached = await check(key, endpoint)
      if (cached) return cached.result as T
    } catch {}
  }

  const result = await fn()

  if (key) {
    try {
      await save(key, endpoint, result, userId)
    } catch {}
  }

  return result
}
