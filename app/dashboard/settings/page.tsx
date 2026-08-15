'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, Shield, CreditCard, Globe, Moon, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

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

  const [notifications, setNotifications] = useState({
    newOrders:    true,
    messages:     true,
    marketing:    false,
    weeklyDigest: true,
  })
  const [privacy, setPrivacy] = useState({
    publicProfile: true,
    showEarnings:  false,
  })
  const [saved, setSaved] = useState('')

  const save = (section: string) => {
    setSaved(section)
    setTimeout(() => setSaved(''), 2000)
  }

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch {}
    router.push('/login')
    router.refresh()
  }

  return (
    <div>
      <h1 className="font-heading font-bold text-3xl text-black mb-8">Settings</h1>

      <div className="space-y-6 max-w-2xl">
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-black/8">
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
            <button
              onClick={() => save('notifications')}
              className="mt-2 text-sm bg-ast-primary text-white rounded-xl px-5 py-2.5 font-medium hover:bg-ast-dark transition-colors"
            >
              Save Preferences
            </button>
            <AnimatePresence>
              {saved === 'notifications' && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-green-600 ml-3">
                  ✓ Saved
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-black/8">
            <Shield size={18} className="text-ast-primary" />
            <h2 className="font-semibold text-black">Privacy</h2>
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
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-black/8">
            <Globe size={18} className="text-ast-primary" />
            <h2 className="font-semibold text-black">Preferences</h2>
          </div>
          <div className="px-6 py-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Language</p>
                <p className="text-xs text-ast-gray mt-0.5">Select your preferred interface language</p>
              </div>
              <select className="text-sm border border-black/15 rounded-xl px-3 py-2 outline-none focus:border-ast-primary bg-white">
                <option>English</option>
                <option>العربية</option>
                <option>Français</option>
              </select>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-black">Currency</p>
                <p className="text-xs text-ast-gray mt-0.5">Display prices in your local currency</p>
              </div>
              <select className="text-sm border border-black/15 rounded-xl px-3 py-2 outline-none focus:border-ast-primary bg-white">
                <option>USD ($)</option>
                <option>AED (د.إ)</option>
                <option>SAR (﷼)</option>
                <option>EUR (€)</option>
              </select>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden">
          <div className="flex items-center gap-3 px-6 py-4 border-b border-black/8">
            <CreditCard size={18} className="text-ast-primary" />
            <h2 className="font-semibold text-black">Billing</h2>
          </div>
          <div className="px-6 py-4">
            <p className="text-sm text-ast-gray mb-4">No payment methods on file. Top up your Asteria wallet to place orders.</p>
            <a
              href="/dashboard"
              className="inline-block text-sm bg-ast-surface border border-ast-primary/30 text-ast-primary rounded-xl px-5 py-2.5 font-medium hover:bg-ast-muted transition-colors"
            >
              Add Funds to Wallet
            </a>
          </div>
        </div>

        <div className="bg-red-50 border border-red-100 rounded-2xl p-6">
          <h2 className="font-semibold text-red-700 mb-2 flex items-center gap-2">
            <LogOut size={16} /> Sign Out
          </h2>
          <p className="text-sm text-red-600/80 mb-4">You will be signed out of all devices.</p>
          <button
            onClick={handleSignOut}
            className="text-sm bg-white border border-red-200 text-red-600 rounded-xl px-5 py-2.5 font-medium hover:bg-red-600 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
