'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Menu, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DashboardNav } from './DashboardNav'

interface Props {
  name: string
  email: string
  role: string
  initials: string
  image?: string | null
  children: React.ReactNode
}

export function ResponsiveDashboardWrapper({ name, email, role, initials, image, children }: Props) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  // Close the drawer on route changes
  useEffect(() => {
    setIsOpen(false)
  }, [pathname])

  // Prevent background scrolling when mobile menu drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  return (
    <div className="min-h-screen bg-ast-surface flex flex-col md:flex-row">
      {/* ── 1. Mobile Header Top Bar (Only visible < md) ── */}
      <header className="flex md:hidden sticky top-0 z-40 w-full h-16 items-center justify-between border-b border-black/8 bg-white px-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 rounded-xl text-ast-gray hover:text-black hover:bg-ast-surface transition-colors"
          aria-label="Open navigation menu"
        >
          <Menu size={20} />
        </button>

        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="relative">
            <div className="absolute inset-0 bg-ast-light/30 blur-sm rounded-full group-hover:scale-110 transition-all duration-300" />
            <img
              src="/logo.png"
              alt="Asteria Logo"
              className="relative w-7 h-7 object-contain drop-shadow-sm transition-transform group-hover:scale-105"
            />
          </div>
          <span className="font-heading font-bold text-black text-sm tracking-wider">ASTERIA</span>
        </Link>

        <div>
          {image ? (
            <img
              src={image}
              alt={name}
              className="w-8 h-8 rounded-full object-cover border border-black/10 shadow-xs"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-ast-primary flex items-center justify-center text-white font-bold text-xs">
              {initials}
            </div>
          )}
        </div>
      </header>

      {/* ── 2. Mobile Drawer Navigation Overlay (Only visible < md) ── */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.4 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs md:hidden"
            />

            {/* Slide-over Drawer Pane */}
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] bg-white shadow-2xl md:hidden"
            >
              <DashboardNav
                name={name}
                email={email}
                role={role}
                initials={initials}
                image={image}
                isMobileDrawer={true}
                onClose={() => setIsOpen(false)}
              />
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── 3. Desktop Permanent Sidebar (Only visible >= md) ── */}
      <DashboardNav
        name={name}
        email={email}
        role={role}
        initials={initials}
        image={image}
        isMobileDrawer={false}
      />

      {/* ── 4. Main Page Content Panel ── */}
      <main className="flex-1 min-h-screen overflow-y-auto px-4 py-6 sm:px-6 lg:px-8 lg:py-8 w-full">
        <div className="mx-auto w-full max-w-7xl">
          {children}
        </div>
      </main>
    </div>
  )
}
