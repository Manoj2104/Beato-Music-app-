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
    // Print user inputs or plan content
    if (data.type === 'USER_INPUT') {
      console.log(`[Step ${idx} - USER_INPUT]`);
      console.log(data.content);
      if (data.tool_calls) {
        console.log('Tool calls:', JSON.stringify(data.tool_calls, null, 2));
      }
    } else if (data.content && (data.content.includes('Zepto') || data.content.includes('grid_deals') || data.content.includes('liked song banner') || data.content.includes('ref img'))) {
      console.log(`[Step ${idx} - Content containing keywords]`);
      // Print first 500 chars
      console.log(data.content.substring(0, 800) + '...');
    }
  } catch (err) {
    // Ignore invalid JSON lines
  }
});
