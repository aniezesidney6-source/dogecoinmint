import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { auth } from '@/lib/auth'
import { convex } from '@/lib/convex'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { searchParams } = req.nextUrl
  const search = searchParams.get('search') ?? undefined

  const users = await convex.query(api.users.adminGetAllUsers, { search })
  return Response.json({ users })
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { userId } = await req.json() as { userId: string }
  if (!userId) return Response.json({ error: 'userId required' }, { status: 400 })

  await convex.mutation(api.users.deleteUser, { id: userId as Id<'users'> })
  return Response.json({ success: true })
}

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return Response.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json()
  const { userId, balance, plan, email, newPassword, status } = body as {
    userId: string
    balance?: number
    plan?: string
    email?: string
    newPassword?: string
    status?: 'active' | 'frozen' | 'banned'
  }

  if (!userId) {
    return Response.json({ error: 'userId required' }, { status: 400 })
  }

  // Handle status update
  if (status !== undefined) {
    await convex.mutation(api.users.updateUserStatus, {
      id: userId as Id<'users'>,
      status,
    })
  }

  // Handle balance / plan update via updateUser
  if (balance !== undefined || plan !== undefined) {
    const fields: Record<string, unknown> = {}
    if (balance !== undefined) fields.balance = balance
    if (plan !== undefined) fields.plan = plan

    await convex.mutation(api.users.updateUser, {
      id: userId as Id<'users'>,
      fields,
    })
  }

  // Handle credential updates via updateUserCredentials
  if (email !== undefined || newPassword !== undefined) {
    const credFields: { email?: string; password?: string } = {}

    if (email !== undefined) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return Response.json({ error: 'Invalid email address' }, { status: 400 })
      }
      // Check email not already taken by another user
      const existing = await convex.query(api.users.getUserByEmail, {
        email: email.toLowerCase(),
      })
      if (existing && existing._id !== userId) {
        return Response.json({ error: 'Email already in use' }, { status: 409 })
      }
      credFields.email = email.toLowerCase()
    }

    if (newPassword !== undefined) {
      if (newPassword.length < 8) {
        return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      }
      credFields.password = await bcrypt.hash(newPassword, 10)
    }

    await convex.mutation(api.users.updateUserCredentials, {
      id: userId as Id<'users'>,
      ...credFields,
    })
  }

  const user = await convex.query(api.users.getUserById, { id: userId as Id<'users'> })
  if (!user) return Response.json({ error: 'User not found' }, { status: 404 })

  return Response.json({ user })
}
