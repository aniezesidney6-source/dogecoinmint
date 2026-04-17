import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const createUser = mutation({
  args: {
    email: v.string(),
    password: v.string(),
    username: v.string(),
    referralCode: v.string(),
    referredBy: v.optional(v.string()),
    balance: v.number(),
    totalEarned: v.number(),
    plan: v.union(v.literal('free'), v.literal('starter'), v.literal('pro'), v.literal('elite')),
    isAdmin: v.boolean(),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('users', {
      ...args,
      hashrate: 45,
      referralCount: 0,
      miningActive: true,
      status: 'active' as const,
      createdAt: Date.now(),
    })
  },
})

export const getUserByEmail = query({
  args: { email: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first()
  },
})

export const getUserById = query({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id)
  },
})

export const updateUser = mutation({
  args: { id: v.id('users'), fields: v.any() },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, args.fields)
  },
})

export const updateUserCredentials = mutation({
  args: {
    id: v.id('users'),
    email: v.optional(v.string()),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fields: any = {}
    if (args.email !== undefined) fields.email = args.email
    if (args.password !== undefined) fields.password = args.password
    await ctx.db.patch(args.id, fields)
  },
})

export const getAllUsers = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query('users').order('desc').collect()
    if (!args.search) return all.map(({ password: _, ...u }) => u)
    const s = args.search.toLowerCase()
    return all
      .filter((u) => u.username.toLowerCase().includes(s) || u.email.toLowerCase().includes(s))
      .map(({ password: _, ...u }) => u)
  },
})

// Admin-only query — includes password hash for admin panel display
export const adminGetAllUsers = query({
  args: { search: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const all = await ctx.db.query('users').order('desc').collect()
    if (!args.search) return all
    const s = args.search.toLowerCase()
    return all.filter(
      (u) => u.username.toLowerCase().includes(s) || u.email.toLowerCase().includes(s)
    )
  },
})

export const countActiveMiners = query({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db
      .query('users')
      .withIndex('by_miningActive', (q) => q.eq('miningActive', true))
      .collect()
    return users.length
  },
})

export const getUserByReferralCode = query({
  args: { code: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('users')
      .withIndex('by_referralCode', (q) => q.eq('referralCode', args.code))
      .first()
  },
})

export const getUserByUsername = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query('users').collect()
    return all.find((u) => u.username === args.username) ?? null
  },
})

// ─── Account management ──────────────────────────────────────────────────────

export const deleteUser = mutation({
  args: { id: v.id('users') },
  handler: async (ctx, args) => {
    const txns = await ctx.db
      .query('transactions')
      .withIndex('by_userId', (q) => q.eq('userId', args.id))
      .collect()
    for (const txn of txns) await ctx.db.delete(txn._id)

    const withdrawals = await ctx.db
      .query('withdrawals')
      .withIndex('by_userId', (q) => q.eq('userId', args.id))
      .collect()
    for (const w of withdrawals) await ctx.db.delete(w._id)

    await ctx.db.delete(args.id)
  },
})

export const updateUserStatus = mutation({
  args: {
    id: v.id('users'),
    status: v.union(v.literal('active'), v.literal('frozen'), v.literal('banned')),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.id, { status: args.status })
  },
})

// ─── Email verification ───────────────────────────────────────────────────────

export const setVerificationCode = mutation({
  args: {
    userId: v.id('users'),
    code: v.string(),
    expiry: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      verificationCode: args.code,
      verificationExpiry: args.expiry,
    })
  },
})

export const verifyUser = mutation({
  args: { email: v.string(), code: v.string() },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query('users')
      .withIndex('by_email', (q) => q.eq('email', args.email))
      .first()

    if (!user) return { success: false, error: 'User not found' }

    if (!user.verificationCode || user.verificationCode !== args.code) {
      return { success: false, error: 'Invalid verification code' }
    }

    if (!user.verificationExpiry || Date.now() > user.verificationExpiry) {
      return { success: false, error: 'Verification code has expired' }
    }

    await ctx.db.patch(user._id, {
      verificationCode: undefined,
      verificationExpiry: undefined,
    })

    return { success: true }
  },
})

// ─── Password reset ───────────────────────────────────────────────────────────

export const getUserByResetToken = query({
  args: { token: v.string() },
  handler: async (ctx, args) => {
    const all = await ctx.db.query('users').collect()
    return (
      all.find(
        (u) =>
          u.resetToken === args.token &&
          u.resetTokenExpiry !== undefined &&
          Date.now() < u.resetTokenExpiry
      ) ?? null
    )
  },
})

export const setResetToken = mutation({
  args: {
    userId: v.id('users'),
    token: v.string(),
    expiry: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      resetToken: args.token,
      resetTokenExpiry: args.expiry,
    })
  },
})

export const clearResetToken = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.userId, {
      resetToken: undefined,
      resetTokenExpiry: undefined,
    })
  },
})
