import { NextResponse } from 'next/server';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const allUsers = db.getUsers();
    const dbArtists = allUsers.filter(u => u.role.toUpperCase() === 'ARTIST' && u.isActive !== false);
    
    // Seeded/Predefined app artists that have local profiles/tracks in mockData (using working Unsplash images)
    const appMockArtists = [
      { id: 'artist-1', name: 'Aurora Nightfall', img: 'https://images.unsplash.com/photo-1516912481808-3406841bd33c?w=100&h=100&fit=crop' },
      { id: 'artist-2', name: 'Cipher Nova', img: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=100&h=100&fit=crop' },
      { id: 'artist-3', name: 'Selene Ray', img: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop' },
      { id: 'artist-4', name: 'The Velvet Echoes', img: 'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=100&h=100&fit=crop' },
      { id: 'artist-5', name: 'Nyx & Prometheus', img: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&h=100&fit=crop' },
      { id: 'artist-6', name: 'Marco Santos', img: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop' }
    ];

    // Combine them, deduplicating by lowercase name
    const combined: any[] = [];
    const seenNames = new Set<string>();

    // Prioritize DB artists first
    for (const artist of dbArtists) {
      const lowerName = artist.name.toLowerCase();
      if (!seenNames.has(lowerName)) {
        seenNames.add(lowerName);
        combined.push({
          id: artist.id,
          name: artist.name,
          img: artist.avatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop'
        });
      }
    }

    // Then add fallback/app predefined mock artists
    for (const artist of appMockArtists) {
      const lowerName = artist.name.toLowerCase();
      if (!seenNames.has(lowerName)) {
        seenNames.add(lowerName);
        combined.push(artist);
      }
    }

    return NextResponse.json({ success: true, artists: combined });
  } catch (error) {
    console.error('Error fetching public artist list:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
