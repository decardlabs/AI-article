/**
 * 构建前数据生成脚本
 * 读取 Obsidian AI 知识库的 Markdown 文件，生成 JSON 数据文件。
 * 这样运行时不需要读文件系统，数据直接通过 import 打包进服务端代码。
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OBSIDIAN_DIR = '/Users/macairm5/Documents/obsidian/AI知识库'
const OUTPUT = path.resolve(__dirname, '../src/lib/articles-data.json')

// 简单 frontmatter 解析（不依赖 gray-matter）
function parseFrontmatter(raw) {
  const data = {}
  let content = raw

  if (raw.startsWith('---')) {
    const end = raw.indexOf('---', 3)
    if (end !== -1) {
      const fm = raw.slice(3, end).trim()
      content = raw.slice(end + 3).trim()
      for (const line of fm.split('\n')) {
        const colon = line.indexOf(':')
        if (colon !== -1) {
          const key = line.slice(0, colon).trim()
          let val = line.slice(colon + 1).trim()
          // 处理数组 [tag1, tag2]（YAML 风格，元素可能无引号）
          if (val.startsWith('[') && val.endsWith(']')) {
            const items = val.slice(1, -1).split(',').map(s => s.trim()).filter(Boolean)
            val = items.map(s => {
              if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
                return s.slice(1, -1)
              }
              return s
            })
          }
          // 去除引号
          if (typeof val === 'string' && (val.startsWith('"') || val.startsWith("'"))) {
            val = val.slice(1, -1)
          }
          data[key] = val
        }
      }
    }
  }

  return { data, content }
}

// 分类关键词映射（与 categories.ts 保持一致）
const KEYWORD_CATEGORY_MAP = [
  [['superpowers', 'claude code', 'harness', 'sdd', 'spec', 'loop', 'coding',
    'claude.md', 'claude', 'codegraph', 'deerflow', 'cat wu', 'open code review',
    'open-spec', 'ai 编程', '工程方法论', 'rule', 'plan', 'subagent', 'tdd',
    'vibe coding', 'fde', '前沿部署', '代码审查', '代码审查工具'], 'ai-engineering'],

  [['design.md', 'design-md', 'design-skill', 'nothing-design', 'ui-ux-pro',
    'kami', 'stitch', 'pomelli', 'ardot', 'lovart', 'penpot', 'figma',
    'ai 设计', '设计体系', '设计规范', '设计系统', '设计神器', '设计转skill'], 'ai-design'],

  [['rag', '知识库', 'knowledge', 'obsidian', 'markitdown',
    'rag架构', '向量', 'embedding', 'rag智能客服', '数字人问答'], 'rag-knowledge'],

  [['esp32', 'esp-claw', 'esp-claw', 'tinyml', 'mcu', 'rtos', 'zephyr',
    '端侧', '嵌入式', '思必驰', 'gemini robotics', 'matter 协议',
    'ai mcu', '小智 esp32', 'tinyml', 'npu', '端侧模型', 'esp32-s3',
    'tinyML', 'ai mcu', '端侧智能', '语音模型'], 'edge-ai'],

  [['qwen', 'diffusiongemma', 'sensenova', 'minicpm', 'nvfp4', '量化',
    'rwkv', 'pixijs', 'ai 文明', 'ai 医生', 'voxcpm', 'confucius',
    '开源模型', 'miniCPM', '全模态', '图文交错', '流式音视频'], 'models'],

  [['pixelle', 'ai-website', 'plane ', 'daily_stock', 'moneyprinter',
    'aitoearn', '开源工具', 'we write', 'basjoo', 'code graph',
    'github 神级', '短视频创作', '灵感熔炉', 'redfox', 'svganimate',
    'awesome-cloudflare', 'hi-cad', '蔓藤', 'cdp bridge', 'we-sight',
    'garden-skills', 'ai-to-earn', 'claw code', 'claude code 效率', '开源'],
    'open-source'],

  [['anthropic', '创始人', '创业', 'pm', '产品', 'ai 时代', '赚钱', '变现',
    '自媒', '组织生命力', 'bart 模型',
    '普通人', '微信', '小程序', 'ai 创业',
    '阿里产品经理', 'ai 创造'], 'business'],
]

function classifyArticle(title, tags, content) {
  const text = `${title} ${(tags || []).join(' ')} ${(content || '').slice(0, 500)}`.toLowerCase()
  for (const [keywords, category] of KEYWORD_CATEGORY_MAP) {
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) return category
    }
  }
  return 'uncategorized'
}

// --- 主流程 ---
if (!fs.existsSync(OBSIDIAN_DIR)) {
  console.error(`[ERROR] Obsidian directory not found: ${OBSIDIAN_DIR}`)
  process.exit(1)
}

const files = fs.readdirSync(OBSIDIAN_DIR)
  .filter(f => f.endsWith('.md'))
  .sort()
  .reverse()

const articles = []

for (const file of files) {
  const raw = fs.readFileSync(path.join(OBSIDIAN_DIR, file), 'utf-8')
  const { data, content } = parseFrontmatter(raw)

  let title = data.title || ''
  if (!title) {
    const headingMatch = content.match(/^#\s+(.+)/m)
    title = headingMatch?.[1] || file.replace(/^\d{4}-\d{2}-\d{2}\s*-\s*/, '').replace(/\.md$/, '')
  }

  const slug = file.replace(/\.md$/, '')

  let summary = ''
  const summaryMatch = content.match(/## 摘要\s*\n\s*([\s\S]*?)(?=\n##|\n---|$)/)
  if (summaryMatch) {
    summary = summaryMatch[1].trim()
  } else {
    const paraMatch = content.match(/\n\n([^#\n][\s\S]*?)(?=\n\n|$)/)
    summary = paraMatch?.[1]?.slice(0, 200)?.trim() || ''
  }

  const tags = Array.isArray(data.tags) ? data.tags : []
  const category = classifyArticle(title, tags, content)
  const rawDate = data.date ? String(data.date).trim() : ''
  const dateStr = rawDate ? new Date(rawDate).toISOString().slice(0, 10) : file.slice(0, 10)
  // 如果解析出来的是无效日期，回退到文件名
  const cleanDate = dateStr && dateStr !== 'Invalid Date' ? dateStr : file.slice(0, 10)

  articles.push({
    slug,
    title,
    date: cleanDate,
    summary,
    content,
    source: data.source || '',
    tags,
    category,
    categorySlug: category,
  })
}

const output = JSON.stringify(articles, null, 2)
fs.writeFileSync(OUTPUT, output, 'utf-8')
console.log(`[OK] Generated ${articles.length} articles → ${OUTPUT}`)
