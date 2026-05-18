import { ConvexHttpClient } from 'convex/browser'

let _convex: ConvexHttpClient | null = null

export function getConvex() {
  if (!_convex) {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL
    if (!url) throw new Error('NEXT_PUBLIC_CONVEX_URL is not defined')
    _convex = new ConvexHttpClient(url)
  }
  return _convex
}

export const convex = new Proxy({} as ConvexHttpClient, {
  get(_, prop) {
    return (getConvex() as any)[prop].bind(getConvex())
  }
})
