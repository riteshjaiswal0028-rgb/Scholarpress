#!/usr/bin/env python3
"""Regenerates the Scholarly logo assets (seal, icons, favicons, OG image, Android icons/splash) from the S mark taken from the
approved certificate design (scripts/assets/scholarly-mark.png). Run from the project root. Needs Pillow."""
from PIL import Image, ImageDraw, ImageFont
import glob, os
GREEN=(23,60,50); CREAM=(251,244,232); GOLD=(176,141,58); MUTED=(107,101,96)
SS=2
MARK=Image.open("scripts/assets/scholarly-mark.png").convert("RGBA")
SERIF="scripts/assets/CormorantGaramond-SemiBold.ttf"; SANS="scripts/assets/Inter-Medium.ttf"
def mark(n): return MARK.resize((n,n),Image.LANCZOS)
def seal(n):  # the mark itself, transparent background
    return mark(n)
def icon(n,round_=False,bg=CREAM,scale=0.62):
    im=Image.new("RGBA",(n*SS,n*SS),(0,0,0,0)); d=ImageDraw.Draw(im)
    if round_: d.ellipse([0,0,n*SS-1,n*SS-1],fill=bg+(255,))
    else: d.rectangle([0,0,n*SS,n*SS],fill=bg+(255,))
    m=mark(int(n*SS*scale)); im.alpha_composite(m,((n*SS-m.width)//2,(n*SS-m.height)//2)); return im.resize((n,n),Image.LANCZOS)
def foreground(n):
    im=Image.new("RGBA",(n,n),(0,0,0,0)); m=mark(int(n*0.5)); im.alpha_composite(m,((n-m.width)//2,(n-m.height)//2)); return im
def splash(w,h):
    im=Image.new("RGBA",(w,h),CREAM+(255,)); m=mark(int(min(w,h)*0.26)); im.alpha_composite(m,((w-m.width)//2,(h-m.height)//2)); return im
def spaced(d,xy,text,f,fill,track):
    x,y=xy
    for ch in text:
        d.text((x,y),ch,font=f,fill=fill); x+=d.textlength(ch,font=f)+track
    return x
def lockup(W,H):
    im=Image.new("RGB",(W,H),CREAM); n=int(H*0.46); s=mark(n); im.paste(s,(int(W*0.09),(H-n)//2),s)
    d=ImageDraw.Draw(im); x=int(W*0.09)+n+int(H*0.07)
    spaced(d,(x,int(H*0.30)),"SCHOLARLY",ImageFont.truetype(SERIF,int(H*0.125)),GREEN,int(H*0.024))
    spaced(d,(x,int(H*0.56)),"RESEARCH · PUBLISHING",ImageFont.truetype(SANS,int(H*0.036)),GOLD,int(H*0.012)); return im
pub=lambda f:"public/"+f
seal(512).save(pub("scholarpress-seal.png")); seal(1200).save(pub("scholarpress-seal-hd.png"))
for n,f in [(192,"icon-192.png"),(512,"icon-512.png"),(180,"apple-touch-icon.png"),(32,"favicon-32.png"),(48,"favicon-48.png")]: icon(n).save(pub(f))
icon(48).save(pub("favicon.ico"),sizes=[(16,16),(32,32),(48,48)])
lockup(1200,630).save(pub("og-image.jpg"),quality=92); lockup(2400,1000).save(pub("scholarpress-logo-horizontal.png"))
res="android/app/src/main/res/"
for f in glob.glob(res+"mipmap-*/ic_launcher*.png"):
    n=Image.open(f).size[0]; b=os.path.basename(f)
    (foreground(n) if "foreground" in b else icon(n,round_="round" in b)).save(f)
for f in glob.glob(res+"drawable*/splash.png"):
    w,h=Image.open(f).size; splash(w,h).convert("RGB").save(f)
open(res+"values/ic_launcher_background.xml","w").write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#FBF4E8</color>\n</resources>\n')
# Logo used inside PDFs (article cover page): src/assets/logo-resources.ts
import base64, io
b=io.BytesIO(); seal(400).save(b,"PNG",optimize=True)
open("src/assets/logo-resources.ts","w").write('/** Scholarly mark (PNG, transparent background, square, 400 x 400). Used on the article cover page. */\nexport const logoPngBase64 = "'+base64.b64encode(b.getvalue()).decode()+'";\nexport const LOGO_ASPECT = 1;\n')
print("ok")
