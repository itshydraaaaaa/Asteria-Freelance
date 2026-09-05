import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const isDev = process.env.NODE_ENV !== 'production'

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://cdn.jsdelivr.net https://sandbox.flouci.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://utfs.io https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://images.unsplash.com https://*.stripe.com https://*.supabase.co;
    font-src 'self' https://fonts.gstatic.com;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.exchangerate-api.com https://sandbox.flouci.com https://sandbox.gateway.konnect.network;
    frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://sandbox.flouci.com https://sandbox.gateway.konnect.network;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim()

  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('Content-Security-Policy', cspHeader)

  let response = NextResponse.next({
    request: { headers: requestHeaders },
  })

  // Security Headers
  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('Cross-Origin-Opener-Policy', 'same-origin')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')

  const isDashboard = request.nextUrl.pathname.startsWith('/dashboard')
  if (!isDashboard) return response

  // ── 1. Check signed session token ──────────────────────────────────────────
  const sessionToken = request.cookies.get('auth_session_token')?.value
  if (sessionToken && sessionToken.includes('.')) {
    return response
  }

  // ── 2. Validate real Supabase Auth session ─────────────────────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl.includes('placeholder')) {
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
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/static assets (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}