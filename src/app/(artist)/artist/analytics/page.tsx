'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { TrendingUp, Users, DollarSign, Play, SkipForward, Heart, ListMusic, Globe, Calendar } from 'lucide-react';

const G = '#b08850';
const COLORS = [G, '#10b981', '#34d399', '#f59e0b', '#06b6d4', '#f97316'];
const RANGES = ['7D', '30D', '90D', '1Y'];

const generateStreamData = (days: number) =>
  Array.from({ length: days > 30 ? 12 : days }, (_, i) => ({
    label: days <= 7 ? ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'][i] : days <= 30 ? `Day ${i+1}` : `Week ${i+1}`,
    streams: Math.floor(80000 + Math.random() * 200000),
    listeners: Math.floor(20000 + Math.random() * 60000),
  }));

const geoData = [
  { country: '🇮🇳 India', pct: 34, color: G },
  { country: '🇺🇸 USA', pct: 22, color: '#10b981' },
  { country: '🇬🇧 UK', pct: 15, color: '#34d399' },
  { country: '🇧🇷 Brazil', pct: 11, color: '#f59e0b' },
  { country: '🇩🇪 Germany', pct: 8, color: '#06b6d4' },
  { country: '🌍 Others', pct: 10, color: '#525252' },
];

const ageData = [
  { range: '13-17', pct: 12 }, { range: '18-24', pct: 38 },
  { range: '25-34', pct: 29 }, { range: '35-44', pct: 14 }, { range: '45+', pct: 7 },
];

const topTracks = [
  { title: 'Midnight Cascade', streams: 2400000, saves: 182000, skipRate: '18%', trend: '+12%' },
  { title: 'Stellar Drift', streams: 1800000, saves: 124000, skipRate: '22%', trend: '+8%' },
  { title: 'Glass Ocean', streams: 1200000, saves: 89000, skipRate: '25%', trend: '-3%' },
  { title: 'Binary Pulse', streams: 980000, saves: 67000, skipRate: '30%', trend: '+5%' },
  { title: 'Neon Dreams', streams: 750000, saves: 45000, skipRate: '28%', trend: '+2%' },
];

function KpiCard({ icon: Icon, label, value, change, positive, color }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      style={{ padding: 22, borderRadius: 16, background: 'var(--color-ss-elevated, #ffffff)', border: '1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: 11, background: `${color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={18} color={color} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 100, background: positive ? 'rgba(176, 136, 80,0.12)' : 'rgba(239,68,68,0.12)', color: positive ? G : '#ef4444' }}>
          {change}
        </span>
      </div>
      <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900, color: 'var(--color-ss-text-primary, #221a15)', lineHeight: 1 }}>{value}</p>
      <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 12, marginTop: 5 }}>{label}</p>
    </motion.div>
  );
}

export default function ArtistAnalyticsPage() {
  const [range, setRange] = useState('30D');
  const days = range === '7D' ? 7 : range === '30D' ? 30 : range === '90D' ? 90 : 365;
  const data = generateStreamData(days);

  return (
    <div style={{ minHeight: '100%', background: 'var(--color-ss-bg, #fbf9f5)', padding: '24px 28px 60px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28 }}>
        <div>
          <p style={{ color: G, fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>Artist Portal</p>
          <h1 style={{ fontFamily: 'Outfit, sans-serif', fontSize: 28, fontWeight: 900, color: 'var(--color-ss-text-primary, #221a15)' }}>Analytics</h1>
        </div>
        <div style={{ display: 'flex', gap: 4, background: 'var(--color-ss-surface, #f4eede)', borderRadius: 10, padding: 3 }}>
          {RANGES.map(r => (
            <button key={r} onClick={() => setRange(r)} style={{
              padding: '6px 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none',
              background: range === r ? G : 'transparent', color: range === r ? '#000' : 'var(--color-ss-text-muted, #87786c)', transition: 'all 0.15s',
            }}>{r}</button>
          ))}
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        <KpiCard icon={Play} label="Total Streams" value="7.4M" change="+18.3%" positive color={G} />
        <KpiCard icon={Users} label="Unique Listeners" value="1.2M" change="+9.1%" positive color="#10b981" />
        <KpiCard icon={Heart} label="Song Saves" value="504K" change="+24.7%" positive color="#34d399" />
        <KpiCard icon={SkipForward} label="Avg Skip Rate" value="23%" change="-2.1%" positive color="#f59e0b" />
      </div>

      {/* Streams + Listeners Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20, marginBottom: 20 }}>
        <div style={{ background: 'var(--color-ss-elevated, #ffffff)', borderRadius: 18, padding: '22px', border: '1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))' }}>
          <h3 style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 700, fontSize: 15, marginBottom: 18 }}>Streams & Listeners</h3>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={data}>
              <defs>
                <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={G} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={G} stopOpacity={0} />
                </linearGradient>
                <linearGradient id="lg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ss-border, rgba(43, 34, 26, 0.08))" />
              <XAxis dataKey="label" stroke="var(--color-ss-text-muted, #87786c)" fontSize={11} />
              <YAxis stroke="var(--color-ss-text-muted, #87786c)" fontSize={11} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
              <Tooltip contentStyle={{ background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 8, color: 'var(--color-ss-text-primary, #221a15)' }} formatter={(v: any, n) => [`${(Number(v) / 1000).toFixed(1)}K`, n === 'streams' ? 'Streams' : 'Listeners']} />
              <Area type="monotone" dataKey="streams" stroke={G} strokeWidth={2.5} fill="url(#sg)" />
              <Area type="monotone" dataKey="listeners" stroke="#10b981" strokeWidth={2} fill="url(#lg)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Geo */}
        <div style={{ background: 'var(--color-ss-elevated, #ffffff)', borderRadius: 18, padding: '22px', border: '1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))' }}>
          <h3 style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Top Countries</h3>
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 12 }}>
            <PieChart width={130} height={130}>
              <Pie data={geoData} cx={65} cy={65} innerRadius={38} outerRadius={60} dataKey="pct" paddingAngle={2}>
                {geoData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
            </PieChart>
          </div>
          {geoData.map(c => (
            <div key={c.country} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 7 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 9, height: 9, borderRadius: '50%', background: c.color }} />
                <span style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 12 }}>{c.country}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 60, height: 3, borderRadius: 2, background: 'var(--color-ss-surface, #f4eede)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${c.pct}%`, background: c.color, borderRadius: 2 }} />
                </div>
                <span style={{ color: 'var(--color-ss-text-primary, #221a15)', fontSize: 12, fontWeight: 600, width: 28, textAlign: 'right' }}>{c.pct}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Age + Top Tracks */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20 }}>
        <div style={{ background: 'var(--color-ss-elevated, #ffffff)', borderRadius: 18, padding: '22px', border: '1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))' }}>
          <h3 style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 700, fontSize: 15, marginBottom: 18 }}>Audience Age</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={ageData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="var(--color-ss-border, rgba(43, 34, 26, 0.08))" horizontal={false} />
              <XAxis type="number" stroke="var(--color-ss-text-muted, #87786c)" fontSize={10} tickFormatter={v => `${v}%`} />
              <YAxis dataKey="range" type="category" stroke="var(--color-ss-text-muted, #87786c)" fontSize={11} />
              <Tooltip contentStyle={{ background: 'var(--color-ss-elevated, #ffffff)', border: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', borderRadius: 8, color: 'var(--color-ss-text-primary, #221a15)' }} formatter={(v: any) => [`${v}%`, 'Share']} />
              <Bar dataKey="pct" fill={G} radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 12, marginTop: 14, justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 700, fontSize: 15 }}>58%</p>
              <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 10 }}>Male</p>
            </div>
            <div style={{ width: 1, background: 'var(--color-ss-border, rgba(43, 34, 26, 0.08))' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 700, fontSize: 15 }}>39%</p>
              <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 10 }}>Female</p>
            </div>
            <div style={{ width: 1, background: 'var(--color-ss-border, rgba(43, 34, 26, 0.08))' }} />
            <div style={{ textAlign: 'center' }}>
              <p style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 700, fontSize: 15 }}>3%</p>
              <p style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 10 }}>Other</p>
            </div>
          </div>
        </div>

        <div style={{ background: 'var(--color-ss-elevated, #ffffff)', borderRadius: 18, border: '1.5px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', overflow: 'hidden' }}>
          <div style={{ padding: '18px 20px 12px', borderBottom: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))' }}>
            <h3 style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 700, fontSize: 15 }}>Top Tracks Performance</h3>
          </div>
          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ color: 'var(--color-ss-text-muted, #87786c)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                {['Track', 'Streams', 'Saves', 'Skip Rate', 'Trend'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: h === 'Track' ? 'left' : 'right', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {topTracks.map((t, i) => (
                <tr key={t.title} style={{ borderTop: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--color-ss-surface, #f4eede)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                  <td style={{ padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ color: 'var(--color-ss-text-muted, #87786c)', width: 16 }}>{i + 1}</span>
                    <span style={{ color: 'var(--color-ss-text-primary, #221a15)', fontWeight: 500 }}>{t.title}</span>
                  </td>
                  <td style={{ padding: '13px 16px', textAlign: 'right', color: 'var(--color-ss-text-muted, #87786c)' }}>{(t.streams / 1_000_000).toFixed(1)}M</td>
                  <td style={{ padding: '13px 16px', textAlign: 'right', color: 'var(--color-ss-text-muted, #87786c)' }}>{(t.saves / 1000).toFixed(0)}K</td>
                  <td style={{ padding: '13px 16px', textAlign: 'right', color: 'var(--color-ss-text-muted, #87786c)' }}>{t.skipRate}</td>
                  <td style={{ padding: '13px 16px', textAlign: 'right', color: t.trend.startsWith('+') ? G : '#ef4444', fontWeight: 700 }}>{t.trend}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
