const fs = require('fs');
const path = require('path');

function replaceInFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    let newContent = content
        .replace(/Beato/g, 'Beato')
        .replace(/beato/g, 'beato')
        .replace(/BEATO/g, 'BEATO')
        .replace(/Beato/g, 'Beato');
    
    if (content !== newContent) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`Updated ${filePath}`);
    }
}

function walk(dir) {
    let list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        let stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            // Exclude node_modules, .next, .git, android
            if (!file.includes('node_modules') && !file.includes('.next') && !file.includes('.git') && !file.includes('android')) {
                walk(file);
            }
        } else {
            if (/\.(js|jsx|ts|tsx|json|md|html|css|mjs)$/.test(file)) {
                replaceInFile(file);
            }
        }
    });
}

walk('.');
