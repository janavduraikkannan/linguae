/* Linguae intro stage: audio (voice, music, code-made sound effects), a cancellable director so Skip can cut
   anywhere, captions, the hand-drawn line boil, and a camera. */
(function(){
const $=s=>document.querySelector(s);
window.REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;

/* ---------- audio ---------- */
const A={ctx:null,master:null,music:null,voice:null,sfx:null,buf:{},muted:false,src:null,musicSrc:null};
A.init=function(){
  if(A.ctx)return;const C=window.AudioContext||window.webkitAudioContext;if(!C)return;
  A.ctx=new C();A.master=A.ctx.createGain();A.master.connect(A.ctx.destination);
  A.music=A.ctx.createGain();A.music.gain.value=0;A.music.connect(A.master);
  A.voice=A.ctx.createGain();A.voice.gain.value=1;A.voice.connect(A.master);
  A.sfx=A.ctx.createGain();A.sfx.gain.value=.5;A.sfx.connect(A.master);
  try{A.muted=localStorage.getItem('linguae-mute')==='1'}catch(e){}
  A.master.gain.value=A.muted?0:1;
};
A.load=function(name){
  if(A.buf[name])return A.buf[name];
  A.buf[name]=fetch(`audio/${name}.mp3`).then(r=>{if(!r.ok)throw 0;return r.arrayBuffer()}).then(b=>new Promise((ok,no)=>A.ctx.decodeAudioData(b,ok,no))).catch(()=>null);
  return A.buf[name];
};
A.setMute=function(m){A.muted=m;try{localStorage.setItem('linguae-mute',m?'1':'0')}catch(e){}if(A.master)A.master.gain.setTargetAtTime(m?0:1,A.ctx.currentTime,.03)};
A.musicLevel=.32;
A.startMusic=async function(){
  if(!A.ctx||A.musicSrc)return;const b=await A.load('music');if(!b||A.musicSrc)return;
  const s=A.ctx.createBufferSource();s.buffer=b;s.loop=true;s.connect(A.music);s.start();A.musicSrc=s;A.musicT0=A.ctx.currentTime;
  A.music.gain.setTargetAtTime(A.musicLevel,A.ctx.currentTime,.8);
};
A.stopMusic=function(fade=.6){if(!A.musicSrc)return;const s=A.musicSrc;A.musicSrc=null;A.music.gain.setTargetAtTime(0,A.ctx.currentTime,fade/3);setTimeout(()=>{try{s.stop()}catch(e){}},fade*1000+200)};
A.duck=function(on){if(A.ctx&&A.musicSrc)A.music.gain.setTargetAtTime(on?A.musicLevel*.4:A.musicLevel,A.ctx.currentTime,on?.08:.35)};
/* seconds until the next musical beat (for cutting on the beat) */
A.toBeat=function(div=1){if(!A.musicSrc)return 0;const b=60/window.MUSIC.bpm/div,t=(A.ctx.currentTime-A.musicT0)%b;return t<.04?0:b-t};
A.play=async function(name,onStart){
  if(!A.ctx){onStart&&onStart(()=>0);return}
  const b=await A.load(name);if(!b){onStart&&onStart(()=>0);return}
  return new Promise(res=>{
    const s=A.ctx.createBufferSource();s.buffer=b;s.connect(A.voice);const t0=A.ctx.currentTime+.02;s.start(t0);A.src=s;A.duck(true);
    s.onended=()=>{if(A.src===s){A.src=null;A.duck(false)}res()};
    onStart&&onStart(()=>A.ctx.currentTime-t0);
  });
};
A.stopVoice=function(){if(A.src){try{A.src.onended=null;A.src.stop()}catch(e){}A.src=null;A.duck(false)}};
/* sound effects, synthesized. c/t0/out let the video renderer play them into an offline context at exact times. */
A.fx=function(kind,vol=1,c=A.ctx,t0,out){
  if(!c)return;const t=t0==null?c.currentTime:t0;out=out||A.sfx;
  const osc=(type,f0,f1,dur,v=.5)=>{const o=c.createOscillator();o.type=type;o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(f1,t+dur);
    const gg=c.createGain();gg.gain.setValueAtTime(0,t);gg.gain.linearRampToValueAtTime(v*vol,t+.008);gg.gain.exponentialRampToValueAtTime(.0001,t+dur);o.connect(gg);gg.connect(out);o.start(t);o.stop(t+dur+.02)};
  const noise=(dur,f0,f1,v=.4,q=1.2)=>{const n=c.createBufferSource(),len=Math.ceil(c.sampleRate*dur),bb=c.createBuffer(1,len,c.sampleRate),d=bb.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;n.buffer=bb;
    const f=c.createBiquadFilter();f.type='bandpass';f.Q.value=q;f.frequency.setValueAtTime(f0,t);f.frequency.exponentialRampToValueAtTime(f1,t+dur);
    const gg=c.createGain();gg.gain.setValueAtTime(0,t);gg.gain.linearRampToValueAtTime(v*vol,t+dur*.35);gg.gain.exponentialRampToValueAtTime(.0001,t+dur);n.connect(f);f.connect(gg);gg.connect(out);n.start(t);n.stop(t+dur)};
  const tone=(f,dur,v,at)=>{const o=c.createOscillator(),g=c.createGain();o.frequency.value=f;g.gain.setValueAtTime(v,at);g.gain.exponentialRampToValueAtTime(.0001,at+dur);o.connect(g);g.connect(out);o.start(at);o.stop(at+dur)};
  if(kind==='pop'){osc('sine',380,900,.12,.55);osc('triangle',190,420,.08,.2)}
  else if(kind==='whoosh'){noise(.38,400,2600,.5,.9)}
  else if(kind==='swish'){noise(.2,1800,600,.35,1.4)}
  else if(kind==='boing'){osc('sine',220,520,.26,.4);osc('sine',440,1040,.18,.12)}
  else if(kind==='poof'){noise(.32,900,200,.55,.6)}
  else if(kind==='thud'){osc('sine',140,48,.22,.7);noise(.12,300,120,.3,.8)}
  else if(kind==='click'){osc('square',1400,900,.03,.12)}
  else if(kind==='sparkle'){[1568,2093,2637].forEach((f,i)=>tone(f,.5,.12*vol,t+i*.07))}
  else if(kind==='tick'){osc('triangle',2200,1800,.04,.18)}
  else if(kind==='type'){noise(.03,3000,2500,.14,2)}
};
window.AUDIO=A;

/* ---------- director: every scene step goes through it, so Skip / Home cancel cleanly ---------- */
class Cancel extends Error{}
const D={gen:0,live:new Set(),timers:new Set()};
D.Cancel=Cancel;
D.cancel=function(){D.gen++;D.live.forEach(t=>t.kill());D.live.clear();D.timers.forEach(clearTimeout);D.timers.clear();A.stopVoice();Captions.hide(true);D.speakers.forEach(c=>c.quiet());D.speakers.clear()};
D.check=function(g){if(g!==D.gen)throw new Cancel()};
D.wait=function(sec){const g=D.gen;return new Promise((ok,no)=>{const id=setTimeout(()=>{D.timers.delete(id);g===D.gen?ok():no(new Cancel())},sec*1000);D.timers.add(id)})};
/* play a GSAP timeline and wait for it */
D.tl=function(tl){const g=D.gen;D.live.add(tl);return new Promise((ok,no)=>{tl.eventCallback('onComplete',()=>{D.live.delete(tl);g===D.gen?ok():no(new Cancel())});if(tl.progress()===1)ok()})};
D.speakers=new Set();
/* a cat says a line: audio, lip sync, captions; resolves when the line ends */
D.say=async function(cat,id,{hold=.15,face}={}){
  const g=D.gen,v=window.VOICE[id];if(!v){console.warn('no line',id);return}
  if(face)cat.setFace(face);
  D.speakers.add(cat);
  let started=false;
  const done=A.play(id,clock=>{started=true;D.check(g);cat.speak(v.cues,clock);Captions.show(v,clock,cat)});
  const timeout=new Promise(ok=>setTimeout(ok,(v.dur+1.5)*1000));
  await Promise.race([done,timeout]);
  cat.quiet();D.speakers.delete(cat);setTimeout(()=>{if(Captions.cur===v)Captions.hide()},380);D.check(g);
  if(!started)await D.wait(v.dur); // no audio (blocked or muted before load): keep the pacing
  await D.wait(hold);
};
window.DIRECTOR=D;

/* ---------- captions: words light up as they're spoken; foreign words show English on hover ---------- */
const Captions={on:true,el:null,raf:0};
Captions.init=function(){Captions.el=$('#captions');try{Captions.on=localStorage.getItem('linguae-cc')!=='0'}catch(e){}Captions.el.classList.toggle('off',!Captions.on)};
/* Subtitles live in their own band under the picture, so they never cover anything. Long lines are split into
   short chunks, the way real subtitles are, and only the chunk being spoken is shown. */
Captions.chunkChars=()=>window.STAGE&&STAGE.phone?44:84;
Captions.show=function(v,clock,cat){
  const E=Captions.el;if(!E)return;cancelAnimationFrame(Captions.raf);Captions.cur=v;
  const line=E.querySelector('.capline'),C=window.CATS.chars[v.who];
  // words of the caption (foreign words stay whole, keeping their English hover)
  // a word can mix a foreign word and the punctuation after it ("Imperātor,"), so a word is a list of nodes
  const tmp=document.createElement('div');tmp.innerHTML=v.cap;const words=[];let glue=false;
  tmp.childNodes.forEach(n=>{
    if(n.nodeType!==3){if(glue&&words.length)words[words.length-1].push(n);else words.push([n]);glue=true;return}
    const t=n.textContent,parts=t.split(/\s+/);
    parts.forEach((w,i)=>{if(!w)return;if(i===0&&glue&&!/^\s/.test(t)&&words.length)words[words.length-1].push(document.createTextNode(w));else words.push([document.createTextNode(w)])});
    glue=!/\s$/.test(t);});
  const wtext=w=>w.map(x=>x.textContent).join('');
  // the timing list counts plain words; map each caption word to a start time
  const T=v.words,k=T.length/Math.max(1,words.length),t0=i=>T[Math.min(T.length-1,Math.floor(i*k))]||0;
  // chunk: break before the limit, preferring the end of a phrase
  const max=Captions.chunkChars(),chunks=[];let cur=[],len=0;
  words.forEach((w,i)=>{const L=wtext(w).length+1;if(cur.length&&len+L>max){chunks.push(cur);cur=[];len=0}cur.push(i);len+=L;
    if(/[.!?;:]$/.test(wtext(w))&&len>max*.55){chunks.push(cur);cur=[];len=0}});
  if(cur.length)chunks.push(cur);
  let shown=-1;
  const render=ci=>{shown=ci;line.innerHTML='';const who=document.createElement('b');who.className='who';who.style.setProperty('--c',C.color);who.textContent=C.name;line.append(who);
    const p=document.createElement('span');p.className='txt';chunks[ci].forEach((wi,j)=>{if(j)p.append(' ');const s=document.createElement('span');s.className='w';s.dataset.i=wi;words[wi].forEach(x=>s.append(x.cloneNode(true)));p.append(s)});line.append(p)};
  E.classList.toggle('off',!Captions.on);E.classList.add('show');
  const tick=()=>{const t=clock()+.05;let ci=0;for(let c=0;c<chunks.length;c++)if(t>=t0(chunks[c][0])-.08)ci=c;
    if(ci!==shown)render(ci);
    line.querySelectorAll('.w').forEach(s=>s.classList.toggle('said',t>=t0(+s.dataset.i)));
    if(t<v.dur)Captions.raf=requestAnimationFrame(tick);else line.querySelectorAll('.w').forEach(s=>s.classList.add('said'))};
  tick();
};
Captions.hide=function(now){cancelAnimationFrame(Captions.raf);Captions.cur=null;if(Captions.el)Captions.el.classList.remove('show')};
Captions.toggle=function(){Captions.on=!Captions.on;try{localStorage.setItem('linguae-cc',Captions.on?'1':'0')}catch(e){}if(Captions.el)Captions.el.classList.toggle('off',!Captions.on);return Captions.on};
window.CAPTIONS=Captions;

/* ---------- line boil: re-seed the rough filter about 8 times a second, like redrawn animation frames ---------- */
let boilT=0;
function boil(){const t=document.getElementById('boilNoise');if(!t)return;const seeds=[3,7,11,5];let i=0;
  clearInterval(boilT);if(window.REDUCED)return;boilT=setInterval(()=>{if(!document.hidden)t.setAttribute('seed',seeds[i++%seeds.length])},125)}
window.startBoil=boil;window.stopBoil=()=>clearInterval(boilT);

/* ---------- stage layout: world units with (0,0) at the center; a 1000 x 900 safe area always fits ---------- */
/* Two versions of the intro, same audio: "desktop" (landscape, side-by-side staging) and "phone" (portrait,
   stacked staging). It's picked from the screen shape; ?v=phone or ?v=desktop forces one. World units have (0,0) at
   the center of the stage area, and the version's design box (desktop 1000 x 800, phone 600 x 1000) always fits. */
const Stage={svg:null,cam:null,W:1000,H:800,phone:false,mode:'desktop'};
Stage.force=(new URLSearchParams(location.search).get('v')||'').toLowerCase();
Stage.init=function(){Stage.svg=$('#stage');Stage.cam=$('#cam');Stage.wrap=$('#stageWrap');Stage.layout();addEventListener('resize',Stage.layout)};
Stage.pickMode=function(){if(Stage.force==='phone'||Stage.force==='desktop')return Stage.force;return(innerWidth<720||innerHeight>innerWidth*1.05)?'phone':'desktop'};
Stage.layout=function(){
  const mode=Stage.pickMode();Stage.mode=mode;Stage.phone=mode==='phone';
  document.documentElement.classList.toggle('phone',Stage.phone);document.documentElement.classList.toggle('desktop',!Stage.phone);
  const r=Stage.wrap.getBoundingClientRect(),w=Math.max(1,r.width),h=Math.max(1,r.height);
  const BW=Stage.phone?600:1000,BH=Stage.phone?1000:800,s=Math.min(w/BW,h/BH),W=w/s,H=h/s;
  Stage.W=W;Stage.H=H;Stage.px=s;
  Stage.svg.setAttribute('viewBox',`${-W/2} ${-H/2} ${W} ${H}`);
  Stage.onLayout&&Stage.onLayout();
};
Stage.shake=function(amt=8,d=.35){if(window.REDUCED)return;const S=document.getElementById('shake'),tl=gsap.timeline();for(let i=0;i<6;i++)tl.to(S,{x:(Math.random()-.5)*amt*(1-i/6),y:(Math.random()-.5)*amt*(1-i/6),duration:d/6,ease:'none'});tl.to(S,{x:0,y:0,duration:.08});return tl};
window.STAGE=Stage;
})();
