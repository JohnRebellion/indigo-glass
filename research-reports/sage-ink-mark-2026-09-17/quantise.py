import sys
from PIL import Image
BG=(7,8,10); BODY=(192,227,192); SHAD=(137,168,137)
def near(px):
    r,g,b=px[:3]
    d=lambda c:(r-c[0])**2+(g-c[1])**2+(b-c[2])**2
    return min(((d(BG),0),(d(BODY),1),(d(SHAD),2)))[1]
def art(png, W=30, H=30):
    im=Image.open(png).convert("RGB").resize((W,H), Image.LANCZOS)
    g=[[near(im.getpixel((x,y))) for x in range(W)] for y in range(H)]
    out=[]
    for y in range(0,H,2):
        line=''
        for x in range(W):
            t=g[y][x]; b=g[y+1][x] if y+1<H else 0
            if t==0 and b==0: line+=' '
            elif t==b: line+='$%d█'%t
            elif b==0: line+='$%d▀'%t
            elif t==0: line+='$%d▄'%b
            else: line+='$%d▀'%t
        out.append(line.rstrip())
    return out
if __name__=="__main__":
    for f in sys.argv[1:]:
        print("### "+f)
        for l in art(f):
            print(l.replace('$1','\033[38;2;192;227;192m').replace('$2','\033[38;2;137;168;137m')+'\033[0m')
