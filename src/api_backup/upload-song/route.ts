import { NextRequest, NextResponse } from 'next/server';
import { requireArtist } from '@/lib/rbac';
import { logSecurityEvent } from '@/lib/audit';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { verifyJWT } from '@/lib/jwt';
import { supabase } from '@/lib/dbSupabase';

export async function POST(request: NextRequest) {
  // Guard the endpoint: require ARTIST (or higher role)
  const rbacCheck = await requireArtist(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Forbidden' },
      { status: rbacCheck.status || 403 }
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File;
    const coverFile = formData.get('cover') as File | null;
    const title = formData.get('title') as string;
    const artistName = formData.get('artistName') as string;
    const artistId = formData.get('artistId') as string;
    const albumName = formData.get('albumName') as string;
    const genre = formData.get('genre') as string;
    const language = formData.get('language') as string;
    const explicitStr = formData.get('explicit') as string;
    const lyrics = formData.get('lyrics') as string;

    if (!audioFile || !title || !genre) {
      return NextResponse.json(
        { error: 'Invalid payload: audio, title and genre are required.' },
        { status: 400 }
      );
    }

    const artistUser = rbacCheck.user;
    if (!artistUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyJWT(artistUser.token);
    if (!payload) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let audioUrl = '';
    const audioBytes = await audioFile.arrayBuffer();
    
    if (process.env.DATABASE_MODE === 'supabase') {
      try {
        const audioFilename = `${Date.now()}-${audioFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        const { error } = await supabase.storage
          .from('audio')
          .upload(audioFilename, audioBytes, {
            contentType: audioFile.type,
            cacheControl: '3600',
            upsert: false
          });
        if (error) throw error;
        
        const { data: publicUrlData } = supabase.storage
          .from('audio')
          .getPublicUrl(audioFilename);
        audioUrl = publicUrlData.publicUrl;
      } catch (e) {
        console.error('Failed to upload audio to Supabase Storage:', e);
        return NextResponse.json({ error: 'Failed to upload audio to cloud storage' }, { status: 500 });
      }
    } else {
      // Save audio file to public/uploads/audio (local fallback)
      const audioBuffer = Buffer.from(audioBytes);
      const publicDir = path.join(process.cwd(), 'public');
      const audioUploadDir = path.join(publicDir, 'uploads', 'audio');
      if (!fs.existsSync(audioUploadDir)) {
        fs.mkdirSync(audioUploadDir, { recursive: true });
      }
      const audioFilename = `${Date.now()}-${audioFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
      const audioFilepath = path.join(audioUploadDir, audioFilename);
      fs.writeFileSync(audioFilepath, audioBuffer);
      audioUrl = `/uploads/audio/${audioFilename}`;
    }

    const coverUrlFromForm = formData.get('coverUrl') as string | null;

    // Save cover file if exists
    let coverUrl = '';
    if (coverFile) {
      if (process.env.DATABASE_MODE === 'supabase') {
        try {
          const coverBytes = await coverFile.arrayBuffer();
          const coverFilename = `${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const { error } = await supabase.storage
            .from('covers')
            .upload(coverFilename, coverBytes, {
              contentType: coverFile.type,
              cacheControl: '3600',
              upsert: false
            });
          if (error) throw error;
          
          const { data: publicUrlData } = supabase.storage
            .from('covers')
            .getPublicUrl(coverFilename);
          coverUrl = publicUrlData.publicUrl;
        } catch (e) {
          console.error('Failed to upload cover to Supabase Storage:', e);
        }
      } else {
        // Save cover file (local fallback)
        try {
          const coverBytes = await coverFile.arrayBuffer();
          const coverBuffer = Buffer.from(coverBytes);
          const publicDir = path.join(process.cwd(), 'public');
          const coverUploadDir = path.join(publicDir, 'uploads', 'covers');
          if (!fs.existsSync(coverUploadDir)) {
            fs.mkdirSync(coverUploadDir, { recursive: true });
          }
          const coverFilename = `${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const coverFilepath = path.join(coverUploadDir, coverFilename);
          fs.writeFileSync(coverFilepath, coverBuffer);
          coverUrl = `/uploads/covers/${coverFilename}`;
        } catch (e) {
          console.error('Failed to save cover file:', e);
        }
      }
    } else if (coverUrlFromForm) {
      coverUrl = coverUrlFromForm;
    }

    // Save to server-side database
    const newTrack = {
      id: `track-uploaded-${Date.now()}`,
      title,
      artistId: artistId || payload.userId || 'artist-1',
      artistName: artistName || payload.name || 'Unknown Artist',
      albumId: 'album-uploads',
      albumName: albumName || 'Singles',
      coverImage: coverUrl,
      duration: Math.floor(180 + Math.random() * 120),
      audioUrl,
      genre,
      year: new Date().getFullYear(),
      plays: 0,
      liked: false,
      explicit: explicitStr === 'true',
      trackNumber: 1,
      lyrics: lyrics || '',
      uploadedBy: payload.name || 'Artist',
      uploadedAt: new Date().toISOString(),
      status: 'pending' as const,
    };

    const savedTrack = db.addTrack(newTrack);

    logSecurityEvent(
      artistUser.token,
      newTrack.artistName,
      'UPLOAD',
      `Uploaded new song "${newTrack.title}" (Genre: ${newTrack.genre}, ID: ${newTrack.id})`
    );

    return NextResponse.json({
      success: true,
      message: `Track "${newTrack.title}" successfully registered in database.`,
      track: savedTrack,
    });
  } catch (err: any) {
    console.error('Upload API error:', err);
    return NextResponse.json(
      { error: 'Server error parsing files or writing DB' },
      { status: 500 }
    );
  }
}
