'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock, Shield, User, Briefcase } from 'lucide-react'
import { login, loginAsTestUser } from '@/app/actions/auth'
import { fadeUp } from '@/lib/motion'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const clientAction = async (formData: FormData) => {
    setLoading(true)
    setError('')
    const res = await login(formData)
    if (res?.error) {
      setError(res.error)
      setLoading(false)
    } else if (res?.success) {
      window.location.href = '/dashboard'
    }
  }

  const handleTestLogin = async (userId: string) => {
    setLoading(true)
    const res = await loginAsTestUser(userId)
    if (res?.success) {
      window.location.href = '/dashboard'
    } else {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ast-dark flex items-center justify-center px-4 py-12">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl space-y-6"
      >
        <div className="text-center">
          <Link href="/" className="inline-flex items-center gap-2 mb-4">
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
              <path d="M32 4 L60 56 L4 56 Z" stroke="#11606e" strokeWidth="2.5" fill="none" />
              <circle cx="32" cy="38" r="4" fill="#11606e" />
            </svg>
            <span className="font-heading font-bold text-xl text-ast-primary tracking-wide">ASTERIA</span>
          </Link>
          <h1 className="font-heading font-bold text-2xl text-black">Sign In to Platform</h1>
          <p className="text-ast-gray text-xs mt-1">Select a test role or enter your credentials</p>
        </div>

        {/* ⚡ Quick Admin Demo Login */}
        <div className="bg-ast-surface p-4 rounded-2xl border border-black/8 space-y-2.5">
          <p className="text-[11px] font-semibold text-ast-dark uppercase tracking-wider text-center">
            ⚡ Quick Admin Login (1-Click)
          </p>
          <button
            onClick={() => handleTestLogin('admin1')}
            type="button"
            className="w-full flex items-center justify-center gap-2 p-3 bg-ast-dark text-white rounded-xl text-xs font-semibold hover:bg-black transition-colors shadow-sm"
          >
            <Shield size={16} className="text-ast-light" />
            Sign in as Platform Administrator
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3">
            {error}
          </div>
        )}

        <form action={clientAction} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
            <input
              type="email"
              name="email"
              placeholder="Email address"
              required
              className="w-full pl-10 pr-4 py-3 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 transition-all"
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              className="w-full pl-10 pr-4 py-3 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-ast-primary text-white rounded-xl py-3 font-semibold text-sm hover:bg-ast-dark transition-colors disabled:opacity-60 shadow-sm"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-ast-gray text-xs">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-ast-primary font-semibold hover:underline">Create one free</Link>
        </p>
      </motion.div>
    </div>
  )
}