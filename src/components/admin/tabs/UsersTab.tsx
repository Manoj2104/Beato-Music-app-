'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/authStore';

const PLAN_COLORS: Record<string, string> = {
  free: '#6b7280',
  premium: '#b08850',
  family: '#10b981',
  student: '#10b981',
  creator: '#f59e0b',
};

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#fbf9f5', border: '1px solid rgba(43,34,26,0.1)', borderRadius: 8,
  color: '#221a15', padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

export default function UsersTab() {
  const { user } = useAuthStore();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [subView, setSubView] = useState<'directory' | 'verifications'>('directory');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Filtering and Sorting
  const [search, setSearch] = useState('');
  const [filterPlan, setFilterPlan] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('joinedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // Bulk Selection
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Modals & Forms
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'USER', plan: 'free', country: 'US' });

  // Action Menu
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/admin/users?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (e) {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const executeAction = async (userId: string, action: string, payload?: any) => {
    try {
      const res = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, payload }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || 'Action executed successfully');
      fetchUsers();

      if (action === 'edit' || action === 'suspend' || action === 'activate') {
        import('@/lib/socket').then(({ socketManager }) => {
          if (socketManager) {
            socketManager.emit('ROLE_PERMISSION_UPDATE', { type: 'userUpdate', data: { userId, action, payload } });
          }
        }).catch(console.error);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to execute action');
    }
  };

  const executeBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) return;
    try {
      const res = await fetch('/api/admin/user-action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds: selectedUsers, action }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success(data.message || 'Bulk action executed successfully');
      setSelectedUsers([]);
      fetchUsers();
    } catch (e: any) {
      toast.error(e.message || 'Failed to execute bulk action');
    }
  };

  const handleAddUser = async () => {
    if (!formData.name || !formData.email) {
      toast.error('Name and Email are required');
      return;
    }
    await executeAction('new', 'create', formData);
    setShowAddModal(false);
    setFormData({ name: '', email: '', role: 'USER', plan: 'free', country: 'US' });
  };

  const handleEditUser = async () => {
    if (!showEditModal) return;
    await executeAction(showEditModal.id, 'edit', formData);
    setShowEditModal(null);
  };

  const toggleSelect = (id: string) => {
    setSelectedUsers(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const exportCSV = () => {
    const headers = ['ID', 'Name', 'Email', 'Role', 'Plan', 'Country', 'Joined', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredUsers.map(u => 
        [u.id, `"${u.name}"`, `"${u.email}"`, u.role, u.plan, u.country, u.joinedAt, u.isActive ? 'Active' : 'Suspended'].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_export_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    toast.success('Export downloaded');
  };

  const filteredUsers = users.filter(u => {
    if (search && !u.name.toLowerCase().includes(search.toLowerCase()) && !u.email.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterPlan !== 'all' && u.plan !== filterPlan) return false;
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    if (filterStatus !== 'all' && (filterStatus === 'active' ? !u.isActive : u.isActive)) return false;
    return true;
  }).sort((a, b) => {
    const valA = a[sortField];
    const valB = b[sortField];
    if (valA < valB) return sortOrder === 'asc' ? -1 : 1;
    if (valA > valB) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const totalUsers = users.length;
  const premiumUsers = users.filter(u => ['premium', 'family', 'student', 'creator'].includes(u.plan?.toLowerCase())).length;
  const activeArtists = users.filter(u => u.role?.toLowerCase() === 'artist').length;
  const suspendedUsers = users.filter(u => !u.isActive).length;

  const stats = [
    { label: 'Total Users', value: totalUsers, color: '#b08850' },
    { label: 'Premium Subscriptions', value: premiumUsers, color: '#10b981' },
    { label: 'Active Artists', value: activeArtists, color: '#06b6d4' },
    { label: 'Suspended Accounts', value: suspendedUsers, color: '#ef4444' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Stats Bar */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 12 }}>
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={{ background: 'rgba(43, 34, 26, 0.03)', border: '1px solid rgba(43, 34, 26, 0.08)', borderRadius: 16, padding: '20px 24px' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: s.color, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: '#87786c', marginTop: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
          </motion.div>
        ))}
      </motion.div>

      {/* Subtab Navigation */}
      <div style={{ display: 'flex', borderBottom: '1px solid rgba(43, 34, 26, 0.08)', paddingBottom: 10, gap: 16, marginBottom: 10 }}>
        <button 
          onClick={() => setSubView('directory')}
          style={{
            padding: '8px 16px',
            background: subView === 'directory' ? 'rgba(176, 136, 80,0.1)' : 'transparent',
            border: 'none',
            borderRadius: 8,
            color: subView === 'directory' ? '#b08850' : '#a3a3a3',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
        >
          Users Directory
        </button>
        <button 
          onClick={() => setSubView('verifications')}
          style={{
            padding: '8px 16px',
            background: subView === 'verifications' ? 'rgba(176, 136, 80,0.1)' : 'transparent',
            border: 'none',
            borderRadius: 8,
            color: subView === 'verifications' ? '#b08850' : '#a3a3a3',
            fontWeight: 700,
            fontSize: 13,
            cursor: 'pointer',
            transition: 'all 0.2s',
            display: 'flex',
            alignItems: 'center',
            gap: 6
          }}
        >
          Profile Verifications
          {users.filter(u => u.verificationRequest?.status === 'PENDING').length > 0 && (
            <span style={{
              background: '#ef4444',
              color: '#221a15',
              padding: '1px 6px',
              borderRadius: 10,
              fontSize: 9,
              fontWeight: 800
            }}>
              {users.filter(u => u.verificationRequest?.status === 'PENDING').length}
            </span>
          )}
        </button>
      </div>

      {subView === 'directory' && (
        <>
          {/* Top Header & Actions */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowAddModal(true)} style={{ background: '#b08850', border: 'none', borderRadius: 8, color: '#000', padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Add User</button>
          <button onClick={exportCSV} style={{ background: '#f4eede', border: '1px solid rgba(43,34,26,0.12)', borderRadius: 8, color: '#221a15', padding: '9px 16px', fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Download CSV</button>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <input
            value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users..."
            style={{ ...inputStyle, width: 220 }}
          />
          <select value={filterRole} onChange={e => setFilterRole(e.target.value)} style={{ ...inputStyle, width: 120 }}>
            <option value="all">All Roles</option>
            <option value="USER">User</option>
            <option value="ARTIST">Artist</option>
            <option value="ADMIN">Admin</option>
          </select>
          <select value={filterPlan} onChange={e => setFilterPlan(e.target.value)} style={{ ...inputStyle, width: 120 }}>
            <option value="all">All Plans</option>
            <option value="free">Free</option>
            <option value="premium">Premium</option>
            <option value="family">Family</option>
            <option value="student">Student</option>
            <option value="creator">Creator</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ ...inputStyle, width: 120 }}>
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions Banner */}
      {selectedUsers.length > 0 && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          style={{ background: '#10b98122', border: '1px solid #10b981', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>{selectedUsers.length} users selected</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => executeBulkAction('bulk_activate')} style={{ background: '#b08850', border: 'none', borderRadius: 6, color: '#000', padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Activate Selected</button>
            <button onClick={() => executeBulkAction('bulk_suspend')} style={{ background: '#f59e0b', border: 'none', borderRadius: 6, color: '#000', padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Suspend Selected</button>
            <button onClick={() => { if(confirm('Are you sure you want to permanently delete these users?')) executeBulkAction('bulk_remove'); }} style={{ background: '#ef4444', border: 'none', borderRadius: 6, color: '#221a15', padding: '6px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Delete Selected</button>
          </div>
        </motion.div>
      )}

      {/* Users Table */}
      <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid rgba(43,34,26,0.07)', overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '40px 2fr 2fr 120px 120px 100px 80px',
          padding: '14px 20px',
          borderBottom: '1px solid rgba(43, 34, 26, 0.08)',
        }}>
          <div><input type="checkbox" checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0} onChange={toggleSelectAll} style={{ accentColor: '#b08850' }} /></div>
          {['Name', 'Email', 'Plan', 'Joined', 'Status', 'Actions'].map((h, i) => (
            <div key={h} onClick={() => handleSort(h.toLowerCase() === 'joined' ? 'joinedAt' : h.toLowerCase())} style={{ fontSize: 11, fontWeight: 700, color: '#87786c', letterSpacing: '0.06em', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              {h.toUpperCase()}
              {(sortField === h.toLowerCase() || (h === 'Joined' && sortField === 'joinedAt')) && (
                <span style={{ fontSize: 10 }}>{sortOrder === 'asc' ? '↑' : '↓'}</span>
              )}
            </div>
          ))}
        </div>
        
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#87786c' }}>Loading users...</div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: '#87786c' }}>No users found</div>
        ) : (
          filteredUsers.map((u, i) => {
            const isSelf = u.id === user?.id || u.email === user?.email;
            const isAdmin = u.role === 'ADMIN' || u.role === 'SUPER_ADMIN';
            
            return (
              <motion.div
                key={u.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '40px 2fr 2fr 120px 120px 100px 80px',
                  padding: '12px 20px',
                  borderBottom: i < filteredUsers.length - 1 ? '1px solid rgba(43, 34, 26, 0.08)' : 'none',
                  alignItems: 'center',
                  background: u.isActive ? (selectedUsers.includes(u.id) ? 'rgba(176, 136, 80, 0.05)' : 'transparent') : 'rgba(239, 68, 68, 0.02)',
                }}
              >
                <div>
                  <input type="checkbox" disabled={isSelf || (isAdmin && u.role === 'SUPER_ADMIN')} checked={selectedUsers.includes(u.id)} onChange={() => toggleSelect(u.id)} style={{ accentColor: '#b08850' }} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <img src={u.avatar} alt={u.name} style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover' }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 600, color: u.isActive ? '#fff' : '#9ca3af' }}>{u.name} {isAdmin && '🛡️'}</div>
                    <div style={{ fontSize: 11, color: '#87786c' }}>{u.role} • {u.country}</div>
                  </div>
                </div>
                <div style={{ fontSize: 12, color: '#a0958b' }}>{u.email}</div>
                <div>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: `${PLAN_COLORS[u.plan] || '#6b7280'}18`, color: PLAN_COLORS[u.plan] || '#6b7280', textTransform: 'capitalize' }}>
                    {u.plan}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: '#87786c' }}>{u.joinedAt}</div>
                <div>
                  <span style={{ padding: '4px 10px', borderRadius: 20, fontSize: 10, fontWeight: 700, background: u.isActive ? 'rgba(176, 136, 80, 0.12)' : 'rgba(239, 68, 68, 0.12)', color: u.isActive ? '#b08850' : '#ef4444' }}>
                    {u.isActive ? 'ACTIVE' : 'SUSPENDED'}
                  </span>
                </div>
                <div style={{ position: 'relative' }}>
                  <button onClick={() => setActiveMenu(activeMenu === u.id ? null : u.id)} style={{ background: 'transparent', border: '1px solid rgba(43,34,26,0.12)', borderRadius: 6, color: '#221a15', padding: '4px 8px', cursor: 'pointer' }}>
                    •••
                  </button>
                  
                  <AnimatePresence>
                    {activeMenu === u.id && (
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                        style={{ position: 'absolute', right: 0, top: 30, background: '#f4eede', border: '1px solid rgba(43,34,26,0.12)', borderRadius: 8, padding: 4, width: 150, zIndex: 10 }}>
                        <div onClick={() => { setShowDetailsModal(u); setActiveMenu(null); }} style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 4, color: '#e5e7eb' }} onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>View Details</div>
                        <div onClick={() => { setFormData({ name: u.name, email: u.email, role: u.role, plan: u.plan, country: u.country || 'US' }); setShowEditModal(u); setActiveMenu(null); }} style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 4, color: '#e5e7eb' }} onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Edit User</div>
                        <div onClick={() => { executeAction(u.id, 'reset_password'); setActiveMenu(null); }} style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 4, color: '#e5e7eb' }} onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Reset Password</div>
                        <div style={{ height: 1, background: 'rgba(43,34,26,0.1)', margin: '4px 0' }} />
                        {!isSelf && (
                          <>
                            {u.isActive ? (
                              <div onClick={() => { executeAction(u.id, 'suspend'); setActiveMenu(null); }} style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 4, color: '#f59e0b' }} onMouseEnter={e => e.currentTarget.style.background = '#333'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Suspend User</div>
                            ) : (
                              <div onClick={() => { executeAction(u.id, 'activate'); setActiveMenu(null); }} style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 4, color: '#b08850' }} onMouseEnter={e => e.currentTarget.style.background = '#333'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Activate User</div>
                            )}
                            <div onClick={() => { if(confirm('Permanently delete?')) executeAction(u.id, 'remove'); setActiveMenu(null); }} style={{ padding: '8px 12px', fontSize: 12, cursor: 'pointer', borderRadius: 4, color: '#ef4444' }} onMouseEnter={e => e.currentTarget.style.background = '#333'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>Delete User</div>
                          </>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
      </>
      )}

      {/* Verification Requests Tab View */}
      {subView === 'verifications' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Header */}
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#221a15', fontFamily: 'Outfit, sans-serif' }}>User Profile Verifications</div>
            <div style={{ fontSize: 12, color: '#87786c', marginTop: 4 }}>Approve or reject user identity proof requests to grant verified checkmarks</div>
          </div>

          {/* Verification Requests List */}
          <div style={{ background: '#ffffff', borderRadius: 16, border: '1px solid rgba(43,34,26,0.07)', overflow: 'hidden' }}>
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1.5fr 1.5fr 1fr 1.5fr 1fr 1.8fr',
              padding: '14px 20px',
              borderBottom: '1px solid rgba(43, 34, 26, 0.08)',
              background: 'rgba(43, 34, 26, 0.02)'
            }}>
              {['User', 'Name in Proof', 'Type', 'ID Number', 'Proof Image', 'Actions'].map((h) => (
                <div key={h} style={{ fontSize: 11, fontWeight: 700, color: '#87786c', letterSpacing: '0.06em' }}>
                  {h.toUpperCase()}
                </div>
              ))}
            </div>
 
            {loading ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#87786c' }}>Loading requests...</div>
            ) : users.filter(u => u.verificationRequest).length === 0 ? (
              <div style={{ padding: 40, textAlign: 'center', color: '#87786c' }}>No verification requests found</div>
            ) : (
              users.filter(u => u.verificationRequest).map((u, i) => {
                const req = u.verificationRequest;
                const statusColor = req.status === 'APPROVED' ? '#b08850' : req.status === 'REJECTED' ? '#ef4444' : '#f59e0b';
                
                return (
                  <div
                    key={u.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1.5fr 1.5fr 1fr 1.5fr 1fr 1.8fr',
                      padding: '16px 20px',
                      borderBottom: i < users.filter(u => u.verificationRequest).length - 1 ? '1px solid rgba(43, 34, 26, 0.08)' : 'none',
                      alignItems: 'center',
                    }}
                  >
                    {/* User display details */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <img src={u.avatar} alt={u.name} style={{ width: 30, height: 30, borderRadius: '50%', objectFit: 'cover' }} />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#221a15', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{u.name}</div>
                        <div style={{ fontSize: 10, color: '#87786c' }}>{u.email}</div>
                      </div>
                    </div>
 
                    {/* Name in Proof */}
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#221a15' }}>{req.name}</div>
 
                    {/* Proof Type */}
                    <div style={{ fontSize: 12, color: '#a0958b', textTransform: 'capitalize' }}>{req.type === 'aadhaar' ? 'Aadhaar' : 'PAN Card'}</div>
 
                    {/* Document Number */}
                    <div style={{ fontSize: 12, fontFamily: 'monospace', color: '#a0958b' }}>{req.number}</div>
 
                    {/* Proof Document Image */}
                    <div>
                      {req.image ? (
                        <button
                          onClick={() => setPreviewImage(req.image)}
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: 6,
                            color: '#221a15',
                            padding: '4px 10px',
                            fontSize: 11,
                            fontWeight: 600,
                            cursor: 'pointer',
                            transition: 'all 0.2s'
                          }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                          onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                        >
                          👁 View Image
                        </button>
                      ) : (
                        <span style={{ fontSize: 11, color: '#87786c' }}>No Image</span>
                      )}
                    </div>
 
                    {/* Actions */}
                    <div>
                      {req.status === 'PENDING' ? (
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            onClick={() => executeAction(u.id, 'approve_verification')}
                            style={{
                              background: '#b08850',
                              border: 'none',
                              borderRadius: 6,
                              color: '#000',
                              padding: '5px 10px',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => executeAction(u.id, 'reject_verification')}
                            style={{
                              background: '#ef4444',
                              border: 'none',
                              borderRadius: 6,
                              color: '#221a15',
                              padding: '5px 10px',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => executeAction(u.id, 'reverify')}
                            style={{
                              background: '#10b981',
                              border: 'none',
                              borderRadius: 6,
                              color: '#221a15',
                              padding: '5px 10px',
                              fontSize: 11,
                              fontWeight: 700,
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
                            onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                          >
                            Reverify
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{
                            padding: '3px 8px',
                            borderRadius: 20,
                            fontSize: 10,
                            fontWeight: 700,
                            background: `${statusColor}18`,
                            color: statusColor,
                            textTransform: 'uppercase'
                          }}>
                            {req.status}
                          </span>
                          <button
                            onClick={() => executeAction(u.id, 'reverify')}
                            style={{
                              background: 'rgba(16, 185, 129, 0.12)',
                              border: '1px solid rgba(16, 185, 129, 0.25)',
                              borderRadius: 6,
                              color: '#60a5fa',
                              padding: '4px 8px',
                              fontSize: 10.5,
                              fontWeight: 600,
                              cursor: 'pointer',
                              transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => {
                              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)';
                              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.4)';
                            }}
                            onMouseLeave={e => {
                              e.currentTarget.style.background = 'rgba(16, 185, 129, 0.12)';
                              e.currentTarget.style.borderColor = 'rgba(16, 185, 129, 0.25)';
                            }}
                          >
                            Reverify
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Modal */}
      <AnimatePresence>
        {(showAddModal || showEditModal) && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => { setShowAddModal(false); setShowEditModal(null); }}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#ffffff', border: '1px solid rgba(43,34,26,0.1)', borderRadius: 16, padding: 28, width: 400 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 700 }}>{showAddModal ? 'Add New User' : 'Edit User'}</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div><label style={{ fontSize: 12, color: '#a0958b', display: 'block', marginBottom: 6 }}>Full Name</label>
                  <input style={inputStyle} value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} placeholder="John Doe" /></div>
                
                <div><label style={{ fontSize: 12, color: '#a0958b', display: 'block', marginBottom: 6 }}>Email Address</label>
                  <input type="email" style={inputStyle} value={formData.email} onChange={e => setFormData(p => ({ ...p, email: e.target.value }))} placeholder="john@example.com" disabled={!!showEditModal} /></div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div><label style={{ fontSize: 12, color: '#a0958b', display: 'block', marginBottom: 6 }}>Role</label>
                    <select style={inputStyle} value={formData.role} onChange={e => setFormData(p => ({ ...p, role: e.target.value }))}>
                      <option value="USER">User</option>
                      <option value="ARTIST">Artist</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </div>
                  <div><label style={{ fontSize: 12, color: '#a0958b', display: 'block', marginBottom: 6 }}>Plan</label>
                    <select style={inputStyle} value={formData.plan} onChange={e => setFormData(p => ({ ...p, plan: e.target.value }))}>
                      <option value="free">Free</option>
                      <option value="premium">Premium</option>
                      <option value="family">Family</option>
                      <option value="student">Student</option>
                      <option value="creator">Creator</option>
                    </select>
                  </div>
                </div>

                <div><label style={{ fontSize: 12, color: '#a0958b', display: 'block', marginBottom: 6 }}>Country Code</label>
                  <input style={inputStyle} value={formData.country} onChange={e => setFormData(p => ({ ...p, country: e.target.value }))} placeholder="US" maxLength={2} /></div>
                
                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 10 }}>
                  <button onClick={() => { setShowAddModal(false); setShowEditModal(null); }} style={{ background: '#f4eede', border: 'none', borderRadius: 8, color: '#a0958b', padding: '10px 18px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={showAddModal ? handleAddUser : handleEditUser} style={{ background: '#b08850', border: 'none', borderRadius: 8, color: '#000', padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>{showAddModal ? 'Create User' : 'Save Changes'}</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetailsModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setShowDetailsModal(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#ffffff', border: '1px solid rgba(43,34,26,0.1)', borderRadius: 16, padding: 28, width: 450 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24 }}>
                <img src={showDetailsModal.avatar} style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 700 }}>{showDetailsModal.name}</h3>
                  <p style={{ margin: 0, color: '#a0958b', fontSize: 13 }}>{showDetailsModal.email}</p>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
                <div style={{ background: '#fbf9f5', padding: 12, borderRadius: 8, border: '1px solid rgba(43,34,26,0.07)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: '#87786c' }}>ROLE</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{showDetailsModal.role}</p>
                </div>
                <div style={{ background: '#fbf9f5', padding: 12, borderRadius: 8, border: '1px solid rgba(43,34,26,0.07)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: '#87786c' }}>PLAN</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, textTransform: 'capitalize', color: PLAN_COLORS[showDetailsModal.plan] }}>{showDetailsModal.plan}</p>
                </div>
                <div style={{ background: '#fbf9f5', padding: 12, borderRadius: 8, border: '1px solid rgba(43,34,26,0.07)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: '#87786c' }}>JOINED</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600 }}>{showDetailsModal.joinedAt}</p>
                </div>
                <div style={{ background: '#fbf9f5', padding: 12, borderRadius: 8, border: '1px solid rgba(43,34,26,0.07)' }}>
                  <p style={{ margin: '0 0 4px', fontSize: 11, color: '#87786c' }}>STATUS</p>
                  <p style={{ margin: 0, fontSize: 14, fontWeight: 600, color: showDetailsModal.isActive ? '#b08850' : '#ef4444' }}>{showDetailsModal.isActive ? 'Active' : 'Suspended'}</p>
                </div>
              </div>

              <h4 style={{ fontSize: 13, color: '#87786c', margin: '0 0 10px' }}>RECENT ACTIVITY</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 24 }}>
                <div style={{ fontSize: 12, color: '#e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Logged in from new device</span> <span style={{ color: '#87786c' }}>2 hours ago</span>
                </div>
                <div style={{ fontSize: 12, color: '#e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Upgraded to Premium</span> <span style={{ color: '#87786c' }}>3 days ago</span>
                </div>
                <div style={{ fontSize: 12, color: '#e5e7eb', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Created playlist "Summer Vibes"</span> <span style={{ color: '#87786c' }}>1 week ago</span>
                </div>
              </div>

              <button onClick={() => setShowDetailsModal(null)} style={{ width: '100%', background: '#f4eede', border: '1px solid rgba(43,34,26,0.12)', borderRadius: 8, color: '#221a15', padding: '10px', fontSize: 13, cursor: 'pointer' }}>Close Details</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Document Image Preview Modal */}
      <AnimatePresence>
        {previewImage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)' }}
            onClick={() => setPreviewImage(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#1c1c1e', border: '1px solid rgba(43,34,26,0.12)', borderRadius: 16, padding: 20, maxWidth: '90vw', maxHeight: '90vh', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: '#221a15' }}>Identity Proof Image Preview</span>
                <button onClick={() => setPreviewImage(null)} style={{ background: 'none', border: 'none', color: '#221a15', cursor: 'pointer', fontSize: 18 }}>×</button>
              </div>
              <div style={{ width: '100%', overflow: 'auto', display: 'flex', justifyContent: 'center' }}>
                <img src={previewImage} alt="Document Proof" style={{ maxWidth: '100%', maxHeight: '70vh', objectFit: 'contain', borderRadius: 8 }} />
              </div>
              <button onClick={() => setPreviewImage(null)} style={{ background: '#b08850', border: 'none', borderRadius: 8, color: '#000', padding: '9px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Close Preview</button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
