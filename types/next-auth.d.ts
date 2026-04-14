import type { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      isAdmin: boolean;
      plan: string;
      isVerified: boolean;
    } & DefaultSession['user'];
  }

  interface User {
    id: string;
    isAdmin: boolean;
    plan: string;
    isVerified: boolean;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    isAdmin: boolean;
    plan: string;
    isVerified: boolean;
  }
}
