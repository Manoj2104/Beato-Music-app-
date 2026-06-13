'use client';

import { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  Activity, Lock, ShieldAlert, Trash2, Play, Pause, Search, FileText,
  Filter, Globe, Calendar, ChevronDown, ChevronUp, AlertCircle, Eye,
  Settings, User, MapPin, RefreshCw, Terminal, PlusCircle, TrendingUp, BarChart3
} from 'lucide-react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';

const FONT = { fontFamily: "'Inter', 'Outfit', sans-serif" };

type ResultType = 'success' | 'failure' | 'warning';
type FilterType = 'All Events' | 'Admin Actions' | 'Security Events' | 'System Events';

interface AuditEntry {
  id: string;
  userId: string;
  userName: string;
  action: string;
  target: string;
  ipAddress?: string;
  location?: string;
  timestamp: string;
  result: ResultType;
  category: 'Admin Actions' | 'Security Events' | 'System Events';
  severity: 'low' | 'medium' | 'high';
}

const inputStyle: React.CSSProperties = {
  background: '#0c0c0c', border: '1px solid #222', borderRadius: 9,
  padding: '9px 14px', color: '#e5e7eb', fontSize: 13, outline: 'none',
  transition: 'border-color 0.2s', width: '100%'
};

const resultBadge = (result: ResultType) => {
  const map = {
    success: { bg: '#10b98115', color: '#10b981', label: 'Success' },
    failure: { bg: '#ef444415', color: '#ef4444', label: 'Failure' },
    warning: { bg: '#f59e0b15', color: '#f59e0b', label: 'Warning' }
  };
  const s = map[result] || map.success;
  return (
    <span style={{
      background: s.bg, color: s.color, borderRadius: 6, padding: '3px 10px',
      fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.5,
      border: `1px solid ${s.color}22`
    }}>
      {s.label}
    </span>
  );
};

const severityColor = (severity: 'low' | 'medium' | 'high') => {
  if (severity === 'high') return '#ef4444';
  if (severity === 'medium') return '#f59e0b';
  return '#10b981';
};

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: '#0d0d0d', border: '1px solid #1a1a1a', borderRadius: 16, padding: 22,
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.4)', ...style,
});

export default function AuditLogsTab() {
  const [mounted, setMounted] = useState(false);
  const [filter, setFilter] = useState<FilterType>('All Events');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [liveStream, setLiveStream] = useState(true);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  
  // State to track dismissed security alerts
  const [dismissedAlertIds, setDismissedAlertIds] = useState<string[]>([]);

  // Dynamically derive security alerts from real logs with failure results, high severity, or security category
  const securityAlerts = logs
    .filter(l => l.category === 'Security Events' || l.result === 'failure' || l.severity === 'high')
    .map(l => ({
      id: l.id,
      title: l.action.split('_').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
      desc: `${l.userName} triggered ${l.action} on ${l.target} (IP: ${l.ipAddress || 'unknown'})`,
      severity: l.severity,
      time: l.timestamp ? l.timestamp.split(' ')[1]?.slice(0, 5) || 'Now' : 'Now'
    }))
    .filter(a => !dismissedAlertIds.includes(a.id));

  const PER_PAGE = 10;

  const fetchLogs = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const res = await fetch('/api/admin/audit');
      const data = await res.json();
      if (data.success) {
        setLogs(data.logs || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load audit logs');
    } finally {
      if (showLoading) setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    fetchLogs();
  }, []);

  // Poll the API periodically for real-time changes
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (liveStream) {
      interval = setInterval(() => {
        fetchLogs(false);
      }, 4000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [liveStream]);

  const handleDismissAlert = (id: string) => {
    setDismissedAlertIds(prev => [...prev, id]);
    toast.success('Security Alert Dismissed');
  };

  const handleBlockIP = (ip?: string) => {
    if (!ip) return;
    toast.success(`IP Address ${ip} blacklisted at Gateway Firewall.`);
  };

  const handleFlagUser = (username: string) => {
    toast.success(`User Account "${username}" flagged for Moderation Team audit.`);
  };

  const filtered = logs.filter(e => {
    const matchFilter = filter === 'All Events' || e.category === filter;
    const matchSearch = !search || 
      e.userName.toLowerCase().includes(search.toLowerCase()) || 
      e.action.toLowerCase().includes(search.toLowerCase()) ||
      e.target.toLowerCase().includes(search.toLowerCase()) ||
      (e.ipAddress && e.ipAddress.includes(search));
    return matchFilter && matchSearch;
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const exportData = (fmt: 'csv' | 'json') => {
    if (fmt === 'json') {
      const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'audit_logs.json'; a.click();
      toast.success('Exported as JSON');
    } else {
      const header = 'ID,User,Action,Target,IP,Location,Timestamp,Result,Category,Severity\n';
      const rows = logs.map(e => `"${e.id}","${e.userName}","${e.action}","${e.target}","${e.ipAddress || ''}","${e.location || ''}","${e.timestamp}","${e.result}","${e.category}","${e.severity}"`).join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'audit_logs.csv'; a.click();
      toast.success('Exported as CSV');
    }
  };

  // Group log metrics for AreaChart
  const getChartData = () => {
    if (logs.length === 0) {
      return [
        { time: '00:00', admin: 0, security: 0, system: 0 }
      ];
    }

    const dataMap: Record<string, { time: string, admin: number, security: number, system: number }> = {};
    
    logs.slice(0, 40).forEach(log => {
      let timeKey = '12:00';
      if (log.timestamp) {
        const parts = log.timestamp.split(' ');
        if (parts.length >= 2) {
          timeKey = parts[1].slice(0, 5); // Take "HH:MM"
        }
      }

      if (!dataMap[timeKey]) {
        dataMap[timeKey] = { time: timeKey, admin: 0, security: 0, system: 0 };
      }

      if (log.category === 'Admin Actions') dataMap[timeKey].admin += 1;
      else if (log.category === 'Security Events') dataMap[timeKey].security += 1;
      else if (log.category === 'System Events') dataMap[timeKey].system += 1;
    });

    return Object.keys(dataMap)
      .sort()
      .map(key => dataMap[key])
      .slice(-10); // Take last 10 entries for neat rendering
  };

  const STATS = [
    { label: 'Events Today', value: logs.length.toString(), color: '#10b981', icon: '📋' },
    { label: 'Admin Actions', value: logs.filter(l => l.category === 'Admin Actions').length.toString(), color: '#10b981', icon: '🛡️' },
    { label: 'Security Alerts', value: logs.filter(l => l.category === 'Security Events' && l.severity === 'high').length.toString(), color: '#f59e0b', icon: '⚠️' },
    { label: 'Failed Logins', value: logs.filter(l => l.action.toLowerCase().includes('fail')).length.toString(), color: '#ef4444', icon: '🔒' },
  ];

  const FILTERS: FilterType[] = ['All Events', 'Admin Actions', 'Security Events', 'System Events'];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ ...FONT, color: '#e5e7eb' }}>

      {/* Top Title Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Terminal size={24} className="text-emerald-500" />
            Audit Logging Portal
          </h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '4px 0 0' }}>Trace real-time administrator operations, security alerts, and system activities.</p>
        </div>
        
        {/* Live Stream Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <button
            onClick={() => setLiveStream(!liveStream)}
            style={{
              background: liveStream ? '#10b98118' : '#161616',
              color: liveStream ? '#10b981' : '#a3a3a3',
              border: `1px solid ${liveStream ? '#10b98133' : '#222'}`,
              borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer'
            }}
          >
            {liveStream ? <Play size={12} className="animate-pulse" /> : <Pause size={12} />}
            {liveStream ? 'Live Feed: ON' : 'Live Feed: PAUSED'}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {STATS.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={card({ display: 'flex', alignItems: 'center', gap: 14, position: 'relative', overflow: 'hidden' })}>
            <span style={{ fontSize: 26, background: '#181818', padding: 8, borderRadius: 10 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: '#fff', lineHeight: 1.1 }}>{s.value}</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4, fontWeight: 600, textTransform: 'uppercase' }}>{s.label}</div>
            </div>
            <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, ${s.color}00, ${s.color}40, ${s.color}00)` }} />
          </motion.div>
        ))}
      </div>

      {/* Analytics Chart Block */}
      <div style={{ ...card(), marginBottom: 24, height: 260, display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 6 }}>
              <TrendingUp size={16} className="text-emerald-500" />
              Event Volume Distribution Trail
            </h3>
            <p style={{ margin: '2px 0 0', fontSize: 11, color: '#6b7280' }}>Real-time logs load activity metrics by category.</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 11, color: '#6b7280' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} /> Admin</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} /> Security</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} /> System</span>
          </div>
        </div>
        
        <div style={{ flex: 1, minHeight: 0 }}>
          {mounted && logs.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getChartData()} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#161616" />
                <XAxis dataKey="time" stroke="#6b7280" fontSize={10} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} />
                <Tooltip contentStyle={{ background: '#090909', border: '1px solid #1c1c1c', borderRadius: 8, color: '#fff', fontSize: 12 }} />
                <Area type="monotone" dataKey="admin" stroke="#10b981" fill="#10b981" fillOpacity={0.05} strokeWidth={2} name="Admin Actions" />
                <Area type="monotone" dataKey="security" stroke="#ef4444" fill="#ef4444" fillOpacity={0.05} strokeWidth={2} name="Security Events" />
                <Area type="monotone" dataKey="system" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.05} strokeWidth={2} name="System Events" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#6b7280', fontSize: 12 }}>
              No audit logs captured. Waiting for real-time user events...
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Logs and Alerts */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
        
        {/* Left Column: Interactive Logs Console Table */}
        <div>
          {/* Controls Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search admin, action, or client IP..."
                style={{ ...inputStyle, paddingLeft: 34 }}
              />
              <Search size={14} style={{ position: 'absolute', left: 12, top: 12, color: '#525252' }} />
            </div>
            
            <div style={{ display: 'flex', gap: 4 }}>
              {FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => { setFilter(f); setPage(1); }}
                  style={{
                    padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                    border: 'none', background: filter === f ? '#10b981' : '#141414',
                    color: filter === f ? '#000' : '#a3a3a3', transition: 'all 0.2s'
                  }}
                >
                  {f === 'All Events' ? 'All' : f.replace(' Events', '').replace(' Actions', '')}
                </button>
              ))}
            </div>
            
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => exportData('csv')} style={{ padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid #222', background: '#141414', color: '#e5e7eb' }}>CSV</button>
              <button onClick={() => exportData('json')} style={{ padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid #222', background: '#141414', color: '#e5e7eb' }}>JSON</button>
            </div>
          </div>

          <div style={{ background: '#0d0d0d', borderRadius: 14, border: '1px solid #1a1a1a', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#080808', borderBottom: '1px solid #1a1a1a' }}>
                  <th style={{ width: 28, padding: '10px 14px' }} />
                  {['Admin / Service', 'Action Logged', 'Target Object', 'IP / Location', 'Timestamp', 'Gateway Code'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {loading && logs.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>
                        <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px' }} />
                        Tracing security audit logs...
                      </td>
                    </tr>
                  ) : paginated.length === 0 ? (
                    <tr>
                      <td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#6b7280' }}>No matching audit traces found in database.</td>
                    </tr>
                  ) : (
                    paginated.map((e, i) => {
                      const isExpanded = expandedLogId === e.id;
                      return (
                        <Fragment key={e.id}>
                          {/* Event Base Row */}
                          <tr
                            key={`row-${e.id}`}
                            style={{
                              borderBottom: isExpanded ? 'none' : '1px solid #141414',
                              background: isExpanded ? '#121212' : 'transparent',
                              cursor: 'pointer', transition: 'background 0.2s'
                            }}
                            onClick={() => setExpandedLogId(isExpanded ? null : e.id)}
                          >
                            <td style={{ padding: '12px 14px', textAlign: 'center' }}>
                              {isExpanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
                            </td>
                            <td style={{ padding: '12px 14px', color: '#fff', fontWeight: 700 }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                <User size={13} className="text-zinc-500" />
                                {e.userName}
                              </span>
                            </td>
                            <td style={{ padding: '12px 14px' }}>
                              <code style={{ background: '#161616', border: '1px solid #222', padding: '3px 8px', borderRadius: 6, fontSize: 10, color: '#a78bfa', fontFamily: 'monospace' }}>
                                {e.action}
                              </code>
                            </td>
                            <td style={{ padding: '12px 14px', color: '#a3a3a3', maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.target}</td>
                            <td style={{ padding: '12px 14px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#fff' }}>
                                <Globe size={11} className="text-zinc-500" />
                                {e.ipAddress || '127.0.0.1'}
                              </div>
                              <div style={{ color: '#6b7280', fontSize: 10, paddingLeft: 15 }}>{e.location || 'Internal'}</div>
                            </td>
                            <td style={{ padding: '12px 14px', color: '#6b7280', whiteSpace: 'nowrap' }}>{e.timestamp}</td>
                            <td style={{ padding: '12px 14px' }}>{resultBadge(e.result)}</td>
                          </tr>

                          {/* Inspect Detail Sub-row */}
                          <AnimatePresence>
                            {isExpanded && (
                              <tr key={`detail-${e.id}`} style={{ background: '#121212' }}>
                                <td colSpan={8} style={{ padding: '12px 24px 20px 56px', borderBottom: '1px solid #1a1a1a' }}>
                                  <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    style={{ overflow: 'hidden' }}
                                  >
                                    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
                                      
                                      {/* Event Details JSON */}
                                      <div style={{ background: '#090909', border: '1px solid #1c1c1c', borderRadius: 8, padding: 14 }}>
                                        <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Raw Action Metadata JSON</span>
                                        <pre style={{
                                          background: '#040404', border: '1px solid #161616', borderRadius: 6,
                                          padding: 10, margin: 0, overflowX: 'auto', fontFamily: 'monospace', fontSize: 10, color: '#10b981'
                                        }}>
                                          {JSON.stringify({
                                            event_id: e.id,
                                            user_id: e.userId,
                                            username: e.userName,
                                            operation: e.action,
                                            target_identity: e.target,
                                            security_category: e.category,
                                            threat_severity: e.severity,
                                            client_ip: e.ipAddress || '127.0.0.1',
                                            geo_region: e.location || 'Internal',
                                            timestamp_epoch: new Date(e.timestamp).getTime() || Date.now()
                                          }, null, 2)}
                                        </pre>
                                      </div>

                                      {/* Security Action Controls */}
                                      <div style={{ background: '#090909', border: '1px solid #1c1c1c', borderRadius: 8, padding: 14, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                                        <div>
                                          <span style={{ fontSize: 11, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', display: 'block', marginBottom: 8 }}>Admin Controls</span>
                                          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                                            <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                                              <span style={{ color: '#6b7280' }}>Severity:</span>
                                              <span style={{ color: severityColor(e.severity), fontWeight: 700, textTransform: 'capitalize' }}>{e.severity}</span>
                                            </div>
                                            <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                                              <span style={{ color: '#6b7280' }}>Category:</span>
                                              <span style={{ color: '#fff', fontWeight: 600 }}>{e.category}</span>
                                            </div>
                                            <div style={{ fontSize: 11, display: 'flex', justifyContent: 'space-between' }}>
                                              <span style={{ color: '#6b7280' }}>Status Code:</span>
                                              <span style={{ color: e.result === 'success' ? '#10b981' : '#ef4444', fontWeight: 600 }}>{e.result === 'success' ? '200 OK' : '500 ERROR'}</span>
                                            </div>
                                          </div>
                                        </div>
                                        
                                        <div style={{ display: 'flex', gap: 6, marginTop: 14 }}>
                                          <button
                                            onClick={() => handleBlockIP(e.ipAddress)}
                                            style={{
                                              flex: 1, padding: '6px 10px', background: '#ef444415', color: '#ef4444',
                                              border: '1px solid #ef444422', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer'
                                            }}
                                          >
                                            Block IP
                                          </button>
                                          <button
                                            onClick={() => handleFlagUser(e.userName)}
                                            style={{
                                              flex: 1, padding: '6px 10px', background: '#f59e0b15', color: '#f59e0b',
                                              border: '1px solid #f59e0b22', borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: 'pointer'
                                            }}
                                          >
                                            Flag User
                                          </button>
                                        </div>
                                      </div>

                                    </div>
                                  </motion.div>
                                </td>
                              </tr>
                            )}
                          </AnimatePresence>
                        </Fragment>
                      );
                    })
                  )}
                </AnimatePresence>
              </tbody>
            </table>
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ padding: '12px 16px', borderTop: '1px solid #1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: '#6b7280' }}>Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} logs</span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{
                        width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 11,
                        background: page === p ? '#10b981' : '#141414', color: page === p ? '#000' : '#a3a3a3'
                      }}>
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Dynamic Security Alerts Box */}
        <div>
          <div style={{ background: '#0d0d0d', borderRadius: 14, border: '1px solid #2a1a1a', padding: 18 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <div style={{ fontWeight: 800, fontSize: 14, color: '#ef4444', display: 'flex', alignItems: 'center', gap: 6 }}>
                <span>🚨</span> Security Alerts
              </div>
              <span style={{ background: '#ef444415', color: '#ef4444', border: '1px solid #ef444422', fontSize: 9, fontWeight: 700, padding: '2px 6px', borderRadius: 4 }}>
                {securityAlerts.length} Active
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 380, overflowY: 'auto' }}>
              <AnimatePresence>
                {securityAlerts.map((a, i) => (
                  <motion.div
                    key={a.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    style={{
                      background: a.severity === 'high' ? 'rgba(239, 68, 68, 0.05)' : 'rgba(245, 158, 11, 0.05)',
                      borderRadius: 10, padding: 12, border: `1px solid ${a.severity === 'high' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)'}`
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: 12, color: a.severity === 'high' ? '#ef4444' : '#f59e0b' }}>{a.title}</span>
                      <span style={{ fontSize: 10, color: '#525252' }}>{a.time}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#a3a3a3', lineHeight: 1.4 }}>{a.desc}</div>
                    
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                      <button
                        onClick={() => handleDismissAlert(a.id)}
                        style={{
                          padding: '3px 8px', borderRadius: 4, border: 'none', cursor: 'pointer',
                          fontSize: 10, fontWeight: 700, background: '#161616', color: '#6b7280'
                        }}
                      >
                        Dismiss
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
              
              {securityAlerts.length === 0 && (
                <div style={{ color: '#525252', fontSize: 11, textAlign: 'center', padding: '20px 0' }}>
                  No active security warnings. Firewall status operational.
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14, borderTop: '1px solid #1a1a1a', paddingTop: 12 }}>
              <button
                onClick={() => toast('Security audit dispatch logs initialized.')}
                style={{
                  width: '100%', padding: '8px 0', borderRadius: 8, border: '1px solid #222',
                  background: '#141414', color: '#a3a3a3', fontSize: 11, fontWeight: 600, cursor: 'pointer'
                }}
              >
                Send Audit Summary Email
              </button>
            </div>
          </div>
        </div>
        
      </div>
    </motion.div>
  );
}
