const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'admin', 'tabs', 'HomepageBuilderTab.tsx');
if (!fs.existsSync(filePath)) {
  console.log('File does not exist:', filePath);
  process.exit(1);
}

const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('grid_deals')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
