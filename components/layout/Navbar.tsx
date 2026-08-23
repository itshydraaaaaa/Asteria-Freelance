'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import {
  Menu,
  X,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  Wallet,
  ShoppingBag,
  Settings,
  Shield,
  PlusCircle,
  Sparkles,
} from 'lucide-react'
import { NotificationDropdown } from '@/components/ui/NotificationDropdown'
import { logout } from '@/app/actions/auth'

const NAV_LINKS = [
  { label: 'Explore',      href: '/explore' },
  { label: 'Freelancers',  href: '/freelancers' },
  { label: 'Jobs',         href: '/jobs' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'About',        href: '/about' },
]

function NavSkeleton() {
  return (
    <div className="flex items-center gap-3 animate-pulse">
      <div className="w-20 h-7 bg-white/10 rounded-full" />
      <div className="w-24 h-8 bg-white/10 rounded-full" />
    </div>
  )
}

export function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()

  const [user, setUser]                 = useState<any>(null)
  const [loading, setLoading]           = useState(false)
  const hasFetchedOnce                  = useRef(false)
  const [scrolled, setScrolled]         = useState(false)
  const [open, setOpen]                 = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // 1. Check cached session on mount to prevent layout shift
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem('ast_cached_user')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (parsed?.id) {
          setUser(parsed)
          setLoading(false)
        }
      }
    } catch {}
  }, [])

  // 2. Fetch authoritative session from server
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        if (data.user) {
          setUser(data.user)
          try { sessionStorage.setItem('ast_cached_user', JSON.stringify(data.user)) } catch {}
        } else {
          setUser(null)
          try { sessionStorage.removeItem('ast_cached_user') } catch {}
        }
      } else {
        setUser(null)
        try { sessionStorage.removeItem('ast_cached_user') } catch {}
      }
    } catch {
      // Keep cached user if network fails
    } finally {
      setLoading(false)
      hasFetchedOnce.current = true
    }
  }

  useEffect(() => {
    fetchSession()
    const handleFocus = () => fetchSession()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [pathname])

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  // Lock body scroll when mobile menu is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  // Dashboard has its own sidebar/header
  if (pathname.startsWith('/dashboard')) return null

  const handleSignOut = async () => {
    setUserMenuOpen(false)
    setOpen(false)
    try { sessionStorage.removeItem('ast_cached_user') } catch {}
    if (typeof document !== 'undefined') {
      document.cookie = 'demo_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
      document.cookie = 'demo_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
    }
    try { await logout() } catch {}
    setUser(null)
    router.push('/')
    router.refresh()
  }

  // Active check: hash anchors like /#how-it-works shouldn't mark as active on /
  const isActive = (href: string) => {
    if (href.startsWith('/#')) return false
    return pathname === href
  }

  const displayName   = user?.name ?? user?.email?.split('@')[0] ?? 'Account'
  const initials      = displayName[0]?.toUpperCase() ?? 'U'
  const avatar        = user?.image
  const role          = user?.role ?? 'CLIENT'
  const walletBalance = Number(user?.walletBalance ?? 0)

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
        animate={{ height: scrolled ? 64 : 80 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          background:         scrolled ? 'rgba(10,58,64,0.98)' : 'rgba(10,58,64,0.92)',
          backdropFilter:     'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderBottom:       scrolled ? '1px solid rgba(96,200,212,0.30)' : '1px solid rgba(96,200,212,0.12)',
          boxShadow:          scrolled ? '0 4px 40px rgba(0,0,0,0.3)' : 'none',
        }}
      >
        <div className="max-w-7xl mx-auto h-full px-5 sm:px-8 lg:px-12 flex items-center justify-between gap-4">

          {/* Brand Logo */}
          <Link href="/" className="flex items-center gap-3 group shrink-0">
            <div className="relative">
              <div className="absolute inset-0 bg-ast-light/25 blur-md rounded-full group-hover:bg-ast-light/50 group-hover:scale-110 transition-all duration-500" />
              <img
                src="/logo.png"
                alt="Asteria Logo"
                className="relative w-8 h-8 md:w-9 md:h-9 object-contain drop-shadow-[0_0_12px_rgba(96,200,212,0.6)] group-hover:drop-shadow-[0_0_20px_rgba(96,200,212,0.9)] transition-all duration-500 group-hover:rotate-[5deg]"
              />
            </div>
            <span className="font-heading font-bold text-white text-lg tracking-wide">
              A<span className="text-white/75">STERIA</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Main navigation">
            {NAV_LINKS.map(link => (
              <Link
                key={link.href}
                href={link.href}
                aria-current={isActive(link.href) ? 'page' : undefined}
                className={`relative text-sm font-medium tracking-wide transition-colors pb-0.5 ${
                  isActive(link.href) ? 'text-white' : 'text-white/65 hover:text-white'
                }`}
              >
                {link.label}
                {isActive(link.href) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-ast-light"
                  />
                )}
              </Link>
            ))}
          </nav>

          {/* Desktop Right Actions */}
          <div className="hidden md:flex items-center gap-2.5">
            {user ? (
              <>
                <NotificationDropdown />

                {/* Wallet Balance Pill */}
                <Link
                  href="/dashboard/wallet"
                  className="flex items-center gap-1.5 bg-white/8 hover:bg-white/15 border border-white/12 hover:border-ast-light/40 text-white rounded-full px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105"
                  title="Wallet Balance"
                >
                  <Wallet size={13} className="text-ast-light" />
                  <span>{walletBalance.toFixed(2)} TND</span>
                </Link>

                {/* Post a Job — clients only */}
                {role === 'CLIENT' && (
                  <Link
                    href="/post-job"
                    className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-ast-dark bg-ast-light hover:bg-ast-sky rounded-full px-3.5 py-1.5 transition-all hover:scale-105 active:scale-95 shadow-md shadow-ast-light/20"
                  >
                    <PlusCircle size={13} />
                    <span>Post a Job</span>
                  </Link>
                )}

                {/* Dashboard Button */}
                <Link
                  href="/dashboard"
                  className="flex items-center gap-1.5 bg-ast-primary hover:bg-ast-dark text-white rounded-full px-4 py-1.5 text-xs font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm"
                >
                  <LayoutDashboard size={13} />
                  <span>Dashboard</span>
                </Link>

                {/* Account Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(o => !o)}
                    className="flex items-center gap-2 bg-ast-light/12 border border-ast-light/25 text-white rounded-full pl-1.5 pr-3 py-1 hover:bg-ast-light/22 hover:border-ast-light/45 transition-all"
                    aria-expanded={userMenuOpen}
                    aria-haspopup="true"
                  >
                    {avatar ? (
                      <img src={avatar} alt={displayName} className="w-7 h-7 rounded-full object-cover border border-white/20" />
                    ) : (
                      <span className="w-7 h-7 rounded-full bg-ast-primary flex items-center justify-center text-white font-bold text-xs border border-ast-light/30">
                        {initials}
                      </span>
                    )}
                    <div className="text-left">
                      <p className="text-xs font-semibold max-w-[85px] truncate leading-tight">{displayName}</p>
                      <p className="text-[10px] text-ast-light/80 uppercase font-mono tracking-wider">{role}</p>
                    </div>
                    <ChevronDown size={12} className={`transition-transform duration-200 text-white/60 ${userMenuOpen ? 'rotate-180' : ''}`} />
                  </button>

                  <AnimatePresence>
                    {userMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15, ease: 'easeOut' }}
                        className="absolute right-0 mt-2 w-60 bg-white rounded-2xl shadow-2xl border border-black/8 overflow-hidden py-1 z-50"
                        onMouseLeave={() => setUserMenuOpen(false)}
                      >
                        {/* Header */}
                        <div className="px-4 py-3.5 border-b border-black/8 bg-ast-surface/60">
                          <div className="flex items-center gap-3">
                            {avatar ? (
                              <img src={avatar} alt={displayName} className="w-9 h-9 rounded-full object-cover border border-black/10" />
                            ) : (
                              <span className="w-9 h-9 rounded-full bg-ast-primary flex items-center justify-center text-white font-bold text-sm">
                                {initials}
                              </span>
                            )}
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-black truncate">{displayName}</p>
                              <p className="text-xs text-ast-gray truncate">{user.email}</p>
                            </div>
                          </div>
                          <div className="mt-2.5 flex items-center gap-1.5">
                            <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-ast-primary/10 text-ast-primary">
                              {role === 'ADMIN' ? '🛡️ Admin' : role === 'FREELANCER' ? '👤 Freelancer' : '💼 Client'}
                            </span>
                            <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                              {walletBalance.toFixed(2)} TND
                            </span>
                          </div>
                        </div>

                        {/* Links */}
                        <div className="py-1">
                          <Link href="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-black hover:bg-ast-surface transition-colors">
                            <LayoutDashboard size={14} className="text-ast-primary" /><span>Main Dashboard</span>
                          </Link>
                          <Link href="/dashboard/wallet" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-black hover:bg-ast-surface transition-colors">
                            <Wallet size={14} className="text-emerald-600" /><span>My Wallet ({walletBalance.toFixed(2)} TND)</span>
                          </Link>
                          <Link href="/dashboard/orders" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-black hover:bg-ast-surface transition-colors">
                            <ShoppingBag size={14} className="text-ast-primary" /><span>Orders &amp; Escrow</span>
                          </Link>
                          {role === 'ADMIN' && (
                            <Link href="/dashboard/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-purple-700 bg-purple-50/60 hover:bg-purple-50 transition-colors">
                              <Shield size={14} className="text-purple-600" /><span>Master Admin Panel</span>
                            </Link>
                          )}
                          <Link href="/dashboard/settings" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-ast-gray hover:text-black hover:bg-ast-surface transition-colors">
                            <Settings size={14} /><span>Account Settings</span>
                          </Link>
                        </div>

                        {/* Sign Out */}
                        <div className="border-t border-black/8 pt-1 pb-1">
                          <button onClick={handleSignOut} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors">
                            <LogOut size={14} /><span>Sign Out</span>
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-sm font-medium text-white/75 hover:text-white px-4 py-1.5 rounded-full hover:bg-white/10 transition-all"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  className="relative overflow-hidden inline-flex items-center gap-1.5 text-sm font-bold text-ast-dark bg-ast-light hover:bg-ast-sky rounded-full px-5 py-2 transition-all hover:scale-105 active:scale-95 shadow-md shadow-ast-light/30"
                  style={{ animation: 'none' }}
                >
                  <span
                    aria-hidden="true"
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.45) 50%, transparent 100%)',
                      transform: 'skewX(-20deg)',
                      animation: 'shimmer 2.5s infinite',
                    }}
                  />
                  <Sparkles size={14} />
                  Join Free
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
            onClick={() => setOpen(o => !o)}
            aria-label="Toggle navigation menu"
          >
            <AnimatePresence mode="wait" initial={false}>
              {open ? (
                <motion.span key="x" initial={{ rotate: -90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: 90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <X size={22} />
                </motion.span>
              ) : (
                <motion.span key="menu" initial={{ rotate: 90, opacity: 0 }} animate={{ rotate: 0, opacity: 1 }} exit={{ rotate: -90, opacity: 0 }} transition={{ duration: 0.15 }}>
                  <Menu size={22} />
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.header>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <motion.div
              key="drawer"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 280 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-[85vw] max-w-sm bg-ast-dark flex flex-col"
              style={{ borderLeft: '1px solid rgba(96,200,212,0.15)' }}
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-white/10">
                <Link href="/" onClick={() => setOpen(false)} className="font-heading font-bold text-white text-lg tracking-wide">
                  A<span className="text-white/70">STERIA</span>
                </Link>
                <button onClick={() => setOpen(false)} className="text-white p-2 rounded-lg hover:bg-white/10 transition-colors" aria-label="Close menu">
                  <X size={20} />
                </button>
              </div>

              {/* Nav Links */}
              <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-1">
                {NAV_LINKS.map((link, i) => (
                  <motion.div
                    key={link.href}
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 + 0.05, duration: 0.25 }}
                  >
                    <Link
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center font-heading text-lg font-semibold py-3 px-4 rounded-xl transition-colors ${
                        isActive(link.href)
                          ? 'text-ast-light bg-ast-light/10'
                          : 'text-white/80 hover:text-ast-light hover:bg-white/5'
                      }`}
                    >
                      {link.label}
                    </Link>
                  </motion.div>
                ))}
              </div>

              {/* Auth section */}
              <div className="px-5 py-5 border-t border-white/10 space-y-3">
                {loading ? (
                  <div className="animate-pulse space-y-3">
                    <div className="h-14 bg-white/10 rounded-2xl" />
                    <div className="h-11 bg-white/10 rounded-xl" />
                  </div>
                ) : user ? (
                  <>
                    <div className="flex items-center gap-3 bg-white/8 p-3.5 rounded-2xl border border-white/10">
                      {avatar ? (
                        <img src={avatar} alt={displayName} className="w-10 h-10 rounded-full object-cover border border-white/20" />
                      ) : (
                        <span className="w-10 h-10 rounded-full bg-ast-primary flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {initials}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{displayName}</p>
                        <p className="text-xs text-white/50 truncate">{user.email}</p>
                      </div>
                      <span className="text-xs font-bold text-ast-light bg-ast-light/10 px-2.5 py-1 rounded-full shrink-0">
                        {walletBalance.toFixed(2)} TND
                      </span>
                    </div>
                    <Link href="/dashboard" onClick={() => setOpen(false)} className="w-full flex items-center justify-center gap-2 bg-ast-light text-ast-dark font-bold text-sm py-3 rounded-xl hover:bg-ast-sky transition-colors">
                      <LayoutDashboard size={16} /><span>Go to Dashboard</span>
                    </Link>
                    <Link href="/dashboard/wallet" onClick={() => setOpen(false)} className="w-full flex items-center justify-center gap-2 bg-white/8 text-white font-semibold text-sm py-3 rounded-xl border border-white/15 hover:bg-white/15 transition-colors">
                      <Wallet size={16} /><span>Wallet ({walletBalance.toFixed(2)} TND)</span>
                    </Link>
                    <button onClick={handleSignOut} className="w-full text-center text-red-400 font-semibold text-xs py-2.5 hover:text-red-300 transition-colors">
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={() => setOpen(false)} className="w-full block text-center font-semibold text-white bg-white/8 hover:bg-white/15 border border-white/15 rounded-xl py-3 text-sm transition-all">
                      Sign In
                    </Link>
                    <Link href="/register" onClick={() => setOpen(false)} className="w-full flex items-center justify-center gap-2 font-bold text-ast-dark bg-ast-light hover:bg-ast-sky rounded-xl py-3 text-sm shadow-md transition-all">
                      <Sparkles size={15} />Join Asteria Free
                    </Link>
                  </>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar