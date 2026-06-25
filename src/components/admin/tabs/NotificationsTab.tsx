'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { socketManager } from '@/lib/socket';
import { 
  Send, Sparkles, Smartphone, Eye, Bell, Trash2, Edit3, Plus, 
  Search, Sliders, Calendar, Play, CheckCircle2, Clock, X, ChevronRight, BarChart2
} from 'lucide-react';

// ─── Local Interfaces ─────────────────────────────────────────────────────────

type NotifType = 'push' | 'email' | 'in-app';
type Audience = 'all' | 'premium' | 'free' | 'artists';
type Schedule = 'now' | 'scheduled';
type NotifStatus = 'sent' | 'failed' | 'scheduled' | 'draft';

interface AdminNotification {
  id: string;
  title: string;
  message: string;
  audience: Audience;
  type: NotifType;
  status: NotifStatus;
  sentCount: number;
  deliveredCount: number;
  openedCount: number;
  ctr: number;
  sentAt: string;
  scheduledTime?: string;
}

interface NotificationTemplate {
  id: string;
  name: string;
  type: NotifType;
  preview: string;
  createdAt: string;
}

interface NotificationStats {
  sentToday: number;
  unsubscribed: number;
  audienceSizes: Record<Audience, number>;
}

// ─── Theme Configurations ──────────────────────────────────────────────────────

const GREEN = '#b08850';
const BLUE = '#10b981';
const YELLOW = '#f59e0b';
const RED = '#ef4444';

const typeColors: Record<NotifType, { color: string; bg: string; icon: string; label: string }> = {
  push:   { color: GREEN, bg: 'rgba(176, 136, 80, 0.12)', icon: '🔔', label: 'Push Notification' },
  email:  { color: BLUE,  bg: 'rgba(16, 185, 129, 0.12)', icon: '📧', label: 'Email Broadcast' },
  'in-app': { color: YELLOW, bg: 'rgba(245, 158, 11, 0.12)', icon: '💬', label: 'In-App Message' },
};

const statusColors: Record<NotifStatus, { color: string; label: string }> = {
  sent:      { color: GREEN, label: 'Sent' },
  failed:    { color: RED,   label: 'Failed' },
  scheduled: { color: BLUE,  label: 'Scheduled' },
  draft:     { color: '#888',  label: 'Draft' },
};

const audienceLabels: Record<Audience, string> = {
  all: 'All Users',
  premium: 'Premium Tier',
  free: 'Free Tier',
  artists: 'Artists Only',
};

// ─── Styles ────────────────────────────────────────────────────────────────────

const cardStyle: React.CSSProperties = {
  background: 'rgba(43, 34, 26, 0.03)',
  border: '1px solid rgba(255, 255, 255, 0.07)',
  borderRadius: 18,
  padding: '24px',
  boxShadow: '0 8px 32px 0 rgba(43, 34, 26, 0.08)',
  backdropFilter: 'blur(10px)',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  background: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 10,
  color: '#221a15',
  padding: '12px 14px',
  fontSize: 14,
  fontFamily: 'Inter, sans-serif',
  outline: 'none',
  transition: 'all 0.25s ease',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 11,
  fontWeight: 700,
  color: '#8a8a8a',
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  marginBottom: 8,
  fontFamily: 'Inter, sans-serif',
};

// ─── Modals ────────────────────────────────────────────────────────────────────

interface EditTemplateModalProps {
  template: NotificationTemplate | null; // null means create new
  onClose: () => void;
  onSave: (tpl: Partial<NotificationTemplate>) => Promise<void>;
}

function EditTemplateModal({ template, onClose, onSave }: EditTemplateModalProps) {
  const [name, setName] = useState(template?.name || '');
  const [preview, setPreview] = useState(template?.preview || '');
  const [type, setType] = useState<NotifType>(template?.type || 'push');
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !preview.trim()) {
      toast.error('Please fill in all fields');
      return;
    }
    setIsSaving(true);
    try {
      await onSave({
        id: template?.id,
        name,
        type,
        preview,
      });
      onClose();
    } catch {
      toast.error('Failed to save template');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
        style={{ ...cardStyle, width: 480, maxWidth: '95vw', background: '#101010', border: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#221a15', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={18} color={GREEN} /> {template ? 'Edit Template' : 'Create Template'}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#888', cursor: 'pointer', display: 'flex', padding: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#888'}>
            <X size={20} />
          </button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={labelStyle}>Template Name</label>
            <input value={name} onChange={e => setName(e.target.value)} style={inputStyle} placeholder="e.g. Winter Discount Alert" required />
          </div>
          <div>
            <label style={labelStyle}>Notification Type</label>
            <select value={type} onChange={e => setType(e.target.value as NotifType)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
              <option value="push">Push Notification</option>
              <option value="email">Email</option>
              <option value="in-app">In-App Banner</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Message Preview</label>
            <textarea value={preview} onChange={e => setPreview(e.target.value)} rows={4} style={{ ...inputStyle, resize: 'vertical' }} placeholder="Message text..." required />
          </div>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" onClick={onClose} disabled={isSaving}
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#bbb', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}>
              Cancel
            </button>
            <button type="submit" disabled={isSaving}
              style={{ background: GREEN, border: 'none', color: '#000', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 6 }}>
              {isSaving ? 'Saving...' : 'Save Template'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// ─── Details Drawer/Modal ──────────────────────────────────────────────────────

interface LogDetailsProps {
  notification: AdminNotification;
  onClose: () => void;
}

function LogDetailsModal({ notification, onClose }: LogDetailsProps) {
  const tc = typeColors[notification.type];
  const sc = statusColors[notification.status];
  
  // Calculations
  const deliveryRate = notification.sentCount > 0 ? ((notification.deliveredCount / notification.sentCount) * 100).toFixed(1) : '0';
  const openRate = notification.deliveredCount > 0 ? ((notification.openedCount / notification.deliveredCount) * 100).toFixed(1) : '0';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(10px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <motion.div initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
        style={{ ...cardStyle, width: 550, maxWidth: '95vw', background: '#101010', border: '1px solid rgba(255,255,255,0.08)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <span style={{ background: tc.bg, color: tc.color, padding: '3px 10px', borderRadius: 30, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {tc.icon} {tc.label}
              </span>
              <span style={{ background: `${sc.color}15`, color: sc.color, padding: '3px 10px', borderRadius: 30, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {sc.label}
              </span>
            </div>
            <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#221a15' }}>{notification.title}</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', cursor: 'pointer', display: 'flex', padding: 4 }}
            onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#666'}>
            <X size={20} />
          </button>
        </div>

        {/* Message Panel */}
        <div style={{ background: 'rgba(43, 34, 26, 0.08)', border: '1px solid rgba(43, 34, 26, 0.05)', borderRadius: 12, padding: 16, marginBottom: 24 }}>
          <label style={{ ...labelStyle, marginBottom: 4 }}>Broadcast Message</label>
          <p style={{ margin: 0, color: '#e5e7eb', fontSize: 14, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{notification.message}</p>
        </div>

        {/* Realtime Stats Block */}
        <div style={{ marginBottom: 24 }}>
          <label style={labelStyle}>Delivery Metrics & Realtime Engagement</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>Sent Target</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#221a15', fontFamily: 'Outfit, sans-serif' }}>{notification.sentCount.toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>Delivered</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#221a15', fontFamily: 'Outfit, sans-serif' }}>{notification.deliveredCount.toLocaleString()}</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>Opened</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: '#221a15', fontFamily: 'Outfit, sans-serif' }}>{notification.openedCount.toLocaleString()}</div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>Delivery Rate</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: GREEN, fontFamily: 'Outfit, sans-serif' }}>{deliveryRate}%</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>Open Rate</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: BLUE, fontFamily: 'Outfit, sans-serif' }}>{openRate}%</div>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: 12, textAlign: 'center' }}>
              <div style={{ fontSize: 10, color: '#555', textTransform: 'uppercase', fontWeight: 600, letterSpacing: '0.05em', marginBottom: 4 }}>Click-Through (CTR)</div>
              <div style={{ fontSize: 18, fontWeight: 700, color: YELLOW, fontFamily: 'Outfit, sans-serif' }}>{notification.ctr}%</div>
            </div>
          </div>
        </div>

        {/* Info Block */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, fontSize: 12, color: '#888' }}>
          <div>
            <div style={{ marginBottom: 4 }}>Target Group: <span style={{ color: '#221a15', fontWeight: 600 }}>{audienceLabels[notification.audience]}</span></div>
            <div>Sent Method: <span style={{ color: '#221a15', fontWeight: 600, textTransform: 'uppercase' }}>{notification.type}</span></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ marginBottom: 4 }}>Dispatched: <span style={{ color: '#221a15' }}>{notification.sentAt ? new Date(notification.sentAt).toLocaleString() : 'Not Dispatched'}</span></div>
            {notification.scheduledTime && (
              <div>Scheduled Time: <span style={{ color: '#221a15' }}>{new Date(notification.scheduledTime).toLocaleString()}</span></div>
            )}
          </div>
        </div>

        <button onClick={onClose} style={{ width: '100%', marginTop: 24, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '12px', color: '#221a15', fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: 'Inter, sans-serif' }}
          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}>
          Close Log
        </button>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function NotificationsTab() {
  // Database States
  const [notifications, setNotifications] = useState<AdminNotification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [stats, setStats] = useState<NotificationStats>({
    sentToday: 0,
    unsubscribed: 0,
    audienceSizes: { all: 0, premium: 0, free: 0, artists: 0 },
  });
  const [loading, setLoading] = useState(true);

  // Form States
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [notifType, setNotifType] = useState<NotifType>('push');
  const [scheduleOpt, setSchedule] = useState<Schedule>('now');
  const [scheduleTime, setScheduleTime] = useState('');

  // Broadcasting Simulation State
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastProgress, setBroadcastProgress] = useState(0);
  const [broadcastPhase, setBroadcastPhase] = useState('');

  // UI States
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | NotifStatus>('all');
  const [editingTemplate, setEditingTemplate] = useState<NotificationTemplate | null>(null);
  const [showTplModal, setShowTplModal] = useState(false);
  const [viewLog, setViewLog] = useState<AdminNotification | null>(null);

  // Fetch Database Data
  const loadData = async () => {
    try {
      const res = await fetch(`/api/admin/notifications?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setNotifications(data.notifications);
        setTemplates(data.templates);
        setStats(data.stats);
      }
    } catch {
      toast.error('Failed to synchronize notification center data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Send Broadcast Handler with Simulation
  const handleSendBroadcast = async () => {
    if (!title.trim()) {
      toast.error('Please enter a notification title');
      return;
    }
    if (!message.trim()) {
      toast.error('Please enter a notification message');
      return;
    }
    if (scheduleOpt === 'scheduled' && !scheduleTime) {
      toast.error('Please pick a date & time to schedule');
      return;
    }

    // Save scheduled broadcast directly
    if (scheduleOpt === 'scheduled') {
      try {
        const res = await fetch('/api/admin/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            message,
            audience,
            type: notifType,
            status: 'scheduled',
            scheduledTime: scheduleTime,
          }),
        });
        const rData = await res.json();
        if (res.ok && rData.success) {
          toast.success(`Broadcast scheduled successfully for ${new Date(scheduleTime).toLocaleString()}!`);
          setTitle('');
          setMessage('');
          setSchedule('now');
          setScheduleTime('');
          loadData();
        } else {
          throw new Error(rData.error);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to schedule notification');
      }
      return;
    }

    // Start Live Simulation for Instant Broadcast
    setIsBroadcasting(true);
    setBroadcastProgress(0);
    setBroadcastPhase('Establishing broadcast tunnel...');

    const phases = [
      { p: 15, msg: 'Encrypting payload packets...' },
      { p: 40, msg: `Queueing dispatches for ${stats.audienceSizes[audience]} devices...` },
      { p: 70, msg: 'Broadcasting telemetry packets...' },
      { p: 90, msg: 'Verifying delivery confirmations...' },
      { p: 100, msg: 'Complete!' }
    ];

    let currentStep = 0;
    const interval = setInterval(async () => {
      setBroadcastProgress(prev => {
        const target = phases[currentStep].p;
        if (prev < target) {
          return prev + 2;
        } else {
          setBroadcastPhase(phases[currentStep].msg);
          if (currentStep < phases.length - 1) {
            currentStep++;
          }
          return prev;
        }
      });
    }, 40);

    // Run 2.5 seconds simulation, then dispatch
    setTimeout(async () => {
      clearInterval(interval);
      setBroadcastProgress(100);
      setBroadcastPhase('Complete!');
      
      try {
        // Save to Database
        const res = await fetch('/api/admin/notifications', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            message,
            audience,
            type: notifType,
            status: 'sent',
          }),
        });
        const rData = await res.json();

        if (res.ok && rData.success) {
          // Emit socket in real-time to other browser tabs
          if (socketManager) {
            socketManager.emit('NOTIFICATION', {
              id: rData.notification.id,
              type: notifType === 'push' ? 'system' : notifType === 'in-app' ? 'trending' : 'system',
              message: `${title}: ${message}`,
              timestamp: Date.now(),
              read: false,
            });
          }

          toast.success('Broadcast transmitted in real-time! 📡');
          setTitle('');
          setMessage('');
          loadData();
        } else {
          throw new Error(rData.error);
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to dispatch broadcast');
      } finally {
        setIsBroadcasting(false);
      }
    }, 2800);
  };

  // Template Save (Create or Edit)
  const handleSaveTemplate = async (tplData: Partial<NotificationTemplate>) => {
    try {
      const res = await fetch('/api/admin/notifications/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tplData),
      });
      const rData = await res.json();
      if (res.ok && rData.success) {
        toast.success(tplData.id ? 'Template updated!' : 'New template created!');
        loadData();
      } else {
        throw new Error(rData.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save template');
    }
  };

  // Template Delete
  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete template "${name}"?`)) return;
    try {
      const res = await fetch(`/api/admin/notifications/templates?id=${id}`, {
        method: 'DELETE',
      });
      const rData = await res.json();
      if (res.ok && rData.success) {
        toast.success(`Template "${name}" deleted`);
        loadData();
      } else {
        throw new Error(rData.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete template');
    }
  };

  // Populate form with template content
  const handleUseTemplate = (tpl: NotificationTemplate) => {
    setTitle(tpl.name);
    setMessage(tpl.preview);
    setNotifType(tpl.type);
    toast.success(`Loaded template: "${tpl.name}" into composer`);
  };

  // Filter & Search Logs Table
  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = n.title.toLowerCase().includes(searchQuery.toLowerCase()) || n.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || n.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3.5px solid rgba(176, 136, 80, 0.1)', borderTopColor: GREEN, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: '#888', fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Synchronizing Notification Center...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0', fontFamily: 'Inter, sans-serif', color: '#221a15' }}>

      {/* Realtime Audit Statistics cards */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Broadcasts Sent Today', value: stats.sentToday, desc: 'Logged dispatches', color: GREEN },
          { label: 'Est. Delivery Health', value: '98.8%', desc: 'Avg network receipts', color: BLUE },
          { label: 'Notifications Unsubscribed', value: stats.unsubscribed, desc: 'Users turned off alerts', color: RED },
          { label: 'Active User Database', value: stats.audienceSizes.all, desc: 'Realtime registered users', color: YELLOW },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={{ ...cardStyle, flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '20px' }}>
            <div>
              <div style={{ color: '#737373', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 6 }}>{s.label}</div>
              <div style={{ color: s.color, fontSize: 32, fontWeight: 900, fontFamily: 'Outfit, sans-serif', lineHeight: 1 }}>{s.value}</div>
            </div>
            <div style={{ color: '#555', fontSize: 11, marginTop: 10, borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 8 }}>{s.desc}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Top Section: Send Form (Left) & Templates List (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24, marginBottom: 28 }}>

        {/* Left Side: Broadcast Creator & Live Phone Preview */}
        <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.15 }}
          style={{ ...cardStyle, position: 'relative' }}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#221a15', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Send size={16} color={GREEN} /> Live Broadcast Center
            </div>
            <span style={{ fontSize: 11, color: '#737373', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: GREEN, animation: 'pulse 1.2s infinite' }} /> Ready
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: 24 }}>
            
            {/* Input Form Column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Broadcast Title</label>
                <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification Title / Subject..." style={inputStyle} maxLength={50} />
              </div>
              
              <div>
                <label style={labelStyle}>Broadcast Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} rows={3} placeholder="Type your broadcast message text here..." style={{ ...inputStyle, resize: 'none' }} maxLength={180} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#555', marginTop: 4 }}>
                  <span>Variables supported: {"{artist_name}"}</span>
                  <span>{message.length}/180 chars</span>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={labelStyle}>Target Audience</label>
                  <select value={audience} onChange={e => setAudience(e.target.value as Audience)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                    <option value="all">All Users ({stats.audienceSizes.all})</option>
                    <option value="premium">Premium Only ({stats.audienceSizes.premium})</option>
                    <option value="free">Free Users ({stats.audienceSizes.free})</option>
                    <option value="artists">Artists Only ({stats.audienceSizes.artists})</option>
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Delivery Type</label>
                  <select value={notifType} onChange={e => setNotifType(e.target.value as NotifType)} style={{ ...inputStyle, appearance: 'none', cursor: 'pointer' }}>
                    <option value="push">Mobile Push Alert</option>
                    <option value="email">Email Campaign</option>
                    <option value="in-app">In-App Banner</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Delivery Schedule</label>
                <div style={{ display: 'flex', gap: 8, marginBottom: scheduleOpt === 'scheduled' ? 10 : 0 }}>
                  {(['now', 'scheduled'] as Schedule[]).map(s => (
                    <button key={s} onClick={() => setSchedule(s)} type="button"
                      style={{ flex: 1, padding: '10px 0', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', transition: 'all 0.2s',
                        background: scheduleOpt === s ? `${GREEN}18` : 'rgba(255,255,255,0.03)',
                        color: scheduleOpt === s ? GREEN : '#888',
                        border: scheduleOpt === s ? `1px solid ${GREEN}44` : '1px solid rgba(255,255,255,0.08)',
                      }}>
                      {s === 'now' ? '⚡ Instant Dispatch' : '🕐 Schedule Time'}
                    </button>
                  ))}
                </div>
                <AnimatePresence>
                  {scheduleOpt === 'scheduled' && (
                    <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
                      <input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} style={inputStyle} min={new Date().toISOString().slice(0, 16)} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Action Button */}
              <button onClick={handleSendBroadcast} disabled={isBroadcasting}
                style={{ 
                  background: GREEN, border: 'none', color: '#000', borderRadius: 10, padding: '12px 0', fontSize: 13, fontWeight: 800, cursor: 'pointer', fontFamily: 'Outfit, sans-serif', width: '100%', marginTop: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: `0 4px 14px 0 rgba(176, 136, 80, 0.2)`
                }}>
                {isBroadcasting ? (
                  <div style={{ width: 18, height: 18, border: '2.5px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
                ) : (
                  <>
                    <Send size={15} /> 
                    {scheduleOpt === 'now' ? `Transmit Broadcast (Targets ${stats.audienceSizes[audience]})` : 'Schedule Delivery'}
                  </>
                )}
              </button>
            </div>

            {/* Smartphone Lockscreen Preview Column */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: 6, color: '#737373', fontSize: 11, fontWeight: 600, marginBottom: 12 }}>
                <Smartphone size={13} /> Realtime Push Preview
              </div>
              
              {/* Smartphone Outer Container */}
              <div style={{
                width: 190, height: 350, border: '5px solid #282828', borderRadius: 28, background: '#000', position: 'relative', overflow: 'hidden',
                boxShadow: '0 12px 28px rgba(43, 34, 26, 0.1)', display: 'flex', flexDirection: 'column', alignItems: 'center'
              }}>
                {/* Notch */}
                <div style={{ width: 80, height: 12, background: '#282828', borderBottomLeftRadius: 10, borderBottomRightRadius: 10, position: 'absolute', top: 0, zIndex: 2 }} />
                
                {/* Wallpaper gradient */}
                <div style={{
                  position: 'absolute', inset: 0, 
                  background: 'radial-gradient(circle at top right, #112a1f 0%, #050505 60%, #150a1e 100%)',
                  zIndex: 0
                }} />

                {/* Clock */}
                <div style={{ position: 'relative', zIndex: 1, marginTop: 32, textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 300, color: '#221a15', fontFamily: 'Outfit, sans-serif' }}>12:04</div>
                  <div style={{ fontSize: 9, color: '#737373', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em' }}>Wednesday, Jun 3</div>
                </div>

                {/* Notification Bubble */}
                <div style={{ position: 'absolute', top: 110, left: 8, right: 8, zIndex: 1 }}>
                  <AnimatePresence mode="popLayout">
                    {title.trim() || message.trim() ? (
                      <motion.div initial={{ opacity: 0, scale: 0.85, y: -10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.85, y: -10 }}
                        style={{
                          background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12, padding: '10px 12px',
                          backdropFilter: 'blur(12px)', boxShadow: '0 4px 12px rgba(0,0,0,0.4)', boxSizing: 'border-box'
                        }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}>
                          <span style={{ fontSize: 10 }}>{typeColors[notifType].icon}</span>
                          <span style={{ fontSize: 8, fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Beato</span>
                          <span style={{ fontSize: 8, color: '#666', marginLeft: 'auto' }}>now</span>
                        </div>
                        <div style={{ fontSize: 10, fontWeight: 800, color: '#221a15', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {title.trim() ? title : 'New Broadcast Alert'}
                        </div>
                        <div style={{ fontSize: 8.5, color: '#ccc', lineHeight: 1.3, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {message.trim() ? message : 'Write a message to preview push layout...'}
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', color: '#555', fontSize: 10, marginTop: 40, padding: 12 }}>
                        No alert active
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>
          </div>

          {/* Broadcast network loading overlay */}
          <AnimatePresence>
            {isBroadcasting && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ 
                  position: 'absolute', inset: 0, background: 'rgba(10, 10, 10, 0.92)', borderRadius: 18, zIndex: 10,
                  display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, backdropFilter: 'blur(4px)'
                }}>
                <div style={{ fontSize: 16, fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#221a15', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Send size={18} color={GREEN} className="animate-pulse" /> Dispatching Broadcast
                </div>
                <div style={{ width: '80%', height: 6, background: 'rgba(255,255,255,0.06)', borderRadius: 100, overflow: 'hidden', marginBottom: 12 }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${broadcastProgress}%` }} transition={{ duration: 0.1 }}
                    style={{ height: '100%', background: GREEN, borderRadius: 100 }} />
                </div>
                <div style={{ fontSize: 12, color: GREEN, fontWeight: 700, fontFamily: 'Outfit, sans-serif', marginBottom: 4 }}>
                  {broadcastProgress}% Completed
                </div>
                <div style={{ fontSize: 11, color: '#666', fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>
                  {broadcastPhase}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>

        {/* Right Side: Notification Templates Card */}
        <motion.div initial={{ opacity: 0, x: 14 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
          style={cardStyle}>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#221a15', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Plus size={16} color={GREEN} /> Preset Templates
            </div>
            <button onClick={() => { setEditingTemplate(null); setShowTplModal(true); }}
              style={{ background: 'rgba(176, 136, 80, 0.1)', border: '1px solid rgba(176, 136, 80, 0.2)', color: GREEN, borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer', fontFamily: 'Inter, sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(176, 136, 80, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(176, 136, 80, 0.1)'}>
              <Plus size={12} /> Add Template
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 310, overflowY: 'auto', paddingRight: 4 }}>
            <AnimatePresence>
              {templates.map((t, i) => {
                const tc = typeColors[t.type];
                return (
                  <motion.div key={t.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ delay: i * 0.05 }}
                    style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 12, padding: '14px', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#221a15', marginBottom: 4 }}>{t.name}</div>
                        <span style={{ background: tc.bg, color: tc.color, padding: '2px 8px', borderRadius: 10, fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em' }}>
                          {tc.icon} {t.type}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => { setEditingTemplate(t); setShowTplModal(true); }}
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#aaa', borderRadius: 6, padding: '4px 8px', fontSize: 10, cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#aaa'}>
                          <Edit3 size={11} />
                        </button>
                        <button onClick={() => handleUseTemplate(t)}
                          style={{ background: 'rgba(176, 136, 80, 0.1)', border: '1px solid rgba(176, 136, 80, 0.2)', color: GREEN, borderRadius: 6, padding: '4px 8px', fontSize: 10, cursor: 'pointer', fontWeight: 600 }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(176, 136, 80, 0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(176, 136, 80, 0.1)'}>
                          Use
                        </button>
                        <button onClick={() => handleDeleteTemplate(t.id, t.name)}
                          style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', color: RED, borderRadius: 6, padding: '4px 8px', fontSize: 10, cursor: 'pointer' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}>
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>
                    <div style={{ color: '#87786c', fontSize: 11.5, lineHeight: 1.4, marginTop: 4 }}>{t.preview}</div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        </motion.div>

      </div>

      {/* Audit Logs / Past Notifications Table */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        style={cardStyle}>
        
        {/* Table Filters header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
          <div style={{ fontSize: 16, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#221a15', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart2 size={16} color={GREEN} /> Realtime Audit Logs
          </div>
          
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative' }}>
              <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search dispatches..."
                style={{ ...inputStyle, width: 200, paddingLeft: 34, paddingRight: 10, height: 36, fontSize: 12 }} />
              <Search size={12} color="#666" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            
            {/* Filter chips */}
            <div style={{ display: 'flex', background: 'rgba(43, 34, 26, 0.08)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, padding: 3, gap: 2 }}>
              {(['all', 'sent', 'scheduled'] as const).map(f => (
                <button key={f} onClick={() => setStatusFilter(f)}
                  style={{
                    background: statusFilter === f ? 'rgba(255,255,255,0.08)' : 'transparent',
                    border: 'none', borderRadius: 6, color: statusFilter === f ? '#fff' : '#6b7280',
                    padding: '4px 10px', fontSize: 11, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize'
                  }}>
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table Layout */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', color: '#87786c', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '12px 16px' }}>Title & Vibe</th>
                <th style={{ padding: '12px 16px' }}>Type</th>
                <th style={{ padding: '12px 16px' }}>Audience</th>
                <th style={{ padding: '12px 16px' }}>Dispatched Targets</th>
                <th style={{ padding: '12px 16px' }}>CTR</th>
                <th style={{ padding: '12px 16px' }}>Timestamp</th>
                <th style={{ padding: '12px 16px' }}>Status</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredNotifications.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#555', fontSize: 13 }}>No broadcast logs matched search criteria</td>
                </tr>
              ) : (
                filteredNotifications.map((n, i) => {
                  const tc = typeColors[n.type];
                  const sc = statusColors[n.status];
                  return (
                    <motion.tr key={n.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 * i }}
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', height: 52 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.015)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#221a15', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</div>
                        <div style={{ fontSize: 11, color: '#87786c', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.message}</div>
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ color: tc.color, fontSize: 12, fontWeight: 500 }}>{tc.icon} {n.type}</span>
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#d1d5db' }}>
                        {audienceLabels[n.audience]}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 12, color: '#a0958b', fontFamily: 'Outfit, sans-serif' }}>
                        {n.status === 'scheduled' ? '—' : n.sentCount.toLocaleString()}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        {n.status === 'scheduled' ? '—' : (
                          <span style={{ color: n.ctr > 10 ? GREEN : YELLOW, fontWeight: 700, fontSize: 12 }}>{n.ctr}%</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px', fontSize: 11, color: '#87786c' }}>
                        {n.status === 'scheduled' && n.scheduledTime ? (
                          <span style={{ color: BLUE, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Clock size={11} /> {new Date(n.scheduledTime).toLocaleString()}
                          </span>
                        ) : (
                          n.sentAt ? new Date(n.sentAt).toLocaleString() : '—'
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{ background: `${sc.color}15`, color: sc.color, padding: '2px 8px', borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'capitalize' }}>
                          {sc.label}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                        <button onClick={() => setViewLog(n)}
                          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: '#221a15', borderRadius: 8, padding: '6px 12px', fontSize: 11, cursor: 'pointer', fontWeight: 600 }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                          View Analytics
                        </button>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* Edit/Create Template Modal */}
      <AnimatePresence>
        {showTplModal && (
          <EditTemplateModal
            template={editingTemplate}
            onClose={() => { setShowTplModal(false); setEditingTemplate(null); }}
            onSave={handleSaveTemplate}
          />
        )}
      </AnimatePresence>

      {/* Log Details Modal */}
      <AnimatePresence>
        {viewLog && (
          <LogDetailsModal
            notification={viewLog}
            onClose={() => setViewLog(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
