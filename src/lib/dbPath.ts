import path from 'path';
import fs from 'fs';

export function getDbFilePath(): string {
  const isVercel = !!(process.env.VERCEL || process.env.NOW_BUILDER);
  
  if (isVercel) {
    const tmpDir = '/tmp';
    const tmpPath = path.join(tmpDir, 'beato_db.json');
    
    // Ensure the tmp file is initialized
    if (!fs.existsSync(tmpPath)) {
      const originalPath = path.join(process.cwd(), 'data', 'beato_db.json');
      try {
        if (fs.existsSync(originalPath)) {
          const content = fs.readFileSync(originalPath);
          fs.writeFileSync(tmpPath, content);
          console.log('Successfully copied base database from data/beato_db.json to /tmp/beato_db.json');
        } else {
          // Initialize with empty schema structure
          const initialData = {
            users: [],
            otps: [],
            sessions: [],
            tracks: [],
            transactions: [],
            planPrices: { free: 0, student: 4.99, premium: 9.99, family: 15.99, creator: 19.99 }
          };
          fs.writeFileSync(tmpPath, JSON.stringify(initialData, null, 2), 'utf-8');
          console.log('Initialized empty database at /tmp/beato_db.json');
        }
      } catch (e) {
        console.error('Failed to initialize database in /tmp:', e);
      }
    }
    return tmpPath;
  }
  
  return path.join(process.cwd(), 'data', 'beato_db.json');
}
