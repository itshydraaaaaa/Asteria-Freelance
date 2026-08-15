'use client'

import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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
  User,
  Briefcase,
  PlusCircle,
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

export function Navbar() {
  const pathname = usePathname()
  const router   = useRouter()

  const [user, setUser]                 = useState<any>(null)
  const [loading, setLoading]           = useState(true)
  const [scrolled, setScrolled]         = useState(false)
  const [open, setOpen]                 = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // Fetch session from server endpoint on mount and on route changes
  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        setUser(data.user ?? null)
      } else {
        setUser(null)
      }
    } catch {
      setUser(null)
    } finally {
      setLoading(false)
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

  // If we are in the dashboard, don't render this public navbar (dashboard has its own sidebar/header)
  if (pathname.startsWith('/dashboard')) return null

  // Secure Sign Out
  const handleSignOut = async () => {
    setUserMenuOpen(false)
    setOpen(false)
    await logout()
    setUser(null)
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) => (href === '/#how-it-works' ? pathname === '/' : pathname === href)

  // Profile fields
  const displayName = user?.name ?? user?.email?.split('@')[0] ?? 'Account'
  const initials    = displayName[0]?.toUpperCase() ?? 'U'
  const avatar      = user?.image
  const role        = user?.role ?? 'CLIENT'
  const walletBalance = Number(user?.walletBalance ?? 0)

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12"
        animate={{ height: scrolled ? 64 : 80 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          background:     scrolled ? 'rgba(10,58,64,0.95)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom:   scrolled ? '1px solid rgba(96,200,212,0.15)' : 'none',
        }}
      >
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
            <path d="M32 4 L60 56 L4 56 Z" stroke="#60c8d4" strokeWidth="2.5" fill="none" />
            <path d="M32 20 L48 52 L16 52 Z" stroke="#4CB4E7" strokeWidth="1.5" fill="none" />
            <circle cx="32" cy="38" r="4" fill="#60c8d4" />
          </svg>
          <span className="font-heading font-bold text-white text-lg tracking-wide">
            A<span className="text-white/80">STERIA</span>
          </span>
        </Link>

        {/* Main Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`relative text-sm font-medium tracking-wide transition-colors ${
                isActive(link.href) ? 'text-white' : 'text-white/70 hover:text-white'
              }`}
            >
              {link.label}
              {isActive(link.href) && (
                <motion.span
                  layoutId="nav-underline"
                  className="absolute -bottom-1 left-0 right-0 h-0.5 bg-ast-light"
                />
              )}
            </Link>
          ))}
        </nav>

        {/* Desktop Right Actions */}
        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="w-28 h-9 bg-white/10 rounded-full animate-pulse" />
          ) : user ? (
            <>
              {/* Notifications Dropdown */}
              <NotificationDropdown />

              {/* Wallet Quick Balance Button */}
              <Link
                href="/dashboard/wallet"
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/15 border border-white/15 text-white rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors shadow-sm"
                title="View Wallet Balance"
              >
                <Wallet size={14} className="text-ast-light" />
                <span>{walletBalance.toFixed(2)} TND</span>
              </Link>

              {/* Dashboard Link Button */}
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 bg-ast-primary hover:bg-ast-dark text-white rounded-full px-4 py-1.5 text-xs font-semibold transition-colors shadow-sm"
              >
                <LayoutDashboard size={14} />
                <span>Dashboard</span>
              </Link>

              {/* Role-Specific Action */}
              {role === 'CLIENT' && (
                <Link
                  href="/post-job"
                  className="hidden lg:flex items-center gap-1 text-xs text-white border border-white/20 bg-black/60 rounded-full px-3.5 py-1.5 hover:bg-black transition-colors"
                >
                  <PlusCircle size={13} />
                  <span>Post a Job</span>
                </Link>
              )}

              {/* Account Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 bg-ast-light/15 border border-ast-light/30 text-white rounded-full pl-1.5 pr-3 py-1 hover:bg-ast-light/25 transition-colors"
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={displayName}
                      className="w-7 h-7 rounded-full object-cover border border-white/20"
                    />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-ast-primary flex items-center justify-center text-white font-bold text-xs">
                      {initials}
                    </span>
                  )}
                  <div className="text-left">
                    <p className="text-xs font-semibold max-w-[85px] truncate leading-tight">{displayName}</p>
                    <p className="text-[10px] text-white/60 uppercase font-mono tracking-wider">{role}</p>
                  </div>
                  <ChevronDown
                    size={13}
                    className={`transition-transform duration-200 ${userMenuOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-black/8 overflow-hidden py-1 z-50"
                      onMouseLeave={() => setUserMenuOpen(false)}
                    >
                      {/* User Header */}
                      <div className="px-4 py-3 border-b border-black/8 bg-ast-surface/50">
                        <p className="text-sm font-bold text-black truncate">{displayName}</p>
                        <p className="text-xs text-ast-gray truncate">{user.email}</p>
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-ast-primary/10 text-ast-primary">
                            {role === 'ADMIN' ? '🛡️ Admin' : role === 'FREELANCER' ? '👤 Freelancer' : '💼 Client'}
                          </span>
                          <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {walletBalance.toFixed(2)} TND
                          </span>
                        </div>
                      </div>

                      {/* Menu Links */}
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-black hover:bg-ast-surface transition-colors"
                        >
                          <LayoutDashboard size={14} className="text-ast-primary" />
                          <span>Main Dashboard</span>
                        </Link>

                        <Link
                          href="/dashboard/wallet"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-black hover:bg-ast-surface transition-colors"
                        >
                          <Wallet size={14} className="text-emerald-600" />
                          <span>My Wallet ({walletBalance.toFixed(2)} TND)</span>
                        </Link>

                        <Link
                          href="/dashboard/orders"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-black hover:bg-ast-surface transition-colors"
                        >
                          <ShoppingBag size={14} className="text-ast-primary" />
                          <span>Orders & Escrow</span>
                        </Link>

                        {role === 'ADMIN' && (
                          <Link
                            href="/dashboard/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-purple-700 bg-purple-50/50 hover:bg-purple-50 transition-colors"
                          >
                            <Shield size={14} className="text-purple-600" />
                            <span>Master Admin Panel</span>
                          </Link>
                        )}

                        <Link
                          href="/dashboard/settings"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-ast-gray hover:text-black hover:bg-ast-surface transition-colors"
                        >
                          <Settings size={14} />
                          <span>Account Settings</span>
                        </Link>
                      </div>

                      {/* Sign Out */}
                      <div className="border-t border-black/8 pt-1">
                        <button
                          onClick={handleSignOut}
                          className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut size={14} />
                          <span>Sign Out</span>
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
                className="text-sm font-medium text-white/80 hover:text-white px-4 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/login"
                className="text-sm font-semibold text-ast-dark bg-ast-light hover:bg-ast-sky rounded-full px-5 py-2 transition-colors shadow-sm"
              >
                Join
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle navigation menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </motion.header>

      {/* Mobile Drawer Menu */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ast-dark/95 backdrop-blur-xl flex flex-col pt-20 px-6 pb-8"
          >
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <Link href="/" onClick={() => setOpen(false)} className="font-heading font-semibold text-white tracking-[0.2em]">
                ASTERIA
              </Link>
              <button onClick={() => setOpen(false)} className="text-white p-2" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 flex flex-col justify-between py-6">
              <div className="flex flex-col gap-4">
                {NAV_LINKS.map((link, i) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`font-heading text-xl font-semibold transition-colors ${
                      isActive(link.href) ? 'text-ast-light' : 'text-white/80 hover:text-ast-light'
                    }`}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t border-white/10">
                {user ? (
                  <>
                    <div className="flex items-center gap-3 bg-white/10 p-3.5 rounded-2xl">
                      <span className="w-9 h-9 rounded-full bg-ast-primary flex items-center justify-center text-white font-bold text-sm">
                        {initials}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-white truncate">{displayName}</p>
                        <p className="text-xs text-white/60">{user.email}</p>
                      </div>
                      <span className="text-xs font-bold text-ast-light bg-ast-light/10 px-2.5 py-1 rounded-full">
                        {walletBalance.toFixed(2)} TND
                      </span>
                    </div>

                    <Link
                      href="/dashboard"
                      onClick={() => setOpen(false)}
                      className="w-full flex items-center justify-center gap-2 bg-ast-light text-ast-dark font-bold text-sm py-3 rounded-xl"
                    >
                      <LayoutDashboard size={16} />
                      <span>Go to Dashboard</span>
                    </Link>

                    <Link
                      href="/dashboard/wallet"
                      onClick={() => setOpen(false)}
                      className="w-full flex items-center justify-center gap-2 bg-white/10 text-white font-semibold text-sm py-3 rounded-xl border border-white/20"
                    >
                      <Wallet size={16} />
                      <span>Wallet ({walletBalance.toFixed(2)} TND)</span>
                    </Link>

                    <button
                      onClick={handleSignOut}
                      className="w-full text-center text-red-400 font-semibold text-xs py-2.5 hover:text-red-300"
                    >
                      Sign Out
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href="/login"
                      onClick={() => setOpen(false)}
                      className="w-full block text-center font-bold text-ast-dark bg-ast-light rounded-xl py-3 text-sm shadow-md"
                    >
                      Join / Sign In
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default Navbar