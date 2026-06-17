'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, ArrowRight, Check, Eye, EyeOff, Headphones, Radio, Download, Mail, Lock, User, Calendar } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const PRIMARY = '#b08850';
const PRIMARY_DARK = '#937041';
const BG = '#fbf9f5';
const SURFACE = '#f4eede';
const ELEVATED = '#ffffff';
const TEXT = '#221a15';
const TEXT_SEC = '#4d3f35';
const TEXT_MUTED = '#87786c';
const BORDER = 'rgba(43, 34, 26, 0.1)';

const FloatingNote = ({ x, y, delay, char, opacity }: { x: string; y: string; delay: number; char: string; opacity: number }) => (
  <motion.div
    style={{ position: 'absolute', left: x, top: y, color: `rgba(176,136,80,${opacity})`, fontSize: 24, pointerEvents: 'none', userSelect: 'none' }}
    animate={{ y: [0, -28, 0], opacity: [opacity, opacity * 2.2, opacity] }}
    transition={{ duration: 4, delay, repeat: Infinity, ease: 'easeInOut' }}
  >
    {char}
  </motion.div>
);

const FeaturePill = ({ icon: Icon, label, color }: { icon: React.ComponentType<{ size?: number; color?: string }>; label: string; color: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 100, background: ELEVATED, border: `1px solid ${BORDER}`, width: 'fit-content', boxShadow: '0 2px 8px rgba(43,34,26,0.06)' }}>
    <Icon size={16} color={color} />
    <span style={{ color: TEXT_SEC, fontSize: 13, fontWeight: 600 }}>{label}</span>
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
        if (isMounted) { setEmailExists(false); setCheckingEmail(false); }
        return;
      }
      if (isMounted) setCheckingEmail(true);
      try {
        const response = await fetch('/api/auth/check-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        const data = await response.json();
        if (isMounted) setEmailExists(!!data.exists);
      } catch (err) {
        console.error('Error checking email:', err);
        if (isMounted) setEmailExists(false);
      } finally {
        if (isMounted) setCheckingEmail(false);
      }
    };
    const timer = setTimeout(checkEmail, 500);
    return () => { isMounted = false; clearTimeout(timer); };
  }, [email]);

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.length < 14 ? 3 : 4;
  const strengthColor = ['#d4ccc0', '#ef4444', '#f59e0b', '#b08850', '#22c55e'][passwordStrength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 0) {
      if (emailExists) { toast.error('This email is already registered'); return; }
      if (checkingEmail) { toast.error('Checking email availability...'); return; }
    }
    if (step < 2) { setStep(s => s + 1); return; }
    if (password !== confirmPassword) { toast.error('Passwords do not match'); return; }
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
    width: '100%',
    background: ELEVATED,
    border: `1.5px solid ${BORDER}`,
    borderRadius: 12,
    padding: '13px 16px',
    color: TEXT,
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 11,
    fontWeight: 700,
    color: TEXT_MUTED,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    marginBottom: 8,
  };

  return (
    <div className="register-page-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@700;800;900&display=swap');

        .register-page-wrapper {
          min-height: 100vh;
          background: ${BG};
          font-family: 'Inter', sans-serif;
        }
        .auth-desktop { display: grid; grid-template-columns: 1fr 1fr; min-height: 100vh; }
        .auth-mobile { display: none; }

        .auth-input:focus {
          border-color: ${PRIMARY} !important;
          box-shadow: 0 0 0 3px rgba(176,136,80,0.12) !important;
        }
        .auth-input::placeholder { color: #b0a391; }
        .auth-select:focus {
          border-color: ${PRIMARY} !important;
          box-shadow: 0 0 0 3px rgba(176,136,80,0.12) !important;
        }

        .social-btn {
          display: flex; align-items: center; gap: 12px; padding: 12px 18px;
          border-radius: 12px; border: 1.5px solid ${BORDER};
          background: ${ELEVATED}; color: ${TEXT}; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 4px rgba(43,34,26,0.06);
        }
        .social-btn:hover { background: ${SURFACE}; border-color: rgba(176,136,80,0.35); box-shadow: 0 2px 8px rgba(43,34,26,0.08); }

        .auth-btn-primary {
          width: 100%; padding: 14px; border-radius: 12px;
          background: ${PRIMARY}; color: #fff; font-weight: 800; font-size: 16px;
          cursor: pointer; border: none; display: flex; align-items: center;
          justify-content: center; gap: 8px; font-family: 'Outfit', sans-serif;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 4px 16px rgba(176,136,80,0.3); letter-spacing: 0.02em;
        }
        .auth-btn-primary:hover:not(:disabled) { background: ${PRIMARY_DARK}; box-shadow: 0 6px 20px rgba(176,136,80,0.4); }
        .auth-btn-primary:active:not(:disabled) { transform: scale(0.98); }
        .auth-btn-primary:disabled { opacity: 0.55; cursor: not-allowed; }

        .auth-btn-back {
          flex: 1; padding: 13px; border-radius: 12px;
          background: ${SURFACE}; border: 1.5px solid ${BORDER};
          color: ${TEXT_SEC}; font-size: 14px; font-weight: 600;
          cursor: pointer; font-family: 'Inter', sans-serif;
          transition: background 0.2s, border-color 0.2s;
        }
        .auth-btn-back:hover { background: #e8dcca; border-color: rgba(176,136,80,0.3); }

        .m-input-wrap {
          display: flex; align-items: center;
          background: ${ELEVATED}; border: 1.5px solid ${BORDER};
          border-radius: 12px; padding: 13px 16px; margin-bottom: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 3px rgba(43,34,26,0.05);
        }
        .m-input-wrap:focus-within {
          border-color: ${PRIMARY};
          box-shadow: 0 0 0 3px rgba(176,136,80,0.12);
        }
        .m-input, .m-select {
          background: transparent; border: none; outline: none;
          color: ${TEXT}; font-size: 15px; width: 100%;
          margin-left: 12px; padding: 0; font-family: 'Inter', sans-serif;
        }
        .m-input::placeholder { color: #b0a391; }

        .m-btn-primary {
          background: ${PRIMARY}; color: #fff; font-size: 15px; font-weight: 800;
          padding: 14px; border-radius: 100px; border: none; cursor: pointer;
          font-family: 'Outfit', sans-serif; transition: background 0.2s, transform 0.1s;
          display: flex; align-items: center; justify-content: center; flex: 2;
          box-shadow: 0 4px 14px rgba(176,136,80,0.3);
        }
        .m-btn-primary:hover { background: ${PRIMARY_DARK}; }
        .m-btn-primary:active { transform: scale(0.98); }
        .m-btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

        .m-btn-secondary {
          background: ${SURFACE}; color: ${TEXT_SEC}; font-size: 15px; font-weight: 600;
          padding: 14px; border-radius: 100px; border: 1.5px solid ${BORDER};
          cursor: pointer; font-family: 'Outfit', sans-serif;
          transition: background 0.2s, border-color 0.2s;
          display: flex; align-items: center; justify-content: center; flex: 1;
        }
        .m-btn-secondary:hover { background: #e8dcca; border-color: rgba(176,136,80,0.3); }

        .m-step-dot {
          width: 24px; height: 24px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; transition: all 0.3s; flex-shrink: 0;
        }

        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
        @keyframes waveAnim {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }

        @media (max-width: 768px) {
          .auth-desktop { display: none !important; }
          .auth-mobile {
            display: flex !important; flex-direction: column;
            align-items: center; justify-content: center;
            min-height: 100vh; background: ${BG};
            padding: 24px 20px; box-sizing: border-box;
          }
        }
      `}</style>

      {/* ════════════════════ DESKTOP ════════════════════ */}
      <div className="auth-desktop">

        {/* ── LEFT: Brand panel ── */}
        <div style={{
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '60px 64px',
          background: `linear-gradient(145deg, ${SURFACE} 0%, #ede3d0 60%, #f7f0e6 100%)`,
          borderRight: `1px solid ${BORDER}`,
        }}>
          {/* Glow orbs */}
          <div style={{ position: 'absolute', top: -80, left: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(176,136,80,0.1)', filter: 'blur(70px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(140,108,68,0.07)', filter: 'blur(60px)', pointerEvents: 'none' }} />

          {/* Floating music notes */}
          {[
            { x: '10%', y: '12%', delay: 0, char: '♪', opacity: 0.18 },
            { x: '78%', y: '18%', delay: 1.2, char: '♫', opacity: 0.12 },
            { x: '22%', y: '72%', delay: 0.6, char: '♩', opacity: 0.15 },
            { x: '68%', y: '76%', delay: 1.8, char: '♬', opacity: 0.1 },
            { x: '52%', y: '44%', delay: 0.9, char: '♪', opacity: 0.14 },
          ].map((n, i) => <FloatingNote key={i} {...n} />)}

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Logo */}
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 52 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${PRIMARY}, #8c6c44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px rgba(176,136,80,0.35)` }}>
                <Music2 size={22} color="#fff" />
              </div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 26, color: TEXT, letterSpacing: '-0.5px' }}>Beato</span>
            </Link>

            {/* Headline */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 46, fontWeight: 900, lineHeight: 1.1, marginBottom: 18, letterSpacing: '-1px', color: TEXT }}>
                100M+ songs.<br />
                <span style={{ background: `linear-gradient(135deg, ${PRIMARY}, #8c6c44)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  One universe.
                </span>
              </h2>
              <p style={{ color: TEXT_MUTED, fontSize: 15, lineHeight: 1.75, marginBottom: 38, maxWidth: 380 }}>
                Join millions of music lovers. Stream, discover, and experience music like never before — completely free.
              </p>
            </motion.div>

            {/* Feature pills */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
              style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <FeaturePill icon={Headphones} label="Lossless 320kbps audio quality" color={PRIMARY} />
              <FeaturePill icon={Radio} label="AI-powered music recommendations" color="#10b981" />
              <FeaturePill icon={Download} label="Offline downloads up to 10,000 songs" color="#34d399" />
            </motion.div>

            {/* Social proof */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ marginTop: 44, display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 16, background: ELEVATED, border: `1px solid ${BORDER}`, boxShadow: '0 4px 16px rgba(43,34,26,0.07)', width: 'fit-content' }}>
              <div style={{ display: 'flex' }}>
                {[PRIMARY, '#10b981', '#34d399', '#84cc16'].map((c, i) => (
                  <div key={i} style={{ width: 30, height: 30, borderRadius: '50%', background: c, border: `2px solid ${ELEVATED}`, marginLeft: i > 0 ? -8 : 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', boxShadow: '0 2px 6px rgba(43,34,26,0.15)' }}>
                    {['A', 'B', 'C', 'D'][i]}
                  </div>
                ))}
              </div>
              <div>
                <p style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>2.4M+ active listeners</p>
                <p style={{ color: TEXT_MUTED, fontSize: 12 }}>Join them today — it&apos;s free</p>
              </div>
            </motion.div>
          </div>
        </div>

        {/* ── RIGHT: Form panel ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '60px 72px', background: BG, overflowY: 'auto' }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <AnimatePresence mode="wait">
              {done ? (
                <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
                  <motion.div
                    initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                    style={{ width: 84, height: 84, borderRadius: '50%', background: `rgba(176,136,80,0.12)`, border: `2px solid ${PRIMARY}`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px rgba(176,136,80,0.25)` }}>
                    <Check size={36} color={PRIMARY} />
                  </motion.div>
                  <div>
                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 800, color: TEXT, marginBottom: 8 }}>Welcome, {name || 'Music Lover'}! 🎉</h2>
                    <p style={{ color: TEXT_MUTED, fontSize: 15 }}>Your account is ready. Taking you to Beato…</p>
                  </div>
                  <div style={{ width: 32, height: 32, border: `3px solid ${PRIMARY}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                </motion.div>
              ) : (
                <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  {/* Header */}
                  <div style={{ marginBottom: 32 }}>
                    <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 34, fontWeight: 900, color: TEXT, marginBottom: 6, letterSpacing: '-0.5px' }}>Create account</h1>
                    <p style={{ color: TEXT_MUTED, fontSize: 15 }}>Start your free Beato journey</p>
                  </div>

                  {/* Step indicator */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 32 }}>
                    {STEPS.map((s, i) => (
                      <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 12, fontWeight: 700, flexShrink: 0, transition: 'all 0.3s',
                          background: i < step ? PRIMARY : i === step ? TEXT : SURFACE,
                          color: i <= step ? '#fff' : TEXT_MUTED,
                          boxShadow: i === step ? `0 4px 12px rgba(176,136,80,0.25)` : 'none',
                          border: i === step ? `none` : `1.5px solid ${BORDER}`,
                        }}>
                          {i < step ? <Check size={13} /> : i + 1}
                        </div>
                        <span style={{ fontSize: 11, color: i === step ? TEXT : TEXT_MUTED, fontWeight: i === step ? 700 : 400, transition: 'color 0.3s' }}>{s}</span>
                        {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, borderRadius: 1, background: i < step ? PRIMARY : BORDER, transition: 'background 0.3s' }} />}
                      </div>
                    ))}
                  </div>

                  <AnimatePresence mode="wait">
                    {/* STEP 0 */}
                    {step === 0 && (
                      <motion.div key="s0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                          {[
                            { label: 'Continue with Google', icon: '🌐' },
                            { label: 'Continue with Apple', icon: '🍎' },
                            { label: 'Continue with GitHub', icon: '⚡' },
                          ].map(p => (
                            <button key={p.label} className="social-btn">
                              <span style={{ fontSize: 18 }}>{p.icon}</span> {p.label}
                            </button>
                          ))}
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 22 }}>
                          <div style={{ flex: 1, height: 1, background: BORDER }} />
                          <span style={{ color: TEXT_MUTED, fontSize: 13 }}>or use email</span>
                          <div style={{ flex: 1, height: 1, background: BORDER }} />
                        </div>

                        <form onSubmit={handleNext}>
                          <div style={{ marginBottom: 14 }}>
                            <label style={labelStyle}>Email Address</label>
                            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@email.com" required
                              className="auth-input"
                              style={{ ...inputStyle, borderColor: emailExists ? '#dc2626' : BORDER }}
                              suppressHydrationWarning
                            />
                          </div>
                          {emailExists && (
                            <p style={{ color: '#dc2626', fontSize: 13, marginTop: -6, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span>⚠️</span> This email is already registered.
                            </p>
                          )}
                          {checkingEmail && (
                            <p style={{ color: TEXT_MUTED, fontSize: 13, marginTop: -6, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 6 }}>
                              <span style={{ display: 'inline-block', width: 12, height: 12, border: `2px solid ${TEXT_MUTED}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                              Checking availability...
                            </p>
                          )}
                          <button type="submit" disabled={emailExists || checkingEmail} className="auth-btn-primary">
                            Continue <ArrowRight size={18} />
                          </button>
                        </form>

                        <p style={{ textAlign: 'center', color: TEXT_MUTED, fontSize: 14, marginTop: 20 }}>
                          Already have an account?{' '}
                          <Link href="/login" style={{ color: PRIMARY, fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
                        </p>
                      </motion.div>
                    )}

                    {/* STEP 1 */}
                    {step === 1 && (
                      <motion.form key="s1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} onSubmit={handleNext}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div>
                            <label style={labelStyle}>Display Name</label>
                            <input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required autoFocus
                              className="auth-input" style={inputStyle} suppressHydrationWarning />
                          </div>
                          <div>
                            <label style={labelStyle}>Date of Birth</label>
                            <input type="date" value={dob} onChange={e => setDob(e.target.value)} required
                              className="auth-input" style={inputStyle} suppressHydrationWarning />
                          </div>
                          <div>
                            <label style={labelStyle}>Gender</label>
                            <select value={gender} onChange={e => setGender(e.target.value)}
                              className="auth-select" style={{ ...inputStyle, appearance: 'auto', cursor: 'pointer', color: gender ? TEXT : TEXT_MUTED }}
                              onFocus={e => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = '0 0 0 3px rgba(176,136,80,0.12)'; }}
                              onBlur={e => { e.target.style.borderColor = BORDER; e.target.style.boxShadow = 'none'; }}>
                              <option value="">Prefer not to say</option>
                              <option value="man">Man</option>
                              <option value="woman">Woman</option>
                              <option value="nonbinary">Non-binary</option>
                            </select>
                          </div>
                          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                            <button type="button" onClick={() => setStep(0)} className="auth-btn-back">← Back</button>
                            <button type="submit" style={{
                              flex: 2, padding: '13px', borderRadius: 12, background: PRIMARY,
                              color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', border: 'none',
                              fontFamily: 'Outfit, sans-serif', boxShadow: '0 4px 16px rgba(176,136,80,0.3)',
                              transition: 'background 0.2s',
                            }}
                              onMouseEnter={e => (e.currentTarget.style.background = PRIMARY_DARK)}
                              onMouseLeave={e => (e.currentTarget.style.background = PRIMARY)}>
                              Continue →
                            </button>
                          </div>
                        </div>
                      </motion.form>
                    )}

                    {/* STEP 2 */}
                    {step === 2 && (
                      <motion.form key="s2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} onSubmit={handleNext}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div>
                            <label style={labelStyle}>Create Password</label>
                            <div style={{ position: 'relative' }}>
                              <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                                placeholder="8+ characters" required minLength={8} autoFocus
                                className="auth-input" style={{ ...inputStyle, paddingRight: 48 }} suppressHydrationWarning />
                              <button type="button" onClick={() => setShowPassword(v => !v)}
                                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUTED }}>
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                            {password.length > 0 && (
                              <div style={{ marginTop: 10 }}>
                                <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                                  {[1, 2, 3, 4].map(i => (
                                    <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= passwordStrength ? strengthColor : BORDER, transition: 'background 0.3s' }} />
                                  ))}
                                </div>
                                <p style={{ fontSize: 12, color: strengthColor, fontWeight: 700 }}>{strengthLabel}</p>
                              </div>
                            )}
                          </div>

                          <div>
                            <label style={labelStyle}>Confirm Password</label>
                            <div style={{ position: 'relative' }}>
                              <input type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                                placeholder="Confirm your password" required minLength={8}
                                className="auth-input" style={{ ...inputStyle, paddingRight: 48 }} suppressHydrationWarning />
                            </div>
                          </div>

                          <label style={{ display: 'flex', alignItems: 'flex-start', gap: 12, cursor: 'pointer' }}>
                            <div onClick={() => setAgreed(v => !v)} style={{
                              width: 18, height: 18, borderRadius: 5,
                              border: `2px solid ${agreed ? PRIMARY : BORDER}`,
                              background: agreed ? PRIMARY : ELEVATED,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, marginTop: 1, cursor: 'pointer', transition: 'all 0.2s',
                              boxShadow: agreed ? `0 0 0 3px rgba(176,136,80,0.15)` : 'none',
                            }}>
                              {agreed && <Check size={11} color="#fff" />}
                            </div>
                            <span style={{ color: TEXT_MUTED, fontSize: 13, lineHeight: 1.5 }}>
                              I agree to the{' '}
                              <span style={{ color: PRIMARY, textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>Terms of Service</span>
                              {' '}and{' '}
                              <span style={{ color: PRIMARY, textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}>Privacy Policy</span>
                            </span>
                          </label>

                          <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                            <button type="button" onClick={() => setStep(1)} className="auth-btn-back">← Back</button>
                            <button type="submit" disabled={isLoading || !agreed} style={{
                              flex: 2, padding: '13px', borderRadius: 12,
                              background: (!agreed || isLoading) ? `rgba(176,136,80,0.4)` : PRIMARY,
                              color: '#fff', fontWeight: 800, fontSize: 15,
                              cursor: (!agreed || isLoading) ? 'not-allowed' : 'pointer',
                              border: 'none', fontFamily: 'Outfit, sans-serif',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                              transition: 'background 0.2s',
                            }}>
                              {isLoading ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <>Create Account <ArrowRight size={16} /></>}
                            </button>
                          </div>
                        </div>
                      </motion.form>
                    )}
                  </AnimatePresence>

                  {/* Trust badges */}
                  <div style={{ marginTop: 32, paddingTop: 22, borderTop: `1px solid ${BORDER}`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
                    {['🔒 Secure', '🆓 Free forever', '🎵 100M+ songs'].map(badge => (
                      <span key={badge} style={{ color: TEXT_MUTED, fontSize: 12 }}>{badge}</span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* ════════════════════ MOBILE ════════════════════ */}
      <div className="auth-mobile">
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: `linear-gradient(135deg, ${PRIMARY}, #8c6c44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 18px rgba(176,136,80,0.3)` }}>
              <Music2 size={20} color="#fff" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 30, color: TEXT, letterSpacing: '-0.5px' }}>Beato</span>
          </div>
          <p style={{ color: TEXT_MUTED, fontSize: 13, margin: 0 }}>Let streaming define your space.</p>
        </div>

        {/* Card */}
        <div style={{ width: '100%', maxWidth: 400, background: ELEVATED, borderRadius: 24, padding: '28px 22px', border: `1px solid ${BORDER}`, boxShadow: '0 8px 32px rgba(43,34,26,0.1)', boxSizing: 'border-box' }}>
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 18, padding: '12px 0' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                  style={{ width: 72, height: 72, borderRadius: '50%', background: `rgba(176,136,80,0.1)`, border: `2px solid ${PRIMARY}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Check size={32} color={PRIMARY} />
                </motion.div>
                <div>
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 22, fontWeight: 800, color: TEXT, marginBottom: 6 }}>Welcome, {name || 'Music Lover'}! 🎉</h2>
                  <p style={{ color: TEXT_MUTED, fontSize: 14 }}>Taking you to Beato…</p>
                </div>
                <div style={{ width: 28, height: 28, border: `3px solid ${PRIMARY}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={{ marginBottom: 22 }}>
                  <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 800, color: TEXT, marginBottom: 4 }}>Create account</h1>
                  <p style={{ color: TEXT_MUTED, fontSize: 13 }}>Start your free Beato journey</p>
                </div>

                {/* Step indicators */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
                  {STEPS.map((s, i) => (
                    <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
                      <div className="m-step-dot" style={{
                        background: i < step ? PRIMARY : i === step ? TEXT : SURFACE,
                        color: i <= step ? '#fff' : TEXT_MUTED,
                        border: i < step || i === step ? 'none' : `1.5px solid ${BORDER}`,
                      }}>
                        {i < step ? <Check size={12} strokeWidth={3} /> : i + 1}
                      </div>
                      <span style={{ fontSize: 10, color: i === step ? TEXT : TEXT_MUTED, fontWeight: i === step ? 700 : 400 }}>{s}</span>
                      {i < STEPS.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? PRIMARY : BORDER, borderRadius: 1 }} />}
                    </div>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {/* Mobile Step 0 */}
                  {step === 0 && (
                    <motion.div key="ms0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }}>
                      <form onSubmit={handleNext}>
                        <div className="m-input-wrap" style={{ borderColor: emailExists ? '#dc2626' : undefined }}>
                          <Mail size={18} color={TEXT_MUTED} style={{ flexShrink: 0 }} />
                          <input type="email" placeholder="Email Address" className="m-input" value={email} onChange={e => setEmail(e.target.value)} required suppressHydrationWarning />
                        </div>
                        {emailExists && <p style={{ color: '#dc2626', fontSize: 12, marginTop: -8, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 5 }}><span>⚠️</span> Already registered.</p>}
                        {checkingEmail && <p style={{ color: TEXT_MUTED, fontSize: 12, marginTop: -8, marginBottom: 12 }}>Checking availability...</p>}
                        <button type="submit" disabled={emailExists || checkingEmail} className="m-btn-primary" style={{ width: '100%', borderRadius: 100, opacity: (emailExists || checkingEmail) ? 0.5 : 1 }}>
                          Continue <ArrowRight size={18} style={{ marginLeft: 6 }} />
                        </button>
                      </form>
                      <p style={{ textAlign: 'center', color: TEXT_MUTED, fontSize: 13, marginTop: 20 }}>
                        Already have an account?{' '}
                        <Link href="/login" style={{ color: PRIMARY, fontWeight: 700, textDecoration: 'none' }}>Log in</Link>
                      </p>
                    </motion.div>
                  )}

                  {/* Mobile Step 1 */}
                  {step === 1 && (
                    <motion.form key="ms1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} onSubmit={handleNext}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div className="m-input-wrap" style={{ marginBottom: 0 }}>
                          <User size={18} color={TEXT_MUTED} style={{ flexShrink: 0 }} />
                          <input type="text" placeholder="Display Name" className="m-input" value={name} onChange={e => setName(e.target.value)} required suppressHydrationWarning />
                        </div>
                        <div className="m-input-wrap" style={{ marginBottom: 0 }}>
                          <Calendar size={18} color={TEXT_MUTED} style={{ flexShrink: 0 }} />
                          <input type="date" className="m-input" value={dob} onChange={e => setDob(e.target.value)} required suppressHydrationWarning />
                        </div>
                        <div className="m-input-wrap" style={{ marginBottom: 6 }}>
                          <span style={{ fontSize: 18, color: TEXT_MUTED, flexShrink: 0, display: 'flex', alignItems: 'center' }}>👥</span>
                          <select className="m-select" value={gender} onChange={e => setGender(e.target.value)} required>
                            <option value="" disabled style={{ background: ELEVATED }}>Select Gender</option>
                            <option value="man" style={{ background: ELEVATED }}>Man</option>
                            <option value="woman" style={{ background: ELEVATED }}>Woman</option>
                            <option value="nonbinary" style={{ background: ELEVATED }}>Non-binary</option>
                            <option value="prefer-not-to-say" style={{ background: ELEVATED }}>Prefer not to say</option>
                          </select>
                        </div>
                        <div style={{ display: 'flex', gap: 12 }}>
                          <button type="button" onClick={() => setStep(0)} className="m-btn-secondary">Back</button>
                          <button type="submit" className="m-btn-primary">Continue</button>
                        </div>
                      </div>
                    </motion.form>
                  )}

                  {/* Mobile Step 2 */}
                  {step === 2 && (
                    <motion.form key="ms2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.2 }} onSubmit={handleNext}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        <div className="m-input-wrap" style={{ marginBottom: 0 }}>
                          <Lock size={18} color={TEXT_MUTED} style={{ flexShrink: 0 }} />
                          <input type={showPassword ? 'text' : 'password'} placeholder="Create Password (8+ chars)" className="m-input" value={password} onChange={e => setPassword(e.target.value)} minLength={8} required suppressHydrationWarning />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', color: TEXT_MUTED, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                          </button>
                        </div>
                        <div className="m-input-wrap" style={{ marginBottom: 6 }}>
                          <Lock size={18} color={TEXT_MUTED} style={{ flexShrink: 0 }} />
                          <input type={showPassword ? 'text' : 'password'} placeholder="Confirm Password" className="m-input" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={8} required suppressHydrationWarning />
                        </div>

                        <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, cursor: 'pointer', margin: '2px 0 10px' }}>
                          <div onClick={() => setAgreed(!agreed)} style={{
                            width: 17, height: 17, borderRadius: 4,
                            border: `2px solid ${agreed ? PRIMARY : BORDER}`,
                            background: agreed ? PRIMARY : ELEVATED,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            flexShrink: 0, marginTop: 2, cursor: 'pointer', transition: 'all 0.2s',
                          }}>
                            {agreed && <Check size={10} color="#fff" />}
                          </div>
                          <span style={{ color: TEXT_MUTED, fontSize: 12, lineHeight: 1.4 }}>
                            I agree to the <span style={{ color: PRIMARY, textDecoration: 'underline', fontWeight: 600 }}>Terms</span> & <span style={{ color: PRIMARY, textDecoration: 'underline', fontWeight: 600 }}>Privacy Policy</span>
                          </span>
                        </label>

                        <div style={{ display: 'flex', gap: 12 }}>
                          <button type="button" onClick={() => setStep(1)} className="m-btn-secondary">Back</button>
                          <button type="submit" disabled={isLoading || !agreed} className="m-btn-primary" style={{ opacity: (isLoading || !agreed) ? 0.5 : 1 }}>
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
