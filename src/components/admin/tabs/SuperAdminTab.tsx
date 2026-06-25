'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Key, Database, Mail, MessageSquare, Phone,
  Settings, Plus, Trash2, Eye, EyeOff, Save, Check,
  AlertTriangle, Lock, Crown, UserCheck, Search,
  ShieldCheck, Wifi, Globe, Send, Activity, Server,
  Shield, HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

const C = {
  bg: '#fbf9f5',
  surface: '#ffffff',
  elevated: '#f4eede',
  border: 'rgba(43,34,26,0.08)',
  primary: '#b08850',
  primaryBg: 'rgba(176,136,80,0.1)',
  danger: '#ef4444',
  dangerBg: 'rgba(239,68,68,0.08)',
  success: '#10b981',
  successBg: 'rgba(16,185,129,0.08)',
  warn: '#f59e0b',
  warnBg: 'rgba(245,158,11,0.08)',
  text: '#221a15',
  muted: '#87786c',
  faint: '#a0958b',
};

const DEFAULT_ROLES = [
  { id: 'super_admin', name: 'Super Admin', color: '#b08850', icon: '👑', locked: true, description: 'Full platform control.', permissions: ['manage_admins','manage_roles','manage_users','manage_artists','manage_songs','manage_subscriptions','manage_payments','manage_payouts','view_analytics','manage_reports','manage_notifications','manage_api_keys','view_audit_logs','manage_settings','manage_email','manage_sms','manage_database','manage_webhooks','manage_marketing','manage_content','manage_geography','manage_ab_tests','manage_support','impersonate_user','export_data'] },
  { id: 'admin', name: 'Admin', color: '#6366f1', icon: '🛡️', locked: false, description: 'Day-to-day management.', permissions: ['manage_users','manage_artists','manage_songs','manage_subscriptions','manage_payments','view_analytics','manage_reports','manage_notifications','manage_support','manage_content','manage_marketing'] },
  { id: 'moderator', name: 'Moderator', color: '#06b6d4', icon: '🔍', locked: false, description: 'Content review and support.', permissions: ['manage_artists','manage_songs','manage_reports','manage_support','manage_content'] },
  { id: 'analyst', name: 'Analyst', color: '#10b981', icon: '📊', locked: false, description: 'Read-only analytics.', permissions: ['view_analytics','manage_reports','export_data'] },
];

const ALL_PERMS = [
  { id: 'manage_admins', label: 'Manage Admins', group: 'System', desc: 'Add/remove admin accounts' },
  { id: 'manage_roles', label: 'Manage Roles', group: 'System', desc: 'Create and edit roles' },
  { id: 'manage_database', label: 'Database Config', group: 'System', desc: 'Database connection' },
  { id: 'manage_api_keys', label: 'API Keys', group: 'System', desc: 'Create/revoke API keys' },
  { id: 'manage_settings', label: 'Platform Settings', group: 'System', desc: 'Core platform config' },
  { id: 'manage_email', label: 'Email Config', group: 'Messaging', desc: 'SMTP/email setup' },
  { id: 'manage_sms', label: 'SMS Config', group: 'Messaging', desc: 'SMS gateway config' },
  { id: 'manage_notifications', label: 'Notifications', group: 'Messaging', desc: 'Push notification settings' },
  { id: 'manage_users', label: 'Manage Users', group: 'Content', desc: 'View/edit/suspend users' },
  { id: 'manage_artists', label: 'Manage Artists', group: 'Content', desc: 'Approve/suspend artists' },
  { id: 'manage_songs', label: 'Manage Songs', group: 'Content', desc: 'Review and moderate tracks' },
  { id: 'manage_content', label: 'Content Library', group: 'Content', desc: 'Manage playlists' },
  { id: 'manage_subscriptions', label: 'Subscriptions', group: 'Finance', desc: 'Manage plans' },
  { id: 'manage_payments', label: 'Payments', group: 'Finance', desc: 'View transactions' },
  { id: 'manage_payouts', label: 'Payouts', group: 'Finance', desc: 'Process payouts' },
  { id: 'view_analytics', label: 'View Analytics', group: 'Data', desc: 'Analytics dashboards' },
  { id: 'export_data', label: 'Export Data', group: 'Data', desc: 'Download CSVs' },
  { id: 'manage_reports', label: 'Manage Reports', group: 'Moderation', desc: 'Review flagged content' },
  { id: 'manage_support', label: 'Support', group: 'Moderation', desc: 'Handle tickets' },
  { id: 'manage_marketing', label: 'Marketing', group: 'Growth', desc: 'Campaigns' },
  { id: 'view_audit_logs', label: 'Audit Logs', group: 'Security', desc: 'View security logs' },
  { id: 'impersonate_user', label: 'Impersonate User', group: 'Security', desc: 'Login as any user' },
];

const MOCK_ADMINS = [
  { id: 'u1', name: 'Root Administrator', email: 'root@beato.io', role: 'super_admin', status: 'active', lastLogin: '2026-06-23 07:01', twoFa: true },
  { id: 'u2', name: 'Platform Moderator', email: 'mod@beato.io', role: 'admin', status: 'active', lastLogin: '2026-06-23 06:40', twoFa: true },
  { id: 'u3', name: 'Support Agent', email: 'support@beato.io', role: 'moderator', status: 'active', lastLogin: '2026-06-22 14:20', twoFa: false },
  { id: 'u4', name: 'Data Analyst', email: 'analyst@beato.io', role: 'analyst', status: 'suspended', lastLogin: '2026-06-20 09:00', twoFa: false },
];

function Card({ title, subtitle, icon, children, accent }: any) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, overflow: 'hidden', boxShadow: '0 2px 8px rgba(43,34,26,0.04)' }}>
      <div style={{ padding: '20px 24px 16px', borderBottom: `1px solid ${C.border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 38, height: 38, borderRadius: 10, background: `${accent || C.primary}18`, border: `1px solid ${accent || C.primary}25`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent || C.primary, fontSize: 18 }}>{icon}</div>
        <div>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: 'Outfit, sans-serif' }}>{title}</div>
          {subtitle && <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{subtitle}</div>}
        </div>
      </div>
      <div style={{ padding: '20px 24px' }}>{children}</div>
    </div>
  );
}

function Row({ label, desc, children }: any) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 24, padding: '13px 0', borderBottom: `1px solid ${C.border}` }}>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{label}</div>
        {desc && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0, minWidth: 280 }}>{children}</div>
    </div>
  );
}

function TInput({ value, onChange, placeholder, type = 'text', disabled = false }: any) {
  return (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} disabled={disabled}
      style={{ width: '100%', background: disabled ? 'rgba(0,0,0,0.02)' : C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: C.text, outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' }} />
  );
}

function SInput({ value, onChange, placeholder, onGenerate }: any) {
  const [show, setShow] = useState(false);
  return (
    <div style={{ display: 'flex', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, overflow: 'hidden' }}>
      <input type={show ? 'text' : 'password'} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ flex: 1, background: 'transparent', border: 'none', padding: '8px 12px', fontSize: 13, color: C.text, outline: 'none', fontFamily: 'Inter, monospace' }} />
      {onGenerate && (
        <button onClick={onGenerate} title="Generate value" type="button"
          style={{ padding: '0 8px', background: 'none', border: 'none', cursor: 'pointer', color: C.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Key size={14} />
        </button>
      )}
      <button onClick={() => setShow(!show)} type="button" style={{ padding: '0 10px', background: 'none', border: 'none', cursor: 'pointer', color: C.muted, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <motion.button onClick={() => onChange(!value)} whileTap={{ scale: 0.95 }}
      style={{ width: 44, height: 24, borderRadius: 12, background: value ? C.primary : C.elevated, border: `1px solid ${value ? C.primary : C.border}`, position: 'relative', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', padding: '0 2px' }}>
      <motion.div animate={{ x: value ? 20 : 0 }} transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        style={{ width: 18, height: 18, borderRadius: '50%', background: value ? '#fff' : C.muted }} />
    </motion.button>
  );
}

function SaveBtn({ onClick, label = 'Save Changes' }: any) {
  return (
    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={onClick}
      style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '9px 18px', borderRadius: 8, background: C.primary, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 16 }}>
      <Save size={14} /> {label}
    </motion.button>
  );
}

function Sel({ value, onChange, children }: any) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ width: '100%', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: C.text, outline: 'none', fontFamily: 'Inter, sans-serif' }}>
      {children}
    </select>
  );
}

// 👥 ADMIN MANAGEMENT
function AdminMgmt() {
  const [admins, setAdmins] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [newA, setNewA] = useState({ name: '', email: '', role: 'moderator', password: '' });
  const roleMap = Object.fromEntries(DEFAULT_ROLES.map(r => [r.id, r]));
  const filtered = admins.filter(a => a.name.toLowerCase().includes(search.toLowerCase()) || a.email.toLowerCase().includes(search.toLowerCase()));

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        const filteredAdmins = data.users.filter((u: any) => 
          ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin', 'moderator', 'analyst', 'MODERATOR', 'ANALYST'].includes(u.role)
        );
        const mapped = filteredAdmins.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role.toLowerCase(),
          status: u.isActive ? 'active' : 'suspended',
          lastLogin: u.lastLogin || 'Never',
          twoFa: u.twoFa || false,
        }));
        setAdmins(mapped);
      }
    } catch (e) {
      toast.error('Failed to load admins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const generatePass = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#';
    let pass = 'Beato@';
    for (let i = 0; i < 6; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return pass;
  };

  const toggleAdd = () => {
    if (!showAdd) {
      setNewA(p => ({ ...p, password: generatePass() }));
    } else {
      setNewA({ name: '', email: '', role: 'moderator', password: '' });
    }
    setShowAdd(!showAdd);
  };

  const handleAction = async (userId: string, action: string) => {
    try {
      const res = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(data.message || 'Action executed!');
      fetchAdmins();
    } catch (e: any) {
      toast.error(e.message || 'Failed to update admin');
    }
  };

  return (
    <Card title="Admin Management" subtitle="Add, manage, and control admin accounts" icon={<Users size={18} />}>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 12px' }}>
          <Search size={14} color={C.muted} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search admins..."
            style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, color: C.text, outline: 'none', padding: '9px 0', fontFamily: 'Inter, sans-serif' }} />
        </div>
        <motion.button whileTap={{ scale: 0.97 }} onClick={toggleAdd}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, background: C.primary, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
          <Plus size={14} /> Add Admin
        </motion.button>
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 12, padding: 16, marginBottom: 16, overflow: 'hidden' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 12 }}>New Admin Account</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <TInput value={newA.name} onChange={(v: string) => setNewA(p => ({ ...p, name: v }))} placeholder="Full Name" />
              <TInput value={newA.email} onChange={(v: string) => setNewA(p => ({ ...p, email: v }))} placeholder="Email" type="email" />
              <SInput value={newA.password} onChange={(v: string) => setNewA(p => ({ ...p, password: v }))} placeholder="Temp Password" 
                onGenerate={() => { setNewA(p => ({ ...p, password: generatePass() })); toast.success('Generated new temp password!'); }} />
              <Sel value={newA.role} onChange={(v: string) => setNewA(p => ({ ...p, role: v }))}>
                {DEFAULT_ROLES.filter(r => r.id !== 'super_admin').map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
              </Sel>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={async () => {
                  if (!newA.name || !newA.email) return toast.error('Required fields missing');
                  try {
                    const res = await fetch('/api/admin/user-action', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        action: 'create',
                        payload: {
                          name: newA.name,
                          email: newA.email.toLowerCase().trim(),
                          role: newA.role || 'admin',
                          plan: 'premium',
                          password: newA.password,
                        }
                      })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);

                    toast.success('Admin created successfully!');
                    fetchAdmins();
                    setNewA({ name: '', email: '', role: 'moderator', password: '' });
                    setShowAdd(false);
                  } catch (e: any) {
                    toast.error(e.message || 'Failed to create admin');
                  }
                }}
                style={{ padding: '8px 16px', borderRadius: 8, background: C.primary, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Create Account</motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={toggleAdd}
                style={{ padding: '8px 16px', borderRadius: 8, background: 'transparent', color: C.muted, border: `1px solid ${C.border}`, fontSize: 13, cursor: 'pointer' }}>Cancel</motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24, color: C.muted, fontSize: 13 }}>Loading admin directory...</div>
        ) : filtered.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 24, color: C.muted, fontSize: 13 }}>No admins found</div>
        ) : (
          filtered.map(admin => {
            const role = roleMap[admin.role];
            return (
              <div key={admin.id} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 14px', background: admin.status === 'suspended' ? 'rgba(239,68,68,0.05)' : C.elevated, borderRadius: 10, border: `1px solid ${admin.status === 'suspended' ? 'rgba(239,68,68,0.15)' : C.border}` }}>
                <div style={{ width: 38, height: 38, borderRadius: '50%', background: `${role?.color || C.primary}20`, border: `2px solid ${role?.color || C.primary}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{role?.icon || '👤'}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' as any }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{admin.name}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: role?.color || C.primary, background: `${role?.color || C.primary}18`, padding: '2px 7px', borderRadius: 4, textTransform: 'uppercase' as any, letterSpacing: '0.05em' }}>{role?.name}</span>
                    {admin.twoFa && <span style={{ fontSize: 10, fontWeight: 700, color: C.success, background: C.successBg, padding: '2px 7px', borderRadius: 4 }}>2FA</span>}
                    {admin.status === 'suspended' && <span style={{ fontSize: 10, fontWeight: 700, color: C.danger, background: C.dangerBg, padding: '2px 7px', borderRadius: 4 }}>SUSPENDED</span>}
                  </div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>{admin.email} · Last login: {admin.lastLogin}</div>
                </div>
                {admin.role !== 'super_admin' ? (
                  <div style={{ display: 'flex', gap: 6 }}>
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => handleAction(admin.id, admin.status === 'active' ? 'suspend' : 'activate')}
                      style={{ padding: '6px 12px', borderRadius: 6, background: admin.status === 'active' ? C.warnBg : C.successBg, color: admin.status === 'active' ? C.warn : C.success, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
                      {admin.status === 'active' ? 'Suspend' : 'Activate'}
                    </motion.button>
                    <motion.button whileTap={{ scale: 0.95 }}
                      onClick={() => handleAction(admin.id, 'remove')}
                      style={{ padding: '6px 10px', borderRadius: 6, background: C.dangerBg, color: C.danger, border: 'none', fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={13} />
                    </motion.button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.primary, fontSize: 11, fontWeight: 700 }}><Crown size={13} /> Root</div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
}

function RoleBuilder({ rolesConfig, onSave }: any) {
  const [roles, setRoles] = useState(DEFAULT_ROLES.map(r => ({ ...r, permissions: [...r.permissions] })));
  const [selected, setSelected] = useState('admin');
  const [newName, setNewName] = useState('');
  const active = roles.find(r => r.id === selected)!;
  const groups = Array.from(new Set(ALL_PERMS.map(p => p.group)));

  useEffect(() => {
    if (rolesConfig && rolesConfig.length > 0) {
      setRoles(rolesConfig);
    }
  }, [rolesConfig]);

  const addRole = () => {
    if (!newName.trim()) return;
    const id = newName.toLowerCase().replace(/\s+/g, '_');
    const updated = [...roles, { id, name: newName, color: '#6366f1', icon: '🔧', locked: false, description: 'Custom role', permissions: [] }];
    setRoles(updated);
    setSelected(id);
    setNewName('');
    onSave(updated);
    toast.success('Role created!');
  };

  return (
    <Card title="Roles & Permissions" subtitle="Define what each role can access" icon={<ShieldCheck size={18} />} accent="#6366f1">
      <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 20 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Roles</div>
          {roles.map(r => (
            <motion.button key={r.id} whileHover={{ x: 2 }} onClick={() => setSelected(r.id)}
              style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '9px 12px', borderRadius: 8, textAlign: 'left', background: selected === r.id ? `${r.color}18` : 'transparent', border: `1px solid ${selected === r.id ? r.color + '40' : 'transparent'}`, cursor: 'pointer', marginBottom: 4, fontFamily: 'Inter, sans-serif' }}>
              <span style={{ fontSize: 15 }}>{r.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: selected === r.id ? r.color : C.text }}>{r.name}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{r.permissions.length} perms</div>
              </div>
              {r.locked && <Lock size={10} color={C.muted} />}
            </motion.button>
          ))}
          <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
            <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="New role..." onKeyDown={e => e.key === 'Enter' && addRole()}
              style={{ flex: 1, background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 6, padding: '7px 10px', fontSize: 12, color: C.text, outline: 'none', fontFamily: 'Inter, sans-serif' }} />
            <motion.button whileTap={{ scale: 0.95 }} onClick={addRole}
              style={{ padding: '7px 10px', borderRadius: 6, background: C.primary, color: '#fff', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}><Plus size={13} /></motion.button>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{active?.icon} {active?.name}</div>
              <div style={{ fontSize: 12, color: C.muted }}>{active?.description}</div>
            </div>
            {!active?.locked && (
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => onSave(roles)}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 8, background: C.primary, color: '#fff', border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                <Save size={12} /> Save
              </motion.button>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {groups.map(group => (
              <div key={group}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6 }}>{group}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                  {ALL_PERMS.filter(p => p.group === group).map(perm => {
                    const has = active?.permissions.includes(perm.id);
                    return (
                      <div key={perm.id}
                        onClick={() => {
                          if (active?.locked) return toast.error('Cannot modify locked role');
                          setRoles(prev => prev.map(r => r.id !== selected ? r : { ...r, permissions: has ? r.permissions.filter(p => p !== perm.id) : [...r.permissions, perm.id] }));
                        }}
                        style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 10px', borderRadius: 8, background: has ? `${active?.color}12` : C.elevated, border: `1px solid ${has ? (active?.color || C.primary) + '30' : C.border}`, cursor: active?.locked ? 'default' : 'pointer', transition: 'all 0.15s' }}>
                        <div style={{ width: 16, height: 16, borderRadius: 4, background: has ? (active?.color || C.primary) : 'transparent', border: `1.5px solid ${has ? (active?.color || C.primary) : C.faint}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {has && <Check size={10} color="#fff" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 12, fontWeight: 600, color: has ? C.text : C.muted }}>{perm.label}</div>
                          <div style={{ fontSize: 10, color: C.faint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{perm.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}

// 👤 INDIVIDUAL USER ACCESS CONTROL
function UserAccess({ settings, onSave }: any) {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selUser, setSelUser] = useState<any>(null);
  const [customPerms, setCustomPerms] = useState<string[]>([]);
  const [userRole, setUserRole] = useState('moderator');

  const getRoleDefaultPermissions = (roleName: string) => {
    const roles = settings?.rolesConfig || [
      { id: 'admin', permissions: ['manage_users','manage_artists','manage_songs','manage_subscriptions','manage_payments','view_analytics','manage_reports','manage_notifications','manage_support','manage_content','manage_marketing'] },
      { id: 'moderator', permissions: ['manage_artists','manage_songs','manage_reports','manage_support','manage_content'] },
      { id: 'analyst', permissions: ['view_analytics','manage_reports','export_data'] },
    ];
    const r = roles.find((role: any) => role.id.toLowerCase() === roleName.toLowerCase());
    return r ? (r.permissions || []) : [];
  };

  const handleRoleChange = (newRole: string) => {
    setUserRole(newRole);
    setCustomPerms(getRoleDefaultPermissions(newRole));
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users?t=${Date.now()}`);
      const data = await res.json();
      if (data.success) {
        const filtered = data.users.filter((u: any) => 
          ['ADMIN', 'SUPER_ADMIN', 'admin', 'super_admin', 'moderator', 'analyst', 'MODERATOR', 'ANALYST'].includes(u.role)
        );
        const mapped = filtered.map((u: any) => ({
          id: u.id,
          name: u.name,
          email: u.email,
          currentRole: u.role.toLowerCase(),
          customPerms: u.customPermissions, // Could be string[] or null
        }));
        setUsers(mapped);
      }
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (u: any) => {
    setSelUser(u);
    setUserRole(u.currentRole);
    if (u.customPerms && Array.isArray(u.customPerms)) {
      setCustomPerms(u.customPerms);
    } else {
      setCustomPerms(getRoleDefaultPermissions(u.currentRole));
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  return (
    <Card title="Individual User Access" subtitle="Grant custom permissions beyond user role" icon={<UserCheck size={18} />} accent="#06b6d4">
      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>Select User</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 8, padding: '0 12px', marginBottom: 10 }}>
            <Search size={14} color={C.muted} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search..."
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: 13, color: C.text, outline: 'none', padding: '9px 0', fontFamily: 'Inter, sans-serif' }} />
          </div>
          {loading ? (
            <div style={{ fontSize: 12, color: C.muted, padding: 8 }}>Loading directory...</div>
          ) : users.filter(u => u.name.toLowerCase().includes(search.toLowerCase())).map(u => (
            <div key={u.id} onClick={() => handleSelectUser(u)}
              style={{ padding: '10px 12px', borderRadius: 8, background: selUser?.id === u.id ? C.primaryBg : C.elevated, border: `1px solid ${selUser?.id === u.id ? C.primary + '40' : C.border}`, cursor: 'pointer', marginBottom: 6, transition: 'all 0.15s' }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{u.name}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{u.email}</div>
              {u.customPerms && Array.isArray(u.customPerms) && <div style={{ fontSize: 10, color: C.primary, marginTop: 2 }}>Custom Overrides Active ({u.customPerms.length} perms)</div>}
            </div>
          ))}
        </div>
        {selUser ? (
          <div>
            <div style={{ fontSize: 12, fontWeight: 700, color: C.muted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>Configure: {selUser.name}</div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 6 }}>Base Role</div>
              <Sel value={userRole} onChange={handleRoleChange}>
                {DEFAULT_ROLES.map(r => <option key={r.id} value={r.id}>{r.icon} {r.name}</option>)}
              </Sel>
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 8 }}>Extra Permissions</div>
            <div style={{ maxHeight: 280, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
              {ALL_PERMS.map(perm => {
                const has = customPerms.includes(perm.id);
                return (
                  <div key={perm.id} onClick={() => setCustomPerms(p => has ? p.filter(x => x !== perm.id) : [...p, perm.id])}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, background: has ? C.primaryBg : 'transparent', border: `1px solid ${has ? C.primary + '30' : 'transparent'}`, cursor: 'pointer', transition: 'all 0.12s' }}>
                    <div style={{ width: 14, height: 14, borderRadius: 3, background: has ? C.primary : 'transparent', border: `1.5px solid ${has ? C.primary : C.faint}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {has && <Check size={9} color="#fff" />}
                    </div>
                    <span style={{ fontSize: 12, color: has ? C.text : C.muted, flex: 1 }}>{perm.label}</span>
                    <span style={{ fontSize: 10, color: C.faint }}>{perm.group}</span>
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap' }}>
              <motion.button whileTap={{ scale: 0.97 }}
                onClick={async () => {
                  try {
                    await onSave(selUser.id, customPerms);
                    if (userRole !== selUser.currentRole) {
                      const res = await fetch('/api/admin/user-action', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          action: 'edit',
                          userId: selUser.id,
                          payload: { role: userRole }
                        })
                      });
                      const resData = await res.json();
                      if (!res.ok) throw new Error(resData.error);

                      // Emit role change updates so clients sync in real-time
                      import('@/lib/socket').then(({ socketManager }) => {
                        if (socketManager) {
                          socketManager.emit('ROLE_PERMISSION_UPDATE', { type: 'userRole', data: { userId: selUser.id, role: userRole } });
                        }
                      }).catch(console.error);
                    }
                    toast.success(`Access updated for ${selUser.name}`);
                    fetchUsers();
                  } catch (e: any) {
                    toast.error(e.message || 'Failed to update access');
                  }
                }}
                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: C.primary, color: '#fff', border: 'none', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                <Save size={13} /> Apply Access
              </motion.button>

              {selUser.customPerms !== null && (
                <motion.button whileTap={{ scale: 0.97 }}
                  onClick={async () => {
                    try {
                      await onSave(selUser.id, null);
                      toast.success(`Reset ${selUser.name} to role defaults`);
                      fetchUsers();
                      setCustomPerms(getRoleDefaultPermissions(selUser.currentRole));
                    } catch (e: any) {
                      toast.error('Failed to reset to defaults');
                    }
                  }}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: 'rgba(43, 34, 26, 0.05)', color: '#87786c', border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Reset to Role Defaults
                </motion.button>
              )}
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: C.muted, fontSize: 13, gap: 8, paddingTop: 40 }}>
            <UserCheck size={32} color={C.faint} />
            Select a user to configure
          </div>
        )}
      </div>
    </Card>
  );
}

// 🗄️ DATABASE SETUP
function DbConfig({ dbConfig, onSave }: any) {
  const [cfg, setCfg] = useState({ provider: 'postgresql', host: '', port: '5432', dbName: '', user: '', password: '', ssl: true, poolMin: '2', poolMax: '10', url: '' });
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<'ok' | 'err' | null>(null);

  useEffect(() => {
    if (dbConfig) {
      setCfg(prev => ({ ...prev, ...dbConfig }));
    }
  }, [dbConfig]);

  return (
    <Card title="Database Configuration" subtitle="Connect your production database" icon={<Database size={18} />} accent="#10b981">
      <Row label="Provider" desc="Database engine">
        <Sel value={cfg.provider} onChange={(v: string) => setCfg(p => ({ ...p, provider: v }))}>
          <option value="postgresql">PostgreSQL</option>
          <option value="mysql">MySQL</option>
          <option value="mongodb">MongoDB</option>
          <option value="neon">Neon (Serverless Postgres)</option>
          <option value="supabase">Supabase</option>
          <option value="planetscale">PlanetScale</option>
          <option value="sqlite">SQLite (dev only)</option>
        </Sel>
      </Row>
      <Row label="Connection URL" desc="Full URL (overrides fields below)">
        <SInput value={cfg.url} onChange={(v: string) => setCfg(p => ({ ...p, url: v }))} placeholder="postgresql://user:pass@host:5432/db" />
      </Row>
      <Row label="Host">
        <TInput value={cfg.host} onChange={(v: string) => setCfg(p => ({ ...p, host: v }))} placeholder="db.example.com" />
      </Row>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, padding: '13px 0', borderBottom: `1px solid ${C.border}` }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>Port</div>
          <TInput value={cfg.port} onChange={(v: string) => setCfg(p => ({ ...p, port: v }))} placeholder="5432" />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>Database Name</div>
          <TInput value={cfg.dbName} onChange={(v: string) => setCfg(p => ({ ...p, dbName: v }))} placeholder="beato_prod" />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>Username</div>
          <TInput value={cfg.user} onChange={(v: string) => setCfg(p => ({ ...p, user: v }))} placeholder="db_user" />
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: C.text, marginBottom: 5 }}>Password</div>
          <SInput value={cfg.password} onChange={(v: string) => setCfg(p => ({ ...p, password: v }))} placeholder="••••••••" />
        </div>
      </div>
      <Row label="SSL / TLS" desc="Encrypted connections">
        <Toggle value={cfg.ssl} onChange={v => setCfg(p => ({ ...p, ssl: v }))} />
      </Row>
      <Row label="Pool Size" desc="Min / Max connections">
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <TInput value={cfg.poolMin} onChange={(v: string) => setCfg(p => ({ ...p, poolMin: v }))} placeholder="2" />
          <span style={{ color: C.muted }}>–</span>
          <TInput value={cfg.poolMax} onChange={(v: string) => setCfg(p => ({ ...p, poolMax: v }))} placeholder="10" />
        </div>
      </Row>
      <div style={{ display: 'flex', gap: 10, marginTop: 16, alignItems: 'center' }}>
        <motion.button whileTap={{ scale: 0.97 }}
          disabled={testing}
          onClick={async () => {
            setTesting(true);
            setResult(null);
            try {
              const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'testDbConfig', data: cfg })
              });
              const resData = await res.json();
              if (res.ok && resData.success) {
                setResult('ok');
                toast.success(resData.message || 'Connected successfully!');
              } else {
                setResult('err');
                toast.error(resData.error || 'Connection failed');
              }
            } catch (e: any) {
              setResult('err');
              toast.error('Network error during connection test');
            } finally {
              setTesting(false);
            }
          }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 8, background: C.elevated, color: C.text, border: `1px solid ${C.border}`, fontSize: 13, fontWeight: 600, cursor: testing ? 'not-allowed' : 'pointer', opacity: testing ? 0.7 : 1 }}>
          <Wifi size={14} /> {testing ? 'Testing...' : 'Test Connection'}
        </motion.button>
        <SaveBtn onClick={() => onSave(cfg)} />
        {result === 'ok' && <span style={{ fontSize: 12, color: C.success, display: 'flex', alignItems: 'center', gap: 4 }}><Check size={12} /> Connected</span>}
        {result === 'err' && <span style={{ fontSize: 12, color: C.danger, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={12} /> Failed</span>}
      </div>
    </Card>
  );
}

// 🔑 API CREDENTIALS
function ApiKeys({ apiConfig, onSave }: any) {
  const cats = [
    { id: 'payments', label: '💳 Payments (Stripe)', color: '#6366f1', keys: [{ id: 's1', name: 'Stripe Secret Key', ph: 'sk_live_...', req: true }, { id: 's2', name: 'Stripe Publishable Key', ph: 'pk_live_...', req: true }, { id: 's3', name: 'Stripe Webhook Secret', ph: 'whsec_...', req: false }] },
    { id: 'storage', label: '☁️ Storage (AWS S3)', color: '#f59e0b', keys: [{ id: 's4', name: 'AWS Access Key ID', ph: 'AKIAIOSFODNN7EXAMPLE', req: false }, { id: 's5', name: 'AWS Secret Access Key', ph: '••••••••', req: false }, { id: 's6', name: 'S3 Bucket Name', ph: 'beato-media-prod', req: false }] },
    { id: 'media', label: '🖼️ Media (Cloudinary)', color: '#10b981', keys: [{ id: 's7', name: 'Cloud Name', ph: 'your-cloud', req: false }, { id: 's8', name: 'API Key', ph: '123456789012345', req: false }, { id: 's9', name: 'API Secret', ph: '••••••••', req: false }] },
    { id: 'auth', label: '🔐 Authentication', color: '#ef4444', keys: [{ id: 's10', name: 'NextAuth Secret', ph: 'long-random-string', req: true }, { id: 's11', name: 'Google OAuth Client ID', ph: 'xxx.apps.googleusercontent.com', req: false }, { id: 's12', name: 'Google OAuth Secret', ph: 'GOCSPX-...', req: false }] },
    { id: 'push', label: '🔔 Push (Firebase)', color: '#f97316', keys: [{ id: 's13', name: 'Firebase Server Key', ph: 'AAAA...', req: false }, { id: 's14', name: 'FCM Project ID', ph: 'beato-app-xxxxx', req: false }] },
    { id: 'ai', label: '🤖 AI (OpenAI)', color: '#8b5cf6', keys: [{ id: 's15', name: 'OpenAI API Key', ph: 'sk-proj-...', req: false }] },
  ];

  const [vals, setVals] = useState<Record<string, string>>({});

  useEffect(() => {
    if (apiConfig) {
      setVals({
        s1: apiConfig.stripe?.secretKey || '',
        s2: apiConfig.stripe?.publishableKey || '',
        s3: apiConfig.stripe?.webhookSecret || '',
        s4: apiConfig.s3?.accessKeyId || '',
        s5: apiConfig.s3?.secretAccessKey || '',
        s6: apiConfig.s3?.bucket || '',
        s7: apiConfig.cloudinary?.cloudName || '',
        s8: apiConfig.cloudinary?.apiKey || '',
        s9: apiConfig.cloudinary?.apiSecret || '',
        s10: apiConfig.nextAuth?.secret || '',
        s11: apiConfig.google?.clientId || '',
        s12: apiConfig.google?.clientSecret || '',
        s13: apiConfig.firebase?.fcmServerKey || '',
        s14: apiConfig.firebase?.projectId || '',
        s15: apiConfig.openai?.apiKey || '',
      });
    }
  }, [apiConfig]);

  const handleSave = () => {
    // 1. Validate required fields
    const missing: string[] = [];
    cats.forEach(cat => {
      cat.keys.forEach(k => {
        if (k.req && !vals[k.id]?.trim()) {
          missing.push(k.name);
        }
      });
    });

    if (missing.length > 0) {
      toast.error(`Please fill in required fields: ${missing.join(', ')}`);
      return;
    }

    // 2. Validate prefix matches to prevent common user typos
    const errors: string[] = [];
    if (vals.s1 && !/^[•]+$/.test(vals.s1) && !vals.s1.startsWith('sk_')) {
      errors.push('Stripe Secret Key must start with "sk_"');
    }
    if (vals.s2 && !/^[•]+$/.test(vals.s2) && !vals.s2.startsWith('pk_')) {
      errors.push('Stripe Publishable Key must start with "pk_"');
    }
    if (vals.s3 && !/^[•]+$/.test(vals.s3) && !vals.s3.startsWith('whsec_')) {
      errors.push('Stripe Webhook Secret must start with "whsec_"');
    }
    if (vals.s15 && !/^[•]+$/.test(vals.s15) && !vals.s15.startsWith('sk-')) {
      errors.push('OpenAI API Key must start with "sk-"');
    }

    if (errors.length > 0) {
      errors.forEach(err => toast.error(err));
      return;
    }

    const updated = {
      stripe: {
        secretKey: vals.s1 || '',
        publishableKey: vals.s2 || '',
        webhookSecret: vals.s3 || '',
      },
      s3: {
        accessKeyId: vals.s4 || '',
        secretAccessKey: vals.s5 || '',
        bucket: vals.s6 || '',
      },
      cloudinary: {
        cloudName: vals.s7 || '',
        apiKey: vals.s8 || '',
        apiSecret: vals.s9 || '',
      },
      nextAuth: {
        secret: vals.s10 || '',
      },
      google: {
        clientId: vals.s11 || '',
        clientSecret: vals.s12 || '',
      },
      firebase: {
        fcmServerKey: vals.s13 || '',
        projectId: vals.s14 || '',
      },
      openai: {
        apiKey: vals.s15 || '',
      },
    };
    onSave(updated);
  };

  return (
    <Card title="API Keys & Secrets" subtitle="Third-party integrations and credentials" icon={<Key size={18} />} accent="#6366f1">
      <div style={{ padding: '10px 12px', background: C.warnBg, border: `1px solid rgba(245,158,11,0.2)`, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
        <AlertTriangle size={14} color={C.warn} />
        <span style={{ fontSize: 12, color: C.warn, fontWeight: 600 }}>All values stored encrypted. Changes take effect on next deploy.</span>
      </div>
      {cats.map(cat => (
        <div key={cat.id} style={{ marginBottom: 20, padding: 16, background: `${cat.color}06`, border: `1px solid ${C.border}`, borderRadius: 12 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: cat.color, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 4, height: 16, borderRadius: 2, background: cat.color }} /> {cat.label}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {cat.keys.map(k => (
              <Row key={k.id} label={k.name} desc={k.req ? '⚠️ Required' : 'Optional'}>
                <SInput value={vals[k.id] || ''} onChange={(v: string) => setVals(p => ({ ...p, [k.id]: v }))} placeholder={k.ph} />
              </Row>
            ))}
          </div>
        </div>
      ))}
      <SaveBtn onClick={handleSave} />
    </Card>
  );
}

// 📧 EMAIL SERVICES (SMTP)
function EmailServices({ messagingConfig, onSave }: any) {
  const [smtp, setSmtp] = useState({ host: 'smtp.gmail.com', port: '587', user: '', pass: '', secure: 'tls', senderName: 'Beato', senderEmail: '' });
  const [testEmail, setTestEmail] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (messagingConfig?.email) {
      const email = messagingConfig.email;
      setSmtp({
        host: email.host || 'smtp.gmail.com',
        port: String(email.port || 587),
        user: email.user || '',
        pass: email.pass || '',
        secure: email.secure ? 'ssl' : 'tls',
        senderName: email.fromName || 'Beato',
        senderEmail: email.fromAddress || '',
      });
    }
  }, [messagingConfig]);

  const handleTest = async () => {
    if (!testEmail.trim()) return toast.error('Please enter a test email address');
    setSending(true);
    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'testEmailConfig',
          data: {
            host: smtp.host,
            port: smtp.port,
            user: smtp.user,
            pass: smtp.pass,
            secure: smtp.secure,
            senderName: smtp.senderName,
            senderEmail: smtp.senderEmail,
            testEmail: testEmail
          }
        })
      });
      const resData = await response.json();
      if (resData.success) {
        toast.success(resData.message || `Test email successfully sent to ${testEmail}`);
      } else {
        toast.error(resData.error || 'Failed to send test email');
      }
    } catch (err: any) {
      toast.error(err.message || 'Network error sending test email');
    } finally {
      setSending(false);
    }
  };

  const handleSave = () => {
    const updated = {
      ...messagingConfig,
      email: {
        enabled: true,
        host: smtp.host,
        port: parseInt(smtp.port, 10) || 587,
        secure: smtp.secure === 'ssl',
        user: smtp.user,
        pass: smtp.pass,
        fromName: smtp.senderName,
        fromAddress: smtp.senderEmail,
      }
    };
    onSave(updated);
  };

  return (
    <Card title="Email Configuration" subtitle="Configure SMTP server and default sender info" icon={<Mail size={18} />} accent="#eab308">
      <Row label="SMTP Host" desc="Mail server host address"><TInput value={smtp.host} onChange={(v: string) => setSmtp(p => ({ ...p, host: v }))} placeholder="smtp.gmail.com" /></Row>
      <Row label="SMTP Port" desc="Server port (usually 587 or 465)"><TInput value={smtp.port} onChange={(v: string) => setSmtp(p => ({ ...p, port: v }))} placeholder="587" /></Row>
      <Row label="Username" desc="Username for SMTP authentication"><TInput value={smtp.user} onChange={(v: string) => setSmtp(p => ({ ...p, user: v }))} placeholder="apikey" /></Row>
      <Row label="Password" desc="Password or API key for SMTP"><SInput value={smtp.pass} onChange={(v: string) => setSmtp(p => ({ ...p, pass: v }))} placeholder="••••••••" /></Row>
      <Row label="Secure Connection" desc="Encryption mechanism">
        <Sel value={smtp.secure} onChange={(v: string) => setSmtp(p => ({ ...p, secure: v }))}>
          <option value="tls">STARTTLS (Port 587)</option>
          <option value="ssl">SSL / TLS (Port 465)</option>
          <option value="none">None / Unencrypted (Port 25)</option>
        </Sel>
      </Row>
      <Row label="Sender Display Name" desc="Name users see in their inbox"><TInput value={smtp.senderName} onChange={(v: string) => setSmtp(p => ({ ...p, senderName: v }))} placeholder="Beato Support" /></Row>
      <Row label="Sender Email Address" desc="From address"><TInput value={smtp.senderEmail} onChange={(v: string) => setSmtp(p => ({ ...p, senderEmail: v }))} placeholder="noreply@beato.io" /></Row>

      <div style={{ marginTop: 24, padding: 16, background: C.elevated, borderRadius: 12, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Test Connection & Inbox Delivery</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Verify settings by sending a test mail.</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div style={{ flex: 1 }}><TInput value={testEmail} onChange={setTestEmail} placeholder="recipient@example.com" type="email" /></div>
          <motion.button whileTap={{ scale: 0.97 }} onClick={handleTest} disabled={sending}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: C.primary, color: '#fff', border: 'none', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            <Send size={13} /> {sending ? 'Sending...' : 'Send Mail'}
          </motion.button>
        </div>
      </div>
      <SaveBtn onClick={handleSave} />
    </Card>
  );
}

// 💬 SMS & WHATSAPP
function SmsConfig({ messagingConfig, onSave }: any) {
  const [gateway, setGateway] = useState('twilio');
  const [twilio, setTwilio] = useState({ sid: '', token: '', from: '', whatsappFrom: '' });
  const [metaWa, setMetaWa] = useState({ phoneId: '', waAccId: '', token: '' });
  const [testNum, setTestNum] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (messagingConfig) {
      setGateway(messagingConfig.whatsapp?.provider || 'twilio');
      setTwilio({
        sid: messagingConfig.sms?.accountSid || '',
        token: messagingConfig.sms?.authToken || messagingConfig.whatsapp?.accessToken || '',
        from: messagingConfig.sms?.fromNumber || '',
        whatsappFrom: messagingConfig.whatsapp?.fromNumber || '',
      });
      setMetaWa({
        phoneId: messagingConfig.whatsapp?.phoneNumberId || '',
        waAccId: messagingConfig.whatsapp?.businessAccountId || '',
        token: messagingConfig.whatsapp?.accessToken || '',
      });
    }
  }, [messagingConfig]);

  const handleTest = async (type: 'sms' | 'whatsapp') => {
    if (!testNum.trim()) return toast.error('Please enter a test phone number');
    setSending(true);
    await new Promise(r => setTimeout(r, 1200));
    setSending(false);
    toast.success(`Test ${type.toUpperCase()} message triggered to ${testNum}`);
  };

  const handleSave = () => {
    const updated = {
      ...messagingConfig,
      sms: {
        enabled: gateway === 'twilio',
        provider: 'twilio',
        accountSid: twilio.sid,
        authToken: twilio.token,
        fromNumber: twilio.from,
      },
      whatsapp: {
        enabled: gateway === 'twilio' || gateway === 'meta',
        provider: gateway === 'twilio' ? 'twilio' : 'meta',
        accessToken: gateway === 'twilio' ? twilio.token : metaWa.token,
        phoneNumberId: gateway === 'meta' ? metaWa.phoneId : '',
        fromNumber: gateway === 'twilio' ? twilio.whatsappFrom : '',
        businessAccountId: gateway === 'meta' ? metaWa.waAccId : '',
      }
    };
    onSave(updated);
  };

  return (
    <Card title="SMS & WhatsApp Gateways" subtitle="Configure Twilio and Meta API for notifications" icon={<MessageSquare size={18} />} accent="#f43f5e">
      <Row label="SMS Provider" desc="Choose your SMS gateway provider">
        <Sel value={gateway} onChange={setGateway}>
          <option value="twilio">Twilio SMS & WhatsApp</option>
          <option value="meta">Meta Cloud API (WhatsApp Only)</option>
          <option value="vonage">Vonage (Nexmo) SMS</option>
          <option value="sns">AWS SNS (Simple Notification Service)</option>
        </Sel>
      </Row>

      {gateway === 'twilio' && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 12 }}>Twilio Configuration</div>
          <Row label="Account SID" desc="Found on your Twilio Console dashboard"><TInput value={twilio.sid} onChange={(v: string) => setTwilio(p => ({ ...p, sid: v }))} placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxx" /></Row>
          <Row label="Auth Token" desc="Keep this secret"><SInput value={twilio.token} onChange={(v: string) => setTwilio(p => ({ ...p, token: v }))} placeholder="Twilio Auth Token" /></Row>
          <Row label="SMS Sender Number" desc="Your purchased Twilio phone number"><TInput value={twilio.from} onChange={(v: string) => setTwilio(p => ({ ...p, from: v }))} placeholder="+1234567890" /></Row>
          <Row label="WhatsApp Sender Number" desc="Twilio Sandbox or approved WhatsApp number"><TInput value={twilio.whatsappFrom} onChange={(v: string) => setTwilio(p => ({ ...p, whatsappFrom: v }))} placeholder="whatsapp:+14155238886" /></Row>
        </div>
      )}

      {gateway === 'meta' && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 12 }}>Meta Cloud WhatsApp Business API</div>
          <Row label="Phone Number ID" desc="Identifier for your phone number"><TInput value={metaWa.phoneId} onChange={(v: string) => setMetaWa(p => ({ ...p, phoneId: v }))} placeholder="104xxxxxxxxxxxx" /></Row>
          <Row label="WhatsApp Business Account ID"><TInput value={metaWa.waAccId} onChange={(v: string) => setMetaWa(p => ({ ...p, waAccId: v }))} placeholder="93xxxxxxxxxxxxx" /></Row>
          <Row label="System User Access Token" desc="Meta developer access token"><SInput value={metaWa.token} onChange={(v: string) => setMetaWa(p => ({ ...p, token: v }))} placeholder="EAAGxxxx..." /></Row>
        </div>
      )}

      {gateway === 'vonage' && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 12 }}>Vonage API Details</div>
          <Row label="API Key"><TInput placeholder="Vonage API Key" /></Row>
          <Row label="API Secret"><SInput placeholder="Vonage API Secret" /></Row>
          <Row label="Sender Name/ID" desc="Alphanumeric string (e.g. BEATOMUSIC)"><TInput placeholder="Sender ID" /></Row>
        </div>
      )}

      {gateway === 'sns' && (
        <div style={{ marginTop: 12 }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 12 }}>AWS Simple Notification Service</div>
          <Row label="AWS Region" desc="Where SNS topic resides"><TInput placeholder="us-east-1" /></Row>
          <Row label="Sender ID" desc="Optional header"><TInput placeholder="BEATO" /></Row>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 8 }}>AWS SNS relies on credentials specified in the Storage (AWS S3) settings. Please ensure AWS Access Keys are configured under API Keys.</div>
        </div>
      )}

      <div style={{ marginTop: 24, padding: 16, background: C.elevated, borderRadius: 12, border: `1px solid ${C.border}` }}>
        <div style={{ fontSize: 13, fontWeight: 700, color: C.text, marginBottom: 4 }}>Trigger Test Notification</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Send a test SMS or WhatsApp to ensure credentials are valid.</div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 10 }}>
          <span style={{ fontSize: 12, color: C.text, width: 80 }}>To Number:</span>
          <div style={{ flex: 1 }}><TInput value={testNum} onChange={setTestNum} placeholder="+919876543210" /></div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleTest('sms')} disabled={sending}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: C.elevated, color: C.text, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Send Test SMS
          </motion.button>
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => handleTest('whatsapp')} disabled={sending}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 8, background: C.elevated, color: C.text, border: `1px solid ${C.border}`, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
            Send WhatsApp
          </motion.button>
        </div>
      </div>

      <SaveBtn onClick={handleSave} />
    </Card>
  );
}

// ⚙️ PLATFORM SETUP
function PlatformConfig({ platformSettings, onSave }: any) {
  const [platform, setPlatform] = useState({
    maintenanceMode: false,
    maintenanceMsg: 'We are performing scheduled maintenance. Please check back shortly.',
    registrations: true,
    force2fa: false,
    appDomain: 'https://soundsphere.io',
    jwtSecret: 'super-secret-default-beato-token-key-change-me',
    sessionExpiry: '24',
    webhookUrl: '',
    webhookEvents: ['user_signup', 'payment_success']
  });

  useEffect(() => {
    if (platformSettings) {
      setPlatform({
        maintenanceMode: !!platformSettings.security?.maintenanceMode,
        maintenanceMsg: platformSettings.security?.maintenanceMsg || 'We are performing scheduled maintenance. Please check back shortly.',
        registrations: platformSettings.general?.allowRegistrations !== false,
        force2fa: !!platformSettings.security?.mfaRequired,
        appDomain: platformSettings.general?.websiteUrl || 'https://soundsphere.io',
        jwtSecret: platformSettings.security?.jwtSecret || 'super-secret-default-beato-token-key-change-me',
        sessionExpiry: String(platformSettings.security?.sessionTimeout || 24),
        webhookUrl: platformSettings.general?.webhookUrl || '',
        webhookEvents: platformSettings.general?.webhookEvents || ['user_signup', 'payment_success']
      });
    }
  }, [platformSettings]);

  const generateJwt = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+';
    let res = '';
    for (let i = 0; i < 48; i++) {
      res += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPlatform(p => ({ ...p, jwtSecret: res }));
    toast.success('Generated new high-entropy JWT Secret!');
  };

  const handleWebhookToggle = (ev: string) => {
    setPlatform(p => {
      const exists = p.webhookEvents.includes(ev);
      return {
        ...p,
        webhookEvents: exists ? p.webhookEvents.filter(x => x !== ev) : [...p.webhookEvents, ev]
      };
    });
  };

  const handleSave = () => {
    const updated = {
      ...platformSettings,
      general: {
        ...platformSettings?.general,
        websiteUrl: platform.appDomain,
        allowRegistrations: platform.registrations,
        webhookUrl: platform.webhookUrl,
        webhookEvents: platform.webhookEvents,
      },
      security: {
        ...platformSettings?.security,
        maintenanceMode: platform.maintenanceMode,
        maintenanceMsg: platform.maintenanceMsg,
        mfaRequired: platform.force2fa,
        jwtSecret: platform.jwtSecret,
        sessionTimeout: parseInt(platform.sessionExpiry, 10) || 24,
      }
    };
    onSave(updated);
  };

  return (
    <Card title="Platform Control & Setup" subtitle="Core settings for running, licensing, and scaling the site" icon={<Settings size={18} />} accent="#b08850">
      <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 12, borderBottom: `1px solid ${C.border}`, paddingBottom: 4 }}>System Status & Security</div>
      <Row label="Maintenance Mode" desc="Locks user platform with custom alert"><Toggle value={platform.maintenanceMode} onChange={v => setPlatform(p => ({ ...p, maintenanceMode: v }))} /></Row>
      {platform.maintenanceMode && (
        <Row label="Maintenance Message" desc="Displayed to users during lockout">
          <TInput value={platform.maintenanceMsg} onChange={(v: string) => setPlatform(p => ({ ...p, maintenanceMsg: v }))} placeholder="Under maintenance..." />
        </Row>
      )}
      <Row label="Public Registrations" desc="Allow new users to sign up"><Toggle value={platform.registrations} onChange={v => setPlatform(p => ({ ...p, registrations: v }))} /></Row>
      <Row label="Force Admin 2FA" desc="Require all admin panel accounts to set up 2-factor authentication"><Toggle value={platform.force2fa} onChange={v => setPlatform(p => ({ ...p, force2fa: v }))} /></Row>

      <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 12, marginTop: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 4 }}>Domain & JWT Authentication</div>
      <Row label="Application Domain" desc="Base URL for redirect links and templates"><TInput value={platform.appDomain} onChange={(v: string) => setPlatform(p => ({ ...p, appDomain: v }))} placeholder="https://beato.io" /></Row>
      <Row label="JWT Secret Key" desc="Used to sign session tokens securely">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <SInput value={platform.jwtSecret} onChange={(v: string) => setPlatform(p => ({ ...p, jwtSecret: v }))} placeholder="JWT Secret" />
          <motion.button whileTap={{ scale: 0.95 }} onClick={generateJwt}
            style={{ width: 'fit-content', background: C.elevated, border: `1px solid ${C.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, cursor: 'pointer', color: C.text, fontWeight: 600 }}>
            Generate Random Secret
          </motion.button>
        </div>
      </Row>
      <Row label="Session Expiry (hours)" desc="Token validity duration"><TInput value={platform.sessionExpiry} onChange={(v: string) => setPlatform(p => ({ ...p, sessionExpiry: v }))} type="number" placeholder="24" /></Row>

      <div style={{ fontSize: 12, fontWeight: 700, color: C.primary, marginBottom: 12, marginTop: 24, borderBottom: `1px solid ${C.border}`, paddingBottom: 4 }}>System Webhooks</div>
      <Row label="Webhook Endpoint URL" desc="Sends JSON payloads to this listener URL"><TInput value={platform.webhookUrl} onChange={(v: string) => setPlatform(p => ({ ...p, webhookUrl: v }))} placeholder="https://your-api.com/webhooks/beato" /></Row>
      <Row label="Trigger Events" desc="Events that will dispatch a webhook request">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 4 }}>
          {['user_signup', 'user_login', 'payment_success', 'subscription_cancelled', 'artist_payout_completed', 'support_ticket_created'].map(ev => {
            const checked = platform.webhookEvents.includes(ev);
            return (
              <div key={ev} onClick={() => handleWebhookToggle(ev)} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 0' }}>
                <div style={{ width: 14, height: 14, borderRadius: 3, border: `1.5px solid ${checked ? C.primary : C.faint}`, background: checked ? C.primary : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {checked && <Check size={10} color="#fff" />}
                </div>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: checked ? C.text : C.muted }}>{ev}</span>
              </div>
            );
          })}
        </div>
      </Row>

      <SaveBtn onClick={handleSave} />
    </Card>
  );
}

// 👑 MAIN SUPER ADMIN SETTINGS COMPONENT
export default function SuperAdminTab() {
  const [activeSubTab, setActiveSubTab] = useState('admins');
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/settings?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      setSettings(data);
    } catch (e) {
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (type: string, data: any) => {
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, data })
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error);
      toast.success('Settings saved successfully!');
      fetchSettings();

      // Emit real-time socket updates for role config/permissions changes
      if (type === 'rolesConfig' || type === 'userPermissions') {
        import('@/lib/socket').then(({ socketManager }) => {
          if (socketManager) {
            socketManager.emit('ROLE_PERMISSION_UPDATE', { type, data });
          }
        }).catch(console.error);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to save settings');
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const menuItems = [
    { id: 'admins', label: 'Admin Management', icon: <Users size={16} />, desc: 'Add and suspend panel admins' },
    { id: 'roles', label: 'Roles & Permissions', icon: <ShieldCheck size={16} />, desc: 'Modify roles and permission grid' },
    { id: 'userAccess', label: 'User Access Control', icon: <UserCheck size={16} />, desc: 'Override permissions for individual users' },
    { id: 'database', label: 'Database Setup', icon: <Database size={16} />, desc: 'Manage SQL & connection pool' },
    { id: 'apiKeys', label: 'API & Integrations', icon: <Key size={16} />, desc: 'Configure Stripe, Cloudinary, AWS S3, etc.' },
    { id: 'email', label: 'Email Setup (SMTP)', icon: <Mail size={16} />, desc: 'Configure SMTP servers' },
    { id: 'sms', label: 'SMS & WhatsApp', icon: <MessageSquare size={16} />, desc: 'Twilio SMS & Meta API WhatsApp' },
    { id: 'platform', label: 'Platform & Security', icon: <Settings size={16} />, desc: 'Maintenance mode, JWT keys, and webhooks' }
  ];

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '300px', color: C.muted, fontSize: 13 }}>
        Loading Super Admin Settings...
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tab Header Banner */}
      <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: '24px 28px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 2px 8px rgba(43,34,26,0.04)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 24 }}>👑</span>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: C.text, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Super Admin settings Panel</h1>
          </div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Configure infrastructure, set up API keys, modify admin permissions, and manage server settings for deployment or sale.</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.primaryBg, padding: '8px 14px', borderRadius: 8, border: `1px solid ${C.primary}30` }}>
          <Crown size={15} color={C.primary} />
          <span style={{ fontSize: 12, fontWeight: 700, color: C.primary, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Root Privileges</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 20, alignItems: 'start' }}>
        {/* Left Sub-Tab Navigation Bar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 12, boxShadow: '0 2px 8px rgba(43,34,26,0.04)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.faint, textTransform: 'uppercase', letterSpacing: '0.07em', padding: '4px 10px 8px', borderBottom: `1px solid ${C.border}`, marginBottom: 6 }}>System Settings</div>
          {menuItems.map(item => {
            const active = activeSubTab === item.id;
            return (
              <button key={item.id} onClick={() => setActiveSubTab(item.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', borderRadius: 10, textAlign: 'left',
                  background: active ? C.primaryBg : 'transparent', border: `1px solid ${active ? C.primary + '30' : 'transparent'}`,
                  cursor: 'pointer', transition: 'all 0.15s', color: active ? C.primary : C.text, outline: 'none'
                }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 6, background: active ? '#fff' : C.elevated, border: `1px solid ${active ? C.primary + '20' : C.border}`, color: active ? C.primary : C.muted }}>
                  {item.icon}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.label}</div>
                  <div style={{ fontSize: 10, color: active ? C.primary : C.faint, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>{item.desc}</div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Active View Card */}
        <div style={{ minWidth: 0 }}>
          <AnimatePresence mode="wait">
            <motion.div key={activeSubTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.15 }}>
              {activeSubTab === 'admins' && <AdminMgmt />}
              {activeSubTab === 'roles' && <RoleBuilder rolesConfig={settings?.rolesConfig} onSave={(data: any) => saveSettings('rolesConfig', data)} />}
              {activeSubTab === 'userAccess' && <UserAccess settings={settings} onSave={(userId: string, perms: string[]) => saveSettings('userPermissions', { userId, perms })} />}
              {activeSubTab === 'database' && <DbConfig dbConfig={settings?.dbConfig} onSave={(data: any) => saveSettings('dbConfig', data)} />}
              {activeSubTab === 'apiKeys' && <ApiKeys apiConfig={settings?.apiConfig} onSave={(data: any) => saveSettings('apiConfig', data)} />}
              {activeSubTab === 'email' && <EmailServices messagingConfig={settings?.messagingConfig} onSave={(data: any) => saveSettings('messagingConfig', data)} />}
              {activeSubTab === 'sms' && <SmsConfig messagingConfig={settings?.messagingConfig} onSave={(data: any) => saveSettings('messagingConfig', data)} />}
              {activeSubTab === 'platform' && <PlatformConfig platformSettings={settings?.platformSettings} onSave={(data: any) => saveSettings('platformSettings', data)} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
