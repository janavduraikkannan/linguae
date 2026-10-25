/* Linguae intro player. The intro is pre-rendered video (tools/render/), in two versions (desktop and phone), cut
   into parts: the opening up to the language question, one tour per language up to "Continue?", and the short
   endings. Questions, captions, buttons and music are live on top, so they stay sharp, can be clicked, and the
   music keeps going while a question waits. Each answer starts the next part. */
(function(){
const $=s=>document.querySelector(s);
const A=window.AUDIO,CAP=window.CAPTIONS,M=window.INTRO_VIDEOS;
const SITE_BY=Object.fromEntries(SITES.map(s=>[s.id,s]));
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
/* the background colours of each scene, so the space around the picture matches it */
const BAND={sunburst:['#ECE3D0',null],latin:['#EADFC6','#D8C59E'],spanish:['#F1DDC2','#E2B98C'],french:['#E3E6EC','#C9CDBF'],german:['#DDE7E4','#A9BE8E']};

let ver='desktop',V=null,vids=[],cur=null,seg=null,segName='',raf=0,askShown=false,lineOn=null,onDone=null,running=false,flash=null;

function pick(){const f=(new URLSearchParams(location.search).get('v')||'').toLowerCase();
  if(f==='phone'||f==='desktop')return f;return(innerWidth<720||innerHeight>innerWidth*1.05)?'phone':'desktop'}
function setVersion(){ver=pick();V=M[ver];document.documentElement.classList.toggle('phone',ver==='phone');document.documentElement.classList.toggle('desktop',ver!=='phone');window.STAGE.phone=ver==='phone'}
const EXT=/[?&]vtest\b/.test(location.search)?'webm':'mp4'; // ?vtest: WebM copies, for testing in browsers without H.264
const src=name=>`video/${ver}/${name}.${EXT}`;

/* fit the picture in the space above the captions; the question layer is drawn at the video's own size and scaled */
function layout(){
  const w=$('#stageWrap').getBoundingClientRect(),k=Math.min(w.width/V.w,w.height/V.h),bw=V.w*k,bh=V.h*k;
  const b=$('#vbox');Object.assign(b.style,{width:bw+'px',height:bh+'px',left:(w.width-bw)/2+'px',top:(w.height-bh)/2+'px'});
  const o=$('#ovl');Object.assign(o.style,{width:V.w+'px',height:V.h+'px',transform:`scale(${k})`});
  b.classList.toggle('edges',bw<w.width-2||bh<w.height-2);
}
function band(t){if(!seg)return;let kind='sunburst';for(const [k,at] of seg.bg)if(t>=at)kind=k;const [c,g]=BAND[kind]||BAND.sunburst;
  const bg=g?`linear-gradient(to top,${g} 0 5.5%,${c} 5.5%)`:c;const w=$('#stageWrap');if(w.dataset.bg!==kind){w.dataset.bg=kind;w.style.background=bg}}

/* two video elements take turns, so the next part is already playing before the last one is hidden */
function other(){return vids[0]===cur?vids[1]:vids[0]}
function show(el){if(cur&&cur!==el){const old=cur;requestAnimationFrame(()=>{old.classList.remove('on');old.pause()})}el.classList.add('on');cur=el}
function playSeg(name){
  const s=V.segs[name];if(!s){finish('home');return}
  hideAsk();CAP.hide();lineOn=null;A.duck(false);
  seg=s;segName=name;askShown=false;
  const el=other();el.loop=false;el.muted=A.muted;el.dataset.part=name;
  if(el.getAttribute('src')!==src(name))el.setAttribute('src',src(name));
  try{el.currentTime=0}catch(e){}
  const p=el.play();                       // called straight from the click, so phones allow sound
  const go=()=>{show(el);band(0);tick()};
  if(p&&p.then)p.then(go).catch(()=>{el.muted=true;el.play().then(go).catch(()=>finish('home'))});else go();
  $('#bSkip').hidden=!s.ask;
}
/* while a question waits, a short silent loop of the last moment plays (it runs back and forth, so it never jumps) */
function hold(){
  if(!seg||!seg.hold)return;CAP.hide();lineOn=null;A.duck(false);const el=other();el.loop=true;el.muted=true;el.setAttribute('src',src(segName+'-hold'));el.dataset.part=segName+'-hold';
  el.play().then(()=>show(el)).catch(()=>{});
}
function ended(e){
  if(e.target!==cur||cur.loop)return;
  if(seg.ask){if(!askShown)showAsk();hold()}else if(seg.done)finish(seg.done==='site'?'site':'home',seg.done==='site'?SITE_BY[segName.split('-')[1]].url:null);
}

/* captions and music ducking follow the video's clock */
function tick(){
  cancelAnimationFrame(raf);
  const loop=()=>{
    if(!seg||!cur){return}
    if(cur.dataset.part===segName){
      const t=cur.currentTime;band(t);
      let on=null;for(const [id,at] of seg.lines){const v=window.VOICE[id];if(v&&t>=at-.02&&t<at+v.dur+.38&&!seg.stops.some(s=>s>at&&s<=t))on=[id,at]}
      const key=on&&on.join('@');
      if(key!==lineOn){lineOn=key;if(on){const [id,at]=on;CAP.show(window.VOICE[id],()=>cur.currentTime-at,null);A.duck(true)}else{CAP.hide();A.duck(false)}}
      if(seg.ask&&!askShown&&t>=seg.ask.t)showAsk();
    }
    raf=requestAnimationFrame(loop)};
  loop();
}

/* ---------- the questions ---------- */
function faceImg(cat,mood='happy'){return `<img class="face" src="art/${cat}/face-${mood}.svg" alt="">`}
function showAsk(){
  askShown=true;const a=$('#ask'),kind=seg.ask.kind;
  if(kind==='lang'){
    a.innerHTML=`<p class="q">So, which language are you learning?</p><div class="langs">${SITES.map(s=>`<button type="button" data-v="${s.id}" class="lang">${faceImg(s.cat)}<span><b>${s.lang}</b><small>${s.site}${s.live?'':' · coming soon'}</small></span></button>`).join('')}</div>`;
    a.className='ask ask-lang';
    a.querySelectorAll('.lang').forEach(b=>{b.onclick=()=>{A.fx('click');playSeg('tour-'+b.dataset.v)};
      // start fetching a tour as soon as it looks likely
      b.onpointerenter=b.ontouchstart=()=>prefetch('tour-'+b.dataset.v)});
  }else{
    const lang=segName.split('-')[1],site=SITE_BY[lang];
    a.innerHTML=`<p class="q">Continue to ${esc(site.site)}?</p><div class="yn">
      <button type="button" data-v="yes" class="btn big"${site.live?'':' disabled aria-disabled="true"'}>Yes, go to ${esc(site.site)}</button>
      <button type="button" data-v="no" class="btn ghostbtn big">No, go to homepage</button></div>
      ${site.live?'':`<p class="note">${esc(site.site)} hasn’t been built yet. It’s coming soon!</p>`}`;
    a.className='ask ask-cont';
    a.querySelectorAll('.yn button').forEach(b=>b.onclick=()=>{if(b.disabled)return;A.fx('click');playSeg((b.dataset.v==='yes'?'yes-':'home-')+lang)});
    prefetch('home-'+lang);if(site.live)prefetch('yes-'+lang);
  }
  a.hidden=false;$('#bSkip').hidden=true;
  gsap.fromTo(a,{y:30,opacity:0},{y:0,opacity:1,duration:.45,ease:'back.out(1.8)'});
  gsap.from(a.querySelectorAll('button,.note'),{y:14,opacity:0,stagger:.06,duration:.35,delay:.12,ease:'back.out(2)'});
}
function hideAsk(){const a=$('#ask');if(a.hidden)return;gsap.killTweensOf(a);a.hidden=true;a.innerHTML=''}
const fetched=new Set();
function prefetch(name){if(fetched.has(name)||!V.segs[name])return;fetched.add(name);const l=document.createElement('link');l.rel='prefetch';l.href=src(name);document.head.append(l)}

/* ---------- skip, finish ---------- */
function skip(){
  if(!seg||!seg.ask||askShown||cur.dataset.part!==segName)return;
  A.fx('swish',.5);gsap.fromTo(flash,{opacity:.85},{opacity:0,duration:.35});
  try{cur.currentTime=Math.max(0,seg.ask.t-.05)}catch(e){}
}
function finish(kind,url){
  try{localStorage.setItem('linguae-intro-seen','1')}catch(e){}
  running=false;cancelAnimationFrame(raf);hideAsk();CAP.hide();A.stopMusic();
  if(kind==='site'&&url){gsap.to(flash,{opacity:1,duration:.4,onComplete:()=>location.href=url});return}
  const I=$('#intro');gsap.to(I,{opacity:0,duration:.5,onComplete:()=>{I.hidden=true;gsap.set(I,{opacity:1});vids.forEach(v=>{v.pause();v.removeAttribute('src');v.load();v.classList.remove('on')});cur=null;seg=null;
    document.body.classList.remove('watching');onDone&&onDone()}});
}

/* ---------- start ---------- */
function init(){
  // the cats' shared shapes (clip paths, gradients), used by the homepage line-up
  document.getElementById('defsShared').insertAdjacentHTML('beforeend',window.CATS.defs);
  vids=[$('#vA'),$('#vB')];vids.forEach(v=>{v.addEventListener('ended',ended);v.addEventListener('error',()=>{if(v===cur&&running&&!v.loop)finish('home')})});
  flash=document.createElement('div');flash.id='flash';flash.className='flash';$('#intro').append(flash);
  CAP.init();
  $('#bSkip').onclick=skip;$('#bHome').onclick=()=>{A.fx('click');finish('home')};
  const cc=$('#bCC');cc.setAttribute('aria-pressed',CAP.on);cc.onclick=()=>{cc.setAttribute('aria-pressed',CAP.toggle());requestAnimationFrame(layout)};
  const mu=$('#bMute');mu.onclick=()=>{A.init();A.setMute(!A.muted);vids.forEach(v=>{if(!v.loop)v.muted=A.muted});mu.setAttribute('aria-pressed',A.muted)};
  $('#gateGo').onclick=start;
  addEventListener('resize',()=>{if(!$('#intro').hidden)layout()});
  addEventListener('keydown',e=>{if($('#intro').hidden)return;if(e.key==='Escape')finish('home')});
}
function open(cb){
  onDone=cb;setVersion();const I=$('#intro');I.hidden=false;gsap.set(I,{opacity:1});document.body.classList.add('watching');
  layout();seg=V.segs.intro;band(0);seg=null;
  const gate=$('#gate');gate.hidden=false;gsap.set(gate,{opacity:1});
  // the first frame waits under the start screen, already loading
  const el=vids[0];el.loop=false;el.setAttribute('src',src('intro'));el.preload='auto';el.classList.add('on');cur=el;el.dataset.part='';
  $('#bSkip').hidden=false;
}
function start(){
  running=true;A.init();if(A.ctx&&A.ctx.state==='suspended')A.ctx.resume().catch(()=>{});
  $('#bMute').setAttribute('aria-pressed',A.muted);
  const gate=$('#gate');gsap.to(gate,{opacity:0,duration:.35,onComplete:()=>gate.hidden=true});
  // unlock both players inside the tap (phones only allow sound in a video the visitor started)
  const el=vids[0],o=vids[1];o.muted=true;o.setAttribute('src',src('intro-hold'));o.play().then(()=>o.pause()).catch(()=>{});
  seg=V.segs.intro;segName='intro';askShown=false;lineOn=null;el.dataset.part='intro';el.muted=A.muted;
  const p=el.play();
  // the music starts with the picture (the opening's swaps land on its beat)
  const music=A.ctx?A.load('music'):Promise.resolve();
  Promise.all([p,music]).then(()=>{try{el.currentTime=0}catch(e){}A.startMusic();show(el);band(0);tick()})
    .catch(()=>{el.muted=true;el.play().then(()=>{A.startMusic();show(el);tick()}).catch(()=>finish('home'))});
  $('#bSkip').hidden=false;
}
window.INTRO={init,open,done:finish};
})();
