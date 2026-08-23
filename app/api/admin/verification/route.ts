import { NextRequest, NextResponse } from 'next/server'
import { auth }           from '@/lib/auth'
import { db }             from '@/lib/db'
import { requireAdmin }   from '@/lib/authz'
import { sendEmail }      from '@/lib/email'

/**
 * GET /api/admin/verification — List all KYC submissions
 * POST /api/admin/verification — Approve, Reject, or Request Resubmission for a KYC application
 */

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await auth()
    const authzError = requireAdmin(session)
    if (authzError) return authzError

    const verifications = await db.verification.findMany({})

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    let supabase: any = null
    if (supabaseUrl && serviceKey) {
      const { createClient } = await import('@supabase/supabase-js')
      supabase = createClient(supabaseUrl, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } })
    }

    const signedVerifications = await Promise.all(
      verifications.map(async (v: any) => {
        let front = v.idFrontUrl
        let back = v.idBackUrl
        let selfie = v.selfieUrl

        if (supabase) {
          try {
            if (front && !front.startsWith('data:') && !front.startsWith('http')) {
              const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(front, 900)
              if (data?.signedUrl) front = data.signedUrl
            }
            if (back && !back.startsWith('data:') && !back.startsWith('http')) {
              const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(back, 900)
              if (data?.signedUrl) back = data.signedUrl
            }
            if (selfie && !selfie.startsWith('data:') && !selfie.startsWith('http')) {
              const { data } = await supabase.storage.from('kyc-documents').createSignedUrl(selfie, 900)
              if (data?.signedUrl) selfie = data.signedUrl
            }
          } catch {}
        }

        return {
          ...v,
          idFrontUrl: front,
          idBackUrl: back,
          selfieUrl: selfie,
        }
      })
    )

    // Log that an admin listed KYC submissions
    await db.auditLog.create({
      data: {
        adminId:   session!.user.id,
        adminName: session!.user.name || 'Admin',
        action:    'KYC_LIST_VIEWED',
        details:   `Admin viewed KYC submission list (${verifications.length} items)`,
      }
    }).catch(() => {})

    return NextResponse.json({ verifications: signedVerifications })
  } catch (err) {
    console.error('GET /api/admin/verification:', err)
    return NextResponse.json({ error: 'Failed to fetch verifications' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const authzError = requireAdmin(session)
    if (authzError) return authzError

    const body = await req.json()
    const { id, status, rejectionReason } = body

    if (!id || !['APPROVED', 'REJECTED', 'RESUBMISSION_REQUIRED'].includes(status)) {
      return NextResponse.json({ error: 'Invalid verification status decision' }, { status: 400 })
    }

    if ((status === 'REJECTED' || status === 'RESUBMISSION_REQUIRED') && !rejectionReason) {
      return NextResponse.json({ error: 'A rejection reason is required' }, { status: 400 })
    }

    const updated = await db.verification.update({
      where: { id },
      data: {
        status,
        reviewedBy:      session!.user.id,
        rejectionReason: rejectionReason || undefined,
        reviewedAt:      new Date(),
      } as any
    })

    if (!updated) {
      return NextResponse.json({ error: 'Verification record not found' }, { status: 404 })
    }

    // Synchronize verifiedStatus on user record
    const user = await db.user.update({
      where: { id: updated.userId },
      data: { verifiedStatus: status === 'APPROVED' ? 'APPROVED' : 'REJECTED' },
    })

    // Write to audit log
    await db.auditLog.create({
      data: {
        adminId:   session!.user.id,
        adminName: session!.user.name || 'Admin',
        action:    `KYC_${status}`,
        targetId:  id,
        details:   `KYC for user ${updated.userId} ${status.toLowerCase()}${rejectionReason ? `: ${rejectionReason}` : ''}`,
      }
    })

    // Send transactional notification email
    if (user?.email) {
      if (status === 'APPROVED') {
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
            reason: rejectionReason || 'Document did not meet quality/clarity requirements.',
          },
        }).catch(() => {})
      }
    }

    return NextResponse.json({
      verification: updated,
      message: `Verification ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully.`,
    })
  } catch (err) {
    console.error('POST /api/admin/verification:', err)
    return NextResponse.json({ error: 'Failed to update verification status' }, { status: 500 })
  }
}
