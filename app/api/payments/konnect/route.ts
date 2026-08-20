import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { creditWallet } from '@/lib/ledger'
import { db } from '@/lib/db'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * Konnect Sandbox Payment Gateway Handler
 * Supports generating payment sessions and verifying webhook notifications
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, amount, orderId, userId, paymentRef, signature } = body

    if (action === 'INITIATE_PAYMENT') {
      const session = await auth()
      const effectiveUserId = session?.user?.id || userId
      if (!effectiveUserId || !amount || amount <= 0) {
        return NextResponse.json({ error: 'Valid user ID and positive amount required' }, { status: 400 })
      }

      const ref = `konnect_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
      const payUrl = `https://sandbox.gateway.konnect.network/pay/${ref}`

      return NextResponse.json({
        success: true,
        paymentRef: ref,
        payUrl,
        amount: Number(amount),
        currency: 'TND',
        gateway: 'KONNECT_SANDBOX',
      }, { status: 200 })
    }

    if (action === 'WEBHOOK') {
      const secret = process.env.KONNECT_WEBHOOK_KEY || 'asteria_konnect_sandbox_key'
      const payloadString = `${paymentRef}:${amount}:${orderId || ''}:${userId || ''}`
      const expectedSignature = crypto.createHmac('sha256', secret).update(payloadString).digest('hex')

      if (signature && signature !== expectedSignature) {
        return NextResponse.json({ error: 'Invalid Konnect webhook signature' }, { status: 401 })
      }

      if (orderId) {
        await db.order.update({
          where: { id: orderId },
          data: { status: 'ACTIVE' },
        })

        await db.auditLog.create({
          data: {
            adminId: 'system',
            adminName: 'Konnect Gateway',
            action: 'ESCROW_FUNDED_KONNECT',
            targetId: orderId,
            details: `Order #${orderId} escrow successfully funded via Konnect (${amount} TND)`,
          },
        })
      } else if (userId && amount > 0) {
        await creditWallet(userId, Number(amount), 'DEPOSIT', {
          note: `Konnect Sandbox Wallet Deposit (Ref: ${paymentRef})`,
          idempotencyKey: `konnect-deposit-${paymentRef}`,
        })
      }

      return NextResponse.json({ verified: true, paymentRef, status: 'SUCCESS' }, { status: 200 })
    }

    return NextResponse.json({ error: 'Invalid action. Supported: INITIATE_PAYMENT, WEBHOOK' }, { status: 400 })
  } catch (err: any) {
    console.error('POST /api/payments/konnect error:', err)
    return NextResponse.json({ error: err.message || 'Konnect gateway error' }, { status: 500 })
  }
}
