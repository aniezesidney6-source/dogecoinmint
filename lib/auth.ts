import NextAuth, { CredentialsSignin } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { convex } from './convex'
import { api } from '@/convex/_generated/api'
import { authConfig } from './auth.config'

class AccountBannedError extends CredentialsSignin {
  code = 'AccountBanned'
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const user = await convex.query(api.users.getUserByEmail, {
          email: String(credentials.email).toLowerCase(),
        })
        if (!user) return null

        if (user.status === 'banned') throw new AccountBannedError()

        const valid = await bcrypt.compare(String(credentials.password), user.password)
        if (!valid) return null

        return {
          id: user._id,
          email: user.email,
          name: user.username,
          isAdmin: user.isAdmin,
          plan: user.plan,
          isVerified: user.isVerified ?? true,
          isFrozen: user.status === 'frozen',
        }
      },
    }),
  ],
})
