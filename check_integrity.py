"""
check_integrity.py - Validates HTML/JS/CSS assets and file references
"""
import os
import re

files_to_check = [
    "index.html",
    "tests.html",
    "cipher.js",
    "game.js",
    "ui.js",
    "styles.css",
    "README.md",
    "verify_cipher.py"
]

print("--- Checking Project Integrity ---")
all_ok = True

for fname in files_to_check:
    if os.path.exists(fname):
        size = os.path.getsize(fname)
        print(f"✔ File exists: {fname:<18} ({size} bytes)")
    else:
        print(f"✘ Missing file: {fname}")
        all_ok = False

with open("index.html", "r", encoding="utf-8") as f:
    html = f.read()

scripts = re.findall(r'<script\s+src="([^"]+)"', html)
print(f"\nScripts referenced in index.html: {scripts}")
for s in scripts:
    if os.path.exists(s):
        print(f"✔ Script reference valid: {s}")
    else:
        print(f"✘ Broken script reference: {s}")
        all_ok = False

stylesheets = re.findall(r'<link\s+rel="stylesheet"\s+href="([^"]+)"', html)
print(f"Stylesheets referenced in index.html: {stylesheets}")
for ss in stylesheets:
    if os.path.exists(ss):
        print(f"✔ Stylesheet reference valid: {ss}")
    else:
        print(f"✘ Broken stylesheet reference: {ss}")
        all_ok = False

if all_ok:
    print("\nAll files and references are intact and verified!\n")
else:
    exit(1)
