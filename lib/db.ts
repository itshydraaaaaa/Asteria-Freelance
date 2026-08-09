import { freelancers } from '@/lib/data/freelancers'
import { gigs } from '@/lib/data/gigs'

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
  idFrontUrl: string
  idBackUrl: string
  selfieUrl: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  rejectionReason?: string
  submittedAt: Date
  reviewedAt?: Date
  user?: any
}

export interface AuditLogRecord {
  id: string
  adminId: string
  adminName: string
  action: string
  details: string
  createdAt: Date
}

export interface ReportRecord {
  id: string
  reporterId: string
  reporterName: string
  targetType: 'GIG' | 'JOB' | 'USER'
  targetId: string
  targetTitle: string
  reason: string
  description: string
  status: 'PENDING' | 'DISMISSED' | 'RESOLVED'
  createdAt: Date
}

// In-Memory Global Mock Store
const globalStore = (globalThis as any).__ASTERIA_DB__ ?? {
  users: [
    // --- 3 FREELANCERS ---
    { id: 'f1', name: 'Yassine Khelifi', email: 'yassine.freelancer@asteria.com', role: 'FREELANCER', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', walletBalance: 1450, verifiedStatus: 'APPROVED', createdAt: new Date('2025-01-15') },
    { id: 'f2', name: 'Leila Ben Ali', email: 'leila.freelancer@asteria.com', role: 'FREELANCER', image: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80', walletBalance: 820, verifiedStatus: 'PENDING', createdAt: new Date('2025-02-01') },
    { id: 'f3', name: 'Karim Ben Ammar', email: 'karim.freelancer@asteria.com', role: 'FREELANCER', image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80', walletBalance: 2100, verifiedStatus: 'APPROVED', createdAt: new Date('2025-01-20') },

    // --- 3 CLIENTS ---
    { id: 'c1', name: 'Sami Mansour', email: 'sami.client@asteria.com', role: 'CLIENT', image: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80', walletBalance: 3200, verifiedStatus: 'APPROVED', createdAt: new Date('2025-02-10') },
    { id: 'c2', name: 'Nour El Houda', email: 'nour.client@asteria.com', role: 'CLIENT', image: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80', walletBalance: 1850, verifiedStatus: 'UNSUBMITTED', createdAt: new Date('2025-02-12') },
    { id: 'c3', name: 'Oussama Hamdi', email: 'oussama.client@asteria.com', role: 'CLIENT', image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80', walletBalance: 5000, verifiedStatus: 'APPROVED', createdAt: new Date('2025-01-05') },

    // --- 3 ADMINS ---
    { id: 'admin1', name: 'Admin Master', email: 'admin.master@asteria.com', role: 'ADMIN', image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80', walletBalance: 0, verifiedStatus: 'APPROVED', createdAt: new Date('2025-01-01') },
    { id: 'admin2', name: 'Sarah Admin (KYC Supervisor)', email: 'sarah.admin@asteria.com', role: 'ADMIN', image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80', walletBalance: 0, verifiedStatus: 'APPROVED', createdAt: new Date('2025-01-02') },
    { id: 'admin3', name: 'Tarek Admin (Finance Auditor)', email: 'tarek.admin@asteria.com', role: 'ADMIN', image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=150&auto=format&fit=crop&q=80', walletBalance: 0, verifiedStatus: 'APPROVED', createdAt: new Date('2025-01-03') },
  ] as UserRecord[],

  orders: [
    { id: 'ord1', gigId: 'g1', buyerId: 'c1', sellerId: 'f1', amount: 299, status: 'COMPLETED', createdAt: new Date('2025-02-01') },
    { id: 'ord2', gigId: 'g2', buyerId: 'c1', sellerId: 'f2', amount: 199, status: 'ACTIVE', createdAt: new Date('2025-02-05') },
    { id: 'ord3', gigId: 'g7', buyerId: 'c1', sellerId: 'f1', amount: 79, status: 'COMPLETED', createdAt: new Date('2025-02-08') },
  ] as OrderRecord[],

  jobs: [
    { id: 'j1', title: 'Build an AI Chatbot widget for Next.js app', description: 'Looking for a skilled developer to build a floating AI chatbot widget integrating OpenAI API and Tailwind CSS.', category: 'Web Development', budget: 500, deliveryDays: 5, skills: ['Next.js', 'OpenAI', 'TypeScript'], status: 'OPEN', clientId: 'c1', client: { name: 'Sami Mansour' }, _count: { proposals: 3 }, createdAt: new Date('2025-02-01') },
    { id: 'j2', title: 'Figma UI/UX design for Fintech mobile app', description: 'Need 12 high-fidelity screens for a modern digital wallet app targeting North Africa.', category: 'Design', budget: 750, deliveryDays: 7, skills: ['Figma', 'UI/UX', 'Mobile Design'], status: 'OPEN', clientId: 'c1', client: { name: 'Sami Mansour' }, _count: { proposals: 1 }, createdAt: new Date('2025-02-03') },
  ] as JobRecord[],

  proposals: [
    { id: 'prop1', jobId: 'j1', freelancerId: 'f1', coverLetter: 'I have built over 10 custom AI chatbot widgets with Next.js & OpenAI.', price: 450, deliveryDays: 4, createdAt: new Date('2025-02-02'), freelancer: { name: 'Yassine Khelifi', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80', bio: 'Senior Full Stack & AI Dev', skills: ['Next.js', 'OpenAI', 'React'] } }
  ] as ProposalRecord[],

  verifications: [
    { id: 'v1', userId: 'f2', fullName: 'Leila Ben Ali', dob: '1996-05-14', country: 'Tunisia', documentType: 'National ID', documentNumber: '14890234', idFrontUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80', idBackUrl: 'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=80', selfieUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80', status: 'PENDING', submittedAt: new Date('2025-02-05') }
  ] as VerificationRecord[],

  auditLogs: [
    { id: 'l1', adminId: 'admin1', adminName: 'Admin Master', action: 'SYSTEM_INITIALIZED', details: 'Platform audit logging started.', createdAt: new Date('2025-02-01') }
  ] as AuditLogRecord[],

  reports: [
    { id: 'r1', reporterId: 'f1', reporterName: 'Yassine Khelifi', targetType: 'GIG', targetId: 'g3', targetTitle: 'Build an ML model for customer churn', reason: 'Misleading pricing', description: 'Price listed as $450 but scope requires enterprise setup.', status: 'PENDING', createdAt: new Date('2025-02-06') }
  ] as ReportRecord[]
}

if (process.env.NODE_ENV !== 'production') {
  ;(globalThis as any).__ASTERIA_DB__ = globalStore
}

export const db = {
  user: {
    findMany: async (query?: any) => {
      let res = [...globalStore.users]
      if (query?.where?.role) res = res.filter(u => u.role === query.where.role)
      if (query?.orderBy?.createdAt === 'desc') res.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      return res
    },
    findUnique: async ({ where, select }: { where: { id: string }, select?: any }) => {
      const u = globalStore.users.find((u: any) => u.id === where.id)
      return u ? { ...u } : null
    },
    update: async ({ where, data }: { where: { id: string }, data: Partial<UserRecord> }) => {
      const idx = globalStore.users.findIndex((u: any) => u.id === where.id)
      if (idx !== -1) {
        globalStore.users[idx] = { ...globalStore.users[idx], ...data }
        return globalStore.users[idx]
      }
      return null
    },
    count: async (query?: any) => {
      let res = [...globalStore.users]
      if (query?.where?.role) res = res.filter(u => u.role === query.where.role)
      return res.length
    }
  },

  order: {
    findMany: async (query?: any) => {
      let res = [...globalStore.orders]
      if (query?.where?.sellerId) res = res.filter(o => o.sellerId === query.where.sellerId)
      if (query?.where?.buyerId) res = res.filter(o => o.buyerId === query.where.buyerId)
      if (query?.orderBy?.createdAt === 'desc') res.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      if (query?.take) res = res.slice(0, query.take)

      // populate gig & buyer
      return res.map(o => ({
        ...o,
        gig: gigs.find(g => g.id === o.gigId) ?? { title: 'Custom Gig Service' },
        buyer: globalStore.users.find((u: any) => u.id === o.buyerId) ?? { name: 'Client' },
      }))
    },
    findUnique: async ({ where, include }: { where: { id: string }, include?: any }) => {
      return globalStore.orders.find((o: any) => o.id === where.id) ?? null
    },
    update: async ({ where, data }: { where: { id: string }, data: Partial<OrderRecord> }) => {
      const idx = globalStore.orders.findIndex((o: any) => o.id === where.id)
      if (idx !== -1) {
        globalStore.orders[idx] = { ...globalStore.orders[idx], ...data }
        return globalStore.orders[idx]
      }
      return null
    }
  },

  gig: {
    findMany: async (query?: any) => {
      let res = [...gigs]
      if (query?.where?.freelancerId) res = res.filter(g => g.freelancerId === query.where.freelancerId)
      if (query?.take) res = res.slice(0, query.take)

      return res.map(g => ({
        ...g,
        freelancer: globalStore.users.find((u: any) => u.id === g.freelancerId) ?? { name: 'Freelancer' }
      }))
    },
    findUnique: async ({ where, include }: { where: { id: string }, include?: any }) => {
      const g = gigs.find(g => g.id === where.id)
      if (!g) return null
      return {
        ...g,
        freelancer: globalStore.users.find((u: any) => u.id === g.freelancerId) ?? { name: 'Freelancer' }
      }
    },
    count: async (query?: any) => {
      let res = [...gigs]
      if (query?.where?.freelancerId) res = res.filter(g => g.freelancerId === query.where.freelancerId)
      return res.length
    }
  },

  job: {
    findMany: async (query?: any) => {
      return globalStore.jobs.map((j: any) => ({
        ...j,
        client: globalStore.users.find((u: any) => u.id === j.clientId) ?? { name: 'Client' }
      }))
    },
    findUnique: async ({ where, include }: { where: { id: string }, include?: any }) => {
      const j = globalStore.jobs.find((j: any) => j.id === where.id)
      if (!j) return null
      return {
        ...j,
        client: globalStore.users.find((u: any) => u.id === j.clientId) ?? { name: 'Client' }
      }
    }
  },

  proposal: {
    findMany: async ({ where, include, orderBy }: { where: { jobId: string }, include?: any, orderBy?: any }) => {
      return globalStore.proposals.filter((p: any) => p.jobId === where.jobId).map((p: any) => ({
        ...p,
        freelancer: globalStore.users.find((u: any) => u.id === p.freelancerId) ?? p.freelancer ?? { name: 'Freelancer' }
      }))
    },
    findFirst: async ({ where }: { where: { jobId: string, freelancerId: string } }) => {
      return globalStore.proposals.find((p: any) => p.jobId === where.jobId && p.freelancerId === where.freelancerId) ?? null
    },
    create: async ({ data }: { data: any }) => {
      const newProp: ProposalRecord = {
        id: `prop_${Date.now()}`,
        jobId: data.jobId,
        freelancerId: data.freelancerId,
        coverLetter: data.coverLetter,
        price: data.price,
        deliveryDays: data.deliveryDays,
        createdAt: new Date()
      }
      globalStore.proposals.push(newProp)
      return newProp
    }
  },

  verification: {
    findMany: async (query?: any) => {
      let res = [...globalStore.verifications]
      if (query?.where?.status) res = res.filter((v: any) => v.status === query.where.status)
      if (query?.where?.userId) res = res.filter((v: any) => v.userId === query.where.userId)
      if (query?.orderBy?.submittedAt === 'desc') res.sort((a: any, b: any) => b.submittedAt.getTime() - a.submittedAt.getTime())
      return res.map((v: any) => ({
        ...v,
        user: globalStore.users.find((u: any) => u.id === v.userId) ?? { name: v.fullName, email: '—' }
      }))
    },
    findFirst: async ({ where }: { where: { userId: string } }) => {
      return globalStore.verifications.find((v: any) => v.userId === where.userId) ?? null
    },
    create: async ({ data }: { data: any }) => {
      const newVerif: VerificationRecord = {
        id: `v_${Date.now()}`,
        userId: data.userId,
        fullName: data.fullName,
        dob: data.dob,
        country: data.country,
        documentType: data.documentType,
        documentNumber: data.documentNumber,
        idFrontUrl: data.idFrontUrl,
        idBackUrl: data.idBackUrl,
        selfieUrl: data.selfieUrl,
        status: 'PENDING',
        submittedAt: new Date()
      }
      globalStore.verifications.unshift(newVerif)
      
      // Update user verifiedStatus
      const user = globalStore.users.find((u: any) => u.id === data.userId)
      if (user) user.verifiedStatus = 'PENDING'

      return newVerif
    },
    update: async ({ where, data }: { where: { id: string }, data: Partial<VerificationRecord> }) => {
      const idx = globalStore.verifications.findIndex((v: any) => v.id === where.id)
      if (idx !== -1) {
        globalStore.verifications[idx] = { ...globalStore.verifications[idx], ...data, reviewedAt: new Date() }
        
        // Update user status accordingly
        const verif = globalStore.verifications[idx]
        const user = globalStore.users.find((u: any) => u.id === verif.userId)
        if (user && data.status) {
          user.verifiedStatus = data.status
        }
        return globalStore.verifications[idx]
      }
      return null
    }
  },

  auditLog: {
    findMany: async () => {
      return [...globalStore.auditLogs].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    },
    create: async ({ data }: { data: { adminId: string, adminName: string, action: string, details: string } }) => {
      const newLog: AuditLogRecord = {
        id: `log_${Date.now()}`,
        adminId: data.adminId,
        adminName: data.adminName,
        action: data.action,
        details: data.details,
        createdAt: new Date()
      }
      globalStore.auditLogs.unshift(newLog)
      return newLog
    }
  },

  report: {
    findMany: async (query?: any) => {
      let res = [...globalStore.reports]
      if (query?.where?.status) res = res.filter((r: any) => r.status === query.where.status)
      return res.sort((a: any, b: any) => b.createdAt.getTime() - a.createdAt.getTime())
    },
    create: async ({ data }: { data: any }) => {
      const newReport: ReportRecord = {
        id: `rep_${Date.now()}`,
        reporterId: data.reporterId,
        reporterName: data.reporterName,
        targetType: data.targetType,
        targetId: data.targetId,
        targetTitle: data.targetTitle,
        reason: data.reason,
        description: data.description,
        status: 'PENDING',
        createdAt: new Date()
      }
      globalStore.reports.unshift(newReport)
      return newReport
    },
    update: async ({ where, data }: { where: { id: string }, data: Partial<ReportRecord> }) => {
      const idx = globalStore.reports.findIndex((r: any) => r.id === where.id)
      if (idx !== -1) {
        globalStore.reports[idx] = { ...globalStore.reports[idx], ...data }
        return globalStore.reports[idx]
      }
      return null
    }
  }
}
