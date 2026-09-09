'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Shield, CreditCard, Globe, Moon, LogOut, Check, Trash2, AlertTriangle, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { logout } from '@/app/actions/auth'

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={`relative w-11 h-6 rounded-full transition-colors ${on ? 'bg-ast-primary' : 'bg-black/20'}`}
      role="switch" aria-checked={on}
    >
      <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${on ? 'translate-x-5' : 'translate-x-0.5'}`} />
    </button>
  )
}

export default function SettingsPage() {
  const router = useRouter()
  const supabase = createClient()

  // 1. Notifications State
  const [notifications, setNotifications] = useState({
    newOrders:    true,
    messages:     true,
    marketing:    false,
    weeklyDigest: true,
  })

  // 2. Privacy State
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showEarnings:  false,
  })

  // 3. Preferences State
  const [language, setLanguage] = useState('English')
  const [currency, setCurrency] = useState('TND')
  const [savedSection, setSavedSection] = useState('')

  // 4. Delete Account State
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')

  // Load configuration settings from localStorage if available
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const storedNotif = localStorage.getItem('asteria_settings_notifications')
        const storedPriv = localStorage.getItem('asteria_settings_privacy')
        const storedLang = localStorage.getItem('asteria_settings_language')
        const storedCurr = localStorage.getItem('asteria_settings_currency')

        if (storedNotif) setNotifications(JSON.parse(storedNotif))
        if (storedPriv) setPrivacy(JSON.parse(storedPriv))
        if (storedLang) setLanguage(storedLang)
        if (storedCurr) setCurrency(storedCurr)
      } catch (e) {
        console.error('Failed to load settings:', e)
      }
    }
  }, [])

  const saveSettings = (section: string) => {
    if (typeof window !== 'undefined') {
      try {
        if (section === 'notifications') {
          localStorage.setItem('asteria_settings_notifications', JSON.stringify(notifications))
        } else if (section === 'privacy') {
          localStorage.setItem('asteria_settings_privacy', JSON.stringify(privacy))
        } else if (section === 'preferences') {
          localStorage.setItem('asteria_settings_language', language)
          localStorage.setItem('asteria_settings_currency', currency)
        }
        setSavedSection(section)
        setTimeout(() => setSavedSection(''), 2500)
      } catch (e) {
        console.error('Failed to save settings:', e)
      }
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
    <div className="space-y-6">
      <h1 className="font-heading font-bold text-3xl text-black mb-6">Settings</h1>

      <div className="space-y-6 max-w-2xl">
        {/* Section 1: Notifications */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-xs">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-black/8 bg-ast-surface/30">
            <Bell size={18} className="text-ast-primary" />
            <h2 className="font-semibold text-black">Notifications</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            {(Object.entries(notifications) as [keyof typeof notifications, boolean][]).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">
                    {key === 'newOrders' ? 'New Orders' : key === 'messages' ? 'New Messages' : key === 'marketing' ? 'Marketing Emails' : 'Weekly Digest'}
                  </p>
                  <p className="text-xs text-ast-gray mt-0.5">
                    {key === 'newOrders' ? 'Get notified when a client places an order' : key === 'messages' ? 'Alerts for new direct messages' : key === 'marketing' ? 'Product updates and promotions' : 'A summary of your weekly activity'}
                  </p>
                </div>
                <Toggle on={val} onChange={v => setNotifications(n => ({ ...n, [key]: v }))} />
              </div>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => saveSettings('notifications')}
                className="text-xs bg-ast-primary text-white rounded-xl px-5 py-2.5 font-bold hover:bg-ast-dark transition-colors"
              >
                Save Notifications
              </button>
              <AnimatePresence>
                {savedSection === 'notifications' && (
                  <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check size={14} /> Saved Successfully
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Section 2: Privacy */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-xs">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-black/8 bg-ast-surface/30">
            <Shield size={18} className="text-ast-primary" />
            <h2 className="font-semibold text-black">Privacy Settings</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            {(Object.entries(privacy) as [keyof typeof privacy, boolean][]).map(([key, val]) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-black">
                    {key === 'publicProfile' ? 'Public Profile' : 'Show Earnings'}
                  </p>
                  <p className="text-xs text-ast-gray mt-0.5">
                    {key === 'publicProfile' ? 'Allow clients to find and view your profile' : 'Display total earnings on your public page'}
                  </p>
                </div>
                <Toggle on={val} onChange={v => setPrivacy(p => ({ ...p, [key]: v }))} />
              </div>
            ))}
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => saveSettings('privacy')}
                className="text-xs bg-ast-primary text-white rounded-xl px-5 py-2.5 font-bold hover:bg-ast-dark transition-colors"
              >
                Save Privacy Preferences
              </button>
              <AnimatePresence>
                {savedSection === 'privacy' && (
                  <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check size={14} /> Saved Successfully
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Section 3: Preferences (Language & Currency) */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-xs">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-black/8 bg-ast-surface/30">
            <Globe size={18} className="text-ast-primary" />
            <h2 className="font-semibold text-black">Localization Preferences</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Interface Language</p>
                <p className="text-xs text-ast-gray mt-0.5">Select your preferred interface language</p>
              </div>
              <select
                value={language}
                onChange={e => setLanguage(e.target.value)}
                className="text-sm border border-black/15 rounded-xl px-3 py-2 outline-none focus:border-ast-primary bg-white cursor-pointer"
              >
                <option value="English">English</option>
                <option value="Arabic">العربية</option>
                <option value="French">Français</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Display Currency</p>
                <p className="text-xs text-ast-gray mt-0.5">Display price values in your local currency</p>
              </div>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value)}
                className="text-sm border border-black/15 rounded-xl px-3 py-2 outline-none focus:border-ast-primary bg-white cursor-pointer"
              >
                <option value="TND">TND (د.ت)</option>
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="AED">AED (د.إ)</option>
                <option value="SAR">SAR (﷼)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => saveSettings('preferences')}
                className="text-xs bg-ast-primary text-white rounded-xl px-5 py-2.5 font-bold hover:bg-ast-dark transition-colors"
              >
                Save Preferences
              </button>
              <AnimatePresence>
                {savedSection === 'preferences' && (
                  <motion.span initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <Check size={14} /> Saved Successfully
                  </motion.span>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Section 4: Billing & Wallet Redirect */}
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-xs">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-black/8 bg-ast-surface/30">
            <CreditCard size={18} className="text-ast-primary" />
            <h2 className="font-semibold text-black">Billing & Funds</h2>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-ast-gray mb-4">No cards on file. Fund your Asteria wallet directly to clear transactions.</p>
            <a
              href="/dashboard/wallet"
              className="inline-block text-xs font-bold bg-ast-surface border border-ast-primary/30 text-ast-primary rounded-xl px-5 py-2.5 hover:bg-ast-muted transition-colors"
            >
              Add Funds to Wallet
            </a>
          </div>
        </div>

        {/* Section 5: Sign Out */}
        <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
          <h2 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
            <LogOut size={16} /> Sign Out
          </h2>
          <p className="text-sm text-red-600/80 mb-4">Sign out of your active freelancer or client session.</p>
          <button
            onClick={handleSignOut}
            className="text-xs font-bold bg-white border border-red-200 text-red-600 rounded-xl px-5 py-2.5 hover:bg-red-600 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>

        {/* Section 6: Danger Zone - Delete Account */}
        <div className="bg-red-50/60 border border-red-200 rounded-2xl p-6">
          <h2 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
            <Trash2 size={16} /> Danger Zone: Delete Account
          </h2>
          <p className="text-sm text-red-600/80 mb-4 leading-relaxed">
            Permanently delete your Asteria account, profile data, and identity records. This action is irreversible. You cannot delete your account if you have active contracts or pending escrow transactions.
          </p>
          <button
            onClick={() => {
              setDeleteConfirmText('')
              setDeleteError('')
              setShowDeleteModal(true)
            }}
            className="text-xs font-bold bg-red-600 text-white rounded-xl px-5 py-2.5 hover:bg-red-700 transition-colors shadow-xs"
          >
            Delete My Account
          </button>
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 space-y-4 relative"
            >
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                className="absolute top-4 right-4 text-ast-gray hover:text-black transition-colors"
              >
                <X size={20} />
              </button>

              <div className="w-12 h-12 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center">
                <AlertTriangle size={24} />
              </div>

              <div>
                <h3 className="font-heading font-bold text-lg text-black">Delete Account Permanently</h3>
                <p className="text-xs text-ast-gray mt-1 leading-relaxed">
                  This action is permanent and cannot be undone. All your profile information, gigs, and user data will be removed.
                </p>
              </div>

              {deleteError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-medium">
                  {deleteError}
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-ast-dark mb-1.5">
                  To confirm, type <span className="font-mono font-bold text-red-600">DELETE</span> below:
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={e => setDeleteConfirmText(e.target.value)}
                  placeholder="DELETE"
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-black/15 focus:outline-none focus:border-red-500 font-mono"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-ast-gray hover:text-black transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={deleteConfirmText !== 'DELETE' || deleteLoading}
                  onClick={handleDeleteAccount}
                  className="px-5 py-2.5 text-xs font-bold bg-red-600 text-white rounded-xl hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-xs"
                >
                  {deleteLoading ? 'Deleting Account...' : 'Permanently Delete'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
