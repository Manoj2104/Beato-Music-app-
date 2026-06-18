'use client';

import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useDynamicStatusBar } from '@/hooks/useDynamicStatusBar';
import { useRouter } from 'next/navigation';

export default function CapacitorInit() {
  useDynamicStatusBar();
  const router = useRouter();

  useEffect(() => {
    // Clean up local testing server URL if present
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('beato_api_url');
      if (stored && (stored.includes('192.168.') || stored.includes('localhost') || stored.includes('/login'))) {
        window.localStorage.removeItem('beato_api_url');
      }
    }

    // Set custom safe-area top and bottom CSS variables for mobile layout scaling
    if (typeof window !== 'undefined') {
      if (Capacitor.isNativePlatform()) {
        if (Capacitor.getPlatform() === 'android') {
          // Initial safe defaults
          document.documentElement.style.setProperty('--sat', '44px');
          document.documentElement.style.setProperty('--sab', '0px');
          
          // Query dynamic status bar height
          StatusBar.getInfo().then(info => {
            if (info && typeof info.height === 'number' && info.height > 0) {
              document.documentElement.style.setProperty('--sat', `${info.height}px`);
            }
          }).catch(err => {
            console.warn('Failed to get dynamic status bar height:', err);
          });
        } else {
          document.documentElement.style.setProperty('--sat', 'env(safe-area-inset-top, 44px)');
          document.documentElement.style.setProperty('--sab', 'env(safe-area-inset-bottom, 0px)');
        }
      } else {
        document.documentElement.style.setProperty('--sat', '0px');
        document.documentElement.style.setProperty('--sab', '0px');
      }
    }

    // Patch fetch dynamically so relative /api/* requests are routed to the remote server
    // this must run after Capacitor has loaded and patched window.fetch (so we wrap Capacitor's patch)
    if (typeof window !== 'undefined' && !(window as any).__beatoFetchIntercepted) {
      (window as any).__beatoFetchIntercepted = true;
      const _origFetch = window.fetch;
      window.fetch = function (input, init) {
        if (typeof input === 'string' && input.startsWith('/api/')) {
          try {
            const authStoreData = window.localStorage.getItem('beato-auth');
            if (authStoreData) {
              const parsed = JSON.parse(authStoreData);
              const token = parsed?.state?.token;
              if (token && token !== 'secure-session-active' && token !== 'mock-session-active') {
                init = init || {};
                let headers = init.headers;
                if (!headers) {
                  headers = {};
                }
                if (typeof (headers as any).set === 'function') {
                  (headers as any).set('Authorization', `Bearer ${token}`);
                } else if (Array.isArray(headers)) {
                  const authIdx = headers.findIndex(h => h[0].toLowerCase() === 'authorization');
                  if (authIdx !== -1) {
                    headers[authIdx][1] = `Bearer ${token}`;
                  } else {
                    headers.push(['Authorization', `Bearer ${token}`]);
                  }
                } else {
                  (headers as any)['Authorization'] = `Bearer ${token}`;
                }
                init.headers = headers;
              }
            }
          } catch (e) {
            console.error('Failed to inject Authorization token in fetch patch:', e);
          }

          try {
            const proto = window.location.protocol;
            const host = window.location.hostname;
            const isLocalApp = proto === 'file:'
              || proto === 'capacitor:'
              || ((host === 'localhost' || host === '127.0.0.1') && window.location.port !== '3000' && window.location.port !== '3001');
            const customBase = window.localStorage.getItem('beato_api_url') || null;
            if (isLocalApp || customBase) {
              const base = (customBase || 'https://beato-music-app.vercel.app').replace(/\/$/, '');
              input = base + input;
              
              if (base.indexOf('loca.lt') !== -1 || base.indexOf('localhost.run') !== -1) {
                init = init || {};
                let headers = init.headers;
                if (!headers) {
                  headers = {};
                }
                if (typeof (headers as any).set === 'function') {
                  (headers as any).set('Bypass-Tunnel-Reminder', 'true');
                } else if (Array.isArray(headers)) {
                  headers.push(['Bypass-Tunnel-Reminder', 'true']);
                } else {
                  (headers as any)['Bypass-Tunnel-Reminder'] = 'true';
                }
                init.headers = headers;
              }
            }
          } catch (e) {
            console.error('Failed to rewrite fetch URL in Capacitor patch:', e);
          }
        }
        return _origFetch.call(this, input, init);
      };
    }

    const initStatusBar = async () => {
      if (Capacitor.isNativePlatform()) {
        try {
          // Make status bar overlay the app content (transparent/edge-to-edge)
          // This lets the page gradient bleed through the status bar area
          await StatusBar.setOverlaysWebView({ overlay: true });
          await StatusBar.setBackgroundColor({ color: '#00000000' });

          // White icons on dark/gradient background
          await StatusBar.setStyle({ style: Style.Dark });

          // Ensure the status bar is visible
          await StatusBar.show();
        } catch (error) {
          console.warn('Failed to initialize status bar style:', error);
        }
      }
    };

    initStatusBar();
    const t1 = setTimeout(initStatusBar, 500);
    const t2 = setTimeout(initStatusBar, 1500);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let backListener: any = null;
    
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack || window.location.pathname === '/') {
        App.minimizeApp();
      } else {
        router.back();
      }
    }).then(listener => {
      backListener = listener;
    });

    return () => {
      if (backListener) {
        backListener.remove();
      }
    };
  }, [router]);

  return null;
}
