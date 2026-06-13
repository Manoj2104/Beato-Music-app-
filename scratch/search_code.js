const fs = require('fs');
const path = require('path');

function searchFile(filePath, query) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    if (content.includes(query)) {
      console.log(`Match in: ${filePath}`);
      // Print lines around the match
      const lines = content.split('\n');
      lines.forEach((line, index) => {
        if (line.includes(query)) {
          console.log(`  L${index + 1}: ${line.trim()}`);
        }
      });
    }
  } catch (e) {
    // Ignore read errors
  }
}

function walkDir(dir, query) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      if (file !== 'node_modules' && file !== '.next' && file !== '.git') {
        walkDir(fullPath, query);
      }
    } else {
      searchFile(fullPath, query);
    }
  }
}

const query = process.argv[2] || 'approve-artist';
const startPath = path.join(__dirname, '..', 'src');
console.log(`Searching for "${query}" starting from ${startPath}...`);
walkDir(startPath, query);
console.log('Search complete.');
