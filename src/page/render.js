function ptsTable(rows){return `<div class="tbl"><table><tr><th>系列</th><th>时间</th><th>温度 °C</th></tr>${rows.join('')}</table></div>`}
function progFig(fig,kind){
  const P=kind==='mash'?MASH:FERM,cin=fig.querySelector('.cin'),d=fig.querySelector('.prog-d'),tv=fig.querySelector('.tview .tbl'),lg=fig.querySelector('.lg-dec');
  const bs=[...fig.querySelectorAll('.seg button')];
  function draw(i){
    const p=P[i];bs.forEach((b,j)=>b.setAttribute('aria-pressed',String(j===i)));
    if(kind==='mash'){
      lineChart(cin,{h:320,mr:66,x0:0,x1:190,y0:30,y1:105,step:1,xt:[0,30,60,90,120,150,180],yt:[40,50,60,70,80,90,100],xTitle:'时间（分钟）',ybands:RESTS,
        series:[{name:'主醪',cls:'main',segs:[p.main],dot:true},{name:'煮出醪',cls:'dec',segs:p.dec}],events:p.ev,xLabel:x=>`第 ${x} 分钟`,aria:`${p.t}温度曲线（示意）`});
      if(lg)lg.hidden=!p.dec.length;
      const rows=p.main.map(q=>`<tr><td>主醪</td><td class="num">${q[0]} min</td><td class="num">${q[1]}</td></tr>`);
      p.dec.forEach((sg,n)=>sg.forEach(q=>rows.push(`<tr><td>煮出醪${p.dec.length>1?'（第 '+(n+1)+' 次）':''}</td><td class="num">${q[0]} min</td><td class="num">${q[1]}</td></tr>`)));
      tv.innerHTML=ptsTable(rows);
    }else{
      lineChart(cin,{h:300,x0:0,x1:21,y0:-2,y1:24,step:.5,xt:[0,3,6,9,12,15,18,21],yt:[0,5,10,15,20],xTitle:'时间（天）',bands:p.bands,
        series:[{name:'啤酒温度',cls:'main',segs:[p.pts],dot:true}],events:p.ev,xLabel:x=>`第 ${fmt(x,1)} 天`,aria:`${p.t}温度程序（示意）`});
      tv.innerHTML=ptsTable(p.pts.map(q=>`<tr><td>啤酒温度</td><td class="num">第 ${q[0]} 天</td><td class="num">${q[1]}</td></tr>`));
    }
    d.textContent=p.d;
  }
  bs.forEach((b,j)=>b.addEventListener('click',()=>draw(j)));draw(0);
}
const FIGS={
 enz:{t:'主要酶的最适温度窗口',cap:'条形为最适温度范围，圆点为书中给出的单一温度，× 为明显失活的温度；灰色竖带是四段常用休止温度。依据 Kunze p.214–225 的文字整理。',build:f=>{enzChart(f.querySelector('.cin'));f.querySelector('.tview .tbl').innerHTML=enzTable()}},
 mash:{t:'糖化程序温度曲线（示意）',legend:'<span><i class="lk main"></i>主醪</span><span class="lg-dec"><i class="lk dec"></i>煮出醪</span>',seg:MASH,cap:'横轴统一为 0–190 min，方便比较各方法的时长。曲线依据书中对各方法的文字描述绘制，升温速率按约 1 °C/min（煮出醪约 1.5 °C/min）假设；煮沸醪回混时按约 90 °C 的有效温度计。',build:f=>progFig(f,'mash')},
 ferm:{t:'下面发酵的温度程序（示意）',seg:FERM,cap:'依据 Kunze p.439–443 对六种工艺的文字描述绘制；三角标记为关键操作，双乙酰与压力曲线未画出。',build:f=>progFig(f,'ferm')},
 malt:{t:'淡色麦芽制麦中的物料质量变化',cap:'以 100 kg 清选大麦为起点（Kunze p.174）。质量先因吸水上升，焙焦后因失水和干物质损失降到约 78 kg，贮存中回潮到约 80 kg。',build:f=>{maltChart(f.querySelector('.cin'));f.querySelector('.tview').remove()}}
};
function buildFig(el,key){
  const F=FIGS[key];el.className='chart';el.id='c-'+key;el.dataset.name=F.t;
  el.innerHTML=`<div class="c-top"><div class="c-title">${esc(F.t)}</div>${F.legend?`<div class="legend">${F.legend}</div>`:''}</div>${F.seg?`<div class="seg" role="group" aria-label="选择工艺">${F.seg.map(p=>`<button type="button" aria-pressed="false">${esc(p.t)}</button>`).join('')}</div>`:''}<div class="cwrap"><div class="cin"></div></div>${F.seg?'<p class="prog-d"></p>':''}<figcaption>${esc(F.cap)}</figcaption><details class="tview"><summary>表格视图</summary><div class="tbl"></div></details>`;
  F.build(el);
}

/* ---------- 图标 ---------- */
const ICON={
 1:'<path d="M24 45V8"/><ellipse cx="19" cy="15" rx="3" ry="5.5" transform="rotate(-28 19 15)"/><ellipse cx="29" cy="15" rx="3" ry="5.5" transform="rotate(28 29 15)"/><ellipse cx="19" cy="24" rx="3" ry="5.5" transform="rotate(-28 19 24)"/><ellipse cx="29" cy="24" rx="3" ry="5.5" transform="rotate(28 29 24)"/><ellipse cx="19" cy="33" rx="3" ry="5.5" transform="rotate(-28 19 33)"/><ellipse cx="29" cy="33" rx="3" ry="5.5" transform="rotate(28 29 33)"/><path d="M21 9l-4-6M27 9l4-6M24 8V2"/>',
 2:'<path d="M11 7h26v19L24 40 11 26z"/><path d="M14 15c2-2 4 2 6 0s4 2 6 0 4 2 6 0 2 1 3 0"/><path d="M24 40v5"/><circle cx="20" cy="22" r="1.2"/><circle cx="27" cy="24" r="1.2"/><circle cx="23" cy="29" r="1.2"/>',
 3:'<path d="M9 40V27a15 11 0 0 1 30 0v13z"/><path d="M24 16V4M21 4h6"/><path d="M12 45v-5M36 45v-5"/><path d="M17 33h14"/>',
 4:'<path d="M15 4h18v28l-9 12-9-12z"/><path d="M15 12h18"/><circle cx="21" cy="21" r="1.5"/><circle cx="27" cy="25" r="1.5"/><circle cx="23" cy="29" r="1.5"/>',
 5:'<rect x="10" y="6" width="28" height="28" rx="3"/><path d="M16 11v18M21 11v18M26 11v18M31 11v18"/><path d="M10 34l14 9 14-9"/><path d="M4 18h6M38 26h6"/>',
 6:'<path d="M14 45V25c0-4 4-6 4-10V5h5v10c0 4 4 6 4 10v20z"/><path d="M18 9h5"/><rect x="31" y="21" width="12" height="24" rx="2"/><path d="M31 25h12M31 41h12"/>',
 7:'<path d="M14 15h20l-2.5 29h-15z"/><path d="M13 15c0-4 3-6 6-5 1.5-3 6.5-3.5 8.5-.5 3-1.5 7.5.5 7.5 5.5"/><path d="M34 21h3a4 4 0 0 1 4 4v6a4 4 0 0 1-4 4h-4"/><circle cx="21" cy="27" r="1.2"/><circle cx="26" cy="32" r="1.2"/><circle cx="22" cy="37" r="1.2"/>',
 8:'<path d="M5 22L24 8l19 14"/><path d="M10 19v25h28V19"/><path d="M17 44V33a7 7 0 0 1 14 0v11"/><path d="M24 26v-4M21 22h6"/>',
 9:'<path d="M24 5c7 9 12 15.5 12 22.5a12 12 0 0 1-24 0C12 20.5 17 14 24 5z"/><path d="M17 30c2.3 2 4.7 2 7 0s4.7-2 7 0"/><path d="M18 36c2 1.6 4 1.6 6 0s4-1.6 6 0"/>',
 10:'<path d="M27 4L12 27h11l-3 17 16-24H25z"/>',
 11:'<circle cx="24" cy="24" r="6"/><circle cx="24" cy="24" r="13"/><path d="M24 4v7M24 37v7M4 24h7M37 24h7M9.9 9.9l5 5M33.1 33.1l5 5M9.9 38.1l5-5M33.1 14.9l5-5"/>'
};
const icon=n=>`<svg class="fs-ic" viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;

/* ---------- 渲染 ---------- */
const nn=n=>String(n).padStart(2,'0');
function stepHTML(s){
  const b=[];
  b.push(`<div class="sp-h"><span class="sp-no">${s.no}</span><h3>${esc(s.t)}</h3><span class="sp-en">${esc(s.en)}</span><span class="sp-pg">p.${esc(s.p)}</span></div>`);
  b.push(`<p class="goal"><b>目的</b>${esc(s.goal)}</p>`);
  if(s.params)b.push(`<div class="blk"><h4>关键参数</h4><dl class="params">${s.params.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`);
  if(s.table)b.push(`<div class="blk tbl"><table><tr>${s.table.head.map(h=>`<th>${esc(h)}</th>`).join('')}</tr>${s.table.rows.map(r=>`<tr>${r.map((c,i)=>`<td${i===1?' class="num"':''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div>`);
  if(s.pts)b.push(`<div class="blk"><h4>机理与要点</h4><ul class="pts">${s.pts.map(p=>`<li>${esc(p)}</li>`).join('')}</ul></div>`);
  (s.w||[]).forEach(w=>b.push(`<div class="wg" data-w="${w}"></div>`));
  if(s.faults)b.push(`<div class="blk"><h4>常见问题</h4><div class="tbl"><table><tr><th>现象</th><th>常见原因</th><th>对策</th></tr>${s.faults.map(f=>`<tr><td>${esc(f[0])}</td><td>${esc(f[1])}</td><td>${esc(f[2])}</td></tr>`).join('')}</table></div></div>`);
  if(s.q)b.push(`<div class="blk"><h4>自测</h4><div class="qs">${s.q.map(([q,a])=>`<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join('')}</div></div>`);
  return `<article class="step" id="${s.id}">${b.join('')}</article>`;
}
const PROC=STAGES.filter(st=>!st.topic),TOPICS=STAGES.filter(st=>st.topic);
function cardHTML(st){return `<li class="fs${st.topic?' tp':''}"><a href="#${st.id}"><div class="fs-top">${icon(st.n)}<div><div class="fs-no">${nn(st.n)}</div><div class="fs-nm">${esc(st.name)}</div></div></div><div class="fs-pg">p.${esc(st.pages)}</div><div class="fs-io">${st.topic?esc(st.scope):`入 <b>${esc(st.inp)}</b><br>出 <b>${esc(st.out)}</b>`}</div><div class="chips">${st.chips.map(c=>`<span class="chip">${esc(c)}</span>`).join('')}</div></a></li>`}
function sectionHTML(st){return `<section class="stage${st.topic?' tpc':''}" id="${st.id}" aria-labelledby="${st.id}-h"><div class="st-h"><span class="st-no">${st.topic?'专题':'阶段'} ${nn(st.n)} · ${esc(st.en)} · p.${esc(st.pages)}</span><h2 id="${st.id}-h">${esc(st.name)}</h2><p class="st-sum">${esc(st.sum)}</p><p class="st-io">${st.topic?`范围 <b>${esc(st.scope)}</b>`:`输入 <b>${esc(st.inp)}</b> → 输出 <b>${esc(st.out)}</b>`}</p></div>${st.steps.map(stepHTML).join('')}</section>`}
function glossHTML(){
  const col=new Intl.Collator('zh-Hans-CN'),rows=[...GLOSSARY].sort((a,b)=>col.compare(a[0],b[0])),by={};
  STAGES.forEach(st=>st.steps.forEach(s=>{by[s.id]=s}));
  return `<section class="stage gloss" id="glossary" aria-labelledby="glossary-h"><div class="st-h"><span class="st-no">附录 · ${rows.length} 条 · 按拼音排序</span><h2 id="glossary-h">术语表</h2><p class="st-sum">中英对照和一句话解释；点“见”一栏的编号，跳到主要出现的工序。</p></div><div class="tbl gl-t"><table><tr><th>术语</th><th>英文</th><th>解释</th><th>见</th></tr>${rows.map(r=>{const s=by[r[3]];return `<tr class="gl-r"><td>${esc(r[0])}</td><td class="gl-en">${esc(r[1])}</td><td>${esc(r[2])}</td><td class="gl-see">${s?`<a href="#${s.id}">${s.no}</a>`:''}</td></tr>`}).join('')}</table></div></section>`;
}
const covHTML=()=>`<details class="cov"><summary>覆盖范围与书中疑点</summary><div class="tbl"><table><tr><th>章节</th><th>印刷页</th><th>状态</th><th>说明</th></tr>${COVERAGE.map(r=>`<tr>${r.map((c,i)=>`<td${i===1?' class="num"':''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div><div class="tbl"><table><tr><th>位置</th><th>内容</th><th>本页的处理</th></tr>${NOTES.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join('')}</tr>`).join('')}</table></div></details>`;
function render(){
  $('#flow').innerHTML=PROC.map(cardHTML).join('');
  $('#topics').innerHTML=TOPICS.map(cardHTML).join('');
  $('#main').innerHTML=PROC.map(sectionHTML).join('')+(TOPICS.length?'<div class="part-h" id="part-t">专题 · 原书引言与第 7–11 章</div>':'')+TOPICS.map(sectionHTML).join('')+glossHTML()+'<p class="empty" id="empty" hidden>没有找到匹配的工序或术语，换个关键词试试。</p>';
  document.querySelectorAll('.wg').forEach(el=>{const [k,v]=el.dataset.w.split(':');if(k==='tool')buildTool(el,v);else{const f=document.createElement('figure');el.replaceWith(f);buildFig(f,v)}});
  const idxItem=st=>`<li class="ist"><a href="#${st.id}"><span>${nn(st.n)}</span>${esc(st.name)}</a><ol>${st.steps.map(s=>`<li><a href="#${s.id}" data-s="${s.id}">${s.no} ${esc(s.t)}</a></li>`).join('')}</ol></li>`;
  $('#idx').innerHTML=PROC.map(idxItem).join('')+(TOPICS.length?'<li class="isep">专题</li>':'')+TOPICS.map(idxItem).join('')+'<li class="isep">附录</li><li class="ist"><a href="#glossary">术语表</a></li><li class="ist"><a href="#src">来源与覆盖范围</a></li>';
  const tools=[...document.querySelectorAll('.tool,figure.chart')];
  $('#idx-tools').innerHTML='<h2>图与计算工具</h2>'+tools.map(t=>`<a href="#${t.id}">${t.classList.contains('tool')?'计算':'图'} · ${esc(t.dataset.name)}</a>`).join('');
  const nSteps=STAGES.reduce((a,s)=>a+s.steps.length,0),nQ=STAGES.reduce((a,s)=>a+s.steps.reduce((b,x)=>b+(x.q?x.q.length:0),0),0);
  $('#stats').innerHTML=`<span><b>${PROC.length}</b> 个阶段</span><span><b>${TOPICS.length}</b> 个专题</span><span><b>${nSteps}</b> 个工序</span><span><b>${document.querySelectorAll('.tool').length}</b> 个计算工具</span><span><b>${document.querySelectorAll('figure.chart').length}</b> 张图</span><span><b>${nQ}</b> 道自测</span><span><b>${GLOSSARY.length}</b> 条术语</span>`;
  $('#src').innerHTML=`<p>来源：Wolfgang Kunze，《Technology Brewing and Malting》第 3 版国际版，Susan Pratt 译，VLB Berlin，2004（ISBN 3-921690-49-8）。页码均为原书印刷页码。</p><p>这是一份学习笔记：内容为中文自述整理，没有复制原书的段落、插图或表格；工艺曲线依据书中文字描述绘制，时间与升温速率是示意假设。计算工具按书中给出的方法实现；书中的几处排印或前后不一致（如 p.245 的煮出醪示例）见下表，本页按公式计算。</p><p>书中数据反映约 2004 年的德国与欧洲实践及法规（如纯酒令、饮用水与环保法规、当时的电价）；出现的商业设备与工艺名称只作为方法示例。</p>${covHTML()}<p>姊妹页：<a href="https://claude.ai/artifact/3KpeDWEpxwJbjuLpghvZHf" target="_blank" rel="noopener">啤酒酿造七层问答</a>（问答、酿造流程、风格配方与费曼复习）。</p>`;
  const steps=[...document.querySelectorAll('.step')];steps.forEach(s=>s._t=s.textContent.toLowerCase());
  const grows=[...document.querySelectorAll('.gl-r')];grows.forEach(r=>r._t=r.textContent.toLowerCase());
  const q=$('#q'),cnt=$('#count');
  function filter(){
    const v=q.value.trim().toLowerCase();let k=0,g=0;
    steps.forEach(s=>{const ok=!v||s._t.includes(v);s.hidden=!ok;if(ok)k++});
    grows.forEach(r=>{const ok=!v||r._t.includes(v);r.hidden=!ok;if(ok)g++});
    document.querySelectorAll('section.stage:not(.gloss)').forEach(sec=>{sec.hidden=!!v&&!sec.querySelector('.step:not([hidden])')});
    $('#glossary').hidden=!!v&&!g;
    const ph=$('#part-t');if(ph)ph.hidden=!!v&&!document.querySelector('section.tpc:not([hidden])');
    $('#empty').hidden=k+g>0;cnt.textContent=v?`显示 ${k} / ${steps.length} 个工序${g?`、${g} 条术语`:''}`:'';
  }
  q.addEventListener('input',filter);
  const links=new Map([...document.querySelectorAll('#idx a[data-s]')].map(a=>[a.dataset.s,a]));
  if('IntersectionObserver' in window){
    const io=new IntersectionObserver(es=>{es.forEach(e=>{if(e.isIntersecting){links.forEach(a=>a.classList.remove('on'));const a=links.get(e.target.id);if(a)a.classList.add('on')}})},{rootMargin:'-12% 0px -75% 0px'});
    steps.forEach(s=>io.observe(s));
  }
  document.addEventListener('click',e=>{const a=e.target.closest('a[href^="#"]');if(!a)return;const t=document.getElementById(a.getAttribute('href').slice(1));if(!t)return;if((t.hidden||t.closest('[hidden]'))&&q.value){q.value='';filter()}e.preventDefault();t.scrollIntoView({block:'start',behavior:smooth()});history.replaceState(null,'','#'+t.id);t.classList.remove('flash');void t.offsetWidth;t.classList.add('flash')});
  if(location.hash){const t=document.getElementById(location.hash.slice(1));if(t)setTimeout(()=>t.scrollIntoView({block:'start'}),0)}
}
render();
