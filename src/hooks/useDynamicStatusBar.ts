import { useEffect } from 'react';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { usePathname } from 'next/navigation';

/**
 * Custom hook to dynamically adjust the status bar style based on the background color
 * of the top-most element in the view.
 */
export function useDynamicStatusBar() {
  const pathname = usePathname();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    // Helper to calculate luminance from rgb
    const getLuminance = (r: number, g: number, b: number) => {
      const a = [r, g, b].map(function (v) {
        v /= 255;
        return v <= 0.03928
          ? v / 12.92
          : Math.pow((v + 0.055) / 1.055, 2.4);
      });
      return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
    };

    const updateStatusBarStyle = async () => {
      try {
        // Find the element at the top of the viewport
        // Safe area top is usually 24px - 48px, so checking around y = 50px is a safe bet for what lies behind status bar
        const xCoordinate = window.innerWidth / 2;
        const yCoordinate = 50; 
        let topEl = document.elementFromPoint(xCoordinate, yCoordinate);
        
        let bg = 'rgba(0, 0, 0, 0)';
        
        // Walk up the DOM to find the first non-transparent background color
        while (topEl) {
          const computedStyle = window.getComputedStyle(topEl);
          const currentBg = computedStyle.backgroundColor;
          if (currentBg && currentBg !== 'transparent' && currentBg !== 'rgba(0, 0, 0, 0)') {
            bg = currentBg;
            break;
          }
          topEl = topEl.parentElement;
        }

        // If no background color found, fall back to main content background
        if (bg === 'rgba(0, 0, 0, 0)') {
          const mainEl = document.getElementById('main-content');
          if (mainEl) {
            const computedStyle = window.getComputedStyle(mainEl);
            bg = computedStyle.backgroundColor || '#0a0a0a';
          } else {
            bg = '#0a0a0a';
          }
        }

        let isLight = false;

        // Parse rgba(r, g, b, a) or rgb(r, g, b) or hex colors
        const match = bg.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (match) {
          const r = parseInt(match[1], 10);
          const g = parseInt(match[2], 10);
          const b = parseInt(match[3], 10);
          const luminance = getLuminance(r, g, b);
          
          // Threshold for light/dark background.
          // Since it's a dark theme app, most backgrounds are dark (luminance < 0.5)
          isLight = luminance > 0.5;
        } else if (bg.startsWith('#')) {
          const hex = bg.replace('#', '');
          const r = parseInt(hex.substring(0, 2), 16);
          const g = parseInt(hex.substring(2, 4), 16);
          const b = parseInt(hex.substring(4, 6), 16);
          const luminance = getLuminance(r, g, b);
          isLight = luminance > 0.5;
        }

        // If background is light, we want dark icons (Style.Light).
        // If background is dark, we want light icons (Style.Dark).
        const style = isLight ? Style.Light : Style.Dark;
        
        await StatusBar.setStyle({ style });
      } catch (err) {
        console.warn('Failed to update status bar style dynamically:', err);
      }
    };

    // Run on mount, navigation, and set up a scroll listener on main-content if needed
    updateStatusBarStyle();
    
    // Give time for layout shifts
    const t = setTimeout(updateStatusBarStyle, 500);

    const mainEl = document.getElementById('main-content');
    if (mainEl) {
      // Debounce scroll listener
      let scrollTimeout: any;
      const handleScroll = () => {
        if (scrollTimeout) clearTimeout(scrollTimeout);
        scrollTimeout = setTimeout(updateStatusBarStyle, 100);
      };
      mainEl.addEventListener('scroll', handleScroll, { passive: true });
      
      return () => {
        clearTimeout(t);
        if (scrollTimeout) clearTimeout(scrollTimeout);
        mainEl.removeEventListener('scroll', handleScroll);
      };
    }
    
    return () => clearTimeout(t);
  }, [pathname]);
}
