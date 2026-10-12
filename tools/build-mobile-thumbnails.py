"""Resize approved figures for mobile cards; never changes the source art.
Requires Pillow. Run from the project root.
"""
import json
import subprocess
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
looks = json.loads(subprocess.check_output([
    'node', '-e', "process.stdout.write(JSON.stringify(require('./previews/complete-looks/data.js').LOOKS))"
], cwd=ROOT))
meta = json.loads((ROOT / 'mobile/拆解小样信息.json').read_text())
output = ROOT / 'mobile/thumbnails'
output.mkdir(exist_ok=True)
for look in looks:
    source = ROOT / 'mobile' / meta[look['id']]['figure']
    with Image.open(source) as image:
        image.thumbnail((420, 630), Image.Resampling.LANCZOS)
        image.save(output / (look['id'] + '.webp'), format='WEBP', quality=88, method=6)
with Image.open(ROOT / 'mobile/糖丝爱心-效果预览.png') as image:
    image.thumbnail((288, 288), Image.Resampling.LANCZOS)
    image.save(output / 'heart.webp', format='WEBP', quality=90, method=6)
