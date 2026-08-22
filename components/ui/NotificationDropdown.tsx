'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, ShieldCheck, DollarSign, MessageSquare, CheckCircle2, Clock, Layers, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface NotificationItem {
  id: string
  title: string
  message: string
  type: string
  link?: string
  isRead: boolean
  createdAt: string
}

export function NotificationDropdown() {
  const [open, setOpen] = useState(false)
  const [items, setItems] = useState<NotificationItem[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications')
      if (res.ok) {
        const data = await res.json()
        setItems(data.notifications || [])
        setUnreadCount(data.unreadCount || 0)
      }
    } catch (err) {
      console.error('Failed to load notifications:', err)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 10000) // Poll every 10s
    return () => clearInterval(interval)
  }, [])

  const markAllRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'MARK_ALL_READ' }),
      })
      setItems(prev => prev.map(i => ({ ...i, isRead: true })))
      setUnreadCount(0)
    } catch {}
  }

  const markSingleRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      setItems(prev => prev.map(i => (i.id === id ? { ...i, isRead: true } : i)))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {}
  }

  const getIcon = (type: string) => {
    switch (type) {
      case 'KYC_APPROVED':
      case 'KYC_REJECTED':
      case 'VERIFICATION':
        return <ShieldCheck size={16} className="text-emerald-600 shrink-0 mt-0.5" />
      case 'ORDER':
      case 'PAYMENT':
      case 'WITHDRAWAL_APPROVED':
      case 'WITHDRAWAL_REJECTED':
        return <DollarSign size={16} className="text-ast-primary shrink-0 mt-0.5" />
      case 'MESSAGE':
        return <MessageSquare size={16} className="text-sky-600 shrink-0 mt-0.5" />
      case 'PROPOSAL_RECEIVED':
      case 'MILESTONE':
        return <Layers size={16} className="text-purple-600 shrink-0 mt-0.5" />
      default:
        return <Bell size={16} className="text-ast-gray shrink-0 mt-0.5" />
    }
  }

  useEffect(() => {
    if (!open) return
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [open])

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="relative p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors"
        aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
        aria-haspopup="true"
        aria-expanded={open}
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-4 h-4 bg-ast-light text-ast-dark font-bold text-[10px] rounded-full flex items-center justify-center animate-pulse shadow-sm">
            {unreadCount > 9 ? '9+' : unreadCount}
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
            className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-3xl shadow-2xl border border-black/10 overflow-hidden z-50 text-black"
            role="region"
            aria-live="polite"
          >
            <div className="px-5 py-3.5 border-b border-black/8 flex items-center justify-between bg-ast-surface/50">
              <div className="flex items-center gap-2">
                <span className="font-heading font-bold text-sm text-black">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] font-bold bg-ast-primary/10 text-ast-primary px-2 py-0.5 rounded-full">
                    {unreadCount} new
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-[11px] font-semibold text-ast-primary hover:underline"
                >
                  Mark all read
                </button>
              )}
            </div>

            <div className="max-h-80 overflow-y-auto divide-y divide-black/5">
              {items.length === 0 ? (
                <div className="p-8 text-center text-xs text-ast-gray">
                  No notifications yet.
                </div>
              ) : (
                items.map(n => (
                  <div
                    key={n.id}
                    onClick={() => markSingleRead(n.id)}
                    className={`p-4 transition-colors hover:bg-ast-surface/50 cursor-pointer ${
                      !n.isRead ? 'bg-ast-primary/5' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {getIcon(n.type)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className="font-semibold text-xs text-black truncate">{n.title}</p>
                          {!n.isRead && (
                            <span className="w-2 h-2 rounded-full bg-ast-primary shrink-0" />
                          )}
                        </div>
                        <p className="text-[11px] text-ast-gray mt-0.5 leading-relaxed">{n.message}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-[10px] text-ast-gray">
                            {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {n.link && (
                            <Link
                              href={n.link}
                              onClick={() => setOpen(false)}
                              className="text-[10px] font-bold text-ast-primary hover:underline flex items-center gap-0.5"
                            >
                              View →
                            </Link>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-3 border-t border-black/8 text-center bg-ast-surface/30">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="text-[11px] font-semibold text-ast-primary hover:underline"
              >
                Go to Dashboard Activity Center
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
