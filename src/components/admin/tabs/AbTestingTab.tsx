'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Settings, Users, Sparkles, AlertCircle, Trash2, Plus, 
  BarChart2, ShieldCheck, ChevronDown, ChevronUp, RefreshCw, X 
} from 'lucide-react';

const FONT = { fontFamily: "'Inter', 'Outfit', sans-serif" };

type ExpStatus = 'Running' | 'Completed' | 'Paused';

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: ExpStatus;
  started: string;
  variants: { name: string; traffic: number; metric: string; value: string }[];
  primaryMetric: string;
  impact: string;
  winner?: string;
}

interface FeatureFlag {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  rollout: number;
  audience: string;
  whitelist?: string[];
}

const AUDIENCES = ['All', 'Premium', 'Free', 'Artists', 'Beta Testers', 'Internal'];

const statusColor: Record<ExpStatus, { bg: string; color: string }> = {
  Running: { bg: 'rgba(176, 136, 80, 0.1)', color: '#b08850' },
  Completed: { bg: 'rgba(96, 165, 250, 0.1)', color: '#60a5fa' },
  Paused: { bg: 'rgba(245, 158, 11, 0.1)', color: '#f59e0b' },
};

export default function AbTestingTab() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create Experiment States
  const [newExpName, setNewExpName] = useState('');
  const [newExpDesc, setNewExpDesc] = useState('');
  const [newExpMetric, setNewExpMetric] = useState('Conversion');
  const [variantsCount, setVariantsCount] = useState(2); // 2 or 3 or 4 variants

  const [expandedExp, setExpandedExp] = useState<string | null>(null);
  const [expandedFlag, setExpandedFlag] = useState<string | null>(null);

  // Whitelist management
  const [newEmail, setNewEmail] = useState('');

  const fetchAbData = async () => {
    try {
      const res = await fetch('/api/admin/abtests');
      const data = await res.json();
      if (data.success) {
        setExperiments(data.experiments || []);
        setFlags(data.flags || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load experiments and feature flags');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAbData();
  }, []);

  const toggleExpStatus = async (id: string) => {
    try {
      const res = await fetch('/api/admin/abtests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_exp', id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchAbData();
      } else {
        toast.error(data.error || 'Failed to update experiment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error pausing/resuming experiment');
    }
  };

  const archiveExp = async (id: string, name: string) => {
    try {
      const res = await fetch('/api/admin/abtests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'archive_exp', id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`"${name}" archived`);
        fetchAbData();
      } else {
        toast.error(data.error || 'Failed to archive experiment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error archiving experiment');
    }
  };

  const toggleFlag = async (id: string) => {
    try {
      const res = await fetch('/api/admin/abtests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_flag', id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchAbData();
      } else {
        toast.error(data.error || 'Failed to toggle feature flag');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error toggling feature flag');
    }
  };

  const setRollout = async (id: string, val: number) => {
    setFlags(fs => fs.map(f => f.id === id ? { ...f, rollout: val } : f));
    try {
      await fetch('/api/admin/abtests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_rollout', id, rollout: val }),
      });
    } catch (err) {
      console.error('Error saving rollout:', err);
    }
  };

  const setAudience = async (id: string, val: string) => {
    setFlags(fs => fs.map(f => f.id === id ? { ...f, audience: val } : f));
    try {
      const res = await fetch('/api/admin/abtests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_audience', id, audience: val }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Audience updated`);
        fetchAbData();
      }
    } catch (err) {
      console.error('Error saving audience:', err);
    }
  };

  const handleAddWhitelistEmail = async (flagId: string) => {
    if (!newEmail.trim() || !newEmail.includes('@')) {
      toast.error('Please enter a valid user email address');
      return;
    }

    const flag = flags.find(f => f.id === flagId);
    if (!flag) return;

    const currentWhitelist = flag.whitelist || [];
    if (currentWhitelist.includes(newEmail.trim())) {
      toast.error('Email is already whitelisted');
      return;
    }

    const updatedWhitelist = [...currentWhitelist, newEmail.trim()];
    
    // Update local state first
    setFlags(fs => fs.map(f => f.id === flagId ? { ...f, whitelist: updatedWhitelist } : f));
    setNewEmail('');

    try {
      const res = await fetch('/api/admin/abtests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_whitelist', id: flagId, whitelist: updatedWhitelist }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('User overrides updated successfully.');
        fetchAbData();
      } else {
        toast.error('Failed to update whitelist');
      }
    } catch (err) {
      console.error('Error adding to whitelist:', err);
      toast.error('Network error updating whitelist');
    }
  };

  const handleRemoveWhitelistEmail = async (flagId: string, email: string) => {
    const flag = flags.find(f => f.id === flagId);
    if (!flag) return;

    const updatedWhitelist = (flag.whitelist || []).filter(e => e !== email);

    // Update local state first
    setFlags(fs => fs.map(f => f.id === flagId ? { ...f, whitelist: updatedWhitelist } : f));

    try {
      const res = await fetch('/api/admin/abtests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_whitelist', id: flagId, whitelist: updatedWhitelist }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Whitelist overrides updated successfully.');
        fetchAbData();
      } else {
        toast.error('Failed to update whitelist');
      }
    } catch (err) {
      console.error('Error removing from whitelist:', err);
      toast.error('Network error updating whitelist');
    }
  };

  const createExperiment = async () => {
    if (!newExpName.trim()) { toast.error('Experiment name is required'); return; }
    
    // Generate split variants array dynamically based on user selections
    const dynamicVariants = [];
    if (variantsCount === 2) {
      dynamicVariants.push({ name: 'Control', traffic: 50, metric: newExpMetric, value: 'Pending' });
      dynamicVariants.push({ name: 'Variant A', traffic: 50, metric: newExpMetric, value: 'Pending' });
    } else if (variantsCount === 3) {
      dynamicVariants.push({ name: 'Control', traffic: 34, metric: newExpMetric, value: 'Pending' });
      dynamicVariants.push({ name: 'Variant A', traffic: 33, metric: newExpMetric, value: 'Pending' });
      dynamicVariants.push({ name: 'Variant B', traffic: 33, metric: newExpMetric, value: 'Pending' });
    } else {
      dynamicVariants.push({ name: 'Control', traffic: 25, metric: newExpMetric, value: 'Pending' });
      dynamicVariants.push({ name: 'Variant A', traffic: 25, metric: newExpMetric, value: 'Pending' });
      dynamicVariants.push({ name: 'Variant B', traffic: 25, metric: newExpMetric, value: 'Pending' });
      dynamicVariants.push({ name: 'Variant C', traffic: 25, metric: newExpMetric, value: 'Pending' });
    }

    try {
      const res = await fetch('/api/admin/abtests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_exp',
          name: newExpName,
          description: newExpDesc,
          primaryMetric: newExpMetric,
          variants: dynamicVariants
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setShowCreateModal(false);
        setNewExpName('');
        setNewExpDesc('');
        setNewExpMetric('Conversion');
        setVariantsCount(2);
        fetchAbData();
      } else {
        toast.error(data.error || 'Failed to create experiment');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error creating experiment');
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ ...FONT, color: '#e5e7eb', background: 'transparent' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: '#221a15', margin: 0, letterSpacing: '-0.025em', display: 'flex', alignItems: 'center', gap: 10 }}>
            <Sparkles size={24} className="text-emerald-500" />
            A/B Testing & Feature Flags
          </h2>
          <p style={{ color: '#87786c', margin: '4px 0 0', fontSize: 13 }}>Verify user conversion rates & manage progressive rollout rules directly in database.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)}
          style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: '#10b981', color: '#000', fontWeight: 800, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, transition: 'transform 0.2s' }}>
          <Plus size={16} />
          Create Experiment
        </button>
      </div>

      {/* Experiments Grid */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ fontSize: 13, fontWeight: 800, color: '#87786c', textTransform: 'uppercase', letterSpacing: 0.5 }}>Active User Experiments</h3>
          <span style={{ fontSize: 11, color: '#10b981', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
            Database Synced: LIVE
          </span>
        </div>

        {loading && experiments.length === 0 ? (
          <div style={{ color: '#87786c', textAlign: 'center', padding: 40, background: '#ffffff', border: '1px solid rgba(43,34,26,0.07)', borderRadius: 14 }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 10px', color: '#10b981' }} />
            Syncing user test variants...
          </div>
        ) : experiments.length === 0 ? (
          <div style={{ color: '#87786c', textAlign: 'center', padding: 30, background: '#ffffff', border: '1px solid rgba(43,34,26,0.07)', borderRadius: 14, fontSize: 13 }}>
            No experiments found in database. Click "Create Experiment" to start.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {experiments.map((exp, i) => {
              const sc = statusColor[exp.status] || { bg: '#1a1a1a', color: '#221a15' };
              const isExpanded = expandedExp === exp.id;
              
              // Calculate total split traffic check
              const totalTraffic = exp.variants.reduce((sum, v) => sum + v.traffic, 0);

              return (
                <motion.div key={exp.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  style={{ background: '#ffffff', borderRadius: 14, border: '1px solid #1e1e1e', padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', cursor: 'pointer', transition: 'border-color 0.2s', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
                  onClick={() => setExpandedExp(isExpanded ? null : exp.id)}>
                  
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: 15, color: '#221a15', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <BarChart2 size={16} className="text-emerald-500" />
                          {exp.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#87786c', marginTop: 4, lineHeight: 1.4 }}>{exp.description}</div>
                      </div>
                      <span style={{ background: sc.bg, color: sc.color, borderRadius: 6, padding: '3px 8px', fontSize: 10, fontWeight: 700, whiteSpace: 'nowrap', border: `1px solid ${sc.color}22` }}>
                        {exp.status}
                      </span>
                    </div>

                    {/* Variant distributions visualizer */}
                    <div style={{ height: 6, width: '100%', background: '#1c1c1c', borderRadius: 3, display: 'flex', overflow: 'hidden', margin: '14px 0 16px' }}>
                      {exp.variants.map((v, idx) => {
                        const colors = ['#10b981', '#10b981', '#f59e0b', '#10b981'];
                        return (
                          <div 
                            key={v.name} 
                            style={{ 
                              width: `${v.traffic}%`, 
                              background: colors[idx % colors.length], 
                              height: '100%' 
                            }} 
                            title={`${v.name}: ${v.traffic}%`}
                          />
                        );
                      })}
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: `repeat(${exp.variants.length},1fr)`, gap: 8, marginBottom: 16 }}>
                      {exp.variants.map((v, idx) => {
                        const colors = ['#10b981', '#10b981', '#f59e0b', '#10b981'];
                        return (
                          <div key={v.name} style={{ background: '#050505', borderRadius: 8, padding: '10px 12px', border: '1px solid rgba(43,34,26,0.07)', position: 'relative' }}>
                            <div style={{ fontSize: 10, color: '#87786c', display: 'flex', alignItems: 'center', gap: 4 }}>
                              <span style={{ width: 6, height: 6, borderRadius: '50%', background: colors[idx % colors.length] }} />
                              {v.name} · {v.traffic}%
                            </div>
                            <div style={{ fontSize: 14, fontWeight: 800, color: '#221a15', marginTop: 6 }}>{v.value}</div>
                            <div style={{ fontSize: 9, color: '#87786c', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 2 }}>{v.metric}</div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #161616', paddingTop: 14, marginTop: 4 }}>
                    <div style={{ fontSize: 11, color: '#87786c' }}>
                      Metrics: <span style={{ color: '#10b981', fontWeight: 700 }}>{exp.impact} Impact</span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }} onClick={e => e.stopPropagation()}>
                      {exp.status !== 'Completed' && (
                        <button onClick={() => toggleExpStatus(exp.id)}
                          style={{ padding: '5px 10px', borderRadius: 6, border: 'none', background: exp.status === 'Running' ? '#f59e0b15' : '#10b98115', color: exp.status === 'Running' ? '#f59e0b' : '#10b981', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                          {exp.status === 'Running' ? 'Pause' : 'Resume'}
                        </button>
                      )}
                      <button onClick={() => archiveExp(exp.id, exp.name)}
                        style={{ padding: '5px 10px', borderRadius: 6, border: '1px solid #ff4d4d22', background: '#1c0f0f', color: '#ff4d4d', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                        Archive
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Feature Flags */}
      <div>
        <h3 style={{ fontSize: 13, fontWeight: 800, color: '#87786c', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 16 }}>Feature Toggles & Rollouts</h3>
        <div style={{ background: '#ffffff', borderRadius: 14, border: '1px solid rgba(43,34,26,0.07)', overflow: 'hidden' }}>
          {loading && flags.length === 0 ? (
            <div style={{ color: '#87786c', textAlign: 'center', padding: 30 }}>Syncing feature toggles...</div>
          ) : (
            flags.map((flag, i) => {
              const isExpanded = expandedFlag === flag.id;
              const whitelistCount = flag.whitelist?.length || 0;

              return (
                <div key={flag.id} style={{ borderBottom: i < flags.length - 1 ? '1px solid #161616' : 'none' }}>
                  {/* Flag Main Row */}
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                    style={{ display: 'grid', gridTemplateColumns: '1fr 100px 200px 140px 48px', alignItems: 'center', gap: 20, padding: '16px 20px' }}>
                    
                    {/* Switch & Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div onClick={() => toggleFlag(flag.id)}
                        style={{ width: 42, height: 22, borderRadius: 11, background: flag.enabled ? '#10b981' : '#222', cursor: 'pointer', position: 'relative', transition: 'background 0.2s', flexShrink: 0, border: '1px solid rgba(43,34,26,0.12)' }}>
                        <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#000', position: 'absolute', top: 2, left: flag.enabled ? 22 : 2, transition: 'left 0.2s' }} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: flag.enabled ? '#fff' : '#6b7280', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {flag.name}
                          {whitelistCount > 0 && (
                            <span style={{ fontSize: 9, background: '#10b98115', color: '#10b981', padding: '1px 5px', borderRadius: 4, fontWeight: 700 }}>
                              {whitelistCount} Overrides
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 12, color: '#87786c', marginTop: 2 }}>{flag.description}</div>
                      </div>
                    </div>

                    {/* Rollout percentage indicator */}
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: flag.enabled ? '#10b981' : '#4b5563' }}>{flag.rollout}%</div>
                      <div style={{ fontSize: 10, color: '#87786c', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: 1 }}>Target</div>
                    </div>

                    {/* Progressive Range Slider */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 10, color: '#87786c' }}>0</span>
                      <input type="range" min={0} max={100} value={flag.rollout} disabled={!flag.enabled}
                        onChange={e => setRollout(flag.id, Number(e.target.value))}
                        style={{ flex: 1, accentColor: '#10b981', cursor: flag.enabled ? 'pointer' : 'not-allowed', opacity: flag.enabled ? 1 : 0.3 }} />
                      <span style={{ fontSize: 10, color: '#87786c' }}>100</span>
                    </div>

                    {/* Target Audience Dropdown */}
                    <select value={flag.audience} onChange={e => setAudience(flag.id, e.target.value)}
                      style={{ background: '#050505', border: '1px solid rgba(43,34,26,0.07)', borderRadius: 8, padding: '6px 10px', color: '#a0958b', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
                      {AUDIENCES.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>

                    {/* Expand overrides panel */}
                    <button 
                      onClick={() => setExpandedFlag(isExpanded ? null : flag.id)}
                      style={{ background: 'transparent', border: 'none', color: '#87786c', cursor: 'pointer', display: 'flex', justifyContent: 'center' }}
                      title="Manage Whitelist User Overrides"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <Settings size={16} />}
                    </button>
                  </motion.div>

                  {/* Whitelist Panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ overflow: 'hidden', background: '#ffffff', borderTop: '1px solid #141414', borderBottom: '1px solid #141414' }}
                      >
                        <div style={{ padding: '16px 20px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#221a15', fontSize: 12, fontWeight: 700, marginBottom: 12 }}>
                            <ShieldCheck size={14} className="text-emerald-500" />
                            Target User Whitelist Override Console
                          </div>
                          
                          <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
                            <input 
                              value={newEmail}
                              onChange={e => setNewEmail(e.target.value)}
                              placeholder="Enter user email to bypass rollout rules (e.g. manoj@beato.io)..."
                              style={{ flex: 1, background: '#020202', border: '1px solid rgba(43,34,26,0.07)', borderRadius: 8, padding: '8px 12px', color: '#221a15', fontSize: 12, outline: 'none' }}
                            />
                            <button 
                              onClick={() => handleAddWhitelistEmail(flag.id)}
                              style={{ background: '#10b981', color: '#000', border: 'none', padding: '0 16px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                            >
                              Add Overrides
                            </button>
                          </div>

                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {flag.whitelist && flag.whitelist.length > 0 ? (
                              flag.whitelist.map(email => (
                                <span key={email} style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#ffffff', border: '1px solid rgba(43,34,26,0.07)', borderRadius: 6, padding: '4px 8px', fontSize: 11, color: '#221a15' }}>
                                  <Users size={12} className="text-zinc-500" />
                                  {email}
                                  <button 
                                    onClick={() => handleRemoveWhitelistEmail(flag.id, email)}
                                    style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}
                                  >
                                    <X size={12} />
                                  </button>
                                </span>
                              ))
                            ) : (
                              <div style={{ color: '#87786c', fontSize: 11 }}>
                                No active overrides. Users will be targeted purely according to the rollout slider rules.
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Create Experiment Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowCreateModal(false)}>
            <motion.div initial={{ scale: 0.94, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.94, opacity: 0 }}
              style={{ background: '#ffffff', borderRadius: 16, border: '1px solid rgba(43,34,26,0.07)', padding: 24, width: 440, maxWidth: '95vw' }}
              onClick={e => e.stopPropagation()}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#221a15', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Sparkles size={18} className="text-emerald-500" />
                  Launch New Experiment
                </h3>
                <button onClick={() => setShowCreateModal(false)} style={{ background: 'transparent', border: 'none', color: '#87786c', cursor: 'pointer' }}>
                  <X size={18} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div>
                  <label style={{ fontSize: 11, color: '#87786c', display: 'block', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600 }}>Experiment Name *</label>
                  <input value={newExpName} onChange={e => setNewExpName(e.target.value)} placeholder="e.g. Redesigned Premium Upsell Banner"
                    style={{ width: '100%', background: '#050505', border: '1px solid rgba(43,34,26,0.07)', borderRadius: 8, padding: '10px 12px', color: '#221a15', fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
                </div>
                
                <div>
                  <label style={{ fontSize: 11, color: '#87786c', display: 'block', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600 }}>Description</label>
                  <textarea value={newExpDesc} onChange={e => setNewExpDesc(e.target.value)} rows={2} placeholder="Explain variant rules (e.g. testing banner conversions)"
                    style={{ width: '100%', background: '#050505', border: '1px solid rgba(43,34,26,0.07)', borderRadius: 8, padding: '10px 12px', color: '#221a15', fontSize: 13, outline: 'none', resize: 'none', boxSizing: 'border-box' }} />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#87786c', display: 'block', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600 }}>Target Metric</label>
                    <select value={newExpMetric} onChange={e => setNewExpMetric(e.target.value)}
                      style={{ width: '100%', background: '#050505', border: '1px solid rgba(43,34,26,0.07)', borderRadius: 8, padding: '9px 10px', color: '#a0958b', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                      <option value="Conversion">Conversion Rate</option>
                      <option value="Revenue">Revenue Conversion</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#87786c', display: 'block', marginBottom: 6, textTransform: 'uppercase', fontWeight: 600 }}>Split Groups</label>
                    <select value={variantsCount} onChange={e => setVariantsCount(Number(e.target.value))}
                      style={{ width: '100%', background: '#050505', border: '1px solid rgba(43,34,26,0.07)', borderRadius: 8, padding: '9px 10px', color: '#a0958b', fontSize: 13, outline: 'none', cursor: 'pointer' }}>
                      <option value={2}>A/B (2 Variants)</option>
                      <option value={3}>A/B/C (3 Variants)</option>
                      <option value={4}>A/B/C/D (4 Variants)</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
                  <button onClick={() => setShowCreateModal(false)}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: '1px solid rgba(43,34,26,0.07)', background: '#ffffff', color: '#a0958b', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                    Cancel
                  </button>
                  <button onClick={createExperiment}
                    style={{ flex: 1, padding: '10px 0', borderRadius: 8, border: 'none', background: '#10b981', color: '#000', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>
                    Launch Test
                  </button>
                </div>
              </div>

            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
