import fs from 'fs';
import path from 'path';
import PlaylistClient from './PlaylistClient';

export async function generateStaticParams() {
  const ids = new Set<string>();
  
  // Add mock IDs
  for (let i = 1; i <= 20; i++) {
    ids.add(`playlist-${i}`);
  }
  ids.add('liked');
  
  // Try to read from databases
  try {
    const dbPaths = [
      path.join(process.cwd(), 'data', 'beato_db.json'),
      path.join(process.cwd(), 'data', 'soundsphere_db.json')
    ];
    for (const dbPath of dbPaths) {
      if (fs.existsSync(dbPath)) {
        const fileContent = fs.readFileSync(dbPath, 'utf8');
        if (fileContent.trim()) {
          const data = JSON.parse(fileContent);
          // Extract from playlists
          if (data.playlists && Array.isArray(data.playlists)) {
            for (const p of data.playlists) {
              if (p.id) ids.add(p.id);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Error reading DB for playlist generateStaticParams:', e);
  }

  return Array.from(ids).map(id => ({ id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <PlaylistClient params={params} />;
}
