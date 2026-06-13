'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import {
  HOMEPAGE_PRESETS, PRESET_CATEGORIES, getPresetById,
  HomepagePreset, SectionConfig
} from '@/lib/homepagePresets';
import { useMusicStore } from '@/store/musicStore';
import { useAuthStore } from '@/store/authStore';
import { usePlaylistStore } from '@/store/playlistStore';
import { usePlayerStore } from '@/store/playerStore';
import { mockTracks, mockArtists } from '@/lib/mockData';
import { Play, Pause, Heart, Sparkles, Plus, Check, Bell, Star } from 'lucide-react';
import {
  SECTION_BLOCKS, BLOCK_CATEGORIES, BlockDef
} from '@/lib/sectionLibrary';
import { EXTENDED_LAYOUT_OPTIONS } from '@/lib/layoutOptions';

// ─── Colors and Styling constants ─────────────────────────────────────────────
const C = {
  primary: '#1db954',
  primaryDim: 'rgba(29, 185, 84, 0.15)',
  bg: '#0a0a0a',
  surface: '#121212',
  card: '#1e1e1e',
  border: '#262626',
  text: '#ffffff',
  muted: '#737373',
  blue: '#10b981',
  purple: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
  pink: '#34d399',
};

const cardSt = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: C.surface,
  border: `1px solid ${C.border}`,
  borderRadius: 14,
  padding: '16px',
  boxSizing: 'border-box',
  ...extra
});

const inputSt: React.CSSProperties = {
  background: '#0c0c0c',
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  color: C.text,
  fontSize: 12,
  padding: '8px 12px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
};

const btnSt = (variant: 'primary' | 'secondary' | 'danger' | 'outline', extra?: React.CSSProperties): React.CSSProperties => ({
  border: 'none',
  borderRadius: 8,
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 12,
  padding: '8px 16px',
  transition: 'all 0.2s',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  ...(variant === 'primary' ? { background: C.primary, color: '#000' }
    : variant === 'secondary' ? { background: '#262626', color: C.text, border: `1px solid ${C.border}` }
    : variant === 'danger' ? { background: 'rgba(239, 68, 68, 0.15)', color: C.red, border: `1px solid rgba(239, 68, 68, 0.25)` }
    : { background: 'transparent', color: C.muted, border: `1px solid ${C.border}` }),
  ...extra
});

type BuilderPanel = 'templates' | 'builder' | 'settings' | 'library';

interface BuilderSection extends SectionConfig {
  hidden?: boolean;
  songIds?: string[];
}

export default function MobileHomepageBuilderTab() {
  const { user } = useAuthStore();
  const { getAllTracks, getForYouTracks, recentlyPlayed } = useMusicStore();
  const { customPlaylists } = usePlaylistStore();
  const { currentTrack, isPlaying } = usePlayerStore();
  const [scrollTop, setScrollTop] = useState(0);

  const allTracks = getAllTracks ? getAllTracks() : mockTracks;
  const forYouTracks = getForYouTracks ? getForYouTracks() : mockTracks.slice(4, 10);
  const likedSongIds = user?.likedSongs ?? [];
  const likedTracks = allTracks.filter(t => likedSongIds.includes(t.id));
  const recentTracks = recentlyPlayed && recentlyPlayed.length > 0 ? recentlyPlayed.slice(0, 6) : allTracks.slice(0, 6);

  // ─── Component State ────────────────────────────────────────────────────────
  const [activePanel, setActivePanel] = useState<BuilderPanel>('builder');
  const [builderSections, setBuilderSections] = useState<BuilderSection[]>([]);
  const [selectedSection, setSelectedSection] = useState<BuilderSection | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<HomepagePreset | null>(null);
  
  // Library Search
  const [blockSearch, setBlockSearch] = useState('');
  const [activeBlockCategory, setActiveBlockCategory] = useState('All');
  
  // Presets Search
  const [presetSearch, setPresetSearch] = useState('');
  const [activePresetCategory, setActivePresetCategory] = useState('All');

  // Drag-and-drop index tracks
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  // Template Modals
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [saveTemplateModal, setSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');

  // ─── Settings Editor Temporary States ───────────────────────────────────────
  const [settTitle, setSettTitle] = useState('');
  const [settSubtitle, setSettSubtitle] = useState('');
  const [settLayout, setSettLayout] = useState<SectionConfig['layout']>('grid');
  const [settBgType, setSettBgType] = useState<SectionConfig['background']['type']>('none');
  const [settBgValue, setSettBgValue] = useState('');
  const [settAnimation, setSettAnimation] = useState<SectionConfig['animation']>('fade');
  const [settBorder, setSettBorder] = useState<SectionConfig['borderStyle']>('none');
  const [settBorderColor, setSettBorderColor] = useState('#1db954');
  const [settAudience, setSettAudience] = useState<'all' | 'premium' | 'free'>('all');
  const [settPadding, setSettPadding] = useState<SectionConfig['padding']>('md');
  const [settCardSize, setSettCardSize] = useState<SectionConfig['cardSize']>('md');
  const [settCardStyle, setSettCardStyle] = useState<SectionConfig['cardStyle']>('classic');
  const [settCardShape, setSettCardShape] = useState<SectionConfig['cardShape']>('default');
  const [settCardWidth, setSettCardWidth] = useState<number | ''>('');
  const [settCardHeight, setSettCardHeight] = useState<number | ''>('');
  const [settCustomImage, setSettCustomImage] = useState('');
  const [settCustomVideo, setSettCustomVideo] = useState('');
  const [settMediaType, setSettMediaType] = useState<'image' | 'video'>('image');
  const [settSponsorName, setSettSponsorName] = useState('');
  const [settButtonText, setSettButtonText] = useState('');
  const [settTargetUrl, setSettTargetUrl] = useState('');
  const [settHashtags, setSettHashtags] = useState('');
  const [settGenresList, setSettGenresList] = useState('');
  
  // Custom Song Selector State inside settings
  const [settSongIds, setSettSongIds] = useState<string[]>([]);
  const [songSearchQuery, setSongSearchQuery] = useState('');
  const [showSongPicker, setShowSongPicker] = useState(false);

  // Live phone time updater
  const [phoneTime, setPhoneTime] = useState('12:00 PM');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      let hours = now.getHours();
      const minutes = now.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // 0 should be 12
      const minStr = minutes < 10 ? '0' + minutes : minutes;
      setPhoneTime(`${hours}:${minStr} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // ─── Fetch Current Config from Backend ──────────────────────────────────────
  const fetchLayout = useCallback(() => {
    fetch('/api/admin/homepage-builder')
      .then(r => r.json())
      .then(d => {
        if (d.savedTemplates) setSavedTemplates(d.savedTemplates);

        const DEFAULT_LAYOUT_ORDER = [
          "quick_access", "liked_songs", "promotions_hero", "made_for_you", 
          "featured_artist", "new_music", "trending_now", "your_taste", 
          "recently_played", "mood_playlists", "daily_mixes"
        ];
        
        const defaultNames: Record<string, string> = {
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

        const layoutOrder = (d.homeLayoutOrder && d.homeLayoutOrder.length > 0) ? d.homeLayoutOrder : DEFAULT_LAYOUT_ORDER;
        const customSections = d.customSections || {};

        const initialSections = layoutOrder.map((id: string) => {
          return customSections[id] || {
            id,
            title: defaultNames[id] || id,
            type: id.includes('quick_access') ? 'quick_access' : 'custom_songs',
            layout: 'grid',
            background: { type: 'none', value: '' },
            animation: 'fade',
            borderStyle: 'none',
            padding: 'md',
            visible: true,
            audience: 'all',
            hidden: false,
            songIds: []
          };
        });

        setBuilderSections(initialSections);
        if (d.activePreset) {
          const preset = HOMEPAGE_PRESETS.find(p => p.id === d.activePreset);
          if (preset) setSelectedPreset(preset);
        }
      })
      .catch(() => toast.error('Error fetching homepage layout'));
  }, []);

  useEffect(() => {
    fetchLayout();
  }, [fetchLayout]);

  // ─── Save / Publish Layout to DB ────────────────────────────────────────────
  const publishLayout = async () => {
    if (builderSections.length === 0) {
      toast.error('Add at least one section!');
      return;
    }
    setIsPublishing(true);
    try {
      const customSections: Record<string, any> = {};
      const homeLayoutOrder: string[] = [];

      builderSections.filter(s => !s.hidden).forEach(sec => {
        homeLayoutOrder.push(sec.id);
        const isQuickType = sec.type === 'quick_access' || sec.type === 'quick' || sec.id.includes('quick_access');

        customSections[sec.id] = {
          ...sec,
          type: isQuickType ? sec.type
            : sec.contentSource === 'trending' ? 'custom_songs'
            : sec.contentSource === 'new_releases' ? 'custom_songs'
            : sec.contentSource === 'playlist' ? 'playlist'
            : sec.contentSource === 'album' ? 'album'
            : 'custom_songs',
          bgStyle: sec.background.type !== 'none' ? sec.background.type : 'default',
          borderStyle: sec.borderStyle !== 'none' ? sec.borderStyle : 'none',
        };
      });

      const res = await fetch('/api/admin/homepage-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'publish',
          homeLayoutOrder,
          customSections,
          presetId: selectedPreset?.id,
          theme: selectedPreset?.theme,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsDirty(false);
        toast.success('🚀 Mobile homepage published successfully!');
      } else {
        toast.error('Publish failed');
      }
    } catch {
      toast.error('Publish error');
    } finally {
      setIsPublishing(false);
    }
  };

  // ─── Select Section for Editing ────────────────────────────────────────────
  const selectSectionForEdit = (sec: BuilderSection) => {
    setSelectedSection(sec);
    setSettTitle(sec.title);
    setSettSubtitle(sec.subtitle || '');
    setSettLayout(sec.layout);
    setSettBgType(sec.background.type);
    setSettBgValue(sec.background.value);
    setSettAnimation(sec.animation);
    setSettBorder(sec.borderStyle);
    setSettBorderColor(sec.borderColor || '#1db954');
    setSettAudience(sec.audience || 'all');
    setSettPadding(sec.padding);
    setSettCardSize(sec.cardSize || 'md');
    setSettCardStyle(sec.cardStyle || 'classic');
    setSettCardShape(sec.cardShape || 'default');
    setSettCardWidth(sec.cardWidth || '');
    setSettCardHeight(sec.cardHeight || '');
    setSettCustomImage(sec.customImage || '');
    setSettCustomVideo(sec.customVideo || '');
    setSettMediaType(sec.mediaType || 'image');
    setSettSponsorName(sec.sponsorName || '');
    setSettButtonText(sec.buttonText || '');
    setSettTargetUrl(sec.targetUrl || '');
    setSettHashtags(sec.hashtags || '');
    setSettGenresList(sec.genresList || '');
    setSettSongIds(sec.songIds || []);
    setActivePanel('settings');
  };

  // ─── Apply Edited Settings ──────────────────────────────────────────────────
  const applySectionSettings = () => {
    if (!selectedSection) return;
    setBuilderSections(prev => prev.map(s =>
      s.id === selectedSection.id ? {
        ...s,
        title: settTitle,
        subtitle: settSubtitle,
        layout: settLayout,
        background: { type: settBgType, value: settBgValue },
        animation: settAnimation,
        borderStyle: settBorder,
        borderColor: settBorderColor,
        audience: settAudience,
        padding: settPadding,
        cardSize: settCardSize,
        cardStyle: settCardStyle,
        cardShape: settCardShape,
        cardWidth: settCardWidth === '' ? undefined : Number(settCardWidth),
        cardHeight: settCardHeight === '' ? undefined : Number(settCardHeight),
        customImage: settCustomImage,
        customVideo: settCustomVideo,
        mediaType: settMediaType,
        sponsorName: settSponsorName,
        buttonText: settButtonText,
        targetUrl: settTargetUrl,
        hashtags: settHashtags,
        genresList: settGenresList,
        songIds: settSongIds
      } : s
    ));
    setIsDirty(true);
    toast.success('Settings applied locally. Hit Publish to save!');
  };

  // ─── Add Block from Library ───────────────────────────────────────────────
  const addBlockFromLibrary = (block: BlockDef) => {
    const newSec: BuilderSection = {
      id: `sec_${block.id}_${Date.now()}`,
      type: block.id,
      title: block.label,
      layout: block.defaultLayout,
      contentSource: block.defaultSource,
      background: { type: 'none', value: '' },
      animation: 'fade',
      borderStyle: 'none',
      padding: 'md',
      visible: true,
      audience: 'all',
      hidden: false,
      songIds: []
    };
    setBuilderSections(prev => [...prev, newSec]);
    setIsDirty(true);
    toast.success(`"${block.label}" added to preview`);
  };

  // ─── Apply Template Preset ─────────────────────────────────────────────────
  const applyPresetLayout = (preset: HomepagePreset) => {
    setSelectedPreset(preset);
    setBuilderSections(preset.sections.map(s => ({ ...s, hidden: false, songIds: [] })));
    setSelectedSection(null);
    setIsDirty(true);
    setActivePanel('builder');
    toast.success(`Template preset "${preset.name}" loaded`);
  };

  // ─── Drag and Drop Operations ───────────────────────────────────────────────
  const handleDragStart = (idx: number) => setDraggedIdx(idx);
  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    setDragOverIdx(idx);
  };
  const handleDrop = (idx: number) => {
    if (draggedIdx === null || draggedIdx === idx) return;
    const items = [...builderSections];
    const draggedItem = items[draggedIdx];
    items.splice(draggedIdx, 1);
    items.splice(idx, 0, draggedItem);
    setBuilderSections(items);
    setDraggedIdx(null);
    setDragOverIdx(null);
    setIsDirty(true);
    toast.success('Sections reordered');
  };

  const moveSection = (idx: number, direction: 'up' | 'down') => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1;
    if (targetIdx < 0 || targetIdx >= builderSections.length) return;
    const items = [...builderSections];
    const temp = items[idx];
    items[idx] = items[targetIdx];
    items[targetIdx] = temp;
    setBuilderSections(items);
    setIsDirty(true);
  };

  // ─── Template Save / Load ──────────────────────────────────────────────────
  const saveAsTemplate = async () => {
    if (!templateName.trim()) {
      toast.error('Enter template name');
      return;
    }
    const homeLayoutOrder = builderSections.map(s => s.id);
    const customSections: Record<string, any> = {};
    builderSections.forEach(s => {
      customSections[s.id] = {
        ...s,
        bgStyle: s.background.type !== 'none' ? s.background.type : 'default',
        borderStyle: s.borderStyle !== 'none' ? s.borderStyle : 'none',
      };
    });
    try {
      const res = await fetch('/api/admin/homepage-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save_template',
          name: templateName,
          homeLayoutOrder,
          customSections,
          presetId: selectedPreset?.id,
          theme: selectedPreset?.theme
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedTemplates(prev => [data.template, ...prev.filter(t => t.id !== data.template.id)]);
        setSaveTemplateModal(false);
        setTemplateName('');
        toast.success('Template saved successfully!');
      }
    } catch {
      toast.error('Error saving template');
    }
  };

  // ─── Export / Import Layout ────────────────────────────────────────────────
  const exportJson = () => {
    const layout = {
      homeLayoutOrder: builderSections.map(s => s.id),
      customSections: Object.fromEntries(builderSections.map(s => [s.id, {
        ...s,
        bgStyle: s.background.type !== 'none' ? s.background.type : 'default',
        borderStyle: s.borderStyle !== 'none' ? s.borderStyle : 'none',
      }])),
      activePreset: selectedPreset?.id,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'beato-mobile-layout.json';
    a.click();
    toast.success('Mobile layout JSON exported');
  };

  const importLayout = async () => {
    try {
      const layout = JSON.parse(importJson);
      if (!layout || !layout.homeLayoutOrder) {
        toast.error('Invalid layout JSON structure');
        return;
      }
      const customSections = layout.customSections || {};
      const importedSections = layout.homeLayoutOrder.map((id: string) => customSections[id] || { id, title: 'Imported Section' });
      setBuilderSections(importedSections);
      setImportModalOpen(false);
      setImportJson('');
      setIsDirty(true);
      toast.success('JSON layout imported successfully!');
    } catch {
      toast.error('Invalid JSON content');
    }
  };

  // ─── Helper Filters ────────────────────────────────────────────────────────
  const filteredBlocks = SECTION_BLOCKS.filter(b => {
    const matchCat = activeBlockCategory === 'All' || b.category === activeBlockCategory;
    const matchSearch = !blockSearch || b.label.toLowerCase().includes(blockSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredPresets = HOMEPAGE_PRESETS.filter(p => {
    const matchCat = activePresetCategory === 'All' || p.category === activePresetCategory;
    const matchSearch = !presetSearch || p.name.toLowerCase().includes(presetSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredMockTracks = mockTracks.filter(t =>
    t.title.toLowerCase().includes(songSearchQuery.toLowerCase()) ||
    t.artistName.toLowerCase().includes(songSearchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 410px', gap: '24px', position: 'relative', minHeight: 'calc(100vh - 120px)' }}>

      {/* ─── Left Panel: Controls and Editors ─── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* Action Header bar */}
        <div style={cardSt({ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' })}>
          <div>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, fontFamily: 'Outfit, sans-serif' }}>📲 Mobile Homepage Studio</h3>
            <p style={{ margin: '4px 0 0', fontSize: 11, color: C.muted }}>Design custom mobile layouts. Real-time changes display on the Pixel 7 emulator.</p>
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <button onClick={() => setImportModalOpen(true)} style={btnSt('secondary', { fontSize: 11, padding: '6px 12px' })}>📥 Import</button>
            <button onClick={exportJson} style={btnSt('secondary', { fontSize: 11, padding: '6px 12px' })}>📤 Export</button>
            <button onClick={() => setSaveTemplateModal(true)} style={btnSt('secondary', { fontSize: 11, padding: '6px 12px' })}>💾 Save Template</button>
            <button
              onClick={publishLayout}
              disabled={isPublishing}
              style={btnSt('primary', { fontSize: 11, padding: '6px 18px', background: C.primary, opacity: isPublishing ? 0.6 : 1 })}
            >
              {isPublishing ? '⏳ Saving...' : '🚀 Publish Mobile layout'}
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, gap: 4 }}>
          {[
            { id: 'builder', label: '🏗️ Visual Builder', desc: 'Reorder active blocks' },
            { id: 'library', label: '📦 Section Library', desc: 'Add new sections' },
            { id: 'templates', label: '🎨 Templates', desc: 'Prebuilt presets' },
            { id: 'settings', label: '⚙️ Section Editor', desc: 'Style and values', disabled: !selectedSection },
          ].map(tab => (
            <button
              key={tab.id}
              disabled={tab.disabled}
              onClick={() => setActivePanel(tab.id as BuilderPanel)}
              style={{
                background: activePanel === tab.id ? 'rgba(29, 185, 84, 0.1)' : 'transparent',
                border: 'none',
                borderBottom: activePanel === tab.id ? `2px solid ${C.primary}` : '2px solid transparent',
                color: activePanel === tab.id ? C.primary : tab.disabled ? '#444' : C.muted,
                padding: '10px 16px',
                cursor: tab.disabled ? 'not-allowed' : 'pointer',
                fontSize: 12,
                fontWeight: 700,
                textAlign: 'left',
                transition: 'all 0.2s',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <span>{tab.label}</span>
              <span style={{ fontSize: 9, fontWeight: 400, opacity: 0.6 }}>{tab.desc}</span>
            </button>
          ))}
        </div>

        {/* Main tabs panels */}
        <div style={{ flex: 1 }}>
          <AnimatePresence mode="wait">

            {/* Panel 1: VISUAL BUILDER */}
            {activePanel === 'builder' && (
              <motion.div key="builder" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 12, color: C.muted, marginBottom: 4 }}>Drag cards or use buttons to sort layout order. Click edit icon (✎) to edit styles/content.</div>
                
                {builderSections.length === 0 ? (
                  <div style={cardSt({ textAlign: 'center', padding: '40px' })}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>📱</div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.muted }}>No sections added to the homepage.</div>
                    <p style={{ fontSize: 11, color: '#666', margin: '4px 0 16px' }}>Add sections from the library or load a template preset.</p>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                      <button onClick={() => setActivePanel('library')} style={btnSt('primary', { fontSize: 11 })}>Browse Library</button>
                      <button onClick={() => setActivePanel('templates')} style={btnSt('secondary', { fontSize: 11 })}>Load Preset</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {builderSections.map((sec, idx) => (
                      <div
                        key={sec.id}
                        draggable
                        onDragStart={() => handleDragStart(idx)}
                        onDragOver={(e) => handleDragOver(e, idx)}
                        onDrop={() => handleDrop(idx)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 12,
                          background: selectedSection?.id === sec.id ? 'rgba(29, 185, 84,0.05)' : C.surface,
                          border: `1px solid ${selectedSection?.id === sec.id ? C.primary : dragOverIdx === idx ? '#444' : C.border}`,
                          borderRadius: 10,
                          padding: '12px 16px',
                          cursor: 'grab',
                          opacity: sec.hidden ? 0.4 : 1,
                          transition: 'all 0.15s'
                        }}
                      >
                        <div style={{ color: C.muted, fontSize: 14, cursor: 'move' }}>☰</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{sec.title}</span>
                            <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.06)', padding: '1px 5px', borderRadius: 4, color: C.muted }}>{sec.layout}</span>
                            {sec.hidden && <span style={{ fontSize: 9, background: '#ef444420', color: C.red, padding: '1px 4px', borderRadius: 4 }}>Hidden</span>}
                          </div>
                          <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>Type: {sec.type || 'Custom'} • BG: {sec.background.type}</div>
                        </div>

                        {/* Controls */}
                        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                          <button onClick={() => moveSection(idx, 'up')} disabled={idx === 0} style={{ background: 'transparent', border: 'none', color: idx === 0 ? '#333' : '#999', cursor: 'pointer', fontSize: 12 }}>▲</button>
                          <button onClick={() => moveSection(idx, 'down')} disabled={idx === builderSections.length - 1} style={{ background: 'transparent', border: 'none', color: idx === builderSections.length - 1 ? '#333' : '#999', cursor: 'pointer', fontSize: 12 }}>▼</button>
                          <button onClick={() => selectSectionForEdit(sec)} style={{ background: 'transparent', border: 'none', color: C.blue, cursor: 'pointer', padding: 4, fontSize: 13 }} title="Edit styling">✎</button>
                          <button onClick={() => {
                            setBuilderSections(prev => prev.map(s => s.id === sec.id ? { ...s, hidden: !s.hidden } : s));
                            setIsDirty(true);
                          }} style={{ background: 'transparent', border: 'none', color: C.orange, cursor: 'pointer', padding: 4, fontSize: 13 }} title="Toggle Hidden">
                            {sec.hidden ? '👁️' : '🙈'}
                          </button>
                          <button onClick={() => {
                            if (confirm('Delete this section?')) {
                              setBuilderSections(prev => prev.filter(s => s.id !== sec.id));
                              if (selectedSection?.id === sec.id) setSelectedSection(null);
                              setIsDirty(true);
                              toast.success('Section deleted');
                            }
                          }} style={{ background: 'transparent', border: 'none', color: C.red, cursor: 'pointer', padding: 4, fontSize: 13 }} title="Delete">🗑</button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Panel 2: SECTION LIBRARY */}
            {activePanel === 'library' && (
              <motion.div key="library" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={cardSt()}>
                <div style={{ display: 'flex', gap: 12, marginBottom: 12, alignItems: 'center' }}>
                  <input placeholder="🔍 Search library blocks..." value={blockSearch} onChange={e => setBlockSearch(e.target.value)} style={{ ...inputSt, flex: 1 }} />
                  <div style={{ display: 'flex', gap: 4 }}>
                    {['All', 'Hero', 'Discovery', 'Personal', 'Marketing'].map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveBlockCategory(cat)}
                        style={{
                          background: activeBlockCategory === cat ? C.primary : 'transparent',
                          color: activeBlockCategory === cat ? '#000' : C.muted,
                          border: `1px solid ${activeBlockCategory === cat ? C.primary : C.border}`,
                          fontSize: 9,
                          borderRadius: 12,
                          padding: '2px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, maxHeight: 480, overflowY: 'auto', paddingRight: 6 }}>
                  {filteredBlocks.map(block => (
                    <div
                      key={block.id}
                      onClick={() => addBlockFromLibrary(block)}
                      style={{
                        padding: '12px',
                        background: '#0d0d0d',
                        border: `1px solid ${C.border}`,
                        borderRadius: 10,
                        cursor: 'pointer',
                        display: 'flex',
                        gap: 10,
                        alignItems: 'flex-start',
                        transition: 'all 0.15s'
                      }}
                      onMouseEnter={e => (e.currentTarget.style.borderColor = C.primary)}
                      onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
                    >
                      <span style={{ fontSize: 20 }}>{block.icon}</span>
                      <div>
                        <div style={{ fontSize: 11, fontWeight: 700, color: C.text }}>{block.label}</div>
                        <div style={{ fontSize: 9, color: C.muted, marginTop: 4, lineHeight: 1.3 }}>{block.description}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Panel 3: TEMPLATE PRESETS */}
            {activePanel === 'templates' && (
              <motion.div key="templates" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <input placeholder="🔍 Search presets..." value={presetSearch} onChange={e => setPresetSearch(e.target.value)} style={{ ...inputSt, flex: 1 }} />
                  <div style={{ display: 'flex', gap: 4 }}>
                    {PRESET_CATEGORIES.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActivePresetCategory(cat)}
                        style={{
                          background: activePresetCategory === cat ? C.primary : 'transparent',
                          color: activePresetCategory === cat ? '#000' : C.muted,
                          border: `1px solid ${activePresetCategory === cat ? C.primary : C.border}`,
                          fontSize: 9,
                          borderRadius: 12,
                          padding: '3px 8px',
                          cursor: 'pointer'
                        }}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                  {filteredPresets.map(preset => (
                    <div
                      key={preset.id}
                      style={{
                        ...cardSt({ padding: 0, overflow: 'hidden' }),
                        border: selectedPreset?.id === preset.id ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
                        display: 'flex',
                        flexDirection: 'column'
                      }}
                    >
                      <div style={{ height: 90, background: preset.thumbnail, position: 'relative', display: 'flex', gap: 4, padding: 8, alignItems: 'flex-start', justifyContent: 'flex-end' }}>
                        {preset.tags.slice(0, 2).map(t => (
                          <span key={t} style={{ fontSize: 8, background: 'rgba(0,0,0,0.6)', padding: '2px 5px', borderRadius: 4, color: '#fff' }}>{t}</span>
                        ))}
                      </div>
                      <div style={{ padding: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{preset.name}</div>
                        <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{preset.description}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
                          <span style={{ fontSize: 10, color: C.muted }}>{preset.sections.length} shelves</span>
                          <button onClick={() => applyPresetLayout(preset)} style={btnSt('primary', { padding: '4px 10px', fontSize: 10 })}>Apply Preset</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Saved Templates */}
                {savedTemplates.length > 0 && (
                  <div style={{ marginTop: 16 }}>
                    <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 800 }}>💾 Saved Custom Templates</h4>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
                      {savedTemplates.map((tpl: any) => (
                        <div key={tpl.id} style={cardSt({ padding: 12, display: 'flex', flexDirection: 'column', gap: 6 })}>
                          <div style={{ fontSize: 11, fontWeight: 700 }}>{tpl.name}</div>
                          <div style={{ fontSize: 9, color: C.muted }}>{tpl.homeLayoutOrder?.length || 0} shelves • {new Date(tpl.createdAt).toLocaleDateString()}</div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 4 }}>
                            <button
                              onClick={() => {
                                if (tpl.homeLayoutOrder && tpl.customSections) {
                                  setBuilderSections(tpl.homeLayoutOrder.map((id: string) => tpl.customSections[id] || { id, title: 'Shelf' }));
                                  setIsDirty(true);
                                  toast.success('Custom template loaded');
                                }
                              }}
                              style={btnSt('secondary', { padding: '3px 8px', fontSize: 9, flex: 1 })}
                            >
                              Load
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm('Delete this template?')) {
                                  await fetch('/api/admin/homepage-builder', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ action: 'delete_template', templateId: tpl.id }),
                                  });
                                  setSavedTemplates(prev => prev.filter((t: any) => t.id !== tpl.id));
                                  toast.success('Template deleted');
                                }
                              }}
                              style={btnSt('danger', { padding: '3px 8px', fontSize: 9 })}
                            >
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Panel 4: SECTION EDITOR */}
            {activePanel === 'settings' && selectedSection && (
              <motion.div key="settings" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.primary }}>⚙️ Editing: {selectedSection.title}</div>
                  <button onClick={applySectionSettings} style={btnSt('primary', { padding: '6px 14px', fontSize: 11 })}>Apply changes</button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

                  {/* Left settings column */}
                  <div style={cardSt({ display: 'flex', flexDirection: 'column', gap: 10 })}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>Content configuration</div>
                    
                    <div>
                      <label style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 4 }}>Shelf Title</label>
                      <input value={settTitle} onChange={e => setSettTitle(e.target.value)} style={inputSt} />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 4 }}>Subtitle (Optional)</label>
                      <input value={settSubtitle} onChange={e => setSettSubtitle(e.target.value)} placeholder="e.g. Based on your recent activity" style={inputSt} />
                    </div>

                    <div>
                      <label style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 4 }}>Shelf Layout Template</label>
                      <select value={settLayout} onChange={e => setSettLayout(e.target.value as any)} style={inputSt}>
                        {EXTENDED_LAYOUT_OPTIONS.map((g, i) => (
                          <optgroup key={i} label={g.group}>
                            {g.options.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </optgroup>
                        ))}
                      </select>
                    </div>

                    {/* Custom Song Selector for Custom Song shelves */}
                    {(settLayout === 'carousel' || settLayout === 'grid' || settLayout === 'list') && (
                      <div style={{ marginTop: 6 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                          <label style={{ fontSize: 10, color: C.muted }}>Custom Songs list ({settSongIds.length} added)</label>
                          <button onClick={() => setShowSongPicker(true)} style={{ background: 'transparent', border: 'none', color: C.primary, fontSize: 10, fontWeight: 700, cursor: 'pointer' }}>+ Add/Edit Songs</button>
                        </div>
                        <div style={{ display: 'flex', gap: 4, overflowX: 'auto', background: '#080808', padding: 6, borderRadius: 6, border: `1px solid ${C.border}` }}>
                          {settSongIds.length === 0 ? (
                            <span style={{ fontSize: 10, color: '#444', padding: '2px 4px' }}>No songs selected (auto-generated)</span>
                          ) : (
                            settSongIds.map(sid => {
                              const track = mockTracks.find(t => t.id === sid);
                              return (
                                <div key={sid} style={{ background: '#1a1a1a', borderRadius: 4, padding: '2px 6px', fontSize: 9, display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                                  <span>{track?.title || sid}</span>
                                  <button onClick={() => setSettSongIds(prev => prev.filter(x => x !== sid))} style={{ border: 'none', background: 'transparent', color: C.red, cursor: 'pointer', fontSize: 8 }}>×</button>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    )}

                    {/* Conditional Settings Fields */}
                    {settLayout === 'ad_break_banner' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, padding: 8, background: '#0a0a0a', borderRadius: 8, border: `1px solid ${C.border}` }}>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.orange }}>AD settings</div>
                        <div>
                          <label style={{ fontSize: 9, color: C.muted }}>Advertiser Sponsor Name</label>
                          <input value={settSponsorName} onChange={e => setSettSponsorName(e.target.value)} placeholder="e.g. COCA COLA" style={inputSt} />
                        </div>
                        <div>
                          <label style={{ fontSize: 9, color: C.muted }}>CTA Button label</label>
                          <input value={settButtonText} onChange={e => setSettButtonText(e.target.value)} placeholder="e.g. Get coupon" style={inputSt} />
                        </div>
                        <div>
                          <label style={{ fontSize: 9, color: C.muted }}>CTA Destination Url</label>
                          <input value={settTargetUrl} onChange={e => setSettTargetUrl(e.target.value)} placeholder="e.g. https://coca-cola.com" style={inputSt} />
                        </div>
                        <div>
                          <label style={{ fontSize: 9, color: C.muted }}>Media Type</label>
                          <select value={settMediaType} onChange={e => setSettMediaType(e.target.value as 'image' | 'video')} style={inputSt}>
                            <option value="image">Image (Poster / Image Banner)</option>
                            <option value="video">Video (Auto-playing Loop)</option>
                          </select>
                        </div>
                        {settMediaType === 'image' ? (
                          <div>
                            <label style={{ fontSize: 9, color: C.muted }}>Sponsor Image URL</label>
                            <input value={settCustomImage} onChange={e => setSettCustomImage(e.target.value)} placeholder="https://images.unsplash.com/..." style={inputSt} />
                          </div>
                        ) : (
                          <div>
                            <label style={{ fontSize: 9, color: C.muted }}>Sponsor Video URL (MP4 loop)</label>
                            <input value={settCustomVideo} onChange={e => setSettCustomVideo(e.target.value)} placeholder="e.g. https://...mp4" style={inputSt} />
                            <div style={{ fontSize: 8, color: C.muted, marginTop: 4, marginBottom: 2 }}>Quick Video Presets:</div>
                            <div style={{ display: 'flex', gap: 4, overflowX: 'auto', paddingBottom: 4 }} className="hide-scrollbar">
                              {[
                                { name: 'Vinyl Spin', url: 'https://assets.mixkit.co/videos/preview/mixkit-spinning-vinyl-record-player-43285-large.mp4' },
                                { name: 'Retro Grid', url: 'https://assets.mixkit.co/videos/preview/mixkit-retro-futuristic-grid-background-42862-large.mp4' },
                                { name: 'Cyber Neon', url: 'https://assets.mixkit.co/videos/preview/mixkit-tunnel-of-futuristic-blue-neon-lights-42417-large.mp4' }
                              ].map(vid => (
                                <button key={vid.name} type="button" onClick={() => setSettCustomVideo(vid.url)} style={{ background: '#222', border: settCustomVideo === vid.url ? `1px solid ${C.primary}` : '1px solid #444', color: '#fff', fontSize: 7, padding: '2px 6px', borderRadius: 4, cursor: 'pointer', whiteSpace: 'nowrap' }}>
                                  {vid.name}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {settLayout === 'hashtag_slides' && (
                      <div>
                        <label style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 4 }}>Hashtags list (Comma separated)</label>
                        <input value={settHashtags} onChange={e => setSettHashtags(e.target.value)} placeholder="e.g. #acoustic vibes, #indie rap, #tamil hits" style={inputSt} />
                      </div>
                    )}

                    {settLayout === 'genre_tiles' && (
                      <div>
                        <label style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 4 }}>Genre Tiles (Comma separated)</label>
                        <input value={settGenresList} onChange={e => setSettGenresList(e.target.value)} placeholder="e.g. Rock, Pop, Hip-Hop, Classical" style={inputSt} />
                      </div>
                    )}

                    {/* Cover image upload */}
                    {settLayout !== 'ad_break_banner' && (
                      <div>
                        <label style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 4 }}>Custom Cover Art URL</label>
                        <input value={settCustomImage} onChange={e => setSettCustomImage(e.target.value)} placeholder="e.g. https://images.unsplash.com/..." style={inputSt} />
                      </div>
                    )}
                  </div>

                  {/* Right settings column */}
                  <div style={cardSt({ display: 'flex', flexDirection: 'column', gap: 10 })}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, borderBottom: `1px solid ${C.border}`, paddingBottom: 6 }}>Styling and Targeting</div>
                    
                    <div>
                      <label style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 4 }}>Card Styling Template</label>
                      <select value={settCardStyle} onChange={e => setSettCardStyle(e.target.value as any)} style={inputSt}>
                        <option value="classic">Classic flat Spotify dark</option>
                        <option value="glass">Frosted Glassmorphism</option>
                        <option value="neo">Neon glow borders</option>
                        <option value="retro">Vaporwave retro outrun</option>
                        <option value="gradient">Translucent gradient backdrops</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 4 }}>Card Shape</label>
                      <select value={settCardShape} onChange={e => setSettCardShape(e.target.value as any)} style={inputSt}>
                        <option value="default">Default rounded corners</option>
                        <option value="square">Sharp square box</option>
                        <option value="circle">Circular profile disc</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 4 }}>Background Style Type</label>
                      <select value={settBgType} onChange={e => setSettBgType(e.target.value as any)} style={inputSt}>
                        <option value="none">Default canvas dark</option>
                        <option value="solid">Solid Background Color</option>
                        <option value="gradient">CSS Gradient Backdrop</option>
                        <option value="glass">Frosted glass tint overlay</option>
                      </select>
                    </div>

                    {settBgType !== 'none' && (
                      <div>
                        <label style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 4 }}>Background Value</label>
                        <input
                          value={settBgValue}
                          onChange={e => setSettBgValue(e.target.value)}
                          placeholder={settBgType === 'gradient' ? 'linear-gradient(180deg, #1e1b4b, #090514)' : settBgType === 'solid' ? '#111827' : 'rgba(255,255,255,0.04)'}
                          style={inputSt}
                        />
                      </div>
                    )}

                    <div>
                      <label style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 4 }}>Border Accent Style</label>
                      <select value={settBorder} onChange={e => setSettBorder(e.target.value as any)} style={inputSt}>
                        <option value="none">No custom borders</option>
                        <option value="solid">Thin solid outline</option>
                        <option value="pulsing">Animated pulsing border</option>
                        <option value="neon">Neon glow accent</option>
                      </select>
                    </div>

                    {settBorder !== 'none' && (
                      <div>
                        <label style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 4 }}>Border color</label>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input type="color" value={settBorderColor} onChange={e => setSettBorderColor(e.target.value)} style={{ width: 32, height: 32, padding: 0, border: 'none', background: 'transparent', cursor: 'pointer' }} />
                          <input value={settBorderColor} onChange={e => setSettBorderColor(e.target.value)} style={{ ...inputSt, flex: 1 }} />
                        </div>
                      </div>
                    )}

                    <div>
                      <label style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 4 }}>Target User Tier</label>
                      <select value={settAudience} onChange={e => setSettAudience(e.target.value as any)} style={inputSt}>
                        <option value="all">All listening users</option>
                        <option value="premium">Premium users only</option>
                        <option value="free">Free tier users only</option>
                      </select>
                    </div>
                  </div>

                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* ─── Right Panel: Sticky Google Pixel 7 Emulator Preview ─── */}
      <div style={{ position: 'sticky', top: '24px', height: 'fit-content' }}>
        
        {/* Emulator outer case representing Pixel 7 */}
        <div
          style={{
            width: '372px',
            height: '780px',
            background: '#0d0d0d',
            borderRadius: '42px',
            border: '10px solid #2d2d2d',
            boxShadow: '0 25px 60px rgba(0,0,0,0.85)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            fontFamily: 'Inter, sans-serif'
          }}
        >
          {/* Top punch hole camera notch */}
          <div
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: '#000',
              position: 'absolute',
              top: '12px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 999
            }}
          />

          {/* Android top Status Bar */}
          <div
            style={{
              height: '34px',
              background: scrollTop > 15 ? 'rgba(10,10,10,0.85)' : 'transparent',
              backdropFilter: scrollTop > 15 ? 'blur(10px)' : 'none',
              borderBottom: scrollTop > 15 ? '1px solid rgba(255,255,255,0.06)' : 'none',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '0 20px',
              fontSize: '10px',
              color: '#ffffff',
              fontWeight: '600',
              zIndex: 998,
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              transition: 'background 0.3s ease, backdrop-filter 0.3s ease, border-bottom 0.3s ease'
            }}
          >
            <span>{phoneTime}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>📶</span>
              <span>📶</span>
              <span>🔋 96%</span>
            </div>
          </div>

          {/* Emulator Screen (Scrollable homepage view) */}
          <div
            className="hide-scrollbar"
            onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
            style={{
              flex: 1,
              background: selectedPreset?.theme?.background || '#0a0a0a',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              padding: '12px',
              paddingBottom: '60px', // spacing for gesture bar
              position: 'relative'
            }}
          >
            {/* Top header with dynamic gradient backdrop */}
            <div
              style={{
                background: selectedPreset?.theme?.gradient || 'linear-gradient(180deg, rgba(29, 185, 84,0.08) 0%, rgba(10,10,10,0) 100%)',
                padding: '42px 12px 16px 12px',
                margin: '-12px -12px 16px -12px', // pull negative margin to fill full-bleed screen width
                position: 'relative'
              }}
            >
              {/* Home header mockup */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                {/* User Profile Avatar */}
                <div
                  style={{
                    width: 30,
                    height: 30,
                    borderRadius: '50%',
                    background: '#34d399', // Pink circle like screenshot
                    color: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 800,
                    fontSize: 13,
                    fontFamily: 'Outfit, sans-serif'
                  }}
                >
                  {user?.name ? user.name[0].toUpperCase() : 'M'}
                </div>
                
                {/* Category Chips */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center', flex: 1 }}>
                  {['All', 'Music', 'Podcasts'].map((chip) => {
                    const active = chip === 'All';
                    return (
                      <button
                        key={chip}
                        style={{
                          background: active ? (selectedPreset?.theme?.primary || '#1db954') : 'rgba(255,255,255,0.08)',
                          color: active ? '#000' : '#fff',
                          border: 'none',
                          borderRadius: 20,
                          padding: '5px 12px',
                          fontSize: 11,
                          fontWeight: 700,
                          fontFamily: 'Inter, sans-serif',
                          cursor: 'pointer'
                        }}
                      >
                        {chip}
                      </button>
                    );
                  })}
                </div>
                {/* Bell Icon */}
                <div style={{ color: '#fff', fontSize: 14, cursor: 'pointer', paddingRight: 2 }}>
                  🔔
                </div>
              </div>
            </div>

            {/* Simulated Live Renderer for active shelves */}
            {builderSections.filter(sec => !sec.hidden).map((sec) => {
              const hasSolidBg = sec.background.type === 'solid';
              const hasGradientBg = sec.background.type === 'gradient';
              const hasGlassBg = sec.background.type === 'glass';
              
              const borderStyle = sec.borderStyle;
              const hasBorder = borderStyle && borderStyle !== 'none';

              return (
                <div
                  key={sec.id}
                  style={{
                    borderRadius: 12,
                    padding: sec.padding === 'none' ? '0' : sec.padding === 'sm' ? '8px' : sec.padding === 'lg' ? '20px' : '12px',
                    marginBottom: 10,
                    position: 'relative',
                    overflow: 'hidden',
                    
                    // Background
                    backgroundColor: hasSolidBg ? sec.background.value : hasGlassBg ? (sec.background.value || 'rgba(255,255,255,0.03)') : 'transparent',
                    backgroundImage: hasGradientBg ? sec.background.value : 'none',
                    backdropFilter: hasGlassBg ? 'blur(12px)' : 'none',
                    
                    // Borders
                    border: borderStyle === 'solid' ? `1px solid ${sec.borderColor || C.primary}` : borderStyle === 'pulsing' ? `1.5px dashed ${sec.borderColor || C.primary}` : 'none',
                    boxShadow: borderStyle === 'neon' ? `0 0 14px ${(sec.borderColor || C.primary)}30` : 'none',
                  }}
                >
                  {/* Neon frame outline if selected */}
                  {borderStyle === 'neon' && (
                    <div style={{ position: 'absolute', inset: 0, border: `1px solid ${sec.borderColor || C.primary}`, borderRadius: 12, pointerEvents: 'none', opacity: 0.8 }} />
                  )}

                  {/* Shelf Title & Subtitle */}
                  <div style={{ marginBottom: 8, padding: '0 2px' }}>
                    <div style={{ fontSize: 12, fontWeight: 800, color: '#ffffff', fontFamily: 'Outfit, sans-serif' }}>{sec.title}</div>
                    {sec.subtitle && <div style={{ fontSize: 9, color: selectedPreset?.theme?.textMuted || C.muted, marginTop: 1 }}>{sec.subtitle}</div>}
                  </div>

                  {/* LAYOUT TEMPLATE SPECIFIC RENDERERS */}
                  {/* 1. Quick Access (3x2 grid) */}
                  {(sec.type === 'quick_access' || sec.type === 'quick' || sec.id.includes('quick_access')) ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                      {(() => {
                        const DEFAULT_QUICK_ITEMS: { id: string; label: string; gradient?: string; icon?: string; coverImage?: string | null }[] = [
                          { id: 'liked', label: 'Liked Songs', gradient: 'linear-gradient(135deg, #4338ca, #60a5fa)', icon: '♥', coverImage: null },
                          { id: 'discover', label: 'Discover Weekly', gradient: 'linear-gradient(135deg, #1e3a5f, #7c3aed)', icon: '✦', coverImage: null },
                          { id: 'daily1', label: 'Daily Mix 1', gradient: 'linear-gradient(135deg, #5b21b6, #be185d)', icon: '★', coverImage: null },
                          { id: 'midnight', label: 'Midnight Vibes', gradient: 'linear-gradient(135deg, #1e3a5f, #1e40af)', icon: '🌙', coverImage: null },
                          { id: 'workout', label: 'Workout Energy', gradient: 'linear-gradient(135deg, #92400e, #dc2626)', icon: '⚡', coverImage: null },
                          { id: 'chill', label: 'Chill Lounge', gradient: 'linear-gradient(135deg, #065f46, #0e7490)', icon: '🌊', coverImage: null }
                        ];

                        const mappedUserPlaylists = (customPlaylists || []).map(p => ({
                          id: p.id,
                          label: p.title,
                          gradient: p.gradientCss || 'linear-gradient(135deg, #1e3a5f, #7c3aed)',
                          icon: '🎵',
                          coverImage: p.coverImage || null
                        }));

                        const combinedItems = [
                          DEFAULT_QUICK_ITEMS[0],
                          ...mappedUserPlaylists,
                          ...DEFAULT_QUICK_ITEMS.slice(1)
                        ].slice(0, 6);

                        return combinedItems.map((item, idx) => {
                          const hasImg = !!item.coverImage;
                          return (
                            <div key={idx} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 6, display: 'flex', alignItems: 'center', height: 34, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
                              <div style={{ 
                                width: 34, 
                                height: 34, 
                                background: hasImg ? `url(${item.coverImage}) center/cover` : item.gradient, 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center', 
                                fontSize: 12,
                                flexShrink: 0
                              }}>
                                {!hasImg && item.icon}
                              </div>
                              <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', padding: '0 6px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.label}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  ) 
                  
                  // 2. Liked Songs Play Banner
                  : (sec.id.includes('liked_songs') || sec.type === 'liked_songs') ? (
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(67, 56, 202, 0.25) 0%, rgba(10, 10, 10, 0.4) 100%)',
                        border: '1px solid rgba(67, 56, 202, 0.3)',
                        borderRadius: 12,
                        padding: '10px 14px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 38, height: 38, borderRadius: 8, background: 'linear-gradient(135deg, #4338ca, #60a5fa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, boxShadow: '0 4px 10px rgba(0,0,0,0.3)', color: '#fff' }}>♥</div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>Liked Songs</div>
                          <div style={{ fontSize: 8, color: selectedPreset?.theme?.textMuted || '#737373', marginTop: 1 }}>{likedTracks?.length || 0} tracks saved</div>
                        </div>
                      </div>
                      <button style={{ width: 28, height: 28, borderRadius: '50%', background: selectedPreset?.theme?.primary || '#1db954', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 10, color: '#000', boxShadow: '0 0 10px rgba(29, 185, 84,0.3)' }}>
                        ▶
                      </button>
                    </div>
                  )

                  // 3. Custom Promo Hero Banner
                  : sec.layout === 'hero' ? (
                    <div
                      style={{
                        height: 94,
                        borderRadius: 8,
                        backgroundImage: sec.customImage ? `url(${sec.customImage})` : 'linear-gradient(135deg, #1e1b4b, #311042)',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'flex-end',
                        padding: 10,
                        position: 'relative'
                      }}
                    >
                      {!sec.customImage && <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 0 }} />}
                      <div style={{ position: 'relative', zIndex: 1 }}>
                        <div style={{ fontSize: 10, fontWeight: 900, color: '#fff' }}>{sec.title || 'Explore New Campaign'}</div>
                        <div style={{ fontSize: 8, color: '#ddd', marginTop: 1 }}>{sec.subtitle || 'Listen to the featured tracks today.'}</div>
                        <button style={{ background: '#fff', color: '#000', border: 'none', borderRadius: 10, padding: '3px 8px', fontSize: 7, fontWeight: 800, marginTop: 6 }}>LISTEN NOW</button>
                      </div>
                    </div>
                  )

                  // 4. Genre Tiles
                  : sec.layout === 'genre_tiles' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {sec.genresList && sec.genresList.trim().length > 0 ? (
                        sec.genresList.split(',').map((genre, i) => {
                          const colors = ['#e91429', '#006450', '#8a2be2', '#2d55e2'];
                          const defaultImages = [
                            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&q=80',
                            'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100&q=80',
                            'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=100&q=80',
                            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&q=80',
                          ];
                          return (
                            <div
                              key={i}
                              style={{
                                height: 64,
                                borderRadius: 6,
                                backgroundColor: colors[i % colors.length],
                                padding: 10,
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              <span style={{ fontSize: 11, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#fff', display: 'block', lineHeight: 1.1 }}>{genre.trim()}</span>
                              <img
                                src={defaultImages[i % defaultImages.length]}
                                alt=""
                                style={{
                                  width: 40,
                                  height: 40,
                                  position: 'absolute',
                                  bottom: -8,
                                  right: -10,
                                  transform: 'rotate(25deg)',
                                  borderRadius: 6,
                                  objectFit: 'cover',
                                  boxShadow: '-2px 2px 8px rgba(0,0,0,0.3)'
                                }}
                              />
                            </div>
                          );
                        })
                      ) : (
                        (sec.songIds && sec.songIds.length > 0 ? sec.songIds : mockTracks.slice(0, 4).map(t => t.id)).map((sid, i) => {
                          const track = mockTracks.find(t => t.id === sid);
                          const colors = ['#e91429', '#006450', '#8a2be2', '#2d55e2'];
                          const coverImg = sec.customImage || track?.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=100&h=100&fit=crop`;
                          return (
                            <div
                              key={i}
                              style={{
                                height: 64,
                                borderRadius: 6,
                                backgroundColor: colors[i % colors.length],
                                padding: 10,
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              <span style={{ fontSize: 10, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#fff', display: 'block', lineHeight: 1.1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '75%' }}>{track?.title || 'Song'}</span>
                              <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.7)', display: 'block', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '75%' }}>{track?.artistName || 'Artist'}</span>
                              <img
                                src={coverImg}
                                alt=""
                                style={{
                                  width: 40,
                                  height: 40,
                                  position: 'absolute',
                                  bottom: -8,
                                  right: -10,
                                  transform: 'rotate(25deg)',
                                  borderRadius: 6,
                                  objectFit: 'cover',
                                  boxShadow: '-2px 2px 8px rgba(0,0,0,0.3)'
                                }}
                              />
                            </div>
                          );
                        })
                      )}
                    </div>
                  )

                  // 5. Ad break banner
                  : sec.layout === 'ad_break_banner' ? (
                    <div style={{
                      position: 'relative',
                      width: '100%',
                      height: '240px',
                      borderRadius: 12,
                      overflow: 'hidden',
                      background: '#121212',
                      border: '1px solid rgba(255,255,255,0.06)',
                      boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
                      marginBottom: 4
                    }}>
                      {sec.mediaType === 'video' && sec.customVideo ? (
                        <video
                          src={sec.customVideo}
                          autoPlay
                          loop
                          muted
                          playsInline
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      ) : (
                        <img
                          src={sec.customImage || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&auto=format&fit=crop&q=80'}
                          alt=""
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                            display: 'block'
                          }}
                        />
                      )}

                      {/* Top Left: Advertisement Pill */}
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        left: '8px',
                        background: 'rgba(0, 0, 0, 0.6)',
                        backdropFilter: 'blur(4px)',
                        padding: '3px 8px',
                        borderRadius: '10px',
                        fontSize: '7px',
                        fontWeight: 'bold',
                        color: '#fff',
                        letterSpacing: '0.05em',
                        textTransform: 'uppercase',
                        zIndex: 5
                      }}>
                        Advertisement
                      </div>

                      {/* Top Right: Controls Mock */}
                      <div style={{
                        position: 'absolute',
                        top: '8px',
                        right: '8px',
                        display: 'flex',
                        gap: '6px',
                        zIndex: 5
                      }}>
                        {sec.mediaType === 'video' && sec.customVideo && (
                          <div style={{
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(4px)',
                            width: '20px',
                            height: '20px',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: '8px'
                          }}>
                            🔇
                          </div>
                        )}
                        <div style={{
                          background: 'rgba(0, 0, 0, 0.6)',
                          backdropFilter: 'blur(4px)',
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#fff',
                          fontSize: '10px'
                        }}>
                          ⋮
                        </div>
                      </div>

                      {/* Bottom Gradient overlay */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        height: '60%',
                        background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.3) 50%, transparent 100%)',
                        zIndex: 1,
                        pointerEvents: 'none'
                      }} />

                      {/* Bottom Content overlay */}
                      <div style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-end',
                        zIndex: 2,
                        gap: '6px'
                      }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{
                            color: '#fff',
                            fontSize: '11px',
                            fontWeight: '900',
                            fontFamily: 'Outfit, sans-serif',
                            lineHeight: 1.2,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap'
                          }}>
                            {sec.title || '30-minute roadside assistance promise'}
                          </div>
                          <div style={{
                            color: 'rgba(255,255,255,0.7)',
                            fontSize: '8px',
                            fontWeight: '800',
                            letterSpacing: '0.04em',
                            textTransform: 'uppercase',
                            fontFamily: 'Outfit, sans-serif',
                            marginTop: '2px'
                          }}>
                            Sponsored by {sec.sponsorName || 'ICICI LOMBARD'}
                          </div>
                        </div>
                        <button style={{
                          background: '#fff',
                          color: '#000',
                          border: 'none',
                          borderRadius: '14px',
                          padding: '5px 10px',
                          fontSize: '8px',
                          fontWeight: '800',
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                          flexShrink: 0
                        }}>
                          {sec.buttonText || 'Buy now'}
                        </button>
                      </div>
                    </div>
                  )

                  // 6. Live Events / Concerts
                  : (sec.type === 'live_events' || sec.id.includes('live_events') || sec.type === 'ticket_sales') ? (
                    <div>
                      {(() => {
                        const MOCK_EVENTS = [
                          { id: 'ev-1', name: 'Electronic Resonance Night', location: 'O2 Arena, London', date: 'June 24, 2026', time: '8:00 PM', price: '£45.00', artistId: 'artist-1' },
                          { id: 'ev-2', name: 'Cyber Beats Tour', location: 'Madison Square Garden, NY', date: 'July 12, 2026', time: '7:30 PM', price: '$65.00', artistId: 'artist-2' },
                          { id: 'ev-3', name: 'Acoustic Sunset Session', location: 'Sydney Opera House, Sydney', date: 'August 05, 2026', time: '6:00 PM', price: 'AU$50.00', artistId: 'artist-3' }
                        ];

                        if ((sec.layout as string) === 'list') {
                          return (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {MOCK_EVENTS.map((ev, i) => {
                                const artist = mockArtists.find(a => a.id === ev.artistId);
                                return (
                                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 6, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8 }}>
                                    <img src={artist?.image || `https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=100&h=100`} alt="" style={{ width: 24, height: 24, borderRadius: '50%', objectFit: 'cover' }} />
                                    <div style={{ flex: 1, minWidth: 0 }}>
                                      <div style={{ fontSize: 9, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.name}</div>
                                      <div style={{ fontSize: 7, color: selectedPreset?.theme?.textMuted || '#737373', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.location} • {ev.date}</div>
                                    </div>
                                    <span style={{ fontSize: 8, fontWeight: 800, color: selectedPreset?.theme?.primary || '#1db954' }}>{ev.price}</span>
                                  </div>
                                );
                              })}
                            </div>
                          );
                        }

                        if ((sec.layout as string) === 'hero') {
                          const ev = MOCK_EVENTS[0];
                          const artist = mockArtists.find(a => a.id === ev.artistId);
                          return (
                            <div style={{
                              borderRadius: 10,
                              overflow: 'hidden',
                              position: 'relative',
                              height: 100,
                              border: '1px solid rgba(255, 255, 255, 0.08)',
                              background: 'linear-gradient(135deg, #1e0b36 0%, #080312 100%)',
                              padding: 10,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'flex-end'
                            }}>
                              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.2) 100%)', zIndex: 1 }} />
                              {artist?.image && (
                                <img src={artist.image} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.35, zIndex: 0 }} />
                              )}
                              <div style={{ position: 'relative', zIndex: 2 }}>
                                <span style={{ color: '#ff0055', fontSize: 7, fontWeight: 800, letterSpacing: '0.05em', display: 'block', marginBottom: 2 }}>FEATURED LIVE SHOW</span>
                                <div style={{ fontSize: 10, fontWeight: 950, color: '#fff' }}>{ev.name}</div>
                                <div style={{ fontSize: 7, color: '#ccc', marginTop: 1 }}>📍 {ev.location} • 📅 {ev.date}</div>
                                <button style={{ background: selectedPreset?.theme?.primary || '#1db954', color: '#000', border: 'none', borderRadius: 8, padding: '3px 8px', fontSize: 7, fontWeight: 800, marginTop: 4 }}>Get Tickets • {ev.price}</button>
                              </div>
                            </div>
                          );
                        }

                        // default/carousel
                        return (
                          <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }} className="hide-scrollbar">
                            {MOCK_EVENTS.map((ev, i) => {
                              const artist = mockArtists.find(a => a.id === ev.artistId);
                              return (
                                <div key={ev.id} style={{ flexShrink: 0, width: 130, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 10, padding: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                                  <div style={{ position: 'relative', height: 60, borderRadius: 6, overflow: 'hidden' }}>
                                    <img src={artist?.image || `https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=100&h=100`} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                    <div style={{ position: 'absolute', top: 4, left: 4, background: '#ff0055', color: '#fff', fontSize: 5, padding: '2px 4px', borderRadius: 2, fontWeight: 800 }}>LIVE</div>
                                  </div>
                                  <div style={{ fontSize: 9, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.name}</div>
                                  <div style={{ fontSize: 7, color: selectedPreset?.theme?.textMuted || '#737373', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>📍 {ev.location}</div>
                                  <div style={{ fontSize: 7, color: '#fff', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                                    <span>{ev.price}</span>
                                    <button style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: 4, padding: '2px 6px', fontSize: 6, color: '#fff', fontWeight: 800 }}>Tickets</button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        );
                      })()}
                    </div>
                  )

                  // 7. Hashtag slides
                  : sec.layout === 'hashtag_slides' ? (
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 6 }} className="hide-scrollbar">
                      {sec.hashtags && sec.hashtags.trim().length > 0 ? (
                        sec.hashtags.split(',').map((tag, i) => {
                          const images = [
                            'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200&q=80',
                            'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200&q=80',
                            'https://images.unsplash.com/photo-1470229722913-7c092bba1a8e?w=200&q=80',
                            'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=200&q=80',
                          ];
                          return (
                            <div
                              key={i}
                              style={{
                                flexShrink: 0,
                                width: 100,
                                height: 140,
                                backgroundImage: `url(${images[i % images.length]})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: 12,
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 60%)' }} />
                              <div style={{
                                position: 'absolute',
                                bottom: 10,
                                left: 10,
                                fontSize: 11,
                                fontWeight: 900,
                                color: '#fff',
                                fontFamily: 'Outfit, sans-serif'
                              }}>
                                {tag.trim()}
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        (sec.songIds && sec.songIds.length > 0 ? sec.songIds : mockTracks.slice(0, 4).map(t => t.id)).map((sid, i) => {
                          const track = mockTracks.find(t => t.id === sid);
                          const coverImg = sec.customImage || track?.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=200&h=200&fit=crop`;
                          return (
                            <div
                              key={i}
                              style={{
                                flexShrink: 0,
                                width: 100,
                                height: 140,
                                backgroundImage: `url(${coverImg})`,
                                backgroundSize: 'cover',
                                backgroundPosition: 'center',
                                borderRadius: 12,
                                position: 'relative',
                                overflow: 'hidden'
                              }}
                            >
                              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0) 60%)' }} />
                              <div style={{
                                position: 'absolute',
                                bottom: 10,
                                left: 10,
                                fontSize: 10,
                                fontWeight: 900,
                                color: '#fff',
                                fontFamily: 'Outfit, sans-serif',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                width: '80%',
                                lineHeight: 1.1
                              }}
                              >
                                {track?.title || 'Song'}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  )

                  // 10 new unique layouts
                  : sec.layout === 'story' ? (
                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }} className="hide-scrollbar">
                      {(sec.songIds && sec.songIds.length > 0 ? sec.songIds : mockTracks.slice(0, 5).map(t => t.id)).map((sid, i) => {
                        const track = mockTracks.find(t => t.id === sid);
                        const coverImg = sec.customImage || track?.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=100&h=100&fit=crop`;
                        return (
                          <div key={i} style={{ flexShrink: 0, width: 62, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <div style={{
                              width: 54,
                              height: 54,
                              borderRadius: '50%',
                              padding: 2.5,
                              background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <div style={{ width: '100%', height: '100%', borderRadius: '50%', border: '2px solid #000', overflow: 'hidden' }}>
                                <img src={coverImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                            </div>
                            <span style={{ fontSize: 7.5, color: '#fff', fontWeight: 700, marginTop: 4, width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {track?.title || 'Story'}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )

                  : sec.layout === 'story_tiktok' ? (
                    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }} className="hide-scrollbar">
                      {(sec.songIds && sec.songIds.length > 0 ? sec.songIds : mockTracks.slice(0, 3).map(t => t.id)).map((sid, i) => {
                        const track = mockTracks.find(t => t.id === sid);
                        const coverImg = sec.customImage || track?.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=200&h=300&fit=crop`;
                        return (
                          <div key={i} style={{
                            flexShrink: 0,
                            width: 140,
                            height: 220,
                            borderRadius: 12,
                            backgroundImage: `url(${coverImg})`,
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            position: 'relative',
                            overflow: 'hidden',
                            border: '1px solid rgba(255,255,255,0.08)',
                            boxShadow: '0 6px 16px rgba(0,0,0,0.3)'
                          }}>
                            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)', zIndex: 1 }} />
                            
                            <div style={{ position: 'absolute', right: 8, bottom: 35, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, zIndex: 2 }}>
                              <div style={{ width: 20, height: 20, borderRadius: '50%', border: '1px solid #fff', overflow: 'hidden', background: '#333' }}>
                                <img src={coverImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              </div>
                              <span style={{ fontSize: 9, color: '#fff' }}>❤️</span>
                              <span style={{ fontSize: 9, color: '#fff' }}>💬</span>
                              <span style={{ fontSize: 9, color: '#fff' }}>📤</span>
                            </div>

                            <div className="spinning-disc-mock" style={{
                              position: 'absolute',
                              right: 8,
                              bottom: 8,
                              width: 18,
                              height: 18,
                              borderRadius: '50%',
                              background: '#111',
                              border: '2px dashed #444',
                              zIndex: 2,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              animation: 'spin 3s linear infinite'
                            }}>
                              <div style={{ width: 6, height: 6, borderRadius: '50%', background: selectedPreset?.theme?.primary || '#1db954' }} />
                            </div>

                            <div style={{ position: 'absolute', bottom: 8, left: 8, right: 30, zIndex: 2 }}>
                              <div style={{ fontSize: 9.5, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{track?.artistName || 'artist'}</div>
                              <div style={{ fontSize: 8, color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>🎵 {track?.title || 'Song title'}</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )

                  : sec.layout === 'carousel_coverflow' ? (
                    <div style={{ display: 'flex', gap: 0, overflowX: 'auto', padding: '10px 0', alignItems: 'center', justifyContent: 'center' }} className="hide-scrollbar">
                      {(sec.songIds && sec.songIds.length > 0 ? sec.songIds : mockTracks.slice(0, 3).map(t => t.id)).map((sid, i) => {
                        const track = mockTracks.find(t => t.id === sid);
                        const coverImg = sec.customImage || track?.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=150&h=150&fit=crop`;
                        const isCenter = i === 1;
                        return (
                          <div key={i} style={{
                            flexShrink: 0,
                            width: isCenter ? 90 : 70,
                            height: isCenter ? 90 : 70,
                            margin: '0 -8px',
                            zIndex: isCenter ? 3 : 1,
                            transition: 'all 0.3s ease',
                            transform: isCenter ? 'scale(1.1)' : `scale(0.85) perspective(100px) rotateY(${i === 0 ? '8deg' : '-8deg'})`,
                            borderRadius: 8,
                            overflow: 'hidden',
                            boxShadow: isCenter ? '0 8px 20px rgba(0,0,0,0.6)' : '0 4px 10px rgba(0,0,0,0.4)',
                            border: isCenter ? `1.5px solid ${selectedPreset?.theme?.primary || '#1db954'}` : '1px solid rgba(255,255,255,0.06)'
                          }}>
                            <img src={coverImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        );
                      })}
                    </div>
                  )

                  : sec.layout === 'grid_apple' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {(sec.songIds && sec.songIds.length > 0 ? sec.songIds.slice(0, 4) : mockTracks.slice(0, 4).map(t => t.id)).map((sid, i) => {
                        const track = mockTracks.find(t => t.id === sid);
                        const coverImg = sec.customImage || track?.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=150&h=150&fit=crop`;
                        return (
                          <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 8, border: '1px solid rgba(255,255,255,0.04)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                            <div style={{ width: '100%', paddingTop: '100%', position: 'relative', borderRadius: 6, overflow: 'hidden' }}>
                              <img src={coverImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ fontSize: 9.5, fontWeight: 700, color: '#fff', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track?.title}</div>
                            <div style={{ fontSize: 7.5, color: '#888', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track?.artistName}</div>
                          </div>
                        );
                      })}
                    </div>
                  )

                  : (sec.layout === 'grid_retro' || sec.layout === 'magazine_retro') ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                      {(sec.songIds && sec.songIds.length > 0 ? sec.songIds.slice(0, 4) : mockTracks.slice(0, 4).map(t => t.id)).map((sid, i) => {
                        const track = mockTracks.find(t => t.id === sid);
                        const coverImg = sec.customImage || track?.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=150&h=150&fit=crop`;
                        const colors = ['#ff007f', '#00f0ff'];
                        const outlineColor = colors[i % colors.length];
                        return (
                          <div key={i} style={{ background: '#0b0410', border: `1.5px solid ${outlineColor}`, padding: 6, borderRadius: 2, boxShadow: `3px 3px 0px ${outlineColor === '#ff007f' ? '#00f0ff' : '#ff007f'}` }}>
                            <div style={{ width: '100%', paddingTop: '100%', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <img src={coverImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ fontSize: 9, fontWeight: 900, color: '#00f0ff', fontFamily: 'monospace', marginTop: 6, textShadow: '1px 1px 0px #ff007f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track?.title?.toUpperCase()}</div>
                            <div style={{ fontSize: 7, color: '#fff', opacity: 0.8, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track?.artistName}</div>
                          </div>
                        );
                      })}
                    </div>
                  )

                  : sec.layout === 'list_billboard' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(sec.songIds && sec.songIds.length > 0 ? sec.songIds.slice(0, 3) : mockTracks.slice(0, 3).map(t => t.id)).map((sid, i) => {
                        const track = mockTracks.find(t => t.id === sid);
                        const coverImg = sec.customImage || track?.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=100&h=100&fit=crop`;
                        const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
                        const rankColor = rankColors[i] || '#888';
                        return (
                          <div key={sid} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 8px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 6 }}>
                            <span style={{ fontSize: 13, fontWeight: 950, color: rankColor, width: 16, textAlign: 'center', fontFamily: 'Outfit, sans-serif' }}>{i + 1}</span>
                            <span style={{ fontSize: 6.5, color: '#1db954', marginRight: 2 }}>▲</span>
                            <div style={{ width: 26, height: 26, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                              <img src={coverImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 9.5, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track?.title}</div>
                              <div style={{ fontSize: 7.5, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track?.artistName}</div>
                            </div>
                            <span style={{ fontSize: 7, color: '#888', fontWeight: 700 }}>{(4.2 - i * 0.9).toFixed(1)}M plays</span>
                          </div>
                        );
                      })}
                    </div>
                  )

                  : sec.layout === 'hero_countdown' ? (
                    <div style={{
                      background: 'linear-gradient(135deg, #1f1235 0%, #0c0617 100%)',
                      borderRadius: 10,
                      border: '1px solid rgba(16, 185, 129, 0.2)',
                      padding: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
                    }}>
                      {(() => {
                        const track = mockTracks[0];
                        const coverImg = sec.customImage || track.coverImage;
                        return (
                          <>
                            <img src={coverImg} alt="" style={{ width: 42, height: 42, borderRadius: 6, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 6.5, fontWeight: 900, color: '#10b981', letterSpacing: '0.05em' }}>NEW RELEASE COUNTDOWN</div>
                              <div style={{ fontSize: 9.5, fontWeight: 850, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{track.title}</div>
                              <div style={{ display: 'flex', gap: 3, marginTop: 4 }}>
                                {['02d', '14h', '35m', '18s'].map((t, idx) => (
                                  <div key={idx} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 3, padding: '2px 4px', fontSize: 7, fontFamily: 'monospace', color: '#10b981', fontWeight: 800 }}>{t}</div>
                                ))}
                              </div>
                            </div>
                            <button style={{ background: '#10b981', color: '#fff', border: 'none', borderRadius: 6, padding: '4px 8px', fontSize: 7, fontWeight: 800, whiteSpace: 'nowrap' }}>Pre-save</button>
                          </>
                        );
                      })()}
                    </div>
                  )

                  : sec.layout === 'magazine' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 8 }}>
                      {(() => {
                        const t1 = mockTracks[0];
                        const t2 = mockTracks[1];
                        const t3 = mockTracks[2];
                        return (
                          <>
                            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 8, padding: 6, display: 'flex', flexDirection: 'column' }}>
                              <img src={sec.customImage || t1.coverImage} alt="" style={{ width: '100%', height: 62, objectFit: 'cover', borderRadius: 4 }} />
                              <span style={{ fontSize: 10, fontWeight: 900, fontFamily: 'serif', color: '#fff', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{t1.title}</span>
                              <span style={{ fontSize: 7, color: '#999', marginTop: 2, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.2 }}>Specially featured editorial layout showing track highlight.</span>
                            </div>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {[t2, t3].map((track, idx) => (
                                <div key={idx} style={{ display: 'flex', gap: 4, alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 6, padding: 4 }}>
                                  <img src={track.coverImage} alt="" style={{ width: 22, height: 22, borderRadius: 3, objectFit: 'cover' }} />
                                  <div style={{ flex: 1, minWidth: 0 }}>
                                    <div style={{ fontSize: 8, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                                    <div style={{ fontSize: 6.5, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artistName}</div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )

                  : sec.layout === 'magazine_interview' ? (
                    <div style={{
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.04)',
                      borderRadius: 10,
                      padding: 10,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                    }}>
                      {(() => {
                        const artist = mockArtists[0];
                        return (
                          <>
                            <img src={artist.image} alt="" style={{ width: 38, height: 38, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #fff' }} />
                            <div style={{ flex: 1, minWidth: 0, position: 'relative', background: '#181818', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '8px 8px 8px 0px', padding: '6px 8px' }}>
                              <div style={{ position: 'absolute', left: -6, bottom: 0, width: 0, height: 0, borderTop: '6px solid transparent', borderRight: '6px solid #181818', borderBottom: '0px solid transparent' }} />
                              <div style={{ fontSize: 8, fontStyle: 'italic', color: '#e5e7eb', lineHeight: 1.2 }}>"I make songs for the quiet dreamers of the night..."</div>
                              <div style={{ fontSize: 7, fontWeight: 800, color: selectedPreset?.theme?.primary || '#1db954', marginTop: 4, textAlign: 'right' }}>— {artist.name}</div>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )

                  : sec.layout === 'bento_asymmetric' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 6 }}>
                      {(() => {
                        const t1 = mockTracks[0];
                        const t2 = mockTracks[1];
                        const t3 = mockTracks[2];
                        return (
                          <>
                            <div style={{
                              gridRow: 'span 2',
                              background: 'rgba(255,255,255,0.03)',
                              backdropFilter: 'blur(10px)',
                              border: '1.5px solid rgba(255,255,255,0.05)',
                              borderRadius: 10,
                              padding: 6,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'space-between'
                            }}>
                              <div style={{ fontSize: 7, color: '#fff', opacity: 0.6, fontWeight: 800 }}>FEATURED</div>
                              <img src={sec.customImage || t1.coverImage} alt="" style={{ width: '100%', height: 48, objectFit: 'cover', borderRadius: 6, margin: '6px 0' }} />
                              <div style={{ fontSize: 9, fontWeight: 900, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t1.title}</div>
                            </div>

                            <div style={{
                              background: 'rgba(255,255,255,0.03)',
                              backdropFilter: 'blur(10px)',
                              border: '1.5px solid rgba(255,255,255,0.05)',
                              borderRadius: 10,
                              padding: 6,
                              display: 'flex',
                              alignItems: 'center',
                              gap: 6
                            }}>
                              <img src={t2.coverImage} alt="" style={{ width: 22, height: 22, borderRadius: 4, objectFit: 'cover' }} />
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 8.5, fontWeight: 800, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t2.title}</div>
                              </div>
                            </div>

                            <div style={{
                              background: 'rgba(255,255,255,0.03)',
                              backdropFilter: 'blur(10px)',
                              border: '1.5px solid rgba(255,255,255,0.05)',
                              borderRadius: 10,
                              padding: 6,
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'center',
                              alignItems: 'center'
                            }}>
                              <span style={{ fontSize: 11 }}>🔥</span>
                              <span style={{ fontSize: 7.5, fontWeight: 800, color: '#fff', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>{t3.title}</span>
                            </div>
                          </>
                        );
                      })()}
                    </div>
                  )

                  // 8. Timeline layout
                  : sec.layout === 'timeline' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, borderLeft: '1px dashed #333', paddingLeft: 12, marginLeft: 6 }}>
                      {[...Array(3)].map((_, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                          <div style={{ position: 'absolute', left: -16, width: 7, height: 7, borderRadius: '50%', background: selectedPreset?.theme?.primary || C.primary }} />
                          <span style={{ fontSize: 8, color: selectedPreset?.theme?.primary || C.primary, fontWeight: 700 }}>202{4-i}</span>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 5, flex: 1 }}>
                            <div style={{ width: 18, height: 18, borderRadius: 3, background: '#333' }} />
                            <div style={{ width: 60, height: 5, background: '#444', borderRadius: 2 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )

                  // 9. Track list view (e.g. trending track charts)
                  : sec.layout === 'list' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {(sec.songIds && sec.songIds.length > 0 ? sec.songIds.slice(0, 4) : mockTracks.slice(0, 3).map(t=>t.id)).map((sid, i) => {
                        const track = mockTracks.find(t => t.id === sid);
                        const isCurrent = currentTrack?.id === sid;
                        const coverImg = sec.customImage || track?.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=300&h=300&fit=crop`;
                        return (
                          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, position: 'relative' }}>
                            <span style={{ fontSize: 9, color: selectedPreset?.theme?.textMuted || C.muted, width: 12, textAlign: 'right' }}>{i + 1}</span>
                            <div style={{ width: 28, height: 28, borderRadius: 4, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                              <img src={coverImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: 10, fontWeight: 700, color: isCurrent ? (selectedPreset?.theme?.primary || '#1db954') : '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track?.title || 'Track Name'}</div>
                              <div style={{ fontSize: 8, color: selectedPreset?.theme?.textMuted || C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>{track?.artistName || 'Artist Name'}</div>
                            </div>
                            {isCurrent && isPlaying ? (
                              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 1.5, marginRight: 4 }}>
                                {[1, 2, 3].map(bar => (
                                  <div key={bar} style={{ width: 1.5, background: selectedPreset?.theme?.primary || '#1db954', height: `${3 + bar * 2}px`, animation: `waveform 0.8s ease-in-out infinite` }} />
                                ))}
                              </div>
                            ) : (
                              <span style={{ fontSize: 8, color: selectedPreset?.theme?.textMuted || C.muted }}>▶</span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )

                  // Default: Music Track Cards Carousel/Grid
                  : (
                    <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }} className="hide-scrollbar">
                      {(sec.songIds && sec.songIds.length > 0 ? sec.songIds : mockTracks.slice(0, 4).map(t => t.id)).map((sid, i) => {
                        const track = mockTracks.find(t => t.id === sid);
                        const isCircle = sec.cardShape === 'circle';
                        const isSquare = sec.cardShape === 'square';
                        const isCurrent = currentTrack?.id === sid;
                        
                        let cardW = 68;
                        if (sec.cardSize === 'xs') cardW = 50;
                        if (sec.cardSize === 'lg') cardW = 90;
                        if (sec.cardWidth) cardW = Number(sec.cardWidth) * 0.55; // scale to fit emulator

                        const coverImg = sec.customImage || track?.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=300&h=300&fit=crop`;

                        return (
                          <div key={i} style={{ flexShrink: 0, width: cardW }}>
                            <div
                              style={{
                                width: cardW,
                                height: cardW,
                                borderRadius: isCircle ? '50%' : (isSquare ? 0 : 6),
                                overflow: 'hidden',
                                border: (isSquare || isCircle) ? 'none' : (sec.cardStyle === 'neo' ? `1px solid ${selectedPreset?.theme?.primary || '#1db954'}` : 'none'),
                                boxShadow: (isSquare || isCircle) ? 'none' : (sec.cardStyle === 'neo' ? `0 0 6px ${selectedPreset?.theme?.primary || '#1db954'}30` : 'none'),
                                position: 'relative',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                              }}
                            >
                              <img src={coverImg} alt="" style={{ width: '100%', height: '100%', borderRadius: isCircle ? '50%' : (isSquare ? 0 : 6), objectFit: 'cover' }} />
                              
                              {isCurrent && isPlaying && (
                                <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: isCircle ? '50%' : (isSquare ? 0 : 6) }}>
                                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2 }}>
                                    {[1, 2, 3].map(bar => (
                                      <div key={bar} style={{ width: 2, background: selectedPreset?.theme?.primary || '#1db954', height: `${6 + bar * 4}px`, animation: `waveform 0.8s ease-in-out infinite` }} />
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                            <div style={{ fontSize: 9, fontWeight: 700, color: isCurrent ? (selectedPreset?.theme?.primary || '#1db954') : '#fff', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {track?.title || 'Music Title'}
                            </div>
                            <div style={{ fontSize: 7, color: selectedPreset?.theme?.textMuted || C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                              {track?.artistName || 'Artist Name'}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                </div>
              );
            })}
          </div>

          {/* Android bottom gesture pill */}
          <div
            style={{
              height: 24,
              background: '#070707',
              position: 'relative',
              zIndex: 998,
              borderTop: '1px solid rgba(255,255,255,0.02)'
            }}
          >
            <div
              style={{
                width: 100,
                height: 4,
                background: '#ffffff',
                borderRadius: 2,
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
              }}
            />
          </div>

        </div>

      </div>

      {/* ─── MODAL: SAVE CUSTOM TEMPLATE ─── */}
      {saveTemplateModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={cardSt({ width: '380px', display: 'flex', flexDirection: 'column', gap: 12 })}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>💾 Save current configuration as Template</div>
            <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>This will save a copy of the layout grid to load/reload in the future.</p>
            <div>
              <label style={{ fontSize: 10, color: C.muted, display: 'block', marginBottom: 4 }}>Template Name</label>
              <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. Summer Rock Theme" style={inputSt} />
            </div>
            <div style={{ display: 'flex', justifySelf: 'flex-end', gap: 8, marginTop: 8 }}>
              <button onClick={() => setSaveTemplateModal(false)} style={btnSt('outline')}>Cancel</button>
              <button onClick={saveAsTemplate} style={btnSt('primary')}>Save Template</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL: IMPORT JSON ─── */}
      {importModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={cardSt({ width: '450px', display: 'flex', flexDirection: 'column', gap: 12 })}>
            <div style={{ fontSize: 14, fontWeight: 800 }}>📥 Import Mobile Layout JSON</div>
            <p style={{ fontSize: 11, color: C.muted, margin: 0 }}>Paste your previously exported homepage layout JSON data below to load it.</p>
            <textarea
              value={importJson}
              onChange={e => setImportJson(e.target.value)}
              placeholder='{ "homeLayoutOrder": [...], "customSections": {...} }'
              style={{ ...inputSt, height: '180px', fontFamily: 'monospace', fontSize: 10 }}
            />
            <div style={{ display: 'flex', justifySelf: 'flex-end', gap: 8, marginTop: 8 }}>
              <button onClick={() => setImportModalOpen(false)} style={btnSt('outline')}>Cancel</button>
              <button onClick={importLayout} style={btnSt('primary')}>Import Layout</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── DIALOG: SONG PICKER ─── */}
      {showSongPicker && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1001, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={cardSt({ width: '500px', display: 'flex', flexDirection: 'column', gap: 12, height: '520px' })}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 800 }}>🎵 Add tracks to custom shelf</span>
              <button onClick={() => setShowSongPicker(false)} style={{ background: 'transparent', border: 'none', color: '#fff', fontSize: 14, cursor: 'pointer' }}>✕</button>
            </div>

            <input
              placeholder="🔍 Search tracks by title, artist, or genre..."
              value={songSearchQuery}
              onChange={e => setSongSearchQuery(e.target.value)}
              style={inputSt}
            />

            {/* List of mock songs */}
            <div style={{ flex: 1, overflowY: 'auto', border: `1px solid ${C.border}`, borderRadius: 8, padding: 6, display: 'flex', flexDirection: 'column', gap: 4 }}>
              {filteredMockTracks.map(track => {
                const isAdded = settSongIds.includes(track.id);
                return (
                  <div
                    key={track.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 10px',
                      background: isAdded ? 'rgba(29, 185, 84, 0.08)' : '#0c0c0c',
                      borderRadius: 6,
                      border: `1px solid ${isAdded ? C.primary : 'transparent'}`
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 11, fontWeight: 700 }}>{track.title}</div>
                      <div style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>{track.artistName} • {track.genre}</div>
                    </div>
                    <button
                      onClick={() => {
                        if (isAdded) {
                          setSettSongIds(prev => prev.filter(id => id !== track.id));
                        } else {
                          setSettSongIds(prev => [...prev, track.id]);
                        }
                      }}
                      style={btnSt(isAdded ? 'danger' : 'primary', { padding: '4px 10px', fontSize: 9 })}
                    >
                      {isAdded ? 'Remove' : 'Add'}
                    </button>
                  </div>
                );
              })}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <button onClick={() => setShowSongPicker(false)} style={btnSt('primary')}>Done ({settSongIds.length} tracks selected)</button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Global scrollbar hider ─── */}
      <style jsx global>{`
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
      `}</style>

    </div>
  );
}
