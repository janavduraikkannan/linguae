/* Linguae intro: Fēlix's name-swap opening, the tour of the sites, and the two questions.
   Built live in the browser so it can branch, skip and stay sharp: GSAP moves the rigged cats (js/rig.js),
   js/stage.js handles sound, captions and cancelling. */
(function(){
const NS='http://www.w3.org/2000/svg',$=s=>document.querySelector(s);
const D=window.DIRECTOR,A=window.AUDIO,S=window.STAGE,CAP=window.CAPTIONS,CATS=window.CATS;
const R=()=>window.REDUCED;
const svgEl=(tag,attrs={},html)=>{const e=document.createElementNS(NS,tag);for(const k in attrs)e.setAttribute(k,attrs[k]);if(html!=null)e.innerHTML=html;return e};
const rnd=(a,b)=>a+Math.random()*(b-a);
const ORDER=['felix','felicisimo','felicien','frohlix'];
const SITE_OF={felix:'la',felicisimo:'es',felicien:'fr',frohlix:'de'};
let cats={},layers={},state={scene:'',lang:null};

/* ------------------------------------------------------------------ helpers */
function catAt(id,x,y,s){const c=cats[id]||(cats[id]=new Cat(id,layers.world));c.root.style.display='';c.place(x,y,s);c.pos={x,y,s};return c}
function freshCats(){Object.values(cats).forEach(c=>c.remove());cats={}}
function hideCat(id){const c=cats[id];if(c){c.root.style.display='none';c.idle(false)}}
function moveCat(c,x,y,s,d=.6,ease='power3.inOut'){c.pos={x,y,s};return gsap.to(c.root,{x:x-120*s,y:y-240*s,scale:s,duration:d,ease})}
/* Where things go, per version. Desktop stages side by side; phone stacks top to bottom. Both stop at the bottom
   of the stage area, which ends above the subtitle band. */
function heroSpot(){const H=S.H;return S.phone?{x:0,y:H/2+6,s:2.05}:{x:0,y:H/2+6,s:1.7}}
function tourSpot(){const W=S.W,H=S.H;return S.phone?{x:0,y:-H/2+H*.37,s:Math.min(1.3,H*.33/240)}:{x:-W/2+W*.22,y:H/2+6,s:1.55}}
function lineupSpots(){
  const W=S.W,H=S.H;
  if(S.phone){const y2=H/2-96,y1=y2-330,s=.92;return[[-150,y1,s],[150,y1,s],[-150,y2,s],[150,y2,s]]}
  const gap=Math.min(250,W/4.3),y=H/2-100,s=1;return[-1.5,-.5,.5,1.5].map(i=>[i*gap,y,s]);
}
/* phone only: during the language question the cats shrink into one row under the buttons */
function askRowSpots(){const H=S.H;return[-1.5,-.5,.5,1.5].map(i=>[i*148,H/2+4,.52])}
function fx(kind,v){A.fx(kind,v)}
function puff(x,y,n=8,col='#FFF8EA',r=26,spread=110){
  for(let i=0;i<n;i++){const a=Math.PI*2*i/n+rnd(-.3,.3),c=svgEl('circle',{cx:x,cy:y,r:r*rnd(.6,1.1),fill:col,stroke:'#2A2420','stroke-width':4,filter:'url(#boil)'});layers.front.append(c);
    gsap.fromTo(c,{scale:.2,transformOrigin:'50% 50%'},{scale:1,x:Math.cos(a)*spread*rnd(.6,1),y:Math.sin(a)*spread*rnd(.4,.8)-20,opacity:0,duration:rnd(.45,.7),ease:'power2.out',onComplete:()=>c.remove()})}
}
function sparkles(x,y,n=5,spread=200){
  for(let i=0;i<n;i++){const g=svgEl('g',{},CATS.props.sparkle);layers.front.append(g);const s=rnd(1.1,2);
    gsap.fromTo(g,{x,y,scale:0,rotation:0,transformOrigin:'50% 50%'},{x:x+rnd(-spread,spread),y:y+rnd(-spread,spread*.4),scale:s,rotation:rnd(-90,90),duration:.5,ease:'back.out(2)',delay:i*.04});
    gsap.to(g,{scale:0,opacity:0,duration:.35,delay:.75+i*.04,onComplete:()=>g.remove()})}
}
function smear(on,amt=14){if(R())return;gsap.to('#smearBlur',{attr:{stdDeviation:on?`${amt} 0`:'0 0'},duration:on?.06:.12})}
/* hard cut or eased move of the camera between framings, like an editor reframing between sentences */
function frame(scale=1,x=0,y=0,d=0,ease='power2.inOut'){if(d===0||R()){gsap.set(S.cam,{scale,x,y,svgOrigin:'0 0'});return null}return gsap.to(S.cam,{scale,x,y,svgOrigin:'0 0',duration:d,ease})}

/* ------------------------------------------------------------------ backgrounds, drawn in code */
const BG={
  base(c1,c2){const W=S.W*1.4,H=S.H*1.4;return `<rect x="${-W/2}" y="${-H/2}" width="${W}" height="${H}" fill="${c1}"/><ellipse cx="0" cy="${-H*.08}" rx="${W*.42}" ry="${H*.36}" fill="${c2}" opacity=".7" filter="url(#soft)"/>`},
  rays(col){let s='';for(let i=0;i<18;i++){const a=i*20;s+=`<path d="M0,0 L-70,-1600 L70,-1600 Z" transform="rotate(${a})" fill="${col}" opacity=".16"/>`}return `<g class="rays">${s}</g>`},
  ground(y,col){const W=S.W*1.4;return `<path d="M${-W/2},${y} C${-W/4},${y-24} ${W/4},${y+20} ${W/2},${y-6} L${W/2},${S.H} L${-W/2},${S.H} Z" fill="${col}" stroke="#2A2420" stroke-width="4" filter="url(#boil)"/>`},
  latin(){const y=S.H/2-40;let s=BG.base('#EADFC6','#F6EEDC');
    // a row of columns with a pediment, far back
    let cols='';for(let i=-4;i<=4;i++){const x=i*150;cols+=`<rect x="${x-26}" y="-170" width="52" height="420" fill="#E2D3B2" stroke="#8C7A5B" stroke-width="4"/><rect x="${x-38}" y="-192" width="76" height="24" fill="#E2D3B2" stroke="#8C7A5B" stroke-width="4"/>`+[0,1,2].map(k=>`<line x1="${x-12+k*12}" y1="-160" x2="${x-12+k*12}" y2="240" stroke="#C9B48A" stroke-width="3"/>`).join('')}
    s+=`<g class="far" opacity=".55" filter="url(#boil)"><path d="M-720,-200 L0,-340 L720,-200 Z" fill="#E2D3B2" stroke="#8C7A5B" stroke-width="4"/><rect x="-720" y="-212" width="1440" height="22" fill="#E2D3B2" stroke="#8C7A5B" stroke-width="4"/>${cols}</g>`;
    return s+BG.ground(y,'#D8C59E')},
  spanish(){const y=S.H/2-40;let s=BG.base('#F1DDC2','#FBEBD3');
    s+=`<circle class="sun" cx="${S.W*.32}" cy="${-S.H*.3}" r="90" fill="#F2B544" stroke="#2A2420" stroke-width="4" opacity=".75" filter="url(#boil)"/>`;
    let arches='';for(let i=-4;i<=4;i++){const x=i*170;arches+=`<path d="M${x-70},260 L${x-70},-40 A70,70 0 0 1 ${x+70},-40 L${x+70},260" fill="#F7EEE0" stroke="#A67C52" stroke-width="5"/>`}
    s+=`<g class="far" opacity=".6" filter="url(#boil)"><rect x="-800" y="-150" width="1600" height="420" fill="#FBF5EA" stroke="#A67C52" stroke-width="5"/>${arches}<path d="M-820,-150 L820,-150 L780,-196 L-780,-196 Z" fill="#C8693E" stroke="#7E3A1E" stroke-width="5"/></g>`;
    return s+BG.ground(y,'#E2B98C')},
  french(){const y=S.H/2-40;let s=BG.base('#E3E6EC','#F3F2EE');
    let roofs='';for(let i=-5;i<=5;i++){const x=i*140,h=rnd(120,210);roofs+=`<path d="M${x-70},260 L${x-70},${-h+60} L${x-50},${-h} L${x+50},${-h} L${x+70},${-h+60} L${x+70},260 Z" fill="#F4EFE6" stroke="#5E6A80" stroke-width="4"/><path d="M${x-50},${-h} L${x+50},${-h} L${x+70},${-h+60} L${x-70},${-h+60} Z" fill="#7D8BA3" stroke="#3E4A60" stroke-width="4"/><rect x="${x+20}" y="${-h-34}" width="16" height="36" fill="#B9846A" stroke="#3E4A60" stroke-width="3"/>`+[0,1].map(k=>`<rect x="${x-40+k*48}" y="${-h+90}" width="30" height="46" fill="#C9D6E8" stroke="#5E6A80" stroke-width="3"/>`).join('')}
    s+=`<g class="far" opacity=".42" filter="url(#boil)"><path d="M${S.W*.3-60},230 L${S.W*.3-8},-330 L${S.W*.3+8},-330 L${S.W*.3+60},230 M${S.W*.3-34},20 L${S.W*.3+34},20 M${S.W*.3-20},-140 L${S.W*.3+20},-140" fill="none" stroke="#4A5670" stroke-width="7" stroke-linejoin="round"/></g><g class="far" opacity=".55" filter="url(#boil)">${roofs}</g>`;
    return s+BG.ground(y,'#C9CDBF')},
  german(){const y=S.H/2-40;let s=BG.base('#DDE7E4','#F1F4EE');
    s+=`<g class="far" opacity=".55" filter="url(#boil)"><path d="M-900,180 L-520,-260 L-300,0 L-60,-330 L220,20 L460,-240 L900,160 L900,300 L-900,300 Z" fill="#B9C7BF" stroke="#4E5E56" stroke-width="5"/><path d="M-580,-190 L-520,-260 L-460,-188 L-500,-170 L-540,-196 Z M-120,-260 L-60,-330 L0,-262 L-30,-236 L-80,-270 Z M400,-170 L460,-240 L520,-172 L480,-150 L440,-182 Z" fill="#FFFDF6" stroke="#4E5E56" stroke-width="4"/></g>`;
    const hx=-S.W*.34;s+=`<g class="mid" opacity=".7" filter="url(#boil)"><rect x="${hx-90}" y="40" width="180" height="200" fill="#FBF5E9" stroke="#5A3820" stroke-width="5"/><path d="M${hx-110},50 L${hx},-50 L${hx+110},50 Z" fill="#A9442A" stroke="#5A3820" stroke-width="5"/><path d="M${hx-90},120 L${hx+90},120 M${hx-30},40 L${hx-30},240 M${hx+30},40 L${hx+30},240 M${hx-90},40 L${hx-30},120 M${hx+90},40 L${hx+30},120" stroke="#5A3820" stroke-width="7"/></g>`;
    return s+BG.ground(y,'#A9BE8E')},
  sunburst(){return BG.base('#ECE3D0','#F8F1E1')+BG.rays('#E0C99A')},
};
let bgTweens=[];
function setBg(kind,cut=true){
  bgTweens.forEach(t=>t.kill());bgTweens=[];
  const g=layers.bg,old=g.firstElementChild,n=svgEl('g',{},BG[kind]());
  if(old&&!cut){g.append(n);gsap.fromTo(n,{opacity:0},{opacity:1,duration:.5,onComplete:()=>old.remove()})}else{g.innerHTML='';g.append(n)}
  if(!R()){const r=n.querySelector('.rays');if(r)bgTweens.push(gsap.to(r,{rotation:360,duration:160,repeat:-1,ease:'none',svgOrigin:'0 0'}));
    n.querySelectorAll('.far').forEach(f=>bgTweens.push(gsap.fromTo(f,{x:-14},{x:14,duration:14,yoyo:true,repeat:-1,ease:'sine.inOut'})));
    const sun=n.querySelector('.sun');if(sun)bgTweens.push(gsap.to(sun,{y:-10,duration:5,yoyo:true,repeat:-1,ease:'sine.inOut'}))}
}

/* ------------------------------------------------------------------ the name behind the cat */
let nameG=null;
function nameOut(){if(!nameG)return;const g=nameG;nameG=null;
  gsap.to(g.querySelectorAll('text'),{y:'+=90',rotation:()=>rnd(-25,25),opacity:0,duration:.28,ease:'power2.in',stagger:{each:.012,from:'center'},onComplete:()=>g.remove()})}
function nameIn(text,color,y){
  nameOut();
  const g=svgEl('g',{class:'bigname'});layers.back.append(g);nameG=g;
  const probe=svgEl('text',{x:0,y:0,'text-anchor':'middle','font-family':'Fraunces, Georgia, serif','font-weight':900,'font-size':300},'');probe.textContent=text;g.append(probe);
  let w=probe.getComputedTextLength()||text.length*170;const maxW=Math.min(S.W*.94,1500),k=Math.min(1,maxW/w);
  const fs=300*k;probe.setAttribute('font-size',fs);w=probe.getComputedTextLength()||w*k;
  const chars=[...text],xs=[];for(let i=0;i<chars.length;i++){try{xs.push(probe.getStartPositionOfChar(i).x)}catch(e){xs.push(-w/2+i*w/chars.length)}}
  probe.remove();
  chars.forEach((ch,i)=>{const t=svgEl('text',{x:xs[i],y:y,'font-family':'Fraunces, Georgia, serif','font-weight':900,'font-size':fs,fill:color,stroke:'#2A2420','stroke-width':Math.max(4,fs*.022),'paint-order':'stroke'});t.textContent=ch;g.append(t)});
  const ts=g.querySelectorAll('text');
  gsap.fromTo(ts,{scale:0,y:'+=40',transformOrigin:'50% 80%',rotation:()=>rnd(-14,14)},{scale:1,y:'-=40',rotation:0,duration:.42,ease:'back.out(2.2)',stagger:{each:.025,from:'center'}});
  return g;
}

/* ------------------------------------------------------------------ swap transitions (each one different) */
async function swapSpin(from,to){
  fx('swish');smear(true,10);
  await D.tl(gsap.timeline().to(from.flip,{scaleX:.04,duration:.1,ease:'power2.in'}));
  from.root.style.display='none';to.root.style.display='';to.setFace('delighted');gsap.set(to.flip,{scaleX:.04});smear(false);
  fx('pop');sparkles(0,heroSpot().y-300,4,260);
  await D.tl(gsap.timeline().to(to.flip,{scaleX:1,duration:.32,ease:'back.out(3)'}));
}
async function swapHop(from,to){
  const H=S.H;fx('boing',.8);
  await D.tl(gsap.timeline().to(from.squash,{scaleY:.84,scaleX:1.1,duration:.07,ease:'power2.out'}).to(from.squash,{y:-H*1.2,scaleY:1.25,scaleX:.85,duration:.16,ease:'power2.in'}));
  from.root.style.display='none';gsap.set(from.squash,{y:0,scaleX:1,scaleY:1});
  to.root.style.display='';to.setFace('excited');gsap.set(to.squash,{y:-H*1.2,scaleY:1.25,scaleX:.85});fx('whoosh',.6);
  await D.tl(gsap.timeline().to(to.squash,{y:0,duration:.2,ease:'power2.in'}));
  fx('thud',.7);const h=heroSpot();puff(h.x-150,h.y-20,4,'#F3E7CF',22,90);puff(h.x+150,h.y-20,4,'#F3E7CF',22,90);
  await D.tl(gsap.timeline().to(to.squash,{scaleY:.82,scaleX:1.14,duration:.06}).to(to.squash,{scaleY:1,scaleX:1,duration:.4,ease:'elastic.out(1,.4)'}));
}
async function swapPoof(from,to){
  const h=heroSpot();fx('poof');
  const cloud=svgEl('g',{filter:'url(#boil)'});layers.front.append(cloud);
  for(let i=0;i<11;i++){const a=i/11*Math.PI*2,c=svgEl('circle',{cx:h.x+Math.cos(a)*150*rnd(.6,1),cy:h.y-250+Math.sin(a)*190*rnd(.6,1),r:rnd(80,125),fill:'#FFF8EA',stroke:'#2A2420','stroke-width':5});cloud.append(c)}
  gsap.set(cloud.children,{scale:0,transformOrigin:'50% 50%'});
  await D.tl(gsap.timeline().to(cloud.children,{scale:1,duration:.16,ease:'back.out(2)',stagger:.012}));
  from.root.style.display='none';to.root.style.display='';to.setFace('proud');
  await D.wait(.05);
  gsap.to(cloud.children,{scale:1.3,opacity:0,duration:.45,ease:'power2.out',stagger:.01,onComplete:()=>cloud.remove()});
  sparkles(h.x,h.y-320,5,280);
}
async function swapBack(from,to){
  // the last one: a hop with a spin in mid-air, landing as Fēlix with a stomp
  const tl=gsap.timeline();fx('boing',.7);
  tl.to(from.squash,{scaleY:.85,scaleX:1.1,duration:.08}).to(from.squash,{y:-200,scaleY:1.08,scaleX:.95,duration:.2,ease:'power2.out'}).to(from.flip,{scaleX:.04,duration:.1,ease:'power1.in'},'-=.08');
  await D.tl(tl);
  from.root.style.display='none';gsap.set(from.squash,{y:0,scaleX:1,scaleY:1});gsap.set(from.flip,{scaleX:1});
  to.root.style.display='';to.setFace('proud');gsap.set(to.squash,{y:-200,scaleY:1.08,scaleX:.95});gsap.set(to.flip,{scaleX:.04});fx('swish',.6);
  await D.tl(gsap.timeline().to(to.flip,{scaleX:1,duration:.12,ease:'power1.out'}).to(to.squash,{y:0,duration:.18,ease:'power2.in'},'<'));
  fx('thud');S.shake(16,.4);const h=heroSpot();puff(h.x-170,h.y-10,5,'#F3E7CF',26,120);puff(h.x+170,h.y-10,5,'#F3E7CF',26,120);sparkles(h.x,h.y-380,7,360);fx('sparkle',.8);
  await D.tl(gsap.timeline().to(to.squash,{scaleY:.8,scaleX:1.16,duration:.07}).to(to.squash,{scaleY:1,scaleX:1,duration:.5,ease:'elastic.out(1.1,.35)'}));
}

/* ------------------------------------------------------------------ HTML panels (the "screens" of each site) */
const P={el:null};
function esc(s){return String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
function faceImg(cat,mood='happy'){return `<img class="face" src="art/${cat}/face-${mood}.svg" alt="">`}
let panelN=0;
async function panel(html,{cls='',enter}={}){
  const old=P.el.querySelector('.pnl:not(.leaving)');
  const n=document.createElement('div');n.className='pnl '+cls;n.innerHTML=html;P.el.append(n);
  const kinds=['slide','drop','flip','rise'],k=enter||kinds[panelN++%kinds.length];
  if(old){old.classList.add('leaving');gsap.to(old,{opacity:0,y:k==='rise'?-30:0,x:k==='slide'?-40:0,duration:.22,ease:'power2.in',onComplete:()=>old.remove()})}
  const from={slide:{x:60,opacity:0},drop:{y:-50,rotation:-2.5,opacity:0},flip:{rotationY:-70,opacity:0,transformPerspective:900},rise:{y:40,opacity:0}}[k];
  if(R())gsap.fromTo(n,{opacity:0},{opacity:1,duration:.25});else gsap.fromTo(n,from,{x:0,y:0,rotation:0,rotationY:0,opacity:1,duration:.5,ease:'back.out(1.4)',delay:old?.12:0});
  fx('swish',.35);return n;
}
function clearPanels(d=.25){P.el.querySelectorAll('.pnl').forEach(o=>gsap.to(o,{opacity:0,duration:d,onComplete:()=>o.remove()}))}
async function typeInto(node,text,cps=22){for(let i=1;i<=text.length;i++){node.textContent=text.slice(0,i);if(i%2)fx('type',.6);await D.wait(1/cps)}}

const PANELS={
  courses(s){return panel(`<div class="ph"><span class="ph-site">${s.site}</span><span class="ph-lang">${s.lang}</span></div>
    <ol class="ladder">${s.courses.map((c,i)=>`<li style="--i:${i}"><span class="lv">${i+1}</span>${esc(c)}</li>`).join('')}</ol>`,{cls:'p-courses'}).then(n=>{gsap.from(n.querySelectorAll('.ladder li'),{x:-30,opacity:0,stagger:.12,delay:.4,duration:.4,ease:'back.out(2)'});return n})},
  async topics(s){const t=s.tour,n=await panel(`<div class="ptitle">Pick your topics</div>${t.topics.map(([lv,items,cov])=>`<div class="tgroup"><b>${esc(lv)}</b>${items.map((it,i)=>`<label class="titem${cov[i]?' covered':''}"><span class="box"></span>${esc(it)}<span class="focus">Focus</span></label>`).join('')}</div>`).join('')}<p class="legend"><span class="sw"></span>Shaded = already covered in class</p>`,{cls:'p-topics'});
    const items=[...n.querySelectorAll('.titem')];await D.wait(.9);
    for(const i of [0,1,3]){if(items[i]){items[i].classList.add('on');fx('tick')}await D.wait(.35)}
    await D.wait(1.6);const f=items[1]&&items[1].querySelector('.focus');if(f){f.classList.add('on');fx('pop',.6);gsap.fromTo(f,{scale:1.5},{scale:1,duration:.5,ease:'back.out(3)'})}
    return n},
  async sentence(s){const t=s.tour,n=await panel(`<div class="ptitle">${esc(t.prompt)}</div><p class="en">${esc(t.en)}</p><div class="answer"><span class="typed"></span><span class="caret"></span></div><div class="row"><span class="fakebtn">Check</span></div>`,{cls:'p-sentence'});
    await D.wait(.9);await typeInto(n.querySelector('.typed'),t.answer);return n},
  async feedback(s){const t=s.tour,[bad,good]=t.wrong;const typed=esc(t.typed).replace(esc(bad),`<mark class="bad">${esc(bad)}</mark>`);
    const n=await panel(`<div class="ptitle">Your answer</div><p class="ans">${typed}</p><div class="fix"><span class="x">✗</span><div>${t.note}</div></div><p class="right">${esc(t.answer)}</p><div class="okline"><span class="ok">✓</span><div>${t.order}</div></div>`,{cls:'p-feedback'});
    gsap.from(n.querySelector('.fix'),{y:14,opacity:0,delay:.9,duration:.4});gsap.from(n.querySelector('.right'),{opacity:0,delay:1.7,duration:.4});gsap.from(n.querySelector('.okline'),{y:14,opacity:0,delay:3.8,duration:.4});
    setTimeout(()=>fx('click',.6),900);return n},
  async ec(s){const e=s.tour.ec;const n=await panel(`<div class="ptitle">Extra credit <span class="xp">+5 XP</span></div><p class="ecq">${esc(e.q)}</p><div class="opts">${e.opts.map(o=>`<span class="opt${o===e.a?' right':''}">${esc(o)}</span>`).join('')}</div>`,{cls:'p-ec'});
    await D.wait(2.2);const r=n.querySelector('.opt.right');r.classList.add('picked');fx('sparkle',.7);gsap.fromTo(r,{scale:.9},{scale:1,duration:.5,ease:'back.out(3)'});gsap.fromTo(n.querySelector('.xp'),{scale:1},{scale:1.35,yoyo:true,repeat:1,duration:.18});return n},
  async chat(s,cat){const c=s.tour.chat;const n=await panel(`<div class="ptitle">Ask ${CATS.chars[cat].name}</div><div class="bub me">${esc(c.q)}</div><div class="bub cat">${faceImg(cat)}<span class="t"></span></div>`,{cls:'p-chat'});
    gsap.from(n.querySelector('.me'),{x:30,opacity:0,delay:.5,duration:.35});await D.wait(1.4);await typeInto(n.querySelector('.bub.cat .t'),c.a,48);return n},
  async key(s){const n=await panel(`<div class="ptitle">Your free AI key</div><div class="kprov"><b>Groq</b><span class="tag">free</span></div><div class="kin"><span class="kt"></span></div><div class="row"><span class="fakebtn alt">Get a free key: step-by-step guide</span></div><p class="small">Your key goes straight from your browser to the AI company. Free options are listed on the site, and a few paid ones work too.</p>`,{cls:'p-key'});
    await D.wait(1.2);await typeInto(n.querySelector('.kt'),'gsk_••••••••••••••••••••••',30);n.querySelector('.kin').classList.add('good');fx('tick');return n},
  async chart(s){const c=s.tour.chart;const n=await panel(`<div class="pcols"><div><div class="ptitle">${esc(c.title)} <span class="hide">Hide</span></div><table class="chart"><tr>${c.head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${c.rows.map(r=>`<tr>${r.map((x,i)=>i?`<td>${esc(x)}</td>`:`<th>${esc(x)}</th>`).join('')}</tr>`).join('')}</table></div>
    <div><div class="ptitle">Vocabulary <span class="hide">Hide</span></div><ul class="vocab">${s.tour.vocab.map(([w,m])=>`<li><b>${esc(w)}</b> ${esc(m)}</li>`).join('')}</ul></div></div>`,{cls:'p-chart'});
    gsap.from(n.querySelectorAll('tr'),{opacity:0,x:-10,stagger:.06,delay:.4,duration:.3});
    await D.wait(3.4);const h=n.querySelectorAll('.hide')[1],v=n.querySelector('.vocab');if(h&&v){h.classList.add('press');fx('click');gsap.to(v,{height:0,opacity:0,duration:.35,ease:'power2.inOut'});await D.wait(.9);h.classList.remove('press');fx('click');gsap.to(v,{height:'auto',opacity:1,duration:.35})}
    return n},
  async xp(s){const r=s.ranks,[aw,awEn]=s.award;const n=await panel(`<div class="ptitle">XP, levels and streaks</div><div class="xpbar"><span></span></div><div class="ranks"><span class="rk first">1 · <b>${esc(r[0][0])}</b> <small>${esc(r[0][1])}</small></span><span class="dots">· · ·</span><span class="rk last">10 · <b>${esc(r[9][0])}</b> <small>${esc(r[9][1])}</small></span></div><div class="extras"><span class="streak"><img src="art/icons/flame.svg" alt=""><b class="cnt">0</b> day streak</span><span class="award"><img src="art/icons/award.svg" alt=""><b>${esc(aw)}</b> <small>${esc(awEn)} · finish AP</small></span></div>`,{cls:'p-xp'});
    gsap.fromTo(n.querySelector('.xpbar span'),{width:'4%'},{width:'78%',duration:2.4,delay:.6,ease:'power2.inOut'});
    const c={v:0};gsap.to(c,{v:12,duration:1.4,delay:3.2,ease:'power1.out',onUpdate:()=>{n.querySelector('.cnt').textContent=Math.round(c.v)}});
    setTimeout(()=>{fx('sparkle',.6);gsap.fromTo(n.querySelector('.award'),{scale:.6,opacity:0},{scale:1,opacity:1,duration:.5,ease:'back.out(2.5)'})},5600);gsap.set(n.querySelector('.award'),{opacity:0});
    return n},
  async account(s){const n=await panel(`<div class="ptitle">One account, every site</div><div class="acc"><div class="kline"><span class="lbl">Account key</span><code>${esc(s.tour.keyFmt)}</code></div><div class="kline"><span class="lbl">or log in with</span><b>username + password</b></div><p class="small"><b>No email, ever.</b> A forgotten password can’t be recovered, so keep your account key somewhere safe.</p></div>
    <div class="board"><div class="ptitle sm">Leaderboard</div>${[['amica_42',1840],['you',1260],['marcus_t',990]].map(([u,x],i)=>`<div class="brow${u==='you'?' me':''}"><span>${i+1}</span><b>${u}</b><span>${x.toLocaleString()} XP</span></div>`).join('')}</div>`,{cls:'p-account'});
    gsap.from(n.querySelectorAll('.brow'),{x:30,opacity:0,stagger:.12,delay:1,duration:.35});return n},
};
const TOUR=[['courses','present','happy'],['topics','point','curious'],['sentence','point','happy'],['feedback','chin','thinking'],['ec','point','cheeky'],['chat','wave','delighted'],['key','point','happy'],['chart','point','calm'],['xp','cheer','excited'],['account','present','proud']];

/* ------------------------------------------------------------------ questions */
function ask(html,kind='lang'){const a=$('#ask');a.innerHTML=html;a.className='ask ask-'+kind;a.hidden=false;$('#bSkip').hidden=true;gsap.fromTo(a,{y:30,opacity:0},{y:0,opacity:1,duration:.45,ease:'back.out(1.8)'});gsap.from(a.querySelectorAll('button,.note'),{y:14,opacity:0,stagger:.06,duration:.35,delay:.12,ease:'back.out(2)'});return a}
function hideAsk(){const a=$('#ask');if(a.hidden)return;$('#bSkip').hidden=false;gsap.to(a,{opacity:0,y:20,duration:.2,onComplete:()=>{a.hidden=true;a.innerHTML=''}})}
function choose(a,selector){const g=D.gen;return new Promise((ok,no)=>{a.querySelectorAll(selector).forEach(b=>b.addEventListener('click',()=>{if(g!==D.gen)return no(new D.Cancel());if(b.disabled||b.getAttribute('aria-disabled')==='true')return;fx('click');ok(b.dataset.v)}));
  D.choiceCancel=()=>no(new D.Cancel())})}

/* ------------------------------------------------------------------ scenes */
async function sceneOpen(){
  state.scene='open';setBg('sunburst');frame(1.08,0,40);frame(1,0,0,6,'sine.inOut');
  const h=heroSpot();ORDER.forEach(id=>{const c=catAt(id,h.x,h.y,h.s);c.root.style.display='none';c.idle(true)});
  const f=cats.felix;f.root.style.display='';f.setFace('happy');f.pose('rest',0);
  // pops up from below: anticipation dip, stretch up, overshoot, settle
  gsap.set(f.squash,{y:S.H*.7,scaleY:1.2,scaleX:.88});
  await D.wait(.35);fx('whoosh',.6);
  await D.tl(gsap.timeline().to(f.squash,{y:-40,duration:.38,ease:'power3.out'}).to(f.squash,{y:0,scaleY:.9,scaleX:1.08,duration:.18,ease:'power2.in'}).to(f.squash,{scaleY:1,scaleX:1,duration:.45,ease:'elastic.out(1,.4)'}));
  f.pose('wave');
  await D.say(f,'open.salve',{hold:0});
  const nameY=h.y-h.s*95;
  let prev=f;const swaps=[[cats.felicisimo,swapSpin,'open.es'],[cats.felicien,swapHop,'open.fr'],[cats.frohlix,swapPoof,'open.de'],[cats.felix,swapBack,'open.la']];
  for(const [c,sw,line] of swaps){
    const w=A.toBeat(2);if(w>0&&w<.3)await D.wait(w);      // land each swap on the music's half-beat
    c.pose(c===cats.felix?'cheer':'up',0);
    const p=sw(prev,c);setTimeout(()=>{if(state.scene==='open')nameIn(c.info.name,c.info.color,nameY)},c===cats.felix?380:110);
    await p;await D.say(c,line,{hold:c===cats.felix?.55:.12});prev=c;
  }
  const F=cats.felix;F.pose('hush');F.look(-4,1);F.tilt(-6);
  // the cousins peek in from the edges while he apologizes for them
  const peek=[['felicisimo',-1],['felicien',1],['frohlix',-1]];
  setTimeout(()=>{if(state.scene!=='open')return;peek.forEach(([id,side],i)=>{const c=cats[id],x=side*(S.W/2-110),y=S.H/2+40;c.place(x,y,1);c.root.style.display='';c.setFace(i===1?'cheeky':'delighted');c.pose('wave',0);
    gsap.fromTo(c.squash,{y:260},{y:0,duration:.35,ease:'back.out(2)',delay:i*.22});gsap.to(c.squash,{y:300,duration:.3,ease:'power2.in',delay:1.6+i*.15,onComplete:()=>{c.root.style.display='none';gsap.set(c.squash,{y:0})}});setTimeout(()=>fx('pop',.5),i*220)})},700);
  await D.say(F,'open.ahem',{face:'sly',hold:.3});
  F.look(0,0);F.tilt(0);
}
async function sceneIntro(){
  state.scene='intro';const F=cats.felix;nameOut();
  ['felicisimo','felicien','frohlix'].forEach(hideCat);
  F.root.style.display='';F.idle(true);F.setFace('happy');F.pose('present');
  // a hard cut to a wider framing, the way an editor would cut on the new sentence
  frame(.94,0,0);
  const title=panelTitle();await D.say(F,'intro.1',{hold:.1});
  F.pose('point');F.setFace('curious');
  const strip=await panel(`<div class="ptitle">One whole sentence at a time</div><p class="strip"><span>Puella</span> <span>rosam</span> <span>amat.</span></p><p class="small">“The girl loves the rose.”</p>`,{cls:'p-strip ptop',enter:'drop'});
  title.remove();gsap.from(strip.querySelectorAll('.strip span'),{y:20,opacity:0,stagger:.35,delay:.8,duration:.35,ease:'back.out(2.5)',onStart:()=>fx('pop',.4)});
  await D.say(F,'intro.2',{hold:.1});
  clearPanels();
  // everyone gets a spot in the line-up
  const L=lineupSpots();F.setFace('delighted');F.pose('rest');fx('whoosh',.5);
  await D.tl(gsap.timeline().add(moveCat(F,L[0][0],L[0][1],L[0][2],.7,'power3.inOut')).add(F.hop(30,.5),.45));
  plates(L);
  await D.say(F,'intro.3',{face:'happy',hold:.05});
  showPlate(0);F.setFace('proud');F.pose('cheer');F.hop(26,.45);
  await D.say(F,'intro.4',{hold:.05});F.pose('rest');F.setFace('happy');
  const entr=[enterRise,enterSpin,enterDrop];
  for(let i=1;i<4;i++){const c=cats[ORDER[i]];c.idle(true);c.setFace('delighted');c.pose('wave',0);
    await entr[i-1](c,L[i]);showPlate(i);F.look(i>1?4:3,0);
    await D.say(c,'intro.'+(i+4),{hold:.05});c.pose('rest');c.setFace('happy')}
  F.look(0,0);
  // one account joins them all
  F.setFace('proud');F.pose('present');
  const key=await panel(`<div class="keycard"><span class="kc-icon" aria-hidden="true"></span><div><b>One account</b><code>VERBA-7Q4M-K2XA-…</code></div></div>`,{cls:'p-key1 ptop',enter:'drop'});
  links(L);
  await D.say(F,'intro.8',{hold:.1});
}
function panelTitle(){const t=document.createElement('div');t.className='pnl p-title ptop';t.innerHTML=`<h2>Linguae</h2><p><u data-en="languages">Linguae</u> = “languages”</p>`;P.el.append(t);
  gsap.from(t.querySelectorAll('h2,p'),{y:-30,opacity:0,stagger:.15,duration:.5,ease:'back.out(2)'});fx('pop',.5);return t}
async function enterRise(c,[x,y,s]){c.place(x,y,s);c.root.style.display='';gsap.set(c.squash,{y:420,scaleY:1.2,scaleX:.9});fx('whoosh',.5);
  await D.tl(gsap.timeline().to(c.squash,{y:-30,duration:.32,ease:'power3.out'}).to(c.squash,{y:0,scaleY:.9,scaleX:1.08,duration:.14,ease:'power2.in'}).to(c.squash,{scaleY:1,scaleX:1,duration:.35,ease:'elastic.out(1,.45)'}))}
async function enterSpin(c,[x,y,s]){c.place(x,y,s);c.root.style.display='';gsap.set(c.flip,{scaleX:.03});gsap.set(c.squash,{y:-60});fx('swish',.6);
  await D.tl(gsap.timeline().to(c.flip,{scaleX:1,duration:.45,ease:'back.out(3)'}).to(c.squash,{y:0,duration:.3,ease:'bounce.out'},'<'));fx('pop',.5)}
async function enterDrop(c,[x,y,s]){c.place(x,y,s);c.root.style.display='';gsap.set(c.squash,{y:-S.H});fx('whoosh',.5);
  await D.tl(gsap.timeline().to(c.squash,{y:0,duration:.34,ease:'power2.in'}));fx('thud',.6);puff(x,y-10,6,'#F3E7CF',18,90);
  await D.tl(gsap.timeline().to(c.squash,{scaleY:.82,scaleX:1.14,duration:.06}).to(c.squash,{scaleY:1,scaleX:1,duration:.4,ease:'elastic.out(1,.4)'}))}
let plateG=null;
function plates(L){if(plateG)plateG.remove();plateG=svgEl('g',{class:'plates'});layers.front.append(plateG);
  L.forEach(([x,y,s],i)=>{const c=CATS.chars[ORDER[i]],site=SITE_BY[SITE_OF[ORDER[i]]],live=site.live;const g=svgEl('g',{transform:`translate(${x} ${y+(S.phone?18:24)})`,opacity:0});
    g.innerHTML=`<rect x="-118" y="-4" width="236" height="74" rx="14" fill="#FFF8EA" stroke="#2A2420" stroke-width="4" filter="url(#boil)"/><text x="0" y="34" text-anchor="middle" font-family="Fraunces, Georgia, serif" font-weight="700" font-size="34" fill="${c.color}">${site.site}</text><text x="0" y="58" text-anchor="middle" font-family="Figtree, sans-serif" font-weight="700" font-size="19" fill="#6A5D4F">${site.lang}${live?'':' · soon'}</text>`;
    plateG.append(g)})}
function showPlate(i){const g=plateG&&plateG.children[i];if(!g)return;fx('pop',.4);gsap.fromTo(g,{opacity:0,y:'+=30'},{opacity:1,y:'-=30',duration:.4,ease:'back.out(2)'})}
let linkG=null;
function links(L){if(linkG)linkG.remove();linkG=svgEl('g');layers.back.append(linkG);const top=-S.H/2+(S.phone?110:120);
  L.forEach(([x,y,s])=>{const p=svgEl('path',{d:`M0,${top} C0,${top+120} ${x},${y-330*s} ${x},${y-260*s}`,fill:'none',stroke:'#A9442A','stroke-width':5,'stroke-dasharray':'14 12','stroke-linecap':'round',opacity:.8});linkG.append(p);
    const len=p.getTotalLength?p.getTotalLength():600;gsap.fromTo(p,{attr:{'stroke-dashoffset':len}},{attr:{'stroke-dashoffset':0},duration:.9,ease:'power2.out',delay:.3})})}
function clearLineup(){if(plateG){gsap.to(plateG,{opacity:0,duration:.25,onComplete:()=>{if(plateG){plateG.remove();plateG=null}}})}if(linkG){linkG.remove();linkG=null}}

async function askLanguage(){
  state.scene='ask.lang';const F=cats.felix;
  if(!plateG){ // arrived by Skip: set up the line-up instantly
    nameOut();clearPanels(0);setBg('sunburst');frame(.94,0,0);const L=lineupSpots();
    freshCats();ORDER.forEach((id,i)=>{const c=catAt(id,...L[i]);c.idle(true);c.setFace('happy');c.pose('rest',0)});
    plates(L);[0,1,2,3].forEach(i=>gsap.set(plateG.children[i],{opacity:1}));
  }
  if(linkG){gsap.to(linkG,{opacity:0,duration:.3})}clearPanels();
  F.setFace('curious');F.pose('present');
  if(S.phone){if(plateG)gsap.to(plateG,{opacity:0,duration:.25});const R2=askRowSpots();ORDER.forEach((id,i)=>{const c=cats[id];if(c)moveCat(c,...R2[i],.55,'back.out(1.4)')})}
  const a=ask(`<p class="q">So, which language are you learning?</p><div class="langs">${SITES.map(s=>`<button type="button" data-v="${s.id}" class="lang">${faceImg(s.cat)}<span><b>${s.lang}</b><small>${s.site}${s.live?'':' · coming soon'}</small></span></button>`).join('')}</div>`);
  // hovering a language makes its cat perk up
  a.querySelectorAll('.lang').forEach(b=>{const c=cats[SITE_BY[b.dataset.v].cat];b.addEventListener('pointerenter',()=>{c.setFace('excited');c.hop(16,.4)});b.addEventListener('pointerleave',()=>c.setFace('happy'))});
  const said=D.say(F,'ask.lang',{hold:0}).catch(()=>{});
  const v=await choose(a,'.lang');
  A.stopVoice();hideAsk();return v;
}
async function sceneHandoff(lang){
  state.scene='hand.'+lang;state.lang=lang;const site=SITE_BY[lang],F=cats.felix,host=cats[site.cat];
  if(lang==='la'){
    F.setFace('delighted');F.pose('cheer');F.hop(30,.5);
    const others=ORDER.slice(1).map(id=>cats[id]);
    setTimeout(()=>{others.forEach((c,i)=>{c.pose('wave');gsap.to(c.squash,{y:S.H,duration:.45,ease:'back.in(1.6)',delay:.3+i*.12,onComplete:()=>c.root.style.display='none'})});clearLineup()},900);
    await D.say(F,'hand.la',{hold:.1});
  }else{
    F.setFace('happy');F.pose(cats[site.cat].pos.x>F.pos.x?'point':'pointL');F.look(4,0);
    const sayP=D.say(F,'hand.'+lang,{hold:.05});
    setTimeout(()=>{if(state.scene===('hand.'+lang)){host.setFace('excited');host.hop(36,.5);fx('boing',.5)}},(window.VOICE['hand.'+lang].dur-.7)*1000);
    await sayP;F.look(0,0);
    // the others hop away; the host takes the stage
    ORDER.filter(id=>id!==site.cat).forEach((id,i)=>{const c=cats[id];c.pose('wave');gsap.to(c.squash,{y:S.H,duration:.42,ease:'back.in(1.6)',delay:i*.1,onComplete:()=>{c.root.style.display='none';gsap.set(c.squash,{y:0})}})});
    clearLineup();fx('whoosh',.6);
    host.setFace('delighted');host.pose('cheer');
    await D.say(host,'hand.'+lang+'.2',{hold:.1});
  }
}
async function sceneTour(lang){
  state.scene='tour.'+lang;const site=SITE_BY[lang],host=cats[site.cat],bgk={la:'latin',es:'spanish',fr:'french',de:'german'}[lang];
  ORDER.filter(id=>id!==site.cat).forEach(hideCat);
  host.root.style.display='';host.idle(true);gsap.set([host.squash,host.flip],{clearProps:'y,scaleX,scaleY'});
  // whip-pan into the host's world
  smear(true,22);fx('whoosh',.8);
  await D.tl(gsap.timeline().to(S.cam,{x:-S.W*.6,duration:.18,ease:'power2.in',svgOrigin:'0 0'}));
  setBg(bgk);const T=tourSpot();host.place(T.x,T.y,T.s);host.pos=T;
  gsap.set(S.cam,{x:S.W*.6});
  await D.tl(gsap.timeline().to(S.cam,{x:0,duration:.32,ease:'power3.out',svgOrigin:'0 0'}));smear(false);
  P.el.classList.add('tour');
  const framings=[[1,0,0],[1.06,-40,-20],[1,0,0],[1.04,30,-10]];
  for(let i=0;i<TOUR.length;i++){
    const [k,pose,face]=TOUR[i];
    // alternate hard cuts and slow pushes between lines, never the same twice in a row
    const f=framings[i%framings.length];if(i%2)frame(...f);else frame(f[0],f[1],f[2],1.2,'sine.inOut');
    host.pose(pose);host.setFace(face);if(i===8)host.hop(24,.45);
    const pn=PANELS[k](site,site.cat);
    await D.say(host,`${lang}.${i+1}`,{hold:.25});await pn;
  }
  frame(1,0,0,.6);
}
async function askContinue(lang){
  state.scene='ask.'+lang;const site=SITE_BY[lang],host=cats[site.cat];
  if(state.scene&&!P.el.classList.contains('tour')){ // arrived by Skip
    nameOut();clearLineup();ORDER.filter(id=>id!==site.cat).forEach(hideCat);setBg({la:'latin',es:'spanish',fr:'french',de:'german'}[lang]);const T=tourSpot();
    freshCats();const c=catAt(site.cat,T.x,T.y,T.s);c.idle(true);frame(1,0,0);P.el.classList.add('tour');}
  clearPanels();host.setFace('happy');host.pose('present');
  const a=ask(`<p class="q">Continue to ${esc(site.site)}?</p><div class="yn">
    <button type="button" data-v="yes" class="btn big"${site.live?'':' disabled aria-disabled="true"'}>Yes, go to ${esc(site.site)}</button>
    <button type="button" data-v="no" class="btn ghostbtn big">No, go to homepage</button></div>
    ${site.live?'':`<p class="note">${esc(site.site)} hasn’t been built yet. It’s coming soon!</p>`}`,'cont');
  D.say(host,'ask.'+lang,{hold:0}).catch(()=>{});
  const v=await choose(a,'.yn button');A.stopVoice();hideAsk();
  if(v==='yes'){host.setFace('delighted');host.pose('cheer');host.hop(40,.5);fx('sparkle');
    if(lang==='la')await D.say(host,'bye.yes',{hold:.1}).catch(()=>{});else await D.wait(.7);
    done('site',site.url);}
  else{host.setFace('happy');host.pose('wave');if(lang==='la')await D.say(host,'bye.home',{hold:.1}).catch(()=>{});else await D.wait(.6).catch(()=>{});done('home')}
}

/* ------------------------------------------------------------------ running it */
async function run(from='open'){
  D.cancel();const g=D.gen;
  try{
    if(from==='open'){await sceneOpen();await sceneIntro();from='ask'}
    if(from==='ask'){const lang=await askLanguage();state.lang=lang;await sceneHandoff(lang);await sceneTour(lang);from='cont'}
    if(from==='cont')await askContinue(state.lang);
  }catch(e){if(!(e instanceof D.Cancel))console.error(e)}
}
function skip(){
  if(state.scene.startsWith('ask'))return;
  const target=(state.scene.startsWith('hand')||state.scene.startsWith('tour'))?'cont':'ask';
  fx('swish',.5);D.cancel();hideAsk();
  // a quick white flash covers the jump, like a cut
  const fl=$('#flash');gsap.fromTo(fl,{opacity:.85},{opacity:0,duration:.35});
  if(target==='ask'){P.el.classList.remove('tour');ORDER.forEach(id=>{if(cats[id]){gsap.killTweensOf([cats[id].root,cats[id].squash,cats[id].flip]);}});if(plateG){plateG.remove();plateG=null}run('ask')}
  else{ORDER.forEach(id=>{if(cats[id])gsap.killTweensOf([cats[id].root,cats[id].squash,cats[id].flip])});P.el.classList.remove('tour');gsap.set(S.cam,{x:0,y:0,scale:1});smear(false);run('cont')}
}
let onDone=null;
function done(kind,url){
  try{localStorage.setItem('linguae-intro-seen','1')}catch(e){}
  D.cancel();hideAsk();A.stopMusic();stopBoil();
  if(kind==='site'&&url){const cover=$('#flash');gsap.to(cover,{opacity:1,duration:.4,onComplete:()=>location.href=url});return}
  const I=$('#intro');gsap.to(I,{opacity:0,duration:.5,onComplete:()=>{I.hidden=true;gsap.set(I,{opacity:1});document.body.classList.remove('watching');reset();onDone&&onDone()}});
}
function reset(){D.cancel();Object.values(cats).forEach(c=>c.remove());cats={};nameG=null;plateG=null;linkG=null;
  ['bg','back','world','front'].forEach(k=>layers[k].innerHTML='');P.el.innerHTML='';P.el.classList.remove('tour');gsap.set(S.cam,{x:0,y:0,scale:1});state={scene:'',lang:null}}

function init(){
  ['bg','back','world','front'].forEach(k=>layers[k]=document.getElementById(k));
  document.getElementById('defsShared').insertAdjacentHTML('beforeend',CATS.defs);
  P.el=$('#panels');S.init();CAP.init();
  const fl=document.createElement('div');fl.id='flash';fl.className='flash';$('#intro').append(fl);
  $('#bSkip').onclick=skip;$('#bHome').onclick=()=>{fx('click');done('home')};
  const cc=$('#bCC');cc.setAttribute('aria-pressed',CAP.on);cc.onclick=()=>{cc.setAttribute('aria-pressed',CAP.toggle());S.layout()};
  const mu=$('#bMute');mu.onclick=()=>{A.init();A.setMute(!A.muted);mu.setAttribute('aria-pressed',A.muted)};
  $('#gateGo').onclick=start;
  addEventListener('keydown',e=>{if($('#intro').hidden)return;if(e.key==='Escape')done('home')});
}
async function start(){
  A.init();if(A.ctx&&A.ctx.state==='suspended')try{await A.ctx.resume()}catch(e){}
  $('#bMute').setAttribute('aria-pressed',A.muted);
  const gate=$('#gate');gsap.to(gate,{opacity:0,duration:.35,onComplete:()=>gate.hidden=true});
  // load the opening's lines first, then everything else in the background
  const first=['open.salve','open.es','open.fr','open.de','open.la','open.ahem'];
  await Promise.race([Promise.all([A.load('music'),...first.map(A.load)]),new Promise(r=>setTimeout(r,3500))]);
  Object.keys(window.VOICE).forEach(k=>A.load(k));
  A.startMusic();startBoil();run('open');
}
/* open the intro: shows the "Meet Fēlix" gate, which starts sound on the visitor's tap */
function open(cb){onDone=cb;const I=$('#intro');I.hidden=false;gsap.set(I,{opacity:1});document.body.classList.add('watching');S.layout();reset();
  const gate=$('#gate');gate.hidden=false;gsap.set(gate,{opacity:1});setBg('sunburst');
  // Fēlix peeks up at the bottom of the start screen
  const h=heroSpot(),f=catAt('felix',0,S.H/2+h.s*120,h.s);f.setFace('curious');f.idle(true);startBoil();
  gsap.fromTo(f.squash,{y:300},{y:0,duration:.6,ease:'back.out(1.6)',delay:.3});
  $('#bSkip').hidden=false;
}
window.INTRO={init,open,done};
})();
