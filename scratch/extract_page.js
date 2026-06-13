const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Let's write a simple script that uses node-stream or powershell to extract just the one file
// We can use PowerShell via execSync to avoid shell parsing issues
const zipPath = 'c:/Users/manoj/.gemini/antigravity/scratch/beato.zip';
const targetFile = 'beato/src/app/(artist)/artist/dashboard/page.tsx';
const destPath = path.join(__dirname, 'extracted_page.tsx');

console.log('Extracting:', targetFile);
try {
  // Use PowerShell's System.IO.Compression.ZipFile class
  const psCommand = `
[System.Reflection.Assembly]::LoadWithPartialName('System.IO.Compression.FileSystem') | Out-Null
$zip = [System.IO.Compression.ZipFile]::OpenRead('${zipPath}')
$entry = $zip.Entries | Where-Object { $_.FullName -eq '${targetFile}' -or $_.FullName.EndsWith('src/app/(artist)/artist/dashboard/page.tsx') }
if ($entry) {
    [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, '${destPath}', $true)
    console.log('Extracted successfully!')
} else {
    console.log('File not found in zip')
}
$zip.Dispose()
  `;
  fs.writeFileSync('temp_extract.ps1', psCommand, 'utf8');
  const output = execSync('powershell -ExecutionPolicy Bypass -File temp_extract.ps1').toString();
  console.log(output);
  fs.unlinkSync('temp_extract.ps1');
} catch (e) {
  console.error('Extraction failed:', e.message);
}
