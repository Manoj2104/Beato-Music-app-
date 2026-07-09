const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const https = require('https');

// Load .env
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

const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
const PROJECT_REF = SUPABASE_URL.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

// Execute SQL via Supabase Management API
async function executeSql(sql) {
  return new Promise((resolve, reject) => {
    const body = JSON.stringify({ query: sql });
    const options = {
      hostname: 'api.supabase.com',
      path: `/v1/projects/${PROJECT_REF}/database/query`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SERVICE_KEY}`,
        'Content-Length': Buffer.byteLength(body)
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch { resolve({ status: res.statusCode, body: data }); }
      });
    });
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

async function main() {
  console.log('Project ref:', PROJECT_REF);

  // Create app_settings table
  console.log('\n1. Creating app_settings table...');
  const createResult = await executeSql(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value JSONB NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
    ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;
    CREATE POLICY IF NOT EXISTS "Service role full access" ON app_settings FOR ALL TO service_role USING (true);
  `);
  console.log('Create table result:', createResult.status, JSON.stringify(createResult.body).slice(0, 200));

  // Now insert the homepage layout
  const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const db = JSON.parse(fs.readFileSync('data/beato_db.json', 'utf8'));
  const layout = {
    homeLayoutOrder: db.homeLayoutOrder || [],
    customSections: db.customSections || {},
    activePreset: db.activePreset || null,
    activeTheme: db.activeTheme || null,
  };
  console.log(`\n2. Uploading ${layout.homeLayoutOrder.length} homepage sections...`);

  const { data, error } = await supabase
    .from('app_settings')
    .upsert({ key: 'homepage_layout', value: layout, updated_at: new Date().toISOString() })
    .select();

  if (error) {
    console.error('❌ Upsert failed:', error.message);
    return;
  }
  console.log('✅ Homepage layout saved to Supabase!');
}

main();
