'use client'

/**
 * components/wallet/WalletActionClient.tsx
 * Interactive Client controls for Wallet Top-Up (Stripe) and Payout Withdrawals.
 */

import { useState } from 'react'
import { PlusCircle, ArrowUpRight, CheckCircle2, CreditCard, ShieldCheck, X } from 'lucide-react'

interface Props {
  balance: number
  userId: string
  userRole: string
}

export function WalletActionClient({ balance, userId, userRole }: Props) {
  const [showDeposit, setShowDeposit] = useState(false)
  const [depositAmount, setDepositAmount] = useState('100')
  const [depositing, setDepositing] = useState(false)

  const [showWithdraw, setShowWithdraw] = useState(false)
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawMethod, setWithdrawMethod] = useState('Flouci (Tunisia)')
  const [withdrawAccount, setWithdrawAccount] = useState('')
  const [withdrawing, setWithdrawing] = useState(false)
  const [withdrawnSuccess, setWithdrawnSuccess] = useState(false)

  const handleDepositStripe = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(depositAmount)
    if (isNaN(amountNum) || amountNum <= 0) {
      alert('Please enter a valid deposit amount')
      return
    }

    try {
      setDepositing(true)
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountNum,
          type: 'WALLET_DEPOSIT',
          title: `Asteria Wallet Top-Up (${amountNum} TND)`,
        }),
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to initiate Stripe checkout')

      if (data.url) {
        window.location.href = data.url
      }
    } catch (err: any) {
      alert(err.message || 'Failed to connect to Stripe checkout.')
    } finally {
      setDepositing(false)
    }
  }

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = parseFloat(withdrawAmount)
    if (isNaN(amountNum) || amountNum <= 0 || amountNum > balance) {
      alert(`Please enter an amount between 20 TND and ${balance} TND`)
      return
    }

    try {
      setWithdrawing(true)
      // Simulate payout dispatch request
      await new Promise(r => setTimeout(r, 1000))
      setWithdrawnSuccess(true)
      setTimeout(() => {
        setWithdrawnSuccess(false)
        setShowWithdraw(false)
        setWithdrawAmount('')
        setWithdrawAccount('')
      }, 2000)
    } catch (err: any) {
      alert('Withdrawal request failed. Please contact support.')
    } finally {
      setWithdrawing(false)
    }
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setShowDeposit(true)}
          className="flex items-center gap-2 bg-ast-primary text-white text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-ast-dark transition-colors shadow-sm"
        >
          <PlusCircle size={15} />
          <span>Top Up with Card / Stripe</span>
        </button>

        {userRole === 'FREELANCER' && (
          <button
            onClick={() => setShowWithdraw(true)}
            disabled={balance < 20}
            className="flex items-center gap-2 bg-white border border-black/15 text-black text-xs font-semibold px-4 py-2.5 rounded-xl hover:bg-ast-surface transition-colors shadow-sm disabled:opacity-50"
          >
            <ArrowUpRight size={15} />
            <span>Withdraw Earnings</span>
          </button>
        )}
      </div>

      {/* Deposit Modal */}
      {showDeposit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 relative space-y-4">
            <button
              onClick={() => setShowDeposit(false)}
              className="absolute top-5 right-5 text-ast-gray hover:text-black p-1 rounded-full hover:bg-ast-surface"
            >
              <X size={18} />
            </button>

            <div className="border-b border-black/8 pb-3">
              <h3 className="font-heading font-bold text-xl text-black flex items-center gap-2">
                <CreditCard size={20} className="text-ast-primary" /> Top Up Wallet
              </h3>
              <p className="text-ast-gray text-xs mt-0.5">Secure payment powered by Stripe Escrow Protection</p>
            </div>

            <form onSubmit={handleDepositStripe} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ast-dark mb-1.5">Amount to Add (TND) *</label>
                <div className="grid grid-cols-4 gap-2 mb-3">
                  {['50', '100', '250', '500'].map(amt => (
                    <button
                      key={amt}
                      type="button"
                      onClick={() => setDepositAmount(amt)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-colors ${
                        depositAmount === amt
                          ? 'border-ast-primary bg-ast-primary/10 text-ast-primary'
                          : 'border-black/10 bg-ast-surface hover:bg-black/5 text-black'
                      }`}
                    >
                      {amt} TND
                    </button>
                  ))}
                </div>
                <input
                  type="number"
                  min="10"
                  step="1"
                  required
                  value={depositAmount}
                  onChange={e => setDepositAmount(e.target.value)}
                  placeholder="Custom amount (TND)"
                  className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm font-semibold focus:border-ast-primary outline-none"
                />
              </div>

              <div className="bg-ast-surface p-3.5 rounded-2xl border border-black/5 flex items-center gap-3">
                <ShieldCheck size={20} className="text-emerald-600 shrink-0" />
                <p className="text-xs text-ast-gray leading-snug">
                  Funds are credited to your available balance and protected by Escrow for your orders.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowDeposit(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-ast-gray hover:bg-ast-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={depositing}
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-ast-primary text-white hover:bg-ast-dark transition-colors shadow-sm disabled:opacity-50"
                >
                  {depositing ? 'Redirecting to Stripe…' : `Pay ${depositAmount} TND`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Withdrawal Modal */}
      {showWithdraw && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-black/10 relative space-y-4">
            <button
              onClick={() => setShowWithdraw(false)}
              className="absolute top-5 right-5 text-ast-gray hover:text-black p-1 rounded-full hover:bg-ast-surface"
            >
              <X size={18} />
            </button>

            {withdrawnSuccess ? (
              <div className="py-8 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="font-heading font-bold text-xl text-black">Withdrawal Requested!</h3>
                <p className="text-ast-gray text-xs">
                  Your payout of {withdrawAmount} TND via {withdrawMethod} is being processed.
                </p>
              </div>
            ) : (
              <>
                <div className="border-b border-black/8 pb-3">
                  <h3 className="font-heading font-bold text-xl text-black">Request Withdrawal</h3>
                  <p className="text-ast-gray text-xs mt-0.5">Available Balance: <strong className="text-emerald-700">{balance.toFixed(2)} TND</strong></p>
                </div>

                <form onSubmit={handleWithdraw} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-ast-dark mb-1">Withdrawal Amount (TND) *</label>
                    <input
                      type="number"
                      min="20"
                      max={balance}
                      step="1"
                      required
                      placeholder={`Min 20 TND — Max ${balance.toFixed(2)} TND`}
                      value={withdrawAmount}
                      onChange={e => setWithdrawAmount(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-sm font-semibold outline-none focus:border-ast-primary"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ast-dark mb-1">Payout Method *</label>
                    <select
                      value={withdrawMethod}
                      onChange={e => setWithdrawMethod(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-xs font-semibold outline-none focus:border-ast-primary bg-white"
                    >
                      <option value="Flouci (Tunisia)">Flouci (Tunisia — Instant)</option>
                      <option value="Tunisian Bank Transfer (RIB)">Tunisian Bank Transfer (RIB)</option>
                      <option value="Stripe Payout">Stripe Direct Payout</option>
                      <option value="Wise (International)">Wise (International)</option>
                      <option value="PayPal">PayPal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-ast-dark mb-1">
                      {withdrawMethod.includes('RIB') ? 'RIB Account (20 digits) *' : withdrawMethod.includes('Flouci') ? 'Flouci Phone / Wallet ID *' : 'Account Email / ID *'}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={withdrawMethod.includes('RIB') ? 'e.g. 0800 1234 5678 9012 3456' : 'e.g. +216 20 000 000 or email@domain.com'}
                      value={withdrawAccount}
                      onChange={e => setWithdrawAccount(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-black/15 text-xs outline-none focus:border-ast-primary"
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowWithdraw(false)}
                      className="px-4 py-2 rounded-xl text-xs font-semibold text-ast-gray"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={withdrawing || !withdrawAmount}
                      className="px-6 py-2.5 rounded-xl text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
                    >
                      {withdrawing ? 'Submitting…' : 'Submit Payout Request'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
