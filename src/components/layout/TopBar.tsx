'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Crown, User, LogOut, Settings, ChevronDown, BarChart3, Shield, Mic2, Users, Activity, Search, X, Music } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { useRealtimeStore } from '@/store/realtimeStore';
import { useNotificationStore } from '@/store/notificationStore';
import { useArtistApplicationStore } from '@/store/artistApplicationStore';
import NotificationBell from './NotificationBell';
import toast from 'react-hot-toast';
import { usePlayerStore } from '@/store/playerStore';
import { useMusicStore, trackGradient } from '@/store/musicStore';
import { mockArtists, mockAlbums, mockPlaylists, mockTracks } from '@/lib/mockData';
import { search, SearchResult } from '@/lib/search';
import { useIsMobile } from '@/hooks/useIsMobile';

const G = '#b08850';

// ⚡ Cooldown tracking for role sync to avoid redundant fetches on every mount
let lastRoleSyncTime = 0;

export default function TopBar({ transparent = false, bgColor, showSearch = false }: { transparent?: boolean; bgColor?: string; showSearch?: boolean }) {
  const router = useRouter();
  const { user, logout, updateUser, upgradeToArtist } = useAuthStore();
  const { getApplicationByUserId } = useArtistApplicationStore();
  const activeApp = user ? getApplicationByUserId(user.id) : undefined;
  const isApproved = activeApp?.status === 'APPROVED';

  const isMobile = useIsMobile(); // ⚡ shared single resize listener
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const mainEl = document.getElementById('main-content');
    if (!mainEl) return;

    const handleScroll = () => {
      setIsScrolled(mainEl.scrollTop > 15);
    };

    mainEl.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      mainEl.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Helper to read local cookies
  const getCookie = (name: string) => {
    if (typeof window === 'undefined') return null;
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop()?.split(';').shift();
    return null;
  };

  const role = user?.role || 'USER';
  const cookieRole = getCookie('beato-role');
  const needsSync = isApproved && (role === 'USER' || cookieRole !== 'ARTIST');

  // Background sync for approved artists to update role cookies and token
  useEffect(() => {
    if (user && needsSync) {
      const now = Date.now();
      if (now - lastRoleSyncTime < 60000) return; // ⚡ Throttle: 60s cooldown
      lastRoleSyncTime = now;

      fetch('/api/auth/refresh-role', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ upgradeToArtist: true }),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            updateUser({ ...data.user, token: data.token });
            upgradeToArtist(user.id);
            toast.success(`Artist Portal unlocked for ${data.user.name}!`, {
              style: { background: '#ffffff', color: '#221a15', border: `1px solid ${G}30`, borderRadius: 12, boxShadow: '0 4px 12px rgba(43, 34, 26, 0.05)' },
              id: 'bg-sync-success'
            });
          }
        })
        .catch((err) => console.error('Background role sync error:', err));
    }
  }, [user, needsSync, updateUser, upgradeToArtist]);

  const [showUserMenu, setShowUserMenu] = useState(false);
  const { activeUsers } = useRealtimeStore();
  const menuRef = useRef<HTMLDivElement>(null);

  const { currentTrack, playTrack } = usePlayerStore();
  const { getAllTracks, activeArtistIds } = useMusicStore();
  const allTracks = getAllTracks();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    if (!val.trim()) {
      setSearchResults(null);
      return;
    }
    const activeArtistIdsList = activeArtistIds || ['artist-1', 'artist-2', 'artist-3', 'artist-4', 'artist-5', 'artist-6'];
    const activeArtists = mockArtists.filter(a => activeArtistIdsList.includes(a.id));
    const activeAlbums = mockAlbums.filter(al => activeArtistIdsList.includes(al.artistId));
    const res = search(val, {
      tracks: allTracks,
      artists: activeArtists,
      albums: activeAlbums,
      playlists: mockPlaylists
    });
    setSearchResults(res);
  };

  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');

  useEffect(() => {
    if (role === 'SUPER_ADMIN') {
      fetch('/api/currency')
        .then(res => res.json())
        .then(data => {
          if (data.success && data.currency) {
            setCurrency(data.currency);
          }
        })
        .catch(err => console.error('Error fetching currency:', err));
    }
  }, [role]);

  const handleCurrencyChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCurrency = e.target.value as 'USD' | 'INR';
    const tid = toast.loading('Changing global currency...');
    try {
      const res = await fetch('/api/currency', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currency: newCurrency }),
      });
      const data = await res.json();
      if (data.success) {
        setCurrency(newCurrency);
        toast.success(data.message || `Global currency set to ${newCurrency}`, { id: tid });
        window.location.reload();
      } else {
        toast.error(data.error || 'Failed to change global currency', { id: tid });
      }
    } catch (err) {
      toast.error('Network error changing currency', { id: tid });
    }
  };

  // Close menu on outside click
  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowUserMenu(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const barStyle: React.CSSProperties = {
    position: 'sticky', top: 0, zIndex: 50,
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: isMobile 
      ? 'calc(var(--sat, 0px) + 10px) 16px 10px 16px' 
      : isScrolled ? '12px 32px' : '18px 32px',
    background: transparent 
      ? (isScrolled ? 'rgba(251,249,245,0.85)' : 'transparent')
      : bgColor 
        ? `linear-gradient(to bottom, ${bgColor}cc, transparent)` 
        : 'rgba(251,249,245,0.9)',
    backdropFilter: transparent 
      ? (isScrolled ? 'blur(20px)' : 'none')
      : 'blur(20px)',
    WebkitBackdropFilter: transparent 
      ? (isScrolled ? 'blur(20px)' : 'none')
      : 'blur(20px)',
    borderBottom: transparent 
      ? (isScrolled ? '1px solid rgba(43, 34, 26, 0.06)' : 'none')
      : '1px solid rgba(43, 34, 26, 0.06)',
    boxShadow: isScrolled ? '0 8px 30px rgba(43, 34, 26, 0.03)' : 'none',
    transition: 'all 0.3s ease-in-out',
    width: '100%',
  };

  const userMenuItems = [
    { label: 'Account', icon: User, href: '/settings', roles: ['USER', 'ARTIST', 'ADMIN', 'SUPER_ADMIN'] },
    { label: 'Profile', icon: User, href: '/profile', roles: ['USER', 'ARTIST', 'ADMIN', 'SUPER_ADMIN'] },
    { 
      label: 'Become an Artist', 
      icon: Mic2, 
      href: '/artist/apply', 
      roles: ['USER'],
      hide: isApproved
    },
    { 
      label: 'Artist Dashboard', 
      icon: Mic2, 
      href: '/artist/dashboard', 
      roles: ['ARTIST', 'SUPER_ADMIN'],
      showIfApproved: true 
    },
    { label: 'Admin Panel', icon: Shield, href: '/admin/dashboard', roles: ['ADMIN', 'SUPER_ADMIN'] },
    { label: 'Settings', icon: Settings, href: '/settings', roles: ['USER', 'ARTIST', 'ADMIN', 'SUPER_ADMIN'] },
  ];

  const allowedMenuItems = userMenuItems.filter((item: any) => {
    if (item.hide) return false;
    if (item.showIfApproved && isApproved) return true;
    return item.roles.includes(role);
  });

  const handleItemClick = async (e: React.MouseEvent<HTMLAnchorElement>, label: string, href: string) => {
    if (label === 'Artist Dashboard' && (role === 'USER' || cookieRole !== 'ARTIST') && isApproved) {
      e.preventDefault();
      setShowUserMenu(false);
      const tid = toast.loading('Unlocking Artist Portal...');
      try {
        const res = await fetch('/api/auth/refresh-role', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ upgradeToArtist: true }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          updateUser({ ...data.user, token: data.token });
          upgradeToArtist(user?.id || '');
          toast.success('Artist Portal unlocked!', { id: tid });
          // Hard navigate so middleware loads cookie correctly
          window.location.href = href;
        } else {
          toast.error('Unable to refresh session. Loading dashboard...', { id: tid });
          router.push(href);
        }
      } catch (err) {
        toast.error('Network error. Redirecting...', { id: tid });
        router.push(href);
      }
    } else {
      setShowUserMenu(false);
    }
  };

  return (
    <div style={barStyle}>
      {/* Nav buttons */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button onClick={() => router.back()} className="flex" style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(43, 34, 26, 0.08)', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', color: '#221a15', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'; e.currentTarget.style.transform = 'scale(1)'; }}>
          <ChevronLeft size={17} />
        </button>
        <button onClick={() => router.forward()} className="hidden md:flex" style={{ width: 34, height: 34, borderRadius: '50%', background: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(43, 34, 26, 0.08)', cursor: 'pointer', alignItems: 'center', justifyContent: 'center', color: '#221a15', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.9)'; e.currentTarget.style.transform = 'scale(1.05)'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'; e.currentTarget.style.transform = 'scale(1)'; }}>
          <ChevronRight size={17} />
        </button>

        {/* Live users indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-ss-primary/10 border border-ss-primary/20 ml-0 md:ml-2">
          <div className="w-1.5 h-1.5 rounded-full bg-ss-primary animate-pulse" />
          <span style={{ color: '#87786c', fontSize: 11, fontWeight: 600 }}>
            {activeUsers.toLocaleString()}
            <span className="hidden sm:inline"> listening now</span>
          </span>
        </div>
      </div>

      {/* Right controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {/* Currency Switcher (Super Admin Only) */}
        {role === 'SUPER_ADMIN' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
            <select
              value={currency}
              onChange={handleCurrencyChange}
              style={{
                background: 'rgba(43,34,26,0.05)',
                border: '1px solid rgba(43,34,26,0.1)',
                borderRadius: 100,
                color: '#221a15',
                padding: '6px 28px 6px 14px',
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
                appearance: 'none',
                WebkitAppearance: 'none',
                outline: 'none',
                transition: 'background 0.15s, border-color 0.15s',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(43,34,26,0.08)';
                e.currentTarget.style.borderColor = 'rgba(43,34,26,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(43,34,26,0.05)';
                e.currentTarget.style.borderColor = 'rgba(43,34,26,0.1)';
              }}
            >
              <option value="USD" style={{ background: '#ffffff', color: '#221a15' }}>💵 USD ($)</option>
              <option value="INR" style={{ background: '#ffffff', color: '#221a15' }}>🇮🇳 INR (₹)</option>
            </select>
            <ChevronDown
              size={12}
              color="rgba(43,34,26,0.6)"
              style={{
                position: 'absolute',
                right: 12,
                pointerEvents: 'none',
              }}
            />
          </div>
        )}

        {/* ── Search Box on TopBar ── */}
        {showSearch && (
          <div className="hidden md:block relative w-[260px] z-[100]">
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <Search size={14} color={searchQuery ? '#221a15' : '#87786c'} style={{ position: 'absolute', left: 12, flexShrink: 0 }} />
              <input
                value={searchQuery}
                onChange={e => { handleSearchChange(e.target.value); setShowSearchDropdown(true); }}
                placeholder="Search..."
                style={{
                  width: '100%',
                  background: 'rgba(255, 255, 255, 0.6)',
                  backdropFilter: 'blur(10px)',
                  border: `1px solid ${searchQuery ? G : 'rgba(43, 34, 26, 0.08)'}`,
                  borderRadius: 20,
                  padding: '8px 30px 8px 34px',
                  color: '#221a15',
                  fontSize: 12.5,
                  outline: 'none',
                  fontFamily: 'Inter, sans-serif',
                  transition: 'all 0.25s ease-in-out',
                  boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
                }}
                onFocus={e => {
                  setShowSearchDropdown(true);
                  e.currentTarget.style.borderColor = G;
                  e.currentTarget.style.background = '#ffffff';
                  e.currentTarget.style.boxShadow = '0 4px 15px rgba(176, 136, 80, 0.08)';
                }}
                onBlur={e => {
                  e.currentTarget.style.borderColor = searchQuery ? G : 'rgba(43, 34, 26, 0.08)';
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)';
                  e.currentTarget.style.boxShadow = '0 2px 10px rgba(0,0,0,0.02)';
                }}
              />
              {searchQuery && (
                <button
                  onClick={() => { setSearchQuery(''); setSearchResults(null); }}
                  style={{ position: 'absolute', right: 12, background: 'none', border: 'none', cursor: 'pointer', color: '#87786c', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 0 }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Floating Dropdown for results (aligned right) */}
            <AnimatePresence>
              {showSearchDropdown && searchQuery.trim() && searchResults && (
                <>
                  <div 
                    onClick={() => setShowSearchDropdown(false)}
                    style={{ position: 'fixed', inset: 0, zIndex: 99 }}
                  />
                  
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{
                      position: 'absolute',
                      top: 'calc(100% + 8px)',
                      right: 0,
                      width: 320,
                      background: '#fffcf8',
                      backdropFilter: 'blur(20px)',
                      border: '1px solid rgba(43,34,26,0.08)',
                      borderRadius: 12,
                      zIndex: 100,
                      overflow: 'hidden',
                      boxShadow: '0 16px 48px rgba(43,34,26,0.1)',
                      maxHeight: 350,
                      overflowY: 'auto',
                      padding: '12px'
                    }}
                  >
                    {/* Songs Section */}
                    {searchResults.tracks.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ color: '#87786c', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Songs</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                           {searchResults.tracks.slice(0, 4).map((track: any) => {
                            const isCurrent = currentTrack?.id === track.id;
                            return (
                              <div 
                                key={track.id}
                                onClick={() => {
                                  playTrack(track, searchResults.tracks);
                                  setShowSearchDropdown(false);
                                }}
                                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '5px 8px', borderRadius: 8, cursor: 'pointer', transition: 'background 0.2s', background: 'transparent' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(43,34,26,0.04)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                              >
                                <div style={{ width: 28, height: 28, borderRadius: 4, backgroundImage: track.coverImage ? `url(${track.coverImage})` : 'none', backgroundColor: track.coverImage ? 'transparent' : trackGradient(track.id), backgroundSize: 'cover', backgroundPosition: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                  {!track.coverImage && <Music size={10} color="#87786c" />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <p style={{ color: isCurrent ? G : '#221a15', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.title}</p>
                                  <p style={{ color: '#87786c', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{track.artistName}</p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
 
                     {/* Artists Section */}
                    {searchResults.artists.length > 0 && (
                      <div style={{ marginBottom: 12 }}>
                        <p style={{ color: '#87786c', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Artists</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {searchResults.artists.slice(0, 3).map((artist: any) => (
                            <Link 
                              key={artist.id}
                              href={`/artist/${artist.id}`}
                              onClick={() => setShowSearchDropdown(false)}
                              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '5px 8px', borderRadius: 8, transition: 'background 0.2s' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(43,34,26,0.04)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div style={{ width: 28, height: 28, borderRadius: '50%', background: `hsl(${artist.id.charCodeAt(artist.id.length - 1) * 40 % 360}, 50%, 35%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12 }}>
                                🎤
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ color: '#221a15', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{artist.name}</p>
                                <p style={{ color: '#87786c', fontSize: 10 }}>Artist</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
 
                     {/* Albums Section */}
                    {searchResults.albums.length > 0 && (
                      <div>
                        <p style={{ color: '#87786c', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Albums</p>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                          {searchResults.albums.slice(0, 3).map((album: any) => (
                            <Link 
                              key={album.id}
                              href={`/album/${album.id}`}
                              onClick={() => setShowSearchDropdown(false)}
                              style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, padding: '5px 8px', borderRadius: 8, transition: 'background 0.2s' }}
                              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(43,34,26,0.04)')}
                              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                            >
                              <div style={{ width: 28, height: 28, borderRadius: 4, background: trackGradient(album.id), display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 12 }}>
                                💿
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <p style={{ color: '#221a15', fontSize: 12, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.title}</p>
                                <p style={{ color: '#87786c', fontSize: 10, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{album.artistName}</p>
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
 
                     {/* No Results */}
                    {searchResults.tracks.length === 0 && searchResults.artists.length === 0 && searchResults.albums.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '10px 0' }}>
                        <p style={{ color: '#87786c', fontSize: 12 }}>No results found for "{searchQuery}"</p>
                      </div>
                    )}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Explore Premium */}
        <Link href="/premium" className="hidden md:block" style={{ textDecoration: 'none' }}>
          <button style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 100, background: 'rgba(255, 255, 255, 0.6)', border: '1px solid rgba(176, 136, 80, 0.15)', color: '#221a15', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}
            onMouseEnter={e => { e.currentTarget.style.background = 'rgba(176, 136, 80, 0.06)'; e.currentTarget.style.borderColor = 'rgba(176, 136, 80, 0.4)'; e.currentTarget.style.transform = 'scale(1.02)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255, 255, 255, 0.6)'; e.currentTarget.style.borderColor = 'rgba(176, 136, 80, 0.15)'; e.currentTarget.style.transform = 'scale(1)'; }}>
            <Crown size={13} color="#fbbf24" style={{ filter: 'drop-shadow(0 1px 2px rgba(251, 191, 36, 0.3))' }} /> Explore Premium
          </button>
        </Link>

        {/* Install App */}
        <button className="hidden md:block" style={{ padding: '8px 16px', borderRadius: 100, background: 'linear-gradient(135deg, #221a15 0%, #3a2e25 100%)', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer', border: 'none', transition: 'all 0.2s', boxShadow: '0 4px 10px rgba(34, 26, 21, 0.15)' }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.03)'; e.currentTarget.style.boxShadow = '0 6px 14px rgba(34, 26, 21, 0.25)'; }}
          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 4px 10px rgba(34, 26, 21, 0.15)'; }}>
          Install App
        </button>

        {/* Mobile active listener indicator */}
        <div className="flex md:hidden items-center gap-1.5 px-2.5 py-1 rounded-full bg-ss-primary/10 border border-ss-primary/20 mr-1">
          <div className="w-1.5 h-1.5 rounded-full bg-ss-primary animate-pulse" />
          <span style={{ color: '#87786c', fontSize: 11, fontWeight: 600 }}>
            {activeUsers.toLocaleString()}
          </span>
        </div>

        {/* Notification Bell */}
        <div className="hidden md:block">
          <NotificationBell />
        </div>

        {/* User Menu */}
        <div className="hidden md:block">
          {user ? (
            <div ref={menuRef} style={{ position: 'relative' }}>
              <button onClick={() => setShowUserMenu(o => !o)} className="flex items-center gap-1.5 p-1 md:pr-3 md:pl-1 rounded-full transition-all" style={{
                background: showUserMenu ? 'rgba(43,34,26,0.08)' : 'rgba(43,34,26,0.04)', border: '1px solid rgba(43,34,26,0.08)',
                cursor: 'pointer',
              }}>
                <div style={{ width: 26, height: 26, borderRadius: '50%', background: `linear-gradient(135deg, ${G}, #ebdcb9)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: '#fff', flexShrink: 0 }}>
                  {user.name[0].toUpperCase()}
                </div>
                <span className="hidden md:inline" style={{ color: '#221a15', fontSize: 13, fontWeight: 600 }}>{user.name.split(' ')[0]}</span>
                <ChevronDown className="hidden md:inline" size={13} color="rgba(43,34,26,0.5)" style={{ transform: showUserMenu ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div initial={{ opacity: 0, y: 6, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 6, scale: 0.97 }} transition={{ duration: 0.12 }}
                    style={{ position: 'absolute', right: 0, top: 'calc(100% + 8px)', width: 220, background: '#ffffff', border: '1px solid rgba(43,34,26,0.08)', borderRadius: 14, overflow: 'hidden', boxShadow: '0 12px 40px rgba(43,34,26,0.08)', zIndex: 100 }}>
                    {/* User info header */}
                    <div style={{ padding: '14px 16px', borderBottom: '1px solid rgba(43,34,26,0.08)', display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: `linear-gradient(135deg, ${G}, #ebdcb9)`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 900, color: '#fff', flexShrink: 0 }}>
                        {user.name[0].toUpperCase()}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ color: '#221a15', fontWeight: 700, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</p>
                        <p style={{ color: G, fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{user.subscription} plan</p>
                      </div>
                    </div>

                    {allowedMenuItems.map(({ label, icon: Icon, href }) => (
                      <Link key={label} href={href} style={{ textDecoration: 'none' }} onClick={(e) => handleItemClick(e, label, href)}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', transition: 'background 0.15s', color: '#4d3f35' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(43,34,26,0.04)'; e.currentTarget.style.color = '#221a15'; }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#4d3f35'; }}>
                          <Icon size={14} />
                          <span style={{ fontSize: 13 }}>{label}</span>
                        </div>
                      </Link>
                    ))}

                    <div style={{ borderTop: '1px solid rgba(43,34,26,0.08)' }}>
                      <button onClick={() => { logout(); setShowUserMenu(false); }} style={{
                        display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer',
                        background: 'none', border: 'none', width: '100%', color: '#87786c', fontSize: 13, transition: 'background 0.15s',
                      }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(43,34,26,0.04)'; e.currentTarget.style.color = '#221a15'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#87786c'; }}>
                        <LogOut size={14} /> Log out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <Link href="/login" style={{ textDecoration: 'none' }}>
              <button style={{ padding: '7px 18px', borderRadius: 100, background: G, color: '#221a15', fontWeight: 800, fontSize: 13, cursor: 'pointer', border: 'none', fontFamily: 'Outfit, sans-serif' }}>
                Log in
              </button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
