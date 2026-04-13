import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const createTransaction = mutation({
  args: {
    userId: v.id('users'),
    type: v.union(
      v.literal('mining'),
      v.literal('referral'),
      v.literal('deposit'),
      v.literal('withdrawal')
    ),
    amount: v.number(),
    description: v.string(),
    status: v.optional(v.union(v.literal('completed'), v.literal('pending'))),
  },
  handler: async (ctx, args) => {
    return await ctx.db.insert('transactions', {
      ...args,
      status: args.status ?? 'completed',
      createdAt: Date.now(),
    })
  },
})

export const getUserTransactions = query({
  args: {
    userId: v.id('users'),
    type: v.optional(v.string()),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let txns = await ctx.db
      .query('transactions')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .order('desc')
      .collect()

    if (args.type && args.type !== 'all') {
      txns = txns.filter((t) => t.type === args.type)
    }

    const total = txns.length
    const offset = args.offset ?? 0
    const limit = args.limit ?? 20

    return {
      transactions: txns.slice(offset, offset + limit),
      total,
    }
  },
})

export const deleteAllForUser = mutation({
  args: { userId: v.id('users') },
  handler: async (ctx, args) => {
    const txns = await ctx.db
      .query('transactions')
      .withIndex('by_userId', (q) => q.eq('userId', args.userId))
      .collect()
    await Promise.all(txns.map((t) => ctx.db.delete(t._id)))
  },
})
