import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { convex } from '@/lib/convex'
import { api } from '@/convex/_generated/api'

export async function POST(req: NextRequest) {
  let body: { token?: string; newPassword?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { token, newPassword } = body
  if (!token || !newPassword) {
    return Response.json({ error: 'Token and new password are required' }, { status: 400 })
  }
  if (newPassword.length < 8) {
    return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }

  try {
    const user = await convex.query(api.users.getUserByResetToken, { token })
    if (!user) {
      return Response.json({ error: 'Invalid or expired reset link' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(newPassword, 10)

    await convex.mutation(api.users.updateUser, {
      id: user._id,
      fields: {
        password: hashed,
        resetToken: undefined,
        resetTokenExpiry: undefined,
      },
    })

    return Response.json({ success: true })
  } catch (err) {
    console.error('[reset-password]', err)
    return Response.json({ error: 'Failed to reset password' }, { status: 500 })
  }
}
