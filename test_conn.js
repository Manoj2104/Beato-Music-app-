const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read env
const envContent = fs.readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    env[match[1]] = (match[2] || '').replace(/['"]/g, '').trim();
  }
});

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("URL:", JSON.stringify(url));
console.log("Key Prefix:", key ? key.substring(0, 10) : "none");

const supabase = createClient(url, key);

async function test() {
  try {
    console.log("Calling fetch directly...");
    const res = await fetch(`${url}/rest/v1/tracks?select=*`, {
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`
      }
    });
    console.log("Direct Fetch Status:", res.status);
    const text = await res.text();
    console.log("Direct Fetch Response:", text.substring(0, 200));
  } catch (err) {
    console.error("Direct Fetch Error:", err);
    console.error("Direct Fetch Cause:", err.cause);
  }

  try {
    console.log("Calling via Supabase JS...");
    const { data, error } = await supabase.from('tracks').select('*').limit(1);
    if (error) throw error;
    console.log("Supabase JS Success:", data);
  } catch (err) {
    console.error("Supabase JS Error:", err);
    if (err.cause) console.error("Supabase JS Cause:", err.cause);
  }
}

test();
