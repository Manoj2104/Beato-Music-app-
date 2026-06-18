import fs from 'fs';
import path from 'path';
import ArtistClient from './ArtistClient';

export async function generateStaticParams() {
  const ids = new Set<string>();
  
  // Add mock IDs
  for (let i = 1; i <= 20; i++) {
    ids.add(`artist-${i}`);
  }
  ids.add('artist-manoj');
  
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
              if (t.artistId) ids.add(t.artistId);
            }
          }
          // Extract from artists
          if (data.artists && Array.isArray(data.artists)) {
            for (const a of data.artists) {
              if (a.id) ids.add(a.id);
            }
          }
        }
      }
    }
  } catch (e) {
    console.error('Error reading DB for artist generateStaticParams:', e);
  }

  return Array.from(ids).map(id => ({ id }));
}

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  return <ArtistClient params={params} />;
}
