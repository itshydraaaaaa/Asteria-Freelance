/**
 * lib/email.ts — Asteria Email Notification Service (via Resend)
 *
 * Sends email notifications for time-sensitive platform events.
 * The in-app bell dropdown remains the primary notification surface;
 * email is a backup channel for events users must not miss.
 */

import 'server-only'

let resendClient: any = null

async function getResendClient() {
  if (resendClient) return resendClient
  if (!process.env.RESEND_API_KEY) return null

  try {
    // Dynamic import to prevent build-time static resolution issues
    const resendPkg = 'resend'
    const { Resend } = await import(/* webpackIgnore: true */ resendPkg)
    resendClient = new Resend(process.env.RESEND_API_KEY)
  } catch {
    resendClient = null
  }
  return resendClient
}

export type EmailEvent =
  | 'ORDER_PLACED'
  | 'DELIVERABLE_SUBMITTED'
  | 'ORDER_COMPLETED'
  | 'DISPUTE_OPENED'
  | 'KYC_APPROVED'
  | 'KYC_REJECTED'
  | 'MILESTONE_FUNDED'
  | 'MILESTONE_RELEASED'

interface EmailPayload {
  to: string
  event: EmailEvent
  data: Record<string, any>
}

// ─── Email Templates ──────────────────────────────────────────────────────────

function renderTemplate(event: EmailEvent, data: Record<string, any>): { subject: string; html: string } {
  const base = (content: string) => `
    <div style="font-family:'Plus Jakarta Sans',sans-serif;max-width:600px;margin:0 auto;background:#f4f8f8;padding:32px;border-radius:16px;">
      <div style="background:#0a3a40;padding:24px;border-radius:12px;text-align:center;margin-bottom:24px;">
        <h1 style="color:#60c8d4;margin:0;font-size:24px;letter-spacing:0.05em;">✦ ASTERIA</h1>
        <p style="color:#a0d8e0;margin:4px 0 0;font-size:12px;">Freelance Marketplace</p>
      </div>
      ${content}
      <p style="color:#6b7280;font-size:12px;text-align:center;margin-top:32px;">
        You received this because you're registered on Asteria Freelance.
        <a href="https://asteria.com/dashboard/settings" style="color:#11606e;">Manage notifications</a>
      </p>
    </div>
  `

  const templates: Record<EmailEvent, { subject: string; body: string }> = {
    ORDER_PLACED: {
      subject: `New Order — ${data.gigTitle ?? 'Service'} (${data.amount} TND)`,
      body: `
        <h2 style="color:#0a3a40">You have a new order! 🎉</h2>
        <p style="color:#374151"><strong>${data.buyerName}</strong> has placed an order for your service.</p>
        <div style="background:#fff;border-radius:8px;padding:16px;margin:16px 0;">
          <p><strong>Service:</strong> ${data.gigTitle}</p>
          <p><strong>Amount in Escrow:</strong> ${data.amount} TND</p>
          <p><strong>Your Net Payout:</strong> ${(data.amount * 0.88).toFixed(2)} TND (88%)</p>
        </div>
        <a href="https://asteria.com/dashboard/orders/${data.orderId}" style="background:#11606e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">View Order →</a>
      `,
    },

    DELIVERABLE_SUBMITTED: {
      subject: `Deliverable Ready for Review — ${data.gigTitle ?? 'Order'}`,
      body: `
        <h2 style="color:#0a3a40">Your freelancer has submitted work 📦</h2>
        <p style="color:#374151">Review the deliverable and approve to release payment, or request revisions.</p>
        <a href="https://asteria.com/dashboard/orders/${data.orderId}" style="background:#11606e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">Review Deliverable →</a>
      `,
    },

    ORDER_COMPLETED: {
      subject: `Payment Released — ${data.netPayout ?? data.amount * 0.88} TND Credited to Your Wallet`,
      body: `
        <h2 style="color:#0a3a40">Payment received! 💰</h2>
        <p style="color:#374151"><strong>${data.netPayout ?? (data.amount * 0.88).toFixed(2)} TND</strong> has been credited to your Asteria wallet.</p>
        <a href="https://asteria.com/dashboard" style="background:#11606e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">View Wallet →</a>
      `,
    },

    DISPUTE_OPENED: {
      subject: `Dispute Opened on Order — Admin Review Initiated`,
      body: `
        <h2 style="color:#dc2626">A dispute has been opened ⚠️</h2>
        <p style="color:#374151">Order <strong>${data.orderId}</strong> has been escalated to our admin team for review. Funds remain in escrow until resolved.</p>
        <p style="color:#6b7280">Our team typically resolves disputes within 48 hours.</p>
      `,
    },

    KYC_APPROVED: {
      subject: `Identity Verified — Your KYC Badge is Active ✓`,
      body: `
        <h2 style="color:#059669">You're verified! ✓</h2>
        <p style="color:#374151">Your identity has been verified. Your profile now displays the Asteria Verified badge, building trust with clients.</p>
        <a href="https://asteria.com/dashboard" style="background:#11606e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">View Dashboard →</a>
      `,
    },

    KYC_REJECTED: {
      subject: `Identity Verification Update — Action Required`,
      body: `
        <h2 style="color:#dc2626">Verification needs attention</h2>
        <p style="color:#374151">Your KYC submission was reviewed and requires corrections:</p>
        <div style="background:#fef2f2;border:1px solid #fca5a5;border-radius:8px;padding:16px;">
          <p style="color:#dc2626;margin:0">${data.rejectionReason ?? 'Documents could not be verified. Please resubmit with clearer images.'}</p>
        </div>
        <a href="https://asteria.com/dashboard/kyc" style="background:#11606e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin-top:16px;">Resubmit KYC →</a>
      `,
    },

    MILESTONE_FUNDED: {
      subject: `Milestone Funded — Start Working on "${data.milestoneTitle}"`,
      body: `
        <h2 style="color:#0a3a40">Milestone funded! 🚀</h2>
        <p style="color:#374151"><strong>${data.milestoneTitle}</strong> (${data.milestoneAmount} TND) has been funded and is in escrow. Begin work and submit when ready.</p>
        <a href="https://asteria.com/dashboard/orders/${data.orderId}" style="background:#11606e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">View Milestone →</a>
      `,
    },

    MILESTONE_RELEASED: {
      subject: `Milestone Payment — ${data.netPayout} TND Credited to Wallet`,
      body: `
        <h2 style="color:#0a3a40">Milestone payment released! 💸</h2>
        <p style="color:#374151"><strong>${data.netPayout} TND</strong> (88% net) has been credited for milestone: <em>${data.milestoneTitle}</em>.</p>
        <a href="https://asteria.com/dashboard" style="background:#11606e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;">View Wallet →</a>
      `,
    },
  }

  const t = templates[event]
  return {
    subject: t.subject,
    html: base(t.body),
  }
}

// ─── sendEmail ────────────────────────────────────────────────────────────────
export async function sendEmail({ to, event, data }: EmailPayload): Promise<void> {
  if (!process.env.RESEND_API_KEY || !to) return

  try {
    const client = await getResendClient()
    if (!client) return

    const { subject, html } = renderTemplate(event, data)

    await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'notifications@asteria.com',
      to,
      subject,
      html,
    })
  } catch (err) {
    console.error(`[email] Failed to send ${event} to ${to}:`, err)
  }
}

export async function sendPasswordResetEmail(to: string, name: string, resetLink: string): Promise<void> {
  if (!process.env.RESEND_API_KEY || !to) return

  try {
    const client = await getResendClient()
    if (!client) return

    await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'security@asteria.com',
      to,
      subject: 'Reset your Asteria password',
      html: `
        <div style="font-family:'Plus Jakarta Sans',sans-serif;max-width:600px;margin:0 auto;background:#f4f8f8;padding:32px;border-radius:16px;">
          <h2 style="color:#0a3a40">Password Reset Request</h2>
          <p style="color:#374151">Hi ${name}, click below to set a new password for your Asteria account:</p>
          <a href="${resetLink}" style="background:#11606e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0;">Reset Password →</a>
          <p style="color:#6b7280;font-size:12px;">If you did not request this, please ignore this email.</p>
        </div>
      `,
    })
  } catch (err) {
    console.error(`[email] Failed to send password reset email to ${to}:`, err)
  }
}

export async function sendVerificationEmail(to: string, name: string, verifyLink: string): Promise<void> {
  if (!process.env.RESEND_API_KEY || !to) return

  try {
    const client = await getResendClient()
    if (!client) return

    await client.emails.send({
      from: process.env.RESEND_FROM_EMAIL ?? 'welcome@asteria.com',
      to,
      subject: 'Welcome to Asteria — Verify your email',
      html: `
        <div style="font-family:'Plus Jakarta Sans',sans-serif;max-width:600px;margin:0 auto;background:#f4f8f8;padding:32px;border-radius:16px;">
          <h2 style="color:#0a3a40">Welcome to Asteria, ${name}!</h2>
          <p style="color:#374151">Please confirm your email address to activate all platform features:</p>
          <a href="${verifyLink}" style="background:#11606e;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;display:inline-block;margin:16px 0;">Verify Email →</a>
        </div>
      `,
    })
  } catch (err) {
    console.error(`[email] Failed to send verification email to ${to}:`, err)
  }
}
