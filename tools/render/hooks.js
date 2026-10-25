/* Renderer only. Runs the intro scenes in virtual time (see clock.js, injected first by render.js) and records
   what they do: every voice line, sound effect, background change and question. The sound is mixed afterwards in
   an OfflineAudioContext, sample-exact, and the music is left out (the site plays it live, so it keeps going
   while a question waits for an answer). */
(function(){
const A=window.AUDIO,R=window.__R={ev:[],marks:[]};
const now=()=>performance.now()/1000;
window.__mark=(n,x)=>R.marks.push([n,x==null?null:x,now()]);
A.init=function(){A.ctx={state:'running',resume:async()=>{},currentTime:0};A.master=A.sfx=A.voice=A.music={}};
A.load=()=>Promise.resolve(true);
A.setMute=()=>{};A.duck=()=>{};
A.startMusic=async()=>{A.musicSrc=true;A.musicT0=now();R.ev.push(['music',now()])};
A.stopMusic=()=>{A.musicSrc=null};
A.toBeat=function(div=1){if(!A.musicSrc)return 0;const b=60/window.MUSIC.bpm/div,t=(now()-A.musicT0)%b;return t<.04?0:b-t};
A.play=function(name,onStart){
  const v=window.VOICE[name];if(!v){onStart&&onStart(()=>0);return Promise.resolve()}
  const t0=now()+.02;R.ev.push(['voice',name,t0]);
  return new Promise(res=>{const tok={};tok.id=setTimeout(()=>{if(A.src===tok)A.src=null;res()},(v.dur+.02)*1000);A.src=tok;onStart&&onStart(()=>now()-t0)});
};
A.stopVoice=function(){if(A.src){clearTimeout(A.src.id);A.src=null;R.ev.push(['stop',now()])}};
const fxLive=A.fx;
/* a panel whose text doesn't fit would be cut off in the video (nobody can scroll it), so report it */
R.overflow=[];setInterval(()=>{document.querySelectorAll('.pnl').forEach(n=>{if(n.scrollHeight>n.clientHeight+2||n.scrollWidth>n.clientWidth+2){const k=n.className;if(!R.overflow.includes(k)){R.overflow.push(k);console.log('OVERFLOW '+k+' '+n.scrollHeight+'>'+n.clientHeight)}}})},250);
A.fx=(kind,vol=1)=>R.ev.push(['fx',kind,vol,now()]);

/* Mix the voices and effects between two virtual times into 16-bit mono PCM (base64). */
R.mix=async function(from,to,sr=44100){
  const len=Math.ceil((to-from)*sr),c=new OfflineAudioContext(1,len,sr);
  const voice=c.createGain();voice.gain.value=1;voice.connect(c.destination);
  const sfx=c.createGain();sfx.gain.value=.5;sfx.connect(c.destination);
  const bufs={};let cur=null;
  for(const e of R.ev){
    if(e[0]==='voice'){const [,name,t]=e;
      if(!bufs[name])bufs[name]=await fetch(`audio/${name}.mp3`).then(r=>r.arrayBuffer()).then(b=>c.decodeAudioData(b));
      const b=bufs[name],end=t+b.duration;if(end<=from||t>=to){cur=null;continue}
      const s=c.createBufferSource();s.buffer=b;s.connect(voice);
      if(t>=from)s.start(t-from);else s.start(0,from-t);cur={s,end};
    }else if(e[0]==='stop'){const t=e[1];if(cur&&t<cur.end&&t>=from&&t<to){try{cur.s.stop(t-from)}catch(x){}}cur=null}
    else if(e[0]==='fx'){const [,kind,vol,t]=e;if(t>=from&&t<to-.05)fxLive(kind,vol,c,t-from,sfx)}
  }
  const out=(await c.startRendering()).getChannelData(0),pcm=new Int16Array(out.length);
  for(let i=0;i<out.length;i++){const x=Math.max(-1,Math.min(1,out[i]*.95));pcm[i]=x*32767}
  let s='';const u=new Uint8Array(pcm.buffer);for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));
  return btoa(s);
};
})();
