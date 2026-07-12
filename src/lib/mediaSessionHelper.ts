import { Capacitor } from '@capacitor/core';

// Helper to check if native
const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();

export async function updateMediaMetadata(track: { title: string; artistName: string; albumName?: string; coverImage?: string }) {
  if (typeof window === 'undefined') return;

  const displayArt = track.coverImage || '';
  let artUrl = displayArt;
  if (artUrl && artUrl.startsWith('/')) {
    artUrl = 'https://beato-music-app.vercel.app' + artUrl;
  }
  if (!artUrl || artUrl === 'undefined' || artUrl === 'null') {
    artUrl = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=512&auto=format&fit=crop&q=80';
  }

  // 1. Update web MediaSession if supported
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: track.title,
        artist: track.artistName,
        album: track.albumName || 'Beato',
        artwork: [
          { src: artUrl, sizes: '96x96', type: 'image/png' },
          { src: artUrl, sizes: '128x128', type: 'image/png' },
          { src: artUrl, sizes: '192x192', type: 'image/png' },
          { src: artUrl, sizes: '256x256', type: 'image/png' },
          { src: artUrl, sizes: '384x384', type: 'image/png' },
          { src: artUrl, sizes: '512x512', type: 'image/png' },
        ],
      });
    } catch (e) {
      console.warn('Web MediaSession metadata update failed:', e);
    }
  }

  // 2. Update Capgo MediaSession if native
  if (isNative) {
    try {
      const { MediaSession } = await import('@capgo/capacitor-media-session');
      await MediaSession.setMetadata({
        title: track.title,
        artist: track.artistName,
        album: track.albumName || 'Beato',
        artwork: [
          { src: artUrl, sizes: '512x512', type: 'image/png' }
        ]
      });
    } catch (e) {
      console.warn('Native MediaSession metadata update failed:', e);
    }
  }
}

export async function updateMediaPlaybackState(isPlaying: boolean) {
  if (typeof window === 'undefined') return;

  // 1. Web
  if ('mediaSession' in navigator) {
    navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
  }

  // 2. Native
  if (isNative) {
    try {
      const { MediaSession } = await import('@capgo/capacitor-media-session');
      await MediaSession.setPlaybackState({
        playbackState: isPlaying ? 'playing' : 'paused'
      });
    } catch (e) {
      console.warn('Native MediaSession playbackState update failed:', e);
    }
  }
}

export async function updateMediaPositionState(details: { duration: number; position: number; playbackRate?: number }) {
  if (typeof window === 'undefined') return;

  // 1. Web
  if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
    try {
      navigator.mediaSession.setPositionState({
        duration: details.duration || 0,
        position: details.position || 0,
        playbackRate: details.playbackRate || 1
      });
    } catch (e) {
      console.debug('Web setPositionState failed:', e);
    }
  }

  // 2. Native
  if (isNative) {
    try {
      const { MediaSession } = await import('@capgo/capacitor-media-session');
      await MediaSession.setPositionState({
        duration: details.duration || 0,
        position: details.position || 0,
        playbackRate: details.playbackRate || 1
      });
    } catch (e) {
      console.debug('Native MediaSession setPositionState failed:', e);
    }
  }
}
export function registerMediaActionHandlers(handlers: {
  onPlay: () => void;
  onPause: () => void;
  onPrevious: () => void;
  onNext: () => void;
  onSeekTo?: (time: number) => void;
}) {
  if (typeof window === 'undefined') return () => {};

  // Earbuds/Headphones multi-press detector (Double-press -> Next, Triple-press -> Prev)
  let lastPressTime = 0;
  let pressCount = 0;
  let resetTimeout: any = null;

  const handlePress = (action: 'play' | 'pause') => {
    const now = Date.now();
    const timeDiff = now - lastPressTime;
    lastPressTime = now;

    if (resetTimeout) {
      clearTimeout(resetTimeout);
    }

    if (timeDiff < 550) {
      pressCount++;
    } else {
      pressCount = 1;
    }

    resetTimeout = setTimeout(() => {
      pressCount = 0;
    }, 550);

    if (pressCount === 1) {
      if (action === 'play') {
        handlers.onPlay();
      } else {
        handlers.onPause();
      }
    } else if (pressCount === 2) {
      console.log('[MediaSession Interceptor] Double-click earbud -> Skip Next');
      handlers.onNext();
    } else if (pressCount >= 3) {
      console.log('[MediaSession Interceptor] Triple-click earbud -> Skip Previous');
      handlers.onPrevious();
    }
  };

  // 1. Web Handlers
  if ('mediaSession' in navigator) {
    try {
      navigator.mediaSession.setActionHandler('play', () => handlePress('play'));
      navigator.mediaSession.setActionHandler('pause', () => handlePress('pause'));
      navigator.mediaSession.setActionHandler('previoustrack', handlers.onPrevious);
      navigator.mediaSession.setActionHandler('nexttrack', handlers.onNext);
      if (handlers.onSeekTo) {
        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined && details.seekTime !== null) {
            handlers.onSeekTo!(details.seekTime);
          }
        });
      }
    } catch (e) {
      console.warn('Web setActionHandler failed:', e);
    }
  }

  // 2. Native Handlers
  let isCleanedUp = false;
  if (isNative) {
    (async () => {
      try {
        const { MediaSession } = await import('@capgo/capacitor-media-session');
        if (isCleanedUp) return;
        
        await MediaSession.setActionHandler({ action: 'play' }, () => {
          handlePress('play');
        });
        await MediaSession.setActionHandler({ action: 'pause' }, () => {
          handlePress('pause');
        });
        await MediaSession.setActionHandler({ action: 'previoustrack' }, () => {
          handlers.onPrevious();
        });
        await MediaSession.setActionHandler({ action: 'nexttrack' }, () => {
          handlers.onNext();
        });
        if (handlers.onSeekTo) {
          await MediaSession.setActionHandler({ action: 'seekto' }, (details) => {
            if (details.seekTime !== undefined && details.seekTime !== null) {
              handlers.onSeekTo!(details.seekTime);
            }
          });
        }
      } catch (e) {
        console.warn('Native MediaSession action handler registration failed:', e);
      }
    })();
  }
  return () => {
    isCleanedUp = true;
    if ('mediaSession' in navigator) {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('previoustrack', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
        navigator.mediaSession.setActionHandler('seekto', null);
      } catch (e) {}
    }
    
    if (isNative) {
      (async () => {
        try {
          const { MediaSession } = await import('@capgo/capacitor-media-session');
          await MediaSession.setActionHandler({ action: 'play' }, null);
          await MediaSession.setActionHandler({ action: 'pause' }, null);
          await MediaSession.setActionHandler({ action: 'previoustrack' }, null);
          await MediaSession.setActionHandler({ action: 'nexttrack' }, null);
          await MediaSession.setActionHandler({ action: 'seekto' }, null);
        } catch (e) {}
      })();
    }
  };
}
