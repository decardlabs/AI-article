# Obsidian Web Clipper - Design Document

Date: 2026-07-01  
Status: Draft  
Version: 1.0

## 1. Overview

A Chrome Manifest V3 browser extension that clips web page content into Obsidian notes. It extracts readable content from the current page, generates an AI-powered summary, structures it into a standardized Markdown format matching the existing AI知识库 conventions, and writes it directly to the local Obsidian vault via a lightweight Node.js HTTP server.

### Goals

- One-click web clipping to Obsidian AI知识库
- AI-generated summaries using configurable LLM APIs
- Consistent Markdown format matching existing vault conventions
- Duplicate avoidance (date + title + increment suffix)
- Offline-usable (AI step requires network; basic clipping and saving works independently)

## 2. Architecture

### 2.1 System Diagram

```
Browser Extension (Chrome MV3)
├── content_script.js
│   - Injected into active tab
│   - Uses @mozilla/readability to extract clean HTML + metadata
│   - Sends extracted data to popup via chrome.runtime.sendMessage
│
├── popup.html + popup.js
│   - Main UI when user clicks extension icon
│   - Three states: LOADING / READY / SUCCESS
│   - Sends raw content to LLM API for summary (direct fetch from popup)
│   - Displays editable title, AI summary, tags, content preview
│   - On save: POSTs final payload to localhost:8765/save
│
├── options.html + options.js
│   - Settings page (right-click → Options)
│   - Configures: vault path, local server port, LLM provider/key/model, default tags
│   - Stores in chrome.storage.sync
│
└── service_worker.js
    - Listens for extension install/update events
    - Manages context menu registration
    - Handles runtime lifecycle

Local Server (Node.js) — localhost:8765
├── POST /save
│   Receives: { url, title, content_md, summary, tags, timestamp }
│   1. Generates filename: YYYY-MM-DD - {clean_title}.md
│   2. Checks for collision at vault path
│   3. Assembles final Markdown with frontmatter
│   4. Writes file to vault/{vault_path}/
│   5. Returns: { status: "ok"|"duplicate"|"error", file: "..." }
│
├── GET /health
│   Returns: { status: "ok" }
│   (Used by popup to check server availability before save)

Data Flow:
  [User clicks icon]
    → content_script extracts page
    → popup opens with LOADING state
    → popup calls LLM API for summary → transitions to READY state
    → User edits title/summary/tags → clicks Save
    → popup POSTs to localhost:8765/save
    → server writes .md file to vault/AI知识库/
    → popup shows SUCCESS state with filename
```

### 2.2 Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| Extension | Vanilla HTML/CSS/JS | No framework needed for ~3 screens |
| Content extraction | `@mozilla/readability` | Industry standard for article extraction |
| HTML→Markdown | `turndown` (runs in popup) | Converts readability output for preview |
| Local server | Node.js native `http` module | Zero dependencies, single file |
| LLM API | OpenAI-compatible `/v1/chat/completions` | DeepSeek, OpenAI, or custom endpoints |
| Storage | `chrome.storage.sync` | Settings persist across devices |
| File system | `fs.writeFileSync` on server side | Direct vault write, no Obsidian dependency |

## 3. UI/UX — Interaction Design

### 3.1 Popup States

The popup has exactly three states:

| State | Trigger | Visual |
|-------|---------|--------|
| LOADING | User clicks icon, content script sends data, popup fires LLM request | Spinner + "generating ai summary with {model}..." |
| READY | AI summary returned, or LLM call failed (manual mode) | Full form with editable fields |
| SUCCESS | File saved successfully | Green checkmark + filename for 2s, then auto-close |

**Error overlays** (shown as inline banners, not full-state changes):
- "Local service not running — start with `node server.js`" (if /health fails)
- "This page was already saved as xxx.md" (duplicate detected, with overwrite option)
- "AI summary failed — you can edit manually and save" (LLM timeout/error)

### 3.2 Popup Layout (READY state)

```
┌──────────────────────────────────────┐
│ ● obsidian clipper    │ mp.weixin.qq.com │  (header bar)
├──────────────────────────────────────┤
│ title                                 │  (label)
│ [AI编程渐进式路径：Rule → Spec → Loop → Harness]  │  (editable input, auto-cleaned)
│                                       │
│ ai summary                  [deepseek]│  (label + model badge)
│ ┌──────────────────────────────────┐ │
│ │ Editable textarea (80px height) │ │
│ │ ...                              │ │
│ └──────────────────────────────────┘ │
│ ↻ regenerate                          │  (inline action link)
│                                       │
│ tags                                  │  (label)
│ [daily-save] [web-clip] [+ add tag]  │  (chips + inline input)
│                                       │
│ ▸ content preview (842 words)         │  (collapsible details)
│ ┌──────────────────────────────────┐ │
│ │ Markdown preview (120px max-h)  │ │
│ └──────────────────────────────────┘ │
│                                       │
│           [cancel]  [save to obsidian]│  (action buttons)
└──────────────────────────────────────┘
```

**Popup dimensions:** 400px × auto (content-driven height, max 600px)

### 3.3 Settings Page Layout

```
┌──────────────────────────────────────┐
│ obsidian clipper - settings          │
├──────────────────────────────────────┤
│                                       │
│ 📁 obsidian vault path                │
│ [/Users/macairm5/Documents/obsidian/] │
│                  [browse] (future)    │
│                                       │
│ 📁 save directory                     │
│ [AI知识库/]                            │
│                                       │
│ local service port                    │
│ [8765]                                │
│                                       │
│ ─────────────────────────────────── │
│                                       │
│ [AI] llm configuration                │
│                                       │
│ provider          api base url        │
│ [deepseek ▾]      [https://api.d...]  │
│                                       │
│ api key                               │
│ [●●●●●●●●●●●●●●●●●●]                  │
│                                       │
│ model                                 │
│ [deepseek-chat]              [test]   │
│                                       │
 │ default tags                          │
│ [daily-save, web-clip]                │
│                                       │
│           [reset]  [save settings]    │
└──────────────────────────────────────┘
```

### 3.4 Duplicate Handling

When saving detects a name collision:

1. Server lists existing files in the vault directory matching `{date} - {title}*`
2. If no match → writes normally
3. If exact match found (`2026-07-01 - Title.md` exists) → appends `-2.md`, `-3.md` suffix (same as existing workflow convention)
4. Returns `{ status: "ok", file: "...-2.md" }` — popup shows subtle indicator "saved as -2 (duplicate title)"

No prompt to user — just auto-increment. This matches the existing workflow behavior documented.

## 4. Data Flow Detail

### 4.1 Full Save Sequence

```
1. User navigates to any webpage
2. content_script.js injected (via manifest host_permissions or activeTab)
3. User clicks extension icon
4. popup.html opens
5. popup.js sends message to content_script requesting page data
6. content_script runs Readability on document, returns { title, url, html, author, siteName }
7. popup.js:
   a. Checks chrome.storage.sync for LLM config
   b. If configured → call POST { model, messages } to LLM API endpoint with prompt:
        "Summarize the following article in 2-3 Chinese sentences:
         {extracted text}"
   c. Shows LOADING state during request
   d. On LLM response → populate summary field → transition to READY state
   e. On LLM error → empty summary field with note → transition to READY state
8. User edits title, summary, tags as needed
9. User clicks "save to obsidian"
10. popup.js:
    a. Checks GET /health on localhost:8765
    b. If health fails → show error banner "service not running"
    c. Converts readability HTML to Markdown via turndown (in-page)
    d. POST { url, title, content_md, summary, tags, timestamp } to localhost:8765/save
11. Server processes:
    a. Strip site suffixes from title (see 4.2)
    b. Format date from timestamp
    c. Check file existence for collision
    d. Assemble final Markdown (see 5.0)
    e. Write file
    f. Return response
12. popup.js shows SUCCESS state for 2s, then auto-closes
```

### 4.2 Title Cleanup Rules

Removes trailing site identifiers from auto-extracted title:

```
"AI Coding 渐进式路径 - 知乎"         → "AI Coding 渐进式路径"
"WorkBuddy 使用指南 - 微信公众号"      → "WorkBuddy 使用指南"
"10个开源工具 - 简书"                  → "10个开源工具"
"RAG 实战 - 掘金"                     → "RAG 实战"
```

Matching pattern: `/[\s\-—·]+(知乎|微信公众号|简书|掘金|CSDN|博客园|腾讯云|InfoQ|GitHub|B站|bilibili|36氪|虎嗅|少数派|思否|segmentfault|v2ex|sspai|zhihu|jianshu|juejin)\s*$/`

### 4.3 LLM Summary Prompt

System prompt sent to configured LLM:

```
你是一个内容摘要助手。请用2-3句中文概括以下文章的核心内容。
保持客观，只陈述文章中的事实，不添加评论。
输出格式：纯文本，不要markdown格式标记。
```

Temperature: 0.3 (factual, deterministic)

## 5. Output Markdown Format

The server generates the following Markdown:

```markdown
---
source: https://example.com/article
date: 2026-07-01
tags: [daily-save, web-clip, ai-coding]
author: 张三
platform: 知乎
---

# 文章标题（已清理）

> 原文链接：https://example.com/article
> 作者：张三｜发布时间：2026-06-30

## 摘要

AI 生成的 2-3 句核心摘要...

## 正文

从 Readability 提取内容经 turndown 转换后的完整 Markdown...
```

**Rules:**
- `author` field: only included if extractable from page metadata (meta tags, article:author, etc.)
- `platform` field: only included if identifiable from URL or og:site_name
- `tags`: `daily-save` + `web-clip` always present. Additional tags: user-edited from popup
- `date`: clipping date (today), not article publish date
- `## 摘要`: AI-generated summary, editable by user
- `## 正文`: full article content in Markdown, no truncation

### Filename

Format: `YYYY-MM-DD - {clean_title}.md`

Collisions resolved with `-2`, `-3` suffix: `2026-07-01 - 文章标题-2.md`

## 6. Component Specifications

### 6.1 manifest.json (Chrome MV3)

```json
{
  "manifest_version": 3,
  "name": "Obsidian Clipper",
  "version": "1.0.0",
  "description": "Clip web pages to Obsidian with AI summaries",
  "permissions": [
    "activeTab",
    "storage",
    "scripting"
  ],
  "host_permissions": [
    "http://localhost:8765/*",
    "https://api.deepseek.com/*",
    "https://api.openai.com/*"
  ],
  "action": {
    "default_popup": "popup.html",
    "default_title": "Clip to Obsidian"
  },
  "options_page": "options.html",
  "background": {
    "service_worker": "service_worker.js",
    "type": "module"
  }
}
```

### 6.2 Local Server API

**Endpoint: `POST /save`**

Request:
```json
{
  "url": "https://example.com/article",
  "title": "文章标题（已清理）",
  "content_md": "## 正文 Markdown...",
  "summary": "AI 生成的摘要文本",
  "tags": ["daily-save", "web-clip", "ai-coding"],
  "timestamp": "2026-07-01T09:00:00.000Z",
  "author": "张三",
  "platform": "知乎"
}
```

Response:
```json
{
  "status": "ok",
  "file": "AI知识库/2026-07-01 - 文章标题.md"
}
```

**Endpoint: `GET /health`**

Response:
```json
{
  "status": "ok"
}
```

### 6.3 Server Configuration

Server reads config from environment or a `.env` file in its working directory:

```
VAULT_PATH=/Users/macairm5/Documents/obsidian
SAVE_DIR=AI知识库
PORT=8765
```

## 7. Error Handling

| Scenario | Detection | User-facing behavior |
|----------|-----------|---------------------|
| Local server not running | `GET /health` fails (ECONNREFUSED) | Inline banner: "Local service not running. Run \`node server.js\` first." Save button disabled |
| LLM API timeout | fetch timeout > 15s | Summary field shows "[AI summary failed — edit manually]" + save still enabled |
| LLM API auth error | 401/403 response | Inline note: "API key invalid. Check settings." Fall back to manual summary |
| Network offline | navigator.onLine === false (LLM step only) | Skip LLM call, show summary as empty with note "offline — add summary manually" |
| File write permission | fs.writeFile throws EACCES | Response error → popup shows "Cannot write to vault path. Check folder permissions." |
| Name collision | File exists | Auto-increment suffix `-2`, `-3` (no prompt) |
| Non-article page | Readability returns null | Popup shows "No article content detected. Consider 'save full page' mode." |

### "Save Full Page" Fallback

When Readability returns null (non-article pages like docs, code repos):
- Popup shows a toggle: "Switch to full-page mode"
- In full-page mode: extension captures `document.body.innerText` instead and saves as plain text Markdown
- frontmatter still generated, content labeled as `[Full page capture — may include navigation/noise]`

## 8. Development Phases

### Phase 1: Server + Core Pipeline
- Node.js HTTP server (single file, zero deps)
- File writing, collision handling, Markdown assembly
- Hand-test with curl

### Phase 2: Extension Skeleton
- manifest.json, popup.html, content_script.js
- Readability extraction, turndown conversion
- Communication pipeline: popup ↔ content script ↔ server

### Phase 3: AI Summary
- LLM API integration in popup
- Settings page with full config
- Loading/success/error states

### Phase 4: Polish & Integration
- Title cleanup
- Tag autocomplete (from existing vault tags)
- Keyboard shortcuts (Cmd+Shift+S)
- Install script for local server (launchd plist)
- Context menu integration (right-click → Clip to Obsidian)

## 9. Future Considerations (Not in Scope)

- Save to subdirectories by domain/tag
- Batch clipping (queue multiple pages)
- Obsidian Local REST API as alternative transport
- Firefox / Edge support
- Cloud sync between multiple machines
- Image downloading (currently images keep original URLs)
