'use client';

import { useEffect } from 'react';
import { socketManager, SocketEvent, EventHandler } from './socket';

export function useSocket(event: SocketEvent, handler: EventHandler): void {
  useEffect(() => {
    if (!socketManager) return;
    return socketManager.on(event, handler);
  }, [event, handler]);
}
