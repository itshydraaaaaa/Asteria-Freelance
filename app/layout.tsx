import type { Metadata } from 'next'
import { Exo_2, Inter, JetBrains_Mono, Plus_Jakarta_Sans } from 'next/font/google'
import { headers } from 'next/headers'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Providers } from '@/components/providers/Providers'
import { CustomCursor } from '@/components/cursor/CustomCursor'
import { ScrollProgressBar } from '@/components/ui/ScrollProgressBar'
import { CookieConsentBanner } from '@/components/common/CookieConsentBanner'

const exo2 = Exo_2({
  subsets: ['latin'],
  weight: ['300', '400', '600', '700'],
  variable: '--font-exo2',
})
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
})
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains',
})
const jakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-jakarta',
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
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  let supabaseOrigin = ''
  try {
    const rawUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    if (rawUrl && !rawUrl.includes('placeholder')) {
      supabaseOrigin = new URL(rawUrl).origin
    }
  } catch {}

  return (
    <html lang="en" className={`${exo2.variable} ${inter.variable} ${jetbrains.variable} ${jakarta.variable}`}>
      <head>
        {supabaseOrigin && (
          <>
            <link rel="preconnect" href={supabaseOrigin} crossOrigin="anonymous" />
            <link rel="dns-prefetch" href={supabaseOrigin} />
          </>
        )}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="https://fonts.googleapis.com" />
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
      </body>
    </html>
  )
}
