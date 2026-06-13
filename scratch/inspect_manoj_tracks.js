const fs = require('fs');
const path = require('path');

const DB_FILE = path.join(__dirname, '..', 'data', 'beato_db.json');
const MANOJ_ARTIST_ID = 'user-1781170074483';

if (!fs.existsSync(DB_FILE)) {
  console.log('DB file does not exist');
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
const tracks = db.tracks || [];
const users = db.users || [];

const manojUser = users.find(u => u.id === MANOJ_ARTIST_ID);
if (manojUser) {
  console.log('Manoj User details:', JSON.stringify(manojUser, null, 2));
} else {
  console.log('Manoj User not found!');
}

const manojTracks = tracks.filter(t => t.uploadedBy === MANOJ_ARTIST_ID || t.artistId === MANOJ_ARTIST_ID);
console.log(`Manoj total tracks: ${manojTracks.length}`);
console.log(`Manoj approved tracks: ${manojTracks.filter(t => t.status === 'approved').length}`);
console.log(`Manoj pending tracks: ${manojTracks.filter(t => t.status === 'pending').length}`);
console.log(`Manoj rejected tracks: ${manojTracks.filter(t => t.status === 'rejected').length}`);
