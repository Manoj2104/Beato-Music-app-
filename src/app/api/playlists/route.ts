import { NextRequest, NextResponse } from 'next/server';
import { dbSupabase } from '@/lib/dbSupabase';
import { verifyJWT } from '@/lib/jwt';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const isCloud = process.env.DATABASE_MODE === 'supabase';
    if (!isCloud) {
      return NextResponse.json({ success: true, playlists: [] });
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    const allPlaylists = await dbSupabase.getPlaylists();
    
    // Map snake_case database schema back to camelCase for the frontend Store
    const formatted = allPlaylists.map((p: any) => ({
      id: p.id,
      title: p.title,
      description: p.description || '',
      coverImage: p.cover_image || '',
      ownerId: p.owner_id,
      ownerName: p.owner_name,
      tracks: p.tracks || [],
      totalTracks: p.total_tracks || 0,
      duration: p.duration || 0,
      isPublic: p.is_public !== false,
      isCollaborative: p.is_collaborative === true,
      followers: p.followers || 0,
      createdAt: p.created_at,
      updatedAt: p.updated_at,
      gradientCss: p.gradient_css || '',
      tags: p.tags || []
    }));

    // If userId is provided, filter playlists owned by that user or public/collaborative ones
    const filtered = userId 
      ? formatted.filter(p => p.ownerId === userId || p.isPublic || p.isCollaborative)
      : formatted;

    return NextResponse.json({ success: true, playlists: filtered });
  } catch (error: any) {
    console.error('Fetch playlists API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch playlists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const isCloud = process.env.DATABASE_MODE === 'supabase';
    if (!isCloud) {
      return NextResponse.json({ success: true, message: 'Local mode active: LocalStorage used for playlists' });
    }

    // Authenticate the request
    const token = request.headers.get('authorization')?.split(' ')[1] || 
                  request.cookies.get('beato-token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const decoded = await verifyJWT(token);
    if (!decoded) {
      return NextResponse.json({ error: 'Invalid or expired session' }, { status: 401 });
    }

    const playlist = await request.json();
    if (!playlist.id || !playlist.title) {
      return NextResponse.json({ error: 'Playlist ID and title are required' }, { status: 400 });
    }

    // Map frontend camelCase payload to snake_case for PostgreSQL database
    const dbPayload = {
      id: playlist.id,
      title: playlist.title,
      description: playlist.description || '',
      cover_image: playlist.coverImage || '',
      owner_id: playlist.ownerId || decoded.userId,
      owner_name: playlist.ownerName || decoded.name,
      tracks: playlist.tracks || [],
      total_tracks: playlist.totalTracks || playlist.tracks?.length || 0,
      duration: playlist.duration || 0,
      is_public: playlist.isPublic !== false,
      is_collaborative: playlist.isCollaborative === true,
      followers: playlist.followers || 0,
      created_at: playlist.createdAt || new Date().toISOString(),
      updated_at: new Date().toISOString(),
      gradient_css: playlist.gradientCss || '',
      tags: playlist.tags || []
    };

    const saved = await dbSupabase.savePlaylist(dbPayload);

    return NextResponse.json({ success: true, playlist: saved });
  } catch (error: any) {
    console.error('Save playlist API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save playlist' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const isCloud = process.env.DATABASE_MODE === 'supabase';
    if (!isCloud) {
      return NextResponse.json({ success: true });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
    }

    await dbSupabase.deletePlaylist(id);

    return NextResponse.json({ success: true, message: 'Playlist deleted successfully' });
  } catch (error: any) {
    console.error('Delete playlist API error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete playlist' }, { status: 500 });
  }
}
