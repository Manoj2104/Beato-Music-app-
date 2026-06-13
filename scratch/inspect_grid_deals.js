const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'data', 'beato_db.json');
const db = JSON.parse(fs.readFileSync(dbPath, 'utf8'));

const gridSectionId = db.homeLayoutOrder.find(id => id.includes('campaign_deals_grid'));
console.log('Grid Section ID:', gridSectionId);
if (gridSectionId) {
  console.log('Section config:', JSON.stringify(db.customSections[gridSectionId], null, 2));
} else {
  console.log('Campaign Grid section not found in homeLayoutOrder.');
}
