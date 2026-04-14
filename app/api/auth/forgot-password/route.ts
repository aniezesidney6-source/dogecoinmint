import { NextRequest } from 'next/server'
import { randomBytes } from 'crypto'
import { convex } from '@/lib/convex'
import { api } from '@/convex/_generated/api'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  // Always return 200 — never reveal whether an email exists
  const { email } = body
  if (!email) return Response.json({ success: true })

  try {
    const user = await convex.query(api.users.getUserByEmail, {
      email: email.toLowerCase(),
    })

    if (user) {
      const token = randomBytes(32).toString('hex')
      const expiry = Date.now() + 60 * 60 * 1000 // 1 hour

      await convex.mutation(api.users.setResetToken, {
        userId: user._id,
        token,
        expiry,
      })

      await sendPasswordResetEmail(email.toLowerCase(), user.username, token).catch((e) =>
        console.error('[forgot-password] email failed:', e)
      )
    }
  } catch (err) {
    console.error('[forgot-password]', err)
    // Still return 200 — don't leak errors
  }

  return Response.json({ success: true })
}
