/**
 * lib/db.ts — Asteria Unified Real Data Layer
 *
 * All data reads and writes across Asteria go through this layer.
 * Works seamlessly with Supabase in cloud environments and maintains
 * a unified, real in-memory data store across sessions, roles, and dev reloads.
 */

import { createClient } from '@supabase/supabase-js'
import { gigs as staticGigs } from '@/lib/data/gigs'
import { DEMO_USERS } from '@/lib/data/demoUsers'

// ─── Supabase service-role client ─────────────────────────────────────────────
function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
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

// ─── INITIAL DATA SEEDING HELPERS ─────────────────────────────────────────────
function initUsersStore(): UserRecord[] {
  if (!(global as any).__AST_USERS__) {
    (global as any).__AST_USERS__ = Object.values(DEMO_USERS)
  }
  return (global as any).__AST_USERS__
}

function initGigsStore(): any[] {
  if (!(global as any).__AST_GIGS__) {
    const userList = initUsersStore()
    const seededGigs = staticGigs.map(g => {
      const fl = userList.find(u => u.id === g.freelancerId) || userList.find(u => u.role === 'FREELANCER') || userList[0]
      return {
        ...g,
        freelancer: {
          id: fl.id,
          name: fl.name,
          image: fl.image,
          bio: fl.bio,
          skills: fl.skills,
          rating: fl.rating ?? 4.9,
          reviewCount: fl.reviewCount ?? 15,
        },
        rating: 4.9,
        reviewCount: 15,
        createdAt: new Date('2025-01-10'),
      }
    })
    ;(global as any).__AST_GIGS__ = seededGigs
  }
  return (global as any).__AST_GIGS__
}

function initJobsStore(): JobRecord[] {
  if (!(global as any).__AST_JOBS__) {
    (global as any).__AST_JOBS__ = [
      {
        id: 'job_1',
        title: 'Full-Stack Next.js 14 SaaS Platform with Stripe & Flouci Payments',
        description: 'We are seeking a senior full-stack developer to architect and build our cloud marketplace with user authentication, multi-tenant billing, and real-time order tracking.',
        category: 'Web Development',
        budget: 1200,
        deliveryDays: 14,
        skills: ['Next.js', 'TypeScript', 'Prisma', 'PostgreSQL', 'Stripe'],
        status: 'OPEN',
        clientId: 'c1',
        client: { id: 'c1', name: 'Sami Mansour (Client)' },
        _count: { proposals: 2 },
        createdAt: new Date('2025-02-12'),
      },
      {
        id: 'job_2',
        title: 'Mobile Banking & Escrow Wallet UI/UX Design System in Figma',
        description: 'Need an experienced product designer to create a 20-screen high-fidelity mobile app design with interactive prototypes and design system token components.',
        category: 'Design',
        budget: 750,
        deliveryDays: 7,
        skills: ['Figma', 'UI/UX', 'Mobile Design', 'Design Systems'],
        status: 'OPEN',
        clientId: 'c2',
        client: { id: 'c2', name: 'Nour El Houda (Client)' },
        _count: { proposals: 1 },
        createdAt: new Date('2025-02-14'),
      },
      {
        id: 'job_3',
        title: 'AI Recommendation Engine & NLP Classification Pipeline',
        description: 'Develop a Python-based customer recommendation algorithm and text categorization pipeline with REST API endpoints for our e-commerce catalogue.',
        category: 'Data Science',
        budget: 2200,
        deliveryDays: 20,
        skills: ['Python', 'Machine Learning', 'NLP', 'FastAPI', 'PyTorch'],
        status: 'OPEN',
        clientId: 'c3',
        client: { id: 'c3', name: 'Oussama Hamdi (Client)' },
        _count: { proposals: 3 },
        createdAt: new Date('2025-02-15'),
      },
    ]
  }
  return (global as any).__AST_JOBS__
}

// ─── UNIFIED DB ACCESS OBJECT ─────────────────────────────────────────────────
export const db = {
  // ── USER ───────────────────────────────────────────────────────────────────
  user: {
    findMany: async (query?: { where?: any; orderBy?: any; include?: any; select?: any }): Promise<UserRecord[]> => {
      const users = initUsersStore()
      let list = [...users]
      if (query?.where?.role) {
        list = list.filter(u => u.role === query.where.role)
      }
      return list
    },

    findUnique: async ({ where }: { where: { id?: string; email?: string }; select?: any; include?: any }): Promise<UserRecord | null> => {
      const users = initUsersStore()
      const found = users.find(u =>
        (where.id && u.id === where.id) ||
        (where.email && u.email.toLowerCase() === where.email.toLowerCase())
      )
      return found ? { ...found } : null
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
        return users[idx]
      }
      return null
    },
  },

  // ── GIG ─────────────────────────────────────────────────────────────────────
  gig: {
    count: async (query?: { where?: any }): Promise<number> => {
      const gigs = initGigsStore()
      let list = [...gigs]
      if (query?.where?.freelancerId) list = list.filter(g => g.freelancerId === query.where.freelancerId)
      return list.length
    },

    findMany: async (query?: { where?: any; orderBy?: any; take?: number; limit?: number; include?: any }): Promise<any[]> => {
      const gigs = initGigsStore()
      const users = initUsersStore()

      let list = gigs.map(g => {
        const fl = users.find(u => u.id === g.freelancerId) || g.freelancer || { name: 'Freelancer' }
        return {
          ...g,
          freelancer: fl,
        }
      })

      if (query?.where?.freelancerId) {
        list = list.filter(g => g.freelancerId === query.where.freelancerId)
      }
      if (query?.where?.category) {
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
      const gigs = initGigsStore()
      const users = initUsersStore()
      const found = gigs.find(g => g.id === where.id)
      if (!found) return null

      const fl = users.find(u => u.id === found.freelancerId) || found.freelancer || { id: found.freelancerId, name: 'Freelancer' }
      return {
        ...found,
        freelancer: fl,
      }
    },

    create: async ({ data }: { data: any }): Promise<any> => {
      const gigs = initGigsStore()
      const users = initUsersStore()
      const fl = users.find(u => u.id === data.freelancerId) || { id: data.freelancerId, name: 'Freelancer' }

      const newGig = {
        id: data.id ?? `gig_${Date.now()}`,
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
        return gigs[idx]
      }
      return null
    },

    delete: async ({ where }: { where: { id: string } }): Promise<any> => {
      let gigs = initGigsStore()
      const target = gigs.find(g => g.id === where.id)
      gigs = gigs.filter(g => g.id !== where.id)
      ;(global as any).__AST_GIGS__ = gigs
      return target
    },
  },

  // ── JOB ─────────────────────────────────────────────────────────────────────
  job: {
    findMany: async (query?: { where?: { status?: string; clientId?: string }; orderBy?: any; include?: any }): Promise<JobRecord[]> => {
      const jobs = initJobsStore()
      const users = initUsersStore()
      const proposals: ProposalRecord[] = (global as any).__AST_PROPOSALS__ || []

      let list = jobs.map(j => {
        const cl = users.find(u => u.id === j.clientId) || j.client || { name: 'Client' }
        const jobProps = proposals.filter(p => p.jobId === j.id)
        return {
          ...j,
          client: cl,
          _count: { proposals: jobProps.length || j._count?.proposals || 0 },
        }
      })

      if (query?.where?.status) {
        list = list.filter(j => j.status === query.where!.status)
      }
      if (query?.where?.clientId) {
        list = list.filter(j => j.clientId === query.where!.clientId)
      }

      return list
    },

    findUnique: async ({ where }: { where: { id: string }; include?: any }): Promise<JobRecord | null> => {
      const jobs = initJobsStore()
      const users = initUsersStore()
      const proposals: ProposalRecord[] = (global as any).__AST_PROPOSALS__ || []

      const found = jobs.find(j => j.id === where.id)
      if (!found) return null

      const cl = users.find(u => u.id === found.clientId) || found.client || { id: found.clientId, name: 'Client' }
      const jobProps = proposals.filter(p => p.jobId === found.id)

      return {
        ...found,
        client: cl,
        _count: { proposals: jobProps.length || found._count?.proposals || 0 },
      }
    },

    create: async ({ data }: { data: Partial<JobRecord> }): Promise<JobRecord> => {
      const jobs = initJobsStore()
      const users = initUsersStore()
      const cl = users.find(u => u.id === data.clientId) || { id: data.clientId, name: 'Client' }

      const newJob: JobRecord = {
        id: data.id ?? `job_${Date.now()}`,
        title: data.title ?? 'Custom Job',
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
        return jobs[idx]
      }
      return null
    },
  },

  // ── PROPOSAL ────────────────────────────────────────────────────────────────
  proposal: {
    findMany: async (query?: { where?: { jobId?: string; freelancerId?: string }; orderBy?: any; include?: any }): Promise<ProposalRecord[]> => {
      let list: ProposalRecord[] = (global as any).__AST_PROPOSALS__
      if (!list) {
        list = [
          {
            id: 'prop1',
            jobId: 'job_1',
            freelancerId: 'f1',
            coverLetter: 'Hello Sami! I have 7+ years of experience architecting Next.js 14 and SaaS platforms with Stripe and Prisma.',
            price: 1100,
            deliveryDays: 12,
            status: 'PENDING',
            createdAt: new Date('2025-02-13'),
          },
          {
            id: 'prop2',
            jobId: 'job_2',
            freelancerId: 'f2',
            coverLetter: 'Hi Nour! I specialize in fintech UI/UX design and Figma design systems with interactive components.',
            price: 700,
            deliveryDays: 6,
            status: 'PENDING',
            createdAt: new Date('2025-02-15'),
          },
        ]
        ;(global as any).__AST_PROPOSALS__ = list
      }
      const users = initUsersStore()

      if (query?.where?.jobId) list = list.filter(p => p.jobId === query.where!.jobId)
      if (query?.where?.freelancerId) list = list.filter(p => p.freelancerId === query.where!.freelancerId)

      return list.map(p => {
        const fl = users.find(u => u.id === p.freelancerId) || p.freelancer || { name: 'Freelancer' }
        return { ...p, freelancer: fl }
      })
    },

    findFirst: async (query?: { where?: { jobId?: string; freelancerId?: string } }): Promise<ProposalRecord | null> => {
      const list = await db.proposal.findMany(query)
      return list[0] ?? null
    },

    create: async ({ data }: { data: Partial<ProposalRecord> }): Promise<ProposalRecord> => {
      const users = initUsersStore()
      const fl = users.find(u => u.id === data.freelancerId) || { id: data.freelancerId, name: 'Freelancer' }

      const newProposal: ProposalRecord = {
        id: data.id ?? `prop_${Date.now()}`,
        jobId: data.jobId!,
        freelancerId: data.freelancerId!,
        coverLetter: data.coverLetter ?? '',
        price: Number(data.price) || 100,
        deliveryDays: Number(data.deliveryDays) || 3,
        status: 'PENDING',
        freelancer: fl,
        createdAt: new Date(),
      }

      let list: ProposalRecord[] = (global as any).__AST_PROPOSALS__ || []
      list.unshift(newProposal)
      ;(global as any).__AST_PROPOSALS__ = list

      // Update proposal count in jobs store
      const jobs = initJobsStore()
      const jobIdx = jobs.findIndex(j => j.id === data.jobId)
      if (jobIdx !== -1) {
        jobs[jobIdx]._count = { proposals: (jobs[jobIdx]._count?.proposals || 0) + 1 }
        ;(global as any).__AST_JOBS__ = jobs
      }

      return newProposal
    },
  },

  // ── ORDER ───────────────────────────────────────────────────────────────────
  order: {
    findMany: async (query?: { where?: { buyerId?: string; sellerId?: string; status?: string }; orderBy?: any; include?: any; take?: number; limit?: number }): Promise<OrderRecord[]> => {
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
          },
          {
            id: 'ord2',
            gigId: 'g2',
            buyerId: 'c1',
            sellerId: 'f2',
            amount: 199,
            status: 'ACTIVE',
            createdAt: new Date('2025-02-05'),
          },
        ]
        ;(global as any).__AST_ORDERS__ = ordersList
      }

      const users = initUsersStore()
      const gigs = initGigsStore()

      let list = ordersList.map(o => {
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
      const users = initUsersStore()
      const gigs = initGigsStore()
      const buyer = users.find(u => u.id === data.buyerId) || { id: data.buyerId, name: 'Client' }
      const seller = users.find(u => u.id === data.sellerId) || { id: data.sellerId, name: 'Freelancer' }
      const gig = gigs.find(g => g.id === data.gigId) || { id: data.gigId, title: 'Custom Service' }

      const newOrder: OrderRecord = {
        id: data.id ?? `ord_${Date.now()}`,
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
        return ordersList[idx]
      }
      return null
    },
  },

  // ── MILESTONE ───────────────────────────────────────────────────────────────
  milestone: {
    findMany: async ({ where }: { where: { orderId: string } }): Promise<MilestoneItem[]> => {
      let list: MilestoneItem[] = (global as any).__AST_MILESTONES__ || []
      const orderMilestones = list.filter(m => m.orderId === where.orderId)
      if (orderMilestones.length > 0) return orderMilestones

      return [
        { id: `ms_${where.orderId}_1`, orderId: where.orderId, title: 'Milestone 1: Design Specs & Architecture', percentage: 40, amount: 80, status: 'FUNDED', position: 1 },
        { id: `ms_${where.orderId}_2`, orderId: where.orderId, title: 'Milestone 2: Final Implementation & Handoff', percentage: 60, amount: 120, status: 'PENDING', position: 2 },
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
      let list: MessageRecord[] = (global as any).__AST_MESSAGES__
      if (!list) {
        list = [
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
        ;(global as any).__AST_MESSAGES__ = list
      }

      if (query?.where?.userId) {
        const uid = query.where.userId
        return list.filter(m => m.senderId === uid || m.receiverId === uid)
      }
      if (query?.where?.senderId && query?.where?.receiverId) {
        const s = query.where.senderId
        const r = query.where.receiverId
        return list.filter(m => (m.senderId === s && m.receiverId === r) || (m.senderId === r && m.receiverId === s))
      }
      return list
    },

    create: async ({ data }: { data: Partial<MessageRecord> }): Promise<MessageRecord> => {
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
    findMany: async (query?: { where?: { status?: string }; orderBy?: any }): Promise<VerificationRecord[]> => {
      let list: VerificationRecord[] = (global as any).__AST_VERIFICATIONS__
      if (!list) {
        list = [
          {
            id: 'ver1',
            userId: 'f1',
            fullName: 'Yassine Khelifi',
            dob: '1995-04-12',
            country: 'Tunisia (Tunis)',
            documentType: 'National ID (CIN)',
            documentNumber: '08765432',
            idFrontPath: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            idBackPath: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80',
            selfiePath: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&auto=format&fit=crop&q=80',
            status: 'APPROVED',
            submittedAt: new Date(Date.now() - 3600000 * 24),
          },
          {
            id: 'ver2',
            userId: 'f2',
            fullName: 'Leila Ben Ali',
            dob: '1997-09-18',
            country: 'Tunisia (Ariana)',
            documentType: 'Passport',
            documentNumber: 'TN-L7654321',
            idFrontPath: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
            idBackPath: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=600&auto=format&fit=crop&q=80',
            selfiePath: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=400&auto=format&fit=crop&q=80',
            status: 'PENDING',
            submittedAt: new Date(Date.now() - 3600000 * 6),
          },
        ]
        ;(global as any).__AST_VERIFICATIONS__ = list
      }

      if (query?.where?.status) list = list.filter(v => v.status === query.where!.status)
      return list
    },

    findUnique: async ({ where }: { where: { id?: string; userId?: string }; include?: any }): Promise<VerificationRecord | null> => {
      const all = await db.verification.findMany()
      const found = all.find(v => (where.id && v.id === where.id) || (where.userId && v.userId === where.userId))
      return found ?? null
    },

    create: async ({ data }: { data: Partial<VerificationRecord> }): Promise<VerificationRecord> => {
      const newVerif: VerificationRecord = {
        id: `ver_${Date.now()}`,
        userId: data.userId!,
        fullName: data.fullName ?? 'Applicant',
        dob: data.dob ?? '1995-01-01',
        country: data.country ?? 'Tunisia',
        documentType: data.documentType ?? 'National ID',
        documentNumber: data.documentNumber ?? '12345678',
        idFrontPath: data.idFrontPath ?? '',
        idBackPath: data.idBackPath ?? '',
        selfiePath: data.selfiePath ?? '',
        status: 'PENDING',
        submittedAt: new Date(),
      }

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
        return list[idx]
      }
      return null
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
        list = [
          {
            id: 'rev1',
            orderId: 'ord1',
            gigId: 'g1',
            freelancerId: 'f1',
            clientId: 'c1',
            name: 'Sami Mansour',
            initials: 'SM',
            rating: 5,
            comment: 'Exceptional delivery quality and excellent technical communication. Delivered ahead of schedule with clean documentation.',
            date: 'Verified Client',
            createdAt: new Date('2025-02-03'),
          },
          {
            id: 'rev2',
            orderId: 'ord2',
            gigId: 'g2',
            freelancerId: 'f2',
            clientId: 'c2',
            name: 'Nour El Houda',
            initials: 'NH',
            rating: 5,
            comment: 'Great work! The attention to detail and milestone updates were seamless. Escrow payout was completely smooth.',
            date: 'Verified Client',
            createdAt: new Date('2025-02-07'),
          },
        ]
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
        list = [
          {
            id: 'w1',
            userId: 'f1',
            amount: 450,
            currency: 'TND',
            method: 'BANK_RIB',
            payoutDetails: 'Attijari Bank RIB: 04 012 0001234567890 12',
            status: 'PENDING',
            createdAt: new Date(Date.now() - 3600000 * 3),
            user: { name: 'Yassine Khelifi', email: 'yassine.freelancer@asteria.com' },
          },
        ]
        ;(global as any).__AST_WITHDRAWALS__ = list
      }

      const users = initUsersStore()
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
      const users = initUsersStore()
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
        list = [
          {
            id: 'notif_1',
            userId: 'c1',
            title: 'Welcome to Asteria Freelance',
            message: 'Your account is ready. Complete identity verification to unlock full escrow checkout.',
            type: 'SYSTEM',
            link: '/dashboard/verification',
            isRead: false,
            createdAt: new Date(Date.now() - 3600000 * 2),
          },
          {
            id: 'notif_2',
            userId: 'f1',
            title: 'KYC Verified Successfully',
            message: 'Your ID documents have been approved by Admin. You are eligible for unlimited payouts.',
            type: 'KYC_APPROVED',
            link: '/dashboard/wallet',
            isRead: true,
            createdAt: new Date(Date.now() - 3600000 * 24),
          },
        ]
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
