import { NextRequest } from 'next/server'
import { convex } from '@/lib/convex'
import { api } from '@/convex/_generated/api'

export async function POST(req: NextRequest) {
  let body: { email?: string; code?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, code } = body
  if (!email || !code) {
    return Response.json({ error: 'Email and code are required' }, { status: 400 })
  }

  try {
    const result = await convex.mutation(api.users.verifyUser, {
      email: email.toLowerCase(),
      code,
    })

    if (!result.success) {
      return Response.json({ error: result.error ?? 'Verification failed' }, { status: 400 })
    }

    return Response.json({ success: true })
  } catch (err) {
    console.error('[verify-email]', err)
    return Response.json({ error: 'Verification failed' }, { status: 500 })
  }
}
