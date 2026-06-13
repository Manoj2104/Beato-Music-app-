'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mic2, Check, ArrowRight, Shield, Globe, Award, Sparkles, RefreshCw, Loader2, ChevronLeft, ShieldAlert, Camera
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useArtistApplicationStore } from '@/store/artistApplicationStore';
import toast from 'react-hot-toast';

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

const labelS: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: MUTED,
  textTransform: 'uppercase',
  letterSpacing: '0.1em',
  marginBottom: 8,
};

/* ── Component: refresh JWT then navigate ── */
function ArtistDashboardButton({ artistName, userId }: { artistName: string; userId: string }) {
  const { updateUser, upgradeToArtist } = useAuthStore();
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/refresh-role', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upgradeToArtist: true }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        updateUser(data.user);
        if (data.role === 'ARTIST') {
          upgradeToArtist(userId);
        }
        toast.success(`Welcome, ${artistName}! Artist Portal unlocked.`, {
          style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(29, 185, 84,0.3)', borderRadius: 12 },
        });
        window.location.href = '/artist/dashboard';
      } else {
        toast.error('Session refresh failed. Please log in again.');
        window.location.href = '/login';
      }
    } catch {
      toast.error('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        padding: '12px 24px', borderRadius: 20,
        background: loading ? 'rgba(29, 185, 84,0.5)' : G,
        border: 'none', color: '#000', fontWeight: 800, fontSize: 13,
        cursor: loading ? 'not-allowed' : 'pointer',
        fontFamily: 'Outfit, sans-serif',
        display: 'flex', alignItems: 'center', gap: 8,
        transition: 'all 0.2s',
        boxShadow: loading ? 'none' : '0 4px 18px rgba(29, 185, 84,0.28)',
      }}
    >
      {loading
        ? <><Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> Unlocking Portal…</>
        : <>Artist Dashboard →</>}
    </button>
  );
}

/* ── Custom Styled Input ── */
function FormInput({ value, onChange, placeholder, type = 'text', required = false }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <input
      value={value} onChange={e => onChange(e.target.value)}
      type={type} required={required} placeholder={placeholder}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      style={{
        width: '100%', background: CARD2,
        border: `1.5px solid ${focused ? G : BORDER}`,
        borderRadius: 10, padding: '12px 16px',
        color: WHITE, fontSize: 14, outline: 'none',
        fontFamily: 'Inter, sans-serif',
        boxSizing: 'border-box', transition: 'border-color 0.2s',
        boxShadow: focused ? `0 0 0 3px rgba(29, 185, 84,0.12)` : 'none',
      }}
    />
  );
}

export default function ArtistApplyPage() {
  const { user } = useAuthStore();
  const { submitApplication, getApplicationByUserId, fetchUserApplication } = useArtistApplicationStore();
  const router = useRouter();

  const [showVerifyModal, setShowVerifyModal] = useState(false);

  useEffect(() => {
    if (user && !user.verified) {
      setShowVerifyModal(true);
    } else {
      setShowVerifyModal(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchUserApplication();
    }
  }, [user, fetchUserApplication]);
  
  const [step, setStep] = useState(1);
  const [stageName, setStageName] = useState('');
  const [dob, setDob] = useState('');
  const [bio, setBio] = useState('');
  const [country, setCountry] = useState('IN');
  const [profileImage, setProfileImage] = useState('');
  const [instagram, setInstagram] = useState('');
  const [twitter, setTwitter] = useState('');
  const [website, setWebsite] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [focusedCountry, setFocusedCountry] = useState(false);
  const [focusedBio, setFocusedBio] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) { // 2MB safety limit
        toast.error('Profile photo must be less than 2MB to upload.', {
          style: { background: '#1a1a1a', color: '#fff', border: '1px solid #ef4444', borderRadius: 12 }
        });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const activeApp = user ? getApplicationByUserId(user.id) : undefined;

  useEffect(() => {
    if (activeApp) {
      setStep(3); // Skip directly to status screen
    }
  }, [activeApp]);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!stageName) {
      toast.error('Artist name is required');
      return;
    }
    if (!dob) {
      toast.error('Date of birth is required');
      return;
    }
    if (!profileImage) {
      toast.error('Profile photo is required');
      return;
    }
    if (!agreed) {
      toast.error('You must accept the agreement');
      return;
    }

    setSubmitting(true);
    try {
      const imgUrl = profileImage;
      const success = await submitApplication(
        user.id,
        stageName,
        dob,
        bio,
        country,
        imgUrl,
        { instagram, twitter, website }
      );
      if (success) {
        toast.success('Application submitted successfully!');
        setStep(3);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: BG, fontFamily: 'Inter, sans-serif', position: 'relative', overflowX: 'hidden' }}>
      
      {/* ─── Cover Header Section ─── */}
      <div style={{
        position: 'relative',
        height: isMobile ? 180 : 250,
        width: '100%',
        overflow: 'hidden',
        background: '#000'
      }}>
        {/* Banner Cover image */}
        <img 
          src="https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1200&h=600&fit=crop" 
          alt="Beato For Artists" 
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover',
            opacity: 0.55
          }} 
        />
        
        {/* Linear Gradient Overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.1) 0%, rgba(10,10,10,1) 100%)',
          zIndex: 1
        }} />

        {/* Back Arrow Button (Overlaid top-left) */}
        <div style={{ 
          position: 'absolute', 
          top: isMobile ? '16px' : '24px', 
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
              border: '1px solid rgba(255,255,255,0.08)',
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              color: '#fff', 
              transition: 'all 0.2s',
              backdropFilter: 'blur(4px)',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.background = 'rgba(0,0,0,0.6)';
              e.currentTarget.style.transform = 'none';
            }}
          >
            <ChevronLeft size={22} />
          </button>
        </div>
      </div>

      {/* Radial ambient background glow */}
      <div style={{
        position: 'absolute',
        top: 150,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '100%',
        maxWidth: 1200,
        height: 600,
        background: 'radial-gradient(100% 100% at 50% 0%, rgba(29, 185, 84,0.14) 0%, rgba(16, 185, 129,0.08) 50%, transparent 100%)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      <div style={{ maxWidth: 700, margin: '0 auto', padding: isMobile ? '0 16px 100px' : '0 24px 100px', position: 'relative', zIndex: 1 }}>
        
        {/* Header / Brand */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 30, paddingBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, borderRadius: '50%', background: `linear-gradient(135deg, ${G}, #10b981)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Mic2 size={16} color="black" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff', letterSpacing: '-0.02em' }}>Beato For Artists</span>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {/* STEP 1: Pitch/Landing */}
          {step === 1 && (
            <motion.div key="step-1" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 100, background: 'rgba(29, 185, 84,0.1)', border: `1px solid ${G}30`, marginBottom: 16 }}>
                  <Sparkles size={13} color={G} />
                  <span style={{ color: G, fontSize: 12, fontWeight: 700 }}>Claim your profile</span>
                </div>
                <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: isMobile ? 32 : 42, fontWeight: 900, color: WHITE, margin: 0, marginBottom: 14, lineHeight: 1.1, letterSpacing: '-0.02em' }}>
                  Share your music with the world.
                </h1>
                <p style={{ color: SOFT, fontSize: 15, margin: 0, maxWidth: 520, marginInline: 'auto', lineHeight: 1.6 }}>
                  Beato for Artists gives you the tools to share your tracks, pitch to playlists, grow your audience, and earn payouts.
                </p>
              </div>

              {/* Benefit Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: isMobile ? 10 : 16 }}>
                {[
                  { icon: Globe, t: 'Global Distribution', d: 'Your music will instantly sync to listeners in over 180 countries.', border: '#1db954', bg: 'rgba(29, 185, 84,0.02)' },
                  { icon: Award, t: 'Verified Badge', d: 'Get the blue verification checkmark on your public artist page.', border: '#10b981', bg: 'rgba(16, 185, 129,0.02)' },
                  { icon: Mic2, t: 'Artist Analytics', d: 'Track your streaming stats, listener demographics, and playlist adds in real-time.', border: '#eab308', bg: 'rgba(234,179,8,0.02)' },
                  { icon: Shield, t: 'Copyright Protection', d: 'Our automated sample matching system keeps your intellectual property secure.', border: '#34d399', bg: 'rgba(52, 211, 153,0.02)' },
                ].map(({ icon: Icon, t, d, border, bg }) => (
                  <div key={t} style={{ 
                    padding: isMobile ? '16px 12px' : '24px', 
                    background: CARD, 
                    border: `1px solid ${BORDER}`, 
                    borderLeft: `${isMobile ? 2.5 : 3}px solid ${border}`,
                    borderRadius: isMobile ? 12 : 14,
                    transition: 'all 0.2s',
                  }}
                    onMouseEnter={e => {
                      e.currentTarget.style.transform = 'translateY(-2px)';
                      e.currentTarget.style.background = bg;
                      e.currentTarget.style.boxShadow = `0 8px 20px rgba(0,0,0,0.4)`;
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.transform = 'none';
                      e.currentTarget.style.background = CARD;
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  >
                    <div style={{ 
                      width: isMobile ? 30 : 36, 
                      height: isMobile ? 30 : 36, 
                      borderRadius: isMobile ? 8 : 10, 
                      background: `${border}15`, 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      color: border, 
                      marginBottom: isMobile ? 8 : 14 
                    }}>
                      <Icon size={isMobile ? 15 : 18} />
                    </div>
                    <h3 style={{ color: WHITE, fontSize: isMobile ? 13.5 : 15, fontWeight: 700, margin: isMobile ? '0 0 4px' : '0 0 6px' }}>{t}</h3>
                    <p style={{ color: SOFT, fontSize: isMobile ? 10.5 : 12.5, margin: 0, lineHeight: 1.45 }}>{d}</p>
                  </div>
                ))}
              </div>

              <button 
                onClick={() => setStep(2)} 
                style={{
                  marginTop: 12, padding: '14px 32px', borderRadius: 20, 
                  background: G, border: 'none', color: '#000', fontWeight: 800, fontSize: 15, 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, 
                  fontFamily: 'Outfit, sans-serif', alignSelf: 'center',
                  boxShadow: `0 4px 18px rgba(29, 185, 84,0.35)`,
                  transition: 'all 0.2s'
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.boxShadow = `0 6px 22px rgba(29, 185, 84,0.45)`;
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = `0 4px 18px rgba(29, 185, 84,0.35)`;
                }}
              >
                Get Started <ArrowRight size={16} />
              </button>
            </motion.div>
          )}

          {/* STEP 2: Application Form */}
          {step === 2 && (
            <motion.form key="step-2" onSubmit={handleSubmit} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: isMobile ? '24px 20px' : '30px' }}>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: WHITE, margin: '0 0 8px' }}>Artist Application</h2>
                <p style={{ color: SOFT, fontSize: 13, margin: '0 0 24px' }}>Fill in your details. Our moderation team reviews all requests within 24 hours.</p>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  <div>
                    <label style={labelS}>Artist / Stage Name *</label>
                    <FormInput value={stageName} onChange={setStageName} placeholder="e.g. DJ Horizon" required />
                  </div>

                  <div>
                    <label style={labelS}>Date of Birth *</label>
                    <FormInput type="date" value={dob} onChange={setDob} required />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16 }}>
                    <div>
                      <label style={labelS}>Country / Region *</label>
                      <select 
                        value={country} 
                        onChange={e => setCountry(e.target.value)} 
                        onFocus={() => setFocusedCountry(true)}
                        onBlur={() => setFocusedCountry(false)}
                        style={{ 
                          width: '100%', background: CARD2,
                          border: `1.5px solid ${focusedCountry ? G : BORDER}`,
                          borderRadius: 10, padding: '12px 14px',
                          color: WHITE, fontSize: 14, outline: 'none',
                          fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                          transition: 'border-color 0.2s', colorScheme: 'dark'
                        }}
                      >
                        <option value="IN">India (IN)</option>
                        <option value="US">United States (US)</option>
                        <option value="GB">United Kingdom (GB)</option>
                        <option value="CA">Canada (CA)</option>
                        <option value="DE">Germany (DE)</option>
                        <option value="FR">France (FR)</option>
                        <option value="JP">Japan (JP)</option>
                        <option value="BR">Brazil (BR)</option>
                      </select>
                    </div>
                    <div>
                      <label style={labelS}>Profile Photo *</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        style={{
                          position: 'relative',
                          width: '100%',
                          height: 48,
                          borderRadius: 10,
                          overflow: 'hidden',
                          background: CARD2,
                          border: `1.5px dashed ${profileImage ? G : BORDER}`,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 8,
                          cursor: 'pointer',
                          transition: 'border-color 0.2s, background 0.2s',
                          boxSizing: 'border-box'
                        }}
                        onMouseEnter={e => {
                          e.currentTarget.style.borderColor = G;
                          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        }}
                        onMouseLeave={e => {
                          e.currentTarget.style.borderColor = profileImage ? G : BORDER;
                          e.currentTarget.style.background = CARD2;
                        }}
                      >
                        {profileImage ? (
                          <>
                            <img src={profileImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'absolute', inset: 0, opacity: 0.6 }} />
                            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.7)', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                              <Camera size={12} /> Change Photo
                            </div>
                          </>
                        ) : (
                          <>
                            <Camera size={15} color={SOFT} />
                            <span style={{ fontSize: 12, color: SOFT, fontWeight: 600 }}>Upload Photo</span>
                          </>
                        )}
                      </div>
                      <input 
                        type="file"
                        ref={fileInputRef}
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: 'none' }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={labelS}>Bio / Description</label>
                    <textarea 
                      value={bio} 
                      onChange={e => setBio(e.target.value)} 
                      placeholder="Tell your story. Include genres, influences, or background." 
                      rows={4} 
                      onFocus={() => setFocusedBio(true)}
                      onBlur={() => setFocusedBio(false)}
                      style={{ 
                        width: '100%', background: CARD2,
                        border: `1.5px solid ${focusedBio ? G : BORDER}`,
                        borderRadius: 10, padding: '12px 16px',
                        color: WHITE, fontSize: 14, outline: 'none',
                        fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                        transition: 'border-color 0.2s', resize: 'vertical'
                      }} 
                    />
                  </div>

                  {/* Social Links */}
                  <div>
                    <label style={labelS}>Social Media Profiles</label>
                    <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 12 }}>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, display: 'flex', alignItems: 'center' }}>📸</span>
                        <input 
                          value={instagram} 
                          onChange={e => setInstagram(e.target.value)} 
                          placeholder="Instagram handle" 
                          style={{
                            width: '100%', background: CARD2,
                            border: `1.5px solid ${BORDER}`,
                            borderRadius: 10, padding: '12px 16px 12px 38px',
                            color: WHITE, fontSize: 14, outline: 'none',
                            fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                          }} 
                        />
                      </div>
                      <div style={{ position: 'relative' }}>
                        <span style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', fontSize: 13, display: 'flex', alignItems: 'center' }}>🐦</span>
                        <input 
                          value={twitter} 
                          onChange={e => setTwitter(e.target.value)} 
                          placeholder="Twitter handle" 
                          style={{
                            width: '100%', background: CARD2,
                            border: `1.5px solid ${BORDER}`,
                            borderRadius: 10, padding: '12px 16px 12px 38px',
                            color: WHITE, fontSize: 14, outline: 'none',
                            fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
                          }} 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Policy Acceptance */}
                  <div style={{ marginTop: 8, padding: '16px', background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: 12 }}>
                    <label style={{ display: 'flex', gap: 12, cursor: 'pointer', alignItems: 'flex-start' }}>
                      <div onClick={() => setAgreed(v => !v)} style={{
                        width: 20, height: 20, borderRadius: 4, border: `2px solid ${agreed ? G : 'rgba(255,255,255,0.25)'}`,
                        background: agreed ? G : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0, marginTop: 1, cursor: 'pointer', transition: 'all 0.15s',
                      }}>
                        {agreed && <Check size={13} color="black" strokeWidth={3} />}
                      </div>
                      <span style={{ color: SOFT, fontSize: 12, lineHeight: 1.5 }}>
                        I certify that I am the owner or authorized representative of this musical project and that all uploaded content is original or fully authorized under DMCA guidelines.
                      </span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: 12, width: '100%' }}>
                <button type="button" onClick={() => setStep(1)} style={{
                  flex: 1, padding: '14px', borderRadius: 20, background: 'transparent', border: `1px solid ${BORDER}`, color: WHITE, fontWeight: 700, cursor: 'pointer', fontSize: 13, fontFamily: 'Inter, sans-serif', transition: 'all 0.2s'
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Back
                </button>
                <button type="submit" disabled={!agreed || submitting} style={{
                  flex: 2, padding: '14px', borderRadius: 20, background: (agreed && !submitting) ? G : 'rgba(29, 185, 84,0.3)', border: 'none', color: '#000', fontWeight: 800, cursor: (agreed && !submitting) ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Outfit, sans-serif', fontSize: 13,
                  boxShadow: (agreed && !submitting) ? `0 4px 16px rgba(29, 185, 84,0.3)` : 'none'
                }}>
                  {submitting ? (
                    <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</>
                  ) : (
                    <>Submit Application <ArrowRight size={16} /></>
                  )}
                </button>
              </div>
            </motion.form>
          )}

          {/* STEP 3: Status / Under Review */}
          {step === 3 && activeApp && (
            <motion.div key="step-3" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ background: CARD, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 36, textAlign: 'center' }}>
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: activeApp.status === 'PENDING' ? 'rgba(245,158,11,0.12)' : activeApp.status === 'APPROVED' ? 'rgba(29, 185, 84,0.12)' : 'rgba(239,68,68,0.12)',
                  border: `2px solid ${activeApp.status === 'PENDING' ? '#f59e0b' : activeApp.status === 'APPROVED' ? G : '#ef4444'}`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px',
                }}>
                  {activeApp.status === 'PENDING' ? (
                    <RefreshCw size={24} color="#f59e0b" style={{ animation: 'spin 3s linear infinite' }} />
                  ) : activeApp.status === 'APPROVED' ? (
                    <Check size={28} color={G} />
                  ) : (
                    <span style={{ fontSize: 24, color: '#ef4444', fontWeight: 'bold' }}>✗</span>
                  )}
                </div>

                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 900, color: WHITE, margin: '0 0 8px' }}>
                  {activeApp.status === 'PENDING' && 'Application Under Review'}
                  {activeApp.status === 'APPROVED' && 'Application Approved!'}
                  {activeApp.status === 'REJECTED' && 'Application Rejected'}
                </h2>
                
                <p style={{ color: SOFT, fontSize: 14, maxWidth: 440, marginInline: 'auto', lineHeight: 1.6, margin: '0 0 28px' }}>
                  {activeApp.status === 'PENDING' && `We are reviewing "${activeApp.artistName}". Once verified, your role will be upgraded to Artist, and you will unlock streaming dashboard features.`}
                  {activeApp.status === 'APPROVED' && `Congratulations! "${activeApp.artistName}" is verified. Re-log in or refresh your session to load the Artist Portal.`}
                  {activeApp.status === 'REJECTED' && 'Your application does not meet our community guidelines. You can submit another application with updated details.'}
                </p>

                {/* Progress bar timeline */}
                <div style={{ position: 'relative', height: 2, background: 'rgba(255,255,255,0.08)', margin: '40px 20px 60px' }}>
                  <div style={{
                    position: 'absolute', left: 0, top: 0, height: '100%',
                    width: activeApp.status === 'PENDING' ? '50%' : activeApp.status === 'APPROVED' ? '100%' : '50%',
                    background: activeApp.status === 'REJECTED' ? '#ef4444' : G,
                    transition: 'width 0.5s ease',
                  }} />

                  {/* Status Points */}
                  {[
                    { label: 'Submitted', active: true, done: true },
                    { label: 'Under Review', active: true, done: activeApp.status !== 'PENDING' },
                    { label: 'Artist Access', active: activeApp.status === 'APPROVED', done: activeApp.status === 'APPROVED' },
                  ].map((pt, idx) => (
                    <div key={pt.label} style={{
                      position: 'absolute', top: -7, left: `${idx * 50}%`, transform: 'translateX(-50%)',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8
                    }}>
                      <div style={{
                        width: 16, height: 16, borderRadius: '50%',
                        background: pt.done ? G : pt.active ? '#f59e0b' : '#2a2a2a',
                        border: '2px solid #0a0a0a',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        {pt.done && <Check size={8} color="black" strokeWidth={4} />}
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 700, color: pt.active ? WHITE : '#525252', whiteSpace: 'nowrap' }}>
                        {pt.label}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <Link href="/home">
                    <button style={{ padding: '12px 24px', borderRadius: 20, background: 'transparent', border: `1px solid ${BORDER}`, color: WHITE, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
                      Go to Home
                    </button>
                  </Link>

                  {activeApp.status === 'APPROVED' && (
                    <ArtistDashboardButton
                      artistName={activeApp.artistName}
                      userId={user?.id || ''}
                    />
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Verification Required Warning Modal ─── */}
      <AnimatePresence>
        {showVerifyModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100000,
          }}>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => router.push('/home')}
              style={{
                position: 'absolute',
                inset: 0,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(12px)',
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
                borderRadius: 24,
                padding: isMobile ? '24px 20px' : '32px',
                zIndex: 100001,
                width: 420,
                maxWidth: '90vw',
                boxShadow: '0 20px 50px rgba(0,0,0,0.9)',
                display: 'flex',
                flexDirection: 'column',
                gap: 18,
                textAlign: 'center',
                alignItems: 'center'
              }}
            >
              <div style={{
                width: 54, height: 54, borderRadius: 16,
                background: 'rgba(239, 68, 68, 0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                marginBottom: 4
              }}>
                <ShieldAlert size={26} color="#f87171" />
              </div>
              
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: '#fff', fontFamily: 'Outfit, sans-serif', margin: '0 0 8px 0' }}>
                  Identity Verification Required
                </h3>
                <p style={{ fontSize: 13.5, color: '#a3a3a3', lineHeight: 1.6, margin: 0 }}>
                  To apply for the Beato Artist program and distribute music, you must verify your identity. This helps secure the platform and confirm artist ownership.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 12, width: '100%', marginTop: 8 }}>
                <button
                  onClick={() => router.push('/home')}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 14,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: 'transparent',
                    color: '#a3a3a3',
                    fontSize: 13.5,
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    fontFamily: 'Inter, sans-serif'
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  Cancel
                </button>
                <button
                  onClick={() => router.push('/profile?verify=true')}
                  style={{
                    flex: 1.5,
                    padding: '12px',
                    borderRadius: 14,
                    border: 'none',
                    background: '#1db954',
                    color: '#000',
                    fontSize: 13.5,
                    fontWeight: 800,
                    cursor: 'pointer',
                    boxShadow: `0 4px 16px rgba(29, 185, 84,0.25)`,
                    transition: 'all 0.2s',
                    fontFamily: 'Outfit, sans-serif'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  Verify Now
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
