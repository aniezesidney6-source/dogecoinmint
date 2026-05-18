import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'

export async function getSession() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('auth-token')?.value
    if (!token) return null

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET)
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}
