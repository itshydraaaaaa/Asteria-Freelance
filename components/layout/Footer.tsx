'use client' // 👉 Required for usePathname
import Link from 'next/link'
import { usePathname } from 'next/navigation' // 👉 Added import

const LINKS = [
  {
    title: 'Platform',
    items: [
      { label: 'Explore Gigs', href: '/explore' },
      { label: 'Find Freelancers', href: '/freelancers' },
      { label: 'Post a Job', href: '/post-job' },
      { label: 'How It Works', href: '/#how-it-works' },
    ],
  },
  {
    title: 'Company',
    items: [
      { label: 'About', href: '/about' },
      { label: 'Contact', href: '/contact' },
      { label: 'Jobs', href: '/jobs' },
    ],
  },
  {
    title: 'Support',
    items: [
      { label: 'Help Center', href: '/contact' },
      { label: 'Terms of Service', href: '/terms' },
      { label: 'Privacy Policy', href: '/privacy' },
    ],
  },
]

export function Footer() {
  const pathname = usePathname() // 👉 Grab the current URL

  // 👉 THE FIX: If we are in the dashboard, don't render the footer at all!
  if (pathname.startsWith('/dashboard')) return null

  return (
    <footer className="bg-ast-dark border-t border-ast-light/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2 mb-4">
              <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
                <path d="M32 4 L60 56 L4 56 Z" stroke="#60c8d4" strokeWidth="2.5" fill="none" />
                <circle cx="32" cy="38" r="4" fill="#60c8d4" />
              </svg>
              <span className="font-heading font-bold text-white text-base tracking-wide">ASTERIA</span>
            </Link>
            <p className="text-ast-gray text-sm leading-relaxed max-w-xs">
              The intelligent microjob marketplace connecting elite talent with ambitious clients across the MENA region.
            </p>
          </div>

          {LINKS.map(section => (
            <div key={section.title}>
              <h3 className="text-white font-semibold text-sm tracking-wide mb-4">{section.title}</h3>
              <ul className="space-y-2">
                {section.items.map(item => (
                  <li key={item.label}>
                    <Link href={item.href} className="text-ast-gray hover:text-ast-light text-sm transition-colors">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-ast-light/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-ast-gray text-sm">
            © 2026 Asteria Freelance. All rights reserved.
          </p>
          <p className="font-mono text-ast-light/40 text-xs tracking-widest2">
            MENA REGION — EST. 2024
          </p>
        </div>
      </div>
    </footer>
  )
}