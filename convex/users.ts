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
