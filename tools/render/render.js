/* Renders the intro into MP4 segments, frame by frame, for one version (desktop or phone).
   usage: node tools/render/render.js <desktop|phone> <outdir> [run letters, default all] [--test seconds]
   Needs Playwright (Chromium) and ffmpeg, and the site served at http://localhost:8765/.

   Every run starts the intro from the beginning in virtual time. Parts that another run already captured are
   fast-forwarded (no screenshots), which is quick, and identical because the clock and Math.random are virtual. */
const {chromium}=require('playwright');
const {spawn,execFileSync}=require('child_process');
const fs=require('fs'),path=require('path');

const VERSIONS={desktop:{w:1440,h:720,dsf:16/14.4},phone:{w:390,h:540,dsf:2}};
const FPS=30,DT=1000/FPS,TAIL=1.6;
const askEnd=lang=>({until:['askline',lang],tail:TAIL});
const RUNS={
  A:[['cap','intro',askEnd('lang')],['click','#ask .lang[data-v="la"]'],['cap','tour-la',askEnd('la')],['click','#ask [data-v="yes"]'],['cap','yes-la',{until:['done'],tail:.05}]],
  B:[['ff','intro',askEnd('lang')],['click','#ask .lang[data-v="es"]'],['cap','tour-es',askEnd('es')],['click','#ask [data-v="yes"]'],['cap','yes-es',{until:['done'],tail:.05}]],
  C:[['ff','intro',askEnd('lang')],['click','#ask .lang[data-v="fr"]'],['cap','tour-fr',askEnd('fr')],['click','#ask [data-v="no"]'],['cap','home-fr',{until:['done'],tail:.05}]],
  D:[['ff','intro',askEnd('lang')],['click','#ask .lang[data-v="de"]'],['cap','tour-de',askEnd('de')],['click','#ask [data-v="no"]'],['cap','home-de',{until:['done'],tail:.05}]],
  E:[['ff','intro',askEnd('lang')],['click','#ask .lang[data-v="la"]'],['ff','tour-la',askEnd('la')],['click','#ask [data-v="no"]'],['cap','home-la',{until:['done'],tail:.05}]],
  F:[['ff','intro',askEnd('lang')],['click','#ask .lang[data-v="es"]'],['ff','tour-es',askEnd('es')],['click','#ask [data-v="no"]'],['cap','home-es',{until:['done'],tail:.05}]],
};
const [version,outdir,letters='ABCDEF']=process.argv.slice(2);
const testI=process.argv.indexOf('--test'),TEST=testI>0?+process.argv[testI+1]:0;
const V=VERSIONS[version];if(!V)throw new Error('version?');
fs.mkdirSync(outdir,{recursive:true});
const W=Math.round(V.w*V.dsf),H=Math.round(V.h*V.dsf);

function encoder(file){
  const ff=spawn('ffmpeg',['-v','error','-y','-f','image2pipe','-c:v','mjpeg','-framerate',String(FPS),'-i','-',
    '-c:v','libx264','-preset','slow','-tune','animation','-crf','16','-pix_fmt','yuv420p','-r',String(FPS),file],{stdio:['pipe','inherit','inherit']});
  const done=new Promise((ok,no)=>ff.on('close',c=>c?no(new Error('ffmpeg '+c)):ok()));
  return{write:b=>new Promise(ok=>{if(ff.stdin.write(b))ok();else ff.stdin.once('drain',ok)}),end:()=>{ff.stdin.end();return done}};
}

async function run(letter){
  const steps=RUNS[letter].map(s=>process.env.FF_ONLY&&s[0]==='cap'?['ff',s[1],s[2]]:s);
  const b=await chromium.launch({args:['--font-render-hinting=none','--disable-lcd-text']});
  const ctx=await b.newContext({viewport:{width:V.w,height:V.h},deviceScaleFactor:V.dsf});
  await ctx.addInitScript({path:path.join(__dirname,'clock.js')});
  const p=await ctx.newPage();
  p.on('pageerror',e=>console.log('pageerror',e.message));
  p.on('console',m=>{if(m.type()==='error'||m.text().startsWith('OVERFLOW'))console.log('console',m.text())});
  await p.goto(`http://localhost:8765/tools/render/render.html?v=${version}`);
  await p.evaluate(async()=>{await document.fonts.ready;
    await Promise.all(['Fraunces','Figtree','Gentium Book Plus'].flatMap(f=>['400','700','900'].map(w=>document.fonts.load(`${w} 40px "${f}"`,'Fēlix ¡ñ é ö'))));
    // the panels show these images; load them now so a frame never catches one half-loaded
    const imgs=[];for(const c of ['felix','felicisimo','felicien','frohlix'])for(const m of ['happy','thinking'])imgs.push(`art/${c}/face-${m}.svg`);
    imgs.push('art/icons/flame.svg','art/icons/award.svg');
    window.__imgs=await Promise.all(imgs.map(src=>new Promise(r=>{const i=new Image();i.onload=i.onerror=()=>r(i);i.src=src})));
    gsap.ticker.lagSmoothing(0);
    INTRO.init();INTRO.open(()=>{});INTRO.start();});
  const cdp=await ctx.newCDPSession(p);
  const now=()=>p.evaluate(()=>__now()/1000);
  let t=await now();const t0=t;
  const results={};
  for(const [kind,name,opt] of steps){
    if(kind==='click'){await p.evaluate(sel=>{const e=document.querySelector(sel);if(!e)throw new Error('no '+sel);e.click()},name);continue}
    const cap=kind==='cap';const segStart=t;const nMarks=(await p.evaluate(()=>__R.marks.length));
    const file=path.join(outdir,`${name}.video.mp4`);const enc=cap?encoder(file):null;
    let endAt=null,frames=0;const tStart=Date.now();
    for(;;){
      if(cap){const r=await cdp.send('Page.captureScreenshot',{format:'jpeg',quality:93,optimizeForSpeed:true});await enc.write(Buffer.from(r.data,'base64'));frames++;
        if(frames%300===0)console.log(`${version} ${name} ${(frames/FPS).toFixed(0)}s (${((Date.now()-tStart)/frames).toFixed(0)} ms/frame)`)}
      await p.evaluate(ms=>__advance(ms),DT);t+=DT/1000;
      if(endAt==null){const m=await p.evaluate(([n,k,x])=>__R.marks.slice(n).find(m=>m[0]===k&&(x==null||m[1]===x)),[nMarks,opt.until[0],opt.until[1]??null]);if(m)endAt=m[2]+opt.tail}
      if(endAt!=null&&t>=endAt-1e-6)break;
      if(TEST&&t-segStart>=TEST)break;
      if(t-segStart>400)throw new Error('segment never ended: '+name);
    }
    if(!cap){console.log(`${version} ${name}: fast-forwarded ${(t-segStart).toFixed(1)}s`);continue}
    await enc.end();
    const segEnd=t;
    const info=await p.evaluate(([a,z])=>({ev:__R.ev.filter(e=>{const tt=e[e.length-1];return tt>=a-1e-6&&tt<z}),marks:__R.marks.filter(m=>m[2]>=a-1e-6&&m[2]<z)}),[segStart,segEnd]);
    const pcm=await p.evaluate(([a,z])=>__R.mix(a,z),[segStart,segEnd]);
    fs.writeFileSync(path.join(outdir,`${name}.pcm`),Buffer.from(pcm,'base64'));
    const rel=x=>+(x-segStart).toFixed(3);
    results[name]={dur:+(segEnd-segStart).toFixed(3),frames,
      lines:info.ev.filter(e=>e[0]==='voice').map(e=>[e[1],rel(e[2])]),
      stops:info.ev.filter(e=>e[0]==='stop').map(e=>rel(e[1])),
      music:info.ev.filter(e=>e[0]==='music').map(e=>rel(e[1]))[0]??null,
      ask:(info.marks.find(m=>m[0]==='ask')||[])[1]?{kind:info.marks.find(m=>m[0]==='ask')[1],t:rel(info.marks.find(m=>m[0]==='ask')[2])}:null,
      bg:info.marks.filter(m=>m[0]==='bg').map(m=>[m[1],rel(m[2])]),
      done:(info.marks.find(m=>m[0]==='done')||[])[1]||null};
    fs.writeFileSync(path.join(outdir,`${name}.json`),JSON.stringify(results[name]));
    console.log(`${version} ${name}: ${frames} frames, ${results[name].dur}s, ${((Date.now()-tStart)/1000).toFixed(0)}s wall`);
  }
  await b.close();
}
(async()=>{for(const l of letters)await run(l)})().catch(e=>{console.error(e);process.exit(1)});
