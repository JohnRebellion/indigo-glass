import math, importlib.util
spec=importlib.util.spec_from_file_location("m3","mk_svg3.py"); m3=importlib.util.module_from_spec(spec); spec.loader.exec_module(m3)
BG=m3.BG

def vesica(p1,p2,R,tip=17):
    """Lens between p1,p2 from two circular arcs radius R, tips rounded by circles."""
    (x1,y1),(x2,y2)=p1,p2
    d=f'M{x1:.1f} {y1:.1f} A{R} {R} 0 0 1 {x2:.1f} {y2:.1f} A{R} {R} 0 0 1 {x1:.1f} {y1:.1f} Z'
    return (f'<path d="{d}" stroke="none"/>'
            f'<circle cx="{x1:.1f}" cy="{y1:.1f}" r="{tip}" stroke="none"/>'
            f'<circle cx="{x2:.1f}" cy="{y2:.1f}" r="{tip}" stroke="none"/>')

LEAF   = vesica((62,178),(178,62),150)
VEIN   = '<path d="M84 156 L156 84" fill="none" stroke="%s" stroke-width="28" stroke-linecap="round"/>'%BG
CAND={"J3-leaf":LEAF, "J4-leaf-vein":LEAF+VEIN}
for n,s in CAND.items():
    open("renders/%s.svg"%n,"w").write(m3.doc(s))
    open("renders/%s-body.svg"%n,"w").write(m3.mask(s,0,0))
    open("renders/%s-shadow.svg"%n,"w").write(m3.mask(s,m3.DX,m3.DY))
print("ok")
