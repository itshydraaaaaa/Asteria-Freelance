'use server'

import { revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import bcrypt from 'bcryptjs'
import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { signSessionToken } from '@/lib/auth'

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tvuktwtartbqmggndinu.supabase.co'
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey && serviceKey !== 'your-service-role-key-here') {
    return createSupabaseClient(url, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })
  }
  return null
}

export async function login(formData: FormData) {
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email and password are required' }
  }

  // 1. Try Supabase Auth standard login
  try {
    const supabase = await createClient()
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (!authError && authData?.user) {
      const u = (await db.user.findUnique({ where: { id: authData.user.id } })) ||
                (await db.user.findUnique({ where: { email } }))
      const role = u?.role ?? authData.user.user_metadata?.role ?? 'CLIENT'
      const token = signSessionToken(authData.user.id, role)
      const cookieStore = await cookies()
      cookieStore.set('auth_session_token', token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      })
      revalidatePath('/', 'layout')
      return { success: true, redirect: role === 'ADMIN' ? '/dashboard/admin' : '/dashboard' }
    }
  } catch (err) {
    console.error('Supabase signInWithPassword error:', err)
  }

  // 2. Fallback check against database User table (verifying hashed password)
  try {
    const dbUser = await db.user.findUnique({ where: { email } })
    if (dbUser) {
      const storedHash = (dbUser as any).password_hash || dbUser.password
      let passwordValid = false
      if (storedHash) {
        if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
          passwordValid = await bcrypt.compare(password, storedHash)
        } else {
          passwordValid = storedHash === password
        }
      }

      if (!passwordValid) {
        return { error: 'Invalid email or password.' }
      }

      const token = signSessionToken(dbUser.id, dbUser.role)
      const cookieStore = await cookies()
      cookieStore.set('auth_session_token', token, {
        path: '/',
        maxAge: 60 * 60 * 24 * 30,
        sameSite: 'lax',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
      })
      revalidatePath('/', 'layout')
      return { success: true, redirect: dbUser.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard' }
    }
  } catch (err) {
    console.error('Database login lookup error:', err)
  }

  return { error: 'Invalid email or password.' }
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

  // 1. Check if user already exists in database
  const existingUser = await db.user.findUnique({ where: { email } })
  if (existingUser) {
    return { error: 'An account with this email address already exists. Please log in.' }
  }

  let createdUserId: string | null = null

  // 2. Create in auth.users via Admin API (auto-confirmed) or standard signUp
  const adminClient = getAdminClient()
  if (adminClient) {
    try {
      const { data: adminAuthUser, error: adminErr } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { name, role },
      })
      if (!adminErr && adminAuthUser?.user?.id) {
        createdUserId = adminAuthUser.user.id
      } else if (adminErr) {
        console.warn('Admin createUser notice:', adminErr.message)
      }
    } catch (err: any) {
      console.warn('Admin createUser catch:', err.message)
    }
  }

  if (!createdUserId) {
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
      console.warn('Standard signUp catch:', err.message)
    }
  }

  // 3. Hash password and insert into Supabase User database table
  try {
    const password_hash = await bcrypt.hash(password, 12)

    const newUser = await db.user.create({
      data: {
        id: createdUserId || undefined,
        email,
        name,
        role,
        password: password_hash,
        password_hash,
        walletBalance: role === 'CLIENT' ? 5000 : 0,
        verifiedStatus: 'UNSUBMITTED',
      } as any,
    })

    const token = signSessionToken(newUser.id, newUser.role)
    const cookieStore = await cookies()
    cookieStore.set('auth_session_token', token, {
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
      sameSite: 'lax',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
    })

    revalidatePath('/', 'layout')
    return { success: true, redirect: '/dashboard' }
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
  cookieStore.delete('auth_session_token')
  cookieStore.delete('demo_user_id')
  cookieStore.delete('demo_user_role')
  revalidatePath('/', 'layout')
  return { success: true }
}