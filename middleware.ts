import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  })

  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  if (!isDashboard) return response

  // ── Demo Auth (dev/testing only, gated by env flag) ────────────────────────
  if (process.env.ENABLE_DEMO_AUTH === 'true') {
    const demoUserId = request.cookies.get('demo_user_id')?.value
    if (demoUserId) {
      return response
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // ── Production: Validate real Supabase Auth session ───────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
    // If Supabase credentials are placeholder in local testing, check demo cookie or redirect
    const demoUserId = request.cookies.get('demo_user_id')?.value
    if (demoUserId) return response
    return NextResponse.redirect(new URL('/login', request.url))
  }

  try {
    const supabase = createServerClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            request.cookies.set({ name, value, ...options })
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            request.cookies.set({ name, value: '', ...options })
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
  matcher: ['/dashboard/:path*'],
}