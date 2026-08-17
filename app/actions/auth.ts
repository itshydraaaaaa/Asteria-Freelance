'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { DEMO_USERS } from '@/lib/data/demoUsers'

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // 1. Check in static demo users dictionary first for instant login
  const matchingStatic = Object.values(DEMO_USERS).find(u => u.email.toLowerCase() === email)
  if (matchingStatic) {
    const cookieStore = cookies()
    cookieStore.set('demo_user_id', matchingStatic.id, { path: '/' })
    cookieStore.set('demo_user_role', matchingStatic.role, { path: '/' })
    revalidatePath('/', 'layout')
    redirect('/dashboard')
  }

  // 2. Check in unified db.user repository (includes registered accounts)
  try {
    const user = await db.user.findUnique({ where: { email } })
    if (user) {
      const cookieStore = cookies()
      cookieStore.set('demo_user_id', user.id, { path: '/' })
      cookieStore.set('demo_user_role', user.role, { path: '/' })
      revalidatePath('/', 'layout')
      redirect('/dashboard')
    }
  } catch (e) {}

  // 3. Fallback to Supabase Auth if cloud credentials exist
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!error) {
      revalidatePath('/', 'layout')
      redirect('/dashboard')
    }
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT') throw err
  }

  return { error: 'Invalid email or password. Please create an account or select a demo user.' }
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

  // Check if account already exists
  const existing = await db.user.findUnique({ where: { email } })
  if (existing) {
    return { error: 'An account with this email already exists. Please sign in.' }
  }

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

  const cookieStore = cookies()
  cookieStore.set('demo_user_id', newUser.id, { path: '/' })
  cookieStore.set('demo_user_role', newUser.role, { path: '/' })

  revalidatePath('/', 'layout')
  redirect('/dashboard')
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