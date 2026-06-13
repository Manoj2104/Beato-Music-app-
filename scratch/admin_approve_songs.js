const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'beato_db.json');
const MANOJ_ARTIST_ID = 'user-1781170074483';

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));

// Find all pending tracks by Manoj
const pendingTracks = db.tracks.filter(t => t.uploadedBy === MANOJ_ARTIST_ID && t.status === 'pending');
console.log(`Found ${pendingTracks.length} pending tracks by Manoj.`);

// Admin approves all of them
let approvedCount = 0;
db.tracks = db.tracks.map(track => {
  if (track.uploadedBy === MANOJ_ARTIST_ID && track.status === 'pending') {
    approvedCount++;
    return { ...track, status: 'approved', featured: false };
  }
  return track;
});

fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
console.log(`✅ Admin approved ${approvedCount} Tamil songs!`);
console.log(`🎵 All songs will now appear in the home page music library.`);
