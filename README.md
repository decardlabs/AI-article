# 🔧 AI 知识库 — 完整工作链

> **从网页剪藏到知识网站发布**，一站式自动化工作链。
>
> `clipper/` 负责数据生产（抓取网页 → AI 总结 → 存入 Obsidian），
> `src/` 负责内容展示（Obsidian 笔记 → 编译部署 → 可公开访问的知识网站）。

**线上网站：** [https://kb.ccbot.chat](https://kb.ccbot.chat)

---

## 一、完整工作流程总览

```
┌────────────────────────────────────────────────────────────────────┐
│                   工具选择（任选一种）                               │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  方式 A：Chrome 扩展                方式 B：AI 对话技能              │
│  ┌─────────────────────┐           ┌──────────────────────────┐    │
│  │ 浏览网页 → 点图标    │           │ 对话中说「总结一下：URL」 │    │
│  │ → 自动提取正文       │           │ → 自动抓取网页            │    │
│  │ → AI 生成摘要        │           │ → AI 总结生成 Markdown    │    │
│  │ → 保存到 Obsidian    │           │ → 保存到 Obsidian         │    │
│  └─────────┬───────────┘           │ → git push 触发 CI/CD    │    │
│            │                       └──────────┬───────────────┘    │
│            ↓                                   ↓                    │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │                Obsidian 笔记（Markdown 文件）               │      │
│  │    路径：~/Documents/obsidian/AI知识库/YYYY-MM-DD-标题.md  │      │
│  └──────────────────────┬───────────────────────────────────┘      │
│                         ↓                                          │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │               构建发布（npm run build）                     │      │
│  │                                                           │      │
│  │  scripts/generate-data.mjs → 扫描 Obsidian → 生成 JSON    │      │
│  │  → Next.js 编译（SSG + SSR）→ 产出静态/动态页面            │      │
│  └──────────────────────┬───────────────────────────────────┘      │
│                         ↓                                          │
│  ┌──────────────────────────────────────────────────────────┐      │
│  │               部署上线                                       │      │
│  │                                                           │      │
│  │  方式 A：本地 npm run deploy（rsync + SSH）                 │      │
│  │  方式 B：git push → GitHub Actions 自动部署                  │      │
│  │                                                           │      │
│  │  服务器：npm ci → pm2 restart → 清 nginx 缓存               │      │
│  └──────────────────────┬───────────────────────────────────┘      │
│                         ↓                                          │
│              🌐 https://kb.ccbot.chat                               │
└────────────────────────────────────────────────────────────────────┘
```

---

## 二、工具详解

### 2.1 方式 A：Chrome 扩展剪藏（浏览器中一键保存）

**入口：** `clipper/obsidian-clipper/extension/`

**适用场景：** 浏览网页时看到好文章，想保存到知识库。

**使用流程：**

```
1. 打开 Chrome → 加载扩展（开发者模式加载 clipper/obsidian-clipper/extension/）
2. 配置扩展设置：
   - Obsidian 仓库路径：~/Documents/obsidian/
   - AI 供应商：DeepSeek / OpenAI / 自定义
   - API Key：你的 API 密钥
3. 浏览到目标网页 → 点击扩展图标
   └→ 自动提取正文（Readability 智能解析）
   └→ AI 生成三段式摘要（摘要 + 主要内容 + 原文关键段落）
   └→ 弹窗预览 → 点击「保存到 Obsidian」
   └→ 本地服务接收数据 → 写入 AI知识库/ 目录
```

**依赖：** 需要同时启动本地服务 `clipper/obsidian-clipper/server/`。

**本地服务启动：**

```bash
cd clipper/obsidian-clipper/server
echo 'VAULT_PATH=/Users/macairm5/Documents/obsidian' > .env
node index.js
# 监听 http://localhost:8765
```

**扩展架构：**

```
点击图标 → content_script.js（Readability 提取正文）
   → popup.js（LLM API 生成摘要 → Turndown 转 Markdown）
   → POST localhost:8765/save
   → server/index.js（file-writer.js 写文件 + 重名处理）
   → /AI知识库/YYYY-MM-DD - 标题.md
```

**服务端 API：**

| 端点 | 方法 | 说明 |
|------|------|------|
| `/health` | GET | 健康检查 |
| `/save` | POST | 保存剪藏（需 url, title, contentMd） |

---

### 2.2 方式 B：AI 对话技能（一句话总结链接）

**入口：** `clipper/skill/SKILL.md`

**适用场景：** 在 WorkBuddy 对话中快速保存文章，附带自动推送部署。

**使用流程：**

```
在 WorkBuddy 对话中输入：
  「总结一下：https://mp.weixin.qq.com/s/xxx」

AI 自动执行：
  ① WebFetch 抓取网页 → 提取标题、作者、正文结构
  ② AI 生成结构化 Markdown（摘要 + 主要内容 + 关键段落）
  ③ 写入 Obsidian → /AI知识库/YYYY-MM-DD - 标题.md
  ④ 运行 generate-data.mjs → git push
  ⑤ GitHub Actions 自动编译部署 → 网站 2-3 分钟更新
```

**触发词：**
- `总结一下：https://...`
- `帮我保存这个链接 https://...`
- `把这个网页存到 Obsidian https://...`

**技能工作流程：** 详见 `clipper/skill/docs/workflow.md`

---

### 2.3 网站内容展示（Next.js 知识库网站）

**入口：** `src/`

**适用场景：** 将 Obsidian 笔记发布为可分类浏览、可全文搜索的公开网站。

**核心功能：**

| 功能 | 路由 | 说明 |
|------|------|------|
| 首页 | `/` | 分类网格 + 最新文章列表 |
| 分类浏览 | `/category/[slug]` | 按 8 个分类筛选文章 |
| 文章阅读 | `/article/[...slug]` | 完整文章阅读页（SSR） |
| 最新发布 | `/latest` | 最近收录的 9 篇文章 |
| 全文搜索 | `/search` | MiniSearch 客户端中文搜索 |
| 分类 API | `/api/categories` | 分类列表及文章数 |
| 搜索 API | `/api/search` | 搜索接口 |

**数据管道：**

```
Obsidian 笔记（Markdown）
   → scripts/generate-data.mjs（构建时解析 frontmatter + 正文）
   → src/lib/articles-data.json（结构化数据）
   → Next.js 服务端渲染（SSG 首页/分类页 + SSR 文章页）
   → 部署到服务器
```

**分类规则：** 8 个分类，通过关键词自动匹配（标题 + 标签 + 正文前 500 字）

| 分类 | 图标 | 匹配关键词（部分） |
|------|------|-------------------|
| 编程工程方法论 | ⚡ | claude code, loop, tdd, spec, vibe coding |
| 设计体系 | 🎨 | design.md, figma, ardot, lovart, 设计规范 |
| RAG / 知识库 | 🧠 | rag, 知识库, obsidian, embedding, 向量 |
| 端侧 AI / 嵌入式 | 🤖 | esp32, 端侧, 嵌入式, 思必驰, 语音模型 |
| 模型 / 技术前沿 | 🔬 | qwen, rwkv, 开源模型, 全模态, 流式音视频 |
| 开源工具 | 🛠 | 开源工具, github, 灵感熔炉, 蔓藤 |
| 宏观 / 商业 | 📊 | 创始人, 微信, 小程序, 阿里产品经理 |
| 其他未分类 | 📄 | 以上均未命中时兜底 |

---

### 2.4 CI/CD 自动部署

**入口：** `.github/workflows/deploy.yml`

**触发条件：** 推送 `main` 分支

**流程：**

```
git push → GitHub Actions
  → npm ci（安装依赖）
  → NEXT_TRACE_UPLOAD_DISABLED=1 next build（编译）
  → rsync 到服务器 /www/wwwroot/kb.ccbot.chat/
  → 服务器：rm -rf .next → npm run build → pm2 restart
  → 清空 nginx 缓存 → 部署完成
```

---

## 三、目录结构

```
AI-article/
│
├── clipper/                              # 📥 数据生产工具
│   ├── obsidian-clipper/                 #   Chrome 扩展 + 本地服务
│   │   ├── extension/                    #     浏览器扩展（MV3）
│   │   ├── server/                       #     本地 HTTP 服务（零依赖）
│   │   └── __tests__/                    #     32 个测试
│   ├── skill/                            #   WorkBuddy AI 技能
│   │   ├── SKILL.md                      #     技能定义
│   │   └── docs/workflow.md              #     工作流程说明
│   ├── docs/                             #   设计文档与 TDD 计划
│   └── README.md                         #   clipper 功能总览
│
├── src/                                  # 📄 知识库网站
│   ├── app/                              #   Next.js 页面和 API
│   ├── components/                       #   通用 UI 组件
│   └── lib/                              #   文章数据、搜索、分类逻辑
│
├── scripts/                              # 🔧 数据管道
│   ├── generate-data.mjs                 #   Obsidian → JSON
│   └── watch.js                          #   开发文件监听
│
├── .github/workflows/                    # 🤖 CI/CD
│   └── deploy.yml                        #   GitHub Actions 自动部署
│
├── ecosystem.config.js                   # PM2 配置
├── vitest.config.ts                      # 测试配置
└── (package.json 等)                     # 项目依赖与脚本
```

---

## 四、快速开始

### 运行网站

```bash
# 安装依赖
npm install

# 本地开发（数据生成 + 热重载）
npm run dev

# 本地构建
npm run build

# 启动生产服务
npm start
```

### 本地部署

```bash
npm run deploy
# → 构建 → rsync → SSH → PM2 重启
```

### 运行测试

```bash
# 网站测试
npm test

# 本地服务测试
cd clipper/obsidian-clipper/server
npm test
```

### 笔记格式

每篇 Markdown 笔记保存在 `~/Documents/obsidian/AI知识库/` 目录：

```markdown
---
title: 文章标题（可选）
date: 2026-06-30（可选）
tags: [daily-save, web-clip]（可选）
source: https://...（可选）
---

# 文章标题

## 摘要
<AI 生成的 2-3 句摘要>

## 主要内容
<结构化要点>

## 原文关键段落
<摘录>
```

---

## 五、生产环境

| 配置 | 值 |
|------|-----|
| 网站域名 | kb.ccbot.chat |
| 服务器端口 | 8000 |
| 进程管理 | PM2（服务名：ai-knowledge） |
| 反代 | Nginx（堡塔面板） |
| 部署路径 | `/www/wwwroot/kb.ccbot.chat/` |
| CI/CD | GitHub Actions |

### PM2 管理

```bash
pm2 list                          # 查看进程
pm2 logs ai-knowledge             # 查看日志
pm2 restart ai-knowledge          # 重启
pm2 startup                       # 开机自启
```

---

## 六、类别一览

| 目录 | 说明 | 技术栈 |
|------|------|--------|
| `clipper/obsidian-clipper/extension/` | Chrome 浏览器扩展（MV3） | Readability, Turndown, LLM API |
| `clipper/obsidian-clipper/server/` | 本地 HTTP 保存服务 | Node.js 原生模块（零依赖） |
| `clipper/skill/` | WorkBuddy AI 对话技能 | WebFetch + AI 总结 + git |
| `src/` | Next.js 知识库网站 | Next.js 14, React 18, Tailwind CSS |
| `scripts/` | 数据管道脚本 | Node.js (gray-matter, chokidar) |
| `.github/workflows/` | CI/CD 自动化 | GitHub Actions |

---

## 七、相关文档

| 文档 | 位置 | 说明 |
|------|------|------|
| README（本文件） | 根目录 | 项目总览与工具使用流程 |
| `clipper/README.md` | `clipper/` | clipper 模块详细功能说明 |
| `clipper/skill/docs/workflow.md` | `clipper/skill/` | AI 技能 5 步工作流程 |
| 设计文档 | `clipper/docs/superpowers/specs/` | 完整设计规格、架构图、数据流 |
| 实现计划 | `clipper/docs/superpowers/plans/` | 12 步 TDD 实现计划 |
| 决策纪要 | `clipper/.workbuddy/memory/` | 架构决策与 Code Review 记录 |
