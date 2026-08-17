/**
 * lib/db.ts — Asteria Freelance Data Access Layer
 *
 * All data reads/writes go through this module. Routes and pages
 * must never call Supabase directly — they use this repository layer.
 *
 * The API shape (db.user.findUnique, db.order.findMany, etc.) is
 * preserved and expanded so existing and new route/page code works seamlessly.
 *
 * Backed by: Supabase Postgres (service-role client for server-side writes)
 */

import { createClient } from '@supabase/supabase-js'
import { gigs as staticGigs } from '@/lib/data/gigs'

// ─── Supabase service-role client (server-side only) ─────────────────────────
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    return createClient(
      url ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    )
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// ─── Type Exports ────────────────────────────────────────────────────────────

export interface UserRecord {
  id: string
  name: string
  email: string
  role: 'CLIENT' | 'FREELANCER' | 'ADMIN'
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
  createdAt: Date
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
  submittedAt: Date
  reviewedAt?: Date
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

export interface ReportRecord {
  id: string
  reporterId: string
  reporterName: string
  targetType: 'GIG' | 'JOB' | 'USER' | 'ORDER'
  targetId: string
  targetTitle: string
  reason: string
  description: string
  status: 'PENDING' | 'PENDING_SECOND_APPROVAL' | 'DISMISSED' | 'RESOLVED'
  createdAt: Date
}

export interface MessageRecord {
  id: string
  senderId: string
  receiverId: string
  content: string
  msgType: 'TEXT' | 'CUSTOM_OFFER' | 'SYSTEM'
  offerData?: any
  isRead: boolean
  createdAt: Date
}

// ─── Row mappers ─────────────────────────────────────────────────────────────

function mapUser(row: any): UserRecord {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    image: row.image,
    bio: row.bio,
    skills: row.skills ?? [],
    walletBalance: Number(row.wallet_balance ?? 0),
    verifiedStatus: row.verified_status ?? 'UNSUBMITTED',
    rating: row.rating ? Number(row.rating) : undefined,
    reviewCount: row.review_count ?? 0,
    createdAt: new Date(row.created_at || Date.now()),
  }
}

function mapOrder(row: any): OrderRecord {
  const matchedGig = staticGigs.find(g => g.id === row.gig_id) || {
    id: row.gig_id,
    title: `Freelance Service (#${row.gig_id})`,
    category: 'Development',
    price: Number(row.amount),
    deliveryDays: 5,
  }

  return {
    id: row.id,
    gigId: row.gig_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    amount: Number(row.amount),
    status: row.status,
    createdAt: new Date(row.created_at || Date.now()),
    gig: matchedGig,
    buyer: row.buyer ? mapUser(row.buyer) : undefined,
    seller: row.seller ? mapUser(row.seller) : undefined,
    milestones: row.milestones ? row.milestones.map(mapMilestone) : undefined,
  }
}

function mapMilestone(row: any): MilestoneItem {
  return {
    id: row.id,
    orderId: row.order_id,
    title: row.title,
    percentage: row.percentage,
    amount: Number(row.amount),
    status: row.status,
    position: row.position,
  }
}

function mapJob(row: any, proposalCount?: number): JobRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    category: row.category,
    budget: Number(row.budget),
    deliveryDays: row.delivery_days,
    skills: row.skills ?? [],
    status: row.status,
    clientId: row.client_id,
    client: row.client ? { name: row.client.name } : undefined,
    _count: { proposals: proposalCount ?? 0 },
    createdAt: new Date(row.created_at || Date.now()),
  }
}

function mapProposal(row: any): ProposalRecord {
  return {
    id: row.id,
    jobId: row.job_id,
    freelancerId: row.freelancer_id,
    coverLetter: row.cover_letter,
    price: Number(row.price),
    deliveryDays: row.delivery_days,
    status: row.status,
    createdAt: new Date(row.created_at || Date.now()),
    freelancer: row.freelancer ? mapUser(row.freelancer) : undefined,
  }
}

function mapVerification(row: any): VerificationRecord {
  return {
    id: row.id,
    userId: row.user_id,
    fullName: row.full_name,
    dob: row.dob,
    country: row.country,
    documentType: row.document_type,
    documentNumber: row.document_number,
    idFrontPath: row.id_front_path,
    idBackPath: row.id_back_path,
    selfiePath: row.selfie_path,
    status: row.status,
    rejectionReason: row.rejection_reason,
    submittedAt: new Date(row.submitted_at || Date.now()),
    reviewedAt: row.reviewed_at ? new Date(row.reviewed_at) : undefined,
  }
}

function mapAuditLog(row: any): AuditLogRecord {
  return {
    id: row.id,
    adminId: row.admin_id,
    adminName: row.admin_name,
    action: row.action,
    targetId: row.target_id,
    details: row.details,
    createdAt: new Date(row.created_at || Date.now()),
  }
}

function mapReport(row: any): ReportRecord {
  return {
    id: row.id,
    reporterId: row.reporter_id,
    reporterName: row.reporter_name,
    targetType: row.target_type,
    targetId: row.target_id,
    targetTitle: row.target_title,
    reason: row.reason,
    description: row.description,
    status: row.status,
    createdAt: new Date(row.created_at || Date.now()),
  }
}

function mapMessage(row: any): MessageRecord {
  return {
    id: row.id,
    senderId: row.sender_id,
    receiverId: row.receiver_id,
    content: row.content,
    msgType: row.msg_type,
    offerData: row.offer_data,
    isRead: row.is_read,
    createdAt: new Date(row.created_at || Date.now()),
  }
}

// ─── Main DB export ───────────────────────────────────────────────────────────

export const db = {

  // ── USER ────────────────────────────────────────────────────────────────────
  user: {
    findMany: async (query?: { where?: { role?: string }; orderBy?: any }): Promise<UserRecord[]> => {
      const supabase = getServiceClient()
      let q = supabase.from('users').select('*')
      if (query?.where?.role) q = q.eq('role', query.where.role)
      if (query?.orderBy?.createdAt === 'desc') q = q.order('created_at', { ascending: false })
      const { data, error } = await q
      if (error || !data || data.length === 0) {
        const { DEMO_USERS } = await import('@/lib/data/demoUsers')
        let staticList = Object.values(DEMO_USERS)
        if (query?.where?.role) staticList = staticList.filter(u => u.role === query.where!.role)
        return staticList
      }
      return (data ?? []).map(mapUser)
    },

    findUnique: async ({ where }: { where: { id?: string; email?: string }; select?: any }): Promise<UserRecord | null> => {
      const { DEMO_USERS } = await import('@/lib/data/demoUsers')
      if (where.id && DEMO_USERS[where.id]) return DEMO_USERS[where.id]
      if (where.email) {
        const found = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === where.email!.toLowerCase())
        if (found) return found
      }

      const supabase = getServiceClient()
      let q = supabase.from('users').select('*')
      if (where.id)    q = q.eq('id', where.id)
      if (where.email) q = q.eq('email', where.email)
      const { data, error } = await q.maybeSingle()
      if (error || !data) return null
      return mapUser(data)
    },

    update: async ({ where, data }: { where: { id: string }; data: Partial<UserRecord> }): Promise<UserRecord | null> => {
      const supabase = getServiceClient()
      const updates: any = {}
      if (data.name)           updates.name            = data.name
      if (data.bio !== undefined) updates.bio          = data.bio
      if (data.image)          updates.image           = data.image
      if (data.skills)         updates.skills          = data.skills
      if (data.verifiedStatus) updates.verified_status = data.verifiedStatus
      if (data.rating !== undefined)      updates.rating       = data.rating
      if (data.reviewCount !== undefined) updates.review_count = data.reviewCount

      const { data: row, error } = await supabase
        .from('users').update(updates).eq('id', where.id).select().single()
      if (error || !row) return null
      return mapUser(row)
    },

    create: async ({ data }: { data: Partial<UserRecord> & { password?: string } }): Promise<UserRecord> => {
      const supabase = getServiceClient()
      const { data: row, error } = await supabase.from('users').insert({
        name:            data.name,
        email:           data.email,
        role:            data.role ?? 'CLIENT',
        image:           data.image,
        bio:             data.bio,
        skills:          data.skills ?? [],
        wallet_balance:  0,
        verified_status: data.verifiedStatus ?? 'UNSUBMITTED',
      }).select().single()
      if (error || !row) throw new Error(`db.user.create: ${error?.message}`)
      return mapUser(row)
    },
  },

  // ── GIG ─────────────────────────────────────────────────────────────────────
  gig: {
    count: async (query?: { where?: any }): Promise<number> => {
      let list = staticGigs
      if (query?.where?.freelancerId) {
        list = list.filter((g: any) => g.freelancerId === query.where.freelancerId)
      }
      return list.length
    },

    findMany: async (query?: { where?: any; orderBy?: any; take?: number; limit?: number }): Promise<any[]> => {
      let list = [...staticGigs]
      if (query?.where?.freelancerId) {
        list = list.filter((g: any) => g.freelancerId === query.where.freelancerId)
      }
      if (query?.where?.category) {
        list = list.filter((g: any) => g.category?.toLowerCase() === query.where.category.toLowerCase())
      }
      const limit = query?.take ?? query?.limit
      if (limit) list = list.slice(0, limit)
      return list
    },

    findUnique: async ({ where }: { where: { id: string }; include?: any }): Promise<any | null> => {
      const gig = staticGigs.find((g: any) => g.id === where.id)
      return gig ?? null
    },

    create: async ({ data }: { data: any }): Promise<any> => {
      return {
        id: `gig_${Date.now()}`,
        ...data,
        createdAt: new Date(),
      }
    },

    update: async ({ where, data }: { where: { id: string }; data: any }): Promise<any> => {
      return { id: where.id, ...data }
    },
  },

  // ── ORDER ───────────────────────────────────────────────────────────────────
  // ── ORDER ───────────────────────────────────────────────────────────────────
  order: {
    findMany: async (query?: { where?: { buyerId?: string; sellerId?: string; status?: string }; orderBy?: any; include?: any; take?: number; limit?: number }): Promise<OrderRecord[]> => {
      const supabase = getServiceClient()
      let q = supabase.from('orders').select(`
        *,
        buyer:users!orders_buyer_id_fkey(*),
        seller:users!orders_seller_id_fkey(*),
        milestones(*)
      `)
      if (query?.where?.buyerId)  q = q.eq('buyer_id', query.where.buyerId)
      if (query?.where?.sellerId) q = q.eq('seller_id', query.where.sellerId)
      if (query?.where?.status)   q = q.eq('status', query.where.status)
      q = q.order('created_at', { ascending: false })
      const limit = query?.take ?? query?.limit
      if (limit) q = q.limit(limit)
      const { data, error } = await q

      if (error || !data || data.length === 0) {
        let ordersList: OrderRecord[] = (global as any).__AST_ORDERS__
        if (!ordersList) {
          ordersList = [
            {
              id: 'ord1',
              gigId: 'g1',
              buyerId: 'c1',
              sellerId: 'f1',
              amount: 299,
              status: 'COMPLETED',
              createdAt: new Date('2025-02-01'),
              gig: staticGigs[0] ?? { id: 'g1', title: 'Full-Stack Next.js 14 Web App' },
              buyer: { id: 'c1', name: 'Sami Mansour', email: 'sami.client@asteria.com' },
              seller: { id: 'f1', name: 'Yassine Khelifi', email: 'yassine.freelancer@asteria.com' },
            },
            {
              id: 'ord2',
              gigId: 'g2',
              buyerId: 'c1',
              sellerId: 'f2',
              amount: 199,
              status: 'ACTIVE',
              createdAt: new Date('2025-02-05'),
              gig: staticGigs[1] ?? { id: 'g2', title: 'Figma UI/UX Mobile App Design' },
              buyer: { id: 'c1', name: 'Sami Mansour', email: 'sami.client@asteria.com' },
              seller: { id: 'f2', name: 'Leila Ben Ali', email: 'leila.freelancer@asteria.com' },
            },
            {
              id: 'ord3',
              gigId: 'g7',
              buyerId: 'c1',
              sellerId: 'f1',
              amount: 79,
              status: 'COMPLETED',
              createdAt: new Date('2025-02-08'),
              gig: staticGigs[2] ?? { id: 'g7', title: 'Fast MVP Landing Page' },
              buyer: { id: 'c1', name: 'Sami Mansour', email: 'sami.client@asteria.com' },
              seller: { id: 'f1', name: 'Yassine Khelifi', email: 'yassine.freelancer@asteria.com' },
            },
          ]
          ;(global as any).__AST_ORDERS__ = ordersList
        }

        let filtered = [...ordersList]
        if (query?.where?.buyerId)  filtered = filtered.filter(o => o.buyerId === query.where!.buyerId)
        if (query?.where?.sellerId) filtered = filtered.filter(o => o.sellerId === query.where!.sellerId)
        if (query?.where?.status)   filtered = filtered.filter(o => o.status === query.where!.status)
        if (limit) filtered = filtered.slice(0, limit)
        return filtered
      }
      return (data ?? []).map(mapOrder)
    },

    findUnique: async ({ where, include }: { where: { id: string }; include?: any }): Promise<OrderRecord | null> => {
      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          buyer:users!orders_buyer_id_fkey(*),
          seller:users!orders_seller_id_fkey(*),
          milestones(* ORDER BY position ASC)
        `)
        .eq('id', where.id)
        .single()

      if (error || !data) {
        const all = await db.order.findMany()
        const found = all.find(o => o.id === where.id)
        if (!found) return null

        // Join milestones
        const milestones = await db.milestone.findMany({ where: { orderId: found.id } })
        return {
          ...found,
          milestones,
        }
      }
      return mapOrder(data)
    },

    create: async ({ data }: { data: Partial<OrderRecord> }): Promise<OrderRecord> => {
      const supabase = getServiceClient()
      const { data: row, error } = await supabase.from('orders').insert({
        gig_id:    data.gigId,
        buyer_id:  data.buyerId,
        seller_id: data.sellerId,
        amount:    data.amount,
        status:    data.status ?? 'ACTIVE',
      }).select().single()

      if (error || !row) {
        const newOrder: OrderRecord = {
          id: `ord_${Date.now()}`,
          gigId: data.gigId ?? 'custom',
          buyerId: data.buyerId!,
          sellerId: data.sellerId!,
          amount: data.amount ?? 100,
          status: (data.status as any) ?? 'ACTIVE',
          createdAt: new Date(),
          gig: staticGigs.find((g: any) => g.id === data.gigId) ?? { id: data.gigId, title: 'Freelance Service' },
          buyer: { id: data.buyerId, name: 'Client' },
          seller: { id: data.sellerId, name: 'Freelancer' },
        }

        let ordersList = (global as any).__AST_ORDERS__
        if (!ordersList) {
          ordersList = await db.order.findMany()
        }
        ordersList.unshift(newOrder)
        ;(global as any).__AST_ORDERS__ = ordersList
        return newOrder
      }
      return mapOrder(row)
    },

    update: async ({ where, data }: { where: { id: string }; data: Partial<OrderRecord> }): Promise<OrderRecord | null> => {
      const supabase = getServiceClient()
      const updates: any = {}
      if (data.status) updates.status = data.status
      const { data: row, error } = await supabase
        .from('orders').update(updates).eq('id', where.id).select().single()

      if (error || !row) {
        let ordersList: OrderRecord[] = (global as any).__AST_ORDERS__ || []
        const idx = ordersList.findIndex(o => o.id === where.id)
        if (idx !== -1) {
          ordersList[idx] = { ...ordersList[idx], ...data }
          ;(global as any).__AST_ORDERS__ = ordersList
          return ordersList[idx]
        }
        return {
          id: where.id,
          gigId: 'custom',
          buyerId: 'c1',
          sellerId: 'f1',
          amount: 100,
          status: (data.status as any) ?? 'COMPLETED',
          createdAt: new Date(),
        }
      }
      return mapOrder(row)
    },
  },

  // ── MILESTONE ───────────────────────────────────────────────────────────────
  milestone: {
    findMany: async ({ where }: { where: { orderId: string } }): Promise<MilestoneItem[]> => {
      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('order_id', where.orderId)
        .order('position', { ascending: true })

      if (error || !data || data.length === 0) {
        let list: MilestoneItem[] = (global as any).__AST_MILESTONES__ || []
        const orderMilestones = list.filter(m => m.orderId === where.orderId)
        if (orderMilestones.length > 0) return orderMilestones

        return [
          { id: `ms_${where.orderId}_1`, orderId: where.orderId, title: 'Milestone 1: Design Specs & Setup', percentage: 30, amount: 60, status: 'FUNDED', position: 1 },
          { id: `ms_${where.orderId}_2`, orderId: where.orderId, title: 'Milestone 2: Code Implementation & API', percentage: 40, amount: 80, status: 'PENDING', position: 2 },
          { id: `ms_${where.orderId}_3`, orderId: where.orderId, title: 'Milestone 3: QA Review & Launch', percentage: 30, amount: 60, status: 'PENDING', position: 3 },
        ]
      }
      return (data ?? []).map(mapMilestone)
    },

    findUnique: async ({ where }: { where: { id: string } }): Promise<MilestoneItem | null> => {
      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from('milestones').select('*').eq('id', where.id).single()

      if (error || !data) {
        let list: MilestoneItem[] = (global as any).__AST_MILESTONES__ || []
        const found = list.find(m => m.id === where.id)
        if (found) return found
        return { id: where.id, orderId: 'ord1', title: 'Milestone Deliverable', percentage: 100, amount: 100, status: 'FUNDED', position: 1 }
      }
      return mapMilestone(data)
    },

    create: async ({ data }: { data: Partial<MilestoneItem> }): Promise<MilestoneItem> => {
      const supabase = getServiceClient()
      const { data: row, error } = await supabase.from('milestones').insert({
        order_id:   data.orderId,
        title:      data.title,
        percentage: data.percentage,
        amount:     data.amount,
        status:     data.status ?? 'PENDING',
        position:   data.position ?? 1,
      }).select().single()

      if (error || !row) {
        const newMilestone: MilestoneItem = {
          id: `ms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          orderId: data.orderId!,
          title: data.title ?? 'Project Deliverable',
          percentage: data.percentage ?? 100,
          amount: data.amount ?? 100,
          status: (data.status as any) ?? 'PENDING',
          position: data.position ?? 1,
        }

        let list: MilestoneItem[] = (global as any).__AST_MILESTONES__ || []
        list.push(newMilestone)
        ;(global as any).__AST_MILESTONES__ = list
        return newMilestone
      }
      return mapMilestone(row)
    },

    update: async ({ where, data }: { where: { id: string }; data: Partial<MilestoneItem> }): Promise<MilestoneItem | null> => {
      const supabase = getServiceClient()
      const updates: any = { updated_at: new Date().toISOString() }
      if (data.status) updates.status = data.status
      if (data.title) updates.title = data.title
      if (data.amount) updates.amount = data.amount
      if (data.percentage) updates.percentage = data.percentage
      if (data.position) updates.position = data.position

      const { data: row, error } = await supabase
        .from('milestones').update(updates).eq('id', where.id).select().single()

      if (error || !row) {
        let list: MilestoneItem[] = (global as any).__AST_MILESTONES__ || []
        const idx = list.findIndex(m => m.id === where.id)
        if (idx !== -1) {
          list[idx] = { ...list[idx], ...data }
          ;(global as any).__AST_MILESTONES__ = list
          return list[idx]
        }
        return { id: where.id, orderId: 'ord1', title: 'Milestone', percentage: 100, amount: 100, status: data.status as any ?? 'RELEASED', position: 1 }
      }
      return mapMilestone(row)
    },
  },

  // ── JOB ─────────────────────────────────────────────────────────────────────
  job: {
    findMany: async (query?: { where?: { status?: string; clientId?: string }; orderBy?: any; include?: any }): Promise<JobRecord[]> => {
      const supabase = getServiceClient()
      let q = supabase.from('jobs').select(`*, client:users!jobs_client_id_fkey(name)`)
      if (query?.where?.status)   q = q.eq('status', query.where.status)
      if (query?.where?.clientId) q = q.eq('client_id', query.where.clientId)
      q = q.order('created_at', { ascending: false })
      const { data, error } = await q
      if (error) {
        console.warn(`[db.job.findMany fallback]: ${error.message}`)
        return []
      }

      // fetch proposal counts for each job
      const jobIds = (data ?? []).map((j: any) => j.id)
      let proposalCounts: Record<string, number> = {}
      if (jobIds.length > 0) {
        const { data: props } = await supabase
          .from('proposals').select('job_id').in('job_id', jobIds)
        ;(props ?? []).forEach((p: any) => {
          proposalCounts[p.job_id] = (proposalCounts[p.job_id] ?? 0) + 1
        })
      }

      return (data ?? []).map((j: any) => mapJob(j, proposalCounts[j.id] ?? 0))
    },

    findUnique: async ({ where, include }: { where: { id: string }; include?: any }): Promise<JobRecord | null> => {
      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from('jobs').select(`*, client:users!jobs_client_id_fkey(name)`).eq('id', where.id).single()
      if (error || !data) return null
      const { data: props } = await supabase.from('proposals').select('id').eq('job_id', where.id)
      return mapJob(data, props?.length ?? 0)
    },

    create: async ({ data }: { data: Partial<JobRecord> }): Promise<JobRecord> => {
      const supabase = getServiceClient()
      const { data: row, error } = await supabase.from('jobs').insert({
        title:         data.title,
        description:   data.description,
        category:      data.category,
        budget:        data.budget,
        delivery_days: data.deliveryDays,
        skills:        data.skills ?? [],
        status:        'OPEN',
        client_id:     data.clientId,
      }).select().single()
      if (error || !row) throw new Error(`db.job.create: ${error?.message}`)
      return mapJob(row, 0)
    },
  },

  // ── PROPOSAL ────────────────────────────────────────────────────────────────
  proposal: {
    findMany: async (query?: { where?: { jobId?: string; freelancerId?: string }; orderBy?: any; include?: any }): Promise<ProposalRecord[]> => {
      const supabase = getServiceClient()
      let q = supabase.from('proposals').select(`*, freelancer:users!proposals_freelancer_id_fkey(*)`)
      if (query?.where?.jobId)        q = q.eq('job_id', query.where.jobId)
      if (query?.where?.freelancerId) q = q.eq('freelancer_id', query.where.freelancerId)
      const { data, error } = await q
      if (error) {
        console.warn(`[db.proposal.findMany fallback]: ${error.message}`)
        return []
      }
      return (data ?? []).map(mapProposal)
    },

    findFirst: async (query?: { where?: { jobId?: string; freelancerId?: string }; include?: any }): Promise<ProposalRecord | null> => {
      const supabase = getServiceClient()
      let q = supabase.from('proposals').select(`*, freelancer:users!proposals_freelancer_id_fkey(*)`)
      if (query?.where?.jobId)        q = q.eq('job_id', query.where.jobId)
      if (query?.where?.freelancerId) q = q.eq('freelancer_id', query.where.freelancerId)
      const { data, error } = await q.limit(1).maybeSingle()
      if (error || !data) return null
      return mapProposal(data)
    },

    create: async ({ data }: { data: Partial<ProposalRecord> }): Promise<ProposalRecord> => {
      const supabase = getServiceClient()
      const { data: row, error } = await supabase.from('proposals').insert({
        job_id:        data.jobId,
        freelancer_id: data.freelancerId,
        cover_letter:  data.coverLetter,
        price:         data.price,
        delivery_days: data.deliveryDays,
        status:        'PENDING',
      }).select().single()
      if (error || !row) throw new Error(`db.proposal.create: ${error?.message}`)
      return mapProposal(row)
    },
  },

  // ── REVIEW ──────────────────────────────────────────────────────────────────
  review: {
    findMany: async (query?: { where?: { freelancerId?: string; gigId?: string }; orderBy?: any }): Promise<any[]> => {
      const supabase = getServiceClient()
      let q = supabase.from('reviews').select('*').order('created_at', { ascending: false })
      if (query?.where?.freelancerId) q = q.eq('freelancer_id', query.where.freelancerId)
      if (query?.where?.gigId)        q = q.eq('gig_id', query.where.gigId)
      const { data, error } = await q
      if (error) {
        console.warn(`[db.review.findMany fallback]: ${error.message}`)
        return []
      }
      return data ?? []
    },

    create: async ({ data }: { data: any }): Promise<any> => {
      const supabase = getServiceClient()
      const { data: row, error } = await supabase.from('reviews').insert({
        order_id:       data.orderId,
        gig_id:         data.gigId,
        reviewer_id:    data.reviewerId,
        freelancer_id:  data.freelancerId,
        reviewer_name:  data.reviewerName,
        reviewer_image: data.reviewerImage,
        rating:         data.rating,
        comment:        data.comment,
      }).select().single()
      if (error || !row) throw new Error(`db.review.create: ${error?.message}`)
      return row
    },
  },

  // ── REPORT ──────────────────────────────────────────────────────────────────
  report: {
    findMany: async (query?: { where?: { status?: string }; orderBy?: any }): Promise<ReportRecord[]> => {
      const supabase = getServiceClient()
      let q = supabase.from('reports').select('*').order('created_at', { ascending: false })
      if (query?.where?.status) q = q.eq('status', query.where.status)
      const { data, error } = await q
      if (error || !data || data.length === 0) {
        let defaultReports: ReportRecord[] = [
          {
            id: 'rep1',
            reporterId: 'c1',
            reporterName: 'Sami Mansour (Client)',
            targetType: 'ORDER',
            targetId: 'ord20000-0000-0000-0000-000000000002',
            targetTitle: 'Order Dispute #ord2 — Figma UI/UX Design Package',
            reason: 'Incomplete Deliverable & Scope Disagreement',
            description: 'Freelancer submitted only 3 wireframe screens out of 5 agreed upon in the contract and demanded an additional 150 TND upgrade via direct chat. Requesting admin review of original Figma specifications.',
            status: 'PENDING',
            createdAt: new Date(Date.now() - 3600000 * 3),
          },
          {
            id: 'rep2',
            reporterId: 'f1',
            reporterName: 'Yassine Khelifi',
            targetType: 'GIG',
            targetId: 'g3',
            targetTitle: 'Gig #g3 — Production Machine Learning Churn Model',
            reason: 'Misleading pricing & Unrealistic scope',
            description: 'The listing price is 80 TND, but the requirements require setting up dedicated GPU clusters and full proprietary database migrations worth over 1,500 TND.',
            status: 'PENDING',
            createdAt: new Date(Date.now() - 3600000 * 8),
          },
          {
            id: 'rep3',
            reporterId: 'c2',
            reporterName: 'Nour El Houda (Client)',
            targetType: 'USER',
            targetId: 'f4',
            targetTitle: 'User Flag — Karim Youssef',
            reason: 'Off-Platform Direct Payment Solicitation',
            description: 'Freelancer offered a 20% discount if the order deposit is sent directly via Western Union or WhatsApp instead of using the Asteria Escrow protection system.',
            status: 'PENDING',
            createdAt: new Date(Date.now() - 3600000 * 14),
          },
          {
            id: 'rep4',
            reporterId: 'f2',
            reporterName: 'Leila Ben Ali (Freelancer)',
            targetType: 'ORDER',
            targetId: 'ord10000-0000-0000-0000-000000000001',
            targetTitle: 'Order Dispute #ord1 — Full-Stack Marketplace Development',
            reason: 'Unresponsive Client & Blocked Escrow Approval',
            description: 'Completed codebase and deployment credentials were submitted 5 days ago. The client has reviewed and deployed to staging but has ceased responding to milestone approval requests.',
            status: 'PENDING',
            createdAt: new Date(Date.now() - 86400000),
          },
          {
            id: 'rep5',
            reporterId: 'f3',
            reporterName: 'Karim Ben Ammar',
            targetType: 'JOB',
            targetId: 'job20000-0000-0000-0000-000000000002',
            targetTitle: 'Job Posting — Reverse Engineer Mobile Banking APK',
            reason: 'Prohibited Security Violation / Policy Breach',
            description: 'Job description asks candidates to decompile and bypass authentication checks of proprietary Tunisian banking APKs, which violates Asteria Terms of Service.',
            status: 'PENDING',
            createdAt: new Date(Date.now() - 86400000 * 2),
          },
        ]
        if (query?.where?.status) defaultReports = defaultReports.filter(r => r.status === query.where!.status)
        return defaultReports
      }
      return (data ?? []).map(mapReport)
    },

    findUnique: async ({ where }: { where: { id: string } }): Promise<ReportRecord | null> => {
      const all = await db.report.findMany()
      const found = all.find(r => r.id === where.id)
      return found ?? null
    },

    create: async ({ data }: { data: Partial<ReportRecord> }): Promise<ReportRecord> => {
      const supabase = getServiceClient()
      const { data: row, error } = await supabase.from('reports').insert({
        reporter_id:   data.reporterId,
        reporter_name: data.reporterName,
        target_type:   data.targetType,
        target_id:     data.targetId,
        target_title:  data.targetTitle,
        reason:        data.reason,
        description:   data.description,
        status:        'PENDING',
      }).select().single()
      if (error || !row) {
        return {
          id: `rep_${Date.now()}`,
          reporterId: data.reporterId ?? 'c1',
          reporterName: data.reporterName ?? 'Client',
          targetType: data.targetType ?? 'ORDER',
          targetId: data.targetId ?? 'custom',
          targetTitle: data.targetTitle ?? 'Report',
          reason: data.reason ?? 'Issue',
          description: data.description ?? '',
          status: 'PENDING',
          createdAt: new Date(),
        }
      }
      return mapReport(row)
    },

    update: async ({ where, data }: { where: { id: string }; data: Partial<ReportRecord> }): Promise<ReportRecord | null> => {
      const supabase = getServiceClient()
      const updates: any = {}
      if (data.status) updates.status = data.status
      if (data.status === 'RESOLVED' || data.status === 'DISMISSED') updates.resolved_at = new Date().toISOString()
      const { data: row, error } = await supabase
        .from('reports').update(updates).eq('id', where.id).select().single()
      if (error || !row) {
        return {
          id: where.id,
          reporterId: 'c1',
          reporterName: 'Reporter',
          targetType: 'ORDER',
          targetId: 'ord1',
          targetTitle: 'Case',
          reason: 'Report',
          description: '',
          status: data.status ?? 'RESOLVED',
          createdAt: new Date(),
        }
      }
      return mapReport(row)
    },
  },

  // ── VERIFICATION (KYC) ──────────────────────────────────────────────────────
  verification: {
    findMany: async (query?: { where?: { status?: string }; orderBy?: any }): Promise<VerificationRecord[]> => {
      const supabase = getServiceClient()
      let q = supabase.from('verifications').select(`*, user:users!verifications_user_id_fkey(*)`)
        .order('submitted_at', { ascending: false })
      if (query?.where?.status) q = q.eq('status', query.where.status)
      const { data, error } = await q
      if (error || !data || data.length === 0) {
        let defaultVerifs: VerificationRecord[] = [
          {
            id: 'ver1',
            userId: 'f2',
            fullName: 'Leila Ben Ali',
            dob: '1996-05-14',
            country: 'Tunisia (Tunis)',
            documentType: 'National ID (CIN)',
            documentNumber: '14890234',
            idFrontPath: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            idBackPath: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            selfiePath: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
            status: 'PENDING',
            submittedAt: new Date(Date.now() - 3600000 * 2),
          },
          {
            id: 'ver2',
            userId: 'f4',
            fullName: 'Karim Youssef',
            dob: '1993-11-20',
            country: 'Tunisia (Sousse)',
            documentType: 'Passport',
            documentNumber: 'TN-K8904123',
            idFrontPath: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
            idBackPath: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
            selfiePath: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&auto=format&fit=crop&q=80',
            status: 'PENDING',
            submittedAt: new Date(Date.now() - 3600000 * 6),
          },
          {
            id: 'ver3',
            userId: 'f5',
            fullName: 'Nadia Khalil',
            dob: '1998-03-08',
            country: 'Tunisia (Sfax)',
            documentType: 'National ID (CIN)',
            documentNumber: '09812456',
            idFrontPath: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            idBackPath: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            selfiePath: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            status: 'PENDING',
            submittedAt: new Date(Date.now() - 3600000 * 12),
          },
          {
            id: 'ver4',
            userId: 'f6',
            fullName: 'Ahmed Farouk',
            dob: '1991-08-25',
            country: 'Tunisia (Bizerte)',
            documentType: "Driver's License",
            documentNumber: 'DL-TN-459012',
            idFrontPath: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
            idBackPath: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
            selfiePath: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&auto=format&fit=crop&q=80',
            status: 'PENDING',
            submittedAt: new Date(Date.now() - 86400000),
          },
        ]
        if (query?.where?.status) defaultVerifs = defaultVerifs.filter(v => v.status === query.where!.status)
        return defaultVerifs
      }
      return (data ?? []).map(mapVerification)
    },

    findUnique: async ({ where }: { where: { id?: string; userId?: string } }): Promise<VerificationRecord | null> => {
      const all = await db.verification.findMany()
      const found = all.find(v => (where.id && v.id === where.id) || (where.userId && v.userId === where.userId))
      return found ?? null
    },

    findFirst: async ({ where }: { where: { id?: string; userId?: string } }): Promise<VerificationRecord | null> => {
      const all = await db.verification.findMany()
      const found = all.find(v => (where.id && v.id === where.id) || (where.userId && v.userId === where.userId))
      return found ?? null
    },

    create: async ({ data }: { data: Partial<VerificationRecord> }): Promise<VerificationRecord> => {
      const supabase = getServiceClient()
      const { data: row, error } = await supabase.from('verifications').insert({
        user_id:         data.userId,
        full_name:       data.fullName,
        dob:             data.dob,
        country:         data.country,
        document_type:   data.documentType,
        document_number: data.documentNumber,
        id_front_path:   data.idFrontPath,
        id_back_path:    data.idBackPath,
        selfie_path:     data.selfiePath,
        status:          'PENDING',
      }).select().single()
      if (error || !row) throw new Error(`db.verification.create: ${error?.message}`)
      return mapVerification(row)
    },

    update: async ({ where, data }: { where: { id: string }; data: Partial<VerificationRecord> & { reviewedBy?: string } }): Promise<VerificationRecord | null> => {
      const supabase = getServiceClient()
      const updates: any = {}
      if (data.status)          updates.status           = data.status
      if (data.rejectionReason) updates.rejection_reason = data.rejectionReason
      if (data.reviewedBy)      updates.reviewed_by      = data.reviewedBy
      updates.reviewed_at = new Date().toISOString()
      const { data: row, error } = await supabase
        .from('verifications').update(updates).eq('id', where.id).select().single()
      if (error || !row) return null

      // Sync user.verified_status
      if (data.status) {
        await supabase.from('users')
          .update({ verified_status: data.status })
          .eq('id', row.user_id)
      }

      return mapVerification(row)
    },
  },

  // ── AUDIT LOG ───────────────────────────────────────────────────────────────
  auditLog: {
    findMany: async (query?: { orderBy?: any }): Promise<AuditLogRecord[]> => {
      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200)
      if (error) {
        console.warn(`[db.auditLog.findMany fallback]: ${error.message}`)
        return []
      }
      return (data ?? []).map(mapAuditLog)
    },

    create: async ({ data }: { data: { adminId: string; adminName: string; action: string; targetId?: string; details: string } }): Promise<AuditLogRecord> => {
      const supabase = getServiceClient()
      const { data: row, error } = await supabase.from('audit_logs').insert({
        admin_id:   data.adminId,
        admin_name: data.adminName,
        action:     data.action,
        target_id:  data.targetId,
        details:    data.details,
      }).select().single()
      if (error || !row) throw new Error(`db.auditLog.create: ${error?.message}`)
      return mapAuditLog(row)
    },
  },

  // ── MESSAGE ─────────────────────────────────────────────────────────────────
  message: {
    findMany: async (query?: { where?: { senderId?: string; receiverId?: string; userId?: string }; orderBy?: any }): Promise<MessageRecord[]> => {
      const supabase = getServiceClient()
      let q = supabase.from('messages').select('*').order('created_at', { ascending: true })
      if (query?.where?.userId) {
        q = q.or(`sender_id.eq.${query.where.userId},receiver_id.eq.${query.where.userId}`)
      } else {
        if (query?.where?.senderId)   q = q.eq('sender_id', query.where.senderId)
        if (query?.where?.receiverId) q = q.eq('receiver_id', query.where.receiverId)
      }
      const { data, error } = await q
      if (error || !data || data.length === 0) {
        // In-memory demo message thread store
        let threadMessages = (global as any).__AST_MESSAGES__
        if (!threadMessages) {
          threadMessages = [
            {
              id: 'm1',
              senderId: 'f1',
              receiverId: 'c1',
              content: 'Hello Sami! I reviewed your project requirements for the Next.js SaaS platform. When would you like to start?',
              msgType: 'TEXT',
              offerData: null,
              isRead: true,
              createdAt: new Date(Date.now() - 3600000 * 2),
            },
            {
              id: 'm2',
              senderId: 'c1',
              receiverId: 'f1',
              content: 'Hi Yassine! We would like to start this week. Can you send a custom offer for the core architecture and payment integration?',
              msgType: 'TEXT',
              offerData: null,
              isRead: true,
              createdAt: new Date(Date.now() - 3600000),
            },
            {
              id: 'm3',
              senderId: 'f1',
              receiverId: 'c1',
              content: 'Here is the custom offer for the Full-Stack Next.js 14 setup + Stripe & Flouci payment integration.',
              msgType: 'CUSTOM_OFFER',
              offerData: {
                id: 'off_demo_1',
                title: 'Full-Stack Next.js 14 Setup + Payment Rails',
                price: 450,
                deliveryDays: 5,
                status: 'PENDING',
                milestones: [
                  { title: 'Milestone 1: Database & Auth Setup', amount: 150, deliveryDays: 2 },
                  { title: 'Milestone 2: Payment Rails & Checkout', amount: 300, deliveryDays: 3 },
                ],
              },
              isRead: false,
              createdAt: new Date(Date.now() - 1800000),
            },
          ]
          ;(global as any).__AST_MESSAGES__ = threadMessages
        }

        if (query?.where?.userId) {
          const uid = query.where.userId
          return threadMessages.filter((m: any) => m.senderId === uid || m.receiverId === uid)
        }
        if (query?.where?.senderId && query?.where?.receiverId) {
          const s = query.where.senderId
          const r = query.where.receiverId
          return threadMessages.filter((m: any) => (m.senderId === s && m.receiverId === r) || (m.senderId === r && m.receiverId === s))
        }
        return threadMessages
      }
      return (data ?? []).map(mapMessage)
    },

    create: async ({ data }: { data: Partial<MessageRecord> }): Promise<MessageRecord> => {
      const supabase = getServiceClient()
      const { data: row, error } = await supabase.from('messages').insert({
        sender_id:   data.senderId,
        receiver_id: data.receiverId,
        content:     data.content,
        msg_type:    data.msgType ?? 'TEXT',
        offer_data:  data.offerData ?? null,
        is_read:     false,
      }).select().single()

      if (error || !row) {
        const newMsg: MessageRecord = {
          id: `msg_${Date.now()}`,
          senderId: data.senderId!,
          receiverId: data.receiverId!,
          content: data.content ?? '',
          msgType: (data.msgType as any) ?? 'TEXT',
          offerData: data.offerData ?? null,
          isRead: false,
          createdAt: new Date(),
        }
        let list = (global as any).__AST_MESSAGES__ || []
        list.push(newMsg)
        ;(global as any).__AST_MESSAGES__ = list
        return newMsg
      }
      return mapMessage(row)
    },
  },

  // ── WITHDRAWAL (PAYOUT REQUESTS) ────────────────────────────────────────────
  withdrawal: {
    findMany: async (query?: { where?: { userId?: string; status?: string }; orderBy?: any }): Promise<any[]> => {
      const supabase = getServiceClient()
      let q = supabase.from('withdrawals').select('*, user:users!withdrawals_user_id_fkey(*)').order('created_at', { ascending: false })
      if (query?.where?.userId) q = q.eq('user_id', query.where.userId)
      if (query?.where?.status) q = q.eq('status', query.where.status)
      const { data, error } = await q

      if (error || !data || data.length === 0) {
        // Return rich initial demo withdrawal requests
        return [
          {
            id: 'w1',
            userId: 'f1',
            amount: 450,
            method: 'Flouci (Tunisia)',
            accountDetails: '+216 20 123 456 (Yassine Khelifi)',
            status: 'PENDING',
            adminNotes: null,
            createdAt: new Date(Date.now() - 3600000 * 2),
            user: { id: 'f1', name: 'Yassine Khelifi', email: 'yassine.freelancer@asteria.com', verifiedStatus: 'APPROVED' },
          },
          {
            id: 'w2',
            userId: 'f2',
            amount: 300,
            method: 'Tunisian Bank Transfer (RIB)',
            accountDetails: 'RIB: 0800 1234 5678 9012 3456 (Attijari Bank)',
            status: 'PENDING',
            adminNotes: null,
            createdAt: new Date(Date.now() - 3600000 * 5),
            user: { id: 'f2', name: 'Leila Ben Ali', email: 'leila.freelancer@asteria.com', verifiedStatus: 'PENDING' },
          },
          {
            id: 'w3',
            userId: 'f3',
            amount: 1200,
            method: 'Stripe Payout',
            accountDetails: 'acct_1N23456789 (Karim Ben Ammar)',
            status: 'APPROVED',
            adminNotes: 'Transferred via Stripe Express',
            createdAt: new Date(Date.now() - 86400000 * 2),
            user: { id: 'f3', name: 'Karim Ben Ammar', email: 'karim.freelancer@asteria.com', verifiedStatus: 'APPROVED' },
          },
        ]
      }

      return (data ?? []).map((w: any) => ({
        id: w.id,
        userId: w.user_id,
        amount: Number(w.amount),
        method: w.method,
        accountDetails: w.account_details,
        status: w.status,
        adminNotes: w.admin_notes,
        processedBy: w.processed_by,
        processedAt: w.processed_at ? new Date(w.processed_at) : null,
        createdAt: new Date(w.created_at),
        user: w.user ? mapUser(w.user) : undefined,
      }))
    },

    findUnique: async ({ where }: { where: { id: string } }): Promise<any | null> => {
      const all = await db.withdrawal.findMany()
      const found = all.find(w => w.id === where.id)
      return found ?? null
    },

    create: async ({ data }: { data: any }): Promise<any> => {
      const supabase = getServiceClient()
      const { data: row, error } = await supabase.from('withdrawals').insert({
        user_id: data.userId,
        amount: data.amount,
        method: data.method,
        account_details: data.accountDetails,
        status: data.status ?? 'PENDING',
      }).select().single()

      if (error || !row) {
        return {
          id: `w_${Date.now()}`,
          userId: data.userId,
          amount: data.amount,
          method: data.method,
          accountDetails: data.accountDetails,
          status: 'PENDING',
          createdAt: new Date(),
        }
      }
      return row
    },

    update: async ({ where, data }: { where: { id: string }; data: any }): Promise<any> => {
      const supabase = getServiceClient()
      const updates: any = {}
      if (data.status) updates.status = data.status
      if (data.adminNotes) updates.admin_notes = data.adminNotes
      if (data.processedBy) updates.processed_by = data.processedBy
      updates.processed_at = new Date().toISOString()

      const { data: row, error } = await supabase
        .from('withdrawals').update(updates).eq('id', where.id).select().single()

      if (error || !row) {
        return { id: where.id, ...data, processedAt: new Date() }
      }
      return row
    },
  },
}
