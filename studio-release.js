(() => {
  const palette = ['oxide', 'moss', 'blueprint', 'chalk'];
  const names = {oxide:'Oxide', moss:'Moss', blueprint:'Blue Hour', chalk:'Chalk'};
  const key = 'kalstudio-after-hours-color-index';
  let index = -1;
  try {
    const raw = sessionStorage.getItem(key);
    const value = Number(raw);
    if (raw !== null && Number.isInteger(value) && value >= 0 && value < palette.length) index = value;
  } catch {}
  function select(value, persist = true) {
    const next = palette.indexOf(value);
    if (next < 0) return;
    document.body.dataset.variant = value;
    const label=document.querySelector('.palette-current'); if(label) label.textContent = names[value];
    if (persist) {
      index = next;
      try { sessionStorage.setItem(key, String(index)); } catch {}
    }
  }
  select(palette[Math.max(0, index)], false);
  window.addEventListener('kalstudio:enter-after-hours', () => select(palette[(index + 1) % palette.length]));
})();

(() => {
  const slider = document.querySelector('.site-slider');
  const input = slider?.querySelector('input[type=range]');
  const studio = document.querySelector('.study-stage main');
  if (!slider || !input || !studio) return;

  const track = document.createElement('span');
  track.className = 'cam-track';
  input.before(track);
  track.append(input);
  const cam = document.createElement('span');
  cam.className = 'cam-thumb';
  cam.setAttribute('aria-hidden', 'true');
  cam.innerHTML = '<svg viewBox="0 0 36 36"><defs><linearGradient id="cam-metal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#faf8f3"/><stop offset=".48" stop-color="#c9c5bc"/><stop offset="1" stop-color="#e8e4da"/></linearGradient><linearGradient id="cam-brushed" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#f5f4ee"/><stop offset=".33" stop-color="#d7d7cf"/><stop offset=".7" stop-color="#eeeae2"/><stop offset="1" stop-color="#c4c5be"/></linearGradient></defs><path class="cam-body" d="M16 3.5C22.4 3.5 28.9 9.7 30.3 17.4c1.3 7.4-3.9 14.1-11.1 15.1C11.1 33.6 5 28.8 4.5 21.8 4.1 16.1 7.1 12.2 11 9.7c2.2-1.4 3.2-4.6 5-6.2Z"/><circle class="cam-bore" cx="14.5" cy="20" r="3.3"/></svg>';
  track.append(cam);
  const camChoices = new Set(['porcelain', 'aluminum', 'nickel', 'outline', 'brushed']);
  const geometries = {
    porcelain: {shape:'M15 3.5C21 3.5 28.7 9.3 30 16.5c1.5 8-3.7 14.8-11.4 15.8C10.5 33.3 4 28.4 4 21.2c0-5.5 3.7-8.4 7.1-11.1 2.1-1.6 2-5.4 3.9-6.6Z', bore:[14,20]},
    aluminum: {shape:'M14.5 3.5C21.4 2.8 29.5 10.2 30.8 18.2c1.1 7.2-4.2 13.8-12.1 14.1C10.5 32.6 4 27.7 4 20.1c0-4.8 3.4-7.1 6.5-9.8 2.4-2.2 2.1-5.6 4-6.8Z', bore:[14,20]},
    brushed: {shape:'M13.6 3.4C20.7 2.9 29 10.4 31 18.7c1.4 6.7-3.6 12.9-11.6 13.7C11.4 33.2 4.2 27.8 4.2 20.5c0-4.6 3.7-7.4 6.3-9.8 2.4-2.2 1.1-5.4 3.1-7.3Z', bore:[14,20]},
    nickel: {shape:'M11 4.1C18.2 1.1 28.7 5.4 31 13.6c1.5 5.7-2.8 10.8-8.4 12.5-4.2 1.2-4.9 5.6-10.2 6C6.5 32.4 3 27.8 4 21.6c.7-4.5 4.8-6.5 6-10.3.8-2.4-.6-5.7 1-7.2Z', bore:[14,20]},
    outline: {shape:'M10.2 4.4C17.7 1.2 28.4 6.2 30.5 15.2c1.8 7.8-4.3 14.6-12.5 16.5C10.1 33.5 4 28.8 4 21.6c0-4.7 3.8-6.7 5.6-10.5 1.1-2.3-.6-5.3.6-6.7Z', bore:[14,20]}
  };
  function setCam(choice) {
    if (!camChoices.has(choice)) return;
    document.body.dataset.cam = choice;
    cam.querySelector('.cam-body').setAttribute('d', geometries[choice].shape);
    cam.querySelector('.cam-bore').setAttribute('cx', geometries[choice].bore[0]);
    cam.querySelector('.cam-bore').setAttribute('cy', geometries[choice].bore[1]);
    document.querySelectorAll('[data-cam]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.cam === choice)));
    if(!document.body.dataset.production){const url = new URL(location.href);url.searchParams.set('cam', choice);history.replaceState(null, '', url);}
  }
  document.querySelectorAll('[data-cam]').forEach(button => button.addEventListener('click', () => setCam(button.dataset.cam)));
  setCam(camChoices.has(new URLSearchParams(location.search).get('cam')) ? new URLSearchParams(location.search).get('cam') : 'brushed');
  const status = document.createElement('span');
  status.className = 'cam-status';
  status.setAttribute('role', 'status');
  slider.append(status);

  const stage = document.createElement('div');
  stage.className = 'cam-stage';
  studio.before(stage);
  stage.append(studio);
  studio.classList.add('cam-panel');
  const blue = document.createElement('div');
  blue.className = 'cam-blue';
  stage.append(blue);

  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let after, ready = false, loading, pending, position = 0, target = 0, frame = 0, dragging = false, suppressChangeUntil = 0;
  const clamp = value => Math.max(0, Math.min(100, value));
  function paint(value) {
    position = clamp(value);
    const fraction = position / 100;
    input.value = String(Math.round(position));
    input.setAttribute('aria-valuetext', fraction < .5 ? 'Studio' : 'After Hours');
    slider.style.setProperty('--cam-position', fraction);
    document.body.style.setProperty('--ah-progress', String(fraction));
    studio.style.opacity = String(1 - fraction);
    if (after) after.style.opacity = String(fraction);
    blue.style.opacity = String(Math.sin(fraction * Math.PI) * .18);
  }
  function settle() {
    frame = 0;
    stage.classList.remove('is-moving');
    stage.style.height = '';
    studio.hidden = target === 100;
    studio.inert = target === 100;
    if (after) { after.hidden = target === 0; after.inert = target === 0; }
    blue.style.opacity = '0';
    document.querySelectorAll('.site-slider [data-side]').forEach(button => button.setAttribute('aria-pressed', String((button.dataset.side === 'studio' ? 0 : 100) === target)));
  }
  function prepare() {
    studio.hidden = false;
    after.hidden = false;
    stage.style.height = Math.max(studio.offsetHeight, after.offsetHeight) + 'px';
    stage.classList.add('is-moving');
  }
  function move(end) {
    if (frame && target === end) return;
    if (end === 100 && target !== 100) window.dispatchEvent(new Event('kalstudio:enter-after-hours'));
    target = end;
    if (!ready) { pending = end; status.textContent = 'Loading…'; load(); return; }
    status.textContent = '';
    cancelAnimationFrame(frame);
    if (reduced.matches || document.hidden) { paint(end); settle(); return; }
    prepare();
    const from = position, begin = performance.now();
    const duration = Math.max(120, 390 * Math.abs(end - from) / 100);
    function tick(now) {
      const t = Math.min(1, (now - begin) / duration);
      const ease = t * t * (3 - 2 * t);
      paint(from + (end - from) * ease);
      if (t < 1) frame = requestAnimationFrame(tick);
      else settle();
    }
    frame = requestAnimationFrame(tick);
  }
  async function load() {
    if (loading || ready) return;
    loading = true;
    try {
      const response = await fetch('/sandbox/');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const parsed = new DOMParser().parseFromString(await response.text(), 'text/html');
      after = parsed.querySelector('main');
      if (!after) throw new Error('Missing After Hours view');
      after.removeAttribute('id');
      after.classList.add('cam-panel', 'sandbox-products', 'product-pinboard');
      after.hidden = true;
      after.inert = true;
      after.querySelectorAll('img').forEach(image => { image.loading = 'lazy'; });
      stage.insertBefore(after, blue);
      window.initKalstudioProduct?.(after);
      ready = true;
      loading = false;
      if (pending !== undefined) { const end = pending; pending = undefined; move(end); }
    } catch (error) {
      loading = false;
      pending = undefined;
      status.textContent = 'Could not load After Hours';
    }
  }
  input.addEventListener('pointerdown', () => { if (ready) { dragging = true; cancelAnimationFrame(frame); frame = 0; prepare(); } });
  input.addEventListener('input', () => { if (ready) paint(Number(input.value)); });
  input.addEventListener('change', () => { if (!dragging && performance.now() > suppressChangeUntil) move(Number(input.value) >= 50 ? 100 : 0); });
  window.addEventListener('pointerup', () => { if (dragging) { dragging = false; suppressChangeUntil = performance.now() + 500; move(position >= 50 ? 100 : 0); } });
  input.addEventListener('pointercancel', () => { dragging = false; move(target); });
  input.addEventListener('keydown', event => {
    if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    move(['ArrowRight', 'ArrowUp', 'End'].includes(event.key) ? 100 : 0);
  });
  slider.querySelectorAll('[data-side]').forEach(button => {
    button.onclick = () => move(button.dataset.side === 'studio' ? 0 : 100);
  });
  document.querySelector('.site-header .logo')?.addEventListener('click', event => {
    if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    move(0);
    window.scrollTo({ top: 0, behavior: reduced.matches ? 'instant' : 'smooth' });
  });
  document.addEventListener('visibilitychange', () => { if (document.hidden && ready) { cancelAnimationFrame(frame); paint(target); settle(); } });
  reduced.addEventListener('change', () => { if (reduced.matches && ready) { cancelAnimationFrame(frame); paint(target); settle(); } });
  paint(0);
  settle();
  if ('requestIdleCallback' in window) requestIdleCallback(load, {timeout: 1000}); else setTimeout(load, 0);
})();

(() => {
  if (document.body.dataset.workDisclosureReady === 'true') return;
  document.body.dataset.workDisclosureReady = 'true';
  const projects = {
    aescape: {roles:['Engineering Lead - Next Gen Console','Engineering Lead - Sustaining Hardware','Senior Mechanical Engineer','Contract Mechanical Engineer'],contributions:['Owned a 60+ cable assembly from concept through production, plus electromechanical assembly layout and mounting','Led hardware sustaining for the existing robotic massage system and NPI for a next-generation console integrating 4K OLED, a voice-interface microphone, speaker, E-stop, cable assembly, and PCBAs']},
    peloton: {role:'Contract Mechanical Engineer',contributions:['Contributed to Peloton Row mechanical design across the seat slider, rail, wall anchor, and handlebar','Contributed to mechanical design for an unreleased Peloton product']},
    uber: {role:'Mechanical Engineer',contributions:['Designed production components for shared electric bikes and scooters','Investigated a battery rattle issue through iterative design and testing']},
    sandbar: {role:'Contract Mechanical Engineer',contributions:['Developing and testing mechanical subsystems for future products','Building prototypes to evaluate subsystem concepts and design tradeoffs']}
  };
  const screwHeads = {
    aescape: {drive:'<path d="M18 10.5v15M10.5 18h15"/>', loosen:'-45deg'},
    peloton: {drive:'<path d="m18 10.3 6.7 3.85v7.7L18 25.7l-6.7-3.85v-7.7L18 10.3Z"/>', loosen:'-30deg'},
    uber: {drive:'<path d="M18 7.5c1.7 0 2 2.9 3.5 3.8s4.6-1.2 5.8.9-1.8 4.3-1.8 5.8 3 3.7 1.8 5.8-4.3 0-5.8.9-1.8 3.8-3.5 3.8-2-2.9-3.5-3.8-4.6 1.2-5.8-.9 1.8-4.3 1.8-5.8-3-3.7-1.8-5.8 4.3 0 5.8-.9 1.8-3.8 3.5-3.8Z"/>', loosen:'-30deg'},
    sandbar: {drive:'<rect x="12.7" y="12.7" width="10.6" height="10.6" rx=".35"/>', loosen:'-45deg'}
  };
  const screwIcon=id=>`<svg class="screw-icon screw-${id}" viewBox="0 0 36 36" aria-hidden="true"><circle class="head-rim" cx="18" cy="18" r="14"/><circle class="head-bevel" cx="18" cy="18" r="11.3"/><g class="screw-drive">${screwHeads[id].drive}</g></svg>`;
  const escapeHtml=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const renderCopy=(p,key,fallback)=>Array.isArray(p[key])?`<ul class="study-${key==='roles'?'role-list':'contribution-list'}">${p[key].map(text=>`<li>${escapeHtml(text)}</li>`).join('')}</ul>`:`<p class="study-${key==='roles'?'role':'contribution'}">${escapeHtml(p[key]||fallback)}</p>`;
  let openItem=null;
  for(const item of document.querySelectorAll('.projects .work-item')){
    const id=item.dataset.client,p=projects[id];if(!p)continue;
    item.querySelector('.work-description').insertAdjacentHTML('beforeend',`<button class="study-toggle treatment-integrated" type="button" aria-expanded="false" aria-controls="caption-detail-${id}"><span class="study-toggle-label">View work</span><span class="study-symbol" aria-hidden="true" style="--loosen:${screwHeads[id].loosen}">${screwIcon(id)}</span></button>`);
    item.insertAdjacentHTML('beforeend',`<div class="study-detail" id="caption-detail-${id}" inert><div class="study-detail-inner"><div class="study-detail-grid"><div><span class="study-detail-label">Role</span>${renderCopy(p,'roles',p.role)}</div><div><span class="study-detail-label">Contributions</span>${renderCopy(p,'contributions',p.contribution)}</div></div></div></div>`);
  }
  function toggle(item,open){
    const b=item.querySelector('.study-toggle'),panel=item.querySelector('.study-detail');
    b.setAttribute('aria-expanded',String(open));
    b.querySelector('.study-toggle-label').textContent=open?'Hide work':'View work';
    item.classList.toggle('study-open',open);
    panel.inert=!open;
    if(open)openItem=item;
    else if(openItem===item)openItem=null;
  }
  document.addEventListener('click',event=>{const b=event.target.closest('.study-toggle');if(!b)return;const item=b.closest('.work-item');toggle(item,!item.classList.contains('study-open'))});
  document.querySelectorAll('.clients .logos a[href^="#"]').forEach(link=>link.addEventListener('click',event=>{
    const target=document.getElementById(link.hash.slice(1));
    if(!target)return;
    event.preventDefault();
    if(!target.classList.contains('study-open'))toggle(target,true);
    target.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'});
    history.replaceState(null,'',link.hash);
  }));
  const logoModes=new Set(['reveal','always','tonal']);
  function setLogos(mode){
    if(!logoModes.has(mode))return;
    document.body.dataset.logos=mode;
    document.querySelectorAll('.logo-choices button').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.logos===mode)));
    if(!document.body.dataset.production){const url=new URL(location.href);url.searchParams.set('logos',mode);history.replaceState(null,'',url);}
  }
  document.querySelectorAll('.logo-choices button').forEach(button=>button.addEventListener('click',()=>setLogos(button.dataset.logos)));
  setLogos(logoModes.has(new URLSearchParams(location.search).get('logos'))?new URLSearchParams(location.search).get('logos'):'tonal');
  const choices=new Set(['precision']);
  function setLayout(layout){if(!choices.has(layout))return;if(openItem)toggle(openItem,false);document.body.dataset.study=layout;document.querySelectorAll('.study-bar [data-study]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.study===layout)));if(!document.body.dataset.production){const url=new URL(location.href);url.searchParams.set('layout',layout);history.replaceState(null,'',url);}const frame=document.querySelector('.study-mobile-frame');if(frame){const next=new URL(frame.src);next.searchParams.set('layout',layout);frame.src=next.href}}
  document.querySelectorAll('.study-bar [data-study]').forEach(b=>b.addEventListener('click',()=>setLayout(b.dataset.study)));
  setLayout('precision');
  const mobile=document.querySelector('.study-mobile');if(new URLSearchParams(location.search).has('embedded'))document.body.classList.add('study-embedded');mobile?.addEventListener('click',()=>{const on=document.body.classList.toggle('study-mobile-on');mobile.setAttribute('aria-pressed',String(on));mobile.textContent=on?'Desktop ↗':'Mobile ↗';if(on&&!document.querySelector('.study-mobile-frame')){const frame=document.createElement('iframe');frame.className='study-mobile-frame';frame.title='Kalstudio mobile motion preview';const src=new URL(location.href);src.searchParams.set('embedded','1');frame.src=src.href;document.querySelector('.study-stage').after(frame)}});
})();

(() => {
  const choices = new Set(['circlip', 'race', 'linkage', 'collet', 'bayonet']);
  function select(choice) {
    if (!choices.has(choice)) return;
    document.body.dataset.fourth = choice;
    document.querySelectorAll('[data-fourth]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.fourth === choice)));
    if(!document.body.dataset.production){const url = new URL(location.href);url.searchParams.set('fourth', choice);history.replaceState(null, '', url);}
  }
  document.querySelectorAll('[data-fourth]').forEach(button => button.addEventListener('click', () => select(button.dataset.fourth)));
  const initial = new URLSearchParams(location.search).get('fourth');
  select(choices.has(initial) ? initial : 'circlip');
})();
