'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Shield, CreditCard, Globe, LogOut, Check, Trash2, AlertTriangle, X, CheckCircle2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { logout } from '@/app/actions/auth'
import { useLanguage } from '@/components/providers/LanguageContext'
import { SupportedLanguage } from '@/lib/i18n/translations'

function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      dir="ltr"
      onClick={() => onChange(!on)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-ast-primary focus:ring-offset-2 ${
        on ? 'bg-ast-primary' : 'bg-black/20'
      }`}
      role="switch"
      aria-checked={on}
      aria-label={label}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
          on ? 'translate-x-5' : 'translate-x-0'
        }`}
      />
    </button>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()
  const { language, setLanguage, currency, setCurrency, t, isRTL, dir } = useLanguage()

  // 1. Notifications State
  const [notifications, setNotifications] = useState({
    newOrders: true,
    messages: true,
    marketing: false,
    weeklyDigest: true,
  })

  // 2. Privacy State
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showEarnings: false,
  })

  // 3. Saved feedback section
  const [savedSection, setSavedSection] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // 4. Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Load configuration settings from server API or localStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/user/settings')
        if (res.ok) {
          const data = await res.json()
          if (data.notifications) setNotifications(data.notifications)
          if (data.privacy) setPrivacy(data.privacy)
          if (data.language && ['English', 'Arabic', 'French'].includes(data.language)) {
            setLanguage(data.language)
          }
          if (data.currency) {
            setCurrency(data.currency)
          }
        }
      } catch (err) {
        // Fallback to localStorage if offline
        if (typeof window !== 'undefined') {
          const storedNotif = localStorage.getItem('asteria_settings_notifications')
          const storedPriv = localStorage.getItem('asteria_settings_privacy')
          if (storedNotif) setNotifications(JSON.parse(storedNotif))
          if (storedPriv) setPrivacy(JSON.parse(storedPriv))
        }
      }
    }

    loadSettings()
  }, [])

  const saveSettings = async (section: string) => {
    setIsSaving(true)
    try {
      // 1. Persist to localStorage
      if (typeof window !== 'undefined') {
        if (section === 'notifications') {
          localStorage.setItem('asteria_settings_notifications', JSON.stringify(notifications))
        } else if (section === 'privacy') {
          localStorage.setItem('asteria_settings_privacy', JSON.stringify(privacy))
        } else if (section === 'preferences') {
          localStorage.setItem('asteria_settings_language', language)
          localStorage.setItem('asteria_settings_currency', currency)
        }
      }

      // 2. Persist to Server & Cookie API
      await fetch('/api/user/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language,
          currency,
          notifications,
          privacy,
        }),
      })

      setSavedSection(section)
      setTimeout(() => setSavedSection(''), 2500)
    } catch (e) {
      console.error('Failed to save settings:', e)
    } finally {
      setIsSaving(false)
    }
  }

  const handleSignOut = async () => {
    if (typeof document !== 'undefined') {
      document.cookie = 'demo_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
      document.cookie = 'demo_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
    }
    try {
      await logout()
      await supabase.auth.signOut()
    } catch {}
    router.push('/login')
    router.refresh()
  }

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') return
    try {
      setDeleteLoading(true)
      setDeleteError('')
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account')
      }

      if (typeof document !== 'undefined') {
        document.cookie = 'demo_user_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
        document.cookie = 'demo_user_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT;'
      }
      try {
        await logout()
        await supabase.auth.signOut()
      } catch {}

      router.push('/login?message=account_deleted')
    } catch (err: any) {
      setDeleteError(err.message || 'An unexpected error occurred while deleting your account.')
    } finally {
      setDeleteLoading(false)
    }
  }

  return (
    <div className={`space-y-6 ${isRTL ? 'text-right' : 'text-left'}`} dir={dir}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-black/8 pb-5">
        <div>
          <h1 className="font-heading font-bold text-3xl text-black mb-1">{t('settingsTitle')}</h1>
          <p className="text-xs text-ast-gray">{t('settingsSubtitle')}</p>
        </div>

        {/* Quick Language Switcher Pills */}
        <div className="flex items-center gap-1.5 bg-white p-1 rounded-2xl border border-black/10 shadow-xs self-start">
          <button
            type="button"
            onClick={() => setLanguage('English')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              language === 'English'
                ? 'bg-ast-primary text-white shadow-xs'
                : 'text-ast-gray hover:text-black hover:bg-ast-surface'
            }`}
          >
            🇬🇧 English
          </button>
          <button
            type="button"
            onClick={() => setLanguage('French')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              language === 'French'
                ? 'bg-ast-primary text-white shadow-xs'
                : 'text-ast-gray hover:text-black hover:bg-ast-surface'
            }`}
          >
            🇫🇷 Français
          </button>
          <button
            type="button"
            onClick={() => setLanguage('Arabic')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
              language === 'Arabic'
                ? 'bg-ast-primary text-white shadow-xs'
                : 'text-ast-gray hover:text-black hover:bg-ast-surface'
            }`}
          >
            🇹🇳 العربية (تونس)
          </button>
        </div>
      </div>

      <div className="space-y-6 max-w-2xl">
        {/* Section 1: Regional & Localization Preferences (Primary) */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-xs">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-black/8 bg-ast-surface/30">
            <Globe size={18} className="text-ast-primary" />
            <h2 className="font-semibold text-black">{t('secLocalization')}</h2>
          </div>
          <div className="px-6 py-5 space-y-5">
            {/* Language Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5">
              <div>
                <p className="text-sm font-semibold text-black">{t('langTitle')}</p>
                <p className="text-xs text-ast-gray mt-0.5">{t('langDesc')}</p>
              </div>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value as SupportedLanguage)}
                className="text-sm border border-black/15 rounded-xl px-4 py-2.5 outline-none focus:border-ast-primary bg-white cursor-pointer min-w-[180px]"
              >
                <option value="English">🇬🇧 English</option>
                <option value="French">🇫🇷 Français</option>
                <option value="Arabic">🇹🇳 العربية (الدارجة التونسية)</option>
              </select>
            </div>

            {/* Display Currency */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-black/5">
              <div>
                <p className="text-sm font-semibold text-black">{t('currTitle')}</p>
                <p className="text-xs text-ast-gray mt-0.5">{t('currDesc')}</p>
              </div>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="text-sm border border-black/15 rounded-xl px-4 py-2.5 outline-none focus:border-ast-primary bg-white cursor-pointer min-w-[180px]"
              >
                <option value="TND">🇹🇳 TND (د.ت — Tunisian Dinar)</option>
                <option value="USD">🇺🇸 USD ($ — US Dollar)</option>
                <option value="EUR">🇪🇺 EUR (€ — Euro)</option>
                <option value="AED">🇦🇪 AED (د.إ — UAE Dirham)</option>
                <option value="SAR">🇸🇦 SAR (﷼ — Saudi Riyal)</option>
              </select>
            </div>

            {/* Timezone Information */}
            <div className="flex items-center justify-between text-xs text-ast-gray">
              <span>{t('timezoneTitle')}:</span>
              <span className="font-mono font-medium text-black">🇹🇳 {t('timezoneDesc')}</span>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => saveSettings('preferences')}
                className="text-xs bg-ast-primary text-white rounded-xl px-5 py-2.5 font-bold hover:bg-ast-dark transition-colors disabled:opacity-50"
              >
                {t('btnSavePreferences')}
              </button>
              <AnimatePresence>
                {savedSection === 'preferences' && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-bold text-emerald-600 flex items-center gap-1"
                  >
                    <CheckCircle2 size={15} /> {t('savedSuccess')}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Section 2: Notifications */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-xs">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-black/8 bg-ast-surface/30">
            <Bell size={18} className="text-ast-primary" />
            <h2 className="font-semibold text-black">{t('secNotifications')}</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            {/* New Orders */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">{t('notifNewOrdersTitle')}</p>
                <p className="text-xs text-ast-gray mt-0.5">{t('notifNewOrdersDesc')}</p>
              </div>
              <Toggle
                on={notifications.newOrders}
                onChange={v => setNotifications(n => ({ ...n, newOrders: v }))}
              />
            </div>

            {/* Messages */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">{t('notifMessagesTitle')}</p>
                <p className="text-xs text-ast-gray mt-0.5">{t('notifMessagesDesc')}</p>
              </div>
              <Toggle
                on={notifications.messages}
                onChange={v => setNotifications(n => ({ ...n, messages: v }))}
              />
            </div>

            {/* Marketing */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">{t('notifMarketingTitle')}</p>
                <p className="text-xs text-ast-gray mt-0.5">{t('notifMarketingDesc')}</p>
              </div>
              <Toggle
                on={notifications.marketing}
                onChange={v => setNotifications(n => ({ ...n, marketing: v }))}
              />
            </div>

            {/* Weekly Digest */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">{t('notifDigestTitle')}</p>
                <p className="text-xs text-ast-gray mt-0.5">{t('notifDigestDesc')}</p>
              </div>
              <Toggle
                on={notifications.weeklyDigest}
                onChange={v => setNotifications(n => ({ ...n, weeklyDigest: v }))}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => saveSettings('notifications')}
                className="text-xs bg-ast-primary text-white rounded-xl px-5 py-2.5 font-bold hover:bg-ast-dark transition-colors disabled:opacity-50"
              >
                {t('btnSaveNotifications')}
              </button>
              <AnimatePresence>
                {savedSection === 'notifications' && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-bold text-emerald-600 flex items-center gap-1"
                  >
                    <CheckCircle2 size={15} /> {t('savedSuccess')}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Section 3: Privacy */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-xs">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-black/8 bg-ast-surface/30">
            <Shield size={18} className="text-ast-primary" />
            <h2 className="font-semibold text-black">{t('secPrivacy')}</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">{t('privPublicProfileTitle')}</p>
                <p className="text-xs text-ast-gray mt-0.5">{t('privPublicProfileDesc')}</p>
              </div>
              <Toggle
                on={privacy.publicProfile}
                onChange={v => setPrivacy(p => ({ ...p, publicProfile: v }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">{t('privShowEarningsTitle')}</p>
                <p className="text-xs text-ast-gray mt-0.5">{t('privShowEarningsDesc')}</p>
              </div>
              <Toggle
                on={privacy.showEarnings}
                onChange={v => setPrivacy(p => ({ ...p, showEarnings: v }))}
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                disabled={isSaving}
                onClick={() => saveSettings('privacy')}
                className="text-xs bg-ast-primary text-white rounded-xl px-5 py-2.5 font-bold hover:bg-ast-dark transition-colors disabled:opacity-50"
              >
                {t('btnSavePrivacy')}
              </button>
              <AnimatePresence>
                {savedSection === 'privacy' && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-bold text-emerald-600 flex items-center gap-1"
                  >
                    <CheckCircle2 size={15} /> {t('savedSuccess')}
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Section 4: Billing & Wallet Shortcut */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-xs">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-black/8 bg-ast-surface/30">
            <CreditCard size={18} className="text-ast-primary" />
            <h2 className="font-semibold text-black">{t('navWallet')}</h2>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-ast-gray mb-4">
              Fund your wallet using instant Tunisian payment methods (Flouci, D17) or international cards (Stripe).
            </p>
            <a
              href="/dashboard/wallet"
              className="inline-block text-xs font-bold bg-ast-surface border border-ast-primary/30 text-ast-primary rounded-xl px-5 py-2.5 hover:bg-ast-muted transition-colors"
            >
              Go to Wallet ({currency})
            </a>
          </div>
        </div>

        {/* Section 5: Account & Sign Out */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
          <h2 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
            <LogOut size={16} /> {t('btnSignOut')}
          </h2>
          <p className="text-sm text-red-600/80 mb-4">
            Securely sign out of your active Asteria session.
          </p>
          <button
            type="button"
            onClick={handleSignOut}
            className="text-xs font-bold bg-white border border-red-200 text-red-600 rounded-xl px-5 py-2.5 hover:bg-red-600 hover:text-white transition-colors"
          >
            {t('btnSignOut')}
          </button>
        </div>

        {/* Section 6: Danger Zone - Delete Account */}
        <div className="bg-red-50/60 border border-red-200 rounded-2xl p-6">
          <h2 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
            <Trash2 size={16} /> {t('dangerZone')}
          </h2>
          <p className="text-sm text-red-600/80 mb-4 leading-relaxed">
            {t('deleteAccountDesc')}
          </p>
          <button
            type="button"
            onClick={() => {
              setDeleteConfirmText('')
              setDeleteError('')
              setShowDeleteModal(true)
            }}
            className="text-xs font-bold bg-red-600 text-white rounded-xl px-5 py-2.5 hover:bg-red-700 transition-colors shadow-xs"
          >
            {t('btnDeleteAccount')}
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-red-100 space-y-5">
            <div className="flex items-center justify-between border-b border-black/5 pb-4">
              <div className="flex items-center gap-3 text-red-600">
                <AlertTriangle size={24} />
                <h3 className="font-heading font-bold text-lg text-black">{t('deleteAccountTitle')}</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="text-ast-gray hover:text-black p-1 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-ast-gray leading-relaxed">
              This action cannot be undone. To confirm deletion, type{' '}
              <strong className="text-red-600 font-mono">DELETE</strong> in the input below:
            </p>

            <input
              type="text"
              value={deleteConfirmText}
              onChange={e => setDeleteConfirmText(e.target.value)}
              placeholder="Type DELETE"
              className="w-full px-4 py-2.5 border border-black/15 rounded-xl text-sm font-mono outline-none focus:border-red-500"
            />

            {deleteError && (
              <p className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {deleteError}
              </p>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 text-xs font-semibold text-ast-gray hover:text-black rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                onClick={handleDeleteAccount}
                className="px-5 py-2.5 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-40 transition-colors shadow-xs"
              >
                {deleteLoading ? 'Deleting…' : t('btnDeleteAccount')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
