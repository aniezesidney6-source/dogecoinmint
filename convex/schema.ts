import { defineSchema, defineTable } from 'convex/server'
import { v } from 'convex/values'

export default defineSchema({
  users: defineTable({
    email: v.string(),
    password: v.string(),
    username: v.string(),
    balance: v.number(),
    totalEarned: v.number(),
    hashrate: v.number(),
    plan: v.union(v.literal('free'), v.literal('starter'), v.literal('pro'), v.literal('elite')),
    referralCode: v.string(),
    referredBy: v.optional(v.string()),
    referralCount: v.number(),
    isAdmin: v.boolean(),
    miningActive: v.boolean(),
    lastMined: v.optional(v.number()),
    createdAt: v.number(),
    // Email verification
    isVerified: v.optional(v.boolean()),
    verificationCode: v.optional(v.string()),
    verificationExpiry: v.optional(v.number()),
    // Password reset
    resetToken: v.optional(v.string()),
    resetTokenExpiry: v.optional(v.number()),
  })
    .index('by_email', ['email'])
    .index('by_referralCode', ['referralCode'])
    .index('by_miningActive', ['miningActive']),

  transactions: defineTable({
    userId: v.id('users'),
    type: v.union(
      v.literal('mining'),
      v.literal('referral'),
      v.literal('deposit'),
      v.literal('withdrawal')
    ),
    amount: v.number(),
    description: v.string(),
    status: v.union(v.literal('completed'), v.literal('pending')),
    createdAt: v.number(),
  }).index('by_userId', ['userId']),

  withdrawals: defineTable({
    userId: v.id('users'),
    amount: v.number(),
    walletAddress: v.string(),
    status: v.union(
      v.literal('pending'),
      v.literal('approved'),
      v.literal('rejected')
    ),
    adminNote: v.optional(v.string()),
    createdAt: v.number(),
    processedAt: v.optional(v.number()),
  })
    .index('by_status', ['status'])
    .index('by_userId', ['userId']),

  marketCache: defineTable({
    key: v.string(),
    data: v.any(),
    fetchedAt: v.number(),
  }).index('by_key', ['key']),
})
