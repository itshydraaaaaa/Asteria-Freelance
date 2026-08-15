'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, ShieldCheck, DollarSign, MessageSquare, CheckCircle2, Clock } from 'lucide-react'

const MOCK_NOTIFICATIONS = [
  {
    id: 'n1',
    title: 'KYC Identity Status Approved',
    body: 'Your identity document submission has been verified by Asteria Administration.',
    time: '5m ago',
    type: 'VERIFICATION',
    read: false,
  },
  {
    id: 'n2',
    title: 'New Order Received ($350)',
    body: 'Client funded escrow for 5 SaaS Dashboard Screens.',
    time: '1h ago',
    type: 'ORDER',
    read: false,
  },
  {
    id: 'n3',
    title: 'New Direct Message',
    body: 'Sara Al-Mansouri sent a message regarding wireframes.',
    time: '2h ago',
    type: 'MESSAGE',
    read: true,
  },
]

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState(MOCK_NOTIFICATIONS)

  const unreadCount = items.filter(i => !i.read).length

  const markAllRead = () => {
    setItems(prev => prev.map(i => ({ ...i, read: true })))
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-ast-light text-ast-dark font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse">
            {unreadCount}
          </span>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-80 bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden z-50 text-black"
          >
            <div className="px-5 py-3.5 border-b border-black/8 flex items-center justify-between bg-ast-surface/50">
              <span className="font-heading font-bold text-sm text-black">Notifications</span>
              {unreadCount > 0 && (
                <button onClick={markAllRead} className="text-[11px] font-semibold text-ast-primary hover:underline">
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-black/5">
              {items.map(n => (
                <div key={n.id} className={`p-4 transition-colors hover:bg-ast-surface/40 ${!n.read ? 'bg-ast-surface/30' : ''}`}>
                  <div className="flex items-start gap-3">
                    {n.type === 'VERIFICATION' && <ShieldCheck size={18} className="text-emerald-600 shrink-0 mt-0.5" />}
                    {n.type === 'ORDER' && <DollarSign size={18} className="text-ast-primary shrink-0 mt-0.5" />}
                    {n.type === 'MESSAGE' && <MessageSquare size={18} className="text-sky-600 shrink-0 mt-0.5" />}

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-xs text-black">{n.title}</p>
                      <p className="text-[11px] text-ast-gray mt-0.5 leading-relaxed">{n.body}</p>
                      <span className="text-[10px] text-ast-gray mt-1 block">{n.time}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 border-t border-black/8 text-center bg-ast-surface/30">
              <span className="text-[11px] font-semibold text-ast-primary">Asteria Real-Time Activity</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
