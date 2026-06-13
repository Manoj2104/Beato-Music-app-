import { useState, useEffect } from 'react';
import { Network, ConnectionStatus } from '@capacitor/network';
import { Capacitor } from '@capacitor/core';

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState<boolean>(true);

  useEffect(() => {
    // Initial status
    if (Capacitor.isNativePlatform()) {
      Network.getStatus().then((status: ConnectionStatus) => {
        setIsOnline(status.connected);
      });
    } else {
      setIsOnline(navigator.onLine);
    }

    // Capacitor Native Listener
    let networkListener: any = null;
    if (Capacitor.isNativePlatform()) {
      Network.addListener('networkStatusChange', (status) => {
        setIsOnline(status.connected);
      }).then(listener => {
        networkListener = listener;
      });
    }

    // Web Fallback Listeners
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      if (networkListener) {
        networkListener.remove();
      }
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
