'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, ArrowRight, Check, Eye, EyeOff, Headphones, Radio, Download, Mail, Lock, User, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const GREEN = '#1db954';
const PURPLE = '#10b981';
const PINK = '#34d399';

// Animated floating note
const FloatingNote = ({ x, y, delay, char }: { x: string; y: string; delay: number; char: string }) => (
  <motion.div
    style={{ position: 'absolute', left: x, top: y, color: 'rgba(29, 185, 84,0.3)', fontSize: 24, pointerEvents: 'none', userSelect: 'none' }}
    animate={{ y: [0, -30, 0], opacity: [0.3, 0.8, 0.3] }}
    transition={{ duration: 4, delay, repeat: Infinity, ease: 'easeInOut' }}
  >
    {char}
  </motion.div>
);

// Left side feature pill
const FeaturePill = ({ icon: Icon, label, color }: { icon: React.ComponentType<{ size?: number; color?: string }>; label: string; color: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 100, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', width: 'fit-content' }}>
    <Icon size={16} color={color} />
    <span style={{ color: '#fff', fontSize: 13, fontWeight: 500 }}>{label}</span>
  </div>
);

const STEPS = ['Account', 'Profile', 'Password'];

export default function RegisterPage() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [dob, setDob] = useState('');
  const [gender, setGender] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const { login, signup } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;

    const checkEmail = async () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        if (isMounted) {
          setEmailExists(false);
          setCheckingEmail(false);
        }
        return;
      }

      if (isMounted) setCheckingEmail(true);
      try {
        const response = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const data = await response.json();
        if (isMounted) setEmailExists(!!data.exists);
      } catch (err) {
        console.error('Error checking email:', err);
        if (isMounted) setEmailExists(false);
      } finally {
        if (isMounted) setCheckingEmail(false);
      }
    };

    const delayDebounceFn = setTimeout(() => {
      checkEmail();
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(delayDebounceFn);
    };
  }, [email]);

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.length < 14 ? 3 : 4;
  const strengthColor = ['#333', '#ef4444', '#f59e0b', '#1db954', '#1db954'][passwordStrength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 0) {
      if (emailExists) {
        toast.error('This email is already registered');
        return;
      }
      if (checkingEmail) {
        toast.error('Checking email availability...');
        return;
      }
    }
    if (step < 2) { setStep(s => s + 1); return; }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setIsLoading(true);
    try {
      await signup(name, email, password, confirmPassword);
      await login(email, password);
      setDone(true);
      setTimeout(() => { toast.success('Welcome to Beato 🎵'); router.push('/home'); }, 2000);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      toast.error(msg || 'Registration failed. Try again.');
      setIsLoading(false);
    }
  };

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.15)',
    borderRadius: 12, padding: '14px 16px', color: '#fff', fontSize: 15, outline: 'none',
    transition: 'border-color 0.2s', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#737373',
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
  };

  return (
    <div className="register-page-wrapper">
      <style>{`
        .register-page-wrapper {
          min-height: 100vh;
          background: #000;
        }
        .desktop-view-container {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
          background: #0a0a0a;
        }
        .mobile-view-container {
          display: none;
        }
        
        /* Mobile View Classes */
        .mobile-input-container {
          display: flex;
          align-items: center;
          background: #111;
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          padding: 14px 16px;
          margin-bottom: 16px;
          transition: border-color 0.2s, box-shadow 0.2s;
          width: 100%;
          box-sizing: border-box;
        }
        .mobile-input-container:focus-within {
          border-color: #1db954 !important;
          box-shadow: 0 0 0 1px #1db954;
        }
        .mobile-input {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          color: #fff !important;
          font-size: 15px !important;
          width: 100% !important;
          margin-left: 12px !important;
          padding: 0 !important;
          font-family: 'Inter', sans-serif;
        }
        .mobile-input::placeholder {
          color: #525252 !important;
        }
        .mobile-select {
          background: transparent !important;
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          color: #fff !important;
          font-size: 15px !important;
          width: 100% !important;
          margin-left: 12px !important;
          padding: 0 !important;
          font-family: 'Inter', sans-serif;
          cursor: pointer;
        }
        .mobile-btn {
          width: 100%;
          background: #1db954;
          color: #000;
          font-size: 16px;
          font-weight: 800;
          padding: 15px;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          transition: background 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .mobile-btn:hover {
          background: #1ed760;
        }
        .mobile-btn:active {
          transform: scale(0.98);
        }
        .mobile-btn-primary {
          background: #1db954;
          color: #000;
          font-size: 15px;
          font-weight: 800;
          padding: 14px;
          border-radius: 100px;
          border: none;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          transition: background 0.2s, transform 0.1s;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 2;
        }
        .mobile-btn-primary:hover {
          background: #1ed760;
        }
        .mobile-btn-primary:active {
          transform: scale(0.98);
        }
        .mobile-btn-secondary {
          background: #111;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          padding: 14px;
          border-radius: 100px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          transition: background 0.2s, border-color 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
          flex: 1;
        }
        .mobile-btn-secondary:hover {
          background: #1a1a1a;
          border-color: rgba(255, 255, 255, 0.2);
        }
        .mobile-step-dot {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 700;
          transition: all 0.3s;
          flex-shrink: 0;
        }

        @media (max-width: 768px) {
          .desktop-view-container {
            display: none !important;
          }
          .mobile-view-container {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: #000;
            padding: 24px 20px;
            box-sizing: border-box;
          }
        }
      `}</style>

      {/* ── DESKTOP VIEW ── */}
      <div className="desktop-view-container">

      {/* ── LEFT PANEL ── */}
      <div className="hidden md:flex relative overflow-hidden flex-col justify-center p-[60px] lg:px-[64px]"
        style={{
          background: 'linear-gradient(135deg, #0d1f14 0%, #0a0a0a 60%, #1a0d2e 100%)',
        }}>
        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: -100, left: -100, width: 400, height: 400, borderRadius: '50%', background: 'rgba(29, 185, 84,0.12)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, right: -80, width: 350, height: 350, borderRadius: '50%', background: 'rgba(16, 185, 129,0.1)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        {/* Floating music notes */}
        {[
          { x: '10%', y: '15%', delay: 0, char: '♪' },
          { x: '80%', y: '20%', delay: 1.2, char: '♫' },
          { x: '25%', y: '70%', delay: 0.6, char: '♩' },
          { x: '70%', y: '75%', delay: 1.8, char: '♬' },
          { x: '55%', y: '45%', delay: 0.9, char: '♪' },
        ].map((n, i) => <FloatingNote key={i} {...n} />)}

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo */}
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 56 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'linear-gradient(135deg, #1db954, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 20px rgba(29, 185, 84,0.4)' }}>
              <Music2 size={20} color="black" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 22, color: '#fff' }}>Beato</span>
          </Link>

          {/* Headline */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 48, fontWeight: 900, lineHeight: 1.1, marginBottom: 20, letterSpacing: '-1px' }}>
              100M+ songs.<br />
              <span style={{ background: 'linear-gradient(135deg, #1db954, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                One universe.
              </span>
            </h2>
            <p style={{ color: '#737373', fontSize: 16, lineHeight: 1.7, marginBottom: 40, maxWidth: 380 }}>
              Join millions of music lovers. Stream, discover, and experience music like never before — completely free.
            </p>
          </motion.div>

          {/* Feature pills */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <FeaturePill icon={Headphones} label="Lossless 320kbps audio quality" color={GREEN} />
            <FeaturePill icon={Radio} label="AI-powered music recommendations" color={PURPLE} />
            <FeaturePill icon={Download} label="Offline downloads up to 10,000 songs" color={PINK} />
          </motion.div>

          {/* Social proof */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            style={{ marginTop: 48, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex' }}>
              {['#1db954', '#10b981', '#34d399', '#84cc16'].map((c, i) => (
                <div key={i} style={{ width: 32, height: 32, borderRadius: '50%', background: c, border: '2px solid #0a0a0a', marginLeft: i > 0 ? -10 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#000' }}>
                  {['A', 'B', 'C', 'D'][i]}
                </div>
              ))}
            </div>
            <div>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>2.4M+ active listeners</p>
              <p style={{ color: '#525252', fontSize: 12 }}>Join them today — it&apos;s free</p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex items-center justify-center p-6 sm:p-12 md:p-[60px] lg:p-[72px] bg-[#111] border-l-0 md:border-l border-white/5 overflow-y-auto">
        <div style={{ width: '100%', maxWidth: 400 }}>

          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(29, 185, 84,0.15)', border: '2px solid #1db954', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(29, 185, 84,0.3)' }}>
                  <Check size={36} color="#1db954" />
                </motion.div>
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Welcome, {name || 'Music Lover'}! 🎉</h2>
                  <p style={{ color: '#737373', fontSize: 15 }}>Your account is ready. Taking you to Beato…</p>
                </div>
                <div style={{ width: 32, height: 32, border: '3px solid #1db954', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

                {/* Header */}
                <div style={{ marginBottom: 32 }}>
                  <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 34, fontWeight: 900, color: '#fff', marginBottom: 6 }}>
                    Create account
                  </h1>
                  <p style={{ color: '#737373', fontSize: 15 }}>Start your free Beato journey</p>
                </div>

                {/* Step indicator */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
                  {STEPS.map((s, i) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 700, flexShrink: 0, transition: 'all 0.3s',
                        background: i < step ? GREEN : i === step ? '#fff' : 'rgba(255,255,255,0.15)',
                        color: i <= step ? '#000' : 'rgba(255,255,255,0.4)',
                      }}>
                        {i < step ? <Check size={13} /> : i + 1}
                      </div>
                      <span style={{ fontSize: 11, color: i === step ? '#fff' : '#525252', fontWeight: i === step ? 600 : 400, transition: 'color 0.3s' }}>{s}</span>
                      {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, borderRadius: 1, background: i < step ? GREEN : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />}
                    </div>
                  ))}
                </div>

                <AnimatePresence mode="wait">

                  {/* STEP 0: Email + Social */}
                  {step === 0 && (
                    <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                      {/* Social login */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
                        {[
                          { label: 'Continue with Google', icon: '🌐', color: '#4285F4' },
                          { label: 'Continue with Apple', icon: '🍎', color: '#fff' },
                          { label: 'Continue with GitHub', icon: '⚡', color: '#10b981' },
                        ].map(p => (
                          <button key={p.label} style={{
                            display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px',
                            borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
                            color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'background 0.2s',
                            fontFamily: 'Inter, sans-serif',
                          }}
                            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
                            <span style={{ fontSize: 18 }}>{p.icon}</span>
                            {p.label}
                          </button>
                        ))}
                      </div>

                      {/* Divider */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                        <span style={{ color: '#525252', fontSize: 13 }}>or use email</span>
                        <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                      </div>

                      <form onSubmit={handleNext}>
                        <div style={{ marginBottom: 16 }}>
                          <label style={labelStyle}>Email Address</label>
                          <input
                            type="email" value={email} onChange={e => setEmail(e.target.value)}
                            placeholder="name@email.com" required
                            suppressHydrationWarning
                            style={{
                              ...inputStyle,
                              borderColor: emailExists ? '#ef4444' : 'rgba(255,255,255,0.15)'
                            }}
                            onFocus={e => (e.target.style.borderColor = emailExists ? '#ef4444' : GREEN)}
                            onBlur={e => (e.target.style.borderColor = emailExists ? '#ef4444' : 'rgba(255,255,255,0.15)')}
                          />
                        </div>

                        {emailExists && (
                          <p style={{ color: '#ef4444', fontSize: 13, marginTop: -8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>⚠️</span> This email is already registered.
                          </p>
                        )}
                        {checkingEmail && (
                          <p style={{ color: '#a3a3a3', fontSize: 13, marginTop: -8, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #a3a3a3', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear' }} />
                            Checking availability...
                          </p>
                        )}

                        <button type="submit" disabled={emailExists || checkingEmail} style={{
                          width: '100%', padding: '15px', borderRadius: 12,
                          background: (emailExists || checkingEmail) ? 'rgba(29, 185, 84,0.4)' : GREEN,
                          color: '#000', fontWeight: 800, fontSize: 16,
                          cursor: (emailExists || checkingEmail) ? 'not-allowed' : 'pointer', border: 'none',
                          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          fontFamily: 'Outfit, sans-serif', transition: 'opacity 0.2s',
                          opacity: (emailExists || checkingEmail) ? 0.6 : 1,
                        }}
                          onMouseEnter={e => { if (!(emailExists || checkingEmail)) e.currentTarget.style.background = '#1ed760'; }}
                          onMouseLeave={e => { if (!(emailExists || checkingEmail)) e.currentTarget.style.background = GREEN; }}>
                          Continue <ArrowRight size={18} />
                        </button>
                      </form>

                      <p style={{ textAlign: 'center', color: '#525252', fontSize: 14, marginTop: 20 }}>
                        Already have an account?{' '}
                        <Link href="/login" style={{ color: '#fff', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
                      </p>
                    </motion.div>
                  )}

                  {/* STEP 1: Profile details */}
                  {step === 1 && (
                    <motion.form key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} onSubmit={handleNext}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                          <label style={labelStyle}>Display Name</label>
                          <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required autoFocus
                            style={inputStyle}
                            suppressHydrationWarning
                            onFocus={e => (e.target.style.borderColor = GREEN)}
                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')} />
                        </div>
                        <div>
                          <label style={labelStyle}>Date of Birth</label>
                          <input type="date" value={dob} onChange={e => setDob(e.target.value)} required
                            style={inputStyle}
                            suppressHydrationWarning
                            onFocus={e => (e.target.style.borderColor = GREEN)}
                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')} />
                        </div>
                        <div>
                          <label style={labelStyle}>Gender</label>
                          <select value={gender} onChange={e => setGender(e.target.value)}
                            style={inputStyle}
                            onFocus={e => (e.target.style.borderColor = GREEN)}
                            onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}>
                            <option value="">Prefer not to say</option>
                            <option value="man">Man</option>
                            <option value="woman">Woman</option>
                            <option value="nonbinary">Non-binary</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                          <button type="button" onClick={() => setStep(0)} style={{
                            flex: 1, padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.07)',
                            color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)',
                          }}>← Back</button>
                          <button type="submit" style={{
                            flex: 2, padding: '14px', borderRadius: 12, background: GREEN,
                            color: '#000', fontWeight: 800, fontSize: 15, cursor: 'pointer', border: 'none',
                            fontFamily: 'Outfit, sans-serif',
                          }}
                            onMouseEnter={e => (e.currentTarget.style.background = '#1ed760')}
                            onMouseLeave={e => (e.currentTarget.style.background = GREEN)}>
                            Continue →
                          </button>
                        </div>
                      </div>
                    </motion.form>
                  )}

                  {/* STEP 2: Password */}
                  {step === 2 && (
                    <motion.form key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} onSubmit={handleNext}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                          <label style={labelStyle}>Create Password</label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={password} onChange={e => setPassword(e.target.value)}
                              placeholder="8+ characters" required minLength={8} autoFocus
                              style={{ ...inputStyle, paddingRight: 48 }}
                              suppressHydrationWarning
                              onFocus={e => (e.target.style.borderColor = GREEN)}
                              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
                            />
                            <button type="button" onClick={() => setShowPassword(v => !v)}
                              style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#737373' }}>
                              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                          </div>
                          {/* Strength bar */}
                          {password.length > 0 && (
                            <div style={{ marginTop: 10 }}>
                              <div style={{ display: 'flex', gap: 4, marginBottom: 6 }}>
                                {[1, 2, 3, 4].map(i => (
                                  <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= passwordStrength ? strengthColor : 'rgba(255,255,255,0.1)', transition: 'background 0.3s' }} />
                                ))}
                              </div>
                              <p style={{ fontSize: 12, color: strengthColor, fontWeight: 600 }}>{strengthLabel}</p>
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={labelStyle}>Confirm Password</label>
                          <div style={{ position: 'relative' }}>
                            <input
                              type={showPassword ? 'text' : 'password'}
                              value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                              placeholder="Confirm your password" required minLength={8}
                              style={{ ...inputStyle, paddingRight: 48 }}
                              suppressHydrationWarning
                              onFocus={e => (e.target.style.borderColor = GREEN)}
                              onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')}
                            />
                          </div>
                        </div>

                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                          <div onClick={() => setAgreed(v => !v)} style={{
                            width: 18, height: 18, borderRadius: 4, border: `2px solid ${agreed ? GREEN : 'rgba(255,255,255,0.3)'}`,
                            background: agreed ? GREEN : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, marginTop: 1, cursor: 'pointer', transition: 'all 0.2s',
                          }}>
                            {agreed && <Check size={11} color="#000" />}
                          </div>
                          <span style={{ color: '#737373', fontSize: 13, lineHeight: 1.5 }}>
                            I agree to the{' '}
                            <span style={{ color: '#fff', textDecoration: 'underline', cursor: 'pointer' }}>Terms of Service</span>
                            {' '}and{' '}
                            <span style={{ color: '#fff', textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>
                          </span>
                        </label>

                        <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                          <button type="button" onClick={() => setStep(1)} style={{
                            flex: 1, padding: '14px', borderRadius: 12, background: 'rgba(255,255,255,0.07)',
                            color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer', border: '1px solid rgba(255,255,255,0.12)',
                          }}>← Back</button>
                          <button type="submit" disabled={isLoading || !agreed} style={{
                            flex: 2, padding: '14px', borderRadius: 12, background: (!agreed || isLoading) ? 'rgba(29, 185, 84,0.4)' : GREEN,
                            color: '#000', fontWeight: 800, fontSize: 15, cursor: (!agreed || isLoading) ? 'not-allowed' : 'pointer',
                            border: 'none', fontFamily: 'Outfit, sans-serif', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                          }}>
                            {isLoading ? (
                              <div style={{ width: 20, height: 20, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            ) : <>Create Account <ArrowRight size={16} /></>}
                          </button>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

                {/* Trust badges */}
                <div style={{ marginTop: 32, paddingTop: 24, borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                  {['🔒 Secure', '🆓 Free forever', '🎵 100M+ songs'].map(badge => (
                    <span key={badge} style={{ color: '#525252', fontSize: 12 }}>{badge}</span>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      </div>

      {/* ── MOBILE VIEW (Single card multi-step signup) ── */}
      <div className="mobile-view-container">
        {/* Logo & Subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Music2 size={36} color={GREEN} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 32, color: '#fff', letterSpacing: '-0.5px' }}>Beato</span>
          </div>
          <p style={{ color: '#737373', fontSize: 14, margin: 0 }}>Let streaming define your space.</p>
        </div>

        {/* Register Card */}
        <div style={{
          width: '100%',
          maxWidth: 400,
          background: '#0a0a0a',
          borderRadius: 24,
          padding: '32px 24px',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          boxShadow: '0 15px 35px rgba(0, 0, 0, 0.6)',
          boxSizing: 'border-box',
        }}>
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  style={{ width: 80, height: 80, borderRadius: '50%', background: 'rgba(29, 185, 84,0.15)', border: '2px solid #1db954', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 40px rgba(29, 185, 84,0.3)' }}>
                  <Check size={36} color="#1db954" />
                </motion.div>
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 800, color: '#fff', marginBottom: 8 }}>Welcome, {name || 'Music Lover'}! 🎉</h2>
                  <p style={{ color: '#737373', fontSize: 15 }}>Your account is ready. Taking you to Beato…</p>
                </div>
                <div style={{ width: 32, height: 32, border: '3px solid #1db954', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                
                {/* Header */}
                <div style={{ marginBottom: 24 }}>
                  <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 800, color: '#fff', marginBottom: 6 }}>Create account</h1>
                  <p style={{ color: '#737373', fontSize: 14 }}>Start your free Beato journey</p>
                </div>

                {/* Step indicators */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
                  {STEPS.map((s, i) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                      <div className="mobile-step-dot" style={{
                        background: i < step ? GREEN : i === step ? '#fff' : 'rgba(255,255,255,0.15)',
                        color: i <= step ? '#000' : 'rgba(255,255,255,0.4)',
                      }}>
                        {i < step ? <Check size={12} strokeWidth={3} /> : i + 1}
                      </div>
                      <span style={{ fontSize: 11, color: i === step ? '#fff' : '#525252', fontWeight: i === step ? 600 : 400 }}>{s}</span>
                      {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? GREEN : 'rgba(255,255,255,0.1)' }} />}
                    </div>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {/* STEP 0: Email Address */}
                  {step === 0 && (
                    <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <form onSubmit={handleNext}>
                        <div className="mobile-input-container" style={{ 
                          marginBottom: 20,
                          borderColor: emailExists ? '#ef4444' : undefined,
                          boxShadow: emailExists ? '0 0 0 1px #ef4444' : undefined
                        }}>
                          <Mail size={18} color="#737373" style={{ flexShrink: 0 }} />
                          <input 
                            type="email" 
                            placeholder="Email Address" 
                            className="mobile-input" 
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                            suppressHydrationWarning
                          />
                        </div>

                        {emailExists && (
                          <p style={{ color: '#ef4444', fontSize: 13, marginTop: -12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>⚠️</span> This email is already registered.
                          </p>
                        )}
                        {checkingEmail && (
                          <p style={{ color: '#a3a3a3', fontSize: 13, marginTop: -12, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ display: 'inline-block', width: 12, height: 12, border: '2px solid #a3a3a3', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                            Checking availability...
                          </p>
                        )}

                        <button type="submit" disabled={emailExists || checkingEmail} className="mobile-btn" style={{ opacity: (emailExists || checkingEmail) ? 0.5 : 1 }}>
                          Continue <ArrowRight size={18} style={{ marginLeft: 8 }} />
                        </button>
                      </form>

                      <p style={{ textAlign: 'center', color: '#525252', fontSize: 13, marginTop: 24 }}>
                        Already have an account?{' '}
                        <Link href="/login" style={{ color: '#fff', fontWeight: 600, textDecoration: 'none' }}>Log in</Link>
                      </p>
                    </motion.div>
                  )}

                  {/* STEP 1: Profile Details */}
                  {step === 1 && (
                    <motion.form key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} onSubmit={handleNext}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="mobile-input-container" style={{ marginBottom: 0 }}>
                          <User size={18} color="#737373" style={{ flexShrink: 0 }} />
                          <input 
                            type="text" 
                            placeholder="Display Name" 
                            className="mobile-input" 
                            value={name}
                            onChange={e => setName(e.target.value)}
                            required
                            suppressHydrationWarning
                          />
                        </div>

                        <div className="mobile-input-container" style={{ marginBottom: 0 }}>
                          <Calendar size={18} color="#737373" style={{ flexShrink: 0 }} />
                          <input 
                            type="date" 
                            className="mobile-input" 
                            value={dob}
                            onChange={e => setDob(e.target.value)}
                            required
                            suppressHydrationWarning
                          />
                        </div>

                        <div className="mobile-input-container" style={{ marginBottom: 8 }}>
                          <span style={{ fontSize: 18, color: '#737373', flexShrink: 0, display: 'flex', alignItems: 'center' }}>👥</span>
                          <select 
                            className="mobile-select" 
                            value={gender}
                            onChange={e => setGender(e.target.value)}
                            required
                          >
                            <option value="" disabled style={{ background: '#0a0a0a' }}>Select Gender</option>
                            <option value="man" style={{ background: '#0a0a0a' }}>Man</option>
                            <option value="woman" style={{ background: '#0a0a0a' }}>Woman</option>
                            <option value="nonbinary" style={{ background: '#0a0a0a' }}>Non-binary</option>
                            <option value="prefer-not-to-say" style={{ background: '#0a0a0a' }}>Prefer not to say</option>
                          </select>
                        </div>

                        <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
                          <button type="button" onClick={() => setStep(0)} className="mobile-btn-secondary">
                            Back
                          </button>
                          <button type="submit" className="mobile-btn-primary">
                            Continue
                          </button>
                        </div>
                      </div>
                    </motion.form>
                  )}

                  {/* STEP 2: Password Setting */}
                  {step === 2 && (
                    <motion.form key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} onSubmit={handleNext}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div className="mobile-input-container" style={{ marginBottom: 0 }}>
                          <Lock size={18} color="#737373" style={{ flexShrink: 0 }} />
                          <input 
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Create Password (8+ chars)" 
                            className="mobile-input" 
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            minLength={8}
                            required
                            suppressHydrationWarning
                          />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>

                        <div className="mobile-input-container" style={{ marginBottom: 8 }}>
                          <Lock size={18} color="#737373" style={{ flexShrink: 0 }} />
                          <input 
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Confirm Password" 
                            className="mobile-input" 
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            minLength={8}
                            required
                            suppressHydrationWarning
                          />
                        </div>

                        {/* Checkbox */}
                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', margin: '4px 0 12px 0' }}>
                          <input 
                            type="checkbox"
                            checked={agreed}
                            onChange={() => setAgreed(!agreed)}
                            style={{ marginTop: 3, cursor: 'pointer', width: 16, height: 16 }}
                            suppressHydrationWarning
                          />
                          <span style={{ color: '#737373', fontSize: 12, lineHeight: 1.4 }}>
                            I agree to the <span style={{ color: '#fff', textDecoration: 'underline' }}>Terms</span> & <span style={{ color: '#fff', textDecoration: 'underline' }}>Privacy Policy</span>.
                          </span>
                        </label>

                        <div style={{ display: 'flex', gap: 12 }}>
                          <button type="button" onClick={() => setStep(1)} className="mobile-btn-secondary">
                            Back
                          </button>
                          <button type="submit" disabled={isLoading || !agreed} className="mobile-btn-primary" style={{ opacity: (isLoading || !agreed) ? 0.5 : 1 }}>
                            {isLoading ? 'Creating...' : 'Register'}
                          </button>
                        </div>
                      </div>
                    </motion.form>
                  )}
                </AnimatePresence>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

    </div>
  );
}
