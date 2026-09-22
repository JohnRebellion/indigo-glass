/* residue.mjs — what check.mjs cannot see.
 *
 * check.mjs scans radii, fills and link colours inside one content root.
 * This probe scans the whole viewport (top 2000px) for the buckets the
 * 2026-09-23 verification pass found missing: off-token opaque fills,
 * gradients and backdrop blur, translucent fills at rest, selected items
 * that are filled rather than stroked (STATE_GRAMMAR Tier C), and controls
 * whose border is thinner than the 2px contract.
 *
 *   node residue.mjs <style.user.css|-> <url> [shot.png]
 *
 * "-" runs unstyled. Same headless Edge on IG_STYLE_PROFILE as check.mjs
 * (mkprofile.sh first). Output is JSON; expected residue is documented per
 * site in research-reports/.../measure/LEDGER.md (L30).
 *
 * TOK lists the Sage Ink ladder only. Per-site accents (YouTube #E89082,
 * Facebook #81ACF0, Gemini #BA99E3) are intentional and will show under
 * offToken; read the selector before treating a hit as a fault. */
import { chromium } from 'playwright-core'
import { spawn } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'
function unwrap(css){let out=[],i=0;for(;;){const s=css.indexOf('@-moz-document',i);if(s<0)break;let o=-1,p=0;for(let k=s;k<css.length;k++){if(css[k]=='(')p++;else if(css[k]==')')p--;else if(css[k]=='{'&&!p){o=k;break}}let d=0,j=o;for(;j<css.length;j++){if(css[j]=='{')d++;else if(css[j]=='}'){d--;if(!d)break}}out.push(css.slice(o+1,j));i=j+1}return out.join('\n')}
const [file,url,shot]=process.argv.slice(2)
const port=9700+Math.floor(Math.random()*200)
const proc=spawn('/opt/microsoft/msedge/msedge',[`--user-data-dir=${process.env.IG_STYLE_PROFILE||'/tmp/ig-style-profile'}`,`--remote-debugging-port=${port}`,'--no-first-run','--no-default-browser-check','--disable-extensions','--headless=new'],{stdio:'ignore'})
let browser;for(let i=0;i<60;i++){await sleep(500);try{browser=await chromium.connectOverCDP(`http://127.0.0.1:${port}`);break}catch{}}
const page=await browser.contexts()[0].newPage();await page.setViewportSize({width:1400,height:1000});await page.emulateMedia({colorScheme:'dark'})
await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await page.waitForTimeout(5000)
if(file!=='-') await page.addStyleTag({content:unwrap(readFileSync(file,'utf8'))});await page.waitForTimeout(1000)
const out=await page.evaluate(()=>{
  const TOK=new Set(['rgb(7, 8, 10)','rgb(13, 13, 16)','rgb(18, 18, 22)','rgb(10, 10, 13)','rgb(28, 28, 30)','rgb(94, 94, 96)','rgb(248, 248, 248)','rgb(107, 114, 128)','rgb(75, 85, 99)','rgb(166, 201, 166)','rgb(192, 227, 192)','rgb(137, 168, 137)'])
  const sig=el=>{const cls=typeof el.className==='string'?el.className.trim().split(/\s+/).slice(0,3).join('.'):'';const at=['role','aria-current','aria-selected','active','selected','data-active','jsname'].filter(a=>el.hasAttribute(a)).map(a=>`[${a}=${el.getAttribute(a).slice(0,20)}]`).join('');return `${el.tagName.toLowerCase()}${el.id?'#'+el.id:''}${cls?'.'+cls:''}${at}`}
  const bump=(m,k)=>m.set(k,(m.get(k)||0)+1)
  const off=new Map(),rad=new Map(),grad=new Map(),alpha=new Map(),sel=new Map(),thin=new Map()
  for(const el of document.querySelectorAll('body *')){
    const r=el.getBoundingClientRect();if(r.width<24||r.height<12||r.bottom<0||r.top>2000)continue
    const c=getComputedStyle(el);const bg=c.backgroundColor
    if(bg&&!bg.startsWith('rgba(0, 0, 0, 0)')){
      if(bg.startsWith('rgba')||bg.startsWith('color(')){bump(alpha,`${sig(el)} ${bg}`)}
      else if(!TOK.has(bg)&&!bg.startsWith('oklch'))bump(off,`${sig(el)} ${bg}`)
    }
    const rd=parseFloat(c.borderTopLeftRadius);if(rd>=4&&rd<Math.min(r.width,r.height)/2-1)bump(rad,`${sig(el)} r=${c.borderTopLeftRadius}`)
    if(/gradient/.test(c.backgroundImage))bump(grad,`${sig(el)} ${c.backgroundImage.slice(0,60)}`)
    if(c.backdropFilter&&c.backdropFilter!=='none')bump(grad,`${sig(el)} backdrop=${c.backdropFilter}`)
    if(el.matches('[aria-current],[aria-selected="true"],[active],[selected],[data-active="true"],.selected,.active,.ytChipShapeActive'))bump(sel,`${sig(el)} bg=${bg} shadow=${c.boxShadow.slice(0,40)}`)
    if(el.matches('input,textarea,button,[role="button"],[role="textbox"],[role="search"],[role="combobox"]')&&c.borderTopStyle!=='none'&&parseFloat(c.borderTopWidth)>0&&parseFloat(c.borderTopWidth)<2)bump(thin,`${sig(el)} ${c.borderTopWidth} ${c.borderTopColor}`)
  }
  const top=(m,n=12)=>[...m.entries()].sort((a,b)=>b[1]-a[1]).slice(0,n).map(([k,v])=>`${v}x ${k}`)
  return {offToken:top(off),radii:top(rad),gradientsBlur:top(grad),translucent:top(alpha),selectedItems:top(sel),thinBorders:top(thin)}
})
if(shot) await page.screenshot({path:shot})
console.log(JSON.stringify(out,null,1));await browser.close();proc.kill()
