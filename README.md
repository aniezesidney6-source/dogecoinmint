# CryptoMine

A production-ready crypto mining simulation SaaS with real Dogecoin network data.

**Admin login:** `admin@cryptomine.io` / `admin123`  
**Demo login:** `demo@cryptomine.io` / `demo1234`

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure .env.local (already present)
# Add your MongoDB Atlas URI, whitelist your IP in Atlas Network Access

# 3. Seed the database
npm run seed

# 4. Run development server
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## Tech Stack

Next.js 16 · MongoDB Atlas + Mongoose · NextAuth v5 · Tailwind CSS v4 · Recharts · CoinGecko API

## Architecture

- `app/(auth)/` — Login, Signup
- `app/(app)/` — Dashboard, Wallet, Referrals, Upgrade, Admin (with sidebar)
- `app/api/` — All API routes (auth, user, wallet, admin, cron, market)
- `lib/` — DB, auth, mining engine, constants
- `models/` — Mongoose schemas (User, Transaction, Withdrawal, MarketCache)
- `proxy.ts` — Route protection (Next.js 16 proxy convention)
- `scripts/seed.ts` — Database seeder

## Cron Job

`vercel.json` runs `/api/cron/mine` every 2 minutes. The endpoint requires `Authorization: Bearer <CRON_SECRET>`.

---

_Original scaffold:_



```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
