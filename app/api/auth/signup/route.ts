import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { convex } from '@/lib/convex'
import { api } from '@/convex/_generated/api'

export async function POST(req: NextRequest) {
  let body: { email?: string; password?: string; username?: string; referralCode?: string }
  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { email, password, username, referralCode: refParam } = body

  if (!email || !password || !username) {
    return Response.json({ error: 'Email, password, and username are required' }, { status: 400 })
  }
  if (password.length < 8) {
    return Response.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Invalid email address' }, { status: 400 })
  }

  try {
    // Check for existing email or username
    const [existingEmail, existingUsername] = await Promise.all([
      convex.query(api.users.getUserByEmail, { email: email.toLowerCase() }),
      convex.query(api.users.getUserByUsername, { username }),
    ])

    if (existingEmail || existingUsername) {
      return Response.json({ error: 'Email or username already in use' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const code = nanoid(8)

    const newUserId = await convex.mutation(api.users.createUser, {
      email: email.toLowerCase(),
      password: hashed,
      username,
      referralCode: code,
      balance: 5,
      totalEarned: 5,
      plan: 'free',
      isAdmin: false,
    })

    // Welcome bonus transaction
    await convex.mutation(api.transactions.createTransaction, {
      userId: newUserId,
      type: 'deposit',
      amount: 5,
      description: 'Welcome bonus — new account',
      status: 'completed',
    })

    // Handle referral
    if (refParam) {
      try {
        const referrer = await convex.query(api.users.getUserByReferralCode, { code: refParam })
        if (referrer) {
          await convex.mutation(api.users.updateUser, {
            id: referrer._id,
            fields: {
              referralCount: referrer.referralCount + 1,
              balance: referrer.balance + 0.05,
              totalEarned: referrer.totalEarned + 0.05,
            },
          })
          await convex.mutation(api.transactions.createTransaction, {
            userId: referrer._id,
            type: 'referral',
            amount: 0.05,
            description: `Referral bonus — ${username} joined`,
            status: 'completed',
          })
          await convex.mutation(api.users.updateUser, {
            id: newUserId,
            fields: { referredBy: refParam },
          })
        }
      } catch (err) {
        // Referral failure should not block account creation
        console.error('[signup] referral processing failed:', err)
      }
    }

    return Response.json({
      success: true,
      user: {
        id: newUserId,
        email: email.toLowerCase(),
        username,
        referralCode: code,
      },
    })
  } catch (err) {
    console.error('[signup] error:', err)
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
