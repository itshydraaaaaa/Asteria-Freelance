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
      <div className="relative w-16 h-16 mb-4 flex items-center justify-center">
        <svg
          width="56"
          height="56"
          viewBox="0 0 64 64"
          fill="none"
          className="animate-pulse"
        >
          <path
            d="M32 6 L58 54 L6 54 Z"
            stroke="#60c8d4"
            strokeWidth="2.5"
            fill="none"
          />
          <path
            d="M32 20 L48 50 L16 50 Z"
            stroke="#4CB4E7"
            strokeWidth="1.5"
            fill="none"
          />
          <circle cx="32" cy="38" r="4" fill="#60c8d4" />
        </svg>
      </div>

      <div className="flex items-center gap-1">
        <span className="font-heading text-2xl font-bold text-ast-light tracking-widest">
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
