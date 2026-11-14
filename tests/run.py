from pathlib import Path
import argparse
import re
import shutil
import subprocess
import tempfile

parser = argparse.ArgumentParser(description='Check Spoiler Shield on local DOM fixtures')
parser.add_argument('--chrome', default=None)
args = parser.parse_args()
chrome = args.chrome or shutil.which('google-chrome') or shutil.which('chromium')
if not chrome:
    candidate = Path('/Applications/Google Chrome.app/Contents/MacOS/Google Chrome')
    chrome = str(candidate) if candidate.exists() else None
if not chrome:
    parser.error('Chrome not found; pass --chrome with the browser executable path')

fixtures = Path(__file__).resolve().parent / 'fixtures'
cases = [('dom.html', ''), ('popup.html', ''), ('popup.html', '#read-error'),
         ('popup.html', '#write-error'), ('fallback.html', ''),
         ('fallback.html', '#race'), ('fallback.html', '#race-disabled')]
with tempfile.TemporaryDirectory(prefix='spoiler-shield-check-') as profile:
    for name, fragment in cases:
        command = [chrome, '--headless', '--disable-gpu', '--no-first-run',
                   '--no-default-browser-check', '--user-data-dir=' + profile,
                   '--dump-dom', '--virtual-time-budget=1500',
                   (fixtures / name).as_uri() + fragment]
        result = subprocess.run(command, capture_output=True, text=True, timeout=30)
        match = re.search(r'<pre id="result">(.*?)</pre>', result.stdout, re.S)
        summary = match.group(1) if match else 'FAIL: browser returned no test result'
        print(summary, flush=True)
        if result.returncode or not summary.startswith('PASS'):
            raise SystemExit(1)
