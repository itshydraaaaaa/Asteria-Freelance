import { db } from '@/lib/db'
import { auth } from '@/lib/auth'
import { login } from '@/app/actions/auth'
import { POST as adminUserAction, DELETE as adminUserDelete } from '@/app/api/admin/users/[id]/route'
import { POST as userDeleteAccount } from '@/app/api/user/delete-account/route'
import { NextRequest } from 'next/server'

jest.mock('@/lib/auth', () => {
  const original = jest.requireActual('@/lib/auth')
  return {
    ...original,
    auth: jest.fn(),
  }
})

describe('Account Management: Admin Ban/Unban, Deletion & User Self-Deletion', () => {
  const ADMIN_ID = 'admin-test-user-id'
  const TARGET_USER_ID = 'target-user-for-ban-test'
  const DELETION_USER_ID = 'user-to-be-deleted-id'
  const TREASURY_ID = '00000000-0000-4000-8000-000000000000'

  beforeAll(async () => {
    await db.user.create({
      data: {
        id: ADMIN_ID,
        name: 'System Admin',
        email: 'admin@test.com',
        role: 'ADMIN',
        walletBalance: 0,
        verifiedStatus: 'APPROVED',
      },
    })

    await db.user.create({
      data: {
        id: TARGET_USER_ID,
        name: 'Target Freelancer',
        email: 'target@test.com',
        role: 'FREELANCER',
        walletBalance: 50,
        verifiedStatus: 'APPROVED',
        bio: 'Original bio description',
      },
    })

    await db.user.create({
      data: {
        id: DELETION_USER_ID,
        name: 'Delete Me User',
        email: 'deleteme@test.com',
        role: 'CLIENT',
        walletBalance: 0,
        verifiedStatus: 'APPROVED',
      },
    })
  })

  beforeEach(() => {
    (auth as jest.Mock).mockResolvedValue({
      user: {
        id: ADMIN_ID,
        email: 'admin@test.com',
        role: 'ADMIN',
        name: 'System Admin',
      },
    })
  })

  describe('Admin User Banning & Unbanning', () => {
    it('prevents an admin from banning their own administrative account', async () => {
      const req = new NextRequest(`http://localhost/api/admin/users/${ADMIN_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'BAN', reason: 'Test self ban' }),
      })

      const res = await adminUserAction(req, { params: { id: ADMIN_ID } })
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toContain('You cannot ban your own administrative account')
    })

    it('prevents banning the platform reserve treasury account', async () => {
      const req = new NextRequest(`http://localhost/api/admin/users/${TREASURY_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'BAN', reason: 'Test treasury ban' }),
      })

      const res = await adminUserAction(req, { params: { id: TREASURY_ID } })
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toContain('Cannot ban platform reserve treasury account')
    })

    it('allows admin to ban a target user with a documented reason', async () => {
      const req = new NextRequest(`http://localhost/api/admin/users/${TARGET_USER_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'BAN', reason: 'Fraudulent off-platform requests' }),
      })

      const res = await adminUserAction(req, { params: { id: TARGET_USER_ID } })
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.user.verifiedStatus).toBe('BANNED')
      expect(body.user.bio).toContain('[ACCOUNT SUSPENDED BY ADMIN: Fraudulent off-platform requests]')

      const updated = await db.user.findUnique({ where: { id: TARGET_USER_ID } })
      expect(updated?.verifiedStatus).toBe('BANNED')
    })

    it('blocks a banned user from authenticating via login()', async () => {
      const formData = new FormData()
      formData.append('email', 'target@test.com')
      formData.append('password', 'ValidPassword123!')

      const result = await login(formData)
      expect(result.error).toContain('Your account has been suspended by an administrator')
    })

    it('allows admin to reactivate (unban) a suspended user', async () => {
      const req = new NextRequest(`http://localhost/api/admin/users/${TARGET_USER_ID}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'UNBAN' }),
      })

      const res = await adminUserAction(req, { params: { id: TARGET_USER_ID } })
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)
      expect(body.user.verifiedStatus).toBe('APPROVED')
      expect(body.user.bio).not.toContain('ACCOUNT SUSPENDED BY ADMIN')

      const updated = await db.user.findUnique({ where: { id: TARGET_USER_ID } })
      expect(updated?.verifiedStatus).toBe('APPROVED')
    })
  })

  describe('User Self-Service Account Deletion', () => {
    it('blocks self-deletion if user has active in-progress contracts or escrow', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: DELETION_USER_ID,
          email: 'deleteme@test.com',
          role: 'CLIENT',
          name: 'Delete Me User',
        },
      })

      await db.order.create({
        data: {
          id: 'ord_active_escrow_guard',
          buyerId: DELETION_USER_ID,
          sellerId: TARGET_USER_ID,
          gigId: 'gig1',
          packageId: 'pkg1',
          amount: 200,
          status: 'ACTIVE',
        },
      })

      const req = new NextRequest('http://localhost/api/user/delete-account', {
        method: 'POST',
      })

      const res = await userDeleteAccount(req)
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toContain('Cannot delete account with active in-progress contracts')

      await db.order.update({
        where: { id: 'ord_active_escrow_guard' },
        data: { status: 'COMPLETED' },
      })
    })

    it('successfully deletes account when no active contracts exist', async () => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: DELETION_USER_ID,
          email: 'deleteme@test.com',
          role: 'CLIENT',
          name: 'Delete Me User',
        },
      })

      const req = new NextRequest('http://localhost/api/user/delete-account', {
        method: 'POST',
      })

      const res = await userDeleteAccount(req)
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)

      const deleted = await db.user.findUnique({ where: { id: DELETION_USER_ID } })
      expect(deleted).toBeNull()
    })
  })

  describe('Admin Permanent User Deletion', () => {
    const ADMIN_DELETE_TARGET = 'admin-delete-target-id'

    beforeAll(async () => {
      await db.user.create({
        data: {
          id: ADMIN_DELETE_TARGET,
          name: 'User To Delete By Admin',
          email: 'admin_delete@test.com',
          role: 'FREELANCER',
          walletBalance: 0,
          verifiedStatus: 'APPROVED',
        },
      })
    })

    beforeEach(() => {
      (auth as jest.Mock).mockResolvedValue({
        user: {
          id: ADMIN_ID,
          email: 'admin@test.com',
          role: 'ADMIN',
          name: 'System Admin',
        },
      })
    })

    it('rejects administrative self-deletion', async () => {
      const req = new NextRequest(`http://localhost/api/admin/users/${ADMIN_ID}`, {
        method: 'DELETE',
      })

      const res = await adminUserDelete(req, { params: { id: ADMIN_ID } })
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toContain('Administrators cannot delete their own administrative account')
    })

    it('rejects administrative deletion of treasury account', async () => {
      const req = new NextRequest(`http://localhost/api/admin/users/${TREASURY_ID}`, {
        method: 'DELETE',
      })

      const res = await adminUserDelete(req, { params: { id: TREASURY_ID } })
      const body = await res.json()

      expect(res.status).toBe(400)
      expect(body.error).toContain('Cannot delete the platform reserve treasury account')
    })

    it('successfully deletes user account permanently when safe', async () => {
      const req = new NextRequest(`http://localhost/api/admin/users/${ADMIN_DELETE_TARGET}`, {
        method: 'DELETE',
      })

      const res = await adminUserDelete(req, { params: { id: ADMIN_DELETE_TARGET } })
      const body = await res.json()

      expect(res.status).toBe(200)
      expect(body.success).toBe(true)

      const user = await db.user.findUnique({ where: { id: ADMIN_DELETE_TARGET } })
      expect(user).toBeNull()
    })
  })
})
