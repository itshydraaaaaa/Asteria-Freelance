'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // 1. Try Supabase Auth first
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!authError && authData?.user) {
      const u = (await db.user.findUnique({ where: { id: authData.user.id } })) ||
                (await db.user.findUnique({ where: { email } }))
      const cookieStore = await cookies()
      cookieStore.set('demo_user_id', authData.user.id, { path: '/' })
      cookieStore.set('demo_user_role', u?.role ?? authData.user.user_metadata?.role ?? 'CLIENT', { path: '/' })
      revalidatePath('/', 'layout')
      return { success: true }
    }
  } catch {}

  // 2. Check in database User table
  try {
    const dbUser = await db.user.findUnique({ where: { email } })
    if (dbUser) {
      if (dbUser.password && dbUser.password !== password) {
        return { error: 'Invalid email or password.' }
      }
      const cookieStore = await cookies()
      cookieStore.set('demo_user_id', dbUser.id, { path: '/' })
      cookieStore.set('demo_user_role', dbUser.role, { path: '/' })
      revalidatePath('/', 'layout')
      return { success: true }
    }
  } catch {}

  return { error: 'Invalid email or password.' }
}

export async function loginAsTestUser(userId: string) {
  const user = await db.user.findUnique({ where: { id: userId } })
  if (user) {
    const cookieStore = await cookies()
    cookieStore.set('demo_user_id', user.id, { path: '/' })
    cookieStore.set('demo_user_role', user.role, { path: '/' })
    revalidatePath('/', 'layout')
    return { success: true }
  }

  return { error: 'User not found in database.' }
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

  let createdUserId: string | null = null

  // 1. Try Supabase Auth
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name, role },
      },
    })

    if (!authError && authData?.user?.id) {
      createdUserId = authData.user.id
    }
  } catch (err: any) {
    console.error('Supabase Auth signUp error:', err)
  }

  // 2. Insert into Supabase User database table
  try {
    const newUser = await db.user.create({
      data: {
        id: createdUserId || undefined,
        email,
        name,
        role,
        password,
        walletBalance: role === 'CLIENT' ? 5000 : 0,
        verifiedStatus: 'UNSUBMITTED',
      },
    })

    const cookieStore = await cookies()
    cookieStore.set('demo_user_id', newUser.id, { path: '/' })
    cookieStore.set('demo_user_role', newUser.role, { path: '/' })

    revalidatePath('/', 'layout')
    return { success: true }
  } catch (dbErr: any) {
    console.error('db.user.create error:', dbErr)
    return { error: dbErr?.message || 'Failed to create user profile in database.' }
  }
}

export async function logout() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {}

  const cookieStore = await cookies()
  cookieStore.delete('demo_user_id')
  cookieStore.delete('demo_user_role')
  revalidatePath('/', 'layout')
  return { success: true }
}