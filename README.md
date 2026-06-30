# 🔧 AI 知识库

将 Obsidian 个人知识库自动转化为可公开访问的知识网站。

**线上访问：** [https://kb.ccbot.chat](https://kb.ccbot.chat)

---

## 项目概述

AI 知识库是一个**个人知识管理与展示网站**，以 Obsidian Markdown 笔记为数据源，通过构建时自动生成结构化的文章数据，驱动 Next.js 服务端渲染，实现文章的**分类浏览**、**全文搜索**和**阅读**功能。

### 核心逻辑

```
Obsidian 笔记（Markdown） → 构建时数据提取 → Next.js SSR 渲染 → 静态/动态页面输出
```

- 所有文章存储在本地 Obsidian 知识库中（`~/Documents/obsidian/AI知识库/`）
- `npm run build` 时自动扫描 Markdown 文件，解析 frontmatter + 正文 → 生成 `articles-data.json`
- Next.js 服务端渲染：首页/分类页 SSG、文章详情页 SSR（按需渲染）、搜索 API 动态响应
- 部署到自有服务器，PM2 进程管理，Nginx 反代

---

## 技术栈

| 层级 | 技术 |
|------|------|
| 框架 | Next.js 14 (App Router) |
| 前端 | React 18, Tailwind CSS 3 |
| 数据源 | Obsidian 本地 Markdown (frontmatter + 正文) |
| 搜索 | MiniSearch (客户端全文索引) |
| 测试 | Vitest |
| 部署 | PM2 + rsync + SSH |
| 服务器 | Ubuntu (Docker/Nginx) |
| 设计规范 | 独立 `DESIGN.md` 定义视觉系统 |

---

## 目录结构

```
ai-knowledge-site/
├── src/
│   ├── app/
│   │   ├── layout.tsx              # 根布局（侧边栏 + 顶栏 + 搜索）
│   │   ├── page.tsx                # 首页（分类网格 + 最新30篇）
│   │   ├── globals.css             # 全局样式
│   │   ├── article/[...slug]/
│   │   │   └── page.tsx            # 文章阅读页（SSR 动态渲染）
│   │   ├── category/[slug]/
│   │   │   └── page.tsx            # 分类列表页
│   │   ├── latest/
│   │   │   └── page.tsx            # 今日最新发布页（前5篇）
│   │   ├── search/
│   │   │   └── page.tsx            # 搜索页
│   │   └── api/
│   │       ├── categories/route.ts # 分类列表 API
│   │       ├── latest-count/route.ts # 今天文章数 API
│   │       └── search/route.ts     # 搜索 API
│   ├── components/
│   │   ├── Sidebar.tsx             # 侧边栏（220px，移动端折叠）
│   │   ├── SearchBar.tsx           # 搜索框
│   │   ├── ArticleCard.tsx         # 文章卡片
│   │   └── CategoryTag.tsx         # 分类标签
│   ├── lib/
│   │   ├── types.ts                # TypeScript 类型
│   │   ├── categories.ts           # 8个分类 + 关键词自动分类规则
│   │   ├── articles.ts             # 文章数据访问层
│   │   ├── articles-data.json      # 构建时生成的文章数据
│   │   └── search.ts               # MiniSearch 封装
│   └── __tests__/
│       ├── articles.test.ts        # 文章模块测试
│       └── categories.test.ts      # 分类模块测试
├── scripts/
│   ├── generate-data.mjs           # 数据生成脚本（构建时运行）
│   └── watch.js                    # 开发时文件监听
├── ecosystem.config.js             # PM2 生产部署配置
├── vitest.config.ts                # Vitest 测试配置
└── DESIGN.md                       # 视觉设计规范
```

---

## 分类体系

8 个分类，每篇文章根据标题 + 标签 + 正文关键词自动归类：

| 分类 | Slug | 图标 | 典型关键词 |
|------|------|------|-----------|
| AI 编程工程方法论 | ai-engineering | ⚡ | vibe coding, superpowers, TDD, CLAUDE.md |
| AI 设计体系 | ai-design | 🎨 | design-md, ardot, figma, penpot |
| RAG / 知识库 | rag-knowledge | 🧠 | rag, embedding, obsidian, 向量 |
| 端侧 AI / 嵌入式 | edge-ai | 🤖 | esp32, tinyml, mcu, zephyr |
| 模型 / 技术前沿 | models | 🔬 | qwen, diffusions, 量化, 开源模型 |
| 开源工具 | open-source | 🛠 | github, ai-website, 短视频创作 |
| 宏观 / 商业 | business | 📊 | anthropic, 变现, 创业 |
| 其他 | uncategorized | 📄 | 未被以上分类匹配的文章 |

---

## 快速开始

```bash
# 安装依赖
npm install

# 开发模式（数据生成 + Next.js 热重载）
npm run dev

# 运行测试
npm test

# 生产构建
npm run build

# 启动生产服务
npm start
```

### 开发工作流

1. 在 Obsidian `AI知识库/` 中编写/修改 Markdown 笔记
2. 运行 `npm run build` → `scripts/generate-data.mjs` 自动提取文章数据
3. 启动 `npm run dev` 本地预览
4. 确认无误后 `npm run deploy` 推送到生产服务器

### 笔记格式要求

每篇 Markdown 笔记可包含以下 frontmatter：

```yaml
---
title: 文章标题（可选，默认取第一个 # 标题）
date: 2026-06-30（可选，默认取文件名前10位）
tags: [daily-save, web-clip]（可选）
source: https://...（可选，原文链接）
---
```

正文中可以用 `## 摘要` 章节指定文章摘要，否则自动取第一个非标题段落。

---

## 部署

### 生产环境

| 配置 | 值 |
|------|-----|
| 域名 | kb.ccbot.chat |
| 服务器端口 | 8000 |
| 进程管理 | PM2 |
| 反代 | Nginx（堡塔面板配置） |
| 部署路径 | `/www/wwwroot/kb.ccbot.chat/` |

### 一键部署

```bash
npm run deploy
```

部署流水线：
1. `npm run build` — 本地构建（数据生成 + Next.js 编译）
2. `rsync` — 同步到服务器（排除 `node_modules`、`.next/cache`）
3. `SSH` — 远程安装生产依赖 + PM2 重启

### PM2 管理

```bash
pm2 list                    # 查看进程状态
pm2 logs ai-knowledge       # 查看日志
pm2 restart ai-knowledge    # 重启
pm2 startup                 # 开机自启
```

---

## 设计规范

项目采用**极简文档站**风格，核心原则参见 `DESIGN.md`：

- **色彩**：暖白底 `#FAFAF8` + 品牌蓝 `#2563EB` + 三层灰度信息层级
- **字体**：Inter (英文) + PingFang SC (中文) + JetBrains Mono (代码)
- **布局**：侧边栏 220px + 内容区自适应，CSS Grid 卡片布局
- **零阴影**：层级靠背景色和边框区分，拒绝渐变/阴影/多级展开
- **响应式**：三档断点（<768px / 768-1024px / >1024px）

---

## 路线图

- [x] 分类浏览（8 分类自动归类）
- [x] 全文搜索（MiniSearch 客户端索引）
- [x] 最新发布（当天前 5 篇）
- [x] 文章阅读页（Markdown 渲染）
- [x] 自动数据管道（构建时扫描 Obsidian）
- [x] TDD 测试覆盖
- [ ] Obsidian 文件变更自动触发网站更新
- [ ] 文章点赞/收藏功能
- [ ] RSS 订阅
- [ ] 标签云导航

---

## 许可证

个人项目，仅供学习参考。
