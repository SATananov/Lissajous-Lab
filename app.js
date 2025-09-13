(()=>{
// -------- Helpers & elements --------
const $ = (s)=>document.querySelector(s);
function must(el,id){ if(!el) throw new Error(`Missing #${id} in HTML`); return el; }

function setup(){
  const els = {
    canvas: must($('#canvas'),'canvas'),
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
    canvasWrap: must($('#canvas-wrap'),'canvas-wrap')
  };

  // -------- I18N --------
  let lang = 'bg';
  const I18N = {
    bg:{title:'Фигури на Лисажу',subtitle:'Интерактивен генератор · Параметри, анимация и износ',theme:'Тъмна/Светла',
        savePng:'Запази PNG',savePngHq:'PNG (Hi-Res)',saveSvg:'Запази SVG',random:'Случайни',play:'Пусни',pause:'Пауза',
        reset:'Нулирай',drawOnce:'Начертай',freqs:'Честоти & амплитуда',a:'a (честота X)',b:'b (честота Y)',amp:'Амплитуда (%)',
        phaseAnim:'Фаза & анимация',delta:'Δ фаза (°)',omega:'Скорост (ω)',modeAnimate:'Анимирай траектория',
        modeStatic:'Статично очертаване',res:'Резолюция (точки)',trail:'Trail (%)',blend:'Blend режим',style:'Стил и фон',
        stroke:'Цвят линия',width:'Дебелина',rainbow:'Дъга (HSL)',axes:'Покажи оси',square:'Квадратна сцена',
        bgMode:'Фон',bgSolid:'Плътен цвят',bgGrad:'Радиален градиент',bgColor:'Цвят фон',bgColor2:'Фон (вътр.)',
        transparent:'Прозрачен фон при износ',noise:'Шум фон (%)',renderScale:'Мащаб износ',
        help:'Шорткъти: Space = Пуск/Пауза · R = Random · S = PNG · T = Тема · L = BG/EN'},
    en:{title:'Lissajous Figures',subtitle:'Interactive generator · Parameters, animation & export',theme:'Dark/Light',
        savePng:'Save PNG',savePngHq:'PNG (Hi-Res)',saveSvg:'Save SVG',random:'Random',play:'Play',pause:'Pause',
        reset:'Reset',drawOnce:'Draw Once',freqs:'Frequencies & Amplitude',a:'a (X frequency)',b:'b (Y frequency)',
        amp:'Amplitude (%)',phaseAnim:'Phase & Animation',delta:'Δ phase (°)',omega:'Speed (ω)',
        modeAnimate:'Animate trajectory',modeStatic:'Static outline',res:'Resolution (points)',trail:'Trail (%)',
        blend:'Blend mode',style:'Style & Background',stroke:'Stroke color',width:'Stroke width',rainbow:'Rainbow (HSL)',
        axes:'Show axes',square:'Square stage',bgMode:'Background',bgSolid:'Solid color',bgGrad:'Radial gradient',
        bgColor:'BG color',bgColor2:'BG inner',transparent:'Transparent on export',noise:'BG noise (%)',
        renderScale:'Export scale',help:'Shortcuts: Space = Play/Pause · R = Random · S = PNG · T = Theme · L = BG/EN'}
  };
  function applyI18n(){
    document.querySelectorAll('[data-i18n]').forEach(el=>{
      const k = el.getAttribute('data-i18n');
      if(I18N[lang][k]) el.textContent = I18N[lang][k];
    });
    if(els.langBtn) els.langBtn.textContent = (lang==='bg'?'BG / EN':'EN / BG');
  }

  // -------- Theme --------
  let light=false;
  function applyTheme(){ document.body.classList.toggle('light', light); }

  // -------- Math --------
  const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
  function lissajousPoints(a,b,A,B,delta,n){
    const T=2*Math.PI, pts=new Array(n);
    for(let i=0;i<n;i++){
      const t=i/(n-1)*T;
      pts[i]=[ A*Math.sin(a*t+delta), B*Math.sin(b*t) ];
    }
    return pts;
  }

  // -------- Drawing --------
  const ctx = els.canvas.getContext('2d');
  let raf=null, time=0, lastTs=0;
  function resizeCanvas(){
    const dpr = window.devicePixelRatio||1;
    const wCss = els.canvasWrap.clientWidth;
    let hCss = els.canvasWrap.clientHeight;
    if(els.square?.checked){
      hCss = Math.min(wCss, window.innerHeight-180);
      els.canvasWrap.style.height = `${hCss}px`;
    }else{
      els.canvasWrap.style.height = '';
    }
    els.canvas.width = Math.max(1, Math.floor(wCss*dpr));
    els.canvas.height = Math.max(1, Math.floor(((els.square?.checked?hCss:els.canvasWrap.clientHeight)||500)*dpr));
    draw(true);
  }
  function fillBackground(w,h){
    if(els.pngTransparent?.checked) return;
    if(els.bgMode?.value==='gradient'){
      const g=ctx.createRadialGradient(w/2,h/2,0,w/2,h/2,Math.hypot(w,h)/2);
      g.addColorStop(0, els.bg2?.value||'#16263f'); g.addColorStop(1, els.bg?.value||'#0b1222');
      ctx.fillStyle=g;
    }else{
      ctx.fillStyle = els.bg?.value||'#0b1222';
    }
    ctx.fillRect(0,0,w,h);
    const noisePct = +(els.noise?.value||0);
    if(noisePct>0){
      const alpha = clamp(noisePct/300,0,0.25);
      const step = 3;
      ctx.save(); ctx.globalAlpha=alpha;
      for(let y=0;y<h;y+=step){
        for(let x=0;x<w;x+=step){
          const v=Math.floor(Math.random()*255);
          ctx.fillStyle=`rgb(${v},${v},${v})`;
          ctx.fillRect(x,y,step,step);
        }
      }
      ctx.restore();
    }
  }
  function draw(force=false){
    const dpr=window.devicePixelRatio||1;
    const w=els.canvas.width, h=els.canvas.height;
    const trail=+(els.trail?.value||0);
    if(force || trail===0){ ctx.clearRect(0,0,w,h); fillBackground(w,h); }
    else { ctx.fillStyle = els.pngTransparent?.checked ? 'rgba(0,0,0,0)' : (els.bg?.value||'#0b1222');
           ctx.globalAlpha = clamp((100-trail)/100, .02, .9); ctx.fillRect(0,0,w,h); ctx.globalAlpha=1; }

    const A=(Math.min(w,h)/2-16)* (+(els.amp?.value||85)/100);
    const a=Math.max(1,Math.floor(+(els.a?.value||3)));
    const b=Math.max(1,Math.floor(+(els.b?.value||2)));
    const delta=(+(els.delta?.value||0))*Math.PI/180 + ((els.modeAnimate?.checked)? (+(els.omega?.value||0.6))*time : 0);
    const n=clamp(Math.floor(+(els.res?.value||3000)),200,30000);

    if(els.showAxes?.checked){
      ctx.save(); ctx.strokeStyle='rgba(125,141,179,.45)'; ctx.lineWidth=Math.max(1, +(els.width?.value||1.6)/2);
      ctx.beginPath(); ctx.moveTo(0,h/2); ctx.lineTo(w,h/2); ctx.moveTo(w/2,0); ctx.lineTo(w/2,h); ctx.stroke(); ctx.restore();
    }

    const pts=lissajousPoints(a,b,A,A,delta,n);
    ctx.save(); ctx.translate(w/2,h/2);
    ctx.globalCompositeOperation = (els.blend?.value==='add'?'lighter':'source-over');
    ctx.lineCap='round'; ctx.lineJoin='round';

    if(els.rainbow?.checked){
      ctx.lineWidth = +(els.width?.value||1.6)*(dpr);
      for(let i=1;i<pts.length;i++){
        const [x1,y1]=pts[i-1],[x2,y2]=pts[i];
        const hue=Math.floor(360*i/pts.length);
        ctx.strokeStyle=`hsl(${hue} 80% 60%)`;
        ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke();
      }
    }else{
      ctx.strokeStyle = els.stroke?.value || '#7ef0c5';
      ctx.lineWidth = +(els.width?.value||1.6)*(dpr);
      ctx.beginPath();
      for(let i=0;i<pts.length;i++){ const [x,y]=pts[i]; if(i===0) ctx.moveTo(x,y); else ctx.lineTo(x,y); }
      ctx.stroke();
    }
    ctx.restore();

    els.statRatio && (els.statRatio.textContent=`a:b = ${a}:${b}`);
    els.statPoints && (els.statPoints.textContent=`pts: ${n}`);
  }
  function isPlaying(){ return raf!==null; }
  function loop(ts){
    if(!lastTs) lastTs=ts;
    const dt=(ts-lastTs)/1000; lastTs=ts; time+=dt;
    if(els.statFps){ const fps=Math.round(1/dt); els.statFps.textContent=`fps: ${isFinite(fps)?fps:0}`; }
    draw();
    raf=requestAnimationFrame(loop);
  }
  function play(){ if(!isPlaying()){ lastTs=0; raf=requestAnimationFrame(loop); } }
  function pause(){ if(isPlaying()){ cancelAnimationFrame(raf); raf=null; } }

  // -------- Presets / Random --------
  const PRESETS=[{a:1,b:2},{a:2,b:3},{a:3,b:2},{a:3,b:4},{a:4,b:3},{a:5,b:4},{a:5,b:6},{a:7,b:9},{a:9,b:7},{a:3,b:5,delta:90},{a:7,b:11,delta:45}];
  function renderPresets(){
    if(!els.presets) return;
    els.presets.innerHTML='';
    PRESETS.forEach(p=>{
      const b=document.createElement('button'); b.className='chip';
      b.textContent=`${p.a}:${p.b}${p.delta?` (Δ ${p.delta}°)`:''}`;
      b.addEventListener('click',()=>{ els.a&&(els.a.value=p.a); els.b&&(els.b.value=p.b); els.delta&&(els.delta.value=p.delta||0); draw(true); });
      els.presets.appendChild(b);
    });
  }
  function randomNice(){
    const cand=[1,2,3,4,5,6,7,8,9,10,11];
    let a=cand[Math.floor(Math.random()*cand.length)];
    let b=cand[Math.floor(Math.random()*cand.length)];
    if(a===b) b=(b%11)+1;
    if(els.a) els.a.value=a; if(els.b) els.b.value=b;
    if(els.delta) els.delta.value=[0,0,0,30,45,60,90][Math.floor(Math.random()*7)];
    if(els.amp) els.amp.value=Math.floor(70+Math.random()*22);
    if(els.width) els.width.value=(1.1+Math.random()*1.1).toFixed(1);
    if(els.rainbow) els.rainbow.checked = Math.random()<0.5 ? true : false;
    if(!els.rainbow?.checked && els.stroke){
      els.stroke.value = `#${Math.floor(Math.random()*0xFFFFFF).toString(16).padStart(6,'0')}`;
    }
    draw(true);
  }

  // -------- Export helpers --------
  function drawTo(ctx2,cw,ch,opts){
    const {bgMode='solid',bgColor='#000',bgColor2='#101',noiseIntensity=0,showAxes=false,rainbow=false,stroke='#7ef0c5',width=2,a=3,b=2,amp=85,delta=0,n=3000,blend='normal'}=opts||{};
    const A=(Math.min(cw,ch)/2-16)*(amp/100);
    if(bgMode!=='none'){
      if(bgMode==='gradient'){ const g=ctx2.createRadialGradient(cw/2,ch/2,0,cw/2,ch/2,Math.hypot(cw,ch)/2); g.addColorStop(0,bgColor2); g.addColorStop(1,bgColor); ctx2.fillStyle=g; }
      else { ctx2.fillStyle=bgColor; }
      ctx2.fillRect(0,0,cw,ch);
      if(noiseIntensity>0){
        const step=3; ctx2.save(); ctx2.globalAlpha=Math.min(0.25, noiseIntensity/300);
        for(let y=0;y<ch;y+=step){ for(let x=0;x<cw;x+=step){ const v=Math.floor(Math.random()*255); ctx2.fillStyle=`rgb(${v},${v},${v})`; ctx2.fillRect(x,y,step,step);} }
        ctx2.restore();
      }
    }
    if(showAxes){ ctx2.save(); ctx2.strokeStyle='rgba(125,141,179,.45)'; ctx2.lineWidth=Math.max(1,width/2); ctx2.beginPath(); ctx2.moveTo(0,ch/2); ctx2.lineTo(cw,ch/2); ctx2.moveTo(cw/2,0); ctx2.lineTo(cw/2,ch); ctx2.stroke(); ctx2.restore(); }
    const pts=lissajousPoints(a,b,A,A,delta,n);
    ctx2.save(); ctx2.translate(cw/2,ch/2); ctx2.globalCompositeOperation=(blend==='add'?'lighter':'source-over'); ctx2.lineCap='round'; ctx2.lineJoin='round';
    if(rainbow){ ctx2.lineWidth=width; for(let i=1;i<pts.length;i++){ const [x1,y1]=pts[i-1],[x2,y2]=pts[i]; const hue=Math.floor(360*i/pts.length); ctx2.strokeStyle=`hsl(${hue} 80% 60%)`; ctx2.beginPath(); ctx2.moveTo(x1,y1); ctx2.lineTo(x2,y2); ctx2.stroke(); } }
    else { ctx2.strokeStyle=stroke; ctx2.lineWidth=width; ctx2.beginPath(); for(let i=0;i<pts.length;i++){ const [x,y]=pts[i]; if(i===0) ctx2.moveTo(x,y); else ctx2.lineTo(x,y); } ctx2.stroke(); }
    ctx2.restore();
  }
  function savePNG(){
    const dpr=window.devicePixelRatio||1, cw=els.canvas.width, ch=els.canvas.height;
    const off=document.createElement('canvas'); off.width=cw; off.height=ch; const octx=off.getContext('2d');
    drawTo(octx,cw,ch,{bgMode:(els.pngTransparent?.checked?'none':(els.bgMode?.value||'solid')),bgColor:(els.bg?.value||'#0b1222'),bgColor2:(els.bg2?.value||'#16263f'),
      noiseIntensity:+(els.noise?.value||0),showAxes:!!(els.showAxes?.checked),rainbow:!!(els.rainbow?.checked),stroke:(els.stroke?.value||'#7ef0c5'),width:+(els.width?.value||2)*(dpr),
      a:Math.max(1,Math.floor(+(els.a?.value||3))),b:Math.max(1,Math.floor(+(els.b?.value||2))),amp:+(els.amp?.value||85),delta:(+(els.delta?.value||0))*Math.PI/180,
      n:Math.max(200,Math.min(30000,Math.floor(+(els.res?.value||3000)))),blend:(els.blend?.value||'normal')});
    const a=document.createElement('a'); a.download=`lissajous_${els.a?.value||3}x${els.b?.value||2}_${Math.floor(cw/(dpr))}x${Math.floor(ch/(dpr))}.png`; a.href=off.toDataURL('image/png'); a.click();
  }
  function savePNGHQ(){
    const rs=+(els.renderScale?.value||2), dpr=window.devicePixelRatio||1;
    const w=Math.floor(els.canvas.width/dpr*rs), h=Math.floor(els.canvas.height/dpr*rs);
    const off=document.createElement('canvas'); off.width=Math.max(1,Math.floor(w*dpr)); off.height=Math.max(1,Math.floor(h*dpr));
    const octx=off.getContext('2d'); octx.scale(dpr,dpr);
    drawTo(octx,w,h,{bgMode:(els.pngTransparent?.checked?'none':(els.bgMode?.value||'solid')),bgColor:(els.bg?.value||'#0b1222'),bgColor2:(els.bg2?.value||'#16263f'),
      noiseIntensity:+(els.noise?.value||0),showAxes:!!(els.showAxes?.checked),rainbow:!!(els.rainbow?.checked),stroke:(els.stroke?.value||'#7ef0c5'),width:+(els.width?.value||2),
      a:Math.max(1,Math.floor(+(els.a?.value||3))),b:Math.max(1,Math.floor(+(els.b?.value||2))),amp:+(els.amp?.value||85),delta:(+(els.delta?.value||0))*Math.PI/180,
      n:Math.max(200,Math.min(30000,Math.floor((+(els.res?.value||3000))*rs))),blend:(els.blend?.value||'normal')});
    const a=document.createElement('a'); a.download=`lissajous_${els.a?.value||3}x${els.b?.value||2}_${w}x${h}@${rs}x.png`; a.href=off.toDataURL('image/png'); a.click();
  }
  function saveSVG(){
    const rs=+(els.renderScale?.value||1);
    const w=Math.floor(els.canvas.width/(window.devicePixelRatio||1)/rs);
    const h=Math.floor(els.canvas.height/(window.devicePixelRatio||1)/rs);
    const A=(Math.min(w,h)/2-16)*(+(els.amp?.value||85)/100);
    const a=Math.max(1,Math.floor(+(els.a?.value||3))), b=Math.max(1,Math.floor(+(els.b?.value||2)));
    const delta=(+(els.delta?.value||0))*Math.PI/180;
    const n=Math.max(200,Math.min(30000,Math.floor(+(els.res?.value||3000))));
    const pts = (function(){ const T=2*Math.PI, arr=new Array(n);
      for(let i=0;i<n;i++){ const t=i/(n-1)*T; arr[i]=[ A*Math.sin(a*t+delta)+w/2, A*Math.sin(b*t)+h/2 ]; } return arr; })();
    const path=pts.map(([x,y],i)=> (i?`L${x.toFixed(2)},${y.toFixed(2)}`:`M${x.toFixed(2)},${y.toFixed(2)}`)).join(' ');
    const stroke = (els.rainbow?.checked ? 'url(#gstroke)' : (els.stroke?.value||'#7ef0c5'));
    const defsStroke = els.rainbow?.checked ? `<linearGradient id="gstroke" x1="0%" y1="0%" x2="100%" y2="0%"><stop offset="0%" stop-color="hsl(0 80% 60%)"/><stop offset="100%" stop-color="hsl(360 80% 60%)"/></linearGradient>` : '';
    const bgDef = (!els.pngTransparent?.checked && els.bgMode?.value==='gradient') ? `<radialGradient id="bggrad" cx="50%" cy="50%" r="75%"><stop offset="0%" stop-color="${els.bg2?.value||'#16263f'}"/><stop offset="100%" stop-color="${els.bg?.value||'#0b1222'}"/></radialGradient>` : '';
    const bgFill = els.pngTransparent?.checked ? 'none' : (els.bgMode?.value==='gradient' ? 'url(#bggrad)' : (els.bg?.value||'#0b1222'));
    const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n<defs>\n${defsStroke}\n${bgDef}\n</defs>\n<rect width="100%" height="100%" fill="${bgFill}"/>\n<path d="${path}" fill="none" stroke="${stroke}" stroke-width="${+(els.width?.value||2)}" stroke-linecap="round" stroke-linejoin="round"/>\n</svg>`;
    const blob=new Blob([svg],{type:'image/svg+xml'}); const url=URL.createObjectURL(blob);
    const aEl=document.createElement('a'); aEl.href=url; aEl.download=`lissajous_${els.a?.value||3}x${els.b?.value||2}.svg`; aEl.click();
    setTimeout(()=>URL.revokeObjectURL(url),500);
  }

  // -------- UI bindings (safe) --------
  const inputEls = [
    els.a,els.b,els.amp,els.delta,els.omega,els.res,els.width,els.stroke,
    els.bg,els.bg2,els.bgMode,els.noise,els.renderScale,els.rainbow,els.showAxes,els.square,els.blend,els.trail
  ].filter(Boolean);
  const updateBgFields=()=>{ if(els.bg2wrap) els.bg2wrap.style.display = (els.bgMode?.value==='gradient') ? '' : 'none'; };
  inputEls.forEach(el=>{
    el.addEventListener('input', ()=>{
      if(el===els.square) resizeCanvas(); else draw(true);
      updateBgFields();
    });
  });

  els.playBtn && els.playBtn.addEventListener('click', play);
  els.pauseBtn && els.pauseBtn.addEventListener('click', pause);
  els.resetBtn && els.resetBtn.addEventListener('click', ()=>{ time=0; draw(true); });
  els.drawOnceBtn && els.drawOnceBtn.addEventListener('click', ()=>{ pause(); draw(true); });
  els.randomBtn && els.randomBtn.addEventListener('click', randomNice);
  els.savePNGBtn && els.savePNGBtn.addEventListener('click', savePNG);
  els.savePNGHQBtn && els.savePNGHQBtn.addEventListener('click', savePNGHQ);
  els.saveSVGBtn && els.saveSVGBtn.addEventListener('click', saveSVG);

  els.themeBtn && els.themeBtn.addEventListener('click', ()=>{ light=!light; applyTheme(); });
  els.langBtn && els.langBtn.addEventListener('click', ()=>{ lang=(lang==='bg'?'en':'bg'); applyI18n(); });

  window.addEventListener('keydown',(e)=>{
    if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)) return;
    if(e.key===' '){ e.preventDefault(); (raf?pause():play()); }
    if(e.key.toLowerCase()==='r'){ randomNice(); }
    if(e.key.toLowerCase()==='s'){ savePNG(); }
    if(e.key.toLowerCase()==='t'){ light=!light; applyTheme(); }
    if(e.key.toLowerCase()==='l'){ lang=(lang==='bg'?'en':'bg'); applyI18n(); }
  });

  // Init
  renderPresets();
  applyI18n();
  applyTheme();
  updateBgFields();
  resizeCanvas();
  draw(true);
  window.addEventListener('resize', resizeCanvas);

  console.log('✅ Lissajous Lab ready');
}

// Boot
if(document.readyState==='loading'){ document.addEventListener('DOMContentLoaded', setup); }
else { setup(); }

})();
