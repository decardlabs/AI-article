# Obsidian Web Clipper

> 一键将网页剪藏到 Obsidian 知识库，自带 AI 摘要。

Chrome MV3 扩展 + Node.js 本地服务，从网页抓取内容 → AI 摘要 → Markdown → 保存到 Obsidian vault。

## 功能

- **智能内容提取** — 基于 Mozilla Readability，自动识别文章主体，剔除导航/广告/页脚
- **AI 摘要** — 可配置 DeepSeek/OpenAI 等 API，生成三段式结构化笔记：摘要 → 主要内容 → 原文关键段落
- **一键保存** — popup 预览、编辑标题/AI 摘要/标签后，直接写入 Obsidian vault
- **本地服务** — 零依赖 Node.js HTTP 服务，不依赖 Obsidian 插件即可写文件
- **站点兼容** — 自动清理 23+ 站点（知乎、微信公众号、CSDN 等）的标题后缀

## 输出格式

```markdown
---
source: https://example.com/article
date: 2026-07-02
tags: [daily-save, web-clip]
---

# 文章标题

> 原文链接：https://example.com/article

## 摘要
AI 生成的 2-3 句核心摘要

## 主要内容
结构化要点，保留原文层次

## 原文关键段落
摘录 1-3 段最重要的原文
```

## 快速开始

### 前置需求

- macOS / Linux / Windows
- Node.js 18+
- Chrome 浏览器
- Obsidian vault（任意路径）

### 安装

```bash
# 克隆仓库
git clone https://github.com/your-org/obsidian-clipper.git
cd obsidian-clipper

# 无需 npm install — 服务端零依赖，扩展库已 vendor
```

### 启动本地服务

```bash
# 设置 vault 路径并启动
VAULT_PATH=/path/to/your/obsidian-vault node server/index.js
```

服务运行在 `http://localhost:8765`。

### 加载扩展

1. 打开 Chrome，访问 `chrome://extensions/`
2. 开启「开发者模式」
3. 点击「加载已解压的扩展程序」
4. 选择 `extension/` 目录

### 配置 API Key

点击扩展图标 → 设置齿轮 → 填入：

- **API Key** — DeepSeek / OpenAI 等兼容 API
- **API Base URL** — 默认 `https://api.deepseek.com/v1`
- **模型** — 默认 `deepseek-chat`
- **默认标签** — 可自定义

## 项目结构

```
obsidian-clipper/
├── server/                    # 本地 HTTP 服务 (localhost:8765)
│   ├── index.js              # 入口，/health + /save 端点
│   ├── markdown.js           # Markdown 模板组装
│   ├── file-writer.js        # 文件写入 + 重名冲突处理
│   ├── title-cleaner.js      # 23+ 站点标题后缀清理
│   └── __tests__/            # 32 个单元测试
├── extension/                 # Chrome MV3 扩展
│   ├── manifest.json
│   ├── lib/                  # @mozilla/readability + turndown (vendored)
│   ├── popup/                # 三态 UI（加载中/就绪/成功）
│   ├── options/              # 设置页
│   └── scripts/              # content_script + service_worker
└── docs/
    └── superpowers/          # 设计文档与计划
```

## 技术栈

| 层 | 技术 |
|----|------|
| 扩展框架 | Chrome MV3, vanilla HTML/CSS/JS |
| 内容提取 | @mozilla/readability |
| HTML→Markdown | Turndown.js |
| AI 摘要 | OpenAI-compatible API (DeepSeek / OpenAI / 自定义) |
| 本地服务 | Node.js native `http` (zero npm deps) |
| 测试 | node:test + node:assert/strict |

## 开发

```bash
# 服务端测试（32 个测试）
cd server && node --test
```

测试覆盖：title-cleaner、markdown 模板、file-writer 碰撞处理、HTTP 端点、vault 目录自动创建。

## 许可

MIT
