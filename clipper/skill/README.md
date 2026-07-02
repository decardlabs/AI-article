# Obsidian Clipper — Summarize URL Skill

> 版本: v0.2.0

WorkBuddy AI 技能 (Skill)，用于将任意 URL 的网页内容抓取、总结，生成结构化的 Markdown 笔记保存到 Obsidian，并自动推送到 GitHub 触发 CI/CD 部署到知识库网站。

## 功能

- 🔗 一键总结网页链接 → 结构化 Markdown 笔记
- 📝 自动提取标题、作者、发布时间
- 🧠 AI 生成摘要 + 结构化要点
- 💾 直接写入 Obsidian vault
- 🚀 git push → GitHub Actions → 自动部署网站

## 目录结构

```
skill/
├── SKILL.md          # WorkBuddy 技能定义（核心文件）
├── README.md         # 本说明文件
├── package.json      # 版本信息
└── docs/
    └── workflow.md   # 工作流程详细说明
```

## 使用方式

在 WorkBuddy 对话中：

```
总结一下：https://example.com/article
```

AI 自动执行：抓取 → 总结 → 保存到 Obsidian → 推送部署。

## 自定义

使用前需修改 `SKILL.md` 中的以下路径以匹配你的环境：

| 配置项 | 示例值 | 说明 |
|--------|--------|------|
| Obsidian vault 路径 | `/Users/xxx/Documents/obsidian/` | 你的 Obsidian 仓库根目录 |
| 项目路径 | `/path/to/your/project` | Next.js 知识库网站项目目录 |
| GitHub 仓库 | `github.com/user/repo.git` | 用于触发 CI/CD 的仓库 |

## 版本历史

- **v0.2.0** — 增加工作流程说明文档，完善部署流程
- **v0.1.0** — 初始版本，基础抓取+总结+保存+推送
