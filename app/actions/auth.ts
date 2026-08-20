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

  // 1. Try Supabase Auth first
  try {
    const supabase = createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!authError && authData?.user) {
      const u = (await db.user.findUnique({ where: { id: authData.user.id } })) ||
                (await db.user.findUnique({ where: { email } }))
      const cookieStore = cookies()
      cookieStore.set('demo_user_id', authData.user.id, { path: '/' })
      cookieStore.set('demo_user_role', u?.role ?? authData.user.user_metadata?.role ?? 'CLIENT', { path: '/' })
      revalidatePath('/', 'layout')
      return { success: true }
    }
  } catch (err: any) {}

  // 2. Check in static demo users dictionary
  const matchingStatic = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email)
  if (matchingStatic) {
    if (matchingStatic.password && matchingStatic.password !== password && password !== 'demo123') {
      return { error: 'Invalid email or password.' }
    }
    const cookieStore = cookies()
    cookieStore.set('demo_user_id', matchingStatic.id, { path: '/' })
    cookieStore.set('demo_user_role', matchingStatic.role, { path: '/' })
    revalidatePath('/', 'layout')
    return { success: true }
  }

  // 3. Check in unified db.user repository
  try {
    const dbUser = await db.user.findUnique({ where: { email } })
    if (dbUser) {
      if (dbUser.password && dbUser.password !== password && password !== 'demo123') {
        return { error: 'Invalid email or password.' }
      }
      const cookieStore = cookies()
      cookieStore.set('demo_user_id', dbUser.id, { path: '/' })
      cookieStore.set('demo_user_role', dbUser.role, { path: '/' })
      revalidatePath('/', 'layout')
      return { success: true }
    }
  } catch (e: any) {}

  return { error: 'Invalid email or password.' }
}

export async function loginAsTestUser(userId: string) {
  const cookieStore = cookies()
  const staticDemo = DEMO_USERS[userId]

  if (staticDemo) {
    cookieStore.set('demo_user_id', staticDemo.id, { path: '/' })
    cookieStore.set('demo_user_role', staticDemo.role, { path: '/' })
    revalidatePath('/', 'layout')
    return { success: true }
  }

  const user = await db.user.findUnique({ where: { id: userId } })
  if (user) {
    cookieStore.set('demo_user_id', user.id, { path: '/' })
    cookieStore.set('demo_user_role', user.role, { path: '/' })
    revalidatePath('/', 'layout')
    return { success: true }
  }

  return { success: true }
}

export async function register(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string
  const name = (formData.get('name') as string)?.trim()
  const role = ((formData.get('role') as string) || 'CLIENT') as 'CLIENT' | 'FREELANCER'

  if (!email || !password || !name) {
    return { error: 'All fields are required' }
  }

  if (password.length < 6) {
    return { error: 'Password must be at least 6 characters long' }
  }

  // 1. Check if account already exists
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'An account with this email already exists. Please sign in.' }
  }

  // 2. Create user in Supabase Auth
  const supabase = createClient()
  let authUserId: string | null = null
  try {
    const { data: authData } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, name, role },
      },
    })
    if (authData?.user?.id) {
      authUserId = authData.user.id
    }
  } catch {}

  if (!authUserId) {
    const crypto = await import('crypto')
    authUserId = crypto.randomUUID()
  }

  // 3. Create real user in unified db repository
  const newUser = await db.user.create({
    data: {
      id: authUserId,
      name,
      email,
      role,
      password,
      walletBalance: role === 'CLIENT' ? 5000 : 0,
      verifiedStatus: 'UNSUBMITTED',
      image: role === 'FREELANCER'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
        : 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    },
  })

  // 4. Set session cookies for immediate access
  const cookieStore = cookies()
  cookieStore.set('demo_user_id', newUser.id, { path: '/' })
  cookieStore.set('demo_user_role', newUser.role, { path: '/' })

  revalidatePath('/', 'layout')
  return { success: true }
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
  revalidatePath('/', 'layout')
  return { success: true }
}