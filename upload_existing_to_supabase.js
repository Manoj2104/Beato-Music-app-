const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// 1. Load Environment Variables manually from .env
const envPath = path.join(__dirname, '.env');
if (!fs.existsSync(envPath)) {
  console.error('Error: .env file not found.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    const key = match[1];
    let value = match[2] || '';
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.substring(1, value.length - 1);
    } else if (value.startsWith("'") && value.endsWith("'")) {
      value = value.substring(1, value.length - 1);
    }
    env[key] = value.trim();
  }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY || env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
});

const DB_FILE = path.join(__dirname, 'data', 'beato_db.json');
if (!fs.existsSync(DB_FILE)) {
  console.error('Error: data/beato_db.json file not found.');
  process.exit(1);
}

async function run() {
  const dbData = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  const tracks = dbData.tracks || [];
  
  console.log(`Found ${tracks.length} tracks in local database.`);
  
  let uploadCount = 0;
  for (let i = 0; i < tracks.length; i++) {
    const track = tracks[i];
    
    // Check if the track has a local file path
    if (track.audioUrl && track.audioUrl.startsWith('/uploads/')) {
      console.log(`\n[${i+1}/${tracks.length}] Found local track: "${track.title}" (${track.id})`);
      console.log(`Current audioUrl: ${track.audioUrl}`);
      
      const localFilePath = path.join(__dirname, 'public', track.audioUrl);
      if (!fs.existsSync(localFilePath)) {
        console.warn(`Warning: Local file not found at ${localFilePath}`);
        continue;
      }
      
      const filename = path.basename(localFilePath);
      console.log(`Uploading file ${filename} to Supabase Storage bucket "audio"...`);
      
      try {
        const fileBuffer = fs.readFileSync(localFilePath);
        const contentType = filename.endsWith('.mp3') ? 'audio/mpeg' : 'audio/x-m4a';
        
        const { error: uploadError } = await supabase.storage
          .from('audio')
          .upload(filename, fileBuffer, {
            contentType,
            cacheControl: '3600',
            upsert: true
          });
          
        if (uploadError) throw uploadError;
        
        const { data: publicUrlData } = supabase.storage
          .from('audio')
          .getPublicUrl(filename);
          
        const publicUrl = publicUrlData.publicUrl;
        console.log(`Uploaded! Public URL: ${publicUrl}`);
        
        // Update Supabase Database
        console.log(`Updating track in Supabase 'tracks' table...`);
        const { error: dbError } = await supabase
          .from('tracks')
          .update({ audio_url: publicUrl })
          .eq('id', track.id);
          
        if (dbError) {
          console.error(`Error updating Supabase database:`, dbError);
        } else {
          console.log(`Database updated successfully!`);
        }
        
        // Update local database cache
        track.audioUrl = publicUrl;
        uploadCount++;
        
      } catch (err) {
        console.error(`Failed to process track "${track.title}":`, err.message);
      }
    }
  }
  
  if (uploadCount > 0) {
    console.log(`\nWriting updated track URLs back to local database...`);
    fs.writeFileSync(DB_FILE, JSON.stringify(dbData, null, 2), 'utf8');
    console.log(`Local database updated successfully!`);
  }
  
  console.log(`\nDone! Processed and uploaded ${uploadCount} tracks.`);
}

run().catch(console.error);
