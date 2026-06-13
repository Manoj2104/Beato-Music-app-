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
  try {
    const data = JSON.parse(line);
    if (data.type === 'USER_INPUT') {
      const match = line.match(/[\w_-]+\.png/g);
      console.log(`Step ${idx} (${data.created_at}): "${data.content.trim().replace(/\n/g, ' ')}" -> Images: ${match ? match.join(', ') : 'none'}`);
    }
  } catch (e) {}
});
