/**
 * lib/ledgerCore.ts — Framework-Agnostic Mathematical Ledger Core
 *
 * Contains 100% pure functional primitives for financial math, escrow fee splits,
 * double-entry ledger invariants, and canonical lock sorting.
 * Zero HTTP, framework, or runtime dependencies.
 */

export const DEFAULT_PLATFORM_FEE_RATE = 0.12

export interface EscrowSplitResult {
  totalAmount: number
  sellerPayout: number
  platformFee: number
  platformFeeRate: number
}

/**
 * Calculates deterministic escrow splits without penny rounding loss.
 */
export function calculateEscrowSplit(
  totalAmount: number,
  platformFeeRate: number = DEFAULT_PLATFORM_FEE_RATE
): EscrowSplitResult {
  if (totalAmount <= 0) {
    throw new Error('Total escrow amount must be strictly positive')
  }

  const roundedTotal = Math.round(totalAmount * 100) / 100
  const platformFee = Math.round(roundedTotal * platformFeeRate * 100) / 100
  const sellerPayout = Math.round((roundedTotal - platformFee) * 100) / 100

  // Arithmetic invariant: sellerPayout + platformFee must equal roundedTotal
  if (Math.round((sellerPayout + platformFee) * 100) / 100 !== roundedTotal) {
    throw new Error(`Escrow split invariant violated: ${sellerPayout} + ${platformFee} !== ${roundedTotal}`)
  }

  return {
    totalAmount: roundedTotal,
    sellerPayout,
    platformFee,
    platformFeeRate,
  }
}

/**
 * Validates double-entry transaction arithmetic invariant.
 */
export function validateLedgerInvariant(
  balanceBefore: number,
  deltaAmount: number,
  balanceAfter: number
): boolean {
  const expected = Math.round((balanceBefore + deltaAmount) * 100) / 100
  const actual = Math.round(balanceAfter * 100) / 100
  return expected === actual
}

/**
 * Canonical user lock key sorter to eliminate distributed database deadlocks.
 */
export function sortCanonicalUserLocks(userIds: string[]): string[] {
  return Array.from(new Set(userIds.filter(Boolean))).sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
}
