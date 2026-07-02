# 总结网址链接技能 — 工作流程说明

## 概述

这是一个"一键保存网页到知识库并自动发布"的自动化流水线。用户只需发一个链接，AI 自动完成抓取 → 总结 → 保存 → 推送 → 部署的全流程。

---

## 完整流程（5 步）

### ① 抓取网页内容

- **触发**：用户说「总结一下：https://...」
- **工具**：`WebFetch` 抓取目标 URL
- **提取内容**：标题、作者、发布时间、正文、核心段落
- **异常处理**：付费墙/登录墙/JS 渲染失败时，告知用户建议手动粘贴正文

### ② 生成结构化 Markdown

将网页内容整理为标准格式：

```markdown
---
source: <原始URL>
date: <YYYY-MM-DD>
tags: [daily-save, web-clip]
---

# <网页标题>

> 原文链接：<原始URL>

## 摘要
<AI 生成的 2-3 句核心摘要>

## 主要内容
<结构化要点，保留原文层次>

## 原文关键段落
<摘录 1-3 段最重要的原文>
```

**规则：**
- 标题去掉网站后缀（如 ` - 知乎`、` - 微信公众号`）
- 摘要由 AI 重新生成，不是简单截取开头
- 有明确作者/发布时间的填入 frontmatter

### ③ 写入 Obsidian

- **目标路径**：`<vault_path>/AI知识库/YYYY-MM-DD - 网站标题.md`
- **方式**：直接用 `Write` 工具写 `.md` 文件（不依赖 Obsidian 运行）
- **重名处理**：同一天同名文件自动加后缀 `-2.md`
- **优点**：Obsidian 会自动刷新识别新文件，无需额外操作

### ④ 推送到 GitHub → 自动编译部署

写入完成后自动执行：

```bash
cd <project_dir>
node scripts/generate-data.mjs   # 重新扫描 Obsidian，生成 articles-data.json
git add src/lib/articles-data.json
git commit -m "feat: add article - <标题>"
git push                          # 触发 GitHub Actions
```

**GitHub Actions 自动流程：**

```
push → npm ci → next build → rsync 到服务器 → pm2 restart → 清 nginx 缓存
```

**关于分类**：`generate-data.mjs` 通过关键词匹配自动分类（匹配标题 + 标签 + 正文前 500 字），匹配规则见下方说明。

### ⑤ 反馈给用户

推送完成后告知：
- ✅ 文件保存位置
- ✅ 一句话摘要（确认内容是否准确）
- ✅ 已推送到 GitHub，网站约 2-3 分钟后自动更新

---

## 分类逻辑说明

分类由 `generate-data.mjs` 中的 `classifyArticle()` 函数决定：

```javascript
function classifyArticle(title, tags, content) {
  const text = `${title} ${tags} ${content}`.toLowerCase()
  for (const [keywords, category] of KEYWORD_CATEGORY_MAP) {
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) return category
    }
  }
  return 'uncategorized'
}
```

**匹配范围**：标题 + 标签 + 正文前 500 字符 → 全部转小写

**匹配规则**：按 `KEYWORD_CATEGORY_MAP` 顺序，**第一个命中即定分类**，后面不再检查。都没命中则归入"其他未分类"。

### 各分类关键词对照

| 分类 slug | 分类名 | 关键词示例 |
|-----------|--------|-----------|
| ai-engineering | 编程工程方法论 | superpowers, claude code, loop, tdd, spec, rule, plan, 代码审查... |
| ai-design | 设计体系 | design.md, figma, ardot, lovart, pomelli, AI 设计, 设计规范... |
| rag-knowledge | RAG / 知识库 | rag, 知识库, obsidian, 向量, embedding, 数字人问答... |
| edge-ai | 端侧 AI / 嵌入式 | esp32, 端侧, 嵌入式, 思必驰, 语音模型, tinyml... |
| models | 模型 / 技术前沿 | qwen, rwkv, 开源模型, 全模态, 流式音视频... |
| open-source | 开源工具 | 开源工具, github, 灵感熔炉, 蔓藤, awesome-cloudflare... |
| business | 宏观 / 商业 | 创始人, 创业, 微信, 小程序, 阿里产品经理... |
| uncategorized | 其他未分类 | 以上都匹配不到时兜底 |

---

## 核心链路图

```
用户发链接
    ↓
① WebFetch 抓取网页内容
    ↓
② AI 总结生成结构化 Markdown
    ↓
③ 写入 Obsidian（本地永久保存）
    ↓
④ generate-data.mjs 更新文章数据 → git push
    ↓
   GitHub Actions: npm ci → next build → rsync 到服务器 → pm2 restart
    ↓
⑤ 网站自动更新 ✅
```

---

## 注意事项

- URL 必须完整（含 `https://`），缺少则自动补全
- 网页内容过长（>50k tokens）时，截取核心部分再总结
- 遇到付费墙/登录墙，建议用户手动粘贴正文
- 图片不下载，保留原始链接
- 如果当前目录有未提交的改动，先用 `git stash` 再操作，完成后 `git stash pop` 恢复
- 如果 commit 失败（无变更），说明数据已是最新
- 如果 GitHub Actions 构建失败，需检查 GitHub 仓库的 Actions 页面

---

*本文档由 AI 自动生成，对应 WorkBuddy `summarize-url` 技能的工作流程说明。*
