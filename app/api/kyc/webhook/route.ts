import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { sendEmail } from '@/lib/email'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

/**
 * POST /api/kyc/webhook — Automated KYC Provider Webhook Endpoint
 * Supports callbacks from automated providers (e.g. Sumsub / Persona) with HMAC signature checks.
 */
export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text()
    const signature = req.headers.get('x-kyc-signature') || req.headers.get('x-webhook-signature')

    // Webhook signature verification if secret is configured
    const secret = process.env.KYC_WEBHOOK_SECRET || 'asteria_kyc_webhook_secret'
    const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

    if (signature && signature !== expectedSignature) {
      return NextResponse.json({ error: 'Invalid KYC webhook signature' }, { status: 401 })
    }

    const payload = JSON.parse(rawBody || '{}')
    const { userId, verificationId, reviewResult, reviewRejectType, reason } = payload

    if (!userId) {
      return NextResponse.json({ error: 'Missing userId in payload' }, { status: 400 })
    }

    const isApproved = reviewResult === 'APPROVED' || reviewResult === 'GREEN'
    const finalStatus = isApproved ? 'APPROVED' : 'REJECTED'

    // Update verification record
    let verif = null
    try {
      if (verificationId) {
        verif = await db.verification.update({
          where: { id: verificationId },
          data: {
            status: finalStatus,
            reviewedBy: 'KYC_AUTOMATED_PROVIDER',
            rejectionReason: !isApproved ? (reason || reviewRejectType || 'Automated identity verification check failed.') : undefined,
            reviewedAt: new Date(),
          } as any,
        })
      } else {
        const existing = await db.verification.findUnique({ where: { userId } })
        if (existing) {
          verif = await db.verification.update({
            where: { id: existing.id },
            data: {
              status: finalStatus,
              reviewedBy: 'KYC_AUTOMATED_PROVIDER',
              rejectionReason: !isApproved ? (reason || 'Automated check failed.') : undefined,
              reviewedAt: new Date(),
            } as any,
          })
        }
      }
    } catch {}

    // Update user profile status
    const user = await db.user.update({
      where: { id: userId },
      data: { verifiedStatus: finalStatus },
    })

    // Log audit trail
    await db.auditLog.create({
      data: {
        adminId: 'system',
        adminName: 'Automated KYC Engine',
        action: `KYC_${finalStatus}_WEBHOOK`,
        targetId: userId,
        details: `Automated KYC verification result for user #${userId}: ${finalStatus}`,
      },
    })

    // Send transactional notification email
    if (user?.email) {
      if (isApproved) {
        await sendEmail({
          to: user.email,
          event: 'KYC_APPROVED',
          data: { name: user.name || 'User' },
        }).catch(() => {})
      } else {
        await sendEmail({
          to: user.email,
          event: 'KYC_REJECTED',
          data: {
            name: user.name || 'User',
            reason: reason || 'Document image clarity or identity match threshold not met.',
          },
        }).catch(() => {})
      }
    }

    return NextResponse.json({ success: true, userId, status: finalStatus }, { status: 200 })
  } catch (err: any) {
    console.error('POST /api/kyc/webhook error:', err)
    return NextResponse.json({ error: err.message || 'KYC webhook processing failed' }, { status: 500 })
  }
}
