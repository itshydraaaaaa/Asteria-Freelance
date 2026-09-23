const isDev = process.env.NODE_ENV !== 'production'

const cspHeader = `
  default-src 'self';
  script-src 'self' 'unsafe-inline' 'unsafe-eval' 'strict-dynamic' https://js.stripe.com https://cdn.jsdelivr.net https://sandbox.flouci.com https://www.google.com/recaptcha/ https://www.gstatic.com/recaptcha/;
  style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
  img-src 'self' blob: data: https://utfs.io https://avatars.githubusercontent.com https://lh3.googleusercontent.com https://images.unsplash.com https://*.stripe.com https://*.supabase.co https://www.gstatic.com/recaptcha/;
  font-src 'self' https://fonts.gstatic.com;
  connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://api.exchangerate-api.com https://sandbox.flouci.com https://sandbox.gateway.konnect.network https://www.google.com/recaptcha/ https://recaptchaenterprise.googleapis.com;
  frame-src 'self' https://js.stripe.com https://hooks.stripe.com https://sandbox.flouci.com https://sandbox.gateway.konnect.network https://www.google.com/recaptcha/ https://recaptcha.google.com/recaptcha/;
  object-src 'none';
  base-uri 'self';
  form-action 'self';
  frame-ancestors 'none';
  upgrade-insecure-requests;
`.replace(/\s{2,}/g, ' ').trim()

const config = {
  // Lenis ships pre-compiled with Babel class/spread transforms — SWC must re-transpile it
  // to target modern browsers and eliminate the 12 KiB legacy JS chunk (2117-*.js)
  transpilePackages: ['lenis'],

  // Strip React prop-types and console.log in production to reduce bundle size
  compiler: {
    reactRemoveProperties: process.env.NODE_ENV === 'production',
    removeConsole: process.env.NODE_ENV === 'production' ? { exclude: ['error', 'warn'] } : false,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      { protocol: 'https', hostname: 'utfs.io' },
      { protocol: 'https', hostname: 'avatars.githubusercontent.com' },
      { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: '*.supabase.co' },
      { protocol: 'https', hostname: 'tvuktwtartbqmggndinu.supabase.co' },
    ],
  },
  experimental: {
    // Inline critical CSS and defer the rest — eliminates the render-blocking CSS request
    optimizeCss: true,
    optimizePackageImports: ['lucide-react', 'framer-motion', '@supabase/supabase-js'],
    serverActions: {
      allowedOrigins: [
        'localhost:3000',
        'localhost:5000',
        '127.0.0.1:3000',
        '127.0.0.1:5000',
        '*.vercel.app',
        'asteriafreelance.vercel.app',
        process.env.VERCEL_URL ?? '',
      ].filter(Boolean),
    },
  },
  async headers() {
    return [
      {
        source: '/:all*(svg|jpg|jpeg|png|webp|avif|ico|woff|woff2)',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: cspHeader },
          { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
        ],
      },
    ]
  },
}

export default config
