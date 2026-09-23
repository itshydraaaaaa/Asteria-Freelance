'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { SupportedLanguage, TRANSLATIONS, TranslationDictionary } from '@/lib/i18n/translations'

interface LanguageContextType {
  language: SupportedLanguage
  setLanguage: (lang: SupportedLanguage) => void
  currency: string
  setCurrency: (curr: string) => void
  t: (key: keyof TranslationDictionary) => string
  isRTL: boolean
  dir: 'ltr' | 'rtl'
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'English',
  setLanguage: () => {},
  currency: 'TND',
  setCurrency: () => {},
  t: (key) => TRANSLATIONS.English[key] || key,
  isRTL: false,
  dir: 'ltr',
})

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<SupportedLanguage>('English')
  const [currency, setCurrencyState] = useState<string>('TND')
  const [mounted, setMounted] = useState(false)

  // Initialize from cookies or localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedLang = (localStorage.getItem('asteria_settings_language') ||
          getCookie('asteria_lang')) as SupportedLanguage | null

        const storedCurr = localStorage.getItem('asteria_settings_currency') ||
          getCookie('asteria_currency')

        if (storedLang && ['English', 'Arabic', 'French'].includes(storedLang)) {
          setLanguageState(storedLang)
          applyDocumentDirection(storedLang)
        }
        if (storedCurr) {
          setCurrencyState(storedCurr)
        }
      } catch (e) {
        console.error('Failed reading language preferences:', e)
      }
      setMounted(true)
    }
  }, [])

  const applyDocumentDirection = (lang: SupportedLanguage) => {
    if (typeof document !== 'undefined') {
      const isArabic = lang === 'Arabic'
      document.documentElement.lang = isArabic ? 'ar' : lang === 'French' ? 'fr' : 'en'
      document.documentElement.dir = isArabic ? 'rtl' : 'ltr'
    }
  }

  const setLanguage = (newLang: SupportedLanguage) => {
    setLanguageState(newLang)
    applyDocumentDirection(newLang)
    if (typeof window !== 'undefined') {
      localStorage.setItem('asteria_settings_language', newLang)
      setCookie('asteria_lang', newLang, 365)
    }
  }

  const setCurrency = (newCurr: string) => {
    setCurrencyState(newCurr)
    if (typeof window !== 'undefined') {
      localStorage.setItem('asteria_settings_currency', newCurr)
      setCookie('asteria_currency', newCurr, 365)
    }
  }

  const isRTL = language === 'Arabic'
  const dir: 'ltr' | 'rtl' = isRTL ? 'rtl' : 'ltr'

  const t = (key: keyof TranslationDictionary): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.English
    return dict[key] || TRANSLATIONS.English[key] || String(key)
  }

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        currency,
        setCurrency,
        t,
        isRTL,
        dir,
      }}
    >
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

// Cookie Helper Utilities
function getCookie(name: string): string | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'))
  return match ? decodeURIComponent(match[2]) : null
}

function setCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return
  const expires = new Date(Date.now() + days * 864e5).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`
}
