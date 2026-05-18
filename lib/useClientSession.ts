'use client'
import { useEffect, useState } from 'react'

interface SessionUser {
  id: string
  email: string
  username: string
  name: string
  isAdmin: boolean
  plan: string
  isFrozen: boolean
  status: string
}

type SessionStatus = 'loading' | 'authenticated' | 'unauthenticated'

export function useSession() {
  const [data, setData] = useState<{ user: SessionUser } | null>(null)
  const [status, setStatus] = useState<SessionStatus>('loading')

  useEffect(() => {
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(d => {
        if (d.user) {
          setData({ user: d.user })
          setStatus('authenticated')
        } else {
          setData(null)
          setStatus('unauthenticated')
        }
      })
      .catch(() => {
        setData(null)
        setStatus('unauthenticated')
      })
  }, [])

  return { data, status }
}

export async function signOut(options?: { callbackUrl?: string }) {
  await fetch('/api/auth/logout', { method: 'POST' })
  window.location.href = options?.callbackUrl ?? '/login'
}
