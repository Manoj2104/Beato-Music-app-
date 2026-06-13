'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, X, Check, Music, TrendingUp, User, Star, Upload } from 'lucide-react';
import { useNotificationStore, NotifType } from '@/store/notificationStore';

const G = '#1db954';

const TYPE_CONFIG: Record<NotifType, { icon: any; color: string; bg: string }> = {
  new_release:    { icon: Music, color: '#10b981', bg: 'rgba(16,185,129,0.15)' },
  trending:       { icon: TrendingUp, color: '#f59e0b', bg: 'rgba(245,158,11,0.15)' },
  system:         { icon: Star, color: '#06b6d4', bg: 'rgba(6,182,212,0.15)' },
  new_follower:   { icon: User, color: '#34d399', bg: 'rgba(52,211,153,0.15)' },
  upload_complete:{ icon: Upload, color: G, bg: 'rgba(29, 185, 84,0.15)' },
  like:           { icon: Star, color: '#f97316', bg: 'rgba(249,115,22,0.15)' },
};

function relativeTime(ts: number): string {
  const diff = Date.now() - ts;
  if (diff < 60_000) return 'Just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { notifications, unreadCount, markRead, markAllRead, clearAll } = useNotificationStore();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)}
        style={{
          position: 'relative', width: 36, height: 36, borderRadius: '50%', border: 'none',
          background: open ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff',
          transition: 'background 0.15s',
        }}
        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.15)')}
        onMouseLeave={e => (e.currentTarget.style.background = open ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.08)')}>
        <Bell size={17} />
        {unreadCount > 0 && (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}
            style={{
              position: 'absolute', top: -3, right: -3, width: unreadCount > 9 ? 20 : 16, height: 16,
              borderRadius: 8, background: G, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 9, fontWeight: 800, color: '#000', border: '2px solid #111',
            }}>
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.div>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div initial={{ opacity: 0, y: -8, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -8, scale: 0.96 }} transition={{ duration: 0.15 }}
            style={{
              position: 'absolute', top: 'calc(100% + 10px)', right: 0, width: 360,
              background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 16,
              boxShadow: '0 16px 50px rgba(0,0,0,0.7)', zIndex: 1000, overflow: 'hidden',
            }}>
            {/* Header */}
            <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <h3 style={{ color: '#fff', fontWeight: 800, fontSize: 15, fontFamily: 'Outfit, sans-serif' }}>
                Notifications {unreadCount > 0 && <span style={{ color: G, fontSize: 12 }}>({unreadCount} new)</span>}
              </h3>
              <div style={{ display: 'flex', gap: 8 }}>
                {unreadCount > 0 && (
                  <button onClick={markAllRead} style={{ fontSize: 11, color: G, background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                    Mark all read
                  </button>
                )}
                <button onClick={clearAll} style={{ fontSize: 11, color: '#525252', background: 'none', border: 'none', cursor: 'pointer' }}>
                  Clear all
                </button>
              </div>
            </div>

            {/* List */}
            <div style={{ maxHeight: 380, overflowY: 'auto' }}>
              {notifications.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                  <Bell size={32} color="#525252" style={{ margin: '0 auto 10px' }} />
                  <p style={{ color: '#525252', fontSize: 13 }}>No notifications</p>
                </div>
              ) : (
                notifications.map(n => {
                  const cfg = TYPE_CONFIG[n.type];
                  const Icon = cfg?.icon ?? Bell;
                  return (
                    <motion.div key={n.id} layout
                      onClick={() => markRead(n.id)}
                      style={{
                        display: 'flex', gap: 12, padding: '13px 18px', cursor: 'pointer',
                        background: n.read ? 'transparent' : 'rgba(29, 185, 84,0.04)',
                        borderLeft: n.read ? '3px solid transparent' : `3px solid ${G}`,
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                      onMouseLeave={e => (e.currentTarget.style.background = n.read ? 'transparent' : 'rgba(29, 185, 84,0.04)')}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: cfg?.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Icon size={16} color={cfg?.color} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ color: n.read ? '#a3a3a3' : '#fff', fontSize: 13, lineHeight: 1.4, fontWeight: n.read ? 400 : 500 }}>{n.message}</p>
                        <p style={{ color: '#525252', fontSize: 11, marginTop: 4 }}>{relativeTime(n.timestamp)}</p>
                      </div>
                      {!n.read && <div style={{ width: 7, height: 7, borderRadius: '50%', background: G, marginTop: 5, flexShrink: 0 }} />}
                    </motion.div>
                  );
                })
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
