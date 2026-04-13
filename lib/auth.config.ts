import type { NextAuthConfig } from 'next-auth';

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: '/login',
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const pathname = nextUrl.pathname;

      const protectedRoutes = ['/dashboard', '/wallet', '/referrals', '/upgrade'];
      const adminRoutes = ['/admin'];
      const authRoutes = ['/login', '/signup'];

      const isProtectedRoute = protectedRoutes.some((r) => pathname.startsWith(r));
      const isAdminRoute = adminRoutes.some((r) => pathname.startsWith(r));
      const isAuthPage = authRoutes.includes(pathname);

      if (isAuthPage && isLoggedIn) {
        return Response.redirect(new URL('/dashboard', nextUrl));
      }

      if (isProtectedRoute && !isLoggedIn) {
        return Response.redirect(new URL('/login', nextUrl));
      }

      if (isAdminRoute) {
        if (!isLoggedIn) return Response.redirect(new URL('/login', nextUrl));
        const user = auth?.user as { isAdmin?: boolean } | undefined;
        if (!user?.isAdmin) return Response.redirect(new URL('/dashboard', nextUrl));
      }

      return true;
    },
    jwt({ token, user }) {
      if (user) {
        token.id = (user as { id?: string }).id ?? '';
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin ?? false;
        token.plan = (user as { plan?: string }).plan ?? 'free';
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.id as string;
      session.user.isAdmin = token.isAdmin as boolean;
      session.user.plan = token.plan as string;
      return session;
    },
  },
  providers: [],
  session: { strategy: 'jwt' },
};
