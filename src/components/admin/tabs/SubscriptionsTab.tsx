'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import toast from 'react-hot-toast';

// ─── Types ─────────────────────────────────────────────────────────────────────

type SubStatus = 'active' | 'cancelled' | 'trial' | 'paused' | 'suspended';
type FilterKey = 'All' | 'Active' | 'Trial' | 'Cancelled' | 'Suspended';
type PlanName = 'free' | 'student' | 'premium' | 'family' | 'creator';

interface PlanData {
  name: PlanName;
  price: number;
  subscribers: number;
  revenue: number;
  share: string;
}

interface SubRecord {
  id: string;
  name: string;
  email: string;
  plan: PlanName;
  role: string;
  isActive: boolean;
  avatar?: string;
  country: string;
  joinedAt: string;
  billing: string;
  status: SubStatus;
}

interface Stats {
  totalSubs: number;
  mrr: number;
  arpu: number;
  churnRate: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_COLORS: Record<PlanName, string> = {
  free: '#6b7280',
  student: '#a3e635',
  premium: '#1db954',
  family: '#10b981',
  creator: '#34d399',
};

const PLAN_LABELS: Record<PlanName, string> = {
  free: 'Free',
  student: 'Student',
  premium: 'Premium',
  family: 'Family',
  creator: 'Creator',
};

const STATUS_COLORS: Record<string, string> = {
  active: '#1db954',
  cancelled: '#ef4444',
  trial: '#34d399',
  paused: '#f59e0b',
  suspended: '#ef4444',
};

const GROWTH_DATA = [
  { month: 'Jan', free: 14200, student: 2100, premium: 38000, family: 8900, creator: 1800 },
  { month: 'Feb', free: 15100, student: 2400, premium: 40200, family: 9800, creator: 2050 },
  { month: 'Mar', free: 16300, student: 2700, premium: 41800, family: 10600, creator: 2300 },
  { month: 'Apr', free: 17100, student: 2950, premium: 43100, family: 11200, creator: 2550 },
  { month: 'May', free: 17800, student: 3100, premium: 44500, family: 11900, creator: 2720 },
  { month: 'Jun', free: 18420, student: 3210, premium: 45820, family: 12340, creator: 2890 },
];

const REVENUE_DATA = [
  { month: 'Jan', revenue: 612400 },
  { month: 'Feb', revenue: 648200 },
  { month: 'Mar', revenue: 681700 },
  { month: 'Apr', revenue: 704300 },
  { month: 'May', revenue: 718900 },
  { month: 'Jun', revenue: 728800 },
];

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: '#0a0a0a',
  border: '1px solid #2a2a2a',
  borderRadius: 8,
  color: '#fff',
  padding: '9px 12px',
  fontSize: 13,
  outline: 'none',
  boxSizing: 'border-box',
};

// ─── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value, color, sub }: { label: string; value: string; color: string; sub?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      style={{ background: '#121212', border: '1px solid #1a1a1a', borderRadius: 14, padding: '18px 20px' }}
    >
      <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
      <div style={{ color, fontSize: 28, fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#4b5563', marginTop: 4 }}>{sub}</div>}
    </motion.div>
  );
}

function PlanCard({
  plan, onEditPrice, onViewUsers, symbol
}: {
  plan: PlanData;
  onEditPrice: (plan: PlanData) => void;
  onViewUsers: (planName: PlanName) => void;
  symbol: string;
}) {
  const color = PLAN_COLORS[plan.name];
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: `0 8px 32px ${color}33` }}
      transition={{ type: 'spring', stiffness: 300 }}
      style={{
        background: '#121212',
        border: `1px solid #1a1a1a`,
        borderRadius: 16,
        padding: '22px 20px',
        flex: '1 1 160px',
        minWidth: 150,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: color, borderRadius: '16px 16px 0 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <span style={{ background: `${color}22`, color, border: `1px solid ${color}44`, padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
          {PLAN_LABELS[plan.name]}
        </span>
        <span style={{ color: '#fff', fontSize: 18, fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
          {plan.price === 0 ? 'Free' : `${symbol}${plan.price}`}
          {plan.price > 0 && <span style={{ fontSize: 11, color: '#666', fontWeight: 400 }}>/mo</span>}
        </span>
      </div>
      <div style={{ color: '#fff', fontSize: 26, fontWeight: 700, fontFamily: 'Outfit, sans-serif', marginBottom: 4 }}>
        {plan.subscribers.toLocaleString()}
      </div>
      <div style={{ color: '#666', fontSize: 12, marginBottom: 10 }}>subscribers</div>
      <div style={{ color: '#aaa', fontSize: 12, marginBottom: 4 }}>
        Revenue: <span style={{ color: '#fff', fontWeight: 600 }}>{symbol}{(plan.revenue / 1000).toFixed(1)}K/mo</span>
      </div>
      <div style={{ color: '#aaa', fontSize: 12, marginBottom: 14 }}>
        Share: <span style={{ color, fontWeight: 600 }}>{plan.share}%</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => onEditPrice(plan)}
          style={{ flex: 1, background: '#1a1a1a', border: `1px solid #333`, color: '#ccc', borderRadius: 8, padding: '7px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = color; (e.currentTarget as HTMLButtonElement).style.color = color; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.borderColor = '#333'; (e.currentTarget as HTMLButtonElement).style.color = '#ccc'; }}
        >Edit Plan</button>
        <button
          onClick={() => onViewUsers(plan.name)}
          style={{ flex: 1, background: `${color}18`, border: `1px solid ${color}44`, color, borderRadius: 8, padding: '7px 0', fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
        >View Users</button>
      </div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function SubscriptionsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [recentSubs, setRecentSubs] = useState<SubRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [symbol, setSymbol] = useState('$');

  // UI State
  const [filter, setFilter] = useState<FilterKey>('All');
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<PlanName | 'all'>('all');
  const [activeChart, setActiveChart] = useState<'growth' | 'revenue' | 'pie'>('growth');

  // Modals
  const [changePlanModal, setChangePlanModal] = useState<SubRecord | null>(null);
  const [newPlan, setNewPlan] = useState<PlanName>('free');
  const [editPlanModal, setEditPlanModal] = useState<PlanData | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [userViewPlan, setUserViewPlan] = useState<PlanName | null>(null);
  const [trialModal, setTrialModal] = useState<SubRecord | null>(null);
  const [trialPlan, setTrialPlan] = useState<PlanName>('premium');
  const [detailsModal, setDetailsModal] = useState<SubRecord | null>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/subscriptions?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setPlans(data.plans);
        setRecentSubs(data.recentSubs);
        if (data.symbol) setSymbol(data.symbol);
      }
    } catch (e) {
      toast.error('Failed to load subscription data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Real-time polling every 5s
    return () => clearInterval(interval);
  }, [fetchData]);

  const callApi = async (body: object) => {
    const res = await fetch('/api/admin/subscriptions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Action failed');
    return data;
  };

  const handleChangePlan = async () => {
    if (!changePlanModal) return;
    try {
      const data = await callApi({ action: 'change_plan', userId: changePlanModal.id, plan: newPlan });
      toast.success(data.message);
      setChangePlanModal(null);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleAction = async (userId: string, action: string, userName: string) => {
    try {
      const data = await callApi({ action, userId });
      toast.success(data.message);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleGrantTrial = async () => {
    if (!trialModal) return;
    try {
      const data = await callApi({ action: 'grant_trial', userId: trialModal.id, plan: trialPlan });
      toast.success(data.message);
      setTrialModal(null);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleEditPrice = async () => {
    if (!editPlanModal) return;
    try {
      const data = await callApi({
        action: 'edit_plan_price',
        plan: editPlanModal.name,
        newPrice: Number(editPrice),
      });
      toast.success(data.message);
      setEditPlanModal(null);
      fetchData();
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Plan', 'Status', 'Country', 'Joined'];
    const csvContent = [
      headers.join(','),
      ...filteredSubs.map(s => [
        `"${s.name}"`, `"${s.email}"`, s.plan, s.status, s.country, s.joinedAt
      ].join(','))
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscriptions_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('CSV exported');
  };

  const filteredSubs = recentSubs.filter(s => {
    const matchSearch = !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase());
    const matchPlan = planFilter === 'all' || s.plan === planFilter;
    const matchFilter =
      filter === 'All' ||
      (filter === 'Active' && s.status === 'active') ||
      (filter === 'Trial' && s.status === 'trial') ||
      (filter === 'Cancelled' && s.status === 'cancelled') ||
      (filter === 'Suspended' && s.status === 'suspended');
    return matchSearch && matchPlan && matchFilter;
  });

  const planFilteredSubs = userViewPlan
    ? recentSubs.filter(s => s.plan === userViewPlan)
    : filteredSubs;

  const FILTERS: FilterKey[] = ['All', 'Active', 'Trial', 'Cancelled', 'Suspended'];

  const pieData = plans.map(p => ({ name: PLAN_LABELS[p.name], value: p.subscribers, color: PLAN_COLORS[p.name] }));

  return (
    <div style={{ padding: '28px 0', fontFamily: 'Inter, sans-serif', color: '#fff' }}>

      {/* ── Real-time Stats ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard
          label="Total Subscribers"
          value={loading ? '...' : (stats?.totalSubs || 0).toLocaleString()}
          color="#1db954"
          sub="↑ 3.2% from last month"
        />
        <StatCard
          label="Monthly Recurring Revenue"
          value={loading ? '...' : `${symbol}${((stats?.mrr || 0) / 1000).toFixed(1)}K`}
          color="#10b981"
          sub="↑ 1.4% vs last month"
        />
        <StatCard
          label="Churn Rate"
          value={loading ? '...' : `${stats?.churnRate || 0}%`}
          color="#ef4444"
          sub="↓ 0.3% improvement"
        />
        <StatCard
          label="Avg Revenue Per User"
          value={loading ? '...' : `${symbol}${(stats?.arpu || 0).toFixed(2)}`}
          color="#f59e0b"
          sub="Based on active paid plans"
        />
      </div>

      {/* ── Live indicator ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <motion.div
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
          transition={{ duration: 1.8, repeat: Infinity }}
          style={{ width: 8, height: 8, borderRadius: '50%', background: '#1db954' }}
        />
        <span style={{ fontSize: 11, color: '#1db954', fontWeight: 700, letterSpacing: '0.08em' }}>LIVE — refreshes every 5 seconds</span>
      </div>

      {/* ── Plan Cards ── */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
        {loading ? (
          <div style={{ color: '#555', fontSize: 13, padding: 16 }}>Loading plan data...</div>
        ) : (
          plans.map(p => (
            <PlanCard
              key={p.name}
              plan={p}
              symbol={symbol}
              onEditPrice={(pl) => { setEditPlanModal(pl); setEditPrice(String(pl.price)); }}
              onViewUsers={(planName) => setUserViewPlan(planName === userViewPlan ? null : planName)}
            />
          ))
        )}
      </div>

      {/* ── Charts ── */}
      <div style={{ background: '#121212', border: '1px solid #1a1a1a', borderRadius: 16, padding: '24px 24px 12px', marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>Analytics</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['growth', 'revenue', 'pie'] as const).map(c => (
              <button key={c} onClick={() => setActiveChart(c)} style={{
                padding: '5px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                background: activeChart === c ? '#1db954' : '#1a1a1a',
                color: activeChart === c ? '#000' : '#888',
                border: activeChart === c ? '1px solid #1db954' : '1px solid #2a2a2a',
              }}>
                {c === 'growth' ? 'Subscriber Growth' : c === 'revenue' ? 'Revenue Trend' : 'Plan Distribution'}
              </button>
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {activeChart === 'growth' && (
            <motion.div key="growth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResponsiveContainer width="100%" height={240}>
                <AreaChart data={GROWTH_DATA} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    {Object.entries(PLAN_COLORS).map(([name, color]) => (
                      <linearGradient key={name} id={`grad_${name}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                  <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, color: '#fff', fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#888' }} />
                  {Object.entries(PLAN_COLORS).map(([name, color]) => (
                    <Area key={name} type="monotone" dataKey={name} stroke={color} fill={`url(#grad_${name})`} strokeWidth={2} dot={false} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {activeChart === 'revenue' && (
            <motion.div key="revenue" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={REVENUE_DATA} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#1db954" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#1db954" stopOpacity={0.3} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e1e" />
                  <XAxis dataKey="month" tick={{ fill: '#666', fontSize: 12 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#666', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}K`} />
                  <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, color: '#fff', fontSize: 12 }} formatter={(v: any) => [`$${(v / 1000).toFixed(1)}K`, 'Revenue']} />
                  <Bar dataKey="revenue" fill="url(#revenueGrad)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}

          {activeChart === 'pie' && (
            <motion.div key="pie" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
                <ResponsiveContainer width="50%" height={240}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={100} dataKey="value" paddingAngle={3}>
                      {pieData.map((entry, idx) => (
                        <Cell key={idx} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 10, color: '#fff', fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {plans.map(p => (
                    <div key={p.name} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 12, height: 12, borderRadius: 3, background: PLAN_COLORS[p.name], flexShrink: 0 }} />
                      <span style={{ fontSize: 13, color: '#e5e7eb', fontWeight: 600 }}>{PLAN_LABELS[p.name]}</span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{p.share}% ({p.subscribers.toLocaleString()})</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Subscribers Table ── */}
      <div style={{ background: '#121212', border: '1px solid #1a1a1a', borderRadius: 16, padding: 24 }}>

        {/* Table Header & Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'Outfit, sans-serif' }}>
                {userViewPlan ? `${PLAN_LABELS[userViewPlan]} Plan Users` : 'Subscriber Management'}
              </div>
              {userViewPlan && (
                <button onClick={() => setUserViewPlan(null)} style={{ background: '#ef444422', border: '1px solid #ef444444', color: '#ef4444', borderRadius: 6, padding: '3px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  ✕ Clear Filter
                </button>
              )}
            </div>
            <button onClick={exportCSV} style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ccc', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Export CSV
            </button>
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              style={{ ...inputStyle, width: 220 }}
            />
            <select value={planFilter} onChange={e => setPlanFilter(e.target.value as any)} style={{ ...inputStyle, width: 130 }}>
              <option value="all">All Plans</option>
              <option value="free">Free</option>
              <option value="student">Student</option>
              <option value="premium">Premium</option>
              <option value="family">Family</option>
              <option value="creator">Creator</option>
            </select>
            <div style={{ display: 'flex', gap: 8 }}>
              {FILTERS.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{
                    padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: filter === f ? '#1db954' : '#1a1a1a',
                    color: filter === f ? '#000' : '#888',
                    border: filter === f ? '1px solid #1db954' : '1px solid #2a2a2a',
                  }}>{f}</button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1e1e1e' }}>
                {['User', 'Plan', 'Joined', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#555', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {(userViewPlan ? planFilteredSubs : filteredSubs).map((sub, i) => {
                  const planColor = PLAN_COLORS[sub.plan] || '#6b7280';
                  const statusColor = STATUS_COLORS[sub.status] || '#6b7280';

                  return (
                    <motion.tr key={sub.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      transition={{ delay: i * 0.03 }} style={{ borderBottom: '1px solid #161616' }}
                      onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#161616'}
                      onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}
                    >
                      {/* User */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <img src={sub.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=40&h=40&fit=crop'}
                            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }} />
                          <div>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{sub.name}</div>
                            <div style={{ fontSize: 11, color: '#555' }}>{sub.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Plan */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: `${planColor}22`, color: planColor, border: `1px solid ${planColor}44`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'capitalize' }}>
                          {PLAN_LABELS[sub.plan]}
                        </span>
                      </td>

                      {/* Joined */}
                      <td style={{ padding: '12px 14px', color: '#6b7280', fontSize: 12 }}>{sub.joinedAt}</td>

                      {/* Status */}
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: `${statusColor}22`, color: statusColor, border: `1px solid ${statusColor}44`, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, textTransform: 'capitalize' }}>
                          {sub.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                          <button onClick={() => setDetailsModal(sub)}
                            style={{ background: '#1a1a1a', border: '1px solid #333', color: '#ccc', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            Details
                          </button>
                          <button onClick={() => { setChangePlanModal(sub); setNewPlan(sub.plan); }}
                            style={{ background: '#10b98122', border: '1px solid #10b98144', color: '#10b981', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            Change Plan
                          </button>
                          <button onClick={() => { setTrialModal(sub); }}
                            style={{ background: '#f59e0b22', border: '1px solid #f59e0b44', color: '#f59e0b', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                            Grant Trial
                          </button>
                          {sub.isActive ? (
                            <button onClick={() => handleAction(sub.id, 'suspend_sub', sub.name)}
                              style={{ background: '#ef444422', border: '1px solid #ef444444', color: '#ef4444', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                              Suspend
                            </button>
                          ) : (
                            <button onClick={() => handleAction(sub.id, 'activate_sub', sub.name)}
                              style={{ background: '#1db95422', border: '1px solid #1db95444', color: '#1db954', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                              Activate
                            </button>
                          )}
                          {sub.plan !== 'free' && (
                            <button onClick={() => { if (confirm(`Cancel ${sub.name}'s subscription?`)) handleAction(sub.id, 'cancel_sub', sub.name); }}
                              style={{ background: '#6b728022', border: '1px solid #6b728044', color: '#9ca3af', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                              Cancel
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </AnimatePresence>
              {filteredSubs.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: '#555', fontSize: 13 }}>No subscribers found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Change Plan Modal ── */}
      <AnimatePresence>
        {changePlanModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setChangePlanModal(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#121212', border: '1px solid #2a2a2a', borderRadius: 16, padding: 28, width: 400 }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>Change Subscription Plan</h3>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>Changing plan for <strong style={{ color: '#e5e7eb' }}>{changePlanModal.name}</strong></p>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
                {(['free', 'student', 'premium', 'family', 'creator'] as PlanName[]).map(p => {
                  const price = plans.find(pl => pl.name === p)?.price ?? 0;
                  return (
                    <button key={p} onClick={() => setNewPlan(p)}
                      style={{
                        padding: '12px 16px', borderRadius: 10, border: `2px solid ${newPlan === p ? PLAN_COLORS[p] : '#1a1a1a'}`,
                        background: newPlan === p ? `${PLAN_COLORS[p]}18` : '#0a0a0a',
                        color: newPlan === p ? PLAN_COLORS[p] : '#9ca3af',
                        fontWeight: 700, fontSize: 13, cursor: 'pointer', textAlign: 'left', display: 'flex', justifyContent: 'space-between',
                      }}>
                      <span style={{ textTransform: 'capitalize' }}>{PLAN_LABELS[p]}</span>
                      <span>{p === 'free' ? 'Free' : `${symbol}${price}/mo`}</span>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setChangePlanModal(null)} style={{ background: '#1a1a1a', border: 'none', borderRadius: 8, color: '#9ca3af', padding: '10px 18px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleChangePlan} style={{ background: '#1db954', border: 'none', borderRadius: 8, color: '#000', padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Apply Change</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Grant Trial Modal ── */}
      <AnimatePresence>
        {trialModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setTrialModal(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#121212', border: '1px solid #2a2a2a', borderRadius: 16, padding: 28, width: 380 }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>Grant Free Trial</h3>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>Give <strong style={{ color: '#e5e7eb' }}>{trialModal.name}</strong> a 30-day trial</p>
              <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 8 }}>Select Trial Plan</label>
              <select value={trialPlan} onChange={e => setTrialPlan(e.target.value as PlanName)} style={{ ...inputStyle, marginBottom: 20 }}>
                {(['student', 'premium', 'family', 'creator'] as PlanName[]).map(p => {
                  const price = plans.find(pl => pl.name === p)?.price ?? 0;
                  return (
                    <option key={p} value={p}>
                      {PLAN_LABELS[p]} – {symbol}{price}/mo
                    </option>
                  );
                })}
              </select>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setTrialModal(null)} style={{ background: '#1a1a1a', border: 'none', borderRadius: 8, color: '#9ca3af', padding: '10px 18px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleGrantTrial} style={{ background: '#f59e0b', border: 'none', borderRadius: 8, color: '#000', padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Grant Trial</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Edit Plan Price Modal ── */}
      <AnimatePresence>
        {editPlanModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setEditPlanModal(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#121212', border: '1px solid #2a2a2a', borderRadius: 16, padding: 28, width: 380 }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 700 }}>Edit Plan: {PLAN_LABELS[editPlanModal.name]}</h3>
              <p style={{ margin: '0 0 20px', fontSize: 13, color: '#6b7280' }}>Update pricing and features for this plan</p>
              <label style={{ fontSize: 12, color: '#9ca3af', display: 'block', marginBottom: 8 }}>Monthly Price ({symbol})</label>
              <input type="number" value={editPrice} onChange={e => setEditPrice(e.target.value)} style={{ ...inputStyle, marginBottom: 20 }} placeholder="9.99" />
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button onClick={() => setEditPlanModal(null)} style={{ background: '#1a1a1a', border: 'none', borderRadius: 8, color: '#9ca3af', padding: '10px 18px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleEditPrice} style={{ background: PLAN_COLORS[editPlanModal.name], border: 'none', borderRadius: 8, color: '#000', padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Save Changes</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Details Modal ── */}
      <AnimatePresence>
        {detailsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setDetailsModal(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#121212', border: '1px solid #2a2a2a', borderRadius: 16, padding: 28, width: 440 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <img src={detailsModal.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=60&h=60&fit=crop'} style={{ width: 60, height: 60, borderRadius: '50%', objectFit: 'cover', border: `2px solid ${PLAN_COLORS[detailsModal.plan]}` }} />
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>{detailsModal.name}</h3>
                  <p style={{ margin: 0, color: '#6b7280', fontSize: 13 }}>{detailsModal.email}</p>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                {[
                  { label: 'PLAN', value: PLAN_LABELS[detailsModal.plan], color: PLAN_COLORS[detailsModal.plan] },
                  { label: 'STATUS', value: detailsModal.status, color: STATUS_COLORS[detailsModal.status] },
                  { label: 'BILLING', value: detailsModal.billing, color: '#fff' },
                  { label: 'COUNTRY', value: detailsModal.country, color: '#fff' },
                  { label: 'MEMBER SINCE', value: detailsModal.joinedAt, color: '#fff' },
                  { label: 'ROLE', value: detailsModal.role, color: '#9ca3af' },
                ].map(({ label, value, color }) => (
                  <div key={label} style={{ background: '#0a0a0a', padding: 12, borderRadius: 8, border: '1px solid #1a1a1a' }}>
                    <p style={{ margin: '0 0 4px', fontSize: 10, color: '#6b7280', letterSpacing: '0.06em' }}>{label}</p>
                    <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color, textTransform: 'capitalize' }}>{value}</p>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setDetailsModal(null); setChangePlanModal(detailsModal); setNewPlan(detailsModal.plan); }}
                  style={{ flex: 1, background: '#10b981', border: 'none', borderRadius: 8, color: '#000', padding: '10px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Change Plan
                </button>
                <button onClick={() => setDetailsModal(null)}
                  style={{ flex: 1, background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#9ca3af', padding: '10px', fontSize: 13, cursor: 'pointer' }}>
                  Close
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
