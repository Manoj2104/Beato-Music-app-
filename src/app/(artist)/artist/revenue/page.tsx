'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { 
  DollarSign, TrendingUp, Download, ShieldCheck, 
  HelpCircle, CreditCard, AlertTriangle, ArrowUpRight, 
  Clock, CheckCircle, AlertCircle, Plus, Send, 
  Check, FileText, ChevronRight, RefreshCw, Info, Lock
} from 'lucide-react';

const COLORS = {
  bg: '#0a0a0a',
  card: 'rgba(18, 18, 18, 0.7)',
  card2: '#161616',
  cardHover: 'rgba(30, 30, 30, 0.85)',
  border: 'rgba(255, 255, 255, 0.08)',
  borderActive: 'rgba(29, 185, 84, 0.3)',
  green: '#1db954',
  text: '#ffffff',
  muted: '#a0a0a0',
  yellow: '#eab308',
  blue: '#10b981',
  red: '#ef4444',
  orange: '#f97316',
  purple: '#10b981',
  pink: '#34d399',
};

const fontOutfit = "'Outfit', sans-serif";
const fontInter = "'Inter', sans-serif";

interface PayoutArtist {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  lifetimeEarnings: number;
  availableBalance: number;
  pendingBalance: number;
  estimatedNextPayout: number;
  fraudScore: number;
  kycStatus: 'pending' | 'verified' | 'unverified';
  taxVerified: boolean;
  paymentMethod?: {
    type: 'bank' | 'paypal' | 'stripe' | 'wise' | 'payoneer';
    emailOrAccount: string;
    routingOrCode?: string;
    verified: boolean;
  };
}

interface TrackRevenueItem {
  title: string;
  streams: number;
  streaming: number;
  downloads: number;
  total: number;
}

interface MonthlyEarningsItem {
  month: string;
  streaming: number;
  downloads: number;
  sync: number;
  total: number;
}

interface WithdrawalRequest {
  id: string;
  amount: number;
  method: string;
  status: 'pending' | 'review' | 'approved' | 'processing' | 'completed' | 'failed' | 'held';
  created: string;
  updated: string;
  fraudScore: number;
  riskLevel: string;
  details?: Record<string, string>;
}

interface Dispute {
  id: string;
  issue: string;
  evidence: string;
  status: 'open' | 'investigating' | 'resolved' | 'rejected';
  created: string;
}

interface TaxDoc {
  id?: string;
  year: string;
  type: string;
  status: string;
}

export default function RevenuePage() {
  const { user } = useAuthStore();
  
  const [data, setData] = useState<{
    artist: PayoutArtist;
    withdrawals: WithdrawalRequest[];
    disputes: Dispute[];
    taxDocs: TaxDoc[];
    trackRevenues: TrackRevenueItem[];
    monthlyEarnings: MonthlyEarningsItem[];
    subscription: string;
    currency: string;
  } | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Modals / Triggers
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New Withdrawal input
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'paypal' | 'stripe' | 'wise' | 'payoneer'>('bank');
  const [accountDetail, setAccountDetail] = useState('');
  const [routingDetail, setRoutingDetail] = useState('');

  // Payment update inputs
  const [activeSettingsTab, setActiveSettingsTab] = useState<'method' | 'dispute'>('method');
  const [paymentType, setPaymentType] = useState<'bank' | 'paypal' | 'stripe' | 'wise' | 'payoneer'>('bank');
  const [paymentAccount, setPaymentAccount] = useState('');
  const [paymentRouting, setPaymentRouting] = useState('');

  // New Dispute input
  const [disputeIssue, setDisputeIssue] = useState('');
  const [disputeEvidence, setDisputeEvidence] = useState('');

  const loadArtistRevenueData = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/artist/payouts');
      if (!res.ok) {
        throw new Error(`Error ${res.status}: Unauthorised or server exception`);
      }
      const json = await res.json();
      if (json.success) {
        setData(json);
        // Pre-fill payment settings if available
        if (json.artist?.paymentMethod) {
          setPaymentType(json.artist.paymentMethod.type);
          setPaymentAccount(json.artist.paymentMethod.emailOrAccount);
          setPaymentRouting(json.artist.paymentMethod.routingOrCode || '');
        }
        setError(null);
      } else {
        throw new Error(json.error || 'Failed to fetch artist accounting data');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Connecting to artist payouts API failed.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadArtistRevenueData();
  }, []);

  // Post Actions
  const handleWithdrawalRequest = async () => {
    if (!data) return;
    const amount = parseFloat(withdrawAmount);
    const minThreshold = data.subscription === 'premium' ? 10 : 25;

    if (isNaN(amount) || amount <= 0) {
      toast.error('Specify a valid withdrawal amount.');
      return;
    }
    if (amount < minThreshold) {
      toast.error(`The minimum withdrawal threshold is $${minThreshold} USD for your subscription tier.`);
      return;
    }
    if (amount > data.artist.availableBalance) {
      toast.error('Amount requested exceeds your current available balance.');
      return;
    }
    if (!accountDetail.trim()) {
      toast.error('Recipient account routing detail is required.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/artist/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'withdraw',
          amount,
          method: withdrawMethod,
          details: {
            emailOrAccount: accountDetail,
            routingOrCode: routingDetail
          }
        })
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message || 'Withdrawal initiated successfully!');
        setShowWithdrawModal(false);
        setWithdrawAmount('');
        setAccountDetail('');
        setRoutingDetail('');
        loadArtistRevenueData(true);
      } else {
        toast.error(result.error || 'Failed to process withdrawal request');
      }
    } catch (e) {
      toast.error('Communication error with ledger server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdatePaymentMethod = async () => {
    if (!paymentAccount.trim()) {
      toast.error('Account detail or payment email must be specified.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/artist/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update-method',
          method: paymentType,
          details: {
            emailOrAccount: paymentAccount,
            routingOrCode: paymentRouting
          }
        })
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message || 'Payment method linked and verified.');
        loadArtistRevenueData(true);
      } else {
        toast.error(result.error || 'Failed to update payment settings');
      }
    } catch (e) {
      toast.error('Payment configuration update error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileDispute = async () => {
    if (!disputeIssue.trim() || !disputeEvidence.trim()) {
      toast.error('Please describe both the dispute issue and attach evidence links.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/artist/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'dispute',
          issue: disputeIssue,
          evidence: disputeEvidence
        })
      });
      const result = await res.json();
      if (result.success) {
        toast.success(result.message || 'Dispute successfully logged with finance desk.');
        setDisputeIssue('');
        setDisputeEvidence('');
        setShowDisputeModal(false);
        loadArtistRevenueData(true);
      } else {
        toast.error(result.error || 'Failed to submit dispute');
      }
    } catch (e) {
      toast.error('Error contacting finance triage desk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // CSV statement exporter
  const handleExportStatement = () => {
    if (!data || data.withdrawals.length === 0) {
      toast.error('No transaction records available for export.');
      return;
    }

    const headers = ['Voucher ID', 'Amount (USD)', 'Routing Method', 'Date Requested', 'Current Status'];
    const rows = data.withdrawals.map(w => [
      w.id,
      w.amount.toFixed(2),
      w.method.toUpperCase(),
      new Date(w.created).toLocaleString(),
      w.status.toUpperCase()
    ]);

    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Beato_Payout_Statement_${new Date().getFullYear()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('📊 CSV statement export started!');
  };

  // UI Status styles
  const getStatusBadge = (status: string) => {
    let bg = 'rgba(234, 179, 8, 0.1)';
    let color = COLORS.yellow;
    let label = status;

    if (status === 'completed' || status === 'paid') {
      bg = 'rgba(29, 185, 84, 0.1)';
      color = COLORS.green;
      label = '✓ Settled';
    } else if (status === 'failed' || status === 'rejected') {
      bg = 'rgba(239, 68, 68, 0.1)';
      color = COLORS.red;
      label = '✕ Failed';
    } else if (status === 'processing') {
      bg = 'rgba(16, 185, 129, 0.1)';
      color = COLORS.blue;
      label = '⌛ Processing';
    } else if (status === 'held') {
      bg = 'rgba(239, 68, 68, 0.15)';
      color = COLORS.red;
      label = '🔒 Auditing Hold';
    } else if (status === 'review') {
      bg = 'rgba(249, 115, 22, 0.1)';
      color = COLORS.orange;
      label = '⚖ Risk Review';
    }

    return (
      <span style={{ 
        padding: '3px 8px', borderRadius: 20, fontSize: 11, fontWeight: 700,
        background: bg, color, border: `1px solid ${color}35`, textTransform: 'capitalize'
      }}>
        {label}
      </span>
    );
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: COLORS.bg, gap: 16 }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${COLORS.border}`, borderTopColor: COLORS.green, borderRadius: '50%' }} className="spin" />
        <p style={{ color: COLORS.muted, fontSize: 14, fontFamily: fontInter }}>Interfacing with Beato financial ledger...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: COLORS.bg, padding: 24, textAlign: 'center' }}>
        <AlertTriangle size={48} color={COLORS.red} style={{ marginBottom: 16 }} />
        <h2 style={{ fontFamily: fontOutfit, color: '#fff', margin: '0 0 8px' }}>Royalty Connection Terminated</h2>
        <p style={{ color: COLORS.muted, fontSize: 14, margin: '0 0 20px', maxWidth: 400 }}>{error || 'Your artist credentials are not bound to active payout systems.'}</p>
        <button onClick={() => loadArtistRevenueData()} style={{ padding: '10px 24px', background: COLORS.green, color: '#000', border: 'none', borderRadius: 30, cursor: 'pointer', fontFamily: fontOutfit, fontWeight: 700 }}>
          Reconnect to Control Desk
        </button>
      </div>
    );
  }

  const { artist, withdrawals, disputes, taxDocs, trackRevenues, monthlyEarnings, subscription } = data;
  const isKycComplete = artist.kycStatus === 'verified';
  const isTaxVerified = artist.taxVerified;
  const isEligibleToWithdraw = isKycComplete && isTaxVerified && artist.availableBalance > 0;
  
  // Formatters
  const fmt = (n: number) => n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(0)}K` : n.toString();
  const formatCurrency = (val: number) => {
    const cur = data?.currency || 'USD';
    if (cur === 'INR') {
      return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 }).format(val);
    }
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val);
  };

  return (
    <div style={{ minHeight: '100vh', background: COLORS.bg, padding: '32px 24px', fontFamily: fontInter, color: COLORS.text }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>
        
        {/* ─── HEADER ─── */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: fontOutfit, fontSize: 32, fontWeight: 800, background: `linear-gradient(135deg, ${COLORS.green}, ${COLORS.blue})`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Royalty Ledger & Payout Center
            </h1>
            <p style={{ margin: '4px 0 0', color: COLORS.muted, fontSize: 13 }}>
              Clearance panel for <strong>{artist.name}</strong> · Tier: <span style={{ textTransform: 'capitalize', color: COLORS.green, fontWeight: 700 }}>{subscription} Creator</span>
            </p>
          </div>
          <button 
            onClick={() => loadArtistRevenueData(true)}
            style={{ 
              display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, 
              border: `1.5px solid ${COLORS.border}`, background: 'transparent', color: COLORS.text, 
              fontWeight: 600, cursor: 'pointer', fontSize: 13
            }}
          >
            <RefreshCw size={13} /> Refresh Ledger
          </button>
        </div>

        {/* ─── DYNAMIC CRITICAL COMPLIANCE ALERT BANNERS ─── */}
        {(!isKycComplete || !isTaxVerified) && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
            {!isKycComplete && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'rgba(234, 179, 8, 0.08)', border: `1px solid ${COLORS.yellow}40`, borderRadius: 12 }}>
                <AlertTriangle color={COLORS.yellow} size={20} style={{ flexShrink: 0 }} />
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                  <strong style={{ color: COLORS.yellow }}>Action Required: Identity Verification (KYC) Missing.</strong>
                  <p style={{ margin: '2px 0 0', color: COLORS.muted }}>Financial regulations require identity screening before funds release. Contact administration to upload credentials.</p>
                </div>
              </div>
            )}
            {!isTaxVerified && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', background: 'rgba(239, 68, 68, 0.08)', border: `1px solid ${COLORS.red}40`, borderRadius: 12 }}>
                <AlertCircle color={COLORS.red} size={20} style={{ flexShrink: 0 }} />
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>
                  <strong style={{ color: COLORS.red }}>Compliance Required: Tax withholding forms outstanding.</strong>
                  <p style={{ margin: '2px 0 0', color: COLORS.muted }}>Submit Form W-8BEN or 1099-MISC via portal to avoid general payment holds or 30% default backup withholding.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── BALANCES & SUMMARY STATS ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 28 }}>
          {/* Main Available Balance Card with Glowing Button */}
          <div style={{ 
            background: 'linear-gradient(135deg, rgba(29, 185, 84,0.08) 0%, rgba(18,18,18,0.7) 100%)', 
            border: `1.5px solid ${isEligibleToWithdraw ? COLORS.green + '40' : COLORS.border}`, 
            borderRadius: 16, padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            boxShadow: isEligibleToWithdraw ? '0 8px 30px rgba(29, 185, 84, 0.08)' : 'none'
          }}>
            <div>
              <span style={{ fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>Available Balance</span>
              <h2 style={{ margin: '4px 0 0', fontFamily: fontOutfit, fontSize: 30, fontWeight: 800, color: COLORS.green }}>{formatCurrency(artist.availableBalance)}</h2>
            </div>
            
            <button 
              disabled={!isEligibleToWithdraw}
              onClick={() => setShowWithdrawModal(true)}
              style={{ 
                padding: '12px 22px', borderRadius: 30, border: 'none', 
                background: isEligibleToWithdraw ? `linear-gradient(135deg, ${COLORS.green}, #17a349)` : 'rgba(255, 255, 255, 0.05)',
                color: isEligibleToWithdraw ? '#000' : COLORS.muted, 
                fontWeight: 800, fontFamily: fontOutfit, fontSize: 13, 
                cursor: isEligibleToWithdraw ? 'pointer' : 'default',
                boxShadow: isEligibleToWithdraw ? '0 4px 20px rgba(29, 185, 84, 0.3)' : 'none',
                transition: '0.2s'
              }}
              onMouseEnter={e => { if (isEligibleToWithdraw) e.currentTarget.style.transform = 'scale(1.03)'; }}
              onMouseLeave={e => { if (isEligibleToWithdraw) e.currentTarget.style.transform = 'scale(1)'; }}
            >
              💸 Withdraw Funds
            </button>
          </div>

          {[
            { label: 'Auditing / Pending Hold', value: formatCurrency(artist.pendingBalance), color: COLORS.yellow, desc: 'Funds in clearance pipeline' },
            { label: 'Estimated Next Clearance', value: formatCurrency(artist.estimatedNextPayout), color: COLORS.blue, desc: 'Calculated month-to-date streams' },
            { label: 'Cumulative Lifetime Earnings', value: formatCurrency(artist.lifetimeEarnings), color: COLORS.pink, desc: 'Total gross value cleared' },
          ].map(c => (
            <div key={c.label} style={{ background: COLORS.card, border: `1.5px solid ${COLORS.border}`, borderRadius: 16, padding: '22px 24px' }}>
              <span style={{ fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.8 }}>{c.label}</span>
              <h2 style={{ margin: '4px 0 0', fontFamily: fontOutfit, fontSize: 26, fontWeight: 800, color: c.color }}>{c.value}</h2>
              <span style={{ fontSize: 10, color: '#555', display: 'block', marginTop: 4 }}>{c.desc}</span>
            </div>
          ))}
        </div>

        {/* ─── DUAL ROW LAYOUT PANEL ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 20, marginBottom: 28 }}>
          
          {/* LEFT SPLIT: CHARTS, SONG REVENUES, SETTINGS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Monthly Earnings Line Chart */}
            <div style={{ background: COLORS.card, border: `1.5px solid ${COLORS.border}`, borderRadius: 18, padding: 24 }}>
              <h3 style={{ margin: '0 0 4px', fontFamily: fontOutfit, fontSize: 18, fontWeight: 700 }}>Monthly Royalty Allocations</h3>
              <p style={{ margin: '0 0 20px', color: COLORS.muted, fontSize: 12 }}>Time series distribution across channels</p>
              
              <ResponsiveContainer width="100%" height={230}>
                <LineChart data={monthlyEarnings} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={COLORS.border} />
                  <XAxis dataKey="month" tick={{ fill: COLORS.muted, fontSize: 11 }} />
                  <YAxis tick={{ fill: COLORS.muted, fontSize: 11 }} tickFormatter={v => {
                    const sym = data?.currency === 'INR' ? '₹' : '$';
                    return `${sym}${v}`;
                  }} />
                  <Tooltip formatter={(v: any) => [formatCurrency(Number(v)), 'Earnings']} contentStyle={{ background: COLORS.card2, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: '#fff' }} />
                  <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                  <Line type="monotone" dataKey="streaming" name="Streams" stroke={COLORS.green} strokeWidth={2.5} dot={{ fill: COLORS.green, r: 3 }} />
                  <Line type="monotone" dataKey="downloads" name="Downloads" stroke={COLORS.purple} strokeWidth={2} dot={{ fill: COLORS.purple, r: 3 }} />
                  <Line type="monotone" dataKey="total" name="Total" stroke={COLORS.pink} strokeWidth={3} strokeDasharray="5 2" dot={{ fill: COLORS.pink, r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Per-Track breakdown */}
            <div style={{ background: COLORS.card, border: `1.5px solid ${COLORS.border}`, borderRadius: 18, overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px 14px', borderBottom: `1.5px solid ${COLORS.border}` }}>
                <h3 style={{ margin: 0, fontFamily: fontOutfit, fontSize: 18, fontWeight: 700 }}>Track Revenue breakdown</h3>
                <p style={{ margin: '2px 0 0', color: COLORS.muted, fontSize: 12 }}>Lifetime streams and mechanical rights payouts</p>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: 'rgba(255, 255, 255, 0.02)', borderBottom: `1px solid ${COLORS.border}` }}>
                    {['Track Title', 'Streams Count', 'Streaming (USD)', 'Downloads (USD)', 'Total Net'].map(h => (
                      <th key={h} style={{ padding: '10px 18px', color: COLORS.muted, fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {trackRevenues.map((t, idx) => (
                    <tr key={t.title} style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                      <td style={{ padding: '14px 18px', fontWeight: 700 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ fontSize: 14 }}>🎵</span>
                          <span>{t.title}</span>
                        </div>
                      </td>
                      <td style={{ padding: '14px 18px', color: COLORS.muted }}>{fmt(t.streams)}</td>
                      <td style={{ padding: '14px 18px', color: COLORS.green, fontWeight: 600 }}>{formatCurrency(t.streaming)}</td>
                      <td style={{ padding: '14px 18px', color: COLORS.purple }}>{formatCurrency(t.downloads)}</td>
                      <td style={{ padding: '14px 18px', color: COLORS.pink, fontWeight: 700 }}>{formatCurrency(t.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* PAYMENT DETAILS AND DISPUTES PORTLET */}
            <div style={{ background: COLORS.card, border: `1.5px solid ${COLORS.border}`, borderRadius: 18, padding: 24 }}>
              <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, marginBottom: 20 }}>
                <button 
                  onClick={() => setActiveSettingsTab('method')}
                  style={{ 
                    padding: '8px 16px', background: 'transparent', border: 'none', 
                    borderBottom: activeSettingsTab === 'method' ? `2px solid ${COLORS.green}` : '2px solid transparent',
                    color: activeSettingsTab === 'method' ? COLORS.text : COLORS.muted,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  🏦 Link Settlement Account
                </button>
                <button 
                  onClick={() => setActiveSettingsTab('dispute')}
                  style={{ 
                    padding: '8px 16px', background: 'transparent', border: 'none', 
                    borderBottom: activeSettingsTab === 'dispute' ? `2px solid ${COLORS.green}` : '2px solid transparent',
                    color: activeSettingsTab === 'dispute' ? COLORS.text : COLORS.muted,
                    fontSize: 13, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  ⚖ Raise Royalty Dispute
                </button>
              </div>

              {activeSettingsTab === 'method' ? (
                <div>
                  <p style={{ margin: '0 0 16px', color: COLORS.muted, fontSize: 12.5, lineHeight: 1.5 }}>
                    Clearance funds will route automatically to your linked channel. Make sure details match tax registries.
                  </p>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>Payment Provider</label>
                      <select 
                        value={paymentType}
                        onChange={e => setPaymentType(e.target.value as any)}
                        style={{ width: '100%', padding: '10px', background: COLORS.card2, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }}
                      >
                        <option value="bank">Direct Bank Transfer</option>
                        <option value="paypal">PayPal Ledger</option>
                        <option value="stripe">Stripe Connect Account</option>
                        <option value="wise">Wise Bank Details</option>
                        <option value="payoneer">Payoneer Account</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>Routing Code / Bank Code (Optional)</label>
                      <input 
                        type="text"
                        placeholder="e.g. IFSC, routing number"
                        value={paymentRouting}
                        onChange={e => setPaymentRouting(e.target.value)}
                        style={{ width: '100%', padding: '10px', background: COLORS.card2, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>Account Number / Provider email address</label>
                    <input 
                      type="text"
                      placeholder="e.g. IBAN, email address, UPI ID"
                      value={paymentAccount}
                      onChange={e => setPaymentAccount(e.target.value)}
                      style={{ width: '100%', padding: '10px', background: COLORS.card2, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <button 
                    onClick={handleUpdatePaymentMethod}
                    disabled={isSubmitting}
                    style={{ 
                      padding: '10px 20px', borderRadius: 8, border: 'none', 
                      background: COLORS.green, color: '#000', fontWeight: 700, 
                      fontSize: 13, cursor: 'pointer' 
                    }}
                  >
                    Save & Re-verify
                  </button>
                </div>
              ) : (
                <div>
                  <p style={{ margin: '0 0 16px', color: COLORS.muted, fontSize: 12.5, lineHeight: 1.5 }}>
                    See stream count discrepancies? Raise a royalty case immediately. The finance desk responds within 24h.
                  </p>
                  
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ display: 'block', fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>Issue Description</label>
                    <input 
                      type="text"
                      placeholder="E.g., Streaming discrepancy for Midnight Drive Neon streams"
                      value={disputeIssue}
                      onChange={e => setDisputeIssue(e.target.value)}
                      style={{ width: '100%', padding: '10px', background: COLORS.card2, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                    />
                  </div>

                  <div style={{ marginBottom: 18 }}>
                    <label style={{ display: 'block', fontSize: 11, color: COLORS.muted, marginBottom: 6 }}>Evidence / Explanation Notes</label>
                    <textarea 
                      placeholder="Specify dates, country, and evidence links (e.g. analytics screenshot links)"
                      value={disputeEvidence}
                      onChange={e => setDisputeEvidence(e.target.value)}
                      style={{ width: '100%', minHeight: 70, padding: '10px', background: COLORS.card2, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box', resize: 'vertical' }}
                    />
                  </div>

                  <button 
                    onClick={handleFileDispute}
                    disabled={isSubmitting}
                    style={{ 
                      padding: '10px 20px', borderRadius: 8, border: 'none', 
                      background: COLORS.yellow, color: '#000', fontWeight: 700, 
                      fontSize: 13, cursor: 'pointer' 
                    }}
                  >
                    File Triage Dispute
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT SPLIT: TRANSACTION HISTORY, TAX COMPLIANCE, DEFLECTIONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            {/* Withdrawal Ledger */}
            <div style={{ background: COLORS.card, border: `1.5px solid ${COLORS.border}`, borderRadius: 18, padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontFamily: fontOutfit, fontSize: 16 }}>Withdrawal Ledger</h3>
                <button 
                  onClick={handleExportStatement}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: 4, padding: '5px 10px', borderRadius: 6, 
                    border: `1px solid ${COLORS.border}`, background: 'transparent', color: COLORS.muted, 
                    fontSize: 11, fontWeight: 700, cursor: 'pointer' 
                  }}
                >
                  <Download size={12} /> CSV
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 220, overflowY: 'auto' }}>
                {withdrawals.length === 0 ? (
                  <p style={{ color: COLORS.muted, fontSize: 12, textAlign: 'center', padding: '20px 0' }}>No previous withdrawals recorded.</p>
                ) : (
                  withdrawals.slice().reverse().map(w => (
                    <div 
                      key={w.id}
                      style={{ 
                        background: COLORS.card2, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'monospace' }}>{w.id}</div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.green, marginTop: 2 }}>{formatCurrency(w.amount)}</div>
                        <div style={{ fontSize: 10, color: '#555', marginTop: 2 }}>{new Date(w.created).toLocaleDateString()}</div>
                      </div>
                      <div>
                        {getStatusBadge(w.status)}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tax compliance documents */}
            <div style={{ background: COLORS.card, border: `1.5px solid ${COLORS.border}`, borderRadius: 18, padding: 20 }}>
              <h3 style={{ margin: '0 0 4px', fontFamily: fontOutfit, fontSize: 16 }}>Tax Compliance Registry</h3>
              <p style={{ margin: '0 0 16px', color: COLORS.muted, fontSize: 12 }}>Generated 1099-MISC & W-8BEN forms</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {taxDocs.length === 0 ? (
                  <div style={{ background: 'rgba(239, 68, 68, 0.05)', border: `1.5px solid ${COLORS.red}30`, borderRadius: 10, padding: 12 }}>
                    <p style={{ margin: 0, color: COLORS.red, fontSize: 11, lineHeight: 1.5 }}>
                      ⚠️ No verified tax profile loaded. Submit W-8BEN or 1099 form to generate annual forms and unlock transacting status.
                    </p>
                  </div>
                ) : (
                  taxDocs.map(doc => (
                    <div 
                      key={doc.year}
                      style={{ 
                        background: COLORS.card2, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12,
                        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700 }}>Year {doc.year} Form</div>
                        <div style={{ fontSize: 11, color: COLORS.muted, marginTop: 2 }}>{doc.type} · verified</div>
                      </div>
                      <button 
                        onClick={() => toast.success(`Simulating PDF download for year ${doc.year} tax statement.`)}
                        style={{ 
                          padding: '5px 12px', borderRadius: 20, border: `1px solid ${COLORS.border}`, 
                          background: 'transparent', color: COLORS.text, fontSize: 11, cursor: 'pointer' 
                        }}
                      >
                        PDF
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Triage Disputes status */}
            {disputes.length > 0 && (
              <div style={{ background: COLORS.card, border: `1.5px solid ${COLORS.border}`, borderRadius: 18, padding: 20 }}>
                <h3 style={{ margin: '0 0 10px', fontFamily: fontOutfit, fontSize: 16 }}>Raised Disputes Status</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {disputes.map(disp => (
                    <div key={disp.id} style={{ background: COLORS.card2, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: COLORS.muted, fontFamily: 'monospace' }}>{disp.id}</span>
                        <span style={{ 
                          fontSize: 10, fontWeight: 700, padding: '2px 6px', borderRadius: 10,
                          background: disp.status === 'resolved' ? 'rgba(29, 185, 84, 0.1)' : 'rgba(234, 179, 8, 0.1)',
                          color: disp.status === 'resolved' ? COLORS.green : COLORS.yellow
                        }}>
                          {disp.status.toUpperCase()}
                        </span>
                      </div>
                      <div style={{ fontSize: 12, fontWeight: 600 }}>{disp.issue}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick deflection guide */}
            <div style={{ background: COLORS.card, border: `1.5px solid ${COLORS.border}`, borderRadius: 18, padding: 20 }}>
              <h3 style={{ margin: '0 0 12px', fontFamily: fontOutfit, fontSize: 16 }}>Royalty Clearance FAQs</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12 }}>
                {[
                  { q: 'When do royalties clear?', a: 'Streams calculate instantly but balance settles into available payout columns monthly around the 15th.' },
                  { q: 'Platform fee calculation', a: 'Beato takes a 20% platform share for system server maintenance. Artists receive 70% net minus 10% tax.' },
                  { q: 'Why is my payout held?', a: 'Risk engines temporarily hold withdrawals with fraud indicators > 70 for review (e.g. suspected listening bot activity).' }
                ].map(faq => (
                  <div key={faq.q} style={{ borderBottom: `1px solid ${COLORS.border}`, paddingBottom: 8 }}>
                    <strong style={{ color: '#fff', display: 'block', marginBottom: 2 }}>{faq.q}</strong>
                    <span style={{ color: COLORS.muted, lineHeight: 1.4 }}>{faq.a}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* ─── MODALS ─── */}
      <AnimatePresence>
        
        {/* WITHDRAWAL PROCESSOR MODAL */}
        {showWithdrawModal && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
            onClick={() => setShowWithdrawModal(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              style={{ background: COLORS.card2, border: `1.5px solid ${COLORS.border}`, borderRadius: 20, padding: 32, width: 460, maxWidth: '95%' }}
              onClick={e => e.stopPropagation()}
            >
              <h3 style={{ fontFamily: fontOutfit, margin: '0 0 6px', fontSize: 22 }}>Withdraw Royalties</h3>
              <p style={{ margin: '0 0 20px', color: COLORS.muted, fontSize: 13 }}>
                Max transactable balance: <strong style={{ color: COLORS.green }}>{formatCurrency(artist.availableBalance)}</strong>
              </p>

              {/* Amount */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Amount (USD)</label>
                <div style={{ display: 'flex', alignItems: 'center', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 10, overflow: 'hidden' }}>
                  <span style={{ padding: '10px 14px', color: COLORS.green, fontWeight: 700 }}>$</span>
                  <input 
                    type="number" 
                    step="0.01"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={e => setWithdrawAmount(e.target.value)}
                    style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#fff', fontSize: 16, fontWeight: 700, padding: '10px 10px 10px 0' }}
                  />
                </div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {[0.25, 0.5, 0.75, 1].map(p => (
                    <button 
                      key={p} 
                      onClick={() => setWithdrawAmount((artist.availableBalance * p).toFixed(2))}
                      style={{ fontSize: 10, padding: '3px 10px', background: 'transparent', border: `1px solid ${COLORS.border}`, borderRadius: 12, color: COLORS.muted, cursor: 'pointer' }}
                    >
                      {p === 1 ? 'MAX' : `${p * 100}%`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Method Selector */}
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Routing Channel</label>
                <select 
                  value={withdrawMethod}
                  onChange={e => setWithdrawMethod(e.target.value as any)}
                  style={{ width: '100%', padding: '10px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none' }}
                >
                  <option value="bank">Direct Bank Transfer</option>
                  <option value="paypal">PayPal</option>
                  <option value="stripe">Stripe Connect</option>
                  <option value="wise">Wise</option>
                  <option value="payoneer">Payoneer</option>
                </select>
              </div>

              {/* Account text details */}
              <div style={{ marginBottom: 14 }}>
                <label style={{ display: 'block', fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Recipient Account / Identifier</label>
                <input 
                  type="text"
                  placeholder="e.g. IBAN / UPI ID / paypal email"
                  value={accountDetail}
                  onChange={e => setAccountDetail(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ display: 'block', fontSize: 11, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>Bank Routing Code / Wise BIC (Optional)</label>
                <input 
                  type="text"
                  placeholder="Swift / routing number"
                  value={routingDetail}
                  onChange={e => setRoutingDetail(e.target.value)}
                  style={{ width: '100%', padding: '10px', background: COLORS.bg, border: `1px solid ${COLORS.border}`, borderRadius: 8, color: '#fff', fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
                />
              </div>

              {/* Security Warning */}
              <div style={{ background: 'rgba(234, 179, 8, 0.05)', border: `1px solid ${COLORS.yellow}20`, borderRadius: 8, padding: 12, marginBottom: 20 }}>
                <p style={{ margin: 0, fontSize: 11, color: COLORS.yellow, lineHeight: 1.4, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <Lock size={12} /> Clearance requests with a risk metric &gt; 30 are automatically flagged for manual admin compliance check.
                </p>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button 
                  onClick={handleWithdrawalRequest}
                  disabled={isSubmitting}
                  style={{ flex: 1, padding: '12px', borderRadius: 30, border: 'none', background: COLORS.green, color: '#000', fontWeight: 850, fontSize: 14, cursor: 'pointer' }}
                >
                  Confirm Request
                </button>
                <button onClick={() => setShowWithdrawModal(false)} style={{ flex: 1, padding: '12px', borderRadius: 30, border: `1.5px solid ${COLORS.border}`, background: 'transparent', color: '#fff', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
