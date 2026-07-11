import { NextRequest, NextResponse } from 'next/server';
import { requireUser } from '@/lib/rbac';
import { db } from '@/lib/db';
import { supabase } from '@/lib/dbSupabase';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  const rbacCheck = await requireUser(request);
  if (!rbacCheck.authorized) {
    return NextResponse.json(
      { error: rbacCheck.message || 'Forbidden' },
      { status: rbacCheck.status || 403 }
    );
  }

  try {
    const formData = await request.formData();
    const songId = formData.get('songId') as string;
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const coverFile = formData.get('cover') as File | null;
    const coverUrlFromForm = formData.get('coverUrl') as string | null;
    const audioFile = formData.get('audio') as File | null;

    if (!songId) {
      return NextResponse.json({ error: 'songId is required' }, { status: 400 });
    }

    // Fetch current track
    const allTracks = await db.getTracksFromSupabase();
    const track = allTracks.find((t) => t.id === songId);
    if (!track) {
      return NextResponse.json({ error: 'Track/Channel not found' }, { status: 404 });
    }

    // Verify ownership
    const user = rbacCheck.user;
    if (!user) {
      return NextResponse.json({ error: 'User session not found' }, { status: 401 });
    }
    if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN') {
      if (track.artistId !== user.userId && track.uploadedBy !== user.name) {
        return NextResponse.json({ error: 'Unauthorized to edit this item' }, { status: 403 });
      }
    }

    // Build updated track object
    const updatedTrack = { ...track };
    if (title !== null && title.trim() !== '') {
      updatedTrack.title = title.trim();
    }
    if (description !== null) {
      updatedTrack.albumName = description;
      updatedTrack.lyrics = description;
    }

    // Handle cover image upload
    let newCoverUrl = '';
    if (coverFile && coverFile.size > 0) {
      const coverBytes = await coverFile.arrayBuffer();
      let uploadedToCloud = false;

      if (process.env.DATABASE_MODE === 'supabase') {
        try {
          const coverFilename = `${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
          const { error } = await supabase.storage
            .from('covers')
            .upload(coverFilename, coverBytes, {
              contentType: coverFile.type,
              cacheControl: '3600',
              upsert: false,
            });
          if (error) throw error;
          const { data: publicUrlData } = supabase.storage
            .from('covers')
            .getPublicUrl(coverFilename);
          newCoverUrl = publicUrlData.publicUrl;
          uploadedToCloud = true;
        } catch (e) {
          console.warn('[podcast/edit] Supabase storage failed, falling back to local:', e);
        }
      }

      if (!uploadedToCloud) {
        const coverBuffer = Buffer.from(coverBytes);
        const coverUploadDir = path.join(process.cwd(), 'public', 'uploads', 'covers');
        if (!fs.existsSync(coverUploadDir)) {
          fs.mkdirSync(coverUploadDir, { recursive: true });
        }
        const coverFilename = `${Date.now()}-${coverFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
        fs.writeFileSync(path.join(coverUploadDir, coverFilename), coverBuffer);
        newCoverUrl = `/uploads/covers/${coverFilename}`;
      }
    } else if (coverUrlFromForm) {
      newCoverUrl = coverUrlFromForm;
    }

    if (newCoverUrl) {
      updatedTrack.coverImage = newCoverUrl;
    }

    // Handle audio file upload
    let newAudioUrl = '';
    if (audioFile && audioFile.size > 0) {
      const audioBytes = await audioFile.arrayBuffer();
      let uploadedToCloud = false;

      if (process.env.DATABASE_MODE === 'supabase') {
        try {
          const audioFilename = `${Date.now()}-${audioFile.name.replace(/[^a-zA-Z0-9.]/g, '_')}`;
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
          newAudioUrl = publicUrlData.publicUrl;
          uploadedToCloud = true;
        } catch (e) {
          console.warn('[podcast/edit] Failed to upload audio to Supabase Storage, falling back to local:', e);
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
        fs.writeFileSync(path.join(audioUploadDir, audioFilename), audioBuffer);
        newAudioUrl = `/uploads/audio/${audioFilename}`;
      }
    }

    if (newAudioUrl) {
      updatedTrack.audioUrl = newAudioUrl;
    }

    // Persist: delete old entry and re-add updated (same pattern as admin/content route)
    db.deleteTrack(songId);
    db.addTrack(updatedTrack);

    // Also patch Supabase fields directly (addTrack syncs other fields)
    if (process.env.DATABASE_MODE === 'supabase') {
      const updates: Record<string, any> = {};
      if (newCoverUrl) updates.cover_image = newCoverUrl;
      if (newAudioUrl) updates.audio_url = newAudioUrl;

      if (Object.keys(updates).length > 0) {
        supabase
          .from('tracks')
          .update(updates)
          .eq('id', songId)
          .then(({ error }) => {
            if (error) console.error('[podcast/edit] Supabase fields patch error:', error);
          });
      }
    }

    return NextResponse.json({ success: true, coverUrl: updatedTrack.coverImage, audioUrl: updatedTrack.audioUrl });
  } catch (err: any) {
    console.error('[podcast/edit] Error:', err);
    return NextResponse.json(
      { error: 'Failed to update channel profile', details: err.message },
      { status: 500 }
    );
  }
}
