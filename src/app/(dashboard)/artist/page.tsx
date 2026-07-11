'use client';

import { Suspense } from 'react';
import ArtistPage from '@/components/music/ArtistClient';

export default function Page() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: '#fbf9f5',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid rgba(15, 81, 50, 0.1)',
          borderTopColor: '#0f5132',
          animation: 'spin 1s linear infinite'
        }} />
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        ` }} />
      </div>
    }>
      <ArtistPage />
    </Suspense>
  );
}
