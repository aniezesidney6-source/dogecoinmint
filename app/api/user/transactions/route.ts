import { NextRequest } from 'next/server'
import { auth } from '@/lib/auth'
import { convex } from '@/lib/convex'
import { api } from '@/convex/_generated/api'
import { Id } from '@/convex/_generated/dataModel'

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = req.nextUrl
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') ?? '20')))
  const type = searchParams.get('type') ?? undefined

  const result = await convex.query(api.transactions.getUserTransactions, {
    userId: session.user.id as Id<'users'>,
    type: type ?? undefined,
    limit,
    offset: (page - 1) * limit,
  })

  return Response.json({ transactions: result.transactions, total: result.total, page, limit })
}
