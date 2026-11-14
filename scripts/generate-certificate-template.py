#!/usr/bin/env python3
"""Builds the Scholarly certificate template from the approved design (scripts/assets/certificate-design-source.png).
Everything that changes per certificate is painted out (name, role line, "of ...", intro, title, ID values, DOI lines, QR boxes,
footer); certificate-layout.ts draws those live. Output: src/assets/certificate-template.jpg (2296 x 1623) and
backgroundBase64 in src/assets/certificate-resources.ts. Run from the project root. Needs Pillow."""
from PIL import Image, ImageDraw
import base64, io, re
SRC = "scripts/assets/certificate-design-source.png"
W, H = 2296, 1623
CREAM = (251, 244, 232); WHITE = (255, 255, 255)
im = Image.open(SRC).convert("RGB").resize((W, H), Image.LANCZOS)
d = ImageDraw.Draw(im)
def clear(x0, y0, x1, y1, c=CREAM): d.rectangle([x0, y0, x1, y1], fill=c)
clear(640, 520, 1640, 620)      # recipient name (the rule under it stays)
clear(880, 648, 1400, 690)      # recorded role line
clear(830, 378, 1450, 446)      # "OF PUBLICATION"
clear(640, 702, 1650, 764)      # intro sentence
clear(900, 782, 1380, 812)      # ARTICLE TITLE label
clear(600, 815, 1690, 940)      # article title
src = im.copy()
clear(560, 1124, 1720, 1176)    # certificate id / reference id / published / issue date values
for sx in (870, 1187, 1479):      # keep the thin column dividers
    im.paste(src.crop((sx - 4, 1124, sx + 5, 1177)), (sx - 4, 1124))
clear(700, 1205, 1640, 1280)    # DOI line + review statement
clear(180, 600, 460, 845, WHITE)   # QR placeholder box
clear(180, 900, 460, 1145, WHITE)  # DOI QR placeholder box
clear(180, 1142, 460, 1175, WHITE) # "DOI" caption (drawn live only when a DOI exists)
clear(540, 1508, 1735, 1590)    # footer disclaimer + verification address
out = im
out.save("src/assets/certificate-template.jpg", quality=92, optimize=True)
b = io.BytesIO(); out.save(b, "JPEG", quality=88, optimize=True)
p = "src/assets/certificate-resources.ts"; s = open(p).read()
s = re.sub(r'backgroundBase64 = "[^"]*"', lambda m: 'backgroundBase64 = "' + base64.b64encode(b.getvalue()).decode() + '"', s)
open(p, "w").write(s); print("ok", len(b.getvalue()))
