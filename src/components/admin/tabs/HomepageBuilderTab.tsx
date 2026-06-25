'use client';

import { useState, useRef, useCallback, useEffect, lazy, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Lazily-loaded Advanced Designer overlay
const AdvancedDesigner = lazy(() => import('../designer/AdvancedDesigner'));
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import toast from 'react-hot-toast';
import {
  HOMEPAGE_PRESETS, PRESET_CATEGORIES, getPresetById,
  HomepagePreset, SectionConfig
} from '@/lib/homepagePresets';
import {
  analyzeMood, getMoodTimeline, getEmotionRadar, getPersonalityScore, getInsightCards,
  getPersonalizedSections, promptToPresetId, MoodProfile, InsightCard, EmotionDataPoint
} from '@/lib/mlPersonalization';
import { useMusicStore } from '@/store/musicStore';
import { useAuthStore } from '@/store/authStore';
import { mockTracks, mockArtists, mockPlaylists } from '@/lib/mockData';
import {
  SECTION_BLOCKS, BLOCK_CATEGORIES, BlockDef
} from '@/lib/sectionLibrary';

// ─── Palette & Design System ──────────────────────────────────────────────────
const C = {
  primary: '#b08850',
  primaryDim: 'rgba(176, 136, 80,0.12)',
  bg: '#fbf9f5',
  surface: '#111111',
  card: '#161616',
  border: '#262626',
  text: '#ffffff',
  muted: '#808080',
  blue: '#10b981',
  purple: '#10b981',
  orange: '#f59e0b',
  red: '#ef4444',
  pink: '#34d399',
};

const cardSt = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: C.card,
  border: `1px solid ${C.border}`,
  borderRadius: 12,
  padding: '16px',
  boxSizing: 'border-box',
  ...extra
});

const pillSt = (active: boolean, color = C.primary): React.CSSProperties => ({
  padding: '5px 12px',
  borderRadius: 20,
  fontSize: 10,
  fontWeight: 700,
  cursor: 'pointer',
  border: active ? 'none' : `1px solid ${C.border}`,
  background: active ? color : 'transparent',
  color: active ? '#000' : C.muted,
  transition: 'all 0.2s',
  outline: 'none',
});

const inputSt: React.CSSProperties = {
  background: '#fbf9f5',
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  color: C.text,
  fontSize: 11,
  padding: '6px 10px',
  width: '100%',
  outline: 'none',
  boxSizing: 'border-box',
};

const btnSt = (variant: 'primary' | 'secondary' | 'danger' | 'outline', extra?: React.CSSProperties): React.CSSProperties => ({
  border: 'none',
  borderRadius: 6,
  fontWeight: 700,
  cursor: 'pointer',
  fontSize: 10,
  padding: '6px 12px',
  transition: 'all 0.2s',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 4,
  ...(variant === 'primary' ? { background: C.primary, color: '#000' }
    : variant === 'secondary' ? { background: '#f4eede', color: C.text, border: `1px solid ${C.border}` }
    : variant === 'danger' ? { background: 'rgba(239,68,68,0.12)', color: C.red, border: `1px solid rgba(239,68,68,0.2)` }
    : { background: 'transparent', color: C.muted, border: `1px solid ${C.border}` }),
  ...extra
});

// ─── Simplified Layout Selection ──────────────────────────────────────────────
const CORE_LAYOUTS = [
  { value: 'grid', label: 'Grid Layout' },
  { value: 'carousel', label: 'Carousel (Horizontal)' },
  { value: 'list', label: 'Song List (Numbered)' },
  { value: 'minimal', label: 'Minimal Grid Tiles' },
  { value: 'hero', label: 'Hero Banner Layout' },
  { value: 'bento', label: 'Bento Grid Layout' },
  { value: 'timeline', label: 'Timeline Release Path' },
  { value: 'genre_tiles', label: 'Genre Bento Tiles (Search)' },
  { value: 'ad_break_banner', label: 'Sponsor Ad Banner (Search)' },
  { value: 'hashtag_slides', label: 'Hashtag Slides (Search)' },
  { value: 'grid_deals', label: 'Campaign Grid (Zepto Style)' },
];

// ─── Image Fallback Helper ────────────────────────────────────────────────────
function SafeImage({ src, alt, style }: { src?: string; alt?: string; style?: React.CSSProperties }) {
  const [error, setError] = useState(false);
  
  useEffect(() => {
    setError(false);
  }, [src]);

  const fallbackGrad = 'linear-gradient(135deg, #1f2937, #111827)';
  
  if (!src || src === 'undefined' || src === 'null' || error) {
    return (
      <div style={{
        ...style,
        background: fallbackGrad,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: C.muted,
        fontSize: '12px'
      }}>
        🎵
      </div>
    );
  }
  
  return (
    <img
      src={src}
      alt={alt || ''}
      style={{ ...style, objectFit: 'cover' }}
      onError={() => setError(true)}
    />
  );
}

// ─── Types ────────────────────────────────────────────────────────────────────
type BuilderPanel = 'builder' | 'settings' | 'ai' | 'ml';
type LeftSidebarTab = 'library' | 'active' | 'presets';
type PreviewDevice = 'laptop' | 'mobile';

interface BuilderSection extends SectionConfig {
  hidden?: boolean;
  hiddenOnLaptop?: boolean;
  hiddenOnMobile?: boolean;
  customElements?: any[];
  songIds?: string[];
  targetPlaylistId?: string;
  targetId?: string;
  autoPlaylist?: boolean;
}

export default function HomepageBuilderTab() {
  const { genreScores, recentlyPlayed } = useMusicStore();
  const { user } = useAuthStore();

  // ── States ───────────────────────────────────────────────────────────────
  const [activePanel, setActivePanel] = useState<BuilderPanel>('builder');
  const [activeSidebarTab, setActiveSidebarTab] = useState<LeftSidebarTab>('library');
  const [previewDevice, setPreviewDevice] = useState<PreviewDevice>('laptop');
  const [builderSectionsState, _setBuilderSections] = useState<BuilderSection[]>([]);
  const [history, setHistory] = useState<BuilderSection[][]>([]);
  const [redoStack, setRedoStack] = useState<BuilderSection[][]>([]);
  
  const [selectedSection, setSelectedSection] = useState<BuilderSection | null>(null);
  const [activePresetCategory, setActivePresetCategory] = useState('All');
  const [activeBlockCategory, setActiveBlockCategory] = useState('All');
  const [presetSearch, setPresetSearch] = useState('');
  const [blockSearch, setBlockSearch] = useState('');
  const [draggedSectionIdx, setDraggedSectionIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [savedTemplates, setSavedTemplates] = useState<any[]>([]);
  const [saveTemplateModal, setSaveTemplateModal] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [showDesigner, setShowDesigner] = useState(false);
  const [designerInitialElements, setDesignerInitialElements] = useState<any[] | undefined>(undefined);
  const [designerSectionId, setDesignerSectionId] = useState<string | undefined>(undefined);
  const [sectionCtxMenu, setSectionCtxMenu] = useState<{ x: number; y: number; sec: BuilderSection } | null>(null);

  // ── Convert a BuilderSection into DesignerElement[] for Advanced Designer ──
  const sectionToElements = (sec: BuilderSection): any[] => {
    if (sec.customElements && sec.customElements.length > 0) {
      return sec.customElements;
    }
    const W = 960, els: any[] = [];
    let zIdx = 1;
    const gid = (t: string) => `${t}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const defAnim = () => ({ type: 'none', duration: 0.5, delay: 0, loop: false, direction: 'normal' });
    const defStyle = () => ({ opacity: 1 });

    // 1. Background container
    const bgGrad = sec.background?.type === 'gradient' ? sec.background.value
      : sec.background?.type === 'solid' ? undefined : undefined;
    const bgColor = sec.background?.type === 'solid' ? sec.background.value
      : sec.background?.type === 'glass' ? 'rgba(255,255,255,0.06)'
      : 'rgba(20,20,20,0.8)';
    els.push({
      id: gid('container'), type: 'container', name: `${sec.title} — Background`,
      x: 0, y: 0, width: W, height: 320,
      rotation: 0, zIndex: zIdx++, locked: false, hidden: false,
      elStyle: defStyle(), animation: defAnim(),
      container: {
        bgColor, bgGradient: bgGrad, borderRadius: 12,
        border: sec.borderStyle !== 'none' ? 'solid' : 'none',
        borderColor: sec.borderColor || 'rgba(255,255,255,0.1)',
        borderWidth: sec.borderStyle !== 'none' ? 1 : 0,
        boxShadow: '0 8px 32px rgba(43, 34, 26, 0.1)', padding: 24,
      },
    });

    // 2. Title text
    if (sec.title) {
      els.push({
        id: gid('text'), type: 'text', name: 'Section Title',
        x: 28, y: 28, width: 520, height: 44,
        rotation: 0, zIndex: zIdx++, locked: false, hidden: false,
        elStyle: defStyle(), animation: defAnim(),
        text: {
          content: sec.title, fontFamily: 'Outfit', fontSize: 26, fontWeight: 900,
          color: '#221a15', letterSpacing: 0, lineHeight: 1.2,
          textAlign: 'left', italic: false, underline: false, uppercase: false,
        },
      });
    }

    // 3. Subtitle text
    if (sec.subtitle) {
      els.push({
        id: gid('text'), type: 'text', name: 'Subtitle',
        x: 28, y: 82, width: 480, height: 30,
        rotation: 0, zIndex: zIdx++, locked: false, hidden: false,
        elStyle: defStyle(), animation: defAnim(),
        text: {
          content: sec.subtitle, fontFamily: 'Inter', fontSize: 13, fontWeight: 400,
          color: '#888888', letterSpacing: 0, lineHeight: 1.5,
          textAlign: 'left', italic: false, underline: false, uppercase: false,
        },
      });
    }

    // 4. Custom image (if present)
    if (sec.customImage) {
      els.push({
        id: gid('image'), type: 'image', name: 'Section Image',
        x: sec.subtitle ? 600 : 580, y: 24, width: 320, height: 200,
        rotation: 0, zIndex: zIdx++, locked: false, hidden: false,
        elStyle: defStyle(), animation: defAnim(),
        image: {
          src: sec.customImage, alt: sec.title, objectFit: 'cover',
          borderRadius: 10, opacity: 1, grayscale: 0, blur: 0, brightness: 100,
        },
      });
    }

    // 5. CTA Button (if present)
    if (sec.buttonText) {
      els.push({
        id: gid('button'), type: 'button', name: 'CTA Button',
        x: 28, y: sec.subtitle ? 132 : 90, width: 160, height: 40,
        rotation: 0, zIndex: zIdx++, locked: false, hidden: false,
        elStyle: defStyle(), animation: defAnim(),
        button: {
          label: sec.buttonText, href: sec.targetUrl || '#',
          bgColor: '#b08850', textColor: '#000000',
          borderRadius: 20, fontSize: 12, fontWeight: 700, fontFamily: 'Inter',
          paddingX: 20, paddingY: 10,
        },
      });
    }

    // 6. Audience badge (if not 'all')
    if (sec.audience && sec.audience !== 'all') {
      els.push({
        id: gid('badge'), type: 'badge', name: 'Audience Badge',
        x: 28, y: sec.buttonText ? (sec.subtitle ? 184 : 142) : (sec.subtitle ? 132 : 90),
        width: sec.audience === 'premium' ? 88 : 68, height: 22,
        rotation: 0, zIndex: zIdx++, locked: false, hidden: false,
        elStyle: defStyle(), animation: defAnim(),
        badge: {
          label: sec.audience === 'premium' ? '⭐ Premium' : '🆓 Free',
          bgColor: sec.audience === 'premium' ? '#f59e0b' : '#10b981',
          textColor: '#000000', borderRadius: 11, fontSize: 9,
        },
      });
    }

    // 7. Layout info badge (top right)
    els.push({
      id: gid('badge'), type: 'badge', name: 'Layout Type',
      x: W - 120, y: 28, width: 92, height: 20,
      rotation: 0, zIndex: zIdx++, locked: false, hidden: false,
      elStyle: { opacity: 0.7 }, animation: defAnim(),
      badge: {
        label: sec.layout.replace(/_/g, ' ').toUpperCase(),
        bgColor: 'rgba(255,255,255,0.1)', textColor: '#aaaaaa',
        borderRadius: 10, fontSize: 7,
      },
    });

    return els;
  };

  // Expandable Inspector Sections state
  const [expandedSection, setExpandedSection] = useState<'info' | 'design' | 'background' | 'special' | 'slider'>('info');

  // AI Panel State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiResult, setAiResult] = useState<HomepagePreset | null>(null);
  const [aiHistory, setAiHistory] = useState<{ prompt: string; presetId: string }[]>([]);

  // ML Panel State
  const [moodProfile, setMoodProfile] = useState<MoodProfile | null>(null);
  const [insightCards, setInsightCards] = useState<InsightCard[]>([]);
  const [timelineData, setTimelineData] = useState<any[]>([]);
  const [emotionData, setEmotionData] = useState<EmotionDataPoint[]>([]);
  const [personalityScore, setPersonalityScore] = useState<any>(null);

  // Section Settings Form Inputs
  const [settTitle, setSettTitle] = useState('');
  const [settSubtitle, setSettSubtitle] = useState('');
  const [settLayout, setSettLayout] = useState<SectionConfig['layout']>('grid');
  const [settBgType, setSettBgType] = useState<SectionConfig['background']['type']>('none');
  const [settBgValue, setSettBgValue] = useState('');
  const [settAnimation, setSettAnimation] = useState<SectionConfig['animation']>('fade');
  const [settBorder, setSettBorder] = useState<SectionConfig['borderStyle']>('none');
  const [settBorderColor, setSettBorderColor] = useState('#b08850');
  const [settAudience, setSettAudience] = useState<'all' | 'premium' | 'free'>('all');
  const [settPadding, setSettPadding] = useState<SectionConfig['padding']>('md');
  const [settStartDate, setSettStartDate] = useState('');
  const [settEndDate, setSettEndDate] = useState('');
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
  const [settTargetPlaylistId, setSettTargetPlaylistId] = useState('');
  const [settAutoPlaylist, setSettAutoPlaylist] = useState(false);
  const [copiedFormat, setCopiedFormat] = useState<Partial<BuilderSection> | null>(null);

  // Set builder state with history
  const setBuilderSections = (newSections: BuilderSection[] | ((prev: BuilderSection[]) => BuilderSection[])) => {
    _setBuilderSections(prev => {
      const next = typeof newSections === 'function' ? newSections(prev) : newSections;
      if (JSON.stringify(prev) !== JSON.stringify(next)) {
        setHistory(h => [...h, prev].slice(-50));
        setRedoStack([]);
      }
      return next;
    });
  };
  const builderSections = builderSectionsState;

  // Undo & Redo handlers
  const undo = () => {
    setHistory(h => {
      if (h.length === 0) {
        toast('Nothing to undo', { icon: '↩️' });
        return h;
      }
      const prev = h[h.length - 1];
      _setBuilderSections(current => {
        setRedoStack(r => [...r, current].slice(-50));
        return prev;
      });
      toast.success('Undo successful', { icon: '↩️' });
      return h.slice(0, -1);
    });
  };

  const redo = () => {
    setRedoStack(r => {
      if (r.length === 0) {
        toast('Nothing to redo', { icon: '↪️' });
        return r;
      }
      const next = r[r.length - 1];
      _setBuilderSections(current => {
        setHistory(h => [...h, current].slice(-50));
        return next;
      });
      toast.success('Redo successful', { icon: '↪️' });
      return r.slice(0, -1);
    });
  };

  // Keyboard listeners for undo/redo
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ML Analysis Hook
  useEffect(() => {
    const likedIds = user?.likedSongs || [];
    const recentCount = recentlyPlayed.length;
    const profile = analyzeMood(genreScores, likedIds, recentCount);
    setMoodProfile(profile);
    setInsightCards(getInsightCards(profile, likedIds.length, recentCount));
    setTimelineData(getMoodTimeline(genreScores));
    setEmotionData(getEmotionRadar(profile));
    setPersonalityScore(getPersonalityScore(profile, likedIds.length));
  }, [genreScores, user, recentlyPlayed]);

  // Load layout from backend
  useEffect(() => {
    fetch('/api/admin/homepage-builder')
      .then(r => r.json())
      .then(d => {
        if (d.savedTemplates) setSavedTemplates(d.savedTemplates);
        
        const DEFAULT_LAYOUT_ORDER = [
          "quick_access", "liked_songs", "search_hashtag_slides", "made_for_you", 
          "search_ad_banner", "search_genre_tiles", "hero_banner", "recently_played"
        ];
        
        const defaultNames: Record<string, string> = {
          quick_access: '⚡ Quick Access Greeting',
          liked_songs: '♥ Liked Songs List',
          search_hashtag_slides: '✨ Discover Something New (Hashtags)',
          made_for_you: '🤖 Made For You Recommendations',
          search_ad_banner: '📢 ADVERTISEMENT (ICICI LOMBARD)',
          search_genre_tiles: '🧭 Start Browsing (Genre Tiles)',
          hero_banner: '💎 Beato Special Hero',
          recently_played: '⏱ Recently Played Tracks'
        };

        const defaultLayouts: Record<string, string> = {
          quick_access: 'minimal_quick_access',
          liked_songs: 'list',
          search_hashtag_slides: 'hashtag_slides',
          made_for_you: 'carousel',
          search_ad_banner: 'ad_break_banner',
          search_genre_tiles: 'genre_tiles',
          hero_banner: 'hero',
          recently_played: 'carousel'
        };

        const defaultSources: Record<string, string> = {
          quick_access: 'recently_played',
          liked_songs: 'liked',
          search_hashtag_slides: 'mood',
          made_for_you: 'recommended',
          search_ad_banner: 'custom',
          search_genre_tiles: 'genre',
          hero_banner: 'made_for_you',
          recently_played: 'recently_played'
        };
        
        const layoutOrder = (d.homeLayoutOrder && d.homeLayoutOrder.length > 0) ? d.homeLayoutOrder : DEFAULT_LAYOUT_ORDER;
        const customSections = d.customSections || {};
        
        const initialSections = layoutOrder.map((id: string) => {
          return customSections[id] || { 
            id, 
            title: defaultNames[id] || id,
            type: id,
            layout: defaultLayouts[id] || 'grid',
            contentSource: defaultSources[id] || 'recommended',
            background: { type: 'none', value: '' },
            animation: 'fade',
            borderStyle: 'none',
            padding: 'md',
            visible: true,
            audience: 'all',
            hidden: false
          };
        });
        
        _setBuilderSections(initialSections);
      })
      .catch(() => {});
  }, []);

  // Presets applicator
  const applyPreset = useCallback((preset: HomepagePreset) => {
    setBuilderSections(preset.sections.map(s => ({ ...s, hidden: false })));
    setSelectedSection(null);
    setIsDirty(true);
    toast.success(`Preset layout applied!`);
  }, []);

  // Add block from library
  const addBlock = useCallback((block: BlockDef) => {
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
    };
    setBuilderSections(prev => [...prev, newSec]);
    setIsDirty(true);
    toast.success(`"${block.label}" added to homepage!`);
  }, []);

  // Select section for editing
  const selectSection = (sec: BuilderSection) => {
    setSelectedSection(sec);
    setSettTitle(sec.title);
    setSettSubtitle(sec.subtitle || '');
    setSettLayout(sec.layout);
    setSettBgType(sec.background?.type || 'none');
    setSettBgValue(sec.background?.value || '');
    setSettAnimation(sec.animation || 'fade');
    setSettBorder(sec.borderStyle || 'none');
    setSettBorderColor(sec.borderColor || '#b08850');
    setSettAudience(sec.audience || 'all');
    setSettPadding(sec.padding || 'md');
    setSettStartDate(sec.startDate || '');
    setSettEndDate(sec.endDate || '');
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
    setSettTargetPlaylistId(sec.targetPlaylistId || sec.targetId || '');
    setSettAutoPlaylist(!!sec.autoPlaylist);
  };

  // Save advanced designer elements back to builder layout state
  const saveDesignerElementsToSection = useCallback((sectionId: string, elements: any[]) => {
    let updatedSec: BuilderSection | null = null;
    
    setBuilderSections(prev => prev.map(sec => {
      if (sec.id !== sectionId) return sec;
      
      const updated = { ...sec };
      
      // 1. Title
      const titleEl = elements.find(el => el.type === 'text' && el.name === 'Section Title');
      if (titleEl && titleEl.text) {
        updated.title = titleEl.text.content;
      }
      
      // 2. Subtitle
      const subtitleEl = elements.find(el => el.type === 'text' && el.name === 'Subtitle');
      if (subtitleEl && subtitleEl.text) {
        updated.subtitle = subtitleEl.text.content;
      }
      
      // 3. Background Container
      const bgEl = elements.find(el => el.type === 'container' && el.name.includes('Background'));
      if (bgEl && bgEl.container) {
        if (bgEl.container.bgGradient) {
          updated.background = { type: 'gradient', value: bgEl.container.bgGradient };
        } else if (bgEl.container.bgColor) {
          const val = bgEl.container.bgColor;
          const type = val.includes('rgba') ? 'glass' : 'solid';
          updated.background = { type, value: val };
        }
        if (bgEl.container.border === 'solid') {
          updated.borderStyle = 'solid';
          updated.borderColor = bgEl.container.borderColor;
        } else {
          updated.borderStyle = 'none';
        }
      }
      
      // 4. Custom Image
      const imgEl = elements.find(el => el.type === 'image' && el.name === 'Section Image');
      if (imgEl && imgEl.image) {
        updated.customImage = imgEl.image.src;
      }
      
      // 5. CTA Button
      const btnEl = elements.find(el => el.type === 'button' && el.name === 'CTA Button');
      if (btnEl && btnEl.button) {
        updated.buttonText = btnEl.button.label;
        updated.targetUrl = btnEl.button.href;
      }
      
      // 6. Audience Badge
      const audEl = elements.find(el => el.type === 'badge' && el.name === 'Audience Badge');
      if (audEl && audEl.badge) {
        if (audEl.badge.label.includes('Premium')) {
          updated.audience = 'premium';
        } else if (audEl.badge.label.includes('Free')) {
          updated.audience = 'free';
        } else {
          updated.audience = 'all';
        }
      }
      
      // Save custom elements array directly
      updated.customElements = elements;
      
      updatedSec = updated;
      return updated;
    }));
    
    if (updatedSec) {
      selectSection(updatedSec);
    }
    
    setIsDirty(true);
  }, []);

  // Update selected section property in real-time
  const updateSelectedSectionProp = useCallback((propName: string, value: any) => {
    if (!selectedSection) return;
    setSelectedSection(prev => {
      if (!prev) return null;
      if (propName === 'backgroundType') {
        return { ...prev, background: { ...prev.background, type: value } };
      }
      if (propName === 'backgroundValue') {
        return { ...prev, background: { ...prev.background, value: value } };
      }
      return { ...prev, [propName]: value };
    });

    setBuilderSections(prevSections => prevSections.map(s => {
      if (s.id !== selectedSection.id) return s;
      if (propName === 'backgroundType') {
        return { ...s, background: { ...s.background, type: value } };
      }
      if (propName === 'backgroundValue') {
        return { ...s, background: { ...s.background, value: value } };
      }
      return { ...s, [propName]: value };
    }));
    setIsDirty(true);
  }, [selectedSection]);

  // Manually create a new custom empty section
  const createCustomSection = () => {
    const newId = `sec_custom_${Date.now()}`;
    const newSec: BuilderSection = {
      id: newId,
      type: 'custom_songs',
      title: 'New Custom Section',
      subtitle: 'Custom songs list',
      layout: 'grid',
      contentSource: 'custom',
      background: { type: 'none', value: '' },
      animation: 'fade',
      borderStyle: 'none',
      padding: 'md',
      visible: true,
      audience: 'all',
      hidden: false,
    };
    setBuilderSections(prev => [...prev, newSec]);
    setIsDirty(true);
    selectSection(newSec);
    toast.success('Custom section created!');
  };

  // Update section settings
  const applySettings = useCallback(() => {
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
        startDate: settStartDate || undefined,
        endDate: settEndDate || undefined,
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
      } : s
    ));
    setIsDirty(true);
    toast.success('Properties updated!');
  }, [
    selectedSection, settTitle, settSubtitle, settLayout, settBgType, settBgValue,
    settAnimation, settBorder, settBorderColor, settAudience, settPadding, settStartDate,
    settEndDate, settCardSize, settCardStyle, settCardShape, settCardWidth, settCardHeight,
    settCustomImage, settCustomVideo, settMediaType, settSponsorName, settButtonText, settTargetUrl, settHashtags, settGenresList
  ]);

  // Drag & drop handlers
  const handleDragStart = (e: React.DragEvent, idx: number) => {
    setDraggedSectionIdx(idx);
    if (e.dataTransfer) e.dataTransfer.effectAllowed = 'move';
  };

  const handleBlockDragStart = (e: React.DragEvent, blockId: string) => {
    if (e.dataTransfer) {
      e.dataTransfer.effectAllowed = 'copy';
      e.dataTransfer.setData('application/beato-block', blockId);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverIdx(null);

    const blockId = e.dataTransfer?.getData('application/beato-block');
    if (blockId) {
      const block = SECTION_BLOCKS.find(b => b.id === blockId);
      if (block) {
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
        };
        setBuilderSections(prev => {
          const newSecs = [...prev];
          newSecs.splice(idx, 0, newSec);
          return newSecs;
        });
        setIsDirty(true);
        toast.success(`Inserted "${block.label}" here!`);
      }
      return;
    }

    if (draggedSectionIdx === null || draggedSectionIdx === idx) return;
    setBuilderSections(prev => {
      const newSecs = [...prev];
      const draggedItem = newSecs[draggedSectionIdx];
      newSecs.splice(draggedSectionIdx, 1);
      newSecs.splice(idx, 0, draggedItem);
      return newSecs;
    });
    setDraggedSectionIdx(null);
    setIsDirty(true);
    toast.success('Section reordered!');
  };

  const handleCanvasContainerDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverIdx(null);
    const blockId = e.dataTransfer?.getData('application/beato-block');
    if (blockId) {
      const block = SECTION_BLOCKS.find(b => b.id === blockId);
      if (block) {
        addBlock(block);
      }
    }
  };

  const handleDragEnd = () => {
    setDraggedSectionIdx(null);
    setDragOverIdx(null);
  };

  // Quick actions
  const duplicateSection = (sec: BuilderSection) => {
    const copy = { ...sec, id: `${sec.id}_copy_${Date.now()}`, title: `${sec.title} (Copy)` };
    setBuilderSections(prev => {
      const idx = prev.findIndex(s => s.id === sec.id);
      const newList = [...prev];
      newList.splice(idx + 1, 0, copy);
      return newList;
    });
    setIsDirty(true);
    toast.success('Section duplicated!');
  };

  const deleteSection = (id: string) => {
    setBuilderSections(prev => prev.filter(s => s.id !== id));
    if (selectedSection?.id === id) setSelectedSection(null);
    setIsDirty(true);
    toast.success('Section deleted');
  };

  const toggleHidden = (id: string) => {
    setBuilderSections(prev => prev.map(s => s.id === id ? { ...s, hidden: !s.hidden } : s));
    setIsDirty(true);
  };

  const toggleHiddenDevice = (id: string, device: 'laptop' | 'mobile') => {
    setBuilderSections(prev => prev.map(s => {
      if (s.id !== id) return s;
      if (device === 'laptop') return { ...s, hiddenOnLaptop: !s.hiddenOnLaptop };
      return { ...s, hiddenOnMobile: !s.hiddenOnMobile };
    }));
    setIsDirty(true);
  };

  const moveSection = (idx: number, dir: 'up' | 'down') => {
    const newIdx = dir === 'up' ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= builderSections.length) return;
    setBuilderSections(prev => {
      const list = [...prev];
      const item = list[idx];
      list.splice(idx, 1);
      list.splice(newIdx, 0, item);
      return list;
    });
    setIsDirty(true);
  };

  const copySectionFormat = (sec: BuilderSection) => {
    setCopiedFormat({
      layout: sec.layout,
      background: sec.background,
      animation: sec.animation,
      borderStyle: sec.borderStyle,
      borderColor: sec.borderColor,
      padding: sec.padding,
      cardSize: sec.cardSize,
      cardStyle: sec.cardStyle,
      cardShape: sec.cardShape,
      cardWidth: sec.cardWidth,
      cardHeight: sec.cardHeight,
      customImage: sec.customImage,
    });
    toast.success('Style copied!');
  };

  const pasteSectionFormat = (secId: string) => {
    if (!copiedFormat) return;
    setBuilderSections(prev => prev.map(s => s.id === secId ? { ...s, ...copiedFormat } : s));
    setIsDirty(true);
    toast.success('Style pasted!');
  };

  // AI Generator
  const runAiGenerate = async () => {
    if (!aiPrompt.trim()) { toast.error('Enter prompt!'); return; }
    setAiGenerating(true);
    await new Promise(r => setTimeout(r, 1200));
    const presetId = promptToPresetId(aiPrompt);
    const preset = getPresetById(presetId);
    if (preset) {
      setAiResult(preset);
      setAiHistory(prev => [{ prompt: aiPrompt, presetId }, ...prev.slice(0, 9)]);
      toast.success('Layout preset generated!');
    }
    setAiGenerating(false);
  };

  // Publish Configuration to Database File
  const publishLayout = async () => {
    if (builderSections.length === 0) { toast.error('Add sections first!'); return; }
    setIsPublishing(true);
    try {
      const customSections: Record<string, any> = {};
      const homeLayoutOrder: string[] = [];

      builderSections.filter(s => !s.hidden).forEach(sec => {
        const sectionId = sec.id;
        homeLayoutOrder.push(sectionId);
        
        const isQuickType = sec.type === 'quick_access' || sec.type === 'quick' || sec.id.includes('quick_access');
        
        customSections[sectionId] = {
          ...sec,
          type: isQuickType ? 'quick_access'
            : sec.type === 'liked_songs_banner' ? 'liked_songs_banner'
            : sec.type === 'liked_songs' ? 'liked_songs'
            : sec.type === 'playlist_showcase' || (sec.layout as string) === 'playlist_showcase' ? 'playlist_showcase'
            : sec.contentSource === 'trending' ? 'custom_songs'
            : sec.contentSource === 'new_releases' ? 'custom_songs'
            : sec.contentSource === 'playlist' ? 'playlist'
            : sec.contentSource === 'album' ? 'album'
            : 'custom_songs',
          bgStyle: sec.background?.type !== 'none' ? sec.background?.type : 'default',
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
        }),
      });
      const data = await res.json();
      if (data.success) {
        setIsDirty(false);
        toast.success('🚀 Live Homepage published successfully!');
      } else {
        toast.error('Publish failed');
      }
    } catch {
      toast.error('Publish error');
    }
    setIsPublishing(false);
  };

  // Save Template
  const saveAsTemplate = async () => {
    if (!templateName.trim()) { toast.error('Enter template name'); return; }
    const homeLayoutOrder = builderSections.map(s => s.id);
    const customSections: Record<string, any> = {};
    builderSections.forEach(s => {
      customSections[s.id] = {
        ...s,
        bgStyle: s.background?.type !== 'none' ? s.background?.type : 'default',
        borderStyle: s.borderStyle !== 'none' ? s.borderStyle : 'none',
      };
    });
    try {
      const res = await fetch('/api/admin/homepage-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_template', name: templateName, homeLayoutOrder, customSections }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.isUpdate) {
          setSavedTemplates(prev => prev.map(t => t.id === data.template.id ? data.template : t));
        } else {
          setSavedTemplates(prev => [data.template, ...prev]);
        }
        setSaveTemplateModal(false);
        setTemplateName('');
        toast.success('Template saved!');
      }
    } catch { toast.error('Failed to save template'); }
  };

  // Import JSON Layout
  const importLayout = async () => {
    try {
      const layout = JSON.parse(importJson);
      const res = await fetch('/api/admin/homepage-builder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'import', layout }),
      });
      const data = await res.json();
      if (data.success) {
        if (layout.homeLayoutOrder && layout.customSections) {
          setBuilderSections(layout.homeLayoutOrder.map((id: string) => layout.customSections[id] || { id, title: 'Imported block' }));
        }
        setImportModalOpen(false);
        setImportJson('');
        toast.success('Layout imported!');
      }
    } catch { toast.error('Invalid JSON syntax'); }
  };

  // Export JSON file
  const exportJson = () => {
    const layout = {
      homeLayoutOrder: builderSections.map(s => s.id),
      customSections: Object.fromEntries(builderSections.map(s => [s.id, {
        ...s,
        bgStyle: s.background?.type !== 'none' ? s.background?.type : 'default',
        borderStyle: s.borderStyle !== 'none' ? s.borderStyle : 'none',
      }])),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(layout, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'beato-homepage-design.json';
    a.click();
    toast.success('Layout exported!');
  };

  // Filter lists
  const filteredBlocks = SECTION_BLOCKS.filter(b => {
    const matchCat = activeBlockCategory === 'All' || b.category === activeBlockCategory;
    const matchSearch = !blockSearch || b.label.toLowerCase().includes(blockSearch.toLowerCase()) || b.description.toLowerCase().includes(blockSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredPresets = HOMEPAGE_PRESETS.filter(p => {
    const matchCat = activePresetCategory === 'All' || p.category === activePresetCategory;
    const matchSearch = !presetSearch || p.name.toLowerCase().includes(presetSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  const tracksList = mockTracks.slice(0, 10);

  // ── Rendering Section Layout for Preview ───────────────────────────────────────
  const renderMockSection = (sec: BuilderSection, isLaptopMode: boolean) => {
    if (sec.customElements && sec.customElements.length > 0) {
      // Scale coordinates from canvas space (960px width) to preview space
      const scale = isLaptopMode ? (860 / 960) : (306 / 960);
      const containerH = 320 * scale;
      
      const D = {
        primary: '#b08850',
        border: '#242424',
        text: '#ffffff',
        muted: '#606060',
        sel: '#10b981',
      };
      
      const ShapeSVGSimple = ({ el, dw, dh }: any) => {
        if (!el.shape) return null;
        const { kind, fill, fillGradient, stroke, strokeWidth, borderRadius, points = 5, opacity } = el.shape;
        const w = dw; const h = dh;
        const gradId = `grad_prev_${el.id}`;

        const gradDef = fillGradient ? (
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              {fillGradient.split(',').map((c: string, i: number, arr: any[]) => (
                <stop key={i} offset={`${(i / Math.max(arr.length - 1, 1)) * 100}%`} stopColor={c.trim()} />
              ))}
            </linearGradient>
          </defs>
        ) : null;

        const fillVal = fillGradient ? `url(#${gradId})` : fill;
        const sw = strokeWidth || 0;
        const cp = { fill: fillVal, stroke, strokeWidth: sw, opacity };

        if (kind === 'line') return <svg width={w} height={h}><line x1={0} y1={h / 2} x2={w} y2={h / 2} stroke={stroke || fill} strokeWidth={sw || 2} /></svg>;
        if (kind === 'circle') return <svg width={w} height={h}>{gradDef}<ellipse cx={w / 2} cy={h / 2} rx={w / 2 - sw / 2} ry={h / 2 - sw / 2} {...cp} /></svg>;
        if (kind === 'triangle') {
          const pts = `${w / 2},${sw} ${w - sw},${h - sw} ${sw},${h - sw}`;
          return <svg width={w} height={h}>{gradDef}<polygon points={pts} {...cp} /></svg>;
        }
        if (kind === 'diamond') {
          const pts = `${w / 2},${sw} ${w - sw},${h / 2} ${w / 2},${h - sw} ${sw},${h / 2}`;
          return <svg width={w} height={h}>{gradDef}<polygon points={pts} {...cp} /></svg>;
        }
        if (kind === 'arrow') {
          const pts = `${w * 0.1},${h * 0.35} ${w * 0.6},${h * 0.35} ${w * 0.6},${h * 0.1} ${w * 0.95},${h * 0.5} ${w * 0.6},${h * 0.9} ${w * 0.6},${h * 0.65} ${w * 0.1},${h * 0.65}`;
          return <svg width={w} height={h}>{gradDef}<polygon points={pts} {...cp} /></svg>;
        }
        if (kind === 'star') {
          const cx = w / 2; const cy = h / 2;
          const outerR = Math.min(w, h) / 2 - sw; const innerR = outerR * 0.38;
          const n = points;
          let pts = '';
          for (let i = 0; i < n * 2; i++) {
            const angle = (i * Math.PI / n) - Math.PI / 2;
            const r = i % 2 === 0 ? outerR : innerR;
            pts += `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)} `;
          }
          return <svg width={w} height={h}>{gradDef}<polygon points={pts} {...cp} /></svg>;
        }
        if (kind === 'pentagon') {
          const cx = w / 2; const cy = h / 2; const r = Math.min(w, h) / 2 - sw;
          let pts = '';
          for (let i = 0; i < 5; i++) {
            const angle = (i * 2 * Math.PI / 5) - Math.PI / 2;
            pts += `${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)} `;
          }
          return <svg width={w} height={h}>{gradDef}<polygon points={pts} {...cp} /></svg>;
        }
        return <svg width={w} height={h}>{gradDef}<rect x={sw / 2} y={sw / 2} width={w - sw} height={h - sw} rx={borderRadius} {...cp} /></svg>;
      };

      const sorted = [...sec.customElements].sort((a, b) => a.zIndex - b.zIndex);

      return (
        <div style={{ position: 'relative', width: '100%', height: containerH, overflow: 'hidden', borderRadius: 8 }}>
          {sorted.map(el => {
            if (el.hidden) return null;
            
            const dispX = el.x * scale;
            const dispY = el.y * scale;
            const dispW = el.width * scale;
            const dispH = el.height * scale;

            return (
              <div key={el.id} style={{
                position: 'absolute',
                left: dispX, top: dispY,
                width: dispW, height: dispH,
                transform: `rotate(${el.rotation || 0}deg)`,
                zIndex: el.zIndex,
                opacity: el.elStyle?.opacity ?? 1,
                boxShadow: el.elStyle?.boxShadow || 'none',
                overflow: 'hidden',
              }}>
                {el.type === 'text' && el.text && (() => {
                  const t = el.text;
                  const ts = {
                    fontFamily: t.fontFamily,
                    fontSize: t.fontSize * scale,
                    fontWeight: t.fontWeight,
                    color: t.textGradient ? 'transparent' : t.color,
                    background: t.textGradient || undefined,
                    WebkitBackgroundClip: t.textGradient ? 'text' : undefined,
                    WebkitTextFillColor: t.textGradient ? 'transparent' : undefined,
                    textShadow: t.textShadow,
                    letterSpacing: `${t.letterSpacing}em`,
                    lineHeight: t.lineHeight,
                    textAlign: t.textAlign,
                    fontStyle: t.italic ? 'italic' : 'normal',
                    textDecoration: t.underline ? 'underline' : 'none',
                    textTransform: t.uppercase ? 'uppercase' : 'none',
                    width: '100%', height: '100%',
                    whiteSpace: 'pre-wrap', wordBreak: 'break-word',
                    margin: 0, padding: 4 * scale, boxSizing: 'border-box',
                  } as React.CSSProperties;
                  return <div style={ts}>{t.content}</div>;
                })()}

                {el.type === 'image' && el.image && (() => {
                  const img = el.image;
                  return (
                    <div style={{ width: '100%', height: '100%', borderRadius: img.borderRadius * scale, overflow: 'hidden' }}>
                      {img.src ? (
                        <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: img.objectFit, opacity: img.opacity, filter: `grayscale(${img.grayscale}%) blur(${img.blur}px) brightness(${img.brightness}%)` }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: D.muted }}>🖼️</div>
                      )}
                    </div>
                  );
                })()}

                {el.type === 'button' && el.button && (() => {
                  const b = el.button;
                  return (
                    <div style={{ width: '100%', height: '100%', background: b.bgColor, color: b.textColor, borderRadius: b.borderRadius * scale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: b.fontFamily, fontSize: b.fontSize * scale, fontWeight: b.fontWeight }}>
                      {b.label}
                    </div>
                  );
                })()}

                {el.type === 'shape' && (
                  <div style={{ width: '100%', height: '100%' }}>
                    <ShapeSVGSimple el={el} dw={dispW} dh={dispH} />
                  </div>
                )}

                {el.type === 'container' && el.container && (() => {
                  const c = el.container;
                  return <div style={{
                    width: '100%', height: '100%',
                    background: c.bgGradient || c.bgColor,
                    borderRadius: c.borderRadius * scale,
                    border: c.borderWidth > 0 ? `${c.borderWidth * scale}px ${c.border} ${c.borderColor}` : 'none',
                    boxShadow: c.boxShadow, overflow: 'hidden', boxSizing: 'border-box',
                  }} />;
                })()}

                {el.type === 'badge' && el.badge && (() => {
                  const b = el.badge;
                  return <div style={{ width: '100%', height: '100%', background: b.bgColor, color: b.textColor, borderRadius: b.borderRadius * scale, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: b.fontSize * scale, fontWeight: 800, fontFamily: 'Inter' }}>{b.label}</div>;
                })()}

                {el.type === 'divider' && <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.12)', borderRadius: 2 }} />}
              </div>
            );
          })}
        </div>
      );
    }

    const baseLayout = (sec.layout || 'grid').split('_')[0];
    const cSize = sec.cardSize || 'md';
    const cStyle = sec.cardStyle || 'classic';

    // Renders single card mockup with fallbacks
    const renderCard = (index: number) => {
      const track = tracksList[index % tracksList.length] || mockTracks[0];
      const customImg = sec.customImage || track.coverImage;

      const sizeStyles = {
        xs: { width: isLaptopMode ? 100 : 75, height: isLaptopMode ? 130 : 105, imgSize: isLaptopMode ? 70 : 50 },
        sm: { width: isLaptopMode ? 120 : 90, height: isLaptopMode ? 160 : 125, imgSize: isLaptopMode ? 90 : 65 },
        md: { width: isLaptopMode ? 150 : 110, height: isLaptopMode ? 200 : 155, imgSize: isLaptopMode ? 120 : 85 },
        lg: { width: isLaptopMode ? 180 : 130, height: isLaptopMode ? 240 : 185, imgSize: isLaptopMode ? 150 : 105 }
      }[cSize] || { width: 120, height: 160, imgSize: 90 };

      // Presets mapping
      const cardDesign = {
        classic: { background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 8, padding: 8 },
        glass: { background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: 8 },
        neo: { background: '#000', border: `1px solid ${C.primary}`, borderRadius: 0, padding: 8, boxShadow: `0 0 8px ${C.primary}30` },
        retro: { background: '#1e0b36', border: '2px solid #ff007f', borderRadius: 4, padding: 8, boxShadow: '3px 3px 0px #00f0ff' },
        gradient: { background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.4) 100%)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: 8 },
        none: { background: 'transparent', border: 'none', borderRadius: 0, padding: 0 }
      }[cStyle] || { background: 'transparent', border: 'none', borderRadius: 8, padding: 0 };

      const isCircle = sec.cardShape === 'circle';
      const isSquare = sec.cardShape === 'square';
      const isBanner = sec.cardShape?.startsWith('rectangle_banner');

      const activeCardDesign = isSquare ? {
        background: 'transparent',
        border: 'none',
        borderRadius: 0,
        padding: 0,
        boxShadow: 'none'
      } : cardDesign;

      const widthVal = isBanner 
        ? '100%' 
        : (baseLayout === 'carousel' 
            ? (isLaptopMode ? (sec.cardWidth || sizeStyles.width) : '120px') 
            : '100%');
      const heightVal = sec.cardHeight || 'auto';

      return (
        <div key={index} style={{
          width: isBanner ? '100%' : widthVal,
          height: heightVal,
          ...activeCardDesign,
          display: 'flex',
          flexDirection: isBanner ? 'row' : 'column',
          alignItems: isBanner ? 'center' : 'stretch',
          gap: isBanner ? 10 : 0,
          boxSizing: 'border-box',
          flexShrink: 0
        }}>
          <div style={{
            width: isBanner ? 44 : '100%',
            height: isBanner ? 44 : undefined,
            paddingTop: isBanner ? undefined : '100%',
            borderRadius: isCircle ? '50%' : (isSquare ? 0 : 6),
            overflow: 'hidden',
            flexShrink: 0,
            marginBottom: isBanner ? 0 : 8,
            position: 'relative'
          }}>
            <SafeImage src={customImg} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ width: '85%', height: 7, background: '#fff', opacity: 0.8, borderRadius: 2, marginBottom: 4, overflow: 'hidden' }} />
            <div style={{ width: '50%', height: 5, background: '#fff', opacity: 0.3, borderRadius: 2 }} />
          </div>
        </div>
      );
    };

    // 1. RENDER CASE: Quick Access grid
    if (sec.type === 'quick_access' || sec.type === 'quick' || (sec.layout as string) === 'minimal_quick_access') {
      const cols = isLaptopMode ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)';
      return (
        <div style={{ display: 'grid', gridTemplateColumns: cols, gap: 8 }}>
          {[
            { label: 'Liked Songs', color: 'linear-gradient(135deg, #4338ca, #60a5fa)', icon: '♥' },
            { label: 'Manoj', color: 'linear-gradient(135deg, #1e3a5f, #7c3aed)', icon: '👦' },
            { label: 'Manojjj', color: 'linear-gradient(135deg, #92400e, #dc2626)', icon: '👨' },
            { label: 'Mano', color: 'linear-gradient(135deg, #065f46, #0e7490)', icon: '🎵' },
            { label: 'Discover Weekly', color: 'linear-gradient(135deg, #5b21b6, #be185d)', icon: '✦' },
            { label: 'Daily Mix 1', color: 'linear-gradient(135deg, #1e40af, #4338ca)', icon: '★' }
          ].map((item, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', borderRadius: 8, background: 'rgba(255,255,255,0.06)', height: 42, overflow: 'hidden', minWidth: 0 }}>
              <div style={{ width: 42, height: 42, background: item.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{item.icon}</div>
              <span style={{ fontSize: 10, fontWeight: 800, color: '#221a15', padding: '0 10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{item.label}</span>
            </div>
          ))}
        </div>
      );
    }

    // 1.1 RENDER CASE: Liked Songs Banner
    const isLikedBanner = sec.type === 'liked_songs_banner' || 
                          (sec.type === 'liked_songs' && (sec.layout === 'banner' || sec.title?.includes('Banner')));
    if (isLikedBanner) {
      return (
        <div style={{
          marginBottom: 0,
          borderRadius: 18,
          padding: '20px 24px',
          background: 'linear-gradient(135deg, rgba(67,56,202,0.3), rgba(96,165,250,0.15))',
          border: '1px solid rgba(67,56,202,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{
              width: 52, height: 52, borderRadius: 10,
              background: 'linear-gradient(135deg, #4338ca, #60a5fa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <span style={{ fontSize: 22, color: 'white' }}>♥</span>
            </div>
            <div>
              <h2 style={{ color: '#221a15', fontSize: 18, fontWeight: 800, margin: 0, fontFamily: 'Outfit, sans-serif' }}>Liked Songs</h2>
              <p style={{ color: '#aaa', fontSize: 13, margin: '2px 0 0 0' }}>1 song you love</p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{
              width: 42, height: 42, borderRadius: '50%', background: C.primary,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(176, 136, 80,0.3)'
            }}>
              <span style={{ color: '#000', fontSize: 16, fontWeight: 900, marginLeft: 2 }}>▶</span>
            </div>
            <span style={{ color: '#221a15', fontSize: 12, fontWeight: 700, opacity: 0.7 }}>View all →</span>
          </div>
        </div>
      );
    }

    // 1.2 stories layout (Instagram-style Stories)
    if (sec.layout === 'story') {
      const items = sec.songIds && sec.songIds.length > 0 ? sec.songIds : mockTracks.slice(0, isLaptopMode ? 7 : 5).map(t => t.id);
      return (
        <div style={{ display: 'flex', gap: isLaptopMode ? 14 : 10, overflowX: 'auto', paddingBottom: 6 }} className="no-scrollbar">
          {items.map((sid, i) => {
            const track = mockTracks.find(t => t.id === sid);
            const coverImg = sec.customImage || track?.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=150&h=150&fit=crop`;
            const size = isLaptopMode ? 72 : 54;
            return (
              <div key={i} style={{ flexShrink: 0, width: isLaptopMode ? 80 : 62, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{
                  width: size,
                  height: size,
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
                <span style={{ fontSize: isLaptopMode ? 9.5 : 7.5, color: '#221a15', fontWeight: 700, marginTop: 4, width: '100%', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track?.title || 'Story'}
                </span>
              </div>
            );
          })}
        </div>
      );
    }

    // 1.2 TikTok-style full screen vertical mockup
    if (sec.layout === 'story_tiktok') {
      const items = sec.songIds && sec.songIds.length > 0 ? sec.songIds : mockTracks.slice(0, isLaptopMode ? 4 : 3).map(t => t.id);
      return (
        <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 6 }} className="no-scrollbar">
          {items.map((sid, i) => {
            const track = mockTracks.find(t => t.id === sid);
            const coverImg = sec.customImage || track?.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=200&h=300&fit=crop`;
            const width = isLaptopMode ? 170 : 130;
            const height = isLaptopMode ? 260 : 200;
            return (
              <div key={i} style={{
                flexShrink: 0,
                width: width,
                height: height,
                borderRadius: 12,
                backgroundImage: `url(${coverImg})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                position: 'relative',
                overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.08)',
                boxShadow: '0 6px 16px rgba(43, 34, 26, 0.08)'
              }}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 60%, transparent 100%)', zIndex: 1 }} />
                
                <div style={{ position: 'absolute', right: 8, bottom: isLaptopMode ? 45 : 35, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: isLaptopMode ? 12 : 10, zIndex: 2 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', border: '1px solid #fff', overflow: 'hidden', background: 'rgba(43,34,26,0.1)' }}>
                    <img src={coverImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ fontSize: isLaptopMode ? 11 : 9, color: '#221a15' }}>❤️</span>
                  <span style={{ fontSize: isLaptopMode ? 11 : 9, color: '#221a15' }}>💬</span>
                  <span style={{ fontSize: isLaptopMode ? 11 : 9, color: '#221a15' }}>📤</span>
                </div>

                <div className="spinning-disc-mock" style={{
                  position: 'absolute',
                  right: 8,
                  bottom: 8,
                  width: 18,
                  height: 18,
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '2px dashed #444',
                  zIndex: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  animation: 'spin 3s linear infinite'
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: C.primary }} />
                </div>

                <div style={{ position: 'absolute', bottom: 8, left: 8, right: 30, zIndex: 2 }}>
                  <div style={{ fontSize: isLaptopMode ? 11 : 9.5, fontWeight: 900, color: '#221a15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>@{track?.artistName || 'artist'}</div>
                  <div style={{ fontSize: isLaptopMode ? 9.5 : 8, color: '#ddd', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 1 }}>🎵 {track?.title || 'Song title'}</div>
                </div>
              </div>
            );
          })}
        </div>
      );
    }

    // 1.3 3D Cover Flow layout
    if (sec.layout === 'carousel_coverflow') {
      const items = sec.songIds && sec.songIds.length > 0 ? sec.songIds : mockTracks.slice(0, 3).map(t => t.id);
      return (
        <div style={{ display: 'flex', gap: 0, overflowX: 'auto', padding: '10px 0', alignItems: 'center', justifyContent: 'center' }} className="no-scrollbar">
          {items.map((sid, i) => {
            const track = mockTracks.find(t => t.id === sid);
            const coverImg = sec.customImage || track?.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=150&h=150&fit=crop`;
            const isCenter = i === 1;
            const centerSize = isLaptopMode ? 140 : 90;
            const sideSize = isLaptopMode ? 100 : 70;
            return (
              <div key={i} style={{
                flexShrink: 0,
                width: isCenter ? centerSize : sideSize,
                height: isCenter ? centerSize : sideSize,
                margin: isLaptopMode ? '0 -15px' : '0 -8px',
                zIndex: isCenter ? 3 : 1,
                transition: 'all 0.3s ease',
                transform: isCenter ? 'scale(1.1)' : `scale(0.85) perspective(100px) rotateY(${i === 0 ? '8deg' : '-8deg'})`,
                borderRadius: 8,
                overflow: 'hidden',
                boxShadow: isCenter ? '0 8px 20px rgba(0,0,0,0.6)' : '0 4px 10px rgba(0,0,0,0.4)',
                border: isCenter ? `1.5px solid ${C.primary}` : '1px solid rgba(255,255,255,0.06)'
              }}>
                <img src={coverImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </div>
            );
          })}
        </div>
      );
    }

    // 1.4 Apple Music-style Album Grid
    if (sec.layout === 'grid_apple') {
      const items = sec.songIds && sec.songIds.length > 0 ? sec.songIds.slice(0, isLaptopMode ? 8 : 4) : mockTracks.slice(0, isLaptopMode ? 8 : 4).map(t => t.id);
      return (
        <div style={{ display: 'grid', gridTemplateColumns: isLaptopMode ? 'repeat(4, 1fr)' : '1fr 1fr', gap: isLaptopMode ? 16 : 10 }}>
          {items.map((sid, i) => {
            const track = mockTracks.find(t => t.id === sid);
            const coverImg = sec.customImage || track?.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=150&h=150&fit=crop`;
            return (
              <div key={i} style={{ background: 'rgba(255,255,255,0.02)', borderRadius: 10, padding: 8, border: '1px solid rgba(255,255,255,0.04)', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                <div style={{ width: '100%', paddingTop: '100%', position: 'relative', borderRadius: 6, overflow: 'hidden' }}>
                  <img src={coverImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontSize: isLaptopMode ? 12 : 9.5, fontWeight: 700, color: '#221a15', marginTop: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track?.title}</div>
                <div style={{ fontSize: isLaptopMode ? 10 : 7.5, color: '#888', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track?.artistName}</div>
              </div>
            );
          })}
        </div>
      );
    }

    // 1.5 Vaporwave retro outrun card design
    if (sec.layout === 'grid_retro' || sec.layout === 'magazine_retro') {
      const items = sec.songIds && sec.songIds.length > 0 ? sec.songIds.slice(0, isLaptopMode ? 8 : 4) : mockTracks.slice(0, isLaptopMode ? 8 : 4).map(t => t.id);
      return (
        <div style={{ display: 'grid', gridTemplateColumns: isLaptopMode ? 'repeat(4, 1fr)' : '1fr 1fr', gap: isLaptopMode ? 16 : 10 }}>
          {items.map((sid, i) => {
            const track = mockTracks.find(t => t.id === sid);
            const coverImg = sec.customImage || track?.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=150&h=150&fit=crop`;
            const colors = ['#ff007f', '#00f0ff'];
            const outlineColor = colors[i % colors.length];
            return (
              <div key={i} style={{ background: '#0b0410', border: `1.5px solid ${outlineColor}`, padding: 6, borderRadius: 2, boxShadow: `3px 3px 0px ${outlineColor === '#ff007f' ? '#00f0ff' : '#ff007f'}` }}>
                <div style={{ width: '100%', paddingTop: '100%', position: 'relative', border: '1px solid rgba(255,255,255,0.1)' }}>
                  <img src={coverImg} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ fontSize: isLaptopMode ? 11 : 9, fontWeight: 900, color: '#00f0ff', fontFamily: 'monospace', marginTop: 6, textShadow: '1px 1px 0px #ff007f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track?.title?.toUpperCase()}</div>
                <div style={{ fontSize: isLaptopMode ? 9 : 7, color: '#221a15', opacity: 0.8, fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track?.artistName}</div>
              </div>
            );
          })}
        </div>
      );
    }

    // 1.6 Billboard Top Chart List
    if (sec.layout === 'list_billboard') {
      const items = sec.songIds && sec.songIds.length > 0 ? sec.songIds.slice(0, isLaptopMode ? 5 : 3) : mockTracks.slice(0, isLaptopMode ? 5 : 3).map(t => t.id);
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {items.map((sid, i) => {
            const track = mockTracks.find(t => t.id === sid);
            const coverImg = sec.customImage || track?.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=100&h=100&fit=crop`;
            const rankColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
            const rankColor = rankColors[i] || '#888';
            return (
              <div key={sid} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '6px 12px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 8 }}>
                <span style={{ fontSize: isLaptopMode ? 16 : 13, fontWeight: 950, color: rankColor, width: 20, textAlign: 'center', fontFamily: 'Outfit, sans-serif' }}>{i + 1}</span>
                <span style={{ fontSize: 8, color: '#b08850', marginRight: 2 }}>▲</span>
                <div style={{ width: isLaptopMode ? 36 : 28, height: isLaptopMode ? 36 : 28, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                  <img src={coverImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isLaptopMode ? 12 : 9.5, fontWeight: 800, color: '#221a15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track?.title}</div>
                  <div style={{ fontSize: isLaptopMode ? 10 : 7.5, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track?.artistName}</div>
                </div>
                <span style={{ fontSize: isLaptopMode ? 9.5 : 7, color: '#888', fontWeight: 700 }}>{(4.2 - i * 0.9).toFixed(1)}M plays</span>
              </div>
            );
          })}
        </div>
      );
    }

    // 1.7 Release Countdown Banner
    if (sec.layout === 'hero_countdown') {
      const track = mockTracks[0];
      const coverImg = sec.customImage || track.coverImage;
      return (
        <div style={{
          background: 'linear-gradient(135deg, #1f1235 0%, #0c0617 100%)',
          borderRadius: 12,
          border: '1px solid rgba(16, 185, 129, 0.25)',
          padding: isLaptopMode ? 18 : 12,
          display: 'flex',
          alignItems: 'center',
          gap: isLaptopMode ? 18 : 10,
          boxShadow: '0 4px 15px rgba(0,0,0,0.4)'
        }}>
          <img src={coverImg} alt="" style={{ width: isLaptopMode ? 64 : 44, height: isLaptopMode ? 64 : 44, borderRadius: 8, objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)' }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: isLaptopMode ? 9 : 7, fontWeight: 900, color: '#10b981', letterSpacing: '0.08em' }}>NEW RELEASE COUNTDOWN</div>
            <div style={{ fontSize: isLaptopMode ? 14 : 10, fontWeight: 850, color: '#221a15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: 2 }}>{track.title}</div>
            <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
              {['02d', '14h', '35m', '18s'].map((t, idx) => (
                <div key={idx} style={{ background: 'rgba(255,255,255,0.06)', borderRadius: 4, padding: '3px 6px', fontSize: isLaptopMode ? 9 : 7.5, fontFamily: 'monospace', color: '#10b981', fontWeight: 800 }}>{t}</div>
              ))}
            </div>
          </div>
          <button style={{ background: '#10b981', color: '#221a15', border: 'none', borderRadius: 8, padding: isLaptopMode ? '8px 16px' : '5px 10px', fontSize: isLaptopMode ? 11 : 8, fontWeight: 800, whiteSpace: 'nowrap' }}>Pre-save</button>
        </div>
      );
    }

    // 1.8 Magazine Editorial Layout
    if (sec.layout === 'magazine') {
      const t1 = mockTracks[0];
      const t2 = mockTracks[1];
      const t3 = mockTracks[2];
      return (
        <div style={{ display: 'grid', gridTemplateColumns: isLaptopMode ? '1.5fr 1fr' : '1.2fr 1fr', gap: isLaptopMode ? 16 : 10 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: 10, padding: 8, display: 'flex', flexDirection: 'column' }}>
            <img src={sec.customImage || t1.coverImage} alt="" style={{ width: '100%', height: isLaptopMode ? 110 : 70, objectFit: 'cover', borderRadius: 6 }} />
            <span style={{ fontSize: isLaptopMode ? 14 : 11, fontWeight: 900, fontFamily: 'serif', color: '#221a15', marginTop: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{t1.title}</span>
            <span style={{ fontSize: isLaptopMode ? 10 : 8, color: '#999', marginTop: 4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.3 }}>Specially featured editorial layout showing track highlight.</span>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {[t2, t3].map((track, idx) => (
              <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', background: 'rgba(255,255,255,0.01)', border: '1px solid rgba(255,255,255,0.03)', borderRadius: 8, padding: 6 }}>
                <img src={track.coverImage} alt="" style={{ width: isLaptopMode ? 36 : 26, height: isLaptopMode ? 36 : 26, borderRadius: 4, objectFit: 'cover' }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: isLaptopMode ? 11 : 9, fontWeight: 700, color: '#221a15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                  <div style={{ fontSize: isLaptopMode ? 9.5 : 8, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artistName}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 1.9 Artist Interview layout
    if (sec.layout === 'magazine_interview') {
      const artist = mockArtists[0] || { name: 'Sadhana', image: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100' };
      return (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.04)',
          borderRadius: 12,
          padding: 12,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}>
          <img src={artist.image} alt="" style={{ width: isLaptopMode ? 54 : 40, height: isLaptopMode ? 54 : 40, borderRadius: '50%', objectFit: 'cover', border: '1.5px solid #fff' }} />
          <div style={{ flex: 1, minWidth: 0, position: 'relative', background: '#181818', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '10px 10px 10px 0px', padding: '8px 12px' }}>
            <div style={{ position: 'absolute', left: -6, bottom: 0, width: 0, height: 0, borderTop: '6px solid transparent', borderRight: '6px solid #181818', borderBottom: '0px solid transparent' }} />
            <div style={{ fontSize: isLaptopMode ? 12 : 9, fontStyle: 'italic', color: '#e5e7eb', lineHeight: 1.3 }}>"I make songs for the quiet dreamers of the night..."</div>
            <div style={{ fontSize: isLaptopMode ? 10 : 8, fontWeight: 800, color: C.primary, marginTop: 4, textAlign: 'right' }}>— {artist.name}</div>
          </div>
        </div>
      );
    }

    // 1.10 Bento Asymmetrical Grid
    if (sec.layout === 'bento_asymmetric') {
      const t1 = mockTracks[0];
      const t2 = mockTracks[1];
      const t3 = mockTracks[2];
      return (
        <div style={{ display: 'grid', gridTemplateColumns: isLaptopMode ? '2fr 1.2fr 1fr' : '1.1fr 1fr', gap: 10 }}>
          <div style={{
            gridRow: isLaptopMode ? 'span 1' : 'span 2',
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(255,255,255,0.05)',
            borderRadius: 12,
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            <div style={{ fontSize: isLaptopMode ? 9 : 7, color: '#221a15', opacity: 0.6, fontWeight: 800 }}>FEATURED</div>
            <img src={sec.customImage || t1.coverImage} alt="" style={{ width: '100%', height: isLaptopMode ? 70 : 52, objectFit: 'cover', borderRadius: 8, margin: '6px 0' }} />
            <div style={{ fontSize: isLaptopMode ? 12 : 9.5, fontWeight: 900, color: '#221a15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t1.title}</div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(255,255,255,0.05)',
            borderRadius: 12,
            padding: 10,
            display: 'flex',
            alignItems: 'center',
            gap: 10
          }}>
            <img src={t2.coverImage} alt="" style={{ width: isLaptopMode ? 36 : 24, height: isLaptopMode ? 36 : 24, borderRadius: 6, objectFit: 'cover' }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: isLaptopMode ? 11 : 9, fontWeight: 850, color: '#221a15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t2.title}</div>
            </div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(10px)',
            border: '1.5px solid rgba(255,255,255,0.05)',
            borderRadius: 12,
            padding: 10,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center'
          }}>
            <span style={{ fontSize: isLaptopMode ? 16 : 12 }}>🔥</span>
            <span style={{ fontSize: isLaptopMode ? 10 : 8, fontWeight: 800, color: '#221a15', marginTop: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%', textAlign: 'center' }}>{t3.title}</span>
          </div>
        </div>
      );
    }

    // 2. RENDER CASE: Hashtag slides bento
    if (sec.layout === 'hashtag_slides') {
      if (sec.hashtags && sec.hashtags.trim().length > 0) {
        const hashtagsList = sec.hashtags.split(',');
        const defaultHashtagImages = [
          'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=150&fit=crop',
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=150&fit=crop',
          'https://images.unsplash.com/photo-1470229722913-7c092bba1a8e?w=150&fit=crop'
        ];
        return (
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
            {hashtagsList.map((tag, i) => (
              <div key={i} style={{
                width: isLaptopMode ? 130 : 100,
                height: isLaptopMode ? 170 : 135,
                borderRadius: 12,
                position: 'relative',
                overflow: 'hidden',
                flexShrink: 0,
                padding: 12,
                display: 'flex',
                alignItems: 'flex-end',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                <SafeImage src={defaultHashtagImages[i % defaultHashtagImages.length]} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent 70%)', zIndex: 1 }} />
                <span style={{ position: 'relative', zIndex: 2, fontSize: 10, fontWeight: 900, color: '#221a15', fontFamily: 'Outfit, sans-serif' }}>{tag.trim()}</span>
              </div>
            ))}
          </div>
        );
      } else {
        return (
          <div style={{ display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
            {tracksList.slice(0, 6).map((track, i) => {
              const coverImg = sec.customImage || track.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=200&h=200&fit=crop`;
              return (
                <div key={track.id} style={{
                  width: isLaptopMode ? 130 : 100,
                  height: isLaptopMode ? 170 : 135,
                  borderRadius: 12,
                  position: 'relative',
                  overflow: 'hidden',
                  flexShrink: 0,
                  padding: 12,
                  display: 'flex',
                  alignItems: 'flex-end',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}>
                  <SafeImage src={coverImg} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }} />
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(0,0,0,0.85), transparent 70%)', zIndex: 1 }} />
                  <span style={{ position: 'relative', zIndex: 2, fontSize: 10, fontWeight: 900, color: '#221a15', fontFamily: 'Outfit, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', width: '90%', lineHeight: 1.15 }}>{track.title}</span>
                </div>
              );
            })}
          </div>
        );
      }
    }

    // 3. RENDER CASE: Genre bento tiles
    if (sec.layout === 'genre_tiles') {
      if (sec.genresList && sec.genresList.trim().length > 0) {
        const tiles = sec.genresList.split(',');
        const colors = ['#e91429', '#006450', '#8a2be2', '#2d55e2', '#db2777'];
        const defaultImages = [
          'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100',
          'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=100',
          'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=100',
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100'
        ];
        return (
          <div style={{ display: 'grid', gridTemplateColumns: isLaptopMode ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: 10 }}>
            {tiles.map((t, i) => (
              <div key={i} style={{ borderRadius: 10, background: colors[i % colors.length], height: 75, position: 'relative', overflow: 'hidden', padding: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 900, color: '#221a15', fontFamily: 'Outfit, sans-serif' }}>{t.trim()}</span>
                <img src={defaultImages[i % defaultImages.length]} alt="" style={{ position: 'absolute', bottom: -10, right: -10, width: 44, height: 44, transform: 'rotate(25deg)', borderRadius: 4, objectFit: 'cover' }} />
              </div>
            ))}
          </div>
        );
      } else {
        const colors = ['#e91429', '#006450', '#8a2be2', '#2d55e2', '#db2777'];
        return (
          <div style={{ display: 'grid', gridTemplateColumns: isLaptopMode ? 'repeat(4, 1fr)' : 'repeat(2, 1fr)', gap: 10 }}>
            {tracksList.slice(0, 6).map((track, i) => {
              const coverImg = sec.customImage || track.coverImage || `https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=100&h=100&fit=crop`;
              return (
                <div key={track.id} style={{ borderRadius: 10, background: colors[i % colors.length], height: 75, position: 'relative', overflow: 'hidden', padding: 12 }}>
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#221a15', fontFamily: 'Outfit, sans-serif', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '70%', lineHeight: 1.15 }}>{track.title}</span>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.75)', fontFamily: 'Inter, sans-serif', display: 'block', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '70%' }}>{track.artistName}</span>
                  <img src={coverImg} alt="" style={{ position: 'absolute', bottom: -10, right: -10, width: 44, height: 44, transform: 'rotate(25deg)', borderRadius: 4, objectFit: 'cover' }} />
                </div>
              );
            })}
          </div>
        );
      }
    }

    // 4. RENDER CASE: ADVERTISEMENT sponsor banner
    if (sec.type === 'playlist_showcase' || (sec.layout as string) === 'playlist_showcase') {
      const targetPlId = sec.targetPlaylistId || sec.targetId || 'playlist-2';
      const pl = mockPlaylists.find(p => p.id === targetPlId) || mockPlaylists[0];
      const plName = sec.title || (sec.autoPlaylist ? 'Analyzing your taste...' : pl?.title || 'Featured Playlist');
      const plCover = sec.customImage || pl?.coverImage || 'https://images.unsplash.com/photo-1459233313842-cd392ee2c388?w=200';
      const plTracks = pl ? mockTracks.filter(t => pl.tracks.includes(t.id)) : mockTracks.slice(0, 4);
      
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%', padding: '10px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 48, height: 48, borderRadius: 6, overflow: 'hidden', flexShrink: 0, border: '1px solid rgba(255,255,255,0.1)' }}>
              <SafeImage src={plCover} alt="" style={{ width: '100%', height: '100%' }} />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
              <span style={{ fontSize: 9, color: C.muted, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                MORE LIKE
              </span>
              <span style={{ fontSize: 13, color: '#221a15', fontWeight: 900, fontFamily: 'Outfit, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {plName}
              </span>
              {sec.autoPlaylist && (
                <span style={{ fontSize: 8, color: C.primary, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                  🤖 Auto Playlist Active
                </span>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }} className="no-scrollbar">
            {plTracks.map(track => (
              <div key={track.id} style={{ flexShrink: 0, width: 80, display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ width: 80, height: 80, borderRadius: 8, overflow: 'hidden', position: 'relative', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <SafeImage src={track.coverImage} alt="" style={{ width: '100%', height: '100%' }} />
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#221a15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (sec.layout === 'ad_break_banner') {
      const bannerImg = sec.customImage || 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&auto=format&fit=crop&q=80';
      const videoUrl = sec.customVideo;
      const isVideo = sec.mediaType === 'video' && videoUrl;
      return (
        <div style={{
          position: 'relative',
          width: '100%',
          height: isLaptopMode ? '260px' : '220px',
          borderRadius: 12,
          overflow: 'hidden',
          background: '#ffffff',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 4px 20px rgba(43, 34, 26, 0.1)'
        }}>
          {isVideo ? (
            <video
              src={videoUrl}
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
              src={bannerImg}
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
            top: '10px',
            left: '10px',
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            padding: '3px 8px',
            borderRadius: '10px',
            fontSize: '8px',
            fontWeight: 'bold',
            color: '#221a15',
            letterSpacing: '0.05em',
            textTransform: 'uppercase',
            zIndex: 5
          }}>
            Advertisement
          </div>

          {/* Top Right: Controls Mock */}
          <div style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            gap: '6px',
            zIndex: 5
          }}>
            {isVideo && (
              <div style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#221a15',
                fontSize: '10px'
              }}>
                🔇
              </div>
            )}
            <div style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(4px)',
              width: '24px',
              height: '24px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#221a15',
              fontSize: '12px'
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
            padding: '12px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            zIndex: 2,
            gap: '8px'
          }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                color: '#221a15',
                fontSize: '13px',
                fontWeight: '900',
                fontFamily: 'Outfit, sans-serif',
                lineHeight: 1.25,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {sec.title || '30-minute roadside assistance promise'}
              </div>
              <div style={{
                color: 'rgba(255,255,255,0.7)',
                fontSize: '9px',
                fontWeight: '800',
                letterSpacing: '0.05em',
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
              borderRadius: '16px',
              padding: '6px 14px',
              fontSize: '10px',
              fontWeight: '800',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}>
              {sec.buttonText || 'Buy now'}
            </button>
          </div>
        </div>
      );
    }

    // 4.1 RENDER CASE: Campaign Grid (Zepto Style)
    if (sec.layout === 'grid_deals') {
      const mainTrack = mockTracks[0];
      const gridTracks = mockTracks.slice(1, 5);
      
      const badges = ['Free Stream', 'HQ Audio', 'Offline Play', 'Exclusive'];
      const cardTitles = [
        'Chill Melodies',
        'Energy Boost',
        'Focus Lofi',
        'Trending Hits'
      ];

      const gradients = [
        'linear-gradient(135deg, rgba(176, 136, 80, 0.06) 0%, rgba(15, 23, 18, 0.85) 100%)',
        'linear-gradient(135deg, rgba(176, 136, 80, 0.06) 0%, rgba(15, 23, 18, 0.85) 100%)',
        'linear-gradient(135deg, rgba(176, 136, 80, 0.06) 0%, rgba(15, 23, 18, 0.85) 100%)',
        'linear-gradient(135deg, rgba(176, 136, 80, 0.06) 0%, rgba(15, 23, 18, 0.85) 100%)'
      ];
      const borders = [
        '1px solid rgba(176, 136, 80, 0.18)',
        '1px solid rgba(176, 136, 80, 0.18)',
        '1px solid rgba(176, 136, 80, 0.18)',
        '1px solid rgba(176, 136, 80, 0.18)'
      ];
      const badgeBackgrounds = [
        'rgba(176, 136, 80, 0.12)',
        'rgba(176, 136, 80, 0.12)',
        'rgba(176, 136, 80, 0.12)',
        'rgba(176, 136, 80, 0.12)'
      ];
      const badgeColors = [
        '#b08850',
        '#b08850',
        '#b08850',
        '#b08850'
      ];
      const badgeBorders = [
        '1px solid rgba(176, 136, 80, 0.25)',
        '1px solid rgba(176, 136, 80, 0.25)',
        '1px solid rgba(176, 136, 80, 0.25)',
        '1px solid rgba(176, 136, 80, 0.25)'
      ];

      return (
        <div style={{ width: '100%' }}>
          {/* 1. Header Banner */}
          <div style={{
            borderRadius: 12,
            background: 'linear-gradient(135deg, #0b1c10 0%, #050a06 100%)',
            padding: isLaptopMode ? '16px' : '10px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            border: '1px solid rgba(176, 136, 80, 0.25)',
            boxShadow: '0 8px 32px 0 rgba(176, 136, 80, 0.15)'
          }}>
            <div style={{ position: 'absolute', top: -15, left: -15, width: 50, height: 50, borderRadius: '50%', background: 'rgba(176, 136, 80, 0.18)', filter: 'blur(25px)' }} />
            <div style={{ position: 'absolute', bottom: -15, right: -15, width: 50, height: 50, borderRadius: '50%', background: 'rgba(176, 136, 80, 0.22)', filter: 'blur(25px)' }} />
            
            <div style={{ textAlign: 'center', zIndex: 1 }}>
              <span style={{ color: C.primary, fontSize: isLaptopMode ? 9 : 7.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {sec.subtitle || "BEATO SPECIALS"}
              </span>
              <h2 style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: isLaptopMode ? 20 : 13,
                fontWeight: 950,
                margin: '2px 0 0 0',
                background: 'linear-gradient(45deg, #b08850 20%, #34d399 50%, #81f5a2 80%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.03em'
              }}>
                {sec.title || "SELF CARE DAYS"}
              </h2>
            </div>
          </div>

          {/* 2. Main Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isLaptopMode ? '1.5fr 1fr 1fr' : '1.2fr 1fr 1fr',
            gap: isLaptopMode ? 12 : 6,
            alignItems: 'stretch'
          }}>
            {/* Left Card: Steal Deals */}
            <div style={{
              gridRow: 'span 2',
              background: 'linear-gradient(135deg, rgba(176, 136, 80, 0.08) 0%, rgba(15, 23, 18, 0.85) 100%)',
              border: '1.5px solid rgba(176, 136, 80, 0.2)',
              borderRadius: 12,
              padding: isLaptopMode ? 14 : 8,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
              backdropFilter: 'blur(8px)'
            }}>
              <div style={{
                background: 'linear-gradient(90deg, #b08850, #128c3e)',
                padding: '3px 6px',
                borderRadius: 4,
                fontSize: isLaptopMode ? 9.5 : 7,
                fontWeight: 900,
                color: '#221a15',
                alignSelf: 'flex-start',
                letterSpacing: '0.05em',
                boxShadow: '0 0 12px rgba(176, 136, 80, 0.4)'
              }}>
                STEAL DEALS
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', margin: '8px 0' }}>
                <div style={{ width: isLaptopMode ? 80 : 52, height: isLaptopMode ? 80 : 52, borderRadius: 10, overflow: 'hidden', boxShadow: '0 10px 25px rgba(0,0,0,0.6)' }}>
                  <img src={mainTrack.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ color: '#221a15', fontSize: isLaptopMode ? 11 : 8.5, fontWeight: 900, fontFamily: 'Outfit, sans-serif', marginTop: 6, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {mainTrack.title}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: isLaptopMode ? 9.5 : 7.5, marginTop: 2, textAlign: 'center', width: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {mainTrack.artistName || 'Various Artists'}
                </div>
              </div>

              <button style={{
                background: '#b08850',
                border: 'none',
                color: '#000',
                padding: isLaptopMode ? '6px 12px' : '4px 8px',
                borderRadius: 16,
                fontSize: isLaptopMode ? 9.5 : 7.5,
                fontWeight: 900,
                textAlign: 'center',
                width: '100%',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(176, 136, 80, 0.3)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Listen Free
              </button>
            </div>

            {/* Right 2x2 Grid */}
            {gridTracks.map((track, i) => {
              const prevTrack = mockTracks[(i + 2) % mockTracks.length];
              return (
                <div key={track.id} style={{
                  background: gradients[i],
                  border: borders[i],
                  borderRadius: 12,
                  padding: isLaptopMode ? 10 : 6,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  height: isLaptopMode ? 110 : 70,
                  boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)'
                }}>
                  <div style={{ fontSize: isLaptopMode ? 11 : 8.5, fontWeight: 800, fontFamily: 'Outfit, sans-serif', color: '#221a15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {cardTitles[i]}
                  </div>

                  {/* Overlapping cover images in center */}
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', margin: isLaptopMode ? '6px 0' : '2px 0', height: isLaptopMode ? 36 : 24 }}>
                    <img src={track.coverImage} alt="" style={{ width: isLaptopMode ? 32 : 18, height: isLaptopMode ? 32 : 18, borderRadius: 4, objectFit: 'cover', transform: 'rotate(-6deg) translateX(3px)', border: '1.5px solid #121214', boxShadow: '0 4px 8px rgba(43, 34, 26, 0.1)', zIndex: 1 }} />
                    <img src={prevTrack.coverImage} alt="" style={{ width: isLaptopMode ? 32 : 18, height: isLaptopMode ? 32 : 18, borderRadius: 4, objectFit: 'cover', transform: 'rotate(6deg) translateX(-3px)', border: '1.5px solid #121214', boxShadow: '0 4px 8px rgba(43, 34, 26, 0.1)', zIndex: 2 }} />
                  </div>

                  <div style={{
                    background: badgeBackgrounds[i],
                    color: badgeColors[i],
                    border: badgeBorders[i],
                    padding: '2px 4px',
                    borderRadius: 12,
                    fontSize: isLaptopMode ? 8 : 6.5,
                    fontWeight: 800,
                    textAlign: 'center',
                    alignSelf: 'stretch',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {badges[i]}
                  </div>
                </div>
              );
            })}
          </div>

          {/* 3. Bottom Banner Strip */}
          <div style={{
            background: 'linear-gradient(90deg, #0d381e 0%, #b08850 100%)',
            borderRadius: 12,
            padding: isLaptopMode ? '8px 16px' : '6px 10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 12,
            border: '1px dashed rgba(176, 136, 80, 0.4)',
            boxShadow: '0 8px 24px rgba(176, 136, 80, 0.2)'
          }}>
            <span style={{ color: '#221a15', fontSize: isLaptopMode ? 10 : 7.5, fontWeight: 800, letterSpacing: '0.01em', fontFamily: 'Outfit, sans-serif' }}>
              🔥 Buy 2 Months of Premium & get 1 Month Free! T&C Apply *
            </span>
            <button style={{
              background: '#fff',
              color: '#000',
              border: 'none',
              borderRadius: 16,
              padding: isLaptopMode ? '4px 12px' : '3px 6px',
              fontSize: isLaptopMode ? 9.5 : 7.5,
              fontWeight: 900,
              boxShadow: '0 4px 10px rgba(0,0,0,0.25)'
            }}>
              Claim
            </button>
          </div>
        </div>
      );
    }

    if (sec.layout === 'music_summer_store') {
      const gridTracks = mockTracks.slice(0, 6);
      const storeTitles = [
        'Poolside Beats',
        'Night Drive',
        'Chill Ambient',
        'Workout Power',
        'Festival Anthems',
        'Acoustic Sunsets'
      ];
      const storeSubtitles = [
        'Ice-Cold Beats',
        'Midnight Cruise',
        'Soothing Sounds',
        'High Energy',
        'Main Stage',
        'Warm Acoustics'
      ];
      const cardColors = [
        'rgba(176, 136, 80, 0.05)',
        'rgba(16, 185, 129, 0.05)',
        'rgba(16, 185, 129, 0.05)',
        'rgba(239, 68, 68, 0.05)',
        'rgba(245, 158, 11, 0.05)',
        'rgba(52, 211, 153, 0.05)'
      ];
      const borderColors = [
        'rgba(176, 136, 80, 0.2)',
        'rgba(16, 185, 129, 0.2)',
        'rgba(16, 185, 129, 0.2)',
        'rgba(239, 68, 68, 0.2)',
        'rgba(245, 158, 11, 0.2)',
        'rgba(52, 211, 153, 0.2)'
      ];

      return (
        <div style={{ width: '100%' }}>
          {/* 1. Header Banner */}
          <div style={{
            borderRadius: 12,
            background: 'linear-gradient(135deg, #0b1c10 0%, #050a06 100%)',
            padding: isLaptopMode ? '16px' : '10px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 12,
            border: '1px solid rgba(176, 136, 80, 0.25)',
            boxShadow: '0 8px 32px 0 rgba(176, 136, 80, 0.15)'
          }}>
            <div style={{ position: 'absolute', top: -15, left: -15, width: 55, height: 55, borderRadius: '50%', background: 'rgba(176, 136, 80, 0.18)', filter: 'blur(25px)' }} />
            <div style={{ position: 'absolute', bottom: -15, right: -15, width: 55, height: 55, borderRadius: '50%', background: 'rgba(176, 136, 80, 0.22)', filter: 'blur(25px)' }} />
            
            <div style={{ textAlign: 'center', zIndex: 1 }}>
              <span style={{ color: C.primary, fontSize: isLaptopMode ? 9 : 7.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {sec.subtitle || "BEATO STORE"}
              </span>
              <h2 style={{
                fontFamily: 'Outfit, sans-serif',
                fontSize: isLaptopMode ? 20 : 13,
                fontWeight: 950,
                margin: '2px 0 0 0',
                background: 'linear-gradient(45deg, #b08850 20%, #34d399 50%, #81f5a2 80%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.03em'
              }}>
                {sec.title || "SUMMER VIBE STORE"}
              </h2>
            </div>
          </div>

          {/* 2. Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isLaptopMode ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)',
            gap: isLaptopMode ? 12 : 6
          }}>
            {gridTracks.map((track, i) => (
              <div key={`${track.id}-${i}`} style={{
                background: `linear-gradient(135deg, ${cardColors[i % cardColors.length]} 0%, rgba(10, 10, 10, 0.85) 100%)`,
                border: `1px solid ${borderColors[i % borderColors.length]}`,
                borderRadius: 12,
                padding: isLaptopMode ? 12 : 8,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                height: isLaptopMode ? 125 : 85,
                position: 'relative',
                overflow: 'hidden',
                boxShadow: '0 6px 20px rgba(0, 0, 0, 0.2)'
              }}>
                <div>
                  <div style={{ fontSize: isLaptopMode ? 12 : 9, fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#221a15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {storeTitles[i]}
                  </div>
                  <div style={{ fontSize: isLaptopMode ? 9.5 : 7, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
                    {storeSubtitles[i]}
                  </div>
                </div>

                {/* Tilted Cover Art at the bottom right */}
                <div style={{
                  position: 'absolute',
                  bottom: '-8px',
                  right: '-8px',
                  width: isLaptopMode ? 48 : 34,
                  height: isLaptopMode ? 48 : 34,
                  transform: 'rotate(-12deg)',
                  borderRadius: 6,
                  overflow: 'hidden',
                  boxShadow: '0 4px 10px rgba(43, 34, 26, 0.1)',
                  border: '1.5px solid rgba(255,255,255,0.1)'
                }}>
                  <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>

                <div style={{
                  background: 'rgba(43, 34, 26, 0.04)',
                  color: '#221a15',
                  border: '1px solid rgba(255,255,255,0.08)',
                  padding: '2px 6px',
                  borderRadius: 10,
                  fontSize: isLaptopMode ? 8 : 6,
                  fontWeight: 800,
                  alignSelf: 'flex-start',
                  zIndex: 1
                }}>
                  Listen Now ➔
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (sec.layout === 'music_hubs') {
      const hubTracks = mockTracks.slice(0, 6);
      const hubNames = ['Hip Hop', 'EDM Party', 'Lo-Fi Chill', 'Pop Hits', 'Rock Anthems', 'Acoustic'];
      const icons = ['🎧', '⚡', '📚', '🎤', '🎸', '🎻'];

      return (
        <div style={{ width: '100%', marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <div>
              <span style={{ color: C.primary, fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                {sec.subtitle || "POPULAR HUBS"}
              </span>
              <h3 style={{ margin: '1px 0 0 0', color: '#221a15', fontSize: isLaptopMode ? 14 : 11, fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
                {sec.title || "Explore Music Mood Hubs"}
              </h3>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: isLaptopMode ? 14 : 8,
            overflowX: 'auto',
            paddingBottom: 6,
            marginBottom: 8
          }} className="no-scrollbar">
            {hubNames.map((hub, i) => {
              const isActive = i === 2; // lo-fi chill is mock active in builder
              const track = hubTracks[i];
              return (
                <div key={`${hub}-${i}`} style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  flexShrink: 0
                }}>
                  <div style={{
                    width: isLaptopMode ? 52 : 36,
                    height: isLaptopMode ? 52 : 36,
                    borderRadius: '50%',
                    background: isActive
                      ? 'linear-gradient(135deg, rgba(176, 136, 80, 0.35) 0%, rgba(15, 23, 18, 0.9) 100%)'
                      : 'linear-gradient(135deg, rgba(255, 255, 255, 0.05) 0%, rgba(15, 23, 18, 0.9) 100%)',
                    border: isActive ? `1.5px solid ${C.primary}` : '1.5px solid rgba(43, 34, 26, 0.07)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: isLaptopMode ? 18 : 13,
                    boxShadow: '0 4px 10px rgba(43, 34, 26, 0.08)',
                    marginBottom: 6,
                    position: 'relative'
                  }}>
                    <img src={track.coverImage} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover', opacity: 0.2 }} />
                    <span style={{ zIndex: 1 }}>{icons[i]}</span>
                  </div>
                  <span style={{ color: isActive ? C.primary : '#fff', fontSize: isLaptopMode ? 10 : 7.5, fontWeight: isActive ? 800 : 700, fontFamily: 'Outfit, sans-serif' }}>
                    {hub}
                  </span>
                </div>
              );
            })}
          </div>

          {/* mock tracks row in builder */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
            {hubTracks.slice(0, 4).map((track, i) => (
              <div key={`${track.id}-hub-mock-${i}`} style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.02) 0%, rgba(10,10,10,0.95) 100%)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: 8,
                padding: 6,
                width: isLaptopMode ? 80 : 60,
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0
              }}>
                <div style={{ width: '100%', aspectRatio: '1', borderRadius: 6, overflow: 'hidden', marginBottom: 4 }}>
                  <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
                <div style={{ color: '#221a15', fontSize: isLaptopMode ? 9 : 7, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    if (sec.layout === 'new_launches_slider') {
      const mainTrack = mockTracks[0];
      return (
        <div style={{ width: '100%', marginBottom: 12 }}>
          <div style={{
            background: 'linear-gradient(135deg, #0d381e 0%, #060a08 100%)',
            border: '1.5px solid rgba(176, 136, 80, 0.4)',
            borderRadius: 12,
            padding: isLaptopMode ? 16 : 8,
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: isLaptopMode ? 'row' : 'column',
            alignItems: 'center',
            gap: isLaptopMode ? 16 : 8,
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)'
          }}>
            {/* Left/Top: Image Showcase */}
            <div style={{
              position: 'relative',
              width: isLaptopMode ? '140px' : '100%',
              height: isLaptopMode ? '100px' : '80px',
              borderRadius: 8,
              overflow: 'hidden',
              boxShadow: '0 4px 12px rgba(43, 34, 26, 0.1)',
              flexShrink: 0
            }}>
              <img src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80" alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              <div style={{
                position: 'absolute',
                top: 4,
                left: 4,
                background: '#b08850',
                padding: '2px 4px',
                borderRadius: 4,
                color: '#000',
                fontSize: 6,
                fontWeight: 900,
                letterSpacing: '0.05em',
                boxShadow: '0 0 8px rgba(176, 136, 80, 0.5)'
              }}>
                NEW HARDWARE
              </div>
            </div>

            {/* Right/Bottom: Description */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', width: '100%' }}>
              <div>
                <span style={{ color: C.primary, fontSize: 7, fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  FEATURED HARDWARE COLLAB
                </span>
                <h2 style={{ color: '#221a15', fontSize: isLaptopMode ? 14 : 11, fontFamily: 'Outfit, sans-serif', fontWeight: 950, margin: '2px 0' }}>
                  JBL x Beato: Sonic Wave
                </h2>
                <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: isLaptopMode ? 10 : 7.5, margin: '0 0 8px 0', lineHeight: 1.3 }}>
                  Experience pure bass and high-definition wireless playback with the new JBL Sonic Wave Headset.
                </p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <button style={{
                  background: '#b08850',
                  border: 'none',
                  color: '#000',
                  padding: isLaptopMode ? '4px 12px' : '3px 6px',
                  borderRadius: 16,
                  fontSize: isLaptopMode ? 9 : 7,
                  fontWeight: 900,
                  boxShadow: '0 4px 10px rgba(176, 136, 80,0.4)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 3
                }}>
                  ▶ Explore Gear
                </button>
                <div style={{ display: 'flex', gap: 3 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ width: 4, height: 4, borderRadius: '50%', background: i === 1 ? '#b08850' : 'rgba(255,255,255,0.2)' }} />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (sec.layout === 'brand_artist_collabs') {
      const gridTracks = mockTracks.slice(0, 4);
      const brandNames = ['Bose Sound', 'Sony Audio', 'Sennheiser', 'Pioneer DJ'];
      const brandDiscounts = ['Up to 30% Off Gear', 'Exclusive Tiers', '40% Off Studio FLAC', 'DJ Deck Bundles'];
      const brandBorders = ['rgba(176, 136, 80, 0.25)', 'rgba(16, 185, 129, 0.25)', 'rgba(16, 185, 129, 0.25)', 'rgba(52, 211, 153, 0.25)'];
      const textColors = ['#b08850', '#10b981', '#10b981', '#34d399'];

      return (
        <div style={{ width: '100%', marginBottom: 12 }}>
          <div style={{ marginBottom: 6 }}>
            <span style={{ color: C.primary, fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              {sec.subtitle || "TOP AUDIO BRANDS"}
            </span>
            <h3 style={{ margin: '1px 0 0 0', color: '#221a15', fontSize: isLaptopMode ? 14 : 11, fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
              {sec.title || "Brand Partner Stores"}
            </h3>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: isLaptopMode ? 10 : 6,
            marginBottom: 8
          }}>
            {gridTracks.map((track, i) => (
              <div key={`${track.id}-collab-${i}`} style={{
                background: 'linear-gradient(135deg, rgba(20,20,20,0.85) 0%, rgba(10,10,10,0.95) 100%)',
                border: `1.5px solid ${brandBorders[i % brandBorders.length]}`,
                borderRadius: 10,
                padding: isLaptopMode ? 10 : 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}>
                <div style={{ flex: 1, marginRight: 4, overflow: 'hidden' }}>
                  <h4 style={{ color: '#221a15', fontSize: isLaptopMode ? 11.5 : 8.5, fontFamily: 'Outfit, sans-serif', fontWeight: 800, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {brandNames[i]}
                  </h4>
                  <span style={{ color: textColors[i % textColors.length], fontSize: isLaptopMode ? 9 : 7, fontWeight: 800, display: 'block', marginTop: 2 }}>
                    {brandDiscounts[i]}
                  </span>
                </div>
                <div style={{ position: 'relative', width: isLaptopMode ? 32 : 24, height: isLaptopMode ? 32 : 24, borderRadius: 6, overflow: 'hidden', boxShadow: '0 4px 8px rgba(0,0,0,0.4)', flexShrink: 0 }}>
                  <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              </div>
            ))}
          </div>

          {/* Wide brand partner promo banner in admin preview */}
          <div style={{
            background: 'linear-gradient(90deg, #111 0%, #1e1e1e 50%, #0d381e 100%)',
            border: '1.5px solid rgba(176, 136, 80, 0.35)',
            borderRadius: 10,
            padding: isLaptopMode ? 12 : 8,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 6px 16px rgba(43, 34, 26, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
              <div style={{ width: 28, height: 28, borderRadius: 6, background: 'linear-gradient(135deg, #b08850 0%, #0a0a0a 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 14 }}>🎧</span>
              </div>
              <div style={{ minWidth: 0 }}>
                <h4 style={{ color: '#221a15', fontSize: isLaptopMode ? 12 : 9.5, fontWeight: 900, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Beato Pro Earbuds</h4>
                <span style={{ color: C.muted, fontSize: 8 }}>Up to 60% Off for Premium Members</span>
              </div>
            </div>
            <span style={{ color: C.primary, fontSize: 14, fontWeight: 800 }}>➔</span>
          </div>
        </div>
      );
    }

    if (sec.layout === 'mood_mania_grid') {
      const gridTracks = mockTracks.slice(0, 3);
      const categoryNames = ['Fresh Hits & Pop', 'Deep Bass & EDM', 'Acoustic & Lo-Fi'];
      const detailsText = ['Starting at 120 BPM', 'HQ Dolby Atmos', '100% Chill Vibes'];
      const prices = ['FREE STREAM', 'HQ AUDIO', 'FREE STREAM'];
      const iconBackgrounds = ['#e11d48', '#2563eb', '#059669'];

      return (
        <div style={{ width: '100%', marginBottom: 12 }}>
          <div style={{
            background: 'linear-gradient(135deg, #ef4444 0%, #1e1e1e 80%, #000 100%)',
            border: '1.5px solid rgba(239, 68, 68, 0.4)',
            borderRadius: 12,
            padding: isLaptopMode ? 12 : 8,
            position: 'relative',
            boxShadow: '0 8px 20px rgba(0,0,0,0.4)'
          }}>
            <div style={{ textAlign: 'center', marginBottom: 8 }}>
              <span style={{
                background: 'rgba(239,68,68,0.15)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.25)',
                fontSize: 7.5,
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.12em',
                padding: '2px 6px',
                borderRadius: 8
              }}>
                BEAT MANIA
              </span>
              <h3 style={{ margin: '4px 0 0 0', color: '#221a15', fontSize: isLaptopMode ? 15 : 11, fontFamily: 'Outfit, sans-serif', fontWeight: 950 }}>
                {sec.title || "Music Mania - Up to 50% Off Premium"}
              </h3>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: isLaptopMode ? 8 : 4 }}>
              {gridTracks.map((track, i) => (
                <div key={`${track.id}-mania-${i}`} style={{
                  background: 'rgba(10, 10, 10, 0.85)',
                  border: '1px solid rgba(43, 34, 26, 0.08)',
                  borderRadius: 10,
                  padding: isLaptopMode ? 8 : 4,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  textAlign: 'center',
                  height: isLaptopMode ? 100 : 75
                }}>
                  <div>
                    <div style={{ fontSize: isLaptopMode ? 9.5 : 7, fontWeight: 900, fontFamily: 'Outfit, sans-serif', color: '#221a15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {categoryNames[i]}
                    </div>
                    <div style={{ fontSize: isLaptopMode ? 7.5 : 6, color: 'rgba(255,255,255,0.4)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {detailsText[i]}
                    </div>
                  </div>
                  <div style={{ width: isLaptopMode ? 28 : 20, height: isLaptopMode ? 28 : 20, borderRadius: '50%', overflow: 'hidden', margin: '2px 0', border: `1.5px solid ${iconBackgrounds[i]}` }}>
                    <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  </div>
                  <span style={{ color: iconBackgrounds[i], fontSize: isLaptopMode ? 8.5 : 6.5, fontWeight: 900 }}>
                    {prices[i]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (sec.layout === 'deals_pricing_slider') {
      const sliderTracks = mockTracks.slice(0, 6);
      const prices = ['₹0', 'Free', '₹0', 'Premium', '₹0', 'Free'];
      const originalPrices = ['~~₹199~~', '~~₹99~~', '~~₹149~~', '~~₹299~~', '~~₹199~~', '~~₹99~~'];
      const discounts = ['100% OFF', 'FREE', '100% OFF', 'EXCLUSIVE', '100% OFF', 'FREE'];
      const dealsTabs = ['All Deals', 'Free Hits', 'Premium Singles', 'Podcast Packs'];

      return (
        <div style={{ width: '100%', marginBottom: 12 }}>
          <div style={{ display: 'flex', flexDirection: 'column', marginBottom: 8 }}>
            <span style={{ color: C.primary, fontSize: 8.5, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
              DEALS STARTING AT ₹0
            </span>
            <h3 style={{ margin: '1px 0 4px 0', color: '#221a15', fontSize: isLaptopMode ? 14 : 11, fontFamily: 'Outfit, sans-serif', fontWeight: 800 }}>
              {sec.title || "Claim Premium Tracks & Singles"}
            </h3>
            
            {/* Horizontal mock tabs inside preview */}
            <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
              {dealsTabs.map((tab, i) => (
                <span key={tab} style={{
                  background: i === 0 ? C.primary : 'rgba(255,255,255,0.06)',
                  color: i === 0 ? '#000' : '#fff',
                  border: i === 0 ? `1px solid ${C.primary}` : '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 12,
                  padding: '3px 8px',
                  fontSize: 8,
                  fontWeight: 800,
                  whiteSpace: 'nowrap'
                }}>
                  {tab}
                </span>
              ))}
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: isLaptopMode ? 10 : 6,
            overflowX: 'auto',
            paddingBottom: 6
          }} className="no-scrollbar">
            {sliderTracks.map((track, i) => (
              <div key={`${track.id}-deal-${i}`} style={{
                background: 'linear-gradient(135deg, rgba(176, 136, 80,0.04) 0%, rgba(15,15,15,0.95) 100%)',
                border: '1px solid rgba(176, 136, 80,0.15)',
                borderRadius: 10,
                padding: isLaptopMode ? 8 : 4,
                width: isLaptopMode ? 90 : 64,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                flexShrink: 0,
                position: 'relative',
                boxShadow: '0 4px 10px rgba(0,0,0,0.2)'
              }}>
                <div style={{ position: 'relative', width: '100%', aspectRatio: '1', borderRadius: 8, overflow: 'hidden', marginBottom: 4 }}>
                  <img src={track.coverImage} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <div style={{
                    position: 'absolute',
                    top: 2,
                    left: 2,
                    background: '#ff007f',
                    color: '#221a15',
                    fontSize: 5.5,
                    fontWeight: 900,
                    padding: '1px 3px',
                    borderRadius: 2
                  }}>
                    {discounts[i % discounts.length]}
                  </div>
                  
                  {/* Plus button mock in preview */}
                  <span style={{
                    position: 'absolute',
                    bottom: 2,
                    right: 2,
                    width: 14,
                    height: 14,
                    borderRadius: '50%',
                    background: '#ff007f',
                    color: '#221a15',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 900
                  }}>+</span>
                </div>

                <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <div style={{ color: '#221a15', fontSize: isLaptopMode ? 9.5 : 7, fontWeight: 900, fontFamily: 'Outfit, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {track.title}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginTop: 4 }}>
                  <span style={{ color: C.primary, fontSize: isLaptopMode ? 10 : 8, fontWeight: 950 }}>
                    {prices[i % prices.length]}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 7, textDecoration: 'line-through' }}>
                    {originalPrices[i % originalPrices.length]}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }

    // 5. RENDER CASE: Hero banner / Slider banner
    if (sec.layout === 'hero' || sec.layout === 'hero_auto_slider') {
      const hasBanners = !!(sec.banners && sec.banners.length > 0);
      const firstBanner = sec.banners?.[0] || null;
      const title = firstBanner ? firstBanner.title : sec.title;
      const subtitle = firstBanner ? firstBanner.subtitle : (sec.subtitle || 'NOW TRENDING');
      const coverImg = firstBanner ? firstBanner.imageUrl : sec.customImage;
      const btnText = firstBanner?.buttonText || sec.buttonText || 'Listen Now';

      return (
        <div style={{ 
          background: 'linear-gradient(135deg, #131313 0%, #1e1e1e 100%)', 
          borderRadius: 12, 
          padding: 18, 
          border: '1px solid rgba(255,255,255,0.05)', 
          position: 'relative',
          overflow: 'hidden'
        }}>
          {coverImg && <img src={coverImg} alt="" onError={e => (e.target as HTMLImageElement).style.display = 'none'} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.25 }} />}
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.2) 100%)' }} />
          <div style={{ position: 'relative', zIndex: 2 }}>
            <span style={{ color: C.primary, fontSize: 9, fontWeight: 900, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>
              {sec.layout === 'hero_auto_slider' ? `🎠 Hero Auto Slider (${sec.banners?.length || 0} slides)` : 'BEATO SPECIAL'}
            </span>
            <h4 style={{ fontSize: 17, fontWeight: 900, color: '#221a15', margin: '0 0 6px 0', fontFamily: 'Outfit, sans-serif' }}>{title}</h4>
            <p style={{ color: C.muted, fontSize: 11, margin: '0 0 16px 0', lineHeight: 1.4, maxWidth: '80%' }}>{subtitle}</p>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button style={{ padding: '6px 16px', borderRadius: 20, background: C.primary, border: 'none', color: '#000', fontWeight: 800, fontSize: 10 }}>
                ▶ {btnText}
              </button>
              {hasBanners && sec.banners && (
                <span style={{ fontSize: 9, color: C.muted }}>+ {sec.banners.length - 1} more slides</span>
              )}
            </div>
          </div>
        </div>
      );
    }

    // 6. RENDER CASE: ListNumbered Songs
    if (baseLayout === 'list') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {tracksList.slice(0, isLaptopMode ? 5 : 3).map((track, i) => (
            <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '4px 6px', borderRadius: 6 }}>
              <span style={{ fontSize: 11, color: C.muted, width: 14, textAlign: 'right' }}>{i + 1}</span>
              <div style={{ width: 34, height: 34, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}>
                <SafeImage src={track.coverImage} style={{ width: '100%', height: '100%' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#221a15', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</div>
                <div style={{ fontSize: 9, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artistName}</div>
              </div>
              {isLaptopMode && (
                <div style={{ fontSize: 10, color: C.muted, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {track.albumName}
                </div>
              )}
              <span style={{ fontSize: 10, color: C.muted }}>3:12</span>
            </div>
          ))}
        </div>
      );
    }

    // 7. RENDER CASE: Timeline Release Path
    if (baseLayout === 'timeline') {
      return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, borderLeft: `2.5px dashed ${C.border}`, paddingLeft: 20, marginLeft: 10, position: 'relative' }}>
          {tracksList.slice(0, 3).map((track, i) => (
            <div key={track.id} style={{ display: 'flex', alignItems: 'center', gap: 10, position: 'relative' }}>
              <div style={{ position: 'absolute', left: -26, width: 10, height: 10, borderRadius: '50%', background: C.primary, border: '2px solid #0a0a0a' }} />
              <span style={{ fontSize: 10, color: C.primary, fontWeight: 800, minWidth: 32 }}>202{4-i}</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 8, padding: 8, flex: 1 }}>
                <div style={{ width: 26, height: 26, borderRadius: 4, overflow: 'hidden' }}>
                  <SafeImage src={track.coverImage} style={{ width: '100%', height: '100%' }} />
                </div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#221a15' }}>{track.title}</div>
                  <div style={{ fontSize: 9, color: C.muted }}>{track.artistName}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    // 8. DEFAULT CASE: Carousel/Grid/Bento
    const itemsCount = baseLayout === 'carousel' ? (isLaptopMode ? 6 : 4) : baseLayout === 'bento' ? 3 : (isLaptopMode ? 5 : 3);
    const wrapperStyle: React.CSSProperties = baseLayout === 'carousel'
      ? { display: 'flex', gap: 12, overflowX: 'auto' }
      : baseLayout === 'bento'
      ? { display: 'grid', gridTemplateColumns: isLaptopMode ? '2fr 1fr 1fr' : '1fr', gap: 10 }
      : { display: 'grid', gridTemplateColumns: `repeat(${itemsCount}, 1fr)`, gap: 10 };

    return (
      <div style={wrapperStyle} className="no-scrollbar">
        {[...Array(itemsCount)].map((_, i) => renderCard(i))}
      </div>
    );
  };

  // Helper to get preview styling of a homepage section
  const getPreviewSectionStyle = (sec: BuilderSection, isSelected: boolean): React.CSSProperties => {
    const bgType = sec.background?.type || 'none';
    const bgVal = sec.background?.value || '';
    const borderStyle = sec.borderStyle || 'none';
    const borderColor = sec.borderColor || C.primary;
    const paddingVal = { none: '0px', sm: '6px', md: '12px', lg: '20px' }[sec.padding || 'md'];

    const isHidden = sec.hidden || (previewDevice === 'laptop' ? sec.hiddenOnLaptop : sec.hiddenOnMobile);

    return {
      borderRadius: 10,
      transition: 'all 0.2s',
      position: 'relative',
      display: isHidden ? 'none' : 'block',
      opacity: isHidden ? 0.35 : 1,
      padding: paddingVal,
      boxSizing: 'border-box',
      
      // Background styling
      backgroundColor: bgType === 'solid' ? bgVal : bgType === 'glass' ? 'rgba(255,255,255,0.05)' : 'transparent',
      backgroundImage: bgType === 'gradient' ? bgVal : bgType === 'image' ? `url(${bgVal})` : 'none',
      backgroundSize: bgType === 'image' ? 'cover' : undefined,
      backgroundPosition: bgType === 'image' ? 'center' : undefined,
      backdropFilter: bgType === 'glass' ? 'blur(12px)' : undefined,

      // Border styling
      border: isSelected 
        ? `2px solid ${C.primary}` 
        : borderStyle === 'solid' 
          ? `1px solid ${borderColor}` 
          : '2px solid transparent',
      boxShadow: borderStyle === 'neon' 
        ? `0 0 14px ${borderColor}60` 
        : isSelected 
          ? `0 0 16px ${C.primary}40` 
          : 'none',
    };
  };

  // ── Render Header Navigation inside Laptop Mockup ──────────────────────────────
  const renderLaptopSidebar = () => {
    return (
      <div style={{ width: 130, background: '#000', padding: '12px 10px', display: 'flex', flexDirection: 'column', gap: 14, borderRight: `1px solid ${C.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: C.primary, fontWeight: 900, fontSize: 10, letterSpacing: '-0.02em', fontFamily: 'Outfit' }}>
          <span>💚</span> BEATO
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 9, color: '#221a15', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>🏠 Home</div>
          <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>🔍 Search</div>
          <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>📚 Library</div>
        </div>
        <div style={{ height: 1, background: C.border }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ fontSize: 8, color: C.muted, textTransform: 'uppercase', fontWeight: 800 }}>Playlists</div>
          <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>♥ Liked</div>
          <div style={{ fontSize: 9, color: C.muted, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>✦ Weekly</div>
        </div>
      </div>
    );
  };

  return (
    <div style={{ fontFamily: 'Inter, sans-serif', color: C.text, minHeight: '85vh', background: C.bg, display: 'flex', flexDirection: 'column' }}>

      {/* ── Top Header Toolbar ────────────────────────────────────────────── */}
      <div style={{ background: '#ffffff', borderBottom: `1px solid ${C.border}`, padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, fontFamily: 'Outfit, sans-serif', background: `linear-gradient(90deg, ${C.primary}, #00ffff)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            🏗️ Homepage Design Studio
          </h2>
          <p style={{ margin: 0, fontSize: 11, color: C.muted }}>
            Spotify-style visual layout editor • {builderSections.length} sections configured {isDirty ? '• Unsaved changes' : ''}
          </p>
        </div>

        {/* Action Panel Buttons */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <button onClick={() => setImportModalOpen(true)} style={btnSt('secondary')}>📥 Import</button>
          <button onClick={exportJson} style={btnSt('secondary')}>📤 Export</button>
          <button onClick={() => setSaveTemplateModal(true)} style={btnSt('secondary')}>💾 Save Template</button>
          {/* ── Advanced Designer Launch ── */}
          <button
            onClick={() => setShowDesigner(true)}
            style={{
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              border: 'none',
              borderRadius: 8,
              color: '#221a15',
              padding: '8px 18px',
              cursor: 'pointer',
              fontSize: 11,
              fontWeight: 900,
              fontFamily: 'Outfit, sans-serif',
              boxShadow: '0 4px 18px rgba(16, 185, 129,0.4)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 0.2s',
            }}
            onMouseEnter={e => (e.currentTarget.style.transform = 'translateY(-1px)')}
            onMouseLeave={e => (e.currentTarget.style.transform = 'translateY(0)')}
          >
            🎨 Advanced Designer
          </button>
          <button
            onClick={publishLayout}
            disabled={isPublishing}
            style={btnSt('primary', { padding: '8px 20px', opacity: isPublishing ? 0.6 : 1 })}
          >
            {isPublishing ? '⏳ Publishing…' : '🚀 Publish Homepage'}
          </button>
        </div>
      </div>

      {/* ── Studio Navigation Tabs ────────────────────────────────────────── */}
      <div style={{ background: '#ffffff', borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 0, padding: '0 16px', overflowX: 'auto' }}>
        {[
          { id: 'builder', label: '🏗️ Visual Studio Workspace', desc: 'Section drag & drop editor' },
          { id: 'ai', label: '🤖 AI Layout Generator', desc: 'Describe prompt design' },
          { id: 'ml', label: '🧠 ML Dashboard', desc: 'Personalization profile charts' },
        ].map(p => (
          <button key={p.id} onClick={() => setActivePanel(p.id as BuilderPanel)}
            style={{
              background: 'transparent', border: 'none', cursor: 'pointer', padding: '12px 18px',
              borderBottom: activePanel === p.id ? `3px solid ${C.primary}` : '3px solid transparent',
              color: activePanel === p.id ? C.primary : C.muted, fontSize: 12, fontWeight: 700,
              whiteSpace: 'nowrap', transition: 'all 0.2s', textAlign: 'left'
            }}>
            {p.label}
            <span style={{ display: 'block', fontSize: 9, fontWeight: 400, opacity: 0.5, marginTop: 2 }}>{p.desc}</span>
          </button>
        ))}
      </div>

      {/* ── Main Container Workspace ─────────────────────────────────────── */}
      <div style={{ padding: '20px', flex: 1, minHeight: '68vh', position: 'relative' }}>
        <AnimatePresence mode="wait">

          {/* ════ VISUAL BUILDER WORKSPACE ═════════════════════════════════ */}
          {activePanel === 'builder' && (
            <motion.div key="builder" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{ display: 'flex', gap: 20, position: 'relative', height: 'calc(100vh - 220px)', overflow: 'hidden' }}>

              {/* ── 1. LEFT SIDEBAR: Library & Order List (280px wide) ── */}
              {!isSidebarCollapsed && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, height: '100%', width: 280, flexShrink: 0 }}>
                  
                  {/* Sidebar Navigation */}
                  <div style={{ display: 'flex', background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: 8, padding: 3 }}>
                    {(['library', 'active', 'presets'] as LeftSidebarTab[]).map(tab => (
                      <button key={tab} onClick={() => setActiveSidebarTab(tab)}
                        style={{
                          flex: 1, background: activeSidebarTab === tab ? '#222' : 'transparent',
                          border: 'none', borderRadius: 6, color: activeSidebarTab === tab ? C.primary : C.muted,
                          fontSize: 10, fontWeight: 800, padding: '6px', cursor: 'pointer', textTransform: 'capitalize'
                        }}>
                        {tab === 'active' ? `Active (${builderSections.length})` : tab}
                      </button>
                    ))}
                  </div>

                  {/* Manual Section Creator */}
                  <button
                    onClick={createCustomSection}
                    style={btnSt('primary', {
                      width: '100%',
                      padding: '8px 12px',
                      fontSize: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      background: 'rgba(176, 136, 80,0.12)',
                      border: `1px solid ${C.primary}`,
                      color: C.primary,
                      transition: 'all 0.2s',
                    })}
                    onMouseEnter={e => {
                      e.currentTarget.style.background = C.primary;
                      e.currentTarget.style.color = '#000';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.background = 'rgba(176, 136, 80,0.12)';
                      e.currentTarget.style.color = C.primary;
                    }}
                  >
                    ➕ Create Custom Section
                  </button>

                {/* Sidebar Content Container */}
                <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12 }} className="no-scrollbar">
                  
                  {/* Library tab content */}
                  {activeSidebarTab === 'library' && (
                    <div style={cardSt({ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' })}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, marginBottom: 8 }}>📦 Click/Drag Section Blocks</div>
                      <input placeholder="🔍 Search blocks..." value={blockSearch} onChange={e => setBlockSearch(e.target.value)}
                        style={{ ...inputSt, marginBottom: 8, fontSize: 11 }} />
                      
                      {/* Categories list */}
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 10 }}>
                        {BLOCK_CATEGORIES.map(cat => (
                          <button key={cat} onClick={() => setActiveBlockCategory(cat)}
                            style={{ ...pillSt(activeBlockCategory === cat), fontSize: 9, padding: '3px 8px' }}>
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Blocks list */}
                      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }} className="no-scrollbar">
                        {filteredBlocks.map(block => (
                          <div key={block.id}
                            draggable
                            onDragStart={e => handleBlockDragStart(e, block.id)}
                            onClick={() => addBlock(block)}
                            style={{
                              padding: '8px 10px', borderRadius: 8, background: '#fbf9f5', border: `1px solid ${C.border}`,
                              cursor: 'grab', display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = C.primary)}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
                          >
                            <span style={{ fontSize: 16 }}>{block.icon}</span>
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{block.label}</div>
                              <div style={{ fontSize: 9, color: C.muted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{block.description}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Active list tree content */}
                  {activeSidebarTab === 'active' && (
                    <div style={cardSt({ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' })}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, marginBottom: 8 }}>☰ Arrange Layout Order</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flex: 1, overflowY: 'auto' }} className="no-scrollbar">
                        {builderSections.length === 0 ? (
                          <div style={{ textAlign: 'center', padding: '40px 0', color: C.muted, fontSize: 11 }}>No active sections yet. Add some!</div>
                        ) : (
                          builderSections.map((sec, idx) => (
                            <div key={sec.id}
                              onClick={() => selectSection(sec)}
                              style={{
                                padding: '8px 10px', borderRadius: 8, background: selectedSection?.id === sec.id ? C.primaryDim : '#fbf9f5',
                                border: `1px solid ${selectedSection?.id === sec.id ? C.primary : C.border}`, cursor: 'pointer',
                                display: 'flex', alignItems: 'center', gap: 6, opacity: sec.hidden ? 0.45 : 1
                              }}
                            >
                              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                <button onClick={e => { e.stopPropagation(); moveSection(idx, 'up'); }} disabled={idx === 0} style={{ border: 'none', background: 'transparent', color: idx === 0 ? '#444' : C.muted, fontSize: 9, cursor: 'pointer' }}>▲</button>
                                <button onClick={e => { e.stopPropagation(); moveSection(idx, 'down'); }} disabled={idx === builderSections.length - 1} style={{ border: 'none', background: 'transparent', color: idx === builderSections.length - 1 ? '#444' : C.muted, fontSize: 9, cursor: 'pointer' }}>▼</button>
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{sec.title}</div>
                                <div style={{ fontSize: 9, color: C.muted }}>{sec.layout} • {sec.contentSource}</div>
                              </div>
                              <div style={{ display: 'flex', gap: 4 }}>
                                <button title="Toggle Laptop Visibility" onClick={e => { e.stopPropagation(); toggleHiddenDevice(sec.id, 'laptop'); }} style={{ border: 'none', background: 'transparent', fontSize: 11, cursor: 'pointer', opacity: sec.hiddenOnLaptop ? 0.4 : 1 }}>💻{sec.hiddenOnLaptop ? '🙈' : ''}</button>
                                <button title="Toggle Mobile Visibility" onClick={e => { e.stopPropagation(); toggleHiddenDevice(sec.id, 'mobile'); }} style={{ border: 'none', background: 'transparent', fontSize: 11, cursor: 'pointer', opacity: sec.hiddenOnMobile ? 0.4 : 1 }}>📱{sec.hiddenOnMobile ? '🙈' : ''}</button>
                                <button title="Global Hidden" onClick={e => { e.stopPropagation(); toggleHidden(sec.id); }} style={{ border: 'none', background: 'transparent', fontSize: 11, cursor: 'pointer' }}>{sec.hidden ? '👁️' : '🙈'}</button>
                                <button onClick={e => { e.stopPropagation(); deleteSection(sec.id); }} style={{ border: 'none', background: 'transparent', fontSize: 11, cursor: 'pointer', color: C.red }}>🗑</button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}

                  {/* Presets Gallery tab content */}
                  {activeSidebarTab === 'presets' && (
                    <div style={cardSt({ padding: '12px', flex: 1, display: 'flex', flexDirection: 'column' })}>
                      <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, marginBottom: 8 }}>🎨 Load Theme Presets</div>
                      <input placeholder="🔍 Search presets..." value={presetSearch} onChange={e => setPresetSearch(e.target.value)}
                        style={{ ...inputSt, marginBottom: 8, fontSize: 11 }} />
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                        {PRESET_CATEGORIES.map(cat => (
                          <button key={cat} onClick={() => setActivePresetCategory(cat)}
                            style={{ ...pillSt(activePresetCategory === cat), fontSize: 9, padding: '3px 8px' }}>
                            {cat}
                          </button>
                        ))}
                      </div>
                      <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }} className="no-scrollbar">
                        {filteredPresets.map(preset => (
                          <div key={preset.id} onClick={() => applyPreset(preset)}
                            style={{
                              padding: '8px 10px', borderRadius: 8, background: '#fbf9f5', border: `1px solid ${C.border}`,
                              cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 6, transition: 'all 0.15s'
                            }}
                            onMouseEnter={e => (e.currentTarget.style.borderColor = C.primary)}
                            onMouseLeave={e => (e.currentTarget.style.borderColor = C.border)}
                          >
                            <div style={{ height: 40, borderRadius: 6, background: preset.thumbnail }} />
                            <div>
                              <div style={{ fontSize: 11, fontWeight: 700 }}>{preset.name}</div>
                              <div style={{ fontSize: 9, color: C.muted }}>{preset.sections.length} sections</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Templates List */}
                {savedTemplates.length > 0 && activeSidebarTab === 'active' && (
                  <div style={cardSt({ padding: '12px', maxHeight: 150, overflowY: 'auto' })}>
                    <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, marginBottom: 6 }}>💾 Saved Layouts</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {savedTemplates.map(t => (
                        <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span onClick={() => {
                            if (t.homeLayoutOrder && t.customSections) {
                              setBuilderSections(t.homeLayoutOrder.map((id: string) => t.customSections[id] || { id, title: 'Unknown' }));
                              toast.success(`"${t.name}" loaded!`);
                            }
                          }} style={{ fontSize: 10, fontWeight: 700, color: '#221a15', cursor: 'pointer', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>
                            {t.name}
                          </span>
                          <button onClick={async () => {
                            await fetch('/api/admin/homepage-builder', {
                              method: 'POST', headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ action: 'delete_template', templateId: t.id }),
                            });
                            setSavedTemplates(prev => prev.filter(st => st.id !== t.id));
                            toast.success('Template deleted');
                          }} style={{ background: 'transparent', border: 'none', color: C.red, fontSize: 10, cursor: 'pointer' }}>✕</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>)}

              {/* ── 2. CENTER COLUMN: Live Preview Frame Workspace (Toggled laptop/mobile) ── */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', position: 'relative', overflow: 'hidden', minWidth: 0 }}>
                
                {/* Widescreen Preview Mode Selector Toggle */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexShrink: 0 }}>
                  <button onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                    style={btnSt('secondary', { display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', border: `1px solid ${C.border}` })}>
                    {isSidebarCollapsed ? '📂 Expand Panel' : '📁 Collapse Panel'}
                  </button>
                  <div style={{ display: 'flex', background: '#ffffff', borderRadius: 8, padding: 3, border: `1px solid ${C.border}` }}>
                    <button onClick={() => setPreviewDevice('laptop')}
                      style={{
                        border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 800, padding: '4px 14px', cursor: 'pointer',
                        background: previewDevice === 'laptop' ? '#222' : 'transparent', color: previewDevice === 'laptop' ? C.primary : C.muted
                      }}>
                      🖥️ Laptop Preview
                    </button>
                    <button onClick={() => setPreviewDevice('mobile')}
                      style={{
                        border: 'none', borderRadius: 6, fontSize: 10, fontWeight: 800, padding: '4px 14px', cursor: 'pointer',
                        background: previewDevice === 'mobile' ? '#222' : 'transparent', color: previewDevice === 'mobile' ? C.primary : C.muted
                      }}>
                      📱 Mobile Preview
                    </button>
                  </div>
                </div>

                {previewDevice === 'mobile' ? (
                  /* ── MOBILE PREVIEW MODE ── */
                  <div style={{
                    width: '350px', height: '90%', background: '#000', borderRadius: '40px',
                    border: '10px solid #222', boxShadow: '0 20px 45px rgba(0, 0, 0, 0.7)',
                    position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column'
                  }}>
                    {/* Speaker Notch */}
                    <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '130px', height: '22px', background: '#000', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', zIndex: 999 }} />

                    {/* Transparent overlay Clock & Status bar */}
                    <div style={{ height: '34px', background: 'transparent', display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 24px', fontSize: 10, fontWeight: 800, color: '#221a15', zIndex: 990, position: 'absolute', top: 0, left: 0, right: 0 }}>
                      <div>11:37 AM</div>
                      <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                        <span>📶</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', border: '1.2px solid #fff', borderRadius: 2, padding: 1, width: 18, height: 8 }}>
                          <span style={{ display: 'block', height: '100%', background: '#fff', width: '80%' }} />
                        </span>
                      </div>
                    </div>

                    {/* Scrollable Layout Canvas */}
                    <div style={{
                      flex: 1,
                      overflowY: 'auto',
                      background: 'linear-gradient(180deg, rgba(176, 136, 80,0.08) 0%, #0a0a0a 35%)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 16,
                      padding: '38px 12px 12px 12px'
                    }} className="no-scrollbar">
                      
                      {/* Mobile App Header (Avatar + Chips + Notification Bell) */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1 }}>
                          <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#34d399', color: '#221a15', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>
                            {user?.name ? user.name[0].toUpperCase() : 'N'}
                          </div>
                          <div style={{ display: 'flex', gap: 6 }}>
                            <span style={{ fontSize: 9, background: C.primary, color: '#000', padding: '3px 10px', borderRadius: 20, fontWeight: 800 }}>All</span>
                            <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.08)', color: '#221a15', padding: '3px 10px', borderRadius: 20, fontWeight: 800 }}>Music</span>
                            <span style={{ fontSize: 9, background: 'rgba(255,255,255,0.08)', color: '#221a15', padding: '3px 10px', borderRadius: 20, fontWeight: 800 }}>Podcasts</span>
                          </div>
                        </div>
                        <span style={{ fontSize: 12, color: '#221a15', cursor: 'pointer', paddingRight: 4 }}>🔔</span>
                      </div>

                      {builderSections.length === 0 ? (
                        <div style={{ padding: '60px 10px', textAlign: 'center', color: C.muted, margin: 'auto' }}>
                          <div style={{ fontSize: 32, marginBottom: 12 }}>🏗️</div>
                          <div style={{ fontSize: 13, fontWeight: 800, color: '#221a15', marginBottom: 4 }}>Empty Canvas</div>
                          <div style={{ fontSize: 9 }}>Click library blocks to configure pages.</div>
                        </div>
                      ) : (
                        builderSections.map((sec, idx) => {
                          const isSelected = selectedSection?.id === sec.id;
                          return (
                            <div key={sec.id}
                              onClick={(e) => { e.stopPropagation(); selectSection(sec); }}
                              onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSectionCtxMenu({ x: e.clientX, y: e.clientY, sec }); }}
                              style={{ ...getPreviewSectionStyle(sec, isSelected), cursor: 'context-menu' }}
                            >
                              {isSelected && (
                                <div style={{
                                  position: 'absolute', top: -10, right: 6, background: C.primary, color: '#000',
                                  borderRadius: 3, padding: '1px 5px', fontSize: 7, fontWeight: 900, zIndex: 99
                                }}>
                                  EDITING
                                </div>
                              )}
                              {/* Right-click hint badge */}
                              <div style={{ position: 'absolute', top: 4, left: 4, fontSize: 7, color: 'rgba(255,255,255,0.2)', fontWeight: 700, userSelect: 'none', pointerEvents: 'none' }}>Right-click to edit</div>
                              
                              {/* Header section block */}
                              {!sec.customElements && sec.layout !== 'genre_tiles' && sec.layout !== 'ad_break_banner' && sec.layout !== 'hero' && (
                                <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                  <div>
                                    {sec.subtitle && <span style={{ fontSize: 8, color: C.muted, display: 'block', marginBottom: 1 }}>{sec.subtitle}</span>}
                                    <h3 style={{ fontSize: 12, fontWeight: 900, color: '#221a15', margin: 0, fontFamily: 'Outfit' }}>{sec.title}</h3>
                                  </div>
                                  <span style={{ fontSize: 8, color: C.muted }}>See all</span>
                                </div>
                              )}
                              
                              {renderMockSection(sec, false)}
                            </div>
                          );
                        })
                      )}
                    </div>

                    <div style={{ height: '18px', background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <div style={{ width: '100px', height: '4px', borderRadius: '2px', background: '#fff', opacity: 0.5 }} />
                    </div>
                  </div>
                ) : (
                  /* ── LAPTOP WIDESCREEN PREVIEW MODE (Browser spans full width) ── */
                  <div style={{
                    width: '100%', maxWidth: '1100px', height: '90%', background: '#ffffff', borderRadius: '16px',
                    border: '1px solid rgba(43,34,26,0.12)', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden', alignSelf: 'center'
                  }}>
                    {/* Widescreen Browser Top Bar (Spans full header across mockup sidebar and content) */}
                    <div style={{ background: '#ffffff', borderBottom: `1px solid ${C.border}`, padding: '8px 16px', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                      {/* Window Controls */}
                      <div style={{ display: 'flex', gap: 6, marginRight: 10 }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b' }} />
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
                      </div>
                      <span style={{ fontSize: 10, color: C.muted }}>◀</span>
                      <span style={{ fontSize: 10, color: C.muted }}>▶</span>
                      <div style={{ flex: 1, background: '#151515', borderRadius: 6, padding: '4px 12px', fontSize: 10, color: C.muted, display: 'flex', justifyContent: 'space-between' }}>
                        <span>🔒 beato.app/home</span>
                        <span>⟳</span>
                      </div>
                    </div>

                    {/* Window body */}
                    <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                      {renderLaptopSidebar()}

                      {/* Content panel */}
                      <div style={{ flex: 1, overflowY: 'auto', background: '#0b0b0b', display: 'flex', flexDirection: 'column' }} className="no-scrollbar">
                        
                        {/* Top Gradient Header Area */}
                        <div style={{
                          background: 'linear-gradient(180deg, rgba(176, 136, 80,0.08) 0%, rgba(10,10,10,0) 100%)',
                          padding: '20px 20px 10px 20px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 16
                        }}>
                          {/* Greeting top header */}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h2 style={{ fontSize: 18, fontWeight: 900, fontFamily: 'Outfit', color: '#221a15', margin: 0 }}>Good morning, Nandhini</h2>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                              <button style={{ ...btnSt('secondary'), padding: '4px 8px', fontSize: 9 }}>Upgrade</button>
                              <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.primary, color: '#000', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>N</div>
                            </div>
                          </div>
                        </div>

                        {/* Main canvas rows list */}
                        <div style={{ padding: '0 20px 24px 20px', display: 'flex', flexDirection: 'column', gap: 24 }}>
                          {builderSections.length === 0 ? (
                            <div style={{ padding: '80px 20px', textAlign: 'center', color: C.muted, margin: 'auto' }}>
                              <div style={{ fontSize: 32, marginBottom: 12 }}>🏗️</div>
                              <div style={{ fontSize: 14, fontWeight: 800, color: '#221a15', marginBottom: 4 }}>Empty Workspace Layout</div>
                              <div style={{ fontSize: 10 }}>Load presets or add section blocks from the sidebar to inspect layout.</div>
                            </div>
                          ) : (
                            builderSections.map((sec, idx) => {
                              const isSelected = selectedSection?.id === sec.id;
                              return (
                                <div key={sec.id}
                                  onClick={(e) => { e.stopPropagation(); selectSection(sec); }}
                                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSectionCtxMenu({ x: e.clientX, y: e.clientY, sec }); }}
                                  style={{ ...getPreviewSectionStyle(sec, isSelected), cursor: 'context-menu' }}
                                >
                                  {isSelected && (
                                    <div style={{
                                      position: 'absolute', top: -10, right: 10, background: C.primary, color: '#000',
                                      borderRadius: 3, padding: '1px 6px', fontSize: 8, fontWeight: 900, zIndex: 99
                                    }}>
                                      EDITING DESKTOP ROW
                                    </div>
                                  )}

                                  {/* Right-click hint */}
                                  <div style={{ position: 'absolute', top: 4, left: 6, fontSize: 8, color: 'rgba(255,255,255,0.18)', fontWeight: 700, userSelect: 'none', pointerEvents: 'none' }}>Right-click to edit ›</div>
                                  
                                  {/* Header section block */}
                                  {!sec.customElements && sec.layout !== 'genre_tiles' && sec.layout !== 'ad_break_banner' && sec.layout !== 'hero' && (
                                    <div style={{ marginBottom: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                                      <div>
                                        {sec.subtitle && <span style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 2 }}>{sec.subtitle}</span>}
                                        <h3 style={{ fontSize: 14, fontWeight: 900, color: '#221a15', margin: 0, fontFamily: 'Outfit' }}>{sec.title}</h3>
                                      </div>
                                      <span style={{ fontSize: 10, color: C.muted, cursor: 'pointer' }}>Show all</span>
                                    </div>
                                  )}

                                  {renderMockSection(sec, true)}
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ── 3. FLEX SIBLING: Properties Inspector ── */}
              <AnimatePresence>
                {selectedSection && (
                    <motion.div
                      initial={{ opacity: 0, width: 0, x: 20 }}
                      animate={{ opacity: 1, width: 340, x: 0 }}
                      exit={{ opacity: 0, width: 0, x: 20 }}
                      transition={{ type: 'tween', duration: 0.22 }}
                      style={{
                        background: 'rgba(20,20,20,0.85)', backdropFilter: 'blur(20px)',
                        borderLeft: `1px solid ${C.border}`, zIndex: 100, display: 'flex',
                        flexDirection: 'column', gap: 12, padding: '16px', boxSizing: 'border-box',
                        boxShadow: '-10px 0 30px rgba(0,0,0,0.6)', overflowY: 'auto',
                        height: '100%', flexShrink: 0
                      }}
                      className="no-scrollbar"
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: `1px solid ${C.border}`, paddingBottom: 10 }}>
                        <div style={{ fontSize: 11, fontWeight: 800, color: C.primary }}>⚙️ Configuration Panel</div>
                        <button onClick={() => setSelectedSection(null)} style={{ background: 'transparent', border: 'none', color: '#221a15', fontSize: 14, cursor: 'pointer', outline: 'none' }}>✕ Close</button>
                      </div>

                      {/* ACCORDION GROUP 1: General Info */}
                      <div style={cardSt({ padding: '10px 14px', background: '#ffffff' })}>
                        <div onClick={() => setExpandedSection(expandedSection === 'info' ? 'design' : 'info')}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#221a15' }}>📝 General Settings</span>
                          <span style={{ fontSize: 8, color: C.muted }}>{expandedSection === 'info' ? '▼' : '▶'}</span>
                        </div>
                        
                        {expandedSection === 'info' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                            <div>
                              <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Section Title</label>
                              <input value={settTitle} onChange={e => {
                                const val = e.target.value;
                                setSettTitle(val);
                                updateSelectedSectionProp('title', val);
                              }} style={inputSt} />
                            </div>
                            <div>
                              <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Subtitle / Tagline</label>
                              <input value={settSubtitle} onChange={e => {
                                const val = e.target.value;
                                setSettSubtitle(val);
                                updateSelectedSectionProp('subtitle', val);
                              }} placeholder="Optional tagline details" style={inputSt} />
                            </div>
                            <div>
                              <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Target Audience</label>
                              <select value={settAudience} onChange={e => {
                                const val = e.target.value as any;
                                setSettAudience(val);
                                updateSelectedSectionProp('audience', val);
                              }} style={inputSt}>
                                <option value="all">All Subscribers</option>
                                <option value="premium">Premium Tiers Only</option>
                                <option value="free">Free Listeners Only</option>
                              </select>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACCORDION GROUP 2: Layout & Card Design */}
                      <div style={cardSt({ padding: '10px 14px', background: '#ffffff' })}>
                        <div onClick={() => setExpandedSection(expandedSection === 'design' ? 'background' : 'design')}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#221a15' }}>📐 Layout & Card Design</span>
                          <span style={{ fontSize: 8, color: C.muted }}>{expandedSection === 'design' ? '▼' : '▶'}</span>
                        </div>
                        
                        {expandedSection === 'design' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                            <div>
                              <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Layout Format</label>
                              <select value={settLayout} onChange={e => {
                                const val = e.target.value as any;
                                setSettLayout(val);
                                updateSelectedSectionProp('layout', val);
                              }} style={inputSt}>
                                {CORE_LAYOUTS.map(opt => (
                                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                              </select>
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <div>
                                <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Card Size</label>
                                <select value={settCardSize} onChange={e => {
                                  const val = e.target.value as any;
                                  setSettCardSize(val);
                                  updateSelectedSectionProp('cardSize', val);
                                }} style={inputSt}>
                                  <option value="xs">XS</option>
                                  <option value="sm">SM</option>
                                  <option value="md">MD</option>
                                  <option value="lg">LG</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Card Theme</label>
                                <select value={settCardStyle} onChange={e => {
                                  const val = e.target.value as any;
                                  setSettCardStyle(val);
                                  updateSelectedSectionProp('cardStyle', val);
                                }} style={inputSt}>
                                  <option value="classic">Classic Flat</option>
                                  <option value="glass">Glassmorphism</option>
                                  <option value="neo">Neon Green</option>
                                  <option value="retro">Retro sunset</option>
                                  <option value="gradient">Gradient</option>
                                  <option value="none">Borderless</option>
                                </select>
                              </div>
                            </div>
                            <div>
                              <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Card Shape</label>
                              <select value={settCardShape} onChange={e => {
                                  const val = e.target.value as any;
                                  setSettCardShape(val);
                                  updateSelectedSectionProp('cardShape', val);
                                }} style={inputSt}>
                                <option value="default">Default Rect</option>
                                <option value="circle">Circular Cover</option>
                                <option value="square">Sharp Square</option>
                                <option value="rectangle_banner_2">Row Banner</option>
                              </select>
                            </div>
                            <div>
                              <label style={{ fontSize: 9, color: C.muted, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                                <span>Custom Image / Cover URL</span>
                                <label style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4, border: `1px solid ${C.border}`, color: '#221a15', fontWeight: 600 }}>
                                  Upload Image
                                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = (event) => {
                                        const val = event.target?.result as string;
                                        setSettCustomImage(val);
                                        updateSelectedSectionProp('customImage', val);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }} />
                                </label>
                              </label>
                              <input value={settCustomImage} onChange={e => {
                                const val = e.target.value;
                                setSettCustomImage(val);
                                updateSelectedSectionProp('customImage', val);
                              }} placeholder="Paste image URL (https://...) or Upload ⬆" style={inputSt} />
                              
                              <div style={{ fontSize: 8, color: C.muted, marginTop: 4, marginBottom: 2 }}>Quick Presets:</div>
                              <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
                                {[
                                  { name: 'Neon Pop', url: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300' },
                                  { name: 'Concert Light', url: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300' },
                                  { name: 'Studio mic', url: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300' },
                                  { name: 'Lofi Bedroom', url: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=300' },
                                  { name: 'Synthwave tape', url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=300' }
                                ].map(img => (
                                  <div key={img.name} 
                                    onClick={() => {
                                      setSettCustomImage(img.url);
                                      updateSelectedSectionProp('customImage', img.url);
                                    }}
                                    style={{
                                      width: 32, height: 32, borderRadius: 4, overflow: 'hidden', cursor: 'pointer',
                                      border: settCustomImage === img.url ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
                                      flexShrink: 0
                                    }}
                                    title={img.name}
                                  >
                                    <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACCORDION GROUP 3: Background & Borders */}
                      <div style={cardSt({ padding: '10px 14px', background: '#ffffff' })}>
                        <div onClick={() => setExpandedSection(expandedSection === 'background' ? 'special' : 'background')}
                          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                          <span style={{ fontSize: 10, fontWeight: 800, color: '#221a15' }}>🎨 Backgrounds & Borders</span>
                          <span style={{ fontSize: 8, color: C.muted }}>{expandedSection === 'background' ? '▼' : '▶'}</span>
                        </div>
                        
                        {expandedSection === 'background' && (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                            <div>
                              <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Background Type</label>
                              <select value={settBgType} onChange={e => {
                                const val = e.target.value as any;
                                setSettBgType(val);
                                updateSelectedSectionProp('backgroundType', val);
                              }} style={inputSt}>
                                <option value="none">No background</option>
                                <option value="solid">Solid color</option>
                                <option value="gradient">Gradient CSS rules</option>
                                <option value="glass">Glass frosted overlay</option>
                                <option value="image">Custom cover image</option>
                              </select>
                            </div>
                            {settBgType !== 'none' && (
                              <div>
                                <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Background Value</label>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                  <input value={settBgValue} onChange={e => {
                                    const val = e.target.value;
                                    setSettBgValue(val);
                                    updateSelectedSectionProp('backgroundValue', val);
                                  }}
                                    placeholder={settBgType === 'gradient' ? 'linear-gradient(to right, #000, #333)' : '#161616'}
                                    style={{ ...inputSt, flex: 1 }} />
                                  {settBgType === 'solid' && (
                                    <input type="color" value={settBgValue.startsWith('#') && settBgValue.length === 7 ? settBgValue : '#161616'} 
                                      onChange={e => {
                                        const val = e.target.value;
                                        setSettBgValue(val);
                                        updateSelectedSectionProp('backgroundValue', val);
                                      }}
                                      style={{ width: 28, height: 28, border: `1px solid ${C.border}`, borderRadius: 6, cursor: 'pointer', background: 'transparent', padding: 0 }} />
                                  )}
                                </div>
                                {settBgType === 'solid' && (
                                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                                    {[
                                      { name: 'Default', hex: '#161616' },
                                      { name: 'Spotify', hex: '#b08850' },
                                      { name: 'Purple', hex: '#120720' },
                                      { name: 'Navy', hex: '#051122' },
                                      { name: 'Charcoal', hex: '#242424' },
                                      { name: 'Burgundy', hex: '#26040a' }
                                    ].map(color => (
                                      <button key={color.hex} onClick={() => {
                                        setSettBgValue(color.hex);
                                        updateSelectedSectionProp('backgroundValue', color.hex);
                                      }} style={{
                                        ...pillSt(settBgValue === color.hex, C.primary),
                                        padding: '3px 8px', fontSize: 8
                                      }}>
                                        {color.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {settBgType === 'gradient' && (
                                  <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                                    {[
                                      { name: 'Nebula', val: 'linear-gradient(135deg, #1e0b36 0%, #0c0214 100%)' },
                                      { name: 'Deep Sea', val: 'linear-gradient(135deg, #091a2e 0%, #020813 100%)' },
                                      { name: 'Forest', val: 'linear-gradient(135deg, #022c22 0%, #010a08 100%)' },
                                      { name: 'Sunset', val: 'linear-gradient(135deg, #2e0816 0%, #0c0206 100%)' }
                                    ].map(grad => (
                                      <button key={grad.name} onClick={() => {
                                        setSettBgValue(grad.val);
                                        updateSelectedSectionProp('backgroundValue', grad.val);
                                      }} style={{
                                        ...pillSt(settBgValue === grad.val, C.primary),
                                        padding: '3px 8px', fontSize: 8
                                      }}>
                                        {grad.name}
                                      </button>
                                    ))}
                                  </div>
                                )}
                                {settBgType === 'image' && (
                                  <div style={{ marginTop: 6 }}>
                                    <div style={{ fontSize: 8, color: C.muted, marginBottom: 2 }}>Quick Background Images:</div>
                                    <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
                                      {[
                                        { name: 'Synthwave', url: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400' },
                                        { name: 'Deep Space', url: 'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=400' },
                                        { name: 'Warm Sunset', url: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400' },
                                        { name: 'Dark Abstract', url: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400' }
                                      ].map(img => (
                                        <div key={img.name} 
                                          onClick={() => {
                                            setSettBgValue(img.url);
                                            updateSelectedSectionProp('backgroundValue', img.url);
                                          }}
                                          style={{
                                            width: 50, height: 35, borderRadius: 4, overflow: 'hidden', cursor: 'pointer',
                                            border: settBgValue === img.url ? `2px solid ${C.primary}` : `1px solid ${C.border}`,
                                            flexShrink: 0
                                          }}
                                          title={img.name}
                                        >
                                          <img src={img.url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                              <div>
                                <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Border Style</label>
                                <select value={settBorder} onChange={e => {
                                  const val = e.target.value as any;
                                  setSettBorder(val);
                                  updateSelectedSectionProp('borderStyle', val);
                                }} style={inputSt}>
                                  <option value="none">No Border</option>
                                  <option value="solid">Solid Border</option>
                                  <option value="neon">Neon glow</option>
                                </select>
                              </div>
                              <div>
                                <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Border Color</label>
                                <input value={settBorderColor} onChange={e => {
                                  const val = e.target.value;
                                  setSettBorderColor(val);
                                  updateSelectedSectionProp('borderColor', val);
                                }} style={inputSt} />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* ACCORDION GROUP 4: Special Search fields */}
                      {(settLayout === 'genre_tiles' || settLayout === 'ad_break_banner' || settLayout === 'hashtag_slides') && (
                        <div style={cardSt({ padding: '10px 14px', background: '#ffffff' })}>
                          <div onClick={() => setExpandedSection(expandedSection === 'special' ? 'info' : 'special')}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: C.primary }}>🔍 Search Layout Settings</span>
                            <span style={{ fontSize: 8, color: C.muted }}>{expandedSection === 'special' ? '▼' : '▶'}</span>
                          </div>
                          
                          {expandedSection === 'special' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                              {settLayout === 'ad_break_banner' && (
                                <>
                                  <div>
                                    <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Sponsor Name</label>
                                    <input value={settSponsorName} onChange={e => {
                                      const val = e.target.value;
                                      setSettSponsorName(val);
                                      updateSelectedSectionProp('sponsorName', val);
                                    }} placeholder="e.g. ICICI LOMBARD" style={inputSt} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Media Type</label>
                                    <select value={settMediaType} onChange={e => {
                                      const val = e.target.value as 'image' | 'video';
                                      setSettMediaType(val);
                                      updateSelectedSectionProp('mediaType', val);
                                    }} style={inputSt}>
                                      <option value="image">Image (Poster / Image Banner)</option>
                                      <option value="video">Video (Auto-playing Loop)</option>
                                    </select>
                                  </div>
                                  {settMediaType === 'image' ? (
                                    <div>
                                      <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Sponsor Image URL</label>
                                      <input value={settCustomImage} onChange={e => {
                                        const val = e.target.value;
                                        setSettCustomImage(val);
                                        updateSelectedSectionProp('customImage', val);
                                      }} placeholder="https://images.unsplash.com/..." style={inputSt} />
                                    </div>
                                  ) : (
                                    <div>
                                      <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Sponsor Video URL (MP4 loop)</label>
                                      <input value={settCustomVideo} onChange={e => {
                                        const val = e.target.value;
                                        setSettCustomVideo(val);
                                        updateSelectedSectionProp('customVideo', val);
                                      }} placeholder="Paste loop video URL (e.g. https://...mp4)" style={inputSt} />
                                      
                                      <div style={{ fontSize: 8, color: C.muted, marginTop: 4, marginBottom: 2 }}>Quick Loop Video Presets:</div>
                                      <div style={{ display: 'flex', gap: 6, overflowX: 'auto', paddingBottom: 4 }} className="no-scrollbar">
                                        {[
                                          { name: 'Vinyl Spin', url: 'https://assets.mixkit.co/videos/preview/mixkit-spinning-vinyl-record-player-43285-large.mp4' },
                                          { name: 'Retro Grid', url: 'https://assets.mixkit.co/videos/preview/mixkit-retro-futuristic-grid-background-42862-large.mp4' },
                                          { name: 'Cyber Neon', url: 'https://assets.mixkit.co/videos/preview/mixkit-tunnel-of-futuristic-blue-neon-lights-42417-large.mp4' },
                                          { name: 'Ambient Wave', url: 'https://assets.mixkit.co/videos/preview/mixkit-wavy-lines-of-colorful-light-42289-large.mp4' }
                                        ].map(vid => (
                                          <div key={vid.name} 
                                            onClick={() => {
                                              setSettCustomVideo(vid.url);
                                              updateSelectedSectionProp('customVideo', vid.url);
                                            }}
                                            style={{
                                              padding: '3px 8px', borderRadius: 4, background: 'rgba(43,34,26,0.08)', cursor: 'pointer',
                                              border: settCustomVideo === vid.url ? `1px solid ${C.primary}` : '1px solid #444',
                                              fontSize: 8, color: '#221a15', whiteSpace: 'nowrap'
                                            }}
                                            title={vid.name}
                                          >
                                            {vid.name}
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                  <div>
                                    <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Button text</label>
                                    <input value={settButtonText} onChange={e => {
                                      const val = e.target.value;
                                      setSettButtonText(val);
                                      updateSelectedSectionProp('buttonText', val);
                                    }} placeholder="e.g. Buy now" style={inputSt} />
                                  </div>
                                  <div>
                                    <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Button Link URL</label>
                                    <input value={settTargetUrl} onChange={e => {
                                      const val = e.target.value;
                                      setSettTargetUrl(val);
                                      updateSelectedSectionProp('targetUrl', val);
                                    }} placeholder="https://..." style={inputSt} />
                                  </div>
                                </>
                              )}
                              {settLayout === 'hashtag_slides' && (
                                <div>
                                  <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Hashtags (Comma list)</label>
                                  <textarea value={settHashtags} onChange={e => {
                                    const val = e.target.value;
                                    setSettHashtags(val);
                                    updateSelectedSectionProp('hashtags', val);
                                  }} placeholder="e.g. #tamil pop, #clean groove" style={{ ...inputSt, height: 60, fontFamily: 'monospace' }} />
                                </div>
                              )}
                              {settLayout === 'genre_tiles' && (
                                <div>
                                  <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Genres (Comma list)</label>
                                  <textarea value={settGenresList} onChange={e => {
                                    const val = e.target.value;
                                    setSettGenresList(val);
                                    updateSelectedSectionProp('genresList', val);
                                  }} placeholder="e.g. Music, Podcasts, Live Events" style={{ ...inputSt, height: 60, fontFamily: 'monospace' }} />
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {/* ACCORDION GROUP 5: Playlist Showcase Settings */}
                      {(selectedSection?.type === 'playlist_showcase' || (settLayout as string) === 'playlist_showcase' || selectedSection?.contentSource === 'playlist') && (
                        <div style={cardSt({ padding: '10px 14px', background: '#ffffff' })}>
                          <div onClick={() => setExpandedSection(expandedSection === 'special' ? 'info' : 'special')}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: C.primary }}>📋 Playlist Showcase Settings</span>
                            <span style={{ fontSize: 8, color: C.muted }}>{expandedSection === 'special' ? '▼' : '▶'}</span>
                          </div>
                          
                          {expandedSection === 'special' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
                              <div>
                                <label style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, cursor: 'pointer', color: '#221a15' }}>
                                  <input type="checkbox" checked={settAutoPlaylist} onChange={e => {
                                    const val = e.target.checked;
                                    setSettAutoPlaylist(val);
                                    updateSelectedSectionProp('autoPlaylist', val);
                                  }} style={{ accentColor: C.primary }} />
                                  Auto Playlist (AI user interest analysis)
                                </label>
                              </div>
                              
                              {!settAutoPlaylist && (
                                <div>
                                  <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Select Playlist</label>
                                  <select value={settTargetPlaylistId} onChange={e => {
                                    const val = e.target.value;
                                    setSettTargetPlaylistId(val);
                                    updateSelectedSectionProp('targetPlaylistId', val);
                                    updateSelectedSectionProp('targetId', val);
                                    updateSelectedSectionProp('contentSource', 'playlist');
                                  }} style={inputSt}>
                                    <option value="">-- Select Playlist --</option>
                                    {mockPlaylists.map(pl => (
                                      <option key={pl.id} value={pl.id}>{pl.title} ({pl.tracks.length} songs)</option>
                                    ))}
                                  </select>
                                </div>
                              )}

                              <div>
                                <label style={{ fontSize: 9, color: C.muted, display: 'block', marginBottom: 3 }}>Custom Title (e.g. Tamil Sleeping tablet 😴🙏)</label>
                                <input value={settTitle} onChange={e => {
                                  const val = e.target.value;
                                  setSettTitle(val);
                                  updateSelectedSectionProp('title', val);
                                }} placeholder="Enter custom title" style={inputSt} />
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {/* ACCORDION GROUP 6: Slider Banners Settings */}
                      {settLayout === 'hero_auto_slider' && (
                        <div style={cardSt({ padding: '10px 14px', background: '#ffffff' })}>
                          <div onClick={() => setExpandedSection(expandedSection === 'slider' ? 'info' : 'slider')}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                            <span style={{ fontSize: 10, fontWeight: 800, color: C.primary }}>🎠 Slider Banners ({selectedSection?.banners?.length || 0})</span>
                            <span style={{ fontSize: 8, color: C.muted }}>{expandedSection === 'slider' ? '▼' : '▶'}</span>
                          </div>
                          
                          {expandedSection === 'slider' && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginTop: 12 }}>
                              <div style={{ fontSize: 9, color: C.muted, lineHeight: 1.4 }}>
                                Configure multiple rotating slides for your hero auto slider. Slides auto-rotate every 3 seconds.
                              </div>
                              
                              {/* Render banner list */}
                              {(selectedSection?.banners || []).map((banner: any, index: number) => (
                                <div key={index} style={{ border: `1px solid ${C.border}`, borderRadius: 8, padding: 10, background: '#070707', display: 'flex', flexDirection: 'column', gap: 8, position: 'relative' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ fontSize: 9, fontWeight: 800, color: C.primary }}>Slide #{index + 1}</span>
                                    <button 
                                      onClick={() => {
                                        const nextBanners = (selectedSection?.banners || []).filter((_: any, i: number) => i !== index);
                                        updateSelectedSectionProp('banners', nextBanners);
                                      }}
                                      style={btnSt('danger', { padding: '2px 6px', fontSize: 8 })}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                  
                                  <div>
                                    <label style={{ fontSize: 8, color: C.muted, display: 'block', marginBottom: 2 }}>Title</label>
                                    <input 
                                      value={banner.title || ''} 
                                      onChange={e => {
                                        const nextBanners = [...(selectedSection?.banners || [])];
                                        nextBanners[index] = { ...nextBanners[index], title: e.target.value };
                                        updateSelectedSectionProp('banners', nextBanners);
                                      }} 
                                      style={inputSt} 
                                      placeholder="Banner Title"
                                    />
                                  </div>
                                  
                                  <div>
                                    <label style={{ fontSize: 8, color: C.muted, display: 'block', marginBottom: 2 }}>Subtitle</label>
                                    <input 
                                      value={banner.subtitle || ''} 
                                      onChange={e => {
                                        const nextBanners = [...(selectedSection?.banners || [])];
                                        nextBanners[index] = { ...nextBanners[index], subtitle: e.target.value };
                                        updateSelectedSectionProp('banners', nextBanners);
                                      }} 
                                      style={inputSt} 
                                      placeholder="Banner Subtitle / Description"
                                    />
                                  </div>

                                  <div>
                                    <label style={{ fontSize: 8, color: C.muted, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                                      <span>Image URL</span>
                                      <label style={{ cursor: 'pointer', background: 'rgba(255,255,255,0.05)', padding: '2px 8px', borderRadius: 4, border: `1px solid ${C.border}`, color: '#221a15', fontSize: 8, fontWeight: 600 }}>
                                        Upload
                                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => {
                                          const file = e.target.files?.[0];
                                          if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                              const val = event.target?.result as string;
                                              const nextBanners = [...(selectedSection?.banners || [])];
                                              nextBanners[index] = { ...nextBanners[index], imageUrl: val };
                                              updateSelectedSectionProp('banners', nextBanners);
                                            };
                                            reader.readAsDataURL(file);
                                          }
                                        }} />
                                      </label>
                                    </label>
                                    <input 
                                      value={banner.imageUrl || ''} 
                                      onChange={e => {
                                        const nextBanners = [...(selectedSection?.banners || [])];
                                        nextBanners[index] = { ...nextBanners[index], imageUrl: e.target.value };
                                        updateSelectedSectionProp('banners', nextBanners);
                                      }} 
                                      style={inputSt} 
                                      placeholder="Paste URL or upload image"
                                    />
                                  </div>

                                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                                    <div>
                                      <label style={{ fontSize: 8, color: C.muted, display: 'block', marginBottom: 2 }}>Button Text</label>
                                      <input 
                                        value={banner.buttonText || ''} 
                                        onChange={e => {
                                          const nextBanners = [...(selectedSection?.banners || [])];
                                          nextBanners[index] = { ...nextBanners[index], buttonText: e.target.value };
                                          updateSelectedSectionProp('banners', nextBanners);
                                        }} 
                                        style={inputSt} 
                                        placeholder="Play Now"
                                      />
                                    </div>
                                    <div>
                                      <label style={{ fontSize: 8, color: C.muted, display: 'block', marginBottom: 2 }}>Target Link</label>
                                      <input 
                                        value={banner.targetUrl || ''} 
                                        onChange={e => {
                                          const nextBanners = [...(selectedSection?.banners || [])];
                                          nextBanners[index] = { ...nextBanners[index], targetUrl: e.target.value };
                                          updateSelectedSectionProp('banners', nextBanners);
                                        }} 
                                        style={inputSt} 
                                        placeholder="e.g. /home or track ID"
                                      />
                                    </div>
                                  </div>
                                </div>
                              ))}
                              
                              <button 
                                onClick={() => {
                                  const currentBanners = selectedSection?.banners || [];
                                  const newBanner = {
                                    title: 'Beato Spotlight ' + (currentBanners.length + 1),
                                    subtitle: 'Discover new music releases',
                                    imageUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=500',
                                    buttonText: 'Play Now',
                                    targetUrl: '#'
                                  };
                                  updateSelectedSectionProp('banners', [...currentBanners, newBanner]);
                                }}
                                style={btnSt('outline', { width: '100%', padding: '8px' })}
                              >
                                ➕ Add Slider Banner
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      <button onClick={() => { setSelectedSection(null); }} style={btnSt('primary', { width: '100%', padding: '10px', fontSize: 11, marginTop: 'auto' })}>
                        ✓ Done Editing
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

            </motion.div>
          )}

          {/* ════ AI LAYOUT GENERATOR PANEL ════════════════════════════════ */}
          {activePanel === 'ai' && (
            <motion.div key="ai" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <div style={cardSt({ padding: '24px' })}>
                    <h3 style={{ margin: '0 0 6px', fontSize: 18, fontWeight: 900, fontFamily: 'Outfit, sans-serif' }}>🤖 AI Homepage Generator</h3>
                    <p style={{ margin: '0 0 20px', fontSize: 12, color: C.muted }}>Describe your layout goals, colors, and targeting targets, and let the AI generate a layout preset for you instantly.</p>
                    
                    <textarea value={aiPrompt} onChange={e => setAiPrompt(e.target.value)}
                      placeholder='Try: "Create a vibrant synthwave layout for night listening" or "Create a minimal black and gold theme for premium accounts"'
                      rows={4} style={{ ...inputSt, resize: 'vertical', lineHeight: 1.6, marginBottom: 14 }} />

                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
                      {[
                        '🎵 Classic Spotify Dark green theme',
                        '💎 Premium subscription gold upsell banner',
                        '⚡ Synthwave neon EDM music show',
                        '💕 Romantic Tamil melody vibe',
                        '🧘 Chill focus lo-fi study room',
                      ].map(s => (
                        <button key={s} onClick={() => setAiPrompt(s.replace(/^[^\s]+\s/, ''))}
                          style={{ ...pillSt(false), fontSize: 9 }}>
                          {s}
                        </button>
                      ))}
                    </div>

                    <button onClick={runAiGenerate} disabled={aiGenerating || !aiPrompt.trim()}
                      style={btnSt('primary', { padding: '10px 24px', opacity: aiGenerating ? 0.7 : 1 })}>
                      {aiGenerating ? '⏳ Generating Preset Layout…' : '✨ Generate Layout'}
                    </button>
                  </div>

                  {aiResult && (
                    <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={cardSt({ padding: '20px' })}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                        <div>
                          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700 }}>✅ Generated: "{aiResult.name}"</h4>
                          <p style={{ margin: '4px 0 0', fontSize: 11, color: C.muted }}>{aiResult.description}</p>
                        </div>
                        <button onClick={() => { applyPreset(aiResult); setAiResult(null); setActivePanel('builder'); }} style={btnSt('primary')}>
                          Apply to Builder
                        </button>
                      </div>
                      <div style={{ height: 60, borderRadius: 8, background: aiResult.thumbnail, marginBottom: 14 }} />
                      <div style={{ fontSize: 11, fontWeight: 700, color: C.muted, marginBottom: 8 }}>CONFIGURED SECTIONS:</div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {aiResult.sections.map((s, i) => (
                          <div key={s.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: '#fbf9f5', borderRadius: 6, border: `1px solid ${C.border}` }}>
                            <span style={{ color: C.primary, fontWeight: 700, fontSize: 10, width: 16 }}>{i + 1}</span>
                            <span style={{ fontSize: 11, fontWeight: 700, flex: 1 }}>{s.title}</span>
                            <span style={{ fontSize: 9, background: C.primaryDim, color: C.primary, padding: '2px 6px', borderRadius: 4 }}>{s.layout}</span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={cardSt()}>
                    <div style={{ fontSize: 11, fontWeight: 800, color: C.primary, marginBottom: 12 }}>📜 Generation History</div>
                    {aiHistory.length === 0 ? (
                      <div style={{ fontSize: 11, color: C.muted, textAlign: 'center', padding: '20px 0' }}>No prompt history yet.</div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {aiHistory.map((h, i) => (
                          <div key={i} onClick={() => { const p = getPresetById(h.presetId); if (p) setAiResult(p); }}
                            style={{ padding: '8px 10px', borderRadius: 6, background: '#fbf9f5', border: `1px solid ${C.border}`, cursor: 'pointer' }}>
                            <div style={{ fontSize: 11, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.prompt}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* ════ ML PERSONALIZATION DASHBOARD ════════════════════════════ */}
          {activePanel === 'ml' && moodProfile && (
            <motion.div key="ml" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <div style={{ ...cardSt({ padding: '24px', marginBottom: 20 }), background: `linear-gradient(135deg, #091c10 0%, #15091e 100%)`, border: `1px solid ${C.primary}33` }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 20, alignItems: 'center' }}>
                  <div>
                    <h2 style={{ margin: '0 0 4px', fontSize: 20, fontWeight: 900, fontFamily: 'Outfit, sans-serif' }}>🧠 ML Personalization Analytics</h2>
                    <p style={{ margin: 0, fontSize: 11, color: C.muted }}>Genre affinity vectors, weekly listening timeline, and mood shifts calculated dynamically.</p>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 44, fontWeight: 900, color: C.primary }}>{personalityScore?.overall || 76}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>Explorer Index</div>
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#221a15', marginTop: 2 }}>{personalityScore?.label || 'Aesthetic Explorer'}</div>
                  </div>
                </div>
              </div>

              {/* Charts grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>
                <div style={cardSt()}>
                  <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>📈 Listening Mood Shifts (7 Days)</div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 16 }}>Mood index scoring vectors over this week</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={timelineData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(43,34,26,0.07)" />
                      <XAxis dataKey="day" tick={{ fill: '#666', fontSize: 9 }} />
                      <YAxis tick={{ fill: '#666', fontSize: 9 }} domain={[0, 100]} />
                      <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid rgba(43,34,26,0.12)', borderRadius: 8, fontSize: 10 }} />
                      <Legend wrapperStyle={{ fontSize: 9 }} />
                      <Line type="monotone" dataKey="happy" stroke="#fbbf24" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="energetic" stroke="#ef4444" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="relaxed" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="focused" stroke="#10b981" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div style={cardSt()}>
                  <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>🕸️ Emotion Radar Matrix</div>
                  <div style={{ fontSize: 10, color: C.muted, marginBottom: 16 }}>Multi-dimensional acoustic listening signature</div>
                  <ResponsiveContainer width="100%" height={200}>
                    <RadarChart data={emotionData} cx="50%" cy="50%" outerRadius="70%">
                      <PolarGrid stroke="#222" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#666', fontSize: 9 }} />
                      <PolarRadiusAxis tick={{ fill: '#444', fontSize: 8 }} domain={[0, 100]} />
                      <Radar name="Emotion Score" dataKey="score" stroke={C.primary} fill={C.primary} fillOpacity={0.25} strokeWidth={2} />
                      <Tooltip contentStyle={{ background: '#ffffff', border: '1px solid rgba(43,34,26,0.12)', borderRadius: 8, fontSize: 10 }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Insights list */}
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, marginBottom: 12 }}>💡 AI Personalized insights & suggestions</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
                  {insightCards.slice(0, 3).map(card_item => (
                    <div key={card_item.id} style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${C.border}`, borderRadius: 12, padding: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <span style={{ fontSize: 18 }}>{card_item.icon}</span>
                        <span style={{ fontSize: 11, fontWeight: 800, flex: 1 }}>{card_item.title}</span>
                      </div>
                      <p style={{ margin: 0, fontSize: 10, color: C.muted, lineHeight: 1.5 }}>{card_item.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* ── Modals ────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {saveTemplateModal && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: 360 }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 900 }}>💾 Save layout as template</h3>
              <p style={{ margin: '0 0 16px', fontSize: 11, color: C.muted }}>Enter a name to save this builder layout list.</p>
              <input value={templateName} onChange={e => setTemplateName(e.target.value)} placeholder="e.g. Neon Festival campaign" style={{ ...inputSt, marginBottom: 14 }} autoFocus />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setSaveTemplateModal(false); setTemplateName(''); }} style={btnSt('outline')}>Cancel</button>
                <button onClick={saveAsTemplate} style={btnSt('primary')}>Save Template</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {importModalOpen && (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
            <div style={{ background: '#ffffff', border: `1px solid ${C.border}`, borderRadius: 16, padding: 24, width: 440 }}>
              <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 900 }}>📥 Import Layout JSON</h3>
              <p style={{ margin: '0 0 12px', fontSize: 11, color: C.muted }}>Paste the exported homepage design JSON schema.</p>
              <textarea value={importJson} onChange={e => setImportJson(e.target.value)} rows={8}
                placeholder='{"homeLayoutOrder": [...], "customSections": {...}}'
                style={{ ...inputSt, resize: 'vertical', marginBottom: 14, fontFamily: 'monospace', fontSize: 11 }} />
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setImportModalOpen(false); setImportJson(''); }} style={btnSt('outline')}>Cancel</button>
                <button onClick={importLayout} style={btnSt('primary')}>Import Layout</button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Section Right-Click Context Menu ───────────────────────────────── */}
      {sectionCtxMenu && (
        <>
          {/* Backdrop */}
          <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setSectionCtxMenu(null)} onContextMenu={e => { e.preventDefault(); setSectionCtxMenu(null); }} />
          {/* Menu */}
          <div style={{
            position: 'fixed', left: sectionCtxMenu.x, top: sectionCtxMenu.y,
            background: 'rgba(14,14,14,0.98)', backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12,
            padding: '6px 4px', zIndex: 99999, minWidth: 220,
            boxShadow: '0 12px 48px rgba(0,0,0,0.85)',
            fontFamily: 'Inter, sans-serif',
          }}>
            {/* Section title header */}
            <div style={{ padding: '6px 14px 8px', borderBottom: '1px solid rgba(255,255,255,0.07)', marginBottom: 4 }}>
              <div style={{ fontSize: 9, color: '#606060', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Section</div>
              <div style={{ fontSize: 12, fontWeight: 900, color: '#221a15', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 190 }}>{sectionCtxMenu.sec.title}</div>
            </div>

            {/* 🎨 Edit with Advanced Designer — HERO OPTION */}
            <button
              onClick={() => {
                const els = sectionToElements(sectionCtxMenu.sec);
                setDesignerInitialElements(els);
                setDesignerSectionId(sectionCtxMenu.sec.id);
                setShowDesigner(true);
                setSectionCtxMenu(null);
              }}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                background: 'linear-gradient(135deg, rgba(16, 185, 129,0.15), rgba(52, 211, 153,0.15))',
                border: '1px solid rgba(16, 185, 129,0.3)', borderRadius: 7,
                color: '#c084fc', fontSize: 12, fontWeight: 800,
                padding: '9px 14px', cursor: 'pointer', marginBottom: 4,
                transition: 'all 0.15s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129,0.3), rgba(52, 211, 153,0.3))'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'linear-gradient(135deg, rgba(16, 185, 129,0.15), rgba(52, 211, 153,0.15))'; }}
            >
              <span style={{ fontSize: 16 }}>🎨</span>
              <div>
                <div>Edit with Advanced Designer</div>
                <div style={{ fontSize: 9, color: 'rgba(192,132,252,0.7)', fontWeight: 400, marginTop: 1 }}>Open visual canvas editor</div>
              </div>
            </button>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '4px 8px' }} />

            {/* Quick section actions */}
            {[
              { icon: '✏️', label: 'Edit Properties', action: () => { selectSection(sectionCtxMenu.sec); setSectionCtxMenu(null); } },
              { icon: '❐', label: 'Duplicate Section', action: () => { duplicateSection(sectionCtxMenu.sec); setSectionCtxMenu(null); } },
              { icon: sectionCtxMenu.sec.hidden ? '👁' : '🙈', label: sectionCtxMenu.sec.hidden ? 'Show Section' : 'Hide Section', action: () => { toggleHidden(sectionCtxMenu.sec.id); setSectionCtxMenu(null); } },
              { icon: '🗑', label: 'Delete Section', action: () => { deleteSection(sectionCtxMenu.sec.id); setSectionCtxMenu(null); } },
            ].map(item => (
              <button
                key={item.label}
                onClick={item.action}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'transparent', border: 'none', color: '#d4d4d4', fontSize: 11, padding: '7px 14px', cursor: 'pointer', borderRadius: 6 }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ width: 18, textAlign: 'center' }}>{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}

      {/* ── Advanced Designer Overlay ──────────────────────────────────────────── */}
      {showDesigner && (
        <Suspense fallback={
          <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: '#070707', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16 }}>
            <div style={{ fontSize: 40 }}>🎨</div>
            <div style={{ fontSize: 14, color: '#b08850', fontWeight: 700, fontFamily: 'Outfit' }}>Loading Advanced Designer…</div>
            <div style={{ width: 200, height: 3, background: 'rgba(43,34,26,0.08)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ width: '60%', height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: 2 }} />
            </div>
          </div>
        }>
          <AdvancedDesigner
            key={designerInitialElements ? JSON.stringify(designerInitialElements[0]?.id) : 'global'}
            initialElements={designerInitialElements}
            sectionName={designerInitialElements ? (designerInitialElements[0]?.name?.replace(' — Background', '') || undefined) : undefined}
            onClose={() => { setShowDesigner(false); setDesignerInitialElements(undefined); setDesignerSectionId(undefined); }}
            onSave={(elements) => {
              if (designerSectionId) {
                saveDesignerElementsToSection(designerSectionId, elements);
                toast.success(`🎨 Saved visual changes back to "${designerInitialElements ? (designerInitialElements[0]?.name?.replace(' — Background', '') || 'Section') : 'Section'}"!`);
              } else {
                toast.success(`🎨 ${elements.length} elements saved globally!`);
              }
              setShowDesigner(false);
              setDesignerInitialElements(undefined);
              setDesignerSectionId(undefined);
            }}
          />
        </Suspense>
      )}

    </div>
  );
}
