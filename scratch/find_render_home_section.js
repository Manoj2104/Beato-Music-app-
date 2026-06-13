const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, '..', 'src', 'app', '(dashboard)', 'home', 'page.tsx');
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

lines.forEach((line, index) => {
  if (line.includes('function renderHomeSection') || line.includes('const renderHomeSection')) {
    console.log(`${index + 1}: ${line.trim()}`);
  }
});
