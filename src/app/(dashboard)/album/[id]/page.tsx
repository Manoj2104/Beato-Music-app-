import fs from 'fs';
import path from 'path';
import AlbumClient from './AlbumClient';

export async function generateStaticParams() {
  const ids = new Set<string>();
  
  // Add mock IDs
  for (let i = 1; i <= 20; i++) {
    ids.add(`album-${i}`);
  }
  ids.add('album-manoj');
  
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
          // Extract from tracks
          if (data.tracks && Array.isArray(data.tracks)) {
            for (const t of data.tracks) {
              if (t.albumId) ids.add(t.albumId);
            }
          }
          // Extract from albums
          if (data.albums && Array.isArray(data.albums)) {
            for (const a of data.albums) {
              if (a.id) ids.add(a.id);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Error reading DB for album generateStaticParams:', e);
  }

  return Array.from(ids).map(id => ({ id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <AlbumClient params={params} />;
}
