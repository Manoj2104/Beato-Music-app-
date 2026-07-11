'use client';

import { Suspense } from 'react';
import JamRoomPage from '@/components/music/JamRoomClient';

export default function Page() {
  return (
    <Suspense fallback={
      <div style={{
        minHeight: '100vh',
        background: '#1a1311',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '50%',
          border: '3px solid rgba(176, 136, 80, 0.1)',
          borderTopColor: '#b08850',
          animation: 'spin 1s linear infinite'
        }} />
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        ` }} />
      </div>
    }>
      <JamRoomPage />
    </Suspense>
  );
}
