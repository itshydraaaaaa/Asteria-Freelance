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

    const skillsList = Array.isArray(skills) ? skills.join(', ') : (skills || 'General best practices')

    const getFallbackText = (): string => {
      switch (type) {
        case 'GIG_DESCRIPTION':
          return `### Professional Service Overview\n\nI offer production-grade **${title || 'Service'}** tailored for modern businesses across Tunisia and the MENA region.\n\n#### What's Included in this Service:\n- End-to-end architecture & implementation utilizing ${skillsList}.\n- Robust security standards, responsive layout, and clean documentation.\n- Comprehensive quality assurance & cross-browser verification.\n- Revision rounds with 100% escrow payment protection.\n\n#### Why Work With Me:\n- Verified professional track record on Asteria.\n- Transparent milestone tracking & prompt communication.\n- 100% money-back escrow security.`
        case 'JOB_BRIEF':
          return `### Project Scope & Objectives\n\nWe are looking for an experienced freelancer to deliver **${title || 'Project'}** in the **${category || 'Technology'}** category.\n\n#### Core Requirements:\n- Demonstrated expertise in: ${skillsList}.\n- Ability to meet milestone delivery commitments within agreed timeframe.\n- Clean architecture, adherence to design/code standards, and daily communication.\n\n#### Budget & Escrow Terms:\n- Budget: ${budget ? budget + ' TND' : 'Competitive rate'} locked in 100% Asteria Escrow upon contract initiation.`
        case 'PROPOSAL_COVER_LETTER':
          return `Hello! I reviewed your project requirements for **${title || 'the project'}** and am confident in delivering top-tier results.\n\nI have extensive experience working with ${skillsList}, ensuring high-quality, production-ready deliverables on schedule.\n\nMy proposed milestones include initial setup, core functionality, iterative review rounds, and final handoff with complete documentation.\n\nLooking forward to discussing the project specifics!`
        case 'MILESTONE_BREAKDOWN':
          return `1. **Phase 1: Architecture & Foundation (30%)** — Core setup, schema design, and wireframe approval.\n2. **Phase 2: Core Feature Implementation (50%)** — Main business logic, component integration, and milestone deliverable testing.\n3. **Phase 3: Final Polish & Handoff (20%)** — Revisions, deployment verification, and documentation transfer.`
        default:
          return `Draft prepared for ${title || 'your request'} focusing on high quality, verified milestones, and transparent delivery.`
      }
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY
    if (!apiKey) {
      return NextResponse.json({
        success: true,
        generatedText: getFallbackText(),
        type,
        aiAssisted: false,
        disclosure: '✦ Generated with Asteria Smart Template Engine (Configure GEMINI_API_KEY for dynamic AI generation)',
      }, { status: 200 })
    }

    const prompt = `You are Asteria AI, an assistant for an elite freelance marketplace in Tunisia/MENA. Generate high-quality professional text for the following request:
Type: ${type}
Title: ${title || 'N/A'}
Category: ${category || 'N/A'}
Skills: ${skillsList}
Budget: ${budget ? budget + ' TND' : 'N/A'}
Additional Context: ${context || 'N/A'}

Respond with ONLY the polished markdown content, directly usable in the platform without conversational filler.`

    try {
      const aiRes = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 800,
            },
          }),
        }
      )

      if (!aiRes.ok) {
        return NextResponse.json({
          success: true,
          generatedText: getFallbackText(),
          type,
          aiAssisted: false,
          disclosure: '✦ Generated with Asteria Fallback Template Engine',
        }, { status: 200 })
      }

      const aiData = await aiRes.json()
      const generatedText = aiData?.candidates?.[0]?.content?.parts?.[0]?.text?.trim()

      if (!generatedText) {
        return NextResponse.json({
          success: true,
          generatedText: getFallbackText(),
          type,
          aiAssisted: false,
          disclosure: '✦ Generated with Asteria Fallback Template Engine',
        }, { status: 200 })
      }

      return NextResponse.json({
        success: true,
        generatedText,
        type,
        aiAssisted: true,
        disclosure: '✦ Generated with Asteria AI Assistant (Powered by Gemini)',
      }, { status: 200 })
    } catch (apiErr: any) {
      console.warn('Gemini request failed, falling back to smart template:', apiErr?.message)
      return NextResponse.json({
        success: true,
        generatedText: getFallbackText(),
        type,
        aiAssisted: false,
        disclosure: '✦ Generated with Asteria Fallback Template Engine',
      }, { status: 200 })
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'AI generation failed' }, { status: 500 })
  }
}
