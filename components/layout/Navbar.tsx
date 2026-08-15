'use client'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Menu, X, LayoutDashboard, LogOut, ChevronDown } from 'lucide-react'
import { NotificationDropdown } from '@/components/ui/NotificationDropdown'

const NAV_LINKS = [
  { label: 'Explore',      href: '/explore' },
  { label: 'Freelancers',  href: '/freelancers' },
  { label: 'Jobs',         href: '/jobs' },
  { label: 'How It Works', href: '/#how-it-works' },
  { label: 'About',        href: '/about' },
]

export function Navbar() {
  const pathname      = usePathname()
  const router        = useRouter()
  const supabase      = createClient() // 👉 Use Supabase Client

  const [user,        setUser]       = useState<any>(null)
  const [loading,     setLoading]    = useState(true)
  const [scrolled,    setScrolled]   = useState(false)
  const [open,        setOpen]       = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)

  // 👉 Fetch the Supabase session and user profile
  useEffect(() => {
    const fetchSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      if (session?.user) {
        // Fetch their profile to get the most up-to-date avatar and name
        const { data: profile } = await supabase
          .from('User')
          .select('name, image')
          .eq('id', session.user.id)
          .single()
        
        setUser({ ...session.user, profile })
      } else {
        setUser(null)
      }
      setLoading(false)
    }

    fetchSession()

    // Listen for auth changes (like if they log out in another tab)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) setUser(null)
      if (session && !user) fetchSession()
    })

    return () => subscription.unsubscribe()
  }, [])

  // 👉 Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
    setUserMenuOpen(false)
  }, [pathname])

  // 👉 THE DASHBOARD FIX: If we are in the dashboard, don't render this public navbar at all!
  if (pathname.startsWith('/dashboard')) return null

  // 👉 Secure Sign Out
  const handleSignOut = async () => {
    setUserMenuOpen(false)
    setOpen(false)
    await supabase.auth.signOut()
    router.push('/')
    router.refresh()
  }

  const isActive = (href: string) => (href === '/#how-it-works' ? pathname === '/' : pathname === href)

  // Profile Fallbacks
  const displayName = user?.profile?.name ?? user?.user_metadata?.full_name ?? 'Account'
  const initials    = displayName[0]?.toUpperCase() ?? '?'
  const avatar      = user?.profile?.image

  return (
    <>
      <motion.header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 lg:px-12"
        animate={{ height: scrolled ? 60 : 80 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{
          background:    scrolled ? 'rgba(10,58,64,0.92)' : 'transparent',
          backdropFilter: scrolled ? 'blur(20px)' : 'none',
          borderBottom:  scrolled ? '1px solid rgba(96,200,212,0.15)' : 'none',
        }}
      >
        <Link href="/" className="flex items-center gap-2 group">
          <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
            <path d="M32 4 L60 56 L4 56 Z" stroke="#60c8d4" strokeWidth="2.5" fill="none" />
            <path d="M32 20 L48 52 L16 52 Z" stroke="#4CB4E7" strokeWidth="1.5" fill="none" />
            <circle cx="32" cy="38" r="4" fill="#60c8d4" />
          </svg>
          <span className="font-heading font-bold text-white text-lg tracking-wide">
            A<span className="text-white/80">STERIA</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-8" aria-label="Main navigation">
          {NAV_LINKS.map(link => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? 'page' : undefined}
              className={`relative text-sm font-medium tracking-wide transition-colors ${isActive(link.href) ? 'text-white' : 'text-white/70 hover:text-white'}`}
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

        <div className="hidden md:flex items-center gap-3">
          {loading ? (
            <div className="w-24 h-8 bg-white/10 rounded-full animate-pulse" />
          ) : user ? (
            <>
              <NotificationDropdown />
              <Link
                href="/post-job"
                className="text-sm text-white border border-white/20 bg-black/80 rounded-full px-5 py-2 hover:bg-black transition-colors"
              >
                Post a Job
              </Link>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(o => !o)}
                  className="flex items-center gap-2 bg-ast-light/15 border border-ast-light/30 text-white rounded-full pl-2 pr-3 py-1.5 hover:bg-ast-light/25 transition-colors"
                >
                  {/* 👉 Added Avatar Image Logic */}
                  {avatar ? (
                    <img src={avatar} alt={displayName} className="w-7 h-7 rounded-full object-cover border border-white/20" />
                  ) : (
                    <span className="w-7 h-7 rounded-full bg-ast-primary flex items-center justify-center text-white font-bold text-xs">
                      {initials}
                    </span>
                  )}
                  <span className="text-sm font-medium max-w-[90px] truncate">{displayName}</span>
                  <ChevronDown size={13} className={`transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0,  scale: 1 }}
                      exit={{ opacity: 0,  y: -8, scale: 0.96 }}
                      transition={{ duration: 0.15 }}
                      className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-black/8 overflow-hidden py-1 z-50"
                      onMouseLeave={() => setUserMenuOpen(false)}
                    >
                      <div className="px-4 py-3 border-b border-black/8">
                        <p className="text-sm font-medium text-black truncate">{displayName}</p>
                        <p className="text-xs text-ast-gray truncate">{user.email}</p>
                      </div>
                      <Link
                        href="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-black hover:bg-ast-surface transition-colors"
                      >
                        <LayoutDashboard size={14} className="text-ast-primary" />
                        Dashboard
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut size={14} />
                        Sign Out
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </>
          ) : (
            <>
              <Link
                href="/post-job"
                className="text-sm text-white border border-white/20 bg-black/80 rounded-full px-5 py-2 hover:bg-black transition-colors"
              >
                Post a Job
              </Link>
              <Link
                href="/login"
                className="text-sm font-medium text-ast-dark bg-ast-light rounded-full px-5 py-2 hover:bg-ast-sky transition-colors"
              >
                Join
              </Link>
            </>
          )}
        </div>

        <button
          className="md:hidden text-white p-2"
          onClick={() => setOpen(o => !o)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </motion.header>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-ast-dark/95 backdrop-blur-md flex flex-col"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
              <Link href="/" className="font-heading font-semibold text-white tracking-[0.2em]">ASTERIA</Link>
              <button onClick={() => setOpen(false)} className="text-white p-2" aria-label="Close menu">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-6 px-6 py-8">
              {NAV_LINKS.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 24 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`font-heading text-2xl font-semibold transition-colors ${isActive(link.href) ? 'text-ast-light' : 'text-white hover:text-ast-light'}`}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col gap-3 mt-4 w-full max-w-xs"
              >
                {user ? (
                  <>
                    <Link href="/dashboard" onClick={() => setOpen(false)} className="text-center font-medium text-ast-dark bg-ast-light rounded-full py-3">Dashboard</Link>
                    <button onClick={handleSignOut} className="text-center text-white border border-white/20 rounded-full py-3">Sign Out</button>
                  </>
                ) : (
                  <>
                    <Link href="/post-job" onClick={() => setOpen(false)} className="text-center text-white border border-white/20 rounded-full py-3">Post a Job</Link>
                    <Link href="/login" onClick={() => setOpen(false)} className="text-center font-medium text-ast-dark bg-ast-light rounded-full py-3">Join</Link>
                  </>
                )}
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}