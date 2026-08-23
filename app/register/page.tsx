'use client'
import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, Lock, User, ChevronRight } from 'lucide-react'
import { fadeUp } from '@/lib/motion'
import { register } from '@/app/actions/auth' // 👉 Importing our Supabase Server Action

type Role = 'CLIENT' | 'FREELANCER'

export default function RegisterPage() {
  const [role, setRole] = useState<Role>('CLIENT')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const clientAction = async (formData: FormData) => {
    setLoading(true)
    setError('')

    // Call the Supabase auth action
    const res = await register(formData)
    
    if (res?.error) {
      setError(res.error)
      setLoading(false)
    } else if (res?.success) {
      window.location.href = '/dashboard'
    }
  }

  return (
    <div className="min-h-screen bg-ast-dark flex items-center justify-center px-4 py-12">
      <motion.div
        variants={fadeUp}
        initial="hidden"
        animate="visible"
        className="w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6 group">
            <img
              src="/logo.png"
              alt="Asteria Logo"
              className="w-8 h-8 object-contain transition-transform group-hover:scale-105"
            />
            <span className="font-heading font-bold text-xl text-ast-light tracking-wide">ASTERIA</span>
          </Link>
          <h1 className="font-heading font-bold text-3xl text-white">Create your account</h1>
          <p className="text-white/50 text-sm mt-2">Join thousands of professionals on Asteria</p>
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-2xl">
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(['CLIENT', 'FREELANCER'] as Role[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`py-3 rounded-xl text-sm font-semibold border-2 transition-all ${
                  role === r
                    ? 'border-ast-primary bg-ast-primary text-white'
                    : 'border-black/15 text-ast-gray hover:border-ast-primary/50'
                }`}
              >
                {r === 'CLIENT' ? '🏢 Hire Talent' : '💼 Find Work'}
              </button>
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

          {/* 👉 Changed onSubmit to action={clientAction} */}
          <form action={clientAction} className="space-y-4">
            
            {/* 👉 Hidden input to pass the selected role to the Server Action */}
            <input type="hidden" name="role" value={role} />

            <div className="relative">
              <User size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
              <input
                type="text" 
                name="name" // 👉 Added name attribute
                placeholder="Full name" 
                required
                className="w-full pl-10 pr-4 py-3 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 transition-all"
              />
            </div>
            <div className="relative">
              <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
              <input
                type="email" 
                name="email" // 👉 Added name attribute
                placeholder="Email address" 
                required
                className="w-full pl-10 pr-4 py-3 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 transition-all"
              />
            </div>
            <div className="relative">
              <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ast-gray" />
              <input
                type="password" 
                name="password" // 👉 Added name attribute
                placeholder="Password (min. 6 characters)" 
                required minLength={6}
                className="w-full pl-10 pr-4 py-3 border border-black/15 rounded-xl text-sm outline-none focus:border-ast-primary focus:ring-2 focus:ring-ast-primary/20 transition-all"
              />
            </div>

            <button
              type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-ast-primary text-white rounded-xl py-3.5 font-semibold text-sm hover:bg-ast-dark transition-colors disabled:opacity-60 mt-2"
            >
              {loading ? 'Creating account…' : (
                <>Create Account <ChevronRight size={16} /></>
              )}
            </button>
          </form>

          <p className="text-center text-ast-gray text-xs mt-6 leading-relaxed">
            By creating an account you agree to our{' '}
            <span className="text-ast-primary cursor-pointer hover:underline">Terms of Service</span>
            {' '}and{' '}
            <span className="text-ast-primary cursor-pointer hover:underline">Privacy Policy</span>.
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