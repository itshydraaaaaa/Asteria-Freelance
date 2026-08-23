'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { microHover } from '@/lib/motion'
import { createClient } from '@/lib/supabase/client'
import { logout } from '@/app/actions/auth'
import {
  LayoutDashboard, Package, MessageSquare, Settings, LogOut,
  User, ShieldCheck, Star, Wallet, BarChart2, Briefcase, Globe, X
} from 'lucide-react'

interface Props {
  name: string
  email: string
  role: string
  initials: string
  image?: string | null 
  isMobileDrawer?: boolean
  onClose?: () => void
}

const COMMON_NAV = [
  { label: 'Overview',      href: '/dashboard',              Icon: LayoutDashboard },
  { label: 'Verification',  href: '/dashboard/verification',  Icon: ShieldCheck },
  { label: 'Orders',        href: '/dashboard/orders',       Icon: Package },
  { label: 'Messages',      href: '/dashboard/messages',     Icon: MessageSquare },
  { label: 'Profile',       href: '/dashboard/profile',      Icon: User },
  { label: 'Settings',      href: '/dashboard/settings',     Icon: Settings },
]

const FREELANCER_NAV = [
  { label: 'Browse Jobs',   href: '/jobs',               Icon: Briefcase },
  { label: 'My Gigs',       href: '/dashboard/gigs',      Icon: Star },
  { label: 'Wallet',        href: '/dashboard/wallet',     Icon: Wallet },
  { label: 'Analytics',     href: '/dashboard/analytics',  Icon: BarChart2 },
]

const CLIENT_NAV = [
  { label: 'My Posted Jobs', href: '/dashboard/jobs',       Icon: Briefcase },
  { label: 'Post a Job',     href: '/post-job',              Icon: Briefcase },
  { label: 'Explore Gigs',   href: '/explore',               Icon: Star },
  { label: 'Wallet',         href: '/dashboard/wallet',      Icon: Wallet },
]

export function DashboardNav({ name, email, role, initials, image, isMobileDrawer, onClose }: Props) {
  const pathname = usePathname()
  const router = useRouter()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const extraNav =
    role === 'FREELANCER' ? FREELANCER_NAV :
    role === 'CLIENT'     ? CLIENT_NAV     : []

  const handleSignOut = async () => {
    if (onClose) onClose()
    if (typeof document !== 'undefined') {
      document.cookie = 'demo_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
      document.cookie = 'demo_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
    }
    try {
      await logout()
    } catch {}
    router.push('/login')
    router.refresh()
  }

  const asideClasses = isMobileDrawer
    ? "flex h-full w-full flex-col bg-white px-4 pb-8 pt-6 overflow-y-auto"
    : "hidden md:flex sticky top-0 z-30 h-screen w-64 shrink-0 flex-col border-r border-black/8 bg-white px-4 pb-8 pt-8 shadow-[0_0_0_1px_rgba(0,0,0,0.02)] overflow-y-auto"

  return (
    <aside className={asideClasses}>
      <div className="mb-8 px-2 flex items-center justify-between">
        <Link href="/" onClick={onClose} className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 bg-ast-light/30 blur-sm rounded-full group-hover:scale-110 transition-all duration-300" />
            <img
              src="/logo.png"
              alt="Asteria Logo"
              className="relative w-8 h-8 object-contain drop-shadow-sm transition-transform group-hover:scale-105"
            />
          </div>
          <span className="font-heading font-bold text-black text-base tracking-wide">
            ASTERIA
          </span>
        </Link>
        {isMobileDrawer && (
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-black/5 text-ast-gray hover:text-black">
            <X size={18} />
          </button>
        )}
      </div>

      <div className="mb-6 px-2">
        {image ? (
          <img 
            src={image} 
            alt={name} 
            className="w-12 h-12 rounded-full object-cover border border-black/10 mb-3 shadow-sm" 
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-ast-primary flex items-center justify-center text-white font-bold text-xl mb-3">
            {initials}
          </div>
        )}
        
        <p className="font-semibold text-black text-sm truncate">{name}</p>
        <p className="text-xs text-ast-gray truncate">{email}</p>
        <span className="inline-block mt-1 text-[10px] font-medium text-ast-primary bg-ast-muted rounded-full px-2 py-0.5">
          {role}
        </span>
      </div>

      <nav className="flex-1 space-y-0.5">
        {COMMON_NAV.map(({ label, href, Icon }) => (
          <Link key={href} href={href} onClick={onClose}>
            <motion.div
              variants={microHover}
              initial="rest"
              whileHover="hover"
              whileFocus="hover"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors focus-ring-primary cursor-pointer ${
                isActive(href)
                  ? 'bg-ast-primary text-white font-medium'
                  : 'text-ast-gray hover:text-black hover:bg-ast-surface'
              }`}
            >
              <Icon size={16} />
              <span className="truncate">{label}</span>
            </motion.div>
          </Link>
        ))}

        {extraNav.length > 0 && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-[10px] font-semibold text-ast-gray uppercase tracking-wider">
                {role === 'FREELANCER' ? 'Freelancer Tools' : 'Client Tools'}
              </p>
            </div>
            {extraNav.map(({ label, href, Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                  isActive(href)
                    ? 'bg-ast-primary text-white font-medium'
                    : 'text-ast-gray hover:text-black hover:bg-ast-surface'
                }`}
              >
                <Icon size={16} />
                {label}
              </Link>
            ))}
          </>
        )}

        {role === 'ADMIN' && (
          <>
            <div className="pt-3 pb-1 px-3">
              <p className="text-[10px] font-semibold text-ast-gray uppercase tracking-wider">Administration</p>
            </div>
            <Link
              href="/dashboard/admin"
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                pathname.startsWith('/dashboard/admin')
                  ? 'bg-ast-dark text-white font-medium'
                  : 'text-ast-gray hover:text-black hover:bg-ast-surface'
              }`}
            >
              <ShieldCheck size={16} />
              Admin Panel
            </Link>
          </>
        )}
      </nav>

      <div className="border-t border-black/8 pt-4 space-y-1">
        <Link
          href="/"
          onClick={onClose}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-ast-gray hover:text-black hover:bg-ast-surface text-sm transition-colors"
        >
          <Globe size={16} />
          Main Marketplace
        </Link>
        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-ast-gray hover:text-red-600 hover:bg-red-50 text-sm transition-colors"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </aside>
  )
}