import axios from 'axios'
import { convex } from './convex'
import { api } from '@/convex/_generated/api'
import { PLAN_RATES, PLAN_HASHRATES } from './constants'
export { PLAN_RATES, PLAN_HASHRATES, PLAN_PRICES, PLAN_COLORS } from './constants'

export function getRandomHashrate(base: number): number {
  const noise = (Math.random() - 0.5) * 0.16 // ±8%
  return Math.max(0, base * (1 + noise))
}

export function calculateEarnings(
  plan: string,
  referralCount: number,
  realNetworkHashrate: number
): number {
  const baseRate = PLAN_RATES[plan] ?? PLAN_RATES.free

  // Scale using real network hashrate: baseline is ~800 TH/s (typical Dogecoin network)
  const baselineHashrate = 800
  const difficultyFactor = Math.min(
    1,
    1 - (Math.max(0, realNetworkHashrate - baselineHashrate) / baselineHashrate) * 0.15
  )

  // Referral boost: 5% per referral, up to 50%
  const referralBoost = Math.min(referralCount * 0.05, 0.5)

  return baseRate * difficultyFactor * (1 + referralBoost)
}

export async function fetchAndCacheMarketData(): Promise<void> {
  try {
    const [priceRes, chartRes] = await Promise.allSettled([
      axios.get(
        'https://api.coingecko.com/api/v3/simple/price?ids=dogecoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true',
        { timeout: 8000 }
      ),
      axios.get(
        'https://api.coingecko.com/api/v3/coins/dogecoin/market_chart?vs_currency=usd&days=7',
        { timeout: 8000 }
      ),
    ])

    let dogePrice = 0.08
    let priceChange24h = 0
    let marketCap = 0
    let networkHashrate = 800

    if (priceRes.status === 'fulfilled') {
      const d = priceRes.value.data?.dogecoin
      dogePrice = d?.usd ?? dogePrice
      priceChange24h = d?.usd_24h_change ?? 0
      marketCap = d?.usd_market_cap ?? 0
    }

    if (chartRes.status === 'fulfilled') {
      const prices: number[][] = chartRes.value.data?.prices ?? []
      if (prices.length > 1) {
        const last = prices[prices.length - 1][1]
        const first = prices[0][1]
        const change = Math.abs((last - first) / first)
        networkHashrate = 800 + change * 1000
      }
    }

    // Try Dogechain for difficulty + block height
    let difficulty = 12345678
    let blockHeight = 5000000
    try {
      const [diffRes, blockRes] = await Promise.allSettled([
        axios.get('https://dogechain.info/api/v1/difficulty', { timeout: 5000 }),
        axios.get('https://dogechain.info/api/v1/block_count', { timeout: 5000 }),
      ])
      if (diffRes.status === 'fulfilled') difficulty = diffRes.value.data?.difficulty ?? difficulty
      if (blockRes.status === 'fulfilled') blockHeight = blockRes.value.data?.block_count ?? blockHeight
    } catch {
      // Use defaults if Dogechain is unavailable
    }

    await convex.mutation(api.market.setCached, {
      key: 'market_data',
      data: { dogePrice, priceChange24h, marketCap, networkHashrate, difficulty, blockHeight },
    })
  } catch {
    // Silently fail — use cached data
  }
}

interface MarketDataResult {
  dogePrice: number
  priceChange24h: number
  marketCap: number
  networkHashrate: number
  difficulty: number
  blockHeight: number
}

export async function getMarketData(): Promise<MarketDataResult> {
  const FALLBACK: MarketDataResult = {
    dogePrice: 0.08,
    priceChange24h: 0,
    marketCap: 0,
    networkHashrate: 800,
    difficulty: 12345678,
    blockHeight: 5000000,
  }

  try {
    const cached = await convex.query(api.market.getCached, { key: 'market_data' })
    const now = Date.now()
    const CACHE_TTL = 60 * 1000

    if (cached && now - cached.fetchedAt < CACHE_TTL) {
      return cached.data as MarketDataResult
    }

    await fetchAndCacheMarketData()

    const fresh = await convex.query(api.market.getCached, { key: 'market_data' })
    if (fresh) return fresh.data as MarketDataResult
  } catch {
    // Fall through to FALLBACK
  }

  return FALLBACK
}
