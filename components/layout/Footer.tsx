'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LanguageSwitcher } from '@/components/layout/LanguageSwitcher'
import { useLanguage } from '@/components/providers/LanguageContext'

export function Footer() {
  const pathname = usePathname()
  const { t } = useLanguage()

  if (pathname.startsWith('/dashboard')) return null

  const linkSections = [
    {
      title: t('footerPlatform'),
      items: [
        { label: t('navExplore'), href: '/explore' },
        { label: t('navFreelancers'), href: '/freelancers' },
        { label: t('navPostJob'), href: '/post-job' },
        { label: t('navHowItWorks'), href: '/#how-it-works' },
      ],
    },
    {
      title: t('footerCompany'),
      items: [
        { label: t('navAbout'), href: '/about' },
        { label: t('footerContact'), href: '/contact' },
        { label: t('navJobs'), href: '/jobs' },
      ],
    },
    {
      title: t('footerSupport'),
      items: [
        { label: t('footerHelpCenter'), href: '/contact' },
        { label: t('footerTerms'), href: '/terms' },
        { label: t('footerPrivacy'), href: '/privacy' },
      ],
    },
  ]

  return (
    <footer className="bg-ast-dark border-t border-ast-light/10 pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-4 group">
              <img
                src="/logo.png"
                alt="Asteria Logo"
                className="w-7 h-7 object-contain drop-shadow-sm transition-transform group-hover:scale-105"
              />
              <span className="font-heading font-bold text-white text-base tracking-wide">ASTERIA</span>
            </Link>
            <p className="text-ast-gray text-sm leading-relaxed max-w-xs">
              {t('footerDesc')}
            </p>
          </div>

          {linkSections.map(section => (
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
            © 2026 Asteria Freelance. {t('footerRights')}
          </p>
          <div className="flex items-center gap-4">
            <LanguageSwitcher theme="dark" compact={false} />
            <p className="font-mono text-ast-light/40 text-xs tracking-widest2">
              TUNISIA — EST. 2024
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}