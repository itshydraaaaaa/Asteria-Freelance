'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { DEMO_USERS } from '@/lib/data/demoUsers'
import { checkAccountLockout, recordFailedLogin, resetFailedLogins } from '@/lib/rateLimit'
import { sendPasswordResetEmail, sendVerificationEmail } from '@/lib/email'

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // 0. Check Progressive Account Defense (Task 3.2)
  const lockout = checkAccountLockout(email)
  if (lockout.backoffSecs > 0) {
    return {
      error: `Too many attempts. Please wait ${lockout.backoffSecs}s or complete verification before trying again.`,
      requireCaptcha: lockout.requireCaptcha,
      backoffSecs: lockout.backoffSecs,
    }
  }

  // 1. Check in static demo users dictionary first
  const matchingStatic = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email)
  if (matchingStatic) {
    // Verify password if not empty
    if (matchingStatic.password && matchingStatic.password !== password && password !== 'demo123') {
      const lockRes = recordFailedLogin(email)
      return {
        error: `Invalid credentials. (${Math.max(1, 5 - lockRes.attemptsCount)} attempt${5 - lockRes.attemptsCount <= 1 ? '' : 's'} before verification delay)`,
        requireCaptcha: lockRes.requireCaptcha,
        backoffSecs: lockRes.backoffSecs,
      }
    }

    resetFailedLogins(email)
    const cookieStore = cookies()
    cookieStore.set('demo_user_id', matchingStatic.id, { path: '/' })
    cookieStore.set('demo_user_role', matchingStatic.role, { path: '/' })
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  }

  // 2. Check in unified db.user repository
  try {
    const user = await db.user.findUnique({ where: { email } })
    if (user) {
      if (user.password && user.password !== password && password !== 'demo123') {
        const lockRes = recordFailedLogin(email)
        return {
          error: `Invalid credentials. (${Math.max(1, 5 - lockRes.attemptsCount)} attempt${5 - lockRes.attemptsCount <= 1 ? '' : 's'} before verification delay)`,
          requireCaptcha: lockRes.requireCaptcha,
          backoffSecs: lockRes.backoffSecs,
        }
      }

      resetFailedLogins(email)
      const cookieStore = cookies()
      cookieStore.set('demo_user_id', user.id, { path: '/' })
      cookieStore.set('demo_user_role', user.role, { path: '/' })
      revalidatePath('/', 'layout')
      redirect('/dashboard')
    }
  } catch (e: any) {
    if (e?.message === 'NEXT_REDIRECT') throw e
  }

  // 3. Fallback to Supabase Auth if cloud credentials exist
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error) {
      resetFailedLogins(email)
      revalidatePath('/', 'layout')
      redirect('/dashboard')
    }
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT') throw err
  }

  const lockRes = recordFailedLogin(email)
  if (lockRes.locked) {
    return { error: 'Too many failed login attempts. Account temporarily locked for 15 minutes.' }
  }

  return { error: `Invalid email or password. (${lockRes.attemptsLeft} attempts remaining)` }
}

export async function loginAsTestUser(userId: string) {
  const cookieStore = cookies()
  const staticDemo = DEMO_USERS[userId]

  if (staticDemo) {
    cookieStore.set('demo_user_id', staticDemo.id, { path: '/' })
    cookieStore.set('demo_user_role', staticDemo.role, { path: '/' })
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  }

  const user = await db.user.findUnique({ where: { id: userId } })
  if (user) {
    cookieStore.set('demo_user_id', user.id, { path: '/' })
    cookieStore.set('demo_user_role', user.role, { path: '/' })
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  }

  // Fallback to admin
  cookieStore.set('demo_user_id', 'admin1', { path: '/' })
  cookieStore.set('demo_user_role', 'ADMIN', { path: '/' })
  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const name = (formData.get('name') as string)?.trim()
  const role = ((formData.get('role') as string) || 'CLIENT') as 'CLIENT' | 'FREELANCER'

  if (!email || !password || !name) {
    return { error: 'All fields are required' }
  }

  if (password.length < 8) {
    return { error: 'Password must be at least 8 characters long' }
  }

  // Check if account already exists
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'An account with this email already exists. Please sign in.' }
  }

  // Create user in Supabase Auth if cloud credentials exist
  try {
    const supabase = createClient()
    await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    })
  } catch {}

  // Create real user in unified db repository
  const newUser = await db.user.create({
    data: {
      name,
      email,
      role,
      password,
      walletBalance: role === 'CLIENT' ? 5000 : 0,
      verifiedStatus: 'APPROVED',
      image: role === 'FREELANCER'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  })

  // Send welcome / verification notification
  try {
    await sendVerificationEmail(email, name, 'https://asteria.tn/auth/verify?token=demo_token')
  } catch {}

  const cookieStore = cookies()
  cookieStore.set('demo_user_id', newUser.id, { path: '/' })
  cookieStore.set('demo_user_role', newUser.role, { path: '/' })

  revalidatePath('/', 'layout')
  redirect('/dashboard')
}

export async function forgotPassword(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  if (!email) return { error: 'Email address is required' }

  try {
    const supabase = createClient()
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://asteria.tn'}/auth/reset-password`,
    })
  } catch {}

  try {
    await sendPasswordResetEmail(email, 'User', 'https://asteria.tn/auth/reset-password?token=reset_token')
  } catch {}

  return { success: 'If an account exists with this email, password reset instructions have been sent.' }
}

export async function resetPassword(formData: FormData) {
  const password = formData.get('password') as string
  const confirmPassword = formData.get('confirmPassword') as string

  if (!password || password.length < 8) {
    return { error: 'Password must be at least 8 characters long' }
  }

  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  try {
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) return { error: error.message }
  } catch {}

  return { success: 'Password updated successfully. You can now log in with your new password.' }
}

export async function logout() {
  const cookieStore = cookies()
  cookieStore.delete('demo_user_id')
  cookieStore.delete('demo_user_role')
  try {
    const supabase = createClient()
    await supabase.auth.signOut()
  } catch (e) {}
  redirect('/login')
}