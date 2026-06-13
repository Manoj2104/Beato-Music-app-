const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'beato_db.json');
if (!fs.existsSync(dbPath)) {
  console.log('Database file does not exist at:', dbPath);
  process.exit(1);
}

const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

console.log('Top level keys:', Object.keys(db));
console.log('activePreset:', db.activePreset);
console.log('activeTheme:', db.activeTheme);
console.log('homeLayoutOrder:', db.homeLayoutOrder);

if (db.users) {
  console.log('\nUsers list (first 10):');
  const users = db.users.slice(0, 10);
  users.forEach(u => {
    console.log(`- ID: ${u.id}, Name: ${u.name}, Email: ${u.email}, Role: ${u.role}`);
  });
} else {
  console.log('\nNo users array found in DB');
}
