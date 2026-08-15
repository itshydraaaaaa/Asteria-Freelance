import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  if (!isDashboard) return response

  // ── Demo Auth (dev/testing only, gated by env flag) ────────────────────────
  // NEVER set ENABLE_DEMO_AUTH=true in production.
  if (process.env.ENABLE_DEMO_AUTH === 'true') {
    const demoUserId = request.cookies.get('demo_user_id')?.value
    if (demoUserId) {
      // Valid demo cookie present — allow through
      return response
    }

    // In demo mode with no cookie, redirect to login rather than auto-setting admin1
    // (removes the previous security hole where all dev requests became admin)
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Production: Validate real Supabase Auth session ───────────────────────
  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options })
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options })
            response = NextResponse.next({ request: { headers: request.headers } })
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    const { data: { user }, error } = await supabase.auth.getUser()

    if (error || !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return response
  } catch (e) {
    console.error('[middleware] Auth validation error:', e)
    return NextResponse.redirect(new URL('/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}