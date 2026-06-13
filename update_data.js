
const fs = require('fs');
const file = 'src/lib/mockData.ts';
let content = fs.readFileSync(file, 'utf8');

// Add artist
const newArtist = '{' +
    '\n    id: \'artist-manoj\',' +
    '\n    name: \'Manoj S\',' +
    '\n    image: \'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=400&h=400&fit=crop\',' +
    '\n    coverImage: \'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=1400&h=400&fit=crop\',' +
    '\n    bio: \'Manoj S is a prolific artist creating dynamic sample tracks.\',' +
    '\n    followers: 1000000,' +
    '\n    monthlyListeners: 5000000,' +
    '\n    verified: true,' +
    '\n    genres: [\'Pop\', \'Electronic\', \'Rock\']' +
  '\n  },';

content = content.replace('export const mockArtists: Artist[] = [', 'export const mockArtists: Artist[] = [\n' + newArtist);

fs.writeFileSync(file, content);
console.log('Updated mockData.ts');

