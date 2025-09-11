// ---------- i18n ----------
drawTo(octx, cw, ch, {
bgMode: 'none', bgColor: '#000', noiseIntensity: 0,
showAxes: els.showAxes.checked, rainbow: els.rainbow.checked, stroke: els.stroke.value, width: +els.width.value*scale,
a: Math.max(1, Math.floor(+els.a.value)), b: Math.max(1, Math.floor(+els.b.value)),
amp: +els.amp.value, delta: (+els.delta.value) * Math.PI/180, n: Math.max(200, Math.min(30000, Math.floor(+els.res.value))*scale),
blend: els.blend.value
});
const link = document.createElement('a'); link.download = `lissajous_${els.a.value}x${els.b.value}_${cw}x${ch}.png`; link.href = off.toDataURL('image/png'); link.click();
}
function saveSVG(){
const rs = +els.renderScale.value || 1; const w = Math.floor(els.canvas.width/(window.devicePixelRatio||1)/rs); const h = Math.floor(els.canvas.height/(window.devicePixelRatio||1)/rs);
const A = (Math.min(w, h)/2 - 16) * (+els.amp.value/100); const B = A;
const a = Math.max(1, Math.floor(+els.a.value)); const b = Math.max(1, Math.floor(+els.b.value));
const delta = (+els.delta.value) * Math.PI/180; const n = Math.max(200, Math.min(30000, Math.floor(+els.res.value)));
const pts = lissajousPoints(a,b,A,B,delta,n).map(([x,y])=>[x+w/2, y+h/2]);
const path = pts.map(([x,y],i)=> (i?`L${x.toFixed(2)},${y.toFixed(2)}`:`M${x.toFixed(2)},${y.toFixed(2)}`)).join(' ');
const stroke = els.rainbow.checked ? 'url(#g)' : els.stroke.value;
const defs = els.rainbow.checked ? `\n <defs>\n <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="0%">\n <stop offset="0%" stop-color="hsl(0 80% 60%)"/>\n <stop offset="100%" stop-color="hsl(360 80% 60%)"/>\n </linearGradient>\n </defs>` : '';
const svg = `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">\n <rect width="100%" height="100%" fill="${els.pngTransparent.checked ? 'none' : els.bg.value}"/>${defs}\n <path d="${path}" fill="none" stroke="${stroke}" stroke-width="${+els.width.value}" stroke-linecap="round" stroke-linejoin="round"/>\n</svg>`;
const blob = new Blob([svg], {type:'image/svg+xml'}); const url = URL.createObjectURL(blob);
const aEl = document.createElement('a'); aEl.href = url; aEl.download = `lissajous_${els.a.value}x${els.b.value}.svg`; aEl.click(); setTimeout(()=>URL.revokeObjectURL(url), 500);
}


// ---------- Events ----------
[els.a, els.b, els.amp, els.delta, els.omega, els.res, els.width, els.stroke, els.bg, els.bgMode, els.noise, els.renderScale, els.rainbow, els.showAxes, els.square, els.blend]
.forEach(el=> el.addEventListener('input', ()=>{ if(el===els.renderScale || el===els.square) resizeCanvas(); else draw(true); updateBgFields(); }));
els.playBtn.addEventListener('click', ()=>{ play(); });
els.pauseBtn.addEventListener('click', ()=>{ pause(); });
els.resetBtn.addEventListener('click', ()=>{ time=0; draw(true); });
els.drawOnceBtn.addEventListener('click', ()=>{ pause(); draw(true); });
els.randomBtn.addEventListener('click', randomNice);
els.savePNGBtn.addEventListener('click', savePNG);
els.savePNGHQBtn.addEventListener('click', savePNGHQ);
els.saveSVGBtn.addEventListener('click', saveSVG);


// Theme & Language
let light = false;
function applyTheme(){ document.body.classList.toggle('light', light); }
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
