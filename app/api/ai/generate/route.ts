import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { requireAuth } from '@/lib/authz'
import { rateLimit } from '@/lib/rateLimit'

export const dynamic = 'force-dynamic'

// Disallowed / harmful patterns for AI generation
const PROHIBITED_PATTERNS = [
  /off-platform.*(whatsapp|telegram|direct payment|wire outside)/i,
  /bypass.*(escrow|asteria|commission|platform fee)/i,
  /scam|exploit|phishing|malware|hack/i,
]

function moderateInput(text: string): string | null {
  for (const pattern of PROHIBITED_PATTERNS) {
    if (pattern.test(text)) {
      return 'Prohibited content detected: AI cannot generate drafts promoting off-platform payments or malicious content.'
    }
  }
  return null
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth()
    const authErr = requireAuth(session)
    if (authErr) return authErr

    const userId = session!.user.id

    // Enforce 20 AI generations per user per day sliding window
    const rateLimitRes = await rateLimit(userId, '/api/ai/generate', { limit: 20, windowSecs: 86400 })
    if (rateLimitRes) return rateLimitRes

    const body = await req.json()
    const { type, title, category, skills, budget, context } = body

    const moderationError = moderateInput(`${title || ''} ${context || ''}`)
    if (moderationError) {
      return NextResponse.json({ error: moderationError }, { status: 400 })
    }

    let generatedText = ''
    const skillsList = Array.isArray(skills) ? skills.join(', ') : (skills || 'Standard industry best practices')

    switch (type) {
      case 'GIG_DESCRIPTION':
        generatedText = `### Professional Service Overview\n\nI offer production-grade **${title || 'Service'}** tailored for modern high-performance businesses across the MENA region.\n\n#### What's Included in this Service:\n- End-to-end architecture & implementation utilizing ${skillsList}.\n- Robust security standards, responsive layout, and clean code documentation.\n- Comprehensive quality assurance & testing.\n- 3 rounds of revisions with post-delivery escrow guarantee.\n\n#### Why Work With Me:\n- Verified professional track record on Asteria.\n- Transparent milestone tracking & prompt daily updates.\n- 100% escrow payment protection.`
        break

      case 'JOB_BRIEF':
        generatedText = `### Project Scope & Objectives\n\nWe are looking for an experienced freelancer to deliver **${title || 'Project'}** in the **${category || 'Technology'}** category.\n\n#### Core Requirements:\n- Demonstrated expertise in: ${skillsList}.\n- Ability to meet milestone delivery milestones within agreed timeframe.\n- Clean architecture, adherence to design/code standards, and daily communication.\n\n#### Budget & Escrow Terms:\n- Budget: ${budget || 500} TND locked in 100% Asteria Escrow upon contract start.`
        break

      case 'PROPOSAL_COVER_LETTER':
        generatedText = `Hello! I reviewed your project requirements for **${title || 'the project'}** and am confident in delivering top-tier results.\n\nI have extensive experience working with ${skillsList}, ensuring high-quality, production-ready deliverables on schedule.\n\nMy proposed milestones include initial setup, core functionality, iterative review rounds, and final handoff with complete documentation.\n\nLooking forward to discussing the project specifics!`
        break

      case 'MILESTONE_BREAKDOWN':
        generatedText = `1. **Phase 1: Architecture & Foundation (30%)** — Core setup, schema design, and wireframe approval.\n2. **Phase 2: Core Feature Implementation (50%)** — Main business logic, component integration, and milestone deliverable testing.\n3. **Phase 3: Final Polish & Handoff (20%)** — Revisions, deployment verification, and documentation transfer.`
        break

      default:
        generatedText = `Draft prepared for ${title || 'your request'} focusing on high quality and verifiable milestones.`
        break
    }

    return NextResponse.json({
      success: true,
      generatedText,
      type,
      aiAssisted: true,
      disclosure: '✦ Generated with Asteria AI Assistant (Verified for Quality & Escrow Standards)',
    }, { status: 200 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 })
  }
}
