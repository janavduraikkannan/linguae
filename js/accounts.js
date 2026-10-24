/* Linguae accounts: the same accounts as Verba and Palabras (Firebase project verba-791ca), read and created the
   same way. Every site lives on janavduraikkannan.github.io, so logging in here logs you in there too, and the
   other way round: they all keep the account key in localStorage["verba-account"].
   Account document: Latin progress at the top level, Spanish under "es" (French "fr" and German "de" later),
   and the shared profile, login and AI keys at the top level. */
(function(){
const P={projectId:'verba-791ca',apiKey:''};
const FS=`https://firestore.googleapis.com/v1/projects/${P.projectId}/databases/(default)/documents`;
const qk=P.apiKey?'?key='+P.apiKey:'';
const B32='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const LS={get(k){try{return localStorage.getItem(k)}catch(e){return null}},set(k,v){try{v==null?localStorage.removeItem(k):localStorage.setItem(k,v)}catch(e){}}};
const readJ=k=>{const v=LS.get(k);if(v==null)return undefined;try{return JSON.parse(v)}catch(e){return undefined}};

const ACCT={key:LS.get('verba-account')||'',data:null,err:''};
ACCT.newKey=()=>{const a=new Uint8Array(24);crypto.getRandomValues(a);return [...a].map(x=>B32[x%32]).join('')};
ACCT.norm=k=>String(k||'').toUpperCase().replace(/^\s*VERBA/,'').replace(/[^A-Z0-9]/g,'');
ACCT.show=k=>'VERBA-'+k.match(/.{1,4}/g).join('-');

async function get(id){
  const r=await fetch(`${FS}/accounts/${id}${qk}`);
  if(r.status===404)return null;
  if(!r.ok)throw new Error(r.status===403?'The account server refused the request.':'The account server returned error '+r.status+'.');
  const j=await r.json();return JSON.parse(((j.fields||{}).data||{}).stringValue||'{}');
}
async function put(id,data){
  const r=await fetch(`${FS}/accounts/${id}${qk}`,{method:'PATCH',headers:{'Content-Type':'application/json'},
    body:JSON.stringify({fields:{data:{stringValue:JSON.stringify(data)},updated:{timestampValue:new Date().toISOString()}}})});
  if(!r.ok)throw new Error('Saving to the account server failed (error '+r.status+').');
}
/* Progress already saved in this browser by Verba or Palabras (without an account) goes into a new account. */
const VERBA_KEYS=['xp','days','wk','best','since','profile','login','topics','bFrames','bIngs','bFocus','tFocus','per','mode','limit','prov','tab','keyadv'];
const ES_KEYS=['xp','days','wk','best','since','topics','bFrames','bIngs','bFocus','tFocus','per','mode','limit','tab','course'];
function localData(){
  const o={},es={};VERBA_KEYS.forEach(k=>{const v=readJ('verba.'+k);if(v!==undefined)o[k]=v});
  ES_KEYS.forEach(k=>{const v=readJ('palabras.'+k);if(v!==undefined)es[k]=v});if(Object.keys(es).length)o.es=es;return o;
}

ACCT.refresh=async function(){
  if(!ACCT.key){ACCT.data=null;return null}
  try{ACCT.data=await get(ACCT.key);ACCT.err='';if(!ACCT.data){ACCT.err='This browser’s saved account key no longer opens an account.'}}
  catch(e){ACCT.err=e.message}
  return ACCT.data;
};
ACCT.signInKey=async function(raw){
  const k=ACCT.norm(raw);if(k.length!==24)throw new Error('That doesn’t look like an account key. It starts with VERBA- and has 24 more letters and numbers.');
  const d=await get(k);if(!d)throw new Error('No account uses that key. Check for typos.');
  ACCT.key=k;ACCT.data=d;LS.set('verba-account',k);return d;
};
ACCT.create=async function(){
  const k=ACCT.newKey(),d=localData();await put(k,d);ACCT.key=k;ACCT.data=d;LS.set('verba-account',k);return k;
};
ACCT.signOut=function(){ACCT.key='';ACCT.data=null;LS.set('verba-account',null)};

/* Username + password login, exactly as Verba does it: PBKDF2 stretches the two together in the browser; part of
   the result names a record in logins/, the rest decrypts the account key stored in it. */
const normH=x=>String(x||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
const cleanHandle=x=>[...String(x||'').normalize('NFC').replace(/\s+/g,'_')].filter(ch=>/^[a-z0-9_]$/.test(normH(ch))).join('').slice(0,20);
const b64u8=s=>Uint8Array.from(atob(s),c=>c.charCodeAt(0));
async function loginKeys(hid,pw){
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(pw),'PBKDF2',false,['deriveBits']);
  const bits=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:new TextEncoder().encode('verba-login-v2:'+hid),iterations:310000},base,384));
  const id=[...bits.slice(0,16)].map(x=>x.toString(16).padStart(2,'0')).join('');
  const aes=await crypto.subtle.importKey('raw',bits.slice(16),'AES-GCM',false,['decrypt']);
  return{id,aes};
}
ACCT.signInPassword=async function(user,pw){
  const hid=normH(cleanHandle(String(user||'').trim().replace(/^@/,'')));
  if(!/^[a-z0-9_]{3,20}$/.test(hid))throw new Error('Type your username (3 to 20 letters, numbers or _).');
  if(!pw)throw new Error('Type your password.');
  const bad='Wrong username or password, or this account hasn’t set a password. Your account key still works if you have it.';
  const{id,aes}=await loginKeys(hid,pw);
  const r=await fetch(`${FS}/logins/${id}${qk}`);if(r.status===404)throw new Error(bad);if(!r.ok)throw new Error('The account server returned error '+r.status+'.');
  const f=(await r.json()).fields||{},iv=(f.iv||{}).stringValue,ct=(f.ct||{}).stringValue;if(!ct)throw new Error(bad);
  let k;try{k=JSON.parse(new TextDecoder().decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:b64u8(iv)},aes,b64u8(ct)))).k}catch(e){throw new Error(bad)}
  return ACCT.signInKey(k);
};

/* Per-language progress for the homepage cards. */
const today=(d=new Date())=>d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
ACCT.progress=function(store){
  const d=ACCT.data;let src;
  if(d)src=store?d[store]||{}:d;
  else{src={};const pre=store==='es'?'palabras.':store?null:'verba.';if(pre)['xp','days'].forEach(k=>{const v=readJ(pre+k);if(v!==undefined)src[k]=v})}
  const xp=+src.xp||0,days=src.days||{},yd=today(new Date(Date.now()-864e5));
  const streak=(days.last===today()||days.last===yd)?(+days.count||0):0;
  return{xp,streak,started:xp>0};
};
ACCT.name=function(){const p=(ACCT.data||{}).profile||{};return p.disp||p.handle||''};
ACCT.handle=function(){const p=(ACCT.data||{}).profile||{};return p.handle||''};
window.ACCT=ACCT;
})();
