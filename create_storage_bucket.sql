-- Run this in your Supabase SQL Editor (Dashboard > SQL Editor)
-- This creates the public audio-uploads bucket for storing extracted MP3 files

-- 1. Create the bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'audio-uploads',
  'audio-uploads',
  true,   -- public: anyone can read (stream audio)
  52428800, -- 50MB max file size
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a', 'audio/flac']
)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Allow public read (GET) for everyone (anonymous access for streaming)
CREATE POLICY IF NOT EXISTS "Public audio read" ON storage.objects
  FOR SELECT USING (bucket_id = 'audio-uploads');

-- 3. Allow service role to upload (INSERT/UPDATE/DELETE) - used by the backend
CREATE POLICY IF NOT EXISTS "Service role upload audio" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'audio-uploads');

CREATE POLICY IF NOT EXISTS "Service role update audio" ON storage.objects
  FOR UPDATE USING (bucket_id = 'audio-uploads');

CREATE POLICY IF NOT EXISTS "Service role delete audio" ON storage.objects
  FOR DELETE USING (bucket_id = 'audio-uploads');
