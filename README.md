# Kunze 酿造工艺 wiki

按 Wolfgang Kunze《Technology Brewing and Malting》（第 3 版国际版，VLB Berlin 2004）的顺序，把全书整理成中文学习笔记：从原料到灌装的 6 个工艺阶段，加上成品啤酒、小型酿造、废物与环境、能源、自动化与工厂规划 5 个专题（含原书引言的啤酒简史），共 68 个工序，附 22 个计算工具、119 条术语和 114 道自测题。

- **阅读 wiki**：[wiki/README.md](wiki/README.md)
- **交互网页**（图表、计算器、搜索、术语表）：<https://mrgreedcp-spec.github.io/kunze-brewing-wiki/>（GitHub Pages，公开）；claude.ai 上也有同一页面 [Kunze 酿造工艺图谱](https://claude.ai/artifact/18cgTT4TP39ZYKT4qf6q6u)；还可以下载 `site/index.html` 用浏览器打开（字体从 Google Fonts 加载，离线时自动换用系统字体）
- **方法说明**：[从一本书到一个 wiki 的流程](docs/book-to-wiki.md)（在线版：[claude.ai 文档](https://claude.ai/artifact/YHbbEryh4Z1QRi5mxYRuzx)）
- 本仓库和 GitHub Pages 是公开的；claude.ai 上的两个页面需要登录 Claude 并由所有者分享后才能打开

## 目录结构

```text
src/
  content/   每个阶段和专题的结构化内容（唯一的事实源）
  page/      交互网页的样式、图表、计算器与渲染脚本
  wiki/      术语表、覆盖范围与书中疑点
scripts/
  build_site.mjs   src/ → site/index.html
  build_wiki.mjs   src/ → wiki/*.md（加 --gh-wiki 生成 GitHub Wiki 格式）
.github/workflows/pages.yml   推送后自动发布 GitHub Pages
site/        生成的交互网页
wiki/        生成的 Markdown wiki（请改 src/ 后重新生成，不要直接修改）
docs/        方法说明
mkdocs.yml   可选：用 MkDocs 生成带搜索的文档站
```

## 构建

只需要 Node.js 18 或更高版本，没有第三方依赖。

```bash
npm run build          # 同时生成 site/index.html 和 wiki/
npm run build:gh-wiki  # 生成 GitHub Wiki 格式到 build/gh-wiki/
```

`build_wiki.mjs` 会检查所有站内链接，有断链时以非零状态退出。推送到 main 后，GitHub Actions（`.github/workflows/pages.yml`）会重新生成网页、检查链接，并把 `site/` 发布到 GitHub Pages。

## 覆盖范围

已整理原书引言和第 1–11 章（p.19–919）；只有附录（缩写表、单位换算、文献与索引）没有整理。第 1–6 章按工艺顺序组成 6 个阶段，引言和第 7–11 章是横向内容，另设 5 个专题。书中发现的排印错误和前后不一致见 [来源、页码与覆盖范围](wiki/sources.md)。

## 版权与使用说明

- 这是个人学习笔记。内容为中文自述整理，没有收录原书的段落、插图或表格；数值属于事实性数据，都标注了原书印刷页码，便于对照。
- 本仓库不包含原书、扫描件或 OCR 文本；`.gitignore` 已排除这些文件，请不要把它们加入仓库。
- 需要完整、准确的内容，请阅读原书：Wolfgang Kunze, *Technology Brewing and Malting*, VLB Berlin（ISBN 3-921690-49-8）。
- 书中数据反映约 2004 年的德国与欧洲实践和法规；工艺曲线为依据文字描述绘制的示意图。
