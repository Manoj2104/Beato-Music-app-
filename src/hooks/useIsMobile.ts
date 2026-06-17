import { useState, useEffect } from 'react';

// ⚡ Module-level cached value — avoids N separate resize listeners across components.
// Updated once on resize; all hook instances read the same value.
let _cachedIsMobile: boolean | null = null;
const _listeners = new Set<(v: boolean) => void>();

function _getIsMobile() {
  if (typeof window === 'undefined') return false;
  return window.innerWidth <= 768;
}

if (typeof window !== 'undefined') {
  window.addEventListener('resize', () => {
    const next = _getIsMobile();
    if (next !== _cachedIsMobile) {
      _cachedIsMobile = next;
      _listeners.forEach(fn => fn(next));
    }
  }, { passive: true });
}

/**
 * ⚡ Optimized isMobile hook — shares ONE resize listener across ALL components.
 * Previously each page/component registered its own listener.
 */
export function useIsMobile(): boolean {
  const [isMobile, setIsMobile] = useState<boolean>(() => {
    if (_cachedIsMobile === null) {
      _cachedIsMobile = _getIsMobile();
    }
    return _cachedIsMobile;
  });

  useEffect(() => {
    // Sync in case window size changed between render and mount
    const current = _getIsMobile();
    if (current !== isMobile) setIsMobile(current);

    _listeners.add(setIsMobile);
    return () => { _listeners.delete(setIsMobile); };
  }, []);

  return isMobile;
}
