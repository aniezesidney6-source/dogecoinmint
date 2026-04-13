import { mutation, query } from './_generated/server'
import { v } from 'convex/values'

export const getCached = query({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query('marketCache')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first()
  },
})

export const setCached = mutation({
  args: { key: v.string(), data: v.any() },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('marketCache')
      .withIndex('by_key', (q) => q.eq('key', args.key))
      .first()

    if (existing) {
      await ctx.db.patch(existing._id, { data: args.data, fetchedAt: Date.now() })
    } else {
      await ctx.db.insert('marketCache', {
        key: args.key,
        data: args.data,
        fetchedAt: Date.now(),
      })
    }
  },
})
