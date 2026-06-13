
const fs = require('fs');
const file = 'src/lib/mockData.ts';
let content = fs.readFileSync(file, 'utf8');

// Replace duration line with duration and plays for Manoj tracks
content = content.replace(/albumName: 'Manoj Hits',\n    coverImage: 'https:\/\/images\.unsplash\.com\/photo-1614613535308-eb5fbd3d2c6b\?w=300&h=300&fit=crop',\n    duration: (\d+),/g, 'albumName: \'Manoj Hits\',\n    coverImage: \'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c6b?w=300&h=300&fit=crop\',\n    duration: ,\n    plays: 5000000,');

fs.writeFileSync(file, content);
console.log('Updated plays');

