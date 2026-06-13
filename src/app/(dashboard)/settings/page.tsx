'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera, Check, Save, Trash2, LogOut, ChevronLeft
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { UserPreferences } from '@/types';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* ─── Design tokens ─── */
const G = '#1db954';
const BG = '#0a0a0a';
const CARD = '#141414';
const CARD2 = '#1a1a1a';
const BORDER = 'rgba(255,255,255,0.08)';
const BORDER2 = 'rgba(255,255,255,0.05)';
const MUTED = '#6b6b6b';
const SOFT = '#a3a3a3';
const WHITE = '#ffffff';

const BANNER_IMG = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&h=600&fit=crop';

/* ─── Reusable Toggle ─── */
function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button onClick={onChange} style={{
      width: 46, height: 26, borderRadius: 13, position: 'relative',
      background: on ? G : 'rgba(255,255,255,0.1)', border: 'none',
      cursor: 'pointer', transition: 'background 0.25s', flexShrink: 0, outline: 'none',
    }}>
      <motion.div
        animate={{ x: on ? 22 : 2 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{
          width: 22, height: 22, borderRadius: '50%', background: '#fff',
          position: 'absolute', top: 2,
          boxShadow: '0 1px 6px rgba(0,0,0,0.4)',
        }}
      />
    </button>
  );
}

/* ─── Field label ─── */
const Label = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 11, fontWeight: 700, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
    {children}
  </p>
);

/* ─── Text input ─── */
function Input({ value, onChange, placeholder, type = 'text', readOnly = false }: {
  value: string; onChange?: (v: string) => void; placeholder?: string; type?: string; readOnly?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      value={value} onChange={e => onChange?.(e.target.value)}
      type={type} readOnly={readOnly} placeholder={placeholder}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: '100%', background: readOnly ? 'rgba(255,255,255,0.02)' : CARD2,
        border: `1.5px solid ${focused ? G : readOnly ? BORDER2 : BORDER}`,
        borderRadius: 10, padding: '12px 16px',
        color: readOnly ? MUTED : WHITE, fontSize: 14, outline: 'none',
        cursor: readOnly ? 'not-allowed' : 'text', fontFamily: 'Inter, sans-serif',
        boxSizing: 'border-box', transition: 'border-color 0.2s',
        boxShadow: focused ? `0 0 0 3px rgba(29, 185, 84,0.12)` : 'none',
      }}
    />
  );
}

/* ─── Section divider ─── */
const Divider = ({ label }: { label: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '24px 0 16px' }}>
    <p style={{ fontSize: 10, fontWeight: 800, color: MUTED, textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap' }}>{label}</p>
    <div style={{ flex: 1, height: 1, background: BORDER2 }} />
  </div>
);

/* ─── Main page ─── */
export default function SettingsPage() {
  const { user, logout, updateUser } = useAuthStore();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [avatar, setAvatar] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [quality, setQuality] = useState<'low' | 'normal' | 'high' | 'very_high'>('very_high');
  const [crossfade, setCrossfade] = useState(5);
  const [autoplay, setAutoplay] = useState(true);
  const [normalize, setNormalize] = useState(true);
  const [privateSession, setPrivateSession] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [serverUrl, setServerUrl] = useState('https://beato-music-app.vercel.app');

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    if (typeof window !== 'undefined') {
      setServerUrl(window.localStorage.getItem('beato_api_url') || 'https://beato-music-app.vercel.app');
    }
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!user) return;
    setName(user.name || '');
    setEmail(user.email || '');
    setAvatar(user.avatar || '');
    const p = user.preferences;
    if (p) {
      setQuality(p.quality || 'very_high');
      setCrossfade(p.crossfade ?? 5);
      setAutoplay(p.autoplay ?? true);
      setNormalize(p.normalize ?? true);
      setPrivateSession(p.privateSession ?? false);
      setDarkMode(p.theme !== 'light');
    }
  }, [user]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be under 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setAvatar(base64);
      toast.success('Avatar updated! Save changes to sync.');
    };
    reader.readAsDataURL(file);
  };

  const save = async () => {
    const updatedPrefs: UserPreferences = {
      autoplay,
      crossfade,
      normalize,
      quality,
      downloadQuality: (user?.preferences?.downloadQuality || 'very_high') as 'normal' | 'high' | 'very_high',
      showExplicit: user?.preferences?.showExplicit ?? true,
      privateSession,
      language: user?.preferences?.language || 'en',
      theme: (darkMode ? 'dark' : 'light') as 'dark' | 'light' | 'system',
    };

    updateUser({
      name,
      email,
      avatar,
      preferences: updatedPrefs,
    });

    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          email,
          avatar,
          preferences: updatedPrefs,
        }),
      });

      if (!res.ok) {
        throw new Error('Failed to update user database profile');
      }
    } catch (e: any) {
      console.error('Failed to sync to DB:', e);
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    toast.success('Settings saved successfully!', {
      style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(29, 185, 84,0.3)', borderRadius: 12 },
    });
  };

  const handleDeleteAccount = async () => {
    try {
      setDeleteLoading(true);
      const res = await fetch('/api/user/delete', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      toast.success('Your account has been permanently deleted.', {
        style: { background: '#1a1a1a', color: '#fff', border: '1px solid #ef4444', borderRadius: 12 },
      });

      await logout();
      router.push('/');
    } catch (e: any) {
      toast.error(e.message || 'Failed to delete account');
    } finally {
      setDeleteLoading(false);
      setDeleteConfirmOpen(false);
    }
  };

  return (
    <div style={{ minHeight: '100%', background: BG, display: 'flex', flexDirection: 'column', color: '#fff', position: 'relative' }}>
      
      {/* ─── Cover Header Section ─── */}
      <div style={{
        position: 'relative',
        height: isMobile ? 260 : 320,
        width: '100%',
        overflow: 'hidden',
        background: '#000'
      }}>
        {/* Banner Cover image */}
        <img 
          src={BANNER_IMG} 
          alt="Settings" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            opacity: 0.65
          }} 
        />
        
        {/* Linear Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.85) 100%)',
          zIndex: 1
        }} />

        {/* Back Arrow Button (Overlaid top-left) */}
        <div style={{ 
          position: 'absolute', 
          top: isMobile ? 'calc(env(safe-area-inset-top, 24px) + 16px)' : '24px', 
          left: isMobile ? '16px' : '24px',
          zIndex: 10
        }}>
          <button 
            onClick={() => router.back()} 
            style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '50%', 
              background: 'rgba(0,0,0,0.6)', 
              border: 'none', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#fff', 
              transition: 'background 0.2s' 
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,0.8)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0.6)'}
          >
            <ChevronLeft size={22} />
          </button>
        </div>

        {/* Profile Avatar overlay top-right */}
        <div style={{ 
          position: 'absolute', 
          top: isMobile ? 'calc(env(safe-area-inset-top, 24px) + 16px)' : '24px', 
          right: isMobile ? '16px' : '24px',
          zIndex: 10
        }}>
          <Link href="/profile" style={{ textDecoration: 'none' }}>
            <div style={{ position: 'relative' }}>
              <div style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                overflow: 'hidden',
                border: '2px solid rgba(255,255,255,0.2)',
                background: `linear-gradient(135deg, ${G}, #10b981)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 14,
                fontWeight: 900,
                color: '#000',
              }}>
                {avatar
                  ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : (name?.[0] || 'U')
                }
              </div>
              <div style={{
                position: 'absolute',
                top: 0,
                right: 0,
                width: 10,
                height: 10,
                borderRadius: '50%',
                background: G,
                border: '2px solid #000',
              }} />
            </div>
          </Link>
        </div>

        {/* Settings Details Overlay (Aligned bottom-left) */}
        <div style={{
          position: 'absolute',
          bottom: '24px',
          left: isMobile ? '16px' : '32px',
          right: isMobile ? '16px' : '32px',
          zIndex: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 6
        }}>
          {/* Config Badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: G,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000',
              flexShrink: 0
            }}>
              <Check size={10} strokeWidth={4} color="black" />
            </div>
            <span style={{ 
              fontSize: 12, 
              fontWeight: 700, 
              color: '#fff',
              fontFamily: 'Inter, sans-serif'
            }}>
              System Preferences
            </span>
          </div>

          {/* Page Title */}
          <h1 style={{ 
            fontFamily: 'Outfit, sans-serif', 
            fontSize: isMobile ? 36 : 48, 
            fontWeight: 900, 
            letterSpacing: '-0.02em', 
            margin: '0 0 2px 0',
            color: '#fff',
            lineHeight: 1.1,
            textShadow: '0 2px 8px rgba(0,0,0,0.6)'
          }}>
            Settings
          </h1>

          <p style={{ 
            fontSize: isMobile ? 12.5 : 13.5, 
            fontWeight: 600, 
            color: '#d1d5db', 
            margin: 0,
            textShadow: '0 1px 4px rgba(0,0,0,0.5)'
          }}>
            Manage your account, playback preferences, and display theme.
          </p>
        </div>
      </div>

      {/* ─── Main Content ─── */}
      <div style={{ 
        padding: isMobile ? '24px 16px 100px' : '32px 32px 100px', 
        display: 'flex', 
        flexDirection: 'column', 
        gap: 24,
        maxWidth: 720,
        margin: '0 auto',
        width: '100%',
        boxSizing: 'border-box'
      }}>

        {/* Buttons Action Row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative', flexWrap: 'wrap' }}>
          {/* Save Changes Button */}
          <button 
            onClick={save}
            disabled={saved}
            style={{
              padding: '8px 24px',
              borderRadius: 20,
              background: saved ? 'rgba(29, 185, 84, 0.15)' : G,
              border: saved ? `1px solid rgba(29, 185, 84,0.4)` : 'none',
              color: saved ? G : '#000',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
              boxShadow: saved ? 'none' : '0 4px 14px rgba(29, 185, 84,0.35)',
            }}
          >
            {saved ? <Check size={14} /> : <Save size={14} />}
            <span>{saved ? 'Saved!' : 'Save Changes'}</span>
          </button>

          {/* Log Out Button */}
          <button 
            onClick={logout}
            style={{
              padding: '8px 20px',
              borderRadius: 20,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.4)',
              color: '#fff',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#ef4444';
              e.currentTarget.style.background = 'rgba(239,68,68,0.08)';
              e.currentTarget.style.color = '#f87171';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'rgba(255,255,255,0.4)';
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#fff';
            }}
          >
            <LogOut size={14} />
            <span>Log Out</span>
          </button>
        </div>

        {/* Form Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Card 1: Account Settings */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 24px' }}>
            <Divider label="Account Details" />

            <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28, flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', cursor: 'pointer' }} onClick={() => fileInputRef.current?.click()}>
                <div style={{
                  width: 96, height: 96, borderRadius: '50%', overflow: 'hidden',
                  border: `3.5px solid rgba(29, 185, 84,0.5)`,
                  boxShadow: '0 0 25px rgba(29, 185, 84,0.15)',
                  background: `linear-gradient(135deg, ${G}, #10b981)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 34, fontWeight: 900, color: '#000', position: 'relative',
                }}>
                  {avatar
                    ? <img src={avatar} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (name?.[0] || 'U')
                  }
                </div>
                <div style={{
                  position: 'absolute', bottom: -2, right: -2,
                  width: 32, height: 32, borderRadius: '50%',
                  background: G, border: '3px solid #141414',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                }}>
                  <Camera size={14} color="#000" />
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
              </div>

              <div style={{ flex: 1, minWidth: 200 }}>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 800, color: WHITE, marginBottom: 4 }}>Avatar Photo</h3>
                <p style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>Upload a custom image file (JPG, PNG). Max size: 2MB.</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    padding: '8px 18px', borderRadius: 8,
                    background: 'rgba(255,255,255,0.06)', border: `1px solid ${BORDER}`,
                    color: SOFT, fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Inter, sans-serif', transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.color = WHITE; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.color = SOFT; }}
                >
                  Change Photo
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
                <div>
                  <Label>Display Name</Label>
                  <Input value={name} onChange={setName} placeholder="Your display name" />
                </div>
                <div>
                  <Label>Email Address</Label>
                  <Input value={email} onChange={setEmail} type="email" placeholder="your@email.com" />
                </div>
              </div>
              <div>
                <Label>Country / Region</Label>
                <div style={{ position: 'relative' }}>
                  <Input value={user?.country || 'India (IN)'} readOnly />
                  <span style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    fontSize: 10, fontWeight: 700, color: MUTED,
                    background: 'rgba(255,255,255,0.05)', border: `1px solid ${BORDER2}`,
                    padding: '3px 8px', borderRadius: 6, textTransform: 'uppercase', letterSpacing: '0.06em',
                  }}>Locked</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Playback Options */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 24px' }}>
            <Divider label="Playback & Audio" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
              {[
                { label: 'Autoplay', desc: 'Automatically queue similar tracks when your playlist ends', value: autoplay, set: setAutoplay },
                { label: 'Normalize Volume', desc: 'Balance audio levels so all tracks play at a consistent volume', value: normalize, set: setNormalize },
              ].map(row => (
                <div key={row.label} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '16px 18px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER2}`,
                }}>
                  <div>
                    <p style={{ fontSize: 14, fontWeight: 600, color: WHITE, marginBottom: 3 }}>{row.label}</p>
                    <p style={{ fontSize: 12, color: MUTED }}>{row.desc}</p>
                  </div>
                  <Toggle on={row.value} onChange={() => row.set(v => !v)} />
                </div>
              ))}
            </div>

            <div style={{ padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER2}`, marginBottom: 24 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: WHITE }}>Crossfade</p>
                <span style={{ fontSize: 12, fontWeight: 800, color: G, background: 'rgba(29, 185, 84,0.1)', padding: '3px 12px', borderRadius: 20 }}>{crossfade}s</span>
              </div>
              <p style={{ fontSize: 12, color: MUTED, marginBottom: 14 }}>Overlap audio when transitioning between tracks.</p>
              <input type="range" min={0} max={12} value={crossfade} onChange={e => setCrossfade(+e.target.value)}
                style={{ width: '100%', accentColor: G, cursor: 'pointer', height: 4, borderRadius: 4 }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
                <span style={{ fontSize: 10, color: MUTED, fontWeight: 700 }}>0s — No overlap</span>
                <span style={{ fontSize: 10, color: MUTED, fontWeight: 700 }}>12s — Max blend</span>
              </div>
            </div>

            <Label>Audio Quality</Label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
              {[
                { id: 'low' as const, label: 'Low', sub: '24 kbps', badge: '' },
                { id: 'normal' as const, label: 'Normal', sub: '96 kbps', badge: '' },
                { id: 'high' as const, label: 'High', sub: '160 kbps', badge: '' },
                { id: 'very_high' as const, label: 'Very High', sub: '320 kbps', badge: 'HD' },
              ].map(q => {
                const sel = quality === q.id;
                return (
                  <button key={q.id} onClick={() => setQuality(q.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
                    borderRadius: 12, border: `1.5px solid ${sel ? G : BORDER2}`,
                    background: sel ? 'rgba(29, 185, 84,0.06)' : 'rgba(255,255,255,0.02)',
                    cursor: 'pointer', textAlign: 'left', transition: 'all 0.2s', width: '100%',
                    boxShadow: sel ? `0 0 0 3px rgba(29, 185, 84,0.1)` : 'none',
                  }}>
                    <div style={{
                      width: 18, height: 18, borderRadius: '50%', flexShrink: 0,
                      border: `2px solid ${sel ? G : MUTED}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'border-color 0.2s',
                    }}>
                      {sel && <div style={{ width: 8, height: 8, borderRadius: '50%', background: G }} />}
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: WHITE }}>{q.label}</span>
                        {q.badge && <span style={{ fontSize: 9, fontWeight: 800, padding: '1px 4px', borderRadius: 4, background: G, color: '#000' }}>{q.badge}</span>}
                      </div>
                      <span style={{ fontSize: 11, color: MUTED, display: 'block', marginTop: 2 }}>{q.sub}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Card 3: Display / Theme Card */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 24px' }}>
            <Divider label="Appearance Settings" />
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 18px', borderRadius: 12,
              background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER2}`,
            }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: WHITE, marginBottom: 3 }}>Dark Theme</p>
                <p style={{ fontSize: 12, color: MUTED }}>Enable dark interface mode for lower light settings</p>
              </div>
              <Toggle on={darkMode} onChange={() => setDarkMode(v => !v)} />
            </div>
          </div>

          {/* Card 3.5: Connection Settings Card */}
          <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '24px 24px' }}>
            <Divider label="Connection Settings" />
            <p style={{ fontSize: 12, color: MUTED, marginBottom: 16, lineHeight: 1.5 }}>
              Specify the IP address or public tunnel URL (localtunnel/ngrok) of your development server.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <Label>Server IP / API URL</Label>
                <div style={{ display: 'flex', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <Input value={serverUrl} onChange={setServerUrl} placeholder="https://beato-music-app.vercel.app" />
                  </div>
                  <button
                    onClick={() => {
                      if (typeof window !== 'undefined') {
                        const cleaned = serverUrl.trim();
                        if (!cleaned) {
                          toast.error('URL cannot be empty');
                          return;
                        }
                        window.localStorage.setItem('beato_api_url', cleaned);
                        toast.success('Connection settings saved! Reloading...', {
                          style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(29, 185, 84,0.3)', borderRadius: 12 },
                        });
                        setTimeout(() => {
                          window.location.reload();
                        }, 1200);
                      }
                    }}
                    style={{
                      padding: '12px 20px',
                      borderRadius: 10,
                      background: G,
                      color: '#000',
                      border: 'none',
                      fontWeight: 800,
                      fontSize: 13,
                      cursor: 'pointer',
                      fontFamily: 'Outfit, sans-serif',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = '#1ed760'}
                    onMouseLeave={e => e.currentTarget.style.background = G}
                  >
                    Save & Reload
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Card 4: Danger Zone Card */}
          <div style={{ background: CARD, border: `1px solid rgba(239, 68, 68, 0.15)`, borderRadius: 18, padding: '24px 24px' }}>
            <Divider label="Danger Zone" />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Delete Account */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 18px', borderRadius: 12,
                background: 'rgba(255,255,255,0.02)', border: `1px solid ${BORDER2}`,
                flexWrap: 'wrap', gap: 12,
              }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: '#f87171', marginBottom: 3 }}>Delete Account</p>
                  <p style={{ fontSize: 12, color: MUTED }}>Permanently delete your profile, playlists, and account data</p>
                </div>
                <button onClick={() => setDeleteConfirmOpen(true)} style={{
                  padding: '10px 20px', borderRadius: 10,
                  background: '#ef4444', border: 'none',
                  color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                  transition: 'all 0.2s', fontFamily: 'Outfit, sans-serif',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.2)'
                }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#dc2626'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = '#ef4444'; }}
                >
                  Delete Account
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {deleteConfirmOpen && (
          <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => !deleteLoading && setDeleteConfirmOpen(false)}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(8px)',
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              style={{
                position: 'relative',
                background: '#141414',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                borderRadius: 20,
                padding: '32px',
                zIndex: 10000,
                width: 420,
                maxWidth: '90vw',
                boxShadow: '0 20px 50px rgba(0,0,0,0.8), 0 0 40px rgba(239, 68, 68, 0.05)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12,
                  background: 'rgba(239, 68, 68, 0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                  <Trash2 size={20} color="#f87171" />
                </div>
                <div style={{ fontSize: 18, fontWeight: 900, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>
                  Delete Account permanently?
                </div>
              </div>
              
              <p style={{ fontSize: 13, color: '#a3a3a3', lineHeight: 1.6, marginBottom: 28 }}>
                Are you sure you want to permanently delete your account and profile data? This action <strong>cannot be undone</strong> and you will immediately lose access to your playlists, likes, and music.
              </p>
              
              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  disabled={deleteLoading}
                  onClick={() => setDeleteConfirmOpen(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 10,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'transparent',
                    color: '#a3a3a3',
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: deleteLoading ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={deleteLoading}
                  onClick={handleDeleteAccount}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#ef4444',
                    color: '#fff',
                    fontSize: 13,
                    fontWeight: 800,
                    cursor: deleteLoading ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(239,68,68,0.3)',
                    opacity: deleteLoading ? 0.6 : 1,
                  }}
                >
                  {deleteLoading ? 'Deleting...' : 'Delete permanently'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
