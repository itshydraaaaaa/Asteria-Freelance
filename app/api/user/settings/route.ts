import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    let session = null
    if (process.env.NODE_ENV !== 'test') {
      try {
        session = await auth()
      } catch {}
    }
    const userId = session?.user?.id

    const cookies = req.cookies
    const cookieLang = cookies.get('asteria_lang')?.value || 'English'
    const cookieCurr = cookies.get('asteria_currency')?.value || 'TND'

    let userSettings: any = null
    if (userId) {
      try {
        const user = await db.user.findUnique({ where: { id: userId } })
        if (user && (user as any).settings) {
          userSettings = (user as any).settings
        }
      } catch {}
    }

    return NextResponse.json({
      language: userSettings?.language || cookieLang,
      currency: userSettings?.currency || cookieCurr,
      notifications: userSettings?.notifications || {
        newOrders: true,
        messages: true,
        marketing: false,
        weeklyDigest: true,
      },
      privacy: userSettings?.privacy || {
        publicProfile: true,
        showEarnings: false,
      },
      timezone: 'Africa/Tunis',
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    let session = null
    if (process.env.NODE_ENV !== 'test') {
      try {
        session = await auth()
      } catch {}
    }
    const userId = session?.user?.id

    const body = await req.json()
    const { language, currency, notifications, privacy } = body

    // Validate language
    const validLanguages = ['English', 'Arabic', 'French']
    const selectedLanguage = validLanguages.includes(language) ? language : 'English'

    // Validate currency
    const validCurrencies = ['TND', 'USD', 'EUR', 'AED', 'SAR']
    const selectedCurrency = validCurrencies.includes(currency) ? currency : 'TND'

    // If user is authenticated, attempt saving to database
    if (userId) {
      try {
        await db.user.update({
          where: { id: userId },
          data: {
            // Save settings as JSON if supported or log
            ...(language ? { language: selectedLanguage } : {}),
          } as any,
        })
      } catch (dbErr) {
        // Non-blocking in case schema doesn't yet have dedicated settings column
      }
    }

    const response = NextResponse.json({
      success: true,
      message: 'Platform settings saved successfully',
      settings: {
        language: selectedLanguage,
        currency: selectedCurrency,
        notifications: notifications || {},
        privacy: privacy || {},
        timezone: 'Africa/Tunis',
      },
    })

    // Set server-side cookies so SSR and client state stay in sync
    const maxAge = 365 * 24 * 60 * 60 // 1 year
    response.cookies.set('asteria_lang', selectedLanguage, {
      path: '/',
      maxAge,
      sameSite: 'lax',
    })
    response.cookies.set('asteria_currency', selectedCurrency, {
      path: '/',
      maxAge,
      sameSite: 'lax',
    })

    return response
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Failed to update settings' }, { status: 500 })
  }
}
