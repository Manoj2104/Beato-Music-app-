'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import toast from 'react-hot-toast';

const errorData = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i}:00`,
  errorRate: +(Math.random() * 0.8).toFixed(2),
}));

const incidents = [
  { severity: 'major', title: 'Streaming API Latency Spike', duration: '18 min', resolved: '2h ago' },
  { severity: 'minor', title: 'Recommendation Engine Slowdown', duration: '42 min', resolved: '1d ago' },
  { severity: 'minor', title: 'Auth Token Refresh Delays', duration: '7 min', resolved: '3d ago' },
];

const sevColors: Record<string, string> = { major: '#ef4444', minor: '#f59e0b', info: '#10b981' };
const statusColors: Record<string, string> = { operational: '#b08850', degraded: '#f59e0b', down: '#ef4444' };

const card = (style?: React.CSSProperties): React.CSSProperties => ({
  background: '#121212', border: '1px solid #1a1a1a', borderRadius: 14, padding: 20, ...style,
});

export default function SystemHealthTab() {
  const [services, setServices] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ cpu: 34, memory: 68, disk: 45, network: 2.4 });
  const [lastUpdated, setLastUpdated] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchServices = async () => {
    try {
      const res = await fetch('/api/admin/system-health');
      const data = await res.json();
      if (data.success) {
        setServices(data.services || []);
      }
    } catch (err) {
      console.error('Error fetching system health:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchServices();
    const iv = setInterval(() => {
      setMetrics({
        cpu: Math.floor(Math.random() * 20) + 28,
        memory: Math.floor(Math.random() * 15) + 62,
        disk: Math.floor(Math.random() * 8) + 42,
        network: +(Math.random() * 1.5 + 1.8).toFixed(1),
      });
      setLastUpdated(0);
    }, 3000);
    const counter = setInterval(() => setLastUpdated(p => p + 1), 1000);
    const poller = setInterval(fetchServices, 10000);
    return () => {
      clearInterval(iv);
      clearInterval(counter);
      clearInterval(poller);
    };
  }, []);

  const handleUpdateStatus = async (name: string, newStatus: string) => {
    try {
      const res = await fetch('/api/admin/system-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Service ${name} status set to ${newStatus}`);
        fetchServices();
      } else {
        toast.error(data.error || 'Failed to update status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating service status');
    }
  };

  const allOk = services.length > 0 && services.every(s => s.status === 'operational');

  return (
    <div style={{ color: '#fff', fontFamily: 'Inter, sans-serif' }}>
      {/* Overall Status */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ ...card(), marginBottom: 24, display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{ width: 14, height: 14, borderRadius: '50%', background: allOk ? '#b08850' : '#f59e0b', boxShadow: `0 0 12px ${allOk ? '#b08850' : '#f59e0b'}` }} />
        <div>
          <p style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>
            {services.length === 0 ? 'Connecting...' : allOk ? 'All Systems Operational' : `${services.filter(s => s.status !== 'operational').length} Systems Degraded / Down`}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Last updated: {lastUpdated}s ago</p>
        </div>
        <div style={{ marginLeft: 'auto' }}>
          <button onClick={() => { fetchServices(); toast.success('Status page refreshed'); }} style={{ background: '#1a1a1a', border: 'none', borderRadius: 8, color: '#9ca3af', padding: '7px 14px', fontSize: 12, cursor: 'pointer' }}>↻ Refresh</button>
        </div>
      </motion.div>

      {/* API Services Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 }}>
        {loading && services.length === 0 ? (
          <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20, color: '#6b7280' }}>Loading system health...</div>
        ) : (
          services.map(s => (
            <div key={s.name} style={{ ...card(), borderLeft: `3px solid ${statusColors[s.status] || '#888'}`, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 700, color: '#e5e7eb' }}>{s.name}</p>
                  <span style={{ background: (statusColors[s.status] || '#888') + '22', color: statusColors[s.status] || '#888', fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>{s.status}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 12 }}>
                  <div><p style={{ margin: 0, fontSize: 10, color: '#6b7280' }}>Uptime</p><p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#b08850' }}>{s.uptime}%</p></div>
                  <div><p style={{ margin: 0, fontSize: 10, color: '#6b7280' }}>Response</p><p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#fff' }}>{s.respMs}ms</p></div>
                  <div style={{ gridColumn: '1/-1' }}><p style={{ margin: 0, fontSize: 10, color: '#6b7280' }}>Req/min</p><p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: '#9ca3af' }}>{(s.rpm || 0).toLocaleString()}</p></div>
                </div>
              </div>

              {/* Status Simulator Controls */}
              <div style={{ borderTop: '1px solid #1a1a1a', paddingTop: 10, marginTop: 'auto' }}>
                <p style={{ margin: '0 0 6px 0', fontSize: 9, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>Simulate Status</p>
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['operational', 'degraded', 'down'] as const).map(st => (
                    <button
                      key={st}
                      onClick={() => handleUpdateStatus(s.name, st)}
                      style={{
                        flex: 1,
                        fontSize: 9,
                        padding: '4px 0',
                        borderRadius: 4,
                        border: 'none',
                        background: s.status === st ? statusColors[st] + '33' : '#161616',
                        color: s.status === st ? statusColors[st] : '#6b7280',
                        borderWidth: 1,
                        borderStyle: 'solid',
                        borderColor: s.status === st ? statusColors[st] : 'transparent',
                        fontWeight: s.status === st ? 700 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                      }}
                    >
                      {st.substring(0, 3).toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
        {/* Server Metrics */}
        <div style={card()}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, fontWeight: 700 }}>Server Metrics</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {[
              { label: 'CPU Usage', value: metrics.cpu, unit: '%', color: metrics.cpu > 80 ? '#ef4444' : '#b08850' },
              { label: 'Memory Usage', value: metrics.memory, unit: '%', color: metrics.memory > 85 ? '#ef4444' : '#10b981' },
              { label: 'Disk I/O', value: metrics.disk, unit: '%', color: '#f59e0b' },
              { label: 'Network', value: metrics.network, unit: ' GB/s', color: '#10b981' },
            ].map(m => (
              <div key={m.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: 12, color: '#9ca3af' }}>{m.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: m.color }}>{m.value}{m.unit}</span>
                </div>
                {m.unit === '%' && (
                  <div style={{ height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
                    <motion.div animate={{ width: `${m.value}%` }} transition={{ duration: 0.5 }}
                      style={{ height: '100%', background: m.color, borderRadius: 3 }} />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Error Rate */}
        <div style={card()}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Error Rate (24h)</h3>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={errorData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
              <XAxis dataKey="hour" tick={{ fill: '#6b7280', fontSize: 9 }} interval={5} />
              <YAxis tick={{ fill: '#6b7280', fontSize: 9 }} unit="%" />
              <Tooltip contentStyle={{ background: '#1a1a1a', border: '1px solid #333', borderRadius: 8, color: '#fff' }} />
              <Line type="monotone" dataKey="errorRate" stroke="#ef4444" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Incidents */}
      <div style={card()}>
        <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Recent Incidents</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {incidents.map((inc, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, background: '#0a0a0a', borderRadius: 10, padding: '12px 16px', border: `1px solid ${sevColors[inc.severity]}33` }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: sevColors[inc.severity] }} />
              <span style={{ background: sevColors[inc.severity] + '22', color: sevColors[inc.severity], fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' }}>{inc.severity}</span>
              <span style={{ fontSize: 13, color: '#e5e7eb', fontWeight: 600, flex: 1 }}>{inc.title}</span>
              <span style={{ fontSize: 11, color: '#6b7280' }}>Duration: {inc.duration}</span>
              <span style={{ fontSize: 11, color: '#b08850' }}>✓ Resolved {inc.resolved}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
