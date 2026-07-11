import os

filePath = r"c:\Users\manoj\.gemini\antigravity\scratch\soundsphere\src\app\(dashboard)\home\page.tsx"
with open(filePath, 'r', encoding='utf-8') as f:
    lines = f.readlines()

for i, line in enumerate(lines):
    if "just uploaded by artists" in line:
        print(f"Line {i+1} character codes:")
        print([ord(c) for c in line])
