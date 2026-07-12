import { useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export function useGestureControls(
  isPlaying: boolean,
  togglePlay: () => void,
  playNext: () => void,
  isEnabled: boolean,
  setIsEnabled: (val: boolean) => void
) {
  const lastShakeTime = useRef(0);
  const lastTapTime = useRef(0);

  const requestPermission = async (): Promise<boolean> => {
    if (
      typeof window !== 'undefined' &&
      typeof (DeviceMotionEvent as any) !== 'undefined' &&
      typeof (DeviceMotionEvent as any).requestPermission === 'function'
    ) {
      try {
        const permissionState = await (DeviceMotionEvent as any).requestPermission();
        return permissionState === 'granted';
      } catch (error) {
        console.error('DeviceMotion permission request failed:', error);
        return false;
      }
    }
    return true; // Auto-grant on Android/desktop if supported
  };

  useEffect(() => {
    if (!isEnabled) return;

    let lastX: number | null = null;
    let lastY: number | null = null;
    let lastZ: number | null = null;
    
    // Tweak thresholds for pocket vs head-mount scenarios
    const SHAKE_THRESHOLD = 20; 
    const TAP_THRESHOLD = 12;

    const handleMotion = (event: DeviceMotionEvent) => {
      const acc = event.accelerationIncludingGravity;
      if (!acc) return;

      const x = acc.x || 0;
      const y = acc.y || 0;
      const z = acc.z || 0;

      if (lastX !== null && lastY !== null && lastZ !== null) {
        const deltaX = Math.abs(x - lastX);
        const deltaY = Math.abs(y - lastY);
        const deltaZ = Math.abs(z - lastZ);

        const now = Date.now();

        // 1. Shake Detection (X/Y plane motion) -> Next Track
        if (deltaX + deltaY > SHAKE_THRESHOLD && now - lastShakeTime.current > 1800) {
          lastShakeTime.current = now;
          console.log('[GestureControl] Shake detected -> Next track');
          toast.success('Gesture Skip: Next Track ⏭️', { id: 'shake-toast' });
          playNext();
        }

        // 2. Head-Nod/Tap detection (sudden Z axis acceleration spike) -> Play/Pause
        else if (deltaZ > TAP_THRESHOLD && now - lastTapTime.current > 1500 && now - lastShakeTime.current > 1800) {
          lastTapTime.current = now;
          console.log('[GestureControl] Tap/Nod detected -> Toggle play/pause');
          toast.success(isPlaying ? 'Gesture Pause ⏸️' : 'Gesture Play ▶️', { id: 'tap-toast' });
          togglePlay();
        }
      }

      lastX = x;
      lastY = y;
      lastZ = z;
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('devicemotion', handleMotion);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('devicemotion', handleMotion);
      }
    };
  }, [isEnabled, isPlaying, togglePlay, playNext]);

  const toggleGestures = async () => {
    if (!isEnabled) {
      const granted = await requestPermission();
      if (granted) {
        setIsEnabled(true);
        toast.success('Gesture Controls Active! (Nod/Double-tap phone: Play/Pause, Shake: Skip) 🎧');
      } else {
        toast.error('Motion sensor access is required for gesture control 🛑');
      }
    } else {
      setIsEnabled(false);
      toast.success('Gesture & Head controls disabled 🎧');
    }
  };

  return { toggleGestures };
}
