const fs = require('fs');
const readline = require('readline');
const path = require('path');

const logPath = 'C:\\Users\\manoj\\.gemini\\antigravity\\brain\\eb3bd276-a724-4067-b579-02830d8a8b14\\.system_generated\\logs\\transcript.jsonl';

if (!fs.existsSync(logPath)) {
  console.log('Log file does not exist.');
  process.exit(1);
}

const rl = readline.createInterface({
  input: fs.createReadStream(logPath),
  crlfDelay: Infinity
});

let idx = 0;
rl.on('line', (line) => {
  idx++;
  if (line.includes('liked_songs_banner') || line.includes('liked song banner') || line.includes('second ref img')) {
    try {
      const data = JSON.parse(line);
      if (data.type === 'PLANNER_RESPONSE') {
        console.log(`\n--- STEP ${idx} (PLANNER_RESPONSE) ---`);
        console.log(data.content.substring(0, 1000));
      }
    } catch (e) {}
  }
});
