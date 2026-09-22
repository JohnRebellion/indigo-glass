from PIL import Image
def grid(png,W,H,thr=0.5):
    im=Image.open(png).convert("L").resize((W,H), Image.BOX)
    return [[1 if im.getpixel((x,y))>=thr*255 else 0 for x in range(W)] for y in range(H)]
def art(stem,W=30,H=30):
    b=grid("renders/%s-body.png"%stem,W,H); s=grid("renders/%s-shadow.png"%stem,W,H)
    g=[[1 if b[y][x] else (2 if s[y][x] else 0) for x in range(W)] for y in range(H)]
    out=[]
    for y in range(0,H,2):
        line=''
        for x in range(W):
            t=g[y][x]; bb=g[y+1][x] if y+1<H else 0
            if t==0 and bb==0: line+=' '
            elif t==bb: line+='$%d█'%t
            elif bb==0: line+='$%d▀'%t
            elif t==0: line+='$%d▄'%bb
            else: line+='$%d▀'%t
        out.append(line.rstrip())
    return out
if __name__=="__main__":
    for stem in ("A-prompt","B-drop","C-leaf","D-ess"):
        print("### "+stem)
        for l in art(stem): print(l)
