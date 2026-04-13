import { ConvexHttpClient } from 'convex/browser'

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL!
export const convex = new ConvexHttpClient(convexUrl)
