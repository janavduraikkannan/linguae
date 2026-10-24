/* Linguae cat rig: builds a cat from the static parts in cats.js (made by tools/rig.py) and moves it with code.
   Every cat lives in the same 240x240 space; scenes place it with cat.root (x, y, scale). */
(function(){
const NS='http://www.w3.org/2000/svg';
const C=window.CATS;
const el=(tag,attrs,html)=>{const e=document.createElementNS(NS,tag);for(const k in attrs||{})e.setAttribute(k,attrs[k]);if(html!=null)e.innerHTML=html;return e};
const rnd=(a,b)=>a+Math.random()*(b-a);
const BLINKABLE=new Set(['open','soft','big','up','sad']);

/* Faces: eyes, brows, the mouth used when not speaking, and blush. */
const FACES={
  happy:{eyes:'soft',brows:'happy',mouth:'fang'}, calm:{eyes:'soft',brows:'none',mouth:'X'},
  delighted:{eyes:'arc',brows:'none',mouth:'laugh',blush:1}, laughing:{eyes:'squint',brows:'none',mouth:'laugh',blush:1},
  adoring:{eyes:'heart',brows:'none',mouth:'w',blush:1}, sly:{eyes:'sly',brows:'sly',mouth:'smirk',blush:1},
  cheeky:{eyes:'wink',brows:'happy',mouth:'tongue'}, shocked:{eyes:'wide',brows:'up',mouth:'o',blush:1},
  sad:{eyes:'sad',brows:'sad',mouth:'pout'}, grumpy:{eyes:'grump',brows:'grumpy',mouth:'zig',blush:1},
  thinking:{eyes:'up',brows:'think',mouth:'hmm'}, proud:{eyes:'arc',brows:'happy',mouth:'fang',blush:1},
  curious:{eyes:'big',brows:'up',mouth:'X'}, excited:{eyes:'big',brows:'up',mouth:'laugh',blush:1},
};
/* Paw poses: [x, y, rotation] for the left (prop) paw and the right paw, in cat space. */
const POSES={
  rest:{L:[82,212,0],R:[160,214,0]}, hold:{L:[82,212,0],R:[160,214,0]},
  wave:{L:[82,212,0],R:[204,144,-20]}, point:{L:[82,212,0],R:[212,150,-35]}, pointL:{L:[30,150,35],R:[160,214,0]},
  up:{L:[40,140,20],R:[200,140,-20]}, cheer:{L:[34,120,25],R:[206,120,-25]}, chin:{L:[82,212,0],R:[152,162,-30]},
  present:{L:[38,182,20],R:[202,182,-20]}, shrug:{L:[36,168,40],R:[204,168,-40]}, hush:{L:[82,212,0],R:[136,150,-10]},
  clasp:{L:[108,176,15],R:[132,176,-15]}, cover:{L:[100,214,0],R:[140,214,0]},
};

class Cat{
  constructor(id,parent){
    this.id=id;const c=C.chars[id];this.info=c;
    this.root=el('g',{class:'cat cat-'+id,'data-cat':id});
    this.flip=el('g');                                  // mirror for facing left/right
    this.squash=el('g');                                // squash & stretch, pivot at the base
    this.inner=el('g',{filter:'url(#boil)'});
    this.body=el('g',{class:'body'},c.body);
    this.headWrap=el('g',{transform:'translate(0 14)'});
    this.head=el('g',{class:'head'});
    this.earL=el('g',{},C.parts.earL);this.earR=el('g',{},C.parts.earR);
    this.headBase=el('g',{},C.parts.head);
    this.blushG=el('g',{},C.parts.blush);
    this.gaze=el('g');
    this.eyesG=el('g');this.browsG=el('g');
    this.noseG=el('g',{},C.parts.nose);this.mouthG=el('g');this.whisk=el('g',{},C.parts.whiskers);
    this.hat=el('g',{class:'hat'},c.hat);
    this.gaze.append(this.eyesG,this.browsG);
    this.head.append(this.earL,this.earR,this.headBase,this.blushG,this.gaze,this.noseG,this.mouthG,this.whisk,this.hat);
    this.headWrap.append(this.head);
    this.propG=el('g',{},C.props[c.prop]);
    this.pawL=el('g');this.pawLb=el('g');this.pawLr=el('g');this.pawLr.append(this.propG,el('g',{},C.paw.L));this.pawLb.append(this.pawLr);this.pawL.append(this.pawLb);
    this.pawR=el('g');this.pawRb=el('g');this.pawRr=el('g',{},C.paw.R);this.pawRb.append(this.pawRr);this.pawR.append(this.pawRb);
    this.fx=el('g');
    this.inner.append(this.body,this.headWrap,this.pawL,this.pawR,this.fx);
    this.breath=el('g');this.breath.append(this.inner);this.squash.append(this.breath);this.flip.append(this.squash);this.root.append(this.flip);
    if(parent)parent.append(this.root);
    gsap.set(this.squash,{svgOrigin:'120 240'});gsap.set(this.breath,{svgOrigin:'120 240'});gsap.set(this.flip,{svgOrigin:'120 240'});
    gsap.set(this.head,{svgOrigin:'120 150'});gsap.set(this.earL,{svgOrigin:'88 64'});gsap.set(this.earR,{svgOrigin:'152 64'});
    gsap.set(this.hat,{svgOrigin:'120 46'});
    this.faceName='happy';this.mouthRest='fang';this.speaking=false;this.tweens=[];
    this.setFace('happy');this.pose('rest',0);
  }
  /* Place the cat: x, y = where the middle of its base sits; s = size (1 = 240 units wide). */
  place(x,y,s=1){gsap.set(this.root,{x:x-120*s,y:y-240*s,scale:s,transformOrigin:'0 0'});return this}
  showProp(on){this.propG.style.display=on?'':'none';return this}
  setFace(name,blush){
    const f=FACES[name]||FACES.happy;this.faceName=name;
    this.eyesKind=f.eyes;this.eyesG.innerHTML=C.eyes[f.eyes];this.browsG.innerHTML=C.brows[f.brows];
    this.mouthRest=f.mouth;if(!this.speaking)this.mouthG.innerHTML=C.mouths[f.mouth];
    this.blushG.innerHTML=(blush??f.blush)?C.parts.blushStrong:C.parts.blush;return this;
  }
  mouth(shape){
    const s=shape==='X'?this.mouthRest:shape;if(s===this._m)return;this._m=s;
    this.mouthG.innerHTML=C.mouths[s]||C.mouths.X;
  }
  /* Paws float, so a pose is just where each paw goes; overshoot gives the motion some life. */
  pose(name,d=.45,ease='back.out(1.6)'){
    const p=POSES[name]||POSES.rest;this.poseName=name;
    const go=(g,r,[x,y,a],delay)=>{if(d===0){gsap.set(g,{x,y});gsap.set(r,{rotation:a});return}
      gsap.to(g,{x,y,duration:d,ease,delay,overwrite:'auto'});gsap.to(r,{rotation:a,duration:d*1.2,ease:'power2.out',delay:delay+.03,overwrite:'auto'})};
    go(this.pawL,this.pawLr,p.L,0);go(this.pawR,this.pawRr,p.R,d?rnd(.03,.08):0);   // the paws never move in perfect sync
    if(this.waveTw){this.waveTw.kill();this.waveTw=null}
    if(name==='wave')this.waveTw=gsap.to(this.pawRr,{rotation:-45,duration:.22,ease:'sine.inOut',yoyo:true,repeat:5,delay:d*.7,onComplete:()=>gsap.to(this.pawRr,{rotation:-20,duration:.2})});
    return this;
  }
  look(dx=0,dy=0,d=.25){gsap.to(this.gaze,{x:dx,y:dy,duration:d,ease:'power2.out'});return this}
  tilt(a,d=.5){gsap.to(this.head,{rotation:a,duration:d,ease:'back.out(1.4)'});return this}
  face(dir){gsap.set(this.flip,{scaleX:dir<0?-1:1});return this}
  /* Idle life: breathing, drifting head, random blinks and ear twitches, bobbing paws. */
  idle(on=true){
    this.tweens.forEach(t=>t.kill());this.tweens=[];clearTimeout(this._blink);clearTimeout(this._ear);
    if(!on||window.REDUCED)return this;
    this.tweens.push(gsap.to(this.breath,{scaleY:1.014,scaleX:.996,duration:rnd(1.6,2),ease:'sine.inOut',yoyo:true,repeat:-1}));
    this.tweens.push(gsap.to(this.headWrap,{y:15.5,duration:rnd(1.6,2),ease:'sine.inOut',yoyo:true,repeat:-1,delay:.25}));
    this.tweens.push(gsap.to(this.pawLb,{y:2.5,duration:rnd(1.3,1.7),ease:'sine.inOut',yoyo:true,repeat:-1}));
    this.tweens.push(gsap.to(this.pawRb,{y:3,duration:rnd(1.2,1.6),ease:'sine.inOut',yoyo:true,repeat:-1,delay:.4}));
    const blink=()=>{this._blink=setTimeout(()=>{this.blink();blink()},rnd(2200,5600))};blink();
    const ear=()=>{this._ear=setTimeout(()=>{this.twitch();ear()},rnd(3500,8000))};ear();
    return this;
  }
  blink(){
    if(!BLINKABLE.has(this.eyesKind))return;const k=this.eyesKind,E=this.eyesG,set=s=>E.innerHTML=C.eyes[s];
    const once=t0=>{setTimeout(()=>set('half'),t0);setTimeout(()=>set('closed'),t0+45);setTimeout(()=>set('half'),t0+125);setTimeout(()=>{if(this.eyesKind===k)set(k)},t0+170)};
    once(0);if(Math.random()<.18)once(240);   // sometimes a double blink
  }
  twitch(){const e=Math.random()<.5?this.earL:this.earR,s=e===this.earL?-1:1;
    gsap.timeline().to(e,{rotation:9*s,duration:.07,ease:'power2.out'}).to(e,{rotation:-3*s,duration:.12}).to(e,{rotation:0,duration:.3,ease:'elastic.out(1,.4)'})}
  /* Lip sync: follow Rhubarb's mouth cues against the audio clock, and nod a little on stressed open vowels. */
  speak(cues,clock){
    this.speaking=true;let i=-1,last='X';const tick=()=>{
      if(!this.speaking)return;const t=clock();
      while(i+1<cues.length&&cues[i+1][0]<=t)i++;
      const v=i<0?'X':cues[i][1];
      if(v!==last){this.mouth(v);if((v==='D'||v==='C')&&last!=='D'&&last!=='C'&&!window.REDUCED)gsap.fromTo(this.head,{rotation:'+=0'},{rotation:'+='+rnd(-1.4,1.4),duration:.12,yoyo:true,repeat:1,ease:'sine.out'});last=v}
      this._raf=requestAnimationFrame(tick)};tick();
  }
  quiet(){this.speaking=false;cancelAnimationFrame(this._raf);this._m=null;this.mouth('X')}
  /* Squash-and-stretch helpers */
  hop(h=40,d=.5){const tl=gsap.timeline();
    tl.to(this.squash,{scaleY:.86,scaleX:1.08,duration:d*.18,ease:'power2.out'})
      .to(this.squash,{scaleY:1.1,scaleX:.94,y:-h,duration:d*.32,ease:'power2.out'})
      .to(this.squash,{scaleY:1,scaleX:1,y:0,duration:d*.3,ease:'power2.in'})
      .to(this.squash,{scaleY:.9,scaleX:1.07,duration:d*.08,ease:'power1.out'})
      .to(this.squash,{scaleY:1,scaleX:1,duration:d*.35,ease:'elastic.out(1,.45)'});return tl}
  remove(){this.idle(false);this.quiet();this.root.remove()}
}
window.Cat=Cat;window.CAT_FACES=FACES;window.CAT_POSES=POSES;
})();
