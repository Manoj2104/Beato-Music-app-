'use client';

import { useState, useEffect, useRef } from 'react';
import HomepageBuilderTab from './HomepageBuilderTab';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import { mockTracks, mockPlaylists, mockAlbums } from '@/lib/mockData';
import { EXTENDED_LAYOUT_OPTIONS } from '@/lib/layoutOptions';

// ─── Local Style Helper ───
const COLORS = {
  primary: '#b08850',
  primaryBg: 'rgba(176, 136, 80, 0.15)',
  blue: '#10b981',
  purple: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
  text: '#ffffff',
  textMuted: '#6b7280',
  border: '#222222',
  card: '#121212',
  cardBg: '#1e1e1e',
};

const chartTooltip = {
  contentStyle: {
    background: '#181818',
    border: `1px solid ${COLORS.border}`,
    borderRadius: 12,
    color: '#221a15',
    fontSize: 12,
    boxShadow: '0 8px 30px rgba(43, 34, 26, 0.1)'
  }
};

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'push' | 'banner' | 'sms';
  status: 'active' | 'paused' | 'completed' | 'draft';
  reach: number;
  clickRate: number;
  conversion: number;
  budget: number;
  spend: number;
  startDate?: string;
  endDate?: string;
  copy?: string;
}

interface PromoCode {
  id: string;
  code: string;
  discount: number;
  type: 'percent' | 'fixed';
  uses: number;
  limit: number;
  expiry: string;
  status: 'active' | 'paused' | 'expired';
}

interface Promotion {
  id: string;
  title: string;
  description: string;
  image: string;
  type: 'banner' | 'playlist' | 'album';
  targetId: string;
  status: 'active' | 'inactive';
}

interface MarketingPayload {
  success: boolean;
  stats: {
    emailsSent: number;
    openRate: number;
    clickRate: number;
    conversionRate: number;
  };
  campaigns: Campaign[];
  promos: PromoCode[];
  promotions: Promotion[];
  homeLayoutOrder: string[];
  customSections?: Record<string, { title: string; type: 'playlist' | 'album' | 'banner'; targetId: string }>;
  targetedCounts: {
    all: number;
    premium: number;
    free: number;
    artists: number;
  };
  currency: {
    code: string;
    rate: number;
    symbol: string;
  };
}

const campaignTypeColors = {
  email:  { color: '#10b981', bg: '#10b9811a', icon: '📧' },
  push:   { color: '#b08850', bg: '#b088501a', icon: '🔔' },
  banner: { color: '#f59e0b', bg: '#f59e0b1a', icon: '🖼' },
  sms:    { color: '#10b981', bg: '#10b9811a', icon: '💬' },
};

const sectionNames: Record<string, string> = {
  quick_access: '⚡ Quick Access Shortcuts',
  liked_songs: '♥ Liked Songs Play Banner',
  promotions_hero: '🖼️ Custom Promo Alerts Hero',
  made_for_you: '🤖 Made For You Recommendations',
  featured_artist: '🎤 Featured Artist Banner',
  new_music: '🆕 New Releases Section',
  trending_now: '🔥 Trending Track Charts',
  your_taste: '🎯 Personalized Genres affinity',
  recently_played: '⏱ Recently Played Tracks',
  mood_playlists: '😌 Mood Filter Playlists',
  daily_mixes: '🎵 Daily Mixes Carousel'
};

export default function MarketingTab() {
  // ── Sub-tab navigation ──────────────────────────────────────────────────
  const [activeSubTab, setActiveSubTab] = useState<'campaigns' | 'builder'>('campaigns');

  // Lists and stats payloads
  const [data, setData] = useState<MarketingPayload | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Search & Filter controls
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [promoSearch, setPromoSearch] = useState<string>('');

  // Bulk selectors
  const [selectedPromos, setSelectedPromos] = useState<string[]>([]);

  // Modal Open state
  const [showCampaignModal, setShowCampaignModal] = useState<boolean>(false);
  const [showPromoModal, setShowPromoModal] = useState<boolean>(false);
  const [statsModalCampaign, setStatsModalCampaign] = useState<Campaign | null>(null);

  // Layout and promotions states
  const [layoutOrder, setLayoutOrder] = useState<string[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [customSections, setCustomSections] = useState<Record<string, {
    title: string;
    type: 'playlist' | 'album' | 'banner' | 'custom_songs' | 'smart_filter';
    targetId?: string;
    songIds?: string[];
    layout?: 'grid' | 'carousel' | 'list' | 'minimal';
    audience?: 'all' | 'premium' | 'free';
    startDate?: string;
    endDate?: string;
    genreFilter?: string;
    minStreams?: number;
    yearFilter?: string;
    explicitFilter?: 'all' | 'clean' | 'explicit';
    bgStyle?: 'default' | 'gradient_emerald' | 'gradient_purple' | 'glassmorphism' | 'neon_glow';
    borderStyle?: 'none' | 'primary' | 'pulsing';
  }>>({});

  // States for adding layout sections
  const [selectedSectionToAdd, setSelectedSectionToAdd] = useState('');
  const [showCustomSecForm, setShowCustomSecForm] = useState(false);
  const [customSecTitle, setCustomSecTitle] = useState('');
  const [customSecType, setCustomSecType] = useState<'playlist' | 'album' | 'custom_songs' | 'smart_filter'>('playlist');
  const [customSecTargetId, setCustomSecTargetId] = useState('');
  const [customSecLayout, setCustomSecLayout] = useState<'grid' | 'carousel' | 'list' | 'minimal'>('grid');
  const [customSecSongIds, setCustomSecSongIds] = useState<string[]>([]);
  const [songSearchQuery, setSongSearchQuery] = useState('');

  // Smart filter states
  const [customSecGenreFilter, setCustomSecGenreFilter] = useState('');
  const [customSecMinPlays, setCustomSecMinPlays] = useState<number>(0);
  const [customSecYearFilter, setCustomSecYearFilter] = useState<string>('');
  const [customSecExplicitFilter, setCustomSecExplicitFilter] = useState<'all' | 'clean' | 'explicit'>('all');

  // Advanced configurations states
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [customSecAudience, setCustomSecAudience] = useState<'all' | 'premium' | 'free'>('all');
  const [customSecStartDate, setCustomSecStartDate] = useState('');
  const [customSecEndDate, setCustomSecEndDate] = useState('');
  const [customSecBgStyle, setCustomSecBgStyle] = useState<'default' | 'gradient_emerald' | 'gradient_purple' | 'glassmorphism' | 'neon_glow'>('default');
  const [customSecBorderStyle, setCustomSecBorderStyle] = useState<'none' | 'primary' | 'pulsing'>('none');

  // New Promotion states
  const [promoTitle, setPromoTitle] = useState('');
  const [promoDesc, setPromoDesc] = useState('');
  const [promoType, setPromoType] = useState<'banner' | 'playlist' | 'album'>('banner');
  const [promoTargetId, setPromoTargetId] = useState('');
  const [promoImage, setPromoImage] = useState<string>(''); // base64 string
  const [dragOverFile, setDragOverFile] = useState(false);

  // Cropper states
  const [cropImageSrc, setCropImageSrc] = useState<string>('');
  const [showCropModal, setShowCropModal] = useState(false);

  // Automations states
  const [autoTrigger, setAutoTrigger] = useState<string>('on_registration');
  const [autoAction, setAutoAction] = useState<string>('send_welcome_email');

  // Rolling operations audit stream
  const [auditLogs, setAuditLogs] = useState<Array<{ id: string; time: string; msg: string; type: string }>>([
    { id: '1', time: '12:54:10 PM', msg: 'System automation: Welcome email triggered for user-102', type: 'system' },
    { id: '2', time: '12:54:12 PM', msg: 'Promo code SUMMER30 usage validated (+₹249)', type: 'promo' },
    { id: '3', time: '12:54:25 PM', msg: 'Campaign Artist Spotlight Spotlight push notification dispatched', type: 'push' }
  ]);

  // Load backend payload
  const fetchMarketingData = async () => {
    try {
      const res = await fetch('/api/admin/marketing');
      const payload = await res.json();
      if (payload.success) {
        setData(payload);
      } else {
        toast.error('Could not fetch marketing DB logs.');
      }
    } catch (e) {
      console.error(e);
      toast.error('Network error loading campaign records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketingData();
  }, []);

  useEffect(() => {
    if (data?.homeLayoutOrder) {
      setLayoutOrder(data.homeLayoutOrder);
    }
    if (data?.customSections) {
      setCustomSections(data.customSections);
    }
  }, [data]);

  if (loading || !data) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 400, gap: 16 }}>
        <div style={{ width: 40, height: 40, border: `3px solid ${COLORS.primaryBg}`, borderTopColor: COLORS.primary, borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
        <div style={{ color: '#87786c', fontSize: 14 }}>Aggregating campaign logs and targeting stats...</div>
        <style jsx global>{`
          @keyframes spin { to { transform: rotate(360deg); } }
        `}</style>
      </div>
    );
  }

  // Marketing execution actions
  const handleToggleCampaign = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_campaign', id, status: nextStatus })
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success(`Campaign ${nextStatus === 'active' ? 'resumed' : 'paused'} successfully!`);
        fetchMarketingData();
        setAuditLogs(prev => [
          { id: String(Date.now()), time: new Date().toLocaleTimeString(), msg: `Campaign status updated: ${id} set to ${nextStatus}`, type: 'system' },
          ...prev
        ]);
      }
    } catch {
      toast.error('Failed modifying campaign status.');
    }
  };

  const handleTogglePromo = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'paused' : 'active';
    try {
      const res = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_promo', id, status: nextStatus })
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success(`Promo code ${nextStatus === 'active' ? 'activated' : 'paused'}!`);
        fetchMarketingData();
      }
    } catch {
      toast.error('Failed modifying promo code status.');
    }
  };

  const handleDeletePromo = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo code?')) return;
    try {
      const res = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_promo', id })
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success('Promo code deleted!');
        setSelectedPromos(prev => prev.filter(item => item !== id));
        fetchMarketingData();
      }
    } catch {
      toast.error('Failed deleting promo code.');
    }
  };

  const handleCloneCampaign = async (campaign: Campaign) => {
    try {
      const res = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_campaign',
          campaign: {
            name: `${campaign.name} (Clone)`,
            type: campaign.type,
            audience: 'all',
            budget: campaign.budget,
            startDate: campaign.startDate || '',
            endDate: campaign.endDate || '',
            copy: campaign.copy || ''
          }
        })
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success('Campaign duplicated successfully!');
        fetchMarketingData();
      }
    } catch {
      toast.error('Failed to duplicate campaign.');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Delete this campaign permanently?')) return;
    try {
      const res = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_campaign', id })
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success('Campaign deleted.');
        fetchMarketingData();
      }
    } catch {
      toast.error('Failed deleting campaign.');
    }
  };

  // Bulk actions
  const handleBulkDeactivate = async () => {
    if (selectedPromos.length === 0) return;
    try {
      for (const id of selectedPromos) {
        await fetch('/api/admin/marketing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'toggle_promo', id, status: 'paused' })
        });
      }
      toast.success('Selected promo codes deactivated.');
      setSelectedPromos([]);
      fetchMarketingData();
    } catch {
      toast.error('Error performing bulk deactivation.');
    }
  };

  const handleBulkDelete = async () => {
    if (selectedPromos.length === 0) return;
    if (!confirm(`Delete ${selectedPromos.length} promo codes?`)) return;
    try {
      for (const id of selectedPromos) {
        await fetch('/api/admin/marketing', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'delete_promo', id })
        });
      }
      toast.success('Selected promo codes deleted.');
      setSelectedPromos([]);
      fetchMarketingData();
    } catch {
      toast.error('Error performing bulk deletion.');
    }
  };

  // Export tables
  const exportCampaignsCSV = () => {
    const headers = 'ID,Name,Type,Status,Reach,CTR,Conversion,Budget\n';
    const rows = data.campaigns.map(c => `${c.id},"${c.name}",${c.type},${c.status},${c.reach},${c.clickRate}%,${c.conversion}%,${c.budget}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'beato_campaigns.csv';
    a.click();
    toast.success('Campaigns CSV exported.');
  };

  const exportPromosCSV = () => {
    const headers = 'Code,Discount,Type,Uses,Limit,Expiry,Status\n';
    const rows = data.promos.map(p => `"${p.code}",${p.discount},${p.type},${p.uses},${p.limit},${p.expiry},${p.status}`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'beato_promocodes.csv';
    a.click();
    toast.success('Promo codes CSV exported.');
  };

  // Print Report
  const printMarketingReport = () => {
    window.print();
  };

  // Layout drag-and-drop sequencing
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null) return;
    const items = [...layoutOrder];
    const draggedItem = items[draggedIndex];
    items.splice(draggedIndex, 1);
    items.splice(index, 0, draggedItem);
    setLayoutOrder(items);
    setDraggedIndex(null);
  };

  const handleSaveLayoutOrder = async () => {
    try {
      const res = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_layout_order', order: layoutOrder, customSections })
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success('Homepage layout order saved successfully!');
        fetchMarketingData();
        setAuditLogs(prev => [
          { id: String(Date.now()), time: new Date().toLocaleTimeString(), msg: 'Layout sequence updated and saved to DB', type: 'system' },
          ...prev
        ]);
      } else {
        toast.error('Failed to save layout order');
      }
    } catch {
      toast.error('Error saving layout order');
    }
  };

  const handleRemoveSection = (sectionId: string) => {
    setLayoutOrder(prev => prev.filter(s => s !== sectionId));
    toast.success('Section removed from layout. Save layout to persist.');
  };

  const handleDuplicateSection = (sectionId: string) => {
    if (sectionId.startsWith('custom_')) {
      const original = customSections[sectionId];
      if (!original) return;
      const newSecId = `custom_sec_${Date.now()}`;
      setCustomSections(prev => ({
        ...prev,
        [newSecId]: {
          ...original,
          title: `${original.title} (Copy)`
        }
      }));
      setLayoutOrder(prev => {
        const idx = prev.indexOf(sectionId);
        if (idx === -1) return [...prev, newSecId];
        const newOrder = [...prev];
        newOrder.splice(idx + 1, 0, newSecId);
        return newOrder;
      });
      toast.success('Custom section duplicated. Save to persist.');
    } else {
      let defaultTitle = sectionNames[sectionId] || sectionId;
      if (defaultTitle.includes(' ')) {
        defaultTitle = defaultTitle.split(' ').slice(1).join(' ');
      }
      let songIds: string[] = [];
      let layout: 'grid' | 'carousel' | 'list' | 'minimal' = 'grid';

      if (sectionId === 'trending_now') {
        songIds = [...mockTracks].sort((a, b) => b.plays - a.plays).slice(0, 8).map(t => t.id);
        layout = 'list';
      } else if (sectionId === 'new_music') {
        songIds = mockTracks.slice(0, 8).map(t => t.id);
        layout = 'grid';
      } else if (sectionId === 'recently_played') {
        songIds = mockTracks.slice(0, 6).map(t => t.id);
        layout = 'carousel';
      } else if (sectionId === 'made_for_you') {
        songIds = mockTracks.slice(0, 5).map(t => t.id);
        layout = 'grid';
      } else if (sectionId === 'liked_songs') {
        songIds = mockTracks.slice(0, 3).map(t => t.id);
        layout = 'grid';
      } else if (sectionId === 'quick_access') {
        songIds = mockTracks.slice(0, 6).map(t => t.id);
        layout = 'minimal';
      } else {
        songIds = mockTracks.slice(0, 6).map(t => t.id);
        layout = 'carousel';
      }

      const newSecId = `custom_sec_${Date.now()}`;
      setCustomSections(prev => ({
        ...prev,
        [newSecId]: {
          title: `${defaultTitle} (Copy)`,
          type: 'custom_songs',
          songIds,
          layout
        }
      }));
      setLayoutOrder(prev => {
        const idx = prev.indexOf(sectionId);
        if (idx === -1) return [...prev, newSecId];
        const newOrder = [...prev];
        newOrder.splice(idx + 1, 0, newSecId);
        return newOrder;
      });
      toast.success('Section duplicated as customizable shelf. Save to persist.');
    }
  };

  const handleAddStandardSection = (sectionId: string) => {
    if (!sectionId) return;
    if (layoutOrder.includes(sectionId)) return;
    setLayoutOrder(prev => [...prev, sectionId]);
    setSelectedSectionToAdd('');
    toast.success('Section added to layout. Save layout to persist.');
  };

  const handleAddCustomSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customSecTitle.trim()) {
      toast.error('Custom section title is required');
      return;
    }

    if (customSecType === 'custom_songs') {
      if (customSecSongIds.length === 0) {
        toast.error('Please select at least one song for the custom section');
        return;
      }
    } else if (customSecType === 'smart_filter') {
      // Smart filters can run on default matches or specific rules
    } else {
      if (!customSecTargetId.trim()) {
        toast.error('Please specify a target playlist/album');
        return;
      }
    }

    const newSectionId = `custom_sec_${Date.now()}`;
    setCustomSections(prev => ({
      ...prev,
      [newSectionId]: {
        title: customSecTitle,
        type: customSecType,
        targetId: (customSecType !== 'custom_songs' && customSecType !== 'smart_filter') ? customSecTargetId : undefined,
        songIds: customSecType === 'custom_songs' ? customSecSongIds : undefined,
        layout: customSecLayout,
        audience: customSecAudience,
        startDate: customSecStartDate || undefined,
        endDate: customSecEndDate || undefined,
        genreFilter: customSecType === 'smart_filter' ? (customSecGenreFilter || undefined) : undefined,
        minStreams: customSecType === 'smart_filter' ? (customSecMinPlays || undefined) : undefined,
        yearFilter: customSecType === 'smart_filter' ? (customSecYearFilter || undefined) : undefined,
        explicitFilter: customSecType === 'smart_filter' ? customSecExplicitFilter : undefined,
        bgStyle: customSecBgStyle,
        borderStyle: customSecBorderStyle
      }
    }));
    setLayoutOrder(prev => [...prev, newSectionId]);
    
    // Reset form states
    setCustomSecTitle('');
    setCustomSecTargetId('');
    setCustomSecSongIds([]);
    setCustomSecLayout('grid');
    setSongSearchQuery('');
    setCustomSecGenreFilter('');
    setCustomSecMinPlays(0);
    setCustomSecYearFilter('');
    setCustomSecExplicitFilter('all');
    setShowAdvancedOptions(false);
    setCustomSecAudience('all');
    setCustomSecStartDate('');
    setCustomSecEndDate('');
    setCustomSecBgStyle('default');
    setCustomSecBorderStyle('none');
    
    setShowCustomSecForm(false);
    toast.success('Custom section created & added to layout. Save layout to persist.');
  };

  // Custom Hero Promotions
  const handleCreatePromotion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoTitle.trim()) {
      toast.error('Promotion title is required');
      return;
    }
    if (!promoImage) {
      toast.error('Please upload/drop a banner image');
      return;
    }

    try {
      const res = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_promotion',
          promotion: {
            title: promoTitle,
            description: promoDesc,
            image: promoImage,
            type: promoType,
            targetId: promoTargetId
          }
        })
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success('Promotion banner created successfully!');
        setPromoTitle('');
        setPromoDesc('');
        setPromoType('banner');
        setPromoTargetId('');
        setPromoImage('');
        fetchMarketingData();
        setAuditLogs(prev => [
          { id: String(Date.now()), time: new Date().toLocaleTimeString(), msg: `Promotion created: "${promoTitle}"`, type: 'system' },
          ...prev
        ]);
      } else {
        toast.error('Failed to create promotion');
      }
    } catch {
      toast.error('Error creating promotion');
    }
  };

  const handleTogglePromotion = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'inactive' : 'active';
    try {
      const res = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_promotion', id, status: nextStatus })
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success(`Promotion status set to ${nextStatus}`);
        fetchMarketingData();
      }
    } catch {
      toast.error('Error toggling promotion status');
    }
  };

  const handleDeletePromotion = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    try {
      const res = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_promotion', id })
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success('Promotion deleted successfully');
        fetchMarketingData();
      }
    } catch {
      toast.error('Error deleting promotion');
    }
  };

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Only image files are allowed');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setCropImageSrc(reader.result);
        setShowCropModal(true);
      }
    };
    reader.readAsDataURL(file);
  };

  // ROI Forecast Chart data (100% computed from campaign costs and subscription values)
  const getRoiChartData = () => {
    return data.campaigns.map(c => {
      const spend = (c.spend || c.budget * 0.8) * data.currency.rate;
      const ConversionsVal = Math.round(c.reach * (c.conversion / 100));
      const revenueVal = ConversionsVal * (data.currency.code === 'INR' ? 830 : 9.99);
      const roi = spend > 0 ? Number(((revenueVal - spend) / spend * 100).toFixed(1)) : 0;
      return {
        name: c.name.substring(0, 12) + '...',
        Cost: Math.round(spend),
        Revenue: Math.round(revenueVal),
        ROI: roi
      };
    });
  };
  const getMatchedSongs = () => {
    if (customSecType === 'custom_songs') {
      return mockTracks.filter(t => customSecSongIds.includes(t.id));
    }
    if (customSecType === 'playlist') {
      const playlist = mockPlaylists.find(p => p.id === customSecTargetId);
      return playlist ? mockTracks.filter(t => playlist.tracks.includes(t.id)) : [];
    }
    if (customSecType === 'album') {
      const album = mockAlbums.find(a => a.id === customSecTargetId);
      return album ? mockTracks.filter(t => album.tracks.includes(t.id) || t.albumId === customSecTargetId) : [];
    }
    if (customSecType === 'smart_filter') {
      let filtered = [...mockTracks];
      if (customSecGenreFilter) {
        filtered = filtered.filter(t => t.genre.toLowerCase() === customSecGenreFilter.toLowerCase());
      }
      if (customSecMinPlays > 0) {
        filtered = filtered.filter(t => t.plays >= customSecMinPlays);
      }
      if (customSecYearFilter) {
        const yr = parseInt(customSecYearFilter);
        if (!isNaN(yr)) {
          filtered = filtered.filter(t => t.year === yr);
        }
      }
      if (customSecExplicitFilter === 'clean') {
        filtered = filtered.filter(t => !t.explicit);
      } else if (customSecExplicitFilter === 'explicit') {
        filtered = filtered.filter(t => t.explicit);
      }
      return filtered;
    }
    return [];
  };

  return (
    <div style={{ padding: '24px 0', fontFamily: 'Inter, sans-serif', color: '#221a15' }}>

      {/* ─── Sub-Tab Navigation Bar ─── */}
      <div style={{ background: '#ffffff', border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '4px', marginBottom: 24, display: 'inline-flex', gap: 2 }}>
        <button
          onClick={() => setActiveSubTab('campaigns')}
          style={{
            background: activeSubTab === 'campaigns' ? COLORS.primary : 'transparent',
            color: activeSubTab === 'campaigns' ? '#000' : COLORS.textMuted,
            border: 'none', borderRadius: 9, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          📣 Campaigns & Promos
        </button>
        <button
          onClick={() => setActiveSubTab('builder')}
          style={{
            background: activeSubTab === 'builder' ? COLORS.primary : 'transparent',
            color: activeSubTab === 'builder' ? '#000' : COLORS.textMuted,
            border: 'none', borderRadius: 9, padding: '8px 20px', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s'
          }}
        >
          🏗️ Homepage Builder Studio
        </button>
      </div>

      {/* ─── Homepage Builder Studio ─── */}
      {activeSubTab === 'builder' && (
        <HomepageBuilderTab />
      )}

      {/* ─── Campaigns & Promos Content ─── */}
      {activeSubTab === 'campaigns' && <>

      {/* ─── Control Header ─── */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: '#ffffff', border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '16px 20px', marginBottom: 24, display: 'flex', flexDirection: 'column', gap: 14 }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 20 }}>📣</span>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Enterprise Campaign & Growth Hub</h2>
              <p style={{ fontSize: 11, color: '#87786c', margin: 0 }}>Target segment estimators, persistent discount coupon codes, budgets and ROI auditing logs.</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={printMarketingReport}
              style={{ background: '#f4eede', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: '#ccc', cursor: 'pointer' }}>
              🖨️ Print Executive Report
            </button>
            <button onClick={fetchMarketingData}
              style={{ background: COLORS.primaryBg, border: `1px solid ${COLORS.primary}44`, borderRadius: 8, padding: '8px 14px', fontSize: 12, fontWeight: 600, color: COLORS.primary, cursor: 'pointer' }}>
              🔄 Refresh List
            </button>
          </div>
        </div>
      </motion.div>

      {/* ─── Overall Campaign Performance Stats ─── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Emails Sent Reach', value: data.stats.emailsSent >= 1000 ? `${(data.stats.emailsSent / 1000).toFixed(0)}K Reach` : `${data.stats.emailsSent} Reach`, icon: '📧', color: COLORS.blue, sub: 'Total email campaign dispatches.' },
          { label: 'Average Open Rate', value: `${data.stats.openRate}%`, icon: '📖', color: COLORS.primary, sub: 'Percentage of dispatches opened.' },
          { label: 'Average Click Rate (CTR)', value: `${data.stats.clickRate}%`, icon: '🖱️', color: COLORS.orange, sub: 'User links clicks interaction.' },
          { label: 'Conversion Performance', value: `${data.stats.conversionRate}%`, icon: '🛍️', color: COLORS.purple, sub: 'Conversion to Premium signups.' }
        ].map((s, i) => (
          <div key={s.label} style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: '16px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <span style={{ color: '#87786c', fontSize: 11, fontWeight: 700, textTransform: 'uppercase' }}>{s.label}</span>
              <span>{s.icon}</span>
            </div>
            <div style={{ color: s.color, fontSize: 24, fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>{s.value}</div>
            <span style={{ fontSize: 11, color: '#87786c' }}>{s.sub}</span>
          </div>
        ))}
      </motion.div>

      {/* ─── Active campaigns layout ─── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px', marginBottom: 24 }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Active Operations & Marketing Channels</h3>
            <p style={{ fontSize: 11, color: '#87786c', margin: 0 }}>Create, pause, duplicate or delete targeted campaigns directly in the database.</p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <input type="text" placeholder="Search campaign..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              style={{ background: '#f4eede', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '6px 12px', color: '#221a15', fontSize: 12, width: 150 }} />
            
            <select value={filterType} onChange={(e) => setFilterType(e.target.value)}
              style={{ background: '#f4eede', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '6px', color: '#221a15', fontSize: 12, cursor: 'pointer' }}>
              <option value="all">All Channels</option>
              <option value="email">Emails Only</option>
              <option value="push">Push Notification</option>
              <option value="banner">Banner Alerts</option>
              <option value="sms">SMS Texting</option>
            </select>
            
            <button onClick={exportCampaignsCSV}
              style={{ background: '#f4eede', border: `1px solid ${COLORS.border}`, color: '#aaa', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              📤 Export CSV
            </button>
            <button onClick={() => setShowCampaignModal(true)}
              style={{ background: COLORS.primary, border: 'none', color: '#000', borderRadius: 8, padding: '6px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              + Create Campaign
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {data.campaigns
            .filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
            .filter(c => filterType === 'all' || c.type === filterType)
            .map(c => {
              const channel = campaignTypeColors[c.type as keyof typeof campaignTypeColors] || { color: '#87786c', bg: '#6b72801a', icon: '📢' };
              return (
                <div key={c.id} style={{ background: '#ffffff', border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: '16px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2.5, background: channel.color }} />
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ background: channel.bg, color: channel.color, border: `1px solid ${channel.color}33`, padding: '3px 8px', borderRadius: 6, fontSize: 10, fontWeight: 700, textTransform: 'uppercase' }}>
                      {channel.icon} {c.type}
                    </span>
                    <span style={{ fontSize: 10, background: c.status === 'active' ? 'rgba(176, 136, 80,0.1)' : 'rgba(107,114,128,0.1)', color: c.status === 'active' ? COLORS.primary : COLORS.textMuted, border: `1px solid ${c.status === 'active' ? COLORS.primary : COLORS.border}33`, padding: '2px 8px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase' }}>
                      {c.status}
                    </span>
                  </div>

                  <h4 style={{ margin: '0 0 12px 0', fontSize: 14, fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>{c.name}</h4>
                  
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
                    <div style={{ background: 'rgba(43, 34, 26, 0.03)', borderRadius: 8, padding: '6px 8px' }}>
                      <span style={{ fontSize: 9, color: '#87786c', display: 'block' }}>REACH</span>
                      <strong style={{ fontSize: 13, color: '#221a15' }}>{c.reach >= 1000 ? `${(c.reach / 1000).toFixed(0)}K` : c.reach}</strong>
                    </div>
                    <div style={{ background: 'rgba(43, 34, 26, 0.03)', borderRadius: 8, padding: '6px 8px' }}>
                      <span style={{ fontSize: 9, color: '#87786c', display: 'block' }}>CTR</span>
                      <strong style={{ fontSize: 13, color: '#221a15' }}>{c.clickRate.toFixed(1)}%</strong>
                    </div>
                    <div style={{ background: 'rgba(43, 34, 26, 0.03)', borderRadius: 8, padding: '6px 8px' }}>
                      <span style={{ fontSize: 9, color: '#87786c', display: 'block' }}>CONV</span>
                      <strong style={{ fontSize: 13, color: COLORS.primary }}>{c.conversion.toFixed(1)}%</strong>
                    </div>
                  </div>

                  {/* Actions buttons */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button onClick={() => setStatsModalCampaign(c)}
                      style={{ flex: 1, background: 'rgba(43,34,26,0.08)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 0', fontSize: 11, fontWeight: 600, color: '#221a15', cursor: 'pointer' }}>
                      📊 View Stats
                    </button>
                    <button onClick={() => handleToggleCampaign(c.id, c.status)}
                      style={{ background: 'rgba(43,34,26,0.08)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 10px', fontSize: 11, fontWeight: 600, color: c.status === 'active' ? COLORS.orange : COLORS.primary, cursor: 'pointer' }}>
                      {c.status === 'active' ? '⏸️ Pause' : '▶️ Resume'}
                    </button>
                    <button onClick={() => handleCloneCampaign(c)} title="Duplicate Campaign"
                      style={{ background: 'rgba(43,34,26,0.08)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 8px', color: '#ccc', cursor: 'pointer' }}>
                      ⧉
                    </button>
                    <button onClick={() => handleDeleteCampaign(c.id)} title="Delete Campaign"
                      style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid ${COLORS.red}33`, borderRadius: 6, padding: '6px 8px', color: COLORS.red, cursor: 'pointer' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              );
            })}
        </div>
      </motion.div>

      {/* ─── Campaign ROI chart & scheduler row ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
        
        {/* ROI Forecast Area Chart */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif' }}>📈 Revenue ROI Marketing Impact</h3>
          <p style={{ fontSize: 11, color: '#87786c', margin: '0 0 16px 0' }}>Plots campaign budget cost against generated conversion signup revenues.</p>
          
          <div style={{ height: 180 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={getRoiChartData()} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1c1c1c" />
                <XAxis dataKey="name" tick={{ fill: '#666', fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#666', fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip {...chartTooltip} />
                <Legend wrapperStyle={{ fontSize: 10 }} />
                <Area type="monotone" dataKey="Cost" name={`Spend (${data.currency.symbol})`} stroke={COLORS.red} fill="rgba(239,68,68,0.1)" />
                <Area type="monotone" dataKey="Revenue" name={`Revenue (${data.currency.symbol})`} stroke={COLORS.primary} fill="rgba(176, 136, 80,0.15)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Campaign scheduler automations & alert warnings */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif' }}>🤖 Automation & Operations Scheduler</h3>
          <p style={{ fontSize: 11, color: '#87786c', margin: '0 0 14px 0' }}>Setup event triggers to execute dispatches automatically.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flex: 1 }}>
            <div>
              <label style={{ fontSize: 10, color: '#87786c', display: 'block', marginBottom: 4, fontWeight: 600 }}>EVENT TRIGGER</label>
              <select value={autoTrigger} onChange={(e) => setAutoTrigger(e.target.value)}
                style={{ background: '#f4eede', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '7px 10px', color: '#221a15', fontSize: 11, width: '100%' }}>
                <option value="on_registration">On User Registration</option>
                <option value="on_premium_cancel">On Subscription Cancel</option>
                <option value="on_14d_inactivity">On 14-Day Inactivity</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 10, color: '#87786c', display: 'block', marginBottom: 4, fontWeight: 600 }}>AUTOMATED CHANNEL ACTION</label>
              <select value={autoAction} onChange={(e) => setAutoAction(e.target.value)}
                style={{ background: '#f4eede', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '7px 10px', color: '#221a15', fontSize: 11, width: '100%' }}>
                <option value="send_welcome_email">Send Welcome Promo Email</option>
                <option value="push_offer">Push Retention Discount Coupon</option>
                <option value="sms_survey">Send Feedback SMS Survey</option>
              </select>
            </div>
            
            <button onClick={() => {
              toast.success('Automation rule updated & armed!');
              setAuditLogs(prev => [
                { id: String(Date.now()), time: new Date().toLocaleTimeString(), msg: `Automation armed: ${autoTrigger} triggers ${autoAction}`, type: 'system' },
                ...prev
              ]);
            }}
              style={{ background: COLORS.primary, border: 'none', color: '#000', borderRadius: 8, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 'auto' }}>
              💾 Update Automation Rule
            </button>
          </div>
        </motion.div>
      </div>

      {/* ─── Promo Codes Persistent Table ─── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px', marginBottom: 24 }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div>
            <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Coupon Promo Code Manager</h3>
            <p style={{ fontSize: 11, color: '#87786c', margin: 0 }}>Persistent coupon settings with active usage bars and bulk deactivation tools.</p>
          </div>
          
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <input type="text" placeholder="Filter coupon code..." value={promoSearch} onChange={(e) => setPromoSearch(e.target.value)}
              style={{ background: '#f4eede', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '6px 12px', color: '#221a15', fontSize: 12, width: 140 }} />
            
            {selectedPromos.length > 0 && (
              <>
                <button onClick={handleBulkDeactivate}
                  style={{ background: 'rgba(245,158,11,0.15)', border: `1px solid ${COLORS.orange}44`, color: COLORS.orange, borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  ⏸️ Deactivate ({selectedPromos.length})
                </button>
                <button onClick={handleBulkDelete}
                  style={{ background: 'rgba(239,68,68,0.15)', border: `1px solid ${COLORS.red}44`, color: COLORS.red, borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                  🗑️ Delete ({selectedPromos.length})
                </button>
              </>
            )}

            <button onClick={exportPromosCSV}
              style={{ background: '#f4eede', border: `1px solid ${COLORS.border}`, color: '#aaa', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
              📤 Export CSV
            </button>
            <button onClick={() => setShowPromoModal(true)}
              style={{ background: '#f4eede', border: `1px solid ${COLORS.border}`, color: '#ccc', borderRadius: 8, padding: '6px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              + Create Promo Code
            </button>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${COLORS.border}`, color: '#87786c', fontSize: 10, textAlign: 'left' }}>
                <th style={{ padding: '10px 14px' }}>
                  <input type="checkbox" checked={selectedPromos.length === data.promos.length && data.promos.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedPromos(data.promos.map(p => p.id));
                      else setSelectedPromos([]);
                    }}
                    style={{ accentColor: COLORS.primary }} />
                </th>
                <th style={{ padding: '10px 14px' }}>Promo Code</th>
                <th style={{ padding: '10px 14px' }}>Discount Value</th>
                <th style={{ padding: '10px 14px' }}>Coupon Type</th>
                <th style={{ padding: '10px 14px' }}>Uses Progression</th>
                <th style={{ padding: '10px 14px' }}>Expiration</th>
                <th style={{ padding: '10px 14px' }}>Status</th>
                <th style={{ padding: '10px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.promos
                .filter(p => p.code.toLowerCase().includes(promoSearch.toLowerCase()))
                .map(p => {
                  const nearLimit = p.limit > 0 && (p.uses / p.limit) > 0.85;
                  const isExpired = p.status === 'expired' || (p.expiry !== 'Ongoing' && new Date(p.expiry).getTime() < Date.now());
                  return (
                    <tr key={p.id} style={{ borderBottom: `1px solid ${COLORS.border}`, fontSize: 12 }}>
                      <td style={{ padding: '12px 14px' }}>
                        <input type="checkbox" checked={selectedPromos.includes(p.id)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedPromos(prev => [...prev, p.id]);
                            else setSelectedPromos(prev => prev.filter(id => id !== p.id));
                          }}
                          style={{ accentColor: COLORS.primary }} />
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <code style={{ background: 'rgba(43, 34, 26, 0.04)', border: `1px solid ${COLORS.border}`, color: COLORS.primary, padding: '3px 8px', borderRadius: 6, fontWeight: 700 }}>
                          {p.code}
                        </code>
                        {nearLimit && <span style={{ marginLeft: 6, color: COLORS.orange }} title="Code usage is approaching target limits">⚠️ Near Limit</span>}
                        {isExpired && <span style={{ marginLeft: 6, color: COLORS.red }} title="Promo has passed expiration limits">🕒 Expired</span>}
                      </td>
                      <td style={{ padding: '12px 14px', fontWeight: 700, fontSize: 14 }}>
                        {p.type === 'percent' ? `${p.discount}%` : `${data.currency.symbol}${Math.round(p.discount * data.currency.rate)}`}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#87786c' }}>{p.type === 'percent' ? 'Percentage' : 'Fixed Cash Discount'}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                          <span>{p.uses.toLocaleString()} / {p.limit === 0 ? '∞' : p.limit.toLocaleString()}</span>
                          {p.limit > 0 && <span style={{ color: nearLimit ? COLORS.red : COLORS.textMuted }}>{Math.round((p.uses / p.limit) * 100)}%</span>}
                        </div>
                        {p.limit > 0 && (
                          <div style={{ background: '#f4eede', borderRadius: 3, height: 5, overflow: 'hidden' }}>
                            <div style={{ width: `${Math.min(100, (p.uses / p.limit) * 100)}%`, height: '100%', background: nearLimit ? COLORS.red : COLORS.primary }} />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px', color: '#87786c' }}>{p.expiry}</td>
                      <td style={{ padding: '12px 14px' }}>
                        <span style={{ fontSize: 10, background: p.status === 'active' ? 'rgba(176, 136, 80,0.1)' : 'rgba(239,68,68,0.1)', color: p.status === 'active' ? COLORS.primary : COLORS.red, border: `1px solid ${p.status === 'active' ? COLORS.primary : COLORS.red}33`, padding: '2px 8px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase' }}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
                          <button onClick={() => handleTogglePromo(p.id, p.status)}
                            style={{ background: 'rgba(43,34,26,0.08)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 600, color: p.status === 'active' ? COLORS.orange : COLORS.primary, cursor: 'pointer' }}>
                            {p.status === 'active' ? 'Pause' : 'Activate'}
                          </button>
                          <button onClick={() => handleDeletePromo(p.id)}
                            style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid ${COLORS.red}33`, borderRadius: 6, padding: '4px 8px', color: COLORS.red, cursor: 'pointer' }}>
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      </motion.div>

      {/* ─── Homepage Layout & Promotions Manager ─── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>

        {/* Column 1: Layout Sequencer */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <h3 style={{ fontSize: 14, fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>↕️ Homepage Drag & Drop Layout Sequencer</h3>
            <span style={{ fontSize: 18 }}>📱</span>
          </div>
          <p style={{ fontSize: 11, color: '#87786c', margin: '0 0 16px 0' }}>Drag sections to reorder how they appear on the homepage for all users.</p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, marginBottom: 16 }}>
            {layoutOrder.map((sectionId, idx) => (
              <div
                key={sectionId}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, idx)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  background: draggedIndex === idx ? '#1a1a1a' : '#161616',
                  border: draggedIndex === idx ? `1px dashed ${COLORS.primary}` : `1px solid ${COLORS.border}`,
                  borderRadius: 10,
                  padding: '10px 14px',
                  cursor: 'grab',
                  opacity: draggedIndex === idx ? 0.5 : 1,
                  transition: 'background 0.2s, border-color 0.2s',
                }}
              >
                <span style={{ marginRight: 12, color: '#87786c', fontSize: 14, userSelect: 'none' }}>☰</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: '#221a15', display: 'flex', alignItems: 'center', gap: 6 }}>
                  {sectionNames[sectionId] || 
                   (sectionId.startsWith('promo_') ? 
                     `📢 Promo: ${data?.promotions?.find((p: any) => p.id === sectionId.replace('promo_', ''))?.title || sectionId.replace('promo_', '')}` : 
                     customSections[sectionId]?.title || sectionId
                   )}
                  {customSections[sectionId] && (
                    <span style={{ fontSize: 9, background: 'rgba(16, 185, 129, 0.15)', color: '#10b981', border: '1px solid rgba(16, 185, 129,0.3)', padding: '1px 5px', borderRadius: 4 }}>
                      Custom Shelf
                    </span>
                  )}
                  {sectionId.startsWith('promo_') && (
                    <span style={{ fontSize: 9, background: 'rgba(176, 136, 80, 0.15)', color: COLORS.primary, border: '1px solid rgba(176, 136, 80,0.3)', padding: '1px 5px', borderRadius: 4 }}>
                      Promo Banner
                    </span>
                  )}
                </span>
                {/* Duplicate row button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleDuplicateSection(sectionId); }}
                  style={{
                    marginLeft: 'auto',
                    marginRight: 6,
                    background: 'transparent',
                    border: 'none',
                    color: COLORS.primary,
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4
                  }}
                  title="Duplicate section"
                >
                  ⧉
                </button>

                {/* Delete/remove row button */}
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); handleRemoveSection(sectionId); }}
                  style={{
                    marginRight: 10,
                    background: 'transparent',
                    border: 'none',
                    color: COLORS.red,
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    padding: 4
                  }}
                  title="Remove from homepage layout"
                >
                  🗑️
                </button>

                <span style={{ fontSize: 10, color: '#87786c', background: '#1c1c1c', padding: '2px 6px', borderRadius: 4 }}>
                  Order {idx + 1}
                </span>
              </div>
            ))}
          </div>

          {/* Section Addition Tools */}
          <div style={{ background: '#ffffff', borderRadius: 10, padding: 12, border: `1px solid ${COLORS.border}`, marginBottom: 12 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#87786c', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>➕ Add Section to Layout</span>
            
            {/* Standard sections selector */}
            {(() => {
              const standardSectionsList = [
                "quick_access",
                "liked_songs",
                "promotions_hero",
                "made_for_you",
                "featured_artist",
                "new_music",
                "trending_now",
                "your_taste",
                "recently_played",
                "mood_playlists",
                "daily_mixes"
              ];
              const availableToAdd = standardSectionsList.filter(s => !layoutOrder.includes(s));
              if (availableToAdd.length === 0) return null;
              return (
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <select
                    value={selectedSectionToAdd}
                    onChange={(e) => setSelectedSectionToAdd(e.target.value)}
                    style={{ ...inputStyle, padding: '6px 10px', fontSize: 11, flex: 1 }}
                  >
                    <option value="">-- Add back standard section --</option>
                    {availableToAdd.map(s => (
                      <option key={s} value={s}>{sectionNames[s] || s}</option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleAddStandardSection(selectedSectionToAdd)}
                    style={{ background: 'rgba(43,34,26,0.08)', border: `1px solid ${COLORS.border}`, color: '#221a15', borderRadius: 8, padding: '6px 12px', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                  >
                    Add
                  </button>
                </div>
              );
            })()}

            {/* Custom Section Creator */}
            {!showCustomSecForm ? (
              <button
                type="button"
                onClick={() => setShowCustomSecForm(true)}
                style={{ background: 'transparent', border: 'none', color: COLORS.primary, fontSize: 11, fontWeight: 600, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', gap: 4 }}
              >
                + Create Add Section to Layout Designer
              </button>
            ) : (
              <form onSubmit={handleAddCustomSection} style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 4, background: '#181818', padding: 14, borderRadius: 12, border: '1px solid #282828' }}>
                <div>
                  <label style={{ fontSize: 9, color: '#87786c', display: 'block', marginBottom: 2 }}>Section Title</label>
                  <input
                    value={customSecTitle}
                    onChange={e => setCustomSecTitle(e.target.value)}
                    placeholder="e.g. Chill Beats or Manoj's Favorites"
                    style={{ ...inputStyle, padding: '6px 10px', fontSize: 11 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                  <div>
                    <label style={{ fontSize: 9, color: '#87786c', display: 'block', marginBottom: 2 }}>Content Source</label>
                    <select
                      value={customSecType}
                      onChange={e => {
                        const val = e.target.value as any;
                        setCustomSecType(val);
                        if (val === 'playlist') {
                          setCustomSecTargetId(mockPlaylists[0]?.id || '');
                        } else if (val === 'album') {
                          setCustomSecTargetId(mockAlbums[0]?.id || '');
                        } else {
                          setCustomSecTargetId('');
                        }
                      }}
                      style={{ ...inputStyle, padding: '6px 10px', fontSize: 11 }}
                    >
                      <option value="playlist">Link to Playlist</option>
                      <option value="album">Link to Album</option>
                      <option value="custom_songs">Custom Selected Songs</option>
                      <option value="smart_filter">Smart Filter Rules</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 9, color: '#87786c', display: 'block', marginBottom: 2 }}>Design Layout Template</label>
                    <select
                      value={customSecLayout}
                      onChange={e => setCustomSecLayout(e.target.value as any)}
                      style={{ ...inputStyle, padding: '6px 10px', fontSize: 11 }}
                    >
                      {EXTENDED_LAYOUT_OPTIONS.map((group, i) => (
                        <optgroup key={i} label={group.group}>
                          {group.options.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                          ))}
                        </optgroup>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Playlist/Album Dropdown Selection */}
                {(customSecType === 'playlist' || customSecType === 'album') && (
                  <div>
                    <label style={{ fontSize: 9, color: '#87786c', display: 'block', marginBottom: 2 }}>
                      Select Target {customSecType === 'playlist' ? 'Playlist' : 'Album'}
                    </label>
                    <select
                      value={customSecTargetId}
                      onChange={e => setCustomSecTargetId(e.target.value)}
                      style={{ ...inputStyle, padding: '6px 10px', fontSize: 11 }}
                    >
                      <option value="">-- Choose {customSecType === 'playlist' ? 'Playlist' : 'Album'} --</option>
                      {customSecType === 'playlist'
                        ? mockPlaylists.map(p => (
                            <option key={p.id} value={p.id}>{p.title} ({p.tracks.length} songs)</option>
                          ))
                        : mockAlbums.map(a => (
                            <option key={a.id} value={a.id}>{a.title} by {a.artistName}</option>
                          ))
                      }
                    </select>
                  </div>
                )}

                {/* Dynamic Smart Filter Rules inputs */}
                {customSecType === 'smart_filter' && (
                  <div style={{ background: '#ffffff', padding: 10, borderRadius: 8, border: '1px solid rgba(43,34,26,0.1)', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <span style={{ fontSize: 9, fontWeight: 700, color: COLORS.primary, display: 'block' }}>⚙️ Smart Filter Rules Configuration</span>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 8, color: '#87786c', display: 'block', marginBottom: 2 }}>Filter by Genre</label>
                        <select
                          value={customSecGenreFilter}
                          onChange={e => setCustomSecGenreFilter(e.target.value)}
                          style={{ ...inputStyle, padding: '5px 8px', fontSize: 10 }}
                        >
                          <option value="">All Genres</option>
                          {Array.from(new Set(mockTracks.map(t => t.genre))).map(genre => (
                            <option key={genre} value={genre}>{genre}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ fontSize: 8, color: '#87786c', display: 'block', marginBottom: 2 }}>Plays Count (Minimum)</label>
                        <select
                          value={customSecMinPlays}
                          onChange={e => setCustomSecMinPlays(Number(e.target.value))}
                          style={{ ...inputStyle, padding: '5px 8px', fontSize: 10 }}
                        >
                          <option value="0">No Plays Threshold</option>
                          <option value="5000000">Over 5M Plays</option>
                          <option value="10000000">Over 10M Plays</option>
                          <option value="20000000">Over 20M Plays</option>
                          <option value="40000000">Over 40M Plays</option>
                        </select>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ fontSize: 8, color: '#87786c', display: 'block', marginBottom: 2 }}>Release Year</label>
                        <input
                          type="number"
                          value={customSecYearFilter}
                          onChange={e => setCustomSecYearFilter(e.target.value)}
                          placeholder="e.g. 2024"
                          style={{ ...inputStyle, padding: '5px 8px', fontSize: 10 }}
                        />
                      </div>

                      <div>
                        <label style={{ fontSize: 8, color: '#87786c', display: 'block', marginBottom: 2 }}>Content Type</label>
                        <select
                          value={customSecExplicitFilter}
                          onChange={e => setCustomSecExplicitFilter(e.target.value as any)}
                          style={{ ...inputStyle, padding: '5px 8px', fontSize: 10 }}
                        >
                          <option value="all">All Tracks</option>
                          <option value="clean">Family Friendly Only (Clean)</option>
                          <option value="explicit">Explicit Only</option>
                        </select>
                      </div>
                    </div>
                  </div>
                )}

                {/* Custom Selected Songs Search Checklist */}
                {customSecType === 'custom_songs' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, background: '#101010', padding: 8, borderRadius: 8, border: '1px solid rgba(43,34,26,0.1)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label style={{ fontSize: 9, color: '#87786c', fontWeight: 700 }}>
                        Select Songs ({customSecSongIds.length} selected)
                      </label>
                      {customSecSongIds.length > 0 && (
                        <button type="button" onClick={() => setCustomSecSongIds([])} style={{ background: 'transparent', border: 'none', color: COLORS.red, fontSize: 8, cursor: 'pointer' }}>
                          Clear All
                        </button>
                      )}
                    </div>
                    <input
                      value={songSearchQuery}
                      onChange={e => setSongSearchQuery(e.target.value)}
                      placeholder="🔍 Search songs or artists..."
                      style={{ ...inputStyle, padding: '5px 8px', fontSize: 10, background: '#f4eede' }}
                    />
                    <div style={{ maxHeight: 110, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4, paddingRight: 4 }}>
                      {mockTracks
                        .filter(t =>
                          t.title.toLowerCase().includes(songSearchQuery.toLowerCase()) ||
                          t.artistName.toLowerCase().includes(songSearchQuery.toLowerCase())
                        )
                        .map(t => {
                          const isChecked = customSecSongIds.includes(t.id);
                          return (
                            <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', padding: '4px 6px', borderRadius: 4, background: isChecked ? 'rgba(176, 136, 80, 0.12)' : 'transparent', transition: 'background 0.15s' }}>
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  if (isChecked) {
                                    setCustomSecSongIds(prev => prev.filter(id => id !== t.id));
                                  } else {
                                    setCustomSecSongIds(prev => [...prev, t.id]);
                                  }
                                }}
                                style={{ accentColor: COLORS.primary }}
                              />
                              <div style={{ display: 'flex', flexDirection: 'column' }}>
                                <span style={{ fontSize: 10, fontWeight: 600, color: isChecked ? COLORS.primary : '#fff' }}>{t.title}</span>
                                <span style={{ fontSize: 8, color: '#87786c' }}>{t.artistName}</span>
                              </div>
                            </label>
                          );
                        })
                      }
                    </div>
                  </div>
                )}

                {/* Real-time matched tracks content preview */}
                {(() => {
                  const matched = getMatchedSongs();
                  return (
                    <div style={{ background: '#fbf9f5', padding: 8, borderRadius: 8, border: '1px solid rgba(43,34,26,0.1)' }}>
                      <span style={{ fontSize: 8, fontWeight: 700, color: COLORS.primary, display: 'block', marginBottom: 6 }}>
                        👁️ Live Content Preview ({matched.length} tracks matched)
                      </span>
                      {matched.length === 0 ? (
                        <div style={{ fontSize: 8, color: '#87786c', textAlign: 'center', padding: '4px 0' }}>
                          No songs match the current rules.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }}>
                          {matched.slice(0, 10).map(t => (
                            <div key={t.id} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 36, flexShrink: 0 }} title={`${t.title} - ${t.artistName}`}>
                              <img src={t.coverImage} alt={t.title} style={{ width: 28, height: 28, borderRadius: 4, objectFit: 'cover' }} />
                              <span style={{ fontSize: 6, color: '#87786c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center', marginTop: 1 }}>{t.title}</span>
                            </div>
                          ))}
                          {matched.length > 10 && (
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 28, height: 28, borderRadius: 4, background: '#1c1c1c', flexShrink: 0, fontSize: 8, color: '#87786c' }}>
                              +{matched.length - 10}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Collapsible Advanced Options Accordion */}
                <div style={{ border: '1px solid #282828', borderRadius: 8, overflow: 'hidden' }}>
                  <button
                    type="button"
                    onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                    style={{
                      width: '100%',
                      background: '#ffffff',
                      border: 'none',
                      padding: '6px 10px',
                      color: COLORS.primary,
                      fontSize: 10,
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <span>⚙️ Advanced Options (Targeting, Scheduling, Theme Styles)</span>
                    <span>{showAdvancedOptions ? '▲' : '▼'}</span>
                  </button>
                  {showAdvancedOptions && (
                    <div style={{ padding: 10, background: '#141414', display: 'flex', flexDirection: 'column', gap: 8, borderTop: '1px solid #282828' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          <label style={{ fontSize: 8, color: '#87786c', display: 'block', marginBottom: 2 }}>Target Audience Segment</label>
                          <select
                            value={customSecAudience}
                            onChange={e => setCustomSecAudience(e.target.value as any)}
                            style={{ ...inputStyle, padding: '5px 8px', fontSize: 10 }}
                          >
                            <option value="all">All Platform Users</option>
                            <option value="premium">Premium Subscribed Users Only</option>
                            <option value="free">Free Tier Listeners Only</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: 8, color: '#87786c', display: 'block', marginBottom: 2 }}>Background Theme Container</label>
                          <select
                            value={customSecBgStyle}
                            onChange={e => setCustomSecBgStyle(e.target.value as any)}
                            style={{ ...inputStyle, padding: '5px 8px', fontSize: 10 }}
                          >
                            <option value="default">Default Dark Background</option>
                            <option value="gradient_emerald">Emerald Gradient Accent</option>
                            <option value="gradient_purple">Royal Purple Gradient Accent</option>
                            <option value="glassmorphism">Glassmorphic Blurred Border</option>
                            <option value="neon_glow">Neon Green Glowing Background</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                        <div>
                          <label style={{ fontSize: 8, color: '#87786c', display: 'block', marginBottom: 2 }}>Display Start Date</label>
                          <input
                            type="date"
                            value={customSecStartDate}
                            onChange={e => setCustomSecStartDate(e.target.value)}
                            style={{ ...inputStyle, padding: '5px 8px', fontSize: 10 }}
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: 8, color: '#87786c', display: 'block', marginBottom: 2 }}>Display End Date</label>
                          <input
                            type="date"
                            value={customSecEndDate}
                            onChange={e => setCustomSecEndDate(e.target.value)}
                            style={{ ...inputStyle, padding: '5px 8px', fontSize: 10 }}
                          />
                        </div>
                      </div>

                      <div>
                        <label style={{ fontSize: 8, color: '#87786c', display: 'block', marginBottom: 2 }}>Border Highlight Style</label>
                        <select
                          value={customSecBorderStyle}
                          onChange={e => setCustomSecBorderStyle(e.target.value as any)}
                          style={{ ...inputStyle, padding: '5px 8px', fontSize: 10 }}
                        >
                          <option value="none">No Border Highlights</option>
                          <option value="primary">Static Primary Green Outline</option>
                          <option value="pulsing">Pulsing Neon Green Border (Motion)</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end', marginTop: 4 }}>
                  <button
                    type="button"
                    onClick={() => setShowCustomSecForm(false)}
                    style={{ background: 'transparent', border: `1px solid ${COLORS.border}`, color: '#888', borderRadius: 6, padding: '4px 10px', fontSize: 10, cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    style={{ background: COLORS.primary, border: 'none', color: '#000', borderRadius: 6, padding: '4px 14px', fontSize: 10, fontWeight: 700, cursor: 'pointer' }}
                  >
                    Add Custom Shelf
                  </button>
                </div>
              </form>
            )}
          </div>

          <button onClick={handleSaveLayoutOrder}
            style={{ background: COLORS.primary, border: 'none', color: '#000', borderRadius: 8, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            💾 Save Homepage Layout Sequence
          </button>
        </div>

        {/* Column 2: Custom Promo Creator */}
        <div style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif' }}>🎨 Create Custom Homepage Promotion</h3>
          <p style={{ fontSize: 11, color: '#87786c', margin: '0 0 16px 0' }}>Upload a custom promotional banner linked to playlists, albums, or tracks.</p>

          <form onSubmit={handleCreatePromotion} style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
            <div>
              <label style={labelStyle}>Promotion Title</label>
              <input value={promoTitle} onChange={e => setPromoTitle(e.target.value)} placeholder="e.g. Neon Dreams Album Launch" style={inputStyle} />
            </div>

            <div>
              <label style={labelStyle}>Description / Subtitle</label>
              <input value={promoDesc} onChange={e => setPromoDesc(e.target.value)} placeholder="e.g. Listen to the latest synthwave beats from Aurora Nightfall" style={inputStyle} />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <label style={labelStyle}>Promo Type</label>
                <select value={promoType} onChange={e => setPromoType(e.target.value as any)} style={inputStyle}>
                  <option value="banner">Banner Image Only</option>
                  <option value="playlist">Playlist Feature</option>
                  <option value="album">Album Feature</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Target Resource ID</label>
                <input value={promoTargetId} onChange={e => setPromoTargetId(e.target.value)} placeholder="e.g. playlist-123 or album-456" style={inputStyle} />
              </div>
            </div>

            <div>
              <label style={labelStyle}>Promo Banner Image</label>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOverFile(true); }}
                onDragLeave={() => setDragOverFile(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOverFile(false);
                  if (e.dataTransfer.files?.[0]) {
                    handleImageFile(e.dataTransfer.files[0]);
                  }
                }}
                style={{
                  border: `2px dashed ${dragOverFile ? COLORS.primary : COLORS.border}`,
                  borderRadius: 10,
                  padding: '16px',
                  textAlign: 'center',
                  background: '#ffffff',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s',
                  position: 'relative',
                  minHeight: 80,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/*';
                  input.onchange = (e: any) => {
                    if (e.target.files?.[0]) {
                      handleImageFile(e.target.files[0]);
                    }
                  };
                  input.click();
                }}
              >
                {promoImage ? (
                  <div style={{ position: 'relative', width: '100%', height: 70 }}>
                    <img src={promoImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 6 }} />
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setPromoImage(''); }}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: COLORS.red,
                        border: 'none',
                        color: '#221a15',
                        borderRadius: '50%',
                        width: 18,
                        height: 18,
                        fontSize: 9,
                        fontWeight: 900,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <div>
                    <span style={{ fontSize: 20, display: 'block', marginBottom: 4 }}>📤</span>
                    <span style={{ fontSize: 10, color: '#87786c' }}>Drag image here or click to upload</span>
                  </div>
                )}
              </div>
              <p style={{ fontSize: 9, color: '#87786c', marginTop: 4, margin: 0 }}>
                💡 Recommended Banner Size: <strong>1200 x 400 pixels (3:1 aspect ratio)</strong> for visually premium desktop integration. You can crop the image on upload.
              </p>
            </div>

            {/* Real-time Banner Preview Box */}
            <div style={{ border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: 12, background: '#ffffff' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#87786c', display: 'block', marginBottom: 8, textTransform: 'uppercase' }}>👁️ Real-time Banner Preview</span>
              <div
                style={{
                  borderRadius: 12,
                  overflow: 'hidden',
                  position: 'relative',
                  height: 110,
                  border: '1px solid rgba(43, 34, 26, 0.06)',
                  background: '#fbf9f5',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {promoImage ? (
                  <div style={{ position: 'absolute', inset: 0 }}>
                    <img src={promoImage} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.7 }} />
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.2) 60%, rgba(0,0,0,0.55) 100%)' }} />
                  </div>
                ) : (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#444', fontSize: 10 }}>
                    Upload banner image to see live preview
                  </div>
                )}
                <div style={{ position: 'relative', padding: '0 16px', zIndex: 2, pointerEvents: 'none' }}>
                  <span style={{ color: COLORS.primary, fontSize: 8, fontWeight: 700, textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                    🔥 Promotion • {promoType}
                  </span>
                  <h4 style={{ margin: 0, fontSize: 12, fontWeight: 900, color: '#221a15' }}>
                    {promoTitle || 'Neon Dreams Album Launch'}
                  </h4>
                  <p style={{ color: '#aaa', fontSize: 9, margin: '2px 0 6px 0', maxWidth: '80%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {promoDesc || 'Listen to the latest synthwave beats from Aurora Nightfall'}
                  </p>
                  <button style={{ padding: '3px 10px', borderRadius: 100, background: COLORS.primary, border: 'none', color: '#000', fontWeight: 700, fontSize: 8 }}>
                    Explore Feature
                  </button>
                </div>
              </div>
            </div>

            <button type="submit"
              style={{ background: COLORS.primary, border: 'none', color: '#000', borderRadius: 8, padding: '10px', fontSize: 12, fontWeight: 700, cursor: 'pointer', marginTop: 6 }}>
              ✨ Create & Deploy Promotion
            </button>
          </form>
        </div>

      </motion.div>

      {/* ─── Active Promotion Placements List ─── */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px', marginBottom: 24 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif' }}>🖼️ Active Homepage Promo Placements</h3>
        <p style={{ fontSize: 11, color: '#87786c', margin: '0 0 16px 0' }}>Manage custom banners running live in the client homepage hero promotion stack.</p>

        {(!data.promotions || data.promotions.length === 0) ? (
          <div style={{ background: '#ffffff', border: `1px dashed ${COLORS.border}`, borderRadius: 12, padding: '24px', textAlign: 'center', color: '#87786c', fontSize: 12 }}>
            No custom promotional banners deployed. Fill in the form above to deploy one.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {data.promotions.map(promo => (
              <div key={promo.id} style={{ background: '#ffffff', border: `1px solid ${COLORS.border}`, borderRadius: 14, padding: '14px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {promo.image && (
                  <div style={{ width: '100%', height: 110, borderRadius: 8, overflow: 'hidden', border: `1px solid ${COLORS.border}`, background: '#000' }}>
                    <img src={promo.image} alt={promo.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                )}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontSize: 9, background: COLORS.primaryBg, color: COLORS.primary, border: `1px solid ${COLORS.primary}22`, padding: '2px 6px', borderRadius: 4, textTransform: 'uppercase', fontWeight: 700 }}>
                      {promo.type}
                    </span>
                    <span style={{ fontSize: 10, background: promo.status === 'active' ? 'rgba(176, 136, 80,0.1)' : 'rgba(107,114,128,0.1)', color: promo.status === 'active' ? COLORS.primary : COLORS.textMuted, border: `1px solid ${promo.status === 'active' ? COLORS.primary : COLORS.border}33`, padding: '2px 8px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase' }}>
                      {promo.status}
                    </span>
                  </div>
                  <h4 style={{ margin: '4px 0 2px 0', fontSize: 13, fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>{promo.title}</h4>
                  <p style={{ margin: 0, fontSize: 11, color: '#87786c', lineBreak: 'anywhere' }}>{promo.description}</p>
                  {promo.targetId && (
                    <div style={{ marginTop: 6, fontSize: 10, color: COLORS.blue, fontFamily: 'monospace' }}>
                      Target: {promo.targetId}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: 6, marginTop: 'auto' }}>
                  <button onClick={() => handleTogglePromotion(promo.id, promo.status)}
                    style={{ flex: 1, background: 'rgba(43,34,26,0.08)', border: `1px solid ${COLORS.border}`, borderRadius: 6, padding: '6px 0', fontSize: 11, fontWeight: 600, color: promo.status === 'active' ? COLORS.orange : COLORS.primary, cursor: 'pointer' }}>
                    {promo.status === 'active' ? '⏸️ Pause' : '▶️ Resume'}
                  </button>
                  <button onClick={() => handleDeletePromotion(promo.id)}
                    style={{ background: 'rgba(239,68,68,0.1)', border: `1px solid ${COLORS.red}33`, borderRadius: 6, padding: '6px 10px', color: COLORS.red, cursor: 'pointer' }}>
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* ─── SMS/Push Test Queue and Live logs ticker ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: 20, marginBottom: 24 }}>
        
        {/* Test Send Dispatch queue simulator */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif' }}>💬 Operations Test Queue Dispatch</h3>
          <p style={{ fontSize: 11, color: '#87786c', margin: '0 0 16px 0' }}>Manually simulate campaign SMS texts or Mobile push notification dispatches.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => {
                toast.success('Test Push Notification dispatched to queue!');
                setAuditLogs(prev => [
                  { id: String(Date.now()), time: new Date().toLocaleTimeString(), msg: 'Dispatched test push notification: "Spotlight Track 1"', type: 'push' },
                  ...prev
                ]);
              }}
                style={{ flex: 1, background: '#1c1c1c', border: `1px solid ${COLORS.border}`, color: '#221a15', borderRadius: 8, padding: '12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                🔔 Dispatch Test Push
              </button>
              <button onClick={() => {
                toast.success('Test SMS dispatched to queue!');
                setAuditLogs(prev => [
                  { id: String(Date.now()), time: new Date().toLocaleTimeString(), msg: 'Dispatched test SMS broadcast: "Student Promo Drive"', type: 'sms' },
                  ...prev
                ]);
              }}
                style={{ flex: 1, background: '#1c1c1c', border: `1px solid ${COLORS.border}`, color: '#221a15', borderRadius: 8, padding: '12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                💬 Dispatch Test SMS
              </button>
            </div>
            <div style={{ background: '#ffffff', border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: '10px 12px', fontSize: 11 }}>
              <span style={{ color: '#87786c', display: 'block', marginBottom: 4, fontWeight: 600 }}>SIMULATION STATUS</span>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: COLORS.primary, fontWeight: 700 }}>
                <span>DISPATCH SERVICE: ONLINE</span>
                <span>QUEUE: 0 PENDING</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Live logs auditing stream */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}
          style={{ background: COLORS.card, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '20px' }}>
          <h3 style={{ fontSize: 14, fontWeight: 800, margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif' }}>📃 Live Marketing Action Logs</h3>
          <p style={{ fontSize: 11, color: '#87786c', margin: '0 0 12px 0' }}>Real-time rolling event capture of campaign interactions.</p>
          
          <div style={{ background: '#fbf9f5', border: `1px solid ${COLORS.border}`, borderRadius: 12, padding: '10px 12px', height: 110, overflowY: 'auto', fontFamily: 'Courier New, monospace', fontSize: 11 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {auditLogs.map(log => (
                <div key={log.id} style={{ display: 'flex', gap: 8, borderBottom: '1px solid #111', paddingBottom: 2 }}>
                  <span style={{ color: '#87786c' }}>[{log.time}]</span>
                  <span style={{ color: log.type === 'promo' ? COLORS.primary : log.type === 'push' ? COLORS.blue : COLORS.orange }}>
                    {log.msg}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ─── Modals section ─── */}
      <AnimatePresence>
        {showCampaignModal && (
          <CampaignModal onClose={() => setShowCampaignModal(false)} targetedCounts={data.targetedCounts} reload={fetchMarketingData} />
        )}
        {showPromoModal && (
          <PromoModal onClose={() => setShowPromoModal(false)} reload={fetchMarketingData} />
        )}
        
        {/* Stats popup modal */}
        {statsModalCampaign && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              style={{ background: COLORS.cardBg, border: `1px solid ${COLORS.border}`, borderRadius: 16, padding: '24px', maxWidth: 480, width: '90%' }}>
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>
                  📊 Detailed Campaign Metrics Audit
                </h3>
                <button onClick={() => setStatsModalCampaign(null)}
                  style={{ background: 'transparent', border: 'none', color: '#221a15', fontSize: 18, cursor: 'pointer' }}>
                  ✕
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 13, marginBottom: 20 }}>
                <h4 style={{ margin: 0, fontSize: 15, color: COLORS.primary }}>{statsModalCampaign.name}</h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ background: '#ffffff', borderRadius: 8, padding: '10px', border: `1px solid ${COLORS.border}` }}>
                    <span style={{ fontSize: 10, color: '#87786c', display: 'block' }}>ESTIMATED REACH</span>
                    <strong>{statsModalCampaign.reach.toLocaleString()} users</strong>
                  </div>
                  <div style={{ background: '#ffffff', borderRadius: 8, padding: '10px', border: `1px solid ${COLORS.border}` }}>
                    <span style={{ fontSize: 10, color: '#87786c', display: 'block' }}>CAMPAIGN CHANNEL</span>
                    <strong style={{ textTransform: 'uppercase' }}>{statsModalCampaign.type}</strong>
                  </div>
                  <div style={{ background: '#ffffff', borderRadius: 8, padding: '10px', border: `1px solid ${COLORS.border}` }}>
                    <span style={{ fontSize: 10, color: '#87786c', display: 'block' }}>BUDGET SPEND</span>
                    <strong>{data.currency.symbol}{Math.round((statsModalCampaign.spend || statsModalCampaign.budget * 0.8) * data.currency.rate)}</strong>
                  </div>
                  <div style={{ background: '#ffffff', borderRadius: 8, padding: '10px', border: `1px solid ${COLORS.border}` }}>
                    <span style={{ fontSize: 10, color: '#87786c', display: 'block' }}>CTR PERFORMANCE</span>
                    <strong style={{ color: COLORS.orange }}>{statsModalCampaign.clickRate.toFixed(1)}% CTR</strong>
                  </div>
                </div>

                {statsModalCampaign.copy && (
                  <div style={{ background: '#ffffff', borderRadius: 8, padding: '12px', border: `1px solid ${COLORS.border}` }}>
                    <span style={{ fontSize: 10, color: '#87786c', display: 'block', marginBottom: 4 }}>CAMPAIGN MESSAGE COPY</span>
                    <p style={{ margin: 0, fontStyle: 'italic', color: '#ccc', fontSize: 11 }}>"{statsModalCampaign.copy}"</p>
                  </div>
                )}
              </div>

              <button onClick={() => setStatsModalCampaign(null)}
                style={{ background: COLORS.primary, border: 'none', color: '#000', borderRadius: 8, padding: '10px 16px', fontSize: 12, fontWeight: 700, cursor: 'pointer', width: '100%' }}>
                Close Campaign Audit
              </button>
            </motion.div>
          </div>
        )}
        {showCropModal && cropImageSrc && (
          <CropModal
            imageSrc={cropImageSrc}
            onCrop={(cropped) => {
              setPromoImage(cropped);
              setAuditLogs(prev => [
                { id: String(Date.now()), time: new Date().toLocaleTimeString(), msg: 'Banner image cropped successfully to 1200x400', type: 'system' },
                ...prev
              ]);
            }}
            onClose={() => {
              setShowCropModal(false);
              setCropImageSrc('');
            }}
          />
        )}
      </AnimatePresence>

      </>}

    </div>
  );
}

// ─── Modal Subcomponents ───
interface CampaignModalProps {
  onClose: () => void;
  reload: () => void;
  targetedCounts: {
    all: number;
    premium: number;
    free: number;
    artists: number;
  };
}

function CampaignModal({ onClose, reload, targetedCounts }: CampaignModalProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('email');
  const [audience, setAudience] = useState<'all' | 'premium' | 'free' | 'artists'>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [copy, setCopy] = useState('');
  const [isABTesting, setIsABTesting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Campaign name is required'); return; }
    
    try {
      const res = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_campaign',
          campaign: { name, type, audience, startDate, endDate, copy, budget, isABTesting }
        })
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success(`Campaign "${name}" created successfully!`);
        reload();
        onClose();
      }
    } catch {
      toast.error('Failed to save campaign to database.');
    }
  };

  const getEstimate = () => {
    return targetedCounts[audience];
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000bb', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
        style={{ background: '#ffffff', border: '1px solid rgba(43,34,26,0.1)', borderRadius: 18, padding: 32, width: 500, maxWidth: '95vw', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: '#221a15' }}>Create Campaign Record</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: 20, cursor: 'pointer', lineHeight: 1 }}>✕</button>
        </div>
        
        {/* Real-time Audience estimator banner */}
        <div style={{ background: 'rgba(176, 136, 80, 0.1)', border: `1px solid ${COLORS.primary}33`, borderRadius: 8, padding: '10px 12px', marginBottom: 16 }}>
          <span style={{ fontSize: 10, color: COLORS.primary, fontWeight: 700, display: 'block' }}>🎯 REAL-TIME AUDIENCE ESTIMATE</span>
          <strong style={{ fontSize: 14, color: '#221a15' }}>Targeting {getEstimate().toLocaleString()} users matching segment criteria.</strong>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={labelStyle}>Campaign Name</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Summer Promo 2026" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Type</label>
              <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
                <option value="email">Email Campaign</option>
                <option value="push">Push Notification</option>
                <option value="banner">Banner Overlay</option>
                <option value="sms">SMS Broadcaster</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Target Segment</label>
              <select value={audience} onChange={e => setAudience(e.target.value as any)} style={inputStyle}>
                <option value="all">All Users ({targetedCounts.all})</option>
                <option value="premium">Premium Tiers ({targetedCounts.premium})</option>
                <option value="free">Free Tiers ({targetedCounts.free})</option>
                <option value="artists">Artists ({targetedCounts.artists})</option>
              </select>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Campaign Budget ($)</label>
              <input type="number" placeholder="1000" value={budget} onChange={e => setBudget(e.target.value)} style={inputStyle} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 18 }}>
              <input type="checkbox" id="abTest" checked={isABTesting} onChange={e => setIsABTesting(e.target.checked)} style={{ accentColor: COLORS.primary }} />
              <label htmlFor="abTest" style={{ fontSize: 12, color: '#ccc', cursor: 'pointer', fontWeight: 600 }}>Enable A/B split copy testing</label>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Start Date</label>
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>End Date</label>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={inputStyle} />
            </div>
          </div>
          <div>
            <label style={labelStyle}>Message Copy</label>
            <textarea value={copy} onChange={e => setCopy(e.target.value)} rows={3} placeholder={isABTesting ? "Version A: Hello music lovers... | Version B: Get 30% off today..." : "Enter campaign text copy here..."}
              style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ background: '#f4eede', border: '1px solid rgba(43,34,26,0.12)', color: '#888', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ background: COLORS.primary, border: 'none', color: '#000', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Create Campaign</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

interface PromoModalProps {
  onClose: () => void;
  reload: () => void;
}

function PromoModal({ onClose, reload }: PromoModalProps) {
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState('');
  const [type, setType] = useState('percent');
  const [limit, setLimit] = useState('');
  const [expiry, setExpiry] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) { toast.error('Promo code is required'); return; }
    if (!discount) { toast.error('Discount value is required'); return; }

    try {
      const res = await fetch('/api/admin/marketing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_promo',
          promo: { code, discount, type, limit, expiry }
        })
      });
      const resData = await res.json();
      if (resData.success) {
        toast.success(`Promo code "${code.toUpperCase()}" created successfully!`);
        reload();
        onClose();
      }
    } catch {
      toast.error('Failed saving coupon setting to database.');
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: '#000000bb', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <motion.div initial={{ scale: 0.93, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 20 }}
        style={{ background: '#ffffff', border: '1px solid rgba(43,34,26,0.1)', borderRadius: 18, padding: 32, width: 420, maxWidth: '95vw' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <div style={{ fontSize: 18, fontWeight: 700, fontFamily: 'Outfit, sans-serif', color: '#221a15' }}>Create Promo Code Coupon</div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#666', fontSize: 20, cursor: 'pointer' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={labelStyle}>Coupon Promo Code</label>
            <input value={code} onChange={e => setCode(e.target.value.toUpperCase())} placeholder="e.g. SUMMER30" style={inputStyle} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={labelStyle}>Discount Amount</label>
              <input type="number" value={discount} onChange={e => setDiscount(e.target.value)} placeholder="30" style={inputStyle} />
            </div>
            <div>
              <label style={labelStyle}>Discount Type</label>
              <select value={type} onChange={e => setType(e.target.value)} style={inputStyle}>
                <option value="percent">Percentage (%)</option>
                <option value="fixed">Fixed Cash Amount ($)</option>
              </select>
            </div>
          </div>
          <div>
            <label style={labelStyle}>Usage Allocation Limit (0 = unlimited)</label>
            <input type="number" value={limit} onChange={e => setLimit(e.target.value)} placeholder="1000" style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Expiry Date</label>
            <input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} style={inputStyle} />
          </div>
          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 4 }}>
            <button type="button" onClick={onClose} style={{ background: '#f4eede', border: '1px solid rgba(43,34,26,0.12)', color: '#888', borderRadius: 10, padding: '10px 20px', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
            <button type="submit" style={{ background: COLORS.primary, border: 'none', color: '#000', borderRadius: 10, padding: '10px 24px', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Create Code</button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  width: '100%', background: '#f4eede', border: '1px solid rgba(43,34,26,0.1)', borderRadius: 8,
  color: '#221a15', padding: '10px 12px', fontSize: 13, fontFamily: 'Inter, sans-serif',
  outline: 'none', boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 600, color: '#888',
  marginBottom: 6, fontFamily: 'Inter, sans-serif',
};

// ─── Visual Cover Cropper Subcomponent ───
interface CropModalProps {
  imageSrc: string;
  onCrop: (croppedBase64: string) => void;
  onClose: () => void;
}

function CropModal({ imageSrc, onCrop, onClose }: CropModalProps) {
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const w = canvas.width;
      const h = canvas.height;

      const imgRatio = img.width / img.height;
      const canvasRatio = w / h;
      let drawWidth = w;
      let drawHeight = h;

      if (imgRatio > canvasRatio) {
        drawWidth = h * imgRatio;
      } else {
        drawHeight = w / imgRatio;
      }

      drawWidth *= zoom;
      drawHeight *= zoom;

      const x = (w - drawWidth) / 2 + position.x;
      const y = (h - drawHeight) / 2 + position.y;

      ctx.drawImage(img, x, y, drawWidth, drawHeight);

      // Visual border guide
      ctx.strokeStyle = '#b08850';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(1, 1, w - 2, h - 2);
    };
  }, [imageSrc, zoom, position]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - position.x, y: e.clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleConfirm = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1200;
    canvas.height = 400;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const w = canvas.width;
      const h = canvas.height;

      const imgRatio = img.width / img.height;
      const canvasRatio = w / h;
      let drawWidth = w;
      let drawHeight = h;

      if (imgRatio > canvasRatio) {
        drawWidth = h * imgRatio;
      } else {
        drawHeight = w / imgRatio;
      }

      drawWidth *= zoom;
      drawHeight *= zoom;

      // Translate offsets from 600x200 canvas display size to 1200x400 output size
      const x = (w - drawWidth) / 2 + position.x * 2;
      const y = (h - drawHeight) / 2 + position.y * 2;

      ctx.drawImage(img, x, y, drawWidth, drawHeight);
      onCrop(canvas.toDataURL('image/jpeg', 0.85));
      onClose();
    };
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif' }}>
      <div style={{ background: '#ffffff', border: '1px solid rgba(43,34,26,0.1)', borderRadius: 16, padding: 24, width: 640, maxWidth: '95vw', boxSizing: 'border-box' }}>
        <h3 style={{ margin: '0 0 4px 0', fontFamily: 'Outfit, sans-serif', color: '#221a15', fontSize: 16 }}>📐 Crop & Align Banner Image</h3>
        <p style={{ margin: '0 0 16px 0', fontSize: 11, color: '#666' }}>Drag image to align. Outputs exactly 1200x400 pixels for optimal wide visual banner displays.</p>

        <div style={{ display: 'flex', justifyContent: 'center', background: '#000', padding: 8, borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(43,34,26,0.07)' }}>
          <canvas
            ref={canvasRef}
            width={600}
            height={200}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ cursor: 'move', background: '#ffffff', maxWidth: '100%', borderRadius: 8 }}
          />
        </div>

        <div style={{ marginTop: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 11, color: '#666', fontWeight: 600 }}>ZOOM</span>
            <input
              type="range"
              min={1}
              max={3}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(parseFloat(e.target.value))}
              style={{ flex: 1, accentColor: '#b08850' }}
            />
            <span style={{ fontSize: 11, color: '#b08850', fontWeight: 700 }}>{Math.round(zoom * 100)}%</span>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
            <button onClick={onClose}
              style={{ background: '#f4eede', border: '1px solid rgba(43,34,26,0.1)', color: '#ccc', borderRadius: 8, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>
              Cancel
            </button>
            <button onClick={handleConfirm}
              style={{ background: '#b08850', border: 'none', color: '#000', borderRadius: 8, padding: '8px 24px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
              Confirm Crop (1200x400)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
