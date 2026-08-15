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
    revalidatePath('/dashboard', 'layout')
    redirect('/dashboard')
  }

  // 2. Check in DB
  try {
    const allUsers = await db.user.findMany()
    const matchingTestUser = allUsers.find(u => u.email.toLowerCase() === email)

    if (matchingTestUser) {
      const cookieStore = cookies()
      cookieStore.set('demo_user_id', matchingTestUser.id, { path: '/' })
      cookieStore.set('demo_user_role', matchingTestUser.role, { path: '/' })
      revalidatePath('/dashboard', 'layout')
      redirect('/dashboard')
    }
  } catch (e) {}

  // 3. Fallback to Supabase Auth
  try {
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      // In demo mode, provide friendly access
      if (process.env.ENABLE_DEMO_AUTH === 'true') {
        const cookieStore = cookies()
        cookieStore.set('demo_user_id', 'admin1', { path: '/' })
        cookieStore.set('demo_user_role', 'ADMIN', { path: '/' })
        revalidatePath('/dashboard', 'layout')
        redirect('/dashboard')
      }
      return { error: error.message || 'Invalid credentials' }
    }
  } catch (err: any) {
    if (err?.message === 'NEXT_REDIRECT') throw err
    return { error: 'Failed to sign in. Please try demo login.' }
  }

  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}

export async function loginAsTestUser(userId: string) {
  const cookieStore = cookies()
  const staticDemo = DEMO_USERS[userId]

  if (staticDemo) {
    cookieStore.set('demo_user_id', staticDemo.id, { path: '/' })
    cookieStore.set('demo_user_role', staticDemo.role, { path: '/' })
    revalidatePath('/dashboard', 'layout')
    redirect('/dashboard')
  }

  const user = await db.user.findUnique({ where: { id: userId } })
  if (user) {
    cookieStore.set('demo_user_id', user.id, { path: '/' })
    cookieStore.set('demo_user_role', user.role, { path: '/' })
    revalidatePath('/dashboard', 'layout')
    redirect('/dashboard')
  }

  // Fallback to admin
  cookieStore.set('demo_user_id', 'admin1', { path: '/' })
  cookieStore.set('demo_user_role', 'ADMIN', { path: '/' })
  revalidatePath('/dashboard', 'layout')
  redirect('/dashboard')
}

export async function register(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const name = formData.get('name') as string
  const role = (formData.get('role') as string) || 'CLIENT'

  if (!email || !password || !name) {
    return { error: 'All fields are required' }
  }

  const cookieStore = cookies()
  cookieStore.set('demo_user_id', `u_${Date.now()}`, { path: '/' })
  cookieStore.set('demo_user_role', role, { path: '/' })

  revalidatePath('/dashboard', 'layout')
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