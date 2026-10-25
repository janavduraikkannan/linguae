/* Fast-forward the intro in virtual time and screenshot moments, to check a layout without rendering video.
   usage: node tools/render/probe.js <desktop|phone> <out.png prefix> <line id>:<seconds after it starts> ... */
const {chromium}=require('playwright');const path=require('path');
const VERSIONS={desktop:{w:1440,h:720,dsf:1},phone:{w:390,h:540,dsf:2}};
const [version,prefix,...shots]=process.argv.slice(2);const V=VERSIONS[version];
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:V.w,height:V.h},deviceScaleFactor:V.dsf});
await ctx.addInitScript({path:path.join(__dirname,'clock.js')});const p=await ctx.newPage();p.on('pageerror',e=>console.log('pageerror',e.message));
await p.goto(`http://localhost:8765/tools/render/render.html?v=${version}`);
await p.evaluate(async()=>{await document.fonts.ready;gsap.ticker.lagSmoothing(0);INTRO.init();INTRO.open(()=>{});INTRO.start()});
const pick=process.env.LANG_PICK;if(pick){for(let i=0;i<30*120;i++){await p.evaluate(()=>__advance(1000/30));if(await p.evaluate(()=>!!document.querySelector("#ask .lang")))break}await p.evaluate(()=>__advance(500));await p.evaluate(l=>document.querySelector(`#ask .lang[data-v="${l}"]`).click(),pick)}
for(const s of shots){const [id,off]=s.split(':');
  for(let i=0;i<30*200;i++){await p.evaluate(()=>__advance(1000/30));const ok=await p.evaluate(([id,off])=>{const e=__R.ev.find(e=>e[0]==='voice'&&e[1]===id);return e&&__now()/1000>=e[2]+ +off},[id,off]);if(ok)break}
  await p.screenshot({path:`${prefix}-${id}.png`});console.log(await p.evaluate(()=>{const n=document.querySelector(".pnl:not(.leaving)");if(!n)return "";const r=n.getBoundingClientRect();return n.className+" sw="+n.scrollWidth+" cw="+n.clientWidth+" "+[...n.querySelectorAll("*")].filter(e=>e.getBoundingClientRect().right>r.right-3).map(e=>e.tagName+"."+e.className+" "+Math.round(e.getBoundingClientRect().right-r.right)).join(", ")}));console.log('shot',id)}
await b.close()})();
