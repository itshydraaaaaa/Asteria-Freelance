/**
 * lib/db.ts — Asteria Freelance Data Access Layer
 *
 * All data reads/writes go through this module. Routes and pages
 * must never call Supabase directly — they use this repository layer.
 *
 * The API shape (db.user.findUnique, db.order.findMany, etc.) is
 * preserved exactly so existing route/page code requires no changes.
 *
 * Backed by: Supabase Postgres (service-role client for server-side writes)
 */

import { createClient } from '@supabase/supabase-js'

// ─── Supabase service-role client (server-side only) ─────────────────────────
// Service role bypasses RLS — used for all server-side writes and admin reads.
// NEVER expose SUPABASE_SERVICE_ROLE_KEY to the client bundle.
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    // Graceful fallback for environments missing service role key
    console.warn('[db] SUPABASE_SERVICE_ROLE_KEY not set — some writes may fail.')
    return createClient(
      url ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    )
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false }
  })
}

// ─── Type Exports (preserved from original db.ts) ────────────────────────────

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

// ─── Row mappers (snake_case DB → camelCase app) ─────────────────────────────

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
    createdAt: new Date(row.created_at),
  }
}

function mapOrder(row: any): OrderRecord {
  return {
    id: row.id,
    gigId: row.gig_id,
    buyerId: row.buyer_id,
    sellerId: row.seller_id,
    amount: Number(row.amount),
    status: row.status,
    createdAt: new Date(row.created_at),
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
    createdAt: new Date(row.created_at),
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
    createdAt: new Date(row.created_at),
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
    submittedAt: new Date(row.submitted_at),
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
    createdAt: new Date(row.created_at),
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
    createdAt: new Date(row.created_at),
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
    createdAt: new Date(row.created_at),
  }
}

// ─── Main DB export ───────────────────────────────────────────────────────────

export const db = {

  // ── USER ────────────────────────────────────────────────────────────────────
  user: {
    findMany: async (query?: { where?: { role?: string }, orderBy?: { createdAt?: string } }): Promise<UserRecord[]> => {
      const supabase = getServiceClient()
      let q = supabase.from('users').select('*')
      if (query?.where?.role) q = q.eq('role', query.where.role)
      if (query?.orderBy?.createdAt === 'desc') q = q.order('created_at', { ascending: false })
      const { data, error } = await q
      if (error) throw new Error(`db.user.findMany: ${error.message}`)
      return (data ?? []).map(mapUser)
    },

    findUnique: async ({ where }: { where: { id?: string; email?: string }, select?: any }): Promise<UserRecord | null> => {
      const supabase = getServiceClient()
      let q = supabase.from('users').select('*')
      if (where.id)    q = q.eq('id', where.id)
      if (where.email) q = q.eq('email', where.email)
      const { data, error } = await q.single()
      if (error || !data) return null
      return mapUser(data)
    },

    update: async ({ where, data }: { where: { id: string }, data: Partial<UserRecord> }): Promise<UserRecord | null> => {
      const supabase = getServiceClient()
      const updates: any = {}
      if (data.name)           updates.name            = data.name
      if (data.bio !== undefined) updates.bio          = data.bio
      if (data.image)          updates.image           = data.image
      if (data.skills)         updates.skills          = data.skills
      if (data.verifiedStatus) updates.verified_status = data.verifiedStatus
      if (data.rating !== undefined)      updates.rating       = data.rating
      if (data.reviewCount !== undefined) updates.review_count = data.reviewCount
      // walletBalance must only be set via the ledger (lib/ledger.ts)
      // Direct writes to wallet_balance from app code are intentionally blocked here.

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

  // ── ORDER ───────────────────────────────────────────────────────────────────
  order: {
    findMany: async (query?: { where?: { buyerId?: string; sellerId?: string; status?: string } }): Promise<OrderRecord[]> => {
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
      const { data, error } = await q
      if (error) throw new Error(`db.order.findMany: ${error.message}`)
      return (data ?? []).map(mapOrder)
    },

    findUnique: async ({ where }: { where: { id: string } }): Promise<OrderRecord | null> => {
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
      if (error || !data) return null
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
      if (error || !row) throw new Error(`db.order.create: ${error?.message}`)
      return mapOrder(row)
    },

    update: async ({ where, data }: { where: { id: string }, data: Partial<OrderRecord> }): Promise<OrderRecord | null> => {
      const supabase = getServiceClient()
      const updates: any = {}
      if (data.status) updates.status = data.status
      const { data: row, error } = await supabase
        .from('orders').update(updates).eq('id', where.id).select().single()
      if (error || !row) return null
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
      if (error) throw new Error(`db.milestone.findMany: ${error.message}`)
      return (data ?? []).map(mapMilestone)
    },

    findUnique: async ({ where }: { where: { id: string } }): Promise<MilestoneItem | null> => {
      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from('milestones').select('*').eq('id', where.id).single()
      if (error || !data) return null
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
      if (error || !row) throw new Error(`db.milestone.create: ${error?.message}`)
      return mapMilestone(row)
    },

    update: async ({ where, data }: { where: { id: string }, data: Partial<MilestoneItem> }): Promise<MilestoneItem | null> => {
      const supabase = getServiceClient()
      const updates: any = { updated_at: new Date().toISOString() }
      if (data.status) updates.status = data.status
      const { data: row, error } = await supabase
        .from('milestones').update(updates).eq('id', where.id).select().single()
      if (error || !row) return null
      return mapMilestone(row)
    },
  },

  // ── JOB ─────────────────────────────────────────────────────────────────────
  job: {
    findMany: async (query?: { where?: { status?: string; clientId?: string } }): Promise<JobRecord[]> => {
      const supabase = getServiceClient()
      let q = supabase.from('jobs').select(`*, client:users!jobs_client_id_fkey(name)`)
      if (query?.where?.status)   q = q.eq('status', query.where.status)
      if (query?.where?.clientId) q = q.eq('client_id', query.where.clientId)
      q = q.order('created_at', { ascending: false })
      const { data, error } = await q
      if (error) throw new Error(`db.job.findMany: ${error.message}`)

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

    findUnique: async ({ where }: { where: { id: string } }): Promise<JobRecord | null> => {
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
    findMany: async (query?: { where?: { jobId?: string; freelancerId?: string } }): Promise<ProposalRecord[]> => {
      const supabase = getServiceClient()
      let q = supabase.from('proposals').select(`*, freelancer:users!proposals_freelancer_id_fkey(*)`)
      if (query?.where?.jobId)        q = q.eq('job_id', query.where.jobId)
      if (query?.where?.freelancerId) q = q.eq('freelancer_id', query.where.freelancerId)
      const { data, error } = await q
      if (error) throw new Error(`db.proposal.findMany: ${error.message}`)
      return (data ?? []).map(mapProposal)
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
    findMany: async (query?: { where?: { freelancerId?: string; gigId?: string } }): Promise<any[]> => {
      const supabase = getServiceClient()
      let q = supabase.from('reviews').select('*').order('created_at', { ascending: false })
      if (query?.where?.freelancerId) q = q.eq('freelancer_id', query.where.freelancerId)
      if (query?.where?.gigId)        q = q.eq('gig_id', query.where.gigId)
      const { data, error } = await q
      if (error) throw new Error(`db.review.findMany: ${error.message}`)
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
    findMany: async (query?: { where?: { status?: string } }): Promise<ReportRecord[]> => {
      const supabase = getServiceClient()
      let q = supabase.from('reports').select('*').order('created_at', { ascending: false })
      if (query?.where?.status) q = q.eq('status', query.where.status)
      const { data, error } = await q
      if (error) throw new Error(`db.report.findMany: ${error.message}`)
      return (data ?? []).map(mapReport)
    },

    findUnique: async ({ where }: { where: { id: string } }): Promise<ReportRecord | null> => {
      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from('reports').select('*').eq('id', where.id).single()
      if (error || !data) return null
      return mapReport(data)
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
      if (error || !row) throw new Error(`db.report.create: ${error?.message}`)
      return mapReport(row)
    },

    update: async ({ where, data }: { where: { id: string }, data: Partial<ReportRecord> }): Promise<ReportRecord | null> => {
      const supabase = getServiceClient()
      const updates: any = {}
      if (data.status) updates.status = data.status
      if (data.status === 'RESOLVED' || data.status === 'DISMISSED') updates.resolved_at = new Date().toISOString()
      const { data: row, error } = await supabase
        .from('reports').update(updates).eq('id', where.id).select().single()
      if (error || !row) return null
      return mapReport(row)
    },
  },

  // ── VERIFICATION (KYC) ──────────────────────────────────────────────────────
  verification: {
    findMany: async (query?: { where?: { status?: string } }): Promise<VerificationRecord[]> => {
      const supabase = getServiceClient()
      let q = supabase.from('verifications').select(`*, user:users!verifications_user_id_fkey(*)`)
        .order('submitted_at', { ascending: false })
      if (query?.where?.status) q = q.eq('status', query.where.status)
      const { data, error } = await q
      if (error) throw new Error(`db.verification.findMany: ${error.message}`)
      return (data ?? []).map(mapVerification)
    },

    findUnique: async ({ where }: { where: { id?: string; userId?: string } }): Promise<VerificationRecord | null> => {
      const supabase = getServiceClient()
      let q = supabase.from('verifications').select(`*, user:users!verifications_user_id_fkey(*)`)
      if (where.id)     q = q.eq('id', where.id)
      if (where.userId) q = q.eq('user_id', where.userId)
      const { data, error } = await q.single()
      if (error || !data) return null
      return mapVerification(data)
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

    update: async ({ where, data }: { where: { id: string }, data: Partial<VerificationRecord> & { reviewedBy?: string } }): Promise<VerificationRecord | null> => {
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
    findMany: async (): Promise<AuditLogRecord[]> => {
      const supabase = getServiceClient()
      const { data, error } = await supabase
        .from('audit_logs').select('*').order('created_at', { ascending: false }).limit(200)
      if (error) throw new Error(`db.auditLog.findMany: ${error.message}`)
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
    findMany: async (query?: { where?: { senderId?: string; receiverId?: string; userId?: string } }): Promise<MessageRecord[]> => {
      const supabase = getServiceClient()
      let q = supabase.from('messages').select('*').order('created_at', { ascending: true })
      if (query?.where?.userId) {
        q = q.or(`sender_id.eq.${query.where.userId},receiver_id.eq.${query.where.userId}`)
      } else {
        if (query?.where?.senderId)   q = q.eq('sender_id', query.where.senderId)
        if (query?.where?.receiverId) q = q.eq('receiver_id', query.where.receiverId)
      }
      const { data, error } = await q
      if (error) throw new Error(`db.message.findMany: ${error.message}`)
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
      if (error || !row) throw new Error(`db.message.create: ${error?.message}`)
      return mapMessage(row)
    },
  },
}
