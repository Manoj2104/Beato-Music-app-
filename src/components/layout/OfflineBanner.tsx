'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { WifiOff, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export default function OfflineBanner() {
  const isOnline = useNetworkStatus();
  const router = useRouter();

  if (isOnline) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -50, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -50, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-[100] bg-red-600 text-white shadow-lg cursor-pointer"
        onClick={() => router.push('/downloads')}
      >
        <div className="flex items-center justify-between px-4 py-3 md:justify-center md:gap-4">
          <div className="flex items-center gap-3">
            <WifiOff size={18} className="animate-pulse" />
            <div>
              <p className="text-sm font-semibold">You're Offline</p>
              <p className="text-xs text-white/80">Tap to go to Downloads</p>
            </div>
          </div>
          <ChevronRight size={20} className="md:hidden opacity-80" />
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
