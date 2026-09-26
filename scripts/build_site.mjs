// 把 src/ 下的样式、内容数据和渲染脚本拼成单文件网页 site/index.html
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = p => fs.readFileSync(path.join(root, p), 'utf8');
const content = fs.readdirSync(path.join(root, 'src/content')).filter(f => f.endsWith('.js')).sort();
const js = [
  read('src/page/core.js'), read('src/page/tools.js'),
  ...content.map(f => read('src/content/' + f)),
  read('src/page/programmes.js') + read('src/page/render.js')
];
const html = read('src/page/head.html') + '<script>\n' + js.map(s => s + '\n').join('') + '</script>\n';
fs.mkdirSync(path.join(root, 'site'), { recursive: true });
fs.writeFileSync(path.join(root, 'site/index.html'), html);
console.log(`site/index.html  ${(html.length / 1024).toFixed(1)} KB`);
