const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', '(dashboard)', 'home', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

for (let i = 2380; i <= 2455; i++) {
  if (lines[i-1] !== undefined) {
    console.log(`${i}: ${lines[i-1]}`);
  }
}
