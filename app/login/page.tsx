'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Mail, Lock } from 'lucide-react'
import { login } from '@/app/actions/auth' // 👉 Importing our new Supabase Server Action

function GithubIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12" />
    </svg>
  )
}

import { fadeUp } from '@/lib/motion'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // 👉 Updated handler to use Next.js Server Actions with FormData
  const clientAction = async (formData: FormData) => {
    setLoading(true)
    setError('')
    
    // Call the Supabase auth action
    const res = await login(formData)
    
    // If there is an error, display it. (If successful, the action redirects automatically)
    if (res?.error) {
      setError(res.error)
      setLoading(false)
    }
  }

  const handleOAuth = (provider: 'github' | 'google') => {
    // We will wire this up to Supabase OAuth in Phase 1 - Part 3!
    alert(`Supabase ${provider} login coming in the next step!`)
  }

  return (
    <div className="min-h-screen bg-ast-dark flex items-center justify-center px-4">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md bg-white rounded-3xl p-8 shadow-2xl"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
              <path d="M32 4 L60 56 L4 56 Z" stroke="#11606e" strokeWidth="2.5" fill="none" />
              <circle cx="32" cy="38" r="4" fill="#11606e" />
            </svg>
            <span className="font-heading font-bold text-xl text-ast-primary tracking-wide">ASTERIA</span>
          </Link>
          <h1 className="font-heading font-bold text-2xl text-black">Welcome back</h1>
          <p className="text-ast-gray text-sm mt-1">Sign in to your account to continue</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5">
            {error}
          </div>
        )}

        <div className="space-y-3 mb-6">
          <button
            onClick={() => handleOAuth('github')}
            type="button"
            className="w-full flex items-center justify-center gap-3 border border-black/15 rounded-xl py-3 text-sm font-medium hover:bg-ast-surface transition-colors"
          >
            <GithubIcon size={18} />
            Continue with GitHub
          </button>
          <button
            onClick={() => handleOAuth('google')}
            type="button"
            className="w-full flex items-center justify-center gap-3 border border-black/15 rounded-xl py-3 text-sm font-medium hover:bg-ast-surface transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
            Continue with Google
          </button>
        </div>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-black/10" /></div>
          <div className="relative text-center"><span className="bg-white px-3 text-xs text-ast-gray">or continue with email</span></div>
        </div>

        {/* 👉 Changed onSubmit to action={clientAction} */}
        <form action={clientAction} className="space-y-4">
          <div className="relative">
            <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
            <input
              type="email" 
              name="email" // 👉 Needed for FormData 
              placeholder="Email address" 
              required
              className="w-full pl-10 pr-4 py-3 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 transition-all"
            />
          </div>
          <div className="relative">
            <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
            <input
              type="password" 
              name="password" // 👉 Needed for FormData
              placeholder="Password" 
              required
              className="w-full pl-10 pr-4 py-3 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 transition-all"
            />
          </div>
          <button
            type="submit" disabled={loading}
            className="w-full bg-ast-primary text-white rounded-xl py-3 font-semibold text-sm hover:bg-ast-dark transition-colors disabled:opacity-60"
          >
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>

        <p className="text-center text-ast-gray text-sm mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-ast-primary font-medium hover:underline">Create one free</Link>
        </p>
      </motion.div>
    </div>
  )
}