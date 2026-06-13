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
