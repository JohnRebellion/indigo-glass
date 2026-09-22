import math
BG="#07080A"; BODY="#C0E3C0"; SHAD="#89A889"; DX=DY=8

def taper(c1,r1,c2,r2):
    """Convex hull of two circles -> tapered capsule (teardrop). Returns path d."""
    (x1,y1),(x2,y2)=c1,c2
    dx,dy=x2-x1,y2-y1; d=math.hypot(dx,dy); a=math.atan2(dy,dx)
    t=math.acos((r1-r2)/d)          # external tangent angle
    p=lambda c,r,ang:(c[0]+r*math.cos(ang), c[1]+r*math.sin(ang))
    A=p(c1,r1,a+t); B=p(c2,r2,a+t); C=p(c2,r2,a-t); D=p(c1,r1,a-t)
    return ("M%.2f %.2f L%.2f %.2f A%.2f %.2f 0 0 0 %.2f %.2f L%.2f %.2f A%.2f %.2f 0 1 0 %.2f %.2f Z"
            %(A[0],A[1],B[0],B[1],r2,r2,C[0],C[1],D[0],D[1],r1,r1,A[0],A[1]))

HEAD='<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" fill="%s"/>'%BG
def doc(shape):
    g=lambda col,dx,dy:'<g transform="translate(%d,%d)" fill="%s" stroke="%s">%s</g>'%(dx,dy,col,col,shape)
    return HEAD+g(SHAD,DX,DY)+g(BODY,0,0)+'</svg>'
MHEAD='<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" fill="#000"/>'
def mask(shape,dx,dy):
    return MHEAD+'<g transform="translate(%d,%d)" fill="#fff" stroke="#fff">%s</g></svg>'%(dx,dy,shape.replace(BG,"#000"))

drop = taper((140,144),58,(76,80),14)          # tip up-left, 45° axis

CAND={
 # B2 — tapered ink drop / sage seed, 45° axis
 "B2-drop": '<path d="%s" stroke="none"/>'%drop,
 # E — drop meeting a baseline bar (ink on paper)
 "E-drop-rule": ('<path d="%s" stroke="none" transform="translate(0,-16)"/>'%drop +
                 '<path d="M52 208 H196" fill="none" stroke-width="24" stroke-linecap="round"/>'),
 # F — ink disc with a circular bite (seed counter)
 "F-bite": ('<circle cx="116" cy="124" r="76" stroke="none"/>'
            '<circle cx="176" cy="66" r="40" fill="%s" stroke="none"/>'%BG),
 # A2 — rounded prompt chevron, tightened
 "A2-prompt": ('<path d="M76 66 L136 124 L76 182" fill="none" stroke-width="36" '
               'stroke-linecap="round" stroke-linejoin="round"/>'
               '<path d="M152 182 H184" fill="none" stroke-width="36" stroke-linecap="round"/>'),
 # G — drop with negative vein (explicit botanical read)
 "G-seed-vein": ('<path d="%s" stroke="none"/>'%drop +
                 '<path d="M96 100 L146 150" fill="none" stroke="%s" stroke-width="22" stroke-linecap="round"/>'%BG),
}
import os
for name,shape in CAND.items():
    open("renders/%s.svg"%name,"w").write(doc(shape))
    open("renders/%s-body.svg"%name,"w").write(mask(shape,0,0))
    open("renders/%s-shadow.svg"%name,"w").write(mask(shape,DX,DY))
print(" ".join(CAND))
