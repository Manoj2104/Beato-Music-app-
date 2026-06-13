const fs = require('fs');
const content = fs.readFileSync('src/components/admin/tabs/MarketingTab.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('HomepageBuilderTab') || line.includes('MobileHomepageBuilderTab') || line.includes('homepage-builder') || line.includes('builder')) {
    console.log(`Line ${idx+1}: ${line.trim()}`);
  }
});
