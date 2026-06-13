const fs = require('fs');
const content = fs.readFileSync('src/app/(dashboard)/admin/dashboard/page.tsx', 'utf8');
const lines = content.split('\n');
lines.forEach((line, idx) => {
  if (line.includes('MarketingTab') || line.includes('activeTab') || line.includes('switch') || line.includes('padding') || line.includes('width') || line.includes('overflow')) {
    if (line.length < 150) {
      console.log(`Line ${idx+1}: ${line.trim()}`);
    }
  }
});
