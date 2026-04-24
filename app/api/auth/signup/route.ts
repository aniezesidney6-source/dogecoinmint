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
    const [existingEmail, existingUsername] = await Promise.all([
      convex.query(api.users.getUserByEmail, { email: email.toLowerCase() }),
      convex.query(api.users.getUserByUsername, { username }),
    ])

    if (existingEmail || existingUsername) {
      return Response.json({ error: 'Email or username already in use' }, { status: 409 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const referralCode = nanoid(8)

    const newUserId = await convex.mutation(api.users.createUser, {
      email: email.toLowerCase(),
      password: hashed,
      username,
      referralCode,
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

    // Handle referral (non-blocking — failure must not prevent account creation)
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
        console.error('[signup] referral processing failed:', err)
      }
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const { Resend } = require('resend')
      const resend = new Resend(process.env.RESEND_API_KEY)
      await resend.emails.send({
        from: 'ChainForgeX <support@chainforgeX.com>',
        to: email,
        subject: '⛏ Welcome to ChainForgeX — Your Mining Has Started!',
        html: `
          <div style="background:#050810;color:#ffffff;font-family:sans-serif;padding:40px;max-width:600px;margin:0 auto;border-radius:16px;">
            <h1 style="color:#F7B731;font-size:24px;margin:0;">ChainForge<span style="color:#00FFB2;">X</span></h1>
            <h2 style="margin-top:24px;">Welcome, ${username}! 🎉</h2>
            <p style="color:rgba(255,255,255,0.7);">Your account is active and mining has started.</p>
            <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
              <p style="color:rgba(255,255,255,0.5);margin:0 0 8px;">Welcome Bonus</p>
              <p style="color:#00FFB2;font-size:36px;font-weight:700;margin:0;font-family:monospace;">5 DOGE</p>
            </div>
            <div style="text-align:center;margin-top:32px;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" style="background:#F7B731;color:#000000;padding:14px 32px;border-radius:999px;text-decoration:none;font-weight:700;">Go to Dashboard →</a>
            </div>
            <p style="color:rgba(255,255,255,0.3);font-size:12px;text-align:center;margin-top:32px;">© 2026 ChainForgeX</p>
          </div>
        `,
      })
      console.log('Welcome email sent to:', email)
    } catch (emailError) {
      console.error('Welcome email failed (non-blocking):', emailError)
    }

    return Response.json({
      success: true,
      user: {
        id: newUserId,
        email: email.toLowerCase(),
        username,
        referralCode,
      },
    })
  } catch (err) {
    console.error('[signup] error:', err)
    const msg = err instanceof Error ? err.message : 'Internal server error'
    return Response.json({ error: msg }, { status: 500 })
  }
}
