'use client';

import { Suspense } from 'react';
import PodcastCreatorView from '@/components/music/PodcastCreatorView';

export default function PodcastCreatorPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', minHeight: '100vh', background: '#fbf9f5', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#87786c', fontWeight: 600 }}>Loading Creator Studio...</p>
      </div>
    }>
      <PodcastCreatorView />
    </Suspense>
  );
}
