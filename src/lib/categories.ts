import { Category } from './types'

export const CATEGORIES: Category[] = [
  { name: 'AI 编程工程方法论', slug: 'ai-engineering', count: 0, icon: '⚡' },
  { name: 'AI 设计体系', slug: 'ai-design', count: 0, icon: '🎨' },
  { name: 'RAG / 知识库', slug: 'rag-knowledge', count: 0, icon: '🧠' },
  { name: '端侧 AI / 嵌入式', slug: 'edge-ai', count: 0, icon: '🤖' },
  { name: '模型 / 技术前沿', slug: 'models', count: 0, icon: '🔬' },
  { name: '开源工具', slug: 'open-source', count: 0, icon: '🛠' },
  { name: '宏观 / 商业', slug: 'business', count: 0, icon: '📊' },
  { name: '其他', slug: 'uncategorized', count: 0, icon: '📄' },
]

export function getCategory(name: string): Category | undefined {
  return CATEGORIES.find(c => c.name === name || c.slug === name)
}

export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find(c => c.slug === slug)
}

// 标题/内容关键词 → 分类 slug 映射
const KEYWORD_CATEGORY_MAP: [string[], string][] = [
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

export function classifyArticle(title: string, tags: string[], content: string): string {
  const text = `${title} ${tags.join(' ')} ${content.slice(0, 500)}`.toLowerCase()

  for (const [keywords, category] of KEYWORD_CATEGORY_MAP) {
    for (const kw of keywords) {
      if (text.includes(kw.toLowerCase())) return category
    }
  }

  return 'uncategorized'
}
