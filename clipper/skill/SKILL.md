---
name: summarize-url
description: Use when the user says "总结一下这个网址", "帮我保存这个链接", "把这个网页存到 Obsidian", or provides a URL and wants it clipped into Obsidian as a Markdown note. Target vault: /Users/macairm5/Documents/obsidian/, target folder: AI知识库/.
---

# 总结一下这个网址

将任意 URL 的网页内容抓取、总结，生成结构化的 Markdown 笔记，保存到 Obsidian 的 `AI知识库/` 目录。

## 触发词

- `总结一下这个网址 https://...`
- `帮我保存这个链接 https://...`
- `把这个网页存到 Obsidian https://...`
- 任何包含 URL + 保存到 Obsidian 意图的指令

## 工作流程

### 1. 抓取网页内容

用 `WebFetch` 工具抓取 URL，prompt 设为：
```
请提取这个网页的完整正文内容，包括标题、作者、发布时间、核心内容和关键段落。保留原文的结构层次。
```

如果 WebFetch 失败（JS 渲染页面、403 等），告知用户并建议手动粘贴正文。

### 2. 生成结构化 Markdown

用以下模板生成笔记内容：

```markdown
---
source: <原始URL>
date: <YYYY-MM-DD>
tags: [daily-save, web-clip]
---

# <网页标题>

> 原文链接：<原始URL>

## 摘要
<2-3 句核心内容摘要>

## 主要内容
<结构化要点，保留原文层次>

## 原文关键段落
<可选：摘录 1-3 段最重要的原文>
```

**规则：**
- 标题从网页 `<title>` 或正文 H1 提取，去掉网站后缀（如「 - 知乎」、「 - 微信公众号」）
- 摘要由 AI 生成，不是简单截取开头
- 如果网页有明确作者/发布时间，填入 frontmatter

### 3. 写入 Obsidian

**目标路径：** `/Users/macairm5/Documents/obsidian/AI知识库/YYYY-MM-DD - 网站标题.md`

**步骤：**
1. 如果 `/Users/macairm5/Documents/obsidian/AI知识库/` 不存在，先 `mkdir -p`
2. 检查同名文件是否已存在（同一天保存同一标题）
3. 如果已存在，文件名加后缀：`YYYY-MM-DD - 网站标题-2.md`
4. 用 `Write` 工具直接写入 `.md` 文件（Obsidian 会自动识别）

**为什么不用 obsidian-cli：** `obsidian-cli create` 依赖 Obsidian URI handler，需要 Obsidian 正在运行。直接写文件更可靠，Obsidian 会实时刷新。

### 4. 推送到 GitHub（触发自动编译部署）

写入完成后，执行以下操作将文章数据推送到 GitHub，GitHub Actions 会自动编译并部署到网站：

**项目路径：** `/Users/macairm5/WorkBuddy/2026-06-30-19-37-34/ai-knowledge-site`

**命令：**
```bash
cd /Users/macairm5/WorkBuddy/2026-06-30-19-37-34/ai-knowledge-site && \
  node scripts/generate-data.mjs && \
  git add src/lib/articles-data.json && \
  git commit -m "feat: add article - <标题>" && \
  git push
```

**说明：**
- `generate-data.mjs` 重新扫描 Obsidian 目录生成 `articles-data.json`
- 提交只包含数据文件（构建由 GitHub Actions 在服务器上完成）
- `git push` 触发 GitHub Actions workflow：

```
push → GitHub Actions → npm ci → next build → rsync 到服务器 → pm2 restart
```

**注意事项：**
- 如果当前目录有未提交的工作（如测试文件改动），先 `git stash` 再操作，推送完成后 `git stash pop` 恢复
- 如果 commit 失败（无变更），说明文章数据已在最新提交中，直接提示"数据已是最新"
- 如果 GitHub Actions 构建失败，提示用户检查 GitHub 仓库的 Actions 页面

### 5. 反馈给用户

推送完成后，告诉用户：
- 文件名
- 保存路径
- 一句话摘要（让用户确认内容是否符合预期）
- 已自动推送到 GitHub，网站将在 2-3 分钟后自动更新

## 注意事项

- URL 必须是完整的（含 `https://`），如果用户只给了域名或短链接，先补全再抓取
- 如果网页内容过长（>50k tokens），先截取核心部分再总结，不要直接丢给 LLM
- 遇到付费墙/登录墙，告知用户并建议手动粘贴正文
- 图片不下载，保留原始图片链接

## 示例

**用户输入：**
```
总结一下这个网址 https://mp.weixin.qq.com/s/abc123
```

**输出：**
```
已保存到：AI知识库/2026-06-30 - 文章标题.md

摘要：这篇文章讲了...
```
