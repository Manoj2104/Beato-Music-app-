
const fs = require('fs');
const file = 'src/lib/mockData.ts';
let content = fs.readFileSync(file, 'utf8');

const newTracks = Array.from({ length: 25 }, (_, i) => '{' +
    '\n    id: \'track-manoj-' + (i + 1) + '\',' +
    '\n    title: \'Manoj Sample ' + (i + 1) + '\',' +
    '\n    artistId: \'artist-manoj\',' +
    '\n    artistName: \'Manoj S\',' +
    '\n    albumId: \'album-manoj\',' +
    '\n    albumName: \'Manoj Hits\',' +
    '\n    coverImage: \'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=300&h=300&fit=crop\',' +
    '\n    duration: ' + (200 + Math.floor(Math.random() * 60)) + ',' +
    '\n    audioUrl: \'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3\'' +
  '\n  }').join(',\n');

content = content.replace('export const mockTracks: Track[] = [', 'export const mockTracks: Track[] = [\n' + newTracks + ',');
fs.writeFileSync(file, content);
console.log('Added 25 tracks to mockData.ts');

