'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Globe, ChevronDown, Check } from 'lucide-react'
import { useLanguage } from '@/components/providers/LanguageContext'
import { SupportedLanguage } from '@/lib/i18n/translations'

const LANGUAGES: { id: SupportedLanguage; label: string; flag: string; native: string }[] = [
  { id: 'English', label: 'English', flag: '🇬🇧', native: 'English' },
  { id: 'French',  label: 'Français', flag: '🇫🇷', native: 'Français' },
  { id: 'Arabic',  label: 'العربية', flag: '🇹🇳', native: 'تونس (الدارجة)' },
]

interface LanguageSwitcherProps {
  theme?: 'dark' | 'light' // 'dark' = for dark backgrounds (navbar), 'light' = for white/light surfaces (dashboard)
  compact?: boolean
  className?: string
}

export function LanguageSwitcher({
  theme = 'dark',
  compact = false,
  className = '',
}: LanguageSwitcherProps) {
  const { language, setLanguage } = useLanguage()
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const current = LANGUAGES.find((l) => l.id === language) || LANGUAGES[0]

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [open])

  const handleSelect = (lang: SupportedLanguage) => {
    setLanguage(lang)
    setOpen(false)

    // Sync to user profile API if session exists
    try {
      fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ language: lang }),
      }).catch(() => {})
    } catch {}
  }

  const isDarkBg = theme === 'dark'

  return (
    <div className={`relative inline-block text-left ${className}`} ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label="Change language"
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
          isDarkBg
            ? 'bg-white/10 hover:bg-white/18 text-white border border-white/15 hover:border-ast-light/40 shadow-xs'
            : 'bg-black/5 hover:bg-black/10 text-ast-dark border border-black/8 shadow-xs'
        }`}
      >
        <span className="text-sm leading-none" role="img" aria-hidden="true">
          {current.flag}
        </span>
        {!compact && (
          <span className="tracking-wide">
            {current.id === 'Arabic' ? 'عربي' : current.id === 'French' ? 'FR' : 'EN'}
          </span>
        )}
        <ChevronDown
          size={12}
          className={`transition-transform duration-200 ${
            open ? 'rotate-180' : ''
          } ${isDarkBg ? 'text-white/60' : 'text-black/60'}`}
        />
      </button>

      {/* Dropdown Options */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            role="listbox"
            className={`absolute right-0 mt-2 w-48 rounded-2xl p-1.5 shadow-2xl border z-50 overflow-hidden ${
              isDarkBg
                ? 'bg-ast-dark/95 backdrop-blur-xl border-white/15 text-white'
                : 'bg-white border-black/10 text-ast-dark shadow-[0_8px_30px_rgba(0,0,0,0.12)]'
            }`}
          >
            <div className="px-2.5 py-1.5 text-[10px] font-mono uppercase tracking-wider text-ast-light/80 border-b border-white/10 mb-1">
              Select Language / اختر اللغة
            </div>

            {LANGUAGES.map((lang) => {
              const isSelected = lang.id === language
              return (
                <button
                  key={lang.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(lang.id)}
                  className={`w-full flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all text-left ${
                    isSelected
                      ? isDarkBg
                        ? 'bg-ast-light/15 text-ast-light font-semibold'
                        : 'bg-ast-primary/10 text-ast-primary font-semibold'
                      : isDarkBg
                      ? 'text-white/80 hover:bg-white/10 hover:text-white'
                      : 'text-black/80 hover:bg-black/5 hover:text-black'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-base leading-none" role="img" aria-hidden="true">
                      {lang.flag}
                    </span>
                    <div className="flex flex-col text-left">
                      <span className="leading-tight">{lang.label}</span>
                      <span
                        className={`text-[10px] ${
                          isDarkBg ? 'text-white/40' : 'text-black/40'
                        }`}
                      >
                        {lang.native}
                      </span>
                    </div>
                  </div>
                  {isSelected && (
                    <Check
                      size={14}
                      className={isDarkBg ? 'text-ast-light' : 'text-ast-primary'}
                    />
                  )}
                </button>
              )
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default LanguageSwitcher
