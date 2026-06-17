'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Music2, Play, Pause, Headphones, Radio, Download, Zap, Shield,
  Globe, Star, ChevronRight, Check, Mic2, TrendingUp, Heart, Users, Award
} from 'lucide-react';
import Link from 'next/link';
import { subscriptionPlans } from '@/lib/mockData';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

const stats = [
  { label: 'Songs', value: '100M+', icon: Music2 },
  { label: 'Active Users', value: '2.4M', icon: Users },
  { label: 'Artists', value: '18K+', icon: Mic2 },
  { label: 'Countries', value: '180+', icon: Globe },
];

const features = [
  { icon: Headphones, title: 'Lossless Audio', desc: 'Experience music in stunning 320kbps quality with our premium tier.', color: '#b08850', bg: 'rgba(176, 136, 80,0.1)' },
  { icon: Radio, title: 'AI Radio', desc: 'Let our AI create the perfect playlist based on your mood and taste.', color: '#10b981', bg: 'rgba(16, 185, 129,0.1)' },
  { icon: Download, title: 'Offline Mode', desc: 'Download up to 10,000 songs and listen anywhere, without internet.', color: '#34d399', bg: 'rgba(52, 211, 153,0.1)' },
  { icon: Mic2, title: 'Live Lyrics', desc: 'Follow along with synchronized, word-by-word lyrics in real-time.', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' },
  { icon: Globe, title: 'Global Library', desc: 'Discover music from every corner of the world in 100+ languages.', color: '#06b6d4', bg: 'rgba(6,182,212,0.1)' },
  { icon: Shield, title: 'Privacy First', desc: 'Your listening data stays yours. Full control, full transparency.', color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
];

const testimonials = [
  { name: 'Arjun K.', text: "Beato's AI recommendations are insane. Found 20 new artists I love in a week!", initials: 'AK', color: '#b08850', role: 'Music Enthusiast' },
  { name: 'Priya M.', text: 'The sound quality is unmatched. Worth every penny of the premium plan.', initials: 'PM', color: '#10b981', role: 'Premium User' },
  { name: 'Carlos R.', text: 'As an artist, the dashboard gives me insights I never had before. Game changer.', initials: 'CR', color: '#34d399', role: 'Independent Artist' },
];

// Animated waveform bars
const WaveformVisual = () => (
  <div className="flex items-end gap-1 h-16">
    {[40, 70, 55, 85, 60, 95, 50, 75, 45, 80, 65, 90, 55, 70, 40].map((h, i) => (
      <div
        key={i}
        className="flex-1 rounded-full"
        style={{
          height: `${h}%`,
          background: `linear-gradient(to top, #b08850, #10b981)`,
          animation: `waveform ${0.8 + (i % 4) * 0.2}s ease-in-out infinite alternate`,
          animationDelay: `${i * 0.1}s`,
          opacity: 0.7 + (i % 3) * 0.1,
        }}
      />
    ))}
  </div>
);

// Vinyl record component
const VinylRecord = ({ rotating }: { rotating: boolean }) => (
  <div
    className="relative w-64 h-64 rounded-full"
    style={{
      background: 'conic-gradient(from 0deg, #1a1a1a, #2a2a2a, #1a1a1a, #333, #1a1a1a)',
      boxShadow: '0 0 40px rgba(176, 136, 80,0.3), 0 0 80px rgba(176, 136, 80,0.1)',
      animation: rotating ? 'spin 4s linear infinite' : 'none',
    }}
  >
    {/* Grooves */}
    {[60, 80, 100, 120].map(r => (
      <div key={r} className="absolute rounded-full border border-white/5"
        style={{ inset: `${(256-r)/2}px` }} />
    ))}
    {/* Center label */}
    <div className="absolute inset-0 m-auto w-20 h-20 rounded-full flex items-center justify-center"
      style={{ background: 'linear-gradient(135deg, #b08850, #0d7a35)' }}>
      <Music2 size={28} color="black" />
    </div>
    {/* Center hole */}
    <div className="absolute inset-0 m-auto w-4 h-4 rounded-full bg-black" />
  </div>
);

// Mini music card
const NowPlayingCard = ({ song, artist, color }: { song: string; artist: string; color: string }) => (
  <div className="flex items-center gap-3 px-4 py-3 rounded-2xl border border-white/10"
    style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(12px)' }}>
    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: `${color}30` }}>
      <Music2 size={18} style={{ color }} />
    </div>
    <div className="min-w-0">
      <p className="text-white text-sm font-semibold truncate">{song}</p>
      <p className="text-xs truncate" style={{ color: '#a3a3a3' }}>{artist}</p>
    </div>
    <div className="ml-auto flex-shrink-0">
      <div className="flex items-end gap-0.5 h-4">
        {[3, 5, 4, 6, 3].map((h, i) => (
          <div key={i} className="w-0.5 rounded-full" style={{
            height: `${h * 3}px`, background: color,
            animation: `waveform 0.6s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.1}s`,
          }} />
        ))}
      </div>
    </div>
  </div>
);

export default function LandingPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isPlaying, setIsPlaying] = useState(true);

  useEffect(() => {
    // Client-side authentication and mobile device redirect
    if (user) {
      router.push('/home');
      return;
    }

    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent || '' : '';
    const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
    const isCapacitor = typeof window !== 'undefined' && (window as any).Capacitor;

    if (isMobileDevice || isCapacitor) {
      router.push('/login');
    }
  }, [user, router]);
  const [activeCard, setActiveCard] = useState(0);
  const [plans, setPlans] = useState(subscriptionPlans);

  const [symbol, setSymbol] = useState('$');

  const songs = [
    { song: 'Midnight Cascade', artist: 'Aurora Nightfall', color: '#b08850' },
    { song: 'Binary Pulse', artist: 'Cipher Nova', color: '#10b981' },
    { song: 'Solar Flare', artist: 'Selene Ray', color: '#34d399' },
  ];

  useEffect(() => {
    const t = setInterval(() => setActiveCard(c => (c + 1) % songs.length), 2500);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    fetch('/api/plans')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.prices) {
          if (data.symbol) setSymbol(data.symbol);
          setPlans(prev => prev.map(p => ({
            ...p,
            price: data.prices[p.id] !== undefined ? data.prices[p.id] : p.price
          })));
        }
      })
      .catch(err => console.error('Failed to fetch plan prices:', err));
  }, []);

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', color: '#fff', overflowX: 'hidden' }}>
      <style>{`
        /* Responsive utilities for Landing Page */
        .landing-nav-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 24px;
          height: 64px;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .landing-nav-links {
          display: flex;
          align-items: center;
          gap: 32px;
        }
        .landing-hero-grid {
          max-width: 1200px;
          margin: 0 auto;
          padding: 60px 24px;
          width: 100%;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 60px;
          align-items: center;
        }
        .landing-hero-title {
          font-family: 'Outfit', sans-serif;
          font-size: 72px;
          font-weight: 900;
          line-height: 1.05;
          margin-bottom: 24px;
          letter-spacing: -2px;
        }
        .landing-hero-desc {
          color: #a3a3a3;
          font-size: 18px;
          line-height: 1.7;
          margin-bottom: 36px;
          max-width: 480px;
        }
        .landing-features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .landing-artist-grid {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          align-items: center;
        }
        .landing-pricing-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .landing-testimonials-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
        }
        .landing-footer-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 40px;
          margin-bottom: 48px;
        }
        
        /* Mobile Overrides */
        @media (max-width: 768px) {
          .landing-nav-links {
            display: none !important;
          }
          .landing-hero-grid {
            grid-template-columns: 1fr !important;
            gap: 40px !important;
            padding: 40px 20px !important;
            text-align: center !important;
          }
          .landing-hero-title {
            font-size: 44px !important;
            line-height: 1.15 !important;
          }
          .landing-hero-desc {
            margin: 0 auto 24px !important;
            font-size: 16px !important;
          }
          .landing-hero-buttons {
            justify-content: center !important;
          }
          .landing-hero-stats {
            justify-content: center !important;
            gap: 20px !important;
          }
          .landing-features-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .landing-artist-grid {
            grid-template-columns: 1fr !important;
            gap: 32px !important;
          }
          .landing-pricing-grid {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .landing-testimonials-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
          .landing-footer-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 30px !important;
          }
        }
        @media (max-width: 480px) {
          .landing-footer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* ─── NAV ─── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div className="landing-nav-container">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #b08850, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Music2 size={18} color="black" />
            </div>
            <span style={{ fontFamily: 'Outfit, sans-serif', fontWeight: 800, fontSize: 20, color: '#fff' }}>Beato</span>
          </Link>

          <div className="landing-nav-links">
            {['Premium', 'Artists', 'Features'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`}
                style={{ color: '#a3a3a3', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                onMouseLeave={e => (e.currentTarget.style.color = '#a3a3a3')}>
                {item}
              </a>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/login" style={{ color: 'rgba(255,255,255,0.8)', fontSize: 14, fontWeight: 500, textDecoration: 'none' }}>Log in</Link>
            <Link href="/register">
              <button style={{
                padding: '10px 24px', borderRadius: 100, background: '#b08850',
                color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', border: 'none',
                boxShadow: '0 0 20px rgba(176, 136, 80,0.3)', transition: 'background 0.2s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = '#34d399')}
                onMouseLeave={e => (e.currentTarget.style.background = '#b08850')}>
                Sign up free
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ position: 'relative', minHeight: 'calc(100vh - 64px)', display: 'flex', alignItems: 'center', overflow: 'hidden' }}>
        {/* Background blobs */}
        <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
          <div style={{ position: 'absolute', top: -100, right: -100, width: 700, height: 700, borderRadius: '50%', background: 'rgba(176, 136, 80,0.06)', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', bottom: -100, left: -100, width: 600, height: 600, borderRadius: '50%', background: 'rgba(16, 185, 129,0.06)', filter: 'blur(80px)' }} />
          <div style={{ position: 'absolute', top: '40%', left: '40%', width: 400, height: 400, borderRadius: '50%', background: 'rgba(52, 211, 153,0.04)', filter: 'blur(60px)' }} />
        </div>

        <div className="landing-hero-grid">

          {/* Left: Text */}
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', borderRadius: 100, background: 'rgba(176, 136, 80,0.12)', border: '1px solid rgba(176, 136, 80,0.25)', marginBottom: 24 }}>
              <Zap size={14} color="#b08850" />
              <span style={{ color: '#b08850', fontSize: 13, fontWeight: 600 }}>AI-Powered Music Experience</span>
            </div>

            <h1 className="landing-hero-title">
              Your{' '}
              <span style={{ background: 'linear-gradient(135deg, #b08850, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Universe
              </span>
              <br />
              of Sound
            </h1>

            <p className="landing-hero-desc">
              Stream 100 million songs, discover artists with AI-powered recommendations, and experience lossless audio — all in one place.
            </p>

            <div className="landing-hero-buttons" style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 40 }}>
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  style={{
                    padding: '16px 36px', borderRadius: 100, background: '#b08850', color: '#000',
                    fontWeight: 800, fontSize: 16, cursor: 'pointer', border: 'none', display: 'flex',
                    alignItems: 'center', gap: 8, boxShadow: '0 0 30px rgba(176, 136, 80,0.4)',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                  Get Started Free <ChevronRight size={18} />
                </motion.button>
              </Link>
              <Link href="/home">
                <motion.button
                  whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                  style={{
                    padding: '16px 36px', borderRadius: 100, background: 'rgba(255,255,255,0.1)',
                    color: '#fff', fontWeight: 700, fontSize: 16, cursor: 'pointer',
                    border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', gap: 8,
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                  <Play size={18} fill="white" /> Explore App
                </motion.button>
              </Link>
            </div>

            {/* Stats row */}
            <div className="landing-hero-stats" style={{ display: 'flex', gap: 32 }}>
              {stats.map((s, i) => (
                <div key={s.label}>
                  <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900, color: '#b08850', lineHeight: 1 }}>{s.value}</p>
                  <p style={{ color: '#525252', fontSize: 12, marginTop: 2 }}>{s.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: Visual */}
          <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7, delay: 0.2 }}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>

            {/* Vinyl */}
            <div style={{ position: 'relative' }}>
              <VinylRecord rotating={isPlaying} />

              {/* Floating badge - now playing */}
              <motion.div
                animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}
                style={{
                  position: 'absolute', top: -20, right: -30,
                  background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
                  padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#b08850', animation: 'pulse 1.5s ease-in-out infinite' }} />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Now Playing</span>
              </motion.div>

              {/* Floating badge - listeners */}
              <motion.div
                animate={{ y: [0, 6, 0] }} transition={{ duration: 2.5, repeat: Infinity }}
                style={{
                  position: 'absolute', bottom: -16, left: -24,
                  background: 'rgba(16, 185, 129,0.15)', backdropFilter: 'blur(12px)',
                  border: '1px solid rgba(16, 185, 129,0.3)', borderRadius: 16,
                  padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 8,
                }}>
                <Headphones size={14} color="#10b981" />
                <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>1.2M Listening</span>
              </motion.div>

              {/* Play/Pause button */}
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                style={{
                  position: 'absolute', inset: 0, margin: 'auto',
                  width: 52, height: 52, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.2s', zIndex: 10,
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(176, 136, 80,0.3)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'rgba(0,0,0,0.6)')}>
                {isPlaying ? <Pause size={20} fill="white" color="white" /> : <Play size={20} fill="white" color="white" className="translate-x-0.5" />}
              </button>
            </div>

            {/* Waveform + Now playing cards */}
            <div style={{ width: '100%', maxWidth: 340, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{
                borderRadius: 16, padding: '16px 20px',
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                <p style={{ fontSize: 11, color: '#525252', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>Live Waveform</p>
                <WaveformVisual />
              </div>

              <AnimatePresence mode="wait">
                <motion.div key={activeCard}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}>
                  <NowPlayingCard {...songs[activeCard]} />
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section id="features" style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 56, fontWeight: 900, marginBottom: 16, letterSpacing: '-1px' }}>
              Everything music.{' '}
              <span style={{ background: 'linear-gradient(135deg, #b08850, #10b981)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Nothing less.
              </span>
            </h2>
            <p style={{ color: '#a3a3a3', fontSize: 18, maxWidth: 500, margin: '0 auto' }}>Built for music lovers, powered by AI, designed for the future.</p>
          </motion.div>

          <div className="landing-features-grid">
            {features.map((f, i) => (
              <motion.div key={f.title}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                style={{
                  padding: 28, borderRadius: 20,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  cursor: 'default', transition: 'border-color 0.2s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = `${f.color}40`)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: f.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
                  <f.icon size={24} color={f.color} />
                </div>
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 20, fontWeight: 700, marginBottom: 10, color: '#fff' }}>{f.title}</h3>
                <p style={{ color: '#737373', fontSize: 14, lineHeight: 1.65 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── APP PREVIEW BANNER ─── */}
      <section style={{ padding: '0 24px 100px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div style={{
            borderRadius: 28, padding: '60px 64px', position: 'relative', overflow: 'hidden',
            background: 'linear-gradient(135deg, rgba(176, 136, 80,0.15) 0%, rgba(16, 185, 129,0.15) 100%)',
            border: '1px solid rgba(176, 136, 80,0.2)',
          }}>
            <div style={{ position: 'absolute', top: -60, right: -60, width: 300, height: 300, borderRadius: '50%', background: 'rgba(176, 136, 80,0.1)', filter: 'blur(60px)' }} />
            <div className="landing-artist-grid">
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(176, 136, 80,0.15)', border: '1px solid rgba(176, 136, 80,0.3)', borderRadius: 100, padding: '6px 14px', marginBottom: 20 }}>
                  <Award size={14} color="#b08850" />
                  <span style={{ color: '#b08850', fontSize: 12, fontWeight: 600 }}>ARTIST PLATFORM</span>
                </div>
                <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 44, fontWeight: 900, marginBottom: 16, letterSpacing: '-0.5px' }}>
                  Built for artists.<br />
                  <span style={{ color: '#b08850' }}>Made to grow.</span>
                </h2>
                <p style={{ color: '#a3a3a3', fontSize: 16, lineHeight: 1.7, marginBottom: 32 }}>
                  Upload your music, track analytics, connect with fans, and monetize your art — all from one powerful dashboard.
                </p>
                <Link href="/register">
                  <button style={{
                    padding: '14px 32px', borderRadius: 100, background: '#b08850', color: '#000',
                    fontWeight: 700, fontSize: 15, cursor: 'pointer', border: 'none',
                    fontFamily: 'Outfit, sans-serif',
                  }}>
                    Join as Artist
                  </button>
                </Link>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { label: 'Monthly Streams', value: '2.4M', change: '+18%', color: '#b08850' },
                  { label: 'New Followers', value: '12.8K', change: '+32%', color: '#10b981' },
                  { label: 'Revenue', value: '$4,280', change: '+24%', color: '#34d399' },
                ].map(metric => (
                  <div key={metric.label} style={{
                    padding: '16px 20px', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    <div>
                      <p style={{ color: '#737373', fontSize: 12 }}>{metric.label}</p>
                      <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>{metric.value}</p>
                    </div>
                    <div style={{ background: `${metric.color}20`, borderRadius: 100, padding: '4px 12px' }}>
                      <span style={{ color: metric.color, fontSize: 13, fontWeight: 700 }}>{metric.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING ─── */}
      <section id="premium" style={{ padding: '100px 24px', background: 'rgba(0,0,0,0.3)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 60 }}>
            <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 56, fontWeight: 900, marginBottom: 12, letterSpacing: '-1px' }}>Simple pricing</h2>
            <p style={{ color: '#a3a3a3', fontSize: 18 }}>Start free. Upgrade when you&apos;re ready.</p>
          </motion.div>

          <div className="landing-pricing-grid">
            {plans.slice(0, 3).map((plan, i) => (
              <motion.div key={plan.id}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{
                  padding: 32, borderRadius: 24, display: 'flex', flexDirection: 'column',
                  background: plan.highlighted ? 'rgba(176, 136, 80,0.08)' : 'rgba(255,255,255,0.04)',
                  border: plan.highlighted ? '1px solid rgba(176, 136, 80,0.4)' : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: plan.highlighted ? '0 0 40px rgba(176, 136, 80,0.15)' : 'none',
                  position: 'relative',
                }}>
                {plan.highlighted && (
                  <div style={{
                    position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                    background: '#b08850', color: '#000', borderRadius: 100, padding: '4px 16px',
                    fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
                  }}>Most Popular</div>
                )}
                <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 26, fontWeight: 800, marginBottom: 8, color: '#fff' }}>{plan.name}</h3>
                <div style={{ marginBottom: 28 }}>
                  {plan.price === 0
                    ? <span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 44, fontWeight: 900, color: '#fff' }}>Free</span>
                    : <><span style={{ fontFamily: 'Outfit, sans-serif', fontSize: 44, fontWeight: 900, color: '#fff' }}>{symbol}{plan.price}</span><span style={{ color: '#737373' }}>/mo</span></>}
                </div>
                <ul style={{ listStyle: 'none', flex: 1, marginBottom: 28, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plan.features.slice(0, 5).map(f => (
                    <li key={f} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                      <Check size={15} color="#b08850" style={{ flexShrink: 0, marginTop: 1 }} />
                      <span style={{ color: '#a3a3a3', fontSize: 14 }}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/register">
                  <button style={{
                    width: '100%', padding: '14px', borderRadius: 14,
                    background: plan.highlighted ? '#b08850' : 'rgba(255,255,255,0.1)',
                    color: plan.highlighted ? '#000' : '#fff',
                    fontWeight: 700, fontSize: 15, cursor: 'pointer', border: 'none',
                    fontFamily: 'Outfit, sans-serif', transition: 'opacity 0.2s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.opacity = '0.85')}
                    onMouseLeave={e => (e.currentTarget.style.opacity = '1')}>
                    {plan.price === 0 ? 'Get Started Free' : 'Subscribe Now'}
                  </button>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS ─── */}
      <section style={{ padding: '100px 24px' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 56, fontWeight: 900, textAlign: 'center', marginBottom: 60, letterSpacing: '-1px' }}>
            Loved by millions
          </h2>
          <div className="landing-testimonials-grid">
            {testimonials.map((t, i) => (
              <motion.div key={t.name}
                initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                style={{ padding: 28, borderRadius: 20, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                <div style={{ display: 'flex', gap: 3, marginBottom: 16 }}>
                  {[...Array(5)].map((_, j) => <Star key={j} size={16} color="#facc15" fill="#facc15" />)}
                </div>
                <p style={{ color: '#a3a3a3', fontSize: 15, lineHeight: 1.7, marginBottom: 20 }}>"{t.text}"</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: '50%', background: `${t.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    border: `2px solid ${t.color}50`,
                    flexShrink: 0,
                  }}>
                    <span style={{ color: t.color, fontSize: 14, fontWeight: 700 }}>{t.initials}</span>
                  </div>
                  <div>
                    <p style={{ color: '#fff', fontWeight: 600, fontSize: 14 }}>{t.name}</p>
                    <p style={{ color: '#525252', fontSize: 12 }}>{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: '0 24px 100px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}
            style={{
              borderRadius: 32, padding: '80px 60px', textAlign: 'center', position: 'relative', overflow: 'hidden',
              background: 'linear-gradient(135deg, #b08850 0%, #16a34a 30%, #10b981 70%, #34d399 100%)',
            }}>
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.15)' }} />
            <div style={{ position: 'relative' }}>
              <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 54, fontWeight: 900, color: '#fff', marginBottom: 16, letterSpacing: '-1px' }}>
                Start listening today
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: 18, marginBottom: 36 }}>
                Free forever. Premium when you&apos;re ready.
              </p>
              <Link href="/register">
                <motion.button
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  style={{
                    padding: '18px 52px', borderRadius: 100, background: '#fff', color: '#000',
                    fontWeight: 900, fontSize: 17, cursor: 'pointer', border: 'none',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3)', fontFamily: 'Outfit, sans-serif',
                  }}>
                  Create Free Account
                </motion.button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '60px 24px 40px' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          <div className="landing-footer-grid">
            {[
              { title: 'Company', links: ['About', 'Jobs', 'Press', 'Blog'] },
              { title: 'Communities', links: ['Artists', 'Developers', 'Investors', 'Vendors'] },
              { title: 'Useful Links', links: ['Support', 'Web Player', 'Free Mobile App', 'Accessibility'] },
              { title: 'Legal', links: ['Privacy', 'Terms', 'Cookie Policy', 'Imprint'] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ color: '#fff', fontWeight: 700, fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 18 }}>{col.title}</h4>
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {col.links.map(link => (
                    <li key={link}><a href="#" style={{ color: '#737373', fontSize: 14, textDecoration: 'none', transition: 'color 0.2s' }}
                      onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
                      onMouseLeave={e => (e.currentTarget.style.color = '#737373')}>{link}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg, #b08850, #10b981)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Music2 size={14} color="black" />
              </div>
              <span style={{ color: '#fff', fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>Beato</span>
            </div>
            <p style={{ color: '#525252', fontSize: 13 }}>© 2026 Beato. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
