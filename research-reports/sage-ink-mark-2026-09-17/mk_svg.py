BG="#07080A"; BODY="#C0E3C0"; SHAD="#89A889"
HEAD='<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240">\n<rect width="240" height="240" fill="%s"/>\n'%BG
DX=DY=8

def layer(body_svg, colour, dx=0, dy=0):
    return '<g transform="translate(%d,%d)" fill="%s" stroke="%s">%s</g>\n'%(dx,dy,colour,colour,body_svg)

def doc(shape):
    return HEAD + layer(shape, SHAD, DX, DY) + layer(shape, BODY) + '</svg>\n'

# A — prompt chevron + cursor bar
A = ('<path d="M70 62 L132 120 L70 178" fill="none" stroke-width="34" stroke-linecap="round" stroke-linejoin="round"/>'
     '<path d="M150 178 H186" fill="none" stroke-width="34" stroke-linecap="round"/>')

# B — ink drop, 45° rounded taper
B = ('<circle cx="124" cy="146" r="56" stroke="none"/>'
     '<path d="M82 104 L124 146" fill="none" stroke-width="52" stroke-linecap="round"/>')

# C — sage leaf capsule, 45°, single vein
C = ('<path d="M78 162 L162 78" fill="none" stroke-width="84" stroke-linecap="round"/>'
     '<path d="M90 150 L150 90" fill="none" stroke="%s" stroke-width="12" stroke-linecap="round"/>'%BG)

# D — rounded S monogram (orthogonal + 45° only)
D = ('<path d="M82 74 H158 L78 154 H158" fill="none" stroke-width="34" '
     'stroke-linecap="round" stroke-linejoin="round"/>')

for name,shape in [("A-prompt",A),("B-drop",B),("C-leaf",C),("D-ess",D)]:
    open("renders/%s.svg"%name,"w").write(doc(shape))
print("ok")

# mask variants for honest quantisation (no antialias colour blending)
MHEAD='<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" fill="#000"/>'
for name,shape in [("A-prompt",A),("B-drop",B),("C-leaf",C),("D-ess",D)]:
    s=shape.replace(BG,"#000")
    open("renders/%s-body.svg"%name,"w").write(MHEAD+layer(s,"#fff")+"</svg>")
    open("renders/%s-shadow.svg"%name,"w").write(MHEAD+layer(s,"#fff",DX,DY)+"</svg>")
