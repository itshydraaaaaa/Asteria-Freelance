'use client'

import { useEffect, useRef, useState } from 'react'

export function LoadingScreen({ onComplete }: { onComplete: () => void }) {
  const [fading, setFading] = useState(false)
  const completedRef = useRef(false)

  const finish = () => {
    if (completedRef.current) return
    completedRef.current = true
    setFading(true)
    if (typeof window !== 'undefined') {
      try { sessionStorage.setItem('ast-loaded', '1') } catch {}
    }
    setTimeout(() => {
      onComplete()
    }, 300)
  }

  useEffect(() => {
    if (typeof window === 'undefined') {
      onComplete()
      return
    }

    // Check if user already saw the loader in this session
    try {
      const seen = sessionStorage.getItem('ast-loaded')
      if (seen) {
        onComplete()
        return
      }
    } catch {}

    // Ironclad safety timer: screen ALWAYS reveals within 500ms max
    const timer = setTimeout(finish, 500)
    return () => clearTimeout(timer)
  }, [onComplete])

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[9999] bg-ast-dark flex flex-col items-center justify-center transition-opacity duration-300 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >

      <div className="relative flex items-center justify-center w-20 h-20 mb-6">
        <div className="absolute inset-0 rounded-full border-t-2 border-r-2 border-ast-light/30 animate-spin" />
        <div className="absolute inset-0 rounded-full border-t-2 border-ast-light animate-spin blur-[2px]" />
        <div className="absolute inset-2 rounded-full border-b-2 border-l-2 border-ast-primary animate-[spin_1.5s_linear_infinite_reverse]" />
        <div className="absolute bg-ast-dark/80 w-12 h-12 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(17,96,110,0.5)] overflow-hidden">
          <img src="/logo.png" alt="Asteria Logo" className="w-8 h-8 object-contain animate-pulse drop-shadow-[0_0_8px_rgba(96,200,212,0.8)]" />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <span className="font-heading text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-ast-light tracking-[0.25em]">
          ASTERIA
        </span>
      </div>

      <div className="w-24 h-0.5 bg-white/10 rounded-full mt-3 overflow-hidden">
        <div className="w-full h-full bg-ast-light animate-[loadingBar_0.5s_ease-in-out_infinite]" />
      </div>

      <style>{`
        @keyframes loadingBar {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  )
}
