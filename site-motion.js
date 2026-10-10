(() => {
 const footer=new URLSearchParams(location.search).get('footer')||'minimal';
 document.body.dataset.footer=['minimal','signature','contact'].includes(footer)?footer:'minimal';
 const intro=new URLSearchParams(location.search).get('intro')||'inline';
 document.body.dataset.intro=['bar','sidecar','inline'].includes(intro)?intro:'inline';
 const wordmark=new URLSearchParams(location.search).get('wordmark')||'airy';
 document.body.dataset.wordmark=['current','balanced','airy','display'].includes(wordmark)?wordmark:'airy';
 document.querySelectorAll('[data-footer]').forEach(a=>a.setAttribute('aria-current',String(a.dataset.footer===document.body.dataset.footer)));
 const side=location.pathname.startsWith('/sandbox/')?'sandbox':'studio';
 const sandboxPath='/sandbox/';
 const studioPath='/';
 document.documentElement.dataset.motion='dissolve';
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 const input=document.querySelector('.site-slider input');
 const main=document.querySelector('main');
 const start=side==='studio'?0:100;
 const header=new URLSearchParams(location.search).get('header')||'split';
 document.body.dataset.header=['split','stacked','centered'].includes(header)?header:'split';
 document.querySelectorAll('[data-header]').forEach(a=>a.setAttribute('aria-current',String(a.dataset.header===document.body.dataset.header)));
 const layout=new URLSearchParams(location.search).get('layout')||'editorial';
 document.body.dataset.layout=['rows','grid','editorial'].includes(layout)?layout:'rows';
 document.querySelectorAll('[data-layout]').forEach(a=>a.setAttribute('aria-current',a.dataset.layout===document.body.dataset.layout?'true':'false'));
 document.querySelectorAll('[data-side]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.side===side)));


 if(!input||!main)return;
 // Both views remain mounted: no navigation, reparsing or image decoding on repeat switches.
 const root=document.documentElement, page=main.parentElement;
 const stage=document.createElement('div');stage.className='motion-stage';main.before(stage);stage.append(main);
 const panels=new Map([[start,main]]), ghosts=new Map();
 main.classList.add('motion-panel');
 if(start===100)main.classList.add('sandbox-products','product-pinboard');
 document.body.classList.remove('sandbox-products','product-pinboard');
 let position=start, target=start, raf=0, dragging=false, ready=false, pending=null, loading=false;
 let samples=[], lastFrame=0;
 const status=document.createElement('span');status.className='motion-status';status.setAttribute('role','status');document.querySelector('.site-slider').append(status);
 const paths={0:'/',100:'/sandbox/'};
 function paint(v){
  position=v;input.value=v;input.setAttribute('aria-valuetext',v<50?'Studio':'After Hours');
  const haze=Math.sin(v/100*Math.PI)*.55;
  for(const [end,panel] of panels){const weight=end===100?v/100:1-v/100;panel.style.opacity=String(weight*(1-haze));if(ghosts.has(end))ghosts.get(end).style.opacity=String(weight*haze);}
 }
 function finish(){
  for(const [end,panel] of panels){panel.hidden=end!==target;panel.inert=end!==target;panel.style.willChange='';}
  for(const ghost of ghosts.values()){ghost.hidden=true;ghost.style.willChange='';}
  stage.style.height='';stage.classList.remove('is-moving');
  root.dataset.transitionVerified='complete';root.dataset.transitionFrames=JSON.stringify({count:samples.length,maxGap:Math.round(Math.max(0,...samples)),over34ms:samples.filter(n=>n>34).length});
 }
 function makeGhost(end,p){
  const ghost=p.cloneNode(true);ghost.classList.add('motion-ghost');ghost.removeAttribute('id');ghost.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));ghost.inert=true;ghost.setAttribute('aria-hidden','true');ghost.hidden=true;
  ghosts.get(end)?.remove();stage.append(ghost);ghosts.set(end,ghost);delete p.dataset.ghostDirty;
 }
 function prepare(){
  for(const [end,p] of panels)if(p.dataset.ghostDirty)makeGhost(end,p);

  for(const ghost of ghosts.values()){ghost.hidden=false;ghost.style.willChange='opacity';}
  for(const panel of panels.values()){panel.hidden=false;panel.style.willChange='opacity';}
  // Measure once, outside the animation loop; reserve the taller view until settled.
  paint(position);
  stage.style.height=Math.max(...[...panels.values()].map(p=>p.offsetHeight))+'px';stage.classList.add('is-moving');
 }
 function move(end,historyMode=true){
  target=end;
  if(!ready){pending={end,historyMode};status.textContent='Loading…';load();return;}
  status.textContent='';cancelAnimationFrame(raf);
  document.querySelectorAll('[data-side]').forEach(b=>b.setAttribute('aria-pressed',String((b.dataset.side==='studio'?0:100)===end)));
  for(const [side,panel] of panels)panel.inert=side!==end;
  document.title=end===100?'Kalstudio — Product pinboard':'Kalstudio — Studio';
  if(historyMode&&location.pathname!==paths[end])history.pushState({},'',paths[end]);
  if(reduce.matches||document.hidden){paint(end);finish();return;}
  prepare();root.dataset.transitionVerified='running';samples=[];lastFrame=0;
  const from=position, begun=performance.now(),duration=Math.max(90,300*Math.abs(end-from)/100);
  function tick(now){
   if(lastFrame)samples.push(now-lastFrame);lastFrame=now;
   const t=Math.min(1,(now-begun)/duration);paint(from+(end-from)*(t*t*(3-2*t)));
   if(t<1)raf=requestAnimationFrame(tick);else finish();
  }
  raf=requestAnimationFrame(tick);
 }
 input.addEventListener('pointerdown',()=>{if(!ready)return;dragging=true;cancelAnimationFrame(raf);prepare();});
 input.addEventListener('input',()=>{if(ready){cancelAnimationFrame(raf);paint(+input.value);}});
 window.addEventListener('pointerup',()=>{if(dragging){dragging=false;move(position>=50?100:0);}});
 input.addEventListener('change',()=>{if(!dragging)move(+input.value>=50?100:0);});
 input.addEventListener('pointercancel',()=>{dragging=false;move(target);});
 input.addEventListener('blur',()=>{if(dragging){dragging=false;move(position>=50?100:0);}});
 input.addEventListener('keydown',e=>{if(['ArrowRight','ArrowUp','End','ArrowLeft','ArrowDown','Home'].includes(e.key)){e.preventDefault();move(['ArrowRight','ArrowUp','End'].includes(e.key)?100:0);}});
 document.querySelectorAll('[data-side]').forEach(b=>b.onclick=()=>move(b.dataset.side==='studio'?0:100));
 const logo=document.querySelector('.site-header .logo');
 logo?.addEventListener('click',event=>{
  if(event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
  event.preventDefault();
  // The wordmark is a home control: use the same prepared dissolve as the slider.
  if(position!==0||target!==0)move(0);
  else if(location.pathname!=='/'||location.search||location.hash)history.pushState({},'','/');
  window.scrollTo({top:0,behavior:reduce.matches?'instant':'smooth'});
 });
 window.addEventListener('popstate',()=>move(location.pathname.startsWith('/sandbox/')?100:0,false));
 document.addEventListener('visibilitychange',()=>{if(document.hidden&&ready){cancelAnimationFrame(raf);paint(target);finish();}});
 reduce.addEventListener('change',()=>{if(reduce.matches&&ready){cancelAnimationFrame(raf);paint(target);finish();}});
 async function load(){
  if(loading||ready)return;loading=true;
  try{
   const response=await fetch(paths[100-start],{signal:AbortSignal.timeout(8000)});if(!response.ok)throw Error('HTTP '+response.status);
   const doc=new DOMParser().parseFromString(await response.text(),'text/html');
   const panel=doc.querySelector('main');if(!panel)throw Error('Missing view');panel.id=start===0?'sandbox-content':'studio-content';
   panel.classList.add('motion-panel');panel.hidden=true;panel.inert=true;
   if(start===0)panel.classList.add('sandbox-products','product-pinboard');
   panel.querySelectorAll('img').forEach(img=>img.fetchPriority='low');
   stage.append(panel);panels.set(100-start,panel);
   if(start===0)window.initKalstudioProduct?.(panel);
   await Promise.race([new Promise(resolve=>setTimeout(resolve,3000)),Promise.allSettled([document.fonts.ready,...[...panels.values()].flatMap(p=>[...p.querySelectorAll('.gallery-main, .logos img')]).map(img=>{img.loading='eager';return img.decode();})])]);
   for(const [end,p] of panels){makeGhost(end,p);p.addEventListener('click',()=>p.dataset.ghostDirty='true');p.addEventListener('input',()=>p.dataset.ghostDirty='true');}

   ready=true;root.dataset.motionReady='true';paint(position);
   if(pending){const next=pending;pending=null;move(next.end,next.historyMode);}
  }catch(error){loading=false;root.dataset.motionReady='error';status.textContent='Unable to load — try again';pending=null;}
 }
 // Let the current document and critical fonts finish before warming the other view.
 // An explicit slider action calls load() immediately instead.
 function warm(){if('requestIdleCallback' in window)requestIdleCallback(()=>load(),{timeout:800});else setTimeout(load,0);}
 paint(start);
 if(document.readyState==='complete')warm();else window.addEventListener('load',warm,{once:true});
})();
