'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuthStore } from '@/store/authStore';
import { Monitor, Smartphone, ArrowLeft } from 'lucide-react';
import { useIsMobile } from '@/hooks/useIsMobile';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const isMobile = useIsMobile(); // ⚡ shared single resize listener
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // ⚡ Synchronous auth check — no timer delay
    if (!isAuthenticated || !user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      router.push('/403');
      return;
    }
    setIsChecking(false);
  }, [isAuthenticated, user, router]);

  if (isChecking) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            border: '3px solid #1a1a1a',
            borderTopColor: '#b08850',
          }}
        />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div style={{
        minHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px',
        textAlign: 'center',
        fontFamily: 'var(--font-display), sans-serif',
        color: '#fff',
      }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', duration: 0.5 }}
          style={{
            maxWidth: '400px',
            width: '100%',
            padding: '32px 24px',
            borderRadius: '16px',
            background: '#121212',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '24px',
          }}
        >
          {/* Animated Icon Container */}
          <div style={{
            position: 'relative',
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, rgba(239, 68, 68, 0.1) 0%, rgba(244, 63, 94, 0.05) 100%)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <motion.div
              animate={{ 
                scale: [1, 1.05, 1],
              }}
              transition={{ 
                duration: 2, 
                repeat: Infinity,
                ease: 'easeInOut' 
              }}
            >
              <Monitor size={38} color="#ef4444" />
            </motion.div>
            
            {/* Small smartphone icon overlay with cross badge */}
            <div style={{
              position: 'absolute',
              bottom: '0',
              right: '0',
              width: '28px',
              height: '28px',
              borderRadius: '50%',
              background: '#ef4444',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
              border: '2px solid #121212',
            }}>
              <Smartphone size={14} color="#fff" />
            </div>
          </div>

          {/* Heading */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: 800,
              color: '#fff',
              letterSpacing: '-0.02em',
              margin: 0,
            }}>
              Desktop View Required
            </h2>
            <p style={{
              fontSize: '14px',
              color: '#ef4444',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              margin: 0,
            }}>
              Admin Access Restricted
            </p>
          </div>

          <div style={{ height: '1px', background: 'rgba(255, 255, 255, 0.06)', width: '100%' }} />

          {/* Restriction messages */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{
              fontSize: '15px',
              color: '#e5e5e5',
              lineHeight: 1.6,
              margin: 0,
              fontWeight: 500,
            }}>
              Sorry, you can only access the Admin Panel in Desktop view.
            </p>
            <p style={{
              fontSize: '13px',
              color: '#a3a3a3',
              lineHeight: 1.5,
              margin: 0,
            }}>
              Try with desktop. Please use a desktop device or browser.
            </p>
          </div>

          {/* Back button */}
          <button
            onClick={() => router.push('/home')}
            style={{
              marginTop: '8px',
              width: '100%',
              padding: '12px 24px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #b08850, #10b981)',
              border: 'none',
              color: '#000',
              fontWeight: 700,
              fontSize: '14px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease',
              boxShadow: '0 4px 12px rgba(176, 136, 80, 0.25)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(176, 136, 80, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'none';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(176, 136, 80, 0.25)';
            }}
          >
            <ArrowLeft size={16} />
            <span>Go to Home</span>
          </button>
        </motion.div>
      </div>
    );
  }

  return <>{children}</>;
}
