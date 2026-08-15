'use client'

/**
 * components/ui/KYCBadge.tsx — Unified KYC Verified Badge
 *
 * Single source of truth for the verified indicator.
 * Used on: freelancer cards, profile pages, gig pages, admin panels, chat.
 *
 * Phase 9 Accessibility:
 * - Pairs icon + color + text label (never relies on color alone)
 * - Uses aria-label for screen reader clarity
 */

import { ShieldCheck, Clock, ShieldX, Shield } from 'lucide-react'

type KYCStatus = 'APPROVED' | 'PENDING' | 'REJECTED' | 'UNSUBMITTED' | undefined | null

interface KYCBadgeProps {
  status: KYCStatus
  /** 'full' shows icon + text label. 'icon' shows icon only with tooltip. Default: 'full' */
  variant?: 'full' | 'icon'
  className?: string
}

const STATUS_MAP: Record<string, {
  Icon: React.ComponentType<any>
  label: string
  ariaLabel: string
  style: string
  iconColor: string
}> = {
  APPROVED: {
    Icon:      ShieldCheck,
    label:     'KYC Verified',
    ariaLabel: 'Identity verified',
    style:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
    iconColor: 'text-emerald-600',
  },
  PENDING: {
    Icon:      Clock,
    label:     'Verification Pending',
    ariaLabel: 'Identity verification pending',
    style:     'bg-amber-50 text-amber-700 border border-amber-200',
    iconColor: 'text-amber-500',
  },
  REJECTED: {
    Icon:      ShieldX,
    label:     'Verification Failed',
    ariaLabel: 'Identity verification rejected',
    style:     'bg-red-50 text-red-700 border border-red-200',
    iconColor: 'text-red-500',
  },
  UNSUBMITTED: {
    Icon:      Shield,
    label:     'Not Verified',
    ariaLabel: 'Identity not yet verified',
    style:     'bg-gray-50 text-gray-500 border border-gray-200',
    iconColor: 'text-gray-400',
  },
}

export function KYCBadge({ status, variant = 'full', className = '' }: KYCBadgeProps) {
  const key = status ?? 'UNSUBMITTED'
  const config = STATUS_MAP[key] ?? STATUS_MAP.UNSUBMITTED
  const { Icon, label, ariaLabel, style, iconColor } = config

  if (variant === 'icon') {
    return (
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full ${className}`}
        role="img"
        aria-label={ariaLabel}
        title={label}
      >
        <Icon size={14} className={iconColor} aria-hidden="true" />
      </span>
    )
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full ${style} ${className}`}
      role="status"
      aria-label={ariaLabel}
    >
      {/* Icon — aria-hidden because the text label carries the meaning */}
      <Icon size={11} className={iconColor} aria-hidden="true" />
      {/* Text label — always present so color is never the sole indicator */}
      <span>{label}</span>
    </span>
  )
}

export default KYCBadge
