import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
    error: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const user = auth?.user as { isAdmin?: boolean; isFrozen?: boolean; email?: string } | undefined;
      const isFrozen = user?.isFrozen ?? false;

      const protectedRoutes = ['/dashboard', '/wallet', '/referrals', '/upgrade'];
      const adminRoutes = ['/admin'];
      const authRoutes = ['/login', '/signup'];
      const frozenBlockedRoutes = ['/referrals', '/upgrade'];

      const isProtectedRoute = protectedRoutes.some((r) => pathname.startsWith(r));
      const isAdminRoute = adminRoutes.some((r) => pathname.startsWith(r));
      const isAuthPage = authRoutes.includes(pathname);

      if (isLoggedIn && isFrozen && frozenBlockedRoutes.some((r) => pathname.startsWith(r))) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      if (isProtectedRoute && !isLoggedIn) {
        return Response.redirect(new URL('/login', nextUrl));
      }

      if (isAdminRoute) {
        if (!isLoggedIn) return Response.redirect(new URL('/login', nextUrl));
        if (!user?.isAdmin) return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id ?? '';
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
        token.plan = (user as { plan?: string }).plan ?? 'free';
        token.isVerified = user.isVerified ?? true;
        token.isFrozen = (user as { isFrozen?: boolean }).isFrozen ?? false;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.isAdmin = token.isAdmin as boolean;
      session.user.plan = token.plan as string;
      session.user.isVerified = token.isVerified as boolean;
      session.user.isFrozen = token.isFrozen as boolean;
      return session;
    },
  },
  providers: [],
  session: { strategy: 'jwt' },
};
