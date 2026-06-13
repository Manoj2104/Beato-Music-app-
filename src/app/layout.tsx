import type { Metadata, Viewport } from 'next';
import { Inter, Outfit } from 'next/font/google';
import ClientToaster from '@/components/layout/ClientToaster';
import CapacitorInit from '@/components/layout/CapacitorInit';
import OfflineBanner from '@/components/layout/OfflineBanner';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

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

// Inline script to patch fetch BEFORE any bundle runs
// This runs synchronously in the browser, ensuring /api/* calls are always redirected
// to the real server when running inside a Capacitor native APK (static export mode).
const FETCH_PATCH_SCRIPT = `
(function() {
  if (window.__beatoFetchIntercepted) return;
  window.__beatoFetchIntercepted = true;
  var _origFetch = window.fetch;
  window.fetch = function(input, init) {
    if (typeof input === 'string' && input.startsWith('/api/')) {
      try {
        var proto = window.location.protocol;
        var host = window.location.hostname;
        // Detect Capacitor native: file: scheme, capacitor: scheme,
        // or served from localhost (Capacitor's internal static server)
        // but NOT when the dev server itself is on localhost (port 3000 = dev mode)
        var isLocalApp = proto === 'file:'
          || proto === 'capacitor:'
          || (host === 'localhost' && window.location.port !== '3000' && window.location.port !== '3001');
        var customBase = (window.localStorage && window.localStorage.getItem('beato_api_url')) || null;
        if (isLocalApp || customBase) {
          var base = (customBase || 'http://192.168.1.7:3000').replace(/\\/$/, '');
          input = base + input;
          
          if (base.indexOf('loca.lt') !== -1 || base.indexOf('localhost.run') !== -1) {
            init = init || {};
            var headers = init.headers;
            if (!headers) {
              headers = {};
            }
            if (typeof headers.set === 'function') {
              headers.set('Bypass-Tunnel-Reminder', 'true');
            } else if (Array.isArray(headers)) {
              headers.push(['Bypass-Tunnel-Reminder', 'true']);
            } else {
              headers['Bypass-Tunnel-Reminder'] = 'true';
            }
            init.headers = headers;
          }
        }
      } catch(e) {}
    }
    return _origFetch.call(this, input, init);
  };
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`} suppressHydrationWarning>
      <head>
        {/* Patch fetch synchronously before ANY bundle loads — critical for native APK mode */}
        <script dangerouslySetInnerHTML={{ __html: FETCH_PATCH_SCRIPT }} />
      </head>
      <body className="bg-ss-bg text-white antialiased">
        <CapacitorInit />
        <OfflineBanner />
        {children}
        <ClientToaster />
      </body>
    </html>
  );
}

