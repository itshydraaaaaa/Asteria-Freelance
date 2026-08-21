/**
 * lib/data/demoUsers.ts — Pre-seeded Admin Account
 *
 * Kept strictly for master platform administration.
 */

import type { UserRecord } from '@/lib/db'

export const DEMO_USERS: Record<string, UserRecord> = {
  admin1: {
    id: 'admin1',
    name: 'Admin Master',
    email: 'admin.master@asteria.com',
    role: 'ADMIN',
    image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    bio: 'Platform Master Administrator',
    skills: ['Platform Management', 'Dispute Resolution', 'Audit'],
    walletBalance: 0,
    verifiedStatus: 'APPROVED',
    rating: 5.0,
    reviewCount: 0,
    createdAt: new Date('2025-01-01'),
  },
}
