'use client'

import { motion } from 'framer-motion'
import { ShieldCheck, Zap, Users, Award } from 'lucide-react'

export default function LogoModel() {
  return (
    <div className="relative w-full h-full flex items-center justify-center select-none">
      {/* Ambient Neon Glow Aura */}
      <div className="absolute w-80 h-80 rounded-full bg-ast-primary/20 blur-3xl animate-pulse pointer-events-none" />

      {/* 3D Holographic Orbiting Graphic Container */}
      <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center">
        {/* Outer Orbit Ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 25, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-0 rounded-full border border-ast-primary/30 border-dashed"
        />

        {/* Middle Orbit Ring */}
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
          className="absolute inset-4 rounded-full border border-sky-400/25"
        />

        {/* 3D Isometric Holographic Pyramid Graphic */}
        <div className="relative w-56 h-56 flex items-center justify-center">
          <svg
            viewBox="0 0 200 200"
            className="w-full h-full filter drop-shadow-[0_0_20px_rgba(96,200,212,0.4)]"
            style={{ animation: 'heroFloat 4s ease-in-out infinite' }}
          >
            <defs>
              <linearGradient id="pyrGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#60c8d4" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0a3a40" stopOpacity="0.3" />
              </linearGradient>
              <linearGradient id="pyrGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#4CB4E7" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#11606e" stopOpacity="0.2" />
              </linearGradient>
              <filter id="glowBlur" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="6" />
              </filter>
            </defs>

            {/* Glowing Core Orb */}
            <circle cx="100" cy="100" r="28" fill="#60c8d4" opacity="0.3" filter="url(#glowBlur)" />
            <circle cx="100" cy="100" r="14" fill="#60c8d4" opacity="0.9" style={{ animation: 'pulseCore 2s ease-in-out infinite' }} />

            {/* Outer 3D Diamond / Pyramid Prism Mesh */}
            <polygon points="100,20 170,100 100,180" fill="url(#pyrGrad1)" stroke="#60c8d4" strokeWidth="1.5" />
            <polygon points="100,20 30,100 100,180" fill="url(#pyrGrad2)" stroke="#4CB4E7" strokeWidth="1.5" />
            <line x1="100" y1="20" x2="100" y2="180" stroke="#ffffff" strokeWidth="1.8" opacity="0.7" />

            {/* Orbital Floating Tech Nodes */}
            <circle cx="100" cy="20" r="5" fill="#ffffff" />
            <circle cx="170" cy="100" r="4" fill="#60c8d4" />
            <circle cx="30" cy="100" r="4" fill="#4CB4E7" />
            <circle cx="100" cy="180" r="4" fill="#ffffff" />
          </svg>
        </div>

        {/* 3D Floating Glassmorphic Status Pill 1 — Escrow Secured */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: [0, -8, 0], opacity: 1 }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute -top-4 -left-6 bg-black/60 backdrop-blur-xl border border-ast-primary/40 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3 z-30"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
            <ShieldCheck size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-white/60">Escrow Protected</p>
            <p className="text-xs font-bold text-white">$2.4M+ Paid Out</p>
          </div>
        </motion.div>

        {/* 3D Floating Glassmorphic Status Pill 2 — Verified Talent */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: [0, 10, 0], opacity: 1 }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute -bottom-4 -right-6 bg-black/60 backdrop-blur-xl border border-sky-400/40 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3 z-30"
        >
          <div className="w-8 h-8 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
            <Zap size={18} />
          </div>
          <div>
            <p className="text-[10px] uppercase font-mono tracking-wider text-white/60">Instant Delivery</p>
            <p className="text-xs font-bold text-white">24h Avg Delivery</p>
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
