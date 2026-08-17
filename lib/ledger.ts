/**
 * lib/ledger.ts — Asteria Wallet Ledger Service
 *
 * ALL wallet mutations must go through this module.
 * Direct writes to users.wallet_balance from application code are FORBIDDEN.
 *
 * The underlying storage is wallet_transactions (append-only) + a Postgres
 * function that updates users.wallet_balance as a denormalized read cache.
 */

import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export type TxType =
  | 'DEPOSIT'
  | 'FUND_ESCROW'
  | 'RELEASE'
  | 'REFUND'
  | 'PLATFORM_FEE'
  | 'WITHDRAWAL'

export interface LedgerEntry {
  id: string
  userId: string
  orderId?: string
  milestoneId?: string
  type: TxType
  amount: number
  balanceAfter: number
  note?: string
  idempotencyKey?: string
  createdAt: Date
}

export interface TransactionMeta {
  orderId?: string
  milestoneId?: string
  note?: string
  idempotencyKey?: string
}

const PLATFORM_FEE_RATE = 0.12  // 12% platform commission

// ─── getBalance ───────────────────────────────────────────────────────────────
/**
 * Returns the current wallet balance for a user by reading the denormalized
 * wallet_balance column (maintained by the Postgres credit/debit functions).
 */
export async function getBalance(userId: string): Promise<number> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('users')
    .select('wallet_balance')
    .eq('id', userId)
    .single()

  if (error || !data) throw new Error(`[ledger] getBalance failed: ${error?.message}`)
  return Number(data.wallet_balance ?? 0)
}

// ─── creditWallet ─────────────────────────────────────────────────────────────
/**
 * Credits (positive amount) to a user's wallet via the Postgres function.
 * Idempotent if idempotencyKey is provided.
 */
export async function creditWallet(
  userId: string,
  amount: number,
  type: TxType,
  meta: TransactionMeta = {}
): Promise<LedgerEntry> {
  if (amount <= 0) throw new Error('[ledger] creditWallet: amount must be positive')

  const supabase = getServiceClient()
  const { data, error } = await supabase.rpc('credit_wallet', {
    p_user_id:         userId,
    p_amount:          amount,
    p_type:            type,
    p_order_id:        meta.orderId ?? null,
    p_milestone_id:    meta.milestoneId ?? null,
    p_note:            meta.note ?? null,
    p_idempotency_key: meta.idempotencyKey ?? null,
  })

  if (error) throw new Error(`[ledger] creditWallet failed: ${error.message}`)
  return mapEntry(data)
}

// ─── debitWallet ──────────────────────────────────────────────────────────────
/**
 * Debits (negative amount) from a user's wallet via the Postgres function.
 * Validates sufficient balance before inserting. Idempotent if idempotencyKey provided.
 */
export async function debitWallet(
  userId: string,
  amount: number,
  type: TxType,
  meta: TransactionMeta = {}
): Promise<LedgerEntry> {
  if (amount <= 0) throw new Error('[ledger] debitWallet: amount must be positive')

  const supabase = getServiceClient()
  const { data, error } = await supabase.rpc('debit_wallet', {
    p_user_id:         userId,
    p_amount:          amount,
    p_type:            type,
    p_order_id:        meta.orderId ?? null,
    p_milestone_id:    meta.milestoneId ?? null,
    p_note:            meta.note ?? null,
    p_idempotency_key: meta.idempotencyKey ?? null,
  })

  if (error) throw new Error(`[ledger] debitWallet failed: ${error.message}`)
  return mapEntry(data)
}

// ─── processEscrowRelease ─────────────────────────────────────────────────────
/**
 * Releases escrow funds for a completed order:
 *  - Credits seller 88% (net payout)
 *  - Credits admin/platform 12% (platform fee)
 * Both writes are idempotent using the orderId as key component.
 */
export async function processEscrowRelease(
  orderId: string,
  sellerId: string,
  amount: number,
  adminId: string = 'platform'
): Promise<{ sellerPayout: number; platformFee: number }> {
  const sellerPayout = Math.round(amount * (1 - PLATFORM_FEE_RATE) * 100) / 100
  const platformFee  = Math.round(amount * PLATFORM_FEE_RATE * 100) / 100

  await creditWallet(sellerId, sellerPayout, 'RELEASE', {
    orderId,
    note: `Payout for order ${orderId} (${Math.round((1 - PLATFORM_FEE_RATE) * 100)}%)`,
    idempotencyKey: `release-${orderId}-seller`,
  })

  // Platform fee goes to the platform account (admin1 in demo; real account in prod)
  // In production, credit a dedicated platform revenue account
  await creditWallet(adminId, platformFee, 'PLATFORM_FEE', {
    orderId,
    note: `Platform fee for order ${orderId} (${Math.round(PLATFORM_FEE_RATE * 100)}%)`,
    idempotencyKey: `release-${orderId}-platform`,
  }).catch(() => {
    // Platform fee credit failure is non-critical — log but don't block payout
    console.warn(`[ledger] Platform fee credit failed for order ${orderId}`)
  })

  return { sellerPayout, platformFee }
}

// ─── processMilestoneRelease ──────────────────────────────────────────────────
/**
 * Releases a single milestone's escrow to the seller (85% net).
 */
export async function processMilestoneRelease(
  orderId: string,
  milestoneId: string,
  sellerId: string,
  milestoneAmount: number
): Promise<number> {
  const netPayout = Math.round(milestoneAmount * (1 - PLATFORM_FEE_RATE) * 100) / 100

  await creditWallet(sellerId, netPayout, 'RELEASE', {
    orderId,
    milestoneId,
    note: `Milestone ${milestoneId} payout for order ${orderId}`,
    idempotencyKey: `milestone-release-${milestoneId}`,
  })

  return netPayout
}

// ─── processEscrowRefund ──────────────────────────────────────────────────────
/**
 * Refunds full escrow amount back to the buyer (dispute resolution).
 */
export async function processEscrowRefund(
  orderId: string,
  buyerId: string,
  amount: number
): Promise<void> {
  await creditWallet(buyerId, amount, 'REFUND', {
    orderId,
    note: `Escrow refund for order ${orderId} (dispute resolution)`,
    idempotencyKey: `refund-${orderId}-buyer`,
  })
}

// ─── getTransactionHistory ────────────────────────────────────────────────────
export async function getTransactionHistory(userId: string): Promise<LedgerEntry[]> {
  const supabase = getServiceClient()
  const { data, error } = await supabase
    .from('wallet_transactions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw new Error(`[ledger] getTransactionHistory failed: ${error.message}`)
  return (data ?? []).map(mapEntry)
}

// ─── Mapper ──────────────────────────────────────────────────────────────────
function mapEntry(row: any): LedgerEntry {
  return {
    id:              row.id,
    userId:          row.user_id,
    orderId:         row.order_id,
    milestoneId:     row.milestone_id,
    type:            row.type,
    amount:          Number(row.amount),
    balanceAfter:    Number(row.balance_after),
    note:            row.note,
    idempotencyKey:  row.idempotency_key,
    createdAt:       new Date(row.created_at),
  }
}
