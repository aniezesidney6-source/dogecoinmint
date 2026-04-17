// Load env manually for ts-node
import * as fs from 'fs'
import * as path from 'path'
const envPath = path.resolve(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n')
  for (const line of lines) {
    const [k, ...rest] = line.split('=')
    if (k?.trim() && rest.length) process.env[k.trim()] = rest.join('=').trim()
  }
}

import { ConvexHttpClient } from 'convex/browser'
import bcrypt from 'bcryptjs'
import { nanoid } from 'nanoid'
import { api } from '../convex/_generated/api'
import { Id } from '../convex/_generated/dataModel'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!
if (!convexUrl) throw new Error('NEXT_PUBLIC_CONVEX_URL not set')

const convex = new ConvexHttpClient(convexUrl)

const DEMO_USERS = [
  { username: 'alice_miner', email: 'alice@cryptomine.io', plan: 'pro' as const, balance: 342.55, referralCount: 5 },
  { username: 'bob_hash', email: 'bob@cryptomine.io', plan: 'elite' as const, balance: 1204.32, referralCount: 12 },
  { username: 'charlie_doge', email: 'charlie@cryptomine.io', plan: 'starter' as const, balance: 89.21, referralCount: 2 },
  { username: 'diana_crypto', email: 'diana@cryptomine.io', plan: 'free' as const, balance: 12.45, referralCount: 0 },
  { username: 'eve_blockchain', email: 'eve@cryptomine.io', plan: 'pro' as const, balance: 567.89, referralCount: 8 },
  { username: 'frank_satoshi', email: 'frank@cryptomine.io', plan: 'starter' as const, balance: 45.67, referralCount: 1 },
  { username: 'grace_hash', email: 'grace@cryptomine.io', plan: 'elite' as const, balance: 2341.12, referralCount: 22 },
  { username: 'demo', email: 'demo@cryptomine.io', plan: 'pro' as const, balance: 156.78, referralCount: 3 },
]

const TX_TYPES = ['mining', 'mining', 'mining', 'deposit', 'referral', 'withdrawal'] as const
type TxType = typeof TX_TYPES[number]

async function seed() {
  console.log('Connecting to Convex:', convexUrl)

  // Clear existing data by fetching all users and deleting their transactions
  const existingUsers = await convex.query(api.users.getAllUsers, {})
  for (const user of existingUsers) {
    await convex.mutation(api.transactions.deleteAllForUser, { userId: user._id as Id<'users'> })
  }
  console.log('Cleared existing transactions')

  // Delete any existing admin accounts before recreating
  for (const user of existingUsers) {
    if ((user as { isAdmin?: boolean }).isAdmin || user.username === 'admin') {
      await convex.mutation(api.users.deleteUser, { id: user._id as Id<'users'> })
      console.log(`Deleted existing admin: ${user.email}`)
    }
  }

  // Admin user
  const adminPw = await bcrypt.hash('Admin0147', 10)
  const adminId = await convex.mutation(api.users.createUser, {
    email: 'admin@dogecoinmint.com',
    password: adminPw,
    username: 'admin',
    balance: 0,
    totalEarned: 0,
    plan: 'elite',
    referralCode: 'ADMIN001',
    isAdmin: true,
  })
  console.log('Created admin user')

  // Demo users
  const demoPw = await bcrypt.hash('demo1234', 8)
  const createdIds: Array<{ id: Id<'users'>; plan: string }> = []

  for (const u of DEMO_USERS) {
    const pw = u.email === 'demo@cryptomine.io' ? demoPw : await bcrypt.hash('password123', 8)
    const id = await convex.mutation(api.users.createUser, {
      email: u.email,
      password: pw,
      username: u.username,
      balance: u.balance,
      totalEarned: u.balance * 1.3,
      plan: u.plan,
      referralCode: nanoid(8),
      isAdmin: false,
    })
    createdIds.push({ id: id as Id<'users'>, plan: u.plan })
  }
  console.log(`Created ${createdIds.length} demo users`)

  // Seed transactions (30 per user)
  const allUsers: Array<{ id: Id<'users'>; plan: string }> = [
    { id: adminId as Id<'users'>, plan: 'elite' },
    ...createdIds,
  ]
  const now = Date.now()
  let txCount = 0

  for (const { id: userId, plan } of allUsers) {
    for (let i = 0; i < 30; i++) {
      const type: TxType = TX_TYPES[Math.floor(Math.random() * TX_TYPES.length)]
      const amount =
        type === 'mining' ? 0.002 + Math.random() * 0.05
        : type === 'deposit' ? 10 + Math.random() * 100
        : type === 'referral' ? 0.05
        : -(10 + Math.random() * 50)

      await convex.mutation(api.transactions.createTransaction, {
        userId,
        type: type === 'withdrawal' ? 'withdrawal' : type,
        amount: parseFloat(amount.toFixed(4)),
        description:
          type === 'mining' ? `Mining reward — ${plan} plan`
          : type === 'deposit' ? 'Simulated deposit'
          : type === 'referral' ? 'Referral bonus'
          : 'Withdrawal',
        status: type === 'withdrawal' && Math.random() > 0.5 ? 'pending' : 'completed',
      })
      txCount++
    }
  }
  console.log(`Seeded ${txCount} transactions`)

  console.log('\n✅ Seed complete!')
  console.log('Admin: admin@dogecoinmint.com / Admin0147')
  console.log('Demo:  demo@cryptomine.io  / demo1234')
}

seed().catch((err) => {
  console.error(err)
  process.exit(1)
})
