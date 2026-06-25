'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Key, ShieldAlert, Activity, Copy, RotateCw, Trash2, Plus,
  Eye, EyeOff, CheckCircle2, XCircle, ExternalLink, Globe,
  Calendar, Lock, Server, TrendingUp, AlertCircle, RefreshCw,
  Sliders, Link2, Wifi, Send, Database, Terminal, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

const envColors: Record<string, string> = { prod: '#10b981', staging: '#f59e0b', dev: '#10b981' };
const tierColors: Record<string, string> = {
  Gold: '#f59e0b',
  Silver: '#9ca3af',
  Bronze: '#d97706',
  Custom: '#a855f7'
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#070707', border: '1px solid rgba(43,34,26,0.1)', borderRadius: 8,
  color: '#221a15', padding: '10px 14px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: '#ffffff', border: '1px solid rgba(43,34,26,0.07)', borderRadius: 16, padding: 22,
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)', ...style,
});

export default function ApiKeysTab() {
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [keys, setKeys] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [webhooks, setWebhooks] = useState<any[]>([]);
  const [webhookLogs, setWebhookLogs] = useState<any[]>([]);

  // Modals state
  const [showKeyModal, setShowKeyModal] = useState(false);
  const [showWhModal, setShowWhModal] = useState(false);

  // Form states
  const [newKey, setNewKey] = useState({
    name: '',
    tier: 'Silver',
    ipWhitelist: '',
    expiresAt: 'Never',
    env: 'prod',
    rateLimit: '',
  });
  const [keyPerms, setKeyPerms] = useState<string[]>(['read tracks', 'read playlists']);

  const [newWh, setNewWh] = useState({
    url: '',
    description: '',
    status: 'active',
  });
  const [whEvents, setWhEvents] = useState<string[]>(['track.created']);

  const [integrations, setIntegrations] = useState([
    { id: 'spotify', name: 'Spotify Music Sync', icon: '🎵', connected: true, desc: 'Sync playlist mappings & release schedules' },
    { id: 'apple', name: 'Apple Music API', icon: '🍎', connected: true, desc: 'Ingest spatial master logs and metadata streams' },
    { id: 'youtube', name: 'YouTube Music Player', icon: '▶️', connected: false, desc: 'Dispatch artist video links and metrics' },
    { id: 'lastfm', name: 'Last.fm Auditing', icon: '📻', connected: true, desc: 'Realtime listener scrobble streams ingestion' },
    { id: 'shazam', name: 'Shazam Metadata Integration', icon: '🔍', connected: false, desc: 'Realtime track audio fingerprint mapping' },
    { id: 'deezer', name: 'Deezer Sound API', icon: '🎶', connected: false, desc: 'Sync localized catalog release schemas' },
  ]);

  const handleToggleIntegration = (id: string) => {
    setIntegrations(prev => prev.map(item => {
      if (item.id === id) {
        const nextState = !item.connected;
        toast.success(`${nextState ? 'Authorized connection' : 'Revoked access'} for ${item.name}`);
        return { ...item, connected: nextState };
      }
      return item;
    }));
  };

  // UI interaction states
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [visibleSecrets, setVisibleSecrets] = useState<Record<string, boolean>>({});
  const [expandedKeyId, setExpandedKeyId] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [testLoading, setTestLoading] = useState<Record<string, boolean>>({});

  const allPerms = ['read tracks', 'write playlists', 'access analytics', 'manage users', 'write tracks', 'delete playlists'];
  const allEvents = ['track.created', 'track.played', 'playlist.updated', 'user.signup', 'payment.completed'];

  const fetchData = async () => {
    try {
      setLoading(true);
      
      const keyRes = await fetch('/api/admin/api-keys');
      const keyData = await keyRes.json();
      if (keyData.success) {
        setKeys(keyData.keys || []);
        setMetrics(keyData.metrics || null);
      }

      const whRes = await fetch('/api/admin/webhooks');
      const whData = await whRes.json();
      if (whData.success) {
        setWebhooks(whData.webhooks || []);
        setWebhookLogs(whData.logs || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to sync API & webhook configurations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchData();
  }, []);

  // API Key Actions
  const handleGenerateKey = async () => {
    if (!newKey.name.trim()) {
      toast.error('Please enter a key name');
      return;
    }

    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          name: newKey.name,
          tier: newKey.tier,
          ipWhitelist: newKey.ipWhitelist,
          expiresAt: newKey.expiresAt === 'Never' ? 'Never' : newKey.expiresAt,
          env: newKey.env,
          rateLimit: newKey.rateLimit,
          perms: keyPerms,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'API Key created successfully!');
        setShowKeyModal(false);
        setNewKey({
          name: '',
          tier: 'Silver',
          ipWhitelist: '',
          expiresAt: 'Never',
          env: 'prod',
          rateLimit: '',
        });
        setKeyPerms(['read tracks', 'read playlists']);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to generate key');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error creating API Key');
    }
  };

  const handleRotateKey = async (id: string) => {
    if (!confirm('Are you sure you want to rotate this key? Any application using the current value will immediately stop working.')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'regenerate', id }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'API key rotated successfully');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to rotate key');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error rotating API key');
    }
  };

  const handleRevokeKey = async (id: string) => {
    if (!confirm('Revoking this key deletes it permanently. Proceed?')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revoke', id }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'API key revoked');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to revoke key');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error revoking API key');
    }
  };

  // Webhook Actions
  const handleCreateWebhook = async () => {
    if (!newWh.url.trim()) {
      toast.error('Please enter a valid webhook endpoint URL');
      return;
    }

    try {
      const res = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create',
          url: newWh.url,
          description: newWh.description,
          status: newWh.status,
          events: whEvents,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Webhook registered!');
        setShowWhModal(false);
        setNewWh({ url: '', description: '', status: 'active' });
        setWhEvents(['track.created']);
        fetchData();
      } else {
        toast.error(data.error || 'Failed to register webhook');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error registering webhook');
    }
  };

  const handleToggleWebhook = async (id: string) => {
    try {
      const res = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle', id }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Status updated');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to toggle status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error toggling webhook');
    }
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook target?')) {
      return;
    }

    try {
      const res = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Webhook deleted');
        fetchData();
      } else {
        toast.error(data.error || 'Failed to delete webhook');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error deleting webhook');
    }
  };

  const handleTestWebhook = async (id: string) => {
    setTestLoading(prev => ({ ...prev, [id]: true }));
    try {
      const res = await fetch('/api/admin/webhooks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'test', id }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Simulated delivery recorded!');
        fetchData();
      } else {
        toast.error(data.error || 'Test failed');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error triggering test webhook');
    } finally {
      setTestLoading(prev => ({ ...prev, [id]: false }));
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const toggleKeyVisibility = (id: string) => {
    setVisibleKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSecretVisibility = (id: string) => {
    setVisibleSecrets(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const maskKey = (key: string) => {
    if (key.length <= 12) return key;
    return `${key.slice(0, 8)}••••••••${key.slice(-4)}`;
  };

  const maskSecret = (sec: string) => {
    return `whsec_••••••••••••••••${sec.slice(-4)}`;
  };

  const formatDate = (isoString: string) => {
    if (!isoString || isoString === 'Never') return 'Never';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return isoString;
    }
  };

  const getExpirationDaysStatus = (isoString: string) => {
    if (!isoString || isoString === 'Never') return { text: 'No Expiry', color: '#10b981' };
    try {
      const expiry = new Date(isoString);
      const diffMs = expiry.getTime() - Date.now();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        return { text: 'Expired', color: '#ef4444' };
      }
      if (diffDays <= 7) {
        return { text: `Expires in ${diffDays}d`, color: '#f59e0b' };
      }
      return { text: `Expires in ${diffDays}d`, color: '#87786c' };
    } catch {
      return { text: 'Configured', color: '#87786c' };
    }
  };

  return (
    <div style={{ color: '#221a15', fontFamily: 'Inter, sans-serif' }}>
      
      {/* Top Banner & Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Key size={24} className="text-emerald-500" />
            API & Webhook Management
          </h2>
          <p style={{ fontSize: 13, color: '#87786c', margin: '4px 0 0' }}>Configure secure API integrations, rotation policies, whitelist client IP constraints, and register real-time webhooks.</p>
        </div>
        <button
          onClick={() => fetchData()}
          style={{
            background: '#ffffff', color: '#a3a3a3', border: '1px solid rgba(43,34,26,0.1)', borderRadius: 8,
            padding: '8px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'
          }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Sync
        </button>
      </div>

      {/* Telemetry Stats Rows */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 24 }}>
        {[
          { label: 'Active API Keys', value: keys.filter(k => k.status === 'active').length, icon: Key, color: '#10b981' },
          { label: 'Active Webhooks', value: webhooks.filter(w => w.status === 'active').length, icon: Link2, color: '#a855f7' },
          { label: 'API Queries Today', value: metrics?.totalRequests ? metrics.totalRequests.toLocaleString() : '125,302', icon: Activity, color: '#10b981' },
          { label: 'Avg Latency (p95)', value: metrics?.p95Latency ? `${metrics.p95Latency}ms` : '84ms', icon: Server, color: '#f59e0b' },
        ].map(s => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            style={card({ position: 'relative', overflow: 'hidden' })}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <p style={{ fontSize: 11, color: '#87786c', margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</p>
                <p style={{ fontSize: 24, fontWeight: 800, margin: 0, color: '#221a15' }}>{s.value}</p>
              </div>
              <div style={{ background: s.color + '15', padding: 8, borderRadius: 10 }}>
                <s.icon size={18} style={{ color: s.color }} />
              </div>
            </div>
            {/* Ambient visual line */}
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, ${s.color}00, ${s.color}50, ${s.color}00)` }} />
          </motion.div>
        ))}
      </div>

      {/* Interactive Telemetry Chart Section */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 16, marginBottom: 24 }}>
        
        {/* Recharts Area Chart */}
        <div style={card({ display: 'flex', flexDirection: 'column', height: 280 })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <TrendingUp size={16} className="text-emerald-500" />
                API Key Queries Telemetry
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#87786c' }}>Visual analytics trail matching live gateway hits per environment.</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: '#87786c' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> Queries</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} /> Errors</span>
            </div>
          </div>
          
          <div style={{ flex: 1, minHeight: 0 }}>
            {mounted && metrics?.dailyTraffic ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics.dailyTraffic} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorRequests" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorErrors" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#141414" />
                  <XAxis dataKey="date" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#090909', border: '1px solid #1c1c1c', borderRadius: 8, color: '#221a15', fontSize: 12 }}
                    itemStyle={{ color: '#221a15' }}
                  />
                  <Area type="monotone" dataKey="requests" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorRequests)" name="Requests" />
                  <Area type="monotone" dataKey="errors" stroke="#ef4444" strokeWidth={1.5} fillOpacity={1} fill="url(#colorErrors)" name="Errors" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#87786c', fontSize: 12 }}>
                Loading visual analytics stream...
              </div>
            )}
          </div>
        </div>

        {/* Key Breakdown / Health Status */}
        <div style={card({ display: 'flex', flexDirection: 'column', height: 280 })}>
          <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700 }}>Query Volume Share</h3>
          <p style={{ margin: '0 0 16px', fontSize: 11, color: '#87786c' }}>Key shares in total request load.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1, overflowY: 'auto' }}>
            {metrics?.keyUsageBreakdown?.map((item: any) => {
              const total = metrics.keyUsageBreakdown.reduce((acc: number, cur: any) => acc + cur.requests, 0) || 1;
              const percent = Math.round((item.requests / total) * 100);
              return (
                <div key={item.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#e5e7eb' }}>{item.name}</span>
                    <span style={{ color: '#a0958b' }}>{item.requests.toLocaleString()} ({percent}%)</span>
                  </div>
                  <div style={{ width: '100%', height: 6, background: '#ffffff', borderRadius: 3, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${percent}%`, background: '#10b981', borderRadius: 3 }} />
                  </div>
                </div>
              );
            })}
            {keys.length === 0 && (
              <div style={{ color: '#87786c', fontSize: 11, textAlign: 'center', padding: 20 }}>No keys active.</div>
            )}
          </div>
        </div>

      </div>

      {/* API Keys Table Panel */}
      <div style={{ ...card(), marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 15, fontWeight: 800 }}>Gateway Keys</h3>
            <p style={{ margin: '2px 0 0', fontSize: 12, color: '#87786c' }}>Manage client app secrets and enforce access parameters.</p>
          </div>
          <button
            onClick={() => setShowKeyModal(true)}
            style={{
              background: '#10b981', border: 'none', borderRadius: 8, color: '#000',
              padding: '9px 16px', fontWeight: 700, fontSize: 12, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6, boxShadow: '0 2px 10px rgba(16, 185, 129, 0.2)'
            }}
          >
            <Plus size={16} />
            Generate Enterprise Key
          </button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          {loading && keys.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, color: '#87786c', fontSize: 13 }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
              Syncing API key states...
            </div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                  <th style={{ width: 28, padding: '10px 12px' }} />
                  {['Key Name', 'Auth Key Token', 'Tier', 'Env', 'IP Access', 'Rate Limit', 'TTL Check', 'Actions'].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: '10px 12px', color: '#87786c', fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {keys.map(k => {
                  const isExpanded = expandedKeyId === k.id;
                  const expStatus = getExpirationDaysStatus(k.expiresAt);
                  return (
                    <React.Fragment key={k.id}>
                      {/* Base Key Row */}
                      <tr
                        key={k.id}
                        style={{
                          borderBottom: isExpanded ? 'none' : '1px solid #141414',
                          background: isExpanded ? '#111111' : 'transparent',
                          transition: 'background 0.2s',
                          cursor: 'pointer'
                        }}
                        onClick={() => setExpandedKeyId(isExpanded ? null : k.id)}
                      >
                        <td style={{ padding: '12px 12px', textAlign: 'center' }}>
                          {isExpanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
                        </td>
                        <td style={{ padding: '12px 12px', fontWeight: 700, color: '#221a15' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {k.name}
                          </span>
                        </td>
                        <td style={{ padding: '12px 12px' }}>
                          <span style={{
                            background: (tierColors[k.tier || 'Custom'] || '#888') + '15',
                            color: tierColors[k.tier || 'Custom'] || '#888',
                            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                            border: `1px solid ${(tierColors[k.tier || 'Custom'] || '#888')}33`
                          }}>
                            {k.tier || 'Custom'}
                          </span>
                        </td>
                        <td style={{ padding: '12px 12px' }}>
                          <span style={{
                            background: (envColors[k.env] || '#888') + '15',
                            color: envColors[k.env] || '#888',
                            fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
                            textTransform: 'uppercase', border: `1px solid ${(envColors[k.env] || '#888')}22`
                          }}>
                            {k.env}
                          </span>
                        </td>
                        <td style={{ padding: '12px 12px', color: '#a0958b' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Globe size={12} className="text-zinc-500" />
                            {k.ipWhitelist && k.ipWhitelist.length > 0
                              ? `${k.ipWhitelist.length} rule${k.ipWhitelist.length > 1 ? 's' : ''}`
                              : 'No limits'
                            }
                          </span>
                        </td>
                        <td style={{ padding: '12px 12px', color: '#e5e7eb' }}>
                          {k.rateLimit ? `${k.rateLimit.toLocaleString()}/min` : 'N/A'}
                        </td>
                        <td style={{ padding: '12px 12px' }}>
                          <span style={{ color: expStatus.color, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Calendar size={12} />
                            {expStatus.text}
                          </span>
                        </td>
                        <td style={{ padding: '12px 12px' }} onClick={e => e.stopPropagation()}>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <button
                              onClick={() => copyToClipboard(k.key, 'API Key')}
                              style={{ background: '#f4eede', color: '#a0958b', border: '1px solid rgba(43,34,26,0.1)', borderRadius: 6, padding: '5px 9px', fontSize: 11, cursor: 'pointer' }}
                            >
                              Copy
                            </button>
                            <button
                              onClick={() => handleRotateKey(k.id)}
                              title="Rotate Credentials (Swap to a new secure key string, preserving properties)"
                              style={{ background: '#f4eede', color: '#f59e0b', border: '1px solid #f59e0b22', borderRadius: 6, padding: '5px 9px', fontSize: 11, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                              <RotateCw size={11} />
                              Rotate
                            </button>
                            <button
                              onClick={() => handleRevokeKey(k.id)}
                              style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444422', borderRadius: 6, padding: '5px 9px', fontSize: 11, cursor: 'pointer' }}
                            >
                              Revoke
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Details Drawer */}
                      <AnimatePresence>
                        {isExpanded && (
                          <tr style={{ background: '#ffffff' }}>
                            <td colSpan={9} style={{ padding: '12px 24px 20px 52px', borderBottom: '1px solid #1a1a1a' }}>
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                style={{ overflow: 'hidden' }}
                              >
                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 20 }}>
                                  
                                  {/* Credentials & Token Viewer */}
                                  <div style={{ background: '#090909', borderRadius: 8, padding: 14, border: '1px solid #1c1c1c' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: '#87786c', textTransform: 'uppercase' }}>Private Secret Key Token</span>
                                      <button
                                        onClick={() => toggleKeyVisibility(k.id)}
                                        style={{ background: 'transparent', border: 'none', color: '#a3a3a3', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}
                                      >
                                        {visibleKeys[k.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                        {visibleKeys[k.id] ? 'Hide' : 'Reveal'}
                                      </button>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#050505', padding: '10px 12px', borderRadius: 6, border: '1px solid #161616' }}>
                                      <code style={{ fontFamily: 'monospace', fontSize: 11, color: visibleKeys[k.id] ? '#10b981' : '#737373', flex: 1, wordBreak: 'break-all' }}>
                                        {visibleKeys[k.id] ? k.key : maskKey(k.key)}
                                      </code>
                                      <button
                                        onClick={() => copyToClipboard(k.key, 'API Token')}
                                        style={{ background: '#ffffff', color: '#221a15', border: '1px solid rgba(43,34,26,0.1)', borderRadius: 4, padding: '4px 8px', fontSize: 10, cursor: 'pointer' }}
                                      >
                                        Copy
                                      </button>
                                    </div>
                                    
                                    {/* Subscribed scopes */}
                                    <div style={{ marginTop: 14 }}>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: '#87786c', textTransform: 'uppercase', display: 'block', marginBottom: 6 }}>Subscribed Scopes ({k.perms?.length || 0})</span>
                                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                        {k.perms && k.perms.length > 0 ? (
                                          k.perms.map((p: string) => (
                                            <span key={p} style={{ background: '#10b98115', color: '#10b981', border: '1px solid #10b98122', fontSize: 10, padding: '2px 8px', borderRadius: 4 }}>{p}</span>
                                          ))
                                        ) : (
                                          <span style={{ fontSize: 11, color: '#525252' }}>No permissions assigned</span>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* CIDR Whitelist Restrictions */}
                                  <div style={{ background: '#090909', borderRadius: 8, padding: 14, border: '1px solid #1c1c1c' }}>
                                    <span style={{ fontSize: 11, fontWeight: 700, color: '#87786c', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>IP CIDR Constraints</span>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                      {k.ipWhitelist && k.ipWhitelist.length > 0 ? (
                                        k.ipWhitelist.map((ip: string) => (
                                          <div key={ip} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#e5e7eb' }}>
                                            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                                            <code style={{ fontFamily: 'monospace' }}>{ip}</code>
                                          </div>
                                        ))
                                      ) : (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#87786c' }}>
                                          <ShieldAlert size={14} className="text-zinc-600" />
                                          <span>No whitelisting active. Accessible from anywhere.</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Metadata and Creation Logs */}
                                  <div style={{ background: '#090909', borderRadius: 8, padding: 14, border: '1px solid #1c1c1c', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                    <div>
                                      <span style={{ fontSize: 11, fontWeight: 700, color: '#87786c', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Key Metadata</span>
                                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 11 }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <span style={{ color: '#87786c' }}>Created At</span>
                                          <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{formatDate(k.createdAt)}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <span style={{ color: '#87786c' }}>Gateway Limit</span>
                                          <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{k.rateLimit ? `${k.rateLimit.toLocaleString()} rpm` : 'Unlimited'}</span>
                                        </div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                          <span style={{ color: '#87786c' }}>Last Active</span>
                                          <span style={{ color: '#e5e7eb', fontWeight: 600 }}>{k.lastUsed || 'Never'}</span>
                                        </div>
                                      </div>
                                    </div>
                                    <div style={{ fontSize: 10, color: '#87786c', borderTop: '1px solid #1c1c1c', paddingTop: 8, marginTop: 10, display: 'flex', alignItems: 'center', gap: 4 }}>
                                      <Lock size={12} className="text-zinc-600" />
                                      Secured via HSM encryption
                                    </div>
                                  </div>

                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Webhooks Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        
        {/* Configured Targets list */}
        <div style={card()}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Link2 size={16} className="text-purple-400" />
                Active Webhooks
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#87786c' }}>Outbound Event handlers triggered by system events.</p>
            </div>
            <button
              onClick={() => setShowWhModal(true)}
              style={{
                background: '#a855f71a', color: '#a855f7', border: '1px solid #a855f722',
                borderRadius: 6, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer'
              }}
            >
              + Add Webhook
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 420, overflowY: 'auto' }}>
            {webhooks.map(w => (
              <div
                key={w.id}
                style={{
                  background: '#070707', borderRadius: 10, padding: 14, border: '1px solid #161616',
                  transition: 'border-color 0.2s'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <div style={{ flex: 1, minWidth: 0, paddingRight: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#221a15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {w.url}
                      </p>
                    </div>
                    {w.description && (
                      <p style={{ margin: '2px 0 0', fontSize: 11, color: '#87786c' }}>{w.description}</p>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    {/* Status Toggle Switch UI */}
                    <button
                      onClick={() => handleToggleWebhook(w.id)}
                      style={{
                        background: w.status === 'active' ? '#10b9811c' : '#ef44441c',
                        color: w.status === 'active' ? '#10b981' : '#ef4444',
                        border: `1px solid ${w.status === 'active' ? '#10b98122' : '#ef444422'}`,
                        borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                        textTransform: 'uppercase'
                      }}
                    >
                      {w.status}
                    </button>
                    
                    <button
                      onClick={() => handleDeleteWebhook(w.id)}
                      style={{ background: 'transparent', border: 'none', color: '#737373', cursor: 'pointer', padding: 2 }}
                      className="hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                {/* Subscriptions events chips */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 10 }}>
                  {w.events?.map((ev: string) => (
                    <span key={ev} style={{ background: '#10b98112', color: '#10b981', fontSize: 9, padding: '1px 6px', borderRadius: 4, border: '1px solid #10b9811a' }}>
                      {ev}
                    </span>
                  ))}
                </div>

                {/* Signing secret toggler */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #141414', paddingTop: 8, fontSize: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#87786c' }}>
                    <span>Secret Key:</span>
                    <code style={{ fontFamily: 'monospace', color: visibleSecrets[w.id] ? '#f59e0b' : '#525252' }}>
                      {visibleSecrets[w.id] ? w.signingSecret : maskSecret(w.signingSecret)}
                    </code>
                    <button
                      onClick={() => toggleSecretVisibility(w.id)}
                      style={{ background: 'transparent', border: 'none', color: '#87786c', cursor: 'pointer', padding: 0 }}
                    >
                      {visibleSecrets[w.id] ? <EyeOff size={11} /> : <Eye size={11} />}
                    </button>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => copyToClipboard(w.signingSecret, 'Signing Secret')}
                      style={{ background: '#ffffff', color: '#a3a3a3', border: '1px solid rgba(43,34,26,0.1)', borderRadius: 4, padding: '3px 7px', fontSize: 9, cursor: 'pointer' }}
                    >
                      Copy
                    </button>
                    <button
                      onClick={() => handleTestWebhook(w.id)}
                      disabled={testLoading[w.id]}
                      style={{
                        background: '#10b9811c', color: '#10b981', border: '1px solid #10b98122',
                        borderRadius: 4, padding: '3px 8px', fontSize: 9, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 4
                      }}
                    >
                      {testLoading[w.id] ? <RefreshCw size={9} className="animate-spin" /> : <Send size={9} />}
                      Test Call
                    </button>
                  </div>
                </div>

              </div>
            ))}
            {webhooks.length === 0 && (
              <div style={{ color: '#87786c', fontSize: 12, textAlign: 'center', padding: '40px 0' }}>
                No active webhooks registered. Configure a target to listen for Beato events.
              </div>
            )}
          </div>
        </div>

        {/* Webhook Delivery Logs Live Console */}
        <div style={card({ display: 'flex', flexDirection: 'column', height: 480 })}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Terminal size={16} className="text-emerald-500" />
                Live Webhook Logs Console
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 11, color: '#87786c' }}>Real-time audit trails of dispatched JSON hooks and response headers.</p>
            </div>
            <span style={{
              background: '#10b98115', color: '#10b981', border: '1px solid #10b98122',
              fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 4
            }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
              Live Feed
            </span>
          </div>

          {/* Console Output Screen */}
          <div style={{
            flex: 1, background: '#050505', borderRadius: 10, border: '1px solid #161616',
            padding: 10, overflowY: 'auto', fontFamily: 'monospace', fontSize: 11,
            display: 'flex', flexDirection: 'column', gap: 8
          }}>
            {webhookLogs.map(log => {
              const isLogExpanded = expandedLogId === log.id;
              const isSuccess = log.status >= 200 && log.status < 300;
              return (
                <div
                  key={log.id}
                  style={{
                    borderBottom: '1px solid #111', paddingBottom: 6, cursor: 'pointer',
                    background: isLogExpanded ? '#0a0a0a' : 'transparent',
                    borderRadius: 6, padding: '6px 8px'
                  }}
                  onClick={() => setExpandedLogId(isLogExpanded ? null : log.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        color: isSuccess ? '#10b981' : '#ef4444',
                        background: isSuccess ? '#10b98110' : '#ef444410',
                        fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4
                      }}>
                        {log.status} {log.statusText}
                      </span>
                      <span style={{ color: '#221a15', fontWeight: 600 }}>{log.event}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#525252', fontSize: 10 }}>
                      <span>{log.durationMs}ms</span>
                      <span>{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                    </div>
                  </div>

                  {/* URL summary snippet */}
                  <div style={{ color: '#737373', fontSize: 10, marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    → {log.webhookUrl}
                  </div>

                  {/* Expanded JSON Terminal Payload */}
                  <AnimatePresence>
                    {isLogExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden', marginTop: 10, borderTop: '1px solid #1a1a1a', paddingTop: 8 }}
                        onClick={e => e.stopPropagation()}
                      >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                          <div>
                            <span style={{ color: '#87786c', fontSize: 10, display: 'block', marginBottom: 2 }}>Request Payload Body (JSON)</span>
                            <pre style={{
                              background: '#000', border: '1px solid #1c1c1c', borderRadius: 6,
                              padding: 8, margin: 0, overflowX: 'auto', color: '#10b981', fontSize: 10
                            }}>
                              {JSON.stringify(JSON.parse(log.payload), null, 2)}
                            </pre>
                          </div>
                          <div>
                            <span style={{ color: '#87786c', fontSize: 10, display: 'block', marginBottom: 2 }}>Response Payload / Server Log</span>
                            <pre style={{
                              background: '#000', border: '1px solid #1c1c1c', borderRadius: 6,
                              padding: 8, margin: 0, overflowX: 'auto', color: isSuccess ? '#10b981' : '#ef4444', fontSize: 10
                            }}>
                              {log.response}
                            </pre>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
            {webhookLogs.length === 0 && (
              <div style={{ color: '#525252', fontSize: 11, textAlign: 'center', padding: 40 }}>
                Log stream empty. Dispatched webhooks or test deliveries appear here.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Third Party Integrations Static Visual Card */}
      <div style={card()}>
        <h3 style={{ margin: '0 0 4px', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sliders size={16} className="text-zinc-400" />
          Gateway Third-Party Integrations
        </h3>
        <p style={{ margin: '0 0 16px', fontSize: 11, color: '#87786c' }}>Link and authorize metadata stream exchange with global consumer services.</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
          {integrations.map(int => (
            <div
              key={int.id}
              style={{
                display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
                background: '#070707', borderRadius: 12, padding: 14,
                border: `1px solid ${int.connected ? '#10b98122' : '#161616'}`,
                transition: 'border-color 0.2s'
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <span style={{ fontSize: 18 }}>{int.icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#221a15' }}>{int.name}</span>
                </div>
                <p style={{ margin: '0 0 12px', fontSize: 10, color: '#87786c', minHeight: 28 }}>{int.desc}</p>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 9, color: int.connected ? '#10b981' : '#6b7280', fontWeight: 600 }}>
                  {int.connected ? '● Authorized' : '○ Not Linked'}
                </span>
                <button
                  onClick={() => handleToggleIntegration(int.id)}
                  style={{
                    background: int.connected ? '#ef444412' : '#10b98112',
                    color: int.connected ? '#ef4444' : '#10b981',
                    border: `1px solid ${int.connected ? '#ef444422' : '#10b98122'}`,
                    borderRadius: 6, padding: '4px 10px', fontSize: 10, fontWeight: 700, cursor: 'pointer',
                  }}
                >
                  {int.connected ? 'Disconnect' : 'Connect'}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* MODAL 1: Create API Key */}
      <AnimatePresence>
        {showKeyModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowKeyModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fbf9f5', border: '1px solid #1c1c1c', borderRadius: 20, padding: 28, width: 480 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ background: '#10b98115', padding: 8, borderRadius: 10 }}>
                  <Key className="text-emerald-500" size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Generate Enterprise Credentials</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#87786c' }}>Keys permit secure external queries through API Gateways.</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                
                {/* Key Name Input */}
                <div>
                  <label style={{ fontSize: 11, color: '#a3a3a3', display: 'block', marginBottom: 6, fontWeight: 600 }}>Credential Name</label>
                  <input
                    style={inputStyle}
                    value={newKey.name}
                    onChange={e => setNewKey(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. Android Consumer Client"
                  />
                </div>

                {/* Tier and Environment Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#a3a3a3', display: 'block', marginBottom: 6, fontWeight: 600 }}>Tiers Policy</label>
                    <select
                      style={inputStyle}
                      value={newKey.tier}
                      onChange={e => setNewKey(p => ({ ...p, tier: e.target.value }))}
                    >
                      {['Bronze', 'Silver', 'Gold', 'Custom'].map(t => (
                        <option key={t} value={t} style={{ background: '#fbf9f5' }}>{t} Tier</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#a3a3a3', display: 'block', marginBottom: 6, fontWeight: 600 }}>Deployment Env</label>
                    <select
                      style={inputStyle}
                      value={newKey.env}
                      onChange={e => setNewKey(p => ({ ...p, env: e.target.value }))}
                    >
                      {['prod', 'staging', 'dev'].map(env => (
                        <option key={env} value={env} style={{ background: '#fbf9f5' }}>{env.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* IP Whitelist & Rate Limits Grid */}
                <div>
                  <label style={{ fontSize: 11, color: '#a3a3a3', display: 'block', marginBottom: 6, fontWeight: 600 }}>
                    IP CIDR Whitelist Restrictions <span style={{ color: '#525252', fontWeight: 400 }}>(Comma separated)</span>
                  </label>
                  <input
                    style={inputStyle}
                    value={newKey.ipWhitelist}
                    onChange={e => setNewKey(p => ({ ...p, ipWhitelist: e.target.value }))}
                    placeholder="e.g. 192.168.1.1, 10.0.0.0/24"
                  />
                </div>

                {/* Rate limits Custom Rate & Expiry TTL Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#a3a3a3', display: 'block', marginBottom: 6, fontWeight: 600 }}>
                      Rate Limits <span style={{ color: '#525252', fontWeight: 400 }}>(req/min)</span>
                    </label>
                    <input
                      type="number"
                      style={inputStyle}
                      value={newKey.rateLimit}
                      onChange={e => setNewKey(p => ({ ...p, rateLimit: e.target.value }))}
                      placeholder={newKey.tier === 'Bronze' ? '2000' : newKey.tier === 'Silver' ? '5000' : newKey.tier === 'Gold' ? '10000' : '1000'}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#a3a3a3', display: 'block', marginBottom: 6, fontWeight: 600 }}>TTL Lifetime</label>
                    <select
                      style={inputStyle}
                      value={newKey.expiresAt}
                      onChange={e => {
                        const val = e.target.value;
                        if (val === 'Never') {
                          setNewKey(p => ({ ...p, expiresAt: 'Never' }));
                        } else {
                          const days = parseInt(val);
                          const expiryDate = new Date(Date.now() + 86400000 * days).toISOString();
                          setNewKey(p => ({ ...p, expiresAt: expiryDate }));
                        }
                      }}
                    >
                      <option value="Never" style={{ background: '#fbf9f5' }}>Never Expires</option>
                      <option value="30" style={{ background: '#fbf9f5' }}>30 Days</option>
                      <option value="60" style={{ background: '#fbf9f5' }}>60 Days</option>
                      <option value="90" style={{ background: '#fbf9f5' }}>90 Days</option>
                      <option value="180" style={{ background: '#fbf9f5' }}>180 Days</option>
                      <option value="365" style={{ background: '#fbf9f5' }}>1 Year</option>
                    </select>
                  </div>
                </div>

                {/* Subscribed scopes */}
                <div>
                  <label style={{ fontSize: 11, color: '#a3a3a3', display: 'block', marginBottom: 8, fontWeight: 600 }}>Gateway Security Scopes</label>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, background: '#070707', padding: 12, borderRadius: 10, border: '1px solid #161616' }}>
                    {allPerms.map(p => (
                      <label key={p} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#e5e7eb' }}>
                        <input
                          type="checkbox"
                          checked={keyPerms.includes(p)}
                          onChange={e => setKeyPerms(prev => e.target.checked ? [...prev, p] : prev.filter(x => x !== p))}
                          style={{ accentColor: '#10b981' }}
                        />
                        {p}
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button
                    onClick={() => setShowKeyModal(false)}
                    style={{ background: '#141414', border: '1px solid rgba(43,34,26,0.1)', borderRadius: 8, color: '#a3a3a3', padding: '10px 18px', fontSize: 12, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerateKey}
                    style={{ background: '#10b981', border: 'none', borderRadius: 8, color: '#000', padding: '10px 20px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                  >
                    Generate Credentials
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MODAL 2: Create Webhook */}
      <AnimatePresence>
        {showWhModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}
            onClick={() => setShowWhModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#fbf9f5', border: '1px solid #1c1c1c', borderRadius: 20, padding: 28, width: 460 }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ background: '#a855f715', padding: 8, borderRadius: 10 }}>
                  <Link2 className="text-purple-400" size={20} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800 }}>Register Outbound Webhook</h3>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: '#87786c' }}>Dispatches automated REST hooks during platform activities.</p>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                
                {/* Target URL */}
                <div>
                  <label style={{ fontSize: 11, color: '#a3a3a3', display: 'block', marginBottom: 6, fontWeight: 600 }}>Destination Endpoint URL</label>
                  <input
                    style={inputStyle}
                    value={newWh.url}
                    onChange={e => setNewWh(p => ({ ...p, url: e.target.value }))}
                    placeholder="https://api.myapp.com/webhooks/beato"
                  />
                </div>

                {/* Description */}
                <div>
                  <label style={{ fontSize: 11, color: '#a3a3a3', display: 'block', marginBottom: 6, fontWeight: 600 }}>Description</label>
                  <input
                    style={inputStyle}
                    value={newWh.description}
                    onChange={e => setNewWh(p => ({ ...p, description: e.target.value }))}
                    placeholder="Brief description for internal scoping"
                  />
                </div>

                {/* Trigger Events checkboxes */}
                <div>
                  <label style={{ fontSize: 11, color: '#a3a3a3', display: 'block', marginBottom: 8, fontWeight: 600 }}>Subscribed Event Topics</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#070707', padding: 12, borderRadius: 10, border: '1px solid #161616' }}>
                    {allEvents.map(ev => (
                      <label key={ev} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 12, color: '#e5e7eb' }}>
                        <input
                          type="checkbox"
                          checked={whEvents.includes(ev)}
                          onChange={e => setWhEvents(prev => e.target.checked ? [...prev, ev] : prev.filter(x => x !== ev))}
                          style={{ accentColor: '#a855f7' }}
                        />
                        <code style={{ fontSize: 11, color: '#a855f7' }}>{ev}</code>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Actions buttons */}
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button
                    onClick={() => setShowWhModal(false)}
                    style={{ background: '#141414', border: '1px solid rgba(43,34,26,0.1)', borderRadius: 8, color: '#a3a3a3', padding: '10px 18px', fontSize: 12, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateWebhook}
                    style={{ background: '#a855f7', border: 'none', borderRadius: 8, color: '#221a15', padding: '10px 20px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}
                  >
                    Register Target
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}

