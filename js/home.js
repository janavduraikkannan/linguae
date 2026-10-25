/* Linguae homepage: the cats' line-up, a card for each language site, and the shared account. */
(function(){
const $=s=>document.querySelector(s),esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const AC=window.ACCT;

/* ---------- line-up: the four cousins, rigged and alive (blinking, breathing), a little bigger on hover ---------- */
const lineCats=[];
function lineup(){
  const svg=$('#lineup');svg.innerHTML='';
  ['felix','felicisimo','felicien','frohlix'].forEach((id,i)=>{
    const c=new Cat(id,svg);c.inner.setAttribute('filter','url(#boilH)');c.place(120+i*240,250,.98);c.setFace(['happy','cheeky','happy','delighted'][i]);c.idle(true);
    c.root.style.cursor='pointer';c.root.addEventListener('pointerenter',()=>{c.setFace('excited');c.hop(14,.4)});c.root.addEventListener('pointerleave',()=>c.setFace('happy'));
    c.root.addEventListener('click',()=>{const el=document.getElementById('card-'+SITES[i].id);if(el){el.scrollIntoView({behavior:'smooth',block:'center'});el.classList.add('flash');setTimeout(()=>el.classList.remove('flash'),1200)}});
    lineCats.push(c);
  });
  if(!window.REDUCED)gsap.from(lineCats.map(c=>c.squash),{y:120,duration:.6,ease:'back.out(1.8)',stagger:.1,delay:.15});
}

/* ---------- language cards ---------- */
function cards(){
  $('#grid').innerHTML=SITES.map(s=>{
    const p=AC.progress(s.store),lv=rankLv(p.xp),rk=s.ranks[Math.min(lv,s.ranks.length)-1],c=CATS.chars[s.cat];
    const prog=!s.live?'':p.started?`<div class="prog"><span class="rank"><b>${esc(rk[0])}</b> <small>${esc(rk[1])} · level ${lv}</small></span><span class="pxp">${p.xp.toLocaleString()} XP</span>${p.streak?`<span class="pst"><img src="art/icons/flame.svg" alt="">${p.streak}</span>`:''}</div>`
      :`<div class="prog none">${AC.key?'No '+esc(s.lang)+' progress yet':'Start at '+esc(s.ranks[0][0])+' and climb to '+esc(s.ranks[9][0])}</div>`;
    return `<article class="card${s.live?'':' soon'}" id="card-${s.id}" style="--c:${c.color}">
      <img class="cface" src="art/${s.cat}/face-${s.live?'happy':'thinking'}.svg" alt="">
      <div class="cbody"><p class="clang">${esc(s.lang)}</p><h3>${esc(s.site)}</h3><p class="cblurb">${esc(s.blurb)}</p>
      <p class="ccourses">${esc(s.courses[0])} → ${esc(s.courses[s.courses.length-1])}</p>${prog}
      ${s.live?`<a class="btn" href="${s.url}">Open ${esc(s.site)}<span aria-hidden="true"> →</span></a>`:`<span class="btn" aria-disabled="true" role="link" title="${esc(s.site)} hasn’t been built yet">Coming soon</span><p class="soon-note">${esc(s.site)} hasn’t been built yet. ${esc(c.name)} is getting ready.</p>`}</div>
    </article>`}).join('');
}

/* ---------- account ---------- */
function acctHeader(){
  const n=AC.name()||(AC.key?'Your account':'');$('#acctLabel').textContent=AC.key?n:'Log in';
  $('#acctBtn').classList.toggle('in',!!AC.key);
}
function acctCard(){
  const box=$('#acctCard');
  if(!AC.key){box.innerHTML=`<div class="ac-l"><h2 id="acctH">One account for every site</h2><p>Your account works on Verba, Palabras, Mots, Wörter and every Linguae site to come. Your profile, username and password are shared; XP, levels and streaks are kept separately for each language.</p>
      <ul class="ticks"><li>No email, ever</li><li>Keeps your progress on any device</li><li>Puts you on the leaderboards</li></ul></div>
    <div class="ac-r"><button class="btn" type="button" id="acLogin">Log in</button><button class="btn alt" type="button" id="acNew">Create an account</button><p class="small">Practice without one if you like: an account is optional.</p></div>`;
    $('#acLogin').onclick=()=>dlg('login');$('#acNew').onclick=()=>dlg('new');return}
  const d=AC.data,handle=AC.handle();
  box.innerHTML=`<div class="ac-l"><h2 id="acctH">${esc(AC.name()||'Your account')}${handle?` <small>@${esc(handle)}</small>`:''}</h2>
    ${AC.err?`<p class="err">${esc(AC.err)}</p>`:''}
    <div class="ac-langs">${SITES.filter(s=>s.live).map(s=>{const p=AC.progress(s.store),lv=rankLv(p.xp),rk=s.ranks[Math.min(lv,10)-1];return `<div><span class="dot" style="--c:${CATS.chars[s.cat].color}"></span><b>${esc(s.lang)}</b> ${p.started?`${esc(rk[0])} · ${p.xp.toLocaleString()} XP${p.streak?` · ${p.streak}-day streak`:''}`:'not started'}</div>`}).join('')}</div>
    <p class="small">Change your profile, username and password in the Account window on <a href="${SITE_BY.la.url}">Verba</a> or <a href="${SITE_BY.es.url}">Palabras</a>.</p></div>
    <div class="ac-r"><div class="keybox"><span class="lbl">Account key</span><code id="acKey">${'•'.repeat(4)}-${'•'.repeat(4)}-…</code><button type="button" class="ghost sm" id="acShow">Show</button><button type="button" class="ghost sm" id="acCopy">Copy</button></div>
    <p class="small">The key <i>is</i> the account: anyone with it can log in. Keep it somewhere safe.</p><button type="button" class="btn alt" id="acOut">Log out</button></div>`;
  let shown=false;$('#acShow').onclick=()=>{shown=!shown;$('#acKey').textContent=shown?AC.show(AC.key):'••••-••••-…';$('#acShow').textContent=shown?'Hide':'Show'};
  $('#acCopy').onclick=async()=>{try{await navigator.clipboard.writeText(AC.show(AC.key));$('#acCopy').textContent='Copied'}catch(e){shown=true;$('#acKey').textContent=AC.show(AC.key)}};
  $('#acOut').onclick=()=>{if(!confirmOut())return;AC.signOut();refresh()};
}
function confirmOut(){return window.confirm('Log out on this browser? You’ll need your account key or username and password to log back in. This logs you out of Verba, Palabras, Mots and Wörter too.')}
function dlg(mode){
  const D=$('#acctDlg'),B=$('#acctDlgBody');
  if(mode==='login'){B.innerHTML=`<h2>Log in</h2><div class="tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-t="pw">Username and password</button><button type="button" role="tab" aria-selected="false" data-t="key">Account key</button></div>
    <form id="fPw"><input id="iUser" autocomplete="username" spellcheck="false" autocapitalize="off" placeholder="Username" aria-label="Username"><input id="iPw" type="password" autocomplete="current-password" placeholder="Password" aria-label="Password"><p class="small">Capital letters and accents don’t matter: “Fēlīx” can log in as “felix”.</p><button class="btn" type="submit">Log in</button></form>
    <form id="fKey" hidden><input id="iKey" autocomplete="off" spellcheck="false" placeholder="VERBA-XXXX-XXXX-…" aria-label="Account key"><button class="btn" type="submit">Log in with key</button></form>
    <p class="msg" id="dMsg" role="status"></p><button type="button" class="x" aria-label="Close">×</button>`;
    B.querySelectorAll('[role=tab]').forEach(t=>t.onclick=()=>{B.querySelectorAll('[role=tab]').forEach(x=>x.setAttribute('aria-selected',x===t));$('#fPw').hidden=t.dataset.t!=='pw';$('#fKey').hidden=t.dataset.t!=='key'});
    const run=async(fn,btn)=>{const m=$('#dMsg');m.textContent=btn.dataset.busy||'Checking…';m.className='msg';btn.disabled=true;try{await fn();D.close();refresh()}catch(e){m.textContent=e.message;m.className='msg err'}btn.disabled=false};
    $('#fPw').onsubmit=e=>{e.preventDefault();const b=e.target.querySelector('button');b.dataset.busy='Checking… (this takes a few seconds)';run(()=>AC.signInPassword($('#iUser').value,$('#iPw').value),b)};
    $('#fKey').onsubmit=e=>{e.preventDefault();run(()=>AC.signInKey($('#iKey').value),e.target.querySelector('button'))};
  }else{
    B.innerHTML=`<h2>Create an account</h2><div class="warnbox"><b>Please read first:</b><ul><li>Your account is stored with Google Firebase. It is <b>not encrypted and not private</b>.</li><li>Your <b>account key</b> is how you log in. Save it somewhere safe. There’s no email and no “forgot key”.</li><li>Anything you’ve already practiced in this browser on Verba or Palabras comes with you.</li></ul></div>
      <label class="agree"><input type="checkbox" id="iAgree"> I’ve read this and the <a href="https://github.com/janavduraikkannan/Verba/blob/main/PRIVACY.md" target="_blank" rel="noopener">privacy statement</a></label>
      <button class="btn" type="button" id="bMake" disabled>Create my account</button><p class="msg" id="dMsg" role="status"></p><button type="button" class="x" aria-label="Close">×</button>`;
    $('#iAgree').onchange=e=>$('#bMake').disabled=!e.target.checked;
    $('#bMake').onclick=async()=>{const m=$('#dMsg');$('#bMake').disabled=true;m.textContent='Creating…';try{const k=await AC.create();
      B.innerHTML=`<h2>You’re in!</h2><p>This is your account key. <b>Save it now</b>: it’s the only way back into your account until you set a username and password on Verba or Palabras.</p><div class="bigkey"><code>${AC.show(k)}</code></div><div class="row"><button class="btn" type="button" id="bCopy">Copy key</button><button class="btn alt" type="button" id="bDone">I’ve saved it</button></div>`;
      $('#bCopy').onclick=async()=>{try{await navigator.clipboard.writeText(AC.show(k));$('#bCopy').textContent='Copied'}catch(e){}};$('#bDone').onclick=()=>{D.close();refresh()};
    }catch(e){m.textContent=e.message;m.className='msg err';$('#bMake').disabled=false}};
  }
  B.querySelector('.x')&&(B.querySelector('.x').onclick=()=>D.close());
  D.showModal();
}
async function refresh(){acctHeader();acctCard();cards();if(AC.key){await AC.refresh();acctHeader();acctCard();cards()}}

/* ---------- theme (shared with every site) ---------- */
function theme(){$('#themeBtn').onclick=()=>{const r=document.documentElement,n=r.getAttribute('data-theme')==='dark'?'light':'dark';r.setAttribute('data-theme',n);try{localStorage.setItem('verba-theme',n)}catch(e){}}}

function playIntro(){INTRO.open(()=>{window.scrollTo(0,0)})}
function boot(){
  INTRO.init();theme();lineup();refresh();
  $('#acctBtn').onclick=()=>{if(AC.key)$('#acctSec').scrollIntoView({behavior:'smooth'});else dlg('login')};
  $('#replay').onclick=playIntro;
  let seen=false;try{seen=localStorage.getItem('linguae-intro-seen')==='1'}catch(e){}
  const q=new URLSearchParams(location.search);
  if(q.has('intro')||(!seen&&!q.has('home')))playIntro();
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
})();
