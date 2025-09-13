// ---------- Elements ----------
const $ = (sel) => document.querySelector(sel);
const els = {
  canvas: $('#canvas'),
  a: $('#a'), b: $('#b'), amp: $('#amp'),
  delta: $('#delta'), omega: $('#omega'),
  modeAnimate: $('#modeAnimate'), modeStatic: $('#modeStatic'),
  res: $('#res'), trail: $('#trail'), blend: $('#blend'),
  stroke: $('#stroke'), width: $('#width'),
  rainbow: $('#rainbow'), showAxes: $('#showAxes'), square: $('#square'),
  bgMode: $('#bgMode'), bg: $('#bg'), bg2: $('#bg2'), bg2wrap: $('#bg2wrap'),
  pngTransparent: $('#pngTransparent'), noise: $('#noise'),
  renderScale: $('#renderScale'),
  themeBtn: $('#themeBtn'), langBtn: $('#langBtn'),
  savePNGBtn: $('#savePNGBtn'), savePNGHQBtn: $('#savePNGHQBtn'), saveSVGBtn: $('#saveSVGBtn'),
  randomBtn: $('#randomBtn'), playBtn: $('#playBtn'), pauseBtn: $('#pauseBtn'),
  resetBtn: $('#resetBtn'), drawOnceBtn: $('#drawOnceBtn'),
  presets: $('#presets'),
  statRatio: $('#statRatio'), statPoints: $('#statPoints'), statFps: $('#statFps'),
  canvasWrap: $('#canvas-wrap')
};

// ---------- I18N ----------
let lang = 'bg';
const I18N = {
  bg: {
    title: 'Фигури на Лисажу',
    subtitle: 'Интерактивен генератор · Параметри, анимация и износ',
    theme: 'Тъмна/Светла',
    savePng: 'Запази PNG',
    savePngHq: 'PNG (Hi-Res)',
    saveSvg: 'Запази SVG',
    random: 'Случайни',
    play: 'Пусни',
    pause: 'Пауза',
    reset: 'Нулирай',
    drawOnce: 'Начертай',
    freqs: 'Честоти & амплитуда',
    a: 'a (честота X)',
    b: 'b (честота Y)',
    amp: 'Амплитуда (%)',
    phaseAnim: 'Фаза & анимация',
    delta: 'Δ фаза (°)',
    omega: 'Скорост (ω)',
    modeAnimate: 'Анимирай траектория',
    modeStatic: 'Статично очертаване',
    res: 'Резолюция (точки)',
    trail: 'Trail (%)',
    blend: 'Blend режим',
    style: 'Стил и фон',
    stroke: 'Цвят линия',
    width: 'Дебелина',
    rainbow: 'Дъга (HSL)',
    axes: 'Покажи оси',
    square: 'Квадратна сцена',
    bgMode: 'Фон',
    bgSolid: 'Плътен цвят',
    bgGrad: 'Радиален градиент',
    bgColor: 'Цвят фон',
    bgColor2: 'Фон (вътр.)',
    transparent: 'Прозрачен фон при износ',
    noise: 'Шум фон (%)',
    renderScale: 'Мащаб износ',
    help: 'Шорткъти: Space = Пуск/Пауза · R = Random · S = PNG · T = Тема · L = BG/EN'
  },
  en: {
    title: 'Lissajous Figures',
    subtitle: 'Interactive generator · Parameters, animation & export',
    theme: 'Dark/Light',
    savePng: 'Save PNG',
    savePngHq: 'PNG (Hi-Res)',
    saveSvg: 'Save SVG',
    random: 'Random',
    play: 'Play',
    pause: 'Pause',
    reset: 'Reset',
    drawOnce: 'Draw Once',
    freqs: 'Frequencies & Amplitude',
    a: 'a (X frequency)',
    b: 'b (Y frequency)',
    amp: 'Amplitude (%)',
    phaseAnim: 'Phase & Animation',
    delta: 'Δ phase (°)',
    omega: 'Speed (ω)',
    modeAnimate: 'Animate trajectory',
    modeStatic: 'Static outline',
    res: 'Resolution (points)',
    trail: 'Trail (%)',
    blend: 'Blend mode',
    style: 'Style & Background',
    stroke: 'Stroke color',
    width: 'Stroke width',
    rainbow: 'Rainbow (HSL)',
    axes: 'Show axes',
    square: 'Square stage',
    bgMode: 'Background',
    bgSolid: 'Solid color',
    bgGrad: 'Radial gradient',
    bgColor: 'BG color',
    bgColor2: 'BG inner',
    transparent: 'Transparent on export',
    noise: 'BG noise (%)',
    renderScale: 'Export scale',
    help: 'Shortcuts: Space = Play/Pause · R = Random · S = PNG · T = Theme · L = BG/EN'
  }
};

function applyI18n(){
  document.querySelectorAll('[data-i18n]').forEach(el=>{
    const k = el.getAttribute('data-i18n');
    el.textContent = (I18N[lang][k] ?? el.textContent);
  });
  els.langBtn.textContent = (lang==='bg'?'BG / EN':'EN / BG');
}

// ---------- Theme ----------
let light = false;
function applyTheme(){ document.body.classList.toggle('light', light); }

// ---------- Math ----------
function lissajousPoints(a,b,A,B,delta,n){
  const pts = new Array(n);
  const T = 2*Math.PI;
  for(let i=0;i<n;i++){
    const t = i/(n-1)*T;
    const x = A * Math.sin(a*t + delta);
    const y = B * Math.sin(b*t);
    pts[i] = [x,y];
  }
  return pts;
}

function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }
function rnd(min,max){ return Math.random()*(max-min)+min; }

// ---------- Drawing ----------
const ctx = els.canvas.getContext('2d');
let raf = null, time = 0, lastTs = 0, fps = 0;

function resizeCanvas(){
  const wrap = els.canvasWrap;
  const dpr = window.devicePixelRatio || 1;
  const wCss = wrap.clientWidth;
  let hCss = wrap.clientHeight;
  if(els.square.checked){
    hCss = Math.min(wCss, window.innerHeight - 180);
    wrap.style.height = `${hCss}px`;
  }else{
    wrap.style.height = '';
  }
  els.canvas.width = Math.max(1, Math.floor(wCss*dpr));
  els.canvas.height = Math.max(1, Math.floor(( (els.square.checked? hCss : wrap.clientHeight) || 500 )*dpr));
  draw(true);
}

function fillBackground(w,h,scale){
  const transparent = els.pngTransparent.checked;
  const mode = els.bgMode.value;
  if(transparent) return;
  if(mode==='gradient'){
    const g = ctx.createRadialGradient(w/2, h/2, 0, w/2, h/2, Math.hypot(w,h)/2);
    g.addColorStop(0, els.bg2.value);
    g.addColorStop(1, els.bg.value);
    ctx.fillStyle = g;
  } else {
    ctx.fillStyle = els.bg.value;
  }
  ctx.fillRect(0,0,w,h);

  const noisePct = +els.noise.value;
  if(noisePct>0){
    const alpha = clamp(noisePct/300, 0, 0.25);
    const step = Math.max(1, Math.floor(3*scale));
    ctx.save();
    ctx.globalAlpha = alpha;
    for(let y=0; y<h; y+=step){
      for(let x=0; x<w; x+=step){
        const v = Math.floor(rnd(0,255));
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(x,y,step,step);
      }
    }
    ctx.restore();
  }
}

function draw(force=false){
  const dpr = window.devicePixelRatio || 1;
  const w = els.canvas.width, h = els.canvas.height;
  const scale = 1; // onscreen

  // trail
  const trail = +els.trail.value;
  if(force || trail===0){
    ctx.clearRect(0,0,w,h);
    fillBackground(w,h,scale);
  }else{
    ctx.fillStyle = els.pngTransparent.checked ? 'rgba(0,0,0,0)' : els.bg.value;
    ctx.globalAlpha = clamp((100 - trail)/100, 0.02, 0.9);
    ctx.fillRect(0,0,w,h);
    ctx.globalAlpha = 1;
  }

  const A = (Math.min(w,h)/2 - 16) * (+els.amp.value/100);
  const B = A;
  const a = Math.max(1, Math.floor(+els.a.value));
  const b = Math.max(1, Math.floor(+els.b.value));
  const delta = (+els.delta.value) * Math.PI/180 + (els.modeAnimate.checked ? time * +els.omega.value : 0);
  const n = clamp(Math.floor(+els.res.value), 200, 30000);

  // axes
  if(els.showAxes.checked){
    ctx.save();
    ctx.strokeStyle = 'rgba(125,141,179,.45)';
    ctx.lineWidth = Math.max(1, +els.width.value/2);
    ctx.beginPath();
    ctx.moveTo(0, h/2); ctx.lineTo(w, h/2);
    ctx.moveTo(w/2, 0); ctx.lineTo(w/2, h);
    ctx.stroke();
    ctx.restore();
  }

  // path
  const pts = lissajousPoints(a,b,A,B,delta,n);
  ctx.save();
  ctx.translate(w/2, h/2);
  ctx.globalCompositeOperation = (els.blend.value==='add' ? 'lighter' : 'source-over');
  ctx.lineCap = 'round'; ctx.lineJoin = 'round';

  if(els.rainbow.checked){
    // draw as fragments with hue ramp
    ctx.lineWidth = +els.width.value * (dpr);
    for(let i=1;i<pts.length;i++){
      const [x1,y1]=pts[i-1], [x2,y2]=pts[i];
      const hue = Math.floor(360 * i/pts.length);
      ctx.strokeStyle = `hsl(${hue} 80% 60%)`;
      ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
    }
  } else {
    ctx.strokeStyle = els.stroke.value;
    ctx.lineWidth = +els.width.value * (dpr);
    ctx.beginPath();
    for(let i=0;i<pts.length;i++){
      const [x,y]=pts[i];
      if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y);
    }
    ctx.stroke();
  }
  ctx.restore();

  // stats
  els.statRatio.textContent = `a:b = ${a}:${b}`;
  els.statPoints.textContent = `pts: ${n}`;
}

function isPlaying(){ return raf !== null; }
function loop(ts){
  if(!lastTs) lastTs = ts;
  const dt = (ts - lastTs)/1000;
  lastTs = ts;
  // fps
  fps = Math.round(1/dt);
  els.statFps.textContent = `fps: ${isFinite(fps)?fps:0}`;
  time += dt;
  draw();
  raf = requestAnimationFrame(loop);
}
function play(){ if(!isPlaying()){ lastTs = 0; raf = requestAnimationFrame(loop); } }
function pause(){ if(isPlaying()){ cancelAnimationFrame(raf); raf=null; } }

// ---------- Presets ----------
const PRESETS = [
  {a:1,b:2,delta:0},{a:2,b:1,delta:0},{a:2,b:3,delta:0},{a:3,b:2,delta:0},
  {a:3,b:4,delta:0},{a:4,b:3,delta:0},{a:5,b:4,delta:0},{a:4,b:5,delta:0},
  {a:5,b:6,delta:0},{a:6,b:5,delta:0},{a:5,b:7,delta:0},{a:7,b:5,delta:0},
  {a:7,b:9,delta:0},{a:9,b:7,delta:0},{a:8,b:9,delta:0},{a:9,b:8,delta:0},
  {a:3,b:5,delta:90},{a:5,b:3,delta:90},{a:7,b:11,delta:45},{a:11,b:7,delta:45}
];
function renderPresets(){
  els.presets.innerHTML = '';
  PRESETS.forEach((p,i)=>{
    const btn = document.createElement('button');
    btn.className='chip';
    btn.textContent = `${p.a}:${p.b}${p.delta?` (Δ ${p.delta}°)`:''}`;
    btn.addEventListener('click', ()=>{
      els.a.value=p.a; els.b.value=p.b; els.delta.value=p.delta||0;
      draw(true);
    });
    els.presets.appendChild(btn);
  });
}
function randomNice(){
  const candidates = [1,2,3,4,5,6,7,8,9,10,11];
  let a = candidates[Math.floor(Math.random()*candidates.length)];
  let b = candidates[Math.floor(Math.random()*candidates.length)];
  if(a===b) b = (b%11)+1; // avoid equal
  els.a.value = a; els.b.value = b;
  els.delta.value = [0,0,0,30,45,60,90][Math.floor(Math.random()*7)];
  els.amp.value = Math.floor(rnd(70,92));
  els.width.value = rnd(1.1,2.2).toFixed(1);
  if(Math.random()<0.5){
    els.rainbow.checked = true;
  }else{
    els.rainbow.checked = false;
    els.stroke.value = `#${Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,'0')}`;
  }
  draw(true);
}

// ---------- Export ----------
function drawTo(offCtx, cw, ch, { bgMode='solid', bgColor='#000', bgColor2='#101', noiseIntensity=0, showAxes=false, rainbow=false, stroke='#7ef0c5', width=2, a=3,b=2, amp=85, delta=0, n=3000, blend='normal' }){
  const A = (Math.min(cw,ch)/2 - 16) * (amp/100);
  const B = A;
  // BG
  if(bgMode!=='none'){
    if(bgMode==='gradient'){
      const g = offCtx.createRadialGradient(cw/2,ch/2,0,cw/2,ch/2,Math.hypot(cw,ch)/2);
      g.addColorStop(0, bgColor2);
      g.addColorStop(1, bgColor);
      offCtx.fillStyle = g;
    } else {
      offCtx.fillStyle = bgColor;
    }
    offCtx.fillRect(0,0,cw,ch);
    if(noiseIntensity>0){
      const step = Math.max(1, Math.floor(3));
      offCtx.save();
      offCtx.globalAlpha = Math.min(0.25, noiseIntensity/300);
      for(let y=0;y<ch;y+=step){
        for(let x=0;x<cw;x+=step){
          const v = Math.floor(Math.random()*255);
          offCtx.fillStyle = `rgb(${v},${v},${v})`;
          offCtx.fillRect(x,y,step,step);
        }
      }
      offCtx.restore();
    }
  }
  // axes
  if(showAxes){
    offCtx.save();
    offCtx.strokeStyle = 'rgba(125,141,179,.45)';
    offCtx.lineWidth = Math.max(1, width/2);
    offCtx.beginPath();
    offCtx.moveTo(0, ch/2); offCtx.lineTo(cw, ch/2);
    offCtx.moveTo(cw/2, 0); offCtx.lineTo(cw/2, ch);
    offCtx.stroke();
    offCtx.restore();
  }

  const pts = lissajousPoints(a,b,A,B,delta,n);
  offCtx.save();
  offCtx.translate(cw/2, ch/2);
  offCtx.globalCompositeOperation = (blend==='add' ? 'lighter' : 'source-over');
  offCtx.lineCap = 'round'; offCtx.lineJoin = 'round';

  if(rainbow){
    offCtx.lineWidth = width;
    for(let i=1;i<pts.length;i++){
      const [x1,y1]=pts[i-1], [x2,y2]=pts[i];
      const hue = Math.floor(360 * i/pts.length);
      offCtx.strokeStyle = `hsl(${hue} 80% 60%)`;
      offCtx.beginPath(); offCtx.moveTo(x1,y1); offCtx.lineTo(x2,y2); offCtx.stroke();
    }
  } else {
    offCtx.strokeStyle = stroke;
    offCtx.lineWidth = width;
    offCtx.beginPath();
    for(let i=0;i<pts.length;i++){
      const [x,y]=pts[i];
      if(i===0) offCtx.moveTo(x,y); else offCtx.lineTo(x,y);
    }
    offCtx.stroke();
  }
  offCtx.restore();
}

function savePNG(){
  const dpr = window.devicePixelRatio || 1;
  const cw = els.canvas.width, ch = els.canvas.height;
  const off = document.createElement('canvas');
  off.width = cw; off.height = ch;
  const octx = off.getContext('2d');

  drawTo(octx, cw, ch, {
    bgMode: els.pngTransparent.checked ? 'none' : els.bgMode.value,
    bgColor: els.bg.value,
    bgColor2: els.bg2.value,
    noiseIntensity: +els.noise.value,
    showAxes: els.showAxes.checked, rainbow: els.rainbow.checked, stroke: els.stroke.value, width: +els.width.value*(dpr),
    a: Math.max(1, Math.floor(+els.a.value)), b: Math.max(1, Math.floor(+els.b.value)),
    amp: +els.amp.value, delta: (+els.delta.value) * Math.PI/180, n: clamp(Math.floor(+els.res.value),200,30000),
    blend: els.blend.value
  });
  const link = document.createElement('a');
  link.download = `lissajous_${els.a.value}x${els.b.value}_${Math.floor(cw/dpr)}x${Math.floor(ch/dpr)}.png`;
  link.href = off.toDataURL('image/png');
  link.click();
}

function savePNGHQ(){
  const rs = +els.renderScale.value || 2;
  const dpr = window.devicePixelRatio || 1;
  const w = Math.floor(els.canvas.width/dpr * rs);
  const h = Math.floor(els.canvas.height/dpr * rs);
  const off = document.createElement('canvas');
  off.width = Math.max(1, Math.floor(w * dpr));
  off.height = Math.max(1, Math.floor(h * dpr));
  const octx = off.getContext('2d');
  octx.scale(dpr, dpr);

  drawTo(octx, w, h, {
    bgMode: els.pngTransparent.checked ? 'none' : els.bgMode.value,
    bgColor: els.bg.value,
    bgColor2: els.bg2.value,
    noiseIntensity: +els.noise.value,
    showAxes: els.showAxes.checked, rainbow: els.rainbow.checked, stroke: els.stroke.value, width: +els.width.value,
    a: Math.max(1, Math.floor(+els.a.value)), b: Math.max(1, Math.floor(+els.b.value)),
    amp: +els.amp.value, delta: (+els.delta.value) * Math.PI/180, n: clamp(Math.floor(+els.res.value*rs),200,30000),
    blend: els.blend.value
  });
  const link = document.createElement('a');
  link.download = `lissajous_${els.a.value}x${els.b.value}_${w}x${h}@${rs}x.png`;
  link.href = off.toDataURL('image/png');
  link.click();
}

function saveSVG(){
  const rs = +els.renderScale.value || 1;
  const w = Math.floor(els.canvas.width/(window.devicePixelRatio||1)/rs);
  const h = Math.floor(els.canvas.height/(window.devicePixelRatio||1)/rs);
  const A = (Math.min(w, h)/2 - 16) * (+els.amp.value/100);
  const B = A;
  const a = Math.max(1, Math.floor(+els.a.value));
  const b = Math.max(1, Math.floor(+els.b.value));
  const delta = (+els.delta.value) * Math.PI/180;
  const n = clamp(Math.floor(+els.res.value),200,30000);
  const pts = lissajousPoints(a,b,A,B,delta,n).map(([x,y])=>[x+w/2, y+h/2]);
  const path = pts.map(([x,y],i)=> (i?`L${x.toFixed(2)},${y.toFixed(2)}`:`M${x.toFixed(2)},${y.toFixed(2)}`)).join(' ');
  const stroke = els.rainbow.checked ? 'url(#gstroke)' : els.stroke.value;

  const defsStroke = els.rainbow.checked
    ? `  <linearGradient id="gstroke" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="hsl(0 80% 60%)"/>
      <stop offset="100%" stop-color="hsl(360 80% 60%)"/>
    </linearGradient>`
    : '';

  const bgDef = (els.bgMode.value==='gradient' && !els.pngTransparent.checked)
    ? `  <radialGradient id="bggrad" cx="50%" cy="50%" r="75%">
      <stop offset="0%" stop-color="${els.bg2.value}"/>
      <stop offset="100%" stop-color="${els.bg.value}"/>
    </radialGradient>`
    : '';

  const bgFill = els.pngTransparent.checked ? 'none'
    : (els.bgMode.value==='gradient' ? 'url(#bggrad)' : els.bg.value);

  const svg =
`<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <defs>
${defsStroke}
${bgDef}
  </defs>
  <rect width="100%" height="100%" fill="${bgFill}"/>
  <path d="${path}" fill="none" stroke="${stroke}" stroke-width="${+els.width.value}" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`;

  const blob = new Blob([svg], {type:'image/svg+xml'});
  const url = URL.createObjectURL(blob);
  const aEl = document.createElement('a');
  aEl.href = url; aEl.download = `lissajous_${els.a.value}x${els.b.value}.svg`;
  aEl.click();
  setTimeout(()=>URL.revokeObjectURL(url), 500);
}

// ---------- Events ----------
function updateBgFields(){
  const showGrad = (els.bgMode.value==='gradient');
  els.bg2wrap.style.display = showGrad ? '' : 'none';
}

[
  els.a, els.b, els.amp, els.delta, els.omega, els.res, els.width, els.stroke,
  els.bg, els.bg2, els.bgMode, els.noise, els.renderScale, els.rainbow, els.showAxes, els.square, els.blend, els.trail
].forEach(el=>{
  el.addEventListener('input', ()=>{
    if(el===els.square) resizeCanvas(); else draw(true);
    updateBgFields();
  });
});

els.playBtn.addEventListener('click', play);
els.pauseBtn.addEventListener('click', pause);
els.resetBtn.addEventListener('click', ()=>{ time=0; draw(true); });
els.drawOnceBtn.addEventListener('click', ()=>{ pause(); draw(true); });
els.randomBtn.addEventListener('click', randomNice);
els.savePNGBtn.addEventListener('click', savePNG);
els.savePNGHQBtn.addEventListener('click', savePNGHQ);
els.saveSVGBtn.addEventListener('click', saveSVG);

// Theme & Language
els.themeBtn.addEventListener('click', ()=>{ light=!light; applyTheme(); });
els.langBtn.addEventListener('click', ()=>{ lang = (lang==='bg'?'en':'bg'); applyI18n(); });

// Keyboard shortcuts
window.addEventListener('keydown', (e)=>{
  if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
  if(e.key===' '){ e.preventDefault(); isPlaying() ? pause() : play(); }
  if(e.key.toLowerCase()==='r'){ randomNice(); }
  if(e.key.toLowerCase()==='s'){ savePNG(); }
  if(e.key.toLowerCase()==='t'){ light=!light; applyTheme(); }
  if(e.key.toLowerCase()==='l'){ lang = (lang==='bg'?'en':'bg'); applyI18n(); }
});

// ---------- Init ----------
renderPresets();
applyI18n();
applyTheme();
updateBgFields();
resizeCanvas();
draw(true);
window.addEventListener('resize', resizeCanvas);
