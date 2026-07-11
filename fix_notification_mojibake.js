const fs = require('fs');
const filePath = 'src/app/(dashboard)/home/page.tsx';

let content = fs.readFileSync(filePath, 'utf8');

// Build the target mojibake string using the exact character codes we found:
// [226, 8364, 8221, 194, 157]
const targetMojibake = String.fromCharCode(226, 8364, 8221, 194, 157);

console.log('Target Mojibake sequence length:', targetMojibake.length);

let occurrences = 0;
while (content.includes(targetMojibake)) {
  content = content.replace(targetMojibake, '•');
  occurrences++;
}

console.log(`Successfully replaced ${occurrences} occurrences of mojibake!`);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Done!');
