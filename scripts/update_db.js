const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '../data/beato_db.json');

try {
  const fileContent = fs.readFileSync(dbPath, 'utf8');
  const data = JSON.parse(fileContent);
  
  let matchCount = 0;
  
  function updateObj(obj) {
    if (!obj || typeof obj !== 'object') return;
    
    if (Array.isArray(obj)) {
      obj.forEach(item => updateObj(item));
    } else {
      if (obj.id === 'ad-1783070165828') {
        obj.imageUrl = 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?w=400&auto=format&fit=crop&q=80';
        obj.headline = 'Upgrade to Beato Premium 💎';
        obj.bodyText = 'Get 50% off standard billing using code WELCOMEBACK50.';
        matchCount++;
      }
      for (const key in obj) {
        updateObj(obj[key]);
      }
    }
  }

  updateObj(data);

  if (matchCount > 0) {
    fs.writeFileSync(dbPath, JSON.stringify(data, null, 2), 'utf8');
    console.log(`Successfully found and updated ${matchCount} instances of ad-1783070165828 in the database!`);
  } else {
    console.log('No instances found!');
  }
} catch (error) {
  console.error('Error updating database:', error);
}
