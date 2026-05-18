import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export async function GET() {
  const session = await getSession()
  if (!session) {
    return NextResponse.json({ user: null })
  }
  return NextResponse.json({
    user: {
      id: session.id,
      email: session.email,
      username: session.username,
      name: session.username,
      isAdmin: session.isAdmin,
      plan: session.plan,
      status: session.status,
      isFrozen: session.status === 'frozen',
    },
  })
}
