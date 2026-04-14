import NextAuth from 'next-auth';
import { authConfig } from '@/lib/auth.config';

const { auth } = NextAuth(authConfig);

export { auth as proxy };

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/wallet/:path*',
    '/referrals/:path*',
    '/upgrade/:path*',
    '/admin/:path*',
    '/login',
    '/signup',
    '/verify-email',
  ],
};
