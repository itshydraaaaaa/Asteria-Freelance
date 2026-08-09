'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import {
  LayoutDashboard, Package, MessageSquare, Settings, LogOut,
  User, ShieldCheck, Star, Wallet, BarChart2, Briefcase, Globe
} from 'lucide-react' // 👉 Added Globe icon

interface Props {
  name: string
  email: string
  role: string
  initials: string
  image?: string | null 
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
  { label: 'My Gigs',   href: '/dashboard/gigs',      Icon: Star },
  { label: 'Wallet',    href: '/dashboard/wallet',     Icon: Wallet },
  { label: 'Analytics', href: '/dashboard/analytics',  Icon: BarChart2 },
]

const CLIENT_NAV = [
  { label: 'Post a Job', href: '/post-job',           Icon: Briefcase },
]

export function DashboardNav({ name, email, role, initials, image }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(href)

  const extraNav =
    role === 'FREELANCER' ? FREELANCER_NAV :
    role === 'CLIENT'     ? CLIENT_NAV     : []

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    // 👉 Changed pt-24 to pt-8 to fix the top gap
    <aside className="w-64 shrink-0 bg-white border-r border-black/8 flex flex-col pt-8 pb-8 px-4 fixed left-0 top-0 bottom-0 z-30 overflow-y-auto">
      
      {/* 👉 Brand Logo Linked to Home */}
      <div className="mb-8 px-2">
        <Link href="/" className="flex items-center gap-2 group">
          <svg width="24" height="24" viewBox="0 0 64 64" fill="none">
            <path d="M32 4 L60 56 L4 56 Z" stroke="#111" strokeWidth="2.5" fill="none" />
            <path d="M32 20 L48 52 L16 52 Z" stroke="#60c8d4" strokeWidth="1.5" fill="none" />
            <circle cx="32" cy="38" r="4" fill="#111" />
          </svg>
          <span className="font-heading font-bold text-black text-lg tracking-wide">
            A<span className="text-black/80">STERIA</span>
          </span>
        </Link>
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
          <Link
            key={href}
            href={href}
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

      {/* 👉 Added Home Button & Grouped with Logout */}
      <div className="border-t border-black/8 pt-4 space-y-1">
        <Link
          href="/"
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