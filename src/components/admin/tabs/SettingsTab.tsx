'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const FONT: React.CSSProperties = { fontFamily: "'Inter', 'Outfit', sans-serif" };
const INPUT: React.CSSProperties = {
  width: '100%', background: '#0f0f0f', border: '1px solid #2a2a2a', borderRadius: 10,
  padding: '10px 14px', color: '#e5e7eb', fontSize: 14, outline: 'none', boxSizing: 'border-box',
  transition: 'border-color 0.2s',
};
const LABEL: React.CSSProperties = { fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' };
const GRID2: React.CSSProperties = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 };
const CARD: React.CSSProperties = { background: '#111', borderRadius: 16, border: '1px solid #1e1e1e', padding: '28px 28px 22px', marginBottom: 22 };

// ─── Sub-components ───────────────────────────────────────────────────────────

function Toggle({ value, onChange, size = 'sm' }: { value: boolean; onChange: (v: boolean) => void; size?: 'sm' | 'lg' }) {
  const w = size === 'lg' ? 58 : 44, h = size === 'lg' ? 32 : 24, r = h / 2;
  const ballSize = h - 8, ballOff = 4, ballOn = w - ballSize - ballOff;
  return (
    <div onClick={() => onChange(!value)}
      style={{ width: w, height: h, borderRadius: r, background: value ? '#1db954' : '#2a2a2a', cursor: 'pointer', position: 'relative', transition: 'background 0.25s', flexShrink: 0 }}>
      <motion.div animate={{ left: value ? ballOn : ballOff }} transition={{ type: 'spring', stiffness: 500, damping: 35 }}
        style={{ width: ballSize, height: ballSize, borderRadius: '50%', background: '#fff', position: 'absolute', top: ballOff }} />
    </div>
  );
}

function ToggleRow({ label, description, value, onChange }: { label: string; description?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0', borderBottom: '1px solid #1a1a1a' }}>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#e5e7eb' }}>{label}</div>
        {description && <div style={{ fontSize: 12, color: '#4b5563', marginTop: 3 }}>{description}</div>}
      </div>
      <Toggle value={value} onChange={onChange} />
    </div>
  );
}

function SectionHeader({ title, icon, badge, badgeColor = '#1db954' }: { title: string; icon: string; badge?: string; badgeColor?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
      <span style={{ fontSize: 22 }}>{icon}</span>
      <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#fff', flex: 1 }}>{title}</h3>
      {badge && <span style={{ fontSize: 11, fontWeight: 700, background: `${badgeColor}20`, color: badgeColor, padding: '3px 10px', borderRadius: 20, border: `1px solid ${badgeColor}40` }}>{badge}</span>}
    </div>
  );
}

function SaveBtn({ onClick, loading, label = 'Save Changes', color = '#1db954' }: { onClick: () => void; loading?: boolean; label?: string; color?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
      <button onClick={onClick} disabled={loading}
        style={{ padding: '10px 24px', borderRadius: 9, border: 'none', background: color, color: color === '#1db954' ? '#000' : '#fff', fontWeight: 800, fontSize: 13, cursor: loading ? 'wait' : 'pointer', opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        {loading ? <>⏳ Saving...</> : label}
      </button>
    </div>
  );
}

function PassInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ position: 'relative' }}>
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ ...INPUT, paddingRight: 44 }} />
      <button onClick={() => setShow(s => !s)}
        style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280', fontSize: 16 }}>
        {show ? '🙈' : '👁️'}
      </button>
    </div>
  );
}

function StatusDot({ ok }: { ok: boolean | null }) {
  const color = ok === null ? '#6b7280' : ok ? '#1db954' : '#ef4444';
  return <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 6px ${color}` }} />;
}

const CHANNEL_ICONS: Record<string, string> = { email: '📧', whatsapp: '💬', sms: '📱', none: '🚫' };
const EVENT_LABELS: Record<string, string> = {
  'user.signup': '🆕 User Signup',
  'user.login': '🔐 User Login',
  'artist.apply': '🎤 Artist Application',
  'payment.success': '💰 Payment Success',
  'track.approved': '✅ Track Approved',
  'track.rejected': '❌ Track Rejected',
  'subscription.cancelled': '🚪 Sub Cancelled',
};

type Rule = {
  id: string;
  name: string;
  event: string;
  enabled: boolean;
  userAction: { channel: string; subject?: string; template: string };
  adminAction: { channel: string; template: string };
  fireCount: number;
  lastFiredAt?: string;
};

// ─── Tab definitions ──────────────────────────────────────────────────────────

const TABS = [
  { id: 'general', label: 'General', icon: '⚙️' },
  { id: 'security', label: 'Security', icon: '🛡️' },
  { id: 'content', label: 'Content', icon: '📋' },
  { id: 'billing', label: 'Billing', icon: '💳' },
  { id: 'messaging', label: 'Messaging', icon: '📡' },
  { id: 'automation', label: 'Automation', icon: '🤖' },
];

// ─── Main Component ──────────────────────────────────────────────────────────

export default function SettingsTab() {
  const [activeTab, setActiveTab] = useState('general');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<any>(null);
  const [msgCfg, setMsgCfg] = useState<any>(null);
  const [rules, setRules] = useState<Rule[]>([]);
  const [editRule, setEditRule] = useState<Rule | null>(null);
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [testTarget, setTestTarget] = useState('');
  const [testMsg, setTestMsg] = useState('Hello from Beato! This is a test message. 🎵');
  const [testingChannel, setTestingChannel] = useState<string | null>(null);

  // Fetch all settings from API
  const fetchSettings = useCallback(async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.platformSettings);
        setMsgCfg(data.messagingConfig);
        setRules(data.automationRules || []);
      }
    } catch (e) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const saveSettings = async (section: string, data: any) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'platformSettings', data: { ...settings, [section]: data } }),
      });
      if (res.ok) {
        const result = await res.json();
        setSettings(result.platformSettings);
        toast.success(`${section.charAt(0).toUpperCase() + section.slice(1)} settings saved ✅`);
      } else {
        toast.error('Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const saveMessaging = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'messagingConfig', data: msgCfg }),
      });
      if (res.ok) {
        toast.success('Messaging configuration saved ✅');
      } else {
        toast.error('Save failed');
      }
    } finally {
      setSaving(false);
    }
  };

  const saveRule = async (rule: Rule) => {
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'automationRule', data: rule }),
    });
    if (res.ok) {
      await fetchSettings();
      setShowRuleModal(false);
      toast.success('Rule saved ✅');
    } else {
      toast.error('Failed to save rule');
    }
  };

  const deleteRule = async (id: string) => {
    if (!confirm('Delete this automation rule?')) return;
    const res = await fetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'deleteAutomationRule', data: { id } }),
    });
    if (res.ok) {
      await fetchSettings();
      toast.success('Rule deleted');
    }
  };

  const toggleRule = async (rule: Rule) => {
    await saveRule({ ...rule, enabled: !rule.enabled });
  };

  const testChannel = async (channel: string) => {
    if (!testTarget) { toast.error('Enter a target address first'); return; }
    setTestingChannel(channel);
    try {
      const res = await fetch('/api/admin/messaging/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ channel, to: testTarget, message: testMsg, subject: 'Beato Test Message' }),
      });
      const data = await res.json();
      if (data.success) toast.success(`✅ Test ${channel} sent successfully!`);
      else toast.error(`❌ ${data.error || 'Send failed'}`);
    } catch {
      toast.error('Network error during test');
    } finally {
      setTestingChannel(null);
    }
  };

  if (loading || !settings) {
    return (
      <div style={{ ...FONT, background: '#0a0a0a', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
          style={{ width: 40, height: 40, border: '3px solid #1e1e1e', borderTopColor: '#1db954', borderRadius: '50%' }} />
      </div>
    );
  }

  const g = settings.general || {};
  const sec = settings.security || {};
  const c = settings.content || {};
  const b = settings.billing || {};
  const n = settings.notifications || {};

  const upd = (section: string, key: string, value: any) => {
    setSettings((s: any) => ({ ...s, [section]: { ...s[section], [key]: value } }));
  };

  return (
    <div style={{ ...FONT, background: '#080808', minHeight: '100vh', padding: '24px 20px', color: '#e5e7eb' }}>
      {/* Maintenance Banner */}
      <AnimatePresence>
        {sec.maintenanceMode && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.4)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12, overflow: 'hidden' }}>
            <span style={{ fontSize: 24 }}>🔴</span>
            <div>
              <div style={{ fontWeight: 800, color: '#ef4444', fontSize: 15 }}>Platform is in Maintenance Mode</div>
              <div style={{ fontSize: 12, color: '#9ca3af' }}>All users see a maintenance page. Disable in Security tab to restore access.</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ maxWidth: 920, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ margin: 0, fontSize: 24, fontWeight: 900, color: '#fff' }}>⚙️ Platform Settings</h2>
          <p style={{ margin: '6px 0 0', fontSize: 14, color: '#4b5563' }}>Real-time configuration • Changes persist across restarts</p>
          {settings.updatedAt && (
            <p style={{ margin: '4px 0 0', fontSize: 12, color: '#374151' }}>Last saved: {new Date(settings.updatedAt).toLocaleString()}</p>
          )}
        </div>

        {/* Tab Pills */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)}
              style={{ padding: '9px 18px', borderRadius: 50, border: activeTab === t.id ? '1px solid #1db954' : '1px solid #222', background: activeTab === t.id ? '#1db95420' : '#111', color: activeTab === t.id ? '#1db954' : '#6b7280', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.2s', fontFamily: 'inherit' }}>
              {t.icon} {t.label}
              {t.id === 'security' && sec.maintenanceMode && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#ef4444', display: 'inline-block' }} />}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          <motion.div key={activeTab} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>

            {/* ── GENERAL ── */}
            {activeTab === 'general' && (
              <div style={CARD}>
                <SectionHeader title="General Settings" icon="⚙️" />
                <div style={{ marginBottom: 16 }}>
                  <label style={LABEL}>Platform Name</label>
                  <input value={g.platformName || ''} onChange={e => upd('general', 'platformName', e.target.value)} style={INPUT} />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={LABEL}>Platform Description</label>
                  <textarea value={g.description || ''} onChange={e => upd('general', 'description', e.target.value)} rows={3}
                    style={{ ...INPUT, resize: 'vertical' }} />
                </div>
                <div style={GRID2}>
                  <div>
                    <label style={LABEL}>Support Email</label>
                    <input type="email" value={g.supportEmail || ''} onChange={e => upd('general', 'supportEmail', e.target.value)} style={INPUT} />
                  </div>
                  <div>
                    <label style={LABEL}>Website URL</label>
                    <input value={g.websiteUrl || ''} onChange={e => upd('general', 'websiteUrl', e.target.value)} style={INPUT} />
                  </div>
                </div>
                <div style={GRID2}>
                  <div>
                    <label style={LABEL}>Default Language</label>
                    <select value={g.defaultLanguage || 'en'} onChange={e => upd('general', 'defaultLanguage', e.target.value)}
                      style={{ ...INPUT, cursor: 'pointer', appearance: 'none' }}>
                      {[['en', '🇬🇧 English'], ['ta', '🇮🇳 Tamil'], ['hi', '🇮🇳 Hindi'], ['es', '🇪🇸 Spanish'], ['fr', '🇫🇷 French'], ['de', '🇩🇪 German'], ['ja', '🇯🇵 Japanese'], ['pt', '🇧🇷 Portuguese']].map(([v, l]) => (
                        <option key={v} value={v}>{l}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label style={LABEL}>Timezone</label>
                    <select value={g.timezone || 'Asia/Kolkata'} onChange={e => upd('general', 'timezone', e.target.value)}
                      style={{ ...INPUT, cursor: 'pointer', appearance: 'none' }}>
                      {['Asia/Kolkata', 'UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo', 'America/Los_Angeles'].map(tz => (
                        <option key={tz} value={tz}>{tz}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <label style={LABEL}>Max Upload File Size</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[50, 100, 200, 500].map(mb => (
                      <button key={mb} onClick={() => upd('general', 'maxUploadMB', mb)}
                        style={{ padding: '9px 18px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: g.maxUploadMB === mb ? '#1db954' : '#1a1a1a', color: g.maxUploadMB === mb ? '#000' : '#6b7280', transition: 'all 0.2s', fontFamily: 'inherit' }}>
                        {mb} MB
                      </button>
                    ))}
                  </div>
                </div>
                <SaveBtn onClick={() => saveSettings('general', settings.general)} loading={saving} />
              </div>
            )}

            {/* ── SECURITY ── */}
            {activeTab === 'security' && (
              <div style={{ ...CARD, border: sec.maintenanceMode ? '1px solid rgba(239,68,68,0.35)' : '1px solid #1e1e1e' }}>
                <SectionHeader title="Security & Maintenance" icon="🛡️" badge={sec.maintenanceMode ? 'MAINTENANCE' : undefined} badgeColor="#ef4444" />

                {/* Big maintenance toggle */}
                <div style={{ background: sec.maintenanceMode ? 'rgba(239,68,68,0.08)' : '#0f0f0f', borderRadius: 12, padding: '18px 22px', marginBottom: 20, border: `1px solid ${sec.maintenanceMode ? 'rgba(239,68,68,0.25)' : '#1a1a1a'}`, transition: 'all 0.4s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 800, fontSize: 15, color: sec.maintenanceMode ? '#ef4444' : '#e5e7eb' }}>
                        {sec.maintenanceMode ? '🔴 Maintenance Mode ON' : 'Maintenance Mode'}
                      </div>
                      <div style={{ fontSize: 13, color: '#6b7280', marginTop: 3 }}>
                        {sec.maintenanceMode ? 'Platform is OFFLINE for all users.' : 'Takes the platform offline immediately.'}
                      </div>
                    </div>
                    <Toggle size="lg" value={sec.maintenanceMode} onChange={v => {
                      upd('security', 'maintenanceMode', v);
                      if (v) toast('⚠️ Maintenance mode ON', { icon: '🔴', style: { background: '#1a0505', color: '#ef4444' } });
                      else toast.success('Maintenance mode disabled — platform is live!');
                    }} />
                  </div>
                </div>

                <ToggleRow label="Two-Factor Auth Required" description="All admin logins must complete 2FA" value={sec.mfaRequired} onChange={v => upd('security', 'mfaRequired', v)} />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16, marginBottom: 16 }}>
                  <div>
                    <label style={LABEL}>Session Timeout (minutes)</label>
                    <input type="number" value={sec.sessionTimeout || 60} onChange={e => upd('security', 'sessionTimeout', Number(e.target.value))} min={5} max={480} style={INPUT} />
                  </div>
                  <div>
                    <label style={LABEL}>Rate Limit (req/min)</label>
                    <input type="number" value={sec.rateLimit || 120} onChange={e => upd('security', 'rateLimit', Number(e.target.value))} min={10} max={1000} style={INPUT} />
                  </div>
                </div>

                <div style={{ marginBottom: 12 }}>
                  <label style={LABEL}>IP Allowlist for Admin Panel <span style={{ color: '#374151', fontWeight: 400, textTransform: 'none' }}>(one IP per line, blank = unrestricted)</span></label>
                  <textarea value={sec.ipAllowlist || ''} onChange={e => upd('security', 'ipAllowlist', e.target.value)} rows={4}
                    placeholder={'192.168.1.0/24\n10.0.0.1\n203.0.113.45'}
                    style={{ ...INPUT, resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} />
                </div>
                <SaveBtn onClick={() => saveSettings('security', settings.security)} loading={saving} color={sec.maintenanceMode ? '#ef4444' : '#1db954'} />
              </div>
            )}

            {/* ── CONTENT ── */}
            {activeTab === 'content' && (
              <div style={CARD}>
                <SectionHeader title="Content Policy" icon="📋" />
                <ToggleRow label="Allow Explicit Content" description="Users can toggle explicit filter" value={c.explicitContent} onChange={v => upd('content', 'explicitContent', v)} />
                <ToggleRow label="AI Copyright Detection" description="Auto-flag copyright-matched tracks" value={c.aiCopyright} onChange={v => upd('content', 'aiCopyright', v)} />
                <ToggleRow label="Allow User Uploads" description="Non-artist users can upload tracks" value={c.allowUserUploads} onChange={v => upd('content', 'allowUserUploads', v)} />
                <ToggleRow label="Require Artist Verification" description="Artists must submit ID before publishing" value={c.requireArtistVerification} onChange={v => upd('content', 'requireArtistVerification', v)} />
                <div style={{ padding: '16px 0', borderBottom: '1px solid #1a1a1a' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Auto-reject Score Threshold</div>
                      <div style={{ fontSize: 12, color: '#4b5563' }}>AI risk score above this = auto-reject</div>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 20, color: '#f59e0b' }}>{c.autoRejectThreshold}</span>
                  </div>
                  <input type="range" min={0} max={100} value={c.autoRejectThreshold || 72} onChange={e => upd('content', 'autoRejectThreshold', Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#f59e0b' }} />
                </div>
                <div style={{ padding: '16px 0 8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Max Track Duration</div>
                      <div style={{ fontSize: 12, color: '#4b5563' }}>Tracks over this limit are rejected</div>
                    </div>
                    <span style={{ fontWeight: 800, fontSize: 20, color: '#60a5fa' }}>{c.maxTrackMinutes} min</span>
                  </div>
                  <input type="range" min={1} max={60} value={c.maxTrackMinutes || 20} onChange={e => upd('content', 'maxTrackMinutes', Number(e.target.value))}
                    style={{ width: '100%', accentColor: '#60a5fa' }} />
                </div>
                <SaveBtn onClick={() => saveSettings('content', settings.content)} loading={saving} />
              </div>
            )}

            {/* ── BILLING ── */}
            {activeTab === 'billing' && (
              <div style={CARD}>
                <SectionHeader title="Subscription & Billing" icon="💳" />
                <div style={GRID2}>
                  <div>
                    <label style={LABEL}>Trial Period (days)</label>
                    <input type="number" value={b.trialDays ?? 30} onChange={e => upd('billing', 'trialDays', Number(e.target.value))} min={0} max={90} style={INPUT} />
                  </div>
                  <div>
                    <label style={LABEL}>Grace Period (days)</label>
                    <input type="number" value={b.graceDays ?? 7} onChange={e => upd('billing', 'graceDays', Number(e.target.value))} min={0} max={30} style={INPUT} />
                  </div>
                  <div>
                    <label style={LABEL}>Refund Window (days)</label>
                    <input type="number" value={b.refundDays ?? 14} onChange={e => upd('billing', 'refundDays', Number(e.target.value))} min={0} max={60} style={INPUT} />
                  </div>
                  <div>
                    <label style={LABEL}>Platform Fee % <span style={{ color: '#4b5563', fontWeight: 400, textTransform: 'none', fontSize: 11 }}>(15–30)</span></label>
                    <input type="number" value={b.platformFee ?? 20} onChange={e => upd('billing', 'platformFee', Math.min(30, Math.max(15, Number(e.target.value))))} min={15} max={30} style={INPUT} />
                  </div>
                </div>
                <div style={{ marginBottom: 16 }}>
                  <label style={LABEL}>Default Currency</label>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {[['INR', '🇮🇳'], ['USD', '🇺🇸'], ['EUR', '🇪🇺'], ['GBP', '🇬🇧'], ['AUD', '🇦🇺']].map(([cur, flag]) => (
                      <button key={cur} onClick={() => upd('billing', 'currency', cur)}
                        style={{ padding: '8px 16px', borderRadius: 9, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: b.currency === cur ? '#1db954' : '#1a1a1a', color: b.currency === cur ? '#000' : '#6b7280', fontFamily: 'inherit' }}>
                        {flag} {cur}
                      </button>
                    ))}
                  </div>
                </div>
                <ToggleRow label="Auto-renewal Enabled" description="Subscriptions auto-renew at period end" value={b.autoRenewal} onChange={v => upd('billing', 'autoRenewal', v)} />
                <SaveBtn onClick={() => saveSettings('billing', settings.billing)} loading={saving} />
              </div>
            )}

            {/* ── MESSAGING CONFIG ── */}
            {activeTab === 'messaging' && msgCfg && (
              <div>
                {/* Admin Alert Contacts */}
                <div style={CARD}>
                  <SectionHeader title="Admin Alert Contacts" icon="👤" />
                  <p style={{ fontSize: 13, color: '#4b5563', margin: '0 0 16px' }}>When automation rules fire admin alerts, these addresses receive them.</p>
                  <div style={GRID2}>
                    <div>
                      <label style={LABEL}>Admin Alert Email</label>
                      <input type="email" value={msgCfg.adminAlertEmail || ''} onChange={e => setMsgCfg((m: any) => ({ ...m, adminAlertEmail: e.target.value }))} placeholder="admin@yourcompany.com" style={INPUT} />
                    </div>
                    <div>
                      <label style={LABEL}>Admin Alert Phone <span style={{ textTransform: 'none', fontWeight: 400, color: '#4b5563' }}>(with country code)</span></label>
                      <input value={msgCfg.adminAlertPhone || ''} onChange={e => setMsgCfg((m: any) => ({ ...m, adminAlertPhone: e.target.value }))} placeholder="+919876543210" style={INPUT} />
                    </div>
                  </div>
                </div>

                {/* Email Config */}
                <div style={CARD}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <SectionHeader title="📧 Gmail SMTP (Email)" icon="" badge={msgCfg.email?.enabled ? 'ENABLED' : 'DISABLED'} badgeColor={msgCfg.email?.enabled ? '#1db954' : '#6b7280'} />
                    <Toggle value={msgCfg.email?.enabled || false} onChange={v => setMsgCfg((m: any) => ({ ...m, email: { ...m.email, enabled: v } }))} />
                  </div>
                  <div style={{ opacity: msgCfg.email?.enabled ? 1 : 0.45, transition: 'opacity 0.3s', pointerEvents: msgCfg.email?.enabled ? 'auto' : 'none' }}>
                    <div style={GRID2}>
                      <div>
                        <label style={LABEL}>Gmail Address</label>
                        <input type="email" value={msgCfg.email?.user || ''} onChange={e => setMsgCfg((m: any) => ({ ...m, email: { ...m.email, user: e.target.value, fromAddress: e.target.value } }))} placeholder="yourapp@gmail.com" style={INPUT} />
                      </div>
                      <div>
                        <label style={LABEL}>App Password <span style={{ textTransform: 'none', color: '#4b5563', fontWeight: 400 }}>(16-char)</span></label>
                        <PassInput value={msgCfg.email?.pass || ''} onChange={v => setMsgCfg((m: any) => ({ ...m, email: { ...m.email, pass: v } }))} placeholder="xxxx xxxx xxxx xxxx" />
                      </div>
                      <div>
                        <label style={LABEL}>Sender Name</label>
                        <input value={msgCfg.email?.fromName || 'Beato'} onChange={e => setMsgCfg((m: any) => ({ ...m, email: { ...m.email, fromName: e.target.value } }))} style={INPUT} />
                      </div>
                      <div>
                        <label style={LABEL}>SMTP Port</label>
                        <div style={{ display: 'flex', gap: 8 }}>
                          {[
                            { port: 587, label: '587', sub: 'STARTTLS', secure: false },
                            { port: 465, label: '465', sub: 'SSL', secure: true },
                            { port: 25, label: '25', sub: 'Plain', secure: false },
                          ].map(({ port: p, label, sub, secure: s }) => (
                            <button key={p} onClick={() => setMsgCfg((m: any) => ({ ...m, email: { ...m.email, port: p, secure: s } }))}
                              style={{ flex: 1, padding: '8px 0', borderRadius: 9, border: 'none', cursor: 'pointer', fontFamily: 'inherit', background: msgCfg.email?.port === p ? '#1db954' : '#1a1a1a', color: msgCfg.email?.port === p ? '#000' : '#6b7280', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                              <span style={{ fontWeight: 800, fontSize: 13 }}>{label}</span>
                              <span style={{ fontSize: 10, opacity: 0.8 }}>{sub}</span>
                            </button>
                          ))}
                        </div>
                        <div style={{ fontSize: 11, color: '#374151', marginTop: 6 }}>
                          ✅ <strong style={{ color: '#6b7280' }}>587 STARTTLS</strong> recommended for Gmail. Port 465 uses direct SSL.
                        </div>
                      </div>
                    </div>
                    <ToggleRow label="Use TLS/SSL" description="Port 465 uses SSL; 587 uses STARTTLS" value={msgCfg.email?.secure || false} onChange={v => setMsgCfg((m: any) => ({ ...m, email: { ...m.email, secure: v } }))} />

                    {/* Test box */}
                    <div style={{ background: '#0f0f0f', borderRadius: 12, padding: 16, marginTop: 16, border: '1px solid #1e1e1e' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 12 }}>🧪 Send Test Email</div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input value={testTarget} onChange={e => setTestTarget(e.target.value)} placeholder="test@gmail.com" style={{ ...INPUT, flex: 1 }} />
                        <button onClick={() => testChannel('email')} disabled={testingChannel === 'email'}
                          style={{ padding: '10px 20px', borderRadius: 9, border: 'none', background: '#1db954', color: '#000', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                          {testingChannel === 'email' ? '⏳ Sending...' : '📧 Send Test'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* WhatsApp Config */}
                <div style={CARD}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <SectionHeader title="💬 WhatsApp Business API" icon="" badge={msgCfg.whatsapp?.enabled ? 'ENABLED' : 'DISABLED'} badgeColor={msgCfg.whatsapp?.enabled ? '#25d366' : '#6b7280'} />
                    <Toggle value={msgCfg.whatsapp?.enabled || false} onChange={v => setMsgCfg((m: any) => ({ ...m, whatsapp: { ...m.whatsapp, enabled: v } }))} />
                  </div>
                  <div style={{ opacity: msgCfg.whatsapp?.enabled ? 1 : 0.45, transition: 'opacity 0.3s', pointerEvents: msgCfg.whatsapp?.enabled ? 'auto' : 'none' }}>
                    {/* Provider selector */}
                    <div style={{ marginBottom: 16 }}>
                      <label style={LABEL}>Provider</label>
                      <div style={{ display: 'flex', gap: 10 }}>
                        {[['meta', '🌐 Meta Business API'], ['twilio', '🔵 Twilio WhatsApp']].map(([v, l]) => (
                          <button key={v} onClick={() => setMsgCfg((m: any) => ({ ...m, whatsapp: { ...m.whatsapp, provider: v } }))}
                            style={{ flex: 1, padding: '10px', borderRadius: 9, border: msgCfg.whatsapp?.provider === v ? '1px solid #25d366' : '1px solid #1e1e1e', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: msgCfg.whatsapp?.provider === v ? '#25d36618' : '#111', color: msgCfg.whatsapp?.provider === v ? '#25d366' : '#6b7280', fontFamily: 'inherit' }}>
                            {l}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div style={GRID2}>
                      <div>
                        <label style={LABEL}>Access Token / API Key</label>
                        <PassInput value={msgCfg.whatsapp?.accessToken || ''} onChange={v => setMsgCfg((m: any) => ({ ...m, whatsapp: { ...m.whatsapp, accessToken: v } }))} placeholder="EAAxxxxx..." />
                      </div>
                      <div>
                        <label style={LABEL}>{msgCfg.whatsapp?.provider === 'meta' ? 'Phone Number ID' : 'Account SID'}</label>
                        <input value={msgCfg.whatsapp?.phoneNumberId || ''} onChange={e => setMsgCfg((m: any) => ({ ...m, whatsapp: { ...m.whatsapp, phoneNumberId: e.target.value } }))} placeholder={msgCfg.whatsapp?.provider === 'meta' ? '100xxxxx' : 'ACxxxxx'} style={INPUT} />
                      </div>
                      <div>
                        <label style={LABEL}>From Number <span style={{ textTransform: 'none', color: '#4b5563', fontWeight: 400 }}>(with +countrycode)</span></label>
                        <input value={msgCfg.whatsapp?.fromNumber || ''} onChange={e => setMsgCfg((m: any) => ({ ...m, whatsapp: { ...m.whatsapp, fromNumber: e.target.value } }))} placeholder="+14155238886" style={INPUT} />
                      </div>
                      {msgCfg.whatsapp?.provider === 'meta' && (
                        <div>
                          <label style={LABEL}>Business Account ID</label>
                          <input value={msgCfg.whatsapp?.businessAccountId || ''} onChange={e => setMsgCfg((m: any) => ({ ...m, whatsapp: { ...m.whatsapp, businessAccountId: e.target.value } }))} placeholder="102xxxxx" style={INPUT} />
                        </div>
                      )}
                    </div>
                    <div style={{ background: '#0f0f0f', borderRadius: 12, padding: 16, marginTop: 16, border: '1px solid #1e1e1e' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 12 }}>🧪 Send Test WhatsApp</div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input value={testTarget} onChange={e => setTestTarget(e.target.value)} placeholder="+919876543210" style={{ ...INPUT, flex: 1 }} />
                        <button onClick={() => testChannel('whatsapp')} disabled={testingChannel === 'whatsapp'}
                          style={{ padding: '10px 20px', borderRadius: 9, border: 'none', background: '#25d366', color: '#000', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                          {testingChannel === 'whatsapp' ? '⏳ Sending...' : '💬 Send Test'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* SMS Config */}
                <div style={CARD}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                    <SectionHeader title="📱 SMS Gateway (Twilio)" icon="" badge={msgCfg.sms?.enabled ? 'ENABLED' : 'DISABLED'} badgeColor={msgCfg.sms?.enabled ? '#f59e0b' : '#6b7280'} />
                    <Toggle value={msgCfg.sms?.enabled || false} onChange={v => setMsgCfg((m: any) => ({ ...m, sms: { ...m.sms, enabled: v } }))} />
                  </div>
                  <div style={{ opacity: msgCfg.sms?.enabled ? 1 : 0.45, transition: 'opacity 0.3s', pointerEvents: msgCfg.sms?.enabled ? 'auto' : 'none' }}>
                    <div style={GRID2}>
                      <div>
                        <label style={LABEL}>Account SID</label>
                        <input value={msgCfg.sms?.accountSid || ''} onChange={e => setMsgCfg((m: any) => ({ ...m, sms: { ...m.sms, accountSid: e.target.value } }))} placeholder="ACxxxxxxxxxxxxx" style={INPUT} />
                      </div>
                      <div>
                        <label style={LABEL}>Auth Token</label>
                        <PassInput value={msgCfg.sms?.authToken || ''} onChange={v => setMsgCfg((m: any) => ({ ...m, sms: { ...m.sms, authToken: v } }))} placeholder="••••••••••••••••" />
                      </div>
                      <div>
                        <label style={LABEL}>From Number</label>
                        <input value={msgCfg.sms?.fromNumber || ''} onChange={e => setMsgCfg((m: any) => ({ ...m, sms: { ...m.sms, fromNumber: e.target.value } }))} placeholder="+14155238886" style={INPUT} />
                      </div>
                    </div>
                    <div style={{ background: '#0f0f0f', borderRadius: 12, padding: 16, marginTop: 16, border: '1px solid #1e1e1e' }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#9ca3af', marginBottom: 12 }}>🧪 Send Test SMS</div>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <input value={testTarget} onChange={e => setTestTarget(e.target.value)} placeholder="+919876543210" style={{ ...INPUT, flex: 1 }} />
                        <button onClick={() => testChannel('sms')} disabled={testingChannel === 'sms'}
                          style={{ padding: '10px 20px', borderRadius: 9, border: 'none', background: '#f59e0b', color: '#000', fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit' }}>
                          {testingChannel === 'sms' ? '⏳ Sending...' : '📱 Send Test'}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Test message template */}
                <div style={CARD}>
                  <SectionHeader title="Test Message Content" icon="✉️" />
                  <label style={LABEL}>Message Body (used for all channel tests above)</label>
                  <textarea value={testMsg} onChange={e => setTestMsg(e.target.value)} rows={3}
                    style={{ ...INPUT, resize: 'vertical' }} />
                </div>

                <SaveBtn onClick={saveMessaging} loading={saving} label="💾 Save All Messaging Settings" />
              </div>
            )}

            {/* ── AUTOMATION RULES ── */}
            {activeTab === 'automation' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: '#fff' }}>🤖 Automation Rules</div>
                    <div style={{ fontSize: 13, color: '#4b5563', marginTop: 4 }}>Define event-driven messaging: signup/login → user gets email, admin gets WhatsApp/SMS</div>
                  </div>
                  <button onClick={() => {
                    setEditRule({ id: `rule-${Date.now()}`, name: 'New Rule', event: 'user.signup', enabled: true, userAction: { channel: 'email', subject: '', template: '' }, adminAction: { channel: 'none', template: '' }, fireCount: 0 });
                    setShowRuleModal(true);
                  }} style={{ padding: '10px 20px', borderRadius: 10, border: 'none', background: '#1db954', color: '#000', fontWeight: 800, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}>
                    + Add Rule
                  </button>
                </div>

                {/* Variable reference */}
                <div style={{ background: '#0d1117', borderRadius: 12, border: '1px solid #1e1e1e', padding: '14px 18px', marginBottom: 20 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Available Template Variables</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {['{{name}}', '{{email}}', '{{phone}}', '{{ip}}', '{{time}}', '{{platform}}', '{{amount}}', '{{plan}}', '{{trackName}}'].map(v => (
                      <code key={v} style={{ background: '#1a1a1a', color: '#60a5fa', padding: '3px 10px', borderRadius: 6, fontSize: 12, fontFamily: 'monospace' }}>{v}</code>
                    ))}
                  </div>
                </div>

                {/* Rules list */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {rules.map(rule => (
                    <motion.div key={rule.id} layout
                      style={{ background: '#111', borderRadius: 14, border: `1px solid ${rule.enabled ? '#1db95430' : '#1e1e1e'}`, padding: '18px 22px', transition: 'border-color 0.3s' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                        <Toggle value={rule.enabled} onChange={() => toggleRule(rule)} />
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                            <span style={{ fontWeight: 800, fontSize: 15, color: rule.enabled ? '#e5e7eb' : '#4b5563' }}>{rule.name}</span>
                            <span style={{ fontSize: 11, background: '#1a1a1a', color: '#6b7280', padding: '2px 8px', borderRadius: 20 }}>{EVENT_LABELS[rule.event] || rule.event}</span>
                          </div>
                          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                            <div style={{ fontSize: 12, color: '#4b5563' }}>
                              <span style={{ color: '#9ca3af', fontWeight: 600 }}>User: </span>
                              {CHANNEL_ICONS[rule.userAction.channel]} {rule.userAction.channel === 'none' ? 'No action' : rule.userAction.channel.toUpperCase()}
                            </div>
                            <div style={{ fontSize: 12, color: '#4b5563' }}>
                              <span style={{ color: '#9ca3af', fontWeight: 600 }}>Admin: </span>
                              {CHANNEL_ICONS[rule.adminAction.channel]} {rule.adminAction.channel === 'none' ? 'No action' : rule.adminAction.channel.toUpperCase()}
                            </div>
                            <div style={{ fontSize: 12, color: '#374151' }}>
                              Fired: <span style={{ color: '#6b7280' }}>{rule.fireCount} times</span>
                            </div>
                            {rule.lastFiredAt && (
                              <div style={{ fontSize: 12, color: '#374151' }}>
                                Last: <span style={{ color: '#6b7280' }}>{new Date(rule.lastFiredAt).toLocaleString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button onClick={() => { setEditRule(rule); setShowRuleModal(true); }}
                            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #2a2a2a', background: 'none', color: '#9ca3af', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                            ✏️ Edit
                          </button>
                          <button onClick={() => deleteRule(rule.id)}
                            style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid #2a2a2a', background: 'none', color: '#ef4444', cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}>
                            🗑️
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        </AnimatePresence>
      </div>

      {/* ── Rule Edit Modal ── */}
      <AnimatePresence>
        {showRuleModal && editRule && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={e => { if (e.target === e.currentTarget) setShowRuleModal(false); }}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              style={{ ...FONT, background: '#111', border: '1px solid #2a2a2a', borderRadius: 18, padding: 28, width: '100%', maxWidth: 620, maxHeight: '90vh', overflowY: 'auto' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#fff' }}>🤖 {editRule.id.startsWith('rule-') && !rules.find(r => r.id === editRule.id) ? 'New' : 'Edit'} Automation Rule</h3>
                <button onClick={() => setShowRuleModal(false)} style={{ background: 'none', border: 'none', color: '#6b7280', cursor: 'pointer', fontSize: 20 }}>✕</button>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={LABEL}>Rule Name</label>
                <input value={editRule.name} onChange={e => setEditRule(r => r ? { ...r, name: e.target.value } : r)} style={{ ...INPUT, color: '#fff', background: '#0f0f0f' }} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={LABEL}>Trigger Event</label>
                <select value={editRule.event} onChange={e => setEditRule(r => r ? { ...r, event: e.target.value as any } : r)}
                  style={{ ...INPUT, cursor: 'pointer', color: '#fff', background: '#0f0f0f', appearance: 'none' }}>
                  {Object.entries(EVENT_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>

              {/* User Action */}
              <div style={{ background: '#0d1117', borderRadius: 12, padding: '16px 18px', marginBottom: 14, border: '1px solid #1e1e1e' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#60a5fa', marginBottom: 14 }}>👤 User Notification</div>
                <div style={{ marginBottom: 12 }}>
                  <label style={LABEL}>Channel</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['email', 'whatsapp', 'sms', 'none'] as const).map(ch => (
                      <button key={ch} onClick={() => setEditRule(r => r ? { ...r, userAction: { ...r.userAction, channel: ch } } : r)}
                        style={{ flex: 1, padding: '8px', borderRadius: 8, border: editRule.userAction.channel === ch ? '1px solid #60a5fa' : '1px solid #2a2a2a', background: editRule.userAction.channel === ch ? '#60a5fa18' : '#111', color: editRule.userAction.channel === ch ? '#60a5fa' : '#6b7280', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
                        {CHANNEL_ICONS[ch]} {ch}
                      </button>
                    ))}
                  </div>
                </div>
                {editRule.userAction.channel === 'email' && (
                  <div style={{ marginBottom: 12 }}>
                    <label style={LABEL}>Subject Line</label>
                    <input value={editRule.userAction.subject || ''} onChange={e => setEditRule(r => r ? { ...r, userAction: { ...r.userAction, subject: e.target.value } } : r)}
                      placeholder="Welcome to {{platform}}!" style={{ ...INPUT, background: '#0f0f0f', color: '#e5e7eb' }} />
                  </div>
                )}
                {editRule.userAction.channel !== 'none' && (
                  <div>
                    <label style={LABEL}>Message Template</label>
                    <textarea value={editRule.userAction.template} onChange={e => setEditRule(r => r ? { ...r, userAction: { ...r.userAction, template: e.target.value } } : r)}
                      rows={3} placeholder="Hi {{name}}, welcome to {{platform}}!"
                      style={{ ...INPUT, resize: 'vertical', background: '#0f0f0f', color: '#e5e7eb' }} />
                  </div>
                )}
              </div>

              {/* Admin Action */}
              <div style={{ background: '#0d1117', borderRadius: 12, padding: '16px 18px', marginBottom: 20, border: '1px solid #1e1e1e' }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#f59e0b', marginBottom: 14 }}>🔔 Admin Notification</div>
                <div style={{ marginBottom: 12 }}>
                  <label style={LABEL}>Channel</label>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['email', 'whatsapp', 'sms', 'none'] as const).map(ch => (
                      <button key={ch} onClick={() => setEditRule(r => r ? { ...r, adminAction: { ...r.adminAction, channel: ch } } : r)}
                        style={{ flex: 1, padding: '8px', borderRadius: 8, border: editRule.adminAction.channel === ch ? '1px solid #f59e0b' : '1px solid #2a2a2a', background: editRule.adminAction.channel === ch ? '#f59e0b18' : '#111', color: editRule.adminAction.channel === ch ? '#f59e0b' : '#6b7280', cursor: 'pointer', fontSize: 12, fontWeight: 700, fontFamily: 'inherit' }}>
                        {CHANNEL_ICONS[ch]} {ch}
                      </button>
                    ))}
                  </div>
                </div>
                {editRule.adminAction.channel !== 'none' && (
                  <div>
                    <label style={LABEL}>Message Template</label>
                    <textarea value={editRule.adminAction.template} onChange={e => setEditRule(r => r ? { ...r, adminAction: { ...r.adminAction, template: e.target.value } } : r)}
                      rows={3} placeholder="🎵 New signup: {{name}} ({{email}}) at {{time}}"
                      style={{ ...INPUT, resize: 'vertical', background: '#0f0f0f', color: '#e5e7eb' }} />
                  </div>
                )}
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button onClick={() => setShowRuleModal(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: 10, border: '1px solid #2a2a2a', background: 'none', color: '#9ca3af', cursor: 'pointer', fontWeight: 700, fontFamily: 'inherit' }}>
                  Cancel
                </button>
                <button onClick={() => saveRule(editRule)}
                  style={{ flex: 2, padding: '12px', borderRadius: 10, border: 'none', background: '#1db954', color: '#000', cursor: 'pointer', fontWeight: 800, fontSize: 14, fontFamily: 'inherit' }}>
                  💾 Save Rule
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
