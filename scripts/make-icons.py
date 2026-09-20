"""PWA ikonlarını ve favicon'u üretir: python3 scripts/make-icons.py"""
from PIL import Image, ImageDraw
import os

BG = (18, 14, 38)
# (x, y, w, h, renk) - mavi tunikli, kılıçlı karakter (16x16 ızgara)
RECTS = [
    (5, 12, 2, 2, '#3a2f7a'), (9, 12, 2, 2, '#3a2f7a'), (5, 14, 2, 1, '#8a5a2b'), (9, 14, 2, 1, '#8a5a2b'),
    (4, 7, 8, 5, '#3b6fd4'), (4, 11, 8, 1, '#2b57b0'), (6, 7, 4, 1, '#f4ecd8'), (4, 10, 8, 1, '#ffc933'),
    (3, 7, 1, 3, '#3b6fd4'), (12, 7, 1, 3, '#3b6fd4'), (3, 10, 1, 1, '#f2c9a0'), (12, 10, 1, 1, '#f2c9a0'),
    (5, 4, 6, 3, '#f2c9a0'), (6, 5, 1, 1, '#120e26'), (9, 5, 1, 1, '#120e26'),
    (5, 2, 6, 1, '#5b3a29'), (4, 3, 8, 1, '#5b3a29'), (4, 4, 1, 2, '#5b3a29'), (11, 4, 1, 2, '#5b3a29'),
    (14, 3, 1, 7, '#d8e4f0'), (13, 10, 3, 1, '#ffc933'), (14, 11, 1, 1, '#8a5a2b'),
]

def make(size, scale_frac, path):
    img = Image.new('RGB', (size, size), BG)
    d = ImageDraw.Draw(img)
    cell = int(size * scale_frac / 16)
    off = (size - cell * 16) // 2
    for x, y, w, h, c in RECTS:
        d.rectangle([off + x * cell, off + y * cell, off + (x + w) * cell - 1, off + (y + h) * cell - 1], fill=c)
    img.save(path)

os.makedirs('public/icons', exist_ok=True)
make(192, 0.80, 'public/icons/icon-192.png')
make(512, 0.80, 'public/icons/icon-512.png')
make(512, 0.60, 'public/icons/icon-maskable-512.png')   # maskable: güvenli alan için daha küçük
make(180, 0.80, 'public/icons/apple-touch-icon.png')

svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">',
       '<rect width="16" height="16" fill="#120e26"/>']
for x, y, w, h, c in RECTS:
    svg.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="{c}"/>')
svg.append('</svg>')
open('public/favicon.svg', 'w').write('\n'.join(svg))
print('ok')
