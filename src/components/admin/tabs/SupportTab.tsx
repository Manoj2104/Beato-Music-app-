'use client';

import { useState, useEffect } from 'react';
import { 
  Search, Sliders, CheckCircle2, MessageSquare, Trash2, X, Send, 
  AlertTriangle, Clock, RefreshCw, Filter, ShieldAlert, LifeBuoy
} from 'lucide-react';
import { motion as fm, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { socketManager } from '@/lib/socket';

// ─── Theme Colors ─────────────────────────────────────────────────────────────

const COLORS = {
  bg: '#0a0a0a',
  card: 'rgba(255, 255, 255, 0.03)',
  card2: 'rgba(255, 255, 255, 0.05)',
  border: 'rgba(255, 255, 255, 0.08)',
  green: '#b08850',
  text: '#ffffff',
  muted: '#888888',
  urgent: '#ef4444',
  high: '#f97316',
  medium: '#eab308',
  low: '#22c55e',
  blue: '#10b981',
};

type Priority = 'urgent' | 'high' | 'medium' | 'low';
type Status = 'open' | 'in-progress' | 'resolved' | 'closed';
type Category = 'billing' | 'technical' | 'account' | 'content';

interface TicketMessage {
  sender: string;
  text: string;
  time: string;
  timestamp: number;
}

interface Ticket {
  id: string;
  user: string;
  email: string;
  subject: string;
  category: Category;
  priority: Priority;
  status: Status;
  created: string;
  message: string;
  thread: TicketMessage[];
  slaHours: number;
  elapsedHours: number;
  updatedAt: string;
  attachments?: string[];
  assignedDept?: string;
  rating?: number;
  ratingComment?: string;
  internalNotes?: TicketMessage[];
}

interface CannedReply {
  id: string;
  title: string;
  text: string;
}

const priorityColor: Record<Priority, string> = { urgent: COLORS.urgent, high: COLORS.high, medium: COLORS.medium, low: COLORS.low };
const statusColor: Record<Status, string> = { open: COLORS.blue, 'in-progress': COLORS.high, resolved: COLORS.green, closed: COLORS.muted };

const inputStyle: React.CSSProperties = {
  background: 'rgba(0, 0, 0, 0.4)',
  border: '1px solid rgba(255, 255, 255, 0.12)',
  borderRadius: 8,
  color: '#fff',
  padding: '9px 12px',
  fontSize: 13,
  outline: 'none',
  fontFamily: 'Inter, sans-serif',
};

export default function SupportTab() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | Status | Category>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | Priority>('all');
  const [search, setSearch] = useState('');
  
  // Single ticket modal details
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [detailTab, setDetailTab] = useState<'chat' | 'notes'>('chat');
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  // Feature 6: Canned template replies
  const [cannedReplies, setCannedReplies] = useState<CannedReply[]>([]);
  
  // Feature 8: Private internal admin notes
  const [internalNoteText, setInternalNoteText] = useState('');
  const [submittingNote, setSubmittingNote] = useState(false);

  // Feature 10: Bulk Ticket Resolution check selection list
  const [selectedTicketIds, setSelectedTicketIds] = useState<string[]>([]);

  const fetchTickets = async () => {
    try {
      const res = await fetch(`/api/support/tickets?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setTickets(data.tickets);
      }
    } catch {
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchCannedReplies = async () => {
    try {
      const res = await fetch('/api/support/canned');
      const data = await res.json();
      if (data.success) {
        setCannedReplies(data.replies);
      }
    } catch {
      console.error('Failed to load canned templates');
    }
  };

  useEffect(() => {
    fetchTickets();
    fetchCannedReplies();

    if (socketManager) {
      const unsub = socketManager.on('NOTIFICATION', () => {
        fetchTickets();
      });
      return unsub;
    }
  }, []);

  // Update local details if the selected ticket is updated in the list
  useEffect(() => {
    if (selectedTicket) {
      const current = tickets.find(t => t.id === selectedTicket.id);
      if (current) setSelectedTicket(current);
    }
  }, [tickets, selectedTicket]);

  const handleCloseTicket = async (id: string) => {
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'close', ticketId: id }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Ticket ${id} marked as Closed`);
        
        if (socketManager) {
          socketManager.emit('NOTIFICATION', {
            type: 'system',
            message: `Support ticket ${id} has been marked as closed.`,
            timestamp: Date.now(),
            read: false,
          });
        }
        
        fetchTickets();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to close ticket');
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;
    setSubmittingReply(true);

    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reply',
          ticketId: selectedTicket.id,
          text: replyText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReplyText('');
        toast.success('Reply submitted!');
        
        if (socketManager) {
          socketManager.emit('NOTIFICATION', {
            type: 'system',
            message: `Support team replied to your ticket "${selectedTicket.subject}"`,
            timestamp: Date.now(),
            read: false,
          });
        }
        
        fetchTickets();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteTicket = async (id: string) => {
    if (!confirm(`Are you sure you want to permanently delete ticket ${id}?`)) return;

    try {
      const res = await fetch(`/api/support/tickets?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Ticket ${id} deleted`);
        setSelectedTicket(null);
        fetchTickets();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete ticket');
    }
  };

  // Feature 7: Administrative department routing handler
  const handleAssignDept = async (dept: string) => {
    if (!selectedTicket) return;
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          ticketId: selectedTicket.id,
          assignedDept: dept
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Ticket routed to department: ${dept}`);
        fetchTickets();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Routing assignment failed');
    }
  };

  // Feature 8: Private internal admin note handler
  const handleAddInternalNote = async () => {
    if (!internalNoteText.trim() || !selectedTicket) return;
    setSubmittingNote(true);
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'note',
          ticketId: selectedTicket.id,
          text: internalNoteText.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setInternalNoteText('');
        toast.success('Internal note logged privately!');
        fetchTickets();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to save note');
    } finally {
      setSubmittingNote(false);
    }
  };

  // Feature 10: Bulk tickets mark-resolved handler
  const handleBulkResolve = async () => {
    if (selectedTicketIds.length === 0) return;
    try {
      const res = await fetch('/api/support/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'bulk-resolve',
          ticketIds: selectedTicketIds
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Successfully resolved ${data.resolvedCount} tickets! 🎫`);
        setSelectedTicketIds([]);
        
        if (socketManager) {
          socketManager.emit('NOTIFICATION', {
            type: 'system',
            message: `Admin bulk-resolved ${data.resolvedCount} tickets.`,
            timestamp: Date.now(),
            read: false,
          });
        }
        
        fetchTickets();
      } else {
        throw new Error(data.error);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to bulk resolve tickets');
    }
  };

  // Feature 9: SLA target hours calculation countdown timer
  const getSLACountdown = (t: Ticket) => {
    if (t.status === 'resolved' || t.status === 'closed') {
      return { text: 'Completed', isBreached: false, color: COLORS.green };
    }
    const createdTime = new Date(t.created.replace(' ', 'T')).getTime();
    const targetTime = createdTime + (t.slaHours * 60 * 60 * 1000);
    const now = Date.now();
    const diff = targetTime - now;

    if (diff < 0) {
      const hoursOver = Math.abs(diff) / (60 * 60 * 1000);
      return {
        text: `Breached by ${hoursOver.toFixed(1)}h`,
        isBreached: true,
        color: COLORS.urgent
      };
    } else {
      const hoursRemaining = Math.floor(diff / (60 * 60 * 1000));
      const minsRemaining = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
      return {
        text: `${hoursRemaining}h ${minsRemaining}m left`,
        isBreached: false,
        color: hoursRemaining <= 2 ? COLORS.high : COLORS.green
      };
    }
  };

  // Stats
  const activeCount = tickets.filter(t => t.status === 'open').length;
  const inProgressCount = tickets.filter(t => t.status === 'in-progress').length;
  const resolvedCount = tickets.filter(t => t.status === 'resolved' || t.status === 'closed').length;
  const breachCount = tickets.filter(t => {
    if (t.status === 'resolved' || t.status === 'closed') return false;
    const createdTime = new Date(t.created.replace(' ', 'T')).getTime();
    return (Date.now() - createdTime) > (t.slaHours * 60 * 60 * 1000);
  }).length;

  const stats = [
    { label: 'Open Tickets', value: activeCount, color: COLORS.blue },
    { label: 'In Progress', value: inProgressCount, color: COLORS.high },
    { label: 'Resolved / Closed', value: resolvedCount, color: COLORS.green },
    { label: 'SLA Breaches', value: breachCount, color: COLORS.urgent },
  ];

  const filters = ['all', 'open', 'in-progress', 'resolved', 'closed', 'billing', 'technical', 'account', 'content'];

  const filtered = tickets.filter(t => {
    const matchesFilter = filter === 'all' || t.status === filter || t.category === filter;
    const matchesPriority = priorityFilter === 'all' || t.priority === priorityFilter;
    const matchesSearch = 
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.user.toLowerCase().includes(search.toLowerCase()) ||
      t.subject.toLowerCase().includes(search.toLowerCase()) ||
      t.message.toLowerCase().includes(search.toLowerCase()) ||
      (t.assignedDept && t.assignedDept.toLowerCase().includes(search.toLowerCase()));
    return matchesFilter && matchesPriority && matchesSearch;
  });

  if (loading) {
    return (
      <div style={{ padding: '40px 0', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <div style={{ width: 40, height: 40, border: '3.5px solid rgba(176, 136, 80, 0.1)', borderTopColor: COLORS.green, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: '#888', fontSize: 13, fontWeight: 500, fontFamily: 'Inter, sans-serif' }}>Synchronizing Support Operations...</div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", color: COLORS.text, minHeight: '100%' }}>
      
      {/* Stats Bar */}
      <fm.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {stats.map((s, i) => (
          <fm.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px 24px' }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: s.color, fontFamily: "'Outfit', sans-serif", lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 12, color: COLORS.muted, marginTop: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{s.label}</div>
          </fm.div>
        ))}
      </fm.div>

      {/* Bulk Action Controls */}
      {selectedTicketIds.length > 0 && (
        <fm.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
          style={{
            background: 'rgba(176, 136, 80, 0.1)', border: `1px solid ${COLORS.green}33`,
            borderRadius: 12, padding: '12px 20px', marginBottom: 18,
            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
          }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.green }}>
            Selected {selectedTicketIds.length} tickets for operations.
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleBulkResolve}
              style={{
                padding: '6px 14px', borderRadius: 8, background: COLORS.green, color: '#000',
                border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 800
              }}>
              Resolve Checked
            </button>
            <button onClick={() => setSelectedTicketIds([])}
              style={{
                padding: '6px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)',
                color: COLORS.text, border: `1px solid ${COLORS.border}`, cursor: 'pointer', fontSize: 12, fontWeight: 600
              }}>
              Clear Selection
            </button>
          </div>
        </fm.div>
      )}

      {/* Filters & Search Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, flexWrap: 'wrap', gap: 14 }}>
        
        {/* Navigation Filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filters.map(f => (
            <button key={f} onClick={() => setFilter(f as any)}
              style={{ 
                padding: '6px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', textTransform: 'capitalize', transition: 'all 0.2s',
                border: `1px solid ${filter === f ? COLORS.green : COLORS.border}`, 
                background: filter === f ? 'rgba(176, 136, 80, 0.12)' : 'transparent', 
                color: filter === f ? COLORS.green : COLORS.muted 
              }}>
              {f}
            </button>
          ))}
        </div>

        {/* Priority & Search inputs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value as any)} style={{ ...inputStyle, width: 130 }}>
            <option value="all">All Priorities</option>
            <option value="urgent">🔴 Urgent</option>
            <option value="high">🟠 High</option>
            <option value="medium">🟡 Medium</option>
            <option value="low">🟢 Low</option>
          </select>

          <div style={{ position: 'relative' }}>
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search logs..."
              style={{ ...inputStyle, width: 220, paddingLeft: 34 }} />
            <Search size={13} color="#666" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          </div>
        </div>
      </div>

      {/* Ticket Logs Table */}
      <fm.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}`, color: '#4b5563', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                <th style={{ padding: '14px 16px', width: 30 }}>
                  <input type="checkbox" checked={filtered.length > 0 && selectedTicketIds.length === filtered.length}
                    onChange={e => {
                      if (e.target.checked) {
                        setSelectedTicketIds(filtered.map(x => x.id));
                      } else {
                        setSelectedTicketIds([]);
                      }
                    }}
                    style={{ accentColor: COLORS.green, cursor: 'pointer' }}
                  />
                </th>
                <th style={{ padding: '14px 16px' }}>ID</th>
                <th style={{ padding: '14px 16px' }}>User</th>
                <th style={{ padding: '14px 16px' }}>Subject</th>
                <th style={{ padding: '14px 16px' }}>Category</th>
                <th style={{ padding: '14px 16px' }}>Department</th>
                <th style={{ padding: '14px 16px' }}>Priority</th>
                <th style={{ padding: '14px 16px' }}>Status</th>
                <th style={{ padding: '14px 16px' }}>SLA Timer</th>
                <th style={{ padding: '14px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={10} style={{ padding: 40, textAlign: 'center', color: '#555' }}>No support tickets match selected criteria</td>
                </tr>
              ) : (
                filtered.map((t, i) => {
                  const sla = getSLACountdown(t);
                  return (
                    <fm.tr key={t.id} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                       style={{ borderBottom: `1px solid ${COLORS.border}`, height: 52 }}
                       onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.015)')}
                       onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <td style={{ padding: '14px 16px' }}>
                        <input type="checkbox" checked={selectedTicketIds.includes(t.id)}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedTicketIds(prev => [...prev, t.id]);
                            } else {
                              setSelectedTicketIds(prev => prev.filter(x => x !== t.id));
                            }
                          }}
                          style={{ accentColor: COLORS.green, cursor: 'pointer' }}
                        />
                      </td>
                      <td style={{ padding: '14px 16px', color: COLORS.muted }}>{t.id}</td>
                      <td style={{ padding: '14px 16px', fontWeight: 600 }}>{t.user}</td>
                      <td style={{ padding: '14px 16px', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.subject}</td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', textTransform: 'uppercase' }}>
                          {t.category}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: COLORS.green, fontSize: 12 }}>
                        {t.assignedDept || 'General Support'}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${priorityColor[t.priority]}15`, color: priorityColor[t.priority], textTransform: 'uppercase' }}>
                          {t.priority}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${statusColor[t.status]}15`, color: statusColor[t.status], textTransform: 'uppercase' }}>
                          {t.status}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span style={{ color: sla.color, fontWeight: 700, fontSize: 11.5, display: 'flex', alignItems: 'center', gap: 4 }}>
                          {sla.isBreached ? <ShieldAlert size={12} /> : <Clock size={12} />}
                          {sla.text}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => setSelectedTicket(t)} 
                            style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${COLORS.border}`, background: 'rgba(255,255,255,0.03)', color: COLORS.text, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.03)'}>
                            View
                          </button>
                          <button onClick={() => setSelectedTicket(t)} 
                            style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${COLORS.green}33`, background: 'rgba(176, 136, 80,0.08)', color: COLORS.green, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(176, 136, 80,0.18)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(176, 136, 80,0.08)'}>
                            Reply
                          </button>
                          {t.status !== 'closed' && (
                            <button onClick={() => handleCloseTicket(t.id)} 
                              style={{ padding: '4px 10px', borderRadius: 6, border: `1px solid ${COLORS.urgent}33`, background: 'rgba(239,68,68,0.08)', color: COLORS.urgent, cursor: 'pointer', fontSize: 11, fontWeight: 600 }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.18)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
                              Close
                            </button>
                          )}
                        </div>
                      </td>
                    </fm.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </fm.div>

      {/* Ticket Details Chat Modal */}
      <AnimatePresence>
        {selectedTicket && (
          <fm.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 20, backdropFilter: 'blur(8px)' }}
            onClick={e => { if (e.target === e.currentTarget) setSelectedTicket(null); }}>
            <fm.div initial={{ scale: 0.95, opacity: 0, y: 15 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 15 }}
              style={{ background: '#101010', border: `1px solid ${COLORS.border}`, borderRadius: 18, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'hidden', padding: 28, display: 'flex', flexDirection: 'column' }}
              onClick={e => e.stopPropagation()}>
              
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20, flexShrink: 0 }}>
                <div>
                  <div style={{ fontSize: 11, color: COLORS.muted, fontWeight: 700, letterSpacing: '0.04em' }}>{selectedTicket.id} · SLA {selectedTicket.slaHours}h Target</div>
                  <h2 style={{ fontSize: 20, fontFamily: "'Outfit', sans-serif", margin: '4px 0 0 0', color: '#fff' }}>{selectedTicket.subject}</h2>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  {(selectedTicket.status === 'resolved' || selectedTicket.status === 'closed') && (
                    <button onClick={() => handleDeleteTicket(selectedTicket.id)}
                      style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.15)', color: COLORS.urgent, padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}
                      onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.08)'}>
                      <Trash2 size={12} /> Delete Log
                    </button>
                  )}
                  <button onClick={() => setSelectedTicket(null)} style={{ background: 'transparent', border: 'none', color: COLORS.muted, fontSize: 20, cursor: 'pointer', display: 'flex', padding: 4 }}
                    onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = COLORS.muted}>
                    <X size={20} />
                  </button>
                </div>
              </div>

              {/* Sub Info bar */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 20, flexShrink: 0 }}>
                {[
                  ['User Account', selectedTicket.user, selectedTicket.email],
                  ['Priority Level', selectedTicket.priority.toUpperCase(), priorityColor[selectedTicket.priority]],
                  ['Current Status', selectedTicket.status.toUpperCase(), statusColor[selectedTicket.status]],
                ].map(([k, v, sub]) => (
                  <div key={k} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px' }}>
                    <div style={{ fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, marginBottom: 3 }}>{k}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: sub && typeof sub === 'string' && sub.startsWith('#') ? sub : '#fff' }}>{v}</div>
                    {sub && !sub.startsWith('#') && <div style={{ fontSize: 9.5, color: COLORS.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sub}</div>}
                  </div>
                ))}

                {/* Feature 7: Administrative Department Routing dropdown */}
                <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8, padding: '10px 12px' }}>
                  <div style={{ fontSize: 9, color: COLORS.muted, textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 700, marginBottom: 3 }}>Department Routing</div>
                  <select value={selectedTicket.assignedDept || 'General Support'}
                    onChange={e => handleAssignDept(e.target.value)}
                    style={{ background: 'transparent', border: 'none', color: COLORS.green, fontSize: 12, fontWeight: 700, outline: 'none', cursor: 'pointer', width: '100%' }}>
                    <option value="General Support">General Support</option>
                    <option value="Billing & Subscriptions">Billing & Subscriptions</option>
                    <option value="Technical Support (Tier 2)">Technical Support (Tier 2)</option>
                    <option value="Account Security">Account Security</option>
                  </select>
                </div>
              </div>

              {/* Feature 8: Private notes / Customer Chat switcher tabs */}
              <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.border}`, marginBottom: 16, flexShrink: 0 }}>
                <button onClick={() => setDetailTab('chat')}
                  style={{
                    padding: '8px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
                    color: detailTab === 'chat' ? COLORS.green : COLORS.muted,
                    borderBottom: `2px solid ${detailTab === 'chat' ? COLORS.green : 'transparent'}`,
                    fontSize: 12.5, fontWeight: 700
                  }}>
                  💬 Customer Chat Thread ({selectedTicket.thread?.length || 0})
                </button>
                <button onClick={() => setDetailTab('notes')}
                  style={{
                    padding: '8px 16px', background: 'transparent', border: 'none', cursor: 'pointer',
                    color: detailTab === 'notes' ? COLORS.medium : COLORS.muted,
                    borderBottom: `2px solid ${detailTab === 'notes' ? COLORS.medium : 'transparent'}`,
                    fontSize: 12.5, fontWeight: 700
                  }}>
                  📝 Private Admin Notes ({selectedTicket.internalNotes?.length || 0})
                </button>
              </div>

              {/* Scrollable Conversations Panel */}
              <div style={{ flex: 1, overflowY: 'auto', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 12, padding: 18, marginBottom: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
                
                {detailTab === 'chat' ? (
                  <>
                    {/* Original Ticket Description */}
                    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                        {selectedTicket.user[0]}
                      </div>
                      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '0 12px 12px 12px', padding: 12, maxWidth: '80%' }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                          <span style={{ fontSize: 11, fontWeight: 700, color: '#fff' }}>{selectedTicket.user}</span>
                          <span style={{ fontSize: 9, color: COLORS.muted }}>{selectedTicket.created}</span>
                        </div>
                        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#e5e7eb' }}>{selectedTicket.message}</p>
                        
                        {/* Attachments rendering */}
                        {selectedTicket.attachments && selectedTicket.attachments.length > 0 && (
                          <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {selectedTicket.attachments.map((file, fIdx) => (
                              <div key={fIdx} style={{ fontSize: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 4, padding: '3px 6px', color: COLORS.green, display: 'flex', alignItems: 'center', gap: 4 }}>
                                📎 {file}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Conversation Thread Messages */}
                    {selectedTicket.thread.map((msg, i) => {
                      const isSupport = msg.sender === 'Support';
                      return (
                        <div key={i} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', alignSelf: isSupport ? 'flex-end' : 'flex-start', flexDirection: isSupport ? 'row-reverse' : 'row' }}>
                          <div style={{ 
                            width: 28, height: 28, borderRadius: '50%', 
                            background: isSupport ? `${COLORS.green}20` : 'rgba(255,255,255,0.08)', 
                            border: `1px solid ${isSupport ? COLORS.green + '40' : 'rgba(255,255,255,0.1)'}`, 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, 
                            color: isSupport ? COLORS.green : '#fff', flexShrink: 0 
                          }}>
                            {isSupport ? 'S' : msg.sender[0]}
                          </div>
                          <div style={{ 
                            background: isSupport ? 'rgba(176, 136, 80,0.05)' : 'rgba(255,255,255,0.02)', 
                            border: `1px solid ${isSupport ? 'rgba(176, 136, 80,0.15)' : 'rgba(255,255,255,0.04)'}`, 
                            borderRadius: isSupport ? '12px 0px 12px 12px' : '0 12px 12px 12px', 
                            padding: 12, maxWidth: '80%' 
                          }}>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                              <span style={{ fontSize: 11, fontWeight: 700, color: isSupport ? COLORS.green : '#fff' }}>{msg.sender}</span>
                              <span style={{ fontSize: 9, color: COLORS.muted }}>{msg.time}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: '#e5e7eb' }}>{msg.text}</p>
                          </div>
                        </div>
                      );
                    })}
                  </>
                ) : (
                  <>
                    {/* Private Internal notes stream list */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {(!selectedTicket.internalNotes || selectedTicket.internalNotes.length === 0) ? (
                        <div style={{ padding: '30px 0', textAlign: 'center', color: COLORS.muted, fontSize: 12.5 }}>
                          No administrative notes recorded on this ticket yet.
                        </div>
                      ) : (
                        selectedTicket.internalNotes.map((note, nIdx) => (
                          <div key={nIdx} style={{ background: 'rgba(234, 179, 8, 0.04)', border: '1px solid rgba(234, 179, 8, 0.15)', borderRadius: 8, padding: 10 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: COLORS.medium, fontWeight: 700, marginBottom: 4 }}>
                              <span>{note.sender}</span>
                              <span>{note.time}</span>
                            </div>
                            <p style={{ margin: 0, fontSize: 12.5, color: '#e5e7eb', lineHeight: 1.4 }}>{note.text}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Chat Input panel / Notes input panel */}
              <div style={{ flexShrink: 0 }}>
                {detailTab === 'chat' ? (
                  <div>
                    {/* Feature 6: Preset canned messages templates selector */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <span style={{ fontSize: 11, color: COLORS.muted, fontWeight: 700 }}>Inject Canned Reply Template:</span>
                      <select defaultValue="" onChange={e => {
                        const val = e.target.value;
                        if (val) {
                          setReplyText(val);
                          e.target.value = "";
                        }
                      }} style={{ ...inputStyle, padding: '4px 8px', fontSize: 11.5, background: 'rgba(0,0,0,0.6)', width: 220 }}>
                        <option value="" disabled>Select response...</option>
                        {cannedReplies.map(r => (
                          <option key={r.id} value={r.text}>{r.title}</option>
                        ))}
                      </select>
                    </div>

                    <div style={{ display: 'flex', gap: 10, position: 'relative' }}>
                      <textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Write an administrative reply..." rows={2}
                        style={{ 
                          width: '100%', background: 'rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '12px 16px', 
                          color: '#fff', fontSize: 13, resize: 'none', outline: 'none', fontFamily: 'Inter, sans-serif', boxSizing: 'border-box' 
                        }} 
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendReply();
                          }
                        }}
                      />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        <button onClick={handleSendReply} disabled={submittingReply || !replyText.trim()}
                          style={{ 
                            flex: 1, padding: '0 18px', background: replyText.trim() ? COLORS.green : 'rgba(255,255,255,0.05)', 
                            border: 'none', borderRadius: 8, color: replyText.trim() ? '#000' : '#666', cursor: replyText.trim() ? 'pointer' : 'not-allowed', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' 
                          }}>
                          {submittingReply ? (
                            <div style={{ width: 14, height: 14, border: '2px solid #000', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.6s linear infinite' }} />
                          ) : <Send size={14} />}
                        </button>
                        {selectedTicket.status !== 'closed' && (
                          <button onClick={() => handleCloseTicket(selectedTicket.id)}
                            style={{ padding: '8px 12px', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)', color: COLORS.urgent, borderRadius: 8, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.18)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.08)'}>
                            Close
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    {/* Add note layout input */}
                    <input value={internalNoteText} onChange={e => setInternalNoteText(e.target.value)} placeholder="Type private internal note (visible only to admins)..."
                      style={{ ...inputStyle, flex: 1, padding: '10px 14px' }}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddInternalNote(); }} />
                    <button onClick={handleAddInternalNote} disabled={submittingNote || !internalNoteText.trim()}
                      style={{ 
                        padding: '0 18px', borderRadius: 8, background: COLORS.medium, color: '#000', border: 'none', 
                        cursor: internalNoteText.trim() ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 800 
                      }}>
                      {submittingNote ? 'Saving...' : 'Save Note'}
                    </button>
                  </div>
                )}
              </div>

            </fm.div>
          </fm.div>
        )}
      </AnimatePresence>
    </div>
  );
}
