import type { Metadata } from 'next'
import Script from 'next/script'
import { Exo_2, Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Providers } from '@/components/providers/Providers'
import { CustomCursor } from '@/components/cursor/CustomCursor'
import { ScrollProgressBar } from '@/components/ui/ScrollProgressBar'
import { CookieConsentBanner } from '@/components/common/CookieConsentBanner'

// Only load the two fonts actually used: Exo 2 (headings) + Plus Jakarta Sans (body)
// Inter and JetBrains Mono were generating extra render-blocking CSS chunks
const exo2 = Exo_2({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-exo2',
  display: 'swap',
})
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://asteriafreelance.com'),
  title: {
    default: 'Asteria Freelance — Tunisia & Global Digital Escrow Marketplace',
    template: '%s | Asteria Freelance',
  },
  description: 'Tunisia’s premier digital freelance marketplace. Connect with vetted freelancers, fund milestone escrow safely, and pay via TND (Flouci/Konnect) or USD (Stripe).',
  keywords: [
    'Asteria Freelance',
    'Asteria Club',
    'Freelancers in Tunisia',
    'Escrow Marketplace Tunisia',
    'Web Development Tunisia',
    'Graphic Design Tunisia',
    'AI Freelancers',
    'TND Escrow Payments',
    'Flouci Freelance',
    'Konnect Escrow',
  ],
  authors: [{ name: 'Asteria Technologies' }],
  creator: 'Asteria',
  publisher: 'Asteria',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    title: 'Asteria Freelance — Learn. Create. Connect. Transact.',
    description: 'Empowering Tunisian and global digital talent with secure escrow payments, mathematical double-entry ledgers, and verified gigs.',
    url: 'https://asteriafreelance.com',
    siteName: 'Asteria Freelance',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'Asteria Freelance Marketplace',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Asteria Freelance — Digital Marketplace & Escrow',
    description: 'Empowering Tunisian and global talent with secure escrow payments and verified gigs.',
    images: ['/logo.png'],
    creator: '@AsteriaClub',
  },
  icons: {
    icon: '/icon.png',
    shortcut: '/icon.png',
    apple: '/logo.png',
  },
  verification: {
    google: [
      'vpRLb_4omj-Nnk1eYBoUcj569uHIj3uu37BUr2BDzuE',
      'UjvPHiod5OhQr55JBY3ef5nC9G1ZpIMRJ98lrz-WXYQ',
    ],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${exo2.variable} ${jakarta.variable}`}>
      <head>
        {/* dns-prefetch only — preconnect was flagged as unused by Lighthouse on the homepage */}
        <link rel="dns-prefetch" href="https://tvuktwtartbqmggndinu.supabase.co" />
        <meta name="google-site-verification" content="vpRLb_4omj-Nnk1eYBoUcj569uHIj3uu37BUr2BDzuE" />
        <meta name="google-site-verification" content="UjvPHiod5OhQr55JBY3ef5nC9G1ZpIMRJ98lrz-WXYQ" />
      </head>
      <body className="font-body bg-white text-black antialiased">
        <Providers>
          <CustomCursor />
          <ScrollProgressBar />
          <Navbar />
          <main>{children}</main>
          <Footer />
          <CookieConsentBanner />
        </Providers>
        <Script
          src={`https://www.google.com/recaptcha/enterprise.js?render=${process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '6Lct-sotAAAAAJP3cxUTmxs5JYE_TTzH9pG0kPS7'}`}
          strategy="lazyOnload"
        />
      </body>
    </html>
  )
}
