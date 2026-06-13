'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Play, Pause, Heart, Star, Layers, Calendar, Music, 
  Trash2, Download, Check, X, ShieldAlert, Sparkles, 
  Eye, FileSpreadsheet, FileJson, Music2, Edit3, Volume2 
} from 'lucide-react';

const FONT = { fontFamily: "'Inter', 'Outfit', sans-serif" };

type ContentType = 'Track' | 'Album' | 'Playlist';
type ContentStatus = 'Approved' | 'Pending' | 'Rejected';
type ViewMode = 'list' | 'grid';
type SortMode = 'Newest' | 'Most Played' | 'Alphabetical';
type GenreFilter = 'All' | 'Pop' | 'Hip-Hop' | 'Electronic' | 'R&B' | 'Rock' | 'Jazz' | 'Classical' | 'Latin' | 'Chill' | 'Dance';
type TypeFilter = 'All' | 'Tracks' | 'Albums' | 'Playlists';
type StatusFilter = 'All' | 'Approved' | 'Pending' | 'Rejected';
type ExplicitFilter = 'All' | 'Explicit' | 'Clean';

interface ContentItem {
  id: string;
  title: string;
  artist: string;
  type: ContentType;
  genre: string;
  duration: string;
  plays: number;
  status: ContentStatus;
  uploaded: string;
  featured: boolean;
  color: string;
  explicit?: boolean;
  isDbTrack?: boolean;
  audioUrl?: string;
  lyrics?: string;
  year?: number;
  uploadedBy?: string;
}

const STATUS_STYLE: Record<ContentStatus, { bg: string; color: string }> = {
  Approved: { bg: '#1a3a27', color: '#1db954' },
  Pending: { bg: '#2a2a10', color: '#f59e0b' },
  Rejected: { bg: '#3a1a1a', color: '#ff4d4d' },
};

function formatPlays(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
  if (n >= 1000) return (n / 1000).toFixed(0) + 'K';
  return String(n);
}

const GENRES: GenreFilter[] = ['All', 'Pop', 'Hip-Hop', 'Electronic', 'R&B', 'Rock', 'Jazz', 'Classical', 'Latin', 'Chill', 'Dance'];
const TYPES: TypeFilter[] = ['All', 'Tracks', 'Albums', 'Playlists'];
const STATUSES: StatusFilter[] = ['All', 'Approved', 'Pending', 'Rejected'];
const EXPLICITS: ExplicitFilter[] = ['All', 'Explicit', 'Clean'];
const SORTS: SortMode[] = ['Newest', 'Most Played', 'Alphabetical'];
const PER_PAGE = 8;

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#0a0a0a', border: '1px solid #2a2a2a', borderRadius: 8,
  color: '#fff', padding: '9px 12px', fontSize: 13, outline: 'none', boxSizing: 'border-box',
};

export default function ContentLibraryTab() {
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('list');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('All');
  const [genreFilter, setGenreFilter] = useState<GenreFilter>('All');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [explicitFilter, setExplicitFilter] = useState<ExplicitFilter>('All');
  const [sort, setSort] = useState<SortMode>('Newest');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);

  // New features state
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [previewTrack, setPreviewTrack] = useState<ContentItem | null>(null);
  const [addFeatureModal, setAddFeatureModal] = useState(false);
  const [featureSearch, setFeatureSearch] = useState('');

  // Edit form states
  const [editingItem, setEditingItem] = useState<ContentItem | null>(null);
  const [editForm, setEditForm] = useState({ 
    title: '', 
    genre: 'Pop', 
    explicit: false,
    plays: 0,
    lyrics: '',
    year: 2026,
    artist: '',
  });

  const fetchContent = async () => {
    try {
      const res = await fetch('/api/admin/content');
      const data = await res.json();
      if (data.success) {
        setItems(data.items || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load content library');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchContent();
  }, []);

  const openEditModal = (item: ContentItem) => {
    setEditingItem(item);
    setEditForm({
      title: item.title,
      genre: item.genre || 'Pop',
      explicit: item.explicit || false,
      plays: item.plays || 0,
      lyrics: item.lyrics || '',
      year: item.year || 2026,
      artist: item.artist || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!editForm.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!editingItem) return;

    const loadingToast = toast.loading('Saving changes...');
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'edit',
          id: editingItem.id,
          title: editForm.title,
          genre: editForm.genre,
          explicit: editForm.explicit,
          plays: editForm.plays,
          lyrics: editForm.lyrics,
          year: editForm.year,
          artist: editForm.artist,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Content updated successfully!', { id: loadingToast });
        setEditingItem(null);
        fetchContent();
      } else {
        toast.error(data.error || 'Failed to update content', { id: loadingToast });
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error saving edit', { id: loadingToast });
    }
  };

  const filtered = items
    .filter(item => typeFilter === 'All' || (typeFilter === 'Tracks' && item.type === 'Track') || (typeFilter === 'Albums' && item.type === 'Album') || (typeFilter === 'Playlists' && item.type === 'Playlist'))
    .filter(item => genreFilter === 'All' || item.genre === genreFilter)
    .filter(item => statusFilter === 'All' || item.status === statusFilter)
    .filter(item => {
      if (explicitFilter === 'All') return true;
      if (explicitFilter === 'Explicit') return !!item.explicit;
      return !item.explicit;
    })
    .filter(item => !search || item.title.toLowerCase().includes(search.toLowerCase()) || item.artist.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'Most Played') return b.plays - a.plays;
      if (sort === 'Alphabetical') return a.title.localeCompare(b.title);
      return String(b.id).localeCompare(String(a.id));
    });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);
  const featured = items.filter(i => i.featured);
  const trending = [...items].sort((a, b) => b.plays - a.plays).slice(0, 5);

  const approveItem = async (id: string, title: string) => {
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`"${title}" approved`);
        fetchContent();
      } else {
        toast.error(data.error || 'Failed to approve');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error approving content');
    }
  };

  const rejectItem = async (id: string, title: string) => {
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.error(`"${title}" rejected`);
        fetchContent();
      } else {
        toast.error(data.error || 'Failed to reject');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error rejecting content');
    }
  };

  const deleteItem = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"?`)) return;
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`"${title}" deleted successfully`);
        fetchContent();
      } else {
        toast.error(data.error || 'Failed to delete');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error deleting content');
    }
  };

  const toggleFeature = async (id: string, title: string, isFeatured: boolean) => {
    try {
      const res = await fetch('/api/admin/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'feature', id, featured: !isFeatured }),
      });
      const data = await res.json();
      if (data.success) {
        toast(!isFeatured ? `"${title}" featured!` : `"${title}" unfeatured`);
        fetchContent();
      } else {
        toast.error(data.error || 'Failed to toggle featured status');
      }
    } catch (err) {
      console.error(err);
      toast.error('Network error updating featured status');
    }
  };

  const allSelected = paginated.length > 0 && paginated.every(i => selected.has(i.id));
  const toggleAll = () => {
    if (allSelected) setSelected(s => { const n = new Set(s); paginated.forEach(i => n.delete(i.id)); return n; });
    else setSelected(s => { const n = new Set(s); paginated.forEach(i => n.add(i.id)); return n; });
  };
  const toggleOne = (id: string) => setSelected(s => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const bulkAction = async (action: 'approve' | 'reject' | 'feature' | 'unfeature' | 'delete') => {
    const ids = Array.from(selected);
    if (ids.length === 0) { toast.error('No items selected'); return; }
    
    if (action === 'delete' && !confirm(`Are you sure you want to bulk delete ${ids.length} items?`)) return;

    const loadingToast = toast.loading(`Performing bulk ${action}...`);
    try {
      for (const id of ids) {
        await fetch('/api/admin/content', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            action: action === 'unfeature' ? 'feature' : action, 
            id, 
            featured: action === 'feature' ? true : action === 'unfeature' ? false : undefined 
          }),
        });
      }
      toast.success(`${ids.length} items processed successfully`, { id: loadingToast });
      setSelected(new Set());
      fetchContent();
    } catch (err) {
      console.error(err);
      toast.error('Network error during bulk action', { id: loadingToast });
    }
  };

  // Export Content Library items
  const exportContent = (fmt: 'csv' | 'json') => {
    if (fmt === 'json') {
      const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'content_library.json'; a.click();
      toast.success('Exported as JSON');
    } else {
      const header = 'ID,Title,Artist,Type,Genre,Plays,Status,Uploaded,Explicit,Year\n';
      const rows = filtered.map(e => `"${e.id}","${e.title}","${e.artist}","${e.type}","${e.genre}",${e.plays},"${e.status}","${e.uploaded}",${!!e.explicit},${e.year || 2026}`).join('\n');
      const blob = new Blob([header + rows], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url; a.download = 'content_library.csv'; a.click();
      toast.success('Exported as CSV');
    }
  };

  // Milestone plays badge check
  const milestoneBadge = (plays: number) => {
    if (plays >= 50) return <span style={{ marginLeft: 6, background: '#10b98115', color: '#10b981', border: '1px solid #10b98130', borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 700 }}>💎 Plat</span>;
    if (plays >= 10) return <span style={{ marginLeft: 6, background: '#f59e0b15', color: '#f59e0b', border: '1px solid #f59e0b30', borderRadius: 4, padding: '1px 5px', fontSize: 9, fontWeight: 700 }}>🔥 Gold</span>;
    return null;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
      style={{ ...FONT, background: '#0a0a0a', minHeight: '100vh', padding: '28px 24px', color: '#e5e7eb' }}>

      {/* Featured Content */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>⭐ Featured Content</h3>
          <button 
            onClick={() => setAddFeatureModal(true)}
            style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#1db954', color: '#000', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
          >
            ➕ Add Featured
          </button>
        </div>
        {featured.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: 12, padding: 10, background: '#121212', borderRadius: 10 }}>No featured content currently. Click 'Add Featured' to feature tracks.</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
            {featured.map((item, i) => (
              <motion.div key={item.id} initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
                style={{ background: '#121212', borderRadius: 12, border: '1px solid #1e1e1e', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: item.color.startsWith('linear-gradient') ? item.color : `url(${item.color}) center/cover`, flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: '#6b7280' }}>{item.artist} · {item.type}</div>
                </div>
                <button onClick={() => toggleFeature(item.id, item.title, item.featured)}
                  style={{ padding: '5px 11px', borderRadius: 7, border: '1px solid #2a1a1a', background: '#1a1010', color: '#ff4d4d', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>Unfeature</button>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Trending */}
      <div style={{ marginBottom: 28 }}>
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 1, margin: '0 0 12px' }}>🔥 Trending Right Now (24h)</h3>
        {trending.length === 0 ? (
          <div style={{ color: '#6b7280', fontSize: 12 }}>No trending songs recorded.</div>
        ) : (
          <div style={{ display: 'flex', gap: 10 }}>
            {trending.slice(0, 5).map((item, i) => (
              <div key={item.id} style={{ background: '#121212', borderRadius: 10, border: '1px solid #1e1e1e', padding: '10px 14px', flex: 1, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: i === 0 ? '#1db954' : '#4b5563', minWidth: 20 }}>#{i + 1}</span>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: item.color.startsWith('linear-gradient') ? item.color : `url(${item.color}) center/cover`, flexShrink: 0 }} />
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                  <div style={{ fontSize: 11, color: '#1db954' }}>{formatPlays(item.plays)} plays</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} placeholder="Search title or artist…"
          style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 9, padding: '8px 14px', color: '#e5e7eb', fontSize: 13, outline: 'none', minWidth: 200 }} />
        {([['Type', TYPES, typeFilter, (v: string) => { setTypeFilter(v as TypeFilter); setPage(1); }],
          ['Genre', GENRES, genreFilter, (v: string) => { setGenreFilter(v as GenreFilter); setPage(1); }],
          ['Status', STATUSES, statusFilter, (v: string) => { setStatusFilter(v as StatusFilter); setPage(1); }],
          ['Explicit', EXPLICITS, explicitFilter, (v: string) => { setExplicitFilter(v as ExplicitFilter); setPage(1); }],
          ['Sort', SORTS, sort, (v: string) => { setSort(v as SortMode); setPage(1); }]] as any[]).map(([label, opts, val, setter]) => (
          <select key={label} value={val} onChange={e => setter(e.target.value)}
            style={{ background: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: 8, padding: '8px 12px', color: '#9ca3af', fontSize: 12, outline: 'none', cursor: 'pointer' }}>
            {opts.map((o: string) => <option key={o} value={o}>{o}</option>)}
          </select>
        ))}
        
        {/* Export buttons */}
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => exportContent('csv')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid #222', background: '#141414', color: '#e5e7eb' }}>
            <FileSpreadsheet size={12} className="text-emerald-500" /> CSV
          </button>
          <button onClick={() => exportContent('json')} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '8px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: '1px solid #222', background: '#141414', color: '#e5e7eb' }}>
            <FileJson size={12} className="text-emerald-500" /> JSON
          </button>
        </div>

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {(['list', 'grid'] as ViewMode[]).map(v => (
            <button key={v} onClick={() => setView(v)}
              style={{ width: 34, height: 34, borderRadius: 8, border: 'none', background: view === v ? '#1db954' : '#1e1e1e', color: view === v ? '#000' : '#6b7280', cursor: 'pointer', fontSize: 14 }}>
              {v === 'list' ? '☰' : '⊞'}
            </button>
          ))}
        </div>
      </div>

      {/* Bulk Actions */}
      <AnimatePresence>
        {selected.size > 0 && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            style={{ background: '#1a2a3a', borderRadius: 10, padding: '10px 16px', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, border: '1px solid #1e3a5f', flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, color: '#60a5fa', fontWeight: 700 }}>{selected.size} selected</span>
            <button onClick={() => bulkAction('approve')} style={{ padding: '5px 13px', borderRadius: 7, border: 'none', background: '#1a3a27', color: '#1db954', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✓ Approve All</button>
            <button onClick={() => bulkAction('reject')} style={{ padding: '5px 13px', borderRadius: 7, border: 'none', background: '#3a1a1a', color: '#ff4d4d', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>✗ Reject All</button>
            <button onClick={() => bulkAction('feature')} style={{ padding: '5px 13px', borderRadius: 7, border: 'none', background: '#2a2010', color: '#f59e0b', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>⭐ Feature All</button>
            <button onClick={() => bulkAction('unfeature')} style={{ padding: '5px 13px', borderRadius: 7, border: 'none', background: '#2a1a1a', color: '#ffaa44', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>⭐ Unfeature All</button>
            <button onClick={() => bulkAction('delete')} style={{ padding: '5px 13px', borderRadius: 7, border: 'none', background: '#451a1a', color: '#ef4444', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>🗑 Delete All</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* List View */}
      {view === 'list' ? (
        <div style={{ background: '#121212', borderRadius: 14, border: '1px solid #1e1e1e', overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#161616', borderBottom: '1px solid #1e1e1e' }}>
                <th style={{ padding: '12px 14px' }}><input type="checkbox" checked={allSelected} onChange={toggleAll} style={{ accentColor: '#1db954', cursor: 'pointer' }} /></th>
                {['Cover', 'Title', 'Artist', 'Type', 'Genre', 'Duration', 'Plays', 'Status', 'Uploaded', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 12px', textAlign: 'left', color: '#6b7280', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading && items.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>Loading content library...</td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={11} style={{ padding: 24, textAlign: 'center', color: '#6b7280' }}>No content matches current filters.</td>
                </tr>
              ) : (
                paginated.map((item, i) => {
                  const ss = STATUS_STYLE[item.status] || { bg: '#111', color: '#888' };
                  const isExpanded = expandedItemId === item.id;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #1a1a1a', background: selected.has(item.id) ? 'rgba(29, 185, 84,0.04)' : 'transparent' }}>
                      <td style={{ padding: '10px 14px' }}><input type="checkbox" checked={selected.has(item.id)} onChange={() => toggleOne(item.id)} style={{ accentColor: '#1db954', cursor: 'pointer' }} /></td>
                      
                      {/* Click cover to preview audio */}
                      <td style={{ padding: '10px 12px' }}>
                        <div 
                          onClick={() => { if (item.type === 'Track') { setPreviewTrack(item); toast.success(`Playing preview for "${item.title}"`); } }}
                          style={{ width: 36, height: 36, borderRadius: 7, background: item.color.startsWith('linear-gradient') ? item.color : `url(${item.color}) center/cover`, cursor: item.type === 'Track' ? 'pointer' : 'default', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title={item.type === 'Track' ? 'Click to preview audio' : ''}
                        >
                          {item.type === 'Track' && (
                            <div className="hover-overlay" style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', borderRadius: 7, opacity: 0, transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <Volume2 size={14} color="#fff" />
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Expandable row toggler click on title */}
                      <td 
                        onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                        style={{ padding: '10px 12px', fontWeight: 700, color: '#e5e7eb', whiteSpace: 'nowrap', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', cursor: 'pointer' }}
                        title="Click to view detailed stats inspector"
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          {item.title} 
                          {item.explicit && <span style={{ background: '#333', color: '#fff', fontSize: 9, fontWeight: 700, padding: '1px 4px', borderRadius: 3 }}>E</span>}
                        </span>
                      </td>

                      <td style={{ padding: '10px 12px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{item.artist}</td>
                      <td style={{ padding: '10px 12px', color: '#6b7280' }}>{item.type}</td>
                      <td style={{ padding: '10px 12px', color: '#6b7280' }}>{item.genre}</td>
                      <td style={{ padding: '10px 12px', color: '#4b5563', whiteSpace: 'nowrap' }}>{item.duration}</td>
                      <td style={{ padding: '10px 12px', color: '#1db954', fontWeight: 700 }}>
                        {formatPlays(item.plays)}
                        {milestoneBadge(item.plays)}
                      </td>
                      <td style={{ padding: '10px 12px' }}>
                        <span style={{ background: ss.bg, color: ss.color, borderRadius: 20, padding: '2px 9px', fontSize: 11, fontWeight: 700 }}>{item.status}</span>
                      </td>
                      <td style={{ padding: '10px 12px', color: '#4b5563', whiteSpace: 'nowrap', fontSize: 12 }}>{item.uploaded?.split('T')[0]}</td>
                      <td style={{ padding: '10px 12px' }}>
                        <div style={{ display: 'flex', gap: 5 }}>
                          <button onClick={() => openEditModal(item)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#9ca3af', fontSize: 10, cursor: 'pointer' }} title="Edit Metadata">✎</button>
                          {item.status !== 'Approved' && <button onClick={() => approveItem(item.id, item.title)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#1a3a27', color: '#1db954', fontSize: 10, fontWeight: 700, cursor: 'pointer' }} title="Approve">✓</button>}
                          {item.status !== 'Rejected' && <button onClick={() => rejectItem(item.id, item.title)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#3a1a1a', color: '#ff4d4d', fontSize: 10, fontWeight: 700, cursor: 'pointer' }} title="Reject">✗</button>}
                          <button onClick={() => toggleFeature(item.id, item.title, item.featured)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: item.featured ? '#2a2010' : '#1e1e1e', color: item.featured ? '#f59e0b' : '#4b5563', fontSize: 10, cursor: 'pointer' }} title="Toggle Feature">⭐</button>
                          <button onClick={() => deleteItem(item.id, item.title)} style={{ padding: '4px 8px', borderRadius: 6, border: 'none', background: '#ef444422', color: '#ef4444', fontSize: 10, cursor: 'pointer' }} title="Delete">🗑</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Expanded inspector sub-row details */}
          <AnimatePresence>
            {expandedItemId && (
              <div style={{ background: '#090909', borderBottom: '1px solid #1c1c1c' }}>
                {(() => {
                  const item = items.find(i => i.id === expandedItemId);
                  if (!item) return null;
                  return (
                    <div style={{ padding: '16px 24px 20px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
                      <div>
                        <h4 style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5 }}>Metadata Inspector & Stats</h4>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px 16px', fontSize: 12 }}>
                          <div><span style={{ color: '#525252', fontWeight: 600 }}>Track ID:</span> <code style={{ color: '#a78bfa', fontSize: 11 }}>{item.id}</code></div>
                          <div><span style={{ color: '#525252', fontWeight: 600 }}>Uploader Email:</span> <span style={{ color: '#fff' }}>{(item as any).uploadedBy || 'System/Seeded'}</span></div>
                          <div><span style={{ color: '#525252', fontWeight: 600 }}>Release Year:</span> <span style={{ color: '#fff' }}>{(item as any).year || '2026'}</span></div>
                          <div><span style={{ color: '#525252', fontWeight: 600 }}>Audio Source:</span> <a href={(item as any).audioUrl || '#'} target="_blank" rel="noreferrer" style={{ color: '#10b981', textDecoration: 'none' }}>{(item as any).audioUrl ? 'Direct File Link ↗' : 'No Audio URL'}</a></div>
                          <div><span style={{ color: '#525252', fontWeight: 600 }}>Content Rating:</span> <span style={{ color: item.explicit ? '#ef4444' : '#10b981', fontWeight: 600 }}>{item.explicit ? 'Explicit (18+)' : 'Clean'}</span></div>
                          <div><span style={{ color: '#525252', fontWeight: 600 }}>Plays Milestone:</span> <span style={{ color: '#fff' }}>{item.plays >= 50 ? 'Platinum Tier' : item.plays >= 10 ? 'Gold Tier' : 'Standard Tier'}</span></div>
                        </div>
                      </div>
                      <div style={{ borderLeft: '1px solid #1a1a1a', paddingLeft: 20 }}>
                        <h4 style={{ margin: '0 0 8px', fontSize: 12, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: 0.5 }}>Lyrics Editor Preview</h4>
                        <div style={{ maxHeight: 90, overflowY: 'auto', fontSize: 11, color: '#a3a3a3', lineHeight: 1.5, whiteSpace: 'pre-wrap', fontStyle: 'italic' }}>
                          {(item as any).lyrics || 'No lyrics uploaded for this track.'}
                        </div>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </AnimatePresence>

          {/* Pagination */}
          {totalPages > 1 && (
            <div style={{ padding: '14px 16px', borderTop: '1px solid #1e1e1e', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#4b5563' }}>Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}</span>
              <div style={{ display: 'flex', gap: 6 }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button key={p} onClick={() => setPage(p)}
                    style={{ width: 30, height: 30, borderRadius: 7, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, background: page === p ? '#1db954' : '#1e1e1e', color: page === p ? '#000' : '#6b7280' }}>
                    {p}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        /* Grid View */
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14 }}>
          {loading && items.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20, color: '#6b7280' }}>Loading content library...</div>
          ) : paginated.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: 20, color: '#6b7280' }}>No content matches current filters.</div>
          ) : (
            <AnimatePresence>
              {paginated.map((item, i) => {
                const ss = STATUS_STYLE[item.status] || { bg: '#111', color: '#888' };
                return (
                  <motion.div key={item.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                    style={{ background: '#121212', borderRadius: 13, border: `1px solid ${selected.has(item.id) ? '#1db95440' : '#1e1e1e'}`, overflow: 'hidden' }}>
                    <div 
                      onClick={() => { if (item.type === 'Track') setPreviewTrack(item); }}
                      style={{ height: 100, background: item.color.startsWith('linear-gradient') ? item.color : `url(${item.color}) center/cover`, position: 'relative', cursor: item.type === 'Track' ? 'pointer' : 'default' }}
                    >
                      {item.featured && <span style={{ position: 'absolute', top: 8, right: 8, background: '#f59e0b', borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700, color: '#000' }}>Featured</span>}
                      {item.explicit && <span style={{ position: 'absolute', bottom: 8, left: 8, background: '#000', borderRadius: 4, padding: '2px 6px', fontSize: 9, fontWeight: 800, color: '#fff' }}>EXPLICIT</span>}
                      {selected.has(item.id) && <div style={{ position: 'absolute', inset: 0, background: 'rgba(29, 185, 84,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>✓</div>}
                    </div>
                    <div style={{ padding: '12px 14px' }}>
                      <div style={{ fontWeight: 700, fontSize: 13, color: '#e5e7eb', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8 }}>{item.artist} · {item.type}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                        <span style={{ background: ss.bg, color: ss.color, borderRadius: 20, padding: '2px 8px', fontSize: 10, fontWeight: 700 }}>{item.status}</span>
                        <span style={{ color: '#1db954', fontSize: 12, fontWeight: 700 }}>
                          {formatPlays(item.plays)}
                          {milestoneBadge(item.plays)}
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 5, marginTop: 8 }}>
                        <button onClick={() => openEditModal(item)} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: '1px solid #2a2a2a', background: '#1a1a1a', color: '#9ca3af', fontSize: 11, cursor: 'pointer' }}>✎ Edit</button>
                        {item.status !== 'Approved' && <button onClick={() => approveItem(item.id, item.title)} style={{ flex: 1, padding: '5px 0', borderRadius: 6, border: 'none', background: '#1a3a27', color: '#1db954', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>✓ Approve</button>}
                        <button onClick={() => deleteItem(item.id, item.title)} style={{ padding: '5px 8px', borderRadius: 6, border: 'none', background: '#ef444422', color: '#ef4444', fontSize: 11, cursor: 'pointer' }}>🗑</button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      )}

      {/* Floating Audio Preview Player */}
      <AnimatePresence>
        {previewTrack && (
          <motion.div 
            initial={{ opacity: 0, y: 50 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: 50 }}
            style={{ 
              position: 'fixed', bottom: 20, right: 20, zIndex: 1000, 
              background: '#121212', border: '1px solid #1db954', borderRadius: 12, 
              padding: '14px 20px', width: 320, boxShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontSize: 11, color: '#1db954', fontWeight: 800 }}>Now Previewing</div>
              <button 
                onClick={() => setPreviewTrack(null)} 
                style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', padding: 0 }}
              >
                ✕
              </button>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 6, background: previewTrack.color.startsWith('linear-gradient') ? previewTrack.color : `url(${previewTrack.color}) center/cover` }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 13, color: '#fff' }}>{previewTrack.title}</div>
                <div style={{ fontSize: 11, color: '#888' }}>{previewTrack.artist}</div>
              </div>
            </div>
            <audio 
              src={previewTrack.audioUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'} 
              controls 
              autoPlay 
              style={{ width: '100%', height: 32, outline: 'none' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit Metadata Modal */}
      <AnimatePresence>
        {editingItem && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setEditingItem(null)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#121212', border: '1px solid #2a2a2a', borderRadius: 16, padding: 28, width: 440 }}>
              <h3 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 700 }}>Edit Content Metadata</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 6 }}>Title</label>
                    <input style={inputStyle} value={editForm.title} onChange={e => setEditForm(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 6 }}>Artist</label>
                    <input style={inputStyle} value={editForm.artist} onChange={e => setEditForm(p => ({ ...p, artist: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 6 }}>Genre</label>
                    <select style={inputStyle} value={editForm.genre} onChange={e => setEditForm(p => ({ ...p, genre: e.target.value }))}>
                      {GENRES.filter(g => g !== 'All').map(g => <option key={g} value={g}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 6 }}>Release Year</label>
                    <input type="number" style={inputStyle} value={editForm.year} onChange={e => setEditForm(p => ({ ...p, year: Number(e.target.value) }))} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 6 }}>Plays Count</label>
                    <input type="number" style={inputStyle} value={editForm.plays} onChange={e => setEditForm(p => ({ ...p, plays: Number(e.target.value) }))} />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 6 }}>Lyrics Editor</label>
                  <textarea rows={3} style={{ ...inputStyle, resize: 'none' }} value={editForm.lyrics} onChange={e => setEditForm(p => ({ ...p, lyrics: e.target.value }))} placeholder="Paste lyrics here..." />
                </div>

                <div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13, color: '#e5e7eb', marginTop: 6 }}>
                    <input type="checkbox" checked={editForm.explicit} onChange={e => setEditForm(p => ({ ...p, explicit: e.target.checked }))} style={{ accentColor: '#1db954' }} />
                    Mark as Explicit Content
                  </label>
                </div>

                <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                  <button onClick={() => setEditingItem(null)} style={{ background: '#1a1a1a', border: 'none', borderRadius: 8, color: '#9ca3af', padding: '10px 18px', fontSize: 13, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSaveEdit} style={{ background: '#1db954', border: 'none', borderRadius: 8, color: '#000', padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Save Changes</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Featured Modal */}
      <AnimatePresence>
        {addFeatureModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            onClick={() => setAddFeatureModal(false)}>
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              onClick={e => e.stopPropagation()}
              style={{ background: '#121212', border: '1px solid #2a2a2a', borderRadius: 16, padding: 28, width: 480, maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span>Add Featured Content</span>
                <button onClick={() => setAddFeatureModal(false)} style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: 18, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: 24, height: 24 }}>✕</button>
              </h3>
              <input 
                placeholder="Search tracks to feature..." 
                value={featureSearch}
                onChange={e => setFeatureSearch(e.target.value)}
                style={{ ...inputStyle, marginBottom: 16 }}
              />
              <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, paddingRight: 4 }}>
                {items
                  .filter(item => item.type === 'Track' && !item.featured)
                  .filter(item => !featureSearch || item.title.toLowerCase().includes(featureSearch.toLowerCase()) || item.artist.toLowerCase().includes(featureSearch.toLowerCase()))
                  .map(item => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#181818', borderRadius: 10, padding: '10px 14px', border: '1px solid #222', gap: 12 }}>
                      <div style={{ width: 36, height: 36, borderRadius: 6, background: item.color.startsWith('linear-gradient') ? item.color : `url(${item.color}) center/cover`, flexShrink: 0 }} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: '#e5e7eb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>{item.artist}</div>
                      </div>
                      <button onClick={() => { toggleFeature(item.id, item.title, false); }}
                        style={{ padding: '5px 11px', borderRadius: 7, border: 'none', background: '#1db954', color: '#000', fontSize: 11, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        + Feature
                      </button>
                    </div>
                  ))
                }
                {items.filter(item => item.type === 'Track' && !item.featured).length === 0 && (
                  <div style={{ color: '#6b7280', fontSize: 12, textAlign: 'center', padding: 20 }}>All available tracks are already featured.</div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
