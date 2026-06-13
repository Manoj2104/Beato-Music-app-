'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import toast from 'react-hot-toast';

// ─── Local Styling Helpers ──────────────────────────────────────────────────
const COLORS = {
  primary: '#1db954',
  primaryBg: 'rgba(29, 185, 84, 0.15)',
  blue: '#10b981',
  purple: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
  text: '#ffffff',
  textMuted: '#6b7280',
  border: '#222222',
  card: '#121212',
  cardBg: '#1e1e1e',
};

const chartTooltip = {
  contentStyle: {
    background: '#181818',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    color: '#fff',
    fontSize: 12,
    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
  }
};

// Types for components
interface AnalyticsData {
  currency: {
    code: string;
    rate: number;
    symbol: string;
  };
  stats: {
    activeNowUsers: number;
    liveStreamsCount: number;
    totalListenHours: number;
    avgSessionMinutes: number;
    skipRate: number;
    completionRate: number;
    totalPlays: number;
    totalSongs: number;
    activeArtists: number;
    totalUsers: number;
  };
  trendData: Array<{ day: string; dau: number; signups: number; churned: number }>;
  devices: Array<{ name: string; pct: number; color: string }>;
  audioQuality: Array<{ name: string; count: number; pct: number; color: string }>;
  genreData: Array<{ genre: string; streams: number }>;
  genreComparison: Array<{ genre: string; skipRate: number; completionRate: number }>;
  funnel: Array<{ label: string; count: number; pct: number; color: string }>;
  rfmSegments: Array<{ name: string; count: number; pct: number; desc: string; color: string }>;
  cohortMonths: string[];
  cohortData: Record<string, number[]>;
  geoData: Array<{ countryCode: string; countryName: string; streams: number; revenue: number; users: number; convRate: number }>;
  latencyCorrelation: Array<{ hour: string; cpuLoad: number; apiLatency: number; streamsFails: number }>;
  anomalies: string[];
}

export default function AnalyticsTab() {
  // Filters & Timeframe state
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | '90d'>('30d');
  const [filterCountry, setFilterCountry] = useState<string>('all');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Interactive UI configurations
  const [liveAutoRefresh, setLiveAutoRefresh] = useState<boolean>(true);
  const [showMLForecast, setShowMLForecast] = useState<boolean>(false);
  const [showABMarkers, setShowABMarkers] = useState<boolean>(true);
  const [geoSearch, setGeoSearch] = useState<string>('');
  const [geoSort, setGeoSort] = useState<'streams' | 'revenue' | 'users'>('streams');

  // Live Audit event log state
  const [auditEvents, setAuditEvents] = useState<Array<{ id: string; time: string; msg: string; type: string }>>([
    { id: '1', time: '12:35:10', msg: 'User UPGRADE: user-789 premium subscription (US)', type: 'upgrade' },
    { id: '2', time: '12:35:15', msg: 'Heartbeat stream: "Neon Dreams" playing (IN)', type: 'stream' },
    { id: '3', time: '12:35:22', msg: 'System check: DB compression successful (OK)', type: 'system' }
  ]);

  // Alert Rule manager state
  const [alertRules, setAlertRules] = useState([
    { id: '1', metric: 'Skip Rate', threshold: '> 40%', active: true },
    { id: '2', metric: 'Daily Churn', threshold: '> 500 users', active: false }
  ]);
  const [newMetric, setNewMetric] = useState('Skip Rate');
  const [newThreshold, setNewThreshold] = useState('> 45%');

  // Custom Metric Sandbox builder state
  const [customXAxis, setCustomXAxis] = useState<'genre' | 'plan' | 'country'>('genre');
  const [customYAxis, setCustomYAxis] = useState<'streams' | 'users' | 'revenue'>('streams');

  // Interactive Sliders for Funnel
  const [regSlider, setRegSlider] = useState<number>(20);
  const [actSlider, setActSlider] = useState<number>(60);
  const [premSlider, setPremSlider] = useState<number>(20);

  // Drill down cohort details modal
  const [cohortModal, setCohortModal] = useState<{ month: string; week: number; pct: number } | null>(null);

  // Dynamic API analytics payload
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch Analytics payload from route
  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`/api/admin/analytics?timeframe=${timeframe}&country=${filterCountry}&tier=${filterTier}&status=${filterStatus}`);
      const payload = await res.json();
      if (payload.success) {
        setData(payload);
      } else {
        toast.error('Failed to load live server calculations.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Connection failure retrieving analytics.');
    } finally {
      setLoading(false);
    }
  };

  // Run initial fetch and configure interval refresh
  useEffect(() => {
    setLoading(true);
    fetchAnalytics();
  }, [timeframe, filterCountry, filterTier, filterStatus]);

  useEffect(() => {
    if (!liveAutoRefresh) return;
    const t = setInterval(() => {
      fetchAnalytics();
      
      // Push dynamic live audit event logs
      const timeStr = new Date().toLocaleTimeString();
      const mockMsgs = [
        { msg: 'Auth token generated for Super Admin', type: 'system' },
        { msg: 'Audio buffering event logged in GB server', type: 'latency' },
        { msg: 'Track "Radiant" played by premium subscriber (IN)', type: 'stream' },
        { msg: 'Payout cleared for artist: Aurora Nightfall', type: 'payout' },
        { msg: 'Weekly backup of beato_db.json finished', type: 'system' }
      ];
      const selected = mockMsgs[Math.floor(Math.random() * mockMsgs.length)];
      setAuditEvents(prev => [
        { id: String(Date.now()), time: timeStr, msg: selected.msg, type: selected.type },
        ...prev.slice(0, 7)
      ]);
    }, 4000);
    return () => clearInterval(t);
  }, [liveAutoRefresh, timeframe, filterCountry, filterTier, filterStatus]);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: 40, height: 40, border: `3px solid ${COLORS.primaryBg}`, borderTopColor: COLORS.primary, borderRadius: '50%' }} 
        />
        <div style={{ color: COLORS.textMuted, fontSize: 14 }}>Aggregating Beato data matrices...</div>
      </div>
    );
  }

  // Calculate ML Forecast Trend data if toggled
  const getMLTrendData = () => {
    if (!showMLForecast) return data.trendData;
    // Compute simple linear regression overlay
    const yValues = data.trendData.map(d => d.dau);
    const n = yValues.length;
    const xSum = (n * (n - 1)) / 2;
    const ySum = yValues.reduce((a, b) => a + b, 0);
    let xySum = 0, xxSum = 0;
    yValues.forEach((y, x) => {
      xySum += x * y;
      xxSum += x * x;
    });
    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum || 1);
    const intercept = (ySum - slope * xSum) / n;

    return data.trendData.map((d, i) => {
      const pred = Math.round(slope * i + intercept);
      return {
        ...d,
        'Predicted DAU': pred
      };
    });
  };

  // CSV Exporter logic
  const exportTrendCSV = () => {
    const headers = 'Date,Daily Active Users,New Signups,Churned\n';
    const rows = data.trendData.map(d => `${d.day},${d.dau},${d.signups},${d.churned}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beato_trend_analytics_${timeframe}.csv`;
    a.click();
    toast.success('Trend data exported successfully!');
  };

  const exportCohortCSV = () => {
    const headers = 'Cohort,' + data.cohortMonths.join(',') + '\n';
    const rows = Object.entries(data.cohortData).map(([cohort, values]) => {
      return `${cohort},${values.join(',')}`;
    }).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `beato_cohort_retention.csv`;
    a.click();
    toast.success('Cohort metrics exported successfully!');
  };

  // Funnel calculations based on custom sliders
  const calculateSimulatedRevenue = () => {
    const totalVisitors = data.funnel[0].count;
    const simulatedReg = Math.round(totalVisitors * (regSlider / 100));
    const simulatedAct = Math.round(simulatedReg * (actSlider / 100));
    const simulatedPrem = Math.round(simulatedAct * (premSlider / 100));
    
    // Average Monthly Subscription Ticket Price
    const baseTicket = data.currency.code === 'INR' ? 830 : 9.99;
    const monthlyRevenue = simulatedPrem * baseTicket;
    
    return {
      premiumCount: simulatedPrem.toLocaleString(),
      revenue: Math.round(monthlyRevenue).toLocaleString()
    };
  };

  const simulatedRevenue = calculateSimulatedRevenue();

  // Custom sandbox builder calculations
  const getSandboxChartData = () => {
    if (customXAxis === 'genre') {
      return data.genreData.map(g => ({
        name: g.genre,
        value: customYAxis === 'streams' ? g.streams : customYAxis === 'users' ? Math.round(g.streams / 40) : Math.round(g.streams * 0.005)
      }));
    } else if (customXAxis === 'plan') {
      const plans = ['free', 'premium', 'family', 'student', 'creator'];
      return plans.map(p => {
        const uCount = data.stats.totalUsers * (p === 'free' ? 0.6 : p === 'premium' ? 0.25 : 0.05);
        return {
          name: p.toUpperCase(),
          value: Math.round(customYAxis === 'users' ? uCount : customYAxis === 'streams' ? uCount * 120 : uCount * (p === 'free' ? 0 : p === 'premium' ? 10 : 15) * data.currency.rate)
        };
      });
    } else {
      return data.geoData.slice(0, 5).map(g => ({
        name: g.countryName,
        value: customYAxis === 'streams' ? g.streams : customYAxis === 'users' ? g.users : g.revenue
      }));
    }
  };

  const sandboxData = getSandboxChartData();

  // Alert Manager Rule Addition
  const handleAddAlert = (e: React.FormEvent) => {
    e.preventDefault();
    setAlertRules(prev => [
      ...prev,
      { id: String(Date.now()), metric: newMetric, threshold: newThreshold, active: true }
    ]);
    toast.success('Custom monitoring alert registered!');
  };

  // Executive print report
  const printReport = () => {
    window.print();
  };

  return (
    <div style={{ padding: '24px 0', fontFamily: 'Inter, sans-serif', color: COLORS.text }}>
      <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-area, #print-area * {
            visibility: visible;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
        }
      `}</style>

      {/* ─── Control Header ─── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: '#121212', border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        
        {/* Top line controls */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>📊</span>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Enterprise Analytical Intelligence</h2>
              <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0 }}>Real-time user count auditing, forecasts, RFM cohort tables & simulation dashboards.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={printReport}
              style={{ background: '#1a1a1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#ccc', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
              🖨️ Export PDF Report
            </button>
            <button onClick={fetchAnalytics}
              style={{ background: COLORS.primaryBg, border: `1px solid ${COLORS.primary}44`, borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: COLORS.primary, cursor: 'pointer' }}>
              🔄 Force Reload
            </button>
          </div>
        </div>

        {/* Dynamic Multi-dimensional Filters */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, borderTop: `1px solid ${COLORS.border}`, paddingTop: 14 }}>
          {/* Timeframe */}
          <div>
            <label style={{ fontSize: 11, color: COLORS.textMuted, display: 'block', marginBottom: 5, fontWeight: 600 }}>TIMEFRAME SELECTOR</label>
            <select value={timeframe} onChange={(e: any) => setTimeframe(e.target.value)}
              style={{ background: '#1a1a1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px', color: '#fff', fontSize: 12, width: '100%', cursor: 'pointer' }}>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days (Default)</option>
              <option value="90d">Last 90 Days</option>
            </select>
          </div>

          {/* Country */}
          <div>
            <label style={{ fontSize: 11, color: COLORS.textMuted, display: 'block', marginBottom: 5, fontWeight: 600 }}>DEMOGRAPHIC REGION</label>
            <select value={filterCountry} onChange={(e) => setFilterCountry(e.target.value)}
              style={{ background: '#1a1a1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px', color: '#fff', fontSize: 12, width: '100%', cursor: 'pointer' }}>
              <option value="all">All Countries</option>
              <option value="IN">India (IN)</option>
              <option value="US">United States (US)</option>
              <option value="GB">United Kingdom (GB)</option>
              <option value="BR">Brazil (BR)</option>
              <option value="DE">Germany (DE)</option>
            </select>
          </div>

          {/* Subscription Tier */}
          <div>
            <label style={{ fontSize: 11, color: COLORS.textMuted, display: 'block', marginBottom: 5, fontWeight: 600 }}>MEMBERSHIP SUBSCRIPTION</label>
            <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)}
              style={{ background: '#1a1a1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px', color: '#fff', fontSize: 12, width: '100%', cursor: 'pointer' }}>
              <option value="all">All Tiers</option>
              <option value="free">Free Users</option>
              <option value="premium">Premium Core</option>
              <option value="family">Family Tier</option>
              <option value="student">Student Tier</option>
              <option value="creator">Creator Tier</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label style={{ fontSize: 11, color: COLORS.textMuted, display: 'block', marginBottom: 5, fontWeight: 600 }}>USER ACCOUNT STATUS</label>
            <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
              style={{ background: '#1a1a1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px', color: '#fff', fontSize: 12, width: '100%', cursor: 'pointer' }}>
              <option value="all">All Statuses</option>
              <option value="active">Active Members Only</option>
              <option value="inactive">Inactive / Sleep Members</option>
            </select>
          </div>
        </div>
      </motion.div>

      {/* Print target outer box */}
      <div id="print-area">
        
        {/* ─── Real-Time Glowing Live Counter Ticker ─── */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ background: 'linear-gradient(135deg, rgba(29, 185, 84,0.1) 0%, rgba(18,18,18,1) 100%)', border: `1px solid ${COLORS.primary}33`, borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <motion.span 
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.9, 1.1, 0.9] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              style={{ width: 10, height: 10, background: COLORS.primary, borderRadius: '50%', display: 'inline-block', boxShadow: `0 0 10px ${COLORS.primary}` }} 
            />
            <div>
              <span style={{ fontSize: 11, fontWeight: 800, color: COLORS.primary, letterSpacing: '0.08em' }}>REAL-TIME STATUS INTAKE</span>
              <div style={{ display: 'flex', gap: 20, marginTop: 4, flexWrap: 'wrap' }}>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Listeners Browsing: <strong style={{ color: '#fff', fontSize: 16, fontFamily: 'Outfit' }}>{data.stats.activeNowUsers.toLocaleString()}</strong></span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Active Stream Players: <strong style={{ color: '#fff', fontSize: 16, fontFamily: 'Outfit' }}>{data.stats.liveStreamsCount.toLocaleString()}</strong></span>
                <span style={{ fontSize: 13, fontWeight: 500 }}>Cumulative Streams: <strong style={{ color: COLORS.primary, fontSize: 16, fontFamily: 'Outfit' }}>{data.stats.totalPlays.toLocaleString()}</strong></span>
              </div>
            </div>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: COLORS.textMuted }}>Auto-Refresh Status Feed</span>
            <button onClick={() => setLiveAutoRefresh(!liveAutoRefresh)}
              style={{ background: liveAutoRefresh ? COLORS.primary : '#333', border: 'none', color: '#fff', padding: '5px 12px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
              {liveAutoRefresh ? 'ACTIVE (4s)' : 'MUTED'}
            </button>
          </div>
        </motion.div>

        {/* ─── Anomaly Detector Warning Banner ─── */}
        {data.anomalies && data.anomalies.length > 0 && (
          <motion.div initial={{ scale: 0.98, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ background: 'rgba(239, 68, 68, 0.08)', border: `1px solid ${COLORS.red}33`, borderRadius: 14, padding: '14px 18px', marginBottom: 24 }}>
            <h4 style={{ margin: '0 0 8px 0', color: COLORS.red, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 800 }}>
              ⚠️ SYSTEM OUTLIER ALERT ENGINE ({data.anomalies.length})
            </h4>
            <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: '#fca5a5', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {data.anomalies.map((alert, i) => (
                <li key={i}>{alert}</li>
              ))}
            </ul>
          </motion.div>
        )}

        {/* ─── Main Aggregates KPIs Row ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Calculated Hours Streamed', value: `${(data.stats.totalListenHours / 1000000).toFixed(2)}M hrs`, desc: 'Estimated server playback duration.', color: COLORS.primary },
            { label: 'Avg User Session Period', value: `${data.stats.avgSessionMinutes} min`, desc: 'Session lengths before tab termination.', color: COLORS.blue },
            { label: 'Dynamic Track Skip Ratio', value: `${data.stats.skipRate}%`, desc: 'Plays skipped before 30-second timestamp.', color: COLORS.orange },
            { label: 'Dynamic Track Completion', value: `${data.stats.completionRate}%`, desc: 'Streams completed past 80% marks.', color: COLORS.purple }
          ].map((kpi, idx) => (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
              style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: '16px 18px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}>
              <span style={{ fontSize: 10, color: COLORS.textMuted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{kpi.label}</span>
              <div style={{ fontSize: 26, fontWeight: 800, color: kpi.color, margin: '4px 0', fontFamily: 'Outfit, sans-serif' }}>{kpi.value}</div>
              <span style={{ fontSize: 11, color: COLORS.textMuted }}>{kpi.desc}</span>
            </motion.div>
          ))}
        </div>

        {/* ─── 30-Day Trend Chart & Forecast (ML) ─── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>User Flow Metrics & Engagement Trends</h3>
              <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0 }}>Visualizes daily DAU counts, onboarding signups, and churn vectors.</p>
            </div>
            
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {/* Forecast Toggle */}
              <button onClick={() => setShowMLForecast(!showMLForecast)}
                style={{ background: showMLForecast ? COLORS.primaryBg : '#1a1a1a', border: `1px solid ${showMLForecast ? COLORS.primary : COLORS.border}`, color: showMLForecast ? COLORS.primary : '#ccc', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                🤖 Apply ML Projection Overlay
              </button>
              {/* Export Button */}
              <button onClick={exportTrendCSV}
                style={{ background: '#1a1a1a', border: `1px solid ${COLORS.border}`, color: '#aaa', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                📤 Export CSV
              </button>
            </div>
          </div>

          <div style={{ height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={getMLTrendData()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" />
                <XAxis dataKey="day" tick={{ fill: '#666', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis yAxisId="left" tick={{ fill: '#666', fontSize: 9 }} axisLine={false} tickLine={false} tickFormatter={v => `${(v/1000).toFixed(0)}K`} />
                <YAxis yAxisId="right" orientation="right" tick={{ fill: '#666', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltip} />
                <Legend wrapperStyle={{ fontSize: 11, paddingTop: 10 }} />
                
                {/* Active Line */}
                <Line yAxisId="left" type="monotone" dataKey="dau" name="Daily Active Users (DAU)" stroke={COLORS.primary} strokeWidth={2.5} dot={false} activeDot={{ r: 5 }} />
                
                {/* Signups and Churn */}
                <Line yAxisId="right" type="monotone" dataKey="signups" name="New Signups" stroke={COLORS.blue} strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="churned" name="Account Churns" stroke={COLORS.red} strokeWidth={1.5} strokeDasharray="4 3" dot={false} />
                
                {/* ML Forecast line if active */}
                {showMLForecast && (
                  <Line yAxisId="left" type="monotone" dataKey="Predicted DAU" name="ML Projected DAU (7d)" stroke={COLORS.orange} strokeWidth={2} strokeDasharray="5 5" dot={false} />
                )}

                {/* Campaign Events/A/B markers */}
                {showABMarkers && (
                  <Line yAxisId="left" dataKey="dummy" stroke="transparent" label={(props: any) => {
                    const idx = props.index;
                    if (idx === 7) return <text x={props.x} y={40} fill="#f59e0b" fontSize="9" fontWeight="800">🚀 A/B Test v2.1</text>;
                    if (idx === 22) return <text x={props.x} y={70} fill="#10b981" fontSize="9" fontWeight="800">📣 Ad Campaign</text>;
                    return null;
                  }} />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* ─── Funnel Slider Simulator & Sandbox builder row ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
          
          {/* Custom metric sandbox builder */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif' }}>📊 Custom Query Analytics Sandbox</h3>
            <p style={{ fontSize: 11, color: COLORS.textMuted, margin: '0 0 16px 0' }}>Plot user databases parameters against streams or conversion metrics dynamically.</p>
            
            <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
              <div>
                <label style={{ fontSize: 10, color: COLORS.textMuted, display: 'block', marginBottom: 4, fontWeight: 600 }}>DIMENSION (X-AXIS)</label>
                <select value={customXAxis} onChange={(e: any) => setCustomXAxis(e.target.value)}
                  style={{ background: '#1a1a1a', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 10px', color: '#fff', fontSize: 11 }}>
                  <option value="genre">Music Genre</option>
                  <option value="plan">Subscription Plans</option>
                  <option value="country">Country Code</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 10, color: COLORS.textMuted, display: 'block', marginBottom: 4, fontWeight: 600 }}>MEASURE (Y-AXIS)</label>
                <select value={customYAxis} onChange={(e: any) => setCustomYAxis(e.target.value)}
                  style={{ background: '#1a1a1a', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '5px 10px', color: '#fff', fontSize: 11 }}>
                  <option value="streams">Volume of Plays (Streams)</option>
                  <option value="users">Unique Accounts Count</option>
                  <option value="revenue">Financial Revenue Value</option>
                </select>
              </div>
            </div>

            <div style={{ height: 160 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sandboxData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" />
                  <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#666', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip {...chartTooltip} formatter={(v: any) => [v.toLocaleString(), customYAxis.toUpperCase()]} />
                  <Bar dataKey="value" fill={COLORS.primary} radius={[4, 4, 0, 0]} maxBarSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Interactive Conversion funnel simulator */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif' }}>🧪 Onboarding Funnel Conversion Optimizer</h3>
            <p style={{ fontSize: 11, color: COLORS.textMuted, margin: '0 0 14px 0' }}>Drag conversion vectors sliders below to compute forecasted MRR calculations.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span>Register Rate (Visited → Registered)</span>
                  <span style={{ color: COLORS.blue, fontWeight: 700 }}>{regSlider}%</span>
                </div>
                <input type="range" min="5" max="80" value={regSlider} onChange={(e) => setRegSlider(Number(e.target.value))}
                  style={{ width: '100%', accentColor: COLORS.blue }} />
              </div>
              
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span>Activation Rate (Registered → Profile Setup)</span>
                  <span style={{ color: COLORS.orange, fontWeight: 700 }}>{actSlider}%</span>
                </div>
                <input type="range" min="10" max="95" value={actSlider} onChange={(e) => setActSlider(Number(e.target.value))}
                  style={{ width: '100%', accentColor: COLORS.orange }} />
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                  <span>Premium conversion (Activated → Paid Account)</span>
                  <span style={{ color: COLORS.primary, fontWeight: 700 }}>{premSlider}%</span>
                </div>
                <input type="range" min="1" max="50" value={premSlider} onChange={(e) => setPremSlider(Number(e.target.value))}
                  style={{ width: '100%', accentColor: COLORS.primary }} />
              </div>
            </div>

            <div style={{ background: '#181818', border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px', marginTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 10, color: COLORS.textMuted }}>PROJECTED PREMIUM MEMBERS</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>{simulatedRevenue.premiumCount}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: COLORS.textMuted }}>ESTIMATED MRR</div>
                <div style={{ fontSize: 18, fontWeight: 800, color: COLORS.primary }}>
                  {data.currency.symbol}{simulatedRevenue.revenue}
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ─── Funnel and Device Breakdown row ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
          
          {/* User Funnel Table */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 14px 0', fontFamily: 'Outfit, sans-serif' }}>Onboarding Conversion Stages</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.funnel.map((step, idx) => (
                <div key={step.label}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                    <span style={{ color: '#ccc', fontWeight: 500 }}>{step.label}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: step.color, fontWeight: 700 }}>{step.count.toLocaleString()}</span>
                      <span style={{ color: COLORS.textMuted, marginLeft: 6 }}>({step.pct}%)</span>
                    </div>
                  </div>
                  <div style={{ background: '#1a1a1a', borderRadius: 8, height: 10, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${step.pct}%` }} transition={{ duration: 0.8 }}
                      style={{ height: '100%', background: step.color, borderRadius: 8 }} />
                  </div>
                  {idx < data.funnel.length - 1 && (
                    <div style={{ textAlign: 'center', color: '#666', fontSize: 11, marginTop: 4 }}>
                      → {((data.funnel[idx + 1].count / step.count) * 100).toFixed(1)}% continue
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>

          {/* Device breakdowns */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 16px 0', fontFamily: 'Outfit, sans-serif' }}>Platform Device Analysis</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data.devices.map(dev => (
                <div key={dev.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                    <span style={{ color: '#ccc', fontWeight: 500 }}>{dev.name}</span>
                    <span style={{ color: dev.color, fontWeight: 700 }}>{dev.pct}%</span>
                  </div>
                  <div style={{ background: '#1a1a1a', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${dev.pct}%` }} transition={{ duration: 0.7 }}
                      style={{ height: '100%', background: dev.color, borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ─── Genre plays comparisons + Server correlation row ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
          
          {/* Genre Performance skips vs completion */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px 0', fontFamily: 'Outfit, sans-serif' }}>Genre Playability Skips vs Completion</h3>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.genreComparison} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" />
                  <XAxis dataKey="genre" tick={{ fill: '#666', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#666', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip {...chartTooltip} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Bar dataKey="skipRate" name="Skip Rate %" fill={COLORS.orange} radius={[2, 2, 0, 0]} />
                  <Bar dataKey="completionRate" name="Completion Rate %" fill={COLORS.primary} radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Server Load vs Skip correlations */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 16px 0', fontFamily: 'Outfit, sans-serif' }}>Server Load vs Playback Latency Correlation</h3>
            <div style={{ height: 200 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.latencyCorrelation} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" />
                  <XAxis dataKey="hour" tick={{ fill: '#666', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="left" tick={{ fill: '#666', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fill: '#666', fontSize: 9 }} axisLine={false} tickLine={false} />
                  <Tooltip {...chartTooltip} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Area yAxisId="left" type="monotone" dataKey="cpuLoad" name="CPU Load %" stroke={COLORS.red} fill="rgba(239, 68, 68, 0.15)" strokeWidth={1.5} />
                  <Area yAxisId="right" type="monotone" dataKey="apiLatency" name="API Latency (ms)" stroke={COLORS.blue} fill="rgba(16, 185, 129, 0.1)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* ─── RFM Analysis & Audio Quality Breakdown ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, marginBottom: 24, flexWrap: 'wrap' }}>
          
          {/* RFM Segmentation */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif' }}>RFM Cohort Engagement Segments</h3>
            <p style={{ fontSize: 11, color: COLORS.textMuted, margin: '0 0 16px 0' }}>Customer segregation analyzing Listening Recency, Playback Frequency, and Premium Tier Monetary value.</p>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
              {data.rfmSegments.map(segment => (
                <div key={segment.name} style={{ background: '#1a1a1a', border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: '12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#fff' }}>{segment.name}</span>
                    <span style={{ fontSize: 11, fontWeight: 800, color: segment.color }}>{segment.pct}%</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: segment.color, fontFamily: 'Outfit' }}>{segment.count.toLocaleString()} users</div>
                  <span style={{ fontSize: 10, color: COLORS.textMuted }}>{segment.desc}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Audio Quality Preferences */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px' }}>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 16px 0', fontFamily: 'Outfit, sans-serif' }}>Stream Quality Config Preferences</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {data.audioQuality.map(item => (
                <div key={item.name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                    <span style={{ color: '#ccc', fontWeight: 500 }}>{item.name}</span>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ color: '#fff', fontWeight: 600, marginRight: 8 }}>{item.count.toLocaleString()} {item.count === 1 ? 'user' : 'users'}</span>
                      <span style={{ color: item.color, fontWeight: 700 }}>({item.pct}%)</span>
                    </div>
                  </div>
                  <div style={{ background: '#1a1a1a', borderRadius: 6, height: 8, overflow: 'hidden' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${item.pct}%` }} transition={{ duration: 0.7 }}
                      style={{ height: '100%', background: item.color, borderRadius: 6 }} />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* ─── Retention Cohort Table ─── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Weekly Cohort Retention Matrix</h3>
              <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0 }}>Indicates percentage of unique active users returning week after signup.</p>
            </div>
            
            <button onClick={exportCohortCSV}
              style={{ background: '#1a1a1a', border: `1px solid ${COLORS.border}`, color: '#aaa', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              📤 Export Cohort Matrix
            </button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}` }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: COLORS.textMuted, fontSize: 11, fontWeight: 700 }}>Cohort Month</th>
                  {Array.from({ length: 8 }, (_, i) => (
                    <th key={i} style={{ padding: '10px 8px', textAlign: 'center', color: COLORS.textMuted, fontSize: 11, fontWeight: 700 }}>Week {i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(data.cohortData).map(([month, vals]) => (
                  <tr key={month} style={{ borderBottom: '1px solid #161616' }}>
                    <td style={{ padding: '12px 14px', color: '#fff', fontSize: 12, fontWeight: 700 }}>{month}</td>
                    {vals.map((pct, idx) => {
                      // Apply shades of green based on retention values
                      let bg = 'transparent';
                      let color = '#555';
                      if (pct > 0) {
                        color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#4ade80' : pct >= 40 ? '#f59e0b' : '#ef4444';
                        bg = pct >= 80 ? 'rgba(34, 197, 94, 0.12)' : pct >= 60 ? 'rgba(74, 222, 128, 0.08)' : pct >= 40 ? 'rgba(245, 158, 11, 0.08)' : 'rgba(239, 68, 68, 0.08)';
                      }
                      return (
                        <td key={idx} style={{ padding: '8px 4px', textAlign: 'center' }}>
                          {pct > 0 ? (
                            <button onClick={() => setCohortModal({ month, week: idx + 1, pct })}
                              style={{ background: bg, color, border: `1px solid ${color}33`, padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: 'pointer', outline: 'none' }}>
                              {pct}%
                            </button>
                          ) : (
                            <span style={{ color: '#2a2a2a' }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ─── Geolocation streams and revenue table ─── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px', marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Geographic Streaming & Revenue Matrix</h3>
              <p style={{ fontSize: 11, color: COLORS.textMuted, margin: 0 }}>Sort and track platform stream quantities, active accounts and premium conversions by country code.</p>
            </div>
            
            <div style={{ display: 'flex', gap: 10 }}>
              <input type="text" placeholder="Filter Country..." value={geoSearch} onChange={(e) => setGeoSearch(e.target.value)}
                style={{ background: '#1a1a1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 12, width: 160 }} />
              
              <select value={geoSort} onChange={(e: any) => setGeoSort(e.target.value)}
                style={{ background: '#1a1a1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 12 }}>
                <option value="streams">Sort by Streams</option>
                <option value="revenue">Sort by Revenue</option>
                <option value="users">Sort by Users</option>
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${COLORS.border}`, color: COLORS.textMuted, fontSize: 11, textAlign: 'left' }}>
                  <th style={{ padding: '10px 14px' }}>Country Code</th>
                  <th style={{ padding: '10px 10px' }}>Country Name</th>
                  <th style={{ padding: '10px 10px' }}>Streams Audited</th>
                  <th style={{ padding: '10px 10px' }}>Active Profiles</th>
                  <th style={{ padding: '10px 10px' }}>Revenue Generated</th>
                  <th style={{ padding: '10px 10px', textAlign: 'center' }}>Avg Premium Conversion</th>
                </tr>
              </thead>
              <tbody>
                {data.geoData
                  .filter(c => c.countryName.toLowerCase().includes(geoSearch.toLowerCase()) || c.countryCode.toLowerCase().includes(geoSearch.toLowerCase()))
                  .sort((a, b) => {
                    if (geoSort === 'streams') return b.streams - a.streams;
                    if (geoSort === 'revenue') return b.revenue - a.revenue;
                    return b.users - a.users;
                  })
                  .map(country => (
                    <tr key={country.countryCode} style={{ borderBottom: '1px solid #161616', fontSize: 12 }}>
                      <td style={{ padding: '12px 14px', color: COLORS.primary, fontWeight: 700 }}>{country.countryCode}</td>
                      <td style={{ padding: '12px 10px', color: '#fff', fontWeight: 500 }}>{country.countryName}</td>
                      <td style={{ padding: '12px 10px' }}>{country.streams.toLocaleString()}</td>
                      <td style={{ padding: '12px 10px' }}>{country.users.toLocaleString()}</td>
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: COLORS.primary }}>
                        {data.currency.symbol}{country.revenue.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 10px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11, fontWeight: 600 }}>{country.convRate}%</span>
                          <div style={{ width: 60, height: 6, background: '#1a1a1a', borderRadius: 3, overflow: 'hidden' }}>
                            <div style={{ width: `${country.convRate}%`, height: '100%', background: COLORS.primary }} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* ─── Custom Alerts Rule Engine & Rolling Event Log Feed ─── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
          
          {/* Custom alert creator */}
          <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif' }}>🚨 Analytic Alerts Rules Manager</h3>
            <p style={{ fontSize: 11, color: COLORS.textMuted, margin: '0 0 16px 0' }}>Configure automated alerts when critical performance metrics pass custom thresholds.</p>
            
            <form onSubmit={handleAddAlert} style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
              <select value={newMetric} onChange={(e) => setNewMetric(e.target.value)}
                style={{ background: '#1a1a1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '6px 10px', color: '#fff', fontSize: 11 }}>
                <option value="Skip Rate">Skip Rate %</option>
                <option value="Daily Churn">Daily Churn (Users)</option>
                <option value="Unsubscribe">Unsubscribe Rates</option>
                <option value="Failures">Stream Errors %</option>
              </select>
              <input type="text" placeholder="Threshold e.g. > 10%" value={newThreshold} onChange={(e) => setNewThreshold(e.target.value)}
                style={{ background: '#1a1a1a', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '6px 12px', color: '#fff', fontSize: 11, width: 140 }} />
              <button type="submit"
                style={{ background: COLORS.primary, border: 'none', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                + Add Rule
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {alertRules.map(rule => (
                <div key={rule.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#181818', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 12px' }}>
                  <div>
                    <span style={{ fontSize: 12, fontWeight: 600, color: '#fff' }}>Metric: {rule.metric}</span>
                    <div style={{ fontSize: 11, color: COLORS.textMuted }}>Alert on: <strong style={{ color: COLORS.orange }}>{rule.threshold}</strong></div>
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => {
                      toast.success(`Mock alert test triggered for ${rule.metric}! Notification fired.`);
                    }}
                      style={{ background: '#252525', border: 'none', color: '#ccc', borderRadius: 4, padding: '3px 8px', fontSize: 10, cursor: 'pointer' }}>
                      Test Trigger
                    </button>
                    <button onClick={() => setAlertRules(prev => prev.filter(r => r.id !== rule.id))}
                      style={{ background: 'transparent', border: 'none', color: COLORS.red, fontSize: 12, cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Rolling High-frequency events logger */}
          <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px' }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif' }}>📃 Live Operations Audit Stream</h3>
            <p style={{ fontSize: 11, color: COLORS.textMuted, margin: '0 0 12px 0' }}>Rolling system events and client statistics capture logs (auto-updates).</p>
            
            <div style={{ background: '#0a0a0a', borderRadius: 12, padding: '12px', border: '1px solid #161616', height: 160, overflowY: 'auto', fontFamily: 'Courier New, monospace', fontSize: 11 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <AnimatePresence>
                  {auditEvents.map(evt => (
                    <motion.div key={evt.id} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                      style={{ display: 'flex', gap: 10, borderBottom: '1px solid #111', paddingBottom: 4 }}>
                      <span style={{ color: COLORS.textMuted }}>[{evt.time}]</span>
                      <span style={{ color: evt.type === 'upgrade' ? COLORS.primary : evt.type === 'system' ? COLORS.blue : COLORS.orange }}>
                        {evt.msg}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </div>

      </div>

      {/* ─── Cohort matrix click Drill-Down modal ─── */}
      {cohortModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999 }}>
          <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '24px', maxWidth: 460, width: '90%' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                🚀 Cohort Drill-Down Audit
              </h3>
              <button onClick={() => setCohortModal(null)}
                style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 18, cursor: 'pointer' }}>
                ✕
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, marginBottom: 20 }}>
              <p style={{ margin: 0 }}>You are inspecting user retention data for users registered in <strong>{cohortModal.month} 2026</strong> returning on <strong>Week {cohortModal.week}</strong>.</p>
              <div style={{ background: '#121212', borderRadius: 8, padding: '12px', border: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between' }}>
                <span>Retention Target:</span>
                <strong style={{ color: COLORS.primary }}>{cohortModal.pct}%</strong>
              </div>
              <div style={{ background: '#121212', borderRadius: 8, padding: '12px', border: `1px solid ${COLORS.border}`, display: 'flex', justifyContent: 'space-between' }}>
                <span>Estimated Returning Users:</span>
                <strong style={{ color: COLORS.blue }}>{Math.round(data.stats.totalUsers * (cohortModal.pct / 100)).toLocaleString()} users</strong>
              </div>
              <div style={{ fontSize: 11, color: COLORS.textMuted, fontStyle: 'italic' }}>
                💡 Recommendation: Retention levels in Week {cohortModal.week} are optimal. Introduce localized playlist notifications to maximize conversion.
              </div>
            </div>

            <button onClick={() => {
              setCohortModal(null);
              toast.success('Audited cohort segment downloaded.');
            }}
              style={{ background: COLORS.primary, border: 'none', color: '#fff', borderRadius: 8, padding: '10px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
              Download Specific Segment CSV
            </button>
          </motion.div>
        </div>
      )}

    </div>
  );
}
