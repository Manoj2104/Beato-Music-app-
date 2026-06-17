'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { SplashScreen } from '@capacitor/splash-screen';
import { Music } from 'lucide-react';

export default function AppSplashScreen() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setShow(true);
      setMounted(true);

      // Hide the native Android splash screen immediately so our animated React splash screen takes over
      SplashScreen.hide().catch((err) => {
        console.warn('Capacitor native splash hide error:', err);
      });

      // Keep React splash visible for 2.5 seconds, then trigger fade out
      const fadeTimeout = setTimeout(() => {
        setShow(false);
      }, 2500);

      // Unmount splash screen after fade transition finishes (3.0s total)
      const unmountTimeout = setTimeout(() => {
        setMounted(false);
      }, 3000);

      return () => {
        clearTimeout(fadeTimeout);
        clearTimeout(unmountTimeout);
      };
    }
  }, []);

  if (!mounted) return null;

  const G = '#b08850'; // Beato Signature Gold

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999, // Render on top of everything, including modals
        backgroundColor: '#16120e', // Premium dark background
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: show ? 1 : 0,
        visibility: show ? 'visible' : 'hidden',
        transition: 'opacity 0.5s ease, visibility 0.5s ease',
        fontFamily: 'Outfit, sans-serif',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes splashPulse {
          0% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 0 0 rgba(176, 136, 80, 0.3); }
          50% { transform: scale(1.05); opacity: 1; box-shadow: 0 0 35px 15px rgba(176, 136, 80, 0.5); }
          100% { transform: scale(0.95); opacity: 0.8; box-shadow: 0 0 0 0 rgba(176, 136, 80, 0.3); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes barGrow {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      ` }} />

      {/* Floating Logo Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        animation: 'float 4s ease-in-out infinite',
      }}>
        {/* Animated Gold Circle Icon */}
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #b08850 0%, #8c6633 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          animation: 'splashPulse 2.5s infinite ease-in-out',
        }}>
          <Music size={40} color="#000000" strokeWidth={2.5} />
        </div>

        {/* Text Details */}
        <div style={{ textAlign: 'center' }}>
          <h1 style={{
            fontSize: 36,
            fontWeight: 900,
            color: '#fbf9f5',
            margin: 0,
            letterSpacing: '0.05em',
            textShadow: '0 2px 10px rgba(176, 136, 80, 0.3)',
          }}>
            BEATO
          </h1>
          <p style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#87786c',
            margin: '6px 0 0',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
          }}>
            Your Universe of Sound
          </p>
        </div>
      </div>

      {/* Clean Bottom Progress Bar */}
      <div style={{
        position: 'absolute',
        bottom: 80,
        width: 140,
        height: 3,
        borderRadius: 10,
        background: 'rgba(255, 255, 255, 0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #b08850, #ebdcb9)',
          borderRadius: 10,
          animation: 'barGrow 2.3s ease-out forwards',
        }} />
      </div>
    </div>
  );
}
