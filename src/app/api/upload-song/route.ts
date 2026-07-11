import { NextRequest, NextResponse } from 'next/server';
import { requireArtist, requireUser } from '@/lib/rbac';
import { logSecurityEvent } from '@/lib/audit';
import { db } from '@/lib/db';
import fs from 'fs';
import path from 'path';
import { verifyJWT } from '@/lib/jwt';
import { supabase } from '@/lib/dbSupabase';

export async function POST(request: NextRequest) {
  // Allow all authenticated users (USER role and above) to upload podcast channels/episodes
  const rbacCheck = await requireUser(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Forbidden' },
      { status: rbacCheck.status || 403 }
    );
  }

  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const coverFile = formData.get('cover') as File | null;
    const title = formData.get('title') as string;
    const artistName = formData.get('artistName') as string;
    const artistId = formData.get('artistId') as string;
    const albumName = formData.get('albumName') as string;
    const albumId = formData.get('albumId') as string;
    const genre = formData.get('genre') as string;
    const language = formData.get('language') as string;
    const explicitStr = formData.get('explicit') as string;
    const lyrics = formData.get('lyrics') as string;

    const isChannel = genre?.startsWith('PodcastChannel');
    if ((!isChannel && !audioFile) || !title || !genre) {
      return NextResponse.json(
        { error: 'Invalid payload: title, genre, and audio (for episodes) are required.' },
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
    if (audioFile) {
      const audioBytes = await audioFile.arrayBuffer();
      let uploadedToCloud = false;

      if (process.env.DATABASE_MODE === 'supabase') {
        try {
          const audioFilename = `${Date.now()}-${audioFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          // Try 'audio-uploads' bucket first, fallback to 'audio'
          let bucketName = 'audio-uploads';
          let uploadResult = await supabase.storage
            .from(bucketName)
            .upload(audioFilename, audioBytes, {
              contentType: audioFile.type,
              cacheControl: '3600',
              upsert: false
            });
          
          if (uploadResult.error) {
            bucketName = 'audio';
            uploadResult = await supabase.storage
              .from(bucketName)
              .upload(audioFilename, audioBytes, {
                contentType: audioFile.type,
                cacheControl: '3600',
                upsert: false
              });
          }

          if (uploadResult.error) throw uploadResult.error;
          
          const { data: publicUrlData } = supabase.storage
            .from(bucketName)
            .getPublicUrl(audioFilename);
          audioUrl = publicUrlData.publicUrl;
          uploadedToCloud = true;
        } catch (e) {
          console.warn('[upload-song] Failed to upload audio to Supabase Storage, falling back to local storage:', e);
        }
      }

      if (!uploadedToCloud) {
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
    } else {
      audioUrl = 'channel-marker';
    }

    const coverUrlFromForm = formData.get('coverUrl') as string | null;

    let coverUrl = '';
    if (coverFile) {
      let uploadedToCloud = false;
      const coverBytes = await coverFile.arrayBuffer();

      if (process.env.DATABASE_MODE === 'supabase') {
        try {
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
          uploadedToCloud = true;
        } catch (e) {
          console.warn('[upload-song] Failed to upload cover to Supabase Storage, falling back to local:', e);
        }
      }

      if (!uploadedToCloud) {
        try {
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
          console.error('[upload-song] Failed to save cover file locally:', e);
        }
      }
    } else if (coverUrlFromForm) {
      coverUrl = coverUrlFromForm;
    }

    // Save to server-side database
    const newTrack = {
      id: isChannel ? `chan-${Date.now()}` : `track-uploaded-${Date.now()}`,
      title,
      artistId: artistId || payload.userId || 'artist-1',
      artistName: artistName || payload.name || 'Unknown Artist',
      albumId: albumId || (isChannel ? `chan-${Date.now()}` : 'album-uploads'),
      albumName: albumName || 'Singles',
      coverImage: coverUrl || 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300&auto=format&fit=crop&q=80',
      duration: isChannel ? 0 : Math.floor(180 + Math.random() * 120),
      audioUrl,
      genre,
      year: new Date().getFullYear(),
      plays: 0,
      liked: false,
      explicit: explicitStr === 'true',
      trackNumber: isChannel ? 0 : 1,
      lyrics: lyrics || '',
      uploadedBy: payload.name || 'Artist',
      uploadedAt: new Date().toISOString(),
      status: 'approved' as const, // auto-approve so it shows instantly for all users!
    };

    const savedTrack = db.addTrack(newTrack);

    logSecurityEvent(
      artistUser.token,
      newTrack.artistName,
      'UPLOAD',
      `Uploaded new podcast/track "${newTrack.title}" (Genre: ${newTrack.genre}, ID: ${newTrack.id})`
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
