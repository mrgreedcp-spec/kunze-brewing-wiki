/* ---------- 计算工具 ---------- */
const CO2T=[[0,.317],[1,.306],[2,.296],[3,.286],[4,.276],[5,.267],[6,.258],[8,.241],[10,.226],[15,.193],[20,.165]];
function co2sol(t){if(t<0)return .317+(.317-.306)*(-t);return interp(CO2T,Math.min(20,t))}
const TOOLS={
decoct:{t:'煮出醪量',src:'p.244–245',f:[['V','总醪量',120,'hl',1],['Tr','未煮醪（休止）温度',50,'°C',1],['Tt','回混后目标温度',64,'°C',1],['Tb','煮沸醪回混时的有效温度',90,'°C',1]],
 c:v=>{if(!(v.Tt>v.Tr))return{err:'目标温度要高于当前休止温度。'};if(!(v.Tb>v.Tt))return{err:'回混温度要高于目标温度。'};const d=(v.Tt-v.Tr)*v.V/(v.Tb-v.Tr);return{o:[['需煮沸的稠醪',fmt(d,1),'hl',1],['占总醪',fmt(d/v.V*100,0),'%'],['留在锅里不煮',fmt(v.V-d,1),'hl']]}},
 n:'煮出醪量 = 升温幅度 × 总醪量 ÷（90 °C − 未煮醪温度）。90 °C 是煮沸醪泵回时考虑降温后的有效温度；经验值约为总醪的 1/4–1/3。书中 p.245 示例的算术有排印错误，按公式应为 45.5 hl。'},
water:{t:'投料水与头道麦汁浓度',src:'p.234–235',f:[['G','投料（粉）',3000,'kg',50],['P','目标头道麦汁浓度',18,'%',.5]],
 c:v=>{if(!(v.P>0))return{err:'浓度要大于 0。'};const w=v.G/100*3*20/v.P;return{o:[['投料水',fmt(w,1),'hl',1],['醪体积约',fmt(w+v.G*.7/100,1),'hl'],['料水比',fmt(w*100/v.G,1),'L/kg']]}},
 n:'经验法则：100 kg 粉 + 3 hl 水 ≈ 20% 头道麦汁，水量与目标浓度成反比；粉的体积按约 0.7 hl/100 kg 计。头道麦汁一般比成品原麦汁高 4–6%，淡色啤酒常用 3–4 hl/100 kg。'},
hops:{t:'酒花添加量',src:'p.320–321',f:[['BU','目标苦味',30,'BU',1],['Vh','热定型麦汁',200,'hl',1],['Y','苦味收率（按成品）',30,'%',1],['S','产品 A 承担的比例',70,'%',5],['aA','产品 A 的 α-酸',12,'%',.1],['aB','产品 B 的 α-酸',5,'%',.1]],
 c:v=>{if(!(v.Y>0&&v.aA>0&&v.aB>0))return{err:'收率和 α-酸含量都要大于 0。'};const vc=v.Vh*.96,bg=v.BU*vc/10,ak=bg/1000/(v.Y/100),A=ak*v.S/100,B=ak-A;return{o:[['冷定型麦汁',fmt(vc,1),'hl'],['进入啤酒的苦味物',fmt(bg,0),'g'],['需加入的 α-酸',fmt(ak,2),'kg',1],['产品 A',fmt(A/(v.aA/100),1),'kg'],['产品 B',fmt(B/(v.aB/100),1),'kg']]}},
 n:'BU = 每升啤酒中苦味物的毫克数；按冷麦汁体积（热体积 × 0.96）计算。苦味收率一般 25–35%，要在自己的厂里试验确定：需加入的 α-酸克数大约是目标 BU 值的 1/3（每 hl）。苦型酒花先加，香型酒花后加。'},
yield:{t:'糖化间收率与发酵间收率',src:'p.323–331、398–399',f:[['G','投料',4000,'kg',50],['Vh','热定型麦汁',262,'hl',1],['P','定型麦汁浓度',11.6,'°P',.1],['Vp','接种麦汁（冷）',254,'hl',1],['Pp','接种麦汁浓度',11.4,'°P',.1]],
 c:v=>{if(!(v.G>0))return{err:'投料要大于 0。'};const k=v.P*sg2020(v.P)*.998203,yf=k*.96,E=yf*v.Vh,kp=v.Pp*sg2020(v.Pp)*.998203,Ef=kp*v.Vp;return{o:[['浸出物（20 °C）',fmt(k,2),'kg/hl'],['收率因子',fmt(yf,2),''],['糖化间浸出物',fmt(E,0),'kg'],['糖化间收率',fmt(E/v.G*100,2),'%',1],['发酵间收率',fmt(Ef/v.G*100,2),'%'],['定型→接种损失',fmt(E-Ef,0),'kg 浸出物']]}},
 n:'收率 = 浸出物(kg/hl) × 0.96 × 热定型量 ÷ 投料。kg/hl 由 °P 乘以 20/4 °C 比重得到，即书中 Plato 表的“g/100 mL”一栏；0.96 是热麦汁冷到 20 °C 的收缩系数。接种麦汁是冷的，不再乘 0.96。正常糖化间收率 74–79%。'},
atten:{t:'表观与真实发酵度',src:'p.403–406',f:[['OE','原麦汁（接种麦汁）',12,'°P',.1],['Es','当前表观浸出物',3.8,'°P',.1],['El','发酵度极限对应的浸出物',2.1,'°P',.1]],
 c:v=>{if(!(v.OE>v.Es&&v.Es>=v.El&&v.El>=0))return{err:'应满足 原麦汁 > 当前浸出物 ≥ 极限浸出物 ≥ 0。'};const vs=(v.OE-v.Es)/v.OE*100,vl=(v.OE-v.El)/v.OE*100;return{o:[['表观发酵度 Vs',fmt(vs,1),'%',1],['真实发酵度 ≈',fmt(vs*.81,1),'%'],['发酵度极限',fmt(vl,1),'%'],['与极限相差',fmt(vl-vs,1),'个百分点'],['残余可发酵浸出物',fmt(v.Es-v.El,1),'°P']]}},
 n:'转罐时一般希望与极限相差约 10 个百分点（约 1% 浸出物），留给贮酒罐里的后发酵产生 CO₂；灌装前的最终发酵度则应尽量接近极限，否则等于给微生物留了糖。真实发酵度 ≈ 0.81 × 表观发酵度（Balling 经验系数）。'},
blend:{t:'调配（混合十字）',src:'p.408–409',f:[['V1','啤酒（麦汁）A 的量',500,'hl',1],['E1','A 的浸出物',12.4,'%',.1],['E2','B 的浸出物（水填 0）',0,'%',.1],['Et','目标浸出物',11.6,'%',.1]],
 c:v=>{const lo=Math.min(v.E1,v.E2),hi=Math.max(v.E1,v.E2);if(!(v.Et>lo&&v.Et<hi))return{err:'目标值必须落在 A 与 B 两者之间。'};const b=v.V1*(v.E1-v.Et)/(v.Et-v.E2);return{o:[['需加入 B',fmt(b,1),'hl',1],['调配后总量',fmt(v.V1+b,1),'hl'],['A : B',`${fmt(Math.abs(v.Et-v.E2),1)} : ${fmt(Math.abs(v.E1-v.Et),1)}`,'']]}},
 n:'混合十字：把两种液体的浸出物写在左侧、目标写在中间，交叉相减得到两者的份数；混合方程 V1·E1 + V2·E2 =（V1+V2）·Et 给出同样结果。按百分数计算是近似，严格计算应换成 20/4 °C 密度；而且两种液体很难真正混匀。'},
co2:{t:'CO₂ 溶解量',src:'p.409–410',f:[['T','啤酒温度',1,'°C',.5],['P','罐压（表压）',.5,'bar',.05],['C','目标 CO₂ 含量',.5,'%',.01]],
 c:v=>{if(v.T<-2||v.T>20)return{err:'温度请在 −2 至 20 °C 之间。'};const s=co2sol(v.T),c=s*(v.P+1),need=v.C/s-1;return{o:[['饱和 CO₂ 含量',fmt(c,3),'%',1],['约合',fmt(c*10.1,1),'g/L'],['该温度常压溶解度',fmt(s,3),'%'],['达到目标所需表压',fmt(Math.max(0,need),2),'bar']],w:c<.32?'低于 0.32%：啤酒会显得平淡。':c<.5?'低于 0.50%：灌装途中还会损失一些，贮酒时宜再高一点。':''}},
 n:'亨利定律：溶解量 ≈ 该温度下常压溶解度 × 绝对压力（按书中做法，常压取 1 bar）。常压溶解度取书中 12 °P、发酵度 80% 啤酒的数值并线性插值，0 °C 以下为外推。灌装的啤酒应含约 0.5% CO₂。'},
pitch:{t:'接种量',src:'p.400、438',f:[['C','目标细胞浓度',25,'×10⁶/mL',1],['S','酵母泥浓度',3,'×10⁹/mL',.1],['V','麦汁量',500,'hl',10]],
 c:v=>{if(!(v.S>0))return{err:'酵母泥浓度要大于 0。'};const l=100*v.C/v.S/1000;return{o:[['每 hl 酵母泥',fmt(l,2),'L',1],['总共需要',fmt(l*v.V,0),'L']]}},
 n:'常用接种量 20–30×10⁶ 个/mL，约相当于每 hl 0.6–1 L 浓酵母泥（泥约 3×10⁹ 个/mL）。提高接种量是加快发酵而不带来负面后果的最重要手段，也能减少高级醇。'},
ccv:{t:'锥形罐容积与顶空',src:'p.417–419、426',f:[['D','罐直径',4.5,'m',.05],['A','锥角',70,'°',1],['H','总液高（含锥部）',12,'m',.1],['K','顶空比例',25,'%',1]],
 c:v=>{if(!(v.A>10&&v.A<170))return{err:'锥角请在 10°–170° 之间。'};const r=v.D/2,hc=r/Math.tan(v.A/2*Math.PI/180);if(!(v.H>hc))return{err:`总液高要大于锥高（${fmt(hc,2)} m）。`};const a=Math.PI*r*r,Vt=a*hc/3+a*(v.H-hc),hh=Vt*v.K/100/a;return{o:[['锥高',fmt(hc,2),'m'],['麦汁容量',fmt(Vt*10,0),'hl',1],['顶空高度',fmt(hh,2),'m'],['筒体+锥部总高（不含封头）',fmt(v.H+hh,2),'m'],['直径 : 总液高',`1 : ${fmt(v.H/v.D,1)}`,''],['CIP 清洗液（约）',fmt(Math.PI*v.D*30*100/3600,1),'L/s']]}},
 n:'锥部 V = πr²h/3，筒体 V = πr²h；锥角 60° 时锥高 ≈ 0.866 × 直径。发酵罐顶空一般取接种麦汁体积的 18–25%（小麦啤酒约 40%）；液高最好不超过约 20 m，直径与总液高约 1 : 2。CIP 按每米罐周长约 30 hl/h 估算。'},
cool:{t:'发酵与冷贮冷量',src:'p.395、429',f:[['OE','原麦汁',12,'°P',.1],['Vs','最终表观发酵度',80,'%',1],['dT','发酵后降温幅度',10,'K',.5],['V','批量',1000,'hl',10]],
 c:v=>{const fh=v.OE*.81*v.Vs/100*587,lh=420*v.dT,t=fh+lh;return{o:[['发酵热',fmt(fh,0),'kJ/hl'],['降温液体热',fmt(lh,0),'kJ/hl'],['合计（未含散热）',fmt(t,0),'kJ/hl',1],['整批',fmt(t*v.V/1000,0),'MJ']]}},
 n:'发酵热按每 kg 已发酵浸出物 587 kJ；已发酵浸出物 ≈ 原麦汁 × 0.81 × 表观发酵度。全麦啤酒发酵热约 4,300–4,600 kJ/hl，从 9 °C 冷到 −1 °C 约 4,200 kJ/hl，加上散热损失总计约 8,600–9,000 kJ/hl；最大冷量出现在发酵后 24–48 h 的降温。'},
pu:{t:'巴氏杀菌单位 PU',src:'p.489–490',f:[['T','杀菌温度',70,'°C',.5],['t','保持时间',50,'s',1],['G','目标',15,'PU',1]],
 c:v=>{const k=Math.pow(1.393,v.T-60),pu=v.t/60*k,need=v.G/k*60;const row=[62,64,66,68,70,72].map(x=>`${x} °C ${fmt(v.G/Math.pow(1.393,x-60)*60,0)} s`).join(' · ');return{o:[['得到',fmt(pu,1),'PU',1],['达到目标需保持',fmt(need,0),'s'],['温度倍率',fmt(k,2),'× /min']],i:'达到 '+v.G+' PU 所需时间：'+row}},
 n:'1 PU = 60 °C 保持 1 min；PU = 时间(min) × 1.393^(T−60)。啤酒一般 14–15 PU，污染重时 22–27 PU；罐装啤酒 18–20 PU，温度不超过约 62 °C。PU 衡量杀菌效果，不衡量风味损伤——后者更取决于保持时间和含氧量。'},
hg:{t:'高浓酿造节能',src:'p.510',f:[['V1','常规定型量',300,'hl',1],['P1','常规浓度',11,'%',.1],['P2','高浓浓度',15,'%',.1]],
 c:v=>{if(!(v.P2>v.P1))return{err:'高浓浓度要高于常规浓度。'};const v2=v.V1*v.P1/v.P2,d=v.V1-v2;return{o:[['高浓定型量',fmt(v2,1),'hl'],['少加热煮沸',fmt(d,1),'hl',1],['节省比例',fmt(d/v.V1*100,1),'%'],['后续稀释水',fmt(d,1),'hl']],w:v.P2>15?'超过约 14.5–15% 时，副产物会在稀释后的成品中被察觉。':''}},
 n:'按书中的简化算法（体积 × 百分浓度）。高浓的主要好处是稀释水不必加热和煮沸；代价是发酵更慢、酯和高级醇更多，泡沫也随稀释程度变差。'},
loss:{t:'啤酒损耗与麦芽单耗',src:'p.709–712',f:[['Vc','定型麦汁量',11700,'hl',10],['Vs','可售啤酒量',10500,'hl',10],['G','投料量',180000,'kg',100]],
 c:v=>{if(!(v.Vc>0&&v.Vs>0))return{err:'体积要大于 0。'};return{o:[['啤酒损耗',fmt((v.Vc-v.Vs)/v.Vc*100,2),'%',1],['损失体积',fmt(v.Vc-v.Vs,0),'hl'],['麦芽单耗',fmt(v.G/v.Vs,2),'kg/hl']]}},
 n:'损耗 = 定型麦汁与可售啤酒之差占定型麦汁的百分比，平均 8–10%（其中约 4% 是冷缩）。麦芽单耗参考：6% 啤酒约 9 kg/hl，11% 约 17 kg/hl，16% 约 26 kg/hl。收率与损耗的百分数不能相加。'},
cap:{t:'糖化间年产能',src:'p.333–334',f:[['W','每批定型麦汁',640,'hl',10],['B','每天批次',8,'批',1],['D','每周酿造天数',5,'天',.5],['K','每年生产周',52,'周',1],['Hd','节假日',10,'天',1],['L','损耗',9,'%',.5]],
 c:v=>{const d=v.W*v.B,y=d*v.D*v.K-v.Hd*d;return{o:[['每天定型麦汁',fmt(d,0),'hl'],['每年定型麦汁',fmt(y,0),'hl'],['每年可售啤酒',fmt(y*(1-v.L/100),0),'hl',1]]}},
 n:'书中经验：1 hl 啤酒约耗 17 kg 麦芽；1 t 投料约定型 64.6 hl 麦汁；每天 8 批、每周 5 天时，每 1 t 投料能力大约对应每年 10 万 hl 啤酒。这是理论上限，维修停产会明显降低。'}
};
function buildTool(el,key){
  const T=TOOLS[key],id='t-'+key;el.id=id;el.className='tool';el.dataset.name=T.t;
  el.innerHTML=`<div class="tool-h"><span class="tag">计算</span><span>${esc(T.t)}</span><span class="src">Kunze ${esc(T.src)}</span></div><div class="tool-g">${T.f.map(([k,l,v,u,st])=>`<label for="${id}-${k}"><span>${esc(l)}</span><span class="in"><input id="${id}-${k}" type="number" inputmode="decimal" value="${v}" step="${st}">${u?`<em>${esc(u)}</em>`:''}</span></label>`).join('')}</div><div class="tool-o" aria-live="polite"></div><p class="tool-err" hidden></p><p class="tool-n tool-i" hidden></p><p class="tool-n">${esc(T.n)}</p>`;
  const out=el.querySelector('.tool-o'),er=el.querySelector('.tool-err'),inf=el.querySelector('.tool-i');
  function run(){
    const v={};for(const [k] of T.f){const x=parseFloat(el.querySelector(`#${id}-${k}`).value);v[k]=x}
    if(Object.values(v).some(x=>!Number.isFinite(x))){out.hidden=true;er.hidden=false;er.textContent='请把每一项都填成数字。';return}
    const r=T.c(v);
    if(r.err){out.hidden=true;inf.hidden=true;er.hidden=false;er.textContent=r.err;return}
    out.hidden=false;
    out.innerHTML=r.o.map(([l,val,u,mn])=>`<div class="out${mn?' main':''}"><span>${esc(l)}</span><b>${esc(val)}</b>${u?`<small>${esc(u)}</small>`:''}</div>`).join('');
    if(r.w){er.hidden=false;er.textContent=r.w}else er.hidden=true;
    if(r.i){inf.hidden=false;inf.textContent=r.i}else inf.hidden=true;
  }
  el.addEventListener('input',run);run();
}
