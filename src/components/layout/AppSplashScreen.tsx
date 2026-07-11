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

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 999999, // Render on top of everything, including modals
        backgroundColor: '#ffffff', // Clean white background
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: show ? 1 : 0,
        visibility: show ? 'visible' : 'hidden',
        transition: 'opacity 0.5s ease, visibility 0.5s ease',
        fontFamily: 'Outfit, sans-serif',
        overflow: 'hidden',
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
        @keyframes wave-move {
          0% { transform: translateX(0) translateZ(0) scaleY(1); }
          50% { transform: translateX(-25%) translateZ(0) scaleY(0.85); }
          100% { transform: translateX(-50%) translateZ(0) scaleY(1); }
        }
        @keyframes wave-rise {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        @keyframes bobbing {
          0%, 100% { transform: translate(-50%, 0); }
          50% { transform: translate(-50%, -15px); }
        }
        @keyframes breath {
          0%, 100% { scale: 1; }
          50% { scale: 1.15; }
        }
        @keyframes text-breathe-in {
          0%, 100% { opacity: 1; }
          45%, 55% { opacity: 0; }
          50% { opacity: 0; }
        }
        @keyframes text-breathe-out {
          0%, 100% { opacity: 0; }
          45%, 55% { opacity: 0; }
          50% { opacity: 1; }
        }
      ` }} />

      {/* Floating Logo Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 24,
        marginTop: '-15vh',
        animation: 'float 4s ease-in-out infinite',
        zIndex: 2,
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

      {/* Liquid Wave Background at Bottom */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '42vh',
        overflow: 'hidden',
        animation: 'wave-rise 1.5s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        zIndex: 1,
      }}>
        {/* Wave 1 (Back) */}
        <svg style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '200%',
          height: '100%',
          fill: '#064e3b', // Deep green
          opacity: 0.35,
          animation: 'wave-move 9s linear infinite',
        }} viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,60 C150,100 350,20 500,60 C650,100 850,20 1000,60 C1150,100 1350,20 1500,60 L1500,120 L0,120 Z" />
        </svg>

        {/* Wave 2 (Front) */}
        <svg style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '200%',
          height: '92%',
          fill: '#0f5132', // Main green
          animation: 'wave-move 6s linear infinite reverse',
        }} viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,50 C150,10 300,90 450,50 C600,10 750,90 900,50 C1050,10 1200,90 1350,50 L1350,120 L0,120 Z" />
        </svg>
        
        {/* Wave 3 (Accent) */}
        <svg style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width: '200%',
          height: '85%',
          fill: '#10b981', // Emerald green accent
          opacity: 0.25,
          animation: 'wave-move 12s linear infinite',
        }} viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,70 C200,30 400,110 600,70 C800,30 1000,110 1200,70 L1200,120 L0,120 Z" />
        </svg>

        {/* Floating breathing music emoji */}
        <div style={{
          position: 'absolute',
          bottom: '18vh',
          left: '50%',
          transform: 'translateX(-50%)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          zIndex: 10,
          animation: 'bobbing 3s ease-in-out infinite',
        }}>
          {/* Cute Music Smiley Bubble */}
          <div style={{
            width: 75,
            height: 75,
            borderRadius: '50%',
            backgroundColor: '#ffffff',
            boxShadow: '0 8px 24px rgba(6, 78, 59, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            animation: 'breath 6s ease-in-out infinite',
          }}>
            {/* Music note background icon */}
            <Music size={32} color="#10b981" style={{ opacity: 0.25, position: 'absolute' }} />
            
            {/* Cute Closed Eyes & Smile */}
            <svg width="45" height="25" viewBox="0 0 45 25" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ zIndex: 2 }}>
              {/* Left Eye (closed curve) */}
              <path d="M10,8 Q15,13 20,8" stroke="#0f5132" strokeWidth="3" strokeLinecap="round" fill="none" />
              {/* Right Eye (closed curve) */}
              <path d="M25,8 Q30,13 35,8" stroke="#0f5132" strokeWidth="3" strokeLinecap="round" fill="none" />
              {/* Cute Smile */}
              <path d="M19,16 Q22.5,20 26,16" stroke="#0f5132" strokeWidth="3" strokeLinecap="round" fill="none" />
            </svg>
          </div>

          {/* Floating Text Indicator Container */}
          <div style={{ position: 'relative', height: 20, marginTop: 14, width: 150, textAlign: 'center' }}>
            <span style={{
              position: 'absolute',
              inset: 0,
              fontSize: 12,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              animation: 'text-breathe-in 6s infinite',
            }}>
              Breathe in...
            </span>
            <span style={{
              position: 'absolute',
              inset: 0,
              fontSize: 12,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.15em',
              textTransform: 'uppercase',
              textShadow: '0 2px 4px rgba(0,0,0,0.2)',
              animation: 'text-breathe-out 6s infinite',
            }}>
              Breathe out...
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
