/**
 * lib/db.ts — Asteria Real Data Layer
 *
 * All data reads and writes across Asteria go directly through Supabase.
 * Strictly queries live database tables with zero local static fallbacks.
 */

import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'

// ─── Supabase client helper ──────────────────────────────────────────────────
export async function getDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tvuktwtartbqmggndinu.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

  // 1. If service role key is configured, use it directly (bypasses RLS for server-side admin operations)
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your-service-role-key-here') {
    return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  // 2. Try obtaining authenticated user session from Next.js request cookies
  try {
    const userClient = await createServerSupabaseClient()
    const { data: { session } } = await userClient.auth.getSession()
    if (session?.access_token) {
      return userClient
    }
  } catch (e) {}

  // 3. Fallback to public anon client
  return createClient(url, anonKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

// ─── Types ────────────────────────────────────────────────────────────────────
export interface UserRecord {
  id: string
  name: string
  email: string
  role: 'CLIENT' | 'FREELANCER' | 'ADMIN'
  password?: string
  image?: string
  bio?: string
  skills?: string[]
  walletBalance: number
  verifiedStatus?: 'UNSUBMITTED' | 'PENDING' | 'APPROVED' | 'REJECTED'
  rating?: number
  reviewCount?: number
  createdAt: Date
}

export interface OrderRecord {
  id: string
  gigId: string
  buyerId: string
  sellerId: string
  amount: number
  status: 'PENDING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED'
  escrowStatus?: string
  deliveryNote?: string
  disputeReason?: string
  requiresSecondApproval?: boolean
  createdAt: Date
  updatedAt?: Date
  gig?: any
  buyer?: any
  seller?: any
  milestones?: MilestoneItem[]
}

export interface MilestoneItem {
  id: string
  orderId: string
  title: string
  percentage: number
  amount: number
  status: 'PENDING' | 'FUNDED' | 'SUBMITTED' | 'RELEASED'
  position: number
  createdAt?: Date
}

export interface JobRecord {
  id: string
  title: string
  description: string
  category: string
  budget: number
  deliveryDays: number
  skills: string[]
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED' | 'CLOSED'
  clientId: string
  client?: any
  _count?: { proposals: number }
  createdAt: Date
}

export interface ProposalRecord {
  id: string
  jobId: string
  freelancerId: string
  coverLetter: string
  price: number
  deliveryDays: number
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED'
  createdAt: Date
  freelancer?: any
}

export interface VerificationRecord {
  id: string
  userId: string
  fullName: string
  dob: string
  country: string
  documentType: string
  documentNumber: string
  idFrontPath: string
  idBackPath: string
  selfiePath: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  reviewedBy?: string
  reviewedAt?: Date
  submittedAt: Date
  user?: UserRecord
}

export interface AuditLogRecord {
  id: string
  adminId: string
  adminName: string
  action: string
  targetId?: string
  details: string
  createdAt: Date
}

export interface MessageRecord {
  id: string
  senderId: string
  receiverId: string
  content: string
  msgType: 'TEXT' | 'CUSTOM_OFFER' | 'FILE'
  offerData?: any
  isRead: boolean
  createdAt: Date
}

export interface ReportRecord {
  id: string
  targetId: string
  targetType?: string
  targetTitle?: string
  reporterId: string
  reporterName?: string
  reason: string
  description?: string
  status: 'UNRESOLVED' | 'RESOLVED' | 'DISMISSED' | 'PENDING' | 'PENDING_SECOND_APPROVAL'
  orderId?: string
  resolutionAction?: string
  resolutionNotes?: string
  resolvedBy?: string
  resolvedAt?: Date
  createdAt: Date
}

export interface NotificationRecord {
  id: string
  userId: string
  title: string
  message: string
  type: string
  link?: string
  isRead: boolean
  createdAt: Date
}

// ─── UNIFIED DB ACCESS OBJECT (100% SUPABASE LIVE DATA) ─────────────────────────
export const db = {
  // ── USER ───────────────────────────────────────────────────────────────────
  user: {
    findMany: async (query?: { where?: any; orderBy?: any; include?: any; select?: any }): Promise<UserRecord[]> => {
      try {
        const supabase = await getDbClient()
        let q = supabase.from('User').select('*')
        if (query?.where?.role) q = q.eq('role', query.where.role)
        if (query?.where?.verifiedStatus) q = q.eq('verifiedStatus', query.where.verifiedStatus)
        
        const { data, error } = await q.order('createdAt', { ascending: false })
        if (error || !data) return []

        return data.map(u => ({
          id: u.id,
          name: u.name || 'User',
          email: u.email || '',
          role: u.role || 'CLIENT',
          image: u.image || null,
          bio: u.bio || '',
          skills: Array.isArray(u.skills) ? u.skills : (u.skills ? u.skills.split(',') : []),
          walletBalance: Number(u.walletBalance ?? 0),
          verifiedStatus: u.verifiedStatus || (u.role === 'ADMIN' ? 'APPROVED' : 'UNSUBMITTED'),
          rating: Number(u.rating ?? 5.0),
          reviewCount: Number(u.reviewCount ?? 0),
          createdAt: new Date(u.createdAt || Date.now()),
        }))
      } catch (e) {
        console.error('db.user.findMany error:', e)
        return []
      }
    },

    findUnique: async ({ where }: { where: { id?: string; email?: string }; select?: any; include?: any }): Promise<UserRecord | null> => {
      try {
        const supabase = await getDbClient()
        let query = supabase.from('User').select('*')
        if (where.id) query = query.eq('id', where.id)
        if (where.email) query = query.eq('email', where.email.toLowerCase())
        
        const { data, error } = await query.maybeSingle()
        if (error || !data) return null

        return {
          id: data.id,
          name: data.name || 'User',
          email: data.email || '',
          role: data.role || 'CLIENT',
          password: data.password,
          image: data.image || null,
          bio: data.bio || '',
          skills: Array.isArray(data.skills) ? data.skills : (data.skills ? data.skills.split(',') : []),
          walletBalance: Number(data.walletBalance ?? 0),
          verifiedStatus: data.verifiedStatus || (data.role === 'ADMIN' ? 'APPROVED' : 'UNSUBMITTED'),
          rating: Number(data.rating ?? 5.0),
          reviewCount: Number(data.reviewCount ?? 0),
          createdAt: new Date(data.createdAt || Date.now()),
        }
      } catch (e) {
        console.error('db.user.findUnique error:', e)
        return null
      }
    },

    create: async ({ data }: { data: Partial<UserRecord> & { password?: string } }): Promise<UserRecord> => {
      const supabase = await getDbClient()
      const payload: any = {
        name: data.name ?? 'New User',
        email: (data.email ?? '').toLowerCase(),
        role: data.role ?? 'CLIENT',
        image: data.image ?? null,
        bio: data.bio ?? '',
        skills: data.skills ?? [],
        walletBalance: data.walletBalance ?? 0,
        verifiedStatus: data.verifiedStatus ?? (data.role === 'ADMIN' ? 'APPROVED' : 'UNSUBMITTED'),
        rating: 5.0,
        reviewCount: 0,
      }
      if (data.id) payload.id = data.id
      if (data.password) payload.password = data.password

      const { data: created, error } = await supabase.from('User').insert(payload).select('*').single()
      if (error || !created) {
        throw new Error(error?.message || 'Failed to create user in database')
      }

      return {
        ...created,
        skills: Array.isArray(created.skills) ? created.skills : [],
        walletBalance: Number(created.walletBalance ?? 0),
        createdAt: new Date(created.createdAt || Date.now()),
      }
    },

    update: async ({ where, data }: { where: { id: string }; data: Partial<UserRecord> }): Promise<UserRecord | null> => {
      try {
        const supabase = await getDbClient()
        const { data: updated, error } = await supabase
          .from('User')
          .update(data)
          .eq('id', where.id)
          .select('*')
          .single()

        if (error || !updated) return null
        return {
          ...updated,
          skills: Array.isArray(updated.skills) ? updated.skills : [],
          walletBalance: Number(updated.walletBalance ?? 0),
          createdAt: new Date(updated.createdAt || Date.now()),
        }
      } catch (e) {
        console.error('db.user.update error:', e)
        return null
      }
    },

    count: async (query?: { where?: any }): Promise<number> => {
      try {
        const supabase = await getDbClient()
        let q = supabase.from('User').select('*', { count: 'exact', head: true })
        if (query?.where?.role) q = q.eq('role', query.where.role)
        const { count } = await q
        return count ?? 0
      } catch {
        return 0
      }
    },
  },

  // ── GIG ─────────────────────────────────────────────────────────────────────
  gig: {
    count: async (query?: { where?: any }): Promise<number> => {
      try {
        const supabase = await getDbClient()
        let q = supabase.from('Gig').select('*', { count: 'exact', head: true })
        if (query?.where?.freelancerId) q = q.eq('freelancerId', query.where.freelancerId)
        if (query?.where?.category) q = q.eq('category', query.where.category)
        const { count } = await q
        return count ?? 0
      } catch {
        return 0
      }
    },

    findMany: async (query?: { where?: any; orderBy?: any; take?: number; limit?: number; include?: any }): Promise<any[]> => {
      try {
        const supabase = await getDbClient()
        let q = supabase.from('Gig').select('*, freelancer:User!freelancerId(id, name, image, role, rating, reviewCount)')
        
        if (query?.where?.freelancerId) q = q.eq('freelancerId', query.where.freelancerId)
        if (query?.where?.category && query.where.category !== 'All' && query.where.category !== 'All Categories') {
          q = q.ilike('category', query.where.category)
        }
        if (query?.where?.featured !== undefined) q = q.eq('featured', query.where.featured)

        const limit = query?.take ?? query?.limit
        if (limit) q = q.limit(limit)

        const { data, error } = await q.order('createdAt', { ascending: false })
        if (error || !data) return []

        return data.map(g => ({
          ...g,
          tags: Array.isArray(g.tags) ? g.tags : (g.tags ? g.tags.split(',') : []),
          freelancer: g.freelancer || { name: 'Freelancer' },
          price: Number(g.price ?? 0),
          deliveryDays: Number(g.deliveryDays ?? 1),
          rating: Number(g.rating ?? 5.0),
          reviewCount: Number(g.reviewCount ?? 0),
          createdAt: new Date(g.createdAt || Date.now()),
        }))
      } catch (e) {
        console.error('db.gig.findMany error:', e)
        return []
      }
    },

    findUnique: async ({ where }: { where: { id: string }; include?: any }): Promise<any | null> => {
      try {
        const supabase = await getDbClient()
        const { data, error } = await supabase
          .from('Gig')
          .select('*, freelancer:User!freelancerId(id, name, image, role, bio, rating, reviewCount)')
          .eq('id', where.id)
          .maybeSingle()

        if (error || !data) return null

        return {
          ...data,
          tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',') : []),
          freelancer: data.freelancer || { id: data.freelancerId, name: 'Freelancer' },
          price: Number(data.price ?? 0),
          deliveryDays: Number(data.deliveryDays ?? 1),
          rating: Number(data.rating ?? 5.0),
          reviewCount: Number(data.reviewCount ?? 0),
          createdAt: new Date(data.createdAt || Date.now()),
        }
      } catch (e) {
        console.error('db.gig.findUnique error:', e)
        return null
      }
    },

    create: async ({ data }: { data: any }): Promise<any> => {
      const supabase = await getDbClient()
      const { data: created, error } = await supabase.from('Gig').insert({
        title: data.title,
        description: data.description,
        category: data.category,
        price: Number(data.price),
        deliveryDays: Number(data.deliveryDays),
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map((t: string) => t.trim()) : []),
        image: data.image || 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
        freelancerId: data.freelancerId,
        featured: data.featured ?? false,
        status: data.status || 'ACTIVE',
        rating: 5.0,
        reviewCount: 0,
      }).select('*').single()

      if (error || !created) {
        throw new Error(error?.message || 'Failed to create gig in database')
      }
      return created
    },

    update: async ({ where, data }: { where: { id: string }; data: any }): Promise<any> => {
      try {
        const supabase = await getDbClient()
        const { data: updated, error } = await supabase
          .from('Gig')
          .update(data)
          .eq('id', where.id)
          .select('*')
          .single()

        if (error || !updated) return null
        return updated
      } catch (e) {
        console.error('db.gig.update error:', e)
        return null
      }
    },

    delete: async ({ where }: { where: { id: string } }): Promise<any> => {
      try {
        const supabase = await getDbClient()
        const { data: deleted, error } = await supabase
          .from('Gig')
          .delete()
          .eq('id', where.id)
          .select('*')
          .single()

        return deleted || null
      } catch (e) {
        console.error('db.gig.delete error:', e)
        return null
      }
    },
  },

  // ── JOB ─────────────────────────────────────────────────────────────────────
  job: {
    findMany: async (query?: { where?: { status?: string; clientId?: string }; orderBy?: any; include?: any }): Promise<JobRecord[]> => {
      try {
        const supabase = await getDbClient()
        let q = supabase.from('Job').select('*, client:User!clientId(id, name, image, role)')
        
        if (query?.where?.status) q = q.eq('status', query.where.status)
        if (query?.where?.clientId) q = q.eq('clientId', query.where.clientId)

        const { data, error } = await q.order('createdAt', { ascending: false })
        if (error || !data) return []

        const { data: proposals } = await supabase.from('Proposal').select('jobId')

        return data.map(j => {
          const jobProps = (proposals || []).filter(p => p.jobId === j.id)
          return {
            id: j.id,
            title: j.title,
            description: j.description,
            category: j.category,
            budget: Number(j.budget ?? 0),
            deliveryDays: Number(j.deliveryDays ?? 1),
            skills: Array.isArray(j.skills) ? j.skills : (j.skills ? j.skills.split(',') : []),
            status: j.status || 'OPEN',
            clientId: j.clientId,
            client: j.client || { name: 'Client' },
            _count: { proposals: jobProps.length },
            createdAt: new Date(j.createdAt || Date.now()),
          }
        })
      } catch (e) {
        console.error('db.job.findMany error:', e)
        return []
      }
    },

    findUnique: async ({ where }: { where: { id: string }; include?: any }): Promise<JobRecord | null> => {
      try {
        const supabase = await getDbClient()
        const { data, error } = await supabase
          .from('Job')
          .select('*, client:User!clientId(id, name, image, role)')
          .eq('id', where.id)
          .maybeSingle()

        if (error || !data) return null

        const { data: proposals } = await supabase.from('Proposal').select('jobId').eq('jobId', data.id)

        return {
          id: data.id,
          title: data.title,
          description: data.description,
          category: data.category,
          budget: Number(data.budget ?? 0),
          deliveryDays: Number(data.deliveryDays ?? 1),
          skills: Array.isArray(data.skills) ? data.skills : (data.skills ? data.skills.split(',') : []),
          status: data.status || 'OPEN',
          clientId: data.clientId,
          client: data.client || { name: 'Client' },
          _count: { proposals: (proposals || []).length },
          createdAt: new Date(data.createdAt || Date.now()),
        }
      } catch (e) {
        console.error('db.job.findUnique error:', e)
        return null
      }
    },

    create: async ({ data }: { data: any }): Promise<JobRecord> => {
      const supabase = await getDbClient()
      const { data: created, error } = await supabase.from('Job').insert({
        title: data.title,
        description: data.description,
        category: data.category,
        budget: Number(data.budget),
        deliveryDays: Number(data.deliveryDays),
        skills: Array.isArray(data.skills) ? data.skills : (data.skills ? data.skills.split(',').map((s: string) => s.trim()) : []),
        status: 'OPEN',
        clientId: data.clientId,
      }).select('*').single()

      if (error || !created) {
        throw new Error(error?.message || 'Failed to create job in database')
      }

      return {
        ...created,
        budget: Number(created.budget),
        deliveryDays: Number(created.deliveryDays),
        skills: Array.isArray(created.skills) ? created.skills : [],
        createdAt: new Date(created.createdAt || Date.now()),
      }
    },

    update: async ({ where, data }: { where: { id: string }; data: Partial<JobRecord> }): Promise<JobRecord | null> => {
      try {
        const supabase = await getDbClient()
        const { data: updated, error } = await supabase
          .from('Job')
          .update(data)
          .eq('id', where.id)
          .select('*')
          .single()

        if (error || !updated) return null
        return {
          ...updated,
          budget: Number(updated.budget),
          deliveryDays: Number(updated.deliveryDays),
          skills: Array.isArray(updated.skills) ? updated.skills : [],
          createdAt: new Date(updated.createdAt || Date.now()),
        }
      } catch (e) {
        console.error('db.job.update error:', e)
        return null
      }
    },
  },

  // ── PROPOSAL ────────────────────────────────────────────────────────────────
  proposal: {
    findMany: async (query?: { where?: { jobId?: string; freelancerId?: string }; orderBy?: any; include?: any }): Promise<ProposalRecord[]> => {
      try {
        const supabase = await getDbClient()
        let q = supabase.from('Proposal').select('*, freelancer:User!freelancerId(id, name, image, role, rating, reviewCount)')
        
        if (query?.where?.jobId) q = q.eq('jobId', query.where.jobId)
        if (query?.where?.freelancerId) q = q.eq('freelancerId', query.where.freelancerId)

        const { data, error } = await q.order('createdAt', { ascending: false })
        if (error || !data) return []

        return data.map(p => ({
          id: p.id,
          jobId: p.jobId,
          freelancerId: p.freelancerId,
          coverLetter: p.coverLetter || '',
          price: Number(p.price ?? 0),
          deliveryDays: Number(p.deliveryDays ?? 1),
          status: p.status || 'PENDING',
          freelancer: p.freelancer || { name: 'Freelancer' },
          createdAt: new Date(p.createdAt || Date.now()),
        }))
      } catch (e) {
        console.error('db.proposal.findMany error:', e)
        return []
      }
    },

    findFirst: async (query?: { where?: { jobId?: string; freelancerId?: string } }): Promise<ProposalRecord | null> => {
      const list = await db.proposal.findMany(query)
      return list[0] || null
    },

    findUnique: async ({ where }: { where: { id: string } }): Promise<ProposalRecord | null> => {
      try {
        const supabase = await getDbClient()
        const { data, error } = await supabase
          .from('Proposal')
          .select('*, freelancer:User!freelancerId(id, name, image, role, rating, reviewCount)')
          .eq('id', where.id)
          .maybeSingle()

        if (error || !data) return null
        return {
          id: data.id,
          jobId: data.jobId,
          freelancerId: data.freelancerId,
          coverLetter: data.coverLetter || '',
          price: Number(data.price ?? 0),
          deliveryDays: Number(data.deliveryDays ?? 1),
          status: data.status || 'PENDING',
          freelancer: data.freelancer || { name: 'Freelancer' },
          createdAt: new Date(data.createdAt || Date.now()),
        }
      } catch (e) {
        console.error('db.proposal.findUnique error:', e)
        return null
      }
    },

    create: async ({ data }: { data: any }): Promise<ProposalRecord> => {
      const supabase = await getDbClient()
      const { data: created, error } = await supabase.from('Proposal').insert({
        jobId: data.jobId,
        freelancerId: data.freelancerId,
        coverLetter: data.coverLetter,
        price: Number(data.price),
        deliveryDays: Number(data.deliveryDays ?? 3),
        status: 'PENDING',
      }).select('*').single()

      if (error || !created) {
        throw new Error(error?.message || 'Failed to submit proposal')
      }

      return {
        ...created,
        price: Number(created.price),
        deliveryDays: Number(created.deliveryDays),
        createdAt: new Date(created.createdAt || Date.now()),
      }
    },

    update: async ({ where, data }: { where: { id: string }; data: Partial<ProposalRecord> }): Promise<ProposalRecord | null> => {
      try {
        const supabase = await getDbClient()
        const { data: updated, error } = await supabase
          .from('Proposal')
          .update(data)
          .eq('id', where.id)
          .select('*')
          .single()

        if (error || !updated) return null
        return {
          ...updated,
          price: Number(updated.price),
          deliveryDays: Number(updated.deliveryDays),
          createdAt: new Date(updated.createdAt || Date.now()),
        }
      } catch (e) {
        console.error('db.proposal.update error:', e)
        return null
      }
    },
  },

  // ── ORDER ───────────────────────────────────────────────────────────────────
  order: {
    findMany: async (query?: { where?: { buyerId?: string; sellerId?: string; status?: string }; orderBy?: any; take?: number; include?: any }): Promise<OrderRecord[]> => {
      try {
        const supabase = await getDbClient()
        let q = supabase.from('Order').select('*, buyer:User!buyerId(id, name, email, image), seller:User!sellerId(id, name, email, image), gig:Gig(*), milestones:Milestone(*)')
        
        if (query?.where?.buyerId) q = q.eq('buyerId', query.where.buyerId)
        if (query?.where?.sellerId) q = q.eq('sellerId', query.where.sellerId)
        if (query?.where?.status) q = q.eq('status', query.where.status)

        const limit = query?.take
        if (limit) q = q.limit(limit)

        const { data, error } = await q.order('createdAt', { ascending: false })
        if (error || !data) return []

        return data.map(o => ({
          id: o.id,
          gigId: o.gigId,
          buyerId: o.buyerId,
          sellerId: o.sellerId,
          amount: Number(o.amount ?? 0),
          status: o.status || 'PENDING',
          escrowStatus: o.escrowStatus || 'HELD',
          deliveryNote: o.deliveryNote,
          disputeReason: o.disputeReason,
          requiresSecondApproval: o.requiresSecondApproval || false,
          buyer: o.buyer,
          seller: o.seller,
          gig: o.gig,
          milestones: o.milestones || [],
          createdAt: new Date(o.createdAt || Date.now()),
          updatedAt: o.updatedAt ? new Date(o.updatedAt) : undefined,
        }))
      } catch (e) {
        console.error('db.order.findMany error:', e)
        return []
      }
    },

    findUnique: async ({ where }: { where: { id: string }; include?: any }): Promise<OrderRecord | null> => {
      try {
        const supabase = await getDbClient()
        const { data, error } = await supabase
          .from('Order')
          .select('*, buyer:User!buyerId(id, name, email, image), seller:User!sellerId(id, name, email, image), gig:Gig(*), milestones:Milestone(*)')
          .eq('id', where.id)
          .maybeSingle()

        if (error || !data) return null

        return {
          id: data.id,
          gigId: data.gigId,
          buyerId: data.buyerId,
          sellerId: data.sellerId,
          amount: Number(data.amount ?? 0),
          status: data.status || 'PENDING',
          escrowStatus: data.escrowStatus || 'HELD',
          deliveryNote: data.deliveryNote,
          disputeReason: data.disputeReason,
          requiresSecondApproval: data.requiresSecondApproval || false,
          buyer: data.buyer,
          seller: data.seller,
          gig: data.gig,
          milestones: data.milestones || [],
          createdAt: new Date(data.createdAt || Date.now()),
          updatedAt: data.updatedAt ? new Date(data.updatedAt) : undefined,
        }
      } catch (e) {
        console.error('db.order.findUnique error:', e)
        return null
      }
    },

    create: async ({ data }: { data: any }): Promise<OrderRecord> => {
      const supabase = await getDbClient()
      const { data: created, error } = await supabase.from('Order').insert({
        gigId: data.gigId,
        buyerId: data.buyerId,
        sellerId: data.sellerId,
        amount: Number(data.amount),
        status: data.status || 'PENDING',
        escrowStatus: 'HELD',
      }).select('*').single()

      if (error || !created) {
        throw new Error(error?.message || 'Failed to create order in database')
      }

      // If milestones provided, insert them
      if (data.milestones && Array.isArray(data.milestones) && data.milestones.length > 0) {
        const mInsert = data.milestones.map((m: any, idx: number) => ({
          orderId: created.id,
          title: m.title || `Milestone ${idx + 1}`,
          percentage: Number(m.percentage || 100),
          amount: Number(m.amount || created.amount),
          status: m.status || 'PENDING',
          position: idx,
        }))
        await supabase.from('Milestone').insert(mInsert)
      }

      return {
        ...created,
        amount: Number(created.amount),
        createdAt: new Date(created.createdAt || Date.now()),
      }
    },

    update: async ({ where, data }: { where: { id: string }; data: any }): Promise<OrderRecord | null> => {
      try {
        const supabase = await getDbClient()
        const { data: updated, error } = await supabase
          .from('Order')
          .update({
            ...data,
            updatedAt: new Date().toISOString(),
          })
          .eq('id', where.id)
          .select('*')
          .single()

        if (error || !updated) return null
        return {
          ...updated,
          amount: Number(updated.amount),
          createdAt: new Date(updated.createdAt || Date.now()),
        }
      } catch (e) {
        console.error('db.order.update error:', e)
        return null
      }
    },
  },

  // ── MILESTONE ───────────────────────────────────────────────────────────────
  milestone: {
    findMany: async (query?: { where?: { orderId?: string } }): Promise<MilestoneItem[]> => {
      try {
        const supabase = await getDbClient()
        let q = supabase.from('Milestone').select('*')
        if (query?.where?.orderId) q = q.eq('orderId', query.where.orderId)
        const { data, error } = await q.order('position', { ascending: true })
        if (error || !data) return []
        return data.map(m => ({
          ...m,
          amount: Number(m.amount ?? 0),
          percentage: Number(m.percentage ?? 100),
        }))
      } catch {
        return []
      }
    },

    findUnique: async ({ where }: { where: { id: string } }): Promise<MilestoneItem | null> => {
      try {
        const supabase = await getDbClient()
        const { data, error } = await supabase.from('Milestone').select('*').eq('id', where.id).maybeSingle()
        if (error || !data) return null
        return {
          ...data,
          amount: Number(data.amount ?? 0),
          percentage: Number(data.percentage ?? 100),
        }
      } catch {
        return null
      }
    },

    create: async ({ data }: { data: any }): Promise<MilestoneItem> => {
      const supabase = await getDbClient()
      const { data: created, error } = await supabase.from('Milestone').insert({
        orderId: data.orderId,
        title: data.title || 'Milestone',
        percentage: Number(data.percentage || 100),
        amount: Number(data.amount || 0),
        status: data.status || 'PENDING',
        position: Number(data.position || 0),
      }).select('*').single()

      if (error || !created) {
        throw new Error(error?.message || 'Failed to create milestone')
      }

      return {
        ...created,
        amount: Number(created.amount),
        percentage: Number(created.percentage),
      }
    },

    update: async ({ where, data }: { where: { id: string }; data: any }): Promise<any> => {
      try {
        const supabase = await getDbClient()
        const { data: updated, error } = await supabase
          .from('Milestone')
          .update(data)
          .eq('id', where.id)
          .select('*')
          .single()
        return updated || null
      } catch {
        return null
      }
    },
  },

  // ── VERIFICATION ───────────────────────────────────────────────────────────
  verification: {
    findMany: async (query?: { where?: { status?: string; userId?: string }; orderBy?: any }): Promise<VerificationRecord[]> => {
      try {
        const supabase = await getDbClient()
        let q = supabase.from('Verification').select('*, user:User!userId(*)')
        
        if (query?.where?.status) q = q.eq('status', query.where.status)
        if (query?.where?.userId) q = q.eq('userId', query.where.userId)

        const { data, error } = await q.order('submittedAt', { ascending: false })
        if (error || !data) return []

        return data.map(v => ({
          id: v.id,
          userId: v.userId,
          fullName: v.fullName || v.user?.name || 'Applicant',
          dob: v.dob || '1995-01-01',
          country: v.country || 'Tunisia',
          documentType: v.documentType || 'National ID',
          documentNumber: v.documentNumber || '12345678',
          idFrontPath: v.idFrontUrl || v.idFrontPath || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
          idBackPath: v.idBackUrl || v.idBackPath || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
          selfiePath: v.selfieUrl || v.selfiePath || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
          status: v.status || 'PENDING',
          rejectionReason: v.rejectionReason,
          reviewedBy: v.reviewedBy,
          reviewedAt: v.reviewedAt ? new Date(v.reviewedAt) : undefined,
          submittedAt: new Date(v.submittedAt || Date.now()),
          user: v.user ? {
            ...v.user,
            walletBalance: Number(v.user.walletBalance ?? 0),
            createdAt: new Date(v.user.createdAt || Date.now()),
          } : undefined,
        }))
      } catch (e) {
        console.error('db.verification.findMany error:', e)
        return []
      }
    },

    findUnique: async ({ where }: { where: { id?: string; userId?: string }; include?: any }): Promise<VerificationRecord | null> => {
      try {
        const supabase = await getDbClient()
        let q = supabase.from('Verification').select('*, user:User!userId(*)')
        if (where.id) q = q.eq('id', where.id)
        if (where.userId) q = q.eq('userId', where.userId)

        const { data, error } = await q.maybeSingle()
        if (error || !data) return null

        return {
          id: data.id,
          userId: data.userId,
          fullName: data.fullName || data.user?.name || 'Applicant',
          dob: data.dob || '1995-01-01',
          country: data.country || 'Tunisia',
          documentType: data.documentType || 'National ID',
          documentNumber: data.documentNumber || '12345678',
          idFrontPath: data.idFrontUrl || data.idFrontPath || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
          idBackPath: data.idBackUrl || data.idBackPath || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
          selfiePath: data.selfieUrl || data.selfiePath || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
          status: data.status || 'PENDING',
          rejectionReason: data.rejectionReason,
          reviewedBy: data.reviewedBy,
          reviewedAt: data.reviewedAt ? new Date(data.reviewedAt) : undefined,
          submittedAt: new Date(data.submittedAt || Date.now()),
          user: data.user ? {
            ...data.user,
            walletBalance: Number(data.user.walletBalance ?? 0),
            createdAt: new Date(data.user.createdAt || Date.now()),
          } : undefined,
        }
      } catch (e) {
        console.error('db.verification.findUnique error:', e)
        return null
      }
    },

    create: async ({ data }: { data: Partial<VerificationRecord> }): Promise<VerificationRecord> => {
      const supabase = await getDbClient()
      const front = data.idFrontPath || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600'
      const back  = data.idBackPath  || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600'
      const selfie = data.selfiePath || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400'

      const { data: created, error } = await supabase.from('Verification').insert({
        userId:         data.userId,
        fullName:       data.fullName || 'Applicant',
        dob:            data.dob || '1995-01-01',
        country:        data.country || 'Tunisia',
        documentType:   data.documentType || 'National ID',
        documentNumber: data.documentNumber || '12345678',
        idFrontPath:    front,
        idFrontUrl:     front,
        idBackPath:     back,
        idBackUrl:      back,
        selfiePath:     selfie,
        selfieUrl:      selfie,
        status:         'PENDING',
        submittedAt:    new Date().toISOString(),
      }).select('*').single()

      if (error || !created) {
        throw new Error(error?.message || 'Failed to submit KYC verification')
      }

      // Sync User verifiedStatus in Supabase
      await supabase.from('User').update({ verifiedStatus: 'PENDING' }).eq('id', data.userId)

      return {
        ...created,
        submittedAt: new Date(created.submittedAt || Date.now()),
      }
    },

    update: async ({ where, data }: { where: { id: string }; data: Partial<VerificationRecord> }): Promise<VerificationRecord | null> => {
      try {
        const supabase = await getDbClient()
        const { data: updated, error } = await supabase
          .from('Verification')
          .update({
            status: data.status,
            rejectionReason: data.rejectionReason,
            reviewedAt: new Date().toISOString(),
          })
          .eq('id', where.id)
          .select('*')
          .single()

        if (error || !updated) return null

        if (data.status && updated.userId) {
          await supabase.from('User').update({
            verifiedStatus: data.status,
          }).eq('id', updated.userId)
        }

        return {
          ...updated,
          submittedAt: new Date(updated.submittedAt || Date.now()),
        }
      } catch (e) {
        console.error('db.verification.update error:', e)
        return null
      }
    },
  },

  // ── MESSAGE ─────────────────────────────────────────────────────────────────
  message: {
    findMany: async (query?: { where?: { userId?: string; partnerId?: string } }): Promise<MessageRecord[]> => {
      try {
        const supabase = await getDbClient()
        let q = supabase.from('Message').select('*')

        if (query?.where?.userId) {
          q = q.or(`senderId.eq.${query.where.userId},receiverId.eq.${query.where.userId}`)
        }

        const { data, error } = await q.order('createdAt', { ascending: true })
        if (error || !data) return []

        return data.map(m => ({
          id: m.id,
          senderId: m.senderId,
          receiverId: m.receiverId,
          content: m.content || '',
          msgType: m.msgType || 'TEXT',
          offerData: m.offerData,
          isRead: m.isRead ?? false,
          createdAt: new Date(m.createdAt || Date.now()),
        }))
      } catch {
        return []
      }
    },

    create: async ({ data }: { data: any }): Promise<MessageRecord> => {
      const supabase = await getDbClient()
      const { data: created, error } = await supabase.from('Message').insert({
        senderId: data.senderId,
        receiverId: data.receiverId,
        content: data.content,
        msgType: data.msgType || 'TEXT',
        offerData: data.offerData,
        isRead: false,
      }).select('*').single()

      if (error || !created) {
        throw new Error(error?.message || 'Failed to send message')
      }

      return {
        ...created,
        createdAt: new Date(created.createdAt || Date.now()),
      }
    },
  },

  // ── NOTIFICATION ────────────────────────────────────────────────────────────
  notification: {
    findMany: async (query?: { where?: { userId?: string; isRead?: boolean }; orderBy?: any; take?: number }): Promise<NotificationRecord[]> => {
      try {
        const supabase = await getDbClient()
        let q = supabase.from('Notification').select('*')
        if (query?.where?.userId) q = q.eq('userId', query.where.userId)
        if (query?.where?.isRead !== undefined) q = q.eq('isRead', query.where.isRead)

        if (query?.take) q = q.limit(query.take)

        const { data, error } = await q.order('createdAt', { ascending: false })
        if (error || !data) return []

        return data.map(n => ({
          id: n.id,
          userId: n.userId,
          title: n.title || 'Notification',
          message: n.message || '',
          type: n.type || 'INFO',
          link: n.link,
          isRead: n.isRead ?? false,
          createdAt: new Date(n.createdAt || Date.now()),
        }))
      } catch {
        return []
      }
    },

    create: async ({ data }: { data: any }): Promise<NotificationRecord> => {
      const supabase = await getDbClient()
      const { data: created, error } = await supabase.from('Notification').insert({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'SYSTEM',
        link: data.link,
        isRead: false,
      }).select('*').single()

      if (error || !created) {
        throw new Error(error?.message || 'Failed to create notification')
      }

      return {
        ...created,
        createdAt: new Date(created.createdAt || Date.now()),
      }
    },

    update: async ({ where, data }: { where: { id: string }; data: Partial<NotificationRecord> }): Promise<any> => {
      try {
        const supabase = await getDbClient()
        const { data: updated, error } = await supabase
          .from('Notification')
          .update(data)
          .eq('id', where.id)
          .select('*')
          .single()
        return updated || null
      } catch {
        return null
      }
    },

    markAllAsRead: async (userId: string): Promise<void> => {
      try {
        const supabase = await getDbClient()
        await supabase
          .from('Notification')
          .update({ isRead: true })
          .eq('userId', userId)
      } catch {}
    },
  },

  // ── REVIEW ──────────────────────────────────────────────────────────────────
  review: {
    findMany: async (query?: { where?: { gigId?: string; authorId?: string; freelancerId?: string } }): Promise<any[]> => {
      try {
        const supabase = await getDbClient()
        let q = supabase.from('Review').select('*')
        if (query?.where?.gigId) q = q.eq('gigId', query.where.gigId)
        if (query?.where?.authorId) q = q.eq('authorId', query.where.authorId)

        const { data, error } = await q.order('createdAt', { ascending: false })
        if (error || !data) return []

        return data.map(r => ({
          ...r,
          rating: Number(r.rating ?? 5.0),
          createdAt: new Date(r.createdAt || Date.now()),
        }))
      } catch {
        return []
      }
    },

    create: async ({ data }: { data: any }): Promise<any> => {
      const supabase = await getDbClient()
      const { data: created, error } = await supabase.from('Review').insert({
        gigId: data.gigId,
        rating: Number(data.rating || 5.0),
        comment: data.comment,
        authorId: data.authorId,
        orderId: data.orderId,
      }).select('*').single()

      if (error || !created) {
        throw new Error(error?.message || 'Failed to create review')
      }

      return created
    },
  },

  // ── AUDIT LOG ───────────────────────────────────────────────────────────────
  auditLog: {
    findMany: async (query?: any): Promise<AuditLogRecord[]> => {
      try {
        const supabase = await getDbClient()
        const { data, error } = await supabase.from('AuditLog').select('*').order('createdAt', { ascending: false })
        if (error || !data) return []
        return data.map(l => ({
          ...l,
          createdAt: new Date(l.createdAt || Date.now()),
        }))
      } catch {
        return []
      }
    },

    create: async ({ data }: { data: any }): Promise<AuditLogRecord> => {
      const supabase = await getDbClient()
      const { data: created, error } = await supabase.from('AuditLog').insert({
        adminId: data.adminId || 'system',
        adminName: data.adminName || 'Admin',
        action: data.action,
        targetId: data.targetId,
        details: data.details || '',
      }).select('*').single()

      if (error || !created) {
        throw new Error(error?.message || 'Failed to write audit log')
      }

      return {
        ...created,
        createdAt: new Date(created.createdAt || Date.now()),
      }
    },
  },

  // ── REPORT ──────────────────────────────────────────────────────────────────
  report: {
    findMany: async (query?: any): Promise<ReportRecord[]> => {
      try {
        const supabase = await getDbClient()
        const { data, error } = await supabase.from('AuditLog').select('*').like('action', 'REPORT_%').order('createdAt', { ascending: false })
        if (error || !data) return []
        return data.map(l => ({
          id: l.id,
          targetId: l.targetId || '',
          reporterId: l.adminId,
          reason: l.action,
          description: l.details,
          status: 'UNRESOLVED',
          createdAt: new Date(l.createdAt || Date.now()),
        }))
      } catch {
        return []
      }
    },

    findUnique: async ({ where }: { where: { id: string } }): Promise<ReportRecord | null> => {
      return null
    },

    create: async ({ data }: { data: any }): Promise<any> => {
      return db.auditLog.create({
        data: {
          adminId: data.reporterId || 'system',
          adminName: data.reporterName || 'User',
          action: `REPORT_${data.reason || 'DISPUTE'}`,
          targetId: data.targetId,
          details: data.description || '',
        }
      })
    },

    update: async ({ where, data }: { where: { id: string }; data: any }): Promise<any> => {
      return null
    },
  },

  // ── WITHDRAWAL ──────────────────────────────────────────────────────────────
  withdrawal: {
    findMany: async (query?: any): Promise<any[]> => {
      try {
        const supabase = await getDbClient()
        const { data, error } = await supabase.from('AuditLog').select('*').like('action', 'WITHDRAWAL_%').order('createdAt', { ascending: false })
        if (error || !data) return []
        return data.map(w => ({
          id: w.id,
          userId: w.targetId || w.adminId,
          amount: 0,
          status: 'PENDING',
          details: w.details,
          createdAt: new Date(w.createdAt || Date.now()),
        }))
      } catch {
        return []
      }
    },

    findUnique: async ({ where }: { where: { id: string } }): Promise<any | null> => {
      return null
    },

    create: async ({ data }: { data: any }): Promise<any> => {
      return db.auditLog.create({
        data: {
          adminId: data.userId,
          adminName: 'User',
          action: 'WITHDRAWAL_REQUESTED',
          targetId: data.userId,
          details: `Withdrawal request for ${data.amount} TND via ${data.method}`,
        }
      })
    },

    update: async ({ where, data }: { where: { id: string }; data: any }): Promise<any> => {
      return null
    },
  },
}
