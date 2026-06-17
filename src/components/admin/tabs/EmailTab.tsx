'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';

const FONT = { fontFamily: "'Inter', 'Outfit', sans-serif" };

const CARD = {
  background: '#121212',
  borderRadius: 14,
  padding: '18px 22px',
  border: '1px solid #1e1e1e',
  display: 'flex',
  alignItems: 'center',
  gap: 14,
};

const GRADIENTS = [
  { name: 'Emerald Green', value: 'linear-gradient(135deg,#b08850,#0d6b31)' },
  { name: 'Deep Purple', value: 'linear-gradient(135deg,#a78bfa,#6d28d9)' },
  { name: 'Electric Blue', value: 'linear-gradient(135deg,#60a5fa,#1d4ed8)' },
  { name: 'Amber Orange', value: 'linear-gradient(135deg,#f59e0b,#b45309)' },
  { name: 'Crimson Red', value: 'linear-gradient(135deg,#ff4d4d,#991b1b)' },
  { name: 'Teal Mint', value: 'linear-gradient(135deg,#34d399,#065f46)' },
];

const AUDIENCE_NAMES: Record<string, string> = {
  all: 'All Users',
  premium: 'Premium Users',
  free: 'Free Users',
  artists: 'Artists',
  inactive: 'Inactive Users',
  new: 'New Users (<7d)',
};

const TEMPLATE_TYPES = [
  { value: 'promotional', label: 'Promotional' },
  { value: 'transactional', label: 'Transactional' },
  { value: 'digest', label: 'Monthly Digest' },
  { value: 'notification', label: 'Notification' },
  { value: 're-engagement', label: 'Re-engagement' },
];

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  preview: string;
  color: string;
  type: string;
  usedCount: number;
}

interface Campaign {
  id: string;
  name: string;
  type: string;
  audience: string;
  templateId: string;
  templateName?: string;
  subject: string;
  status: 'sent' | 'scheduled' | 'draft' | 'sending';
  sentCount: number;
  openCount: number;
  clickCount: number;
  openRate: number;
  clickRate: number;
  revenue: number;
  segmentSize: number;
  scheduledAt: string | null;
  sentAt: string | null;
}

interface Stats {
  subscribers: number;
  premiumSubscribers: number;
  freeSubscribers: number;
  artists: number;
  emailsSentMonth: number;
  openRate: number;
  unsubscribes: number;
  totalOpened: number;
}

export default function EmailTab() {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState<Stats>({
    subscribers: 0,
    premiumSubscribers: 0,
    freeSubscribers: 0,
    artists: 0,
    emailsSentMonth: 0,
    openRate: 0,
    unsubscribes: 0,
    totalOpened: 0,
  });
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [audienceCounts, setAudienceCounts] = useState<Record<string, number>>({});

  // Modals state
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<EmailTemplate | null>(null);

  // Forms state
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'Promotional',
    audience: 'all',
    templateId: '',
    subject: '',
    scheduleType: 'now' as 'now' | 'scheduled',
    scheduleDate: '',
  });

  const [templateForm, setTemplateForm] = useState({
    id: '',
    name: '',
    subject: '',
    preview: '',
    type: 'promotional',
    color: 'linear-gradient(135deg,#b08850,#0d6b31)',
  });

  const [isEditingTemplate, setIsEditingTemplate] = useState(false);

  // Fetch all email data
  const fetchData = async () => {
    try {
      const res = await fetch('/api/admin/email');
      if (!res.ok) throw new Error('Failed to load real-time email data');
      const data = await res.json();
      setStats(data.stats);
      setTemplates(data.templates);
      setCampaigns(data.campaigns);
      setAudienceCounts(data.audienceCounts);

      // Select first template as default in campaign form if available
      if (data.templates && data.templates.length > 0 && !campaignForm.templateId) {
        setCampaignForm(f => ({ ...f, templateId: data.templates[0].id }));
      }
    } catch (err: any) {
      toast.error(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Campaign handling
  const handleCreateCampaign = async () => {
    if (!campaignForm.name.trim()) return toast.error('Campaign Name is required');
    if (!campaignForm.subject.trim()) return toast.error('Subject Line is required');
    if (!campaignForm.templateId) return toast.error('Please select a template');

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_campaign',
          name: campaignForm.name,
          type: campaignForm.type,
          audience: campaignForm.audience,
          templateId: campaignForm.templateId,
          subject: campaignForm.subject,
          scheduleAt: campaignForm.scheduleType === 'scheduled' ? campaignForm.scheduleDate : null,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create campaign');

      toast.success(
        campaignForm.scheduleType === 'scheduled'
          ? `Campaign "${campaignForm.name}" scheduled successfully!`
          : `Campaign "${campaignForm.name}" created as draft!`
      );
      setShowCampaignModal(false);
      
      // Reset form
      setCampaignForm({
        name: '',
        type: 'Promotional',
        audience: 'all',
        templateId: templates[0]?.id || '',
        subject: '',
        scheduleType: 'now',
        scheduleDate: '',
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error creating campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendCampaign = async (id: string, name: string) => {
    const loadingToast = toast.loading(`Sending campaign "${name}" in real-time...`);
    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'send_campaign', id }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send campaign');

      toast.success(`Campaign "${name}" sent to subscribers!`, { id: loadingToast });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error sending campaign', { id: loadingToast });
    }
  };

  const handleDeleteCampaign = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete campaign "${name}"?`)) return;
    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_campaign', id }),
      });

      if (!res.ok) throw new Error('Failed to delete campaign');
      toast.success(`Campaign "${name}" deleted`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting campaign');
    }
  };

  // Template handling
  const handleSaveTemplate = async () => {
    if (!templateForm.name.trim()) return toast.error('Template Name is required');

    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isEditingTemplate ? 'update_template' : 'create_template',
          id: templateForm.id,
          name: templateForm.name,
          subject: templateForm.subject,
          preview: templateForm.preview,
          type: templateForm.type,
          color: templateForm.color,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to save template');

      toast.success(isEditingTemplate ? `Template updated!` : `Template "${templateForm.name}" created!`);
      setShowTemplateModal(false);
      setTemplateForm({
        id: '',
        name: '',
        subject: '',
        preview: '',
        type: 'promotional',
        color: 'linear-gradient(135deg,#b08850,#0d6b31)',
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error saving template');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEditTemplate = (tpl: EmailTemplate) => {
    setIsEditingTemplate(true);
    setTemplateForm({
      id: tpl.id,
      name: tpl.name,
      subject: tpl.subject || '',
      preview: tpl.preview || '',
      type: tpl.type || 'promotional',
      color: tpl.color || 'linear-gradient(135deg,#b08850,#0d6b31)',
    });
    setShowTemplateModal(true);
  };

  const handleDeleteTemplate = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete template "${name}"?`)) return;
    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_template', id }),
      });

      if (!res.ok) throw new Error('Failed to delete template');
      toast.success(`Template "${name}" deleted`);
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Error deleting template');
    }
  };

  const formatNumber = (num: number) => num.toLocaleString();
  const formatPercentage = (num: number) => `${num}%`;

  if (loading) {
    return (
      <div style={{ ...FONT, background: '#0a0a0a', minHeight: '100vh', padding: '28px 24px', color: '#e5e7eb', display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ background: '#121212', borderRadius: 14, height: 80, border: '1px solid #1e1e1e', display: 'flex', alignItems: 'center', padding: '18px 22px' }}>
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ height: 20, width: '60%', background: '#222', borderRadius: 4 }} className="animate-pulse" />
                <div style={{ height: 12, width: '40%', background: '#222', borderRadius: 4 }} className="animate-pulse" />
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 160, background: '#121212', borderRadius: 14, border: '1px solid #1e1e1e' }} className="animate-pulse" />
        <div style={{ height: 300, background: '#121212', borderRadius: 14, border: '1px solid #1e1e1e' }} className="animate-pulse" />
      </div>
    );
  }

  const STATS_ITEMS = [
    { label: 'Subscribers', value: formatNumber(stats.subscribers), icon: '👥', color: '#b08850' },
    { label: 'Emails Sent', value: formatNumber(stats.emailsSentMonth), icon: '📨', color: '#60a5fa' },
    { label: 'Avg Open Rate', value: formatPercentage(stats.openRate), icon: '📬', color: '#a78bfa' },
    { label: 'Unsubscribes', value: formatNumber(stats.unsubscribes), icon: '🚫', color: '#ff4d4d' },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ ...FONT, background: '#0a0a0a', minHeight: '100vh', padding: '28px 24px', color: '#e5e7eb' }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 16, marginBottom: 30 }}>
        {STATS_ITEMS.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            style={CARD}>
            <span style={{ fontSize: 26 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{s.label}</div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Templates */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Email Templates</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#4b5563' }}>Create and manage real templates utilized by your automation rules and bulk campaigns.</p>
          </div>
          <button onClick={() => {
            setIsEditingTemplate(false);
            setTemplateForm({
              id: '',
              name: '',
              subject: '',
              preview: '',
              type: 'promotional',
              color: 'linear-gradient(135deg,#b08850,#0d6b31)',
            });
            setShowTemplateModal(true);
          }}
            style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#b08850', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            + Create Template
          </button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 14 }}>
          {templates.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
              style={{ background: '#121212', borderRadius: 13, border: '1px solid #1e1e1e', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{ height: 80, background: t.color, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
                <span style={{ fontSize: 28 }}>✉️</span>
                <span style={{ position: 'absolute', right: 10, bottom: 8, fontSize: 10, padding: '2px 8px', borderRadius: 12, background: 'rgba(0,0,0,0.5)', color: '#fff', textTransform: 'capitalize' }}>
                  {t.type}
                </span>
              </div>
              <div style={{ padding: '14px 16px', flexGrow: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#e5e7eb', marginBottom: 4 }}>{t.name}</div>
                  <div style={{ fontSize: 12, color: '#6b7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 6 }} title={t.subject}>
                    Subject: {t.subject || '(None)'}
                  </div>
                  <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 12, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', height: 32 }}>
                    {t.preview || 'No preview snippet set.'}
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => handleOpenEditTemplate(t)}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#9ca3af', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      Edit
                    </button>
                    <button onClick={() => {
                      setPreviewTemplate(t);
                      setShowPreviewModal(true);
                    }}
                      style={{ flex: 1, padding: '6px 0', borderRadius: 7, border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#9ca3af', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                      Preview
                    </button>
                    <button onClick={() => handleDeleteTemplate(t.id, t.name)}
                      style={{ padding: '6px 8px', borderRadius: 7, border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#ff4d4d', fontSize: 11, cursor: 'pointer' }}
                      title="Delete Template">
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Campaigns Table */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>Campaigns</h3>
            <p style={{ margin: '4px 0 0 0', fontSize: 12, color: '#4b5563' }}>Real-time campaigns executed or scheduled. Send to lists generated instantly from the database.</p>
          </div>
          <button onClick={() => setShowCampaignModal(true)}
            style={{ padding: '9px 18px', borderRadius: 9, border: 'none', background: '#b08850', color: '#000', fontWeight: 800, fontSize: 13, cursor: 'pointer' }}>
            + Create Campaign
          </button>
        </div>

        <div style={{ background: '#121212', borderRadius: 14, border: '1px solid #1e1e1e', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#161616', borderBottom: '1px solid #1e1e1e' }}>
                {['Campaign Name', 'Audience', 'Subscribers', 'Template Used', 'Sent', 'Open Rate', 'Click Rate', 'Revenue', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 14px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {campaigns.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: '40px', textAlign: 'center', color: '#4b5563' }}>No campaigns found. Create one to get started!</td>
                </tr>
              ) : (
                campaigns.map((c, i) => {
                  const statusColors = {
                    sent: { bg: '#1a3a27', color: '#b08850' },
                    scheduled: { bg: '#1a2240', color: '#60a5fa' },
                    draft: { bg: '#222', color: '#6b7280' },
                    sending: { bg: '#2a2010', color: '#f59e0b' },
                  };
                  const color = statusColors[c.status] || { bg: '#222', color: '#fff' };
                  
                  return (
                    <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                      whileHover={{ background: 'rgba(255, 255, 255, 0.03)' }}
                      style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '12px 14px', fontWeight: 700, color: '#e5e7eb', whiteSpace: 'nowrap' }}>
                        <div style={{ fontSize: 13 }}>{c.name}</div>
                        <div style={{ fontSize: 10, color: '#4b5563', fontWeight: 400, marginTop: 2 }}>{c.subject}</div>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#e5e7eb' }}>
                        <span style={{ fontSize: 11, background: '#1c1c1e', padding: '2px 8px', borderRadius: 4, border: '1px solid #2a2a2a' }}>
                          {AUDIENCE_NAMES[c.audience] || c.audience}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', color: '#9ca3af' }}>{formatNumber(c.segmentSize)} users</td>
                      <td style={{ padding: '12px 14px', color: '#9ca3af' }}>{c.templateName}</td>
                      <td style={{ padding: '12px 14px', color: '#e5e7eb', fontWeight: 600 }}>{c.status === 'sent' ? formatNumber(c.sentCount) : '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#b08850', fontWeight: 600 }}>{c.status === 'sent' ? formatPercentage(c.openRate) : '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#60a5fa', fontWeight: 600 }}>{c.status === 'sent' ? formatPercentage(c.clickRate) : '—'}</td>
                      <td style={{ padding: '12px 14px', color: '#a78bfa', fontWeight: 800 }}>{c.status === 'sent' && c.revenue > 0 ? `$${formatNumber(c.revenue)}` : '—'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ background: color.bg, color: color.color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>
                          {c.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {c.status === 'draft' && (
                            <button onClick={() => handleSendCampaign(c.id, c.name)}
                              style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: '#b08850', color: '#000', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                              🚀 Send
                            </button>
                          )}
                          {c.status === 'scheduled' && (
                            <button onClick={() => toast('Scheduled campaigns run automatically via backend cron.')}
                              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#60a5fa', fontSize: 11, cursor: 'pointer' }}>
                              ⏰ Scheduled
                            </button>
                          )}
                          {c.status === 'sent' && (
                            <button onClick={() => toast.success(`This campaign was sent to ${c.sentCount} subscribers successfully.`)}
                              style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#9ca3af', fontSize: 11, cursor: 'pointer' }}>
                              Report
                            </button>
                          )}
                          <button onClick={() => handleDeleteCampaign(c.id, c.name)}
                            style={{ padding: '5px 8px', borderRadius: 6, border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#ff4d4d', fontSize: 11, cursor: 'pointer' }}
                            title="Delete Campaign">
                            🗑️
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Campaign Modal */}
      <AnimatePresence>
        {showCampaignModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setShowCampaignModal(false)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              style={{ background: '#121212', borderRadius: 16, border: '1px solid #2a2a2a', padding: 32, width: 560, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#fff' }}>Create Campaign</h3>
              <p style={{ margin: '0 0 20px 0', fontSize: 12, color: '#6b7280' }}>Launch an email blast immediately or schedule it for your subscribers list.</p>
              
              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 5 }}>Campaign Name *</label>
                <input type="text" value={campaignForm.name} onChange={e => setCampaignForm({ ...campaignForm, name: e.target.value })} placeholder="e.g. June Premium Push"
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 9, padding: '10px 14px', color: '#e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 5 }}>Subject Line *</label>
                <input type="text" value={campaignForm.subject} onChange={e => setCampaignForm({ ...campaignForm, subject: e.target.value })} placeholder="e.g. Upgrade to Premium this June 🎧"
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 9, padding: '10px 14px', color: '#e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 5 }}>Template</label>
                  <select value={campaignForm.templateId} onChange={e => setCampaignForm({ ...campaignForm, templateId: e.target.value })}
                    style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 9, padding: '10px 14px', color: '#e5e7eb', fontSize: 13, outline: 'none' }}>
                    <option value="" disabled>Select a template</option>
                    {templates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 5 }}>Target Audience</label>
                  <select value={campaignForm.audience} onChange={e => setCampaignForm({ ...campaignForm, audience: e.target.value })}
                    style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 9, padding: '10px 14px', color: '#e5e7eb', fontSize: 13, outline: 'none' }}>
                    {Object.entries(AUDIENCE_NAMES).map(([key, name]) => (
                      <option key={key} value={key}>
                        {name} ({audienceCounts[key] !== undefined ? `${audienceCounts[key]} users` : 'loading...'})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 8 }}>Schedule</label>
                <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                  {['now', 'scheduled'].map(s => (
                    <button key={s} type="button" onClick={() => setCampaignForm({ ...campaignForm, scheduleType: s as any })}
                      style={{ padding: '8px 18px', borderRadius: 8, border: 'none', background: campaignForm.scheduleType === s ? '#b08850' : '#1e1e1e', color: campaignForm.scheduleType === s ? '#000' : '#9ca3af', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                      {s === 'now' ? 'Send Now' : 'Schedule for Later'}
                    </button>
                  ))}
                </div>
                {campaignForm.scheduleType === 'scheduled' && (
                  <input type="datetime-local" value={campaignForm.scheduleDate} onChange={e => setCampaignForm({ ...campaignForm, scheduleDate: e.target.value })}
                    style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 9, padding: '10px 14px', color: '#e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                )}
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowCampaignModal(false)}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 9, border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#9ca3af', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="button" onClick={handleCreateCampaign} disabled={submitting}
                  style={{ flex: 2, padding: '12px 0', borderRadius: 9, border: 'none', background: '#b08850', color: '#000', fontWeight: 800, fontSize: 14, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Creating...' : campaignForm.scheduleType === 'now' ? '🚀 Send Campaign' : '📅 Schedule Campaign'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Template Builder Modal (Create/Edit) */}
      <AnimatePresence>
        {showTemplateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setShowTemplateModal(false)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              style={{ background: '#121212', borderRadius: 16, border: '1px solid #2a2a2a', padding: 32, width: 600, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}
              onClick={e => e.stopPropagation()}>
              <h3 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#fff' }}>
                {isEditingTemplate ? 'Edit Email Template' : 'Create Email Template'}
              </h3>
              <p style={{ margin: '0 0 20px 0', fontSize: 12, color: '#6b7280' }}>
                Design a template for targeted newsletters or trigger-based marketing automations.
              </p>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 5 }}>Template Name *</label>
                <input type="text" value={templateForm.name} onChange={e => setTemplateForm({ ...templateForm, name: e.target.value })} placeholder="e.g. Welcome Subscriber Email"
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 9, padding: '10px 14px', color: '#e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 5 }}>Category / Type</label>
                  <select value={templateForm.type} onChange={e => setTemplateForm({ ...templateForm, type: e.target.value })}
                    style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 9, padding: '10px 14px', color: '#e5e7eb', fontSize: 13, outline: 'none' }}>
                    {TEMPLATE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 5 }}>Theme Gradient</label>
                  <select value={templateForm.color} onChange={e => setTemplateForm({ ...templateForm, color: e.target.value })}
                    style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 9, padding: '10px 14px', color: '#e5e7eb', fontSize: 13, outline: 'none' }}>
                    {GRADIENTS.map(g => <option key={g.value} value={g.value}>{g.name}</option>)}
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 5 }}>Email Subject *</label>
                <input type="text" value={templateForm.subject} onChange={e => setTemplateForm({ ...templateForm, subject: e.target.value })} placeholder="Subject line that appears in recipient's inbox"
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 9, padding: '10px 14px', color: '#e5e7eb', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
              </div>

              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 5 }}>Email Body Preview Text</label>
                <textarea rows={4} value={templateForm.preview} onChange={e => setTemplateForm({ ...templateForm, preview: e.target.value })} placeholder="Snippet text preview visible next to the subject or header content..."
                  style={{ width: '100%', background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 9, padding: '12px 14px', color: '#e5e7eb', fontSize: 13, outline: 'none', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }} />
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button type="button" onClick={() => setShowTemplateModal(false)}
                  style={{ flex: 1, padding: '12px 0', borderRadius: 9, border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#9ca3af', fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
                  Cancel
                </button>
                <button type="button" onClick={handleSaveTemplate} disabled={submitting}
                  style={{ flex: 2, padding: '12px 0', borderRadius: 9, border: 'none', background: '#b08850', color: '#000', fontWeight: 800, fontSize: 14, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                  {submitting ? 'Saving...' : '💾 Save Template'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visual Email Preview Modal */}
      <AnimatePresence>
        {showPreviewModal && previewTemplate && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
            onClick={() => setShowPreviewModal(false)}>
            <motion.div initial={{ scale: 0.92, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.92, opacity: 0 }}
              style={{ background: '#1c1c1e', borderRadius: 16, border: '1px solid #2a2a2a', width: 620, maxWidth: '95vw', overflow: 'hidden' }}
              onClick={e => e.stopPropagation()}>
              
              {/* Simulated Browser Bar */}
              <div style={{ background: '#121212', padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid #2a2a2a' }}>
                <div style={{ display: 'flex', gap: 6 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ff5f56' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#ffbd2e' }} />
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: '#27c93f' }} />
                </div>
                <div style={{ background: '#2a2a2a', flexGrow: 1, borderRadius: 6, fontSize: 11, padding: '4px 12px', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🔒 <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>https://mail.google.com/mail/u/0/#inbox</span>
                </div>
              </div>

              {/* Email Envelope Info */}
              <div style={{ padding: '18px 24px', background: '#1c1c1e', borderBottom: '1px solid #2a2a2a' }}>
                <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{previewTemplate.subject || '(No Subject)'}</h4>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8e8e93' }}>
                  <div>
                    <strong>From:</strong> Beato &lt;<span style={{ color: '#b08850' }}>newsletter@beato.io</span>&gt;
                  </div>
                  <div>Just now</div>
                </div>
                <div style={{ fontSize: 12, color: '#8e8e93', marginTop: 4 }}>
                  <strong>To:</strong> subscriber@beato.io
                </div>
              </div>

              {/* Email Body Layout */}
              <div style={{ background: '#0a0a0a', padding: 24, maxHeight: 400, overflowY: 'auto' }}>
                <div style={{ background: '#121212', border: '1px solid #222', borderRadius: 8, overflow: 'hidden', maxWidth: 500, margin: '0 auto', boxShadow: '0 4px 12px rgba(0,0,0,0.5)' }}>
                  
                  {/* Decorative Banner based on template color */}
                  <div style={{ background: previewTemplate.color, height: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 32 }}>🎵 Beato</span>
                  </div>

                  {/* Message Container */}
                  <div style={{ padding: 24, color: '#e5e7eb', fontSize: 14, lineHeight: 1.5 }}>
                    <h3 style={{ margin: '0 0 12px 0', color: '#fff', fontSize: 17 }}>Hello Music Lover,</h3>
                    <div style={{ margin: '0 0 16px 0', whiteSpace: 'pre-line', color: '#d1d5db', fontSize: 13.5 }}>
                      {previewTemplate.preview || 'Your music universe is waiting. Check out the latest releases and updates curated just for you.'}
                    </div>
                    
                    {/* Dynamic Template Preset Renderer */}
                    {previewTemplate.id === 'tpl-1' && (
                      <div style={{ textAlign: 'center', margin: '24px 0' }}>
                        <button type="button" style={{ background: '#b08850', border: 'none', padding: '12px 30px', borderRadius: 25, color: '#000', fontWeight: 'bold', fontSize: 13, cursor: 'default', boxShadow: '0 4px 14px rgba(176, 136, 80,0.3)' }}>
                          🚀 Start Streaming Now
                        </button>
                      </div>
                    )}

                    {previewTemplate.id === 'tpl-2' && (
                      <div style={{ textAlign: 'center', margin: '24px 0' }}>
                        <button type="button" style={{ background: '#a78bfa', border: 'none', padding: '12px 30px', borderRadius: 25, color: '#000', fontWeight: 'bold', fontSize: 13, cursor: 'default', boxShadow: '0 4px 14px rgba(167,139,250,0.3)' }}>
                          🌟 Try Premium Free
                        </button>
                      </div>
                    )}

                    {previewTemplate.id === 'tpl-3' && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '20px 0' }}>
                        {[
                          { label: 'Listening Time', val: '4,820 min', color: '#60a5fa' },
                          { label: 'Top Artist', val: 'Cipher Nova', color: '#b08850' },
                          { label: 'Top Track', val: 'Phantom Signal', color: '#a78bfa' },
                          { label: 'Listening Streak', val: '12 Days', color: '#f59e0b' }
                        ].map(st => (
                          <div key={st.label} style={{ background: '#1c1c1e', border: '1px solid #282828', borderRadius: 8, padding: 12, textAlign: 'center' }}>
                            <div style={{ fontSize: 10, color: '#6b7280' }}>{st.label}</div>
                            <div style={{ fontSize: 13, fontWeight: 'bold', color: st.color, marginTop: 4 }}>{st.val}</div>
                          </div>
                        ))}
                      </div>
                    )}

                    {previewTemplate.id === 'tpl-4' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, margin: '20px 0' }}>
                        {[
                          { title: 'Neon Dreams', artist: 'Aurora Nightfall', type: 'Album' },
                          { title: 'Encrypted', artist: 'Cipher Nova', type: 'Single' },
                          { title: 'Radiant Live', artist: 'Selene Ray', type: 'Sessions' }
                        ].map(album => (
                          <div key={album.title} style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1c1c1e', padding: 8, borderRadius: 8, border: '1px solid #282828' }}>
                            <div style={{ width: 36, height: 36, borderRadius: 4, background: 'linear-gradient(135deg,#333,#111)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>💿</div>
                            <div style={{ flexGrow: 1 }}>
                              <div style={{ fontSize: 12, fontWeight: 'bold', color: '#fff' }}>{album.title}</div>
                              <div style={{ fontSize: 10, color: '#6b7280' }}>{album.artist} • {album.type}</div>
                            </div>
                            <span style={{ fontSize: 14, cursor: 'default' }}>▶️</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {previewTemplate.id === 'tpl-5' && (
                      <div style={{ background: 'rgba(255, 77, 77, 0.1)', border: '1px solid rgba(255, 77, 77, 0.3)', borderRadius: 8, padding: 14, margin: '20px 0' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#ff4d4d', fontWeight: 'bold', fontSize: 13, marginBottom: 8 }}>
                          🚨 Unrecognized Device Login Detected
                        </div>
                        <div style={{ fontSize: 11, color: '#9ca3af', lineHeight: 1.4 }}>
                          If this wasn't you, someone might have access to your credentials. Resetting your security password will kick all active sessions instantly.
                        </div>
                        <div style={{ textAlign: 'center', marginTop: 12 }}>
                          <button type="button" style={{ background: '#ff4d4d', border: 'none', padding: '8px 18px', borderRadius: 20, color: '#fff', fontWeight: 'bold', fontSize: 11, cursor: 'default' }}>
                            Reset Password
                          </button>
                        </div>
                      </div>
                    )}

                    {previewTemplate.id === 'tpl-6' && (
                      <div style={{ background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.3)', borderRadius: 8, padding: 14, margin: '20px 0', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>Exclusive Welcome Back Promo</div>
                        <div style={{ fontSize: 18, fontWeight: '800', color: '#34d399', margin: '6px 0' }}>WELCOMEBACK50</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>Get 50% discount off the next 6 months. Apply at checkout.</div>
                      </div>
                    )}

                    {previewTemplate.id === 'tpl-7' && (
                      <div style={{ background: '#1c1c1e', border: '1px solid #282828', borderRadius: 8, padding: 14, margin: '20px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #282828', paddingBottom: 8, fontSize: 11 }}>
                          <span style={{ color: '#6b7280' }}>Total streams</span>
                          <span style={{ color: '#fff', fontWeight: 'bold' }}>1,280,000 streams</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #282828', paddingTop: 8, paddingBottom: 8, fontSize: 11 }}>
                          <span style={{ color: '#6b7280' }}>Royalty growth</span>
                          <span style={{ color: '#b08850', fontWeight: 'bold' }}>+14% MoM</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, fontSize: 12, fontWeight: 'bold' }}>
                          <span style={{ color: '#fff' }}>Royalty Net payout</span>
                          <span style={{ color: '#b08850' }}>$4,480.00 USD</span>
                        </div>
                      </div>
                    )}

                    {previewTemplate.id === 'tpl-8' && (
                      <div style={{ background: 'linear-gradient(to right, #111, #1a1525)', border: '1px solid #4c1d95', borderRadius: 8, padding: 14, margin: '20px 0', textAlign: 'center' }}>
                        <div style={{ fontSize: 24 }}>🏆</div>
                        <div style={{ fontSize: 14, fontWeight: 'bold', color: '#a78bfa', margin: '6px 0' }}>Playlist curator milestone</div>
                        <div style={{ fontSize: 11, color: '#9ca3af' }}>Your playlist Workout Energy has officially passed 10k followers. Keep rockin'!</div>
                      </div>
                    )}

                    {previewTemplate.id === 'tpl-9' && (
                      <div style={{ background: '#1c1c1e', border: '1px solid #282828', borderRadius: 8, padding: 14, margin: '20px 0' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #282828', paddingBottom: 6, fontSize: 11 }}>
                          <span style={{ color: '#6b7280' }}>Item</span>
                          <span style={{ color: '#fff' }}>Premium Subscription Monthly Plan</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #282828', paddingTop: 6, paddingBottom: 6, fontSize: 11 }}>
                          <span style={{ color: '#6b7280' }}>Charged to</span>
                          <span style={{ color: '#fff' }}>Visa Ending in 4029</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 6, fontSize: 12, fontWeight: 'bold' }}>
                          <span style={{ color: '#fff' }}>Charged total</span>
                          <span style={{ color: '#60a5fa' }}>$9.99 USD</span>
                        </div>
                      </div>
                    )}

                    {previewTemplate.id === 'tpl-10' && (
                      <div style={{ textAlign: 'center', margin: '24px 0' }}>
                        <button type="button" style={{ background: '#f59e0b', border: 'none', padding: '10px 24px', borderRadius: 20, color: '#000', fontWeight: 'bold', fontSize: 12, cursor: 'default', boxShadow: '0 4px 14px rgba(245,158,11,0.3)' }}>
                          ✍️ Start Feedback Survey
                        </button>
                      </div>
                    )}

                    <p style={{ margin: '16px 0 4px 0', fontSize: 13.5 }}>Enjoy your listening,</p>
                    <p style={{ margin: 0, fontWeight: 'bold', color: '#b08850', fontSize: 13.5 }}>The Beato Team</p>
                  </div>

                  {/* Simulated Footer */}
                  <div style={{ background: '#1a1a1a', padding: 16, textAlign: 'center', borderTop: '1px solid #222', fontSize: 11, color: '#48484a' }}>
                    This is an automated message sent to you by Beato.<br />
                    To unsubscribe from these communications, <span style={{ color: '#b08850', cursor: 'default' }}>click here</span>.
                  </div>
                </div>
              </div>

              {/* Close Bar */}
              <div style={{ background: '#121212', padding: '16px 24px', display: 'flex', justifyContent: 'flex-end', borderTop: '1px solid #2a2a2a' }}>
                <button type="button" onClick={() => setShowPreviewModal(false)}
                  style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#b08850', color: '#000', fontWeight: 'bold', fontSize: 13, cursor: 'pointer' }}>
                  Close Preview
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </motion.div>
  );
}
