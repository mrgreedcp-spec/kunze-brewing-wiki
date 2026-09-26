// 从 src/ 的结构化数据生成 Markdown wiki。
//   node scripts/build_wiki.mjs                       → wiki/（仓库内浏览、MkDocs）
//   node scripts/build_wiki.mjs --gh-wiki build/gh-wiki → GitHub Wiki 格式（Home.md、_Sidebar.md、无 .md 后缀的链接）
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const args = process.argv.slice(2);
const GH = args.includes('--gh-wiki');
const outDir = path.resolve(root, GH ? (args[args.indexOf('--gh-wiki') + 1] || 'build/gh-wiki') : 'wiki');
if (!outDir.startsWith(root + path.sep)) throw new Error('输出目录必须在仓库内：' + outDir);

// 1. 在沙箱中执行数据脚本（与网页共用同一份数据），取出数据对象
const content = fs.readdirSync(path.join(root, 'src/content')).filter(f => f.endsWith('.js')).sort();
const code = [
  read('src/page/core.js'), read('src/page/tools.js'),
  ...content.map(f => read('src/content/' + f)),
  read('src/page/programmes.js'), read('src/wiki/glossary.js'), read('src/wiki/coverage.js'),
  '({STAGES,TOOLS,ENZ,RESTS,MALT,MASH,FERM,GLOSSARY,COVERAGE,NOTES,rng})'
].join('\n;\n');
const D = vm.runInContext(code, vm.createContext({}));

// 2. 通用函数
const PAGES = { 1: '01-raw-materials', 2: '02-malting', 3: '03-wort-production', 4: '04-fermentation', 5: '05-filtration-stabilisation', 6: '06-filling-cleaning',
  7: '07-finished-beer', 8: '08-small-scale-brewing', 9: '09-environment', 10: '10-energy', 11: '11-automation-planning' };
const PROC = () => D.STAGES.filter(st => !st.topic), TOPICS = () => D.STAGES.filter(st => st.topic);
const HOME = GH ? 'Home' : 'README';
const ARTIFACT = 'https://claude.ai/artifact/18cgTT4TP39ZYKT4qf6q6u';
const GUIDE = 'https://claude.ai/artifact/YHbbEryh4Z1QRi5mxYRuzx';
const link = (page, anchor = '') => (GH ? page : page + '.md') + (anchor ? '#' + anchor : '');
const eh = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const et = s => eh(s).replace(/\|/g, '\\|');
const nn = n => String(n).padStart(2, '0');
const table = (head, rows) => `| ${head.map(et).join(' | ')} |\n| ${head.map(() => '---').join(' | ')} |\n` + rows.map(r => `| ${r.map(et).join(' | ')} |`).join('\n') + '\n';
const rawTable = (head, rows) => `| ${head.join(' | ')} |\n| ${head.map(() => '---').join(' | ')} |\n` + rows.map(r => `| ${r.join(' | ')} |`).join('\n') + '\n';
const details = (q, a) => `<details><summary>${eh(q)}</summary>\n\n${eh(a)}\n\n</details>\n`;
const back = `[返回首页](${link(HOME)})`;

const stepPage = {}, stepById = {}, toolUse = {};
D.STAGES.forEach(st => st.steps.forEach(s => {
  stepPage[s.id] = PAGES[st.n]; stepById[s.id] = s;
  (s.w || []).forEach(w => { const [k, v] = w.split(':'); if (k === 'tool') toolUse[v] = s.id; });
}));
const stepLink = id => { const s = stepById[id]; if (!s) throw new Error('未知工序 ' + id); return `[${s.no} ${eh(s.t)}](${link(stepPage[id], id)})`; };
const FIG = { enz: ['enzymes', '主要酶的最适温度'], mash: ['mash', '糖化程序'], ferm: ['fermentation', '下面发酵温度程序'], malt: ['malting', '制麦物料质量变化'] };
const nSteps = D.STAGES.reduce((a, s) => a + s.steps.length, 0);
const nQ = D.STAGES.reduce((a, s) => a + s.steps.reduce((b, x) => b + (x.q ? x.q.length : 0), 0), 0);

// 3. 页面
function stepMd(s) {
  let o = `---\n\n<a id="${s.id}"></a>\n\n## ${s.no} ${eh(s.t)}（${eh(s.en)}）\n\n*Kunze p.${eh(s.p)}*\n\n**目的**：${eh(s.goal)}\n\n`;
  if (s.params) o += '**关键参数**\n\n' + table(['项目', '数值'], s.params) + '\n';
  if (s.table) o += table(s.table.head, s.table.rows) + '\n';
  if (s.pts) o += '**机理与要点**\n\n' + s.pts.map(p => `- ${eh(p)}`).join('\n') + '\n\n';
  if (s.w) o += '**相关工具**：' + s.w.map(w => { const [k, v] = w.split(':'); return k === 'tool' ? `[计算：${eh(D.TOOLS[v].t)}](${link('tools', v)})` : `[数据：${FIG[v][1]}](${link('programmes', FIG[v][0])})`; }).join(' · ') + '\n\n';
  if (s.faults) o += '**常见问题**\n\n' + table(['现象', '常见原因', '对策'], s.faults) + '\n';
  if (s.q) o += '**自测**\n\n' + s.q.map(([q, a]) => details(q, a)).join('\n') + '\n';
  return o;
}
function stagePage(st, i) {
  const prev = D.STAGES[i - 1], next = D.STAGES[i + 1];
  let o = `# ${nn(st.n)} ${st.name}（${st.en}）\n\n> ${st.topic ? '专题 · ' : ''}Kunze 原书印刷页 p.${st.pages} · ${back}\n\n${eh(st.sum)}\n\n`;
  o += (st.topic ? `- **范围**：${eh(st.scope)}\n` : `- **输入**：${eh(st.inp)}\n- **输出**：${eh(st.out)}\n`) + `- **关键数字**：${st.chips.map(eh).join(' · ')}\n\n`;
  o += '**本页工序**：' + st.steps.map(s => `[${s.no} ${eh(s.t)}](#${s.id})`).join(' · ') + '\n\n';
  st.steps.forEach(s => { o += stepMd(s); });
  o += '---\n\n' + [prev ? `← [${nn(prev.n)} ${prev.name}](${link(PAGES[prev.n])})` : '', back, next ? `[${nn(next.n)} ${next.name}](${link(PAGES[next.n])}) →` : ''].filter(Boolean).join(' · ') + '\n';
  return o;
}
function toolsPage() {
  let o = `# 计算工具与公式\n\n> 与交互网页中的 ${Object.keys(D.TOOLS).length} 个计算器是同一套公式；下面的“示例输出”由构建脚本按示例输入实际算出。${back}\n\n`;
  o += Object.keys(D.TOOLS).map(k => `[${eh(D.TOOLS[k].t)}](#${k})`).join(' · ') + '\n\n';
  for (const [k, T] of Object.entries(D.TOOLS)) {
    const r = T.c(Object.fromEntries(T.f.map(f => [f[0], f[2]])));
    o += `---\n\n<a id="${k}"></a>\n\n## ${eh(T.t)}\n\n*Kunze ${eh(T.src)}*` + (toolUse[k] ? ` · 用于 ${stepLink(toolUse[k])}` : '') + `\n\n${eh(T.n)}\n\n`;
    o += table(['输入', '示例值'], T.f.map(f => [f[1], `${f[2]}${f[3] ? ' ' + f[3] : ''}`])) + '\n';
    if (r.err) o += `示例输入有误：${eh(r.err)}\n\n`;
    else {
      o += table(['结果', '示例输出'], r.o.map(x => [x[0], `${x[1]}${x[2] ? ' ' + x[2] : ''}`])) + '\n';
      if (r.w) o += `> 提示：${eh(r.w)}\n\n`;
      if (r.i) o += `> ${eh(r.i)}\n\n`;
    }
  }
  return o;
}
function progPage() {
  let o = `# 糖化、发酵程序与酶\n\n> 程序曲线是依据书中文字描述整理的示意数据，升温速率等为假设；交互图见在线网页。${back}\n\n`;
  o += `<a id="enzymes"></a>\n\n## 主要酶的最适温度\n\n*Kunze p.214–225* · 用于 ${stepLink('s3-2')}\n\n`;
  o += table(['酶', '最适温度 °C', '最适 pH', '失活', '说明'], D.ENZ.filter(x => !x.g).map(x => [x.n, D.rng(x), x.ph || '—', x.xt || '—', x.note])) + '\n';
  o += '常用休止温度：' + D.RESTS.map(r => `${r[2]} ${r[0]}–${r[1]} °C`).join('；') + '。\n\n';
  o += `<a id="mash"></a>\n\n## 糖化程序（示意）\n\n用于 ${stepLink('s3-2')}；煮出醪量的算法见[计算：煮出醪量](${link('tools', 'decoct')})。\n\n`;
  D.MASH.forEach(p => {
    const rows = [...p.main.map(q => ['主醪', q[0], q[1]]), ...p.dec.flatMap((sg, n) => sg.map(q => [`煮出醪${p.dec.length > 1 ? `（第 ${n + 1} 次）` : ''}`, q[0], q[1]]))];
    o += `### ${eh(p.t)}\n\n${eh(p.d)}\n\n` + table(['系列', '时间 min', '温度 °C'], rows) + '\n';
    if (p.ev.length) o += '操作节点：' + p.ev.map(ev => `${ev.x} min ${eh(ev.d)}`).join('；') + '。\n\n';
  });
  o += `<a id="fermentation"></a>\n\n## 下面发酵温度程序（示意）\n\n用于 ${stepLink('s4-5')}\n\n`;
  D.FERM.forEach(p => {
    o += `### ${eh(p.t)}\n\n${eh(p.d)}\n\n` + table(['第几天', '温度 °C'], p.pts) + '\n';
    o += '阶段：' + p.bands.map(b => `${eh(b[2])} 第 ${b[0]}–${b[1]} 天`).join('；') + '。\n\n';
  });
  o += `<a id="malting"></a>\n\n## 制麦物料质量变化\n\n*Kunze p.174* · 用于 ${stepLink('s2-6')}\n\n` + table(['阶段', '质量 kg', '说明'], D.MALT) + '\n';
  return o;
}
function glossaryPage() {
  const col = new Intl.Collator('zh-Hans-CN');
  const rows = [...D.GLOSSARY].sort((a, b) => col.compare(a[0], b[0]));
  return `# 术语表\n\n> 共 ${rows.length} 条，按拼音排序；“见”一栏链接到主要出现的工序。${back}\n\n` + rawTable(['术语', '英文', '解释', '见'], rows.map(r => [et(r[0]), et(r[1]), et(r[2]), stepLink(r[3])]));
}
function quizPage() {
  let o = `# 自测题\n\n> 共 ${nQ} 道，按工序排列，点开看答案。答不上来就回到对应工序重读。${back}\n\n`;
  D.STAGES.forEach(st => {
    o += `## ${st.topic ? '专题 ' : ''}${nn(st.n)} ${st.name}\n\n`;
    st.steps.filter(s => s.q).forEach(s => { o += `### ${stepLink(s.id)}\n\n` + s.q.map(([q, a]) => details(q, a)).join('\n') + '\n'; });
  });
  return o;
}
function sourcesPage() {
  return `# 来源、页码与覆盖范围\n\n${back}\n\n## 来源\n\nWolfgang Kunze：*Technology Brewing and Malting*，第 3 版国际版，Susan Pratt 译，VLB Berlin，2004（ISBN 3-921690-49-8）。\n\n`
    + '- 页码一律为原书印刷页码。\n- 本 wiki 是个人学习笔记：内容为中文自述整理，没有收录原书的段落、插图或表格；数值属于事实性数据，都标注了出处页码，方便对照原书。\n- 书中数据反映约 2004 年的德国与欧洲实践和法规（如纯酒令、饮用水法规）；出现的商业设备和系统名称只作为方法示例。\n\n'
    + '## 覆盖范围\n\n' + table(['章节', '印刷页', '状态', '说明'], D.COVERAGE)
    + '\n## 书中疑点与处理\n\n' + table(['位置', '内容', '处理'], D.NOTES)
    + '\n## 生成方式\n\n本 wiki 由 `scripts/build_wiki.mjs` 从 `src/` 下的结构化数据自动生成；要修改内容，请改数据后重新生成，不要直接改这些页面。\n';
}
function homePage() {
  const rows = PROC().map(st => [`[${nn(st.n)} ${st.name}](${link(PAGES[st.n])})`, `p.${st.pages}`, `${et(st.inp)} → ${et(st.out)}`, st.chips.map(et).join('；'), String(st.steps.length)]);
  const trows = TOPICS().map(st => [`[${nn(st.n)} ${st.name}](${link(PAGES[st.n])})`, `p.${st.pages}`, et(st.scope), st.chips.map(et).join('；'), String(st.steps.length)]);
  return `# Kunze 酿造工艺 wiki\n\n按 Wolfgang Kunze《Technology Brewing and Malting》（第 3 版国际版，VLB Berlin 2004）的顺序整理的中文学习笔记：从大麦到灌装的 ${PROC().length} 个工艺阶段，加上成品啤酒、小型酿造、废物与环境、能源、自动化与工厂规划 ${TOPICS().length} 个专题，共 ${nSteps} 个工序。每个工序写明目的、关键参数、机理、常见问题和自测题。\n\n`
    + `交互版（图表、计算器、搜索、术语表）：[Kunze 酿造工艺图谱](${ARTIFACT})（需登录 Claude 并获得分享权限；仓库中的 \`site/index.html\` 是同一页面，可直接用浏览器打开）。整理方法见[从一本书到一个 wiki](${GUIDE})。\n\n`
    + '## 工艺主线\n\n' + rawTable(['阶段', '原书页码', '输入 → 输出', '关键数字', '工序数'], rows)
    + '\n## 专题（原书引言与第 7–11 章）\n\n' + rawTable(['专题', '原书页码', '范围', '关键数字', '工序数'], trows)
    + `\n## 其他页面\n\n- [计算工具与公式](${link('tools')})：${Object.keys(D.TOOLS).length} 个，含示例计算\n- [糖化、发酵程序与酶](${link('programmes')})\n- [术语表](${link('glossary')})：${D.GLOSSARY.length} 条\n- [自测题](${link('quiz')})：${nQ} 道\n- [来源、页码与覆盖范围](${link('sources')})\n\n`
    + '## 怎么用\n\n1. 先用上表把六个工艺阶段串起来，再进入某一阶段按工序读；专题可以按需要单独读。\n2. 每个工序先读“目的”，再看“关键参数”，最后用“机理与要点”解释这些参数为什么是这样。\n3. 读完一个工序就做它的自测题；术语不熟时查术语表。\n4. 涉及计算的地方，先看公式页的示例，再用交互版计算器换成自己的数字。\n';
}
function sidebar() {
  return `**[首页](${link(HOME)})**\n\n**工艺阶段**\n\n` + PROC().map(st => `- [${nn(st.n)} ${st.name}](${link(PAGES[st.n])})`).join('\n')
    + '\n\n**专题**\n\n' + TOPICS().map(st => `- [${nn(st.n)} ${st.name}](${link(PAGES[st.n])})`).join('\n')
    + `\n\n- [计算工具与公式](${link('tools')})\n- [糖化、发酵程序与酶](${link('programmes')})\n- [术语表](${link('glossary')})\n- [自测题](${link('quiz')})\n- [来源与覆盖范围](${link('sources')})\n`;
}

// 4. 写出并检查站内链接
const files = { [HOME]: homePage(), tools: toolsPage(), programmes: progPage(), glossary: glossaryPage(), quiz: quizPage(), sources: sourcesPage() };
D.STAGES.forEach((st, i) => { files[PAGES[st.n]] = stagePage(st, i); });
if (GH) files._Sidebar = sidebar();
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });
for (const [name, text] of Object.entries(files)) fs.writeFileSync(path.join(outDir, name + '.md'), text);

const anchors = Object.fromEntries(Object.entries(files).map(([n, t]) => [n, new Set([...t.matchAll(/<a id="([^"]+)"><\/a>/g)].map(m => m[1]))]));
let bad = 0, total = 0;
for (const [name, text] of Object.entries(files)) {
  for (const m of text.matchAll(/\]\(([^)\s]+)\)/g)) {
    const href = m[1];
    if (/^https?:/.test(href)) continue;
    total++;
    const [p, a] = href.split('#');
    const page = p === '' ? name : (GH ? p : p.replace(/\.md$/, ''));
    if (!files[page] || (a && !anchors[page].has(a))) { bad++; console.warn(`断链：${name} → ${href}`); }
  }
}
console.log(`${path.relative(root, outDir)}/  ${Object.keys(files).length} 个页面，站内链接 ${total} 个，断链 ${bad} 个`);
if (bad) process.exitCode = 1;
