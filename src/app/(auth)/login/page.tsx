'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Music2, Check, Sparkles, Mail, Lock, Settings2 } from 'lucide-react';
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

export default function LoginPage() {
  const [step, setStep] = useState<'email' | 'password' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sandboxCode, setSandboxCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, loginWithSocial, sendOtp, verifyOtp } = useAuthStore();
  const router = useRouter();

  const [showServerSettings, setShowServerSettings] = useState(false);
  const [serverUrl, setServerUrl] = useState(() => {
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem('beato_api_url');
      if (stored && !stored.includes('192.168.') && !stored.includes('localhost') && !stored.includes('/login')) {
        return stored;
      }
    }
    return 'https://beato-music-app.vercel.app/';
  });

  const handleQuickLogin = async (mockEmail: string) => {
    setIsLoading(true);
    try {
      await login(mockEmail, 'password', true);
      toast.success(`Logged in! 🎵`);
      router.push('/home');
    } catch {
      toast.error('Quick login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email'); return; }
    setError('');
    setStep('password');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      await login(email, password);
      toast.success('Welcome back! 🎵');
      router.push('/home');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Invalid email or password');
      toast.error('Invalid credentials');
    } finally { setIsLoading(false); }
  };

  const handleSocialLogin = async (provider: string) => {
    setIsLoading(true);
    setError('');
    try {
      await loginWithSocial(provider);
      toast.success(`Logged in with ${provider}! 🎵`);
      router.push('/home');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg || 'Login failed');
      toast.error('Login failed');
    }
    finally { setIsLoading(false); }
  };

  const handleOtpChange = (i: number, val: string) => {
    if (val.length > 1) return;
    const n = [...otp]; n[i] = val; setOtp(n);
    if (val && i < 5) document.getElementById(`otp-${i + 1}`)?.focus();
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) { toast.error('Enter your phone number'); return; }
    setIsLoading(true);
    setError('');
    try {
      const data = await sendOtp(phone);
      setOtpSent(true);
      if (data.developmentSandboxCode) {
        setSandboxCode(data.developmentSandboxCode);
        toast.success(`[Sandbox] OTP: ${data.developmentSandboxCode}`);
      } else {
        toast.success('OTP sent via WhatsApp!');
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setError(msg || 'Failed to send OTP');
      toast.error(msg || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter 6-digit verification code'); return; }
    setIsLoading(true);
    setError('');
    try {
      await verifyOtp(phone, code);
      toast.success('Welcome back! 🎵');
      router.push('/home');
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setError(msg || 'Invalid verification code');
      toast.error(msg || 'Invalid verification code');
    } finally {
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
    <div className="login-page-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@700;800;900&display=swap');

        .login-page-wrapper {
          min-height: 100vh;
          background: ${BG};
          font-family: 'Inter', sans-serif;
        }

        /* ── Desktop ── */
        .auth-desktop {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100vh;
        }
        .auth-mobile {
          display: none;
        }

        /* Input focus glow */
        .auth-input:focus {
          border-color: ${PRIMARY} !important;
          box-shadow: 0 0 0 3px rgba(176, 136, 80, 0.12) !important;
        }
        .auth-input::placeholder { color: #b0a391; }

        /* Social button */
        .social-btn {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 18px;
          border-radius: 12px;
          border: 1.5px solid ${BORDER};
          background: ${ELEVATED};
          color: ${TEXT};
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: background 0.2s, border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 4px rgba(43,34,26,0.06);
        }
        .social-btn:hover {
          background: ${SURFACE};
          border-color: rgba(176, 136, 80, 0.35);
          box-shadow: 0 2px 8px rgba(43,34,26,0.08);
        }

        /* Primary CTA */
        .auth-btn-primary {
          width: 100%;
          padding: 14px;
          border-radius: 12px;
          background: ${PRIMARY};
          color: #fff;
          font-weight: 800;
          font-size: 16px;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'Outfit', sans-serif;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 4px 16px rgba(176, 136, 80, 0.3);
          letter-spacing: 0.02em;
        }
        .auth-btn-primary:hover:not(:disabled) {
          background: ${PRIMARY_DARK};
          box-shadow: 0 6px 20px rgba(176, 136, 80, 0.4);
        }
        .auth-btn-primary:active:not(:disabled) {
          transform: scale(0.98);
        }
        .auth-btn-primary:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        /* Secondary outline */
        .auth-btn-secondary {
          width: 100%;
          padding: 13px;
          border-radius: 12px;
          background: transparent;
          border: 1.5px solid ${BORDER};
          color: ${TEXT_SEC};
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          font-family: 'Inter', sans-serif;
          transition: background 0.2s, border-color 0.2s;
        }
        .auth-btn-secondary:hover {
          background: ${SURFACE};
          border-color: rgba(176, 136, 80, 0.3);
        }

        /* Mobile input wrapper */
        .m-input-wrap {
          display: flex;
          align-items: center;
          background: ${ELEVATED};
          border: 1.5px solid ${BORDER};
          border-radius: 12px;
          padding: 13px 16px;
          margin-bottom: 14px;
          transition: border-color 0.2s, box-shadow 0.2s;
          box-shadow: 0 1px 3px rgba(43,34,26,0.05);
        }
        .m-input-wrap:focus-within {
          border-color: ${PRIMARY};
          box-shadow: 0 0 0 3px rgba(176, 136, 80, 0.12);
        }
        .m-input {
          background: transparent;
          border: none;
          outline: none;
          color: ${TEXT};
          font-size: 15px;
          width: 100%;
          margin-left: 12px;
          padding: 0;
          font-family: 'Inter', sans-serif;
        }
        .m-input::placeholder { color: #b0a391; }

        /* Waveform animation */
        @keyframes waveAnim {
          0%, 100% { transform: scaleY(0.4); }
          50% { transform: scaleY(1); }
        }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.6; transform: scale(0.9); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes floatUp {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-12px); }
        }

        /* Vinyl rotate */
        @keyframes vinylSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Quick login grid */
        .quick-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 8px;
        }
        .quick-card {
          padding: 10px 12px;
          background: ${ELEVATED};
          border: 1.5px solid ${BORDER};
          border-radius: 10px;
          color: ${TEXT};
          text-align: left;
          cursor: pointer;
          font-size: 12px;
          display: flex;
          flex-direction: column;
          gap: 3px;
          transition: all 0.2s;
          box-shadow: 0 1px 3px rgba(43,34,26,0.05);
        }
        .quick-card:hover {
          background: ${SURFACE};
          border-color: rgba(176, 136, 80, 0.4);
          box-shadow: 0 3px 12px rgba(43,34,26,0.1);
        }

        @media (max-width: 768px) {
          .auth-desktop { display: none !important; }
          .auth-mobile {
            display: flex !important;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            background: ${BG};
            padding-top: calc(var(--sat, 0px) + 24px);
            padding-bottom: 24px;
            padding-left: 20px;
            padding-right: 20px;
            box-sizing: border-box;
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
          alignItems: 'center',
          padding: 60,
          background: `linear-gradient(145deg, ${SURFACE} 0%, #ede3d0 60%, #f7f0e6 100%)`,
          borderRight: `1px solid ${BORDER}`,
        }}>
          {/* Subtle texture orbs */}
          <div style={{ position: 'absolute', top: -60, right: -60, width: 340, height: 340, borderRadius: '50%', background: 'rgba(176,136,80,0.08)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', bottom: -60, left: -60, width: 280, height: 280, borderRadius: '50%', background: 'rgba(140,108,68,0.06)', filter: 'blur(60px)', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', top: '40%', left: '10%', width: 160, height: 160, borderRadius: '50%', background: 'rgba(176,136,80,0.05)', filter: 'blur(40px)', pointerEvents: 'none' }} />

          {/* Floating music notes */}
          {['♪', '♫', '♩', '♬', '♪'].map((note, i) => (
            <motion.div
              key={i}
              style={{
                position: 'absolute',
                left: `${[15, 75, 30, 65, 50][i]}%`,
                top: `${[20, 15, 72, 78, 48][i]}%`,
                color: `rgba(176,136,80,${[0.18, 0.12, 0.15, 0.1, 0.2][i]})`,
                fontSize: [28, 22, 26, 20, 24][i],
                pointerEvents: 'none',
                userSelect: 'none',
              }}
              animate={{ y: [0, -20, 0], opacity: [[0.18, 0.12, 0.15, 0.1, 0.2][i] as number, [0.35, 0.25, 0.3, 0.2, 0.4][i] as number, [0.18, 0.12, 0.15, 0.1, 0.2][i] as number] }}
              transition={{ duration: [4.2, 3.8, 5, 4.6, 3.5][i], delay: [0, 1, 0.7, 1.5, 0.4][i], repeat: Infinity, ease: 'easeInOut' }}
            >
              {note}
            </motion.div>
          ))}

          <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
            {/* Logo */}
            <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 48 }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: `linear-gradient(135deg, ${PRIMARY}, #8c6c44)`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px rgba(176,136,80,0.35)` }}>
                <Music2 size={22} color="#fff" />
              </div>
              <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 26, color: TEXT, letterSpacing: '-0.5px' }}>Beato</span>
            </Link>

            {/* Vinyl record */}
            <div style={{ position: 'relative', margin: '0 auto 40px', width: 200, height: 200 }}>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
                style={{
                  width: 200, height: 200, borderRadius: '50%',
                  background: `conic-gradient(from 0deg, #d4c4a0, #e8dcc0, #c8b080, #e0d4b8, #d4c4a0, #c0aa70, #d4c4a0)`,
                  boxShadow: `0 12px 40px rgba(176,136,80,0.2), 0 4px 16px rgba(43,34,26,0.12)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                {/* Grooves */}
                {[55, 80, 110].map(r => (
                  <div key={r} style={{ position: 'absolute', borderRadius: '50%', border: '1px solid rgba(43,34,26,0.08)', inset: `${(200 - r) / 2}px` }} />
                ))}
                <div style={{
                  width: 60, height: 60, borderRadius: '50%',
                  background: `linear-gradient(135deg, ${PRIMARY}, #8c6c44)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 16px rgba(176,136,80,0.4)`,
                }}>
                  <Music2 size={26} color="#fff" />
                </div>
              </motion.div>
              {/* Glow ring */}
              <div style={{ position: 'absolute', inset: -12, borderRadius: '50%', border: `2px solid rgba(176,136,80,0.15)`, animation: 'pulse 2s ease-in-out infinite' }} />
            </div>

            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 38, fontWeight: 900, color: TEXT, marginBottom: 12, letterSpacing: '-0.5px', lineHeight: 1.15 }}>
              Welcome back to{' '}
              <span style={{ background: `linear-gradient(135deg, ${PRIMARY}, #8c6c44)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Beato
              </span>
            </h2>
            <p style={{ color: TEXT_MUTED, fontSize: 15, lineHeight: 1.7 }}>
              Your music, your universe. Pick up right where you left off.
            </p>

            {/* Now playing card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              style={{
                marginTop: 36,
                padding: '14px 18px',
                borderRadius: 16,
                background: ELEVATED,
                border: `1px solid ${BORDER}`,
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                boxShadow: '0 4px 20px rgba(43,34,26,0.08)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'end', gap: 3, height: 20 }}>
                {[12, 18, 14, 20, 16].map((h, i) => (
                  <div key={i} style={{
                    width: 3, borderRadius: 2, background: PRIMARY, height: h,
                    animation: `waveAnim 0.8s ease-in-out infinite alternate`,
                    animationDelay: `${i * 0.12}s`,
                    transformOrigin: 'bottom',
                  }} />
                ))}
              </div>
              <div style={{ textAlign: 'left' }}>
                <p style={{ color: TEXT, fontSize: 13, fontWeight: 700 }}>Midnight Cascade</p>
                <p style={{ color: TEXT_MUTED, fontSize: 11 }}>Aurora Nightfall • 2.1M listeners</p>
              </div>
              <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: PRIMARY, animation: 'pulse 1.5s ease-in-out infinite' }} />
            </motion.div>
          </div>
        </div>

        {/* ── RIGHT: Form panel ── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 72px',
          background: BG,
          overflowY: 'auto',
        }}>
          <div style={{ width: '100%', maxWidth: 400 }}>
            <AnimatePresence mode="wait">

              {/* EMAIL STEP */}
              {step === 'email' && (
                <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div style={{ marginBottom: 36 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 100, background: 'rgba(176,136,80,0.1)', border: `1px solid rgba(176,136,80,0.25)`, marginBottom: 14 }}>
                      <Sparkles size={12} color={PRIMARY} />
                      <span style={{ color: PRIMARY, fontSize: 12, fontWeight: 600 }}>Sign in to your account</span>
                    </div>
                    <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 34, fontWeight: 900, color: TEXT, marginBottom: 6, letterSpacing: '-0.5px' }}>Welcome back</h1>
                    <p style={{ color: TEXT_MUTED, fontSize: 15 }}>Log in to continue streaming</p>
                  </div>

                  {/* Social buttons */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                    {[
                      { label: 'Continue with Google', icon: '🌐' },
                      { label: 'Continue with Apple', icon: '🍎' },
                      { label: 'Continue with GitHub', icon: '⚡' },
                    ].map(p => (
                      <button key={p.label} onClick={() => handleSocialLogin(p.label)} disabled={isLoading} className="social-btn">
                        <span style={{ fontSize: 18 }}>{p.icon}</span> {p.label}
                      </button>
                    ))}
                  </div>

                  {/* Divider */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
                    <div style={{ flex: 1, height: 1, background: BORDER }} />
                    <span style={{ color: TEXT_MUTED, fontSize: 13 }}>or with email</span>
                    <div style={{ flex: 1, height: 1, background: BORDER }} />
                  </div>

                  <form onSubmit={handleEmailContinue}>
                    <div style={{ marginBottom: 16 }}>
                      <label style={labelStyle}>Email address</label>
                      <input
                        type="email" value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="name@email.com" autoFocus required
                        className="auth-input"
                        style={inputStyle}
                        suppressHydrationWarning
                      />
                    </div>
                    <button type="submit" className="auth-btn-primary">
                      Continue <ArrowRight size={18} />
                    </button>
                  </form>

                  <p style={{ textAlign: 'center', color: TEXT_MUTED, fontSize: 14, marginTop: 24 }}>
                    Don&apos;t have an account?{' '}
                    <Link href="/register" style={{ color: PRIMARY, fontWeight: 700, textDecoration: 'none' }}>Sign up free</Link>
                  </p>
                </motion.div>
              )}

              {/* PASSWORD STEP */}
              {step === 'password' && (
                <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  <div style={{ marginBottom: 36 }}>
                    <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 34, fontWeight: 900, color: TEXT, marginBottom: 6 }}>Enter password</h1>
                    <p style={{ color: TEXT_MUTED, fontSize: 15 }}>Logging in as <span style={{ color: TEXT, fontWeight: 600 }}>{email}</span></p>
                  </div>

                  {/* Email pill */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 16px', borderRadius: 12, background: SURFACE, border: `1px solid ${BORDER}`, marginBottom: 20 }}>
                    <span style={{ color: TEXT_SEC, fontSize: 14 }}>{email}</span>
                    <button onClick={() => { setStep('email'); setError(''); }} style={{ color: PRIMARY, fontSize: 13, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Change</button>
                  </div>

                  {error && (
                    <div style={{ padding: '12px 16px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 12, color: '#b91c1c', fontSize: 14, fontWeight: 500, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span>⚠️</span> {error}
                    </div>
                  )}

                  <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: 20 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                        <label style={labelStyle}>Password</label>
                        <button type="button" style={{ color: PRIMARY, fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Forgot?</button>
                      </div>
                      <div style={{ position: 'relative' }}>
                        <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" autoFocus required
                          className="auth-input"
                          style={{ ...inputStyle, paddingRight: 48 }}
                          suppressHydrationWarning
                        />
                        <button type="button" onClick={() => setShowPassword(v => !v)}
                          style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: TEXT_MUTED }}>
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                    <button type="submit" disabled={isLoading} className="auth-btn-primary">
                      {isLoading
                        ? <div style={{ width: 22, height: 22, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                        : <>Log In <ArrowRight size={18} /></>}
                    </button>
                    <button type="button" onClick={() => { setStep('otp'); setError(''); }} className="auth-btn-secondary" style={{ marginTop: 12 }}>
                      Use OTP instead
                    </button>
                  </form>
                </motion.div>
              )}

              {/* OTP STEP */}
              {step === 'otp' && (
                <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                  {!otpSent ? (
                    <form onSubmit={handleSendOtp}>
                      <div style={{ marginBottom: 36 }}>
                        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 34, fontWeight: 900, color: TEXT, marginBottom: 6 }}>WhatsApp OTP</h1>
                        <p style={{ color: TEXT_MUTED, fontSize: 15 }}>Enter your WhatsApp number to log in without a password</p>
                      </div>
                      {error && (
                        <div style={{ padding: '12px 16px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 12, color: '#b91c1c', fontSize: 14, marginBottom: 20 }}>
                          ⚠️ {error}
                        </div>
                      )}
                      <div style={{ marginBottom: 20 }}>
                        <label style={labelStyle}>WhatsApp Number</label>
                        <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+919999999999" autoFocus required
                          className="auth-input"
                          style={inputStyle}
                          suppressHydrationWarning
                        />
                      </div>
                      <button type="submit" disabled={isLoading} className="auth-btn-primary" style={{ marginBottom: 12 }}>
                        {isLoading ? <div style={{ width: 22, height: 22, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <>Send OTP via WhatsApp <ArrowRight size={18} /></>}
                      </button>
                      <button type="button" onClick={() => { setStep('email'); setError(''); setOtpSent(false); }} style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif', width: '100%', textAlign: 'center' }}>← Back to Email</button>
                    </form>
                  ) : (
                    <form onSubmit={handleVerifyOtp}>
                      <div style={{ marginBottom: 36 }}>
                        <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 34, fontWeight: 900, color: TEXT, marginBottom: 6 }}>Verify OTP</h1>
                        <p style={{ color: TEXT_MUTED, fontSize: 15 }}>We sent a 6-digit code to <span style={{ color: TEXT, fontWeight: 600 }}>{phone}</span></p>
                      </div>
                      {error && <div style={{ padding: '12px 16px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 12, color: '#b91c1c', fontSize: 14, marginBottom: 20 }}>⚠️ {error}</div>}
                      {sandboxCode && (
                        <div style={{ padding: '10px 14px', borderRadius: 10, background: `rgba(176,136,80,0.08)`, border: `1px solid rgba(176,136,80,0.2)`, marginBottom: 20, textAlign: 'center' }}>
                          <p style={{ color: PRIMARY, fontSize: 13, fontWeight: 600 }}>[Dev Sandbox] Simulated WhatsApp:</p>
                          <p style={{ color: TEXT, fontSize: 22, fontWeight: 800, letterSpacing: 3, marginTop: 4 }}>{sandboxCode}</p>
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 10, marginBottom: 24, justifyContent: 'center' }}>
                        {otp.map((digit, i) => (
                          <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" value={digit} onChange={e => handleOtpChange(i, e.target.value)} maxLength={1}
                            suppressHydrationWarning
                            style={{
                              width: 52, height: 60, borderRadius: 12,
                              border: `2px solid ${digit ? PRIMARY : BORDER}`,
                              background: ELEVATED, color: TEXT, fontSize: 22, fontWeight: 700,
                              textAlign: 'center', outline: 'none', transition: 'border-color 0.2s, box-shadow 0.2s',
                              fontFamily: 'Outfit, sans-serif', boxShadow: digit ? `0 0 0 3px rgba(176,136,80,0.12)` : 'none',
                            }}
                            onFocus={e => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = '0 0 0 3px rgba(176,136,80,0.15)'; }}
                            onBlur={e => { e.target.style.borderColor = digit ? PRIMARY : BORDER; e.target.style.boxShadow = digit ? '0 0 0 3px rgba(176,136,80,0.12)' : 'none'; }} />
                        ))}
                      </div>
                      <button type="submit" disabled={otp.join('').length < 6 || isLoading} className="auth-btn-primary" style={{ marginBottom: 16, opacity: otp.join('').length < 6 ? 0.5 : 1 }}>
                        {isLoading ? <div style={{ width: 22, height: 22, border: '2.5px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : <>Verify & Log in <Check size={18} /></>}
                      </button>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <button type="button" onClick={() => { setOtpSent(false); setError(''); }} style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>← Change Number</button>
                        <button type="button" onClick={handleSendOtp} style={{ background: 'none', border: 'none', color: PRIMARY, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Resend Code</button>
                      </div>
                    </form>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Quick Login Section */}
            <div style={{ marginTop: 32, padding: 20, background: SURFACE, border: `1px solid ${BORDER}`, borderRadius: 16, boxShadow: '0 2px 8px rgba(43,34,26,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <span style={{ fontSize: 14 }}>🔐</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Test Accounts</span>
              </div>
              <div className="quick-grid">
                {[
                  { role: 'SUPER_ADMIN', email: 'superadmin@beato.com', label: 'Super Admin', dot: '#84cc16' },
                  { role: 'ADMIN', email: 'admin@beato.com', label: 'Admin / Mod', dot: '#10b981' },
                  { role: 'ARTIST', email: 'artist@beato.com', label: 'Artist User', dot: PRIMARY },
                  { role: 'USER', email: 'manoj@beato.io', label: 'Standard User', dot: '#34d399' },
                ].map(acc => (
                  <button key={acc.email} onClick={() => handleQuickLogin(acc.email)} disabled={isLoading} className="quick-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 7, height: 7, borderRadius: '50%', background: acc.dot, flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, fontSize: 12, color: TEXT }}>{acc.label}</span>
                    </div>
                    <span style={{ color: TEXT_MUTED, fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingLeft: 13 }}>{acc.email}</span>
                  </button>
                ))}
              </div>
            </div>

            <p style={{ textAlign: 'center', color: TEXT_MUTED, fontSize: 11, marginTop: 24, lineHeight: 1.6 }}>
              Protected by reCAPTCHA.{' '}
              <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>{' '}and{' '}
              <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms</span> apply.
            </p>
          </div>
        </div>
      </div>

      {/* ════════════════════ MOBILE ════════════════════ */}
      <div className="auth-mobile">
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 32 }}>
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
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 24, fontWeight: 800, color: TEXT, marginBottom: 22 }}>Welcome Back</h2>

          {error && (
            <div style={{ padding: '11px 14px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, color: '#b91c1c', fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={(e) => {
            e.preventDefault();
            if (!email || !password) { toast.error('Enter email and password'); return; }
            handleLogin(e);
          }}>
            <div className="m-input-wrap">
              <Mail size={18} color={TEXT_MUTED} style={{ flexShrink: 0 }} />
              <input type="email" placeholder="Email Address" className="m-input" value={email} onChange={e => setEmail(e.target.value)} required suppressHydrationWarning />
            </div>
            <div className="m-input-wrap" style={{ marginBottom: 22 }}>
              <Lock size={18} color={TEXT_MUTED} style={{ flexShrink: 0 }} />
              <input type={showPassword ? 'text' : 'password'} placeholder="Password" className="m-input" value={password} onChange={e => setPassword(e.target.value)} required suppressHydrationWarning />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', color: TEXT_MUTED, cursor: 'pointer', padding: 0, marginLeft: 6, display: 'flex', alignItems: 'center' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            <button type="submit" disabled={isLoading} className="auth-btn-primary">
              {isLoading ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : 'Log In'}
            </button>

            <Link href="/register" style={{ display: 'block', textAlign: 'center', color: PRIMARY, fontSize: 13, fontWeight: 700, marginTop: 18, textDecoration: 'none' }}>
              New to Beato? Sign Up Free
            </Link>
          </form>
        </div>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, margin: '24px 0 16px', width: '100%', maxWidth: 400 }}>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
          <span style={{ color: TEXT_MUTED, fontSize: 12 }}>or connect with</span>
          <div style={{ flex: 1, height: 1, background: BORDER }} />
        </div>

        {/* Demo Login */}
        <button onClick={() => handleQuickLogin('manoj@beato.io')} disabled={isLoading}
          style={{ background: SURFACE, color: PRIMARY, border: `1.5px solid rgba(176,136,80,0.3)`, fontSize: 13, fontWeight: 700, padding: '12px 28px', borderRadius: 100, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(43,34,26,0.06)' }}
          onMouseEnter={e => { e.currentTarget.style.background = '#ede3d0'; e.currentTarget.style.borderColor = 'rgba(176,136,80,0.5)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = SURFACE; e.currentTarget.style.borderColor = 'rgba(176,136,80,0.3)'; }}>
          Instant Demo Login
        </button>

        <button type="button" onClick={() => setShowServerSettings(true)}
          style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: 12, fontWeight: 600, marginTop: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'Inter, sans-serif' }}
          onMouseEnter={e => e.currentTarget.style.color = PRIMARY}
          onMouseLeave={e => e.currentTarget.style.color = TEXT_MUTED}>
          <Settings2 size={14} /> Change Server IP / URL
        </button>
      </div>

      {/* Server Settings Modal */}
      <AnimatePresence>
        {showServerSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(43,34,26,0.5)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              style={{ width: '100%', maxWidth: 400, background: ELEVATED, borderRadius: 24, border: `1px solid ${BORDER}`, padding: 28, boxShadow: '0 20px 50px rgba(43,34,26,0.2)' }}
            >
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, color: TEXT, marginBottom: 10 }}>Connection Settings</h3>
              <p style={{ fontSize: 13, color: TEXT_MUTED, lineHeight: 1.5, marginBottom: 20 }}>
                Enter your computer's local IP or a public tunnel URL so the app can reach the backend.
              </p>
              <div style={{ marginBottom: 20 }}>
                <label style={labelStyle}>Backend / API Server URL</label>
                <input type="text" value={serverUrl} onChange={e => setServerUrl(e.target.value)} placeholder="https://beato-music-app.vercel.app/"
                  className="auth-input"
                  style={inputStyle}
                />
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setShowServerSettings(false)}
                  style={{ flex: 1, padding: 12, borderRadius: 12, background: SURFACE, border: `1px solid ${BORDER}`, color: TEXT, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                  Cancel
                </button>
                <button type="button" onClick={() => {
                  if (typeof window !== 'undefined') {
                    const cleaned = serverUrl.trim();
                    if (!cleaned) { toast.error('URL cannot be empty'); return; }
                    window.localStorage.setItem('beato_api_url', cleaned);
                    toast.success('Saved! Reloading...');
                    setShowServerSettings(false);
                    setTimeout(() => window.location.reload(), 1200);
                  }
                }}
                  style={{ flex: 1, padding: 12, borderRadius: 12, background: PRIMARY, color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                  Save & Reload
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
