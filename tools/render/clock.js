/* Renderer only, injected before any page script: a virtual clock. Time only moves when render.js calls
   __advance(ms), so every frame is exact no matter how long a screenshot takes. Timers, animation frames,
   Date/performance, CSS animations and Math.random (seeded) are all tied to it, which also makes every run
   identical, so a branch (a different answer to a question) can be replayed from the same start. */
(()=>{
let now=0;const EPOCH=1767225600000;const RealDate=Date;
const timers=new Map(),rafs=new Map();let tid=1,rid=1;
performance.now=()=>now;
class VDate extends RealDate{constructor(...a){if(a.length)super(...a);else super(EPOCH+now)}static now(){return EPOCH+now}}
window.Date=VDate;
window.setTimeout=(fn,ms=0,...args)=>{const i=tid++;timers.set(i,{t:now+Math.max(0,+ms||0),fn,args,iv:0,seq:i});return i};
window.setInterval=(fn,ms=0,...args)=>{const i=tid++;ms=Math.max(1,+ms||0);timers.set(i,{t:now+ms,fn,args,iv:ms,seq:i});return i};
window.clearTimeout=window.clearInterval=i=>{timers.delete(i)};
window.requestAnimationFrame=fn=>{const i=rid++;rafs.set(i,fn);return i};
window.cancelAnimationFrame=i=>{rafs.delete(i)};
// seeded random (mulberry32)
let seed=20261024;Math.random=()=>{seed|=0;seed=seed+0x6D2B79F5|0;let t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
// a real macrotask, so promise chains settle between timers (the way they would in real time)
const mc=new MessageChannel();let wake=null;mc.port1.onmessage=()=>{const w=wake;wake=null;w&&w()};
const settle=()=>new Promise(r=>{wake=r;mc.port2.postMessage(0)});
const anims=new WeakMap();
window.__now=()=>now;
window.__advance=async(ms)=>{
  const end=now+ms;await settle();
  for(let guard=0;guard<10000;guard++){
    let nx=null,ni=0;for(const [i,t] of timers)if(t.t<=end&&(!nx||t.t<nx.t||(t.t===nx.t&&t.seq<nx.seq))){nx=t;ni=i}
    if(!nx)break;now=Math.max(now,nx.t);if(nx.iv){nx.t+=nx.iv;nx.seq=tid++}else timers.delete(ni);
    try{typeof nx.fn==='function'?nx.fn(...nx.args):(0,eval)(nx.fn)}catch(e){console.error(e)}
    await settle();
  }
  now=end;const cbs=[...rafs.values()];rafs.clear();for(const f of cbs){try{f(now)}catch(e){console.error(e)}}
  await settle();
  for(const a of document.getAnimations()){if(!anims.has(a))anims.set(a,now);a.pause();a.currentTime=now-anims.get(a)}
};
})();
