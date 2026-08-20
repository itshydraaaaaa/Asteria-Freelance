'use client'

import { useState } from 'react'
import {
  Shield, UserCheck, DollarSign, FileText, Flag, History, CheckCircle2,
  XCircle, Search, ArrowUpRight, ArrowDownLeft, Eye, AlertCircle, Edit3, Lock, ShieldCheck, MessageSquare, Wallet
} from 'lucide-react'

interface Props {
  initialUsers: any[]
  initialOrders: any[]
  initialGigs: any[]
  initialVerifications: any[]
  initialLogs: any[]
  initialReports: any[]
  initialWithdrawals?: any[]
}

const ROLE_BADGE: Record<string, string> = {
  CLIENT:     'bg-blue-50 text-blue-700 border border-blue-200',
  FREELANCER: 'bg-ast-primary/10 text-ast-primary border border-ast-primary/30',
  ADMIN:      'bg-ast-dark text-white',
}

const STATUS_BADGE: Record<string, string> = {
  PENDING:   'bg-amber-50 text-amber-700 border border-amber-200',
  APPROVED:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
  ACTIVE:    'bg-ast-primary/10 text-ast-primary border border-ast-primary/30',
  COMPLETED: 'bg-green-50 text-green-700 border border-green-200',
  CANCELLED: 'bg-black/8 text-ast-gray border border-black/15',
  REJECTED:  'bg-red-50 text-red-700 border border-red-200',
  DISMISSED: 'bg-gray-100 text-gray-600',
  RESOLVED:  'bg-emerald-50 text-emerald-700 border border-emerald-200',
}

export function AdminClient({
  initialUsers,
  initialOrders,
  initialGigs,
  initialVerifications,
  initialLogs,
  initialReports,
  initialWithdrawals = [],
}: Props) {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'WITHDRAWALS' | 'VERIFICATIONS' | 'USERS' | 'LOGS' | 'REPORTS'>('OVERVIEW')

  // State
  const [users, setUsers] = useState<any[]>(initialUsers)
  const [orders, setOrders] = useState<any[]>(initialOrders)
  const [gigs, setGigs] = useState<any[]>(initialGigs)
  const [verifications, setVerifications] = useState<any[]>(initialVerifications)
  const [logs, setLogs] = useState<any[]>(initialLogs)
  const [reports, setReports] = useState<any[]>(initialReports)
  const [withdrawals, setWithdrawals] = useState<any[]>(initialWithdrawals)

  // Search
  const [userSearch, setUserSearch] = useState('')

  // Balance Adjustment Modal State
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<any>(null)
  const [balanceType, setBalanceType] = useState<'ADD' | 'DEDUCT' | 'SET'>('ADD')
  const [balanceAmount, setBalanceAmount] = useState('')
  const [balanceReason, setBalanceReason] = useState('')
  const [balanceLoading, setBalanceLoading] = useState(false)

  // Verification Rejection Modal State
  const [rejectingVerif, setRejectingVerif] = useState<any>(null)
  const [rejectionReason, setRejectionReason] = useState('')

  // Deep Case Dossier Inspection State
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null)
  const [caseDossier, setCaseDossier] = useState<any>(null)
  const [caseLoading, setCaseLoading] = useState(false)
  const [dossierTab, setDossierTab] = useState<'DEAL_LOGS' | 'CHAT_TRANSCRIPT' | 'PROFILES'>('DEAL_LOGS')

  // Image Preview Modal
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  // Action status feedback
  const [toastMsg, setToastMsg] = useState('')

  const showToast = (msg: string) => {
    setToastMsg(msg)
    setTimeout(() => setToastMsg(''), 3000)
  }

  // Handle Balance Adjustment
  const handleBalanceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedUserForBalance || !balanceAmount) return

    try {
      setBalanceLoading(true)
      const res = await fetch('/api/admin/balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUserForBalance.id,
          type: balanceType,
          amount: balanceAmount,
          reason: balanceReason,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to adjust balance')

      // Update local state
      setUsers(prev => prev.map(u => u.id === selectedUserForBalance.id ? { ...u, walletBalance: data.user.walletBalance } : u))
      
      // Refresh audit logs
      const logRes = await fetch('/api/admin/logs')
      if (logRes.ok) {
        const logData = await logRes.json()
        setLogs(logData.logs)
      }

      showToast(`Wallet balance updated for ${selectedUserForBalance.name}!`)
      setSelectedUserForBalance(null)
      setBalanceAmount('')
      setBalanceReason('')
    } catch (err: any) {
      alert(err.message)
    } finally {
      setBalanceLoading(false)
    }
  }

  // Handle Verification Decision (Approve or Reject)
  const handleVerificationDecision = async (id: string, status: 'APPROVED' | 'REJECTED', reason?: string) => {
    try {
      const res = await fetch('/api/admin/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status, rejectionReason: reason }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update status')

      // Update local verifications state
      setVerifications(prev => prev.map(v => v.id === id ? { ...v, status, rejectionReason: reason } : v))
      
      // Update local user verifiedStatus
      const verif = verifications.find(v => v.id === id)
      if (verif) {
        setUsers(prev => prev.map(u => u.id === verif.userId ? { ...u, verifiedStatus: status } : u))
      }

      // Refresh audit logs
      const logRes = await fetch('/api/admin/logs')
      if (logRes.ok) {
        const logData = await logRes.json()
        setLogs(logData.logs)
      }

      showToast(`Verification marked as ${status}!`)
      setRejectingVerif(null)
      setRejectionReason('')
    } catch (err: any) {
      alert(err.message)
    }
  }

  // Handle Case Inspection
  const handleInspectCase = async (reportId: string) => {
    try {
      setSelectedCaseId(reportId)
      setCaseLoading(true)
      const res = await fetch(`/api/admin/reports/${reportId}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to fetch case dossier')
      setCaseDossier(data)
    } catch (err: any) {
      alert(err.message)
    } finally {
      setCaseLoading(false)
    }
  }

  // Handle Report Resolution
  const handleReportResolution = async (id: string, status: 'DISMISSED' | 'RESOLVED') => {
    try {
      const res = await fetch('/api/reports', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to update report status')

      setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r))
      
      const logRes = await fetch('/api/admin/logs')
      if (logRes.ok) {
        const logData = await logRes.json()
        setLogs(logData.logs)
      }

      showToast(`Report marked as ${status}!`)
    } catch (err: any) {
      alert(err.message)
    }
  }

  const filteredUsers = users.filter(u =>
    u.name?.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.email?.toLowerCase().includes(userSearch.toLowerCase())
  )

  const pendingVerifsCount = verifications.filter(v => v.status === 'PENDING').length
  const pendingReportsCount = reports.filter(r => r.status === 'PENDING').length
  const pendingWithdrawalsCount = withdrawals.filter(w => w.status === 'PENDING').length

  // Withdrawal Rejection Modal State
  const [rejectingWithdrawal, setRejectingWithdrawal] = useState<any>(null)
  const [withdrawalRejectionNotes, setWithdrawalRejectionNotes] = useState('')
  const [withdrawalFilter, setWithdrawalFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL')

  const handleWithdrawalDecision = async (id: string, action: 'APPROVE' | 'REJECT', notes?: string) => {
    try {
      const res = await fetch('/api/admin/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action, adminNotes: notes }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to process payout')

      setWithdrawals(prev => prev.map(w => w.id === id ? { ...w, status: action === 'APPROVE' ? 'APPROVED' : 'REJECTED', adminNotes: notes } : w))
      
      // Refresh audit logs
      const logRes = await fetch('/api/admin/logs')
      if (logRes.ok) {
        const logData = await logRes.json()
        setLogs(logData.logs)
      }

      showToast(data.message || `Payout request marked as ${action}!`)
      setRejectingWithdrawal(null)
      setWithdrawalRejectionNotes('')
    } catch (err: any) {
      alert(err.message)
    }
  }

  const filteredWithdrawals = withdrawals.filter(w =>
    withdrawalFilter === 'ALL' ? true : w.status === withdrawalFilter
  )

  return (
    <div className="space-y-8">
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-ast-dark text-white px-5 py-3 rounded-2xl shadow-xl border border-ast-light/20 text-sm flex items-center gap-2 animate-bounce">
          <CheckCircle2 size={18} className="text-ast-light" />
          {toastMsg}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-ast-dark flex items-center justify-center border border-ast-light/30 text-ast-light shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h1 className="font-heading font-bold text-3xl text-black">Master Admin Command</h1>
            <p className="text-ast-gray text-xs">Manage users, account balances (solde), KYC identity approvals, payouts & dispute reports</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap items-center gap-2 border-b border-black/8 pb-4">
        {[
          { id: 'OVERVIEW',       label: 'Overview',              Icon: Shield,       badge: null },
          { id: 'WITHDRAWALS',   label: 'Payout Requests',       Icon: Wallet,       badge: pendingWithdrawalsCount },
          { id: 'VERIFICATIONS', label: 'KYC Verifications',     Icon: UserCheck,    badge: pendingVerifsCount },
          { id: 'USERS',         label: 'Users & Balance (Solde)', Icon: DollarSign,   badge: users.length },
          { id: 'LOGS',          label: 'Admin Audit Logs',      Icon: History,      badge: logs.length },
          { id: 'REPORTS',       label: 'Flagged Content',       Icon: Flag,         badge: pendingReportsCount },
        ].map(({ id, label, Icon, badge }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold transition-all ${
              activeTab === id
                ? 'bg-ast-dark text-white shadow-sm'
                : 'bg-white text-ast-gray hover:text-black border border-black/8 hover:bg-ast-surface'
            }`}
          >
            <Icon size={16} />
            {label}
            {badge !== null && badge > 0 && (
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeTab === id ? 'bg-ast-light text-ast-dark font-bold' : 'bg-ast-primary/10 text-ast-primary'
              }`}>
                {badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'OVERVIEW' && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Users',     value: String(users.length), sub: `${users.filter(u => u.role === 'FREELANCER').length} freelancers`, color: 'border-l-ast-primary' },
              { label: 'Pending Payouts', value: String(pendingWithdrawalsCount), sub: 'Awaiting transfer', color: 'border-l-emerald-600' },
              { label: 'Pending KYC',     value: String(pendingVerifsCount), sub: 'Awaiting ID review', color: 'border-l-amber-500' },
              { label: 'Open Reports',    value: String(pendingReportsCount), sub: 'Flagged disputes', color: 'border-l-red-500' },
              { label: 'Audit Events',    value: String(logs.length), sub: 'System audit logs', color: 'border-l-ast-dark' },
            ].map((s, i) => (
              <div key={i} className={`bg-white rounded-2xl border border-black/8 p-5 border-l-[4px] ${s.color}`}>
                <p className="text-ast-gray text-xs uppercase tracking-wider mb-1">{s.label}</p>
                <p className="font-heading font-bold text-3xl text-black">{s.value}</p>
                <p className="text-ast-gray text-xs mt-1">{s.sub}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Pending Verifications */}
            <div className="bg-white rounded-2xl border border-black/8 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-black/8 pb-3">
                <h3 className="font-semibold text-black flex items-center gap-2">
                  <UserCheck size={18} className="text-ast-primary" /> Pending KYC Approvals
                </h3>
                <button onClick={() => setActiveTab('VERIFICATIONS')} className="text-xs text-ast-primary hover:underline">View All</button>
              </div>
              {verifications.filter(v => v.status === 'PENDING').length === 0 ? (
                <p className="text-ast-gray text-xs py-6 text-center">No pending identity verification requests.</p>
              ) : (
                <div className="space-y-3">
                  {verifications.filter(v => v.status === 'PENDING').slice(0, 3).map(v => (
                    <div key={v.id} className="flex items-center justify-between p-3 rounded-xl bg-ast-surface border border-black/5">
                      <div>
                        <p className="font-semibold text-sm text-black">{v.fullName}</p>
                        <p className="text-xs text-ast-gray">{v.country} · {v.documentType} ({v.documentNumber})</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVerificationDecision(v.id, 'APPROVED')}
                          className="px-3 py-1 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Reports */}
            <div className="bg-white rounded-2xl border border-black/8 p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-black/8 pb-3">
                <h3 className="font-semibold text-black flex items-center gap-2">
                  <Flag size={18} className="text-red-500" /> Pending Flagged Content
                </h3>
                <button onClick={() => setActiveTab('REPORTS')} className="text-xs text-ast-primary hover:underline">View All</button>
              </div>
              {reports.filter(r => r.status === 'PENDING').length === 0 ? (
                <p className="text-ast-gray text-xs py-6 text-center">No open content reports.</p>
              ) : (
                <div className="space-y-3">
                  {reports.filter(r => r.status === 'PENDING').slice(0, 3).map(r => (
                    <div key={r.id} className="flex items-center justify-between p-3 rounded-xl bg-red-50/50 border border-red-100">
                      <div>
                        <p className="font-semibold text-sm text-black">{r.targetTitle}</p>
                        <p className="text-xs text-red-600">{r.reason}: {r.description.slice(0, 40)}...</p>
                      </div>
                      <button
                        onClick={() => handleReportResolution(r.id, 'RESOLVED')}
                        className="px-3 py-1 bg-ast-dark text-white rounded-lg text-xs font-semibold hover:bg-black"
                      >
                        Resolve
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB: PAYOUT & WITHDRAWAL REQUESTS QUEUE */}
      {activeTab === 'WITHDRAWALS' && (
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-sm space-y-4">
          <div className="px-6 py-5 border-b border-black/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-black text-lg flex items-center gap-2">
                <Wallet size={20} className="text-emerald-600" /> Freelancer Payout & Withdrawal Requests
              </h2>
              <p className="text-ast-gray text-xs">Review bank accounts, Flouci transfers, and approve disbursements</p>
            </div>
            
            {/* Filter Pills */}
            <div className="flex items-center gap-2">
              {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setWithdrawalFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-colors ${
                    withdrawalFilter === f
                      ? 'bg-ast-dark text-white'
                      : 'bg-ast-surface text-ast-gray hover:text-black border border-black/10'
                  }`}
                >
                  {f === 'ALL' ? 'All Requests' : f}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 text-left text-ast-gray text-xs uppercase tracking-wider bg-ast-surface/50">
                  <th className="px-5 py-3 font-semibold">Freelancer</th>
                  <th className="px-5 py-3 font-semibold">Amount (TND)</th>
                  <th className="px-5 py-3 font-semibold">Payout Method</th>
                  <th className="px-5 py-3 font-semibold">Destination Account / RIB</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Requested Date</th>
                  <th className="px-5 py-3 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredWithdrawals.map(w => (
                  <tr key={w.id} className="hover:bg-ast-surface/40 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-ast-primary text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {w.user?.name?.[0] ?? 'F'}
                        </div>
                        <div>
                          <p className="font-semibold text-black">{w.user?.name ?? `Freelancer (${w.userId})`}</p>
                          <p className="text-xs text-ast-gray">{w.user?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-heading font-bold text-base text-emerald-700">
                        {w.amount} TND
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-block px-2.5 py-1 rounded-lg text-xs font-semibold bg-ast-surface border border-black/10 text-black">
                        {w.method}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-mono font-medium text-black bg-ast-surface px-2.5 py-1 rounded-lg border border-black/5 max-w-xs truncate">
                        {w.accountDetails}
                      </p>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block text-[11px] font-bold rounded-full px-2.5 py-0.5 ${STATUS_BADGE[w.status] ?? ''}`}>
                        {w.status}
                      </span>
                      {w.adminNotes && (
                        <p className="text-[10px] text-ast-gray mt-1 truncate max-w-[140px]" title={w.adminNotes}>
                          {w.adminNotes}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-4 text-xs text-ast-gray">
                      {new Date(w.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {w.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleWithdrawalDecision(w.id, 'APPROVE')}
                            className="px-3.5 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-sm transition-colors"
                          >
                            Approve & Mark Transferred
                          </button>
                          <button
                            onClick={() => setRejectingWithdrawal(w)}
                            className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-xs font-semibold hover:bg-red-50 transition-colors"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-ast-gray font-medium">
                          {w.status === 'APPROVED' ? '✓ Processed' : '✗ Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}

                {filteredWithdrawals.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-ast-gray text-sm">
                      No withdrawal requests matching the selected filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: IDENTITY VERIFICATIONS QUEUE */}
      {activeTab === 'VERIFICATIONS' && (
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-black/8 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-black text-lg">KYC Identity Approvals Queue</h2>
              <p className="text-ast-gray text-xs">Review submitted ID cards, passports & selfies</p>
            </div>
            <span className="text-xs text-ast-primary bg-ast-muted font-bold rounded-full px-3 py-1">
              {verifications.length} submitted
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 text-left text-ast-gray text-xs uppercase tracking-wider bg-ast-surface/50">
                  <th className="px-5 py-3 font-medium">User / Legal Name</th>
                  <th className="px-5 py-3 font-medium">Country & Document</th>
                  <th className="px-5 py-3 font-medium">Submitted Photos</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3 font-medium">Submitted Date</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {verifications.map((v: any) => (
                  <tr key={v.id} className="hover:bg-ast-surface/40 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-black">{v.fullName}</p>
                      <p className="text-xs text-ast-gray">{v.user?.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <p className="text-xs font-medium text-black">{v.country}</p>
                      <p className="text-xs text-ast-gray">{v.documentType} · #{v.documentNumber}</p>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        {v.idFrontUrl && (
                          <button
                            onClick={() => setPreviewImage(v.idFrontUrl)}
                            className="px-2 py-1 bg-ast-surface border border-black/15 text-[11px] font-semibold text-ast-primary rounded-md hover:bg-ast-muted"
                          >
                            Front Photo
                          </button>
                        )}
                        {v.selfieUrl && (
                          <button
                            onClick={() => setPreviewImage(v.selfieUrl)}
                            className="px-2 py-1 bg-ast-surface border border-black/15 text-[11px] font-semibold text-ast-primary rounded-md hover:bg-ast-muted"
                          >
                            Selfie
                          </button>
                        )}
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-block text-[11px] font-bold rounded-full px-2.5 py-0.5 ${STATUS_BADGE[v.status] ?? ''}`}>
                        {v.status}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-ast-gray">
                      {new Date(v.submittedAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-4 text-right">
                      {v.status === 'PENDING' ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleVerificationDecision(v.id, 'APPROVED')}
                            className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => setRejectingVerif(v)}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-semibold hover:bg-red-700 shadow-sm"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-ast-gray">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}

                {verifications.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-ast-gray text-sm">
                      No identity verification requests submitted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: USERS & BALANCE (SOLDE) MANAGEMENT */}
      {activeTab === 'USERS' && (
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-sm space-y-4">
          <div className="px-6 py-4 border-b border-black/8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-black text-lg">User Accounts & Solde Management</h2>
              <p className="text-ast-gray text-xs">View accounts, credit/debit balances ("solde"), and roles</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search size={16} className="absolute left-3 top-3 text-ast-gray" />
              <input
                type="text"
                placeholder="Search user by name or email..."
                value={userSearch}
                onChange={e => setUserSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-black/15 focus:outline-none focus:border-ast-primary"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/8 text-left text-ast-gray text-xs uppercase tracking-wider bg-ast-surface/50">
                  <th className="px-5 py-3 font-medium">User</th>
                  <th className="px-5 py-3 font-medium">Role</th>
                  <th className="px-5 py-3 font-medium">Wallet Balance (Solde)</th>
                  <th className="px-5 py-3 font-medium">KYC Status</th>
                  <th className="px-5 py-3 font-medium">Joined</th>
                  <th className="px-5 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredUsers.map((u: any) => (
                  <tr key={u.id} className="hover:bg-ast-surface/40 transition-colors">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-ast-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {u.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-black text-sm">{u.name}</p>
                          <p className="text-xs text-ast-gray">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block text-[10px] font-semibold rounded-full px-2.5 py-0.5 ${ROLE_BADGE[u.role] ?? ''}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <p className="font-heading font-bold text-base text-ast-primary">
                        ${(u.walletBalance ?? 0).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-block text-[10px] font-bold rounded-full px-2 py-0.5 ${STATUS_BADGE[u.verifiedStatus ?? 'UNSUBMITTED'] ?? ''}`}>
                        {u.verifiedStatus ?? 'UNSUBMITTED'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-ast-gray">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => setSelectedUserForBalance(u)}
                        className="px-3 py-1.5 bg-ast-dark text-white rounded-lg text-xs font-semibold hover:bg-black transition-colors flex items-center gap-1.5 ml-auto"
                      >
                        <DollarSign size={13} /> Edit Solde
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: ADMIN AUDIT LOGS */}
      {activeTab === 'LOGS' && (
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-black/8">
            <h2 className="font-semibold text-black text-lg">System Audit Trail</h2>
            <p className="text-ast-gray text-xs">Immutable record of administrative actions, balance adjustments & approvals</p>
          </div>

          <div className="divide-y divide-black/5">
            {logs.map((log: any) => (
              <div key={log.id} className="p-5 flex items-start gap-4 hover:bg-ast-surface/40 transition-colors">
                <div className="w-9 h-9 rounded-xl bg-ast-primary/10 text-ast-primary flex items-center justify-center shrink-0 mt-0.5">
                  <History size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold text-sm text-black">{log.action}</p>
                    <span className="text-xs text-ast-gray">{new Date(log.createdAt).toLocaleString()}</span>
                  </div>
                  <p className="text-xs text-ast-gray mt-1 leading-relaxed">{log.details}</p>
                  <p className="text-[11px] text-ast-primary font-medium mt-1">Executed by: {log.adminName}</p>
                </div>
              </div>
            ))}

            {logs.length === 0 && (
              <p className="py-12 text-center text-ast-gray text-sm">No audit logs recorded yet.</p>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: FLAGGED CONTENT & REPORTS */}
      {activeTab === 'REPORTS' && (
        <div className="bg-white rounded-2xl border border-black/8 overflow-hidden shadow-sm">
          <div className="px-6 py-4 border-b border-black/8 flex items-center justify-between">
            <div>
              <h2 className="font-semibold text-black text-lg">Content & User Reports</h2>
              <p className="text-ast-gray text-xs">Flagged gigs, jobs, and user accounts</p>
            </div>
            <span className="text-xs font-bold text-red-600 bg-red-50 rounded-full px-3 py-1 border border-red-200">
              {reports.length} total reports
            </span>
          </div>

          <div className="divide-y divide-black/5">
            {reports.map((r: any) => (
              <div key={r.id} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-ast-surface/40 transition-colors">
                <div className="space-y-1 max-w-2xl">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase bg-red-100 text-red-700 px-2 py-0.5 rounded">
                      {r.targetType}
                    </span>
                    <h3 className="font-bold text-black text-sm">{r.targetTitle}</h3>
                  </div>
                  <p className="text-xs font-semibold text-red-600">Reason: {r.reason}</p>
                  <p className="text-xs text-ast-gray leading-relaxed">{r.description}</p>
                  <p className="text-[11px] text-ast-gray pt-1">
                    Reported by <strong>{r.reporterName}</strong> on {new Date(r.createdAt).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => handleInspectCase(r.id)}
                    className="px-3.5 py-2 bg-ast-primary text-white rounded-xl text-xs font-semibold hover:bg-ast-dark flex items-center gap-1.5 shadow-sm"
                  >
                    <Eye size={14} /> Inspect Case
                  </button>
                  {r.status === 'PENDING' ? (
                    <>
                      <button
                        onClick={() => handleReportResolution(r.id, 'RESOLVED')}
                        className="px-3 py-2 bg-ast-dark text-white rounded-xl text-xs font-semibold hover:bg-black"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => handleReportResolution(r.id, 'DISMISSED')}
                        className="px-3 py-2 bg-ast-surface border border-black/15 text-ast-gray rounded-xl text-xs font-semibold hover:bg-gray-100"
                      >
                        Dismiss
                      </button>
                    </>
                  ) : (
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${STATUS_BADGE[r.status]}`}>
                      {r.status}
                    </span>
                  )}
                </div>
              </div>
            ))}

            {reports.length === 0 && (
              <p className="py-12 text-center text-ast-gray text-sm">No content reports filed.</p>
            )}
          </div>
        </div>
      )}

      {/* BALANCE MANIPULATION MODAL */}
      {selectedUserForBalance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 space-y-5">
            <div className="flex items-center justify-between border-b border-black/8 pb-3">
              <h3 className="font-heading font-bold text-xl text-black">Edit User Solde (Balance)</h3>
              <button onClick={() => setSelectedUserForBalance(null)} className="text-ast-gray hover:text-black">✕</button>
            </div>

            <div className="bg-ast-surface rounded-2xl p-4 border border-black/5">
              <p className="text-xs text-ast-gray">Target User</p>
              <p className="font-bold text-black text-sm">{selectedUserForBalance.name}</p>
              <p className="text-xs text-ast-primary mt-1 font-semibold">Current Solde: ${selectedUserForBalance.walletBalance}</p>
            </div>

            <form onSubmit={handleBalanceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ast-dark mb-1.5">Action Type</label>
                <select
                  value={balanceType}
                  onChange={e => setBalanceType(e.target.value as any)}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm bg-white"
                >
                  <option value="ADD">➕ Add Amount (Credit Solde)</option>
                  <option value="DEDUCT">➖ Deduct Amount (Debit Solde)</option>
                  <option value="SET">🎯 Set Exact Balance</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ast-dark mb-1.5">Amount ($USD)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 500"
                  value={balanceAmount}
                  onChange={e => setBalanceAmount(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-ast-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ast-dark mb-1.5">Reason / Note for Audit Log</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Manual payout adjustment or bonus"
                  value={balanceReason}
                  onChange={e => setBalanceReason(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm focus:outline-none focus:border-ast-primary"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForBalance(null)}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-ast-gray hover:bg-ast-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={balanceLoading}
                  className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-ast-primary text-white hover:bg-ast-dark shadow-sm disabled:opacity-50"
                >
                  {balanceLoading ? 'Updating...' : 'Confirm Balance Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REJECTION REASON MODAL */}
      {rejectingVerif && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 space-y-4">
            <h3 className="font-heading font-bold text-xl text-red-600">Reject Identity Verification</h3>
            <p className="text-xs text-ast-gray">Specify why {rejectingVerif.fullName}'s documents were rejected.</p>

            <textarea
              rows={3}
              placeholder="e.g. Photo on ID card was blurry or document expired..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-black/15 text-sm resize-none"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setRejectingVerif(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-ast-gray"
              >
                Cancel
              </button>
              <button
                onClick={() => handleVerificationDecision(rejectingVerif.id, 'REJECTED', rejectionReason)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* IMAGE PREVIEW MODAL */}
      {previewImage && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={() => setPreviewImage(null)}>
          <div className="max-w-2xl w-full p-2 relative">
            <button onClick={() => setPreviewImage(null)} className="absolute -top-10 right-0 text-white font-bold text-lg">Close ✕</button>
            <img src={previewImage} alt="Document Preview" className="w-full h-auto rounded-2xl shadow-2xl object-contain max-h-[80vh]" />
          </div>
        </div>
      )}

      {/* DEEP CASE DOSSIER INSPECTION MODAL */}
      {selectedCaseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 shadow-2xl border border-black/10 relative space-y-5 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-black/8 pb-4 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-600 border border-red-200 flex items-center justify-center">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="font-heading font-bold text-xl text-black">Case Dossier #{selectedCaseId}</h3>
                  <p className="text-ast-gray text-xs">Deep investigation suite — Deal logs, Chat history & Profiles</p>
                </div>
              </div>
              <button onClick={() => setSelectedCaseId(null)} className="text-ast-gray hover:text-black font-bold text-lg">✕</button>
            </div>

            {caseLoading ? (
              <div className="py-20 text-center space-y-2 flex-1 flex flex-col items-center justify-center">
                <div className="w-8 h-8 rounded-full border-2 border-ast-primary border-t-transparent animate-spin" />
                <p className="text-ast-gray text-xs font-semibold">Loading Case Investigation Data...</p>
              </div>
            ) : caseDossier ? (
              <div className="flex-1 overflow-y-auto space-y-5 pr-1">
                {/* Dossier Tabs */}
                <div className="flex items-center gap-2 border-b border-black/8 pb-2">
                  {[
                    { id: 'DEAL_LOGS', label: 'Deal Financial Logs', Icon: DollarSign },
                    { id: 'CHAT_TRANSCRIPT', label: 'Full Chat History', Icon: MessageSquare },
                    { id: 'PROFILES', label: 'Parties Profiles', Icon: UserCheck },
                  ].map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      onClick={() => setDossierTab(id as any)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                        dossierTab === id
                          ? 'bg-ast-primary text-white shadow-sm'
                          : 'bg-ast-surface text-ast-gray hover:text-black'
                      }`}
                    >
                      <Icon size={14} /> {label}
                    </button>
                  ))}
                </div>

                {/* TAB 1: DEAL FINANCIAL LOGS */}
                {dossierTab === 'DEAL_LOGS' && (
                  <div className="space-y-4">
                    {caseDossier.dealLogs ? (
                      <div className="bg-ast-surface/50 rounded-2xl p-5 border border-black/8 space-y-3">
                        <div className="flex items-center justify-between border-b border-black/8 pb-2">
                          <span className="text-xs font-bold uppercase tracking-wider text-ast-gray">Escrow Agreement</span>
                          <span className="font-heading font-bold text-lg text-ast-primary">${caseDossier.dealLogs.amount}</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <p className="text-ast-gray">Order ID</p>
                            <p className="font-semibold text-black">{caseDossier.dealLogs.orderId}</p>
                          </div>
                          <div>
                            <p className="text-ast-gray">Order Status</p>
                            <span className={`inline-block px-2 py-0.5 rounded-full font-bold text-[10px] ${STATUS_BADGE[caseDossier.dealLogs.status]}`}>
                              {caseDossier.dealLogs.status}
                            </span>
                          </div>
                          <div>
                            <p className="text-ast-gray">Buyer</p>
                            <p className="font-semibold text-black">{caseDossier.dealLogs.buyer?.name} (${caseDossier.dealLogs.buyer?.walletBalance})</p>
                          </div>
                          <div>
                            <p className="text-ast-gray">Seller</p>
                            <p className="font-semibold text-black">{caseDossier.dealLogs.seller?.name} (${caseDossier.dealLogs.seller?.walletBalance})</p>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-black/5">
                          <p className="text-xs text-ast-gray">Gig Service: <strong className="text-black">{caseDossier.dealLogs.gig?.title ?? 'Custom Service'}</strong></p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 text-center text-ast-gray text-xs bg-ast-surface rounded-2xl">
                        No direct order deal linked to this general report.
                      </div>
                    )}
                  </div>
                )}

                {/* TAB 2: CHAT HISTORY TRANSCRIPT */}
                {dossierTab === 'CHAT_TRANSCRIPT' && (
                  <div className="bg-ast-surface/30 rounded-2xl p-4 border border-black/8 space-y-3 max-h-72 overflow-y-auto">
                    <p className="text-xs font-bold text-black border-b border-black/8 pb-2">Direct Message History Transcript</p>
                    {caseDossier.chatTranscript?.map((msg: any, i: number) => (
                      <div key={i} className="bg-white p-3 rounded-xl border border-black/5 text-xs space-y-1">
                        <div className="flex items-center justify-between text-[10px] text-ast-gray">
                          <span className="font-bold text-ast-primary">{msg.sender}</span>
                          <span>{msg.time}</span>
                        </div>
                        <p className="text-black">{msg.text}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* TAB 3: PARTIES PROFILES */}
                {dossierTab === 'PROFILES' && (
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-ast-surface p-4 rounded-2xl border border-black/8 space-y-2">
                      <p className="font-bold text-sm text-black border-b border-black/8 pb-1">Reporter Profile</p>
                      <p>Name: <strong>{caseDossier.reporterProfile?.name}</strong></p>
                      <p>Email: <strong>{caseDossier.reporterProfile?.email}</strong></p>
                      <p>KYC: <span className="font-bold text-emerald-600">{caseDossier.reporterProfile?.kyc}</span></p>
                      <p>Solde: <strong>${caseDossier.reporterProfile?.walletBalance}</strong></p>
                    </div>

                    <div className="bg-ast-surface p-4 rounded-2xl border border-black/8 space-y-2">
                      <p className="font-bold text-sm text-black border-b border-black/8 pb-1">Report Details</p>
                      <p>Reason: <strong className="text-red-600">{caseDossier.report?.reason}</strong></p>
                      <p>Description: {caseDossier.report?.description}</p>
                      <p>Status: <strong>{caseDossier.report?.status}</strong></p>
                    </div>
                  </div>
                )}
              </div>
            ) : null}

            {/* Action Bar */}
            <div className="border-t border-black/8 pt-4 flex items-center justify-between shrink-0">
              <span className="text-xs text-ast-gray">Admin Escrow Resolution Tools</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    handleReportResolution(selectedCaseId, 'RESOLVED')
                    setSelectedCaseId(null)
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-semibold hover:bg-emerald-700 shadow-sm"
                >
                  Refund Buyer & Close
                </button>
                <button
                  onClick={() => {
                    handleReportResolution(selectedCaseId, 'RESOLVED')
                    setSelectedCaseId(null)
                  }}
                  className="px-4 py-2 bg-ast-primary text-white rounded-xl text-xs font-semibold hover:bg-ast-dark shadow-sm"
                >
                  Release Payout to Seller
                </button>
                <button
                  onClick={() => {
                    handleReportResolution(selectedCaseId, 'DISMISSED')
                    setSelectedCaseId(null)
                  }}
                  className="px-4 py-2 bg-ast-surface border border-black/15 text-ast-gray rounded-xl text-xs font-semibold hover:bg-gray-100"
                >
                  Dismiss Report
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: WITHDRAWAL REJECTION REASON */}
      {rejectingWithdrawal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 space-y-4">
            <h3 className="font-heading font-bold text-xl text-red-600 flex items-center gap-2">
              <AlertCircle size={20} /> Reject Payout Request
            </h3>
            <p className="text-ast-gray text-xs">
              Provide a clear reason for rejecting the {rejectingWithdrawal.amount} TND payout to <strong>{rejectingWithdrawal.user?.name ?? 'Freelancer'}</strong>. Funds will remain in the freelancer's wallet.
            </p>

            <form
              onSubmit={e => {
                e.preventDefault()
                handleWithdrawalDecision(rejectingWithdrawal.id, 'REJECT', withdrawalRejectionNotes)
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-ast-dark mb-1">Rejection Reason *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Invalid bank RIB number, name mismatch with bank account, or KYC documentation pending..."
                  value={withdrawalRejectionNotes}
                  onChange={e => setWithdrawalRejectionNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-xs outline-none focus:border-red-500 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setRejectingWithdrawal(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ast-gray hover:bg-ast-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!withdrawalRejectionNotes.trim()}
                  className="px-5 py-2 rounded-xl text-xs font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors shadow-sm disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

