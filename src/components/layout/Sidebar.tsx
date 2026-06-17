'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Home, Search, Library, Plus, Music2, Heart, Download, Wifi,
  LayoutDashboard, Upload, TrendingUp, DollarSign, BarChart3, Users, Shield, AlertTriangle,
  CreditCard, Globe, Activity, Key, BookOpen, Mail, FlaskConical, Settings, BellRing, Headphones, Map,
  User, Volume2, FileEdit, LayoutGrid, Wand2, CheckSquare, Mic2, FileText, Code, Trophy, MessageSquare, ShoppingBag, Share2,
  Calendar, ChevronDown, ChevronRight
} from 'lucide-react';
import { usePlayerStore } from '@/store/playerStore';
import { useAuthStore } from '@/store/authStore';
import { useArtistApplicationStore } from '@/store/artistApplicationStore';
import { usePlaylistStore } from '@/store/playlistStore';
import { useMusicStore } from '@/store/musicStore';
import { useDownloadStore } from '@/store/downloadStore';
import { mockPlaylists, mockAlbums } from '@/lib/mockData';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/library', icon: Library, label: 'Your Library' },
];

function SidebarContent() {
  const pathname = usePathname();
  const { currentTrack } = usePlayerStore();
  const { user, toggleSavePlaylist } = useAuthStore();
  const { getApplicationByUserId, fetchUserApplication } = useArtistApplicationStore();
  
  const [artistPortalExpanded, setArtistPortalExpanded] = useState(false);
  const [adminPanelExpanded, setAdminPanelExpanded] = useState(false);
  const activeApp = user ? getApplicationByUserId(user.id) : undefined;

  useEffect(() => {
    const saved = localStorage.getItem('beato-artist-portal-expanded');
    if (saved !== null) {
      setArtistPortalExpanded(saved === 'true');
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchUserApplication();
    }
  }, [user, fetchUserApplication]);
  const isApproved = activeApp?.status === 'APPROVED';

  const { customPlaylists, addPlaylist } = usePlaylistStore();

  const { downloadedTracks } = useDownloadStore();
  const likedCount = user?.likedSongs?.length ?? 0;
  const quickLinks = [
    { href: '/library?tab=liked', icon: Heart, label: 'Liked Songs', gradient: 'linear-gradient(135deg, #4338ca, #60a5fa)', count: `${likedCount} song${likedCount === 1 ? '' : 's'}` },
    { href: '/downloads', icon: Download, label: 'Downloads', gradient: 'linear-gradient(135deg, #065f46, #14b8a6)', count: `${downloadedTracks.length} song${downloadedTracks.length === 1 ? '' : 's'}` },
  ];

  const handleCreatePlaylist = () => {
    const title = prompt("Enter playlist title:");
    if (!title) return;
    const newId = `playlist-custom-${Date.now()}`;
    const newPlaylist = {
      id: newId,
      title,
      description: 'A custom playlist created by you.',
      coverImage: '',
      ownerId: user?.id || 'guest',
      ownerName: user?.name || 'You',
      tracks: [],
      totalTracks: 0,
      duration: 0,
      isPublic: true,
      isCollaborative: false,
      followers: 0,
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    };
    addPlaylist(newPlaylist);
    toggleSavePlaylist(newId);
  };

  const userCustomPlaylists = customPlaylists.filter(p => p.ownerId === user?.id || user?.playlists?.includes(p.id));
  const userPlaylists = [
    ...userCustomPlaylists,
    ...mockPlaylists.filter(p => user?.playlists?.includes(p.id))
  ];

  const searchParams = useSearchParams();

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home';
    const [path, query] = href.split('?');
    if (pathname !== path) return false;
    if (!query) {
      return !searchParams.toString();
    }
    const hrefTab = new URLSearchParams(query).get('tab');
    const currentTab = searchParams.get('tab');
    return hrefTab === currentTab;
  };

  const role = user?.role || 'USER';

  return (
    <aside className="sidebar-container">
      {/* Logo (Fixed at Top) */}
      <div className="sidebar-logo-container">
        <Link href="/home" className="sidebar-logo-link">
          <div className="sidebar-logo-icon-wrapper">
            <Music2 size={17} color="black" />
          </div>
          <span className="sidebar-logo-text">Beato</span>
        </Link>
      </div>

      {/* Main Unified Scrollable List */}
      <div className="sidebar-scrollable">
        {/* Navigation Items */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {navItems.map(({ href, icon: Icon, label }) => (
            <Link key={href} href={href} className={`sidebar-nav-link ${isActive(href) ? 'active' : ''}`}>
              <Icon size={20} strokeWidth={isActive(href) ? 2.5 : 2} />
              <span>{label}</span>
            </Link>
          ))}
        </div>

        {/* Artist Portal Menu */}
        {(role === 'ARTIST' || role === 'SUPER_ADMIN' || isApproved) && (
          <div>
            <div
              onClick={() => {
                const nextVal = !artistPortalExpanded;
                setArtistPortalExpanded(nextVal);
                localStorage.setItem('beato-artist-portal-expanded', String(nextVal));
              }}
              className="sidebar-accordion-header"
            >
              <span className="sidebar-accordion-title">Artist Portal</span>
              <ChevronDown 
                size={14} 
                className="sidebar-accordion-icon" 
                style={{ 
                  transform: artistPortalExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' 
                }} 
              />
            </div>
            <div className={`sidebar-accordion-wrapper ${artistPortalExpanded ? 'expanded' : ''}`}>
              <div className="sidebar-accordion-inner">
                {[
                  { href: '/artist/dashboard', icon: LayoutDashboard, label: 'Overview' },
                  { href: '/artist/upload', icon: Upload, label: 'Upload Track' },
                  { href: '/artist/dashboard?tab=My Music', icon: Music2, label: 'My Music' },
                  { href: '/artist/dashboard?tab=Analytics', icon: TrendingUp, label: 'Analytics' },
                  { href: '/artist/dashboard?tab=Revenue', icon: DollarSign, label: 'Revenue' },
                  { href: '/artist/dashboard?tab=Audience', icon: Users, label: 'Audience' },
                  { href: '/artist/dashboard?tab=Campaigns', icon: Globe, label: 'Campaigns' },
                  { href: '/artist/dashboard?tab=Profile', icon: User, label: 'Profile' },
                  { href: '/artist/dashboard?tab=Live Events', icon: Calendar, label: 'Live Events' },


                ].map(({ href, icon: Icon, label }) => (
                  <Link key={`${href}-${label}`} href={href} className={`sidebar-sub-link ${isActive(href) ? 'active' : ''}`}>
                    <Icon size={14} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Admin Menu */}
        {(role === 'ADMIN' || role === 'SUPER_ADMIN') && (
          <div>
            <div
              onClick={() => setAdminPanelExpanded(!adminPanelExpanded)}
              className="sidebar-accordion-header"
            >
              <span className="sidebar-accordion-title">Admin Panel</span>
              <ChevronDown 
                size={14} 
                className="sidebar-accordion-icon" 
                style={{ 
                  transform: adminPanelExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' 
                }} 
              />
            </div>
            <div className={`sidebar-accordion-wrapper ${adminPanelExpanded ? 'expanded' : ''}`}>
              <div className="sidebar-accordion-inner">
                {[
                  { href: '/admin/dashboard', icon: BarChart3, label: 'Overview' },
                  { href: '/admin/dashboard?tab=users', icon: Users, label: 'Users' },
                  { href: '/admin/dashboard?tab=artists', icon: Shield, label: 'Artists' },
                  { href: '/admin/dashboard?tab=songs', icon: Music2, label: 'Songs' },
                  { href: '/admin/dashboard?tab=reports', icon: AlertTriangle, label: 'Reports' },
                  { href: '/admin/dashboard?tab=subscriptions', icon: CreditCard, label: 'Subscriptions' },
                  { href: '/admin/dashboard?tab=payments', icon: DollarSign, label: 'Payments' },
                  { href: '/admin/dashboard?tab=analytics', icon: TrendingUp, label: 'Analytics' },
                  { href: '/admin/dashboard?tab=marketing', icon: BellRing, label: 'Marketing' },
                  { href: '/admin/dashboard?tab=notifications', icon: BellRing, label: 'Notifications' },
                  { href: '/admin/dashboard?tab=support', icon: Headphones, label: 'Support' },
                  { href: '/admin/dashboard?tab=payouts', icon: DollarSign, label: 'Payouts' },
                  { href: '/admin/dashboard?tab=geography', icon: Globe, label: 'Geography' },
                  { href: '/admin/dashboard?tab=health', icon: Activity, label: 'System Health' },
                  { href: '/admin/dashboard?tab=api', icon: Key, label: 'API Keys' },
                  { href: '/admin/dashboard?tab=audit', icon: BookOpen, label: 'Audit Logs' },
                  { href: '/admin/dashboard?tab=abtests', icon: FlaskConical, label: 'A/B Testing' },
                  { href: '/admin/dashboard?tab=email', icon: Mail, label: 'Email' },
                  { href: '/admin/dashboard?tab=content', icon: Library, label: 'Content Library' },
                  { href: '/admin/dashboard?tab=settings', icon: Settings, label: 'Settings' },
                ].map(({ href, icon: Icon, label }) => (
                  <Link key={`${href}-${label}`} href={href} className={`sidebar-sub-link ${isActive(href) ? 'active' : ''}`}>
                    <Icon size={14} />
                    <span>{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 8px' }} />

        {/* Library Section */}
        <div>
          <div className="sidebar-library-header">
            <span className="sidebar-library-title">Your Library</span>
            <button className="sidebar-library-btn" onClick={handleCreatePlaylist}>
              <Plus size={16} />
            </button>
          </div>

          {/* Quick Access */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {quickLinks.map(({ href, icon: Icon, label, gradient, count }) => (
              <Link key={href} href={href} className={`sidebar-library-link ${isActive(href) ? 'active' : ''}`}>
                <div className="sidebar-library-icon-container" style={{ background: gradient }}>
                  <Icon size={16} color="white" />
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ color: '#221a15', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{label}</p>
                  <p style={{ color: '#706155', fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: '2px 0 0 0' }}>{count}</p>
                </div>
              </Link>
            ))}
          </div>

          <div style={{ height: 1, background: 'rgba(43,34,26,0.08)', margin: '12px 12px' }} />

          {/* Playlists & Albums */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {/* Playlists */}
            {userPlaylists.map((playlist) => {
              const isPlaying = currentTrack && playlist.tracks.includes(currentTrack.id);
              const isActivePath = pathname === `/playlist/${playlist.id}`;
              const isLiked = playlist.id === 'playlist-1';
              
              // Resolve cover image from first track if no coverImage
              let resolvedCover = playlist.coverImage || '';
              if (!resolvedCover || resolvedCover === 'undefined') {
                const firstTrackId = playlist.tracks?.[0];
                if (firstTrackId) {
                  const allTracks = useMusicStore.getState().getAllTracks();
                  const track = allTracks.find((t: any) => t.id === firstTrackId);
                  if (track && track.coverImage) {
                    resolvedCover = track.coverImage;
                  }
                }
              }

              const displayImg = resolvedCover && resolvedCover !== 'undefined' ? resolvedCover : null;
              const gradCss = playlist.gradientCss || (isLiked ? 'linear-gradient(135deg,#4338ca,#60a5fa)' : 'linear-gradient(135deg,#1e3a5f,#0ea5e9)');

              return (
                <Link key={playlist.id} href={`/playlist/${playlist.id}`}
                  className={`sidebar-library-link ${isActivePath ? 'active' : ''}`}
                >
                  <div className="sidebar-library-icon-container" style={{ 
                    background: displayImg ? 'none' : gradCss,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    overflow: 'hidden'
                  }}>
                    {displayImg ? (
                      <img src={displayImg} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : isLiked ? (
                      <Heart size={14} color="white" fill="white" />
                    ) : (
                      <Music2 size={14} color="rgba(255,255,255,0.6)" />
                    )}
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <p style={{ color: isPlaying ? '#b08850' : '#221a15', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{playlist.title}</p>
                    <p style={{ color: '#706155', fontSize: 11, margin: '2px 0 0 0' }}>Playlist · {playlist.ownerName}</p>
                  </div>
                  {isPlaying && (
                    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 2, height: 16, flexShrink: 0 }}>
                      {[1, 2, 3].map(i => (
                        <div key={i} style={{ width: 2, background: '#b08850', borderRadius: 1, height: `${6 + i * 3}px`, animation: `waveform ${0.7 + i * 0.15}s ease-in-out infinite` }} />
                      ))}
                    </div>
                  )}
                </Link>
              );
            })}

            {/* Albums */}
            {mockAlbums.slice(0, 4).map((album) => {
              const isActivePath = pathname === `/album/${album.id}`;
              return (
                <Link key={album.id} href={`/album/${album.id}`}
                  className={`sidebar-library-link ${isActivePath ? 'active' : ''}`}
                >
                  <div className="sidebar-library-icon-container" style={{ background: `hsl(${(album.id.charCodeAt(0) * 37) % 360}, 50%, 35%)` }}>
                    <Music2 size={14} color="rgba(255,255,255,0.6)" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ color: '#221a15', fontSize: 13, fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', margin: 0 }}>{album.title}</p>
                    <p style={{ color: '#706155', fontSize: 11, margin: '2px 0 0 0' }}>Album · {album.artistName}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Install App (Fixed at Bottom) */}
      <div className="premium-install-card">
        <div className="premium-install-inner">
          <div className="premium-install-title-row">
            <Wifi size={13} color="#b08850" />
            <span className="premium-install-title">Install App</span>
          </div>
          <p className="premium-install-desc">Listen offline, anywhere.</p>
        </div>
      </div>
    </aside>
  );
}

export default function Sidebar() {
  return (
    <Suspense fallback={<div style={{ width: 280, background: '#f4eede', height: '100%' }} />}>
      <SidebarContent />
    </Suspense>
  );
}
