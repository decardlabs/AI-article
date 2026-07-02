# obsidian-clipper 功能说明文档

> 生成日期：2026-07-02
>
> 本文档按子目录逐一说明每个模块的功能、职责和关键入口。

---

## 目录总览

```
obsidian-clipper/
├── obsidian-clipper/          # 🎯 主项目：Chrome 扩展 + 本地服务
│   ├── extension/             #   浏览器扩展（前端）
│   ├── server/                #   本地 HTTP 服务（后端）
│   ├── package.json           #   项目根脚本
│   └── README.md              #   项目使用指南
├── skill/                     # 🧠 WorkBuddy AI 技能
│   ├── SKILL.md               #   技能定义（核心）
│   ├── docs/workflow.md       #   工作流程说明
│   ├── README.md              #   技能使用指南
│   └── package.json           #   版本信息
├── docs/                      # 📐 设计文档与计划
│   └── superpowers/
│       ├── specs/             #   设计规格文档
│       └── plans/             #   TDD 实现计划
└── .workbuddy/                # ⚙️ 工作记录
    └── memory/                #   决策纪要与日志
```

---

## 1. `obsidian-clipper/extension/` — Chrome MV3 浏览器扩展

**职责**：用户在浏览器中点图标 → 提取当前页面内容 → AI 生成摘要 → 保存到 Obsidian

### 入口文件

| 文件 | 功能 |
|------|------|
| `manifest.json` | Chrome MV3 扩展清单，声明权限与资源 |

### 子目录

#### `scripts/` — 后台与内容脚本

| 文件 | 功能 |
|------|------|
| `content_script.js` | **注入当前页面**。使用 Mozilla Readability 智能提取文章正文、作者、发布时间；移除导航/广告等噪音；标记是否为文章页面 |
| `service_worker.js` | **后台守护进程**。安装时初始化默认配置（vault 路径、API Key、模型等），不覆盖用户已有设置 |

#### `popup/` — 弹窗 UI（三态交互）

| 文件 | 功能 |
|------|------|
| `popup.html` | **三态界面**：LOADING（加载中）/ READY（编辑预览）/ SUCCESS（保存成功） |
| `popup.css` | 弹窗样式，适配 Chrome 弹窗尺寸 |
| `popup.js` | **核心控制器**。点击图标 → 提取页面 → 调 LLM API 生成三段式摘要 → HTML 转 Markdown 预览 → POST 到本地服务保存 |

#### `options/` — 设置页面

| 文件 | 功能 |
|------|------|
| `options.html` | 配置界面：Obsidian 仓库路径、API Key、AI 模型、默认标签等 |
| `options.js` | 设置读写（chrome.storage.sync）、供应商切换自动填 Base URL、连接测试 |

#### `lib/` — 第三方库（vendored）

| 文件 | 功能 |
|------|------|
| `readability.js` | @mozilla/readability 完整库，用于文章正文智能提取 |
| `turndown.js` | Turndown.js v7.2.0，HTML 转 Markdown |

#### `icons/` — 扩展图标

| 文件 | 功能 |
|------|------|
| `icon16.png` / `icon48.png` / `icon128.png` | 浏览器工具栏图标（三级尺寸） |

### 📊 数据流

```
点击扩展图标
  → content_script.js 提取页面（Readability）
  → popup.js 调用 LLM API 生成摘要（15s 超时）
  → 用户预览编辑 → 点击保存
  → POST 到 localhost:8765/save
  → 本地服务写文件到 Obsidian vault
  → 弹窗显示 Success 并自动关闭
```

---

## 2. `obsidian-clipper/server/` — Node.js 本地 HTTP 服务

**职责**：接收扩展发送的剪藏数据，组装 Markdown，写入 Obsidian vault

**技术特点**：零 npm 依赖（仅使用 `http`、`fs`、`path` 原生模块）

### 文件列表

| 文件 | 功能 | 核心导出 |
|------|------|---------|
| `index.js` | **服务入口**。监听 8765 端口，提供 `GET /health` 和 `POST /save` 两个端点 | HTTP 服务器实例 |
| `markdown.js` | **Markdown 模板**。组装 frontmatter + 三段式正文（摘要/主要内容/关键段落） | `buildMarkdown()`, `dateFromTimestamp()` |
| `file-writer.js` | **文件写入**。处理重名冲突（自动加 -2/-3 后缀），返回相对路径 | `resolveFilename()`, `saveNote()` |
| `title-cleaner.js` | **标题清洗**。去除 23 个中文站点的标题后缀 | `cleanTitle()` |

### API 端点

| 路径 | 方法 | 说明 | 请求体 | 响应 |
|------|------|------|--------|------|
| `/health` | GET | 健康检查 | — | `{"status":"ok"}` |
| `/save` | POST | 保存剪藏 | `{ url, title, contentMd, tags?, author?, pubTime?, siteName? }` | `{"status":"ok","file":"AI知识库/..."}` |

### 测试（__tests__/ 目录）

| 测试文件 | 测试内容 | 用例数 |
|---------|---------|:------:|
| `server.test.js` | HTTP 端点 /health、/save、400 错误处理 | 3 |
| `server-fixes.test.js` | 自动创建 vault 目录、相对路径、.env 加载 | 3 |
| `markdown.test.js` | frontmatter 格式、各章节组装、空值处理 | 11 |
| `file-writer.test.js` | 文件名解析、重名碰撞（-2/-3）、跨天不冲突、集成写入 | 6 |
| `title-cleaner.test.js` | 23 个站点的标题后缀清理 | 9 |
| **总计** | | **32** |

---

## 3. `skill/` — WorkBuddy AI 技能（v0.2.0）

**职责**：在 WorkBuddy 对话中，通过一句话让 AI 自动完成"抓取网页 → 总结 → 保存到 Obsidian → 推送部署"的完整链路

### 文件列表

| 文件 | 功能 |
|------|------|
| `SKILL.md` | **技能定义（核心）**。定义触发词、工作流程、模板规则，WorkBuddy 据此执行自动化操作 |
| `README.md` | 技能说明文档：功能概述、使用方式、自定义指南、版本历史 |
| `package.json` | 版本信息：v0.2.0 |
| `docs/workflow.md` | 工作流程详细说明：5 步流程拆解、分类关键词对照表、核心链路图、注意事项 |

### 5 步工作流程

1. **WebFetch 抓取** — 提取标题、作者、发布时间、正文结构
2. **AI 总结** — 生成三段式 Markdown（摘要 + 主要内容 + 原文关键段落）
3. **写入 Obsidian** — 直接写 `.md` 文件到 `AI知识库/` 目录，同名自动去重
4. **推送 GitHub** — 运行 `generate-data.mjs` 更新文章数据 → git commit → git push → GitHub Actions 自动编译部署
5. **反馈用户** — 告知保存位置、摘要内容、部署状态

---

## 4. `docs/` — 设计文档与实现计划

**职责**：项目开发前的完整设计规格和 TDD 执行计划

### 文件列表

| 文件 | 说明 |
|------|------|
| `docs/superpowers/specs/2026-07-01-obsidian-web-clipper-design.md` | **完整设计文档**（408 行）。包含架构图、UI 三态设计、布局标注、数据流、错误处理矩阵、开发阶段规划 |
| `docs/superpowers/plans/2026-07-01-obsidian-web-clipper.md` | **TDD 实现计划**（1548 行）。12 个任务，每个包含测试代码 → 实现代码 → 验证命令 → git commit 消息，覆盖全程 |

### 设计要点

| 方面 | 决策 |
|------|------|
| 保存路径 | `AI知识库/` 根目录，扁平管理 |
| 命名规则 | `YYYY-MM-DD - 标题.md`，同名自动加 `-2`/`-3` |
| 集成方式 | Native HTTP 服务直接写文件，不依赖 Obsidian 插件 |
| 内容提取 | Readability.js + Turndown.js |
| AI 摘要 | 扩展内嵌 LLM API（DeepSeek/OpenAI），popup 直接调 |
| 标题清理 | 23 个站点统一正则列表 |

---

## 5. `.workbuddy/` — 工作记录

**职责**：记录项目开发过程中的决策、进度和日志

### 文件列表

| 文件 | 内容 |
|------|------|
| `.workbuddy/memory/MEMORY.md` | **项目纪要**。核心架构决策、技术选型理由、已知剩余工作 |
| `.workbuddy/memory/2026-07-01.md` | **Day 1 日志**。设计讨论、关键决策链路 |
| `.workbuddy/memory/2026-07-02.md` | **Day 2 日志**。Code Review 修复记录（2 个 Critical + 5 个 Important 修复） |

---

## 总数据流图（端到端）

### 路径 A：浏览器扩展

```
用户浏览网页 → 点击扩展图标
    ↓
[Chrome 扩展] content_script.js（Readability 提取正文）
    ↓
popup.js → LLM API（生成三段式 AI 摘要）
    ↓
用户预览/编辑 → 点击"保存到 Obsidian"
    ↓   POST localhost:8765/save
[Node.js 服务] index.js → file-writer.js → markdown.js → title-cleaner.js
    ↓
文件写入: /AI知识库/YYYY-MM-DD - 标题.md
    ↓
Obsidian 自动刷新显示新笔记 ✅
```

### 路径 B：AI 对话技能

```
用户在 WorkBuddy 对话中 → "总结一下：https://..."
    ↓
[WorkBuddy AI] WebFetch 抓取 → AI 总结 → 生成 Markdown
    ↓
写入 Obsidian: /AI知识库/YYYY-MM-DD - 标题.md
    ↓
generate-data.mjs → git push → GitHub Actions
    ↓
知识库网站自动更新 ✅
```

---

## 技术栈汇总

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 浏览器扩展 | Chrome MV3 + 原生 HTML/CSS/JS | 无框架，轻量 |
| 内容提取 | @mozilla/readability | vendored 内嵌 |
| HTML→Markdown | Turndown.js v7.2.0 | vendored 内嵌 |
| AI 摘要 | OpenAI-compatible API | DeepSeek / OpenAI / 自定义端点 |
| 本地服务 | Node.js 原生 http 模块 | 零 npm 依赖 |
| 测试框架 | node:test + node:assert/strict | 32 测试用例 |
| AI 自动化 | WorkBuddy Skill | 对话式网页剪藏 |
| CI/CD | GitHub Actions | 自动编译部署知识库网站 |
