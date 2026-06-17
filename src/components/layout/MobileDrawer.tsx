'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, Megaphone, Settings, User, X, Mic2, Shield, LogOut,
  LayoutDashboard, Upload, Music, TrendingUp, DollarSign, Users, Globe, Calendar, ChevronDown
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function MobileDrawer() {
  const { user, isMobileDrawerOpen, setMobileDrawerOpen, logout } = useAuthStore();
  const role = user?.role || 'USER';
  const pathname = usePathname();
  const [isArtistPanelOpen, setIsArtistPanelOpen] = useState(false);

  useEffect(() => {
    if (pathname.startsWith('/artist')) {
      setIsArtistPanelOpen(true);
    }
  }, [pathname]);

  const menuItems = [
    { label: 'Recents', icon: History, href: '/library' },
    { label: 'Your Updates', icon: Megaphone, action: () => alert('No new updates') },
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];

  const artistSubItems = [
    { label: 'Overview', icon: LayoutDashboard, href: '/artist/dashboard' },
    { label: 'Upload Track', icon: Upload, href: '/artist/upload' },
    { label: 'My Music', icon: Music, href: '/artist/dashboard?tab=My Music' },
    { label: 'Analytics', icon: TrendingUp, href: '/artist/dashboard?tab=Analytics' },
    { label: 'Revenue', icon: DollarSign, href: '/artist/dashboard?tab=Revenue' },
    { label: 'Audience', icon: Users, href: '/artist/dashboard?tab=Audience' },
    { label: 'Campaigns', icon: Globe, href: '/artist/dashboard?tab=Campaigns' },
    { label: 'Profile', icon: User, href: '/artist/dashboard?tab=Profile' },
    { label: 'Live Events', icon: Calendar, href: '/artist/dashboard?tab=Live Events' },
  ];

  return (
    <AnimatePresence>
      {isMobileDrawerOpen && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex' }}>
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.45 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileDrawerOpen(false)}
            style={{ position: 'absolute', inset: 0, background: 'rgba(43, 34, 26, 0.3)' }}
          />

          {/* Drawer Content */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'relative',
              width: '80%',
              maxWidth: 320,
              height: '100%',
              background: 'var(--color-ss-surface, #f4eede)',
              boxShadow: '4px 0 24px rgba(43, 34, 26, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              padding: '24px 20px',
              color: 'var(--color-ss-text-primary, #221a15)',
              zIndex: 10001,
            }}
          >
            {/* Header info */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 20, borderBottom: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))', marginBottom: 24 }}>
              {/* Avatar circle */}
              <div style={{
                width: 52,
                height: 52,
                borderRadius: '50%',
                background: 'var(--color-ss-primary, #b08850)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 20,
                fontFamily: 'Outfit, sans-serif'
              }}>
                {user?.name ? user.name[0].toUpperCase() : 'M'}
              </div>
              <div>
                <p style={{ fontFamily: 'Outfit, sans-serif', fontSize: 18, fontWeight: 700, color: 'var(--color-ss-text-primary, #221a15)' }}>
                  {user?.name || 'Manoj lastro'}
                </p>
                <Link href="/profile" onClick={() => setMobileDrawerOpen(false)} style={{ textDecoration: 'none', color: 'var(--color-ss-text-muted, #87786c)', fontSize: 12, marginTop: 2, display: 'block' }}>
                  View profile
                </Link>
              </div>
            </div>

            {/* Menu Items list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 30, overflowY: 'auto' }} className="hide-scrollbar">
              {menuItems.map(item => {
                const Icon = item.icon;
                const content = (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', color: 'var(--color-ss-text-primary, #221a15)' }}>
                    <Icon size={24} color="var(--color-ss-text-primary, #221a15)" />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>{item.label}</span>
                  </div>
                );

                if (item.href) {
                  return (
                    <Link key={item.label} href={item.href} onClick={() => setMobileDrawerOpen(false)} style={{ textDecoration: 'none' }}>
                      {content}
                    </Link>
                  );
                }

                return (
                  <div key={item.label} onClick={() => { setMobileDrawerOpen(false); item.action && item.action(); }}>
                    {content}
                  </div>
                );
              })}

              {/* Become an Artist for standard USER */}
              {role === 'USER' && (
                <Link href="/artist/apply" onClick={() => setMobileDrawerOpen(false)} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', color: 'var(--color-ss-text-primary, #221a15)' }}>
                    <Mic2 size={24} color="var(--color-ss-text-primary, #221a15)" />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>Become an Artist</span>
                  </div>
                </Link>
              )}

              {/* Artist Panel Accordion for ARTIST or SUPER_ADMIN */}
              {(role === 'ARTIST' || role === 'SUPER_ADMIN') && (
                <div>
                  <div 
                    onClick={() => setIsArtistPanelOpen(!isArtistPanelOpen)}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: 'var(--color-ss-text-primary, #221a15)' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <Mic2 size={24} color="var(--color-ss-text-primary, #221a15)" />
                      <span style={{ fontSize: 16, fontWeight: 600 }}>Artist Panel</span>
                    </div>
                    <motion.div
                      animate={{ rotate: isArtistPanelOpen ? 180 : 0 }}
                      transition={{ duration: 0.2 }}
                      style={{ display: 'flex', alignItems: 'center' }}
                    >
                      <ChevronDown size={18} color="var(--color-ss-text-muted, #87786c)" />
                    </motion.div>
                  </div>

                  <AnimatePresence initial={false}>
                    {isArtistPanelOpen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: 'easeInOut' }}
                        style={{ overflow: 'hidden', paddingLeft: 16, marginTop: 20, display: 'flex', flexDirection: 'column', gap: 20 }}
                      >
                        {artistSubItems.map(subItem => {
                          const SubIcon = subItem.icon;
                          return (
                            <Link 
                              key={subItem.label} 
                              href={subItem.href} 
                              onClick={() => setMobileDrawerOpen(false)} 
                              style={{ textDecoration: 'none' }}
                            >
                              <div 
                                style={{ display: 'flex', alignItems: 'center', gap: 14, color: 'var(--color-ss-text-secondary, #4d3f35)', cursor: 'pointer' }}
                                onMouseEnter={e => e.currentTarget.style.color = 'var(--color-ss-text-primary, #221a15)'}
                                onMouseLeave={e => e.currentTarget.style.color = 'var(--color-ss-text-secondary, #4d3f35)'}
                              >
                                <SubIcon size={20} />
                                <span style={{ fontSize: 15, fontWeight: 500 }}>{subItem.label}</span>
                              </div>
                            </Link>
                          );
                        })}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Admin Panel for ADMIN or SUPER_ADMIN */}
              {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
                <Link href="/admin/dashboard" onClick={() => setMobileDrawerOpen(false)} style={{ textDecoration: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16, cursor: 'pointer', color: 'var(--color-ss-text-primary, #221a15)' }}>
                    <Shield size={24} color="var(--color-ss-text-primary, #221a15)" />
                    <span style={{ fontSize: 16, fontWeight: 600 }}>Admin Panel</span>
                  </div>
                </Link>
              )}
            </div>

            {/* Logout Button */}
            <div 
              onClick={async () => {
                setMobileDrawerOpen(false);
                await logout();
              }}
              style={{ 
                marginTop: 'auto', 
                display: 'flex', 
                alignItems: 'center', 
                gap: 16, 
                cursor: 'pointer', 
                color: '#ef4444',
                paddingTop: 20,
                borderTop: '1px solid var(--color-ss-border, rgba(43, 34, 26, 0.08))'
              }}
            >
              <LogOut size={24} color="#ef4444" />
              <span style={{ fontSize: 16, fontWeight: 600 }}>Logout</span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
