import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { convex } from '@/lib/convex'
import { api } from '@/convex/_generated/api'
import { cookies } from 'next/headers'
import { SignJWT } from 'jose'

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json()
    console.log('=== LOGIN ATTEMPT ===')
    console.log('Email:', email)
    console.log('NEXTAUTH_SECRET exists:', !!process.env.NEXTAUTH_SECRET)
    console.log('NEXT_PUBLIC_CONVEX_URL:', process.env.NEXT_PUBLIC_CONVEX_URL)

    const user = await convex.query(api.users.getUserByEmail, { email })
    console.log('User found:', !!user)

    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.password)
    console.log('Password valid:', valid)

    if (!valid) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
    }

    if (user.status === 'banned') {
      return NextResponse.json({ error: 'Your account has been banned. Contact support@chainforgeX.com' }, { status: 403 })
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
    const token = await new SignJWT({
      id: user._id,
      email: user.email,
      username: user.username,
      isAdmin: user.isAdmin,
      plan: user.plan,
      status: user.status,
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('30d')
      .sign(secret)

    const cookieStore = await cookies()
    cookieStore.set('auth-token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60,
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: { id: user._id, email: user.email, username: user.username, isAdmin: user.isAdmin },
    })
  } catch (err) {
    console.error('=== LOGIN ERROR ===', err)
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
