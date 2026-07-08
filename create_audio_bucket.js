// Run this script once to create the Supabase Storage bucket for audio files
// Usage: node create_audio_bucket.js

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read .env manually (no dotenv dependency needed)
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return {};
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  const env = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    env[key] = val;
  }
  return env;
}

const env = loadEnv();
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false }
});

async function main() {
  console.log('Creating audio-uploads storage bucket in Supabase...');

  // Create the bucket
  const { data, error } = await supabase.storage.createBucket('audio-uploads', {
    public: true,           // Anyone can stream audio (public URLs work)
    fileSizeLimit: 52428800, // 50MB per file
    allowedMimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
  });

  if (error) {
    if (error.message && error.message.toLowerCase().includes('already exists')) {
      console.log('✅ Bucket "audio-uploads" already exists — updating to public...');
      // Try to update it to public
      const { error: updateErr } = await supabase.storage.updateBucket('audio-uploads', { public: true });
      if (updateErr) {
        console.error('Failed to update bucket:', updateErr.message);
      } else {
        console.log('✅ Bucket updated to public successfully!');
      }
    } else {
      console.error('❌ Failed to create bucket:', error.message);
      process.exit(1);
    }
  } else {
    console.log('✅ Bucket "audio-uploads" created successfully!', data);
  }

  // Verify bucket exists
  const { data: buckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error('Could not list buckets:', listErr.message);
  } else {
    const audioBucket = buckets.find(b => b.id === 'audio-uploads');
    if (audioBucket) {
      console.log('\n✅ Bucket confirmed:', audioBucket);
      console.log('\n🎵 Audio files extracted from Spotify on localhost will now be automatically');
      console.log('   uploaded to Supabase Storage and will be available on your Vercel site too!');
    } else {
      console.log('⚠️  Bucket not found in list. You may need to create it manually in the Supabase Dashboard.');
    }
  }
}

main().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});
