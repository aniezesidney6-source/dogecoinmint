import { NextRequest } from 'next/server'
import { convex } from '@/lib/convex'
import { api } from '@/convex/_generated/api'

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const result = await convex.mutation(api.mining.runMiningTick, {})
    return Response.json({ success: true, processed: result.processed })
  } catch (err) {
    console.error('[cron/mine]', err)
    return Response.json({ error: 'Internal server error' }, { status: 500 })
  }
}
