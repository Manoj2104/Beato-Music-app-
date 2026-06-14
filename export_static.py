import os
import shutil
import subprocess
import sys

config_path = r"next.config.ts"
cap_path = r"capacitor.config.ts"
api_path = r"src/app/api"
backup_path = r"src/api_backup"

if not os.path.exists(config_path) or not os.path.exists(cap_path):
    print("Error: next.config.ts or capacitor.config.ts not found. Make sure you run in the root.")
    sys.exit(1)

with open(config_path, "r", encoding="utf-8") as f:
    orig_next_content = f.read()

with open(cap_path, "r", encoding="utf-8") as f:
    orig_cap_content = f.read()

# Add output: 'export' to nextConfig
modified_next = orig_next_content.replace(
    "const nextConfig: NextConfig = {",
    "const nextConfig: NextConfig = {\n  output: 'export',"
)

# Remove server block from capacitor config
modified_cap = orig_cap_content.replace(
    """  server: {
    url: 'https://beato-music-app.vercel.app',
    cleartext: true
  },""", ""
)

api_moved = False
if os.path.exists(api_path):
    print("1. Moving src/app/api to src/api_backup...")
    shutil.move(api_path, backup_path)
    api_moved = True
else:
    print("1. src/app/api folder not found, skipping move.")

try:
    print("2. Setting output: 'export' in next.config.ts...")
    with open(config_path, "w", encoding="utf-8") as f:
        f.write(modified_next)
        
    print("3. Removing server block in capacitor.config.ts for standalone APK...")
    with open(cap_path, "w", encoding="utf-8") as f:
        f.write(modified_cap)
        
    print("4. Compiling Next.js static export (npm run build)...")
    # if os.path.exists(".next"):
    #     print("   Cleaning .next directory to avoid stale types...")
    #     try:
    #         shutil.rmtree(".next")
    #     except Exception as e:
    #         print(f"   Warning: could not remove .next directory: {e}")
    res = subprocess.run(
        "npm run build",
        shell=True,
        capture_output=True,
        text=True,
        encoding="utf-8"
    )
    
    print("--- Build Output ---")
    safe_stdout = res.stdout.encode('ascii', errors='replace').decode('ascii')
    print(safe_stdout)
    if res.stderr:
        print("--- Build Errors ---")
        safe_stderr = res.stderr.encode('ascii', errors='replace').decode('ascii')
        print(safe_stderr)
        
    if res.returncode != 0:
        print("Error: Next.js compilation failed!")
        sys.exit(res.returncode)
        
    print("5. Syncing static assets to Android native code (npx cap sync android)...")
    cap_res = subprocess.run(
        "npx cap sync android",
        shell=True,
        capture_output=True,
        text=True,
        encoding="utf-8"
    )
    print("--- Capacitor Sync Output ---")
    safe_cap_stdout = cap_res.stdout.encode('ascii', errors='replace').decode('ascii')
    print(safe_cap_stdout)
    if cap_res.stderr:
        safe_cap_stderr = cap_res.stderr.encode('ascii', errors='replace').decode('ascii')
        print(safe_cap_stderr)
        
    print("\nSUCCESS! Static export compiled and synced to Android project successfully.")
    print("You can now open Android Studio, build the APK, and run it offline on your device!")

finally:
    print("6. Restoring next.config.ts...")
    with open(config_path, "w", encoding="utf-8") as f:
        f.write(orig_next_content)
        
    print("7. Restoring capacitor.config.ts...")
    with open(cap_path, "w", encoding="utf-8") as f:
        f.write(orig_cap_content)
        
    if api_moved and os.path.exists(backup_path):
        print("8. Restoring src/app/api folder...")
        shutil.move(backup_path, api_path)
    print("Done cleanup.")
