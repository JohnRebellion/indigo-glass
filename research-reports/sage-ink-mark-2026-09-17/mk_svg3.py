import math
BG="#07080A"; BODY="#C0E3C0"; SHAD="#89A889"; DX=DY=8

def taper(c1,r1,c2,r2):
    (x1,y1),(x2,y2)=c1,c2
    dx,dy=x2-x1,y2-y1; d=math.hypot(dx,dy); a=math.atan2(dy,dx); t=math.acos((r1-r2)/d)
    p=lambda c,r,ang:(c[0]+r*math.cos(ang), c[1]+r*math.sin(ang))
    A=p(c1,r1,a+t); B=p(c2,r2,a+t); C=p(c2,r2,a-t); D=p(c1,r1,a-t)
    return ("M%.2f %.2f L%.2f %.2f A%.2f %.2f 0 0 0 %.2f %.2f L%.2f %.2f A%.2f %.2f 0 1 0 %.2f %.2f Z"
            %(A[0],A[1],B[0],B[1],r2,r2,C[0],C[1],D[0],D[1],r1,r1,A[0],A[1]))

def leaf(c1,r1,c2,r2,R):
    """Two concave circular fillet arcs of radius R joining tip circle to body circle."""
    (x1,y1),(x2,y2)=c1,c2
    dx,dy=x2-x1,y2-y1; d=math.hypot(dx,dy); a=math.atan2(dy,dx)
    # fillet centre P: |P-C1|=R+r1, |P-C2|=R+r2
    u=((R+r1)**2-(R+r2)**2+d*d)/(2*d)
    h=math.sqrt(max((R+r1)**2-u*u,0))
    mid=(x1+u*math.cos(a), y1+u*math.sin(a))
    n=(-math.sin(a), math.cos(a))
    pts=[]
    for sgn in (1,-1):
        P=(mid[0]+sgn*h*n[0], mid[1]+sgn*h*n[1])
        t1=(x1+(P[0]-x1)*r1/(R+r1), y1+(P[1]-y1)*r1/(R+r1))   # tangent pt on body
        t2=(x2+(P[0]-x2)*r2/(R+r2), y2+(P[1]-y2)*r2/(R+r2))   # tangent pt on tip
        pts.append((t1,t2,sgn))
    (a1,a2,_),(b1,b2,_)=pts
    return ("M%.2f %.2f A%.2f %.2f 0 0 1 %.2f %.2f A%.2f %.2f 0 0 1 %.2f %.2f A%.2f %.2f 0 0 1 %.2f %.2f A%.2f %.2f 0 1 1 %.2f %.2f Z"
            %(a1[0],a1[1], R,R, a2[0],a2[1], r2,r2, b2[0],b2[1], R,R, b1[0],b1[1], r1,r1, a1[0],a1[1]))

HEAD='<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" fill="%s"/>'%BG
MHEAD='<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240" viewBox="0 0 240 240"><rect width="240" height="240" fill="#000"/>'
def doc(s):
    g=lambda c,dx,dy:'<g transform="translate(%d,%d)" fill="%s" stroke="%s">%s</g>'%(dx,dy,c,c,s)
    return HEAD+g(SHAD,DX,DY)+g(BODY,0,0)+'</svg>'
def mask(s,dx,dy):
    return MHEAD+'<g transform="translate(%d,%d)" fill="#fff" stroke="#fff">%s</g></svg>'%(dx,dy,s.replace(BG,"#000"))

BIG=taper((136,142),74,(56,62),16)                 # scaled-up tangent drop
LEAFP=leaf((136,142),74,(56,62),16,210)            # concave arc-sided leaf
VEIN='<path d="M78 84 L140 146" fill="none" stroke="%s" stroke-width="28" stroke-linecap="round"/>'%BG

CAND={
 "H-drop-big":   '<path d="%s" stroke="none"/>'%BIG,
 "H2-drop-vein": '<path d="%s" stroke="none"/>'%BIG + VEIN,
 "J-leaf":       '<path d="%s" stroke="none"/>'%LEAFP,
 "J2-leaf-vein": '<path d="%s" stroke="none"/>'%LEAFP + VEIN,
}
for n,s in CAND.items():
    open("renders/%s.svg"%n,"w").write(doc(s))
    open("renders/%s-body.svg"%n,"w").write(mask(s,0,0))
    open("renders/%s-shadow.svg"%n,"w").write(mask(s,DX,DY))
print(" ".join(CAND))
