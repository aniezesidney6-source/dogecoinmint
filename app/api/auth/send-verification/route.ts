import { NextRequest } from 'next/server'
import { convex } from '@/lib/convex'
import { api } from '@/convex/_generated/api'
import { sendVerificationEmail } from '@/lib/email'

export async function POST(req: NextRequest) {
  let body: { email?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email } = body
  if (!email) return Response.json({ error: 'Email required' }, { status: 400 })

  try {
    const user = await convex.query(api.users.getUserByEmail, {
      email: email.toLowerCase(),
    })
    if (!user) {
      // Don't reveal whether email exists
      return Response.json({ success: true })
    }

    if (user.isVerified) {
      return Response.json({ error: 'Email already verified' }, { status: 400 })
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString()
    const expiry = Date.now() + 15 * 60 * 1000 // 15 minutes

    await convex.mutation(api.users.setVerificationCode, {
      userId: user._id,
      code,
      expiry,
    })

    console.log('Sending verification code to:', email)
    await sendVerificationEmail(email, user.username, code)
    console.log('Verification code sent')

    return Response.json({ success: true })
  } catch (err) {
    console.error('[send-verification]', err)
    return Response.json({ error: 'Failed to send verification email' }, { status: 500 })
  }
}
