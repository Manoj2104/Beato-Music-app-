const fs = require('fs');
const path = require('path');

function walk(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    file = path.join(dir, file);
    const stat = fs.statSync(file);
    if (stat && stat.isDirectory()) {
      if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git')) {
        results = results.concat(walk(file));
      }
    } else {
      if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx') || file.endsWith('.css')) {
        results.push(file);
      }
    }
  });
  return results;
}

const files = walk('.');
console.log(`Found ${files.length} files to search.`);

const pattern1 = /replace\(/i;
const pattern2 = /recommenaea/i;
const pattern3 = /Hecommenaea/i;

files.forEach(file => {
  try {
    const content = fs.readFileSync(file, 'utf8');
    if (content.includes('Hecommenaea') || content.includes('Heleases') || content.includes('recommenaations')) {
      console.log(`MATCH found in ${file}:`);
      const lines = content.split('\n');
      lines.forEach((line, idx) => {
        if (line.includes('Hecommenaea') || line.includes('Heleases') || line.includes('recommenaations') || line.includes('powerea')) {
          console.log(`  Line ${idx+1}: ${line.trim()}`);
        }
      });
    }
  } catch (err) {
    // ignore
  }
});
