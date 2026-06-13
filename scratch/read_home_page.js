const fs = require('fs');
const content = fs.readFileSync('src/app/(dashboard)/home/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('background') || line.includes('gradient') || line.includes('bg-') || line.includes('style={{') || line.includes('header') || line.includes('top-')) {
    if (line.length < 150) {
      console.log(`Line ${idx+1}: ${line.trim()}`);
    }
  }
});
