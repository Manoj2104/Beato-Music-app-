import type { Metadata, Viewport } from 'next';
import ClientToaster from '@/components/layout/ClientToaster';
import CapacitorInit from '@/components/layout/CapacitorInit';
import OfflineBanner from '@/components/layout/OfflineBanner';
import AppSplashScreen from '@/components/layout/AppSplashScreen';
import './globals.css';

export const viewport: Viewport = {
  themeColor: '#000000',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export const metadata: Metadata = {
  title: 'Beato — Music for Everyone',
  description: 'Stream 100M+ songs, podcasts, and audiobooks. Discover new music with AI-powered recommendations. Beato — your universe of sound.',
  keywords: ['music streaming', 'songs', 'playlists', 'podcasts', 'Beato'],
  openGraph: {
    title: 'Beato — Music for Everyone',
    description: 'Stream millions of songs with Beato',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className="bg-ss-bg text-ss-text-primary antialiased">
        <AppSplashScreen />
        <CapacitorInit />
        <OfflineBanner />
        {children}
        <ClientToaster />
      </body>
    </html>
  );
}

