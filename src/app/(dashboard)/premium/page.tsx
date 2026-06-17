'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Crown, Zap, Users, BookOpen, Star, ChevronDown, ChevronUp } from 'lucide-react';
import Link from 'next/link';
import TopBar from '@/components/layout/TopBar';
import { subscriptionPlans } from '@/lib/mockData';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const faqs = [
  { q: 'What is included in Premium?', a: 'Premium includes ad-free listening, high quality audio up to 320kbps, offline downloads, unlimited skips, lyrics, crossfade, sleep timer, and AI-powered recommendations.' },
  { q: 'Can I cancel anytime?', a: 'Yes! You can cancel your subscription at any time. Your Premium benefits will remain active until the end of your current billing period.' },
  { q: 'How does Family Plan work?', a: 'Family Plan gives up to 6 people their own Premium accounts. Each person gets their own independent Beato account with separate playlists and listening history.' },
  { q: 'Is Student discount available?', a: 'Yes! Students with a valid university email can get 50% off Premium. Verification is done annually.' },
  { q: 'What payment methods are accepted?', a: 'We accept all major credit cards, debit cards, PayPal, UPI, and net banking through Stripe and Razorpay.' },
];

const planConfigs: Record<string, {
  color: string;
  badgeText?: string;
}> = {
  free: {
    color: '#94a3b8',
  },
  premium: {
    color: '#b08850',
    badgeText: 'Most Popular',
  },
  family: {
    color: '#10b981',
    badgeText: 'Best Value',
  },
  student: {
    color: '#10b981',
    badgeText: 'Student Deal',
  },
  creator: {
    color: '#f59e0b',
    badgeText: 'For Artists',
  },
};

export default function PremiumPage() {
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('monthly');
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { user } = useAuthStore();
  const [plans, setPlans] = useState(subscriptionPlans);
  const [symbol, setSymbol] = useState('$');

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

  const planIcons: Record<string, React.ReactNode> = {
    free: <Star size={22} />,
    premium: <Crown size={22} />,
    family: <Users size={22} />,
    student: <BookOpen size={22} />,
    creator: <Zap size={22} />,
  };

  return (
    <div className="premium-themed-container" style={{ display: 'flex', flexDirection: 'column', width: '100%', minHeight: '100%', paddingBottom: '64px', background: 'var(--color-ss-bg, #fbf9f5)' }}>
      <style>{`
        .premium-themed-container h1,
        .premium-themed-container h2,
        .premium-themed-container h3,
        .premium-themed-container h4,
        .premium-themed-container p,
        .premium-themed-container span,
        .premium-themed-container label {
          color: var(--color-ss-text-primary, #221a15) !important;
          text-shadow: none !important;
        }
        .premium-themed-container div[style*="background: linear-gradient(180deg"],
        .premium-themed-container div[style*="rgba(255,255,255,0.02)"],
        .premium-themed-container div[style*="rgba(255,255,255,0.03)"],
        .premium-themed-container div[style*="rgba(255, 255, 255, 0.02)"],
        .premium-themed-container div[style*="rgba(255, 255, 255, 0.03)"] {
          background: var(--color-ss-elevated, #ffffff) !important;
          border-color: var(--color-ss-border, rgba(43,34,26,0.08)) !important;
          box-shadow: 0 10px 30px rgba(43, 34, 26, 0.04) !important;
        }
        .premium-themed-container button:not(.text-white-force) {
          color: var(--color-ss-text-primary, #221a15) !important;
        }
        /* Style billing toggle knob */
        .premium-themed-container div[style*="width: 56px"] {
          background: var(--color-ss-surface, #f4eede) !important;
          border-color: var(--color-ss-border, rgba(43,34,26,0.08)) !important;
        }
        /* Style billing yearly discount tag */
        .premium-themed-container button span[style*="background-color: #b08850"] {
          color: #000 !important;
        }
        /* Plan card features list items */
        .premium-themed-container svg {
          color: var(--color-ss-text-primary, #221a15) !important;
        }
        /* Keep checkmark icons gold/green */
        .premium-themed-container svg[style*="color: rgb(16, 185, 129)"],
        .premium-themed-container svg[style*="color: #10b981"] {
          color: #10b981 !important;
        }
        .premium-themed-container svg[style*="color: rgb(176, 136, 80)"],
        .premium-themed-container svg[style*="color: #b08850"] {
          color: #b08850 !important;
        }
        /* Plan card headers features */
        .premium-themed-container div[style*="background-color: rgba(176, 136, 80"] {
          background-color: rgba(176, 136, 80, 0.1) !important;
        }
        /* Style standard plan button */
        .premium-themed-container button[style*="background-color: rgba(255, 255, 255, 0.08)"],
        .premium-themed-container button[style*="background-color: rgba(255,255,255,0.08)"] {
          background-color: rgba(43, 34, 26, 0.08) !important;
          color: var(--color-ss-text-primary, #221a15) !important;
          border: none !important;
        }
        /* Style current plan button */
        .premium-themed-container button[style*="background-color: rgba(255, 255, 255, 0.06)"],
        .premium-themed-container button[style*="background-color: rgba(255,255,255,0.06)"] {
          background-color: rgba(43, 34, 26, 0.04) !important;
          color: rgba(43, 34, 26, 0.35) !important;
          border: none !important;
        }
      `}</style>
      <TopBar />

      {/* Main Content Layout with explicit vertical flow flexbox */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '64px', width: '100%', padding: '0 24px 32px' }}>
        
        {/* Hero Section */}
        <div style={{ position: 'relative', overflow: 'hidden', borderRadius: '24px', padding: '64px 24px', textAlign: 'center', background: 'radial-gradient(circle at top, rgba(176, 136, 80, 0.15) 0%, transparent 70%)' }}>
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '6px 16px', borderRadius: '100px', backgroundColor: 'rgba(176, 136, 80,0.12)', border: '1px solid rgba(176, 136, 80,0.25)', marginBottom: '24px' }}>
              <Crown size={15} style={{ color: '#b08850' }} />
              <span style={{ color: '#b08850', fontWeight: 700, fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Beato Premium</span>
            </div>
            <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '48px', fontWeight: 950, color: '#fff', letterSpacing: '-0.02em', marginBottom: '16px', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              Music without limits
            </h1>
            <p style={{ color: '#a3a3a3', fontSize: '18px', maxWidth: '560px', margin: '0 auto', lineHeight: '1.5' }}>
              Listen to any song, skip as many times as you want, download for offline, and much more.
            </p>
          </motion.div>

          {/* Billing Switch Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', marginTop: '36px' }}>
            <button
              onClick={() => setBilling('monthly')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 700,
                color: billing === 'monthly' ? '#fff' : '#737373',
                transition: 'color 0.25s'
              }}
            >
              Monthly
            </button>
            
            <div 
              onClick={() => setBilling(prev => prev === 'monthly' ? 'yearly' : 'monthly')}
              style={{
                width: '56px',
                height: '28px',
                borderRadius: '100px',
                background: billing === 'yearly' ? 'rgba(176, 136, 80, 0.2)' : 'rgba(255, 255, 255, 0.08)',
                border: `1.5px solid ${billing === 'yearly' ? '#b08850' : 'rgba(255,255,255,0.1)'}`,
                position: 'relative',
                cursor: 'pointer',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                display: 'flex',
                alignItems: 'center',
                padding: '2px'
              }}
            >
              <div 
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: billing === 'yearly' ? '#b08850' : '#ffffff',
                  transform: billing === 'yearly' ? 'translateX(28px)' : 'translateX(0)',
                  transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.3s',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.4)'
                }}
              />
            </div>

            <button
              onClick={() => setBilling('yearly')}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: 700,
                color: billing === 'yearly' ? '#fff' : '#737373',
                transition: 'color 0.25s',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              Yearly
              <span style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '100px', backgroundColor: '#b08850', color: '#000', fontWeight: 850, textTransform: 'uppercase', letterSpacing: '0.05em' }}>-20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid Section */}
        <div style={{ width: '100%', margin: '0 auto', maxWidth: '1280px' }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {plans.map((plan, i) => {
              const isCurrentPlan = user?.subscription === plan.id;
              const price = billing === 'yearly' ? plan.price * 0.8 : plan.price;
              const config = planConfigs[plan.id] || planConfigs.free;

              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ y: -6 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: '24px',
                    padding: '24px',
                    background: `linear-gradient(180deg, ${config.color}15 0%, rgba(255,255,255,0.02) 100%)`,
                    border: `1.5px solid ${plan.highlighted ? config.color : 'rgba(255,255,255,0.07)'}`,
                    boxShadow: plan.highlighted ? `0 0 35px ${config.color}25` : '0 10px 30px rgba(0,0,0,0.6)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    position: 'relative',
                  }}
                >
                  {config.badgeText && (
                    <div 
                      style={{
                        position: 'absolute',
                        top: '-12px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        padding: '4px 14px',
                        backgroundColor: config.color,
                        color: plan.id === 'premium' ? '#000' : '#fff',
                        borderRadius: '100px',
                        fontSize: '10.5px',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.08em',
                        whiteSpace: 'nowrap',
                        boxShadow: `0 4px 12px ${config.color}35`,
                      }}
                    >
                      {config.badgeText}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '20px' }}>
                    <div
                      style={{
                        width: '46px',
                        height: '46px',
                        borderRadius: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        backgroundColor: `${config.color}18`,
                        color: config.color,
                        border: `1px solid ${config.color}30`,
                        boxShadow: `0 4px 10px ${config.color}12`,
                      }}
                    >
                      {planIcons[plan.id]}
                    </div>
                    <h3 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '19px', fontWeight: 800, color: '#fff', margin: 0 }}>
                      {plan.name}
                    </h3>
                  </div>

                  <div style={{ marginBottom: '20px' }}>
                    {plan.price === 0 ? (
                      <span style={{ fontSize: '32px', fontWeight: 900, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>Free</span>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'baseline' }}>
                        <span style={{ fontSize: '32px', fontWeight: 950, color: '#fff', fontFamily: 'Outfit, sans-serif', letterSpacing: '-0.02em' }}>
                          {symbol}{price.toFixed(2)}
                        </span>
                        <span style={{ color: '#737373', fontSize: '13px', fontWeight: 650, marginLeft: '2px' }}>
                          /{billing === 'yearly' ? 'mo' : 'mo'}
                        </span>
                      </div>
                    )}
                    {billing === 'yearly' && plan.price > 0 && (
                      <span style={{ color: config.color, fontSize: '11px', fontWeight: 600, display: 'block', marginTop: '4px' }}>
                        Billed annually
                      </span>
                    )}
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 28px 0', display: 'flex', flexDirection: 'column', gap: '11px', flex: 1 }}>
                    {plan.features.map((feature) => (
                      <li key={feature} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13px', lineHeight: '1.4' }}>
                        <Check size={14} style={{ color: config.color, marginTop: '2.5px', flexShrink: 0 }} />
                        <span style={{ color: '#a3a3a3' }}>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    disabled={isCurrentPlan}
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      borderRadius: '14px',
                      fontWeight: 750,
                      fontSize: '13px',
                      border: 'none',
                      cursor: isCurrentPlan ? 'default' : 'pointer',
                      transition: 'all 0.2s ease',
                      backgroundColor: isCurrentPlan 
                        ? 'rgba(255,255,255,0.06)' 
                        : plan.highlighted 
                          ? config.color 
                          : 'rgba(255,255,255,0.08)',
                      color: isCurrentPlan 
                        ? 'rgba(255,255,255,0.35)' 
                        : plan.highlighted && plan.id === 'premium'
                          ? '#000' 
                          : '#fff',
                      boxShadow: (!isCurrentPlan && plan.highlighted) 
                        ? `0 4px 15px ${config.color}35` 
                        : 'none',
                    }}
                    onMouseEnter={e => {
                      if (!isCurrentPlan) {
                        e.currentTarget.style.transform = 'scale(1.02)';
                        e.currentTarget.style.backgroundColor = plan.highlighted ? config.color : 'rgba(255,255,255,0.15)';
                        if (plan.highlighted) {
                          e.currentTarget.style.boxShadow = `0 6px 20px ${config.color}50`;
                        }
                      }
                    }}
                    onMouseLeave={e => {
                      if (!isCurrentPlan) {
                        e.currentTarget.style.transform = 'scale(1)';
                        e.currentTarget.style.backgroundColor = plan.highlighted ? config.color : 'rgba(255,255,255,0.08)';
                        e.currentTarget.style.boxShadow = plan.highlighted ? `0 4px 15px ${config.color}35` : 'none';
                      }
                    }}
                  >
                    {isCurrentPlan ? 'Current Plan' : plan.price === 0 ? 'Get Started' : 'Subscribe'}
                  </button>
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Features comparison */}
        <div style={{ maxWidth: '960px', margin: '0 auto', width: '100%' }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '32px', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: '40px' }}>
            What you get
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
            {[
              { icon: '🎵', title: '100M+ Songs', desc: 'Access the full Beato catalog' },
              { icon: '🎧', title: 'Lossless Audio', desc: 'Up to 320kbps on Premium' },
              { icon: '📥', title: 'Offline Downloads', desc: 'Save up to 10,000 tracks' },
              { icon: '🤖', title: 'AI Recommendations', desc: 'Personalized playlists & Discover Weekly' },
              { icon: '📺', title: 'Real-time Lyrics', desc: 'Follow along word by word' },
              { icon: '🚫', title: 'Ad-Free', desc: 'No interruptions, ever' },
              { icon: '⏭️', title: 'Unlimited Skips', desc: 'Skip as many times as you want' },
              { icon: '🎤', title: 'Podcasts & Audiobooks', desc: 'All in one app' },
            ].map((item, i) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  padding: '20px',
                  background: 'rgba(255,255,255,0.03)',
                  borderRadius: '16px',
                  border: '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)';
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <span style={{ fontSize: '28px' }}>{item.icon}</span>
                <div>
                  <p style={{ color: '#fff', fontWeight: 700, fontSize: '15px', margin: 0 }}>{item.title}</p>
                  <p style={{ color: '#737373', fontSize: '13px', margin: '4px 0 0 0', lineHeight: '1.4' }}>{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* FAQs */}
        <div style={{ maxWidth: '720px', margin: '0 auto', width: '100%' }}>
          <h2 style={{ fontFamily: 'Outfit, sans-serif', fontSize: '32px', fontWeight: 900, color: '#fff', textAlign: 'center', marginBottom: '32px' }}>
            Frequently Asked Questions
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {faqs.map((faq, i) => (
              <div 
                key={i} 
                style={{ 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '16px', 
                  border: '1px solid rgba(255,255,255,0.06)', 
                  overflow: 'hidden',
                  transition: 'all 0.2s ease'
                }}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '18px 24px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    cursor: 'pointer',
                    color: '#fff',
                    outline: 'none',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'none';
                  }}
                >
                  <span style={{ fontWeight: 650, fontSize: '15px', color: '#fff' }}>{faq.q}</span>
                  {openFaq === i ? (
                    <ChevronUp size={16} style={{ color: '#a3a3a3' }} />
                  ) : (
                    <ChevronDown size={16} style={{ color: '#a3a3a3' }} />
                  )}
                </button>
                
                <AnimatePresence initial={false}>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div style={{ padding: '0 24px 18px 24px', color: '#a3a3a3', fontSize: '14px', lineHeight: '1.6' }}>
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
