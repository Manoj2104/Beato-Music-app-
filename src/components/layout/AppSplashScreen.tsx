'use client';

import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Music } from 'lucide-react';

export default function AppSplashScreen() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setShow(true);
      setMounted(true);

      // Hide the native Android splash screen immediately so our animated React splash screen takes over
      // We load it dynamically here to prevent any server-side rendering (SSR) runtime exceptions
      import('@capacitor/splash-screen')
        .then(({ SplashScreen }) => {
          SplashScreen.hide().catch((err) => {
            console.warn('Capacitor native splash hide error:', err);
          });
        })
        .catch((err) => {
          console.error('Failed to load Capacitor SplashScreen dynamically:', err);
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
        backgroundColor: '#fbf9f5', // Warm light beige matching the Home page
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
        @keyframes logoEntrance {
          0% { transform: scale(0.5) translateY(40px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes pulseGlow {
          0% { transform: scale(1); box-shadow: 0 10px 30px rgba(15, 81, 50, 0.08); }
          50% { transform: scale(1.04); box-shadow: 0 15px 40px rgba(15, 81, 50, 0.2); }
          100% { transform: scale(1); box-shadow: 0 10px 30px rgba(15, 81, 50, 0.08); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
          100% { transform: translateY(0px); }
        }
        @keyframes textEntrance {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
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
        gap: 28,
        animation: 'float 4s ease-in-out infinite',
      }}>
        {/* Animated App Logo Image */}
        <div style={{
          width: 110,
          height: 110,
          borderRadius: 24,
          overflow: 'hidden',
          backgroundColor: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 30px rgba(15, 81, 50, 0.08)',
          animation: 'logoEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, pulseGlow 3s infinite ease-in-out 0.8s',
        }}>
          <img 
            src="/logo.png" 
            alt="Beato Logo" 
            style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
          />
        </div>

        {/* Text Details */}
        <div style={{ 
          textAlign: 'center',
          animation: 'textEntrance 0.8s ease-out 0.3s forwards',
          opacity: 0,
        }}>
          <h1 style={{
            fontSize: 32,
            fontWeight: 950,
            color: '#0f5132', // Deep green matching logo theme
            margin: 0,
            letterSpacing: '0.08em',
            fontFamily: 'Outfit, sans-serif',
            textShadow: '0 2px 10px rgba(15, 81, 50, 0.1)',
          }}>
            BEATO
          </h1>
          <p style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#87786c',
            margin: '6px 0 0',
            letterSpacing: '0.2em',
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
        height: 3.5,
        borderRadius: 10,
        background: 'rgba(15, 81, 50, 0.08)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          background: 'linear-gradient(90deg, #0f5132, #10b981)', // matching theme green
          borderRadius: 10,
          animation: 'barGrow 2.3s ease-out forwards',
        }} />
      </div>
    </div>
  );
}
