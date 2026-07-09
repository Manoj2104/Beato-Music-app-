const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '.env'), 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?$/);
  if (match) {
    let val = (match[2] || '').trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) val = val.slice(1, -1);
    env[match[1]] = val;
  }
});

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

async function main() {
  // 1. Check how many tracks exist
  const { data: tracks, error } = await supabase.from('tracks').select('id, title, status, audio_url').limit(10);
  if (error) { console.error('❌ Error fetching tracks:', error); return; }
  console.log(`\n✅ Total tracks fetched (limit 10): ${tracks.length}`);
  tracks.forEach(t => console.log(`  - [${t.status}] ${t.title} | audio: ${t.audio_url?.substring(0, 60)}...`));

  // 2. Count by status
  const { data: all } = await supabase.from('tracks').select('status');
  const counts = {};
  (all || []).forEach(t => { counts[t.status] = (counts[t.status] || 0) + 1; });
  console.log('\n📊 Status counts:', counts);

  // 3. Check users/artists
  const { data: users } = await supabase.from('users').select('id, name, role, is_active').limit(5);
  console.log(`\n👤 Users (limit 5):`);
  (users || []).forEach(u => console.log(`  - [${u.role}] ${u.name} | active: ${u.is_active}`));
}
main();
