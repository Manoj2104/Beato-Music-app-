import json

DB_FILE = r'c:\Users\manoj\.gemini\antigravity\scratch\soundsphere\data\soundsphere_db.json'

with open(DB_FILE, 'r', encoding='utf-8') as f:
    db = json.load(f)

order = db.get('homeLayoutOrder', [])
custom = db.get('customSections', {})

for section_id in order:
    sec = custom.get(section_id)
    if not sec:
        print(f"Section {section_id} not found in customSections")
        continue
    bg = sec.get('background')
    if not bg:
        print(f"Section {section_id} ({sec.get('title')}) has NO background object!")
    else:
        bg_type = bg.get('type')
        if not bg_type:
            print(f"Section {section_id} ({sec.get('title')}) background object has no type!")
