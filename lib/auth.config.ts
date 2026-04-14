import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;
      const user = auth?.user as { isAdmin?: boolean; isVerified?: boolean; email?: string } | undefined;
      // Pre-existing users have no isVerified field — treat as verified
      const isVerified = user?.isVerified ?? true;

      const protectedRoutes = ['/dashboard', '/wallet', '/referrals', '/upgrade'];
      const adminRoutes = ['/admin'];
      const authRoutes = ['/login', '/signup'];

      const isProtectedRoute = protectedRoutes.some((r) => pathname.startsWith(r));
      const isAdminRoute = adminRoutes.some((r) => pathname.startsWith(r));
      const isAuthPage = authRoutes.includes(pathname);

      // Verified logged-in users don't need the verify-email page
      if (pathname === '/verify-email' && isLoggedIn && isVerified) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      // Unverified users can only access /verify-email; redirect all protected routes
      if (isLoggedIn && !isVerified && isProtectedRoute) {
        const url = new URL('/verify-email', nextUrl);
        if (user?.email) url.searchParams.set('email', user.email);
        return Response.redirect(url);
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
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.isAdmin = token.isAdmin as boolean;
      session.user.plan = token.plan as string;
      session.user.isVerified = token.isVerified as boolean;
      return session;
    },
  },
  providers: [],
  session: { strategy: 'jwt' },
};
