import type { Metadata } from 'next';
import { Space_Grotesk, Space_Mono } from 'next/font/google';
import './globals.css';
import { SessionProvider } from 'next-auth/react';
import { ToastProvider } from '@/components/ToastProvider';
import { ConvexClientProvider } from '@/components/ConvexClientProvider';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const spaceMono = Space_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-space-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'DogecoinMint — Mine. Earn. Repeat.',
  description: 'Cloud-based Dogecoin mining simulation with real network data, referral rewards, and instant payouts.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${spaceMono.variable}`}>
      <body
        style={{
          background: '#050810',
          color: '#ffffff',
          fontFamily: 'var(--font-space-grotesk, "Space Grotesk", sans-serif)',
        }}
      >
        <ConvexClientProvider>
          <SessionProvider>
            <ToastProvider>{children}</ToastProvider>
          </SessionProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
