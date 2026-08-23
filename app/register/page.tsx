'use client'
import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, ChevronRight, Eye, EyeOff } from 'lucide-react'
import { register } from '@/app/actions/auth'

type Role = 'CLIENT' | 'FREELANCER'

export default function RegisterPage() {
  const router = useRouter()
  const [role, setRole] = useState<Role>('CLIENT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const clientAction = async (formData: FormData) => {
    setLoading(true)
    setError('')

    const res = await register(formData)

    if (res?.error) {
      setError(res.error)
      setLoading(false)
    } else if (res?.success) {
      router.push('/dashboard')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-ast-dark flex items-center justify-center px-4 pt-28 pb-16">
      {/* Background glow effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ast-primary/20 rounded-full blur-[140px]" />
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
          <h1 className="font-heading font-bold text-3xl text-white">Create your account</h1>
          <p className="text-white/50 text-sm mt-2">Join thousands of professionals on Asteria</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(['CLIENT', 'FREELANCER'] as Role[]).map(r => (
              <motion.button
                key={r}
                type="button"
                onClick={() => { setRole(r); setError('') }}
                whileTap={{ scale: 0.97 }}
                className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                  role === r
                    ? 'border-ast-primary bg-ast-primary text-white shadow-sm'
                    : 'border-black/15 text-ast-gray hover:border-ast-primary/50 hover:text-ast-primary'
                }`}
              >
                {r === 'CLIENT' ? '🏢 Hire Talent' : '💼 Find Work'}
              </motion.button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div
                key="err"
                initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-5"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          <form action={clientAction} className="space-y-4">
            {/* Hidden role input */}
            <input type="hidden" name="role" value={role} />

            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
              <input
                type="text"
                name="name"
                placeholder="Full name"
                required
                className="w-full pl-10 pr-4 py-3 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 transition-all bg-white"
              />
            </div>
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
                placeholder="Password (min. 6 characters)"
                required
                minLength={6}
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
              className="w-full flex items-center justify-center gap-2 bg-ast-primary text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-ast-dark transition-colors disabled:opacity-60 mt-2 shadow-sm"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Creating account…
                </>
              ) : (
                <>Create Account <ChevronRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-ast-gray text-xs mt-6 leading-relaxed">
            By creating an account you agree to our{' '}
            <Link href="/terms" className="text-ast-primary cursor-pointer hover:underline">Terms of Service</Link>
            {' '}and{' '}
            <Link href="/privacy" className="text-ast-primary cursor-pointer hover:underline">Privacy Policy</Link>.
          </p>
        </div>

        <p className="text-center text-white/50 text-sm mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-ast-light font-medium hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}