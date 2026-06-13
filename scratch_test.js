const fs = require('fs');
const path = require('path');

function searchFiles(dir, word) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        searchFiles(filePath, word);
      }
    } else if (filePath.endsWith('.css')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes(word)) {
        console.log(`Found "${word}" in CSS file:`, filePath);
        // print matching lines
        const lines = content.split('\n');
        lines.forEach((l, idx) => {
          if (l.includes(word)) {
            console.log(`  ${idx+1}: ${l.trim()}`);
          }
        });
      }
    }
  }
}

searchFiles('C:/Users/manoj/.gemini/antigravity/scratch/beato', 'app-layout');
searchFiles('C:/Users/manoj/.gemini/antigravity/scratch/beato', 'app-player');
