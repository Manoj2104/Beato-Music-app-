'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Music, DollarSign, BarChart3, Shield, Bell, Settings,
  TrendingUp, TrendingDown, AlertTriangle, CheckCircle, XCircle,
  Eye, Ban, Trash2, Search, Filter, MoreHorizontal
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import TopBar from '@/components/layout/TopBar';
import { mockArtists, mockTracks } from '@/lib/mockData';
import { cn } from '@/lib/utils';

const adminStats = [
  { label: 'Total Users', value: '2.4M', change: '+12.3%', positive: true, icon: Users, color: '#1db954' },
  { label: 'Active Artists', value: '18,420', change: '+8.1%', positive: true, icon: Music, color: '#10b981' },
  { label: 'Monthly Revenue', value: '$1.2M', change: '+22.4%', positive: true, icon: DollarSign, color: '#f59e0b' },
  { label: 'Total Streams', value: '890M', change: '-1.2%', positive: false, icon: BarChart3, color: '#34d399' },
];

const userGrowthData = [
  { month: 'Jan', users: 1800000, premium: 420000 },
  { month: 'Feb', users: 1920000, premium: 480000 },
  { month: 'Mar', users: 2050000, premium: 510000 },
  { month: 'Apr', users: 2180000, premium: 560000 },
  { month: 'May', users: 2320000, premium: 620000 },
  { month: 'Jun', users: 2400000, premium: 680000 },
];

const recentUsers = [
  { name: 'Karan Mehta', email: 'karan@example.com', plan: 'premium', joined: '2h ago', status: 'active' },
  { name: 'Priya Sharma', email: 'priya@example.com', plan: 'free', joined: '4h ago', status: 'active' },
  { name: 'Alex Johnson', email: 'alex@example.com', plan: 'family', joined: '6h ago', status: 'active' },
  { name: 'Maria Garcia', email: 'maria@example.com', plan: 'student', joined: '8h ago', status: 'suspended' },
  { name: 'Wei Chen', email: 'wei@example.com', plan: 'premium', joined: '12h ago', status: 'active' },
];

const pendingReviews = [
  { type: 'Track', title: 'Midnight Pulse', artist: 'New Artist X', flag: 'Explicit content', time: '1h ago' },
  { type: 'Artist', title: 'DJ Shadow Clone', artist: '', flag: 'Copyright claim', time: '3h ago' },
  { type: 'Track', title: 'Bass Drop 2024', artist: 'BeatMaker Pro', flag: 'Spam report', time: '5h ago' },
];

const adminNavItems = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'artists', label: 'Artists', icon: Music },
  { id: 'moderation', label: 'Moderation', icon: Shield },
  { id: 'revenue', label: 'Revenue', icon: DollarSign },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminPanelPage() {
  const [activeSection, setActiveSection] = useState('overview');

  return (
    <div className="flex h-full">
      {/* Admin Sidebar */}
      <div className="w-52 bg-black/30 flex-shrink-0 flex flex-col p-4 border-r border-white/10">
        <div className="mb-6">
          <p className="text-xs font-bold text-ss-primary uppercase tracking-widest">Admin Panel</p>
          <p className="text-xs text-ss-text-muted mt-0.5">Beato v1.0</p>
        </div>
        <nav className="space-y-1 flex-1">
          {adminNavItems.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left',
                activeSection === id
                  ? 'bg-ss-primary/20 text-ss-primary'
                  : 'text-ss-text-muted hover:text-white hover:bg-white/5'
              )}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </nav>
        <div className="pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 px-2">
            <div className="w-2 h-2 rounded-full bg-ss-primary animate-pulse" />
            <span className="text-xs text-ss-text-muted">All systems operational</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <TopBar />
        <div className="px-6 pb-8">
          {activeSection === 'overview' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h1 className="font-display text-2xl font-bold text-white">Admin Dashboard</h1>
                <div className="flex items-center gap-2 text-xs text-ss-text-muted bg-white/5 px-3 py-1.5 rounded-full">
                  <div className="w-1.5 h-1.5 bg-ss-primary rounded-full" />
                  Last updated: just now
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {adminStats.map(({ label, value, change, positive, icon: Icon, color }, i) => (
                  <motion.div
                    key={label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-white/5 rounded-2xl p-5 border border-white/10"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                        <Icon size={18} style={{ color }} />
                      </div>
                      <div className={cn('flex items-center gap-1 text-xs font-semibold', positive ? 'text-ss-primary' : 'text-red-400')}>
                        {positive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                        {change}
                      </div>
                    </div>
                    <p className="font-display text-2xl font-bold text-white">{value}</p>
                    <p className="text-ss-text-muted text-xs mt-1">{label}</p>
                  </motion.div>
                ))}
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <h3 className="font-semibold text-white mb-4">User Growth</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={userGrowthData}>
                      <defs>
                        <linearGradient id="userGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#1db954" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#1db954" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="premiumGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="month" stroke="#525252" fontSize={11} />
                      <YAxis stroke="#525252" fontSize={11} tickFormatter={(v) => `${(v/1_000_000).toFixed(1)}M`} />
                      <Tooltip
                        contentStyle={{ background: '#282828', border: '1px solid #404040', borderRadius: '8px', color: '#fff' }}
                        formatter={(v: any) => [`${(Number(v)/1_000_000).toFixed(2)}M`, '']}
                      />
                      <Area type="monotone" dataKey="users" stroke="#1db954" strokeWidth={2} fill="url(#userGrad)" name="Total Users" />
                      <Area type="monotone" dataKey="premium" stroke="#10b981" strokeWidth={2} fill="url(#premiumGrad)" name="Premium" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                  <h3 className="font-semibold text-white mb-4">Pending Moderation</h3>
                  <div className="space-y-3">
                    {pendingReviews.map((item, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                        <div className="w-8 h-8 rounded-lg bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                          <AlertTriangle size={14} className="text-yellow-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">{item.title}</p>
                          <p className="text-xs text-ss-text-muted">{item.type} · {item.flag} · {item.time}</p>
                        </div>
                        <div className="flex gap-1">
                          <button className="w-7 h-7 rounded-lg bg-ss-primary/20 flex items-center justify-center text-ss-primary hover:bg-ss-primary/30 transition-colors">
                            <CheckCircle size={14} />
                          </button>
                          <button className="w-7 h-7 rounded-lg bg-red-500/20 flex items-center justify-center text-red-400 hover:bg-red-500/30 transition-colors">
                            <XCircle size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button className="w-full mt-3 py-2 text-sm text-ss-text-muted hover:text-white text-center transition-colors">
                    View all 47 pending reviews →
                  </button>
                </div>
              </div>

              {/* Recent Users */}
              <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white">Recent Users</h3>
                  <div className="flex gap-2">
                    <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 text-sm">
                      <Search size={14} className="text-ss-text-muted" />
                      <input placeholder="Search users..." className="bg-transparent text-white text-xs outline-none w-32 placeholder:text-ss-text-muted" />
                    </div>
                    <button className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-1.5 text-ss-text-muted hover:text-white text-xs">
                      <Filter size={14} /> Filter
                    </button>
                  </div>
                </div>

                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-ss-text-muted text-xs uppercase tracking-wider border-b border-white/5">
                      <th className="text-left pb-3 font-medium">User</th>
                      <th className="text-left pb-3 font-medium">Plan</th>
                      <th className="text-left pb-3 font-medium">Joined</th>
                      <th className="text-left pb-3 font-medium">Status</th>
                      <th className="text-right pb-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {recentUsers.map((user, i) => (
                      <tr key={i} className="group hover:bg-white/3">
                        <td className="py-3">
                          <div>
                            <p className="font-medium text-white">{user.name}</p>
                            <p className="text-xs text-ss-text-muted">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3">
                          <span className={cn('text-xs px-2.5 py-1 rounded-full font-medium capitalize',
                            user.plan === 'premium' ? 'bg-ss-primary/20 text-ss-primary' :
                            user.plan === 'family' ? 'bg-ss-secondary/20 text-ss-secondary' :
                            user.plan === 'student' ? 'bg-blue-500/20 text-blue-400' :
                            'bg-white/10 text-white/50'
                          )}>
                            {user.plan}
                          </span>
                        </td>
                        <td className="py-3 text-ss-text-muted text-xs">{user.joined}</td>
                        <td className="py-3">
                          <span className={cn('text-xs flex items-center gap-1.5 w-fit',
                            user.status === 'active' ? 'text-ss-primary' : 'text-red-400'
                          )}>
                            <div className={cn('w-1.5 h-1.5 rounded-full', user.status === 'active' ? 'bg-ss-primary' : 'bg-red-400')} />
                            {user.status}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button className="p-1.5 rounded-lg hover:bg-white/10 text-ss-text-muted hover:text-white transition-colors"><Eye size={13} /></button>
                            <button className="p-1.5 rounded-lg hover:bg-yellow-500/20 text-ss-text-muted hover:text-yellow-400 transition-colors"><Ban size={13} /></button>
                            <button className="p-1.5 rounded-lg hover:bg-red-500/20 text-ss-text-muted hover:text-red-400 transition-colors"><Trash2 size={13} /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}


          {activeSection === 'artists' && (
            <ArtistVerificationPanel />
          )}

          {activeSection !== 'overview' && activeSection !== 'artists' && (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <div className="text-5xl mb-4">🛠️</div>
                <h3 className="font-display text-xl font-bold text-white mb-2 capitalize">{activeSection} Management</h3>
                <p className="text-ss-text-muted text-sm">This admin module is ready to be connected to the NestJS backend.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Artist Verification Panel ──────────────────────────────────────────────
function ArtistVerificationPanel() {
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
      if (data.success) { load(); }
    } catch {}
    finally { setProcessing(null); }
  };

  const statusColor: Record<string, string> = {
    under_review: '#f59e0b',
    approved: '#1db954',
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
          <h1 style={{ color: '#fff', fontWeight: 900, fontSize: 22, margin: 0 }}>🏅 Artist Verification</h1>
          <p style={{ color: '#737373', fontSize: 13, margin: '4px 0 0' }}>Review and approve artist verification requests with proof documents</p>
        </div>
        <button onClick={load} style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', borderRadius: 8, padding: '8px 16px', fontSize: 12, cursor: 'pointer' }}>
          🔄 Refresh
        </button>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { label: 'Pending', count: requests.filter(r => r.status === 'under_review').length, color: '#f59e0b' },
          { label: 'Approved', count: requests.filter(r => r.status === 'approved').length, color: '#1db954' },
          { label: 'Rejected', count: requests.filter(r => r.status === 'rejected').length, color: '#ef4444' },
        ].map(s => (
          <div key={s.label} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${s.color}25`, borderRadius: 12, padding: '14px 18px' }}>
            <div style={{ fontWeight: 900, fontSize: 28, color: s.color }}>{s.count}</div>
            <div style={{ fontSize: 12, color: '#737373' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Document viewer overlay */}
      {viewDoc && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }} onClick={() => setViewDoc(null)}>
          <div style={{ position: 'relative', maxWidth: '80vw', maxHeight: '80vh', background: '#111', borderRadius: 16, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }} onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>📄 Proof Document</span>
              <button onClick={() => setViewDoc(null)} style={{ background: 'none', border: 'none', color: '#737373', cursor: 'pointer', fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            {viewDoc.startsWith('data:image') ? (
              <img src={viewDoc} alt='Proof' style={{ maxWidth: '75vw', maxHeight: '70vh', objectFit: 'contain', display: 'block' }} />
            ) : (
              <div style={{ padding: 32, textAlign: 'center', color: '#a3a3a3' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>📄</div>
                <p>PDF document uploaded</p>
                <a href={viewDoc} download='proof.pdf' style={{ color: '#1db954', fontSize: 13 }}>Download PDF</a>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Request list */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#737373' }}>Loading requests...</div>
      ) : requests.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 48, color: '#737373' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>🎉</div>
          <p>No verification requests yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {requests.map(req => (
            <div key={req.artistId} style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${req.status === 'under_review' ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.07)'}`, borderRadius: 14, padding: 18, display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{ width: 48, height: 48, borderRadius: '50%', backgroundImage: req.avatar ? `url(${req.avatar})` : 'none', backgroundColor: req.avatar ? 'transparent' : 'rgba(60,60,60,1)', backgroundSize: 'cover', backgroundPosition: 'center', flexShrink: 0 }} />

              {/* Artist info */}
              <div style={{ flex: 1, minWidth: 160 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: '#fff', fontWeight: 800, fontSize: 15 }}>{req.artistName}</span>
                  <span style={{ fontSize: 11, fontWeight: 700, color: statusColor[req.status] || '#737373', background: `${statusColor[req.status]}15`, padding: '2px 8px', borderRadius: 20 }}>
                    {statusLabel[req.status] || req.status}
                  </span>
                </div>
                <div style={{ color: '#737373', fontSize: 12, marginTop: 3 }}>{req.email} · {req.genre} · {req.city || req.country}</div>
                <div style={{ color: '#525252', fontSize: 11, marginTop: 2 }}>Submitted: {req.submittedAt ? new Date(req.submittedAt).toLocaleString() : 'N/A'}</div>
                {req.notes && <div style={{ color: '#a3a3a3', fontSize: 11, marginTop: 2 }}>File: {req.notes}</div>}
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8, flexShrink: 0, alignItems: 'center' }}>
                {req.documents?.[0] && (
                  <button
                    onClick={() => setViewDoc(req.documents[0])}
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, cursor: 'pointer', fontWeight: 600 }}
                  >
                    👁️ View Proof
                  </button>
                )}
                {req.status === 'under_review' && (
                  <>
                    <button
                      disabled={processing === req.artistId}
                      onClick={() => act(req.artistId, 'approve')}
                      style={{ background: 'rgba(29, 185, 84,0.15)', border: '1px solid rgba(29, 185, 84,0.3)', color: '#1db954', borderRadius: 8, padding: '7px 16px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}
                    >
                      ✅ Verify
                    </button>
                    <button
                      disabled={processing === req.artistId}
                      onClick={() => act(req.artistId, 'reject')}
                      style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#ef4444', borderRadius: 8, padding: '7px 16px', fontSize: 12, cursor: 'pointer', fontWeight: 700 }}
                    >
                      ❌ Reject
                    </button>
                  </>
                )}
                {req.status !== 'under_review' && (
                  <span style={{ fontSize: 12, color: '#525252' }}>Already {req.status}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
