'use client';

import { Suspense, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams, useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import {
  Home, Search, Library, Plus, Music2, Heart, Download, Wifi,
  LayoutDashboard, Upload, TrendingUp, DollarSign, BarChart3, Users, Shield, AlertTriangle,
  CreditCard, Globe, Activity, Key, BookOpen, Mail, FlaskConical, Settings, BellRing, Headphones, Map,
  User, Volume2, FileEdit, LayoutGrid, Wand2, CheckSquare, Mic2, FileText, Code, Trophy, MessageSquare, ShoppingBag, Share2,
  Calendar, ChevronDown, ChevronRight, Crown, Library as LibraryIcon, Megaphone, Music, Mic, Star,
  Database, BarChart2, Layers, Bell, Link2, MapPin, Target, ScrollText, ImageIcon,
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
  const router = useRouter();
  const { currentTrack } = usePlayerStore();
  const { user, toggleSavePlaylist } = useAuthStore();
  const { getApplicationByUserId, fetchUserApplication } = useArtistApplicationStore();
  
  const [artistPortalExpanded, setArtistPortalExpanded] = useState(false);
  const [adminPanelExpanded, setAdminPanelExpanded] = useState(false);
  const [createMenuOpen, setCreateMenuOpen] = useState(false);
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

  const handleCreateRoom = async () => {
    const name = prompt("Enter Room Name:", `${user?.name || 'My'}'s Listening Party`);
    if (!name) return;
    const description = prompt("Enter Room Description (optional):", "Come listen to awesome music with me!");
    const isCollab = confirm("Allow anyone in the room to control playback?");
    const password = prompt("Enter password to make it private (or leave empty for a public room):") || undefined;
    
    try {
      const res = await fetch('/api/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, isCollaborative: isCollab, password })
      });
      const data = await res.json();
      if (data.success && data.room) {
        toast.success(`Jam Room "${name}" created! 🎧`);
        router.push(`/room/${data.room.id}`);
      } else {
        toast.error(data.error || 'Failed to create room');
      }
    } catch (err) {
      console.error('Failed to create room:', err);
      toast.error('Network error creating room');
    }
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

  const hasPermission = (perm: string) => {
    if (!user) return false;
    const userRole = user.role || 'USER';
    if (userRole === 'SUPER_ADMIN' || userRole === 'super_admin') return true;
    
    // Client-side fallback if not loaded yet
    const getFallbackPermissions = (roleName: string, serverPermissions?: string[]) => {
      if (serverPermissions !== undefined && Array.isArray(serverPermissions)) {
        return serverPermissions;
      }
      const r = roleName.toLowerCase();
      if (r === 'admin') {
        return ['manage_users','manage_artists','manage_songs','manage_subscriptions','manage_payments','view_analytics','manage_reports','manage_notifications','manage_support','manage_content','manage_marketing'];
      }
      if (r === 'moderator') {
        return ['manage_artists','manage_songs','manage_reports','manage_support','manage_content'];
      }
      if (r === 'analyst') {
        return ['view_analytics','manage_reports','export_data'];
      }
      return [];
    };

    const permissions = getFallbackPermissions(userRole, user.permissions);
    const has = permissions.includes(perm);
    console.log(`[Sidebar] User ${user.email} checking permission: ${perm}. Has it? ${has}. Permissions used:`, permissions);
    return has;
  };

  const role = user?.role || 'USER';

  return (
    <aside className="sidebar-container">
      {/* Logo (Fixed at Top) */}
      <div className="sidebar-logo-container">
        <Link href="/home" className="sidebar-logo-link">
          <div className="sidebar-logo-icon-wrapper">
            <Music2 size={17} color="white" />
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

        {/* ── SUPER ADMIN: Single Unified Panel ──────────────────────── */}
        {(role === 'SUPER_ADMIN' || role === 'super_admin') && (
          <div>
            <div
              onClick={() => setAdminPanelExpanded(!adminPanelExpanded)}
              className="sidebar-accordion-header"
            >
              <span className="sidebar-accordion-title" style={{ color: '#b08850' }}>⭐ Super Admin</span>
              <ChevronDown
                size={14}
                className="sidebar-accordion-icon"
                style={{ transform: adminPanelExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
              />
            </div>
            <div className={`sidebar-accordion-wrapper ${adminPanelExpanded ? 'expanded' : ''}`}>
              <div className="sidebar-accordion-inner">

                {/* ── Platform Overview ─────────────────────── */}
                <div style={{ padding: '6px 8px 2px', fontSize: 9, fontWeight: 800, color: '#b08850', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Platform</div>
                {[
                  { href: '/admin/dashboard', icon: BarChart3, label: 'Overview' },
                  { href: '/admin/dashboard?tab=analytics', icon: TrendingUp, label: 'Analytics' },
                  { href: '/admin/dashboard?tab=health', icon: Activity, label: 'System Health' },
                  { href: '/admin/dashboard?tab=settings', icon: Settings, label: 'Settings' },
                ].map(({ href, icon: Icon, label }) => (
                  <Link key={`${href}-${label}`} href={href} className={`sidebar-sub-link ${isActive(href) ? 'active' : ''}`}>
                    <Icon size={14} /><span>{label}</span>
                  </Link>
                ))}

                {/* ── People ─────────────────────────────────── */}
                <div style={{ padding: '8px 8px 2px', fontSize: 9, fontWeight: 800, color: '#87786c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>People</div>
                {[
                  { href: '/admin/dashboard?tab=users', icon: Users, label: 'Users' },
                  { href: '/admin/dashboard?tab=artists', icon: Mic2, label: 'Artists' },
                  { href: '/admin/dashboard?tab=superadmin', icon: Crown, label: 'Roles & Admins', superAdminOnly: true },
                ].map(({ href, icon: Icon, label, superAdminOnly }: any) => (
                  <Link key={`${href}-${label}`} href={href}
                    className={`sidebar-sub-link ${isActive(href) ? 'active' : ''}`}
                    style={superAdminOnly ? { color: '#b08850', fontWeight: 700 } : {}}>
                    <Icon size={14} style={superAdminOnly ? { color: '#b08850' } : {}} /><span>{label}</span>
                  </Link>
                ))}

                {/* ── Content ────────────────────────────────── */}
                <div style={{ padding: '8px 8px 2px', fontSize: 9, fontWeight: 800, color: '#87786c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Content</div>
                {[
                  { href: '/admin/dashboard?tab=songs', icon: Music2, label: 'Songs' },
                  { href: '/admin/dashboard?tab=content', icon: Library, label: 'Content Library' },
                  { href: '/admin/dashboard?tab=reports', icon: AlertTriangle, label: 'Reports' },
                ].map(({ href, icon: Icon, label }) => (
                  <Link key={`${href}-${label}`} href={href} className={`sidebar-sub-link ${isActive(href) ? 'active' : ''}`}>
                    <Icon size={14} /><span>{label}</span>
                  </Link>
                ))}

                {/* ── Finance ────────────────────────────────── */}
                <div style={{ padding: '8px 8px 2px', fontSize: 9, fontWeight: 800, color: '#87786c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Finance</div>
                {[
                  { href: '/admin/dashboard?tab=subscriptions', icon: CreditCard, label: 'Subscriptions' },
                  { href: '/admin/dashboard?tab=payments', icon: DollarSign, label: 'Payments' },
                  { href: '/admin/dashboard?tab=payouts', icon: TrendingUp, label: 'Payouts' },
                  { href: '/admin/dashboard?tab=geography', icon: Globe, label: 'Geography' },
                ].map(({ href, icon: Icon, label }) => (
                  <Link key={`${href}-${label}`} href={href} className={`sidebar-sub-link ${isActive(href) ? 'active' : ''}`}>
                    <Icon size={14} /><span>{label}</span>
                  </Link>
                ))}

                {/* ── Growth ─────────────────────────────────── */}
                <div style={{ padding: '8px 8px 2px', fontSize: 9, fontWeight: 800, color: '#87786c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Growth</div>
                {[
                  { href: '/admin/dashboard?tab=marketing', icon: Megaphone, label: 'Marketing' },
                  { href: '/admin/dashboard?tab=notifications', icon: BellRing, label: 'Notifications' },
                  { href: '/admin/dashboard?tab=support', icon: Headphones, label: 'Support' },
                  { href: '/admin/dashboard?tab=abtests', icon: FlaskConical, label: 'A/B Testing' },
                ].map(({ href, icon: Icon, label }) => (
                  <Link key={`${href}-${label}`} href={href} className={`sidebar-sub-link ${isActive(href) ? 'active' : ''}`}>
                    <Icon size={14} /><span>{label}</span>
                  </Link>
                ))}

                {/* ── Developer ──────────────────────────────── */}
                <div style={{ padding: '8px 8px 2px', fontSize: 9, fontWeight: 800, color: '#87786c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Developer</div>
                {[
                  { href: '/admin/dashboard?tab=api', icon: Key, label: 'API Keys' },
                  { href: '/admin/dashboard?tab=audit', icon: BookOpen, label: 'Audit Logs' },
                  { href: '/admin/dashboard?tab=email', icon: Mail, label: 'Email Config' },
                ].map(({ href, icon: Icon, label }) => (
                  <Link key={`${href}-${label}`} href={href} className={`sidebar-sub-link ${isActive(href) ? 'active' : ''}`}>
                    <Icon size={14} /><span>{label}</span>
                  </Link>
                ))}

                {/* ── Artist Portal (merged) ─────────────────── */}
                <div style={{ padding: '8px 8px 2px', fontSize: 9, fontWeight: 800, color: '#87786c', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Artist Portal</div>
                {[
                  { href: '/artist/dashboard', icon: LayoutDashboard, label: 'Artist Overview' },
                  { href: '/artist/upload', icon: Upload, label: 'Upload Track' },
                  { href: '/artist/dashboard?tab=My Music', icon: Music2, label: 'My Music' },
                  { href: '/artist/dashboard?tab=Revenue', icon: DollarSign, label: 'Artist Revenue' },
                  { href: '/artist/dashboard?tab=Audience', icon: Users, label: 'Audience' },
                  { href: '/artist/dashboard?tab=Live Events', icon: Calendar, label: 'Live Events' },
                ].map(({ href, icon: Icon, label }) => (
                  <Link key={`${href}-${label}`} href={href} className={`sidebar-sub-link ${isActive(href) ? 'active' : ''}`}>
                    <Icon size={14} /><span>{label}</span>
                  </Link>
                ))}

                {/* ── Ads Management ─────────────────────────── */}
                <div style={{ padding: '8px 8px 2px', fontSize: 9, fontWeight: 800, color: '#b08850', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Ads Management</div>
                <Link href="/admin/dashboard?tab=adsmanagement"
                  className={`sidebar-sub-link ${isActive('/admin/dashboard?tab=adsmanagement') ? 'active' : ''}`}
                  style={{ color: '#b08850', fontWeight: 700 }}>
                  <Megaphone size={14} style={{ color: '#b08850' }} /><span>📣 Ads Manager</span>
                </Link>

              </div>
            </div>
          </div>
        )}

        {/* ── ARTIST role: Artist Portal only ─────────────────────────── */}
        {(role === 'ARTIST' || isApproved) && role !== 'SUPER_ADMIN' && role !== 'super_admin' && (
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
                style={{ transform: artistPortalExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
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
                    <Icon size={14} /><span>{label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── ADMIN / MODERATOR / ANALYST: Admin Panel only ──────────── */}
        {(role === 'ADMIN' || role === 'admin' || role === 'moderator' || role === 'analyst' || role === 'MODERATOR' || role === 'ANALYST') && (
          <div>
            <div
              onClick={() => setAdminPanelExpanded(!adminPanelExpanded)}
              className="sidebar-accordion-header"
            >
              <span className="sidebar-accordion-title">Admin Panel</span>
              <ChevronDown
                size={14}
                className="sidebar-accordion-icon"
                style={{ transform: adminPanelExpanded ? 'rotate(0deg)' : 'rotate(-90deg)' }}
              />
            </div>
            <div className={`sidebar-accordion-wrapper ${adminPanelExpanded ? 'expanded' : ''}`}>
              <div className="sidebar-accordion-inner">
                {[
                  { href: '/admin/dashboard', icon: BarChart3, label: 'Overview' },
                  { href: '/admin/dashboard?tab=users', icon: Users, label: 'Users', permission: 'manage_users' },
                  { href: '/admin/dashboard?tab=artists', icon: Shield, label: 'Artists', permission: 'manage_artists' },
                  { href: '/admin/dashboard?tab=songs', icon: Music2, label: 'Songs', permission: 'manage_songs' },
                  { href: '/admin/dashboard?tab=reports', icon: AlertTriangle, label: 'Reports', permission: 'manage_reports' },
                  { href: '/admin/dashboard?tab=subscriptions', icon: CreditCard, label: 'Subscriptions', permission: 'manage_subscriptions' },
                  { href: '/admin/dashboard?tab=payments', icon: DollarSign, label: 'Payments', permission: 'manage_payments' },
                  { href: '/admin/dashboard?tab=analytics', icon: TrendingUp, label: 'Analytics', permission: 'view_analytics' },
                  { href: '/admin/dashboard?tab=marketing', icon: Megaphone, label: 'Marketing', permission: 'manage_marketing' },
                  { href: '/admin/dashboard?tab=notifications', icon: BellRing, label: 'Notifications', permission: 'manage_notifications' },
                  { href: '/admin/dashboard?tab=support', icon: Headphones, label: 'Support', permission: 'manage_support' },
                  { href: '/admin/dashboard?tab=payouts', icon: TrendingUp, label: 'Payouts', permission: 'manage_payouts' },
                  { href: '/admin/dashboard?tab=geography', icon: Globe, label: 'Geography', permission: 'manage_geography' },
                  { href: '/admin/dashboard?tab=health', icon: Activity, label: 'System Health', permission: 'manage_settings' },
                  { href: '/admin/dashboard?tab=api', icon: Key, label: 'API Keys', permission: 'manage_api_keys' },
                  { href: '/admin/dashboard?tab=audit', icon: BookOpen, label: 'Audit Logs', permission: 'view_audit_logs' },
                  { href: '/admin/dashboard?tab=abtests', icon: FlaskConical, label: 'A/B Testing', permission: 'manage_ab_tests' },
                  { href: '/admin/dashboard?tab=email', icon: Mail, label: 'Email', permission: 'manage_email' },
                  { href: '/admin/dashboard?tab=content', icon: Library, label: 'Content Library', permission: 'manage_content' },
                  { href: '/admin/dashboard?tab=settings', icon: Settings, label: 'Settings', permission: 'manage_settings' },
                ].filter((item: any) => item.permission ? hasPermission(item.permission) : true)
                  .map(({ href, icon: Icon, label }: any) => (
                    <Link key={`${href}-${label}`} href={href} className={`sidebar-sub-link ${isActive(href) ? 'active' : ''}`}>
                      <Icon size={14} /><span>{label}</span>
                    </Link>
                  ))}
              </div>
            </div>
          </div>
        )}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 8px' }} />

        {/* Library Section */}
        <div>
          <div className="sidebar-library-header" style={{ position: 'relative' }}>
            <span className="sidebar-library-title">Your Library</span>
            <button className="sidebar-library-btn" onClick={() => setCreateMenuOpen(!createMenuOpen)}>
              <Plus size={16} />
            </button>
            {createMenuOpen && (
              <div style={{
                position: 'absolute',
                right: 4,
                top: 32,
                background: '#ffffff',
                border: '1px solid rgba(176,136,80,0.18)',
                borderRadius: 12,
                padding: '6px',
                zIndex: 100,
                boxShadow: '0 8px 30px rgba(43,34,26,0.12)',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                minWidth: 155
              }}>
                <button onClick={() => { setCreateMenuOpen(false); handleCreatePlaylist(); }} style={{
                  background: 'none',
                  border: 'none',
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#221a15',
                  cursor: 'pointer',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(176,136,80,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Music2 size={13} color="#b08850" />
                  Create Playlist
                </button>
                <button onClick={() => { setCreateMenuOpen(false); handleCreateRoom(); }} style={{
                  background: 'none',
                  border: 'none',
                  padding: '8px 12px',
                  textAlign: 'left',
                  fontSize: 12,
                  fontWeight: 700,
                  color: '#221a15',
                  cursor: 'pointer',
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  width: '100%',
                  transition: 'background 0.15s'
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(176,136,80,0.08)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <Users size={13} color="#b08850" />
                  Create Jam Room
                </button>
              </div>
            )}
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
