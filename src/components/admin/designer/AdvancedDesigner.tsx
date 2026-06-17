'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════
type ElementType = 'text' | 'image' | 'button' | 'shape' | 'container' | 'badge' | 'divider';
type ShapeKind = 'rectangle' | 'circle' | 'triangle' | 'diamond' | 'star' | 'pentagon' | 'arrow' | 'line';
type AnimType = 'none' | 'fade' | 'slideUp' | 'slideDown' | 'slideLeft' | 'slideRight' | 'zoomIn' | 'zoomOut' | 'bounce' | 'pulse' | 'rotate';
type TextAlign = 'left' | 'center' | 'right';
type ObjectFit = 'cover' | 'contain' | 'fill';
type FontWeight = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;
type DeviceMode = 'desktop' | 'laptop' | 'tablet' | 'mobile';
type ResizeHandle = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';
type InspectorTab = 'content' | 'style' | 'animation';
type LeftTab = 'elements' | 'shapes' | 'media' | 'layers';

interface TextProps {
  content: string; fontFamily: string; fontSize: number; fontWeight: FontWeight;
  color: string; textGradient?: string; textShadow?: string;
  letterSpacing: number; lineHeight: number; textAlign: TextAlign;
  italic: boolean; underline: boolean; uppercase: boolean;
}
interface ImageProps {
  src: string; alt: string; objectFit: ObjectFit; borderRadius: number;
  opacity: number; grayscale: number; blur: number; brightness: number;
}
interface ButtonProps {
  label: string; href: string; bgColor: string; textColor: string;
  borderRadius: number; fontSize: number; fontWeight: FontWeight;
  fontFamily: string; paddingX: number; paddingY: number;
}
interface ShapeProps {
  kind: ShapeKind; fill: string; fillGradient?: string;
  stroke: string; strokeWidth: number; borderRadius: number; points: number; opacity: number;
}
interface ContainerProps {
  bgColor: string; bgGradient?: string; borderRadius: number;
  border: string; borderColor: string; borderWidth: number; boxShadow: string; padding: number;
}
interface BadgeProps { label: string; bgColor: string; textColor: string; borderRadius: number; fontSize: number; }
interface ElementStyle { opacity: number; boxShadow?: string; }
interface ElementAnimation { type: AnimType; duration: number; delay: number; loop: boolean; direction: 'normal' | 'reverse' | 'alternate'; }

export interface DesignerElement {
  id: string; type: ElementType; name: string;
  x: number; y: number; width: number; height: number;
  rotation: number; zIndex: number; locked: boolean; hidden: boolean;
  text?: TextProps; image?: ImageProps; button?: ButtonProps;
  shape?: ShapeProps; container?: ContainerProps; badge?: BadgeProps;
  elStyle: ElementStyle; animation: ElementAnimation;
}

// ═══════════════════════════════════════════════════════════════════
// DESIGN TOKENS
// ═══════════════════════════════════════════════════════════════════
const D = {
  bg: '#070707', surface: '#0f0f0f', panel: '#111111', card: '#181818',
  border: '#242424', borderHover: '#383838', text: '#ffffff',
  muted: '#606060', mutedLight: '#888888', primary: '#b08850',
  primaryDim: 'rgba(176, 136, 80,0.15)', blue: '#10b981', blueDim: 'rgba(16, 185, 129,0.12)',
  purple: '#10b981', orange: '#f59e0b', red: '#ef4444', pink: '#34d399',
  sel: '#10b981', canvasBg: '#0c0c0c',
};

const DEVICE_SIZES: Record<DeviceMode, { w: number; h: number; label: string }> = {
  desktop: { w: 1440, h: 900, label: '🖥 1440' },
  laptop:  { w: 1024, h: 680, label: '💻 1024' },
  tablet:  { w: 768,  h: 1024, label: '📱 768'  },
  mobile:  { w: 390,  h: 844,  label: '📱 390'  },
};

const FONTS = ['Inter', 'Outfit', 'Roboto', 'Poppins', 'Playfair Display', 'Oswald', 'Montserrat', 'Lato', 'Georgia', 'Courier New'];

const ANIM_OPTIONS: { v: AnimType; label: string; icon: string }[] = [
  { v: 'none',       label: 'None',        icon: '○' },
  { v: 'fade',       label: 'Fade',        icon: '◐' },
  { v: 'slideUp',    label: 'Slide Up',    icon: '↑' },
  { v: 'slideDown',  label: 'Slide Down',  icon: '↓' },
  { v: 'slideLeft',  label: 'Slide Left',  icon: '←' },
  { v: 'slideRight', label: 'Slide Right', icon: '→' },
  { v: 'zoomIn',     label: 'Zoom In',     icon: '⊕' },
  { v: 'zoomOut',    label: 'Zoom Out',    icon: '⊖' },
  { v: 'bounce',     label: 'Bounce',      icon: '⤡' },
  { v: 'pulse',      label: 'Pulse',       icon: '◎' },
  { v: 'rotate',     label: 'Rotate',      icon: '↻' },
];

// ═══════════════════════════════════════════════════════════════════
// FACTORIES
// ═══════════════════════════════════════════════════════════════════
let _ctr = 0;
const gid = (p: string) => `${p}_${Date.now()}_${++_ctr}`;
const defAnim = (): ElementAnimation => ({ type: 'none', duration: 0.5, delay: 0, loop: false, direction: 'normal' });
const defStyle = (): ElementStyle => ({ opacity: 1 });

function mkText(content: string, x: number, y: number, fs = 22, fw: FontWeight = 700): DesignerElement {
  return { id: gid('text'), type: 'text', name: 'Text', x, y, width: 320, height: 44, rotation: 0, zIndex: 1, locked: false, hidden: false, elStyle: defStyle(), animation: defAnim(),
    text: { content, fontFamily: 'Outfit', fontSize: fs, fontWeight: fw, color: '#ffffff', letterSpacing: 0, lineHeight: 1.4, textAlign: 'left', italic: false, underline: false, uppercase: false } };
}
function mkImage(src: string, x: number, y: number, w = 300, h = 200): DesignerElement {
  return { id: gid('image'), type: 'image', name: 'Image', x, y, width: w, height: h, rotation: 0, zIndex: 1, locked: false, hidden: false, elStyle: defStyle(), animation: defAnim(),
    image: { src, alt: '', objectFit: 'cover', borderRadius: 10, opacity: 1, grayscale: 0, blur: 0, brightness: 100 } };
}
function mkButton(label: string, x: number, y: number): DesignerElement {
  return { id: gid('button'), type: 'button', name: 'Button', x, y, width: 160, height: 44, rotation: 0, zIndex: 1, locked: false, hidden: false, elStyle: defStyle(), animation: defAnim(),
    button: { label, href: '#', bgColor: '#b08850', textColor: '#000000', borderRadius: 22, fontSize: 13, fontWeight: 700, fontFamily: 'Inter', paddingX: 20, paddingY: 10 } };
}
function mkShape(kind: ShapeKind, x: number, y: number, w = 130, h = 130): DesignerElement {
  return { id: gid('shape'), type: 'shape', name: kind.charAt(0).toUpperCase() + kind.slice(1), x, y, width: w, height: h, rotation: 0, zIndex: 1, locked: false, hidden: false, elStyle: defStyle(), animation: defAnim(),
    shape: { kind, fill: '#b08850', stroke: 'transparent', strokeWidth: 0, borderRadius: 8, points: 5, opacity: 1 } };
}
function mkContainer(x: number, y: number, w = 380, h = 240): DesignerElement {
  return { id: gid('container'), type: 'container', name: 'Container', x, y, width: w, height: h, rotation: 0, zIndex: 1, locked: false, hidden: false, elStyle: defStyle(), animation: defAnim(),
    container: { bgColor: 'rgba(255,255,255,0.04)', borderRadius: 14, border: 'solid', borderColor: 'rgba(255,255,255,0.08)', borderWidth: 1, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', padding: 20 } };
}
function mkBadge(label: string, x: number, y: number): DesignerElement {
  return { id: gid('badge'), type: 'badge', name: 'Badge', x, y, width: 72, height: 22, rotation: 0, zIndex: 1, locked: false, hidden: false, elStyle: defStyle(), animation: defAnim(),
    badge: { label, bgColor: '#b08850', textColor: '#000000', borderRadius: 11, fontSize: 9 } };
}

function starterElements(): DesignerElement[] {
  return [
    { ...mkContainer(60, 60, 620, 340), zIndex: 1,
      container: { bgColor: 'rgba(255,255,255,0.03)', borderRadius: 16, border: 'solid', borderColor: 'rgba(255,255,255,0.07)', borderWidth: 1, boxShadow: '0 20px 60px rgba(0,0,0,0.6)', padding: 28 } },
    { ...mkImage('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600', 420, 90, 230, 210), zIndex: 2 },
    { ...mkBadge('✦ NEW RELEASE', 90, 92), zIndex: 3,
      badge: { label: '✦ NEW RELEASE', bgColor: '#b08850', textColor: '#000', borderRadius: 11, fontSize: 8 } },
    { ...mkText('Good Morning 🎵', 90, 126, 28, 900), zIndex: 4, width: 290 },
    { ...mkText('Your personalized stage, powered by AI', 90, 172, 12, 400), zIndex: 5, width: 270,
      text: { content: 'Your personalized stage, powered by AI', fontFamily: 'Inter', fontSize: 12, fontWeight: 400, color: '#888888', letterSpacing: 0, lineHeight: 1.5, textAlign: 'left', italic: false, underline: false, uppercase: false } },
    { ...mkButton('▶ Start Listening', 90, 218), zIndex: 6 },
    { ...mkText('Trending Now', 60, 430, 17, 800), zIndex: 7 },
  ];
}

// ═══════════════════════════════════════════════════════════════════
// STYLE HELPERS
// ═══════════════════════════════════════════════════════════════════
const inp = (extra?: React.CSSProperties): React.CSSProperties => ({
  background: '#0a0a0a', border: `1px solid ${D.border}`, borderRadius: 5,
  color: D.text, fontSize: 11, padding: '5px 8px', width: '100%',
  outline: 'none', boxSizing: 'border-box', ...extra,
});
const lbl: React.CSSProperties = { fontSize: 9, color: D.muted, display: 'block', marginBottom: 3 };
const secTitle: React.CSSProperties = { fontSize: 9, color: D.muted, fontWeight: 800, textTransform: 'uppercase' as const, letterSpacing: '0.08em', marginBottom: 8 };
const iconBtn = (active = false): React.CSSProperties => ({
  background: active ? D.primary : D.card, color: active ? '#000' : D.text,
  border: `1px solid ${active ? D.primary : D.border}`, borderRadius: 5,
  padding: '4px 8px', fontSize: 10, fontWeight: 700, cursor: 'pointer', outline: 'none',
});

// ═══════════════════════════════════════════════════════════════════
// SHAPE SVG RENDERER
// ═══════════════════════════════════════════════════════════════════
function ShapeSVG({ el, dw, dh }: { el: DesignerElement; dw: number; dh: number }) {
  if (!el.shape) return null;
  const { kind, fill, fillGradient, stroke, strokeWidth, borderRadius, points = 5, opacity } = el.shape;
  const w = dw; const h = dh;
  const gradId = `grad_${el.id}`;

  const gradDef = fillGradient ? (
    <defs>
      <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
        {fillGradient.split(',').map((c, i, arr) => (
          <stop key={i} offset={`${(i / Math.max(arr.length - 1, 1)) * 100}%`} stopColor={c.trim()} />
        ))}
      </linearGradient>
    </defs>
  ) : null;

  const fillVal = fillGradient ? `url(#${gradId})` : fill;
  const sw = strokeWidth || 0;
  const cp: any = { fill: fillVal as string, stroke, strokeWidth: sw, opacity };

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
  // Default: rectangle
  return <svg width={w} height={h}>{gradDef}<rect x={sw / 2} y={sw / 2} width={w - sw} height={h - sw} rx={borderRadius} {...cp} /></svg>;
}

// ═══════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════
interface Props {
  onClose: () => void;
  initialElements?: DesignerElement[];
  sectionName?: string;
  onSave?: (elements: DesignerElement[]) => void;
}

export default function AdvancedDesigner({ onClose, initialElements, sectionName, onSave }: Props) {
  // ── Core State ────────────────────────────────────────────────
  const [elements, setElements] = useState<DesignerElement[]>(() => {
    // If explicitly opened from a section, use those elements (not localStorage)
    if (initialElements && initialElements.length > 0) return initialElements as DesignerElement[];
    try {
      const saved = localStorage.getItem('ss_designer_els');
      return saved ? JSON.parse(saved) : starterElements();
    } catch { return starterElements(); }
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(0.62);
  const [device, setDevice] = useState<DeviceMode>('laptop');
  const [leftTab, setLeftTab] = useState<LeftTab>('elements');
  const [inspectorTab, setInspectorTab] = useState<InspectorTab>('content');
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; id: string } | null>(null);
  const [mediaPicker, setMediaPicker] = useState<{ open: boolean; targetId: string | null; tab: 'images' | 'url' }>({ open: false, targetId: null, tab: 'images' });
  const [mediaUrl, setMediaUrl] = useState('');
  const [copiedEl, setCopiedEl] = useState<DesignerElement | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [history, setHistory] = useState<DesignerElement[][]>([]);
  const [redo, setRedo] = useState<DesignerElement[][]>([]);
  const [renaming, setRenaming] = useState<{ id: string; val: string } | null>(null);
  const [showGrid, setShowGrid] = useState(true);
  const [animating, setAnimating] = useState<string | null>(null);

  // ── Canvas Chrome height in canvas-space pixels ────────────────
  const CHROME_H = 34;

  const canvasRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{
    type: 'move' | 'resize'; id: string; handle?: ResizeHandle;
    startMX: number; startMY: number;
    startX: number; startY: number; startW: number; startH: number;
    preState: DesignerElement[];
  } | null>(null);

  const selected = useMemo(() => elements.find(e => e.id === selectedId) ?? null, [elements, selectedId]);
  const sorted = useMemo(() => [...elements].sort((a, b) => a.zIndex - b.zIndex), [elements]);

  // ── History ────────────────────────────────────────────────────
  const pushH = (els: DesignerElement[]) => {
    setHistory(h => [...h, els].slice(-40));
    setRedo([]);
  };

  const undoFn = useCallback(() => {
    setHistory(h => {
      if (!h.length) return h;
      const prev = h[h.length - 1];
      setElements(cur => { setRedo(r => [...r, cur].slice(-40)); return prev; });
      return h.slice(0, -1);
    });
  }, []);

  const redoFn = useCallback(() => {
    setRedo(r => {
      if (!r.length) return r;
      const next = r[r.length - 1];
      setElements(cur => { setHistory(h => [...h, cur].slice(-40)); return next; });
      return r.slice(0, -1);
    });
  }, []);

  // ── Helpers ────────────────────────────────────────────────────
  const setEls = (next: DesignerElement[] | ((p: DesignerElement[]) => DesignerElement[]), saveH = true) => {
    setElements(prev => {
      const n = typeof next === 'function' ? next(prev) : next;
      if (saveH && JSON.stringify(prev) !== JSON.stringify(n)) pushH(prev);
      setIsDirty(true);
      return n;
    });
  };

  const updEl = (id: string, patch: Partial<DesignerElement>) => {
    setElements(prev => prev.map(e => e.id === id ? { ...e, ...patch } : e));
    setIsDirty(true);
  };

  const updProp = <K extends keyof DesignerElement>(id: string, key: K, patch: Partial<DesignerElement[K] & object>) => {
    setElements(prev => prev.map(e => {
      if (e.id !== id) return e;
      return { ...e, [key]: { ...(e[key] as any), ...patch } };
    }));
    setIsDirty(true);
  };

  // ── Auto-save ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isDirty) return;
    const t = setTimeout(() => {
      try {
        localStorage.setItem('ss_designer_els', JSON.stringify(elements));
        setSavedAt(new Date().toLocaleTimeString());
        setIsDirty(false);
      } catch {}
    }, 5000);
    return () => clearTimeout(t);
  }, [isDirty, elements]);

  // ── Load fonts ─────────────────────────────────────────────────
  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Outfit:wght@300;400;500;600;700;800;900&family=Roboto:wght@300;400;500;700&family=Poppins:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&family=Oswald:wght@300;400;500;600;700&family=Montserrat:wght@300;400;500;600;700;800&family=Lato:wght@300;400;700&display=swap';
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  // ── Keyboard ───────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT' || target.contentEditable === 'true') return;
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undoFn(); }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redoFn(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedId) {
        const el = elements.find(x => x.id === selectedId); if (el) setCopiedEl({ ...el });
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'v' && copiedEl) {
        const ne = { ...copiedEl, id: gid(copiedEl.type), x: copiedEl.x + 20, y: copiedEl.y + 20, name: copiedEl.name + ' Copy' };
        setEls(prev => [...prev, ne]); setSelectedId(ne.id);
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'd' && selectedId) {
        e.preventDefault();
        const el = elements.find(x => x.id === selectedId);
        if (el) { const nd = { ...el, id: gid(el.type), x: el.x + 20, y: el.y + 20, name: el.name + ' Copy' }; setEls(prev => [...prev, nd]); setSelectedId(nd.id); }
      }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedId && editingTextId !== selectedId) {
        setEls(prev => prev.filter(x => x.id !== selectedId)); setSelectedId(null);
      }
      if (e.key === 'Escape') { setSelectedId(null); setCtxMenu(null); setEditingTextId(null); }
      if (selectedId && !editingTextId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        const d = e.shiftKey ? 10 : 1;
        const dx = e.key === 'ArrowLeft' ? -d : e.key === 'ArrowRight' ? d : 0;
        const dy = e.key === 'ArrowUp' ? -d : e.key === 'ArrowDown' ? d : 0;
        setElements(prev => prev.map(el => el.id === selectedId ? { ...el, x: el.x + dx, y: el.y + dy } : el));
        setIsDirty(true);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [selectedId, elements, copiedEl, editingTextId, undoFn, redoFn]);

  // ── Canvas coords (convert screen click → canvas space) ───────
  // With direct scaling: canvas div is canvasW*zoom wide.
  // Element at canvas x renders at x*zoom screen pixels from canvas left.
  // So to get canvas coords: (screenOffset) / zoom
  const getCC = useCallback((e: MouseEvent | React.MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom - CHROME_H, // subtract chrome bar height
    };
  }, [zoom]);

  // ── Mouse event: element drag start ───────────────────────────
  const onElDown = useCallback((e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const el = elements.find(x => x.id === id);
    if (!el || el.locked || editingTextId === id) return;
    setSelectedId(id); setCtxMenu(null);
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left) / zoom;
    const my = (e.clientY - rect.top) / zoom - CHROME_H;
    dragState.current = {
      type: 'move', id, startMX: mx, startMY: my,
      startX: el.x, startY: el.y, startW: el.width, startH: el.height,
      preState: elements,
    };
  }, [elements, editingTextId, zoom]);

  // ── Mouse event: resize handle drag start ─────────────────────
  const onHandleDown = useCallback((e: React.MouseEvent, id: string, handle: ResizeHandle) => {
    e.stopPropagation(); e.preventDefault();
    const el = elements.find(x => x.id === id);
    if (!el) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const mx = (e.clientX - rect.left) / zoom;
    const my = (e.clientY - rect.top) / zoom - CHROME_H;
    dragState.current = {
      type: 'resize', id, handle, startMX: mx, startMY: my,
      startX: el.x, startY: el.y, startW: el.width, startH: el.height,
      preState: elements,
    };
  }, [elements, zoom]);

  // ── Document-level mouse move + up ────────────────────────────
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragState.current || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / zoom;
      const my = (e.clientY - rect.top) / zoom - CHROME_H;
      const ds = dragState.current;
      const dx = mx - ds.startMX;
      const dy = my - ds.startMY;

      if (ds.type === 'move') {
        setElements(prev => prev.map(el =>
          el.id === ds.id ? { ...el, x: Math.max(0, ds.startX + dx), y: Math.max(0, ds.startY + dy) } : el
        ));
      } else {
        const h = ds.handle!;
        let nx = ds.startX, ny = ds.startY, nw = ds.startW, nh = ds.startH;
        if (h.includes('e')) nw = Math.max(20, ds.startW + dx);
        if (h.includes('s')) nh = Math.max(20, ds.startH + dy);
        if (h.includes('w')) { nx = ds.startX + dx; nw = Math.max(20, ds.startW - dx); }
        if (h.includes('n')) { ny = ds.startY + dy; nh = Math.max(20, ds.startH - dy); }
        setElements(prev => prev.map(el =>
          el.id === ds.id ? { ...el, x: nx, y: ny, width: nw, height: nh } : el
        ));
      }
      setIsDirty(true);
    };

    const onUp = () => {
      if (dragState.current) {
        const pre = dragState.current.preState;
        setHistory(h => [...h, pre].slice(-40));
        setRedo([]);
        dragState.current = null;
      }
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
    return () => { document.removeEventListener('mousemove', onMove); document.removeEventListener('mouseup', onUp); };
  }, [zoom]);

  // ── Element operations ─────────────────────────────────────────
  const { w: dw, h: dh } = DEVICE_SIZES[device];
  const cx = dw / 2 - 100, cy = dh / 2 - 60;
  const maxZ = () => elements.reduce((m, e) => Math.max(m, e.zIndex), 0);

  const addEl = (type: ElementType, kind?: ShapeKind) => {
    let el: DesignerElement;
    switch (type) {
      case 'text':      el = mkText('Your text here', cx, cy, 20, 400); break;
      case 'image':     el = mkImage('https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600', cx, cy, 280, 190); break;
      case 'button':    el = mkButton('Click Me', cx, cy); break;
      case 'shape':     el = mkShape(kind || 'rectangle', cx, cy); break;
      case 'container': el = mkContainer(cx - 40, cy - 40, 380, 240); break;
      case 'badge':     el = mkBadge('BADGE', cx, cy); break;
      default:          el = mkText('Text', cx, cy);
    }
    el = { ...el, zIndex: maxZ() + 1 };
    setEls(prev => [...prev, el]);
    setSelectedId(el.id);
  };

  const dupEl = (id: string) => {
    const el = elements.find(e => e.id === id);
    if (!el) return;
    const ne = { ...el, id: gid(el.type), x: el.x + 20, y: el.y + 20, name: el.name + ' Copy', zIndex: maxZ() + 1 };
    setEls(prev => [...prev, ne]);
    setSelectedId(ne.id);
  };

  const delEl = (id: string) => {
    setEls(prev => prev.filter(e => e.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  const reorderZ = (id: string, dir: 'front' | 'back' | 'up' | 'down') => {
    setElements(prev => {
      const sorted2 = [...prev].sort((a, b) => a.zIndex - b.zIndex);
      const idx = sorted2.findIndex(e => e.id === id);
      if (dir === 'front') return prev.map(e => e.id === id ? { ...e, zIndex: sorted2[sorted2.length - 1].zIndex + 1 } : e);
      if (dir === 'back')  return prev.map(e => e.id === id ? { ...e, zIndex: 0 } : { ...e, zIndex: e.zIndex + 1 });
      if (dir === 'up' && idx < sorted2.length - 1) {
        const ab = sorted2[idx + 1];
        return prev.map(e => e.id === id ? { ...e, zIndex: ab.zIndex } : e.id === ab.id ? { ...e, zIndex: sorted2[idx].zIndex } : e);
      }
      if (dir === 'down' && idx > 0) {
        const bel = sorted2[idx - 1];
        return prev.map(e => e.id === id ? { ...e, zIndex: bel.zIndex } : e.id === bel.id ? { ...e, zIndex: sorted2[idx].zIndex } : e);
      }
      return prev;
    });
    setIsDirty(true);
  };

  // ── Resize handle positions ─────────────────────────────────────
  const HANDLE_SIZE = 10;
  const handles: { id: ResizeHandle; style: React.CSSProperties }[] = [
    { id: 'nw', style: { top: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2, cursor: 'nw-resize' } },
    { id: 'n',  style: { top: -HANDLE_SIZE/2, left: '50%', transform: 'translateX(-50%)', cursor: 'n-resize' } },
    { id: 'ne', style: { top: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2, cursor: 'ne-resize' } },
    { id: 'e',  style: { top: '50%', right: -HANDLE_SIZE/2, transform: 'translateY(-50%)', cursor: 'e-resize' } },
    { id: 'se', style: { bottom: -HANDLE_SIZE/2, right: -HANDLE_SIZE/2, cursor: 'se-resize' } },
    { id: 's',  style: { bottom: -HANDLE_SIZE/2, left: '50%', transform: 'translateX(-50%)', cursor: 's-resize' } },
    { id: 'sw', style: { bottom: -HANDLE_SIZE/2, left: -HANDLE_SIZE/2, cursor: 'sw-resize' } },
    { id: 'w',  style: { top: '50%', left: -HANDLE_SIZE/2, transform: 'translateY(-50%)', cursor: 'w-resize' } },
  ];

  // ═══════════════════════════════════════════════════════════════
  // RENDER: ELEMENT CONTENT
  // (dw, dh = display width/height of the element in screen pixels)
  // ═══════════════════════════════════════════════════════════════
  const renderContent = (el: DesignerElement, dispW: number, dispH: number) => {
    const isEditing = editingTextId === el.id;
    const z = zoom;

    if (el.type === 'text' && el.text) {
      const t = el.text;
      const ts: React.CSSProperties = {
        fontFamily: t.fontFamily,
        fontSize: t.fontSize * z,
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
        width: '100%', height: '100%', outline: 'none',
        cursor: isEditing ? 'text' : 'inherit',
        whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        margin: 0, padding: 4 * z, boxSizing: 'border-box',
      };
      return isEditing ? (
        <div contentEditable suppressContentEditableWarning style={ts}
          onBlur={e => { updProp(el.id, 'text', { content: e.currentTarget.textContent || '' }); setEditingTextId(null); }}
          onKeyDown={e => { if (e.key === 'Escape') setEditingTextId(null); e.stopPropagation(); }}
          ref={n => { if (n) n.focus(); }}>
          {t.content}
        </div>
      ) : <div style={ts}>{t.content}</div>;
    }

    if (el.type === 'image' && el.image) {
      const img = el.image;
      return (
        <div style={{ width: '100%', height: '100%', borderRadius: img.borderRadius * z, overflow: 'hidden', position: 'relative' }}>
          {img.src ? (
            <img src={img.src} alt={img.alt} draggable={false}
              style={{ width: '100%', height: '100%', objectFit: img.objectFit, opacity: img.opacity,
                filter: `grayscale(${img.grayscale}%) blur(${img.blur}px) brightness(${img.brightness}%)`, display: 'block' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, color: D.muted }}>🖼️</div>
          )}
          {hoveredId === el.id && !isEditing && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <span style={{ color: '#fff', fontSize: 9 * z, fontWeight: 700, background: 'rgba(0,0,0,0.7)', padding: `${3*z}px ${10*z}px`, borderRadius: 4 }}>Double-click to replace</span>
            </div>
          )}
        </div>
      );
    }

    if (el.type === 'button' && el.button) {
      const b = el.button;
      return (
        <div style={{ width: '100%', height: '100%', background: b.bgColor, color: b.textColor,
          borderRadius: b.borderRadius * z, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: b.fontFamily, fontSize: b.fontSize * z, fontWeight: b.fontWeight,
          cursor: 'pointer', userSelect: 'none', boxSizing: 'border-box' }}>
          {b.label}
        </div>
      );
    }

    if (el.type === 'shape') return (
      <div style={{ width: '100%', height: '100%' }}>
        <ShapeSVG el={el} dw={dispW} dh={dispH} />
      </div>
    );

    if (el.type === 'container' && el.container) {
      const c = el.container;
      return <div style={{
        width: '100%', height: '100%',
        background: c.bgGradient || c.bgColor,
        borderRadius: c.borderRadius * z,
        border: c.borderWidth > 0 ? `${c.borderWidth}px ${c.border} ${c.borderColor}` : 'none',
        boxShadow: c.boxShadow, overflow: 'hidden', boxSizing: 'border-box',
      }} />;
    }

    if (el.type === 'badge' && el.badge) {
      const b = el.badge;
      return <div style={{ width: '100%', height: '100%', background: b.bgColor, color: b.textColor,
        borderRadius: b.borderRadius * z, display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: b.fontSize * z, fontWeight: 800, fontFamily: 'Inter', letterSpacing: '0.07em' }}>{b.label}</div>;
    }

    if (el.type === 'divider') return <div style={{ width: '100%', height: '100%', background: 'rgba(255,255,255,0.12)', borderRadius: 2 }} />;

    return null;
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER: ELEMENT ON CANVAS
  // KEY: elements are positioned in CANVAS SPACE (el.x, el.y)
  // Rendered at DISPLAY SPACE (el.x * zoom, el.y * zoom)
  // This eliminates CSS transform hit-test issues.
  // ═══════════════════════════════════════════════════════════════
  const renderEl = (el: DesignerElement) => {
    const isSel = selectedId === el.id;
    const isHov = hoveredId === el.id && !isSel;
    if (el.hidden && !isSel) return null;

    // Display size in screen pixels
    const dispX = el.x * zoom;
    const dispY = el.y * zoom;
    const dispW = el.width * zoom;
    const dispH = el.height * zoom;

    const animStyle: React.CSSProperties = animating === el.id && el.animation.type !== 'none' ? {
      animation: `ss_${el.animation.type} ${el.animation.duration}s ${el.animation.delay}s ${el.animation.loop ? 'infinite' : '1'} ${el.animation.direction}`,
    } : {};

    return (
      <div key={el.id}
        style={{
          position: 'absolute',
          left: dispX, top: dispY,
          width: dispW, height: dispH,
          transform: `rotate(${el.rotation}deg)`,
          zIndex: el.zIndex,
          cursor: el.locked ? 'default' : 'grab',
          outline: isSel
            ? `2px solid ${D.sel}`
            : isHov
              ? `1px dashed rgba(16, 185, 129,0.6)`
              : '2px solid transparent',
          outlineOffset: 1,
          opacity: el.hidden ? 0.3 : el.elStyle.opacity,
          boxShadow: el.elStyle.boxShadow || 'none',
          userSelect: 'none', boxSizing: 'border-box',
          ...animStyle,
        }}
        onMouseDown={e => onElDown(e, el.id)}
        onMouseEnter={() => !el.locked && setHoveredId(el.id)}
        onMouseLeave={() => setHoveredId(null)}
        onDoubleClick={e => {
          e.stopPropagation();
          if (el.type === 'text') { setEditingTextId(el.id); setSelectedId(el.id); }
          if (el.type === 'image') { setMediaPicker({ open: true, targetId: el.id, tab: 'images' }); setSelectedId(el.id); }
        }}
        onContextMenu={e => {
          e.preventDefault(); e.stopPropagation();
          setSelectedId(el.id);
          setCtxMenu({ x: e.clientX, y: e.clientY, id: el.id });
        }}
      >
        {renderContent(el, dispW, dispH)}

        {/* Resize handles */}
        {isSel && !el.locked && handles.map(h => (
          <div key={h.id} onMouseDown={e => onHandleDown(e, el.id, h.id)}
            style={{
              position: 'absolute', width: HANDLE_SIZE, height: HANDLE_SIZE,
              background: '#fff', border: `2px solid ${D.sel}`, borderRadius: 2,
              zIndex: 9999, ...h.style,
            }} />
        ))}

        {/* Floating mini-toolbar */}
        {isSel && !el.locked && (
          <div
            style={{
              position: 'absolute', top: -38, left: '50%', transform: 'translateX(-50%)',
              background: 'rgba(10,10,10,0.97)', backdropFilter: 'blur(12px)',
              border: `1px solid ${D.border}`, borderRadius: 8,
              padding: '3px 5px', display: 'flex', gap: 1,
              zIndex: 9999, whiteSpace: 'nowrap',
              boxShadow: '0 4px 20px rgba(0,0,0,0.7)', pointerEvents: 'all',
            }}
            onMouseDown={e => e.stopPropagation()}
          >
            <span style={{ fontSize: 9, color: D.muted, padding: '2px 8px 2px 4px', display: 'flex', alignItems: 'center', borderRight: `1px solid ${D.border}`, marginRight: 3 }}>{el.name}</span>
            {[
              { icon: '⬆', title: 'Bring Forward',      fn: () => reorderZ(el.id, 'up')           },
              { icon: '⬇', title: 'Send Backward',      fn: () => reorderZ(el.id, 'down')         },
              { icon: '❐', title: 'Duplicate (Ctrl+D)', fn: () => dupEl(el.id)                    },
              { icon: el.locked ? '🔓' : '🔒', title: el.locked ? 'Unlock' : 'Lock', fn: () => updEl(el.id, { locked: !el.locked }) },
              { icon: el.hidden ? '👁' : '🙈', title: el.hidden ? 'Show' : 'Hide',   fn: () => updEl(el.id, { hidden: !el.hidden }) },
              { icon: '🗑', title: 'Delete',            fn: () => delEl(el.id)                    },
            ].map(a => (
              <button key={a.icon} title={a.title} onClick={e => { e.stopPropagation(); a.fn(); }}
                style={{ background: 'transparent', border: 'none', color: D.text, fontSize: 12, cursor: 'pointer', padding: '3px 7px', borderRadius: 5 }}
                onMouseEnter={e => (e.currentTarget.style.background = D.border)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                {a.icon}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER: CONTEXT MENU
  // ═══════════════════════════════════════════════════════════════
  const renderCtx = () => {
    if (!ctxMenu) return null;
    const el = elements.find(e => e.id === ctxMenu.id);
    if (!el) return null;
    const items: Array<{ label: string; icon: string; action: () => void } | 'sep'> = [
      { label: 'Edit Properties',  icon: '⚙',  action: () => { setInspectorTab('content'); setCtxMenu(null); } },
      'sep',
      { label: 'Duplicate',        icon: '❐',  action: () => { dupEl(ctxMenu.id); setCtxMenu(null); } },
      { label: 'Copy (Ctrl+C)',     icon: '⎘',  action: () => { setCopiedEl({ ...el }); setCtxMenu(null); } },
      ...(copiedEl ? [{ label: 'Paste (Ctrl+V)', icon: '⊕', action: () => {
        const ne = { ...copiedEl, id: gid(copiedEl.type), x: copiedEl.x + 20, y: copiedEl.y + 20, name: copiedEl.name + ' Copy' };
        setEls(p => [...p, ne]); setSelectedId(ne.id); setCtxMenu(null);
      }}] : []),
      'sep',
      { label: 'Bring to Front',   icon: '⬆⬆', action: () => { reorderZ(el.id, 'front'); setCtxMenu(null); } },
      { label: 'Send to Back',     icon: '⬇⬇', action: () => { reorderZ(el.id, 'back');  setCtxMenu(null); } },
      { label: 'Move Forward',     icon: '⬆',  action: () => { reorderZ(el.id, 'up');    setCtxMenu(null); } },
      { label: 'Move Backward',    icon: '⬇',  action: () => { reorderZ(el.id, 'down');  setCtxMenu(null); } },
      'sep',
      { label: el.locked ? 'Unlock' : 'Lock', icon: '🔒', action: () => { updEl(el.id, { locked: !el.locked }); setCtxMenu(null); } },
      { label: el.hidden ? 'Show' : 'Hide',   icon: '👁',  action: () => { updEl(el.id, { hidden: !el.hidden  }); setCtxMenu(null); } },
      'sep',
      { label: 'Delete',           icon: '🗑',  action: () => { delEl(ctxMenu.id); setCtxMenu(null); } },
    ] as any[];

    return (
      <>
        <div style={{ position: 'fixed', inset: 0, zIndex: 99998 }} onClick={() => setCtxMenu(null)} />
        <div style={{ position: 'fixed', left: ctxMenu.x, top: ctxMenu.y, background: 'rgba(16,16,16,0.98)', backdropFilter: 'blur(14px)', border: `1px solid ${D.border}`, borderRadius: 10, padding: '5px 3px', zIndex: 99999, minWidth: 185, boxShadow: '0 10px 40px rgba(0,0,0,0.8)' }}
          onMouseDown={e => e.stopPropagation()}>
          {items.map((a, i) => a === 'sep' ? (
            <div key={i} style={{ height: 1, background: D.border, margin: '4px 8px' }} />
          ) : (
            <button key={i} onClick={a.action}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', background: 'transparent', border: 'none', color: D.text, fontSize: 11, padding: '6px 12px', cursor: 'pointer', borderRadius: 5, textAlign: 'left' }}
              onMouseEnter={e => (e.currentTarget.style.background = D.border)}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
              <span style={{ width: 16, textAlign: 'center', fontSize: 11 }}>{a.icon}</span>
              {a.label}
            </button>
          ))}
        </div>
      </>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER: LEFT PANEL
  // ═══════════════════════════════════════════════════════════════
  const renderLeft = () => {
    const elGroups = [
      { label: 'Text', items: [
        { icon: '𝗛', label: 'Heading',    fn: () => { const e = mkText('Heading', cx, cy, 34, 900);    setEls(p => [...p, { ...e, zIndex: maxZ() + 1 }]); setSelectedId(e.id); } },
        { icon: '𝗦', label: 'Subheading', fn: () => { const e = mkText('Subheading', cx, cy, 20, 600); setEls(p => [...p, { ...e, zIndex: maxZ() + 1 }]); setSelectedId(e.id); } },
        { icon: 'A', label: 'Body',        fn: () => { const e = mkText('Body text here...', cx, cy, 14, 400); setEls(p => [...p, { ...e, zIndex: maxZ() + 1 }]); setSelectedId(e.id); } },
        { icon: 'a', label: 'Caption',     fn: () => { const e = mkText('Caption', cx, cy, 11, 400); setEls(p => [...p, { ...e, zIndex: maxZ() + 1, width: 200, height: 28 }]); setSelectedId(e.id); } },
      ]},
      { label: 'Media', items: [{ icon: '🖼', label: 'Image', fn: () => addEl('image') }] },
      { label: 'Interactive', items: [
        { icon: '◉', label: 'Button',  fn: () => addEl('button') },
        { icon: '⬛', label: 'Badge',   fn: () => addEl('badge')  },
      ]},
      { label: 'Layout', items: [
        { icon: '▭', label: 'Container', fn: () => addEl('container') },
        { icon: '—', label: 'Divider',   fn: () => addEl('divider')   },
      ]},
    ];

    const shapes: { kind: ShapeKind; icon: string }[] = [
      { kind: 'rectangle', icon: '▭' }, { kind: 'circle',   icon: '●' },
      { kind: 'triangle',  icon: '▲' }, { kind: 'diamond',  icon: '◇' },
      { kind: 'star',      icon: '★' }, { kind: 'pentagon', icon: '⬠' },
      { kind: 'arrow',     icon: '→' }, { kind: 'line',     icon: '—' },
    ];

    const media = [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=200',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=200',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=200',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=200',
      'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=200',
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=200',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=200',
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=200',
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=200',
      'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=200',
    ];

    const sortedLayers = [...elements].sort((a, b) => b.zIndex - a.zIndex);

    return (
      <div style={{ width: 215, background: D.panel, borderRight: `1px solid ${D.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Tab nav */}
        <div style={{ display: 'flex', borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
          {([
            { t: 'elements' as LeftTab, icon: '⊞' },
            { t: 'shapes'   as LeftTab, icon: '◇' },
            { t: 'media'    as LeftTab, icon: '🖼' },
            { t: 'layers'   as LeftTab, icon: '≡' },
          ]).map(({ t, icon }) => (
            <button key={t} onClick={() => setLeftTab(t)}
              style={{ flex: 1, background: 'transparent', border: 'none', borderBottom: leftTab === t ? `2px solid ${D.primary}` : '2px solid transparent', color: leftTab === t ? D.primary : D.muted, cursor: 'pointer', padding: '10px 0', fontSize: 15, fontWeight: 700 }}>
              {icon}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12 }} className="no-scrollbar">
          {/* ELEMENTS TAB */}
          {leftTab === 'elements' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {elGroups.map(grp => (
                <div key={grp.label}>
                  <div style={secTitle}>{grp.label}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                    {grp.items.map(item => (
                      <button key={item.label} onClick={item.fn}
                        style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 8, color: D.text, cursor: 'pointer', padding: '10px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, transition: 'all 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.borderColor = D.primary; e.currentTarget.style.background = D.primaryDim; }}
                        onMouseLeave={e => { e.currentTarget.style.borderColor = D.border;   e.currentTarget.style.background = D.card; }}>
                        <span style={{ fontSize: 18, fontWeight: 900 }}>{item.icon}</span>
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* SHAPES TAB */}
          {leftTab === 'shapes' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {shapes.map(s => (
                <button key={s.kind} onClick={() => addEl('shape', s.kind)}
                  style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 8, color: D.text, cursor: 'pointer', padding: '12px 6px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, fontSize: 9, fontWeight: 700, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = D.primary; e.currentTarget.style.background = D.primaryDim; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = D.border;   e.currentTarget.style.background = D.card; }}>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                  <span>{s.kind}</span>
                </button>
              ))}
            </div>
          )}

          {/* MEDIA TAB */}
          {leftTab === 'media' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
              {media.map((url, i) => (
                <div key={i} onClick={() => { const e = mkImage(url, cx, cy, 280, 180); setEls(p => [...p, { ...e, zIndex: maxZ() + 1 }]); setSelectedId(e.id); }}
                  style={{ borderRadius: 6, overflow: 'hidden', cursor: 'pointer', aspectRatio: '1', border: `1px solid ${D.border}`, transition: 'all 0.15s' }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.borderColor = D.primary; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)';    e.currentTarget.style.borderColor = D.border; }}>
                  <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
                </div>
              ))}
            </div>
          )}

          {/* LAYERS TAB */}
          {leftTab === 'layers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              {sortedLayers.map(el => (
                <div key={el.id}
                  onClick={() => setSelectedId(el.id)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 8px', borderRadius: 6, cursor: 'pointer', background: selectedId === el.id ? D.blueDim : 'transparent', border: `1px solid ${selectedId === el.id ? D.blue : 'transparent'}`, transition: 'all 0.12s' }}
                  onMouseEnter={e => { if (selectedId !== el.id) e.currentTarget.style.background = D.card; }}
                  onMouseLeave={e => { if (selectedId !== el.id) e.currentTarget.style.background = 'transparent'; }}>
                  <span style={{ fontSize: 10 }}>
                    {el.type === 'text' ? 'T' : el.type === 'image' ? '🖼' : el.type === 'button' ? '◉' : el.type === 'shape' ? '◇' : el.type === 'container' ? '▭' : el.type === 'badge' ? '⬛' : '—'}
                  </span>
                  {renaming?.id === el.id ? (
                    <input autoFocus value={renaming.val} onChange={e => setRenaming({ id: el.id, val: e.target.value })}
                      onBlur={() => { updEl(el.id, { name: renaming.val || el.name }); setRenaming(null); }}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === 'Escape') { updEl(el.id, { name: renaming.val || el.name }); setRenaming(null); } }}
                      style={{ ...inp(), flex: 1, fontSize: 10, padding: '2px 5px' }} />
                  ) : (
                    <span onDoubleClick={() => setRenaming({ id: el.id, val: el.name })}
                      style={{ flex: 1, fontSize: 10, color: el.hidden ? D.muted : D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {el.name}
                    </span>
                  )}
                  <button onClick={e => { e.stopPropagation(); updEl(el.id, { hidden: !el.hidden }); }}
                    title={el.hidden ? 'Show' : 'Hide'}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: D.muted, fontSize: 10, padding: '0 2px' }}>
                    {el.hidden ? '👁' : '🙈'}
                  </button>
                  <button onClick={e => { e.stopPropagation(); updEl(el.id, { locked: !el.locked }); }}
                    title={el.locked ? 'Unlock' : 'Lock'}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: D.muted, fontSize: 10, padding: '0 2px' }}>
                    {el.locked ? '🔓' : '🔒'}
                  </button>
                  <button onClick={e => { e.stopPropagation(); delEl(el.id); }}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: D.red, fontSize: 10, padding: '0 2px' }}>✕</button>
                </div>
              ))}
              {elements.length === 0 && <div style={{ textAlign: 'center', color: D.muted, fontSize: 10, padding: 20 }}>No elements yet</div>}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER: RIGHT INSPECTOR
  // ═══════════════════════════════════════════════════════════════
  const renderInspector = () => {
    if (!selected) {
      return (
        <div style={{ width: 270, background: D.panel, borderLeft: `1px solid ${D.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ fontSize: 32, opacity: 0.3 }}>✦</div>
          <div style={{ fontSize: 12, color: D.muted, fontWeight: 600 }}>Select an element</div>
          <div style={{ fontSize: 10, color: D.muted, textAlign: 'center', padding: '0 20px' }}>Click any element on the canvas to edit its properties</div>
        </div>
      );
    }

    const el = selected;

    return (
      <div style={{ width: 270, background: D.panel, borderLeft: `1px solid ${D.border}`, display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        {/* Element name + tabs */}
        <div style={{ padding: '10px 12px', borderBottom: `1px solid ${D.border}`, flexShrink: 0 }}>
          <div style={{ fontSize: 9, color: D.muted, fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>{el.type}</div>
          <div style={{ fontSize: 12, fontWeight: 800, color: D.text, marginBottom: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{el.name}</div>
          {/* Position/Size */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: 5, marginBottom: 8 }}>
            {[['X', el.x, 'x'], ['Y', el.y, 'y'], ['W', el.width, 'width'], ['H', el.height, 'height']].map(([label, val, key]) => (
              <div key={key as string}>
                <label style={lbl}>{label as string}</label>
                <input type="number" value={Math.round(val as number)}
                  onChange={e => updEl(el.id, { [key as string]: Number(e.target.value) })}
                  style={inp({ textAlign: 'center' })} />
              </div>
            ))}
          </div>
          {/* Inspector tabs */}
          <div style={{ display: 'flex', background: '#0a0a0a', borderRadius: 6, padding: 2, gap: 1 }}>
            {(['content', 'style', 'animation'] as InspectorTab[]).map(t => (
              <button key={t} onClick={() => setInspectorTab(t)}
                style={{ flex: 1, background: inspectorTab === t ? D.card : 'transparent', border: 'none', borderRadius: 4, color: inspectorTab === t ? D.text : D.muted, cursor: 'pointer', padding: '4px 0', fontSize: 9, fontWeight: 700, textTransform: 'capitalize' }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: 12, display: 'flex', flexDirection: 'column', gap: 10 }} className="no-scrollbar">

          {/* CONTENT TAB */}
          {inspectorTab === 'content' && (
            <>
              {/* Text inspector */}
              {el.type === 'text' && el.text && (() => {
                const t = el.text;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    <div><label style={lbl}>Content</label>
                      <textarea value={t.content} onChange={e => updProp(el.id, 'text', { content: e.target.value })}
                        rows={3} style={{ ...inp(), resize: 'vertical' }} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                      <div><label style={lbl}>Font Family</label>
                        <select value={t.fontFamily} onChange={e => updProp(el.id, 'text', { fontFamily: e.target.value })} style={inp()}>
                          {FONTS.map(f => <option key={f}>{f}</option>)}
                        </select></div>
                      <div><label style={lbl}>Font Size</label>
                        <input type="number" min={6} max={200} value={t.fontSize} onChange={e => updProp(el.id, 'text', { fontSize: Number(e.target.value) })} style={inp()} /></div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                      <div><label style={lbl}>Weight</label>
                        <select value={t.fontWeight} onChange={e => updProp(el.id, 'text', { fontWeight: Number(e.target.value) as FontWeight })} style={inp()}>
                          {[100,200,300,400,500,600,700,800,900].map(w => <option key={w}>{w}</option>)}
                        </select></div>
                      <div><label style={lbl}>Color</label>
                        <div style={{ display: 'flex', gap: 4 }}>
                          <input type="color" value={t.color.startsWith('#') ? t.color : '#ffffff'} onChange={e => updProp(el.id, 'text', { color: e.target.value, textGradient: undefined })} style={{ width: 32, height: 28, padding: 0, border: `1px solid ${D.border}`, borderRadius: 4, background: 'transparent', cursor: 'pointer' }} />
                          <input value={t.color} onChange={e => updProp(el.id, 'text', { color: e.target.value })} style={{ ...inp(), flex: 1 }} />
                        </div></div>
                    </div>
                    <div><label style={lbl}>Text Gradient Presets</label>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {[
                          { label: 'Neon',   v: 'linear-gradient(135deg, #b08850, #00d2ff)' },
                          { label: 'Fire',   v: 'linear-gradient(135deg, #f59e0b, #ef4444)' },
                          { label: 'Royal',  v: 'linear-gradient(135deg, #10b981, #34d399)' },
                          { label: 'Gold',   v: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
                          { label: 'Ocean',  v: 'linear-gradient(135deg, #10b981, #06b6d4)' },
                          { label: 'None',   v: '' },
                        ].map(p => (
                          <button key={p.label} onClick={() => updProp(el.id, 'text', { textGradient: p.v || undefined })}
                            style={{ ...iconBtn(t.textGradient === p.v), fontSize: 9, padding: '3px 8px' }}>{p.label}</button>
                        ))}
                      </div></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                      <div><label style={lbl}>Letter Spacing</label>
                        <input type="number" step={0.01} value={t.letterSpacing} onChange={e => updProp(el.id, 'text', { letterSpacing: Number(e.target.value) })} style={inp()} /></div>
                      <div><label style={lbl}>Line Height</label>
                        <input type="number" step={0.1} value={t.lineHeight} onChange={e => updProp(el.id, 'text', { lineHeight: Number(e.target.value) })} style={inp()} /></div>
                    </div>
                    <div><label style={lbl}>Alignment</label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        {(['left','center','right'] as TextAlign[]).map(a => (
                          <button key={a} onClick={() => updProp(el.id, 'text', { textAlign: a })} style={{ ...iconBtn(t.textAlign === a), flex: 1, textAlign: 'center' }}>
                            {a === 'left' ? '⫷' : a === 'center' ? '≡' : '⫸'}
                          </button>
                        ))}
                      </div></div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {[
                        { label: 'I',  key: 'italic',    val: t.italic    },
                        { label: 'U',  key: 'underline', val: t.underline },
                        { label: 'AA', key: 'uppercase', val: t.uppercase },
                      ].map(f => (
                        <button key={f.key} onClick={() => updProp(el.id, 'text', { [f.key]: !f.val })}
                          style={{ ...iconBtn(f.val), flex: 1, fontStyle: f.key === 'italic' ? 'italic' : 'normal', textDecoration: f.key === 'underline' ? 'underline' : 'none' }}>
                          {f.label}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Image inspector */}
              {el.type === 'image' && el.image && (() => {
                const img = el.image;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    {img.src && <div style={{ borderRadius: 8, overflow: 'hidden', maxHeight: 120 }}><img src={img.src} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" /></div>}
                    <button onClick={() => setMediaPicker({ open: true, targetId: el.id, tab: 'images' })}
                      style={{ background: D.primaryDim, border: `1px solid ${D.primary}`, borderRadius: 7, color: D.primary, padding: '8px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                      🖼 Replace Image
                    </button>
                    <div><label style={lbl}>Image URL</label>
                      <input value={img.src} onChange={e => updProp(el.id, 'image', { src: e.target.value })} style={inp()} placeholder="https://..." /></div>
                    <div><label style={lbl}>Object Fit</label>
                      <select value={img.objectFit} onChange={e => updProp(el.id, 'image', { objectFit: e.target.value as ObjectFit })} style={inp()}>
                        {['cover','contain','fill'].map(v => <option key={v}>{v}</option>)}
                      </select></div>
                    {[
                      { label: 'Border Radius', key: 'borderRadius', min: 0, max: 100, step: 1, val: img.borderRadius },
                      { label: 'Opacity',       key: 'opacity',      min: 0, max: 1,   step: 0.05, val: img.opacity },
                      { label: 'Grayscale %',   key: 'grayscale',    min: 0, max: 100, step: 1,    val: img.grayscale },
                      { label: 'Blur (px)',      key: 'blur',         min: 0, max: 20,  step: 0.5,  val: img.blur },
                      { label: 'Brightness %',  key: 'brightness',   min: 10, max: 200, step: 5,   val: img.brightness },
                    ].map(s => (
                      <div key={s.key}><label style={lbl}>{s.label}</label>
                        <input type="range" min={s.min} max={s.max} step={s.step} value={s.val}
                          onChange={e => updProp(el.id, 'image', { [s.key]: Number(e.target.value) })}
                          style={{ width: '100%', cursor: 'pointer' }} /></div>
                    ))}
                  </div>
                );
              })()}

              {/* Button inspector */}
              {el.type === 'button' && el.button && (() => {
                const b = el.button;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    <div><label style={lbl}>Label</label>
                      <input value={b.label} onChange={e => updProp(el.id, 'button', { label: e.target.value })} style={inp()} /></div>
                    <div><label style={lbl}>Link URL</label>
                      <input value={b.href} onChange={e => updProp(el.id, 'button', { href: e.target.value })} style={inp()} placeholder="https://..." /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                      <div><label style={lbl}>Background</label>
                        <input type="color" value={b.bgColor} onChange={e => updProp(el.id, 'button', { bgColor: e.target.value })} style={{ width: '100%', height: 30, border: `1px solid ${D.border}`, borderRadius: 5, cursor: 'pointer', background: 'transparent', padding: 0 }} /></div>
                      <div><label style={lbl}>Text Color</label>
                        <input type="color" value={b.textColor} onChange={e => updProp(el.id, 'button', { textColor: e.target.value })} style={{ width: '100%', height: 30, border: `1px solid ${D.border}`, borderRadius: 5, cursor: 'pointer', background: 'transparent', padding: 0 }} /></div>
                    </div>
                    <div><label style={lbl}>Border Radius</label>
                      <input type="range" min={0} max={40} value={b.borderRadius} onChange={e => updProp(el.id, 'button', { borderRadius: Number(e.target.value) })} style={{ width: '100%' }} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                      <div><label style={lbl}>Font Size</label>
                        <input type="number" min={8} max={36} value={b.fontSize} onChange={e => updProp(el.id, 'button', { fontSize: Number(e.target.value) })} style={inp()} /></div>
                      <div><label style={lbl}>Font Weight</label>
                        <select value={b.fontWeight} onChange={e => updProp(el.id, 'button', { fontWeight: Number(e.target.value) as FontWeight })} style={inp()}>
                          {[400,500,600,700,800,900].map(w => <option key={w}>{w}</option>)}
                        </select></div>
                    </div>
                    <div><label style={lbl}>Quick Styles</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                        {[
                          { label: 'Primary', bg: '#b08850', tc: '#000000' },
                          { label: 'Dark',    bg: '#181818', tc: '#ffffff' },
                          { label: 'Purple',  bg: '#10b981', tc: '#ffffff' },
                          { label: 'Outline', bg: 'transparent', tc: '#ffffff' },
                        ].map(p => (
                          <button key={p.label} onClick={() => updProp(el.id, 'button', { bgColor: p.bg, textColor: p.tc })}
                            style={{ background: p.bg, border: '1px solid rgba(255,255,255,0.15)', borderRadius: 6, color: p.tc, padding: '6px', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>
                            {p.label}
                          </button>
                        ))}
                      </div></div>
                  </div>
                );
              })()}

              {/* Shape inspector */}
              {el.type === 'shape' && el.shape && (() => {
                const s = el.shape;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    <div><label style={lbl}>Shape Type</label>
                      <select value={s.kind} onChange={e => updProp(el.id, 'shape', { kind: e.target.value as ShapeKind })} style={inp()}>
                        {['rectangle','circle','triangle','diamond','star','pentagon','arrow','line'].map(k => <option key={k}>{k}</option>)}
                      </select></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                      <div><label style={lbl}>Fill Color</label>
                        <input type="color" value={s.fill.startsWith('#') ? s.fill : '#b08850'} onChange={e => updProp(el.id, 'shape', { fill: e.target.value })} style={{ width: '100%', height: 30, border: `1px solid ${D.border}`, borderRadius: 5, cursor: 'pointer', background: 'transparent', padding: 0 }} /></div>
                      <div><label style={lbl}>Stroke</label>
                        <input type="color" value={s.stroke.startsWith('#') ? s.stroke : '#ffffff'} onChange={e => updProp(el.id, 'shape', { stroke: e.target.value })} style={{ width: '100%', height: 30, border: `1px solid ${D.border}`, borderRadius: 5, cursor: 'pointer', background: 'transparent', padding: 0 }} /></div>
                    </div>
                    <div><label style={lbl}>Stroke Width</label>
                      <input type="range" min={0} max={20} value={s.strokeWidth} onChange={e => updProp(el.id, 'shape', { strokeWidth: Number(e.target.value) })} style={{ width: '100%' }} /></div>
                    <div><label style={lbl}>Opacity</label>
                      <input type="range" min={0} max={1} step={0.05} value={s.opacity} onChange={e => updProp(el.id, 'shape', { opacity: Number(e.target.value) })} style={{ width: '100%' }} /></div>
                  </div>
                );
              })()}

              {/* Container inspector */}
              {el.type === 'container' && el.container && (() => {
                const c = el.container;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    <div><label style={lbl}>Background Color</label>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <input type="color" value={c.bgColor.startsWith('#') ? c.bgColor : '#181818'} onChange={e => updProp(el.id, 'container', { bgColor: e.target.value, bgGradient: undefined })} style={{ width: 32, height: 28, padding: 0, border: `1px solid ${D.border}`, borderRadius: 4, background: 'transparent', cursor: 'pointer' }} />
                        <input value={c.bgColor} onChange={e => updProp(el.id, 'container', { bgColor: e.target.value })} style={{ ...inp(), flex: 1 }} />
                      </div></div>
                    <div><label style={lbl}>Gradient Presets</label>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                        {[
                          { label: 'Nebula',  v: 'linear-gradient(135deg, rgba(16, 185, 129,0.3), rgba(52, 211, 153,0.3))' },
                          { label: 'Ocean',   v: 'linear-gradient(135deg, rgba(16, 185, 129,0.3), rgba(6,182,212,0.3))'  },
                          { label: 'Forest',  v: 'linear-gradient(135deg, rgba(176, 136, 80,0.25), rgba(16,185,129,0.25))' },
                          { label: 'Sunset',  v: 'linear-gradient(135deg, rgba(245,158,11,0.3), rgba(239,68,68,0.3))'  },
                          { label: 'Glass',   v: 'rgba(255,255,255,0.05)'  },
                          { label: 'None',    v: ''                        },
                        ].map(p => (
                          <button key={p.label} onClick={() => updProp(el.id, 'container', { bgGradient: p.v || undefined })}
                            style={{ background: p.v || D.card, border: `1px solid ${D.border}`, borderRadius: 6, color: D.text, padding: '6px', cursor: 'pointer', fontSize: 9, fontWeight: 700 }}>
                            {p.label}
                          </button>
                        ))}
                      </div></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                      <div><label style={lbl}>Border Radius</label>
                        <input type="range" min={0} max={50} value={c.borderRadius} onChange={e => updProp(el.id, 'container', { borderRadius: Number(e.target.value) })} style={{ width: '100%' }} /></div>
                      <div><label style={lbl}>Border Width</label>
                        <input type="number" min={0} max={10} value={c.borderWidth} onChange={e => updProp(el.id, 'container', { borderWidth: Number(e.target.value) })} style={inp()} /></div>
                    </div>
                    <div><label style={lbl}>Box Shadow</label>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {[
                          { label: 'None', v: 'none' },
                          { label: 'Soft', v: '0 8px 32px rgba(0,0,0,0.4)' },
                          { label: 'Hard', v: '4px 4px 0px rgba(0,0,0,0.8)' },
                          { label: 'Neon', v: '0 0 20px rgba(176, 136, 80,0.4)' },
                        ].map(s => (
                          <button key={s.label} onClick={() => updProp(el.id, 'container', { boxShadow: s.v })}
                            style={{ ...iconBtn(c.boxShadow === s.v), fontSize: 9, padding: '3px 8px' }}>{s.label}</button>
                        ))}
                      </div></div>
                  </div>
                );
              })()}

              {/* Badge inspector */}
              {el.type === 'badge' && el.badge && (() => {
                const b = el.badge;
                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
                    <div><label style={lbl}>Label</label>
                      <input value={b.label} onChange={e => updProp(el.id, 'badge', { label: e.target.value })} style={inp()} /></div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                      <div><label style={lbl}>Background</label>
                        <input type="color" value={b.bgColor.startsWith('#') ? b.bgColor : '#b08850'} onChange={e => updProp(el.id, 'badge', { bgColor: e.target.value })} style={{ width: '100%', height: 30, border: `1px solid ${D.border}`, borderRadius: 5, cursor: 'pointer', background: 'transparent', padding: 0 }} /></div>
                      <div><label style={lbl}>Text Color</label>
                        <input type="color" value={b.textColor.startsWith('#') ? b.textColor : '#000000'} onChange={e => updProp(el.id, 'badge', { textColor: e.target.value })} style={{ width: '100%', height: 30, border: `1px solid ${D.border}`, borderRadius: 5, cursor: 'pointer', background: 'transparent', padding: 0 }} /></div>
                    </div>
                    <div><label style={lbl}>Border Radius</label>
                      <input type="range" min={0} max={20} value={b.borderRadius} onChange={e => updProp(el.id, 'badge', { borderRadius: Number(e.target.value) })} style={{ width: '100%' }} /></div>
                    <div><label style={lbl}>Font Size</label>
                      <input type="number" min={6} max={20} value={b.fontSize} onChange={e => updProp(el.id, 'badge', { fontSize: Number(e.target.value) })} style={inp()} /></div>
                  </div>
                );
              })()}
            </>
          )}

          {/* STYLE TAB */}
          {inspectorTab === 'style' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div><label style={lbl}>Opacity</label>
                <input type="range" min={0} max={1} step={0.05} value={el.elStyle.opacity}
                  onChange={e => updEl(el.id, { elStyle: { ...el.elStyle, opacity: Number(e.target.value) } })}
                  style={{ width: '100%' }} /></div>
              <div><label style={lbl}>Box Shadow</label>
                <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {[
                    { label: 'None', v: undefined },
                    { label: 'Soft', v: '0 8px 30px rgba(0,0,0,0.4)' },
                    { label: 'Hard', v: '4px 4px 0 rgba(0,0,0,0.8)' },
                    { label: 'Neon', v: '0 0 20px rgba(176, 136, 80,0.5)' },
                    { label: 'Blue', v: '0 0 20px rgba(16, 185, 129,0.5)' },
                  ].map(s => (
                    <button key={s.label} onClick={() => updEl(el.id, { elStyle: { ...el.elStyle, boxShadow: s.v } })}
                      style={{ ...iconBtn(el.elStyle.boxShadow === s.v), fontSize: 9, padding: '3px 8px' }}>{s.label}</button>
                  ))}
                </div></div>
              <div><label style={lbl}>Rotation (°)</label>
                <input type="range" min={-180} max={180} value={el.rotation}
                  onChange={e => updEl(el.id, { rotation: Number(e.target.value) })}
                  style={{ width: '100%' }} /></div>
            </div>
          )}

          {/* ANIMATION TAB */}
          {inspectorTab === 'animation' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              <div><label style={lbl}>Animation Type</label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                  {ANIM_OPTIONS.map(a => (
                    <button key={a.v} onClick={() => updProp(el.id, 'animation', { type: a.v })}
                      style={{ ...iconBtn(el.animation.type === a.v), fontSize: 9, padding: '5px', display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'center' }}>
                      {a.icon} {a.label}
                    </button>
                  ))}
                </div></div>
              {el.animation.type !== 'none' && (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5 }}>
                    <div><label style={lbl}>Duration (s)</label>
                      <input type="number" step={0.1} min={0.1} max={10} value={el.animation.duration} onChange={e => updProp(el.id, 'animation', { duration: Number(e.target.value) })} style={inp()} /></div>
                    <div><label style={lbl}>Delay (s)</label>
                      <input type="number" step={0.1} min={0} max={5} value={el.animation.delay} onChange={e => updProp(el.id, 'animation', { delay: Number(e.target.value) })} style={inp()} /></div>
                  </div>
                  <div><label style={lbl}>Direction</label>
                    <select value={el.animation.direction} onChange={e => updProp(el.id, 'animation', { direction: e.target.value as any })} style={inp()}>
                      <option value="normal">Normal</option><option value="reverse">Reverse</option><option value="alternate">Alternate</option>
                    </select></div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <label style={{ ...lbl, marginBottom: 0 }}>Loop</label>
                    <input type="checkbox" checked={el.animation.loop} onChange={e => updProp(el.id, 'animation', { loop: e.target.checked })} style={{ cursor: 'pointer' }} />
                  </div>
                  <button onClick={() => {
                    setAnimating(el.id);
                    setTimeout(() => setAnimating(null), el.animation.duration * 1000 + el.animation.delay * 1000 + 200);
                  }} style={{ background: D.primaryDim, border: `1px solid ${D.primary}`, borderRadius: 7, color: D.primary, padding: '8px', cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                    ▶ Preview Animation
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // RENDER: MEDIA PICKER MODAL
  // ═══════════════════════════════════════════════════════════════
  const renderMediaPicker = () => {
    if (!mediaPicker.open) return null;
    const imgUrls = [
      'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=400',
      'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=400',
      'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400',
      'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400',
      'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?w=400',
      'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=400',
      'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400',
      'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400',
      'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=400',
      'https://images.unsplash.com/photo-1464802686167-b939a6910659?w=400',
      'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400',
      'https://images.unsplash.com/photo-1421970099978-9ddb5d7c3bcd?w=400',
    ];
    const applyImg = (url: string) => {
      if (mediaPicker.targetId) updProp(mediaPicker.targetId, 'image', { src: url });
      setMediaPicker({ open: false, targetId: null, tab: 'images' });
      setMediaUrl('');
    };
    return (
      <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.88)', zIndex: 999999, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={{ background: D.panel, border: `1px solid ${D.border}`, borderRadius: 16, width: 580, maxHeight: '80vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 20px 70px rgba(0,0,0,0.9)' }}>
          <div style={{ padding: '14px 18px', borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h3 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: D.text, fontFamily: 'Outfit' }}>🖼 Media Picker</h3>
            <button onClick={() => setMediaPicker({ open: false, targetId: null, tab: 'images' })} style={{ background: 'transparent', border: 'none', color: D.muted, cursor: 'pointer', fontSize: 16 }}>✕</button>
          </div>
          <div style={{ display: 'flex', background: D.surface, borderBottom: `1px solid ${D.border}` }}>
            {([{ t: 'images' as const, label: '📸 Stock Images' }, { t: 'url' as const, label: '🔗 URL' }]).map(b => (
              <button key={b.t} onClick={() => setMediaPicker(m => ({ ...m, tab: b.t }))}
                style={{ flex: 1, background: 'transparent', border: 'none', padding: '10px', borderBottom: mediaPicker.tab === b.t ? `2px solid ${D.primary}` : '2px solid transparent', color: mediaPicker.tab === b.t ? D.primary : D.muted, cursor: 'pointer', fontSize: 11, fontWeight: 700 }}>
                {b.label}
              </button>
            ))}
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: 14 }}>
            {mediaPicker.tab === 'images' && (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {imgUrls.map((url, i) => (
                  <div key={i} onClick={() => applyImg(url)}
                    style={{ borderRadius: 8, overflow: 'hidden', cursor: 'pointer', aspectRatio: '1', border: `1px solid ${D.border}`, transition: 'all 0.15s' }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.borderColor = D.primary; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.borderColor = D.border; }}>
                    <img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} alt="" />
                  </div>
                ))}
              </div>
            )}
            {mediaPicker.tab === 'url' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <input value={mediaUrl} onChange={e => setMediaUrl(e.target.value)} placeholder="Paste image URL (https://...)" style={{ ...inp(), fontSize: 13, padding: '10px 12px' }} autoFocus />
                {mediaUrl && <div style={{ borderRadius: 10, overflow: 'hidden', maxHeight: 200 }}><img src={mediaUrl} style={{ width: '100%', objectFit: 'cover', display: 'block' }} alt="" /></div>}
                <button onClick={() => mediaUrl && applyImg(mediaUrl)} disabled={!mediaUrl} style={{ background: D.primary, border: 'none', borderRadius: 8, color: '#000', padding: '10px', cursor: mediaUrl ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 800, opacity: mediaUrl ? 1 : 0.5 }}>
                  Apply Image
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  };

  // ═══════════════════════════════════════════════════════════════
  // CSS ANIMATION KEYFRAMES
  // ═══════════════════════════════════════════════════════════════
  const animCSS = `
    @keyframes ss_fade       { from { opacity: 0 } to { opacity: 1 } }
    @keyframes ss_slideUp    { from { opacity: 0; transform: translateY(30px) } to { opacity: 1; transform: translateY(0) } }
    @keyframes ss_slideDown  { from { opacity: 0; transform: translateY(-30px) } to { opacity: 1; transform: translateY(0) } }
    @keyframes ss_slideLeft  { from { opacity: 0; transform: translateX(30px) } to { opacity: 1; transform: translateX(0) } }
    @keyframes ss_slideRight { from { opacity: 0; transform: translateX(-30px) } to { opacity: 1; transform: translateX(0) } }
    @keyframes ss_zoomIn     { from { opacity: 0; transform: scale(0.7) } to { opacity: 1; transform: scale(1) } }
    @keyframes ss_zoomOut    { from { opacity: 0; transform: scale(1.3) } to { opacity: 1; transform: scale(1) } }
    @keyframes ss_bounce     { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-15px) } }
    @keyframes ss_pulse      { 0%,100% { transform: scale(1) } 50% { transform: scale(1.05) } }
    @keyframes ss_rotate     { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }
  `;

  // ═══════════════════════════════════════════════════════════════
  // MAIN RENDER
  // ═══════════════════════════════════════════════════════════════
  const { w: canvasW, h: canvasH } = DEVICE_SIZES[device];

  // Display dimensions (screen pixels)
  const dispCanvasW = canvasW * zoom;
  const dispCanvasH = canvasH * zoom;
  const dispChromeH = CHROME_H * zoom;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9998, background: D.bg, display: 'flex', flexDirection: 'column', fontFamily: 'Inter, sans-serif', color: D.text }}>
      <style>{animCSS}</style>

      {/* ── HEADER ── */}
      <div style={{ height: 52, background: D.surface, borderBottom: `1px solid ${D.border}`, display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', flexShrink: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingRight: 14, borderRight: `1px solid ${D.border}`, marginRight: 4 }}>
          <span style={{ fontSize: 18 }}>🎨</span>
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: D.primary, fontFamily: 'Outfit', lineHeight: 1.2 }}>Advanced Designer</div>
            <div style={{ fontSize: 8, color: D.muted }}>Visual Canvas Studio</div>
          </div>
        </div>

        {/* Section context pill */}
        {sectionName && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'linear-gradient(135deg, rgba(16, 185, 129,0.18), rgba(52, 211, 153,0.18))', border: '1px solid rgba(16, 185, 129,0.35)', borderRadius: 20, padding: '4px 12px 4px 8px', flexShrink: 0, maxWidth: 220 }}>
            <span style={{ fontSize: 11 }}>📐</span>
            <div>
              <div style={{ fontSize: 8, color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', lineHeight: 1 }}>Editing Section</div>
              <div style={{ fontSize: 10, color: '#fff', fontWeight: 800, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 160 }}>{sectionName}</div>
            </div>
          </div>
        )}

        {/* Device */}
        <div style={{ display: 'flex', background: '#0a0a0a', borderRadius: 8, padding: 3, border: `1px solid ${D.border}`, gap: 1 }}>
          {(Object.entries(DEVICE_SIZES) as [DeviceMode, { w: number; h: number; label: string }][]).map(([id, info]) => (
            <button key={id} onClick={() => setDevice(id)}
              style={{ background: device === id ? '#1a1a1a' : 'transparent', border: 'none', borderRadius: 6, color: device === id ? D.primary : D.muted, cursor: 'pointer', padding: '4px 10px', fontSize: 9, fontWeight: 700 }}>
              {info.label}
            </button>
          ))}
        </div>

        {/* Zoom */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, borderLeft: `1px solid ${D.border}`, paddingLeft: 10 }}>
          <button onClick={() => setZoom(z => Math.max(0.2, Math.round((z - 0.1) * 10) / 10))} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 4, color: D.text, width: 24, height: 24, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>−</button>
          <span style={{ fontSize: 10, fontWeight: 700, width: 38, textAlign: 'center' }}>{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(z => Math.min(2, Math.round((z + 0.1) * 10) / 10))} style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 4, color: D.text, width: 24, height: 24, cursor: 'pointer', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>+</button>
          <button onClick={() => setZoom(0.62)} style={{ background: 'transparent', border: 'none', color: D.muted, cursor: 'pointer', fontSize: 9 }}>Fit</button>
        </div>

        {/* Undo / Redo */}
        <div style={{ display: 'flex', gap: 3, borderLeft: `1px solid ${D.border}`, paddingLeft: 10 }}>
          {[{ icon: '↩', fn: undoFn, title: 'Undo (Ctrl+Z)', dis: !history.length }, { icon: '↪', fn: redoFn, title: 'Redo (Ctrl+Y)', dis: !redo.length }].map(b => (
            <button key={b.icon} onClick={b.fn} title={b.title} disabled={b.dis}
              style={{ background: D.card, border: `1px solid ${D.border}`, borderRadius: 4, color: b.dis ? D.muted : D.text, width: 28, height: 28, cursor: b.dis ? 'not-allowed' : 'pointer', fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {b.icon}
            </button>
          ))}
        </div>

        {/* Grid */}
        <button onClick={() => setShowGrid(g => !g)}
          style={{ ...iconBtn(showGrid), padding: '5px 10px', fontSize: 10, borderLeft: `1px solid ${D.border}`, marginLeft: 6, paddingLeft: 16 }}>
          ⊞ Grid
        </button>

        {/* Clear canvas */}
        <button onClick={() => { if (confirm('Clear all elements?')) { setEls([]); setSelectedId(null); } }}
          style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 6, color: D.red, padding: '5px 10px', cursor: 'pointer', fontSize: 10, fontWeight: 700 }}>
          ✕ Clear
        </button>

        <div style={{ flex: 1 }} />

        {/* Save status */}
        <div style={{ fontSize: 9, color: isDirty ? D.orange : D.primary, fontWeight: 600 }}>
          {isDirty ? '● Unsaved' : savedAt ? `✓ Saved ${savedAt}` : ''}
        </div>

        {/* Save button */}
        <button onClick={() => { onSave?.(elements); }}
          style={{ background: 'linear-gradient(135deg, #b08850, #17a349)', border: 'none', borderRadius: 8, color: '#000', padding: '8px 18px', cursor: 'pointer', fontWeight: 800, fontSize: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
          💾 Save
        </button>

        {/* Exit */}
        <button onClick={onClose}
          style={{ background: 'transparent', border: `1px solid ${D.border}`, borderRadius: 8, color: D.muted, padding: '8px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 700 }}>
          ✕ Exit
        </button>
      </div>

      {/* ── BODY ── */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {renderLeft()}

        {/* ── CENTER CANVAS AREA ── */}
        <div
          style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', background: '#050505', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', padding: 40 }}
          onMouseDown={e => {
            if (e.target === e.currentTarget) { setSelectedId(null); setCtxMenu(null); }
          }}
        >
          {/* Canvas frame */}
          <div style={{ position: 'relative', flexShrink: 0 }}>
            {/* Outer shadow/glow frame */}
            <div style={{ position: 'absolute', inset: -2, borderRadius: 12, boxShadow: '0 0 0 1px rgba(255,255,255,0.05), 0 30px 80px rgba(0,0,0,0.8)', pointerEvents: 'none' }} />

            {/* Canvas div — DIRECT SIZE (no CSS transform) */}
            <div
              ref={canvasRef}
              style={{
                position: 'relative',
                width: dispCanvasW,
                height: dispCanvasH,
                background: 'linear-gradient(180deg, #0d0d0d 0%, #111111 100%)',
                borderRadius: 10,
                overflow: 'hidden',
                cursor: 'default',
              }}
              onMouseDown={e => {
                if (e.target === canvasRef.current) { setSelectedId(null); setCtxMenu(null); }
              }}
            >
              {/* Grid overlay */}
              {showGrid && (
                <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                  backgroundImage: `
                    linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
                  `,
                  backgroundSize: `${20 * zoom}px ${20 * zoom}px`,
                }} />
              )}

              {/* Browser chrome bar */}
              <div style={{ height: dispChromeH, background: '#080808', borderBottom: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 6 * zoom, padding: `0 ${12 * zoom}px`, flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 4 * zoom }}>
                  <div style={{ width: 8 * zoom, height: 8 * zoom, borderRadius: '50%', background: '#ef4444' }} />
                  <div style={{ width: 8 * zoom, height: 8 * zoom, borderRadius: '50%', background: '#f59e0b' }} />
                  <div style={{ width: 8 * zoom, height: 8 * zoom, borderRadius: '50%', background: '#10b981' }} />
                </div>
                <div style={{ flex: 1, background: '#111', borderRadius: 4 * zoom, padding: `${3 * zoom}px ${10 * zoom}px`, fontSize: 9 * zoom, color: 'rgba(255,255,255,0.3)', fontFamily: 'Inter' }}>
                  🔒 beato.app
                </div>
                <div style={{ fontSize: 8 * zoom, color: 'rgba(255,255,255,0.2)', fontFamily: 'Inter' }}>
                  {DEVICE_SIZES[device].label}
                </div>
              </div>

              {/* Elements layer — positioned below chrome bar */}
              <div style={{ position: 'absolute', top: dispChromeH, left: 0, right: 0, bottom: 0, overflow: 'hidden' }}>
                {sorted.map(el => renderEl(el))}
              </div>
            </div>

            {/* Canvas size label */}
            <div style={{ position: 'absolute', bottom: -22, left: 0, right: 0, textAlign: 'center', fontSize: 9, color: D.muted, fontFamily: 'Inter' }}>
              {canvasW} × {canvasH} — {Math.round(zoom * 100)}% zoom
            </div>
          </div>
        </div>

        {renderInspector()}
      </div>

      {/* Context menu */}
      {renderCtx()}

      {/* Media picker */}
      {renderMediaPicker()}
    </div>
  );
}
