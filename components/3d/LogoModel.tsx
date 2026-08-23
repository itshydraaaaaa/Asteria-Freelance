'use client'

/**
 * components/3d/LogoModel.tsx — 3D Holographic Isometric Graphic
 *
 * Accessibility & Motion (Phase 9):
 * - aria-hidden="true" applied (decorative graphic)
 * - Detects prefers-reduced-motion and disables continuous rotations
 * - Formatted for TND (Tunisian Dinar) launch currency
 */

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Zap } from 'lucide-react'

export default function LogoModel() {
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mediaQuery.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mediaQuery.addEventListener('change', handler)
    return () => mediaQuery.removeEventListener('change', handler)
  }, [])

  return (
    <div
      aria-hidden="true"
      className="relative w-full h-full flex items-center justify-center select-none"
    >
      {/* Ambient Neon Glow Aura */}
      <div className="absolute w-80 h-80 rounded-full bg-ast-primary/20 blur-3xl pointer-events-none" />

      {/* 3D Holographic Container */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
        {/* Outer Orbit Ring */}
        <motion.div
          animate={reducedMotion ? {} : { rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border border-ast-primary/30 border-dashed"
        />

        {/* Middle Orbit Ring */}
        <motion.div
          animate={reducedMotion ? {} : { rotate: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-4 rounded-full border border-sky-400/25"
        />

        {/* 3D Holographic Wave Logo Graphic */}
        <div className="relative w-52 h-52 flex items-center justify-center">
          <div className="absolute inset-4 bg-gradient-to-tr from-ast-light/30 via-sky-400/20 to-transparent rounded-full blur-xl animate-pulse" />
          <img
            src="/logo.png"
            alt="Asteria Hologram Logo"
            className="relative w-36 h-36 sm:w-40 sm:h-40 object-contain filter drop-shadow-[0_0_25px_rgba(96,200,212,0.7)] group-hover:rotate-6 transition-transform duration-700"
            style={reducedMotion ? {} : { animation: 'heroFloat 4s ease-in-out infinite' }}
          />
        </div>

        {/* 3D Floating Status Pill 1 — Escrow Secured */}
        <motion.div
          initial={{ y: 0, opacity: 1 }}
          animate={reducedMotion ? {} : { y: [0, -8, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-4 -left-6 bg-black/70 backdrop-blur-xl border border-ast-primary/40 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3 z-30"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-white/60">Escrow Protected</p>
            <p className="text-xs font-bold text-white">100% Guaranteed</p>
          </div>
        </motion.div>

        {/* 3D Floating Status Pill 2 — Tunisia Verified */}
        <motion.div
          initial={{ y: 0, opacity: 1 }}
          animate={reducedMotion ? {} : { y: [0, 10, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-4 -right-6 bg-black/70 backdrop-blur-xl border border-sky-400/40 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3 z-30"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Zap size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-white/60">Verified Talent</p>
            <p className="text-xs font-bold text-white">Made in Tunisia</p>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes heroFloat {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-16px) rotate(2deg); }
        }
        @keyframes pulseCore {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50%       { transform: scale(1.3); opacity: 0.5; }
        }
      `}</style>
    </div>
  )
}
