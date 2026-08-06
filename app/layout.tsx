import type { Metadata } from 'next'
import { Exo_2, Inter, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { Providers } from '@/components/providers/Providers'
import { CustomCursor } from '@/components/cursor/CustomCursor'
import { ScrollProgressBar } from '@/components/ui/ScrollProgressBar'

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

export const metadata: Metadata = {
  title: 'Asteria Freelance — Elite Microjob Marketplace',
  description: 'Connect with world-class freelancers. Post jobs, browse talent, deliver results.',
  openGraph: {
    title: 'Asteria Freelance',
    description: 'The intelligent microjob marketplace.',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${exo2.variable} ${inter.variable} ${jetbrains.variable}`}>
      <body className="font-body bg-white text-black antialiased">
        <Providers>
          <CustomCursor />
          <ScrollProgressBar />
          <Navbar />
          <main>{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  )
}
