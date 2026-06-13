const fs = require('fs');
const path = require('path');

const files = [
  'src/app/(dashboard)/home/page.tsx',
  'src/components/admin/tabs/HomepageBuilderTab.tsx',
  'src/components/admin/tabs/MobileHomepageBuilderTab.tsx'
];

files.forEach(file => {
  const absolutePath = path.resolve(__dirname, '..', file);
  if (!fs.existsSync(absolutePath)) {
    console.log(`File not found: ${file}`);
    return;
  }
  const content = fs.readFileSync(absolutePath, 'utf8');
  const lines = content.split('\n');
  console.log(`\n=== Matches in ${file} ===`);
  lines.forEach((line, index) => {
    if (line.includes('isCircle')) {
      console.log(`${index + 1}: ${line.trim()}`);
    }
  });
});
