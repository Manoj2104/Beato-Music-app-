'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ShieldAlert, ArrowLeft, RefreshCw, KeyRound, User, Mic2, ShieldCheck, UserCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useArtistApplicationStore } from '@/store/artistApplicationStore';
import toast from 'react-hot-toast';

const GREEN = '#b08850';

export default function AccessDeniedPage() {
  const router = useRouter();
  const { login, user, updateUser, upgradeToArtist } = useAuthStore();
  const { getApplicationByUserId } = useArtistApplicationStore();
  const activeApp = user ? getApplicationByUserId(user.id) : undefined;
  const isApproved = activeApp?.status === 'APPROVED';

  useEffect(() => {
    if (user && isApproved) {
      const tid = toast.loading('Syncing your artist permissions...');
      fetch('/api/auth/refresh-role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upgradeToArtist: true }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            updateUser({ ...data.user, token: data.token });
            upgradeToArtist(user.id);
            toast.success('Permissions successfully synced! Redirecting to Dashboard...', { id: tid });
            setTimeout(() => {
              window.location.href = '/artist/dashboard';
            }, 1000);
          } else {
            toast.error('Sync failed. Please contact support.', { id: tid });
          }
        })
        .catch((err) => {
          console.error('403 Auto-sync error:', err);
          toast.error('Network error during sync.', { id: tid });
        });
    }
  }, [user, isApproved, updateUser, upgradeToArtist]);

  const handleRoleSwap = async (email: string, roleName: string) => {
    try {
      toast.loading(`Switching to ${roleName}...`, { id: 'role-swap' });
      await login(email, 'password');
      toast.success(`Successfully switched to ${roleName}! 🎵`, { id: 'role-swap' });
      // Hard redirect so middleware picks up new JWT cookie immediately
      window.location.href = '/home';
    } catch (e) {
      toast.error('Failed to switch role', { id: 'role-swap' });
    }
  };

  const currentRole = user?.role || 'USER';

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle at center, #111 0%, #050505 100%)',
      color: '#fff',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      fontFamily: 'Inter, sans-serif'
    }}>
      {/* Background glow orbs */}
      <div style={{
        position: 'absolute',
        top: '20%',
        left: '50%',
        transform: 'translateX(-50%)',
        width: 380,
        height: 380,
        borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.08) 0%, transparent 70%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Main Container Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        style={{
          width: '100%',
          maxWidth: 580,
          background: 'rgba(18,18,18,0.8)',
          backdropFilter: 'blur(20px)',
          border: '1.5px solid rgba(255,255,255,0.06)',
          borderRadius: 24,
          padding: '40px',
          boxShadow: '0 30px 60px rgba(0,0,0,0.6)',
          textAlign: 'center',
          zIndex: 1,
          position: 'relative'
        }}
      >
        {/* Shield Icon Visual */}
        <motion.div
          animate={{
            y: [0, -6, 0],
            scale: [1, 1.02, 1]
          }}
          transition={{
            repeat: Infinity,
            duration: 4,
            ease: 'easeInOut'
          }}
          style={{
            width: 80,
            height: 80,
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '2px solid rgba(239, 68, 68, 0.3)',
            color: '#ef4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 28px',
            boxShadow: '0 0 30px rgba(239, 68, 68, 0.15)'
          }}
        >
          <ShieldAlert size={40} />
        </motion.div>

        {/* Heading */}
        <h1 style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: 32,
          fontWeight: 900,
          margin: '0 0 10px',
          letterSpacing: '-0.5px'
        }}>
          Access Restricted
        </h1>
        <div style={{
          fontSize: 13,
          fontWeight: 700,
          color: '#ef4444',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: 20
        }}>
          403 - Forbidden Page
        </div>

        {/* Description */}
        <p style={{
          color: '#a3a3a3',
          fontSize: 15,
          lineHeight: 1.6,
          margin: '0 auto 32px',
          maxWidth: 450
        }}>
          You do not have the required permissions to access this page. This directory is protected by Beato RBAC middleware.
          Your current session role is: <strong style={{ color: '#fff', backgroundColor: 'rgba(255,255,255,0.08)', padding: '3px 8px', borderRadius: 4, fontSize: 13 }}>{currentRole}</strong>.
        </p>

        {/* Dynamic Demo Swapping Helper Box */}
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 16,
          padding: '24px 20px',
          textAlign: 'left',
          marginBottom: 32
        }}>
          <h3 style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#fff',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            margin: '0 0 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}>
            <KeyRound size={14} color={GREEN} /> Quick Role Switcher (For Demo Testing)
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 10
          }}>
            {[
              { roleName: 'USER', email: 'manoj@beato.io', name: 'Manoj', icon: User, color: '#34d399' },
              { roleName: 'ARTIST', email: 'artist@beato.com', name: 'Aurora', icon: Mic2, color: GREEN },
              { roleName: 'ADMIN', email: 'admin@beato.com', name: 'Moderator', icon: ShieldCheck, color: '#10b981' },
              { roleName: 'SUPER_ADMIN', email: 'superadmin@beato.com', name: 'Root', icon: UserCheck, color: '#84cc16' }
            ].map((role) => (
              <button
                key={role.roleName}
                onClick={() => handleRoleSwap(role.email, role.roleName)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  borderRadius: 10,
                  border: '1.5px solid rgba(255,255,255,0.08)',
                  background: 'rgba(255,255,255,0.04)',
                  color: '#fff',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.2s',
                  fontFamily: 'Inter, sans-serif'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = role.color;
                  e.currentTarget.style.background = `${role.color}08`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                }}
              >
                <div style={{
                  width: 28,
                  height: 28,
                  borderRadius: 6,
                  background: `${role.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: role.color,
                  flexShrink: 0
                }}>
                  <role.icon size={15} />
                </div>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#a3a3a3' }}>{role.roleName}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginTop: 1 }}>{role.name}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center'
        }}>
          <button
            onClick={() => router.push('/home')}
            style={{
              padding: '12px 28px',
              borderRadius: 30,
              background: '#fff',
              color: '#000',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 800,
              fontFamily: 'Outfit, sans-serif',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'transform 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.03)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
          >
            <ArrowLeft size={16} /> Go to Home
          </button>
          <button
            onClick={() => router.push('/login')}
            style={{
              padding: '12px 28px',
              borderRadius: 30,
              background: 'transparent',
              color: '#fff',
              border: '1.5px solid rgba(255,255,255,0.15)',
              cursor: 'pointer',
              fontWeight: 700,
              fontFamily: 'Outfit, sans-serif',
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'background 0.2s'
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
          >
            <RefreshCw size={14} /> Switch Account
          </button>
        </div>
      </motion.div>
    </div>
  );
}
