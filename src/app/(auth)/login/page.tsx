'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Music2, Check, Sparkles, Mail, Lock } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const GREEN = '#1db954';

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
      return window.localStorage.getItem('beato_api_url') || 'http://192.168.1.7:3000';
    }
    return 'http://192.168.1.7:3000';
  });

  const handleQuickLogin = async (mockEmail: string) => {
    setIsLoading(true);
    try {
      await login(mockEmail, 'password');
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
        toast.success(`[Sandbox] OTP sent via WhatsApp: ${data.developmentSandboxCode}`);
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
    width: '100%', background: 'rgba(255,255,255,0.07)', border: '1.5px solid rgba(255,255,255,0.15)',
    borderRadius: 12, padding: '14px 16px', color: '#fff', fontSize: 15, outline: 'none',
    transition: 'border-color 0.2s', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box',
  };
  const labelStyle: React.CSSProperties = {
    display: 'block', fontSize: 11, fontWeight: 700, color: '#737373',
    textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8,
  };

  return (
    <div className="login-page-wrapper">
      <style>{`
        .login-page-wrapper {
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
        .mobile-demo-btn {
          background: #111;
          color: #1db954;
          border: 1.5px solid rgba(255, 255, 255, 0.08);
          font-size: 13px;
          font-weight: 700;
          padding: 12px 28px;
          border-radius: 100px;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Outfit', sans-serif;
        }
        .mobile-demo-btn:hover {
          background: #1a1a1a;
          border-color: rgba(29, 185, 84, 0.3);
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
            padding: 0 24px;
            box-sizing: border-box;
          }
        }
      `}</style>

      {/* ── DESKTOP VIEW ── */}
      <div className="desktop-view-container">

      {/* ── LEFT PANEL ── */}
      <div className="hidden md:flex relative overflow-hidden flex-col justify-center items-center p-[60px]"
        style={{
          background: 'linear-gradient(135deg, #0d1a1f 0%, #0a0a0a 50%, #1a0a1e 100%)',
        }}>
        {/* Orbs */}
        <div style={{ position: 'absolute', top: -80, right: -80, width: 400, height: 400, borderRadius: '50%', background: 'rgba(29, 185, 84,0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 350, height: 350, borderRadius: '50%', background: 'rgba(16, 185, 129,0.08)', filter: 'blur(80px)', pointerEvents: 'none' }} />

        <div style={{ position: 'relative', zIndex: 1, textAlign: 'center', maxWidth: 400 }}>
          {/* Big vinyl visual */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: 'linear' }}
            style={{
              width: 200, height: 200, borderRadius: '50%', margin: '0 auto 40px',
              background: 'conic-gradient(from 0deg, #1a1a1a, #2d2d2d, #1a1a1a, #333, #1a1a1a)',
              boxShadow: '0 0 60px rgba(29, 185, 84, 0.25), 0 0 120px rgba(29, 185, 84, 0.1)',
              position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            {/* Grooves */}
            {[60, 90, 120].map(r => (
              <div key={r} style={{ position: 'absolute', borderRadius: '50%', border: '1px solid rgba(255,255,255,0.04)', inset: `${(200 - r) / 2}px` }} />
            ))}
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'linear-gradient(135deg, #1db954, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', zIndex: 1 }}>
              <Music2 size={28} color="black" />
            </div>
          </motion.div>

          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 42, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.5px' }}>
            Welcome back to{' '}
            <span style={{ background: 'linear-gradient(135deg, #1db954, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              Beato
            </span>
          </h2>
          <p style={{ color: '#737373', fontSize: 16, lineHeight: 1.7 }}>
            Your music, your universe. Pick up right where you left off.
          </p>

          {/* Animated now-playing indicator */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
            style={{
              marginTop: 40, padding: '14px 20px', borderRadius: 16,
              background: 'rgba(29, 185, 84,0.08)', border: '1px solid rgba(29, 185, 84,0.2)',
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
            <div style={{ display: 'flex', alignItems: 'end', gap: 3, height: 20 }}>
              {[12, 18, 14, 20, 16].map((h, i) => (
                <div key={i} style={{
                  width: 3, borderRadius: 2, background: GREEN, height: h,
                  animation: `waveform 0.8s ease-in-out infinite alternate`,
                  animationDelay: `${i * 0.12}s`,
                }} />
              ))}
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ color: '#fff', fontSize: 13, fontWeight: 600 }}>Midnight Cascade</p>
              <p style={{ color: '#737373', fontSize: 11 }}>Aurora Nightfall • 2.1M listeners</p>
            </div>
            <div style={{ marginLeft: 'auto', width: 8, height: 8, borderRadius: '50%', background: GREEN, animation: 'pulse 1.5s ease-in-out infinite' }} />
          </motion.div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex items-center justify-center p-6 sm:p-12 md:p-[60px] lg:p-[72px] bg-[#111] border-l-0 md:border-l border-white/5 overflow-y-auto">
        <div style={{ width: '100%', maxWidth: 400 }}>
          <AnimatePresence mode="wait">

            {/* EMAIL STEP */}
            {step === 'email' && (
              <motion.div key="email" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <div style={{ marginBottom: 36 }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 12px', borderRadius: 100, background: 'rgba(29, 185, 84,0.12)', border: '1px solid rgba(29, 185, 84,0.25)', marginBottom: 16 }}>
                    <Sparkles size={13} color={GREEN} />
                    <span style={{ color: GREEN, fontSize: 12, fontWeight: 600 }}>Sign in to your account</span>
                  </div>
                  <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 34, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Welcome back</h1>
                  <p style={{ color: '#737373', fontSize: 15 }}>Log in to continue streaming</p>
                </div>

                {/* Social buttons */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 11, marginBottom: 24 }}>
                  {[
                    { label: 'Continue with Google', icon: '🌐' },
                    { label: 'Continue with Apple', icon: '🍎' },
                    { label: 'Continue with GitHub', icon: '⚡' },
                  ].map(p => (
                    <button key={p.label} onClick={() => handleSocialLogin(p.label)} disabled={isLoading}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12, padding: '13px 20px',
                        borderRadius: 12, border: '1.5px solid rgba(255,255,255,0.12)', background: 'rgba(255,255,255,0.04)',
                        color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer',
                        fontFamily: 'Inter, sans-serif', transition: 'background 0.2s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.08)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}>
                      <span style={{ fontSize: 18 }}>{p.icon}</span> {p.label}
                    </button>
                  ))}
                </div>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                  <span style={{ color: '#525252', fontSize: 13 }}>or with email</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                </div>

                <form onSubmit={handleEmailContinue}>
                  <div style={{ marginBottom: 16 }}>
                    <label style={labelStyle}>Email address</label>
                    <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@email.com" autoFocus required
                      style={inputStyle}
                      suppressHydrationWarning
                      onFocus={e => (e.target.style.borderColor = GREEN)}
                      onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')} />
                  </div>
                  <button type="submit" style={{
                    width: '100%', padding: '15px', borderRadius: 12, background: GREEN,
                    color: '#000', fontWeight: 800, fontSize: 16, cursor: 'pointer', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    Continue <ArrowRight size={18} />
                  </button>
                </form>

                <p style={{ textAlign: 'center', color: '#525252', fontSize: 14, marginTop: 24 }}>
                  Don&apos;t have an account?{' '}
                  <Link href="/register" style={{ color: '#fff', fontWeight: 600, textDecoration: 'none' }}>Sign up free</Link>
                </p>
              </motion.div>
            )}

            {/* PASSWORD STEP */}
            {step === 'password' && (
              <motion.div key="password" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }}>
                <div style={{ marginBottom: 36 }}>
                  <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 34, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Enter password</h1>
                  <p style={{ color: '#737373', fontSize: 15 }}>Logging in as <span style={{ color: '#fff', fontWeight: 500 }}>{email}</span></p>
                </div>

                {/* Email pill */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 20 }}>
                  <span style={{ color: '#a3a3a3', fontSize: 14 }}>{email}</span>
                  <button onClick={() => { setStep('email'); setError(''); }} style={{ color: GREEN, fontSize: 13, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}>Change</button>
                </div>

                {error && (
                  <div style={{
                    padding: '12px 16px',
                    background: 'rgba(239, 68, 68, 0.1)',
                    border: '1px solid rgba(239, 68, 68, 0.25)',
                    borderRadius: 12,
                    color: '#ef4444',
                    fontSize: 14,
                    fontWeight: 500,
                    marginBottom: 20,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                  }}>
                    <span style={{ fontSize: 16 }}>⚠️</span>
                    {error}
                  </div>
                )}

                <form onSubmit={handleLogin}>
                  <div style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <label style={labelStyle}>Password</label>
                      <button type="button" style={{ color: GREEN, fontSize: 12, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Forgot?</button>
                    </div>
                    <div style={{ position: 'relative' }}>
                      <input type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} placeholder="Your password" autoFocus required
                        style={{ ...inputStyle, paddingRight: 48 }}
                        suppressHydrationWarning
                        onFocus={e => (e.target.style.borderColor = GREEN)}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')} />
                      <button type="button" onClick={() => setShowPassword(v => !v)}
                        style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#737373' }}>
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </button>
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} style={{
                    width: '100%', padding: '15px', borderRadius: 12, background: isLoading ? 'rgba(29, 185, 84,0.5)' : GREEN,
                    color: '#000', fontWeight: 800, fontSize: 16, cursor: isLoading ? 'not-allowed' : 'pointer', border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, fontFamily: 'Outfit, sans-serif',
                  }}>
                    {isLoading
                      ? <div style={{ width: 22, height: 22, border: '2.5px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      : <>Log In <ArrowRight size={18} /></>}
                  </button>
                  <button type="button" onClick={() => { setStep('otp'); setError(''); }} style={{ width: '100%', marginTop: 12, padding: '12px', background: 'none', border: '1.5px solid rgba(255,255,255,0.12)', borderRadius: 12, color: '#a3a3a3', fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
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
                      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 34, fontWeight: 900, color: '#fff', marginBottom: 6 }}>WhatsApp OTP</h1>
                      <p style={{ color: '#737373', fontSize: 15 }}>Enter your WhatsApp phone number to log in without a password</p>
                    </div>

                    {error && (
                      <div style={{
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: 12,
                        color: '#ef4444',
                        fontSize: 14,
                        fontWeight: 500,
                        marginBottom: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <span style={{ fontSize: 16 }}>⚠️</span>
                        {error}
                      </div>
                    )}

                    <div style={{ marginBottom: 20 }}>
                      <label style={labelStyle}>WhatsApp Number</label>
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+919999999999" autoFocus required
                        style={inputStyle}
                        suppressHydrationWarning
                        onFocus={e => (e.target.style.borderColor = GREEN)}
                        onBlur={e => (e.target.style.borderColor = 'rgba(255,255,255,0.15)')} />
                    </div>

                    <button type="submit" disabled={isLoading} style={{
                      width: '100%', padding: '15px', borderRadius: 12, background: GREEN,
                      color: '#000', fontWeight: 800, fontSize: 16, cursor: isLoading ? 'not-allowed' : 'pointer', border: 'none',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      fontFamily: 'Outfit, sans-serif', marginBottom: 16,
                    }}>
                      {isLoading ? (
                        <div style={{ width: 22, height: 22, border: '2.5px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      ) : <>Send OTP via WhatsApp <ArrowRight size={18} /></>}
                    </button>
                    <button type="button" onClick={() => { setStep('email'); setError(''); setOtpSent(false); }} style={{ width: '100%', background: 'none', border: 'none', color: '#737373', fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>← Back to Email</button>
                  </form>
                ) : (
                  <form onSubmit={handleVerifyOtp}>
                    <div style={{ marginBottom: 36 }}>
                      <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 34, fontWeight: 900, color: '#fff', marginBottom: 6 }}>Verify OTP</h1>
                      <p style={{ color: '#737373', fontSize: 15 }}>We sent a 6-digit code to <span style={{ color: '#fff', fontWeight: 500 }}>{phone}</span></p>
                    </div>

                    {error && (
                      <div style={{
                        padding: '12px 16px',
                        background: 'rgba(239, 68, 68, 0.1)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: 12,
                        color: '#ef4444',
                        fontSize: 14,
                        fontWeight: 500,
                        marginBottom: 20,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                      }}>
                        <span style={{ fontSize: 16 }}>⚠️</span>
                        {error}
                      </div>
                    )}

                    {sandboxCode && (
                      <div style={{
                        padding: '10px 14px', borderRadius: 10, background: 'rgba(29, 185, 84,0.1)',
                        border: '1px solid rgba(29, 185, 84,0.2)', marginBottom: 20, textAlign: 'center',
                      }}>
                        <p style={{ color: GREEN, fontSize: 13, fontWeight: 600 }}>
                          [Dev Sandbox] Simulated WhatsApp Message:
                        </p>
                        <p style={{ color: '#fff', fontSize: 18, fontWeight: 800, letterSpacing: 2, marginTop: 4 }}>
                          {sandboxCode}
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 10, marginBottom: 24, justifyContent: 'center' }}>
                      {otp.map((digit, i) => (
                        <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" value={digit} onChange={e => handleOtpChange(i, e.target.value)} maxLength={1}
                          suppressHydrationWarning
                          style={{
                            width: 52, height: 60, borderRadius: 12, border: `2px solid ${digit ? GREEN : 'rgba(255,255,255,0.15)'}`,
                            background: 'rgba(255,255,255,0.07)', color: '#fff', fontSize: 22, fontWeight: 700,
                            textAlign: 'center', outline: 'none', transition: 'border-color 0.2s', fontFamily: 'Outfit, sans-serif',
                          }}
                          onFocus={e => (e.target.style.borderColor = GREEN)}
                          onBlur={e => (e.target.style.borderColor = digit ? GREEN : 'rgba(255,255,255,0.15)')} />
                      ))}
                    </div>

                    <button type="submit" disabled={otp.join('').length < 6 || isLoading}
                      style={{
                        width: '100%', padding: '15px', borderRadius: 12,
                        background: otp.join('').length < 6 ? 'rgba(29, 185, 84,0.4)' : GREEN,
                        color: '#000', fontWeight: 800, fontSize: 16, cursor: otp.join('').length < 6 ? 'not-allowed' : 'pointer',
                        border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                        fontFamily: 'Outfit, sans-serif', marginBottom: 16,
                      }}>
                      {isLoading ? (
                        <div style={{ width: 22, height: 22, border: '2.5px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                      ) : <>Verify & Log in <Check size={18} /></>}
                    </button>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <button type="button" onClick={() => { setOtpSent(false); setError(''); }} style={{ background: 'none', border: 'none', color: '#737373', fontSize: 14, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>← Change Number</button>
                      <button type="button" onClick={handleSendOtp} style={{ background: 'none', border: 'none', color: GREEN, fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>Resend Code</button>
                    </div>
                  </form>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Mock Accounts Switcher */}
          <div style={{
            marginTop: 32,
            padding: '20px',
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: 16,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <span style={{ fontSize: 14 }}>🔐</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Test Accounts (Quick Login)
              </span>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {[
                { role: 'SUPER_ADMIN', email: 'superadmin@beato.com', label: 'Super Admin', color: '#84cc16' },
                { role: 'ADMIN', email: 'admin@beato.com', label: 'Admin/Moderator', color: '#10b981' },
                { role: 'ARTIST', email: 'artist@beato.com', label: 'Artist User', color: '#1db954' },
                { role: 'USER', email: 'manoj@beato.io', label: 'Standard User', color: '#34d399' },
              ].map(acc => (
                <button
                  key={acc.email}
                  onClick={() => handleQuickLogin(acc.email)}
                  disabled={isLoading}
                  type="button"
                  style={{
                    padding: '10px 12px',
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: 10,
                    color: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 3,
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.09)';
                    e.currentTarget.style.borderColor = acc.color;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 12 }}>{acc.label}</span>
                  <span style={{ color: '#737373', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' }}>{acc.email}</span>
                </button>
              ))}
            </div>
          </div>

          <p style={{ textAlign: 'center', color: '#525252', fontSize: 11, marginTop: 24, lineHeight: 1.6 }}>
            Protected by reCAPTCHA.{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Privacy Policy</span>{' '}and{' '}
            <span style={{ textDecoration: 'underline', cursor: 'pointer' }}>Terms</span> apply.
          </p>
        </div>
      </div>
      </div>

      {/* ── MOBILE VIEW (Single form match screenshot) ── */}
      <div className="mobile-view-container">
        {/* Logo & Subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 40 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Music2 size={36} color={GREEN} />
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 900, fontSize: 32, color: '#fff', letterSpacing: '-0.5px' }}>Beato</span>
          </div>
          <p style={{ color: '#737373', fontSize: 14, margin: 0 }}>Let streaming define your space.</p>
        </div>

        {/* Login Card */}
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
          <h2 style={{
            fontFamily: 'Outfit, sans-serif',
            fontSize: 26,
            fontWeight: 800,
            color: '#fff',
            marginBottom: 24,
            textAlign: 'left',
          }}>Welcome Back</h2>

          {error && (
            <div style={{
              padding: '12px 16px',
              background: 'rgba(239, 68, 68, 0.1)',
              border: '1px solid rgba(239, 68, 68, 0.25)',
              borderRadius: 12,
              color: '#ef4444',
              fontSize: 14,
              fontWeight: 500,
              marginBottom: 20,
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}>
              <span style={{ fontSize: 16 }}>⚠️</span>
              {error}
            </div>
          )}
          
          <form onSubmit={(e) => {
             e.preventDefault();
             if(!email || !password) { toast.error('Enter email and password'); return; }
             handleLogin(e);
          }}>
            {/* Email Input */}
            <div className="mobile-input-container">
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

            {/* Password Input */}
            <div className="mobile-input-container" style={{ marginBottom: 28 }}>
              <Lock size={18} color="#737373" style={{ flexShrink: 0 }} />
              <input 
                type={showPassword ? 'text' : 'password'}
                placeholder="Password" 
                className="mobile-input"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                suppressHydrationWarning
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', padding: 0, marginLeft: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {/* Login Button */}
            <button type="submit" disabled={isLoading} className="mobile-btn">
              {isLoading ? (
                <div style={{ width: 20, height: 20, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear' }} />
              ) : 'Log In'}
            </button>

            {/* Signup Link */}
            <Link href="/register" style={{ display: 'block', textAlign: 'center', color: GREEN, fontSize: 13, fontWeight: 600, marginTop: 20, textDecoration: 'none' }}
              onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'}
              onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>
              New to Beato? Sign Up Free
            </Link>
          </form>
        </div>

        {/* Divider */}
        <div style={{ color: '#525252', fontSize: 11, textTransform: 'lowercase', marginTop: 32, marginBottom: 16 }}>or connect with</div>

        {/* Demo Login Pill */}
        <button onClick={() => {
           handleQuickLogin('manoj@beato.io');
        }} disabled={isLoading} className="mobile-demo-btn">
          Instant Demo Login
        </button>

        {/* Connection Settings Link */}
        <button 
          type="button"
          onClick={() => setShowServerSettings(true)}
          style={{ 
            background: 'none', 
            border: 'none', 
            color: '#737373', 
            fontSize: 12, 
            fontWeight: 600, 
            marginTop: 24, 
            cursor: 'pointer', 
            display: 'flex', 
            alignItems: 'center', 
            gap: 6,
            fontFamily: 'Inter, sans-serif'
          }}
          onMouseEnter={e => e.currentTarget.style.color = GREEN}
          onMouseLeave={e => e.currentTarget.style.color = '#737373'}
        >
          <span>⚙️</span> Change Server IP / URL
        </button>
      </div>

      {/* Server Settings Modal Overlay */}
      <AnimatePresence>
        {showServerSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(8px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: 20,
            }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              style={{
                width: '100%',
                maxWidth: 400,
                background: '#111',
                borderRadius: 24,
                border: '1px solid rgba(255,255,255,0.08)',
                padding: 28,
                boxShadow: '0 20px 50px rgba(0,0,0,0.8)',
                position: 'relative',
              }}
            >
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 800, color: '#fff', marginBottom: 12 }}>
                Connection Settings
              </h3>
              <p style={{ fontSize: 13, color: '#a3a3a3', lineHeight: 1.5, marginBottom: 20 }}>
                Enter your computer's local IP address or a public tunnel URL (e.g. localtunnel/ngrok) so the app can communicate with the backend.
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                <label style={{ fontSize: 11, fontWeight: 700, color: '#737373', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Backend / API Server URL
                </label>
                <input
                  type="text"
                  value={serverUrl}
                  onChange={e => setServerUrl(e.target.value)}
                  placeholder="http://192.168.1.7:3000"
                  style={{
                    width: '100%',
                    background: '#1a1a1a',
                    border: '1.5px solid rgba(255,255,255,0.1)',
                    borderRadius: 12,
                    padding: '12px 16px',
                    color: '#fff',
                    fontSize: 14,
                    outline: 'none',
                    fontFamily: 'Inter, sans-serif',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowServerSettings(false)}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      const cleaned = serverUrl.trim();
                      if (!cleaned) {
                        toast.error('URL cannot be empty');
                        return;
                      }
                      window.localStorage.setItem('beato_api_url', cleaned);
                      toast.success('Connection settings saved! Reloading app...', {
                        style: { background: '#1a1a1a', color: '#fff', border: '1px solid rgba(29, 185, 84,0.3)', borderRadius: 12 },
                      });
                      setShowServerSettings(false);
                      setTimeout(() => {
                        window.location.reload();
                      }, 1200);
                    }
                  }}
                  style={{
                    flex: 1,
                    padding: '12px',
                    borderRadius: 12,
                    background: GREEN,
                    color: '#000',
                    fontWeight: 800,
                    fontSize: 14,
                    border: 'none',
                    cursor: 'pointer',
                    fontFamily: 'Outfit, sans-serif',
                  }}
                >
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
