const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, '../data/beato_db.json');

const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

// 1. Add Nandhini user if not exists
let nandhini = data.users.find(u => u.name.toLowerCase() === 'nandhini');
if (!nandhini) {
  nandhini = {
    id: `artist-${crypto.randomBytes(4).toString('hex')}`,
    name: 'Nandhini',
    email: 'nandhini@beato.io',
    passwordHash: bcrypt.hashSync('password', 10),
    role: 'ARTIST',
    isActive: true,
    createdAt: new Date().toISOString(),
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&h=300&fit=crop',
    country: 'IN',
    followers: 10200,
    following: 10,
    likedSongs: [],
    savedAlbums: [],
    followedArtists: [],
    playlists: []
  };
  data.users.push(nandhini);
  console.log(`Added artist Nandhini with ID: ${nandhini.id}`);
} else {
  console.log(`Found existing artist Nandhini with ID: ${nandhini.id}`);
}

const prefixes = ["En", "Un", "Oru", "Kadhal", "Kanave", "Katre", "Uyire", "Nenjil", "Poove", "Sillendru", "Mazhaiye", "Thuli", "Vennilave", "Thendral", "Kannan", "Vaa", "Netru", "Azhage", "Kannil", "Vaanam", "Iravil", "Pagalil"];
const suffixes = ["Anbe", "Roja", "Ennai", "Muthal", "Oviyam", "Nila", "Kaatru", "Symphony", "Raagam", "Thaalam", "Pallavi", "Geetham", "Nenjam", "Kavithai", "Sangeetham", "Azhagi", "Ulagam", "Vasantham", "Kuyile", "Ponne", "Devathai", "Kanne"];

const covers = [
  'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1483058712412-4245e9b90334?w=300&h=300&fit=crop',
  'https://images.unsplash.com/photo-1520166012956-add9ba0ee3f4?w=300&h=300&fit=crop',
];

const audioUrls = [
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3'
];

let addedCount = 0;

for (let i = 0; i < 110; i++) {
  const p = prefixes[Math.floor(Math.random() * prefixes.length)];
  const s = suffixes[Math.floor(Math.random() * suffixes.length)];
  const title = `${p} ${s}`;
  
  const cover = covers[Math.floor(Math.random() * covers.length)];
  const audio = audioUrls[Math.floor(Math.random() * audioUrls.length)];
  
  const track = {
    id: `track-nandhini-${crypto.randomBytes(4).toString('hex')}`,
    title: title,
    artist: "Nandhini",
    artistId: nandhini.id,
    albumId: `album-nandhini-${Math.floor(Math.random() * 10)}`, // group roughly into 10 albums
    album: `Tamil Hits Vol ${Math.floor(Math.random() * 10) + 1}`,
    duration: `${Math.floor(Math.random() * 3) + 2}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
    plays: 0,
    coverUrl: cover,
    audioUrl: audio,
    genre: "Tamil",
    explicit: false,
    year: 2026,
    uploadedBy: nandhini.id,
    uploadedAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString(),
    status: 'pending',
    featured: false
  };
  
  data.tracks.push(track);
  addedCount++;
}

fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
console.log(`Successfully added ${addedCount} pending tracks for Nandhini.`);
