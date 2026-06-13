'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, LineChart, Line,
} from 'recharts';
import toast from 'react-hot-toast';

// ─── Money formatter ──────────────────────────────────────────────────────────
function fmt(n: number, symbol: string = '$') {
  if (n >= 1_000_000) return `${symbol}${(n / 1_000_000).toFixed(2)}M`;
  if (n >= 1_000) return `${symbol}${(n / 1_000).toFixed(2)}K`;
  return `${symbol}${n.toFixed(2)}`;
}

// ─── Types ────────────────────────────────────────────────────────────────────
type TxStatus = 'completed' | 'pending' | 'failed' | 'refunded';
type TxFilter = 'All' | 'Completed' | 'Pending' | 'Failed' | 'Refunded';
type View = 'transactions' | 'users' | 'analytics';
type ChartType = 'daily' | 'monthly' | 'method' | 'plan';

interface Tx {
  id: string; userId: string; user: string; email: string; avatar?: string;
  amount: number; plan: string; planLabel: string; method: string;
  date: string; dateTs: number; status: TxStatus;
  currency: string; invoiceId: string; country: string; risk: 'low' | 'medium' | 'high';
  billingCycle: string;
}

interface Stats {
  totalRevenue: number; todayRevenue: number; yesterdayRevenue: number;
  todayTrend: string; monthRevenue: number; mrr: number;
  pendingAmount: number; refundedAmount: number;
  failedCount: number; pendingCount: number; refundedCount: number;
  totalTxns: number; completedCount: number; highRiskCount: number;
  successRate: string; avgOrderValue: number;
  paidUsersCount: number; totalUsersCount: number;
  adRevenue?: number; subscriptionRevenue?: number; platformShare?: number; artistShare?: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────
const SC: Record<TxStatus, string> = { completed: '#1db954', pending: '#f59e0b', failed: '#ef4444', refunded: '#10b981' };
const RC: Record<string, string> = { low: '#1db954', medium: '#f59e0b', high: '#ef4444' };
const PC: Record<string, string> = { free: '#6b7280', student: '#10b981', premium: '#1db954', family: '#10b981', creator: '#f59e0b' };
const MC: Record<string, string> = { Visa: '#1a56db', Mastercard: '#eb4034', PayPal: '#0070ba', UPI: '#7c3aed', 'Apple Pay': '#555', 'Google Pay': '#4285f4', 'Admin Plan': '#34d399', Admin: '#34d399' };
const MI: Record<string, string> = { Visa: '💳', Mastercard: '💳', PayPal: '🅿️', UPI: '📱', 'Apple Pay': '🍎', 'Google Pay': '🔍', 'Admin Plan': '👑', Admin: '👑' };

const inp: React.CSSProperties = { background: '#080808', border: '1px solid #222', borderRadius: 8, color: '#fff', padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box', fontFamily: 'Inter,sans-serif' };
const card: React.CSSProperties = { background: '#0c0c0c', border: '1px solid #1a1a1a', borderRadius: 16 };
const btn = (active?: boolean, color?: string): React.CSSProperties => ({
  padding: '7px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer',
  background: active ? (color || '#1db954') : '#111', color: active ? (color === '#ef4444' ? '#fff' : '#000') : '#6b7280',
  border: `1px solid ${active ? (color || '#1db954') : '#222'}`,
});

// ─── Sub-components ───────────────────────────────────────────────────────────
function Kpi({ label, value, sub, color, icon, trend }: any) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} whileHover={{ y: -2 }}
      style={{ ...card, padding: '20px 22px', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg,${color},transparent)` }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', letterSpacing: '.07em', fontWeight: 700 }}>{label}</div>
        <div style={{ fontSize: 16, background: `${color}18`, borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{icon}</div>
      </div>
      <div style={{ color, fontSize: 26, fontWeight: 800, fontFamily: 'Outfit,sans-serif', lineHeight: 1, marginBottom: 6 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#374151' }}>{sub}</div>}
      {trend !== undefined && (
        <div style={{ fontSize: 11, color: String(trend).startsWith('-') ? '#ef4444' : '#1db954', fontWeight: 600, marginTop: 2 }}>
          {String(trend).startsWith('-') ? '' : '+'}{trend}% vs yesterday
        </div>
      )}
    </motion.div>
  );
}

function Badge({ val, colorMap }: { val: string; colorMap: Record<string, string> }) {
  const c = colorMap[val] || '#6b7280';
  return <span style={{ background: `${c}18`, color: c, border: `1px solid ${c}30`, padding: '2px 9px', borderRadius: 20, fontSize: 10, fontWeight: 700, textTransform: 'capitalize' }}>{val}</span>;
}

// ─── Invoice Modal ─────────────────────────────────────────────────────────────
function InvoiceModal({ tx, onClose }: { tx: Tx; onClose: () => void }) {
  const planColor = PC[tx.plan] || '#6b7280';
  const sym = tx.currency === 'INR' ? '₹' : '$';
  
  const printInvoice = () => {
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(`
      <html><head><title>Invoice ${tx.invoiceId}</title>
      <style>body{font-family:Inter,sans-serif;background:#fff;color:#000;padding:40px;max-width:700px;margin:0 auto;}
      h1{font-size:28px;margin-bottom:4px;} .sub{color:#666;font-size:14px;margin-bottom:32px;}
      table{width:100%;border-collapse:collapse;margin-bottom:24px;}
      th{text-align:left;padding:10px 14px;background:#f5f5f5;font-size:12px;text-transform:uppercase;letter-spacing:.05em;}
      td{padding:12px 14px;border-bottom:1px solid #eee;font-size:14px;}
      .total{font-size:20px;font-weight:700;text-align:right;}
      .badge{display:inline-block;padding:3px 12px;border-radius:20px;font-size:12px;font-weight:700;}
      </style></head><body>
      <h1>🎵 Beato</h1>
      <div class="sub">Invoice ${tx.invoiceId} · ${tx.date}</div>
      <table><thead><tr><th>Description</th><th>Plan</th><th>Method</th><th>Status</th><th>Amount</th></tr></thead>
      <tbody><tr><td>Subscription — ${tx.planLabel}</td><td>${tx.planLabel}</td><td>${tx.method}</td>
      <td><span class="badge" style="background:${tx.status==='completed'?'#dcfce7':'#fee2e2'};color:${tx.status==='completed'?'#16a34a':'#dc2626'}">${tx.status}</span></td>
      <td><strong>${sym}${tx.amount.toFixed(2)} ${tx.currency}</strong></td></tr></tbody></table>
      <div style="text-align:right;"><p>Billed to: <strong>${tx.user}</strong> (${tx.email})</p>
      <p>Country: ${tx.country} | Billing Cycle: ${tx.billingCycle}</p>
      <p class="total">Total: ${sym}${tx.amount.toFixed(2)} ${tx.currency}</p></div>
      <hr style="margin:24px 0;"/><p style="color:#888;font-size:12px;text-align:center;">Beato Inc. · support@beato.io · This is an auto-generated invoice.</p>
      </body></html>`);
    w.document.close(); w.print();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 20, padding: 32, width: 560, maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Invoice Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ fontSize: 20 }}>🎵</div>
              <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'Outfit,sans-serif' }}>Beato</span>
            </div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Tax Invoice</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#fff', fontFamily: 'Outfit,sans-serif' }}>{tx.invoiceId}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{tx.date}</div>
          </div>
        </div>

        {/* Billed To */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <div style={{ background: '#111', padding: 16, borderRadius: 12, border: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>Billed To</div>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{tx.user}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{tx.email}</div>
            <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>📍 {tx.country}</div>
          </div>
          <div style={{ background: '#111', padding: 16, borderRadius: 12, border: '1px solid #1a1a1a' }}>
            <div style={{ fontSize: 10, color: '#4b5563', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>Payment Details</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{MI[tx.method]} {tx.method}</div>
            <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>Billing: {tx.billingCycle}</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>Currency: {tx.currency}</div>
          </div>
        </div>

        {/* Line Items */}
        <div style={{ background: '#111', borderRadius: 12, border: '1px solid #1a1a1a', overflow: 'hidden', marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '10px 16px', borderBottom: '1px solid #1a1a1a', gap: 12 }}>
            <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', fontWeight: 700 }}>Description</div>
            <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', fontWeight: 700 }}>Qty</div>
            <div style={{ fontSize: 10, color: '#4b5563', textTransform: 'uppercase', fontWeight: 700 }}>Amount</div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', padding: '14px 16px', gap: 12, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Beato {tx.planLabel} — Monthly Subscription</div>
              <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>Full access to all {tx.planLabel} features · Auto-renews monthly</div>
            </div>
            <div style={{ fontSize: 14, textAlign: 'center' }}>1</div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1db954' }}>{sym}{tx.amount.toFixed(2)}</div>
          </div>
          <div style={{ borderTop: '1px solid #1a1a1a', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Subtotal</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{sym}{tx.amount.toFixed(2)}</div>
          </div>
          <div style={{ padding: '0 16px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 12, color: '#6b7280' }}>Tax (0%)</div>
            <div style={{ fontSize: 12, color: '#9ca3af' }}>{sym}0.00</div>
          </div>
          <div style={{ background: '#161616', padding: '14px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: 14, fontWeight: 700 }}>Total Due</div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1db954', fontFamily: 'Outfit,sans-serif' }}>{sym}{tx.amount.toFixed(2)} {tx.currency}</div>
          </div>
        </div>

        {/* Status */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <Badge val={tx.status} colorMap={SC} />
          <span style={{ marginLeft: 10, fontSize: 12, color: '#6b7280' }}>
            {tx.status === 'completed' ? '✅ Payment received successfully' :
             tx.status === 'pending' ? '⏳ Awaiting payment confirmation' :
             tx.status === 'failed' ? '❌ Payment failed — retry required' :
             '↩️ Refund has been processed'}
          </span>
        </div>

        {/* Footer */}
        <div style={{ fontSize: 11, color: '#374151', textAlign: 'center', marginBottom: 24, lineHeight: 1.6 }}>
          Beato Inc. · support@beato.io<br />This is an official payment receipt.
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={printInvoice} style={{ flex: 1, background: '#1db954', border: 'none', color: '#000', borderRadius: 10, padding: '12px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
            🖨️ Print Invoice
          </button>
          <button onClick={onClose} style={{ flex: 1, background: '#111', border: '1px solid #2a2a2a', color: '#9ca3af', borderRadius: 10, padding: '12px', fontSize: 13, cursor: 'pointer' }}>
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Refund Modal ─────────────────────────────────────────────────────────────
function RefundModal({ tx, onClose, onRefund }: { tx: Tx; onClose: () => void; onRefund: (amount: string, reason: string) => void }) {
  const [amount, setAmount] = useState(tx.amount.toFixed(2));
  const [reason, setReason] = useState('');
  const [type, setType] = useState<'full' | 'partial'>('full');
  const sym = tx.currency === 'INR' ? '₹' : '$';

  useEffect(() => { setAmount(type === 'full' ? tx.amount.toFixed(2) : ''); }, [type, tx.amount]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
        onClick={e => e.stopPropagation()}
        style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 20, padding: 32, width: 440 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <div style={{ background: '#10b98118', borderRadius: 12, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>↩️</div>
          <div>
            <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Process Refund</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#6b7280', fontFamily: 'monospace' }}>{tx.invoiceId}</p>
          </div>
        </div>

        {/* User info */}
        <div style={{ background: '#111', padding: '12px 16px', borderRadius: 10, border: '1px solid #1a1a1a', marginBottom: 20, display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{tx.user}</div>
            <div style={{ fontSize: 12, color: '#6b7280' }}>{tx.email}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1db954' }}>{sym}{tx.amount.toFixed(2)}</div>
            <div style={{ fontSize: 11, color: '#6b7280' }}>{tx.method}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          {(['full', 'partial'] as const).map(t => (
            <button key={t} onClick={() => setType(t)} style={{ ...btn(type === t, '#10b981'), flex: 1, textTransform: 'capitalize' }}>{t} Refund</button>
          ))}
        </div>

        {type === 'partial' && (
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>Refund Amount ({sym})</label>
            <input type="number" value={amount} onChange={e => setAmount(e.target.value)} style={{ ...inp, width: '100%' }} max={tx.amount} min={0.01} step={0.01} placeholder={`Max: ${sym}${tx.amount.toFixed(2)}`} />
          </div>
        )}

        <div style={{ marginBottom: 20 }}>
          <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>Reason for Refund *</label>
          <select value={reason} onChange={e => setReason(e.target.value)} style={{ ...inp, width: '100%' }}>
            <option value="">Select reason…</option>
            <option value="customer_request">Customer Request</option>
            <option value="duplicate_charge">Duplicate Charge</option>
            <option value="service_not_received">Service Not Received</option>
            <option value="fraudulent">Fraudulent Transaction</option>
            <option value="subscription_cancel">Subscription Cancelled</option>
            <option value="other">Other</option>
          </select>
        </div>

        <div style={{ background: '#f59e0b18', border: '1px solid #f59e0b33', borderRadius: 10, padding: '10px 14px', marginBottom: 20, fontSize: 12, color: '#f59e0b' }}>
          ⚠️ Refunds take 3–5 business days. The amount will be returned to the original payment method ({tx.method}).
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={onClose} style={{ flex: 1, background: '#111', border: '1px solid #2a2a2a', color: '#9ca3af', borderRadius: 10, padding: '11px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
          <button disabled={!reason || !amount}
            onClick={() => onRefund(amount, reason)}
            style={{ flex: 1, background: reason && amount ? '#10b981' : '#2a1a3a', border: 'none', color: reason && amount ? '#fff' : '#555', borderRadius: 10, padding: '11px', fontWeight: 700, fontSize: 13, cursor: reason && amount ? 'pointer' : 'not-allowed' }}>
            Process Refund {sym}{Number(amount || 0).toFixed(2)}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────
export default function PaymentsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [dailyRevenue, setDailyRevenue] = useState<any[]>([]);
  const [monthlyRevenue, setMonthlyRevenue] = useState<any[]>([]);
  const [methodData, setMethodData] = useState<any[]>([]);
  const [planRevenue, setPlanRevenue] = useState<any[]>([]);
  const [userBreakdown, setUserBreakdown] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState('');
  const [symbol, setSymbol] = useState('$');

  const [view, setView] = useState<View>('transactions');
  const [chartType, setChartType] = useState<ChartType>('daily');
  const [filter, setFilter] = useState<TxFilter>('All');
  const [search, setSearch] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');
  const [riskFilter, setRiskFilter] = useState('all');
  const [sortField, setSortField] = useState('dateTs');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [selected, setSelected] = useState<string[]>([]);
  const [liveMode, setLiveMode] = useState(true);

  const [invoiceModal, setInvoiceModal] = useState<Tx | null>(null);
  const [refundModal, setRefundModal] = useState<Tx | null>(null);
  const [changeMethodModal, setChangeMethodModal] = useState<any | null>(null);
  const [newMethod, setNewMethod] = useState('Visa');

  const timerRef = useRef<any>(null);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch(`/api/admin/payments?t=${Date.now()}`, { cache: 'no-store' });
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setTransactions(data.transactions);
        setDailyRevenue(data.dailyRevenue || []);
        setMonthlyRevenue(data.monthlyRevenue || []);
        setMethodData(data.methodData || []);
        setPlanRevenue(data.revenueByPlan || []);
        setUserBreakdown(data.userBreakdown || []);
        setLastUpdated(new Date().toLocaleTimeString());
        if (data.symbol) {
          setSymbol(data.symbol);
        }
      }
    } catch { toast.error('Failed to load payment data'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => {
    fetchData();
    if (liveMode) { timerRef.current = setInterval(fetchData, 6000); }
    return () => clearInterval(timerRef.current);
  }, [fetchData, liveMode]);

  const callApi = async (body: object) => {
    const res = await fetch('/api/admin/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error);
    return data;
  };

  const handleAction = async (action: string, tx: Tx) => {
    try {
      const d = await callApi({ action, txId: tx.id, userId: tx.userId, amount: tx.amount });
      toast.success(d.message);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const handleRefund = async (amount: string, reason: string) => {
    if (!refundModal) return;
    try {
      const d = await callApi({ action: 'refund', txId: refundModal.id, userId: refundModal.userId, amount, reason });
      toast.success(d.message);
      setRefundModal(null);
      fetchData();
    } catch (e: any) { toast.error(e.message); }
  };

  const exportCSV = () => {
    const h = ['TXN ID', 'Invoice', 'User', 'Email', 'Amount', 'Plan', 'Method', 'Date', 'Status', 'Risk', 'Country'];
    const csv = [h.join(','), ...filteredTxns.map(t => [t.id, t.invoiceId, `"${t.user}"`, t.email, t.amount, t.plan, t.method, t.date, t.status, t.risk, t.country].join(','))].join('\n');
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), download: `payments_${new Date().toISOString().slice(0, 10)}.csv` });
    a.click(); toast.success('Exported!');
  };

  const handleSort = (f: string) => { if (sortField === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc'); else { setSortField(f); setSortDir('desc'); } };

  const filteredTxns = transactions.filter(t => {
    if (filter !== 'All' && t.status !== filter.toLowerCase()) return false;
    if (search && !t.user.toLowerCase().includes(search.toLowerCase()) && !t.email.toLowerCase().includes(search.toLowerCase()) && !t.id.toLowerCase().includes(search.toLowerCase()) && !t.invoiceId.toLowerCase().includes(search.toLowerCase())) return false;
    if (methodFilter !== 'all' && t.method !== methodFilter) return false;
    if (riskFilter !== 'all' && t.risk !== riskFilter) return false;
    return true;
  }).sort((a, b) => {
    const va = (a as any)[sortField], vb = (b as any)[sortField];
    return sortDir === 'asc' ? (va < vb ? -1 : 1) : (va > vb ? -1 : 1);
  });

  const TH = ({ label, field }: { label: string; field?: string }) => (
    <th onClick={() => field && handleSort(field)} style={{ padding: '10px 12px', textAlign: 'left', color: '#4b5563', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap', cursor: field ? 'pointer' : 'default' }}>
      {label} {field && <span style={{ color: sortField === field ? '#1db954' : '#333' }}>{sortField === field ? (sortDir === 'asc' ? '↑' : '↓') : '↕'}</span>}
    </th>
  );

  const FILTERS: TxFilter[] = ['All', 'Completed', 'Pending', 'Failed', 'Refunded'];
  const paidCount = stats?.paidUsersCount ?? 0;
  const totalCount = stats?.totalUsersCount ?? 0;

  return (
    <div style={{ padding: '24px 0', fontFamily: 'Inter,sans-serif', color: '#fff' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, fontFamily: 'Outfit,sans-serif' }}>💰 Payment Management</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {liveMode && <motion.div animate={{ scale: [1, 1.6, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 1.5, repeat: Infinity }} style={{ width: 7, height: 7, borderRadius: '50%', background: '#1db954' }} />}
              <span style={{ fontSize: 11, color: liveMode ? '#1db954' : '#6b7280', fontWeight: 700 }}>{liveMode ? 'LIVE' : 'PAUSED'}</span>
            </div>
            {lastUpdated && <span style={{ fontSize: 11, color: '#4b5563' }}>Updated {lastUpdated}</span>}
            <span style={{ fontSize: 11, color: '#4b5563' }}>📊 {paidCount} paid · {totalCount - paidCount} free · {totalCount} total users</span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {(['transactions', 'users', 'analytics'] as View[]).map(v => (
            <button key={v} onClick={() => setView(v)} style={{ ...btn(view === v), textTransform: 'capitalize' }}>{v}</button>
          ))}
          <button onClick={() => setLiveMode(m => !m)} style={{ ...btn(liveMode, '#1db954') }}>{liveMode ? '⏸ Pause' : '▶ Live'}</button>
          <button onClick={fetchData} style={{ ...btn(false) }}>↻</button>
          <button onClick={exportCSV} style={{ background: '#1db954', border: 'none', color: '#000', borderRadius: 20, padding: '7px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>⬇ Export</button>
        </div>
      </div>

      {/* ── KPI Grid ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <Kpi label="Total Revenue" value={loading ? '…' : fmt(stats?.totalRevenue || 0, symbol)} color="#1db954" icon="💰" sub={`${stats?.completedCount || 0} completed transactions`} />
        <Kpi label="Today's Revenue" value={loading ? '…' : fmt(stats?.todayRevenue || 0, symbol)} color="#10b981" icon="📈" trend={stats?.todayTrend} />
        <Kpi label="Monthly Recurring" value={loading ? '…' : fmt(stats?.mrr || 0, symbol)} color="#10b981" icon="🔄" sub="Active paid subscriptions" />
        <Kpi label="Avg Order Value" value={loading ? '…' : `${symbol}${(stats?.avgOrderValue || 0).toFixed(2)}`} color="#f59e0b" icon="🎯" sub="Per completed txn" />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 12 }}>
        <Kpi label="Pending Payouts" value={loading ? '…' : fmt(stats?.pendingAmount || 0, symbol)} color="#f59e0b" icon="⏳" sub={`${stats?.pendingCount || 0} pending`} />
        <Kpi label="Failed" value={loading ? '…' : `${stats?.failedCount || 0}`} color="#ef4444" icon="❌" sub={`${stats?.highRiskCount || 0} high-risk`} />
        <Kpi label="Refunded" value={loading ? '…' : fmt(stats?.refundedAmount || 0, symbol)} color="#10b981" icon="↩️" sub={`${stats?.refundedCount || 0} refunds`} />
        <Kpi label="Success Rate" value={loading ? '…' : `${stats?.successRate || 0}%`} color="#1db954" icon="✅" sub={`${stats?.completedCount || 0}/${stats?.totalTxns || 0} txns`} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 28 }}>
        <Kpi label="Ad Revenue" value={loading ? '…' : fmt(stats?.adRevenue || 0, symbol)} color="#06b6d4" icon="📢" sub="From free-tier streams" />
        <Kpi label="Subscription Revenue" value={loading ? '…' : fmt(stats?.subscriptionRevenue || 0, symbol)} color="#34d399" icon="💳" sub="From paid subscriptions" />
        <Kpi label="Platform Share" value={loading ? '…' : fmt(stats?.platformShare || 0, symbol)} color="#10b981" icon="🏢" sub="20% net stream split" />
        <Kpi label="Artist Share" value={loading ? '…' : fmt(stats?.artistShare || 0, symbol)} color="#10b981" icon="🎵" sub="70% net stream split" />
      </div>

      <AnimatePresence mode="wait">

        {/* ══ TRANSACTIONS VIEW ══ */}
        {view === 'transactions' && (
          <motion.div key="txns" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ ...card, padding: 24 }}>
              {/* Controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Outfit,sans-serif' }}>
                    All Transactions ({filteredTxns.length})
                    {selected.length > 0 && <span style={{ marginLeft: 10, fontSize: 12, color: '#1db954' }}>{selected.length} selected</span>}
                  </div>
                  {selected.length > 0 && (
                    <button onClick={() => { toast.success(`Exported ${selected.length} transactions`); setSelected([]); }}
                      style={{ background: '#10b981', border: 'none', color: '#fff', borderRadius: 8, padding: '7px 14px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                      Export {selected.length} Selected
                    </button>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                  <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search ID / invoice / user…" style={{ ...inp, width: 240 }} />
                  <select value={methodFilter} onChange={e => setMethodFilter(e.target.value)} style={{ ...inp, width: 130 }}>
                    <option value="all">All Methods</option>
                    {['Visa', 'Mastercard', 'PayPal', 'UPI', 'Apple Pay', 'Google Pay'].map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select value={riskFilter} onChange={e => setRiskFilter(e.target.value)} style={{ ...inp, width: 120 }}>
                    <option value="all">All Risk</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {FILTERS.map(f => <button key={f} onClick={() => setFilter(f)} style={btn(filter === f)}>{f}</button>)}
                  </div>
                </div>
              </div>

              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 960 }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <th style={{ width: 36, padding: '10px 8px' }}>
                        <input type="checkbox" checked={selected.length === filteredTxns.length && filteredTxns.length > 0} onChange={() => setSelected(selected.length === filteredTxns.length ? [] : filteredTxns.map(t => t.id))} style={{ accentColor: '#1db954' }} />
                      </th>
                      <TH label="Invoice / TXN" field="invoiceId" />
                      <TH label="User" field="user" />
                      <TH label="Amount" field="amount" />
                      <TH label="Plan" field="plan" />
                      <TH label="Method" field="method" />
                      <TH label="Date" field="dateTs" />
                      <TH label="Risk" field="risk" />
                      <TH label="Status" field="status" />
                      <TH label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    <AnimatePresence>
                      {filteredTxns.map((tx, i) => (
                        <motion.tr key={tx.id}
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          transition={{ delay: Math.min(i * 0.015, 0.3) }}
                          style={{ borderBottom: '1px solid #111', background: selected.includes(tx.id) ? 'rgba(29, 185, 84,0.04)' : 'transparent' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLTableRowElement).style.background = '#0f0f0f'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLTableRowElement).style.background = selected.includes(tx.id) ? 'rgba(29, 185, 84,0.04)' : 'transparent'; }}>
                          <td style={{ padding: '11px 8px' }}>
                            <input type="checkbox" checked={selected.includes(tx.id)} onChange={() => setSelected(p => p.includes(tx.id) ? p.filter(x => x !== tx.id) : [...p, tx.id])} style={{ accentColor: '#1db954' }} />
                          </td>
                          <td style={{ padding: '11px 12px' }}>
                            <div style={{ fontSize: 11, color: '#6b7280', fontFamily: 'monospace' }}>{tx.id}</div>
                            <div style={{ fontSize: 10, color: '#374151', marginTop: 2, fontFamily: 'monospace' }}>{tx.invoiceId}</div>
                          </td>
                          <td style={{ padding: '11px 12px' }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{tx.user}</div>
                            <div style={{ fontSize: 10, color: '#4b5563' }}>{tx.email} · {tx.country}</div>
                          </td>
                          <td style={{ padding: '11px 12px' }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#1db954', fontFamily: 'Outfit,sans-serif' }}>{symbol}{tx.amount.toFixed(2)}</div>
                            <div style={{ fontSize: 10, color: '#4b5563' }}>{tx.currency}</div>
                          </td>
                          <td style={{ padding: '11px 12px' }}>
                            <Badge val={tx.planLabel} colorMap={{ [tx.planLabel]: PC[tx.plan] || '#6b7280' }} />
                          </td>
                          <td style={{ padding: '11px 12px', fontSize: 12, color: '#9ca3af', whiteSpace: 'nowrap' }}>
                            {MI[tx.method] || '💳'} {tx.method}
                          </td>
                          <td style={{ padding: '11px 12px' }}>
                            <div style={{ fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{tx.date}</div>
                            <div style={{ fontSize: 10, color: '#374151' }}>{tx.billingCycle}</div>
                          </td>
                          <td style={{ padding: '11px 12px' }}><Badge val={tx.risk} colorMap={RC} /></td>
                          <td style={{ padding: '11px 12px' }}><Badge val={tx.status} colorMap={SC} /></td>
                          <td style={{ padding: '11px 12px' }}>
                            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                              <button onClick={() => setInvoiceModal(tx)} style={{ background: '#161616', border: '1px solid #2a2a2a', color: '#9ca3af', borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>📄 Invoice</button>
                              {tx.status === 'completed' && <button onClick={() => setRefundModal(tx)} style={{ background: '#10b98118', border: '1px solid #10b98130', color: '#10b981', borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>↩ Refund</button>}
                              {tx.status === 'failed' && <button onClick={() => handleAction('retry', tx)} style={{ background: '#f59e0b18', border: '1px solid #f59e0b30', color: '#f59e0b', borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>🔄 Retry</button>}
                              {tx.risk === 'high' && <button onClick={() => handleAction('flag', tx)} style={{ background: '#ef444418', border: '1px solid #ef444430', color: '#ef4444', borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>🚩 Flag</button>}
                              <button onClick={() => handleAction('send_invoice', tx)} style={{ background: '#10b98118', border: '1px solid #10b98130', color: '#10b981', borderRadius: 6, padding: '4px 8px', fontSize: 10, fontWeight: 600, cursor: 'pointer' }}>📧</button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </AnimatePresence>
                    {filteredTxns.length === 0 && !loading && (
                      <tr><td colSpan={10} style={{ padding: 48, textAlign: 'center', color: '#374151', fontSize: 13 }}>
                        No transactions found.{filter !== 'All' || search ? ' Try clearing filters.' : ' Add paid users to see payment history.'}
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        )}

        {/* ══ USERS VIEW ══ */}
        {view === 'users' && (
          <motion.div key="users" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ ...card, padding: 24 }}>
              <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Outfit,sans-serif', marginBottom: 20 }}>
                Paying Users ({userBreakdown.length})
                <span style={{ marginLeft: 10, fontSize: 12, color: '#4b5563', fontWeight: 400 }}>{totalCount - paidCount} free users not shown</span>
              </div>
              {userBreakdown.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', color: '#374151', fontSize: 13 }}>No paying users yet. Upgrade users to a paid plan to see billing data.</div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                        {['User', 'Plan', 'Total Paid', 'Method', 'Transactions', 'Last Payment', 'Status', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '10px 12px', textAlign: 'left', color: '#4b5563', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', whiteSpace: 'nowrap' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {userBreakdown.map((u, i) => (
                        <motion.tr key={u.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.06 }}
                          style={{ borderBottom: '1px solid #111' }}
                          onMouseEnter={e => (e.currentTarget as HTMLTableRowElement).style.background = '#0f0f0f'}
                          onMouseLeave={e => (e.currentTarget as HTMLTableRowElement).style.background = 'transparent'}>
                          <td style={{ padding: '12px 12px' }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>{u.name}</div>
                            <div style={{ fontSize: 10, color: '#4b5563' }}>{u.email} · {u.country}</div>
                          </td>
                          <td style={{ padding: '12px 12px' }}>
                            <Badge val={u.plan} colorMap={PC} />
                          </td>
                          <td style={{ padding: '12px 12px' }}>
                            <div style={{ fontSize: 16, fontWeight: 800, color: '#1db954', fontFamily: 'Outfit,sans-serif' }}>{symbol}{u.totalPaid.toFixed(2)}</div>
                          </td>
                          <td style={{ padding: '12px 12px', fontSize: 12, color: '#9ca3af' }}>{MI[u.method] || '💳'} {u.method}</td>
                          <td style={{ padding: '12px 12px', fontSize: 13, color: '#e5e7eb', textAlign: 'center' }}>{u.txCount}</td>
                          <td style={{ padding: '12px 12px', fontSize: 12, color: '#6b7280', whiteSpace: 'nowrap' }}>{u.lastPayment}</td>
                          <td style={{ padding: '12px 12px' }}><Badge val={u.status} colorMap={{ active: '#1db954', suspended: '#ef4444' }} /></td>
                          <td style={{ padding: '12px 12px' }}>
                            <div style={{ display: 'flex', gap: 6 }}>
                              <button onClick={() => { const tx = transactions.find(t => t.userId === u.id); if (tx) setInvoiceModal(tx); }}
                                style={{ background: '#161616', border: '1px solid #2a2a2a', color: '#9ca3af', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>View Invoice</button>
                              <button onClick={() => { setChangeMethodModal(u); setNewMethod(u.method || 'Visa'); }}
                                style={{ background: '#10b98118', border: '1px solid #10b98130', color: '#10b981', borderRadius: 6, padding: '5px 10px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Update Method</button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* ══ ANALYTICS VIEW ══ */}
        {view === 'analytics' && (
          <motion.div key="analytics" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div style={{ ...card, padding: 24, marginBottom: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'Outfit,sans-serif' }}>Revenue Analytics</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {(['daily', 'monthly', 'method', 'plan'] as ChartType[]).map(c => (
                    <button key={c} onClick={() => setChartType(c)} style={btn(chartType === c, '#1db954')}>
                      {c === 'daily' ? 'Daily' : c === 'monthly' ? 'Monthly' : c === 'method' ? 'By Method' : 'By Plan'}
                    </button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {chartType === 'daily' && (
                  <motion.div key="d" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ResponsiveContainer width="100%" height={280}>
                      <AreaChart data={dailyRevenue}>
                        <defs>
                          <linearGradient id="ag" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#1db954" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#1db954" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                        <XAxis dataKey="day" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${symbol}${v}`} />
                        <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: 10, color: '#fff', fontSize: 12 }} formatter={(v: any) => [`${symbol}${Number(v).toFixed(2)}`, 'Revenue']} />
                        <Area type="monotone" dataKey="revenue" stroke="#1db954" fill="url(#ag)" strokeWidth={2.5} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}

                {chartType === 'monthly' && (
                  <motion.div key="m" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={monthlyRevenue}>
                        <defs>
                          <linearGradient id="bg2" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#10b981" stopOpacity={1} />
                            <stop offset="100%" stopColor="#4c1d95" stopOpacity={0.5} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                        <XAxis dataKey="month" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} />
                        <YAxis tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${symbol}${v}`} />
                        <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: 10, color: '#fff', fontSize: 12 }} formatter={(v: any) => [`${symbol}${Number(v).toFixed(2)}`, 'Revenue']} />
                        <Bar dataKey="revenue" fill="url(#bg2)" radius={[6, 6, 0, 0]} maxBarSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}

                {chartType === 'method' && (
                  <motion.div key="me" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, alignItems: 'center' }}>
                      <ResponsiveContainer width="100%" height={280}>
                        <PieChart>
                          <Pie data={methodData} dataKey="value" cx="50%" cy="50%" innerRadius={70} outerRadius={110} paddingAngle={4}>
                            {methodData.map((e, i) => <Cell key={i} fill={MC[e.name] || '#6b7280'} stroke="none" />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: 10, color: '#fff', fontSize: 12 }} formatter={(v: any) => [`${v}%`, 'Share']} />
                        </PieChart>
                      </ResponsiveContainer>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                        {methodData.map(m => (
                          <div key={m.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#111', padding: '10px 14px', borderRadius: 10, border: '1px solid #1a1a1a' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <div style={{ width: 10, height: 10, borderRadius: 3, background: MC[m.name] || '#6b7280' }} />
                              <span style={{ fontSize: 13 }}>{MI[m.name] || '💳'} {m.name}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                              <div style={{ fontWeight: 700, fontSize: 14, color: '#fff' }}>{m.value}%</div>
                              <div style={{ fontSize: 11, color: '#4b5563' }}>{symbol}{m.revenue?.toFixed(2)}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {chartType === 'plan' && (
                  <motion.div key="pl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={planRevenue} layout="vertical" margin={{ right: 20, left: 60 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                        <XAxis type="number" tick={{ fill: '#4b5563', fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={v => `${symbol}${v}`} />
                        <YAxis type="category" dataKey="plan" tick={{ fill: '#9ca3af', fontSize: 12 }} tickFormatter={v => v.charAt(0).toUpperCase() + v.slice(1)} axisLine={false} tickLine={false} />
                        <Tooltip contentStyle={{ background: '#0a0a0a', border: '1px solid #333', borderRadius: 10, color: '#fff', fontSize: 12 }} formatter={(v: any) => [`${symbol}${Number(v).toFixed(2)}`, 'Revenue']} />
                        <Bar dataKey="revenue" radius={[0, 6, 6, 0]} maxBarSize={24}>
                          {planRevenue.map((e, i) => <Cell key={i} fill={PC[e.plan] || '#6b7280'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Summary Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
              {[
                { label: 'Paid Users', value: `${paidCount}`, sub: `${totalCount} total users · ${totalCount - paidCount} free`, color: '#10b981' },
                { label: 'Revenue Per Paid User', value: paidCount > 0 ? fmt((stats?.totalRevenue || 0) / paidCount, symbol) : `${symbol}0`, sub: 'Lifetime value', color: '#1db954' },
                { label: 'Payment Success Rate', value: `${stats?.successRate || 0}%`, sub: `${stats?.completedCount || 0} successful · ${stats?.failedCount || 0} failed`, color: '#f59e0b' },
              ].map(c => (
                <div key={c.label} style={{ ...card, padding: '18px 20px' }}>
                  <div style={{ fontSize: 11, color: '#4b5563', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.06em', fontWeight: 700 }}>{c.label}</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: c.color, fontFamily: 'Outfit,sans-serif', marginBottom: 4 }}>{c.value}</div>
                  <div style={{ fontSize: 11, color: '#374151' }}>{c.sub}</div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Modals ── */}
      <AnimatePresence>
        {invoiceModal && <InvoiceModal tx={invoiceModal} onClose={() => setInvoiceModal(null)} />}
        {refundModal && <RefundModal tx={refundModal} onClose={() => setRefundModal(null)} onRefund={handleRefund} />}
        {changeMethodModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setChangeMethodModal(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#0a0a0a', border: '1px solid #1e1e1e', borderRadius: 20, padding: 32, width: 400 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
                <div style={{ background: '#10b98118', borderRadius: 12, width: 48, height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>💳</div>
                <div>
                  <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Update Payment Method</h3>
                  <p style={{ margin: 0, fontSize: 12, color: '#6b7280' }}>Change details for {changeMethodModal.name}</p>
                </div>
              </div>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, color: '#6b7280', display: 'block', marginBottom: 6 }}>Payment Method</label>
                <select value={newMethod} onChange={e => setNewMethod(e.target.value)} style={{ ...inp, width: '100%' }}>
                  <option value="Visa">Visa</option>
                  <option value="Mastercard">Mastercard</option>
                  <option value="PayPal">PayPal</option>
                  <option value="UPI">UPI</option>
                  <option value="Apple Pay">Apple Pay</option>
                  <option value="Google Pay">Google Pay</option>
                  <option value="Admin Plan">Admin Plan</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <button onClick={() => setChangeMethodModal(null)} style={{ flex: 1, background: '#111', border: '1px solid #2a2a2a', color: '#9ca3af', borderRadius: 10, padding: '11px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                <button onClick={async () => {
                  try {
                    const res = await fetch('/api/admin/payments', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'change_method', userId: changeMethodModal.id, method: newMethod }),
                    });
                    const d = await res.json();
                    if (!res.ok) throw new Error(d.error);
                    toast.success(d.message);
                    setChangeMethodModal(null);
                    fetchData();
                  } catch (e: any) {
                    toast.error(e.message);
                  }
                }} style={{ flex: 1, background: '#10b981', border: 'none', color: '#fff', borderRadius: 10, padding: '11px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                  Save Method
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
