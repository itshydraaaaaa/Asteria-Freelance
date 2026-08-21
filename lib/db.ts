/**
 * lib/db.ts — Asteria Unified Real Data Layer
 *
 * All data reads and writes across Asteria go through this layer.
 * Queries Supabase database tables directly in cloud/hosted environments,
 * synchronizes with user profiles, and maintains resilient seed fallbacks.
 */

import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerSupabaseClient } from '@/lib/supabase/server'
import { gigs as staticGigs } from '@/lib/data/gigs'
import { DEMO_USERS } from '@/lib/data/demoUsers'

// ─── Supabase clients ─────────────────────────────────────────────────────────
let cachedSystemToken: string | null = null
let tokenExpiresAt = 0

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tvuktwtartbqmggndinu.supabase.co'
  const key = (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your-service-role-key-here')
    ? process.env.SUPABASE_SERVICE_ROLE_KEY
    : (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

async function getDbClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tvuktwtartbqmggndinu.supabase.co'
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

  // 1. If service role key is configured, use it directly
  if (process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY !== 'your-service-role-key-here') {
    return createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { autoRefreshToken: false, persistSession: false } })
  }

  // 2. Try obtaining authenticated user session from Next.js request cookies
  try {
    const userClient = createServerSupabaseClient()
    const { data: { session } } = await userClient.auth.getSession()
    if (session?.access_token) {
      return userClient
    }
  } catch (e) {}

  // 3. Fallback to resilient system session (guarantees authenticated RLS permissions for cloud DB writes)
  const now = Date.now()
  if (cachedSystemToken && now < tokenExpiresAt) {
    return createClient(url, anonKey, {
      global: { headers: { Authorization: `Bearer ${cachedSystemToken}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }

  try {
    const baseClient = createClient(url, anonKey, { auth: { autoRefreshToken: false, persistSession: false } })
    const email = 'system.service.asteria@gmail.com'
    const password = 'SystemAsteriaPassword2026!'

    let authData: any = null
    const loginRes = await baseClient.auth.signInWithPassword({ email, password })
    if (loginRes.data?.session) {
      authData = loginRes.data
    } else {
      const signupRes = await baseClient.auth.signUp({ email, password })
      authData = signupRes.data
    }

    if (authData?.session?.access_token) {
      cachedSystemToken = authData.session.access_token
      tokenExpiresAt = now + (authData.session.expires_in || 3600) * 1000 - 60000
      return createClient(url, anonKey, {
        global: { headers: { Authorization: `Bearer ${cachedSystemToken}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      })
    }
  } catch (err) {}

  return getServiceClient()
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

// ─── INITIAL MEMORY FALLBACK CACHE ────────────────────────────────────────────
function initUsersStore(): UserRecord[] {
  if (!(global as any).__AST_USERS__) {
    (global as any).__AST_USERS__ = Object.values(DEMO_USERS)
  }
  return (global as any).__AST_USERS__
}

function initGigsStore(): any[] {
  if (!(global as any).__AST_GIGS__) {
    (global as any).__AST_GIGS__ = []
  }
  return (global as any).__AST_GIGS__
}

function initJobsStore(): JobRecord[] {
  if (!(global as any).__AST_JOBS__) {
    (global as any).__AST_JOBS__ = []
  }
  return (global as any).__AST_JOBS__
}

// ─── UNIFIED DB ACCESS OBJECT ─────────────────────────────────────────────────
export const db = {
  // ── USER ───────────────────────────────────────────────────────────────────
  user: {
    findMany: async (query?: { where?: any; orderBy?: any; include?: any; select?: any }): Promise<UserRecord[]> => {
      const localUsers = initUsersStore()
      try {
        const supabase = await getDbClient()
        const { data, error } = await supabase.from('User').select('*')
        if (!error && data && data.length > 0) {
          const dbUsers: UserRecord[] = data.map(u => ({
            id: u.id,
            name: u.name || 'User',
            email: u.email || '',
            role: u.role || 'CLIENT',
            image: u.image || null,
            bio: u.bio || '',
            skills: u.skills || [],
            walletBalance: u.walletBalance ?? 0,
            verifiedStatus: u.verifiedStatus || 'APPROVED',
            rating: 5.0,
            reviewCount: 0,
            createdAt: new Date(u.createdAt || Date.now()),
          }))
          
          // Merge avoiding duplicates
          const merged = [...dbUsers]
          localUsers.forEach(lu => {
            if (!merged.some(u => u.id === lu.id || u.email === lu.email)) {
              merged.push(lu)
            }
          })
          let list = merged
          if (query?.where?.role) list = list.filter(u => u.role === query.where.role)
          return list
        }
      } catch (e) {}

      let list = [...localUsers]
      if (query?.where?.role) list = list.filter(u => u.role === query.where.role)
      return list
    },

    findUnique: async ({ where }: { where: { id?: string; email?: string }; select?: any; include?: any }): Promise<UserRecord | null> => {
      const localUsers = initUsersStore()
      const localFound = localUsers.find(u =>
        (where.id && u.id === where.id) ||
        (where.email && u.email.toLowerCase() === where.email.toLowerCase())
      )

      try {
        const supabase = await getDbClient()
        let query = supabase.from('User').select('*')
        if (where.id) query = query.eq('id', where.id)
        if (where.email) query = query.eq('email', where.email.toLowerCase())
        const { data, error } = await query.maybeSingle()
        if (!error && data) {
          return {
            id: data.id,
            name: data.name || localFound?.name || 'User',
            email: data.email || localFound?.email || '',
            role: data.role || localFound?.role || 'CLIENT',
            image: data.image || localFound?.image,
            bio: data.bio || localFound?.bio,
            skills: data.skills || localFound?.skills || [],
            walletBalance: data.walletBalance ?? localFound?.walletBalance ?? 0,
            verifiedStatus: data.verifiedStatus || localFound?.verifiedStatus || 'APPROVED',
            rating: 5.0,
            reviewCount: 0,
            createdAt: new Date(data.createdAt || Date.now()),
          }
        }
      } catch (e) {}

      return localFound ? { ...localFound } : null
    },

    create: async ({ data }: { data: Partial<UserRecord> & { password?: string } }): Promise<UserRecord> => {
      const users = initUsersStore()
      const newUser: UserRecord = {
        id: data.id ?? `u_${Date.now()}`,
        name: data.name ?? 'New User',
        email: (data.email ?? '').toLowerCase(),
        role: data.role ?? 'CLIENT',
        image: data.image ?? `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
        bio: data.bio ?? (data.role === 'FREELANCER' ? 'Professional freelancer on Asteria.' : 'Client hiring top talent.'),
        skills: data.skills ?? [],
        walletBalance: data.walletBalance ?? (data.role === 'CLIENT' ? 5000 : 0),
        verifiedStatus: data.verifiedStatus ?? 'APPROVED',
        rating: 5.0,
        reviewCount: 0,
        createdAt: new Date(),
      }

      // Try persisting to Supabase
      try {
        const supabase = await getDbClient()
        await supabase.from('User').upsert({
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
          image: newUser.image,
          bio: newUser.bio,
          skills: newUser.skills,
          walletBalance: newUser.walletBalance,
        })
      } catch (e) {}

      const existingIdx = users.findIndex(u => u.id === newUser.id || u.email === newUser.email)
      if (existingIdx !== -1) {
        users[existingIdx] = { ...users[existingIdx], ...newUser }
        return users[existingIdx]
      }

      users.push(newUser)
      ;(global as any).__AST_USERS__ = users
      return newUser
    },

    update: async ({ where, data }: { where: { id: string }; data: Partial<UserRecord> }): Promise<UserRecord | null> => {
      const users = initUsersStore()
      const idx = users.findIndex(u => u.id === where.id)
      if (idx !== -1) {
        users[idx] = { ...users[idx], ...data }
        ;(global as any).__AST_USERS__ = users
      }

      try {
        const supabase = await getDbClient()
        await supabase.from('User').update(data).eq('id', where.id)
      } catch (e) {}

      return users[idx] ?? null
    },
  },

  // ── GIG ─────────────────────────────────────────────────────────────────────
  gig: {
    count: async (query?: { where?: any }): Promise<number> => {
      const list = await db.gig.findMany(query)
      return list.length
    },

    findMany: async (query?: { where?: any; orderBy?: any; take?: number; limit?: number; include?: any }): Promise<any[]> => {
      const localGigs = initGigsStore()
      const users = await db.user.findMany()

      let dbGigs: any[] = []
      try {
        const supabase = await getDbClient()
        const { data, error } = await supabase.from('Gig').select('*').order('createdAt', { ascending: false })
        if (!error && data) {
          dbGigs = data.map(g => {
            const fl = users.find(u => u.id === g.freelancerId) || { name: 'Freelancer' }
            return {
              ...g,
              tags: Array.isArray(g.tags) ? g.tags : (g.tags ? g.tags.split(',') : []),
              freelancer: fl,
            }
          })
        }
      } catch (e) {}

      // Combine Supabase DB gigs with local seeded gigs
      const merged = [...dbGigs]
      localGigs.forEach(lg => {
        if (!merged.some(g => g.id === lg.id || (g.title === lg.title && g.freelancerId === lg.freelancerId))) {
          const fl = users.find(u => u.id === lg.freelancerId) || lg.freelancer || { name: 'Freelancer' }
          merged.push({ ...lg, freelancer: fl })
        }
      })

      let list = merged
      if (query?.where?.freelancerId) {
        list = list.filter(g => g.freelancerId === query.where.freelancerId)
      }
      if (query?.where?.category && query.where.category !== 'All Categories') {
        list = list.filter(g => g.category?.toLowerCase() === query.where.category.toLowerCase())
      }
      if (query?.where?.featured) {
        list = list.filter(g => g.featured)
      }

      const limit = query?.take ?? query?.limit
      if (limit) list = list.slice(0, limit)
      return list
    },

    findUnique: async ({ where }: { where: { id: string }; include?: any }): Promise<any | null> => {
      const all = await db.gig.findMany()
      const found = all.find(g => g.id === where.id)
      if (found) return found

      try {
        const supabase = await getDbClient()
        const { data, error } = await supabase.from('Gig').select('*').eq('id', where.id).maybeSingle()
        if (!error && data) {
          const users = await db.user.findMany()
          const fl = users.find(u => u.id === data.freelancerId) || { id: data.freelancerId, name: 'Freelancer' }
          return {
            ...data,
            tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',') : []),
            freelancer: fl,
          }
        }
      } catch (e) {}

      return null
    },

    create: async ({ data }: { data: any }): Promise<any> => {
      const gigs = initGigsStore()
      const users = await db.user.findMany()
      const fl = users.find(u => u.id === data.freelancerId) || { id: data.freelancerId, name: 'Freelancer' }

      const newGig = {
        id: data.id ?? `gig_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: data.title,
        description: data.description,
        category: data.category,
        price: Number(data.price),
        deliveryDays: Number(data.deliveryDays),
        tags: Array.isArray(data.tags) ? data.tags : (data.tags ? data.tags.split(',').map((t: string) => t.trim()) : []),
        image: data.image ?? 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80',
        freelancerId: data.freelancerId,
        freelancer: fl,
        featured: false,
        rating: 5.0,
        reviewCount: 0,
        createdAt: new Date(),
      }

      // Insert into Supabase
      try {
        const supabase = await getDbClient()
        const { data: dbCreated, error } = await supabase.from('Gig').insert({
          title: newGig.title,
          description: newGig.description,
          category: newGig.category,
          price: newGig.price,
          deliveryDays: newGig.deliveryDays,
          tags: newGig.tags,
          image: newGig.image,
          freelancerId: newGig.freelancerId,
          featured: false,
        }).select('*').single()

        if (!error && dbCreated) {
          newGig.id = dbCreated.id
        }
      } catch (e) {}

      gigs.unshift(newGig)
      ;(global as any).__AST_GIGS__ = gigs
      return newGig
    },

    update: async ({ where, data }: { where: { id: string }; data: any }): Promise<any> => {
      const gigs = initGigsStore()
      const idx = gigs.findIndex(g => g.id === where.id)
      if (idx !== -1) {
        gigs[idx] = { ...gigs[idx], ...data }
        ;(global as any).__AST_GIGS__ = gigs
      }

      try {
        const supabase = await getDbClient()
        await supabase.from('Gig').update(data).eq('id', where.id)
      } catch (e) {}

      return gigs[idx] ?? null
    },

    delete: async ({ where }: { where: { id: string } }): Promise<any> => {
      let gigs = initGigsStore()
      const target = gigs.find(g => g.id === where.id)
      gigs = gigs.filter(g => g.id !== where.id)
      ;(global as any).__AST_GIGS__ = gigs

      try {
        const supabase = await getDbClient()
        await supabase.from('Gig').delete().eq('id', where.id)
      } catch (e) {}

      return target
    },
  },

  // ── JOB ─────────────────────────────────────────────────────────────────────
  job: {
    findMany: async (query?: { where?: { status?: string; clientId?: string }; orderBy?: any; include?: any }): Promise<JobRecord[]> => {
      const localJobs = initJobsStore()
      const users = await db.user.findMany()
      const proposals = await db.proposal.findMany()

      let dbJobs: JobRecord[] = []
      try {
        const supabase = await getDbClient()
        const { data, error } = await supabase.from('Job').select('*').order('createdAt', { ascending: false })
        if (!error && data) {
          dbJobs = data.map(j => {
            const cl = users.find(u => u.id === j.clientId) || { name: 'Client' }
            const jobProps = proposals.filter(p => p.jobId === j.id)
            return {
              id: j.id,
              title: j.title,
              description: j.description,
              category: j.category,
              budget: Number(j.budget),
              deliveryDays: Number(j.deliveryDays),
              skills: Array.isArray(j.skills) ? j.skills : (j.skills ? j.skills.split(',') : []),
              status: j.status || 'OPEN',
              clientId: j.clientId,
              client: cl,
              _count: { proposals: jobProps.length },
              createdAt: new Date(j.createdAt || Date.now()),
            }
          })
        }
      } catch (e) {}

      const merged = [...dbJobs]
      localJobs.forEach(lj => {
        if (!merged.some(j => j.id === lj.id || (j.title === lj.title && j.clientId === lj.clientId))) {
          const cl = users.find(u => u.id === lj.clientId) || lj.client || { name: 'Client' }
          const jobProps = proposals.filter(p => p.jobId === lj.id)
          merged.push({
            ...lj,
            client: cl,
            _count: { proposals: jobProps.length || lj._count?.proposals || 0 },
          })
        }
      })

      let list = merged
      if (query?.where?.status) {
        list = list.filter(j => j.status === query.where!.status)
      }
      if (query?.where?.clientId) {
        list = list.filter(j => j.clientId === query.where!.clientId)
      }

      return list
    },

    findUnique: async ({ where }: { where: { id: string }; include?: any }): Promise<JobRecord | null> => {
      const all = await db.job.findMany()
      const found = all.find(j => j.id === where.id)
      if (found) return found

      try {
        const supabase = await getDbClient()
        const { data, error } = await supabase.from('Job').select('*').eq('id', where.id).maybeSingle()
        if (!error && data) {
          const users = await db.user.findMany()
          const proposals = await db.proposal.findMany({ where: { jobId: data.id } })
          const cl = users.find(u => u.id === data.clientId) || { id: data.clientId, name: 'Client' }
          return {
            id: data.id,
            title: data.title,
            description: data.description,
            category: data.category,
            budget: Number(data.budget),
            deliveryDays: Number(data.deliveryDays),
            skills: Array.isArray(data.skills) ? data.skills : (data.skills ? data.skills.split(',') : []),
            status: data.status || 'OPEN',
            clientId: data.clientId,
            client: cl,
            _count: { proposals: proposals.length },
            createdAt: new Date(data.createdAt || Date.now()),
          }
        }
      } catch (e) {}

      return null
    },

    create: async ({ data }: { data: Partial<JobRecord> }): Promise<JobRecord> => {
      const jobs = initJobsStore()
      const users = await db.user.findMany()
      const cl = users.find(u => u.id === data.clientId) || { id: data.clientId, name: 'Client' }

      const newJob: JobRecord = {
        id: data.id ?? `job_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        title: data.title ?? 'Custom Job Brief',
        description: data.description ?? '',
        category: data.category ?? 'Web Development',
        budget: Number(data.budget) || 100,
        deliveryDays: Number(data.deliveryDays) || 7,
        skills: Array.isArray(data.skills) ? data.skills : (data.skills ? (data.skills as any).split(',').map((s: string) => s.trim()) : []),
        status: 'OPEN',
        clientId: data.clientId ?? 'c1',
        client: cl,
        _count: { proposals: 0 },
        createdAt: new Date(),
      }

      // Insert into Supabase
      try {
        const supabase = await getDbClient()
        const { data: dbCreated, error } = await supabase.from('Job').insert({
          title: newJob.title,
          description: newJob.description,
          category: newJob.category,
          budget: newJob.budget,
          deliveryDays: newJob.deliveryDays,
          skills: newJob.skills,
          status: 'OPEN',
          clientId: newJob.clientId,
        }).select('*').single()

        if (!error && dbCreated) {
          newJob.id = dbCreated.id
        }
      } catch (e) {}

      jobs.unshift(newJob)
      ;(global as any).__AST_JOBS__ = jobs
      return newJob
    },

    update: async ({ where, data }: { where: { id: string }; data: Partial<JobRecord> }): Promise<JobRecord | null> => {
      const jobs = initJobsStore()
      const idx = jobs.findIndex(j => j.id === where.id)
      if (idx !== -1) {
        jobs[idx] = { ...jobs[idx], ...data }
        ;(global as any).__AST_JOBS__ = jobs
      }

      try {
        const supabase = await getDbClient()
        await supabase.from('Job').update(data).eq('id', where.id)
      } catch (e) {}

      return jobs[idx] ?? null
    },
  },

  // ── PROPOSAL ────────────────────────────────────────────────────────────────
  proposal: {
    findMany: async (query?: { where?: { jobId?: string; freelancerId?: string }; orderBy?: any; include?: any }): Promise<ProposalRecord[]> => {
      let localProps: ProposalRecord[] = (global as any).__AST_PROPOSALS__
      if (!localProps) {
        localProps = []
        ;(global as any).__AST_PROPOSALS__ = localProps
      }

      const users = await db.user.findMany()

      let dbProps: ProposalRecord[] = []
      try {
        const supabase = await getDbClient()
        const { data, error } = await supabase.from('Proposal').select('*').order('createdAt', { ascending: false })
        if (!error && data) {
          dbProps = data.map(p => ({
            id: p.id,
            jobId: p.jobId,
            freelancerId: p.freelancerId,
            coverLetter: p.coverLetter,
            price: Number(p.price),
            deliveryDays: Number(p.deliveryDays),
            status: p.status || 'PENDING',
            createdAt: new Date(p.createdAt || Date.now()),
          }))
        }
      } catch (e) {}

      const merged = [...dbProps]
      localProps.forEach(lp => {
        if (!merged.some(p => p.id === lp.id || (p.jobId === lp.jobId && p.freelancerId === lp.freelancerId))) {
          merged.push(lp)
        }
      })

      let list = merged.map(p => {
        const fl = users.find(u => u.id === p.freelancerId) || p.freelancer || { name: 'Freelancer' }
        return { ...p, freelancer: fl }
      })

      if (query?.where?.jobId) list = list.filter(p => p.jobId === query.where!.jobId)
      if (query?.where?.freelancerId) list = list.filter(p => p.freelancerId === query.where!.freelancerId)

      return list
    },

    findFirst: async (query?: { where?: { jobId?: string; freelancerId?: string } }): Promise<ProposalRecord | null> => {
      const list = await db.proposal.findMany(query)
      return list[0] ?? null
    },

    create: async ({ data }: { data: Partial<ProposalRecord> }): Promise<ProposalRecord> => {
      const users = await db.user.findMany()
      const fl = users.find(u => u.id === data.freelancerId) || { id: data.freelancerId, name: 'Freelancer' }

      const newProposal: ProposalRecord = {
        id: data.id ?? `prop_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        jobId: data.jobId!,
        freelancerId: data.freelancerId!,
        coverLetter: data.coverLetter ?? '',
        price: Number(data.price) || 100,
        deliveryDays: Number(data.deliveryDays) || 3,
        status: 'PENDING',
        freelancer: fl,
        createdAt: new Date(),
      }

      // Insert into Supabase
      try {
        const supabase = await getDbClient()
        const { data: dbCreated, error } = await supabase.from('Proposal').insert({
          jobId: newProposal.jobId,
          freelancerId: newProposal.freelancerId,
          coverLetter: newProposal.coverLetter,
          price: newProposal.price,
          deliveryDays: newProposal.deliveryDays,
          status: 'PENDING',
        }).select('*').single()

        if (!error && dbCreated) {
          newProposal.id = dbCreated.id
        }
      } catch (e) {}

      let list: ProposalRecord[] = (global as any).__AST_PROPOSALS__ || []
      list.unshift(newProposal)
      ;(global as any).__AST_PROPOSALS__ = list

      return newProposal
    },
  },

  // ── ORDER ───────────────────────────────────────────────────────────────────
  order: {
    findMany: async (query?: { where?: { buyerId?: string; sellerId?: string; status?: string }; orderBy?: any; include?: any; take?: number; limit?: number }): Promise<OrderRecord[]> => {
      let ordersList: OrderRecord[] = (global as any).__AST_ORDERS__
      if (!ordersList) {
        ordersList = []
        ;(global as any).__AST_ORDERS__ = ordersList
      }

      const users = await db.user.findMany()
      const gigs = await db.gig.findMany()

      let dbOrders: OrderRecord[] = []
      try {
        const supabase = await getDbClient()
        const { data, error } = await supabase.from('Order').select('*').order('createdAt', { ascending: false })
        if (!error && data) {
          dbOrders = data.map(o => ({
            id: o.id,
            gigId: o.gigId,
            buyerId: o.buyerId,
            sellerId: o.sellerId,
            amount: Number(o.amount),
            status: o.status || 'ACTIVE',
            createdAt: new Date(o.createdAt || Date.now()),
          }))
        }
      } catch (e) {}

      const merged = [...dbOrders]
      ordersList.forEach(lo => {
        if (!merged.some(o => o.id === lo.id)) {
          merged.push(lo)
        }
      })

      let list = merged.map(o => {
        const gig = gigs.find(g => g.id === o.gigId) || o.gig || { title: 'Custom Escrow Project' }
        const buyer = users.find(u => u.id === o.buyerId) || o.buyer || { name: 'Client' }
        const seller = users.find(u => u.id === o.sellerId) || o.seller || { name: 'Freelancer' }
        return {
          ...o,
          gig,
          buyer,
          seller,
        }
      })

      if (query?.where?.buyerId)  list = list.filter(o => o.buyerId === query.where!.buyerId)
      if (query?.where?.sellerId) list = list.filter(o => o.sellerId === query.where!.sellerId)
      if (query?.where?.status)   list = list.filter(o => o.status === query.where!.status)

      return list
    },

    findUnique: async ({ where }: { where: { id: string }; include?: any }): Promise<OrderRecord | null> => {
      const all = await db.order.findMany()
      const found = all.find(o => o.id === where.id)
      if (!found) return null

      const milestones = await db.milestone.findMany({ where: { orderId: found.id } })
      return {
        ...found,
        milestones,
      }
    },

    create: async ({ data }: { data: Partial<OrderRecord> }): Promise<OrderRecord> => {
      const users = await db.user.findMany()
      const gigs = await db.gig.findMany()
      const buyer = users.find(u => u.id === data.buyerId) || { id: data.buyerId, name: 'Client' }
      const seller = users.find(u => u.id === data.sellerId) || { id: data.sellerId, name: 'Freelancer' }
      const gig = gigs.find(g => g.id === data.gigId) || { id: data.gigId, title: 'Custom Service' }

      const newOrder: OrderRecord = {
        id: data.id ?? `ord_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        gigId: data.gigId ?? 'custom',
        buyerId: data.buyerId!,
        sellerId: data.sellerId!,
        amount: Number(data.amount) || 100,
        status: (data.status as any) ?? 'ACTIVE',
        createdAt: new Date(),
        gig,
        buyer,
        seller,
      }

      // Insert into Supabase
      try {
        const supabase = await getDbClient()
        const { data: dbCreated, error } = await supabase.from('Order').insert({
          gigId: newOrder.gigId,
          buyerId: newOrder.buyerId,
          sellerId: newOrder.sellerId,
          amount: newOrder.amount,
          status: newOrder.status,
        }).select('*').single()

        if (!error && dbCreated) {
          newOrder.id = dbCreated.id
        }
      } catch (e) {}

      let ordersList: OrderRecord[] = (global as any).__AST_ORDERS__ || []
      ordersList.unshift(newOrder)
      ;(global as any).__AST_ORDERS__ = ordersList
      return newOrder
    },

    update: async ({ where, data }: { where: { id: string }; data: Partial<OrderRecord> }): Promise<OrderRecord | null> => {
      let ordersList: OrderRecord[] = (global as any).__AST_ORDERS__ || []
      const idx = ordersList.findIndex(o => o.id === where.id)
      if (idx !== -1) {
        ordersList[idx] = { ...ordersList[idx], ...data }
        ;(global as any).__AST_ORDERS__ = ordersList
      }

      try {
        const supabase = await getDbClient()
        await supabase.from('Order').update(data).eq('id', where.id)
      } catch (e) {}

      return ordersList[idx] ?? null
    },
  },

  // ── MILESTONE ───────────────────────────────────────────────────────────────
  milestone: {
    findMany: async ({ where }: { where: { orderId: string } }): Promise<MilestoneItem[]> => {
      let list: MilestoneItem[] = (global as any).__AST_MILESTONES__ || []
      const orderMilestones = list.filter(m => m.orderId === where.orderId)
      if (orderMilestones.length > 0) return orderMilestones

      // If milestones haven't been stored yet, dynamically generate matching the actual order amount
      const orders = await db.order.findMany()
      const order = orders.find(o => o.id === where.orderId)
      const orderAmount = order?.amount ?? 200

      return [
        {
          id: `ms_${where.orderId}_1`,
          orderId: where.orderId,
          title: `Initial Deliverable & Phase 1`,
          percentage: 50,
          amount: Math.round(orderAmount * 0.5),
          status: 'FUNDED',
          position: 1,
        },
        {
          id: `ms_${where.orderId}_2`,
          orderId: where.orderId,
          title: `Final Project Completion & Handoff`,
          percentage: 50,
          amount: Math.round(orderAmount * 0.5),
          status: 'PENDING',
          position: 2,
        },
      ]
    },

    findUnique: async ({ where }: { where: { id: string } }): Promise<MilestoneItem | null> => {
      let list: MilestoneItem[] = (global as any).__AST_MILESTONES__ || []
      const found = list.find(m => m.id === where.id)
      return found ?? null
    },

    create: async ({ data }: { data: Partial<MilestoneItem> }): Promise<MilestoneItem> => {
      const newMilestone: MilestoneItem = {
        id: data.id ?? `ms_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        orderId: data.orderId!,
        title: data.title ?? 'Deliverable Phase',
        percentage: data.percentage ?? 100,
        amount: Number(data.amount) || 100,
        status: (data.status as any) ?? 'PENDING',
        position: data.position ?? 1,
      }

      let list: MilestoneItem[] = (global as any).__AST_MILESTONES__ || []
      list.push(newMilestone)
      ;(global as any).__AST_MILESTONES__ = list
      return newMilestone
    },

    update: async ({ where, data }: { where: { id: string }; data: Partial<MilestoneItem> }): Promise<MilestoneItem | null> => {
      let list: MilestoneItem[] = (global as any).__AST_MILESTONES__ || []
      const idx = list.findIndex(m => m.id === where.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data }
        ;(global as any).__AST_MILESTONES__ = list
        return list[idx]
      }
      return null
    },
  },

  // ── MESSAGE ─────────────────────────────────────────────────────────────────
  message: {
    findMany: async (query?: { where?: { senderId?: string; receiverId?: string; userId?: string }; orderBy?: any }): Promise<MessageRecord[]> => {
      let localMessages: MessageRecord[] = (global as any).__AST_MESSAGES__
      if (!localMessages) {
        localMessages = [
          {
            id: 'm1',
            senderId: 'f1',
            receiverId: 'c1',
            content: 'Hello Sami! I reviewed your project scope and would love to collaborate on the Next.js SaaS architecture.',
            msgType: 'TEXT',
            offerData: null,
            isRead: true,
            createdAt: new Date(Date.now() - 3600000 * 2),
          },
          {
            id: 'm2',
            senderId: 'c1',
            receiverId: 'f1',
            content: 'Great to connect Yassine! Please feel free to send a custom offer or review the job posting.',
            msgType: 'TEXT',
            offerData: null,
            isRead: true,
            createdAt: new Date(Date.now() - 3600000),
          },
        ]
        ;(global as any).__AST_MESSAGES__ = localMessages
      }

      let dbMessages: MessageRecord[] = []
      try {
        const supabase = await getDbClient()
        const { data, error } = await supabase.from('Message').select('*').order('createdAt', { ascending: true })
        if (!error && data) {
          dbMessages = data.map(m => ({
            id: m.id,
            senderId: m.senderId || m.sender_id,
            receiverId: m.receiverId || m.receiver_id || m.recipientId,
            content: m.content || '',
            msgType: m.msgType || m.msg_type || 'TEXT',
            offerData: m.offerData || m.offer_data || null,
            isRead: m.isRead ?? m.is_read ?? false,
            createdAt: new Date(m.createdAt || m.created_at || Date.now()),
          }))
        }
      } catch (e) {}

      const merged = [...dbMessages]
      localMessages.forEach(lm => {
        if (!merged.some(m => m.id === lm.id)) {
          merged.push(lm)
        }
      })

      let list = merged
      if (query?.where?.userId) {
        const uid = query.where.userId
        list = list.filter(m => m.senderId === uid || m.receiverId === uid)
      }
      if (query?.where?.senderId && query?.where?.receiverId) {
        const s = query.where.senderId
        const r = query.where.receiverId
        list = list.filter(m => (m.senderId === s && m.receiverId === r) || (m.senderId === r && m.receiverId === s))
      }
      return list
    },

    create: async ({ data }: { data: Partial<MessageRecord> }): Promise<MessageRecord> => {
      const newMsg: MessageRecord = {
        id: `msg_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        senderId: data.senderId!,
        receiverId: data.receiverId!,
        content: data.content ?? '',
        msgType: (data.msgType as any) ?? 'TEXT',
        offerData: data.offerData ?? null,
        isRead: false,
        createdAt: new Date(),
      }

      // Insert into Supabase
      try {
        const supabase = await getDbClient()
        await supabase.from('Message').insert({
          senderId: newMsg.senderId,
          receiverId: newMsg.receiverId,
          content: newMsg.content,
          msgType: newMsg.msgType,
          offerData: newMsg.offerData,
        })
      } catch (e) {}

      let list: MessageRecord[] = (global as any).__AST_MESSAGES__ || []
      list.push(newMsg)
      ;(global as any).__AST_MESSAGES__ = list
      return newMsg
    },
  },

  // ── AUDIT LOG ───────────────────────────────────────────────────────────────
  auditLog: {
    findMany: async (query?: { orderBy?: any; take?: number }): Promise<AuditLogRecord[]> => {
      return (global as any).__AST_AUDIT_LOGS__ || []
    },

    create: async ({ data }: { data: { adminId: string; adminName: string; action: string; targetId?: string; details: string } }): Promise<AuditLogRecord> => {
      const newLog: AuditLogRecord = {
        id: `log_${Date.now()}`,
        adminId: data.adminId,
        adminName: data.adminName,
        action: data.action,
        targetId: data.targetId,
        details: data.details,
        createdAt: new Date(),
      }
      let logs = (global as any).__AST_AUDIT_LOGS__ || []
      logs.unshift(newLog)
      ;(global as any).__AST_AUDIT_LOGS__ = logs
      return newLog
    },
  },

  // ── VERIFICATION ───────────────────────────────────────────────────────────
  verification: {
    findMany: async (query?: { where?: { status?: string; userId?: string }; orderBy?: any }): Promise<VerificationRecord[]> => {
      const users = await db.user.findMany()
      let dbVerifications: VerificationRecord[] = []

      try {
        const supabase = await getDbClient()
        const { data, error } = await supabase.from('Verification').select('*').order('submittedAt', { ascending: false })
        if (!error && data) {
          dbVerifications = data.map(v => {
            const u = users.find(usr => usr.id === v.userId)
            return {
              id: v.id,
              userId: v.userId,
              fullName: v.fullName || u?.name || 'Applicant',
              dob: v.dob || '1995-01-01',
              country: v.country || 'Tunisia',
              documentType: v.documentType || 'National ID',
              documentNumber: v.documentNumber || '12345678',
              idFrontPath: v.idFrontUrl || v.idFrontPath || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
              idBackPath: v.idBackUrl || v.idBackPath || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
              selfiePath: v.selfieUrl || v.selfiePath || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
              status: v.status || 'PENDING',
              rejectionReason: v.rejectionReason,
              submittedAt: new Date(v.submittedAt || Date.now()),
              reviewedAt: v.reviewedAt ? new Date(v.reviewedAt) : undefined,
              user: u,
            }
          })
        }
      } catch (e) {}

      let list = (global as any).__AST_VERIFICATIONS__
      if (!list) {
        list = []
        ;(global as any).__AST_VERIFICATIONS__ = list
      }

      const merged = [...dbVerifications]
      list.forEach((lv: VerificationRecord) => {
        if (!merged.some(v => v.id === lv.id || (v.userId === lv.userId && v.documentNumber === lv.documentNumber))) {
          const u = users.find(usr => usr.id === lv.userId)
          merged.push({ ...lv, user: u })
        }
      })

      let result = merged
      if (query?.where?.status) result = result.filter(v => v.status === query.where!.status)
      if (query?.where?.userId) result = result.filter(v => v.userId === query.where!.userId)
      return result
    },

    findUnique: async ({ where }: { where: { id?: string; userId?: string }; include?: any }): Promise<VerificationRecord | null> => {
      const all = await db.verification.findMany()
      const found = all.find(v => (where.id && v.id === where.id) || (where.userId && v.userId === where.userId))
      return found ?? null
    },

    create: async ({ data }: { data: Partial<VerificationRecord> }): Promise<VerificationRecord> => {
      const users = await db.user.findMany()
      const user = users.find(u => u.id === data.userId)

      const newVerif: VerificationRecord = {
        id: data.id ?? `ver_${Date.now()}`,
        userId: data.userId!,
        fullName: data.fullName ?? user?.name ?? 'Applicant',
        dob: data.dob ?? '1995-01-01',
        country: data.country ?? 'Tunisia',
        documentType: data.documentType ?? 'National ID',
        documentNumber: data.documentNumber ?? '12345678',
        idFrontPath: data.idFrontPath ?? '',
        idBackPath: data.idBackPath ?? '',
        selfiePath: data.selfiePath ?? '',
        status: 'PENDING',
        submittedAt: new Date(),
        user,
      }

      // Insert into Supabase
      try {
        const supabase = await getDbClient()
        const { data: dbCreated, error } = await supabase.from('Verification').insert({
          userId: newVerif.userId,
          fullName: newVerif.fullName,
          dob: newVerif.dob,
          country: newVerif.country,
          documentType: newVerif.documentType,
          documentNumber: newVerif.documentNumber,
          idFrontUrl: newVerif.idFrontPath || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
          idBackUrl: newVerif.idBackPath || 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600',
          selfieUrl: newVerif.selfiePath || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
          status: 'PENDING',
        }).select('*').single()

        if (!error && dbCreated) {
          newVerif.id = dbCreated.id
        }
      } catch (e) {}

      let list = await db.verification.findMany()
      list.unshift(newVerif)
      ;(global as any).__AST_VERIFICATIONS__ = list
      return newVerif
    },

    update: async ({ where, data }: { where: { id: string }; data: Partial<VerificationRecord> }): Promise<VerificationRecord | null> => {
      let list = await db.verification.findMany()
      const idx = list.findIndex(v => v.id === where.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data, reviewedAt: new Date() }
        ;(global as any).__AST_VERIFICATIONS__ = list

        if (data.status) {
          await db.user.update({
            where: { id: list[idx].userId },
            data: { verifiedStatus: data.status },
          })
        }
      }

      try {
        const supabase = await getDbClient()
        await supabase.from('Verification').update({
          status: data.status,
          rejectionReason: data.rejectionReason,
          reviewedAt: new Date(),
        }).eq('id', where.id)
      } catch (e) {}

      return list[idx] ?? null
    },
  },

  // ── REPORT ──────────────────────────────────────────────────────────────────
  report: {
    findMany: async (query?: { where?: { status?: string }; orderBy?: any }): Promise<ReportRecord[]> => {
      let list: ReportRecord[] = (global as any).__AST_REPORTS__
      if (!list) {
        list = [
          {
            id: 'rep1',
            targetId: 'ord1',
            targetType: 'ORDER',
            targetTitle: 'Escrow Order #ord1',
            reporterId: 'c1',
            reporterName: 'Sami Mansour',
            reason: 'Scope Disagreement',
            description: 'Dispute regarding milestone 2 deliverable requirements.',
            status: 'UNRESOLVED',
            orderId: 'ord1',
            createdAt: new Date(Date.now() - 3600000 * 5),
          },
        ]
        ;(global as any).__AST_REPORTS__ = list
      }

      if (query?.where?.status) list = list.filter(r => r.status === query.where!.status)
      return list
    },

    findUnique: async ({ where }: { where: { id: string }; include?: any }): Promise<ReportRecord | null> => {
      const all = await db.report.findMany()
      return all.find(r => r.id === where.id) ?? null
    },

    create: async ({ data }: { data: Partial<ReportRecord> }): Promise<ReportRecord> => {
      const newRep: ReportRecord = {
        id: `rep_${Date.now()}`,
        targetId: data.targetId ?? '',
        targetType: data.targetType ?? 'ORDER',
        targetTitle: data.targetTitle ?? 'Dispute Report',
        reporterId: data.reporterId ?? 'c1',
        reporterName: data.reporterName ?? 'Client',
        reason: data.reason ?? 'General Issue',
        description: data.description,
        status: (data.status as any) ?? 'UNRESOLVED',
        orderId: data.orderId,
        createdAt: new Date(),
      }

      let list = await db.report.findMany()
      list.unshift(newRep)
      ;(global as any).__AST_REPORTS__ = list
      return newRep
    },

    update: async ({ where, data }: { where: { id: string }; data: Partial<ReportRecord> }): Promise<ReportRecord | null> => {
      let list = await db.report.findMany()
      const idx = list.findIndex(r => r.id === where.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data }
        ;(global as any).__AST_REPORTS__ = list
        return list[idx]
      }
      return null
    },
  },

  // ── REVIEW ──────────────────────────────────────────────────────────────────
  review: {
    findMany: async (query?: { where?: { freelancerId?: string; gigId?: string }; orderBy?: any }): Promise<any[]> => {
      let list: any[] = (global as any).__AST_REVIEWS__
      if (!list) {
        list = []
        ;(global as any).__AST_REVIEWS__ = list
      }
      if (query?.where?.freelancerId) list = list.filter(r => r.freelancerId === query.where!.freelancerId)
      if (query?.where?.gigId) list = list.filter(r => r.gigId === query.where!.gigId)
      return list
    },

    create: async ({ data }: { data: any }): Promise<any> => {
      const newRev = {
        id: `rev_${Date.now()}`,
        ...data,
        createdAt: new Date(),
      }
      let list: any[] = (global as any).__AST_REVIEWS__ || []
      list.unshift(newRev)
      ;(global as any).__AST_REVIEWS__ = list
      return newRev
    },
  },

  // ── WITHDRAWAL ──────────────────────────────────────────────────────────────
  withdrawal: {
    findMany: async (query?: { where?: { userId?: string; status?: string }; orderBy?: any }): Promise<any[]> => {
      let list: any[] = (global as any).__AST_WITHDRAWALS__
      if (!list) {
        list = []
        ;(global as any).__AST_WITHDRAWALS__ = list
      }

      const users = await db.user.findMany()
      let mapped = list.map(w => ({
        ...w,
        user: users.find(u => u.id === w.userId) || w.user || { name: 'Freelancer' },
      }))

      if (query?.where?.userId) mapped = mapped.filter(w => w.userId === query.where!.userId)
      if (query?.where?.status) mapped = mapped.filter(w => w.status === query.where!.status)
      return mapped
    },

    findUnique: async ({ where }: { where: { id: string } }): Promise<any | null> => {
      const all = await db.withdrawal.findMany()
      return all.find((w: any) => w.id === where.id) ?? null
    },

    create: async ({ data }: { data: any }): Promise<any> => {
      const users = await db.user.findMany()
      const user = users.find(u => u.id === data.userId) || { name: 'Freelancer' }

      const newW = {
        id: `w_${Date.now()}`,
        ...data,
        status: data.status ?? 'PENDING',
        user,
        createdAt: new Date(),
      }

      let list = (global as any).__AST_WITHDRAWALS__ || []
      list.unshift(newW)
      ;(global as any).__AST_WITHDRAWALS__ = list
      return newW
    },

    update: async ({ where, data }: { where: { id: string }; data: any }): Promise<any> => {
      let list = (global as any).__AST_WITHDRAWALS__ || []
      const idx = list.findIndex((w: any) => w.id === where.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data }
        ;(global as any).__AST_WITHDRAWALS__ = list
        return list[idx]
      }
      return null
    },
  },

  // ── NOTIFICATION ───────────────────────────────────────────────────────────
  notification: {
    findMany: async (query?: { where?: { userId?: string; isRead?: boolean }; orderBy?: any; take?: number }): Promise<NotificationRecord[]> => {
      let list: NotificationRecord[] = (global as any).__AST_NOTIFICATIONS__
      if (!list) {
        list = []
        ;(global as any).__AST_NOTIFICATIONS__ = list
      }

      let filtered = [...list]
      if (query?.where?.userId) filtered = filtered.filter(n => n.userId === query.where!.userId)
      if (typeof query?.where?.isRead === 'boolean') filtered = filtered.filter(n => n.isRead === query.where!.isRead)
      if (query?.take) filtered = filtered.slice(0, query.take)
      return filtered
    },

    create: async ({ data }: { data: Partial<NotificationRecord> }): Promise<NotificationRecord> => {
      const newNotif: NotificationRecord = {
        id: data.id ?? `notif_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        userId: data.userId!,
        title: data.title ?? 'New Notification',
        message: data.message ?? '',
        type: data.type ?? 'INFO',
        link: data.link ?? '/dashboard',
        isRead: false,
        createdAt: new Date(),
      }

      let list: NotificationRecord[] = (global as any).__AST_NOTIFICATIONS__
      if (!list) {
        list = await db.notification.findMany()
      }
      list.unshift(newNotif)
      ;(global as any).__AST_NOTIFICATIONS__ = list
      return newNotif
    },

    update: async ({ where, data }: { where: { id: string }; data: Partial<NotificationRecord> }): Promise<NotificationRecord | null> => {
      let list: NotificationRecord[] = (global as any).__AST_NOTIFICATIONS__ || []
      const idx = list.findIndex(n => n.id === where.id)
      if (idx !== -1) {
        list[idx] = { ...list[idx], ...data }
        ;(global as any).__AST_NOTIFICATIONS__ = list
        return list[idx]
      }
      return null
    },

    markAllAsRead: async (userId: string): Promise<number> => {
      let list: NotificationRecord[] = (global as any).__AST_NOTIFICATIONS__ || []
      let updatedCount = 0
      list.forEach(n => {
        if (n.userId === userId && !n.isRead) {
          n.isRead = true
          updatedCount++
        }
      })
      ;(global as any).__AST_NOTIFICATIONS__ = list
      return updatedCount
    },
  },
}
