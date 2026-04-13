import { NextRequest } from 'next/server'
import { convex } from '@/lib/convex'
import { api } from '@/convex/_generated/api'
import { fetchAndCacheMarketData } from '@/lib/mining'

const FALLBACK = {
  dogePrice: 0.08,
  priceChange24h: 0,
  marketCap: 0,
  networkHashrate: 800,
  difficulty: 12000000,
  blockHeight: 5000000,
}

const CACHE_TTL = 60 * 1000

export async function GET(req: NextRequest) {
  const force = req.nextUrl.searchParams.get('force') === 'true'

  // Count active miners
  let activeMiners = 0
  try {
    activeMiners = await convex.query(api.users.countActiveMiners, {})
  } catch (err) {
    console.error('[market] countActiveMiners failed:', err)
  }

  // Read market cache
  let cached = null
  try {
    cached = await convex.query(api.market.getCached, { key: 'market_data' })
  } catch (err) {
    console.error('[market] getCached failed:', err)
  }

  const now = Date.now()
  const stale = !cached || now - cached.fetchedAt >= CACHE_TTL

  if (force || stale) {
    try {
      await fetchAndCacheMarketData()
      cached = await convex.query(api.market.getCached, { key: 'market_data' })
    } catch (err) {
      console.error('[market] fetchAndCacheMarketData failed:', err)
    }
  }

  const data = (cached?.data as typeof FALLBACK | undefined) ?? FALLBACK

  return Response.json({
    ...data,
    activeMiners,
    fetchedAt: cached?.fetchedAt ?? Date.now(),
  })
}
