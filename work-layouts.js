(() => {
 document.body.dataset.work='composition';
 const variants=new Set(['caption','title','margin']);
 const requested=new URLSearchParams(location.search).get('work');
 document.body.dataset.workVariant=variants.has(requested)?requested:'caption';
 // The source links still work without JavaScript; here they open a project gallery.
 const viewer=document.createElement('dialog');viewer.className='work-viewer';viewer.setAttribute('aria-label','Project image viewer');
 viewer.innerHTML=`<div class="work-viewer-bar"><span class="work-viewer-project"></span><span class="work-viewer-count" aria-live="polite"></span><button class="work-viewer-close" type="button" aria-label="Close image viewer">Close ×</button></div><div class="work-viewer-stage"><button class="work-viewer-prev" type="button" aria-label="Previous image">←</button><img alt=""><button class="work-viewer-next" type="button" aria-label="Next image">→</button></div><p class="work-viewer-caption"></p>`;
 document.body.append(viewer);
 let photos=[],current=0,opener=null,closing=false,photoRequest=0;
 const reduce=matchMedia('(prefers-reduced-motion: reduce)');
 function animateViewer(open){
  if(reduce.matches)return Promise.resolve();
  const frames=open?[{opacity:0,transform:'translate(-50%,-50%) scale(.985)'},{opacity:1,transform:'translate(-50%,-50%) scale(1)'}]:[{opacity:1,transform:'translate(-50%,-50%) scale(1)'},{opacity:0,transform:'translate(-50%,-50%) scale(.985)'}];
  return viewer.animate(frames,{duration:open?240:170,easing:'cubic-bezier(.2,.75,.25,1)',fill:'none'}).finished.catch(()=>{});
 }
 async function closeViewer(){if(closing||!viewer.open)return;closing=true;viewer.classList.add('is-closing');await animateViewer(false);viewer.close();viewer.classList.remove('is-closing');closing=false;}
 viewer.addEventListener('cancel',event=>{event.preventDefault();closeViewer();});
 function showPhoto(index){
  current=(index+photos.length)%photos.length;
  const link=photos[current],thumb=link.querySelector('img'),large=viewer.querySelector('.work-viewer-stage img');
  const request=++photoRequest;
  large.src=thumb.currentSrc||thumb.src;large.alt=thumb.alt;
  const full=new Image();full.src=link.href;
  full.decode().then(()=>{if(request===photoRequest&&viewer.open)large.src=full.src;}).catch(()=>{});
  if(viewer.open&&!reduce.matches)large.animate([{opacity:.65},{opacity:1}],{duration:180,easing:'ease-out'});
  viewer.querySelector('.work-viewer-count').textContent=`${current+1} / ${photos.length}`;
  viewer.querySelector('.work-viewer-caption').textContent=thumb.alt;
  for(const offset of [-1,1]){const neighbor=photos[(current+offset+photos.length)%photos.length];const warm=new Image();warm.src=neighbor.href;}
 }
 viewer.querySelector('.work-viewer-close').addEventListener('click',()=>closeViewer());
 viewer.querySelector('.work-viewer-prev').addEventListener('click',()=>showPhoto(current-1));
 viewer.querySelector('.work-viewer-next').addEventListener('click',()=>showPhoto(current+1));
 viewer.addEventListener('keydown',event=>{if(event.key==='ArrowLeft'){event.preventDefault();showPhoto(current-1);}if(event.key==='ArrowRight'){event.preventDefault();showPhoto(current+1);}});
 viewer.addEventListener('click',event=>{if(event.target===viewer)closeViewer();});
 viewer.addEventListener('close',()=>{photoRequest++;viewer.querySelector('.work-viewer-stage img').removeAttribute('src');document.body.classList.remove('work-viewer-open');opener?.focus();});
 document.addEventListener('click',event=>{
  const photo=event.target.closest('.work-photo>a');
  if(photo){event.preventDefault();const article=photo.closest('.work-item');photos=[...article.querySelectorAll('.work-photo>a')];current=photos.indexOf(photo);opener=photo;viewer.querySelector('.work-viewer-project').textContent=article.querySelector('h3').textContent;document.querySelectorAll('.work-video').forEach(v=>v.pause());showPhoto(current);document.body.classList.add('work-viewer-open');viewer.showModal();animateViewer(true);return;}
  const play=event.target.closest('[data-animation]');
  if(play){const figure=play.closest('figure'),img=figure.querySelector('img'),existing=figure.querySelector('video');
   if(existing){existing.pause();existing.remove();play.setAttribute('aria-pressed','false');play.textContent='Play detail ↗';}
   else{const video=document.createElement('video');video.className='work-video';video.src=play.dataset.animation;video.poster=img.currentSrc;video.muted=true;video.playsInline=true;video.controls=true;video.preload='none';video.loop=true;video.setAttribute('aria-label','JUMP scooter battery removal demonstration');figure.append(video);video.play().catch(()=>{});play.setAttribute('aria-pressed','true');play.textContent='Close detail ×';
    const visibility=new IntersectionObserver(entries=>{if(!entries[0].isIntersecting)video.pause();});visibility.observe(video);video.addEventListener('emptied',()=>visibility.disconnect(),{once:true});
   }
  }
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)document.querySelectorAll('.work-video').forEach(v=>v.pause());});
})();
