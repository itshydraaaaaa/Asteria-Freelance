/**
 * __tests__/escrow.test.ts
 * Unit tests for escrow math, milestone validation, and rating recalculation.
 * Run with: npx jest --testPathPattern=escrow
 */

// ─── Escrow Math ─────────────────────────────────────────────────────────────

const PLATFORM_FEE_RATE = 0.15

function calculatePayout(amount: number) {
  const sellerPayout = Math.round(amount * (1 - PLATFORM_FEE_RATE) * 100) / 100
  const platformFee  = Math.round(amount * PLATFORM_FEE_RATE * 100) / 100
  return { sellerPayout, platformFee }
}

describe('Escrow Math', () => {
  test('seller receives 85% of order amount', () => {
    const { sellerPayout } = calculatePayout(100)
    expect(sellerPayout).toBe(85.00)
  })

  test('platform receives 15% of order amount', () => {
    const { platformFee } = calculatePayout(100)
    expect(platformFee).toBe(15.00)
  })

  test('payout + fee = full order amount (no rounding loss)', () => {
    const amount = 299
    const { sellerPayout, platformFee } = calculatePayout(amount)
    expect(sellerPayout + platformFee).toBe(amount)
  })

  test('correct split on $79 order', () => {
    const { sellerPayout, platformFee } = calculatePayout(79)
    expect(sellerPayout).toBe(67.15)
    expect(platformFee).toBe(11.85)
    expect(sellerPayout + platformFee).toBe(79)
  })

  test('correct split on $199 order', () => {
    const { sellerPayout, platformFee } = calculatePayout(199)
    expect(sellerPayout).toBe(169.15)
    expect(platformFee).toBe(29.85)
  })

  test('fractional amounts round to 2 decimal places', () => {
    const { sellerPayout, platformFee } = calculatePayout(1)
    // $1 → seller gets $0.85, platform gets $0.15
    expect(sellerPayout).toBe(0.85)
    expect(platformFee).toBe(0.15)
  })
})

// ─── Milestone Validation ────────────────────────────────────────────────────

function validateMilestonePercentages(milestones: Array<{ percentage: number }>): boolean {
  const total = milestones.reduce((sum, m) => sum + m.percentage, 0)
  return total === 100
}

describe('Milestone Percentage Validation', () => {
  test('valid 3-milestone split sums to 100', () => {
    expect(validateMilestonePercentages([
      { percentage: 30 },
      { percentage: 40 },
      { percentage: 30 },
    ])).toBe(true)
  })

  test('invalid split (99%) fails validation', () => {
    expect(validateMilestonePercentages([
      { percentage: 30 },
      { percentage: 40 },
      { percentage: 29 },
    ])).toBe(false)
  })

  test('single milestone at 100% is valid', () => {
    expect(validateMilestonePercentages([{ percentage: 100 }])).toBe(true)
  })

  test('empty milestones (0%) fails validation', () => {
    expect(validateMilestonePercentages([])).toBe(false)
  })

  test('over-allocated milestones (110%) fail validation', () => {
    expect(validateMilestonePercentages([
      { percentage: 50 },
      { percentage: 60 },
    ])).toBe(false)
  })
})

// ─── Weighted Average Rating ─────────────────────────────────────────────────

function recalculateRating(
  currentRating: number,
  currentCount: number,
  newRating: number
): number {
  const newCount = currentCount + 1
  return Number(((currentRating * currentCount + newRating) / newCount).toFixed(1))
}

describe('Weighted Average Rating Recalculation', () => {
  test('first review sets rating exactly', () => {
    const result = recalculateRating(0, 0, 5)
    expect(result).toBe(5.0)
  })

  test('averages correctly with existing reviews', () => {
    // Existing: 5.0 average, 1 review → add a 3 → new avg = (5+3)/2 = 4.0
    expect(recalculateRating(5.0, 1, 3)).toBe(4.0)
  })

  test('result rounds to 1 decimal place', () => {
    // (4.9 * 28 + 4) / 29 = 4.872... → rounds to 4.9
    const result = recalculateRating(4.9, 28, 4)
    expect(result).toBe(4.9)
  })

  test('all 5-star reviews keep 5.0', () => {
    let rating = 5.0
    let count = 0
    for (let i = 0; i < 10; i++) {
      rating = recalculateRating(rating, count, 5)
      count++
    }
    expect(rating).toBe(5.0)
  })

  test('all 1-star reviews result in 1.0', () => {
    let rating = 1.0
    let count = 1
    for (let i = 0; i < 9; i++) {
      rating = recalculateRating(rating, count, 1)
      count++
    }
    expect(rating).toBe(1.0)
  })
})
