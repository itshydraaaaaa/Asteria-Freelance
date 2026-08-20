'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ShieldCheck, X } from 'lucide-react'

export function CookieConsentBanner() {
  const [showBanner, setShowBanner] = useState(false)

  useEffect(() => {
    const consent = localStorage.getItem('asteria_cookie_consent')
    if (!consent) {
      setShowBanner(true)
    }
  }, [])

  const handleAccept = () => {
    localStorage.setItem('asteria_cookie_consent', 'accepted')
    setShowBanner(false)
  }

  const handleDecline = () => {
    localStorage.setItem('asteria_cookie_consent', 'essential_only')
    setShowBanner(false)
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-5 right-5 left-5 md:left-auto md:max-w-md bg-white border border-black/10 rounded-3xl p-5 shadow-xl z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-9 h-9 rounded-2xl bg-ast-primary/10 text-ast-primary flex items-center justify-center shrink-0">
          <ShieldCheck size={18} />
        </div>
        <div className="flex-1">
          <h4 className="font-bold text-xs text-black mb-1">Privacy & Cookie Preferences</h4>
          <p className="text-[11px] text-ast-gray leading-relaxed">
            Asteria uses essential session cookies to secure escrow payments, authenticate logins, and improve your marketplace experience.
          </p>
        </div>
        <button
          onClick={() => setShowBanner(false)}
          className="text-ast-gray hover:text-black transition-colors"
          aria-label="Dismiss cookie notice"
        >
          <X size={15} />
        </button>
      </div>

      <div className="flex items-center gap-2 pt-2 border-t border-black/5">
        <button
          onClick={handleAccept}
          className="flex-1 py-2 px-3 bg-ast-primary text-white text-[11px] font-bold rounded-xl hover:bg-ast-dark transition-colors"
        >
          Accept All
        </button>
        <button
          onClick={handleDecline}
          className="py-2 px-3 bg-ast-surface text-ast-dark text-[11px] font-semibold rounded-xl hover:bg-black/5 transition-colors border border-black/5"
        >
          Essential Only
        </button>
        <Link
          href="/privacy"
          className="text-[10px] text-ast-gray hover:text-ast-primary transition-colors underline px-1"
        >
          Policy
        </Link>
      </div>
    </div>
  )
}
