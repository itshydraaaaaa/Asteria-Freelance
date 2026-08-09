'use client'

import { useState, useEffect } from 'react'
import { ShieldCheck, Upload, CheckCircle2, AlertCircle, Clock, FileText, UserCheck, ArrowRight } from 'lucide-react'

export default function VerificationPage() {
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [verification, setVerification] = useState<any>(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form State
  const [fullName, setFullName] = useState('')
  const [dob, setDob] = useState('')
  const [country, setCountry] = useState('Tunisia')
  const [documentType, setDocumentType] = useState('National ID')
  const [documentNumber, setDocumentNumber] = useState('')
  const [idFrontUrl, setIdFrontUrl] = useState('')
  const [idBackUrl, setIdBackUrl] = useState('')
  const [selfieUrl, setSelfieUrl] = useState('')

  useEffect(() => {
    fetchStatus()
  }, [])

  const fetchStatus = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/user/verification')
      if (res.ok) {
        const data = await res.json()
        setVerification(data.verification)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!fullName || !dob || !country || !documentNumber) {
      setErrorMsg('Please fill in all required identity details.')
      return
    }

    try {
      setSubmitting(true)
      const res = await fetch('/api/user/verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          dob,
          country,
          documentType,
          documentNumber,
          idFrontUrl,
          idBackUrl,
          selfieUrl,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit verification request.')
      }

      setSuccessMsg('Your identity verification documents have been submitted for admin approval!')
      setVerification(data.verification)
    } catch (err: any) {
      setErrorMsg(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-ast-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const status = verification?.status ?? 'UNSUBMITTED'

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-ast-primary/10 flex items-center justify-center text-ast-primary border border-ast-primary/20">
          <ShieldCheck size={26} />
        </div>
        <div>
          <h1 className="font-heading font-bold text-3xl text-black">Identity Verification (KYC)</h1>
          <p className="text-ast-gray text-sm mt-0.5">
            Verify your official identity to unlock elite freelancer badge, higher withdrawal limits, and client trust.
          </p>
        </div>
      </div>

      {/* Status Alert Banner */}
      {status === 'APPROVED' && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 flex items-start gap-4">
          <CheckCircle2 size={28} className="text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-heading font-bold text-lg text-emerald-900">Identity Verified</h3>
            <p className="text-emerald-700 text-sm mt-1">
              Your official documents have been verified by Asteria Administration. Your account holds full verified status.
            </p>
          </div>
        </div>
      )}

      {status === 'PENDING' && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 flex items-start gap-4">
          <Clock size={28} className="text-amber-600 shrink-0 mt-0.5 animate-pulse" />
          <div>
            <h3 className="font-heading font-bold text-lg text-amber-900">Verification Under Admin Review</h3>
            <p className="text-amber-700 text-sm mt-1">
              Your identity documents were submitted on {new Date(verification.submittedAt).toLocaleDateString()} and are currently pending administrator review. Approval typically takes 2–12 hours.
            </p>
          </div>
        </div>
      )}

      {status === 'REJECTED' && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 flex items-start gap-4">
          <AlertCircle size={28} className="text-red-600 shrink-0 mt-0.5" />
          <div>
            <h3 className="font-heading font-bold text-lg text-red-900">Verification Request Rejected</h3>
            <p className="text-red-700 text-sm mt-1">
              Reason: <strong>{verification?.rejectionReason ?? 'Document photos were blurry or unreadable.'}</strong>
            </p>
            <p className="text-red-600 text-xs mt-2 font-medium">Please re-submit clear photos below for re-evaluation.</p>
          </div>
        </div>
      )}

      {/* Verification Form */}
      {(status === 'UNSUBMITTED' || status === 'REJECTED') && (
        <form onSubmit={handleSubmit} className="bg-white rounded-3xl border border-black/8 p-8 space-y-8 shadow-sm">
          {errorMsg && (
            <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl text-sm flex items-center gap-2">
              <AlertCircle size={16} /> {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 p-4 rounded-xl text-sm flex items-center gap-2">
              <CheckCircle2 size={16} /> {successMsg}
            </div>
          )}

          {/* Step 1: Personal Details */}
          <div className="space-y-4">
            <h2 className="font-heading font-semibold text-lg text-black flex items-center gap-2 border-b border-black/5 pb-3">
              <UserCheck size={18} className="text-ast-primary" /> 1. Personal Information
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-ast-dark mb-1.5">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="As shown on official ID card/passport"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-black/15 focus:outline-none focus:border-ast-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ast-dark mb-1.5">Date of Birth *</label>
                <input
                  type="date"
                  required
                  value={dob}
                  onChange={e => setDob(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-black/15 focus:outline-none focus:border-ast-primary text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ast-dark mb-1.5">Country of Residence *</label>
                <select
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-black/15 focus:outline-none focus:border-ast-primary text-sm bg-white"
                >
                  <option value="Tunisia">Tunisia</option>
                  <option value="Algeria">Algeria</option>
                  <option value="Morocco">Morocco</option>
                  <option value="Egypt">Egypt</option>
                  <option value="Saudi Arabia">Saudi Arabia</option>
                  <option value="UAE">United Arab Emirates</option>
                  <option value="France">France</option>
                  <option value="United States">United States</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ast-dark mb-1.5">Document Type *</label>
                <select
                  value={documentType}
                  onChange={e => setDocumentType(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-black/15 focus:outline-none focus:border-ast-primary text-sm bg-white"
                >
                  <option value="National ID">National ID Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Drivers License">Driver's License</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ast-dark mb-1.5">Document ID Number *</label>
              <input
                type="text"
                required
                placeholder="e.g. 14890234 or N839201"
                value={documentNumber}
                onChange={e => setDocumentNumber(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-black/15 focus:outline-none focus:border-ast-primary text-sm"
              />
            </div>
          </div>

          {/* Step 2: Document Photos */}
          <div className="space-y-4 pt-4">
            <h2 className="font-heading font-semibold text-lg text-black flex items-center gap-2 border-b border-black/5 pb-3">
              <FileText size={18} className="text-ast-primary" /> 2. Document Attachments
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border-2 border-dashed border-black/15 rounded-2xl p-5 text-center hover:border-ast-primary transition-colors bg-ast-surface/30">
                <Upload size={24} className="mx-auto text-ast-primary mb-2" />
                <p className="text-xs font-semibold text-black mb-1">ID Front Side</p>
                <p className="text-[11px] text-ast-gray mb-3">Clear, readable photo</p>
                <input
                  type="url"
                  placeholder="Photo URL or upload link"
                  value={idFrontUrl}
                  onChange={e => setIdFrontUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-black/15"
                />
              </div>

              <div className="border-2 border-dashed border-black/15 rounded-2xl p-5 text-center hover:border-ast-primary transition-colors bg-ast-surface/30">
                <Upload size={24} className="mx-auto text-ast-primary mb-2" />
                <p className="text-xs font-semibold text-black mb-1">ID Back Side</p>
                <p className="text-[11px] text-ast-gray mb-3">Barcode/signature side</p>
                <input
                  type="url"
                  placeholder="Photo URL or upload link"
                  value={idBackUrl}
                  onChange={e => setIdBackUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-black/15"
                />
              </div>

              <div className="border-2 border-dashed border-black/15 rounded-2xl p-5 text-center hover:border-ast-primary transition-colors bg-ast-surface/30">
                <Upload size={24} className="mx-auto text-ast-primary mb-2" />
                <p className="text-xs font-semibold text-black mb-1">Selfie Verification</p>
                <p className="text-[11px] text-ast-gray mb-3">Holding your ID card</p>
                <input
                  type="url"
                  placeholder="Photo URL or upload link"
                  value={selfieUrl}
                  onChange={e => setSelfieUrl(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-black/15"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-ast-primary text-white font-semibold rounded-xl py-4 hover:bg-ast-dark transition-colors flex items-center justify-center gap-2 shadow-md disabled:opacity-50"
          >
            {submitting ? 'Submitting Documents...' : (
              <>
                Submit Verification Request <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
      )}

      {/* Summary Card if already submitted */}
      {verification && (
        <div className="bg-white rounded-3xl border border-black/8 p-6 space-y-4">
          <h3 className="font-heading font-semibold text-black border-b border-black/5 pb-2">Submitted Details</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-xs text-ast-gray">Full Name</p>
              <p className="font-medium text-black">{verification.fullName}</p>
            </div>
            <div>
              <p className="text-xs text-ast-gray">Country</p>
              <p className="font-medium text-black">{verification.country}</p>
            </div>
            <div>
              <p className="text-xs text-ast-gray">Document Type</p>
              <p className="font-medium text-black">{verification.documentType}</p>
            </div>
            <div>
              <p className="text-xs text-ast-gray">Doc Number</p>
              <p className="font-medium text-black">{verification.documentNumber}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
