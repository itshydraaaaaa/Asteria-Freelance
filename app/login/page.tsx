'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import { Mail, Lock, Shield, Eye, EyeOff } from 'lucide-react'
import { login, loginAsTestUser } from '@/app/actions/auth'

export default function LoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const clientAction = async (formData: FormData) => {
    setLoading(true)
    setError('')
    const res = await login(formData)
    if (res?.error) {
      setError(res.error)
      setLoading(false)
    } else if (res?.success) {
      router.push('/dashboard')
      router.refresh()
    }
  }

  const handleTestLogin = async (userId: string) => {
    setLoading(true)
    setError('')
    const res = await loginAsTestUser(userId)
    if (res?.success) {
      router.push('/dashboard')
      router.refresh()
    } else {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-ast-dark flex items-center justify-center px-4 pt-28 pb-16">
      {/* Background glow effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-ast-primary/20 rounded-full blur-[120px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="relative w-full max-w-md"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="relative">
              <div className="absolute inset-0 bg-ast-light/30 blur-md rounded-full group-hover:bg-ast-light/50 transition-all duration-500" />
              <img
                src="/logo.png"
                alt="Asteria Logo"
                className="relative w-9 h-9 object-contain drop-shadow-[0_0_12px_rgba(96,200,212,0.6)] group-hover:scale-105 transition-transform duration-300"
              />
            </div>
            <span className="font-heading font-bold text-xl text-white tracking-wide">
              A<span className="text-white/70">STERIA</span>
            </span>
          </Link>
          <h1 className="font-heading font-bold text-3xl text-white">Welcome back</h1>
          <p className="text-white/50 text-sm mt-2">Sign in to your account to continue</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl space-y-5">
          {/* ⚡ Quick Admin Demo Login */}
          <div className="bg-ast-surface p-4 rounded-2xl border border-ast-primary/20 space-y-2.5">
            <p className="text-[11px] font-semibold text-ast-dark uppercase tracking-wider text-center">
              ⚡ Quick Demo Login (1-Click)
            </p>
            <button
              onClick={() => handleTestLogin('admin1')}
              type="button"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 p-3 bg-ast-dark text-white rounded-xl text-xs font-semibold hover:bg-black transition-colors shadow-sm disabled:opacity-60"
            >
              <Shield size={16} className="text-ast-light" />
              Sign in as Platform Administrator
            </button>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="flex-1 h-px bg-black/10" />
            <span className="text-xs text-ast-gray font-medium">or sign in with email</span>
            <div className="flex-1 h-px bg-black/10" />
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-4 py-3"
            >
              {error}
            </motion.div>
          )}

          <form action={clientAction} className="space-y-4">
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
              <input
                type="email"
                name="email"
                placeholder="Email address"
                required
                className="w-full pl-10 pr-4 py-3 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 transition-all bg-white"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Password"
                required
                className="w-full pl-10 pr-10 py-3 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 transition-all bg-white"
              />
              <button
                type="button"
                tabIndex={-1}
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ast-gray hover:text-ast-primary transition-colors"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-ast-primary text-white rounded-xl py-3 font-semibold text-sm hover:bg-ast-dark transition-colors disabled:opacity-60 shadow-sm"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in…
                </span>
              ) : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-ast-gray text-xs">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-ast-primary font-semibold hover:underline">
              Create one free
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}