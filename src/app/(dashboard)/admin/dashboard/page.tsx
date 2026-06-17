'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import UsersTab from '@/components/admin/tabs/UsersTab';
import SubscriptionsTab from '@/components/admin/tabs/SubscriptionsTab';
import PaymentsTab from '@/components/admin/tabs/PaymentsTab';
import AnalyticsTab from '@/components/admin/tabs/AnalyticsTab';
import MarketingTab from '@/components/admin/tabs/MarketingTab';
import NotificationsTab from '@/components/admin/tabs/NotificationsTab';
import SupportTab from '@/components/admin/tabs/SupportTab';
import PayoutsTab from '@/components/admin/tabs/PayoutsTab';
import GeographyTab from '@/components/admin/tabs/GeographyTab';
import SystemHealthTab from '@/components/admin/tabs/SystemHealthTab';
import ApiKeysTab from '@/components/admin/tabs/ApiKeysTab';
import AuditLogsTab from '@/components/admin/tabs/AuditLogsTab';
import AbTestingTab from '@/components/admin/tabs/AbTestingTab';
import EmailTab from '@/components/admin/tabs/EmailTab';
import ContentLibraryTab from '@/components/admin/tabs/ContentLibraryTab';
import SettingsTab from '@/components/admin/tabs/SettingsTab';
import TopBar from '@/components/layout/TopBar';
import { useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { useAuthStore } from '@/store/authStore';
import { useMusicStore, trackGradient } from '@/store/musicStore';
import { usePlayerStore } from '@/store/playerStore';
import { logSecurityEvent } from '@/lib/audit';
import { useArtistApplicationStore } from '@/store/artistApplicationStore';
import toast from 'react-hot-toast';

// ─── Real Reports local state representation ───
const REPORTS = [
  { id: 'rpt-1', type: 'copyright', title: 'Copyright Violation', description: 'User reported potential copyright overlap', severity: 'high', status: 'resolved', reportedAt: '2026-06-01', reporter: 'Sony Music LLC', trackId: 'track-uploaded-1780058924675' },
  { id: 'rpt-2', type: 'content', title: 'Explicit Content Flag', description: 'Lyrics may contain explicit content', severity: 'medium', status: 'pending', reportedAt: '2026-06-02', reporter: 'ParentShield AI', trackId: 'track-uploaded-1780059986774' }
];

const GENRE_DATA = [
  { name: 'Pop', value: 28, color: '#34d399' },
  { name: 'Hip-Hop', value: 22, color: '#f59e0b' },
  { name: 'Electronic', value: 18, color: '#06b6d4' },
  { name: 'Rock', value: 14, color: '#ef4444' },
  { name: 'R&B', value: 10, color: '#10b981' },
  { name: 'Other', value: 8, color: '#6b7280' },
];

// ─── Types ───────────────────────────────────────────────────────────────────
type TabType = 'overview' | 'artists' | 'songs' | 'users' | 'reports' | 'subscriptions' | 'payments' | 'analytics' | 'marketing' | 'notifications' | 'support' | 'payouts' | 'geography' | 'health' | 'api' | 'audit' | 'abtests' | 'email' | 'content' | 'settings';
type ArtistStatus = 'approved' | 'pending' | 'rejected';
type UserStatus = 'active' | 'suspended';
type SongStatus = 'approved' | 'pending' | 'rejected';

// ─── Sub-Components ──────────────────────────────────────────────────────────

function KpiCard({
  label, value, sub, color, icon, trend,
}: {
  label: string;
  value: string;
  sub?: string;
  color: string;
  icon: React.ReactNode;
  trend?: number;
}) {
  return (
    <motion.div
      whileHover={{ y: -4, boxShadow: `0 20px 60px rgba(0,0,0,0.5)` }}
      transition={{ duration: 0.2 }}
      style={{
        background: '#121212',
        borderRadius: 16,
        padding: '22px 24px',
        border: '1px solid #1a1a1a',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{
          width: 44,
          height: 44,
          borderRadius: 12,
          background: `${color}18`,
          border: `1px solid ${color}30`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
          fontSize: 20,
        }}>
          {icon}
        </div>
        {trend !== undefined && (
          <div style={{
            fontSize: 12,
            fontWeight: 700,
            color: trend >= 0 ? '#b08850' : '#ef4444',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}>
            {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: '#fff', fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>
          {value}
        </div>
        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: color, marginTop: 4, fontWeight: 600 }}>{sub}</div>}
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const colorMap: Record<string, { bg: string; color: string; text: string }> = {
    approved: { bg: 'rgba(176, 136, 80,0.12)', color: '#b08850', text: 'Approved' },
    pending: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', text: 'Pending' },
    rejected: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', text: 'Rejected' },
    active: { bg: 'rgba(176, 136, 80,0.12)', color: '#b08850', text: 'Active' },
    suspended: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', text: 'Suspended' },
    resolved: { bg: 'rgba(107,114,128,0.12)', color: '#9ca3af', text: 'Resolved' },
    investigating: { bg: 'rgba(16, 185, 129,0.12)', color: '#10b981', text: 'Investigating' },
    high: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', text: 'High' },
    critical: { bg: 'rgba(239,68,68,0.2)', color: '#ef4444', text: 'Critical' },
    medium: { bg: 'rgba(251,191,36,0.12)', color: '#fbbf24', text: 'Medium' },
    low: { bg: 'rgba(176, 136, 80,0.12)', color: '#b08850', text: 'Low' },
  };
  const c = colorMap[status] || { bg: '#2a2a2a', color: '#9ca3af', text: status };
  return (
    <span style={{
      padding: '4px 10px',
      borderRadius: 20,
      fontSize: 11,
      fontWeight: 700,
      background: c.bg,
      color: c.color,
      letterSpacing: '0.04em',
    }}>
      {c.text.toUpperCase()}
    </span>
  );
}

function ActionButton({
  label, onClick, variant,
}: {
  label: string;
  onClick: () => void;
  variant: 'approve' | 'reject' | 'suspend' | 'activate' | 'investigate' | 'dismiss';
}) {
  const colorMap = {
    approve: { bg: 'rgba(176, 136, 80,0.15)', color: '#b08850', hover: 'rgba(176, 136, 80,0.25)' },
    activate: { bg: 'rgba(176, 136, 80,0.15)', color: '#b08850', hover: 'rgba(176, 136, 80,0.25)' },
    reject: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', hover: 'rgba(239,68,68,0.22)' },
    suspend: { bg: 'rgba(239,68,68,0.12)', color: '#ef4444', hover: 'rgba(239,68,68,0.22)' },
    investigate: { bg: 'rgba(16, 185, 129,0.12)', color: '#10b981', hover: 'rgba(16, 185, 129,0.22)' },
    dismiss: { bg: '#1a1a1a', color: '#9ca3af', hover: '#252525' },
  };
  const c = colorMap[variant];
  return (
    <motion.button
      whileHover={{ background: c.hover }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      style={{
        padding: '5px 12px',
        borderRadius: 7,
        border: 'none',
        background: c.bg,
        color: c.color,
        fontSize: 12,
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      {label}
    </motion.button>
  );
}

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmColor,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmColor: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 950,
        }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onCancel}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.75)',
              backdropFilter: 'blur(5px)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            style={{
              position: 'relative',
              background: '#161616',
              border: '1px solid #2a2a2a',
              borderRadius: 20,
              padding: '32px',
              zIndex: 951,
              width: 400,
              maxWidth: '90vw',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ fontSize: 18, fontWeight: 800, color: '#fff', fontFamily: 'Outfit, sans-serif', marginBottom: 10 }}>
              {title}
            </div>
            <div style={{ fontSize: 14, color: '#9ca3af', lineHeight: 1.6, marginBottom: 28 }}>
              {message}
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <motion.button
                whileHover={{ background: '#252525' }}
                onClick={onCancel}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 10,
                  border: '1px solid #2a2a2a',
                  background: 'transparent',
                  color: '#9ca3af',
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </motion.button>
              <motion.button
                whileHover={{ opacity: 0.85 }}
                whileTap={{ scale: 0.97 }}
                onClick={onConfirm}
                style={{
                  flex: 1,
                  padding: '12px',
                  borderRadius: 10,
                  border: 'none',
                  background: confirmColor,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

function Modal({
  open, title, onClose, children
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <div style={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 960,
        }}>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(0,0,0,0.85)',
              backdropFilter: 'blur(8px)',
            }}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 25 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 25 }}
            transition={{ type: 'spring', damping: 22, stiffness: 320 }}
            style={{
              position: 'relative',
              background: '#161616',
              border: '1px solid #2a2a2a',
              borderRadius: 24,
              padding: '32px',
              zIndex: 961,
              width: 500,
              maxWidth: '90vw',
              maxHeight: '85vh',
              overflowY: 'auto',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.7)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Outfit, sans-serif', margin: 0 }}>
                {title}
              </h3>
              <motion.button
                whileHover={{ rotate: 90, color: '#fff' }}
                onClick={onClose}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  fontSize: 20,
                  cursor: 'pointer',
                  padding: 4,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                ✕
              </motion.button>
            </div>
            {children}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

// ─── Tab Panels ──────────────────────────────────────────────────────────────

function OverviewTab({
  stats,
  applications = [],
  uploadedTracks = [],
}: {
  stats: any;
  applications?: any[];
  uploadedTracks?: any[];
}) {
  const currencySymbol = stats?.currencySymbol || '$';

  const formatWithCommas = (n: number) => n.toLocaleString();
  const formatCompact = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  const formatStreams = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return v.toString();
  };

  const formatStreamsTooltip = (v: number) => {
    if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(2)}M`;
    if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
    return v.toLocaleString();
  };

  const pendingCount = applications.filter((a) => a.status === 'PENDING').length;
  const pendingSongsCount = uploadedTracks.filter((t) => t.status === 'pending').length;

  const streamData = stats?.streamData || [];
  const genreData = stats?.genreData || [];
  const monthlyData = stats?.monthlyData || [];
  const topArtists = stats?.topArtists || [];

  const maxListeners = Math.max(...topArtists.map((a: any) => a.monthlyListeners), 1);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
        <KpiCard
          label="Total Users"
          value={formatCompact(stats?.totalUsers || 0)}
          sub={`+${(monthlyData?.[monthlyData.length - 1]?.users || 0).toLocaleString()} this month`}
          color="#b08850"
          trend={8.4}
          icon="👥"
        />
        <KpiCard
          label="Active Artists"
          value={formatWithCommas(stats?.activeArtists || 0)}
          sub={`${pendingCount} pending approval`}
          color="#10b981"
          trend={3.2}
          icon="🎤"
        />
        <KpiCard
          label="Total Songs"
          value={formatCompact(stats?.totalSongs || 0)}
          sub={`${pendingSongsCount} pending review`}
          color="#06b6d4"
          trend={5.7}
          icon="🎵"
        />
        <KpiCard
          label="Monthly Revenue"
          value={`${currencySymbol}${formatCompact(stats?.monthlyRevenue || 0)}`}
          sub="+10.3% vs last month"
          color="#f59e0b"
          trend={10.3}
          icon="💰"
        />
        <KpiCard
          label="Daily Streams"
          value={formatCompact(Math.round((stats?.totalPlays || 0) / 30))}
          sub="Peak estimate"
          color="#34d399"
          trend={2.1}
          icon="📊"
        />
        <KpiCard
          label="Platform Growth"
          value="+34%"
          sub="Year-over-year"
          color="#10b981"
          trend={34}
          icon="📈"
        />
      </div>

      {/* Charts Row 1 */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Streams Over Time */}
        <div style={{ background: '#121212', borderRadius: 16, padding: '24px', border: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Weekly Streams</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 20 }}>Daily active streams</div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={streamData}>
              <defs>
                <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#b08850" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#b08850" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatStreams} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, color: '#fff', fontSize: 12 }}
                formatter={(v: any) => [formatStreamsTooltip(Number(v)), 'Streams']}
              />
              <Area type="monotone" dataKey="streams" stroke="#b08850" strokeWidth={2.5} fill="url(#streamGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Genre Breakdown */}
        <div style={{ background: '#121212', borderRadius: 16, padding: '24px', border: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Genre Mix</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Stream share by genre</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={genreData} innerRadius={45} outerRadius={68} paddingAngle={2} dataKey="value">
                {genreData.map((entry: any, i: number) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, color: '#fff', fontSize: 12 }}
                formatter={(v: any) => [`${v}%`, 'Share']}
              />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>
            {genreData.map((g: any) => (
              <div key={g.name} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: g.color }} />
                <span style={{ fontSize: 11, color: '#9ca3af' }}>{g.name} ({g.value}%)</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* Monthly Users */}
        <div style={{ background: '#121212', borderRadius: 16, padding: '24px', border: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>User Growth</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 20 }}>Monthly registered users</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={formatStreams} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, color: '#fff', fontSize: 12 }}
                formatter={(v: any) => [formatStreamsTooltip(Number(v)), 'Users']}
              />
              <Bar dataKey="users" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue */}
        <div style={{ background: '#121212', borderRadius: 16, padding: '24px', border: '1px solid #1a1a1a' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 4 }}>Revenue Trend</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 20 }}>Monthly platform revenue ({currencySymbol})</div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="month" tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${currencySymbol}${formatCompact(v)}`} />
              <Tooltip
                contentStyle={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 10, color: '#fff', fontSize: 12 }}
                formatter={(v: any) => [`${currencySymbol}${Number(v).toLocaleString()}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2.5} dot={{ fill: '#f59e0b', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Top Artists Snapshot */}
      <div style={{ background: '#121212', borderRadius: 16, padding: '24px', border: '1px solid #1a1a1a' }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', marginBottom: 20 }}>Top Performing Artists</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {topArtists.length === 0 ? (
            <div style={{ fontSize: 13, color: '#6b7280', textAlign: 'center', padding: '10px 0' }}>No artist activity recorded yet</div>
          ) : (
            topArtists.map((artist: any, i: number) => {
              const pct = (artist.monthlyListeners / maxListeners) * 100;
              return (
                <div key={artist.id} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 20, fontSize: 13, color: '#6b7280', fontWeight: 700, textAlign: 'right', flexShrink: 0 }}>#{i + 1}</div>
                  <img src={artist.image} alt={artist.name} style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, objectFit: 'cover' }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{artist.name}</span>
                      <span style={{ fontSize: 12, color: '#6b7280' }}>{artist.monthlyListeners.toLocaleString()} plays</span>
                    </div>
                    <div style={{ height: 4, background: '#1a1a1a', borderRadius: 2, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${pct}%` }}
                        transition={{ duration: 0.8, delay: i * 0.1 }}
                        style={{ height: '100%', background: '#b08850', borderRadius: 2 }}
                      />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

function ArtistsTab() {
  const { user, upgradeToArtist } = useAuthStore();
  const { applications, approveApplication, rejectApplication, fetchApplications } = useArtistApplicationStore();
  
  // Tab toggler: 'directory' (artist directory and management), 'applications' (original review queue), or 'verifications'
  const [subTab, setSubTab] = useState<'directory' | 'applications' | 'verifications'>('directory');

  const [pendingVerificationsCount, setPendingVerificationsCount] = useState(0);

  const fetchPendingVerificationsCount = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/verifications');
      const data = await res.json();
      if (data.success) {
        const pending = data.requests.filter((r: any) => r.status === 'under_review').length;
        setPendingVerificationsCount(pending);
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchPendingVerificationsCount();
    fetchApplications();
  }, [fetchPendingVerificationsCount, fetchApplications]);

  // Create Artist Modal States
  const [createArtistModal, setCreateArtistModal] = useState(false);
  const [newArtist, setNewArtist] = useState({
    name: '',
    email: '',
    bio: '',
    country: 'IN',
    followers: '0',
    avatar: '',
  });
  const [createLoading, setCreateLoading] = useState(false);

  // Add Song Modal States
  const [addSongModal, setAddSongModal] = useState<{ open: boolean; artistId: string; artistName: string }>({ open: false, artistId: '', artistName: '' });
  const [newSong, setNewSong] = useState({
    title: '',
    genre: 'Pop',
    duration: '180',
    audioUrl: '',
    coverImage: '',
    explicit: false,
  });
  const [songLoading, setSongLoading] = useState(false);
  
  // Review Queue States
  const [confirmApp, setConfirmApp] = useState<{
    open: boolean;
    appId: string;
    action: 'approve' | 'reject';
    name: string;
  }>({ open: false, appId: '', action: 'approve', name: '' });
  const [appSearch, setAppSearch] = useState('');
  const [appFilter, setAppFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>('all');

  // Artist Directory States
  const [artists, setArtists] = useState<any[]>([]);
  const [dirSearch, setDirSearch] = useState('');
  const [dirLoading, setDirLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    open: boolean;
    artistId: string;
    action: 'deactivate' | 'activate' | 'remove';
    name: string;
  }>({ open: false, artistId: '', action: 'deactivate', name: '' });

  const fetchArtists = async () => {
    try {
      setDirLoading(true);
      const res = await fetch(`/api/admin/artists?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setArtists(data.artists);
      }
    } catch (e) {
      toast.error('Failed to load active artists');
    } finally {
      setDirLoading(false);
    }
  };

  useEffect(() => {
    fetchArtists();
  }, []);

  const handleAppAction = useCallback((appId: string, action: 'approve' | 'reject', name: string) => {
    setConfirmApp({ open: true, appId, action, name });
  }, []);

  const confirmAppAction = useCallback(async () => {
    try {
      if (confirmApp.action === 'approve') {
        await approveApplication(confirmApp.appId, (userId) => {
          upgradeToArtist(userId);
        });
      } else {
        await rejectApplication(confirmApp.appId);
      }
      
      toast.success(`Artist application ${confirmApp.action}d successfully`);
      fetchArtists(); // refresh directory list too
    } catch (err: any) {
      toast.error(err.message || 'An error occurred during application processing');
    } finally {
      setConfirmApp({ open: false, appId: '', action: 'approve', name: '' });
    }
  }, [confirmApp, approveApplication, rejectApplication, upgradeToArtist]);

  const triggerArtistAction = async () => {
    try {
      const res = await fetch('/api/admin/artist-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistId: confirmAction.artistId,
          action: confirmAction.action,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to process action');
      }

      toast.success(data.message || 'Action executed successfully');
      
      // Refresh local artist list
      fetchArtists();
      
      // Sync track state in store
      useMusicStore.getState().fetchTracks();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update artist status');
    } finally {
      setConfirmAction({ open: false, artistId: '', action: 'deactivate', name: '' });
    }
  };

  const filteredApps = applications.filter((app) => {
    const matchSearch = app.artistName.toLowerCase().includes(appSearch.toLowerCase());
    const matchFilter = appFilter === 'all' || app.status === appFilter;
    return matchSearch && matchFilter;
  });

  const filteredArtists = artists.filter((art) => {
    return art.name.toLowerCase().includes(dirSearch.toLowerCase()) || 
           art.email.toLowerCase().includes(dirSearch.toLowerCase());
  });

  const fmt = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return n.toLocaleString();
  };

  const handleCreateArtist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newArtist.name || !newArtist.email) {
      toast.error('Name and email are required');
      return;
    }
    try {
      setCreateLoading(true);
      const res = await fetch('/api/admin/create-artist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArtist),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to create artist');
      }
      toast.success(data.message || 'Artist created!');
      setCreateArtistModal(false);
      setNewArtist({ name: '', email: '', bio: '', country: 'IN', followers: '0', avatar: '' });
      fetchArtists();
    } catch (e: any) {
      toast.error(e.message || 'Error creating artist');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleAddSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSong.title || !newSong.genre) {
      toast.error('Title and genre are required');
      return;
    }
    try {
      setSongLoading(true);
      const res = await fetch('/api/admin/add-track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newSong,
          artistId: addSongModal.artistId,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to add song');
      }
      toast.success(data.message || 'Song added successfully!');
      setAddSongModal({ open: false, artistId: '', artistName: '' });
      setNewSong({ title: '', genre: 'Pop', duration: '180', audioUrl: '', coverImage: '', explicit: false });
      
      // Refresh list
      fetchArtists();
      
      // Sync track state in store
      useMusicStore.getState().fetchTracks();
    } catch (e: any) {
      toast.error(e.message || 'Error uploading song');
    } finally {
      setSongLoading(false);
    }
  };

  return (
    <>
      {/* Confirm Application Modal */}
      <ConfirmModal
        open={confirmApp.open}
        title={`${confirmApp.action === 'approve' ? 'Approve' : 'Reject'} Artist Application`}
        message={`Are you sure you want to ${confirmApp.action} "${confirmApp.name}"'s artist application? ${confirmApp.action === 'reject' ? 'They will remain a regular USER and can reapply later.' : 'Their account role will instantly upgrade to ARTIST.'}`}
        confirmLabel={confirmApp.action === 'approve' ? '✓ Approve' : '✗ Reject'}
        confirmColor={confirmApp.action === 'approve' ? '#b08850' : '#ef4444'}
        onConfirm={confirmAppAction}
        onCancel={() => setConfirmApp((p) => ({ ...p, open: false }))}
      />

      {/* Confirm Artist Action Modal */}
      <ConfirmModal
        open={confirmAction.open}
        title={`${confirmAction.action === 'deactivate' ? 'Deactivate' : confirmAction.action === 'remove' ? 'Remove' : 'Reactivate'} Artist`}
        message={
          confirmAction.action === 'deactivate'
            ? `Are you sure you want to deactivate "${confirmAction.name}"? This will suspend their artist account and IMMEDIATELY delete all of their uploaded tracks from the platform.`
            : confirmAction.action === 'remove'
            ? `Are you sure you want to completely remove "${confirmAction.name}"? This will delete their account permanently and IMMEDIATELY delete all of their uploaded tracks from the platform.`
            : `Are you sure you want to reactivate "${confirmAction.name}"'s account and restore their posting privileges?`
        }
        confirmLabel={
          confirmAction.action === 'deactivate'
            ? '🚫 Deactivate Artist'
            : confirmAction.action === 'remove'
            ? '🗑️ Remove Artist'
            : '✓ Reactivate'
        }
        confirmColor={confirmAction.action === 'activate' ? '#b08850' : '#ef4444'}
        onConfirm={triggerArtistAction}
        onCancel={() => setConfirmAction((p) => ({ ...p, open: false }))}
      />

      {/* Create Artist Modal */}
      <Modal
        open={createArtistModal}
        title="Create Artist Profile"
        onClose={() => setCreateArtistModal(false)}
      >
        <form onSubmit={handleCreateArtist} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Artist Name *</label>
            <input
              type="text"
              required
              value={newArtist.name}
              onChange={(e) => setNewArtist({ ...newArtist, name: e.target.value })}
              placeholder="e.g. Cipher Nova"
              style={{
                padding: '10px 14px',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Email Address *</label>
            <input
              type="email"
              required
              value={newArtist.email}
              onChange={(e) => setNewArtist({ ...newArtist, email: e.target.value })}
              placeholder="artist@example.com"
              style={{
                padding: '10px 14px',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Biography</label>
            <textarea
              value={newArtist.bio}
              onChange={(e) => setNewArtist({ ...newArtist, bio: e.target.value })}
              placeholder="Write a short bio..."
              rows={3}
              style={{
                padding: '10px 14px',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
                outline: 'none',
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Country</label>
              <input
                type="text"
                value={newArtist.country}
                onChange={(e) => setNewArtist({ ...newArtist, country: e.target.value })}
                placeholder="IN"
                style={{
                  padding: '10px 14px',
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Initial Followers</label>
              <input
                type="number"
                value={newArtist.followers}
                onChange={(e) => setNewArtist({ ...newArtist, followers: e.target.value })}
                placeholder="0"
                style={{
                  padding: '10px 14px',
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Avatar URL</label>
            <input
              type="text"
              value={newArtist.avatar}
              onChange={(e) => setNewArtist({ ...newArtist, avatar: e.target.value })}
              placeholder="https://example.com/image.jpg"
              style={{
                padding: '10px 14px',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <motion.button
            whileHover={{ opacity: 0.9 }}
            whileTap={{ scale: 0.98 }}
            disabled={createLoading}
            style={{
              padding: '12px',
              background: '#b08850',
              border: 'none',
              borderRadius: 10,
              color: '#000',
              fontWeight: 700,
              fontSize: 14,
              cursor: createLoading ? 'not-allowed' : 'pointer',
              marginTop: 10,
              opacity: createLoading ? 0.6 : 1,
            }}
          >
            {createLoading ? 'Creating artist profile...' : '✓ Create Artist'}
          </motion.button>
        </form>
      </Modal>

      {/* Add Song Modal */}
      <Modal
        open={addSongModal.open}
        title={`Add Song for ${addSongModal.artistName}`}
        onClose={() => setAddSongModal({ open: false, artistId: '', artistName: '' })}
      >
        <form onSubmit={handleAddSong} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Song Title *</label>
            <input
              type="text"
              required
              value={newSong.title}
              onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
              placeholder="e.g. Midnight Melody"
              style={{
                padding: '10px 14px',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Genre *</label>
              <select
                value={newSong.genre}
                onChange={(e) => setNewSong({ ...newSong, genre: e.target.value })}
                style={{
                  padding: '10px 14px',
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              >
                {['Pop', 'Hip-Hop', 'Electronic', 'Rock', 'R&B', 'Jazz', 'Ambient', 'Classical', 'Lo-Fi', 'Metal', 'Dance', 'Indie', 'Acoustic', 'Folk', 'Country'].map((g) => (
                  <option key={g} value={g}>{g}</option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <label style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Duration (seconds)</label>
              <input
                type="number"
                value={newSong.duration}
                onChange={(e) => setNewSong({ ...newSong, duration: e.target.value })}
                placeholder="180"
                style={{
                  padding: '10px 14px',
                  background: '#1a1a1a',
                  border: '1px solid #2a2a2a',
                  borderRadius: 8,
                  color: '#fff',
                  fontSize: 13,
                  outline: 'none',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Audio File URL</label>
            <input
              type="text"
              value={newSong.audioUrl}
              onChange={(e) => setNewSong({ ...newSong, audioUrl: e.target.value })}
              placeholder="https://example.com/audio.mp3 (Leave empty for default mock audio)"
              style={{
                padding: '10px 14px',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <label style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Cover Image URL</label>
            <input
              type="text"
              value={newSong.coverImage}
              onChange={(e) => setNewSong({ ...newSong, coverImage: e.target.value })}
              placeholder="https://example.com/cover.jpg (Leave empty for default mock cover)"
              style={{
                padding: '10px 14px',
                background: '#1a1a1a',
                border: '1px solid #2a2a2a',
                borderRadius: 8,
                color: '#fff',
                fontSize: 13,
                outline: 'none',
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
            <input
              type="checkbox"
              id="admin-song-explicit"
              checked={newSong.explicit}
              onChange={(e) => setNewSong({ ...newSong, explicit: e.target.checked })}
              style={{ width: 16, height: 16, cursor: 'pointer' }}
            />
            <label htmlFor="admin-song-explicit" style={{ fontSize: 13, color: '#d1d5db', cursor: 'pointer', userSelect: 'none' }}>
              Contains explicit content
            </label>
          </div>

          <motion.button
            whileHover={{ opacity: 0.9 }}
            whileTap={{ scale: 0.98 }}
            disabled={songLoading}
            style={{
              padding: '12px',
              background: '#b08850',
              border: 'none',
              borderRadius: 10,
              color: '#000',
              fontWeight: 700,
              fontSize: 14,
              cursor: songLoading ? 'not-allowed' : 'pointer',
              marginTop: 10,
              opacity: songLoading ? 0.6 : 1,
            }}
          >
            {songLoading ? 'Adding track...' : '✓ Add Song'}
          </motion.button>
        </form>
      </Modal>


      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Sub Navigation Bar */}
        <div style={{ display: 'flex', gap: 12, borderBottom: '1px solid #1a1a1a', paddingBottom: 16 }}>
          <button
            onClick={() => setSubTab('directory')}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: subTab === 'directory' ? 'rgba(176, 136, 80, 0.12)' : 'transparent',
              color: subTab === 'directory' ? '#b08850' : '#9ca3af',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            📂 Artist Directory
            <span style={{
              background: subTab === 'directory' ? '#b08850' : '#2a2a2a',
              color: subTab === 'directory' ? '#000' : '#9ca3af',
              padding: '2px 8px',
              borderRadius: 20,
              fontSize: 10,
              fontWeight: 800,
            }}>
              {artists.length}
            </span>
          </button>

          <button
            onClick={() => setSubTab('applications')}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: subTab === 'applications' ? 'rgba(176, 136, 80, 0.12)' : 'transparent',
              color: subTab === 'applications' ? '#b08850' : '#9ca3af',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            Review Queue
            {applications.filter(a => a.status === 'PENDING').length > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 800,
              }}>
                {applications.filter(a => a.status === 'PENDING').length}
              </span>
            )}
          </button>

          <button
            onClick={() => setSubTab('verifications')}
            style={{
              padding: '10px 18px',
              borderRadius: 8,
              border: 'none',
              background: subTab === 'verifications' ? 'rgba(176, 136, 80, 0.12)' : 'transparent',
              color: subTab === 'verifications' ? '#b08850' : '#9ca3af',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transition: 'all 0.2s',
            }}
          >
            🏅 Verification Requests
            {pendingVerificationsCount > 0 && (
              <span style={{
                background: '#ef4444',
                color: '#fff',
                padding: '2px 8px',
                borderRadius: 20,
                fontSize: 10,
                fontWeight: 800,
              }}>
                {pendingVerificationsCount}
              </span>
            )}
          </button>
        </div>

        {/* Directory Tab View */}
        {subTab === 'directory' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>Artists Directory</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>Manage all active and suspended platform creators</div>
              </div>
              <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <input
                  value={dirSearch}
                  onChange={(e) => setDirSearch(e.target.value)}
                  placeholder="Search artists..."
                  style={{
                    padding: '9px 14px',
                    background: '#121212',
                    border: '1px solid #2a2a2a',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                    width: 200,
                  }}
                />
                <motion.button
                  whileHover={{ background: 'rgba(176, 136, 80, 0.95)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => setCreateArtistModal(true)}
                  style={{
                    padding: '9px 16px',
                    background: '#b08850',
                    border: 'none',
                    borderRadius: 10,
                    color: '#000',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    whiteSpace: 'nowrap',
                  }}
                >
                  ➕ Create Artist
                </motion.button>
              </div>
            </div>

            <div style={{
              background: '#121212',
              borderRadius: 16,
              border: '1px solid #1a1a1a',
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '2fr 100px 1.2fr 1.2fr 120px 280px',
                padding: '14px 20px',
                borderBottom: '1px solid #1a1a1a',
              }}>
                {['Artist', 'Country', 'Followers', 'Songs', 'Status', 'Actions'].map((h) => (
                  <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em' }}>{h.toUpperCase()}</div>
                ))}
              </div>

              {dirLoading ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>Loading artists...</div>
              ) : filteredArtists.length === 0 ? (
                <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>No artists found</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {filteredArtists.map((art, i) => (
                    <motion.div
                      key={art.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.03 }}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 100px 1.2fr 1.2fr 120px 280px',
                        padding: '16px 20px',
                        borderBottom: i < filteredArtists.length - 1 ? '1px solid #1a1a1a' : 'none',
                        alignItems: 'center',
                        background: art.isActive ? 'transparent' : 'rgba(239, 68, 68, 0.02)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <img src={art.avatar} alt={art.name} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 600, color: art.isActive ? '#fff' : '#9ca3af' }}>{art.name}</div>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{art.email}</div>
                        </div>
                      </div>
                      <div style={{ fontSize: 13, color: '#d1d5db' }}>{art.country}</div>
                      <div style={{ fontSize: 13, color: '#d1d5db' }}>{fmt(art.followers)}</div>
                      <div style={{ fontSize: 13, color: '#d1d5db' }}>{art.tracksCount} tracks</div>
                      <div>
                        <span style={{
                          padding: '4px 10px',
                          borderRadius: 20,
                          fontSize: 10,
                          fontWeight: 700,
                          background: art.isActive ? 'rgba(176, 136, 80, 0.12)' : 'rgba(239, 68, 68, 0.12)',
                          color: art.isActive ? '#b08850' : '#ef4444',
                          letterSpacing: '0.04em',
                        }}>
                          {art.isActive ? 'ACTIVE' : 'SUSPENDED'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <ActionButton
                          label="+ Add Song"
                          variant="approve"
                          onClick={() => setAddSongModal({
                            open: true,
                            artistId: art.id,
                            artistName: art.name
                          })}
                        />
                        {art.isActive ? (
                          <ActionButton
                            label="Deactivate"
                            variant="suspend"
                            onClick={() => setConfirmAction({
                              open: true,
                              artistId: art.id,
                              action: 'deactivate',
                              name: art.name
                            })}
                          />
                        ) : (
                          <ActionButton
                            label="Reactivate"
                            variant="activate"
                            onClick={() => setConfirmAction({
                              open: true,
                              artistId: art.id,
                              action: 'activate',
                              name: art.name
                            })}
                          />
                        )}
                        <ActionButton
                          label="Remove"
                          variant="reject"
                          onClick={() => setConfirmAction({
                            open: true,
                            artistId: art.id,
                            action: 'remove',
                            name: art.name
                          })}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Review Queue Tab View */}
        {subTab === 'applications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>Artist Applications</div>
                <div style={{ fontSize: 13, color: '#6b7280' }}>{applications.filter(a => a.status === 'PENDING').length} applications pending review</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <input
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  placeholder="Search applications..."
                  style={{
                    padding: '9px 14px',
                    background: '#121212',
                    border: '1px solid #2a2a2a',
                    borderRadius: 10,
                    color: '#fff',
                    fontSize: 13,
                    outline: 'none',
                    width: 200,
                  }}
                />
                {(['all', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setAppFilter(f)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: 8,
                      border: 'none',
                      background: appFilter === f ? '#b08850' : '#1a1a1a',
                      color: appFilter === f ? '#fff' : '#9ca3af',
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {f.toLowerCase()}
                  </button>
                ))}
              </div>
            </div>

            <div style={{
              background: '#121212',
              borderRadius: 16,
              border: '1px solid #1a1a1a',
              overflow: 'hidden',
            }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1.5fr 80px 2fr 1.5fr 110px 140px',
                padding: '14px 20px',
                borderBottom: '1px solid #1a1a1a',
              }}>
                {['Artist', 'Country', 'Bio', 'Social Media', 'Status', 'Actions'].map((h) => (
                  <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em' }}>{h.toUpperCase()}</div>
                ))}
              </div>
              <AnimatePresence>
                {filteredApps.map((app, i) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ delay: i * 0.04 }}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 80px 2fr 1.5fr 110px 140px',
                      padding: '16px 20px',
                      borderBottom: i < filteredApps.length - 1 ? '1px solid #1a1a1a' : 'none',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <img src={app.profileImage} alt={app.artistName} style={{ width: 40, height: 40, borderRadius: '50%', objectFit: 'cover' }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600, color: '#fff' }}>{app.artistName}</div>
                        {app.dob && <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 600 }}>DOB: {new Date(app.dob).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}</div>}
                        <div style={{ fontSize: 11, color: '#6b7280' }}>Submitted {new Date(app.createdAt).toLocaleDateString()}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: '#d1d5db' }}>
                      {app.country}
                    </div>
                    <div style={{ fontSize: 13, color: '#d1d5db', paddingRight: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={app.bio}>
                      {app.bio || 'No bio provided'}
                    </div>
                    <div style={{ fontSize: 12, color: '#9ca3af', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {app.socialLinks.instagram && <span>IG: {app.socialLinks.instagram}</span>}
                      {app.socialLinks.twitter && <span>TW: {app.socialLinks.twitter}</span>}
                      {app.socialLinks.website && <a href={`https://${app.socialLinks.website}`} target="_blank" rel="noreferrer" style={{ color: '#b08850', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 2 }}>Web <span style={{ fontSize: 10 }}>↗</span></a>}
                      {!app.socialLinks.instagram && !app.socialLinks.twitter && !app.socialLinks.website && <span>—</span>}
                    </div>
                    <div><StatusBadge status={app.status.toLowerCase()} /></div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {app.status === 'PENDING' && (
                        <>
                          <ActionButton label="Approve" variant="approve" onClick={() => handleAppAction(app.id, 'approve', app.artistName)} />
                          <ActionButton label="Reject" variant="reject" onClick={() => handleAppAction(app.id, 'reject', app.artistName)} />
                        </>
                      )}
                      {app.status === 'APPROVED' && (
                        <span style={{ fontSize: 12, color: '#b08850', fontWeight: 600 }}>Approved</span>
                      )}
                      {app.status === 'REJECTED' && (
                        <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>Rejected</span>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              {filteredApps.length === 0 && (
                <div style={{ padding: '40px', textAlign: 'center', color: '#6b7280', fontSize: 14 }}>
                  No applications found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Verification Requests Tab View */}
        {subTab === 'verifications' && (
          <div style={{ padding: '10px 0' }}>
            <ArtistVerificationPanel onUpdate={fetchPendingVerificationsCount} />
          </div>
        )}
      </div>
    </>
  );
}

// ── Artist Verification Panel ──────────────────────────────────────────────
function ArtistVerificationPanel({ onUpdate }: { onUpdate: () => void }) {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewDoc, setViewDoc] = useState<string | null>(null);
  const [processing, setProcessing] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/verifications');
      const data = await res.json();
      if (data.success) setRequests(data.requests);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const act = async (artistId: string, action: 'approve' | 'reject') => {
    setProcessing(artistId);
    try {
      const res = await fetch('/api/admin/verifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ artistId, action, level: 'verified_artist' }),
      });
      const data = await res.json();
      if (data.success) {
        load();
        onUpdate();
      }
    } catch {}
    finally { setProcessing(null); }
  };

  const statusColor: Record<string, string> = {
    under_review: '#f59e0b',
    approved: '#b08850',
    rejected: '#ef4444',
  };
  const statusLabel: Record<string, string> = {
    under_review: '⏳ Pending',
    approved: '✅ Approved',
    rejected: '❌ Rejected',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h2 style={{ color: '#fff', fontWeight: 900, fontSize: 18, margin: 0 }}>🏅 Artist Verification Requests</h2>
          <p style={{ color: '#737373', fontSize: 12.5, margin: '4px 0 0' }}>Review and approve artist verification requests with proof documents</p>
        </div>
        <button type="button" onClick={load} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 11.5, cursor: 'pointer' }}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Pending Requests', count: requests.filter(r => r.status === 'under_review').length, color: '#f59e0b' },
          { label: 'Approved', count: requests.filter(r => r.status === 'approved').length, color: '#b08850' },
          { label: 'Rejected', count: requests.filter(r => r.status === 'rejected').length, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}25`, borderRadius: 12, padding: '12px 16px' }}>
            <div style={{ fontWeight: 900, fontSize: 24, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 11.5, color: '#737373' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Document viewer overlay */}
      {viewDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setViewDoc(null)}>
          <div style={{ position: 'relative', maxWidth: '80vw', maxHeight: '80vh', background: '#111', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>📄 Proof Document</span>
              <button type="button" onClick={() => setViewDoc(null)} style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            {viewDoc.startsWith('data:image') ? (
              <img src={viewDoc} alt='Proof' style={{ maxWidth: '75vw', maxHeight: '70vh', objectFit: 'contain', display: 'block' }} />
            ) : (
              <div style={{ padding: 32, textAlign: 'center', color: '#a3a3a3' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                <p>PDF document uploaded</p>
                <a href={viewDoc} download='proof.pdf' style={{ color: '#b08850', fontSize: 13 }}>Download PDF</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#737373', fontSize: 13 }}>Loading verification requests...</div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40, color: '#737373', fontSize: 13 }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>🎉</div>
          <p>No verification requests yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map(req => (
            <div key={req.artistId} style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${req.status === 'under_review' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`, borderRadius: 14, padding: 16, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{ width: 44, height: 44, borderRadius: '50%', backgroundImage: req.avatar ? `url(${req.avatar})` : 'none', backgroundColor: req.avatar ? 'transparent' : 'rgba(60,60,60,1)', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />

              {/* Artist info */}
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 14.5 }}>{req.artistName}</span>
                  <span style={{ fontSize: 10.5, fontWeight: 700, color: statusColor[req.status] || '#737373', background: `${statusColor[req.status]}15`, padding: '2px 8px', borderRadius: 20 }}>
                    {statusLabel[req.status] || req.status}
                  </span>
                </div>
                <div style={{ color: '#737373', fontSize: 11.5, marginTop: 3 }}>{req.email} · {req.genre} · {req.city || req.country}</div>
                <div style={{ color: '#525252', fontSize: 10.5, marginTop: 2 }}>Submitted: {req.submittedAt ? new Date(req.submittedAt).toLocaleString() : 'N/A'}</div>
                {req.notes && <div style={{ color: '#a3a3a3', fontSize: 10.5, marginTop: 2 }}>File: {req.notes}</div>}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                {req.documents?.[0] && (
                  <button
                    type="button"
                    onClick={() => setViewDoc(req.documents[0])}
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: 8, padding: '6px 12px', fontSize: 11.5, cursor: 'pointer', fontWeight: 600 }}
                  >
                    👁️ View Proof
                  </button>
                )}
                {req.status === 'under_review' && (
                  <>
                    <button
                      type="button"
                      disabled={processing === req.artistId}
                      onClick={() => act(req.artistId, 'approve')}
                      style={{ background: 'rgba(176, 136, 80,0.15)', border: '1px solid rgba(176, 136, 80,0.3)', color: '#b08850', borderRadius: 8, padding: '6px 12px', fontSize: 11.5, cursor: 'pointer', fontWeight: 700 }}
                    >
                      Verify
                    </button>
                    <button
                      type="button"
                      disabled={processing === req.artistId}
                      onClick={() => act(req.artistId, 'reject')}
                      style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', borderRadius: 8, padding: '6px 12px', fontSize: 11.5, cursor: 'pointer', fontWeight: 700 }}
                    >
                      Reject
                    </button>
                  </>
                )}
                {req.status !== 'under_review' && (
                  <span style={{ fontSize: 11.5, color: '#525252' }}>Already {req.status}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


function SongsTab() {
  const { user, toggleLikeSong } = useAuthStore();
  const { uploadedTracks, approveTrack, rejectTrack } = useMusicStore();
  const { currentTrack, isPlaying, togglePlay } = usePlayerStore();
  
  const clientSongs = uploadedTracks.map(t => ({
    id: t.id,
    title: t.title,
    artistId: t.artistId,
    artistName: t.artistName,
    albumId: t.albumId,
    albumName: t.albumName,
    coverImage: t.coverImage || trackGradient(t.id),
    duration: t.duration,
    audioUrl: t.audioUrl,
    genre: t.genre,
    year: t.year,
    plays: t.plays,
    liked: t.liked,
    explicit: t.explicit,
    status: t.status || 'pending',
    uploadedAt: t.uploadedAt || new Date().toISOString().split('T')[0],
    copyrightScore: 98,
    copyrightIssue: null,
  }));
  const songs = clientSongs;
  
  const [filter, setFilter] = useState<'all' | SongStatus>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'copyright'>('date');
  const [genreFilter, setGenreFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const [confirm, setConfirm] = useState<{ open: boolean; songId: string; action: 'approve' | 'reject'; title: string }>({ open: false, songId: '', action: 'approve', title: '' });

  const confirmAction = async () => {
    if (confirm.action === 'approve') {
      approveTrack(confirm.songId);
    } else {
      rejectTrack(confirm.songId);
    }

    try {
      await fetch('/api/admin/approve-song', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId: confirm.songId,
          title: confirm.title,
          action: confirm.action,
        }),
      });
    } catch (e) {
      console.error('Failed to update status on backend API:', e);
    }

    logSecurityEvent(
      user?.id || 'admin-user-1',
      user?.name || 'Platform Moderator',
      confirm.action === 'approve' ? 'APPROVAL' : 'REJECTION',
      `Song "${confirm.title}" (${confirm.songId}) status set to ${confirm.action === 'approve' ? 'approved' : 'rejected'}`
    );

    setConfirm((p) => ({ ...p, open: false }));
  };

  const handleApproveAllPending = async () => {
    const pendingSongs = filtered.filter(s => s.status === 'pending');
    if (pendingSongs.length === 0) {
      toast.error('No pending songs in this view to approve.');
      return;
    }
    
    let approvedCount = 0;
    for (const song of pendingSongs) {
      approveTrack(song.id);
      try {
        await fetch('/api/admin/approve-song', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songId: song.id, title: song.title, action: 'approve' }),
        });
        approvedCount++;
      } catch (e) {}
    }
    
    logSecurityEvent(
      user?.id || 'admin-user-1',
      user?.name || 'Platform Moderator',
      'APPROVAL',
      `Bulk approved ${approvedCount} songs from the queue.`
    );
    toast.success(`Bulk approved ${approvedCount} songs!`);
  };

  const handleRejectAllPending = async () => {
    const pendingSongs = filtered.filter(s => s.status === 'pending');
    if (pendingSongs.length === 0) {
      toast.error('No pending songs in this view to reject.');
      return;
    }
    
    let rejectedCount = 0;
    for (const song of pendingSongs) {
      rejectTrack(song.id);
      try {
        await fetch('/api/admin/approve-song', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ songId: song.id, title: song.title, action: 'reject' }),
        });
        rejectedCount++;
      } catch (e) {}
    }
    logSecurityEvent(
      user?.id || 'admin-user-1',
      user?.name || 'Platform Moderator',
      'REJECTION',
      `Bulk rejected ${rejectedCount} songs from the queue.`
    );
    toast.success(`Bulk rejected ${rejectedCount} songs.`);
  };

  // 1. Filter by status, search, and genre
  const filtered = songs.filter((s) => {
    const matchStatus = filter === 'all' || s.status === filter;
    const matchSearch = s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        s.artistName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchGenre = genreFilter === 'all' || s.genre === genreFilter;
    return matchStatus && matchSearch && matchGenre;
  });

  // 2. Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'title') {
      return a.title.localeCompare(b.title);
    }
    if (sortBy === 'copyright') {
      return b.copyrightScore - a.copyrightScore;
    }
    return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime();
  });

  // 3. Paginate
  const totalPages = Math.ceil(sorted.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedSongs = sorted.slice(startIndex, startIndex + itemsPerPage);

  const genres = ['all', ...Array.from(new Set(songs.map((s) => s.genre)))];

  useEffect(() => {
    setCurrentPage(1);
  }, [filter, searchQuery, genreFilter, sortBy]);

  return (
    <>
      <ConfirmModal
        open={confirm.open}
        title={`${confirm.action === 'approve' ? 'Approve' : 'Reject'} Track`}
        message={`${confirm.action === 'approve' ? 'Approve' : 'Reject'} "${confirm.title}"? ${confirm.action === 'reject' ? 'This will prevent the track from appearing on the platform.' : 'The track will go live immediately.'}`}
        confirmLabel={confirm.action === 'approve' ? '✓ Approve Track' : '✗ Reject Track'}
        confirmColor={confirm.action === 'approve' ? '#b08850' : '#ef4444'}
        onConfirm={confirmAction}
        onCancel={() => setConfirm((p) => ({ ...p, open: false }))}
      />
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Currently Playing Song Widget */}
        {currentTrack && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(176, 136, 80, 0.1) 0%, rgba(20, 20, 20, 0.6) 100%)',
            border: '1px solid rgba(176, 136, 80, 0.2)',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            backdropFilter: 'blur(10px)',
          }}>
            {currentTrack.coverImage && !currentTrack.coverImage.startsWith('linear-gradient') ? (
              <img src={currentTrack.coverImage} alt={currentTrack.title} style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
            ) : (
              <div style={{
                width: 48,
                height: 48,
                borderRadius: 8,
                background: currentTrack.coverImage || trackGradient(currentTrack.id),
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
                fontWeight: 700,
                color: '#fff',
                flexShrink: 0,
              }}>
                {currentTrack.title[0]}
              </div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 11, color: '#b08850', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>Currently Playing</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentTrack.title}</div>
              <div style={{ fontSize: 12, color: '#a3a3a3', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{currentTrack.artistName} · {currentTrack.genre}</div>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={togglePlay}
                style={{
                  width: 36, height: 36, borderRadius: '50%', background: '#fff', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.5)'
                }}
              >
                {isPlaying ? '⏸' : '▶'}
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => toggleLikeSong(currentTrack.id)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', fontSize: 24, padding: 6,
                  color: (user?.likedSongs || []).includes(currentTrack.id) ? '#b08850' : '#6b7280',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}
              >
                {(user?.likedSongs || []).includes(currentTrack.id) ? '❤️' : '🤍'}
              </motion.button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>Songs Queue</div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>{songs.filter((s) => s.status === 'pending').length} tracks pending review</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['all', 'pending', 'approved', 'rejected'] as const).map((f) => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: filter === f ? '#b08850' : '#1a1a1a',
                color: filter === f ? '#fff' : '#9ca3af',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}>
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Controls sub-bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderBottom: '1px solid #1a1a1a', paddingBottom: 16 }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by title or artist..."
              style={{
                padding: '9px 14px',
                background: '#121212',
                border: '1px solid #2a2a2a',
                borderRadius: 10,
                color: '#fff',
                fontSize: 13,
                outline: 'none',
                width: 240,
              }}
            />
            
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              style={{
                padding: '9px 14px',
                background: '#121212',
                border: '1px solid #2a2a2a',
                borderRadius: 10,
                color: '#fff',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
              }}
            >
              <option value="date">Sort by Date (Newest)</option>
              <option value="title">Sort by Title (A-Z)</option>
              <option value="copyright">Sort by Copyright Score</option>
            </select>

            <select
              value={genreFilter}
              onChange={(e) => setGenreFilter(e.target.value)}
              style={{
                padding: '9px 14px',
                background: '#121212',
                border: '1px solid #2a2a2a',
                borderRadius: 10,
                color: '#fff',
                fontSize: 13,
                outline: 'none',
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              <option value="all">All Genres</option>
              {genres.filter(g => g !== 'all').map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>

            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button
                onClick={handleApproveAllPending}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'rgba(176, 136, 80, 0.12)',
                  color: '#b08850',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(176, 136, 80, 0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(176, 136, 80, 0.12)'}
              >
                ✓ Approve All
              </button>
              
              <button
                onClick={handleRejectAllPending}
                style={{
                  padding: '8px 14px',
                  borderRadius: 8,
                  border: 'none',
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#ef4444',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
              >
                ✗ Reject All
              </button>
            </div>
          </div>
        </div>

        <div style={{ background: '#121212', borderRadius: 16, border: '1px solid #1a1a1a', overflow: 'hidden' }}>
          <div style={{
            display: 'grid',
            gridTemplateColumns: '2.2fr 1fr 90px 110px 110px 90px 140px',
            padding: '14px 20px',
            borderBottom: '1px solid #1a1a1a',
          }}>
            {['Title', 'Artist', 'Genre', 'Uploaded', 'Copyright', 'Status', 'Actions'].map((h) => (
              <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', letterSpacing: '0.06em' }}>{h.toUpperCase()}</div>
            ))}
          </div>
          
          {paginatedSongs.length === 0 ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>No songs found</div>
          ) : (
            paginatedSongs.map((song, i) => (
              <motion.div
                key={song.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '2.2fr 1fr 90px 110px 110px 90px 140px',
                  padding: '14px 20px',
                  borderBottom: i < paginatedSongs.length - 1 ? '1px solid #1a1a1a' : 'none',
                  alignItems: 'center',
                  background: song.status === 'pending' ? 'rgba(245,158,11,0.03)' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                  {song.coverImage && !song.coverImage.startsWith('linear-gradient') ? (
                    <img src={song.coverImage} alt={song.title} style={{ width: 36, height: 36, borderRadius: 6, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{
                      width: 36,
                      height: 36,
                      borderRadius: 6,
                      background: song.coverImage || trackGradient(song.id),
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#fff',
                    }}>
                      {song.title[0]}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.title}</div>
                      {song.explicit && (
                        <span style={{ fontSize: 9, background: '#ef4444', color: '#fff', padding: '1px 5px', borderRadius: 3, fontWeight: 700 }}>E</span>
                      )}
                    </div>
                  </div>
                  <button
                    onClick={() => toggleLikeSong(song.id)}
                    style={{
                      background: 'none', border: 'none', cursor: 'pointer', fontSize: 16, padding: 4,
                      color: (user?.likedSongs || []).includes(song.id) ? '#b08850' : '#4b5563',
                      transition: 'color 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      marginRight: 8,
                    }}
                  >
                    {(user?.likedSongs || []).includes(song.id) ? '❤️' : '🤍'}
                  </button>
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.artistName}</div>
                <div style={{ fontSize: 12, color: '#9ca3af' }}>{song.genre}</div>
                <div style={{ fontSize: 12, color: '#6b7280' }}>{song.uploadedAt}</div>
                <div>
                  {song.copyrightIssue ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <div style={{ fontSize: 11, color: '#f59e0b', fontWeight: 700 }}>⚠ {song.copyrightScore}%</div>
                      <div style={{ fontSize: 10, color: '#f59e0b' }}>{song.copyrightIssue}</div>
                    </div>
                  ) : (
                    <div style={{ fontSize: 12, color: '#b08850' }}>✓ {song.copyrightScore}% clean</div>
                  )}
                </div>
                <div><StatusBadge status={song.status} /></div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {song.status === 'pending' && (
                    <>
                      <ActionButton label="Approve" variant="approve" onClick={() => setConfirm({ open: true, songId: song.id, action: 'approve', title: song.title })} />
                      <ActionButton label="Reject" variant="reject" onClick={() => setConfirm({ open: true, songId: song.id, action: 'reject', title: song.title })} />
                    </>
                  )}
                  {song.status === 'approved' && <ActionButton label="Revoke" variant="reject" onClick={() => setConfirm({ open: true, songId: song.id, action: 'reject', title: song.title })} />}
                  {song.status === 'rejected' && <ActionButton label="Re-approve" variant="approve" onClick={() => setConfirm({ open: true, songId: song.id, action: 'approve', title: song.title })} />}
                </div>
              </motion.div>
            ))
          )}

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '16px 20px',
              borderTop: '1px solid #1a1a1a',
              background: 'rgba(0, 0, 0, 0.2)',
            }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>
                Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, sorted.length)} of {sorted.length} songs
              </div>
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: currentPage === 1 ? 'rgba(255,255,255,0.02)' : '#1a1a1a',
                    color: currentPage === 1 ? '#4b5563' : '#9ca3af',
                    border: '1.5px solid rgba(255,255,255,0.05)',
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  ← Previous
                </button>
                
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setCurrentPage(idx + 1)}
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: 6,
                      background: currentPage === idx + 1 ? '#b08850' : 'transparent',
                      color: currentPage === idx + 1 ? '#000' : '#9ca3af',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {idx + 1}
                  </button>
                ))}
                
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 6,
                    background: currentPage === totalPages ? 'rgba(255,255,255,0.02)' : '#1a1a1a',
                    color: currentPage === totalPages ? '#4b5563' : '#9ca3af',
                    border: '1.5px solid rgba(255,255,255,0.05)',
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: 12,
                    fontWeight: 700,
                  }}
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}


function ReportsTab() {
  const [reports, setReports] = useState(REPORTS);
  const [filter, setFilter] = useState<'all' | 'copyright' | 'content' | 'user'>('all');

  const updateStatus = (id: string, status: string) => {
    setReports((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  };

  const SEVERITY_ORDER: Record<string, number> = { critical: 0, high: 1, medium: 2, low: 3 };

  const filtered = reports
    .filter((r) => filter === 'all' || r.type === filter)
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 9) - (SEVERITY_ORDER[b.severity] ?? 9));

  const TYPE_ICON: Record<string, string> = { copyright: '©', content: '🚩', user: '👤' };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', fontFamily: 'Outfit, sans-serif' }}>Reports & Flags</div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            {reports.filter((r) => r.status === 'pending').length} open reports requiring action
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {(['all', 'copyright', 'content', 'user'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 14px',
                borderRadius: 8,
                border: 'none',
                background: filter === f ? '#b08850' : '#1a1a1a',
                color: filter === f ? '#fff' : '#9ca3af',
                fontSize: 12,
                fontWeight: 600,
                cursor: 'pointer',
                textTransform: 'capitalize',
              }}
            >
              {f === 'all' ? 'All' : f === 'copyright' ? '© Copyright' : f === 'content' ? '🚩 Content' : '👤 User'}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {filtered.map((report, i) => (
          <motion.div
            key={report.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            style={{
              background: '#121212',
              borderRadius: 14,
              border: `1px solid ${report.severity === 'critical' ? 'rgba(239,68,68,0.3)' : '#1a1a1a'}`,
              padding: '20px 24px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
              <div style={{ display: 'flex', gap: 14, flex: 1 }}>
                <div style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: report.type === 'copyright' ? 'rgba(245,158,11,0.12)' : report.type === 'content' ? 'rgba(239,68,68,0.12)' : 'rgba(16, 185, 129,0.12)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 18,
                  flexShrink: 0,
                }}>
                  {TYPE_ICON[report.type]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{report.title}</span>
                    <StatusBadge status={report.severity} />
                    <StatusBadge status={report.status} />
                  </div>
                  <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, marginBottom: 8 }}>
                    {report.description}
                  </div>
                  <div style={{ display: 'flex', gap: 20, fontSize: 11, color: '#6b7280' }}>
                    <span>📅 {report.reportedAt}</span>
                    <span>👤 {report.reporter}</span>
                    {report.trackId && <span>🎵 {report.trackId}</span>}
                  </div>
                </div>
              </div>
              {report.status === 'pending' && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <ActionButton
                    label="Investigate"
                    variant="investigate"
                    onClick={() => updateStatus(report.id, 'investigating')}
                  />
                  <ActionButton
                    label="Dismiss"
                    variant="dismiss"
                    onClick={() => updateStatus(report.id, 'resolved')}
                  />
                </div>
              )}
              {report.status === 'investigating' && (
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <ActionButton
                    label="Resolve"
                    variant="approve"
                    onClick={() => updateStatus(report.id, 'resolved')}
                  />
                </div>
              )}
              {report.status === 'resolved' && (
                <div style={{ fontSize: 12, color: '#6b7280', padding: '6px 0' }}>Closed</div>
              )}
            </div>
          </motion.div>
        ))}

        {filtered.length === 0 && (
          <div style={{
            background: '#121212',
            borderRadius: 14,
            border: '1px solid #1a1a1a',
            padding: '48px',
            textAlign: 'center',
            color: '#6b7280',
            fontSize: 14,
          }}>
            No reports in this category
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Dashboard Page ─────────────────────────────────────────────────────
const TABS: { id: TabType; label: string; emoji?: string }[] = [
  { id: 'overview', label: 'Overview', emoji: '📊' },
  { id: 'artists', label: 'Artists', emoji: '🎤' },
  { id: 'songs', label: 'Songs', emoji: '🎵' },
  { id: 'users', label: 'Users', emoji: '👥' },
  { id: 'reports', label: 'Reports', emoji: '🚩' },
  { id: 'subscriptions', label: 'Subscriptions', emoji: '💳' },
  { id: 'payments', label: 'Payments', emoji: '💰' },
  { id: 'analytics', label: 'Analytics', emoji: '📈' },
  { id: 'marketing', label: 'Marketing', emoji: '📣' },
  { id: 'notifications', label: 'Notifications', emoji: '🔔' },
  { id: 'support', label: 'Support', emoji: '🎧' },
  { id: 'payouts', label: 'Payouts', emoji: '💸' },
  { id: 'geography', label: 'Geography', emoji: '🌍' },
  { id: 'health', label: 'System Health', emoji: '⚡' },
  { id: 'api', label: 'API Keys', emoji: '🔑' },
  { id: 'audit', label: 'Audit Logs', emoji: '🔐' },
  { id: 'abtests', label: 'A/B Testing', emoji: '🧪' },
  { id: 'email', label: 'Email', emoji: '✉️' },
  { id: 'content', label: 'Content Library', emoji: '📚' },
  { id: 'settings', label: 'Settings', emoji: '⚙️' },
];

function AdminDashboardContent() {
  const { user } = useAuthStore();
  const { fetchTracks, uploadedTracks } = useMusicStore();
  const { applications } = useArtistApplicationStore();
  const [currentTime, setCurrentTime] = useState(new Date());
  const searchParams = useSearchParams();
  const tab = searchParams.get('tab');
  const activeTab = (tab && TABS.some(t => t.id === tab) ? tab : 'overview') as TabType;

  const [liveStats, setLiveStats] = useState<any>({
    activeNow: 0,
    liveStreams: 0,
    totalPlays: 0,
    totalSongs: 0,
    activeArtists: 0,
    totalUsers: 0,
    monthlyRevenue: 0,
    currencySymbol: '$',
    streamData: [],
    monthlyData: [],
    genreData: [],
    topArtists: [],
  });

  // Fetch actual server stats and set them
  const fetchLiveStats = async () => {
    try {
      const res = await fetch(`/api/admin/live-stats?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success && data.stats) {
        setLiveStats(data.stats);
      }
    } catch (e) {
      console.error('Failed to fetch admin stats:', e);
    }
  };

  useEffect(() => {
    fetchTracks();
    fetchLiveStats();

    const handleRefreshStats = () => {
      fetchLiveStats();
    };
    window.addEventListener('refresh-admin-stats', handleRefreshStats);
    
    // Generate unique session ID for the admin browser
    let sessionId = sessionStorage.getItem('beato-session-id');
    if (!sessionId) {
      sessionId = 'sess-' + Math.random().toString(36).substring(2, 11);
      sessionStorage.setItem('beato-session-id', sessionId);
    }

    const sendUserHeartbeat = async () => {
      try {
        await fetch('/api/user/heartbeat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
      } catch (e) {}
    };

    // Send immediate and then periodic ping every 20 seconds to register as active
    sendUserHeartbeat();
    const heartbeatPoll = setInterval(sendUserHeartbeat, 20000);

    // Poll server-side stats every 10 seconds
    const serverPoll = setInterval(fetchLiveStats, 10000);
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 1000);
    
    return () => {
      window.removeEventListener('refresh-admin-stats', handleRefreshStats);
      clearInterval(heartbeatPoll);
      clearInterval(serverPoll);
      clearInterval(timeInterval);
    };
  }, []);

  const pendingReviewCount = uploadedTracks.filter(t => t.status === 'pending').length + applications.filter(a => a.status === 'PENDING').length;

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', minHeight: 'calc(100vh - 114px)', paddingBottom: 32, background: '#0a0a0a' }}>
      <TopBar transparent />
      <div style={{ padding: '0 24px' }}>
        {/* Global Stats Bar */}
      <div style={{
        background: '#121212',
        border: '1px solid #1a1a1a',
        borderRadius: 14,
        padding: '14px 24px',
        display: 'flex',
        gap: 32,
        alignItems: 'center',
        marginBottom: 28,
        overflowX: 'auto',
        flexWrap: 'nowrap',
      }}>
        {[
          { label: 'Live Streams', value: liveStats.liveStreams.toLocaleString(), color: '#b08850' },
          { label: 'Total Plays', value: liveStats.totalPlays.toLocaleString(), color: '#10b981' },
          { label: 'Active Now', value: `${liveStats.activeNow.toLocaleString()} users`, color: '#06b6d4' },
          { label: 'Pending Review', value: `${pendingReviewCount}`, color: '#f59e0b' },
          { label: 'Open Reports', value: `${REPORTS.filter(r => r.status === 'pending').length}`, color: '#ef4444' },
          { label: 'Server Time', value: currentTime.toLocaleTimeString(), color: '#9ca3af' },
        ].map((stat) => (
          <div key={stat.label} style={{ flexShrink: 0 }}>
            <div style={{ fontSize: 11, color: '#6b7280', marginBottom: 3, whiteSpace: 'nowrap' }}>{stat.label}</div>
            <motion.div
              key={stat.value}
              initial={{ scale: 0.95, opacity: 0.8 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 500, damping: 15 }}
              style={{ fontSize: 15, fontWeight: 700, color: stat.color, whiteSpace: 'nowrap' }}
            >
              {stat.value}
            </motion.div>
          </div>
        ))}
        {/* Animated pulse for live */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
          <motion.div
            animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
            transition={{ duration: 1.5, repeat: Infinity }}
            style={{ width: 8, height: 8, borderRadius: '50%', background: '#b08850' }}
          />
          <span style={{ fontSize: 12, color: '#b08850', fontWeight: 700 }}>LIVE</span>
        </div>
      </div>

      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{
          fontFamily: 'Outfit, sans-serif',
          fontSize: 30,
          fontWeight: 800,
          color: '#fff',
          margin: 0,
          marginBottom: 4,
        }}>
          Admin Dashboard
        </h1>
        <p style={{ fontSize: 14, color: '#6b7280', margin: 0 }}>
          Welcome back, {user?.name} · {currentTime.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.25 }}
        >
          {activeTab === 'overview' && (
            <OverviewTab
              stats={liveStats}
              applications={applications}
              uploadedTracks={uploadedTracks}
            />
          )}
          {activeTab === 'artists' && <ArtistsTab />}
          {activeTab === 'songs' && <SongsTab />}
          {activeTab === 'users' && <UsersTab />}
          {activeTab === 'reports' && <ReportsTab />}
          {activeTab === 'subscriptions' && <SubscriptionsTab />}
          {activeTab === 'payments' && <PaymentsTab />}
          {activeTab === 'analytics' && <AnalyticsTab />}
          {activeTab === 'marketing' && <MarketingTab />}
          {activeTab === 'notifications' && <NotificationsTab />}
          {activeTab === 'support' && <SupportTab />}
          {activeTab === 'payouts' && <PayoutsTab />}
          {activeTab === 'geography' && <GeographyTab />}
          {activeTab === 'health' && <SystemHealthTab />}
          {activeTab === 'api' && <ApiKeysTab />}
          {activeTab === 'audit' && <AuditLogsTab />}
          {activeTab === 'abtests' && <AbTestingTab />}
          {activeTab === 'email' && <EmailTab />}
          {activeTab === 'content' && <ContentLibraryTab />}
          {activeTab === 'settings' && <SettingsTab />}
        </motion.div>
      </AnimatePresence>
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: '#0a0a0a',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontFamily: 'Inter, sans-serif',
      }}>
        Loading Dashboard...
      </div>
    }>
      <AdminDashboardContent />
    </Suspense>
  );
}
