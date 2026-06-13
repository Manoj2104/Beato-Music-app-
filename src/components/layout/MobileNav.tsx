'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import { Home, Search, Library, Download, Plus, LayoutDashboard, Upload, Music, TrendingUp } from 'lucide-react';

function MobileNavContent() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams.get('tab');
  
  const isArtistPanel = pathname.startsWith('/artist');

  const normalNavItems = [
    { href: '/home', icon: Home, label: 'Home' },
    { href: '/search', icon: Search, label: 'Search' },
    { href: '/library', icon: Library, label: 'Your Library' },
    { href: '/downloads', icon: Download, label: 'Downloads' },
    { href: '/library?create=true', icon: Plus, label: 'Create' },
  ];

  const artistNavItems = [
    { href: '/home', icon: Home, label: 'Home' },
    { href: '/artist/dashboard', icon: LayoutDashboard, label: 'Overview' },
    { href: '/artist/upload', icon: Upload, label: 'Upload' },
    { href: '/artist/dashboard?tab=My+Music', icon: Music, label: 'My Music' },
    { href: '/artist/dashboard?tab=Analytics', icon: TrendingUp, label: 'Analytics' },
  ];

  const navItems = isArtistPanel ? artistNavItems : normalNavItems;

  const isActive = (href: string) => {
    if (href === '/home') return pathname === '/home';
    
    const [pathPart, queryPart] = href.split('?');
    if (pathname !== pathPart) return false;
    
    if (queryPart) {
      const targetParams = new URLSearchParams(queryPart);
      const targetTab = targetParams.get('tab');
      return currentTab === targetTab;
    } else {
      if (pathname === '/artist/dashboard') {
        return !currentTab || currentTab === 'Overview';
      }
      return true;
    }
  };

  return (
    <nav className="mobile-nav">
      {navItems.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textDecoration: 'none',
              color: active ? '#fff' : '#a3a3a3',
              fontSize: '10px',
              fontWeight: active ? '700' : '500',
              gap: '4px',
              flex: 1,
              height: '100%',
              transition: 'color 0.2s ease',
            }}
          >
            <Icon size={20} strokeWidth={active ? 2.5 : 2} color={active ? '#fff' : '#a3a3a3'} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export default function MobileNav() {
  return (
    <Suspense fallback={<nav className="mobile-nav" />}>
      <MobileNavContent />
    </Suspense>
  );
}
