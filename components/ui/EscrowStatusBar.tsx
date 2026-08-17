/**
 * components/ui/EscrowStatusBar.tsx — Sticky Escrow Status Indicator
 *
 * Phase 9: Escrow & Trust UI Pattern
 * Escrow status must be persistently visible on the order workspace regardless
 * of which tab/section is scrolled into view.
 *
 * Accessibility: icon + color + text label (never color alone).
 */

'use client'

import { Lock, CheckCircle2, XCircle, Clock, AlertTriangle } from 'lucide-react'

type OrderStatus = 'ACTIVE' | 'PENDING' | 'COMPLETED' | 'CANCELLED'

interface EscrowStatusBarProps {
  status: OrderStatus
  amount: number
  currency?: string
}

const STATUS_CONFIG: Record<OrderStatus, {
  Icon: React.ComponentType<any>
  label: string
  sublabel: string
  bg: string
  border: string
  text: string
  iconColor: string
}> = {
  ACTIVE: {
    Icon:      Lock,
    label:     'Funds in Escrow',
    sublabel:  'Payment is held securely until you approve the work',
    bg:        'bg-[#0a3a40]/5',
    border:    'border-[#11606e]/20',
    text:      'text-[#0a3a40]',
    iconColor: 'text-[#11606e]',
  },
  PENDING: {
    Icon:      Clock,
    label:     'Awaiting Your Approval',
    sublabel:  'Work has been submitted. Review and approve to release payment.',
    bg:        'bg-amber-50',
    border:    'border-amber-200',
    text:      'text-amber-900',
    iconColor: 'text-amber-600',
  },
  COMPLETED: {
    Icon:      CheckCircle2,
    label:     'Payment Released',
    sublabel:  '88% net payout has been credited to the freelancer\'s wallet (12% platform fee)',
    bg:        'bg-emerald-50',
    border:    'border-emerald-200',
    text:      'text-emerald-900',
    iconColor: 'text-emerald-600',
  },
  CANCELLED: {
    Icon:      XCircle,
    label:     'Order Cancelled — Funds Refunded',
    sublabel:  'Escrow has been returned to buyer wallet',
    bg:        'bg-red-50',
    border:    'border-red-200',
    text:      'text-red-900',
    iconColor: 'text-red-500',
  },
}

export function EscrowStatusBar({ status, amount, currency = 'USD' }: EscrowStatusBarProps) {
  const { Icon, label, sublabel, bg, border, text, iconColor } = STATUS_CONFIG[status]

  return (
    <div
      className={`sticky top-0 z-20 w-full border-b ${border} ${bg} px-4 py-3`}
      role="status"
      aria-label={`Escrow status: ${label}`}
    >
      <div className="flex items-center gap-3 max-w-4xl mx-auto">
        {/* Icon — aria-hidden; text label carries the meaning */}
        <div className={`shrink-0 ${iconColor}`} aria-hidden="true">
          <Icon size={18} />
        </div>

        <div className="flex-1 min-w-0">
          <div className={`flex items-center gap-2 flex-wrap`}>
            <span className={`font-semibold text-sm ${text}`}>{label}</span>
            <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded ${bg} border ${border} ${text}`}>
              ${amount.toFixed(2)} {currency}
            </span>
          </div>
          <p className={`text-xs mt-0.5 ${text} opacity-70 truncate`}>{sublabel}</p>
        </div>

        {/* Visual escrow lock animation for ACTIVE state */}
        {status === 'ACTIVE' && (
          <div className="shrink-0 flex items-center gap-1" aria-hidden="true">
            <div className="w-1.5 h-1.5 rounded-full bg-[#11606e] animate-pulse" />
            <span className="text-[10px] font-medium text-[#11606e] uppercase tracking-wide">Secure</span>
          </div>
        )}
      </div>
    </div>
  )
}

export default EscrowStatusBar
