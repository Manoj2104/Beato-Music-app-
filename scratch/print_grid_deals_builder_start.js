const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'components', 'admin', 'tabs', 'HomepageBuilderTab.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 1963; i <= 2025; i++) {
  if (lines[i-1] !== undefined) {
    console.log(`${i}: ${lines[i-1]}`);
  }
}
