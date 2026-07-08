const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env file
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx > 0) {
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      process.env[key] = val;
    }
  }
}

const supabaseUrl = 'https://zizhqtpsamvsbymwxfyp.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDb() {
  try {
    const { data: tracks, error: tErr } = await supabase.from('tracks').select('id, title, artist_name, status');
    if (tErr) throw tErr;
    console.log('--- CURRENT TRACKS IN SUPABASE ---');
    console.log('Count:', tracks.length);
    console.log(tracks);
  } catch (err) {
    console.error('Error querying Supabase:', err);
  }
}

checkDb();
