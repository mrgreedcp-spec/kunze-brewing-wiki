/* ---------- 通用 ---------- */
const $=(s,r=document)=>r.querySelector(s);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const fmt=(n,d=1)=>Number.isFinite(n)?n.toLocaleString('zh-CN',{minimumFractionDigits:d,maximumFractionDigits:d}):'—';
const smooth=()=>matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth';
/* ASBC/Plato 多项式：°P → 比重 SG(20/20)；乘 0.998203 得 SG(20/4) */
const sg2020=p=>1.0000131+0.00386777*p+1.27447e-5*p*p+6.34964e-8*p*p*p;
function interp(pts,x){
  if(x<pts[0][0]-1e-9||x>pts[pts.length-1][0]+1e-9)return null;
  for(let i=1;i<pts.length;i++){const a=pts[i-1],b=pts[i];if(x<=b[0]+1e-9)return b[0]===a[0]?b[1]:a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0])}
  return pts[pts.length-1][1];
}
function interpSegs(segs,x){for(const p of segs){if(p.length<2)continue;const v=interp(p,x);if(v!=null)return v}return null}
function placeTip(tt,host,px,W){
  const r=host.getBoundingClientRect(),left=px*r.width/W,tw=tt.offsetWidth;
  tt.style.left=(left+14+tw>r.width?Math.max(0,left-14-tw):left+14)+'px';
}

/* ---------- 折线图（支持分段、横向温度带、事件标记） ---------- */
function lineChart(el,cfg){
  const W=720,H=cfg.h,m={t:30,r:cfg.mr||28,b:44,l:48},pw=W-m.l-m.r,ph=H-m.t-m.b;
  const sx=x=>m.l+(x-cfg.x0)/(cfg.x1-cfg.x0)*pw, sy=y=>m.t+ph-(y-cfg.y0)/(cfg.y1-cfg.y0)*ph, f=n=>Math.round(n*10)/10;
  let s='';
  (cfg.ybands||[]).forEach(b=>{s+=`<rect class="tf-band" x="${m.l}" y="${f(sy(b[1]))}" width="${pw}" height="${f(sy(b[0])-sy(b[1]))}"/><text class="tf-yl" x="${W-m.r+6}" y="${f(sy(b[0])-2)}">${esc(b[2])}</text>`});
  (cfg.bands||[]).forEach((b,i)=>{s+=`<rect class="tf-band${i%2?' alt':''}" x="${f(sx(b[0]))}" y="${m.t}" width="${f(sx(b[1])-sx(b[0]))}" height="${ph}"/><text class="tf-bl" x="${f((sx(b[0])+sx(b[1]))/2)}" y="${m.t-9}" text-anchor="middle">${esc(b[2])}</text>`});
  cfg.yt.forEach(v=>{s+=`<line class="tf-grid" x1="${m.l}" x2="${W-m.r}" y1="${f(sy(v))}" y2="${f(sy(v))}"/><text class="tf-ax" x="${m.l-8}" y="${f(sy(v)+4)}" text-anchor="end">${v}</text>`});
  cfg.xt.forEach(v=>{s+=`<text class="tf-ax" x="${f(sx(v))}" y="${H-m.b+17}" text-anchor="middle">${v}</text>`});
  s+=`<line class="tf-base" x1="${m.l}" x2="${W-m.r}" y1="${f(sy(cfg.y0))}" y2="${f(sy(cfg.y0))}"/>`;
  s+=`<text class="tf-ax" x="${W-m.r}" y="${H-8}" text-anchor="end">${esc(cfg.xTitle)}</text><text class="tf-ax" x="${m.l-8}" y="${m.t-15}" text-anchor="end">°C</text>`;
  cfg.series.forEach(se=>{
    se.segs.forEach(p=>{if(p.length>1)s+=`<polyline class="tf-s ${se.cls}" points="${p.map(q=>f(sx(q[0]))+','+f(sy(q[1]))).join(' ')}"/>`});
    if(se.dot){const p=se.segs[se.segs.length-1],e=p[p.length-1];s+=`<circle class="tf-d ${se.cls}" cx="${f(sx(e[0]))}" cy="${f(sy(e[1]))}" r="4"/>`}
  });
  (cfg.events||[]).forEach(ev=>{const x=sx(ev.x),y=sy(ev.y);s+=`<path class="tf-ev" d="M${f(x-4)},${f(y-12)} L${f(x+4)},${f(y-12)} L${f(x)},${f(y-5)} Z"/><text class="tf-evl" x="${f(x+(ev.dx||0))}" y="${f(y-16)}" text-anchor="${ev.a||'middle'}">${esc(ev.t)}</text>`});
  s+=`<line class="tf-x" x1="0" x2="0" y1="${m.t}" y2="${m.t+ph}" visibility="hidden"/>`;
  cfg.series.forEach(se=>{s+=`<circle class="tf-d ${se.cls} tf-hd" r="4.5" visibility="hidden"/>`});
  s+=`<rect x="${m.l}" y="${m.t}" width="${pw}" height="${ph}" fill="transparent"/>`;
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" tabindex="0" aria-label="${esc(cfg.aria)}">${s}</svg><div class="tt" hidden></div>`;
  const svg=el.querySelector('svg'),tt=el.querySelector('.tt'),xl=svg.querySelector('.tf-x'),hd=[...svg.querySelectorAll('.tf-hd')];
  let cx=null;
  function show(x){
    x=Math.max(cfg.x0,Math.min(cfg.x1,Math.round(x/cfg.step)*cfg.step));x=Math.round(x*100)/100;cx=x;
    const px=sx(x);
    xl.setAttribute('x1',px);xl.setAttribute('x2',px);xl.setAttribute('visibility','visible');
    tt.replaceChildren();
    const h=document.createElement('div');h.className='h';h.textContent=cfg.xLabel(x);tt.appendChild(h);
    cfg.series.forEach((se,i)=>{
      const v=interpSegs(se.segs,x);
      if(v==null){hd[i].setAttribute('visibility','hidden');return}
      hd[i].setAttribute('cx',px);hd[i].setAttribute('cy',sy(v));hd[i].setAttribute('visibility','visible');
      const r=document.createElement('div');r.className='r';
      const k=document.createElement('i');k.className='lk '+se.cls;
      const b=document.createElement('b');b.textContent=fmt(v,1)+' °C';
      const n=document.createElement('span');n.textContent=se.name;
      r.append(k,b,n);tt.appendChild(r);
    });
    (cfg.events||[]).filter(ev=>Math.abs(ev.x-x)<=cfg.step*2).forEach(ev=>{const e=document.createElement('div');e.className='e';e.textContent=ev.d;tt.appendChild(e)});
    tt.hidden=false;placeTip(tt,svg,px,W);
  }
  function hide(){xl.setAttribute('visibility','hidden');hd.forEach(d=>d.setAttribute('visibility','hidden'));tt.hidden=true}
  const toX=ev=>{const r=svg.getBoundingClientRect();return cfg.x0+((ev.clientX-r.left)/r.width*W-m.l)/pw*(cfg.x1-cfg.x0)};
  svg.addEventListener('pointermove',ev=>show(toX(ev)));
  svg.addEventListener('pointerdown',ev=>show(toX(ev)));
  svg.addEventListener('pointerleave',hide);
  svg.addEventListener('focus',()=>show(cx??cfg.x0));
  svg.addEventListener('blur',hide);
  svg.addEventListener('keydown',ev=>{
    const k=ev.key,d=cfg.step*(ev.shiftKey?10:1);
    if(k==='ArrowRight'||k==='ArrowLeft'){ev.preventDefault();show((cx??cfg.x0)+(k==='ArrowRight'?d:-d))}
    else if(k==='Home'){ev.preventDefault();show(cfg.x0)}
    else if(k==='End'){ev.preventDefault();show(cfg.x1)}
    else if(k==='Escape')hide();
  });
}

/* ---------- 酶的温度窗口 ---------- */
const ENZ=[
  {g:'细胞壁（β-葡聚糖）'},
  {n:'内切 β-1,4-葡聚糖酶',a:40,b:45,note:'很怕热，升温后很快失活；书中正文也写作 45–50 °C。溶解差的麦芽靠它在低温段补救。'},
  {n:'内切 β-1,3-葡聚糖酶',a:60,note:'约 60 °C。'},
  {n:'β-葡聚糖溶解酶',a:62,note:'耐热。把高分子 β-葡聚糖从蛋白结合中释放出来，但不分解它，所以溶解差的麦芽在高温段会释放出大量高分子 β-葡聚糖。'},
  {g:'蛋白'},
  {n:'内肽酶',a:45,b:50,note:'把蛋白切成肽。'},
  {n:'羧肽酶',a:50,note:'约 50 °C，从羧基端释放氨基酸。'},
  {n:'氨肽酶、二肽酶',a:45,note:'约 45 °C，生成氨基酸（酵母营养 FAN）。溶解好的麦芽不需要长时间停在这里，否则泡沫变差。'},
  {g:'淀粉与糖'},
  {n:'麦芽糖酶',a:45,note:'约 45 °C。一次煮出法中加一段 45 °C 休止，葡萄糖可升到 35–40%，小麦啤酒的酯香随之增强。'},
  {n:'界限糊精酶',a:50,b:60,x:70,xt:'70 °C 时已很弱',note:'能切开 1,6 支点，但在常规糖化中作用有限，所以麦汁里总留有界限糊精。'},
  {n:'β-淀粉酶',a:60,b:65,x:70,xt:'70 °C 迅速失活',ph:'5.4–5.5',note:'从链的非还原端切下麦芽糖。62–63 °C 长休止得到最多麦芽糖、最高发酵度。'},
  {n:'α-淀粉酶',a:72,b:75,x:80,xt:'约 80 °C 被破坏',ph:'5.6–5.8',note:'把长链切成 7–12 个葡萄糖的糊精，迅速降低糊化醪的黏度（液化）。终止温度不宜超过约 78 °C，留它完成过滤中的后糖化。'}
];
const RESTS=[[45,50,'蛋白/葡聚糖'],[62,65,'麦芽糖'],[72,75,'糖化'],[76,78,'终止']];
const rng=e=>e.b!=null?`${e.a}–${e.b}`:`≈${e.a}`;
function enzChart(el){
  const W=720,m={t:34,r:70,b:34,l:176},x0=35,x1=85,pw=W-m.l-m.r;
  const sx=v=>m.l+(v-x0)/(x1-x0)*pw,f=n=>Math.round(n*10)/10;
  let y=m.t;const rows=[];
  ENZ.forEach(e=>{if(e.g){rows.push({g:e.g,y:y+15});y+=22}else{rows.push({e,y});y+=26}});
  const yb=y,H=yb+m.b;let s='';
  RESTS.forEach(r=>{s+=`<rect class="en-band" x="${f(sx(r[0]))}" y="${m.t}" width="${f(sx(r[1])-sx(r[0]))}" height="${yb-m.t}"/><text class="tf-bl" x="${f((sx(r[0])+sx(r[1]))/2)}" y="${m.t-10}" text-anchor="middle">${r[2]}</text>`});
  for(let v=40;v<=85;v+=5)s+=`<line class="tf-grid" x1="${f(sx(v))}" x2="${f(sx(v))}" y1="${m.t}" y2="${yb}"/><text class="tf-ax" x="${f(sx(v))}" y="${yb+17}" text-anchor="middle">${v}</text>`;
  s+=`<text class="tf-ax" x="${W-m.r}" y="${H-5}" text-anchor="end">温度 °C</text>`;
  rows.forEach((r,i)=>{
    if(r.g){s+=`<text class="en-g" x="${m.l-12}" y="${r.y}" text-anchor="end">${esc(r.g)}</text>`;return}
    const e=r.e,cy=r.y+13;let end=sx(e.b??e.a);
    s+=`<g class="en-row" data-i="${i}"><rect class="en-hit" x="0" y="${r.y}" width="${W}" height="26"/><text class="en-n" x="${m.l-12}" y="${cy+4}" text-anchor="end">${esc(e.n)}</text>`;
    if(e.b!=null)s+=`<rect class="en-bar" x="${f(sx(e.a))}" y="${cy-5}" width="${f(sx(e.b)-sx(e.a))}" height="10" rx="3"/>`;
    else{s+=`<circle class="en-pt" cx="${f(sx(e.a))}" cy="${cy}" r="5"/>`;end+=5}
    if(e.x!=null){const xx=sx(e.x);s+=`<line class="en-fade" x1="${f(end+3)}" x2="${f(xx-6)}" y1="${cy}" y2="${cy}"/><path class="en-x" d="M${f(xx-4)},${f(cy-4)}L${f(xx+4)},${f(cy+4)}M${f(xx+4)},${f(cy-4)}L${f(xx-4)},${f(cy+4)}"/>`;end=xx+4}
    s+=`<text class="en-v" x="${f(end+8)}" y="${cy+4}">${rng(e)}</text></g>`;
  });
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" tabindex="0" aria-label="麦芽主要酶的最适温度窗口，以及 45–50、62–65、72–75、76–78 °C 四段糖化休止温度">${s}</svg><div class="tt" hidden></div>`;
  const svg=el.querySelector('svg'),tt=el.querySelector('.tt'),gs=[...svg.querySelectorAll('.en-row')];let cur=-1;
  function show(k){
    gs.forEach(g=>g.classList.remove('on'));cur=k;const g=gs[k];g.classList.add('on');
    const e=rows[+g.dataset.i].e;tt.replaceChildren();
    const h=document.createElement('div');h.className='r';const b=document.createElement('b');b.textContent=e.n;h.appendChild(b);tt.appendChild(h);
    const add=t=>{const d=document.createElement('div');d.className='e';d.textContent=t;tt.appendChild(d)};
    add('最适温度 '+rng(e)+' °C'+(e.ph?'，最适 pH '+e.ph:''));if(e.xt)add(e.xt);add(e.note);
    tt.hidden=false;tt.style.top=Math.min(rows[+g.dataset.i].y+30,(H-60))*svg.getBoundingClientRect().height/H+'px';placeTip(tt,svg,sx(e.b??e.a),W);
  }
  function hide(){gs.forEach(g=>g.classList.remove('on'));tt.hidden=true}
  gs.forEach((g,k)=>{g.addEventListener('pointerenter',()=>show(k));g.addEventListener('pointerdown',()=>show(k))});
  svg.addEventListener('pointerleave',hide);svg.addEventListener('blur',hide);
  svg.addEventListener('focus',()=>show(cur<0?0:cur));
  svg.addEventListener('keydown',ev=>{if(ev.key==='ArrowDown'||ev.key==='ArrowUp'){ev.preventDefault();show(Math.max(0,Math.min(gs.length-1,(cur<0?0:cur)+(ev.key==='ArrowDown'?1:-1))))}else if(ev.key==='Escape')hide()});
}
function enzTable(){
  return `<div class="tbl"><table><tr><th>酶</th><th>最适温度 °C</th><th>最适 pH</th><th>失活</th><th>说明</th></tr>${ENZ.filter(e=>!e.g).map(e=>`<tr><td>${esc(e.n)}</td><td class="num">${rng(e)}</td><td class="num">${e.ph||'—'}</td><td>${esc(e.xt||'—')}</td><td>${esc(e.note)}</td></tr>`).join('')}</table></div>`;
}

/* ---------- 制麦物料流 ---------- */
const MALT=[['清选大麦',100,'含水约 12–14%'],['浸渍大麦',148,'吸水到 44–46%，体积膨胀约 40–45%'],['绿麦芽',140,'发芽中呼吸消耗淀粉、长出根芽'],['出炉麦芽',78,'焙焦把水分降到 5% 以下，随后除去约 3–4% 的麦根'],['贮存后麦芽',80,'贮存中回潮到 4–5%']];
function maltChart(el){
  const W=720,H=250,m={t:28,r:16,b:40,l:46},pw=W-m.l-m.r,ph=H-m.t-m.b,y1=160;
  const sy=v=>m.t+ph-v/y1*ph,f=n=>Math.round(n*10)/10,slot=pw/MALT.length,bw=slot*0.5;
  let s='';
  [0,40,80,120,160].forEach(v=>{s+=`<line class="tf-grid" x1="${m.l}" x2="${W-m.r}" y1="${f(sy(v))}" y2="${f(sy(v))}"/><text class="tf-ax" x="${m.l-8}" y="${f(sy(v)+4)}" text-anchor="end">${v}</text>`});
  s+=`<text class="tf-ax" x="${m.l-8}" y="${m.t-12}" text-anchor="end">kg</text>`;
  MALT.forEach((d,i)=>{
    const x=m.l+slot*i+(slot-bw)/2,y=sy(d[1]),b=sy(0);
    s+=`<g class="mbg" data-i="${i}"><rect class="mb-hit" x="${f(m.l+slot*i)}" y="${m.t}" width="${f(slot)}" height="${ph+30}"/><path class="mb" d="M${f(x)},${f(b)}V${f(y+4)}Q${f(x)},${f(y)} ${f(x+4)},${f(y)}H${f(x+bw-4)}Q${f(x+bw)},${f(y)} ${f(x+bw)},${f(y+4)}V${f(b)}Z"/><text class="mb-v" x="${f(x+bw/2)}" y="${f(y-7)}" text-anchor="middle">${d[1]} kg</text><text class="mb-l" x="${f(x+bw/2)}" y="${f(b+18)}" text-anchor="middle">${d[0]}</text></g>`;
  });
  s+=`<line class="tf-base" x1="${m.l}" x2="${W-m.r}" y1="${f(sy(0))}" y2="${f(sy(0))}"/>`;
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="淡色麦芽制麦中的物料质量变化：100 kg 大麦依次为 148、140、78、80 kg">${s}</svg><div class="tt" hidden></div>`;
  const svg=el.querySelector('svg'),tt=el.querySelector('.tt'),gs=[...svg.querySelectorAll('.mbg')];
  gs.forEach(g=>{const on=()=>{gs.forEach(o=>o.classList.remove('on'));g.classList.add('on');const d=MALT[+g.dataset.i];tt.innerHTML=`<div class="r"><b>${d[0]}</b><span>${d[1]} kg</span></div><div class="e">${esc(d[2])}</div>`;tt.hidden=false;placeTip(tt,svg,m.l+slot*(+g.dataset.i)+slot/2,W)};g.addEventListener('pointerenter',on);g.addEventListener('pointerdown',on)});
  svg.addEventListener('pointerleave',()=>{gs.forEach(o=>o.classList.remove('on'));tt.hidden=true});
}
