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
  if (line.includes('media__')) {
    // Find all media__ file names
    const matches = line.match(/media__\w+/g);
    if (matches) {
      console.log(`Step ${idx}: found media references: ${matches.join(', ')}`);
      // check if it's a tool_call or artifact write
      try {
        const data = JSON.parse(line);
        if (data.tool_calls) {
          console.log(`  Tool call details:`, JSON.stringify(data.tool_calls));
        }
        if (data.type === 'PLANNER_RESPONSE' && data.content.includes('media__')) {
          console.log(`  Planner response:`, data.content.substring(0, 300));
        }
      } catch(e) {}
    }
  }
});
