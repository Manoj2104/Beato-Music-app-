'use client';
import { useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { Music2 } from 'lucide-react';

export default function AppSplashScreen() {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      setShow(true);
      setMounted(true);

      import('@capacitor/splash-screen')
        .then(({ SplashScreen }) => {
          SplashScreen.hide().catch((err) => {
            console.warn('Capacitor native splash hide error:', err);
          });
        })
        .catch((err) => {
          console.error('Failed to load Capacitor SplashScreen dynamically:', err);
        });

      const fadeTimeout = setTimeout(() => setShow(false), 2700);
      const unmountTimeout = setTimeout(() => setMounted(false), 3200);

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
        zIndex: 999999,
        backgroundColor: '#ffffff', // pure white
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: show ? 1 : 0,
        visibility: show ? 'visible' : 'hidden',
        transition: 'opacity 0.6s ease, visibility 0.6s ease',
        fontFamily: 'Outfit, sans-serif',
        overflow: 'hidden',
      }}
    >
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes logoEntrance {
          0% { transform: scale(0.4) translateY(40px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
        @keyframes pulseGlow {
          0% { box-shadow: 0 10px 30px rgba(15, 81, 50, 0.12); }
          50% { box-shadow: 0 15px 45px rgba(15, 81, 50, 0.28); }
          100% { box-shadow: 0 10px 30px rgba(15, 81, 50, 0.12); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
          100% { transform: translateY(0px); }
        }
        @keyframes textEntrance {
          0% { opacity: 0; transform: translateY(15px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        @keyframes wave-move {
          0% { transform: translateX(0) scaleY(1); }
          50% { transform: translateX(-25%) scaleY(0.85); }
          100% { transform: translateX(-50%) scaleY(1); }
        }
        @keyframes wave-rise {
          0% { transform: translateY(100%); }
          100% { transform: translateY(0); }
        }
        @keyframes barPulse {
          0%, 100% { transform: scaleY(0.3); }
          50% { transform: scaleY(1); }
        }
        @keyframes ringSpin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      ` }} />

      {/* Logo + Wordmark */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 26,
        marginTop: '-10vh',
        animation: 'float 4s ease-in-out infinite',
        zIndex: 3,
      }}>
        {/* Rotating dashed ring behind logo */}
        <div style={{ position: 'relative', width: 118, height: 118, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg
            width="118" height="118" viewBox="0 0 118 118"
            style={{ position: 'absolute', animation: 'ringSpin 6s linear infinite' }}
          >
            <circle
              cx="59" cy="59" r="55"
              fill="none" stroke="#0f5132" strokeOpacity="0.25"
              strokeWidth="2" strokeDasharray="6 10" strokeLinecap="round"
            />
          </svg>

          {/* Logo circle - dark green gradient on white card */}
          <div style={{
            width: 96,
            height: 96,
            borderRadius: 26,
            background: 'linear-gradient(145deg, #10b981, #0f5132)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            animation: 'logoEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards, pulseGlow 2.8s infinite ease-in-out 0.8s',
          }}>
            <Music2 size={42} color="#ffffff" strokeWidth={2.4} />

            {/* Mini equalizer bars bottom-right */}
            <div style={{
              position: 'absolute',
              bottom: 10,
              right: 10,
              display: 'flex',
              alignItems: 'flex-end',
              gap: 3,
              height: 14,
            }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{
                  width: 3,
                  height: 14,
                  borderRadius: 2,
                  background: '#ffffff',
                  transformOrigin: 'bottom',
                  animation: `barPulse ${0.7 + i * 0.15}s ease-in-out infinite`,
                  animationDelay: `${i * 0.12}s`,
                  opacity: 0.9,
                }} />
              ))}
            </div>
          </div>
        </div>

        {/* Wordmark */}
        <div style={{
          textAlign: 'center',
          animation: 'textEntrance 0.8s ease-out 0.3s forwards',
          opacity: 0,
        }}>
          <h1 style={{
            fontSize: 34,
            fontWeight: 900,
            color: '#0f5132', // deep green
            margin: 0,
            letterSpacing: '0.1em',
            fontFamily: 'Outfit, sans-serif',
            textShadow: '0 2px 12px rgba(15, 81, 50, 0.12)',
          }}>
            BEATO
          </h1>
          <p style={{
            fontSize: 12,
            fontWeight: 700,
            color: '#5d8f77',
            margin: '8px 0 0',
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
          }}>
            Your Universe of Sound
          </p>
        </div>
      </div>

      {/* Liquid wave rising from bottom - dark green shades */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: '32vh',
        overflow: 'hidden',
        animation: 'wave-rise 1.4s cubic-bezier(0.19, 1, 0.22, 1) forwards',
        zIndex: 1,
      }}>
        <svg style={{
          position: 'absolute', bottom: 0, left: 0, width: '200%', height: '100%',
          fill: '#064e3b', opacity: 0.25, animation: 'wave-move 9s linear infinite',
        }} viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,60 C150,100 350,20 500,60 C650,100 850,20 1000,60 C1150,100 1350,20 1500,60 L1500,120 L0,120 Z" />
        </svg>
        <svg style={{
          position: 'absolute', bottom: 0, left: 0, width: '200%', height: '90%',
          fill: '#0f5132', opacity: 1, animation: 'wave-move 6s linear infinite reverse',
        }} viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,50 C150,10 300,90 450,50 C600,10 750,90 900,50 C1050,10 1200,90 1350,50 L1350,120 L0,120 Z" />
        </svg>
        <svg style={{
          position: 'absolute', bottom: 0, left: 0, width: '200%', height: '80%',
          fill: '#10b981', opacity: 0.9, animation: 'wave-move 12s linear infinite',
        }} viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M0,70 C200,30 400,110 600,70 C800,30 1000,110 1200,70 L1200,120 L0,120 Z" />
        </svg>
      </div>
    </div>
  );
}
