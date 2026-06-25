'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Music2, ArrowLeft, Check, Eye, EyeOff, Smartphone, Calendar, User, Search } from 'lucide-react';
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

const YEARS = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 100 + i + 1);
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

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

const LANGUAGES = [
  { id: 'hindi', label: 'Hindi', bg: '#FF5722', artist: 'Arijit Singh', img: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=150&h=150&fit=crop' },
  { id: 'intl', label: 'International', bg: '#E58A2B', artist: 'Justin Bieber', img: 'https://images.unsplash.com/photo-1468164016595-6108e4c60c8b?w=150&h=150&fit=crop' },
  { id: 'punjabi', label: 'Punjabi', bg: '#A22DB0', artist: 'Diljit Dosanjh', img: 'https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=150&h=150&fit=crop' },
  { id: 'tamil', label: 'Tamil', bg: '#F4B88E', artist: 'Anirudh', img: 'https://images.unsplash.com/photo-1507838153414-b4b713384a76?w=150&h=150&fit=crop' },
  { id: 'telugu', label: 'Telugu', bg: '#2EAD5F', artist: 'Sid Sriram', img: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=150&h=150&fit=crop' },
  { id: 'malayalam', label: 'Malayalam', bg: '#799884', artist: 'KS Harisankar', img: 'https://images.unsplash.com/photo-1415201364774-f6f0bb35f28f?w=150&h=150&fit=crop' },
  { id: 'marathi', label: 'Marathi', bg: '#D35E34', artist: 'Ajay-Atul', img: 'https://images.unsplash.com/photo-1484755560615-a4c64e778a6c?w=150&h=150&fit=crop' },
  { id: 'gujarati', label: 'Gujarati', bg: '#E83D7C', artist: 'Darshan Raval', img: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=150&h=150&fit=crop' },
  { id: 'bengali', label: 'Bengali', bg: '#1A86D9', artist: 'Shreya Ghoshal', img: 'https://images.unsplash.com/photo-1464375117522-1311d6a5b81f?w=150&h=150&fit=crop' },
  { id: 'kannada', label: 'Kannada', bg: '#B71C1C', artist: 'Vijay Prakash', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&h=150&fit=crop' }
];

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

  // Date scroll spinner states (defaults match Image 1: Jun 25, 2016)
  const [day, setDay] = useState(25);
  const [month, setMonth] = useState(5); // 0-indexed: June
  const [year, setYear] = useState(2016);
  const [marketingOptOut, setMarketingOptOut] = useState(false);
  const [shareDataOptOut, setShareDataOptOut] = useState(false);

  // Email OTP signup states
  const [otpCode, setOtpCode] = useState<string[]>(['', '', '', '', '', '']);
  const [emailSandboxCode, setEmailSandboxCode] = useState('');
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Onboarding states
  const [selectedLanguages, setSelectedLanguages] = useState<string[]>([]);
  const [selectedArtists, setSelectedArtists] = useState<string[]>([]);
  const [artistSearch, setArtistSearch] = useState('');
  const [dbArtists, setDbArtists] = useState<any[]>([]);
  const [loadingArtists, setLoadingArtists] = useState(false);

  const [showGoogleChooser, setShowGoogleChooser] = useState(false);
  const [googleEmail, setGoogleEmail] = useState('');
  const [googleName, setGoogleName] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');

  const { login, signup, updateUser, user: authUser, sendEmailOtp, loginWithGooglePayload } = useAuthStore();
  const router = useRouter();

  // Fetch registered active database artists on mount
  useEffect(() => {
    const fetchArtists = async () => {
      setLoadingArtists(true);
      try {
        const res = await fetch('/api/artist/list');
        const data = await res.json();
        if (data.success && data.artists && data.artists.length > 0) {
          setDbArtists(data.artists);
        } else {
          // fallback if DB artists are empty or offline
          setDbArtists([
            { id: 'artist-1', name: 'Aurora Nightfall', img: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=100&h=100&fit=crop' },
            { id: 'artist-2', name: 'Cipher Nova', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop' },
            { id: 'artist-3', name: 'Selene Ray', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
            { id: 'artist-4', name: 'The Velvet Echoes', img: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop' },
            { id: 'artist-5', name: 'Nyx & Prometheus', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop' },
            { id: 'artist-6', name: 'Marco Santos', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' }
          ]);
        }
      } catch (err) {
        console.error('Failed to load artists from DB:', err);
        // fallback
        setDbArtists([
          { id: 'artist-1', name: 'Aurora Nightfall', img: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=100&h=100&fit=crop' },
          { id: 'artist-2', name: 'Cipher Nova', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop' },
          { id: 'artist-3', name: 'Selene Ray', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
          { id: 'artist-4', name: 'The Velvet Echoes', img: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop' },
          { id: 'artist-5', name: 'Nyx & Prometheus', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop' },
          { id: 'artist-6', name: 'Marco Santos', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' }
        ]);
      } finally {
        setLoadingArtists(false);
      }
    };
    fetchArtists();
  }, []);

  const monthRef = useRef<HTMLDivElement>(null);
  const dayRef = useRef<HTMLDivElement>(null);
  const yearRef = useRef<HTMLDivElement>(null);

  // Prefill email from query parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const emailParam = searchParams.get('email');
      if (emailParam) {
        setEmail(emailParam);
      }
    }
  }, []);

  // Sync date of birth state YYYY-MM-DD
  useEffect(() => {
    const maxDays = new Date(year, month + 1, 0).getDate();
    let currentDay = day;
    if (day > maxDays) {
      currentDay = maxDays;
      setDay(maxDays);
    }
    const dobString = `${year}-${String(month + 1).padStart(2, '0')}-${String(currentDay).padStart(2, '0')}`;
    setDob(dobString);
  }, [day, month, year]);

  // Programmatically scroll spinners when month/day/year change (prevents loops by checking scroll index)
  useEffect(() => {
    if (monthRef.current) {
      const currentScrollIndex = Math.round(monthRef.current.scrollTop / 36);
      if (currentScrollIndex !== month) {
        monthRef.current.scrollTop = month * 36;
      }
    }
  }, [month]);

  useEffect(() => {
    if (dayRef.current) {
      const currentScrollIndex = Math.round(dayRef.current.scrollTop / 36);
      if (currentScrollIndex !== day - 1) {
        dayRef.current.scrollTop = (day - 1) * 36;
      }
    }
  }, [day]);

  useEffect(() => {
    if (yearRef.current) {
      const yearIndex = YEARS.indexOf(year);
      const currentScrollIndex = Math.round(yearRef.current.scrollTop / 36);
      if (currentScrollIndex !== yearIndex && yearIndex !== -1) {
        yearRef.current.scrollTop = yearIndex * 36;
      }
    }
  }, [year]);

  // Programmatically scroll containers to initial values on step render (Jun 25, 2016)
  useEffect(() => {
    if (step === 3) {
      const timer = setTimeout(() => {
        if (monthRef.current) monthRef.current.scrollTop = month * 36;
        if (dayRef.current) dayRef.current.scrollTop = (day - 1) * 36;
        if (yearRef.current) {
          const yIdx = YEARS.indexOf(year);
          if (yIdx !== -1) yearRef.current.scrollTop = yIdx * 36;
        }
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [step]);

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

  const handleOtpChange = (i: number, val: string) => {
    const cleanVal = val.slice(-1);
    const n = [...otpCode];
    n[i] = cleanVal;
    setOtpCode(n);
    setOtpError('');
    if (cleanVal && i < 5) {
      document.getElementById(`otp-${i + 1}`)?.focus();
    }
  };

  const handleOtpKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpCode[i] && i > 0) {
        const n = [...otpCode];
        n[i - 1] = '';
        setOtpCode(n);
        document.getElementById(`otp-${i - 1}`)?.focus();
      } else {
        const n = [...otpCode];
        n[i] = '';
        setOtpCode(n);
      }
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').trim();
    if (/^\d{6}$/.test(pastedData)) {
      const digits = pastedData.split('');
      setOtpCode(digits);
      setOtpError('');
      document.getElementById('otp-5')?.focus();
    }
  };

  const handleResendOtp = async () => {
    setSendingOtp(true);
    setOtpError('');
    setOtpCode(['', '', '', '', '', '']);
    try {
      const data = await sendEmailOtp(email);
      if (data && data.developmentSandboxCode) {
        setEmailSandboxCode(data.developmentSandboxCode);
        toast.success(`[Sandbox] Email OTP: ${data.developmentSandboxCode}`);
      } else {
        toast.success('A new verification code has been sent!');
      }
    } catch (err: any) {
      const msg = err.message || 'Failed to send OTP. Please try again.';
      toast.error(msg);
      setOtpError(msg);
    } finally {
      setSendingOtp(false);
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
    setOtpError('');
    try {
      const res = await loginWithGooglePayload({
        email: googleEmail,
        name: googleName || googleEmail.split('@')[0],
      });
      if (res.success) {
        setShowGoogleChooser(false);
        if (res.isNewUser) {
          toast.success("Signed up with Google (Sandbox)! Let's set up your profile. 🎵");
          setStep(6); // Go to language selection (onboarding start)
        } else {
          toast.success('Logged in with Google (Sandbox)! 🎵');
          router.push('/home');
        }
      }
    } catch (err: any) {
      toast.error(err.message || 'Google Sandbox login failed');
      setOtpError(err.message || 'Google Sandbox login failed');
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
          setOtpError('');

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
                  if (res.isNewUser) {
                    toast.success("Signed up with Google! Let's set up your profile. 🎵");
                    setStep(6);
                  } else {
                    toast.success('Logged in with Google! 🎵');
                    router.push('/home');
                  }
                }
              } catch (err: any) {
                toast.error(err.message || 'Google Sign-In failed');
                setOtpError(err.message || 'Google Sign-In failed');
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
          toast.error(err.message || 'Google Login failed to initialize');
          setOtpError(err.message || 'Google Login failed to initialize');
          setShowGoogleChooser(true);
        } finally {
          setIsLoading(false);
        }
      } else {
        setShowGoogleChooser(true);
      }
      return;
    }
  };

  const passwordStrength = password.length === 0 ? 0 : password.length < 6 ? 1 : password.length < 10 ? 2 : password.length < 14 ? 3 : 4;
  const strengthColor = ['#d4ccc0', '#ef4444', '#f59e0b', '#b08850', '#22c55e'][passwordStrength];
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][passwordStrength];

  const handleNext = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (step === 0) {
      if (emailExists) { toast.error('This email is already registered'); return; }
      if (checkingEmail) { toast.error('Checking email availability...'); return; }
      if (!email) { toast.error('Please enter your email'); return; }
      
      setSendingOtp(true);
      setOtpError('');
      try {
        const data = await sendEmailOtp(email);
        if (data && data.developmentSandboxCode) {
          setEmailSandboxCode(data.developmentSandboxCode);
          toast.success(`[Sandbox] Email OTP: ${data.developmentSandboxCode}`);
        } else {
          toast.success('Verification code sent to your email!');
        }
        setStep(1);
      } catch (err: any) {
        const msg = err.message || 'Failed to send OTP. Please check your email.';
        toast.error(msg);
        setOtpError(msg);
      } finally {
        setSendingOtp(false);
      }
      return;
    }
    if (step === 1) {
      const code = otpCode.join('');
      if (code.length < 6) {
        toast.error('Please enter the 6-digit verification code');
        return;
      }
      setVerifyingOtp(true);
      setOtpError('');
      try {
        const res = await fetch('/api/auth/email/verify-otp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code, mode: 'signup' }),
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.error || 'Invalid verification code');
        }
        toast.success('Email verified successfully!');
        setStep(2);
      } catch (err: any) {
        const msg = err.message || 'Verification failed';
        toast.error(msg);
        setOtpError(msg);
      } finally {
        setVerifyingOtp(false);
      }
      return;
    }
    if (step === 2) {
      if (password.length < 8) { toast.error('Password must be at least 8 characters'); return; }
      setConfirmPassword(password);
      setStep(3);
      return;
    }
    if (step === 3) {
      if (!dob) { toast.error('Please select your date of birth'); return; }
      setStep(4);
      return;
    }
    if (step === 4) {
      if (!gender) { toast.error('Please select your gender'); return; }
      setStep(5);
      return;
    }
    if (step === 5) {
      if (!name) { toast.error('Please enter your name'); return; }
      if (!agreed) { toast.error('You must agree to the Terms of Service and Privacy Policy'); return; }
      setIsLoading(true);
      try {
        await signup(name, email, password, password);
        await login(email, password);
        setStep(6);
      } catch (error: unknown) {
        const msg = error instanceof Error ? error.message : String(error);
        toast.error(msg || 'Registration failed. Try again.');
      } finally {
        setIsLoading(false);
      }
    }
  };

  const getDaysInMonth = (m: number, y: number) => {
    return new Date(y, m + 1, 0).getDate();
  };

  const handleScroll = (type: 'month' | 'day' | 'year', e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const index = Math.round(scrollTop / 36);
    if (type === 'month') {
      if (index >= 0 && index < 12 && index !== month) {
        setMonth(index);
      }
    } else if (type === 'day') {
      const maxDays = getDaysInMonth(month, year);
      if (index >= 0 && index < maxDays && index !== day - 1) {
        setDay(index + 1);
      }
    } else if (type === 'year') {
      if (index >= 0 && index < YEARS.length && YEARS[index] !== year) {
        setYear(YEARS[index]);
      }
    }
  };

  const handleFinishOnboarding = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          followedArtists: selectedArtists,
          preferences: {
            language: selectedLanguages.join(','),
            theme: 'light'
          }
        }),
      });

      if (!res.ok) {
        console.warn('Backend update failed during onboarding sync');
      }

      if (authUser) {
        updateUser({
          followedArtists: selectedArtists,
          preferences: {
            ...authUser.preferences,
            language: selectedLanguages.join(','),
            theme: 'light'
          }
        });
      }

      setStep(8);
    } catch (err) {
      console.error('Onboarding sync error:', err);
      setStep(8);
    } finally {
      setIsLoading(false);
    }
  };

  // Redirect to home after 2.5 seconds when onboarding is complete (Step 8)
  useEffect(() => {
    if (step === 8) {
      const timer = setTimeout(() => {
        toast.success('Welcome to Beato! 🎵');
        router.push('/home');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [step, router]);

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

  const isOnboarding = step >= 6;

  return (
    <div className={`register-page-wrapper ${isOnboarding ? 'dark-onboarding' : ''}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Outfit:wght@700;800;900&display=swap');

        .register-page-wrapper {
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

        /* DOB scroll spinner styling */
        .dob-spinner-container {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin: 40px 0;
          user-select: none;
        }

        .dob-spinner-column {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 90px;
          position: relative;
        }

        .dob-spinner-scroll-container {
          height: 108px;
          overflow-y: scroll;
          scroll-snap-type: y mandatory;
          scrollbar-width: none;
          -ms-overflow-style: none;
          width: 100%;
        }

        .dob-spinner-scroll-container::-webkit-scrollbar {
          display: none;
        }

        .dob-spinner-line {
          position: absolute;
          left: 0;
          right: 0;
          height: 1.5px;
          background: ${PRIMARY};
          opacity: 0.35;
        }

        .dob-spinner-line-top {
          top: 36px;
        }

        .dob-spinner-line-bottom {
          bottom: 36px;
        }

        .dob-spinner-item {
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          scroll-snap-align: center;
          font-size: 16px;
          color: ${TEXT_MUTED};
          cursor: pointer;
          transition: all 0.2s;
          width: 100%;
        }

        .dob-spinner-item.active {
          font-size: 20px;
          font-weight: 800;
          color: ${TEXT};
        }

        .dob-spinner-item.dimmed {
          opacity: 0.4;
          font-size: 14px;
        }

        /* Gender pill select styling */
        .gender-pills-container {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          margin-top: 28px;
        }

        .gender-pill {
          padding: 12px 24px;
          border-radius: 30px;
          border: 1.5px solid ${BORDER};
          background: transparent;
          color: ${TEXT};
          font-size: 15px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          font-family: 'Inter', sans-serif;
          box-sizing: border-box;
        }

        .gender-pill:hover {
          border-color: rgba(176, 136, 80, 0.4);
          background: ${SURFACE};
        }

        .gender-pill.active {
          border-color: ${PRIMARY};
          background: ${PRIMARY};
          color: #ffffff;
        }

        /* Onboarding light beige mode styles */
        .register-page-wrapper.dark-onboarding {
          background: ${BG} !important;
          color: ${TEXT} !important;
          transition: background 0.3s ease;
        }
        .auth-card.dark-onboarding {
          background: ${SURFACE} !important;
          border-color: ${BORDER} !important;
          color: ${TEXT} !important;
          box-shadow: 0 10px 40px rgba(43, 34, 26, 0.04) !important;
        }

        /* Language Grid Styles */
        .lang-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          margin-top: 24px;
          margin-bottom: 24px;
        }
        .lang-card {
          position: relative;
          height: 120px;
          border-radius: 12px;
          padding: 16px;
          overflow: hidden;
          cursor: pointer;
          user-select: none;
          transition: transform 0.2s, box-shadow 0.2s, border-color 0.2s;
          border: 2.5px solid transparent;
        }
        .lang-card:hover {
          transform: scale(1.02);
        }
        .lang-card.selected {
          border-color: ${TEXT} !important;
          box-shadow: 0 4px 12px rgba(43, 34, 26, 0.15);
        }
        .lang-card-title {
          font-family: 'Outfit', sans-serif;
          font-size: 18px;
          font-weight: 800;
          color: #ffffff;
          margin: 0;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.25);
        }
        .lang-card-img {
          position: absolute;
          bottom: -15px;
          right: -15px;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          transform: rotate(25deg);
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.3);
          object-fit: cover;
        }

        /* Artist Grid Styles */
        .artist-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 24px 12px;
          margin-top: 24px;
          margin-bottom: 24px;
          max-height: 380px;
          overflow-y: auto;
          padding: 8px 4px;
        }
        .artist-grid::-webkit-scrollbar {
          width: 6px;
        }
        .artist-grid::-webkit-scrollbar-track {
          background: rgba(43, 34, 26, 0.03);
          border-radius: 3px;
        }
        .artist-grid::-webkit-scrollbar-thumb {
          background: rgba(176, 136, 80, 0.25);
          border-radius: 3px;
        }
        .artist-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          cursor: pointer;
          position: relative;
          transition: transform 0.2s ease;
        }
        .artist-avatar-wrapper {
          position: relative;
          width: 90px;
          height: 90px;
          margin-bottom: 10px;
        }
        .artist-avatar {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          object-fit: cover;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          border: 3.5px solid transparent;
          box-shadow: 0 4px 10px rgba(43, 34, 26, 0.05);
        }
        .artist-item:hover .artist-avatar {
          transform: scale(1.08) translateY(-3px);
          box-shadow: 0 8px 16px rgba(43, 34, 26, 0.12);
        }
        .artist-item.selected .artist-avatar {
          border-color: ${PRIMARY} !important;
          transform: scale(1.08) translateY(-3px);
          box-shadow: 0 8px 20px rgba(176, 136, 80, 0.35);
        }
        .artist-checkmark-badge {
          position: absolute;
          bottom: -2px;
          right: -2px;
          background: ${PRIMARY};
          color: #ffffff;
          border-radius: 50%;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid ${SURFACE};
          box-shadow: 0 3px 8px rgba(176, 136, 80, 0.3);
          z-index: 5;
          animation: popIn 0.35s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .artist-name {
          font-size: 13px;
          font-weight: 700;
          color: ${TEXT} !important;
          line-height: 1.3;
          margin: 4px 0 0 0;
          transition: color 0.2s ease;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .artist-item.selected .artist-name {
          color: ${PRIMARY} !important;
        }

        /* Search input styles for onboarding */
        .onboarding-search-container {
          position: relative;
          margin-top: 16px;
        }
        .onboarding-search-input {
          width: 100%;
          background: #ffffff;
          border: 1.5px solid ${BORDER};
          border-radius: 12px;
          padding: 14px 16px 14px 44px;
          color: ${TEXT};
          font-size: 15px;
          outline: none;
          font-family: 'Inter', sans-serif;
          transition: all 0.2s ease;
          box-sizing: border-box;
          box-shadow: 0 2px 8px rgba(43, 34, 26, 0.02);
        }
        .onboarding-search-input:focus {
          border-color: ${PRIMARY};
          box-shadow: 0 0 0 4px rgba(176, 136, 80, 0.12), 0 4px 12px rgba(176, 136, 80, 0.05);
          background: #ffffff;
        }
        .onboarding-search-icon {
          position: absolute;
          left: 16px;
          top: 50%;
          transform: translateY(-50%);
          color: ${TEXT_MUTED};
          pointer-events: none;
          transition: color 0.2s ease;
        }
        .onboarding-search-input:focus ~ .onboarding-search-icon {
          color: ${PRIMARY};
        }

        /* Overlapping avatars style */
        .overlapping-avatars-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 40px 0;
        }
        .overlapping-avatar {
          width: 100px;
          height: 100px;
          border-radius: 50%;
          object-fit: cover;
          border: 3px solid ${SURFACE};
          box-shadow: 0 4px 15px rgba(43, 34, 26, 0.12);
          position: relative;
          transition: all 0.3s ease;
        }
        .overlapping-avatar:not(:first-child) {
          margin-left: -30px;
        }
        .overlapping-avatar.center-avatar {
          z-index: 10;
          transform: scale(1.15);
        }

        @keyframes popIn {
          0% { transform: scale(0); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }

        @media (max-width: 480px) {
          .register-page-wrapper {
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
          .auth-card.dark-onboarding {
            background: transparent !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
      `}</style>

      <div className={`auth-card ${isOnboarding ? 'dark-onboarding' : ''}`}>
        <AnimatePresence mode="wait">
          {done ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px', marginTop: '60px' }}
            >
              <div style={{
                width: 80,
                height: 80,
                borderRadius: '50%',
                background: `rgba(176,136,80,0.12)`,
                border: `2px solid ${PRIMARY}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: `0 6px 20px rgba(176,136,80,0.2)`
              }}>
                <Check size={36} color={PRIMARY} />
              </div>
              <div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '24px', fontWeight: 800, color: TEXT, marginBottom: '8px' }}>
                  Welcome to Beato! 🎉
                </h2>
                <p style={{ color: TEXT_MUTED, fontSize: '14px' }}>
                  Your account is ready. Taking you to music player…
                </p>
              </div>
              <div style={{ width: 28, height: 28, border: `3px solid ${PRIMARY}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            </motion.div>
          ) : (
            <>
              {/* STEP 0: EMAIL INPUT SCREEN (IMAGE 3) */}
              {step === 0 && (
                <motion.div
                  key="s0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', flex: 1 }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', position: 'relative' }}>
                    <button onClick={() => router.push('/login')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: TEXT, display: 'flex', alignItems: 'center' }}>
                      <ArrowLeft size={20} />
                    </button>
                    <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', fontSize: '15px', color: TEXT }}>
                      Sign Up
                    </span>
                  </div>

                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: 800, color: TEXT, marginBottom: '6px', letterSpacing: '-0.5px' }}>
                    Sign up to start listening
                  </h2>

                  <form onSubmit={handleNext} style={{ width: '100%', marginTop: '16px' }}>
                    <div style={{ marginBottom: '20px' }}>
                      <label style={labelStyle}>What's your email?</label>
                      <p style={{ color: TEXT_MUTED, fontSize: '13px', marginTop: '-4px', marginBottom: '10px' }}>
                        You'll need to confirm this email later.
                      </p>
                      <input
                        type="email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="Email address"
                        required
                        autoFocus
                        className="auth-input"
                        style={{ ...inputStyle, borderColor: emailExists ? '#dc2626' : BORDER }}
                      />
                      {emailExists && (
                        <p style={{ color: '#dc2626', fontSize: '12px', marginTop: '6px', fontWeight: 500 }}>
                          ⚠️ This email is already registered.
                        </p>
                      )}
                      {checkingEmail && (
                        <p style={{ color: TEXT_MUTED, fontSize: '12px', marginTop: '6px' }}>
                          Checking availability...
                        </p>
                      )}
                    </div>
                    <button type="submit" disabled={emailExists || checkingEmail} className="auth-btn-primary">
                      Continue
                    </button>
                  </form>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', margin: '24px 0', width: '100%' }}>
                    <div style={{ flex: 1, height: '1px', background: BORDER }} />
                    <span style={{ color: TEXT_MUTED, fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Or sign up with</span>
                    <div style={{ flex: 1, height: '1px', background: BORDER }} />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', width: '100%', marginBottom: '24px' }}>
                    <button onClick={() => router.push('/login')} className="social-oauth-btn">
                      <Smartphone size={16} style={{ position: 'absolute', left: '20px' }} />
                      <span>Phone number</span>
                    </button>
                    <button onClick={() => handleSocialLogin('Google')} className="social-oauth-btn">
                      <GoogleIcon />
                      <span>Google</span>
                    </button>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: 'auto', paddingBottom: '10px' }}>
                    <span style={{ color: TEXT_MUTED, fontSize: '13px', fontWeight: 600 }}>Already have an account? </span>
                    <Link href="/login" style={{ color: PRIMARY, fontWeight: 'bold', textDecoration: 'none', fontSize: '13px' }}>
                      Log In
                    </Link>
                  </div>
                </motion.div>
              )}

              {/* STEP 1: EMAIL OTP VERIFICATION */}
              {step === 1 && (
                <motion.div
                  key="s1-otp"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '520px', justifyContent: 'space-between' }}
                >
                  <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', position: 'relative' }}>
                      <button type="button" onClick={() => { setStep(0); setOtpError(''); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: TEXT, display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={20} />
                      </button>
                      <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', fontSize: '15px', color: TEXT }}>
                        Verify Email
                      </span>
                    </div>

                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: 800, color: TEXT, marginBottom: 8, letterSpacing: '-0.5px' }}>
                      Verify your email
                    </h2>
                    <p style={{ color: TEXT_MUTED, fontSize: '14px', marginBottom: '24px' }}>
                      We sent a 6-digit code to <span style={{ color: TEXT, fontWeight: 700 }}>{email}</span>
                    </p>

                    {otpError && (
                      <div style={{ padding: '12px 14px', background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.2)', borderRadius: 10, color: '#b91c1c', fontSize: '13px', marginBottom: '18px' }}>
                        ⚠️ {otpError}
                      </div>
                    )}

                    {emailSandboxCode && (
                      <div style={{ padding: '12px', borderRadius: 10, background: `rgba(176,136,80,0.08)`, border: `1px solid rgba(176,136,80,0.15)`, marginBottom: '24px', textAlign: 'center' }}>
                        <p style={{ color: PRIMARY, fontSize: '12px', fontWeight: 700, margin: 0 }}>[Dev Sandbox] Email Code:</p>
                        <p style={{ color: TEXT, fontSize: '24px', fontWeight: 800, letterSpacing: 4, margin: '6px 0 0 0' }}>{emailSandboxCode}</p>
                      </div>
                    )}

                    <form onSubmit={handleNext} style={{ width: '100%' }}>
                      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', justifyContent: 'center' }}>
                        {otpCode.map((digit, i) => (
                          <input
                            key={i}
                            id={`otp-${i}`}
                            type="text"
                            inputMode="numeric"
                            value={digit}
                            onChange={e => handleOtpChange(i, e.target.value)}
                            onKeyDown={e => handleOtpKeyDown(i, e)}
                            onPaste={handleOtpPaste}
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

                      <button type="submit" disabled={otpCode.join('').length < 6 || verifyingOtp || sendingOtp} className="auth-btn-primary" style={{ opacity: otpCode.join('').length < 6 ? 0.55 : 1 }}>
                        {verifyingOtp ? <div style={{ width: 20, height: 20, border: '2px solid rgba(255,255,255,0.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> : 'Verify Code'}
                      </button>
                    </form>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', marginBottom: '24px' }}>
                      <button type="button" onClick={() => { setStep(0); setOtpError(''); }} style={{ background: 'none', border: 'none', color: TEXT_MUTED, fontSize: '13px', cursor: 'pointer', fontWeight: 600 }}>← Change Email</button>
                      <button type="button" onClick={handleResendOtp} disabled={sendingOtp} style={{ background: 'none', border: 'none', color: PRIMARY, fontSize: '13px', fontWeight: 700, cursor: 'pointer', opacity: sendingOtp ? 0.5 : 1 }}>
                        {sendingOtp ? 'Sending...' : 'Resend Code'}
                      </button>
                    </div>
                  </div>

                  <div style={{ marginTop: 'auto', paddingTop: '20px' }}>
                    <p style={{ color: '#8c7662', fontSize: '12.5px', fontStyle: 'italic', lineHeight: '1.4', margin: 0 }}>
                      📩 <strong>Note:</strong> If you don't see the mail in your inbox, please check your <strong>Spam or Junk folder</strong> (Gmail SMTP can sometimes flag automated verification codes as spam).
                    </p>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: PASSWORD CREATION */}
              {step === 2 && (
                <motion.form
                  key="s2-pass"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleNext}
                  style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '520px', justifyContent: 'space-between' }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', position: 'relative' }}>
                      <button type="button" onClick={() => setStep(1)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: TEXT, display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={20} />
                      </button>
                      <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', fontSize: '15px', color: TEXT }}>
                        Create account
                      </span>
                    </div>

                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: 800, color: TEXT, marginBottom: '6px', letterSpacing: '-0.5px' }}>
                      Create a password
                    </h2>
                    <p style={{ color: TEXT_MUTED, fontSize: '14px', marginBottom: '24px' }}>
                      Choose a secure password.
                    </p>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', width: '100%' }}>
                      <div style={{ position: 'relative' }}>
                        <label style={labelStyle}>Password</label>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={password}
                          onChange={e => setPassword(e.target.value)}
                          placeholder="At least 8 characters"
                          required
                          minLength={8}
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

                      {password.length > 0 && (
                        <div style={{ marginTop: '-4px' }}>
                          <div style={{ display: 'flex', gap: 4, marginBottom: 5 }}>
                            {[1, 2, 3, 4].map(i => (
                              <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: i <= passwordStrength ? strengthColor : BORDER, transition: 'background 0.3s' }} />
                            ))}
                          </div>
                          <p style={{ fontSize: 12, color: strengthColor, fontWeight: 700, margin: 0 }}>{strengthLabel}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <button type="submit" disabled={password.length < 8} className="auth-btn-primary" style={{ marginTop: '32px', opacity: password.length < 8 ? 0.55 : 1 }}>
                    Next
                  </button>
                </motion.form>
              )}

              {/* STEP 2: DATE OF BIRTH (IMAGE 1) */}
              {/* STEP 3: DATE OF BIRTH (IMAGE 1) */}
              {step === 3 && (
                <motion.form
                  key="s3-dob"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleNext}
                  style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '520px', justifyContent: 'space-between' }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', position: 'relative' }}>
                      <button type="button" onClick={() => setStep(2)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: TEXT, display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={20} />
                      </button>
                      <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', fontSize: '15px', color: TEXT }}>
                        Create account
                      </span>
                    </div>

                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: 800, color: TEXT, marginBottom: '6px', letterSpacing: '-0.5px' }}>
                      What's your date of birth?
                    </h2>

                    <div className="dob-spinner-container">
                      {/* Month spinner */}
                      <div className="dob-spinner-column">
                        <div className="dob-spinner-line dob-spinner-line-top" />
                        <div className="dob-spinner-line dob-spinner-line-bottom" />
                        <div 
                          ref={monthRef} 
                          className="dob-spinner-scroll-container"
                          onScroll={(e) => handleScroll('month', e)}
                        >
                          <div style={{ height: 36 }} />
                          {MONTHS.map((m, idx) => (
                            <div 
                              key={m} 
                              onClick={() => setMonth(idx)}
                              className={`dob-spinner-item ${month === idx ? 'active' : 'dimmed'}`}
                            >
                              {m}
                            </div>
                          ))}
                          <div style={{ height: 36 }} />
                        </div>
                      </div>

                      {/* Day spinner */}
                      <div className="dob-spinner-column">
                        <div className="dob-spinner-line dob-spinner-line-top" />
                        <div className="dob-spinner-line dob-spinner-line-bottom" />
                        <div 
                          ref={dayRef} 
                          className="dob-spinner-scroll-container"
                          onScroll={(e) => handleScroll('day', e)}
                        >
                          <div style={{ height: 36 }} />
                          {Array.from({ length: getDaysInMonth(month, year) }, (_, i) => i + 1).map((d) => (
                            <div 
                              key={d} 
                              onClick={() => setDay(d)}
                              className={`dob-spinner-item ${day === d ? 'active' : 'dimmed'}`}
                            >
                              {d}
                            </div>
                          ))}
                          <div style={{ height: 36 }} />
                        </div>
                      </div>

                      {/* Year spinner */}
                      <div className="dob-spinner-column">
                        <div className="dob-spinner-line dob-spinner-line-top" />
                        <div className="dob-spinner-line dob-spinner-line-bottom" />
                        <div 
                          ref={yearRef} 
                          className="dob-spinner-scroll-container"
                          onScroll={(e) => handleScroll('year', e)}
                        >
                          <div style={{ height: 36 }} />
                          {YEARS.map((y) => (
                            <div 
                              key={y} 
                              onClick={() => setYear(y)}
                              className={`dob-spinner-item ${year === y ? 'active' : 'dimmed'}`}
                            >
                              {y}
                            </div>
                          ))}
                          <div style={{ height: 36 }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="auth-btn-primary" style={{ marginTop: '32px' }}>
                    Next
                  </button>
                </motion.form>
              )}

              {/* STEP 4: GENDER (IMAGE 2) */}
              {step === 4 && (
                <motion.form
                  key="s4-gender"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleNext}
                  style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '520px', justifyContent: 'space-between' }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', position: 'relative' }}>
                      <button type="button" onClick={() => setStep(3)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: TEXT, display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={20} />
                      </button>
                      <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', fontSize: '15px', color: TEXT }}>
                        Create account
                      </span>
                    </div>

                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: 800, color: TEXT, marginBottom: '6px', letterSpacing: '-0.5px' }}>
                      What's your gender?
                    </h2>

                    <div className="gender-pills-container">
                      {[
                        { label: 'Female', value: 'woman' },
                        { label: 'Male', value: 'man' },
                        { label: 'Non-binary', value: 'nonbinary' },
                        { label: 'Other', value: 'other' },
                        { label: 'Prefer not to say', value: 'prefer-not-to-say' }
                      ].map(p => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => {
                            setGender(p.value);
                            // Visual delay feedback before auto progressing
                            setTimeout(() => {
                              setStep(5);
                            }, 200);
                          }}
                          className={`gender-pill ${gender === p.value ? 'active' : ''}`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button type="submit" disabled={!gender} className="auth-btn-primary" style={{ marginTop: '32px', opacity: !gender ? 0.55 : 1 }}>
                    Next
                  </button>
                </motion.form>
              )}

              {/* STEP 5: NAME & AGREEMENTS (IMAGE 3) */}
              {step === 5 && (
                <motion.form
                  key="s5-name"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  onSubmit={handleNext}
                  style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '520px', justifyContent: 'space-between' }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: '32px', position: 'relative' }}>
                      <button type="button" onClick={() => setStep(4)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: TEXT, display: 'flex', alignItems: 'center' }}>
                        <ArrowLeft size={20} />
                      </button>
                      <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', fontSize: '15px', color: TEXT }}>
                        Create account
                      </span>
                    </div>

                    <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: 800, color: TEXT, marginBottom: '6px', letterSpacing: '-0.5px' }}>
                      What's your name?
                    </h2>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', width: '100%' }}>
                      <div>
                        <input
                          value={name}
                          onChange={e => setName(e.target.value)}
                          placeholder="Your display name"
                          required
                          autoFocus
                          className="auth-input"
                          style={{ ...inputStyle, background: '#ffffff', border: `1.5px solid ${BORDER}` }}
                        />
                        <p style={{ color: TEXT_MUTED, fontSize: '12px', marginTop: '6px' }}>
                          This appears on your Beato profile.
                        </p>
                      </div>

                      <div style={{ width: '100%', height: '1.5px', background: BORDER, margin: '8px 0' }} />

                      <div style={{ color: TEXT, fontSize: '12px', lineHeight: '1.5', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                        <p>
                          By tapping "Create account", you agree to the Beato{' '}
                          <span style={{ color: PRIMARY, textDecoration: 'underline', fontWeight: 600, cursor: 'pointer' }}>Terms of Use</span>.
                        </p>
                        
                        <p>
                          To learn more about how Beato collects, uses, shares and protects your personal data, please see the Beato{' '}
                          <span style={{ color: PRIMARY, textDecoration: 'underline', fontWeight: 600, cursor: 'pointer' }}>Privacy Policy</span>.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: 'pointer' }}>
                            <span style={{ color: TEXT_SEC, fontSize: '12.5px', paddingRight: '12px', flex: 1 }}>
                              I agree to the Terms of Service and Privacy Policy.
                            </span>
                            <div onClick={() => setAgreed(v => !v)} style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              border: `2px solid ${agreed ? PRIMARY : BORDER}`,
                              background: agreed ? PRIMARY : ELEVATED,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'all 0.2s',
                            }}>
                              {agreed && <Check size={11} color="#fff" />}
                            </div>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: 'pointer' }}>
                            <span style={{ color: TEXT_SEC, fontSize: '12.5px', paddingRight: '12px', flex: 1 }}>
                              I would prefer not to receive marketing messages from Beato.
                            </span>
                            <div onClick={() => setMarketingOptOut(v => !v)} style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              border: `2px solid ${marketingOptOut ? PRIMARY : BORDER}`,
                              background: marketingOptOut ? PRIMARY : ELEVATED,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'all 0.2s',
                            }}>
                              {marketingOptOut && <Check size={11} color="#fff" />}
                            </div>
                          </label>

                          <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', cursor: 'pointer' }}>
                            <span style={{ color: TEXT_SEC, fontSize: '12.5px', paddingRight: '12px', flex: 1 }}>
                              Share my registration data with Beato's content providers for marketing purposes.
                            </span>
                            <div onClick={() => setShareDataOptOut(v => !v)} style={{
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              border: `2px solid ${shareDataOptOut ? PRIMARY : BORDER}`,
                              background: shareDataOptOut ? PRIMARY : ELEVATED,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                              transition: 'all 0.2s',
                            }}>
                              {shareDataOptOut && <Check size={11} color="#fff" />}
                            </div>
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button type="submit" disabled={isLoading || !agreed || !name} className="auth-btn-primary" style={{ marginTop: '32px', opacity: (isLoading || !agreed || !name) ? 0.55 : 1 }}>
                    {isLoading ? 'Creating Account...' : 'Create account'}
                  </button>
                </motion.form>
              )}

              {/* STEP 6: LANGUAGE SELECTION */}
              {step === 6 && (
                <motion.div
                  key="s6-lang"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '520px' }}
                >
                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '28px', fontWeight: 800, color: TEXT, marginBottom: '6px', letterSpacing: '-0.5px' }}>
                    What music do you like?
                  </h2>
                  <p style={{ color: TEXT_SEC, fontSize: '14px', marginBottom: '10px' }}>
                    Select your languages to customize your experience.
                  </p>

                  <div className="lang-grid">
                    {LANGUAGES.map((lang) => {
                      const isSelected = selectedLanguages.includes(lang.id);
                      return (
                        <div
                          key={lang.id}
                          className={`lang-card ${isSelected ? 'selected' : ''}`}
                          style={{ backgroundColor: lang.bg }}
                          onClick={() => {
                            setSelectedLanguages(prev =>
                              prev.includes(lang.id)
                                ? prev.filter(id => id !== lang.id)
                                : [...prev, lang.id]
                            );
                          }}
                        >
                          <h3 className="lang-card-title">{lang.label}</h3>
                          <img
                            src={lang.img}
                            alt={lang.artist}
                            className="lang-card-img"
                          />
                        </div>
                      );
                    })}
                  </div>

                  <button
                    onClick={() => setStep(7)}
                    className="auth-btn-primary"
                    style={{ marginTop: 'auto' }}
                  >
                    Next
                  </button>
                </motion.div>
              )}

              {/* STEP 7: ARTIST SELECTION */}
              {step === 7 && (
                <motion.div
                  key="s7-artists"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.2 }}
                  style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: '520px' }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', marginBottom: '16px', position: 'relative' }}>
                    <button type="button" onClick={() => setStep(6)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px', color: TEXT, display: 'flex', alignItems: 'center' }}>
                      <ArrowLeft size={20} />
                    </button>
                    <span style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)', fontFamily: 'Outfit, sans-serif', fontWeight: 'bold', fontSize: '15px', color: TEXT }}>
                      Choose Artists
                    </span>
                  </div>

                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '26px', fontWeight: 800, color: TEXT, marginBottom: '6px', letterSpacing: '-0.5px' }}>
                    Choose 1 or more artists you like.
                  </h2>

                  <div className="onboarding-search-container">
                    <input
                      type="text"
                      className="onboarding-search-input"
                      placeholder="Search"
                      value={artistSearch}
                      onChange={(e) => setArtistSearch(e.target.value)}
                    />
                    <Search className="onboarding-search-icon" size={18} />
                  </div>

                  {loadingArtists ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '200px' }}>
                      <div style={{ width: 28, height: 28, border: `3px solid ${PRIMARY}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
                    </div>
                  ) : (
                    <div className="artist-grid">
                      {(() => {
                        const filteredArtists = dbArtists.filter((artist) =>
                          artist.name.toLowerCase().includes(artistSearch.toLowerCase())
                        );
                        
                        return filteredArtists.map((artist) => {
                          const isSelected = selectedArtists.includes(artist.id);
                          return (
                            <div
                              key={artist.id}
                              className={`artist-item ${isSelected ? 'selected' : ''}`}
                              onClick={() => {
                                setSelectedArtists(prev =>
                                  prev.includes(artist.id)
                                    ? prev.filter(id => id !== artist.id)
                                    : [...prev, artist.id]
                                );
                              }}
                            >
                              <div className="artist-avatar-wrapper">
                                <img
                                  src={artist.img}
                                  alt={artist.name}
                                  className="artist-avatar"
                                />
                                {isSelected && (
                                  <div className="artist-checkmark-badge">
                                    <Check size={12} strokeWidth={3} />
                                  </div>
                                )}
                              </div>
                              <p className="artist-name">{artist.name}</p>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  )}

                  <button
                    onClick={handleFinishOnboarding}
                    disabled={selectedArtists.length < 1 || isLoading}
                    className="auth-btn-primary"
                    style={{
                      marginTop: 'auto',
                      opacity: selectedArtists.length >= 1 ? 1 : 0.55
                    }}
                  >
                    {isLoading ? 'Saving...' : `Next${selectedArtists.length > 0 ? ` (${selectedArtists.length})` : ''}`}
                  </button>
                </motion.div>
              )}

              {/* STEP 8: GREAT PICKS SCREEN */}
              {step === 8 && (
                <motion.div
                  key="s8-picks"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, minHeight: '400px' }}
                >
                  <div className="overlapping-avatars-container">
                    {(() => {
                      const chosenAvatars = selectedArtists
                        .map(id => dbArtists.find(a => a.id === id))
                        .filter(Boolean)
                        .slice(0, 3);
                      
                      return chosenAvatars.map((artist, idx) => {
                        const isCenter = idx === 1 || (chosenAvatars.length === 2 && idx === 0) || chosenAvatars.length === 1;
                        return (
                          <img
                            key={artist!.id}
                            src={artist!.img}
                            alt={artist!.name}
                            className={`overlapping-avatar ${isCenter ? 'center-avatar' : ''}`}
                          />
                        );
                      });
                    })()}
                  </div>

                  <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '32px', fontWeight: 800, color: TEXT, marginTop: '16px' }}>
                    Great picks!
                  </h2>
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>

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
