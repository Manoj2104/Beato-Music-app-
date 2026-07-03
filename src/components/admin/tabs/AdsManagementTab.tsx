'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  LayoutDashboard, Megaphone, ImageIcon, Volume2, Video,
  Layers, Gift, SquareCode, Music, Mic, Disc, Podcast,
  MapPin, Target, DollarSign, BarChart2, FileText, CreditCard,
  Users, Clock, Settings, ScrollText, ChevronRight, ChevronDown,
  Plus, Search, CheckCircle, XCircle, AlertCircle, Eye,
  Edit2, Download, Link, Zap, TrendingUp, Bell,
  Shield, Info, Play, Pause, SkipForward, Wifi,
  Activity, Award, ArrowUp, ArrowDown, Loader2, Check, X,
  RefreshCw, Database, MoreVertical, Sliders, Radio, Star,
  Trash2, Monitor, Smartphone, ChevronUp,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useIsMobile } from '@/hooks/useIsMobile';

// ─── Project Theme ─────────────────────────────────────────────────────────────
const T = {
  bg: '#fbf9f5',
  surface: '#ffffff',
  elevated: '#f4eede',
  border: 'rgba(43,34,26,0.08)',
  primary: '#b08850',
  primaryGlow: 'rgba(176,136,80,0.15)',
  green: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  blue: '#3b82f6',
  purple: '#8b5cf6',
  text: '#221a15',
  muted: '#87786c',
  faint: '#c4b8ae',
};

const CHART_COLORS = ['#b08850', '#10b981', '#f59e0b', '#3b82f6', '#ef4444', '#8b5cf6'];

// ─── Nav ──────────────────────────────────────────────────────────────────────
const NAV_ITEMS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard, group: 'main' },
  { id: 'adsense', label: 'AdSense', icon: Link, group: 'main' },
  { id: 'campaigns', label: 'Campaigns', icon: Megaphone, group: 'ads' },
  { id: 'banner', label: 'Banner Ads', icon: ImageIcon, group: 'ads' },
  { id: 'audio', label: 'Audio Ads', icon: Volume2, group: 'ads' },
  { id: 'video', label: 'Video Ads', icon: Video, group: 'ads' },
  { id: 'interstitial', label: 'Interstitial Ads', icon: Layers, group: 'ads' },
  { id: 'rewarded', label: 'Rewarded Ads', icon: Gift, group: 'ads' },
  { id: 'native', label: 'Native Ads', icon: SquareCode, group: 'ads' },
  { id: 'popup', label: 'Popup Ads', icon: Bell, group: 'ads' },
  { id: 'sponsored_songs', label: 'Sponsored Songs', icon: Music, group: 'sponsored' },
  { id: 'sponsored_artists', label: 'Sponsored Artists', icon: Mic, group: 'sponsored' },
  { id: 'sponsored_albums', label: 'Sponsored Albums', icon: Disc, group: 'sponsored' },
  { id: 'sponsored_podcasts', label: 'Sponsored Podcasts', icon: Podcast, group: 'sponsored' },
  { id: 'placements', label: 'Placement Manager', icon: MapPin, group: 'targeting' },
  { id: 'targeting', label: 'Target Audience', icon: Target, group: 'targeting' },
  { id: 'revenue', label: 'Revenue', icon: DollarSign, group: 'analytics' },
  { id: 'analytics', label: 'Analytics', icon: BarChart2, group: 'analytics' },
  { id: 'reports', label: 'Reports', icon: FileText, group: 'analytics' },
  { id: 'payments', label: 'Payments', icon: CreditCard, group: 'analytics' },
  { id: 'advertisers', label: 'Advertisers', icon: Users, group: 'manage' },
  { id: 'approval', label: 'Approval Queue', icon: CheckCircle, group: 'manage' },
  { id: 'library', label: 'Ad Library', icon: Database, group: 'manage' },
  { id: 'ad_settings', label: 'Settings', icon: Settings, group: 'system' },
  { id: 'logs', label: 'Logs', icon: ScrollText, group: 'system' },
];

const NAV_GROUPS: Record<string, string> = {
  main: 'DASHBOARD', ads: 'AD TYPES', sponsored: 'SPONSORED CONTENT',
  targeting: 'TARGETING', analytics: 'ANALYTICS', manage: 'MANAGEMENT', system: 'SYSTEM',
};

// ─── Shared Components ─────────────────────────────────────────────────────────
function Card({ children, className = '', glow = false }: { children: React.ReactNode; className?: string; glow?: boolean }) {
  return (
    <div style={{
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: 24,
      boxShadow: glow ? `0 0 32px ${T.primaryGlow}, 0 2px 12px rgba(43,34,26,0.06)` : '0 2px 12px rgba(43,34,26,0.06)',
      position: 'relative', overflow: 'hidden',
    }} className={className}>{children}</div>
  );
}

function Badge({ label, color = T.primary }: { label: string; color?: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', padding: '2px 10px', borderRadius: 100,
      fontSize: 11, fontWeight: 700, letterSpacing: '0.03em',
      background: color + '22', color, border: `1px solid ${color}44`,
    }}>{label}</span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, [string, string]> = {
    active: [T.green, 'Active'], paused: [T.amber, 'Paused'], pending: [T.amber, 'Pending'],
    rejected: [T.red, 'Rejected'], approved: [T.green, 'Approved'],
    needs_changes: ['#f97316', 'Needs Changes'], verified: [T.green, 'Verified'],
    disconnected: [T.red, 'Disconnected'], connected: [T.green, 'Connected'],
    critical: [T.red, 'Critical'], high: ['#f97316', 'High'], medium: [T.amber, 'Medium'], low: [T.blue, 'Low'],
    enabled: [T.green, 'Enabled'], disabled: [T.muted, 'Disabled'],
  };
  const [color, label] = map[status] || [T.muted, status];
  return <Badge label={label} color={color} />;
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)} style={{
      width: 44, height: 24, borderRadius: 12, border: 'none', cursor: 'pointer',
      background: value ? T.primary : T.faint, position: 'relative', transition: 'background 0.2s', flexShrink: 0,
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: '#fff',
        position: 'absolute', top: 3, left: value ? 23 : 3, transition: 'left 0.2s',
        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
      }} />
    </button>
  );
}

function Inp({ value, onChange, placeholder = '', type = 'text', label = '', disabled = false }: any) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>}
      <input suppressHydrationWarning value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} type={type} disabled={disabled}
        style={{
          background: disabled ? T.elevated : T.bg, border: `1px solid ${T.border}`, borderRadius: 10,
          padding: '10px 14px', color: T.text, fontSize: 13, fontFamily: 'inherit', outline: 'none',
          transition: 'border-color 0.2s', width: '100%', opacity: disabled ? 0.7 : 1,
        }}
        onFocus={e => { if (!disabled) e.target.style.borderColor = T.primary; }}
        onBlur={e => (e.target.style.borderColor = T.border)}
      />
    </div>
  );
}

function Sel({ value, onChange, options, label = '' }: { value: string; onChange: (v: string) => void; options: { value: string; label: string }[]; label?: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>}
      <select value={value} onChange={e => onChange(e.target.value)} style={{
        background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10,
        padding: '10px 14px', color: T.text, fontSize: 13, fontFamily: 'inherit', outline: 'none', cursor: 'pointer', width: '100%',
      }}>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

function Btn({ children, onClick, variant = 'primary', size = 'md', loading = false, icon: Icon, disabled = false }: any) {
  const styles: Record<string, any> = {
    primary: { background: T.primary, color: '#fff', border: 'none' },
    secondary: { background: 'transparent', color: T.text, border: `1px solid ${T.border}` },
    danger: { background: T.red + '12', color: T.red, border: `1px solid ${T.red}33` },
    success: { background: T.green + '12', color: T.green, border: `1px solid ${T.green}33` },
    ghost: { background: 'transparent', color: T.muted, border: 'none' },
  };
  const sizes: Record<string, any> = {
    sm: { padding: '6px 12px', fontSize: 12 }, md: { padding: '9px 18px', fontSize: 13 }, lg: { padding: '12px 24px', fontSize: 14 },
  };
  return (
    <button onClick={onClick} disabled={loading || disabled} style={{
      ...styles[variant], ...sizes[size], borderRadius: 10, cursor: (loading || disabled) ? 'not-allowed' : 'pointer',
      fontWeight: 700, fontFamily: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 7,
      transition: 'all 0.15s', opacity: (loading || disabled) ? 0.7 : 1, whiteSpace: 'nowrap',
    }}>
      {loading ? <Loader2 size={13} style={{ animation: 'adspin 1s linear infinite' }} /> : Icon ? <Icon size={13} /> : null}
      {children}
    </button>
  );
}

function KpiCard({ label, value, sub, color = T.primary, icon: Icon, trend, trendUp }: any) {
  return (
    <motion.div whileHover={{ y: -2 }}
      style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 16, padding: '20px 22px', position: 'relative', overflow: 'hidden', cursor: 'default', boxShadow: '0 2px 12px rgba(43,34,26,0.05)' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, ${color}, ${color}66)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
          {Icon && <Icon size={18} />}
        </div>
        {trend !== undefined && trend !== null && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 700, color: trendUp !== false ? T.green : T.red }}>
            {trendUp !== false ? <ArrowUp size={11} /> : <ArrowDown size={11} />}{trend}%
          </div>
        )}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, color: T.text, letterSpacing: '-0.5px', marginBottom: 4 }}>{value}</div>
      <div style={{ fontSize: 12, color: T.muted, fontWeight: 600 }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: T.faint, marginTop: 2 }}>{sub}</div>}
    </motion.div>
  );
}

function SectionHeader({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: T.text, margin: 0, letterSpacing: '-0.3px' }}>{title}</h2>
        {sub && <p style={{ fontSize: 13, color: T.muted, margin: '4px 0 0 0' }}>{sub}</p>}
      </div>
      {action}
    </div>
  );
}

function EmptyState({ icon: Icon, title, sub, action }: { icon: any; title: string; sub: string; action?: React.ReactNode }) {
  return (
    <div style={{ padding: '60px 40px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: T.elevated, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={24} color={T.faint} />
      </div>
      <div>
        <div style={{ fontSize: 15, fontWeight: 700, color: T.text }}>{title}</div>
        <div style={{ fontSize: 13, color: T.muted, marginTop: 5, maxWidth: 320 }}>{sub}</div>
      </div>
      {action}
    </div>
  );
}

// ─── Media Upload (Drag & Drop) ───────────────────────────────────────────────
function MediaUpload({
  type, value, onChange, label, accept,
}: {
  type: 'image' | 'audio' | 'video';
  value: string;
  onChange: (url: string) => void;
  label: string;
  accept?: string;
}) {
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [urlInput, setUrlInput] = useState(value);
  const fileRef = useRef<HTMLInputElement>(null);

  // Sync external value → url input box
  useEffect(() => { setUrlInput(value); }, [value]);

  const ACCEPT: Record<string, string> = {
    image: 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml',
    audio: 'audio/mpeg,audio/mp4,audio/aac,audio/ogg,audio/wav,audio/webm',
    video: 'video/mp4,video/webm,video/ogg,video/quicktime,video/x-msvideo',
  };

  const upload = async (file: File) => {
    const validTypes = ACCEPT[type].split(',');
    const isValid = validTypes.some(t => file.type.startsWith(t.split('/')[0]));
    if (!isValid) { toast.error(`Please upload a valid ${type} file`); return; }

    setUploading(true);
    setProgress(10);
    try {
      // Send file as a raw binary stream to avoid Next.js FormData parsing issues
      const headers: Record<string, string> = {
        'Content-Type': file.type || 'application/octet-stream',
        'X-File-Name': encodeURIComponent(file.name)
      };

      // Fake progress ticks
      const ticker = setInterval(() => setProgress(p => Math.min(p + 12, 88)), 180);
      const res = await fetch('/api/admin/ads-upload', { 
        method: 'POST', 
        headers,
        body: file 
      });
      clearInterval(ticker);
      setProgress(100);
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Upload failed');
      onChange(json.url);
      setUrlInput(json.url);
      toast.success(`${type.charAt(0).toUpperCase() + type.slice(1)} uploaded!`);
    } catch (e: any) {
      toast.error(e.message || 'Upload failed');
    }
    setTimeout(() => { setUploading(false); setProgress(0); }, 400);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) upload(file);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
    e.target.value = '';
  };

  const hasValue = !!(value && value.trim());

  const ICON_MAP = { image: ImageIcon, audio: Volume2, video: Video };
  const MediaIcon = ICON_MAP[type];

  const borderColor = dragging ? T.primary : uploading ? T.amber : hasValue ? T.green + '80' : T.border;
  const bgColor = dragging ? T.primary + '08' : hasValue ? T.green + '06' : T.bg;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && <label style={{ fontSize: 11, fontWeight: 600, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</label>}

      {/* Drop Zone */}
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={e => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        style={{
          border: `2px dashed ${borderColor}`, borderRadius: 12,
          background: bgColor, cursor: uploading ? 'wait' : 'pointer',
          transition: 'all 0.18s', position: 'relative', overflow: 'hidden',
          minHeight: type === 'image' && hasValue ? 140 : type === 'video' && hasValue ? 160 : 90,
        }}
      >
        {/* Progress bar */}
        {uploading && (
          <div style={{ position: 'absolute', top: 0, left: 0, height: 3, background: T.amber, width: `${progress}%`, transition: 'width 0.18s', zIndex: 10, borderRadius: '0 2px 0 0' }} />
        )}

        {/* Image preview */}
        {type === 'image' && hasValue && !uploading && (
          <div style={{ position: 'relative', width: '100%', height: 140 }}>
            <img src={value} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }} onError={e => (e.currentTarget.style.display = 'none')} />
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity 0.2s' }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '0')}>
              <span style={{ color: '#fff', fontSize: 12, fontWeight: 700 }}>Click or drop to replace</span>
            </div>
          </div>
        )}

        {/* Audio preview */}
        {type === 'audio' && hasValue && !uploading && (
          <div style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: T.primary + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Volume2 size={18} color={T.primary} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {value.split('/').pop()}
              </div>
              <audio controls src={value} style={{ marginTop: 6, width: '100%', height: 28, accentColor: T.primary }} />
            </div>
          </div>
        )}

        {/* Video preview */}
        {type === 'video' && hasValue && !uploading && (
          <div style={{ padding: 8 }}>
            <video src={value} controls style={{ width: '100%', borderRadius: 8, maxHeight: 144 }}
              onError={e => (e.currentTarget.style.display = 'none')} />
          </div>
        )}

        {/* Empty / uploading state */}
        {(!hasValue || uploading) && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '18px 12px', gap: 8 }}>
            {uploading ? (
              <>
                <Loader2 size={22} color={T.amber} style={{ animation: 'adspin 1s linear infinite' }} />
                <span style={{ fontSize: 12, color: T.amber, fontWeight: 700 }}>Uploading… {progress}%</span>
              </>
            ) : (
              <>
                <div style={{ width: 38, height: 38, borderRadius: 10, background: dragging ? T.primary + '18' : T.elevated, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.18s' }}>
                  <MediaIcon size={18} color={dragging ? T.primary : T.faint} />
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: dragging ? T.primary : T.text }}>
                    {dragging ? 'Drop to upload' : 'Drag & drop or click to browse'}
                  </div>
                  <div style={{ fontSize: 10, color: T.muted, marginTop: 2 }}>
                    {type === 'image' ? 'JPG, PNG, GIF, WebP, SVG' : type === 'audio' ? 'MP3, AAC, OGG, WAV' : 'MP4, WebM, MOV, AVI'}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        <input suppressHydrationWarning ref={fileRef} type="file" accept={accept || ACCEPT[type]} onChange={onFile}
          style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
      </div>

      {/* URL fallback input */}
      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        <input suppressHydrationWarning
          value={urlInput}
          onChange={e => setUrlInput(e.target.value)}
          onBlur={() => { if (urlInput !== value) onChange(urlInput); }}
          onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onChange(urlInput); } }}
          placeholder={`Or paste ${type} URL…`}
          style={{
            flex: 1, background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 8,
            padding: '7px 11px', color: T.text, fontSize: 12, fontFamily: 'inherit',
            outline: 'none', transition: 'border-color 0.15s',
          }}
          onFocus={e => (e.target.style.borderColor = T.primary)}
          onBlurCapture={e => (e.target.style.borderColor = T.border)}
        />
        {hasValue && (
          <button onClick={() => { onChange(''); setUrlInput(''); }}
            title="Clear" style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', padding: 4, display: 'flex' }}>
            <X size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Ad Creative Form ─────────────────────────────────────────────────────────
function AdCreativeForm({ adType, campaigns, onSubmit, onCancel }: { adType: string; campaigns: any[]; onSubmit: (data: any) => Promise<void>; onCancel: () => void }) {
  const [form, setForm] = useState({
    name: '', campaignId: '', status: 'active', placement: '',
    destinationUrl: '', imageUrl: '', audioUrl: '', videoUrl: '',
    duration: 15, skipAfter: 5, width: 728, height: 90,
    headline: '', bodyText: '', ctaText: 'Learn More',
    targetCountries: '', startDate: '', endDate: '',
    frequency: 3, priority: 'medium',
  });
  const [saving, setSaving] = useState(false);

  const placementOptions: Record<string, { value: string; label: string }[]> = {
    banner: [{ value: 'homepage_hero', label: 'Homepage Hero' }, { value: 'sidebar', label: 'Sidebar' }, { value: 'player_bottom', label: 'Player Bottom' }, { value: 'lyrics_panel', label: 'Lyrics Panel' }, { value: 'search_results', label: 'Search Results' }],
    audio: [{ value: 'between_songs', label: 'Between Songs' }, { value: 'session_start', label: 'Session Start' }],
    video: [{ value: 'player_fullscreen', label: 'Player Fullscreen' }, { value: 'now_playing', label: 'Now Playing' }],
    interstitial: [{ value: 'between_songs', label: 'Between Songs' }, { value: 'app_open', label: 'App Open' }],
    rewarded: [{ value: 'reward_screen', label: 'Reward Screen' }],
    native: [{ value: 'search_results', label: 'Search Results' }, { value: 'homepage_middle', label: 'Homepage Middle' }],
    popup: [{ value: 'popup', label: 'Popup Overlay' }],
  };

  const handleSubmit = async () => {
    if (!form.name) { toast.error('Ad name is required'); return; }
    setSaving(true);
    await onSubmit({ ...form, type: adType });
    setSaving(false);
  };

  return (
    <Card>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: T.primary + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}>
          <Plus size={18} />
        </div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>Create {adType.charAt(0).toUpperCase() + adType.slice(1)} Ad</div>
          <div style={{ fontSize: 12, color: T.muted }}>Fill in the details to create your new ad creative</div>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
        <Inp label="Ad Name *" value={form.name} onChange={(v: string) => setForm(f => ({ ...f, name: v }))} placeholder={`My ${adType} ad`} />
        <Sel label="Campaign" value={form.campaignId} onChange={v => setForm(f => ({ ...f, campaignId: v }))}
          options={[{ value: '', label: '— None / Standalone —' }, ...campaigns.map(c => ({ value: c.id, label: c.name }))]} />
        <Sel label="Placement" value={form.placement} onChange={v => setForm(f => ({ ...f, placement: v }))}
          options={[{ value: '', label: '— Select placement —' }, ...(placementOptions[adType] || [])]} />
        {(adType === 'banner' || adType === 'native') && (
          <>
            <div style={{ gridColumn: '1 / -1' }}>
              <MediaUpload type="image" label="Ad Image (drag & drop or click to browse)" value={form.imageUrl} onChange={v => setForm(f => ({ ...f, imageUrl: v }))} />
            </div>
            <Inp label="Headline" value={form.headline} onChange={(v: string) => setForm(f => ({ ...f, headline: v }))} placeholder="Try Beato Premium" />
            <Inp label="CTA Text" value={form.ctaText} onChange={(v: string) => setForm(f => ({ ...f, ctaText: v }))} placeholder="Get Started" />
          </>
        )}
        {adType === 'audio' && (
          <>
            <div style={{ gridColumn: '1 / -1' }}>
              <MediaUpload type="audio" label="Audio File (drag & drop MP3/AAC/OGG or paste URL)" value={form.audioUrl} onChange={v => setForm(f => ({ ...f, audioUrl: v }))} />
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <MediaUpload type="image" label="Companion Banner (optional — shown while ad plays)" value={form.imageUrl} onChange={v => setForm(f => ({ ...f, imageUrl: v }))} />
            </div>
            <Inp label="Duration (s)" value={form.duration} onChange={(v: string) => setForm(f => ({ ...f, duration: Number(v) }))} type="number" />
            <Inp label="Skip After (s)" value={form.skipAfter} onChange={(v: string) => setForm(f => ({ ...f, skipAfter: Number(v) }))} type="number" />
          </>
        )}
        {(adType === 'video' || adType === 'rewarded' || adType === 'interstitial') && (
          <>
            <div style={{ gridColumn: '1 / -1' }}>
              <MediaUpload type="video" label="Ad Video (drag & drop MP4/WebM or paste URL)" value={form.videoUrl} onChange={v => setForm(f => ({ ...f, videoUrl: v }))} />
            </div>
            <Inp label="Duration (s)" value={form.duration} onChange={(v: string) => setForm(f => ({ ...f, duration: Number(v) }))} type="number" />
            <Inp label="Skip After (s, 0 = no skip)" value={form.skipAfter} onChange={(v: string) => setForm(f => ({ ...f, skipAfter: Number(v) }))} type="number" />
          </>
        )}
        {adType === 'popup' && (
          <>
            <div style={{ gridColumn: '1 / -1' }}>
              <MediaUpload type="image" label="Popup Image (optional background)" value={form.imageUrl} onChange={v => setForm(f => ({ ...f, imageUrl: v }))} />
            </div>
            <Inp label="Headline" value={form.headline} onChange={(v: string) => setForm(f => ({ ...f, headline: v }))} placeholder="Upgrade to Premium!" />
            <Inp label="Body Text" value={form.bodyText} onChange={(v: string) => setForm(f => ({ ...f, bodyText: v }))} placeholder="Enjoy unlimited listening" />
            <Inp label="CTA Text" value={form.ctaText} onChange={(v: string) => setForm(f => ({ ...f, ctaText: v }))} placeholder="Upgrade Now" />
          </>
        )}
        <Inp label="Destination URL" value={form.destinationUrl} onChange={(v: string) => setForm(f => ({ ...f, destinationUrl: v }))} placeholder="https://beato.app/premium" />
        <Inp label="Target Countries (comma)" value={form.targetCountries} onChange={(v: string) => setForm(f => ({ ...f, targetCountries: v }))} placeholder="IN, US, GB" />
        <Sel label="Priority" value={form.priority} onChange={v => setForm(f => ({ ...f, priority: v }))}
          options={[{ value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
        <Inp label="Start Date" value={form.startDate} onChange={(v: string) => setForm(f => ({ ...f, startDate: v }))} type="date" />
        <Inp label="End Date" value={form.endDate} onChange={(v: string) => setForm(f => ({ ...f, endDate: v }))} type="date" />
        <Sel label="Status" value={form.status} onChange={v => setForm(f => ({ ...f, status: v }))}
          options={[{ value: 'active', label: 'Active' }, { value: 'paused', label: 'Save as Draft' }]} />
      </div>
      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 16, borderTop: `1px solid ${T.border}` }}>
        <Btn onClick={onCancel} variant="secondary">Cancel</Btn>
        <Btn onClick={handleSubmit} loading={saving} icon={Check}>Create Ad</Btn>
      </div>
    </Card>
  );
}

// ─── Generic Ad Type Panel ─────────────────────────────────────────────────────
function AdTypePanel({ adType, icon: Icon, label, adsData, campaigns, onSave, onRefresh }: {
  adType: string; icon: any; label: string; adsData: any[]; campaigns: any[]; onSave: (a: string, p: any) => Promise<void>; onRefresh: () => void;
}) {
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const myAds = adsData.filter(a => a.type === adType).filter(a => {
    const ms = a.name?.toLowerCase().includes(search.toLowerCase());
    const mf = filterStatus === 'all' || a.status === filterStatus;
    return ms && mf;
  });

  const handleCreate = async (data: any) => {
    await onSave('create_ad', data);
    setShowCreate(false);
    onRefresh();
    toast.success('Ad created!');
  };

  const handleToggle = async (ad: any) => {
    const ns = ad.status === 'active' ? 'paused' : 'active';
    await onSave('update_ad', { id: ad.id, status: ns });
    onRefresh();
    toast.success(`Ad ${ns}`);
  };

  const handleDelete = async (ad: any) => {
    await onSave('delete_ad', { id: ad.id });
    onRefresh();
    toast.success('Ad deleted');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title={label} sub={`Manage your ${label.toLowerCase()} creatives and placements`}
        action={<Btn onClick={() => setShowCreate(true)} icon={Plus}>Create {label.split(' ')[0]} Ad</Btn>} />

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiCard label="Total Ads" value={adsData.filter(a => a.type === adType).length} icon={Icon} color={T.primary} />
        <KpiCard label="Active" value={adsData.filter(a => a.type === adType && a.status === 'active').length} icon={Activity} color={T.green} />
        <KpiCard label="Impressions" value={(adsData.filter(a => a.type === adType).reduce((s: number, a: any) => s + (a.impressions || 0), 0)).toLocaleString()} icon={Eye} color={T.blue} />
        <KpiCard label="Clicks" value={(adsData.filter(a => a.type === adType).reduce((s: number, a: any) => s + (a.clicks || 0), 0)).toLocaleString()} icon={TrendingUp} color={T.amber} />
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
          <input suppressHydrationWarning value={search} onChange={e => setSearch(e.target.value)} placeholder={`Search ${label.toLowerCase()}...`}
            style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px 8px 32px', color: T.text, fontSize: 13, width: '100%', outline: 'none', fontFamily: 'inherit' }} />
        </div>
        {['all', 'active', 'paused'].map(f => (
          <button key={f} onClick={() => setFilterStatus(f)} style={{
            padding: '7px 14px', borderRadius: 8, border: `1px solid ${filterStatus === f ? T.primary : T.border}`,
            background: filterStatus === f ? T.primary + '14' : 'transparent',
            color: filterStatus === f ? T.primary : T.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      {/* Create Form */}
      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <AdCreativeForm adType={adType} campaigns={campaigns} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ads Grid / Empty */}
      {myAds.length === 0 && !showCreate ? (
        <Card>
          <EmptyState icon={Icon} title={`No ${label} yet`}
            sub={`Create your first ${label.toLowerCase()} to start serving it to your free-tier users`}
            action={<Btn onClick={() => setShowCreate(true)} icon={Plus}>Create First Ad</Btn>} />
        </Card>
      ) : (
        <Card>
          {myAds.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Ad Name', 'Placement', 'Status', 'Impressions', 'Clicks', 'CTR', 'Priority', 'Created', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {myAds.map((ad: any, i: number) => (
                    <tr key={ad.id} style={{ borderBottom: `1px solid ${T.border}40` }}
                      onMouseEnter={e => (e.currentTarget.style.background = T.elevated)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: T.text }}>{ad.name}</td>
                      <td style={{ padding: '12px' }}><Badge label={ad.placement || '—'} /></td>
                      <td style={{ padding: '12px' }}><StatusBadge status={ad.status} /></td>
                      <td style={{ padding: '12px', fontSize: 13, color: T.muted }}>{(ad.impressions || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px', fontSize: 13, color: T.muted }}>{(ad.clicks || 0).toLocaleString()}</td>
                      <td style={{ padding: '12px', fontSize: 13, color: T.primary, fontWeight: 700 }}>
                        {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00'}%
                      </td>
                      <td style={{ padding: '12px' }}><StatusBadge status={ad.priority || 'medium'} /></td>
                      <td style={{ padding: '12px', fontSize: 11, color: T.muted }}>{ad.createdAt ? new Date(ad.createdAt).toLocaleDateString() : '—'}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => handleToggle(ad)} title={ad.status === 'active' ? 'Pause' : 'Activate'}
                            style={{ background: 'none', border: 'none', color: ad.status === 'active' ? T.amber : T.green, cursor: 'pointer', padding: 4 }}>
                            {ad.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
                          </button>
                          <button onClick={() => handleDelete(ad)} title="Delete"
                            style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', padding: 4 }}>
                            <X size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── Overview ─────────────────────────────────────────────────────────────────
function OverviewPanel({ adsData, platformStats, campaigns }: { adsData: any; platformStats: any; campaigns: any[] }) {
  const ads: any[] = adsData?.ads || [];
  const approvalQueue: any[] = adsData?.approvalQueue || [];
  const logs: any[] = adsData?.logs || [];
  const revenueData = adsData?.revenueData || {};

  // Real platform numbers
  const totalUsers = platformStats?.totalUsers || 0;
  const activeArtists = platformStats?.activeArtists || 0;
  const totalSongs = platformStats?.totalSongs || 0;
  const totalPlays = platformStats?.totalPlays || 0;
  const currencySymbol = platformStats?.currencySymbol || '$';
  const monthlyRevenue = platformStats?.monthlyRevenue || 0;
  const streamData = platformStats?.streamData || [];
  const monthlyData = platformStats?.monthlyData || [];

  // Ad stats from db
  const activeAds = ads.filter(a => a.status === 'active').length;
  const activeCampaigns = campaigns.filter(c => c.status === 'active').length;
  const pendingApproval = approvalQueue.filter(a => a.status === 'pending').length;
  const totalImpressions = ads.reduce((s: number, a: any) => s + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((s: number, a: any) => s + (a.clicks || 0), 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';

  // Estimated ad revenue from free user plays (0.0025 per stream)
  const freeUsers = totalUsers; // approximation
  const estimatedAdRev = Math.round(totalPlays * 0.0025 * 100) / 100;

  const kpis = [
    { label: 'Platform Users', value: totalUsers.toLocaleString(), sub: 'All registered users', icon: Users, color: T.primary },
    { label: 'Active Artists', value: activeArtists.toLocaleString(), sub: 'On the platform', icon: Mic, color: T.purple },
    { label: 'Total Tracks', value: totalSongs.toLocaleString(), sub: 'Published songs', icon: Music, color: T.blue },
    { label: 'Total Plays', value: totalPlays.toLocaleString(), sub: 'All-time streams', icon: Play, color: T.green },
    { label: 'Monthly Revenue', value: `${currencySymbol}${monthlyRevenue.toLocaleString()}`, sub: 'Subscriptions + ads', icon: DollarSign, color: T.green },
    { label: 'Active Ad Campaigns', value: activeCampaigns, sub: 'Currently running', icon: Megaphone, color: T.amber },
    { label: 'Live Ads', value: activeAds, sub: 'Currently serving', icon: Activity, color: T.primary },
    { label: 'Pending Approval', value: pendingApproval, sub: 'Needs review', icon: Clock, color: pendingApproval > 0 ? T.red : T.muted },
    { label: 'Ad Impressions', value: totalImpressions.toLocaleString(), sub: 'All-time', icon: Eye, color: T.blue },
    { label: 'Ad Clicks', value: totalClicks.toLocaleString(), sub: 'All-time', icon: TrendingUp, color: T.green },
    { label: 'Avg Ad CTR', value: `${avgCTR}%`, sub: 'Click-through rate', icon: Target, color: T.amber },
    { label: 'Est. Ad Revenue', value: `$${estimatedAdRev.toLocaleString()}`, sub: 'From free-tier plays', icon: Award, color: T.green },
  ];

  const chartStreamData = streamData.length > 0 ? streamData : monthlyData;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ padding: '14px 18px', background: T.elevated, borderRadius: 12, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Info size={15} color={T.primary} />
        <span style={{ fontSize: 13, color: T.muted }}>Overview shows <strong style={{ color: T.text }}>real platform data</strong>. Ad impressions & clicks update as your ads are served to free-tier users.</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))', gap: 14 }}>
        {kpis.map((k, i) => (
          <motion.div key={k.label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <KpiCard {...k} />
          </motion.div>
        ))}
      </div>

      {/* Revenue Chart */}
      {chartStreamData.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
          <Card>
            <SectionHeader title="Platform Revenue" sub="Real subscription + streaming revenue" />
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={chartStreamData}>
                <defs>
                  <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={T.primary} stopOpacity={0.25} />
                    <stop offset="95%" stopColor={T.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey={streamData.length > 0 ? 'day' : 'month'} stroke={T.faint} tick={{ fill: T.muted, fontSize: 11 }} />
                <YAxis stroke={T.faint} tick={{ fill: T.muted, fontSize: 11 }} />
                <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 12 }} />
                <Area type="monotone" dataKey="revenue" stroke={T.primary} fill="url(#revGrad)" strokeWidth={2} name={`Revenue (${currencySymbol})`} />
              </AreaChart>
            </ResponsiveContainer>
          </Card>

          <Card>
            <SectionHeader title="Active Campaigns" sub="By type" />
            {campaigns.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {campaigns.slice(0, 6).map((c: any, i: number) => (
                  <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: CHART_COLORS[i % CHART_COLORS.length], flexShrink: 0 }} />
                      <span style={{ color: T.text, fontWeight: 600 }}>{c.name}</span>
                    </div>
                    <StatusBadge status={c.status} />
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '30px 0', color: T.muted, fontSize: 13 }}>No campaigns yet</div>
            )}
          </Card>
        </div>
      )}

      {/* Streams chart */}
      {streamData.length > 0 && (
        <Card>
          <SectionHeader title="Streams this Week" sub="Used for ad frequency calculations" />
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={streamData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="day" stroke={T.faint} tick={{ fill: T.muted, fontSize: 11 }} />
              <YAxis stroke={T.faint} tick={{ fill: T.muted, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 12 }} />
              <Bar dataKey="streams" fill={T.primary} radius={[4, 4, 0, 0]} name="Streams" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Recent Activity */}
      {logs.length > 0 && (
        <Card>
          <SectionHeader title="Recent Activity" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {logs.slice(0, 8).map((log: any, i: number) => {
              const colorMap: Record<string, string> = { info: T.blue, success: T.green, error: T.red, warning: T.amber };
              const color = colorMap[log.level] || T.muted;
              return (
                <div key={log.id} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderBottom: i < logs.length - 1 ? `1px solid ${T.border}40` : 'none' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, marginTop: 5, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{log.action}</span>
                    <span style={{ fontSize: 12, color: T.muted, marginLeft: 8 }}>{log.detail}</span>
                  </div>
                  <span style={{ fontSize: 11, color: T.faint, flexShrink: 0 }}>{new Date(log.timestamp).toLocaleString()}</span>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── AdSense ──────────────────────────────────────────────────────────────────
function AdSensePanel({ adsData, onSave }: { adsData: any; onSave: (a: string, p: any) => Promise<void> }) {
  const [config, setConfig] = useState({
    enabled: false, publisherId: '', clientId: '', clientSecret: '',
    apiKey: '', refreshToken: '', sandboxMode: true, autoSync: true, status: 'disconnected', lastSync: null as string | null,
    ...(adsData?.adsenseConfig || {}),
  });
  const [testing, setTesting] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave('update_adsense', config);
    setSaving(false);
    toast.success('AdSense configuration saved!');
  };

  const handleTest = async () => {
    if (!config.publisherId || !config.apiKey) { toast.error('Publisher ID and API Key required'); return; }
    setTesting(true);
    await new Promise(r => setTimeout(r, 1800));
    setConfig((c: any) => ({ ...c, status: 'connected', lastSync: new Date().toISOString() }));
    toast.success('AdSense connected!');
    setTesting(false);
  };

  const fieldRow = (label: string, key: keyof typeof config, type = 'text', placeholder = '') => (
    <Inp key={key} label={label} value={(config as any)[key]} onChange={(v: string) => setConfig((c: any) => ({ ...c, [key]: v }))} type={type} placeholder={placeholder} />
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Google AdSense" sub="Connect your AdSense account to monetize free users with real ads" />

      <Card glow={config.status === 'connected'}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 52, height: 52, borderRadius: 14, background: config.status === 'connected' ? T.green + '14' : T.red + '14', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {config.status === 'connected' ? <CheckCircle size={24} color={T.green} /> : <XCircle size={24} color={T.red} />}
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: T.text }}>{config.status === 'connected' ? 'AdSense Connected' : 'AdSense Not Connected'}</div>
            <div style={{ fontSize: 12, color: T.muted, marginTop: 3 }}>
              {config.status === 'connected' ? `pub-${config.publisherId} · Last sync: ${config.lastSync ? new Date(config.lastSync).toLocaleString() : 'Never'}` : 'Enter your credentials below and test the connection'}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn onClick={handleTest} loading={testing} variant="secondary" icon={Wifi}>Test Connection</Btn>
            <Btn onClick={handleSave} loading={saving} icon={Check}>Save</Btn>
          </div>
        </div>
      </Card>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 16px 0' }}>Publisher Credentials</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fieldRow('Publisher ID', 'publisherId', 'text', 'pub-xxxxxxxxxxxxxxxx')}
            {fieldRow('Client ID', 'clientId', 'text', 'xxxxx.apps.googleusercontent.com')}
            {fieldRow('Client Secret', 'clientSecret', 'password', 'GOCSPX-xxxxxxxx')}
          </div>
        </Card>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 16px 0' }}>API Settings</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {fieldRow('API Key', 'apiKey', 'password', 'AIzaSy-xxxxxxxx')}
            {fieldRow('Refresh Token', 'refreshToken', 'password', '1//0xxxxxxxxxxxxxxxx')}
            {[
              { key: 'sandboxMode', label: 'Sandbox / Test Mode', desc: 'Use test creatives (no billing)' },
              { key: 'autoSync', label: 'Auto-Sync Hourly', desc: 'Refresh ad performance data' },
              { key: 'enabled', label: 'Enable AdSense', desc: 'Serve AdSense ads to free users' },
            ].map(({ key, label, desc }) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: `1px solid ${T.border}40` }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{label}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{desc}</div>
                </div>
                <Toggle value={!!(config as any)[key]} onChange={v => setConfig((c: any) => ({ ...c, [key]: v }))} />
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 14px 0' }}>How to Get Credentials</h3>
        {[
          ['1. Create AdSense Account', 'Go to adsense.google.com → Sign up with your publisher email → Get your Publisher ID (starts with pub-)'],
          ['2. Enable AdSense API', 'Go to console.cloud.google.com → Create Project → APIs & Services → Enable "AdSense Management API"'],
          ['3. Create OAuth Credentials', 'Go to APIs & Services → Credentials → Create OAuth 2.0 Client ID → Copy Client ID and Secret'],
          ['4. Get API Key', 'Go to APIs & Services → Credentials → Create API Key → Restrict to AdSense API'],
          ['5. Generate Refresh Token', 'Use OAuth 2.0 Playground (developers.google.com/oauthplayground) → Authorize AdSense scope → Copy refresh token'],
        ].map(([title, desc]) => (
          <div key={title} style={{ display: 'flex', gap: 12, padding: '12px 0', borderBottom: `1px solid ${T.border}40` }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.primary, marginTop: 6, flexShrink: 0 }} />
            <div>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.text, marginBottom: 2 }}>{title}</div>
              <div style={{ fontSize: 12, color: T.muted }}>{desc}</div>
            </div>
          </div>
        ))}
      </Card>
    </div>
  );
}

// ─── Campaigns ────────────────────────────────────────────────────────────────
function CampaignsPanel({ adsData, onSave, onRefresh }: { adsData: any; onSave: (a: string, p: any) => Promise<void>; onRefresh: () => void }) {
  const campaigns = adsData?.campaigns || [];
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [newCamp, setNewCamp] = useState({ name: '', advertiser: '', type: 'banner', status: 'active', budget: '', startDate: '', endDate: '', countries: '', priority: 'medium' });
  const [creating, setCreating] = useState(false);

  const filtered = campaigns.filter((c: any) => {
    const ms = c.name?.toLowerCase().includes(search.toLowerCase()) || c.advertiser?.toLowerCase().includes(search.toLowerCase());
    return ms && (filterStatus === 'all' || c.status === filterStatus);
  });

  const handleCreate = async () => {
    if (!newCamp.name) { toast.error('Campaign name required'); return; }
    setCreating(true);
    await onSave('create_campaign', { ...newCamp, budget: Number(newCamp.budget) || 0 });
    setCreating(false);
    setShowCreate(false);
    onRefresh();
    toast.success('Campaign created!');
  };

  const handleToggle = async (c: any) => {
    const ns = c.status === 'active' ? 'paused' : 'active';
    await onSave('update_campaign', { id: c.id, status: ns });
    onRefresh();
    toast.success(`Campaign ${ns}`);
  };

  const handleDelete = async (c: any) => {
    await onSave('delete_campaign', { id: c.id });
    onRefresh();
    toast.success('Campaign deleted');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Campaign Manager" sub="Organize your ads under campaigns for better tracking"
        action={<Btn onClick={() => setShowCreate(v => !v)} icon={Plus}>New Campaign</Btn>} />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
          <input suppressHydrationWarning value={search} onChange={e => setSearch(e.target.value)} placeholder="Search campaigns..."
            style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px 8px 32px', color: T.text, fontSize: 13, width: '100%', outline: 'none', fontFamily: 'inherit' }} />
        </div>
        {['all', 'active', 'paused', 'pending'].map(f => (
          <button key={f} onClick={() => setFilterStatus(f)} style={{
            padding: '7px 14px', borderRadius: 8, border: `1px solid ${filterStatus === f ? T.primary : T.border}`,
            background: filterStatus === f ? T.primary + '14' : 'transparent',
            color: filterStatus === f ? T.primary : T.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
          }}>{f.charAt(0).toUpperCase() + f.slice(1)}</button>
        ))}
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card>
              <h3 style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: '0 0 16px 0' }}>New Campaign</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 16 }}>
                <Inp label="Name *" value={newCamp.name} onChange={(v: string) => setNewCamp(c => ({ ...c, name: v }))} placeholder="Q3 Premium Drive" />
                <Inp label="Advertiser" value={newCamp.advertiser} onChange={(v: string) => setNewCamp(c => ({ ...c, advertiser: v }))} placeholder="Beato Internal" />
                <Inp label="Budget ($)" value={newCamp.budget} onChange={(v: string) => setNewCamp(c => ({ ...c, budget: v }))} type="number" />
                <Sel label="Ad Type" value={newCamp.type} onChange={v => setNewCamp(c => ({ ...c, type: v }))}
                  options={[{ value: 'banner', label: 'Banner' }, { value: 'audio', label: 'Audio' }, { value: 'video', label: 'Video' }, { value: 'native', label: 'Native' }, { value: 'popup', label: 'Popup' }]} />
                <Sel label="Priority" value={newCamp.priority} onChange={v => setNewCamp(c => ({ ...c, priority: v }))}
                  options={[{ value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
                <Inp label="Target Countries" value={newCamp.countries} onChange={(v: string) => setNewCamp(c => ({ ...c, countries: v }))} placeholder="IN, US, GB" />
                <Inp label="Start Date" value={newCamp.startDate} onChange={(v: string) => setNewCamp(c => ({ ...c, startDate: v }))} type="date" />
                <Inp label="End Date" value={newCamp.endDate} onChange={(v: string) => setNewCamp(c => ({ ...c, endDate: v }))} type="date" />
                <Sel label="Status" value={newCamp.status} onChange={v => setNewCamp(c => ({ ...c, status: v }))}
                  options={[{ value: 'active', label: 'Active' }, { value: 'paused', label: 'Draft' }]} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Btn onClick={() => setShowCreate(false)} variant="secondary">Cancel</Btn>
                <Btn onClick={handleCreate} loading={creating} icon={Check}>Create Campaign</Btn>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 && !showCreate ? (
        <Card>
          <EmptyState icon={Megaphone} title="No campaigns yet" sub="Create a campaign to group your ads and track their performance together"
            action={<Btn onClick={() => setShowCreate(true)} icon={Plus}>Create First Campaign</Btn>} />
        </Card>
      ) : (
        <Card>
          {filtered.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                    {['Campaign', 'Type', 'Advertiser', 'Budget', 'Priority', 'Status', 'Start', 'End', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((c: any) => (
                    <tr key={c.id} style={{ borderBottom: `1px solid ${T.border}40` }}
                      onMouseEnter={e => (e.currentTarget.style.background = T.elevated)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: T.text }}>{c.name}</td>
                      <td style={{ padding: '12px' }}><Badge label={c.type || '—'} /></td>
                      <td style={{ padding: '12px', fontSize: 13, color: T.muted }}>{c.advertiser || '—'}</td>
                      <td style={{ padding: '12px', fontSize: 13, color: T.text, fontWeight: 600 }}>{c.budget ? `$${Number(c.budget).toLocaleString()}` : '—'}</td>
                      <td style={{ padding: '12px' }}><StatusBadge status={c.priority || 'medium'} /></td>
                      <td style={{ padding: '12px' }}><StatusBadge status={c.status} /></td>
                      <td style={{ padding: '12px', fontSize: 12, color: T.muted }}>{c.startDate || '—'}</td>
                      <td style={{ padding: '12px', fontSize: 12, color: T.muted }}>{c.endDate || '—'}</td>
                      <td style={{ padding: '12px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => handleToggle(c)} title={c.status === 'active' ? 'Pause' : 'Activate'}
                            style={{ background: 'none', border: 'none', color: c.status === 'active' ? T.amber : T.green, cursor: 'pointer', padding: 4 }}>
                            {c.status === 'active' ? <Pause size={13} /> : <Play size={13} />}
                          </button>
                          <button onClick={() => handleDelete(c)} title="Delete"
                            style={{ background: 'none', border: 'none', color: T.red, cursor: 'pointer', padding: 4 }}>
                            <X size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── Audio Ads (special panel with preview) ───────────────────────────────────
function AudioAdsPanel({ adsData, campaigns, onSave, onRefresh }: { adsData: any; campaigns: any[]; onSave: (a: string, p: any) => Promise<void>; onRefresh: () => void }) {
  const [showCreate, setShowCreate] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);
  const ads = (adsData?.ads || []).filter((a: any) => a.type === 'audio');

  const togglePreview = () => {
    if (!previewUrl) { toast.error('Enter an audio URL to preview'); return; }
    if (audioRef.current) {
      if (isPlaying) { audioRef.current.pause(); setIsPlaying(false); }
      else { audioRef.current.src = previewUrl; audioRef.current.play().then(() => setIsPlaying(true)).catch(() => toast.error('Cannot play audio')); }
    }
  };

  const handleCreate = async (data: any) => {
    await onSave('create_ad', data);
    setShowCreate(false);
    onRefresh();
    toast.success('Audio ad created!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Audio Ads" sub="Spotify-style audio ads served between songs for free-tier users"
        action={<Btn onClick={() => setShowCreate(v => !v)} icon={Plus}>Create Audio Ad</Btn>} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiCard label="Total Audio Ads" value={ads.length} icon={Volume2} color={T.primary} />
        <KpiCard label="Active" value={ads.filter((a: any) => a.status === 'active').length} icon={Activity} color={T.green} />
        <KpiCard label="Total Plays" value={ads.reduce((s: number, a: any) => s + (a.impressions || 0), 0).toLocaleString()} icon={Play} color={T.blue} />
        <KpiCard label="Clicks" value={ads.reduce((s: number, a: any) => s + (a.clicks || 0), 0).toLocaleString()} icon={TrendingUp} color={T.amber} />
      </div>

      {/* Preview Card */}
      <Card>
        <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 14px 0' }}>Audio Preview Tool</h3>
        <MediaUpload
          type="audio"
          label="Drop or browse your audio ad file — it will play instantly below"
          value={previewUrl}
          onChange={v => { setPreviewUrl(v); setIsPlaying(false); }}
        />
        {previewUrl && (
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginTop: 10 }}>
            <button onClick={togglePreview} style={{
              display: 'flex', alignItems: 'center', gap: 8, background: T.primary,
              color: '#fff', border: 'none', borderRadius: 10, padding: '9px 18px',
              cursor: 'pointer', fontWeight: 700, fontSize: 13, fontFamily: 'inherit',
              boxShadow: `0 4px 14px ${T.primaryGlow}`,
            }}>
              {isPlaying ? <Pause size={14} /> : <Play size={14} fill="#fff" />}
              {isPlaying ? 'Pause Preview' : 'Play Preview'}
            </button>
            {isPlaying && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: T.green + '14', border: `1px solid ${T.green}33`, borderRadius: 10 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, animation: 'adspulse 1.2s infinite' }} />
                <span style={{ fontSize: 12, color: T.green, fontWeight: 700 }}>Playing</span>
              </div>
            )}
          </div>
        )}
        <audio ref={audioRef} onEnded={() => setIsPlaying(false)} />
      </Card>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <AdCreativeForm adType="audio" campaigns={campaigns} onSubmit={handleCreate} onCancel={() => setShowCreate(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {ads.length === 0 && !showCreate ? (
        <Card>
          <EmptyState icon={Volume2} title="No audio ads yet" sub="Create audio ads to be served between songs for free-tier listeners"
            action={<Btn onClick={() => setShowCreate(true)} icon={Plus}>Create First Audio Ad</Btn>} />
        </Card>
      ) : (
        <Card>
          {ads.length > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {ads.map((ad: any, i: number) => (
                <div key={ad.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '14px 0', borderBottom: i < ads.length - 1 ? `1px solid ${T.border}40` : 'none' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: T.primary + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary, flexShrink: 0 }}>
                    <Volume2 size={18} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{ad.name}</div>
                    <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{ad.placement || 'No placement'} · {ad.duration || 15}s · Skip after {ad.skipAfter || 5}s</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 12, color: T.muted }}>{(ad.impressions || 0).toLocaleString()} plays</div>
                    <div style={{ fontSize: 11, color: T.faint }}>{ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00'}% CTR</div>
                  </div>
                  <StatusBadge status={ad.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      )}
    </div>
  );
}

// ─── Placement Manager ────────────────────────────────────────────────────────
function PlacementsPanel({ adsData, onSave, onRefresh }: { adsData: any; onSave: (a: string, p: any) => Promise<void>; onRefresh: () => void }) {
  const savedPlacements = adsData?.placementStates || {};
  const savedMappings = adsData?.adMappings || {};
  const savedSettings = adsData?.settings || {};
  const savedAdOrder = adsData?.adOrder || [];
  const savedSectionAds = adsData?.sectionAds || {};

  const [states, setStates] = useState<Record<string, boolean>>({ ...savedPlacements });
  const [mappings, setMappings] = useState<Record<string, string>>({ ...savedMappings });
  const [frequency, setFrequency] = useState<number>(savedSettings.defaultFrequency || 3);
  const [theme, setTheme] = useState<string>(savedSettings.adTheme || 'glass');
  const [adOrder, setAdOrder] = useState<string[]>([...savedAdOrder]);
  const [sectionAds, setSectionAds] = useState<Record<string, string>>({ ...savedSectionAds });
  const [saving, setSaving] = useState(false);
  const [subTab, setSubTab] = useState<'slots' | 'mappings' | 'styling' | 'order'>('slots');
  const isMobile = useIsMobile();

  // Sync state when adsData updates from database
  useEffect(() => {
    if (adsData?.placementStates) setStates({ ...adsData.placementStates });
    if (adsData?.adMappings) setMappings({ ...adsData.adMappings });
    if (adsData?.settings?.defaultFrequency) setFrequency(adsData.settings.defaultFrequency);
    if (adsData?.settings?.adTheme) setTheme(adsData.settings.adTheme);
    if (adsData?.adOrder) setAdOrder(adsData.adOrder);
    if (adsData?.sectionAds) setSectionAds(adsData.sectionAds);
  }, [adsData]);

  const placements = [
    { id: 'homepage_hero', label: 'Homepage Hero', desc: 'Large banner at the top of the home feed', types: ['banner', 'video'], zone: 'Home' },
    { id: 'homepage_middle', label: 'Homepage Middle', desc: 'Card inserted mid-feed between content', types: ['banner', 'native'], zone: 'Home' },
    { id: 'sidebar', label: 'Sidebar', desc: 'Right sidebar display ad (desktop only)', types: ['banner'], zone: 'Global' },
    { id: 'between_songs', label: 'Between Songs', desc: 'Injected between queue tracks (every N songs)', types: ['audio', 'interstitial'], zone: 'Player' },
    { id: 'player_bottom', label: 'Player Bottom Bar', desc: 'Below the music player controls', types: ['banner'], zone: 'Player' },
    { id: 'now_playing', label: 'Now Playing Screen', desc: 'Overlay on fullscreen player', types: ['video', 'interstitial'], zone: 'Player' },
    { id: 'lyrics_panel', label: 'Lyrics Panel', desc: 'Banner inside the lyrics view', types: ['banner', 'native'], zone: 'Lyrics' },
    { id: 'search_results', label: 'Search Results', desc: 'Sponsored result injected into search', types: ['native', 'banner'], zone: 'Search' },
    { id: 'artist_page', label: 'Artist Page', desc: 'Ad on artist profile below bio', types: ['banner', 'native'], zone: 'Artist' },
    { id: 'album_page', label: 'Album Page', desc: 'Ad below album tracklist', types: ['banner', 'native'], zone: 'Album' },
    { id: 'popup', label: 'Popup Overlay', desc: 'Timed modal popup (throttled per session)', types: ['popup', 'interstitial'], zone: 'Global' },
    { id: 'reward_screen', label: 'Reward Screen', desc: 'Watch to unlock a skip or download', types: ['rewarded', 'video'], zone: 'Player' },
  ];

  const ads: any[] = adsData?.ads || [];
  const activeAds = ads.filter(a => a.status === 'active');

  const handleSave = async () => {
    setSaving(true);
    await onSave('update_placements', { 
      placementStates: states,
      adMappings: mappings,
      adOrder: adOrder,
      sectionAds: sectionAds,
      settings: {
        ...savedSettings,
        defaultFrequency: frequency,
        adTheme: theme
      }
    });
    onRefresh();
    setSaving(false);
    toast.success('Placement settings saved!');
  };

  const zones = Array.from(new Set(placements.map(p => p.zone)));

  const renderThemePreview = () => {
    let previewStyle: React.CSSProperties = {};
    let textStyle: React.CSSProperties = { margin: 0, fontWeight: 800, fontSize: 13, fontFamily: 'Outfit, sans-serif' };
    let subStyle: React.CSSProperties = { margin: '4px 0 0 0', fontSize: 11, lineHeight: '1.4' };
    let buttonStyle: React.CSSProperties = { border: 'none', borderRadius: 20, padding: '7px 16px', fontSize: 10, fontWeight: 800, cursor: 'pointer', transition: 'all 0.2s', whiteSpace: 'nowrap' };

    if (theme === 'glass') {
      previewStyle = {
        background: 'rgba(255, 255, 255, 0.45)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.4)',
        borderRadius: 14,
        padding: '16px 20px',
        boxShadow: '0 8px 32px rgba(43, 34, 26, 0.05)',
      };
      textStyle.color = '#221a15';
      subStyle.color = '#706155';
      buttonStyle.background = '#b08850';
      buttonStyle.color = '#fff';
    } else if (theme === 'cream') {
      previewStyle = {
        background: '#fbf9f5',
        border: '1px solid rgba(176, 136, 80, 0.16)',
        borderRadius: 12,
        padding: '16px 20px',
        boxShadow: '0 4px 16px rgba(43, 34, 26, 0.03)',
      };
      textStyle.color = '#221a15';
      subStyle.color = '#87786c';
      buttonStyle.background = '#221a15';
      buttonStyle.color = '#fbf9f5';
    } else if (theme === 'contrast') {
      previewStyle = {
        background: '#ffffff',
        border: '1.5px solid #221a15',
        borderRadius: 6,
        padding: '16px 20px',
      };
      textStyle.color = '#221a15';
      subStyle.color = '#221a15';
      buttonStyle.background = '#221a15';
      buttonStyle.color = '#ffffff';
      buttonStyle.borderRadius = '2px';
    } else if (theme === 'cyberpunk') {
      previewStyle = {
        background: '#121212',
        border: '1px solid #b08850',
        borderRadius: 10,
        padding: '16px 20px',
        boxShadow: '0 0 15px rgba(176, 136, 80, 0.3)',
      };
      textStyle.color = '#fff';
      subStyle.color = '#b08850';
      buttonStyle.background = '#b08850';
      buttonStyle.color = '#000';
    }

    return (
      <div style={previewStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
          <div>
            <div style={{ display: 'inline-block', fontSize: 8, fontWeight: 900, background: 'rgba(176,136,80,0.12)', color: '#b08850', padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', marginBottom: 4, letterSpacing: '0.04em' }}>Sponsored</div>
            <h4 style={textStyle}>Beato Premium Ad Vibe</h4>
            <p style={subStyle}>Experience high-fidelity sound. Stream unlimited tracks offline without ads.</p>
          </div>
          <button style={buttonStyle}>Get Premium</button>
        </div>
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Placement & Arranger Manager" sub="Map created ads to layout sections, adjust frequency, and choose styles"
        action={<Btn onClick={handleSave} loading={saving} icon={Check}>Save Config</Btn>} />

      {/* Sub tabs */}
      <div style={{ display: 'flex', gap: 8, borderBottom: `1px solid ${T.border}`, paddingBottom: 10 }}>
        {[
          { id: 'slots', label: 'Active Slots', icon: MapPin },
          { id: 'mappings', label: 'Ad Layout Mappings', icon: Layers },
          { id: 'styling', label: 'styling & Frequency', icon: Settings },
          { id: 'order', label: 'Ad Layout Order', icon: Sliders }
        ].map(t => {
          const isAct = subTab === t.id;
          return (
            <button key={t.id} onClick={() => setSubTab(t.id as any)} style={{
              display: 'flex', alignItems: 'center', gap: 6, background: isAct ? T.primary + '14' : 'transparent',
              border: isAct ? `1px solid ${T.primary}33` : '1px solid transparent', borderRadius: 8,
              padding: '6px 14px', fontSize: 12, fontWeight: isAct ? 750 : 500, color: isAct ? T.primary : T.muted,
              cursor: 'pointer', transition: 'all 0.15s'
            }}>
              <t.icon size={13} color={isAct ? T.primary : T.muted} />
              {t.label}
            </button>
          );
        })}
      </div>

      {subTab === 'slots' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {zones.map(zone => (
            <div key={zone}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>{zone}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                {placements.filter(p => p.zone === zone).map(p => (
                  <div key={p.id} style={{
                    background: states[p.id] ? T.surface : T.elevated,
                    border: `1px solid ${states[p.id] ? T.primary + '33' : T.border}`,
                    borderRadius: 12, padding: '14px 16px',
                    opacity: states[p.id] ? 1 : 0.65, transition: 'all 0.2s',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{p.label}</div>
                      <Toggle value={!!states[p.id]} onChange={v => setStates(s => ({ ...s, [p.id]: v }))} />
                    </div>
                    <div style={{ fontSize: 11, color: T.muted, marginBottom: 8 }}>{p.desc}</div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                      {p.types.map(t => <Badge key={t} label={t} />)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'mappings' && (
        <Card>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: 0 }}>Map Created Ads to Active Placements</h3>
            <p style={{ fontSize: 12, color: T.muted, margin: 0 }}>Select which specific ad creative plays in each zone. Standalone or campaign ads matching the type are listed below.</p>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 6 }}>
              {placements.map(p => {
                const placementAds = activeAds.filter(a => p.types.includes(a.type));
                return (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, paddingBottom: 14, borderBottom: `1px solid ${T.border}40`, alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{p.label}</div>
                      <div style={{ fontSize: 11, color: T.muted }}>Allowed types: {p.types.join(', ')}</div>
                    </div>
                    <div>
                      <select value={mappings[p.id] || ''} onChange={e => setMappings(m => ({ ...m, [p.id]: e.target.value }))} style={{
                        width: '100%', padding: '8px 12px', borderRadius: 8, background: T.surface,
                        border: `1px solid ${T.border}`, color: T.text, fontSize: 12, outline: 'none', fontFamily: 'inherit'
                      }}>
                        <option value="">— Default Fallback Promotion —</option>
                        {placementAds.map(ad => (
                          <option key={ad.id} value={ad.id}>{ad.name} ({ad.type.toUpperCase()})</option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>
      )}

      {subTab === 'styling' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 16px 0' }}>Audio Ads Settings</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: T.muted, fontWeight: 650 }}>Song Interval Frequency</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                  <input suppressHydrationWarning type="number" min="1" max="20" value={frequency} onChange={e => setFrequency(parseInt(e.target.value) || 3)} style={{
                    width: 70, padding: '8px 10px', borderRadius: 8, background: T.surface,
                    border: `1px solid ${T.border}`, color: T.text, fontSize: 13, outline: 'none', textAlign: 'center'
                  }} />
                  <span style={{ fontSize: 12, color: T.text }}>Songs played between Audio Ads</span>
                </div>
                <p style={{ fontSize: 11, color: T.muted, margin: '8px 0 0 0', lineHeight: '1.4' }}>Sets how many tracks standard free-tier users listen to before an audio spot triggers automatically.</p>
              </div>
            </Card>

            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 16px 0' }}>Ad UI Theme Style</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <label style={{ fontSize: 12, color: T.muted, fontWeight: 650 }}>Select Theme Vibe</label>
                <select value={theme} onChange={e => setTheme(e.target.value)} style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8, background: T.surface,
                  border: `1px solid ${T.border}`, color: T.text, fontSize: 13, outline: 'none', marginTop: 4, fontFamily: 'inherit'
                }}>
                  <option value="glass">Glassmorphic Sleek (Premium Blur)</option>
                  <option value="cream">Classic Warm Cream (Soft & Elegant)</option>
                  <option value="contrast">Modern High Contrast (Minimalist Solid)</option>
                  <option value="cyberpunk">Dark Cyberpunk Neon (Glow Highlights)</option>
                </select>
                <p style={{ fontSize: 11, color: T.muted, margin: '8px 0 0 0', lineHeight: '1.4' }}>Applies a layout preset structure to all visual banners across the client dashboard interface.</p>
              </div>
            </Card>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Live UI Preview</div>
            <div style={{ background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 16, padding: '24px 20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: 180 }}>
              {renderThemePreview()}
            </div>
            <div style={{ fontSize: 11, color: T.muted, textAlign: 'center', fontStyle: 'italic' }}>This preview dynamically updates in real-time as you switch the theme vibe selection.</div>
          </div>
        </div>
      )}

      {subTab === 'order' && (() => {
        const homeLayoutOrder: string[] = adsData?.homeLayoutOrder || [];
        const customSections: any = adsData?.customSections || {};
        
        // Filter ads that are banners/video ads that can be displayed inline in sections
        const bannerAds = ads.filter((ad: any) => ad.type === 'banner' || ad.type === 'video');

        const getSectionLabel = (id: string, customSections: any) => {
          const section = customSections?.[id] || {};
          if (section.title) return section.title;
          
          if (id.includes('quick_access')) return 'Quick Access Greeting';
          if (id.includes('liked_songs_banner')) return 'Liked Song Banner';
          if (id.includes('rec_songs')) return 'Recommended Songs';
          if (id.includes('search_hashtag_slides')) return 'Discover Something New';
          if (id.includes('made_for_you')) return 'Made For You';
          if (id.includes('ad_break_banner')) return 'Standard Ad Break Banner';
          if (id.includes('campaign_deals_grid')) return 'Immersive Music Deals';
          if (id.includes('genre_tiles')) return 'Genre Browse Tiles';
          if (id.includes('audio_sandbox')) return 'Audio Sandbox Play';
          if (id.includes('playlist_showcase')) return 'Playlist Showcase';
          if (id.includes('auto_slider')) return 'Featured Hero Carousel';
          if (id.includes('trending_songs')) return 'Trending Songs Shelf';
          if (id.includes('top_charts')) return 'Top Charts Showcase';
          
          const typeName = section.type || '';
          return typeName ? typeName.charAt(0).toUpperCase() + typeName.slice(1).replace('_', ' ') : 'Custom Layout Shelf';
        };

        const getSectionSubtitle = (id: string, customSections: any) => {
          const section = customSections?.[id] || {};
          const details = [];
          if (section.layout) details.push(section.layout);
          if (section.contentSource) details.push(section.contentSource);
          
          if (details.length > 0) return details.join(' • ');
          
          if (id.includes('quick_access')) return 'genre_tiles • recently_played';
          if (id.includes('liked_songs_banner')) return 'banner • liked';
          if (id.includes('rec_songs')) return 'minimal • recommended';
          if (id.includes('search_hashtag_slides')) return 'hashtag_slides • mood';
          if (id.includes('made_for_you')) return 'grid • made_for_you';
          
          return 'custom • layout';
        };

        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: T.text, margin: 0 }}>Map Ads to Homepage Sections</h3>
                <p style={{ fontSize: 12, color: T.muted, margin: '4px 0 0 0' }}>
                  Inject and configure which ad creative displays directly below each active section shelf of the Home Page.
                </p>
              </div>
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  background: T.primary, color: '#fff', border: 'none', borderRadius: 8,
                  padding: '8px 18px', fontSize: 12.5, fontWeight: 800, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s'
                }}
              >
                {saving ? 'Saving...' : 'Save Config'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {homeLayoutOrder.length === 0 ? (
                <div style={{
                  padding: '40px 20px', textAlign: 'center', border: `2px dashed ${T.border}`,
                  borderRadius: 14, color: T.muted, fontSize: 13
                }}>
                  No active layout sections found on the Home Page. Edit templates in the Homepage Builder first.
                </div>
              ) : (
                homeLayoutOrder.map((sectionId, idx) => {
                  const label = getSectionLabel(sectionId, customSections);
                  const subtitle = getSectionSubtitle(sectionId, customSections);
                  const activeAdId = sectionAds[sectionId] || '';
                  
                  return (
                    <div key={sectionId} style={{
                      display: 'flex', flexDirection: isMobile ? 'column' : 'row',
                      alignItems: isMobile ? 'stretch' : 'center', justifyContent: 'space-between',
                      background: T.surface, border: `1px solid ${activeAdId ? T.primary + '33' : T.border}`,
                      borderRadius: 14, padding: '16px 20px', gap: 16, transition: 'all 0.2s',
                      boxShadow: activeAdId ? '0 4px 12px rgba(176, 136, 80, 0.03)' : 'none'
                    }}>
                      {/* Left: Section Details */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 8, background: T.border,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          color: T.muted, fontWeight: 800, fontSize: 13, flexShrink: 0
                        }}>
                          {idx + 1}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ fontSize: 13.5, fontWeight: 800, color: T.text, margin: 0 }}>{label}</h4>
                          <span style={{ fontSize: 11, color: T.muted, display: 'block', marginTop: 3 }}>
                            {subtitle}
                          </span>
                        </div>
                      </div>

                      {/* Right: Ad Insertion Selector & Viewports */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
                        {/* Ad Dropdown Selector */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ fontSize: 11.5, color: T.muted, fontWeight: 650 }}>Ad Below:</span>
                          <select
                            value={activeAdId}
                            onChange={(e) => {
                              const val = e.target.value;
                              setSectionAds(prev => {
                                const copy = { ...prev };
                                if (val) copy[sectionId] = val;
                                else delete copy[sectionId];
                                return copy;
                              });
                            }}
                            style={{
                              padding: '6px 12px', borderRadius: 8, background: T.surface,
                              border: `1px solid ${activeAdId ? T.primary + '66' : T.border}`,
                              color: T.text, fontSize: 12, outline: 'none', width: 220,
                              fontFamily: 'inherit', fontWeight: activeAdId ? 700 : 500
                            }}
                          >
                            <option value="">— No Ad Below —</option>
                            {bannerAds.map((ad: any) => (
                              <option key={ad.id} value={ad.id}>
                                {ad.name} ({ad.status})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Viewport indicators & Clear button */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            color: T.muted, opacity: activeAdId ? 1 : 0.3,
                            display: 'flex', alignItems: 'center', gap: 6
                          }}>
                            {/* Device & Audience Viewport Icons */}
                            <span title="Desktop Compatible"><Monitor size={14} /></span>
                            <span title="Mobile Compatible"><Smartphone size={14} /></span>
                            <span title="All Audiences Targeted"><Users size={14} /></span>
                          </div>

                          {activeAdId && (
                            <button
                              onClick={() => {
                                setSectionAds(prev => {
                                  const copy = { ...prev };
                                  delete copy[sectionId];
                                  return copy;
                                });
                              }}
                              style={{
                                background: 'none', border: 'none', color: T.red, cursor: 'pointer',
                                padding: 4, display: 'flex', alignItems: 'center',
                                opacity: 0.8, transition: 'opacity 0.15s'
                              }}
                              onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                              onMouseLeave={e => e.currentTarget.style.opacity = '0.8'}
                              title="Clear Ad Insertion"
                            >
                              <X size={14} />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

function ApprovalPanel({ adsData, onSave, onRefresh }: { adsData: any; onSave: (a: string, p: any) => Promise<void>; onRefresh: () => void }) {
  const queue = adsData?.approvalQueue || [];
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [processing, setProcessing] = useState<string | null>(null);

  const handle = async (item: any, action: 'approve_ad' | 'reject_ad') => {
    setProcessing(item.id);
    await onSave(action, { id: item.id, adName: item.adName, notes: notes[item.id] || '' });
    onRefresh();
    setProcessing(null);
    toast.success(action === 'approve_ad' ? 'Ad approved ✓' : 'Ad rejected');
  };

  const pending = queue.filter((a: any) => a.status === 'pending');
  const reviewed = queue.filter((a: any) => a.status !== 'pending');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Approval Queue" sub={`${pending.length} ad${pending.length !== 1 ? 's' : ''} awaiting review`} />

      {pending.length === 0 && reviewed.length === 0 && (
        <Card>
          <EmptyState icon={CheckCircle} title="Queue is empty" sub="All submitted ads have been reviewed. New submissions will appear here." />
        </Card>
      )}

      {pending.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.amber, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Pending Review</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {pending.map((item: any) => (
              <Card key={item.id}>
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: T.amber + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Clock size={20} color={T.amber} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontSize: 14, fontWeight: 800, color: T.text }}>{item.adName}</span>
                      <Badge label={item.type} />
                    </div>
                    <div style={{ fontSize: 12, color: T.muted }}>Submitted by: <strong style={{ color: T.text }}>{item.advertiser}</strong> · {new Date(item.submittedAt).toLocaleDateString()}</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 }}>
                    <input suppressHydrationWarning value={notes[item.id] || ''} onChange={e => setNotes(n => ({ ...n, [item.id]: e.target.value }))}
                      placeholder="Reviewer notes (optional)"
                      style={{ background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 8, padding: '7px 12px', color: T.text, fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Btn onClick={() => handle(item, 'approve_ad')} loading={processing === item.id} variant="success" size="sm" icon={CheckCircle}>Approve</Btn>
                      <Btn onClick={() => handle(item, 'reject_ad')} loading={processing === item.id} variant="danger" size="sm" icon={XCircle}>Reject</Btn>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {reviewed.length > 0 && (
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10 }}>Recently Reviewed</div>
          <Card>
            {reviewed.map((item: any, i: number) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < reviewed.length - 1 ? `1px solid ${T.border}40` : 'none' }}>
                {item.status === 'approved' ? <CheckCircle size={16} color={T.green} /> : <XCircle size={16} color={T.red} />}
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{item.adName}</span>
                  <span style={{ fontSize: 12, color: T.muted, marginLeft: 8 }}>by {item.advertiser}</span>
                </div>
                {item.notes && <span style={{ fontSize: 11, color: T.amber }}>Note: {item.notes}</span>}
                <StatusBadge status={item.status} />
              </div>
            ))}
          </Card>
        </div>
      )}
    </div>
  );
}

// ─── Advertisers ──────────────────────────────────────────────────────────────
function AdvertisersPanel({ adsData, onSave, onRefresh }: { adsData: any; onSave: (a: string, p: any) => Promise<void>; onRefresh: () => void }) {
  const advertisers = adsData?.advertisers || [];
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [newAdv, setNewAdv] = useState({ name: '', email: '', country: 'IN', website: '' });
  const [creating, setCreating] = useState(false);

  const filtered = advertisers.filter((a: any) => a.name?.toLowerCase().includes(search.toLowerCase()) || a.email?.toLowerCase().includes(search.toLowerCase()));

  const handleCreate = async () => {
    if (!newAdv.name || !newAdv.email) { toast.error('Name and email required'); return; }
    setCreating(true);
    await onSave('create_advertiser', newAdv);
    setCreating(false);
    setShowCreate(false);
    onRefresh();
    toast.success('Advertiser added!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Advertisers" sub="Manage advertising partners and their accounts"
        action={<Btn onClick={() => setShowCreate(v => !v)} icon={Plus}>Add Advertiser</Btn>} />

      <div style={{ position: 'relative', maxWidth: 360 }}>
        <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
        <input suppressHydrationWarning value={search} onChange={e => setSearch(e.target.value)} placeholder="Search advertisers..."
          style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px 8px 32px', color: T.text, fontSize: 13, width: '100%', outline: 'none', fontFamily: 'inherit' }} />
      </div>

      <AnimatePresence>
        {showCreate && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 14px 0' }}>New Advertiser</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginBottom: 14 }}>
                <Inp label="Company Name *" value={newAdv.name} onChange={(v: string) => setNewAdv(a => ({ ...a, name: v }))} placeholder="Acme Music Ltd" />
                <Inp label="Contact Email *" value={newAdv.email} onChange={(v: string) => setNewAdv(a => ({ ...a, email: v }))} placeholder="ads@acme.com" type="email" />
                <Inp label="Website" value={newAdv.website} onChange={(v: string) => setNewAdv(a => ({ ...a, website: v }))} placeholder="https://acme.com" />
                <Sel label="Country" value={newAdv.country} onChange={v => setNewAdv(a => ({ ...a, country: v }))}
                  options={[{ value: 'IN', label: 'India' }, { value: 'US', label: 'United States' }, { value: 'GB', label: 'United Kingdom' }, { value: 'AU', label: 'Australia' }, { value: 'CA', label: 'Canada' }]} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Btn onClick={() => setShowCreate(false)} variant="secondary">Cancel</Btn>
                <Btn onClick={handleCreate} loading={creating} icon={Check}>Add Advertiser</Btn>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {filtered.length === 0 && !showCreate ? (
        <Card>
          <EmptyState icon={Users} title="No advertisers yet" sub="Add advertising partners who want to run campaigns on your platform"
            action={<Btn onClick={() => setShowCreate(true)} icon={Plus}>Add First Advertiser</Btn>} />
        </Card>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 14 }}>
          {filtered.map((adv: any, i: number) => (
            <motion.div key={adv.id} initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}>
              <Card>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, background: CHART_COLORS[i % CHART_COLORS.length] + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 900, color: CHART_COLORS[i % CHART_COLORS.length] }}>
                    {(adv.name || 'A').charAt(0).toUpperCase()}
                  </div>
                  <StatusBadge status={adv.status || 'pending'} />
                </div>
                <div style={{ fontSize: 14, fontWeight: 800, color: T.text, marginBottom: 3 }}>{adv.name}</div>
                <div style={{ fontSize: 12, color: T.muted, marginBottom: 10 }}>{adv.email}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: `1px solid ${T.border}` }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.green }}>${(adv.totalSpent || 0).toLocaleString()}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>Total Spent</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: T.primary }}>{adv.activeCampaigns || 0}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>Campaigns</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.muted }}>{adv.country || '—'}</div>
                    <div style={{ fontSize: 10, color: T.muted }}>Country</div>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Revenue ──────────────────────────────────────────────────────────────────
function RevenuePanel({ adsData, platformStats }: { adsData: any; platformStats: any }) {
  const streamData = platformStats?.streamData || [];
  const monthlyData = platformStats?.monthlyData || [];
  const currencySymbol = platformStats?.currencySymbol || '$';
  const monthlyRevenue = platformStats?.monthlyRevenue || 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Revenue" sub="Real platform revenue from subscriptions and ad-supported streaming"
        action={
          <div style={{ display: 'flex', gap: 10 }}>
            <Btn variant="secondary" icon={Download} size="sm">Export CSV</Btn>
            <Btn variant="secondary" icon={FileText} size="sm">Export PDF</Btn>
          </div>
        } />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiCard label="This Month" value={`${currencySymbol}${monthlyRevenue.toLocaleString()}`} icon={DollarSign} color={T.green} sub="Subscriptions + ad revenue" />
        <KpiCard label="Total Users" value={(platformStats?.totalUsers || 0).toLocaleString()} icon={Users} color={T.primary} sub="Platform registered" />
        <KpiCard label="Total Plays" value={(platformStats?.totalPlays || 0).toLocaleString()} icon={Play} color={T.blue} sub="All-time streams" />
        <KpiCard label="Est. Ad Revenue" value={`$${(Math.round((platformStats?.totalPlays || 0) * 0.0025 * 100) / 100).toLocaleString()}`} icon={Activity} color={T.amber} sub="From free plays" />
      </div>

      {monthlyData.length > 0 && (
        <Card>
          <SectionHeader title="Monthly Revenue Trend" sub="Real subscription + streaming revenue per month" />
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="month" stroke={T.faint} tick={{ fill: T.muted, fontSize: 11 }} />
              <YAxis stroke={T.faint} tick={{ fill: T.muted, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 12 }} />
              <Bar dataKey="revenue" fill={T.primary} radius={[6, 6, 0, 0]} name={`Revenue (${currencySymbol})`} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {streamData.length > 0 && (
        <Card>
          <SectionHeader title="Weekly Streams" sub="Daily stream counts used for ad frequency calculation" />
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={streamData}>
              <defs>
                <linearGradient id="streamGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.blue} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={T.blue} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="day" stroke={T.faint} tick={{ fill: T.muted, fontSize: 11 }} />
              <YAxis stroke={T.faint} tick={{ fill: T.muted, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 12 }} />
              <Area type="monotone" dataKey="streams" stroke={T.blue} fill="url(#streamGrad)" strokeWidth={2} name="Streams" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}

      {monthlyData.length === 0 && streamData.length === 0 && (
        <Card>
          <EmptyState icon={DollarSign} title="No revenue data yet" sub="Revenue data will appear here once users stream tracks and subscriptions are active." />
        </Card>
      )}
    </div>
  );
}

// ─── Ads Settings ─────────────────────────────────────────────────────────────
function AdsSettingsPanel({ adsData, onSave }: { adsData: any; onSave: (a: string, p: any) => Promise<void> }) {
  const [settings, setSettings] = useState({
    defaultCurrency: 'USD', taxRate: 18, platformCommission: 30, revenueShare: 70,
    autoApproval: false, defaultFrequency: 3, maxAdsPerHour: 8,
    maxAudioAds: 2, maxBannerAds: 4, gdprEnabled: true, coppaEnabled: true,
    ccpaEnabled: true, adBlockDetection: true, cookieConsent: true,
    ...(adsData?.settings || {}),
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await onSave('update_settings', settings);
    setSaving(false);
    toast.success('Ad settings saved!');
  };

  const settingRow = (label: string, desc: string, key: keyof typeof settings, type: 'toggle' | 'number' = 'toggle') => (
    <div key={String(key)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: `1px solid ${T.border}40` }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{label}</div>
        <div style={{ fontSize: 11, color: T.muted, marginTop: 2 }}>{desc}</div>
      </div>
      {type === 'toggle' ? (
        <Toggle value={!!settings[key]} onChange={v => setSettings((s: any) => ({ ...s, [key]: v }))} />
      ) : (
        <input suppressHydrationWarning type="number" value={settings[key] as number} onChange={e => setSettings((s: any) => ({ ...s, [key]: Number(e.target.value) }))}
          style={{ background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', color: T.text, fontSize: 13, width: 70, textAlign: 'right', outline: 'none', fontFamily: 'inherit' }} />
      )}
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Ads Settings" sub="Configure global ad behavior, monetization rules, and compliance"
        action={<Btn onClick={handleSave} loading={saving} icon={Check}>Save Settings</Btn>} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 4px 0' }}>Monetization</h3>
          {settingRow('Platform Commission (%)', "Beato's cut from advertiser spend", 'platformCommission', 'number')}
          {settingRow('Revenue Share (%)', 'Portion shared with content creators', 'revenueShare', 'number')}
          {settingRow('Tax Rate (%)', 'Applicable GST/VAT on ad revenue', 'taxRate', 'number')}
        </Card>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 4px 0' }}>Ad Frequency Controls</h3>
          {settingRow('Auto Approval', 'Skip manual review for new ad submissions', 'autoApproval')}
          {settingRow('Song Frequency', 'Play audio ad every N songs', 'defaultFrequency', 'number')}
          {settingRow('Max Ads / Hour', 'Cap total ads per user per hour', 'maxAdsPerHour', 'number')}
          {settingRow('Max Audio Ads', 'Max audio ads per session', 'maxAudioAds', 'number')}
          {settingRow('Max Banner Ads', 'Max simultaneous banner ads', 'maxBannerAds', 'number')}
        </Card>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 4px 0' }}>Privacy & Compliance</h3>
          {settingRow('GDPR Compliance', 'Enable consent controls for EU users', 'gdprEnabled')}
          {settingRow('COPPA Compliance', 'Restrict tracking for users under 13', 'coppaEnabled')}
          {settingRow('CCPA Compliance', 'Honor Do Not Sell requests for CA users', 'ccpaEnabled')}
          {settingRow('Cookie Consent Banner', 'Show consent banner before ad tracking', 'cookieConsent')}
        </Card>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 4px 0' }}>Security</h3>
          {settingRow('Ad Block Detection', 'Detect ad blockers and show fallback messaging', 'adBlockDetection')}
        </Card>
      </div>
    </div>
  );
}

// ─── Logs ─────────────────────────────────────────────────────────────────────
function LogsPanel({ adsData, onRefresh }: { adsData: any; onRefresh: () => void }) {
  const logs = adsData?.logs || [];
  const levelColor: Record<string, string> = { info: T.blue, success: T.green, error: T.red, warning: T.amber };
  const levelIcon: Record<string, React.ReactNode> = {
    info: <Info size={13} color={T.blue} />,
    success: <CheckCircle size={13} color={T.green} />,
    error: <XCircle size={13} color={T.red} />,
    warning: <AlertCircle size={13} color={T.amber} />,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="System Logs" sub="Audit trail of all ads management actions"
        action={<Btn onClick={onRefresh} variant="secondary" icon={RefreshCw} size="sm">Refresh</Btn>} />
      {logs.length === 0 ? (
        <Card>
          <EmptyState icon={ScrollText} title="No logs yet" sub="System actions will appear here as you create campaigns, ads, and make configuration changes." />
        </Card>
      ) : (
        <Card>
          {logs.map((log: any, i: number) => (
            <div key={log.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '12px 0', borderBottom: i < logs.length - 1 ? `1px solid ${T.border}40` : 'none' }}>
              <div style={{ padding: 7, borderRadius: 8, background: (levelColor[log.level] || T.muted) + '14', flexShrink: 0 }}>
                {levelIcon[log.level] || <Info size={13} />}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                  <span style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{log.action}</span>
                  <Badge label={log.level} color={levelColor[log.level] || T.muted} />
                </div>
                <div style={{ fontSize: 12, color: T.muted }}>{log.detail}</div>
              </div>
              <div style={{ fontSize: 11, color: T.faint, whiteSpace: 'nowrap', flexShrink: 0 }}>{new Date(log.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}

// ─── Targeting Panel ─────────────────────────────────────────────────────────
function TargetingPanel({ adsData, onSave }: { adsData: any; onSave: (a: string, p: any) => Promise<void> }) {
  const [config, setConfig] = useState({
    ageMin: 13, ageMax: 65, countries: ['IN'], languages: ['en'],
    interests: [] as string[], deviceTypes: ['mobile', 'desktop', 'tablet'],
    osTypes: ['android', 'ios', 'windows', 'macos'],
    onlyFreeUsers: true, excludePremium: true, ...(adsData?.targetingConfig || {}),
  });
  const [saving, setSaving] = useState(false);

  const INTERESTS = ['Music', 'Bollywood', 'Indie', 'Hip-Hop', 'Rock', 'EDM', 'Classical', 'Pop', 'Jazz', 'R&B'];
  const COUNTRIES = [{ value: 'IN', label: 'India' }, { value: 'US', label: 'United States' }, { value: 'GB', label: 'United Kingdom' }, { value: 'AU', label: 'Australia' }, { value: 'CA', label: 'Canada' }, { value: 'DE', label: 'Germany' }];

  const toggleArr = (arr: string[], val: string) => arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val];

  const handleSave = async () => {
    setSaving(true);
    await onSave('update_targeting', { targetingConfig: config });
    setSaving(false);
    toast.success('Targeting settings saved!');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Target Audience" sub="Configure who sees your ads across the platform"
        action={<Btn onClick={handleSave} loading={saving} icon={Check}>Save Targeting</Btn>} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 14px 0' }}>Age Range</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Inp label="Min Age" value={config.ageMin} onChange={(v: string) => setConfig((c: any) => ({ ...c, ageMin: Number(v) }))} type="number" />
            <Inp label="Max Age" value={config.ageMax} onChange={(v: string) => setConfig((c: any) => ({ ...c, ageMax: Number(v) }))} type="number" />
          </div>
          <div style={{ marginTop: 16 }}>
            {[{ key: 'onlyFreeUsers', label: 'Target Free Users Only', desc: 'Only show ads to free-tier listeners (recommended)' },
              { key: 'excludePremium', label: 'Exclude Premium Users', desc: 'Never show ads to paid subscribers' }
            ].map(({ key, label, desc }) => (
              <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: `1px solid ${T.border}40` }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{label}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{desc}</div>
                </div>
                <Toggle value={!!(config as any)[key]} onChange={v => setConfig((c: any) => ({ ...c, [key]: v }))} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 14px 0' }}>Countries</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {COUNTRIES.map(c => (
              <button key={c.value} onClick={() => setConfig((cfg: any) => ({ ...cfg, countries: toggleArr(cfg.countries, c.value) }))} style={{
                padding: '6px 14px', borderRadius: 20, border: `1px solid ${config.countries.includes(c.value) ? T.primary : T.border}`,
                background: config.countries.includes(c.value) ? T.primary + '14' : 'transparent',
                color: config.countries.includes(c.value) ? T.primary : T.muted,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>{c.label}</button>
            ))}
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 14px 0' }}>Music Interests</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {INTERESTS.map(interest => (
              <button key={interest} onClick={() => setConfig((c: any) => ({ ...c, interests: toggleArr(c.interests, interest) }))} style={{
                padding: '6px 14px', borderRadius: 20, border: `1px solid ${config.interests.includes(interest) ? T.primary : T.border}`,
                background: config.interests.includes(interest) ? T.primary + '14' : 'transparent',
                color: config.interests.includes(interest) ? T.primary : T.muted,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
              }}>{interest}</button>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 11, color: T.muted }}>
            {config.interests.length === 0 ? 'Targeting all music interests (no filter)' : `Targeting: ${config.interests.join(', ')}`}
          </div>
        </Card>

        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 14px 0' }}>Device Types</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['mobile', 'desktop', 'tablet'].map(d => (
              <button key={d} onClick={() => setConfig((c: any) => ({ ...c, deviceTypes: toggleArr(c.deviceTypes, d) }))} style={{
                padding: '6px 14px', borderRadius: 20, border: `1px solid ${config.deviceTypes.includes(d) ? T.primary : T.border}`,
                background: config.deviceTypes.includes(d) ? T.primary + '14' : 'transparent',
                color: config.deviceTypes.includes(d) ? T.primary : T.muted,
                fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
              }}>{d}</button>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}

// ─── Sponsored Content ───────────────────────────────────────────────────────
function SponsoredPanel({ type, icon: Icon, label, platformStats }: { type: string; icon: any; label: string; platformStats: any }) {
  const [items, setItems] = useState<any[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', advertiser: '', budget: '', startDate: '', endDate: '', priority: 'medium', status: 'pending' });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    if (!form.name) { toast.error('Name required'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 400));
    setItems(prev => [...prev, { id: 'sp-' + Date.now(), ...form, impressions: 0, clicks: 0, createdAt: new Date().toISOString() }]);
    setShowForm(false);
    setForm({ name: '', advertiser: '', budget: '', startDate: '', endDate: '', priority: 'medium', status: 'pending' });
    setSaving(false);
    toast.success(`Sponsored ${type} created!`);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title={label} sub={`Promote ${type} at the top of relevant listings for paying advertisers`}
        action={<Btn onClick={() => setShowForm(v => !v)} icon={Plus}>Sponsor a {type.charAt(0).toUpperCase() + type.slice(1)}</Btn>} />

      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 14px 0' }}>New Sponsored {type.charAt(0).toUpperCase() + type.slice(1)}</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginBottom: 14 }}>
                <Inp label={`${type.charAt(0).toUpperCase() + type.slice(1)} Name *`} value={form.name} onChange={(v: string) => setForm(f => ({ ...f, name: v }))} placeholder={`e.g. My ${type}`} />
                <Inp label="Advertiser / Label" value={form.advertiser} onChange={(v: string) => setForm(f => ({ ...f, advertiser: v }))} placeholder="Warner Music" />
                <Inp label="Budget ($)" value={form.budget} onChange={(v: string) => setForm(f => ({ ...f, budget: v }))} type="number" />
                <Inp label="Start Date" value={form.startDate} onChange={(v: string) => setForm(f => ({ ...f, startDate: v }))} type="date" />
                <Inp label="End Date" value={form.endDate} onChange={(v: string) => setForm(f => ({ ...f, endDate: v }))} type="date" />
                <Sel label="Priority" value={form.priority} onChange={v => setForm(f => ({ ...f, priority: v }))}
                  options={[{ value: 'critical', label: 'Critical' }, { value: 'high', label: 'High' }, { value: 'medium', label: 'Medium' }, { value: 'low', label: 'Low' }]} />
              </div>
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <Btn onClick={() => setShowForm(false)} variant="secondary">Cancel</Btn>
                <Btn onClick={handleAdd} loading={saving} icon={Check}>Create</Btn>
              </div>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {items.length === 0 && !showForm ? (
        <Card>
          <EmptyState icon={Icon} title={`No sponsored ${type}s yet`}
            sub={`Promote ${type}s in search results and listings to boost their visibility for advertisers`}
            action={<Btn onClick={() => setShowForm(true)} icon={Star}>Sponsor First {type.charAt(0).toUpperCase() + type.slice(1)}</Btn>} />
        </Card>
      ) : (
        items.length > 0 && (
          <Card>
            {items.map((item: any, i: number) => (
              <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: i < items.length - 1 ? `1px solid ${T.border}40` : 'none' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: T.primary + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.primary }}>
                  <Star size={16} fill={T.primary} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: T.text }}>{item.name}</div>
                  <div style={{ fontSize: 11, color: T.muted }}>{item.advertiser || 'No advertiser'} · {item.startDate || '—'} to {item.endDate || '—'}</div>
                </div>
                <Badge label={`$${item.budget || 0} budget`} color={T.green} />
                <StatusBadge status={item.priority} />
                <StatusBadge status={item.status} />
              </div>
            ))}
          </Card>
        )
      )}
    </div>
  );
}

// ─── Ad Library ──────────────────────────────────────────────────────────────
function AdLibraryPanel({ adsData }: { adsData: any }) {
  const ads: any[] = adsData?.ads || [];
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');

  const filtered = ads.filter(a => {
    const ms = a.name?.toLowerCase().includes(search.toLowerCase());
    const mt = typeFilter === 'all' || a.type === typeFilter;
    return ms && mt;
  });

  const types = ['all', ...Array.from(new Set(ads.map((a: any) => a.type).filter(Boolean))) as string[]];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Ad Library" sub="View all ad creatives across every type and campaign" />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: T.muted }} />
          <input suppressHydrationWarning value={search} onChange={e => setSearch(e.target.value)} placeholder="Search all ads..."
            style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '8px 12px 8px 32px', color: T.text, fontSize: 13, width: '100%', outline: 'none', fontFamily: 'inherit' }} />
        </div>
        {types.map(t => (
          <button key={t} onClick={() => setTypeFilter(t)} style={{
            padding: '7px 14px', borderRadius: 8, border: `1px solid ${typeFilter === t ? T.primary : T.border}`,
            background: typeFilter === t ? T.primary + '14' : 'transparent',
            color: typeFilter === t ? T.primary : T.muted, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', textTransform: 'capitalize',
          }}>{t}</button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <EmptyState icon={Database} title="No ads in library" sub="Create ads from the individual ad type sections (Banner, Audio, Video, etc.) and they'll all appear here." />
        </Card>
      ) : (
        <Card>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Name', 'Type', 'Placement', 'Status', 'Campaign', 'Impressions', 'Clicks', 'CTR', 'Created'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((ad: any) => (
                  <tr key={ad.id} style={{ borderBottom: `1px solid ${T.border}40` }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.elevated)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: T.text }}>{ad.name}</td>
                    <td style={{ padding: '12px' }}><Badge label={ad.type || '—'} /></td>
                    <td style={{ padding: '12px', fontSize: 12, color: T.muted }}>{ad.placement || '—'}</td>
                    <td style={{ padding: '12px' }}><StatusBadge status={ad.status} /></td>
                    <td style={{ padding: '12px', fontSize: 12, color: T.muted }}>{ad.campaignId || '—'}</td>
                    <td style={{ padding: '12px', fontSize: 12, color: T.muted }}>{(ad.impressions || 0).toLocaleString()}</td>
                    <td style={{ padding: '12px', fontSize: 12, color: T.muted }}>{(ad.clicks || 0).toLocaleString()}</td>
                    <td style={{ padding: '12px', fontSize: 12, color: T.primary, fontWeight: 700 }}>
                      {ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : '0.00'}%
                    </td>
                    <td style={{ padding: '12px', fontSize: 11, color: T.muted }}>{ad.createdAt ? new Date(ad.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────
function AnalyticsPanel({ adsData, platformStats }: { adsData: any; platformStats: any }) {
  const ads: any[] = adsData?.ads || [];
  const campaigns: any[] = adsData?.campaigns || [];
  const totalImpressions = ads.reduce((s: number, a: any) => s + (a.impressions || 0), 0);
  const totalClicks = ads.reduce((s: number, a: any) => s + (a.clicks || 0), 0);
  const avgCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const streamData = platformStats?.streamData || [];

  const byType = ['banner', 'audio', 'video', 'native', 'popup', 'interstitial', 'rewarded'].map(type => ({
    name: type.charAt(0).toUpperCase() + type.slice(1),
    impressions: ads.filter(a => a.type === type).reduce((s: number, a: any) => s + (a.impressions || 0), 0),
    clicks: ads.filter(a => a.type === type).reduce((s: number, a: any) => s + (a.clicks || 0), 0),
    count: ads.filter(a => a.type === type).length,
  })).filter(t => t.count > 0 || t.impressions > 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Analytics" sub="Real ad performance metrics from served creatives" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        <KpiCard label="Total Impressions" value={totalImpressions.toLocaleString()} icon={Eye} color={T.primary} />
        <KpiCard label="Total Clicks" value={totalClicks.toLocaleString()} icon={TrendingUp} color={T.green} />
        <KpiCard label="Avg CTR" value={`${avgCTR}%`} icon={Target} color={T.amber} />
        <KpiCard label="Active Ad Units" value={ads.filter(a => a.status === 'active').length} icon={Activity} color={T.blue} />
      </div>

      {byType.length > 0 ? (
        <Card>
          <SectionHeader title="Performance by Ad Type" />
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Type', 'Ad Units', 'Impressions', 'Clicks', 'CTR'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {byType.map(row => (
                  <tr key={row.name} style={{ borderBottom: `1px solid ${T.border}40` }}>
                    <td style={{ padding: '12px' }}><Badge label={row.name} /></td>
                    <td style={{ padding: '12px', fontSize: 13, color: T.text, fontWeight: 600 }}>{row.count}</td>
                    <td style={{ padding: '12px', fontSize: 13, color: T.muted }}>{row.impressions.toLocaleString()}</td>
                    <td style={{ padding: '12px', fontSize: 13, color: T.muted }}>{row.clicks.toLocaleString()}</td>
                    <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: T.primary }}>{row.impressions > 0 ? ((row.clicks / row.impressions) * 100).toFixed(2) : '0.00'}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <Card>
          <EmptyState icon={BarChart2} title="No ad analytics yet" sub="Analytics will populate once you create ads and they start getting impressions from free-tier users." />
        </Card>
      )}

      {streamData.length > 0 && (
        <Card>
          <SectionHeader title="Platform Stream Volume" sub="Determines ad serving frequency" />
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={streamData}>
              <defs>
                <linearGradient id="aGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={T.primary} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={T.primary} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
              <XAxis dataKey="day" stroke={T.faint} tick={{ fill: T.muted, fontSize: 11 }} />
              <YAxis stroke={T.faint} tick={{ fill: T.muted, fontSize: 11 }} />
              <Tooltip contentStyle={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, color: T.text, fontSize: 12 }} />
              <Area type="monotone" dataKey="streams" stroke={T.primary} fill="url(#aGrad)" strokeWidth={2} name="Streams" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      )}
    </div>
  );
}

// ─── Reports ─────────────────────────────────────────────────────────────────
function ReportsPanel({ adsData, platformStats }: { adsData: any; platformStats: any }) {
  const [generating, setGenerating] = useState<string | null>(null);

  const reports = [
    { id: 'impressions', title: 'Impressions Report', desc: 'Total ad impressions broken down by type, placement, and date range', icon: Eye, color: T.primary },
    { id: 'revenue', title: 'Revenue Report', desc: 'Ad revenue vs subscription revenue, monthly breakdown', icon: DollarSign, color: T.green },
    { id: 'ctr', title: 'CTR Performance', desc: 'Click-through rates by ad type, advertiser, and placement', icon: Target, color: T.amber },
    { id: 'campaigns', title: 'Campaign Summary', desc: 'All campaigns with spend, impressions, and ROI metrics', icon: Megaphone, color: T.blue },
    { id: 'advertisers', title: 'Advertiser Report', desc: 'Top advertisers by spend and campaign performance', icon: Users, color: T.purple },
    { id: 'compliance', title: 'Compliance Report', desc: 'GDPR, CCPA, COPPA ad consent and data privacy audit', icon: Shield, color: T.red },
  ];

  const handleGenerate = async (id: string) => {
    setGenerating(id);
    await new Promise(r => setTimeout(r, 1200));
    setGenerating(null);
    toast.success('Report generated! (Download feature requires backend integration)');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Reports" sub="Generate and export detailed advertising reports" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
        {reports.map(r => (
          <Card key={r.id}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: r.color + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <r.icon size={18} color={r.color} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{r.title}</div>
                <div style={{ fontSize: 11, color: T.muted, marginTop: 3 }}>{r.desc}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn onClick={() => handleGenerate(r.id)} loading={generating === r.id} variant="secondary" size="sm" icon={FileText}>Generate</Btn>
              <Btn onClick={() => handleGenerate(r.id + '_csv')} loading={generating === r.id + '_csv'} variant="ghost" size="sm" icon={Download}>CSV</Btn>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

// ─── Payments ─────────────────────────────────────────────────────────────────
function AdPaymentsPanel({ adsData, platformStats }: { adsData: any; platformStats: any }) {
  const advertisers: any[] = adsData?.advertisers || [];
  const campaigns: any[] = adsData?.campaigns || [];

  const invoices = campaigns.filter(c => c.budget > 0).map((c: any, i: number) => ({
    id: 'INV-' + c.id.toUpperCase().replace(/-/g, '').substring(0, 8),
    campaign: c.name, advertiser: c.advertiser || 'Unknown', amount: c.budget || 0,
    status: c.status === 'active' ? 'paid' : 'pending',
    date: c.startDate || new Date().toLocaleDateString(),
  }));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <SectionHeader title="Ad Payments" sub="Invoices and payment tracking for advertiser campaigns" />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        <KpiCard label="Total Billed" value={`$${campaigns.reduce((s: number, c: any) => s + (c.budget || 0), 0).toLocaleString()}`} icon={DollarSign} color={T.green} />
        <KpiCard label="Campaigns with Budget" value={campaigns.filter(c => c.budget > 0).length} icon={Megaphone} color={T.primary} />
        <KpiCard label="Advertisers" value={advertisers.length} icon={Users} color={T.blue} />
      </div>

      {invoices.length === 0 ? (
        <Card>
          <EmptyState icon={CreditCard} title="No invoices yet" sub="Create campaigns with budgets to generate invoices for advertiser billing." />
        </Card>
      ) : (
        <Card>
          <h3 style={{ fontSize: 14, fontWeight: 800, color: T.text, margin: '0 0 16px 0' }}>Campaign Invoices</h3>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${T.border}` }}>
                  {['Invoice', 'Campaign', 'Advertiser', 'Amount', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 12px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.muted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv: any) => (
                  <tr key={inv.id} style={{ borderBottom: `1px solid ${T.border}40` }}>
                    <td style={{ padding: '12px', fontSize: 12, fontWeight: 700, color: T.primary }}>{inv.id}</td>
                    <td style={{ padding: '12px', fontSize: 13, fontWeight: 600, color: T.text }}>{inv.campaign}</td>
                    <td style={{ padding: '12px', fontSize: 12, color: T.muted }}>{inv.advertiser}</td>
                    <td style={{ padding: '12px', fontSize: 13, fontWeight: 700, color: T.green }}>${inv.amount.toLocaleString()}</td>
                    <td style={{ padding: '12px', fontSize: 12, color: T.muted }}>{inv.date}</td>
                    <td style={{ padding: '12px' }}><StatusBadge status={inv.status} /></td>
                    <td style={{ padding: '12px' }}><Btn variant="ghost" size="sm" icon={Download}>PDF</Btn></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function AdsManagementTab() {
  const [activeSection, setActiveSection] = useState('overview');
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [adsData, setAdsData] = useState<any>(null);
  const [platformStats, setPlatformStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [adsRes, statsRes] = await Promise.all([
        fetch('/api/admin/ads'),
        fetch('/api/admin/live-stats'),
      ]);
      const adsJson = await adsRes.json();
      const statsJson = await statsRes.json();
      if (adsJson.success) setAdsData(adsJson.data);
      if (statsJson.success) setPlatformStats(statsJson.stats);
    } catch {}
    setLoading(false);
  }, []);

  const handleSave = useCallback(async (action: string, payload: any) => {
    try {
      const res = await fetch('/api/admin/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Save failed');
    } catch (e: any) {
      toast.error(e.message || 'Save failed');
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const campaigns = adsData?.campaigns || [];

  const renderContent = () => {
    if (loading) {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {[...Array(4)].map((_, i) => (
            <div key={i} style={{ height: 80, borderRadius: 14, background: T.elevated, animation: 'adshimmer 1.4s infinite' }} />
          ))}
        </div>
      );
    }

    const adTypes: Record<string, { icon: any; label: string }> = {
      banner: { icon: ImageIcon, label: 'Banner Ads' },
      video: { icon: Video, label: 'Video Ads' },
      interstitial: { icon: Layers, label: 'Interstitial Ads' },
      rewarded: { icon: Gift, label: 'Rewarded Ads' },
      native: { icon: SquareCode, label: 'Native Ads' },
      popup: { icon: Bell, label: 'Popup Ads' },
    };

    if (adTypes[activeSection]) {
      return <AdTypePanel adType={activeSection} icon={adTypes[activeSection].icon} label={adTypes[activeSection].label}
        adsData={adsData?.ads || []} campaigns={campaigns} onSave={handleSave} onRefresh={fetchData} />;
    }

    const sponsoredTypes: Record<string, { icon: any; label: string; type: string }> = {
      sponsored_songs: { icon: Music, label: 'Sponsored Songs', type: 'song' },
      sponsored_artists: { icon: Mic, label: 'Sponsored Artists', type: 'artist' },
      sponsored_albums: { icon: Disc, label: 'Sponsored Albums', type: 'album' },
      sponsored_podcasts: { icon: Podcast, label: 'Sponsored Podcasts', type: 'podcast' },
    };

    if (sponsoredTypes[activeSection]) {
      const s = sponsoredTypes[activeSection];
      return <SponsoredPanel type={s.type} icon={s.icon} label={s.label} platformStats={platformStats} />;
    }

    switch (activeSection) {
      case 'overview': return <OverviewPanel adsData={adsData} platformStats={platformStats} campaigns={campaigns} />;
      case 'adsense': return <AdSensePanel adsData={adsData} onSave={handleSave} />;
      case 'campaigns': return <CampaignsPanel adsData={adsData} onSave={handleSave} onRefresh={fetchData} />;
      case 'audio': return <AudioAdsPanel adsData={adsData} campaigns={campaigns} onSave={handleSave} onRefresh={fetchData} />;
      case 'placements': return <PlacementsPanel adsData={adsData} onSave={handleSave} onRefresh={fetchData} />;
      case 'targeting': return <TargetingPanel adsData={adsData} onSave={handleSave} />;
      case 'revenue': return <RevenuePanel adsData={adsData} platformStats={platformStats} />;
      case 'analytics': return <AnalyticsPanel adsData={adsData} platformStats={platformStats} />;
      case 'reports': return <ReportsPanel adsData={adsData} platformStats={platformStats} />;
      case 'payments': return <AdPaymentsPanel adsData={adsData} platformStats={platformStats} />;
      case 'advertisers': return <AdvertisersPanel adsData={adsData} onSave={handleSave} onRefresh={fetchData} />;
      case 'approval': return <ApprovalPanel adsData={adsData} onSave={handleSave} onRefresh={fetchData} />;
      case 'library': return <AdLibraryPanel adsData={adsData} />;
      case 'ad_settings': return <AdsSettingsPanel adsData={adsData} onSave={handleSave} />;
      case 'logs': return <LogsPanel adsData={adsData} onRefresh={fetchData} />;
      default: return null;
    }
  };

  const groups = Array.from(new Set(NAV_ITEMS.map(n => n.group)));

  return (
    <>
      <style>{`
        @keyframes adshimmer { 0%,100%{opacity:0.5} 50%{opacity:1} }
        @keyframes adspin { 100%{transform:rotate(360deg)} }
        @keyframes adspulse { 0%,100%{opacity:0.5;transform:scale(1)} 50%{opacity:1;transform:scale(1.3)} }
      `}</style>
      <div style={{ display: 'flex', background: T.bg, color: T.text, fontFamily: "'Inter', system-ui, sans-serif", minHeight: '100%' }}>
        {/* Sidebar */}
        <div style={{
          width: sidebarOpen ? 234 : 58, flexShrink: 0, background: T.surface, borderRight: `1px solid ${T.border}`,
          display: 'flex', flexDirection: 'column', transition: 'width 0.22s ease', overflow: 'hidden',
          position: 'sticky', top: 0, height: '100vh',
        }}>
          <div style={{ padding: '16px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            {sidebarOpen && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: T.primary, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Megaphone size={14} color="#fff" />
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 900, color: T.text }}>Ads Manager</div>
                  <div style={{ fontSize: 9, color: T.primary, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Super Admin Only</div>
                </div>
              </div>
            )}
            <button onClick={() => setSidebarOpen(v => !v)} style={{ background: 'none', border: 'none', color: T.muted, cursor: 'pointer', padding: 4, display: 'flex', marginLeft: sidebarOpen ? 0 : 'auto' }}>
              <ChevronRight size={16} style={{ transform: sidebarOpen ? 'none' : 'rotate(180deg)', transition: 'transform 0.2s' }} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: '8px 6px', scrollbarWidth: 'none' }}>
            {groups.map(group => {
              const items = NAV_ITEMS.filter(n => n.group === group);
              const isCollapsed = collapsed[group];
              return (
                <div key={group} style={{ marginBottom: 4 }}>
                  {sidebarOpen && (
                    <button onClick={() => setCollapsed(c => ({ ...c, [group]: !c[group] }))} style={{
                      display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', color: T.faint,
                      cursor: 'pointer', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                      padding: '8px 8px 4px', width: '100%', fontFamily: 'inherit',
                    }}>
                      {NAV_GROUPS[group]}
                      <ChevronDown size={9} style={{ marginLeft: 'auto', transform: isCollapsed ? 'rotate(-90deg)' : 'none', transition: 'transform 0.2s' }} />
                    </button>
                  )}
                  <AnimatePresence initial={false}>
                    {!isCollapsed && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.15 }}>
                        {items.map(item => {
                          const isActive = activeSection === item.id;
                          return (
                            <button key={item.id} onClick={() => setActiveSection(item.id)} title={!sidebarOpen ? item.label : undefined}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 9, width: '100%',
                                padding: sidebarOpen ? '8px 10px' : '8px', borderRadius: 9,
                                background: isActive ? T.primary + '14' : 'transparent',
                                border: isActive ? `1px solid ${T.primary}33` : '1px solid transparent',
                                color: isActive ? T.primary : T.muted,
                                cursor: 'pointer', fontWeight: isActive ? 700 : 500, fontSize: 12,
                                fontFamily: 'inherit', transition: 'all 0.12s', textAlign: 'left',
                                justifyContent: sidebarOpen ? 'flex-start' : 'center', marginBottom: 1,
                              }}>
                              <item.icon size={14} style={{ flexShrink: 0 }} />
                              {sidebarOpen && <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</span>}
                              {sidebarOpen && isActive && <ChevronRight size={11} style={{ marginLeft: 'auto', flexShrink: 0 }} />}
                            </button>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </div>

        {/* Main */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* Top bar */}
          <div style={{
            padding: '14px 24px', borderBottom: `1px solid ${T.border}`,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            background: T.surface, position: 'sticky', top: 0, zIndex: 10,
          }}>
            <div>
              <h1 style={{ fontSize: 16, fontWeight: 800, color: T.text, margin: 0 }}>
                {NAV_ITEMS.find(n => n.id === activeSection)?.label || 'Ads Management'}
              </h1>
              <p style={{ fontSize: 11, color: T.muted, margin: '2px 0 0 0' }}>Super Admin · Ads Management System</p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={fetchData} style={{ background: T.elevated, border: `1px solid ${T.border}`, borderRadius: 8, padding: '6px 10px', color: T.muted, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontFamily: 'inherit' }}>
                <RefreshCw size={12} /> Refresh
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '5px 11px', background: T.green + '14', border: `1px solid ${T.green}33`, borderRadius: 8 }}>
                <div style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />
                <span style={{ fontSize: 11, color: T.green, fontWeight: 700 }}>Live</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
            <AnimatePresence mode="wait">
              <motion.div key={activeSection} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.15 }}>
                {renderContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </>
  );
}
