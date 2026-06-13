const fs = require('fs');
const path = require('path');

function searchFonts(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next') {
        searchFonts(filePath);
      }
    } else if (filePath.endsWith('.css') || filePath.endsWith('.tsx') || filePath.endsWith('.ts')) {
      const content = fs.readFileSync(filePath, 'utf8');
      if (content.includes('fontFamily') || content.includes('font-family')) {
        const matches = content.match(/(fontFamily|font-family)\s*[:=]\s*['"`][^'"`]+['"`]/g);
        if (matches) {
          console.log(`File: ${filePath}`);
          matches.forEach(m => console.log(`  ${m}`));
        }
      }
    }
  }
}

searchFonts(path.join(__dirname, '..', 'src'));
