// Vendored from https://github.com/Sudhakarrupnar/AFVAR_Avatar_Final (packages/avatar-embed v1.2.0).
// One deviation from upstream, marked below in mountAvatar: the default same-directory viewer URL
// is removed (Turbopack fails resolving its asset reference), so viewerUrl is required here.
const CHANNEL='afvar-avatar',VERSION=1;
const record=value=>!!value&&typeof value==='object'&&!Array.isArray(value);
const failure=(message,code='avatar_error')=>Object.assign(new Error(message),{code});
const safe=(fn,value)=>{try{fn?.(value);}catch{}};
const loopback=host=>['localhost','127.0.0.1','[::1]'].includes(host);
function safeUrl(value,base,label){
  if(typeof value!=='string'||value.length>2048)throw failure(`${label} is invalid.`,'invalid_url');
  const url=new URL(value,base);
  if(url.username||url.password||url.hash||url.protocol!=='https:'&&!(url.protocol==='http:'&&loopback(url.hostname)))throw failure(`${label} must use HTTPS (or localhost), without credentials or a fragment.`,'invalid_url');
  return url;
}
function publicState(value){const s=record(value)?value:{};return {phase:String(s.phase||'idle').slice(0,40),emotion:String(s.emotion||'neutral').slice(0,40),gesture:String(s.gesture||'idle').slice(0,40),visible:s.visible!==false};}

const SKILL_TYPES=new Set(['turn.start','listening','thinking','behavior','speech.start','speech.frame','speech.end','turn.end','cancel']);
function skillState(value){const s=record(value)?value:{},result={version:1,skillPackVersion:String(s.skillPackVersion||'').slice(0,40)};for(const key of ['phase','gesture','emotion','intent','hologramPhase'])if(typeof s[key]==='string')result[key]=s[key].slice(0,40);if(s.audioClock===null)result.audioClock=null;result.turnId=typeof s.turnId==='string'?s.turnId.slice(0,96):null;if(Number.isSafeInteger(s.seq))result.seq=s.seq;for(const key of ['mouth','mouthWidth','mouthHeight','audioClock','cueCount'])if(Number.isFinite(s[key]))result[key]=s[key];for(const key of ['speaking','paused','reducedMotion','active'])if(typeof s[key]==='boolean')result[key]=s[key];if(record(s.safety))result.safety=Object.fromEntries(['risk','distress','suppressPlay','negatedAffect'].map(key=>[key,s.safety[key]===true]));return result;}
function checkedSkillEvent(value){
  if(!record(value)||value.version!==1||!SKILL_TYPES.has(value.type)||typeof value.turnId!=='string'||!value.turnId.trim()||value.turnId.length>96||!Number.isSafeInteger(value.seq)||value.seq<0)throw failure('Use a version 1 skill event with type, turnId and an increasing sequence number.','invalid_skill_event');
  if(Object.keys(value).some(key=>/audioData|audioBuffer|rawAudio|token|apiKey/i.test(key)))throw failure('Skill events carry behavior and playback timing, never raw audio or credentials.','invalid_skill_event');
  let json;try{json=JSON.stringify(value);}catch{throw failure('Skill events must be JSON data.','invalid_skill_event');}
  if(json.length>16384)throw failure('Skill event is too large.','invalid_skill_event');return JSON.parse(json);
}

/** Mount a viewer. This function never starts microphone capture or audio. */
export function mountAvatar(container,options={}){
  const win=globalThis.window,doc=globalThis.document;
  if(!win||!doc||!container||typeof container.appendChild!=='function')throw failure('Mount AFVAR into a browser element.','invalid_container');
  if(['apiKey','token','secret','credentials'].some(key=>key in options))throw failure('Provider credentials belong on your API server, never in embed options.','client_credentials');
  const aiMode=options.aiMode??'demo';if(!['demo','external'].includes(aiMode))throw failure('AI mode must be demo or external.','invalid_mode');
  const page=new URL(win.location.href);
  if(!/^https?:$/.test(page.protocol)||page.origin==='null')throw failure('Serve the host page over HTTPS or localhost; file pages are unsupported.','invalid_origin');
  // Deviation from upstream: no './viewer/index.html' default beside this module.
  if(!options.viewerUrl)throw failure('Pass viewerUrl explicitly.','explicit_viewer_required');
  const viewer=safeUrl(options.viewerUrl,page.href,'Viewer URL');
  const apiInput=options.apiEndpoint??'/api/avatar';
  if(typeof apiInput!=='string'||apiInput.startsWith('//')||(!apiInput.startsWith('/')&&!/^https?:\/\//i.test(apiInput)))throw failure('Use an explicit HTTPS API endpoint or /path.','invalid_endpoint');
  const api=safeUrl(apiInput,viewer.href,'API endpoint');
  if(api.search)throw failure('The API endpoint must not contain query parameters or credentials.','invalid_endpoint');
  const apiEndpoint=apiInput.startsWith('/')?api.pathname:api.href;
  const instanceId=globalThis.crypto?.randomUUID?.()||`afvar_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  viewer.searchParams.set('embed','1');viewer.searchParams.set('parentOrigin',page.origin);viewer.searchParams.set('instanceId',instanceId);viewer.searchParams.set('apiEndpoint',apiEndpoint);viewer.searchParams.set('aiMode',aiMode);
  const iframe=doc.createElement('iframe');iframe.title=options.title||'AFVAR avatar';iframe.allow=aiMode==='external'?"microphone 'none'":'microphone';iframe.referrerPolicy='strict-origin-when-cross-origin';
  iframe.setAttribute('sandbox','allow-scripts allow-same-origin allow-downloads');
  iframe.style.width='100%';iframe.style.height='100%';iframe.style.border='0';iframe.style.display='block';
  let disposed=false,initialized=false,readySettled=false,sequence=0,requestedVisible=true,intersecting=true,observer,capabilities=null,notifyingStop=false;
  const pending=new Map(),timeoutMs=Math.max(1000,Math.min(60000,Number(options.timeoutMs)||30000));
  let resolveReady,rejectReady;
  const ready=new Promise((resolve,reject)=>{resolveReady=resolve;rejectReady=reject;});void ready.catch(()=>{});
  const send=value=>{if(disposed)throw failure('Avatar has been disposed.','disposed');iframe.contentWindow?.postMessage({channel:CHANNEL,version:VERSION,instanceId,...value},viewer.origin);};
  const init=()=>{if(!disposed&&!initialized)send({kind:'init',config:{apiEndpoint,aiMode}});};
  const initInterval=setInterval(init,250);
  const readyTimeout=setTimeout(()=>failReady(failure('The avatar did not become ready in time. Check viewerUrl and API configuration.','ready_timeout')),timeoutMs);
  function failReady(error){if(readySettled||disposed)return;readySettled=true;rejectReady(error);safe(options.onError,error);dispose(error);}
  function onMessage(event){
    const message=event.data;
    if(disposed||event.source!==iframe.contentWindow||event.origin!==viewer.origin||!record(message)||message.channel!==CHANNEL||message.version!==VERSION||message.instanceId!==instanceId)return;
    if(message.kind==='boot'){init();return;}
    if(message.kind==='ready'){
      if(initialized)return;
      if(aiMode==='external'&&(message.config?.aiMode!=='external'||message.capabilities?.sendEvent!==true||message.capabilities?.skillProtocolVersion!==1)){failReady(failure('This viewer does not support the external skill-event contract.','unsupported_skill_protocol'));return;}
      capabilities=Object.freeze({aiMode,sendEvent:message.capabilities?.sendEvent===true,skillProtocolVersion:message.capabilities?.skillProtocolVersion??null,skillPackVersion:String(message.capabilities?.skillPackVersion||'').slice(0,40)});
      initialized=readySettled=true;clearInterval(initInterval);clearTimeout(readyTimeout);
      const state=publicState(message.state);resolveReady(state);safe(options.onReady,state);updateVisibility();return;
    }
    if(initialized&&aiMode==='external'&&message.kind==='skill-state'){safe(options.onSkillState,skillState(message.state));return;}
    if(initialized&&aiMode==='external'&&['talk-request','stop-request'].includes(message.kind)){const input=message.request||{},request={requestId:String(input.requestId||'').slice(0,100),source:String(input.source||'viewer').slice(0,20),reason:String(input.reason||'').slice(0,100)};safe(message.kind==='talk-request'?options.onTalkRequest:options.onStopRequest,request);return;}
    if(message.kind==='state'){if(initialized)safe(options.onState,publicState(message.state));return;}
    if(message.kind==='error'){
      const error=failure(String(message.error?.message||'Avatar configuration failed.').slice(0,240),String(message.error?.code||'avatar_error').slice(0,40));
      if(!initialized)failReady(error);else safe(options.onError,error);return;
    }
    if(message.kind==='result'&&pending.has(message.id)){
      const request=pending.get(message.id);pending.delete(message.id);clearTimeout(request.timer);
      if(message.ok===true)request.resolve(request.command==='skillEvent'?skillState(message.skillState):publicState(message.state));
      else{const error=failure(String(message.error?.message||'Avatar command failed.').slice(0,240),String(message.error?.code||'command_failed').slice(0,40));request.reject(error);safe(options.onError,error);}
    }
  }
  async function command(command,payload){
    if(disposed)throw failure('Avatar has been disposed.','disposed');await ready;if(disposed)throw failure('Avatar has been disposed.','disposed');
    if(pending.size>=32)throw failure('Too many avatar commands are pending.','command_limit');
    const id=`command_${++sequence}`;
    return new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>{pending.delete(id);reject(failure('Avatar command timed out.','command_timeout'));},5000);
      pending.set(id,{resolve,reject,timer,command});
      try{send({kind:'command',id,command,payload});}catch(error){pending.delete(id);clearTimeout(timer);reject(error);}
    });
  }
  function updateVisibility(){if(initialized&&!disposed)void command('visibility',{visible:requestedVisible&&intersecting&&!doc.hidden}).catch(()=>{});}
  function stop(){
    if(disposed)return Promise.reject(failure('Avatar has been disposed.','disposed'));
    if(aiMode==='external'&&!notifyingStop){
      notifyingStop=true;
      try{safe(options.onStopRequest,{requestId:`host_stop_${++sequence}`,source:'host',reason:'Stop requested; stop host-owned audio and AI work.'});}finally{notifyingStop=false;}
    }
    return command('stop');
  }
  function dispose(reason=failure('Avatar has been disposed.','disposed')){
    if(disposed)return;
    if(aiMode==='external')safe(options.onStopRequest,{requestId:`dispose_${instanceId}`,source:'dispose',reason:'Avatar disposed; stop host-owned audio and AI work.'});
    if(initialized){try{send({kind:'command',id:`command_${++sequence}`,command:'dispose'});}catch{}}
    disposed=true;clearInterval(initInterval);clearTimeout(readyTimeout);observer?.disconnect();
    win.removeEventListener('message',onMessage);doc.removeEventListener('visibilitychange',updateVisibility);iframe.removeEventListener('load',init);
    for(const task of pending.values()){clearTimeout(task.timer);task.reject(reason);}pending.clear();
    if(!readySettled){readySettled=true;rejectReady(reason);}iframe.remove();
  }
  win.addEventListener('message',onMessage);doc.addEventListener('visibilitychange',updateVisibility);iframe.addEventListener('load',init);
  iframe.src=viewer.href;container.appendChild(iframe);
  if(win.IntersectionObserver){observer=new win.IntersectionObserver(entries=>{for(const entry of entries)if(entry.target===iframe){intersecting=entry.isIntersecting;updateVisibility();}});observer.observe(iframe);}
  return {ready,iframe,get capabilities(){return capabilities;},sendEvent(value){if(aiMode!=='external')return Promise.reject(failure('sendEvent requires external AI mode.','invalid_mode'));let event;try{event=checkedSkillEvent(value);}catch(error){return Promise.reject(error);}return command('skillEvent',event);},talk:()=>command('talk'),stop,setState:value=>command('setState',value),setVisible(visible){if(typeof visible!=='boolean')return Promise.reject(failure('Visibility must be a boolean.','invalid_visibility'));requestedVisible=visible;iframe.hidden=!visible;iframe.style.display=visible?'block':'none';return command('visibility',{visible:visible&&intersecting&&!doc.hidden});},dispose};
}
