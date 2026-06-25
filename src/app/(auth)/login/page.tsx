'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, ArrowRight, Music2, Check, Mail, Lock, Settings2, ArrowLeft, Smartphone } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

const PRIMARY = '#b08850';
const PRIMARY_DARK = '#937041';
const BG = '#f4eede';
const SURFACE = '#fbf9f5';
const ELEVATED = '#ffffff';
const TEXT = '#221a15';
const TEXT_SEC = '#4d3f35';
const TEXT_MUTED = '#87786c';
const BORDER = 'rgba(43, 34, 26, 0.1)';

const GoogleIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" style={{ position: 'absolute', left: '20px' }}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
  </svg>
);

const FacebookIcon = () => (
  <svg width="20" height="20" fill="#1877F2" viewBox="0 0 24 24" style={{ position: 'absolute', left: '20px' }}>
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

export default function LoginPage() {
  const [step, setStep] = useState<'welcome' | 'login-email' | 'login-password' | 'email-otp' | 'whatsapp-send' | 'whatsapp-otp'>('login-email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [sandboxCode, setSandboxCode] = useState('');
  const [emailSandboxCode, setEmailSandboxCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showQuickAccounts, setShowQuickAccounts] = useState(false);
  const [emailExists, setEmailExists] = useState<boolean | null>(null);
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');

  const { login, loginWithSocial, sendOtp, verifyOtp, sendEmailOtp, verifyEmailOtp, loginWithGooglePayload } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    let isMounted = true;
    const checkEmailRegistered = async () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email || !emailRegex.test(email)) {
        if (isMounted) {
          setEmailExists(null);
          setCheckingEmail(false);
        }
        return;
      }
      if (isMounted) setCheckingEmail(true);
      try {
        const response = await fetch('/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (isMounted) {
          setEmailExists(!!data.exists);
        }
      } catch (err) {
        console.error('Error checking email existence:', err);
        if (isMounted) setEmailExists(null);
      } finally {
        if (isMounted) setCheckingEmail(false);
      }
    };

    const timer = setTimeout(checkEmailRegistered, 500);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [email]);

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

  const handleSendEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { toast.error('Enter your email'); return; }

    // Redirect to register if not registered
    if (emailExists === false) {
      router.push(`/register?email=${encodeURIComponent(email)}`);
      return;
    }

    setIsLoading(true);
    setError('');
    setOtp(Array(6).fill(''));
    try {
      const data = await sendEmailOtp(email);
      setStep('email-otp');
      if (data.developmentSandboxCode) {
        setEmailSandboxCode(data.developmentSandboxCode);
        toast.success(`[Sandbox] Email OTP: ${data.developmentSandboxCode}`);
      } else {
        toast.success('Verification code sent to your email!');
      }
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : String(error);
      setError(msg || 'Failed to send verification code');
      toast.error(msg || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyEmailOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code.length < 6) { toast.error('Enter 6-digit verification code'); return; }
    setIsLoading(true);
    setError('');
    try {
      await verifyEmailOtp(email, code);
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
    } finally {
      setIsLoading(false);
    }
  };

  // Load Google Client dynamically
  useEffect(() => {
    let isMounted = true;
    const loadGoogleClientId = async () => {
      try {
        const res = await fetch('/api/auth/google');
        const data = await res.json();
        if (isMounted && data.clientId) {
          setGoogleClientId(data.clientId);
          
          // Load official Google GSI SDK if not present
          if (!document.querySelector('script[src="https://accounts.google.com/gsi/client"]')) {
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            document.head.appendChild(script);
          }
        }
      } catch (err) {
        console.error('Failed to load Google Client ID:', err);
      }
    };

    if (typeof window !== 'undefined') {
      loadGoogleClientId();
    }

    return () => {
      isMounted = false;
    };
  }, []);

  const handleGoogleSandboxSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail) {
      toast.error('Please enter or select an email address');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const res = await loginWithGooglePayload({
        email: googleEmail,
        name: googleName || googleEmail.split('@')[0],
      });
      if (res.success) {
        setShowGoogleChooser(false);
        toast.success('Logged in with Google (Sandbox)! 🎵');
        router.push('/home');
      }
    } catch (err: any) {
      setError(err.message || 'Google Sandbox login failed');
      toast.error(err.message || 'Google Sandbox login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider: string) => {
    if (provider === 'Google') {
      const clientId = googleClientId;
      if (clientId) {
        try {
          setIsLoading(true);
          setError('');

          // Ensure Google Accounts GSI script is fully loaded and parsed
          const checkGSI = () => {
            return new Promise<boolean>((resolve) => {
              if ((window as any).google?.accounts?.id) {
                resolve(true);
                return;
              }
              let attempts = 0;
              const interval = setInterval(() => {
                attempts++;
                if ((window as any).google?.accounts?.id) {
                  clearInterval(interval);
                  resolve(true);
                } else if (attempts > 30) {
                  clearInterval(interval);
                  resolve(false);
                }
              }, 100);
            });
          };

          const gsiLoaded = await checkGSI();
          if (!gsiLoaded) {
            throw new Error('Google Sign-In service is temporarily unavailable. Please try again.');
          }

          (window as any).google.accounts.id.initialize({
            client_id: clientId,
            callback: async (response: any) => {
              try {
                const res = await loginWithGooglePayload({ idToken: response.credential, email: '', name: '' });
                if (res.success) {
                  toast.success('Logged in with Google! 🎵');
                  router.push('/home');
                }
              } catch (err: any) {
                setError(err.message || 'Google Login failed');
                toast.error(err.message || 'Google Login failed');
              } finally {
                setIsLoading(false);
              }
            }
          });
          (window as any).google.accounts.id.prompt();
          const googleBtnDiv = document.createElement('div');
          googleBtnDiv.id = 'google-hidden-btn';
          document.body.appendChild(googleBtnDiv);
          (window as any).google.accounts.id.renderButton(googleBtnDiv, { type: 'icon', size: 'large' });
          const clickTarget = googleBtnDiv.querySelector('div[role=button]');
          if (clickTarget) {
            (clickTarget as HTMLElement).click();
          }
          document.body.removeChild(googleBtnDiv);
        } catch (err: any) {
          console.error('Google Auth GSI Error:', err);
          setError(err.message || 'Google Login failed to initialize');
          toast.error(err.message || 'Google Login failed to initialize');
          setShowGoogleChooser(true);
        } finally {
          setIsLoading(false);
        }
      } else {
        setShowGoogleChooser(true);
      }
      return;
    }

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
    } finally {
      setIsLoading(false);
    }
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
    setOtp(Array(6).fill(''));
    try {
      const data = await sendOtp(phone);
      setStep('whatsapp-otp');
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
    borderRadius: 8,
    padding: '14px 16px',
    color: TEXT,
    fontSize: 15,
    outline: 'none',
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: 'Inter, sans-serif',
    boxSizing: 'border-box',
  };

  const labelStyle: React.CSSProperties = {
    display: 'block',
    fontSize: 13,
    fontWeight: 700,
    color: TEXT,
    marginBottom: 8,
    fontFamily: 'Inter, sans-serif'
  };

  return (
    <div className="login-page-wrapper">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@700;800;900&display=swap');

        .login-page-wrapper {
          min-height: 100vh;
          background: ${BG};
          font-family: 'Inter', sans-serif;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          box-sizing: border-box;
        }

        .auth-card {
          width: 100%;
          max-width: 420px;
          background: ${SURFACE};
          border-radius: 24px;
          padding: 40px 32px;
          box-shadow: 0 10px 40px rgba(43, 34, 26, 0.04);
          border: 1px solid ${BORDER};
          box-sizing: border-box;
          min-height: 600px;
          display: flex;
          flex-direction: column;
          position: relative;
        }

        .auth-input:focus {
          border-color: ${PRIMARY} !important;
          box-shadow: 0 0 0 3px rgba(176, 136, 80, 0.12) !important;
        }
        .auth-input::placeholder { color: #b0a391; }

        .auth-btn-primary {
          width: 100%;
          padding: 15px;
          border-radius: 30px;
          background: ${PRIMARY};
          color: #fff;
          font-weight: 800;
          font-size: 15px;
          cursor: pointer;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          font-family: 'Outfit', sans-serif;
          transition: background 0.2s, transform 0.1s, box-shadow 0.2s;
          box-shadow: 0 4px 16px rgba(176, 136, 80, 0.25);
          letter-spacing: 0.02em;
        }
        .auth-btn-primary:hover:not(:disabled) {
          background: ${PRIMARY_DARK};
          box-shadow: 0 6px 20px rgba(176, 136, 80, 0.35);
        }
        .auth-btn-primary:active:not(:disabled) {
          transform: scale(0.98);
        }
        .auth-btn-primary:disabled {
          opacity: 0.55;
          cursor: not-allowed;
        }

        .auth-btn-secondary {
          width: 100%;
          padding: 14px;
          border-radius: 30px;
          background: transparent;
          border: 1.5px solid ${BORDER};
          color: ${TEXT};
          font-size: 15px;
          font-weight: 800;
          cursor: pointer;
          font-family: 'Outfit', sans-serif;
          transition: background 0.2s, border-color 0.2s;
          box-sizing: border-box;
        }
        .auth-btn-secondary:hover {
          background: ${SURFACE};
          border-color: rgba(176, 136, 80, 0.35);
        }

        .social-oauth-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          background: transparent;
          color: ${TEXT};
          border: 1.5px solid ${BORDER};
          border-radius: 30px;
          padding: 13px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          position: relative;
          font-family: 'Inter', sans-serif;
          transition: background 0.2s, border-color 0.2s;
          box-sizing: border-box;
        }
        .social-oauth-btn:hover {
          background: ${SURFACE};
          border-color: rgba(176, 136, 80, 0.35);
        }

        @media (max-width: 480px) {
          .login-page-wrapper {
            padding: 0;
            background: ${BG};
          }
          .auth-card {
            box-shadow: none !important;
            border: none !important;
            background: transparent !important;
            padding: 24px 16px !important;
            min-height: 100vh !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      <div className="auth-card">
        {/* Settings gear always accessible on card top right */}
        <button
          type="button"
          onClick={() => setShowServerSettings(true)}
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            background: 'none',
            border: 'none',
            color: TEXT_MUTED,
            cursor: 'pointer',
            zIndex: 10
          }}
        >
          <Settings2 size={18} />
        </button>

        <AnimatePresence mode="wait">
          {/* STEP 1: WELCOME SCREEN (IMAGE 1) */}
          {step === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'space-between' }}
            >
              <div style={{ textAlign: 'center', marginTop: '40px' }}>
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
                  <div style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: `linear-gradient(135deg, ${PRIMARY}, #8c6c44)`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: `0 6px 20px rgba(176,136,80,0.3)`
                  }}>
                    <Music2 size={30} color="#fff" />
                  </div>
                </div>

                <h1 style={{
                  fontFamily: 'Outfit, sans-serif',
                  fontSize: '30px',
                  fontWeight: 900,
                  color: TEXT,
                  lineHeight: '1.25',
                  marginBottom: '10px',
                  letterSpacing: '-0.5px'
                }}>
                  Millions of songs.<br />Free on Beato.
                </h1>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto', marginBottom: '20px' }}>
                <button onClick={() => router.push('/register')} className="auth-btn-primary">
                  Sign up free
                </button>
                <button onClick={() => setStep('login-email')} className="auth-btn-secondary">
                  Log In
                </button>
              </div>
            </motion.div>
          )}

          {/* STEP 2: EMAIL LOGIN (IMAGE 2) */}
          {step === 'login-email' && (
            <motion.div
              key="login-email"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              {/* Header with back button */}
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', position: 'relative' }}>
                <button onClick={() => setStep('welcome')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: TEXT, display: 'flex', alignItems: 'center' }}>
                  <ArrowLeft size={20} />
                </button>
                <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', fontSize: '15px', color: TEXT }}>
                  Log In
                </span>
              </div>

              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: 800, color: TEXT, marginBottom: '24px', letterSpacing: '-0.5px' }}>
                Log in to Beato
              </h2>

              <form onSubmit={handleSendEmailOtp} style={{ width: '100%' }}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={labelStyle}>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    autoFocus
                    className="auth-input"
                    style={{
                      ...inputStyle,
                      borderColor: emailExists === false ? '#dc2626' : BORDER
                    }}
                  />
                  {checkingEmail && (
                    <p style={{ color: TEXT_MUTED, fontSize: '12px', marginTop: '6px' }}>
                      Checking availability...
                    </p>
                  )}
                  {emailExists === false && (
                    <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '6px', fontWeight: 500 }}>
                      ⚠️ Account not found. Please sign up.
                    </p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isLoading || checkingEmail || emailExists === null}
                  className="auth-btn-primary"
                >
                  {isLoading ? (
                    <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                  ) : checkingEmail ? (
                    'Checking...'
                  ) : emailExists === false ? (
                    'Continue to Sign Up'
                  ) : (
                    'Continue'
                  )}
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '24px 0', width: '100%' }}>
                <div style={{ flex: 1, height: '1px', background: BORDER }} />
                <span style={{ color: TEXT_MUTED, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or log in with</span>
                <div style={{ flex: 1, height: '1px', background: BORDER }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '24px' }}>
                <button onClick={() => setStep('whatsapp-send')} className="social-oauth-btn">
                  <Smartphone size={16} style={{ position: 'absolute', left: '20px' }} />
                  <span>Phone number</span>
                </button>
                <button onClick={() => handleSocialLogin('Google')} className="social-oauth-btn">
                  <GoogleIcon />
                  <span>Google</span>
                </button>
              </div>

              <div style={{ textAlign: 'center', marginTop: 'auto', paddingBottom: '10px' }}>
                <span style={{ color: TEXT_MUTED, fontSize: '13px', fontWeight: 600 }}>Don't have an account? </span>
                <Link href="/register" style={{ color: PRIMARY, fontWeight: 'bold', textDecoration: 'none', fontSize: '13px' }}>
                  Sign up
                </Link>
              </div>
            </motion.div>
          )}

          {/* STEP 3: PASSWORD LOGIN */}
          {step === 'login-password' && (
            <motion.div
              key="login-password"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', position: 'relative' }}>
                <button onClick={() => setStep('login-email')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: TEXT, display: 'flex', alignItems: 'center' }}>
                  <ArrowLeft size={20} />
                </button>
                <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', fontSize: '15px', color: TEXT }}>
                  Password Login
                </span>
              </div>

              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: 800, color: TEXT, marginBottom: '8px', letterSpacing: '-0.5px' }}>
                Log in with password
              </h2>
              {email && (
                <p style={{ color: TEXT_MUTED, fontSize: '14px', marginBottom: '24px' }}>
                  Logging in as <span style={{ color: TEXT, fontWeight: 700 }}>{email}</span>
                </p>
              )}

              {error && (
                <div style={{ padding: '12px 14px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, color: '#b91c1c', fontSize: '13px', marginBottom: '18px', fontWeight: 500 }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleLogin} style={{ width: '100%' }}>
                <div style={{ marginBottom: '24px', position: 'relative' }}>
                  <label style={labelStyle}>Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Your password"
                    required
                    autoFocus
                    className="auth-input"
                    style={{ ...inputStyle, paddingRight: '48px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute',
                      right: '14px',
                      top: '42px',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: TEXT_MUTED
                    }}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button type="submit" disabled={isLoading} className="auth-btn-primary">
                  {isLoading ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : 'Log In'}
                </button>
              </form>

              <button
                type="button"
                onClick={() => setStep('login-email')}
                className="auth-btn-secondary"
                style={{ marginTop: '14px' }}
              >
                Login with Email OTP instead
              </button>

              {/* Dev Accounts Helper Accordion */}
              <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                <button
                  type="button"
                  onClick={() => setShowQuickAccounts(!showQuickAccounts)}
                  style={{
                    width: '100%',
                    background: 'none',
                    border: 'none',
                    color: PRIMARY,
                    fontSize: '12px',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontFamily: 'Inter, sans-serif'
                  }}
                >
                  {showQuickAccounts ? 'Hide Quick Login Accounts' : 'Show Quick Login Accounts (Demo)'}
                </button>

                {showQuickAccounts && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: '8px',
                      marginTop: '12px',
                      background: SURFACE,
                      padding: '12px',
                      borderRadius: '12px',
                      border: `1px solid ${BORDER}`
                    }}
                  >
                    {[
                      { role: 'SUPER_ADMIN', email: 'superadmin@beato.com', label: 'Super Admin' },
                      { role: 'ADMIN', email: 'admin@beato.com', label: 'Admin / Mod' },
                      { role: 'ARTIST', email: 'artist@beato.com', label: 'Artist User' },
                      { role: 'USER', email: 'manoj@beato.io', label: 'Standard User' }
                    ].map(acc => (
                      <button
                        key={acc.email}
                        onClick={() => handleQuickLogin(acc.email)}
                        disabled={isLoading}
                        style={{
                          padding: '8px',
                          background: ELEVATED,
                          border: `1.5px solid ${BORDER}`,
                          borderRadius: '8px',
                          color: TEXT,
                          fontSize: '11px',
                          fontWeight: 700,
                          cursor: 'pointer',
                          textAlign: 'left'
                        }}
                      >
                        <div>{acc.label}</div>
                        <div style={{ color: TEXT_MUTED, fontSize: '9px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{acc.email}</div>
                      </button>
                    ))}
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}

          {/* STEP 4: EMAIL OTP VERIFICATION */}
          {step === 'email-otp' && (
            <motion.div
              key="email-otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', position: 'relative' }}>
                <button onClick={() => setStep('login-email')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: TEXT, display: 'flex', alignItems: 'center' }}>
                  <ArrowLeft size={20} />
                </button>
                <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', fontSize: '15px', color: TEXT }}>
                  Verify Email
                </span>
              </div>

              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: 800, color: TEXT, marginBottom: 8, letterSpacing: '-0.5px' }}>
                Verify your email
              </h2>
              <p style={{ color: TEXT_MUTED, fontSize: '14px', marginBottom: '12px' }}>
                We sent a 6-digit code to <span style={{ color: TEXT, fontWeight: 700 }}>{email}</span>
              </p>
              <p style={{ color: '#8c7662', fontSize: '12.5px', marginBottom: '24px', fontStyle: 'italic', lineHeight: '1.4' }}>
                📩 <strong>Note:</strong> If you don't see the mail in your inbox, please check your <strong>Spam or Junk folder</strong> (Gmail SMTP can sometimes flag automated verification codes as spam).
              </p>

              {error && (
                <div style={{ padding: '12px 14px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, color: '#b91c1c', fontSize: '13px', marginBottom: '18px' }}>
                  ⚠️ {error}
                </div>
              )}

              {emailSandboxCode && (
                <div style={{ padding: '12px', borderRadius: 10, background: `rgba(176,136,80,0.08)`, border: `1px solid rgba(176,136,80,0.15)`, marginBottom: '24px', textAlign: 'center' }}>
                  <p style={{ color: PRIMARY, fontSize: '12px', fontWeight: 700, margin: 0 }}>[Dev Sandbox] Email Code:</p>
                  <p style={{ color: TEXT, fontSize: '24px', fontWeight: 800, letterSpacing: 4, margin: '6px 0 0 0' }}>{emailSandboxCode}</p>
                </div>
              )}

              <form onSubmit={handleVerifyEmailOtp} style={{ width: '100%' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      maxLength={1}
                      suppressHydrationWarning
                      style={{
                        width: '46px',
                        height: '54px',
                        borderRadius: '8px',
                        border: `2px solid ${digit ? PRIMARY : BORDER}`,
                        background: ELEVATED,
                        color: TEXT,
                        fontSize: '20px',
                        fontWeight: 700,
                        textAlign: 'center',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        fontFamily: 'Outfit, sans-serif',
                        boxShadow: digit ? `0 0 0 3px rgba(176,136,80,0.1)` : 'none'
                      }}
                      onFocus={e => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = '0 0 0 3px rgba(176,136,80,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = digit ? PRIMARY : BORDER; e.target.style.boxShadow = digit ? '0 0 0 3px rgba(176,136,80,0.1)' : 'none'; }}
                    />
                  ))}
                </div>

                <button type="submit" disabled={otp.join('').length < 6 || isLoading} className="auth-btn-primary" style={{ opacity: otp.join('').length < 6 ? 0.55 : 1 }}>
                  {isLoading ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : 'Verify & Log in'}
                </button>
              </form>

              <div style={{ textAlign: 'center', marginTop: '16px' }}>
                <button
                  type="button"
                  onClick={() => { setStep('login-password'); setError(''); }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: PRIMARY,
                    fontSize: '13px',
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  Log in with password instead
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button type="button" onClick={() => { setStep('login-email'); setError(''); }} style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>← Change Email</button>
                <button type="button" onClick={handleSendEmailOtp} style={{ background: 'none', border: 'none', color: PRIMARY, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Resend Code</button>
              </div>
            </motion.div>
          )}

          {/* STEP 5: WHATSAPP NUMBER INPUT */}
          {step === 'whatsapp-send' && (
            <motion.div
              key="whatsapp-send"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', position: 'relative' }}>
                <button onClick={() => setStep('login-email')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: TEXT, display: 'flex', alignItems: 'center' }}>
                  <ArrowLeft size={20} />
                </button>
                <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', fontSize: '15px', color: TEXT }}>
                  Phone Login
                </span>
              </div>

              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: 800, color: TEXT, marginBottom: '8px', letterSpacing: '-0.5px' }}>
                WhatsApp OTP
              </h2>
              <p style={{ color: TEXT_MUTED, fontSize: '14px', marginBottom: '24px' }}>
                Enter your WhatsApp number to log in without a password
              </p>

              {error && (
                <div style={{ padding: '12px 14px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, color: '#b91c1c', fontSize: '13px', marginBottom: '18px' }}>
                  ⚠️ {error}
                </div>
              )}

              <form onSubmit={handleSendOtp} style={{ width: '100%' }}>
                <div style={{ marginBottom: '24px' }}>
                  <label style={labelStyle}>WhatsApp Number</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+919999999999"
                    required
                    autoFocus
                    className="auth-input"
                    style={inputStyle}
                  />
                </div>
                <button type="submit" disabled={isLoading} className="auth-btn-primary">
                  {isLoading ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : 'Send OTP via WhatsApp'}
                </button>
              </form>
            </motion.div>
          )}

          {/* STEP 6: WHATSAPP OTP VERIFICATION */}
          {step === 'whatsapp-otp' && (
            <motion.div
              key="whatsapp-otp"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', position: 'relative' }}>
                <button onClick={() => setStep('whatsapp-send')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: TEXT, display: 'flex', alignItems: 'center' }}>
                  <ArrowLeft size={20} />
                </button>
                <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', fontSize: '15px', color: TEXT }}>
                  Verify Code
                </span>
              </div>

              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: 800, color: TEXT, marginBottom: 8, letterSpacing: '-0.5px' }}>
                Verify OTP code
              </h2>
              <p style={{ color: TEXT_MUTED, fontSize: '14px', marginBottom: '24px' }}>
                We sent a 6-digit code to <span style={{ color: TEXT, fontWeight: 700 }}>{phone}</span>
              </p>

              {error && (
                <div style={{ padding: '12px 14px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, color: '#b91c1c', fontSize: '13px', marginBottom: '18px' }}>
                  ⚠️ {error}
                </div>
              )}

              {sandboxCode && (
                <div style={{ padding: '12px', borderRadius: 10, background: `rgba(176,136,80,0.08)`, border: `1px solid rgba(176,136,80,0.15)`, marginBottom: '24px', textAlign: 'center' }}>
                  <p style={{ color: PRIMARY, fontSize: '12px', fontWeight: 700, margin: 0 }}>[Dev Sandbox] WhatsApp Code:</p>
                  <p style={{ color: TEXT, fontSize: '24px', fontWeight: 800, letterSpacing: 4, margin: '6px 0 0 0' }}>{sandboxCode}</p>
                </div>
              )}

              <form onSubmit={handleVerifyOtp} style={{ width: '100%' }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      maxLength={1}
                      suppressHydrationWarning
                      style={{
                        width: '46px',
                        height: '54px',
                        borderRadius: '8px',
                        border: `2px solid ${digit ? PRIMARY : BORDER}`,
                        background: ELEVATED,
                        color: TEXT,
                        fontSize: '20px',
                        fontWeight: 700,
                        textAlign: 'center',
                        outline: 'none',
                        transition: 'border-color 0.2s, box-shadow 0.2s',
                        fontFamily: 'Outfit, sans-serif',
                        boxShadow: digit ? `0 0 0 3px rgba(176,136,80,0.1)` : 'none'
                      }}
                      onFocus={e => { e.target.style.borderColor = PRIMARY; e.target.style.boxShadow = '0 0 0 3px rgba(176,136,80,0.15)'; }}
                      onBlur={e => { e.target.style.borderColor = digit ? PRIMARY : BORDER; e.target.style.boxShadow = digit ? '0 0 0 3px rgba(176,136,80,0.1)' : 'none'; }}
                    />
                  ))}
                </div>

                <button type="submit" disabled={otp.join('').length < 6 || isLoading} className="auth-btn-primary" style={{ opacity: otp.join('').length < 6 ? 0.55 : 1 }}>
                  {isLoading ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : 'Verify & Log in'}
                </button>
              </form>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
                <button type="button" onClick={() => { setStep('whatsapp-send'); setError(''); }} style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>← Change Number</button>
                <button type="button" onClick={handleSendOtp} style={{ background: 'none', border: 'none', color: PRIMARY, fontSize: '13px', fontWeight: 700, cursor: 'pointer' }}>Resend Code</button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Server Connection Settings Modal */}
      <AnimatePresence>
        {showServerSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(43,34,26,0.4)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              style={{ width: '100%', maxWidth: 380, background: ELEVATED, borderRadius: 24, border: `1px solid ${BORDER}`, padding: 28, boxShadow: '0 20px 50px rgba(43,34,26,0.15)' }}
            >
              <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 800, color: TEXT, marginBottom: 10 }}>Connection Settings</h3>
              <p style={{ fontSize: '13px', color: TEXT_MUTED, lineHeight: 1.5, marginBottom: 20 }}>
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
                  style={{ flex: 1, padding: 12, borderRadius: 30, background: SURFACE, border: `1.5px solid ${BORDER}`, color: TEXT, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
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
                  style={{ flex: 1, padding: 12, borderRadius: 30, background: PRIMARY, color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}>
                  Save & Reload
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Google Account Chooser Sandbox Modal */}
      <AnimatePresence>
        {showGoogleChooser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(43,34,26,0.4)', backdropFilter: 'blur(6px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              style={{ width: '100%', maxWidth: 380, background: ELEVATED, borderRadius: 24, border: `1px solid ${BORDER}`, padding: 28, boxShadow: '0 20px 50px rgba(43,34,26,0.15)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <svg width="24" height="24" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '20px', fontWeight: 800, color: TEXT, margin: 0 }}>Sign in with Google</h3>
              </div>
              <p style={{ fontSize: '13px', color: TEXT_MUTED, lineHeight: 1.5, marginBottom: 20 }}>
                Choose an account to continue to <strong>Beato</strong> (Sandbox Mode).
              </p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {[
                  { name: 'Manoj Lastro', email: 'manoj93456355@gmail.com', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop' },
                  { name: 'Manoj Secondary', email: 'manoj4104s@gmail.com', avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' }
                ].map((acc) => (
                  <button
                    key={acc.email}
                    type="button"
                    onClick={() => {
                      setGoogleEmail(acc.email);
                      setGoogleName(acc.name);
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: googleEmail === acc.email ? 'rgba(176,136,80,0.1)' : SURFACE,
                      border: `2px solid ${googleEmail === acc.email ? PRIMARY : BORDER}`,
                      cursor: 'pointer',
                      textAlign: 'left',
                      width: '100%',
                      transition: 'all 0.2s',
                    }}
                  >
                    <img src={acc.avatar} alt={acc.name} style={{ width: 32, height: 32, borderRadius: '50%' }} />
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13.5, color: TEXT }}>{acc.name}</div>
                      <div style={{ fontSize: 12, color: TEXT_MUTED }}>{acc.email}</div>
                    </div>
                  </button>
                ))}
              </div>

              <form onSubmit={handleGoogleSandboxSubmit}>
                <div style={{ marginBottom: 20 }}>
                  <label style={labelStyle}>Or enter custom Google account</label>
                  <input
                    type="email"
                    value={googleEmail}
                    onChange={(e) => {
                      setGoogleEmail(e.target.value);
                      if (!googleName) setGoogleName(e.target.value.split('@')[0]);
                    }}
                    placeholder="Enter email address"
                    className="auth-input"
                    style={inputStyle}
                  />
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button
                    type="button"
                    onClick={() => {
                      setShowGoogleChooser(false);
                      setGoogleEmail('');
                    }}
                    style={{ flex: 1, padding: 12, borderRadius: 30, background: SURFACE, border: `1.5px solid ${BORDER}`, color: TEXT, fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'Outfit, sans-serif' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!googleEmail || isLoading}
                    style={{ flex: 1, padding: 12, borderRadius: 30, background: PRIMARY, color: '#fff', fontWeight: 800, fontSize: 14, border: 'none', cursor: 'pointer', fontFamily: 'Outfit, sans-serif', opacity: !googleEmail ? 0.5 : 1 }}
                  >
                    {isLoading ? 'Signing in...' : 'Continue'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
