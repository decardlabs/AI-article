import MiniSearch from 'minisearch'
import { Article, SearchIndex } from './types'

let miniSearch: MiniSearch<SearchIndex> | null = null

const CJK_RE = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/

/**
 * 中文分词器：CJK 字符用重叠二元组(bigram)，非 CJK 按空格/标点切分。
 * 例："AI 设计体系" → ["AI", "设计", "计体", "体系"]
 */
function tokenize(text: string): string[] {
  const tokens: string[] = []

  // 先按常见标点和空格分割，保留每个片段
  const parts = text.split(/[\s,.:;!?()\[\]{}"'/\\|`~@#$%^&*+=<>《》，。、；：？！【】（）「」""''—…·～]+/)
    .filter(p => p.length > 0)

  for (const part of parts) {
    if (CJK_RE.test(part)) {
      // CJK 文本：每个单字 + 重叠二元组
      for (let i = 0; i < part.length; i++) {
        tokens.push(part[i])          // unigram（单字）
        if (i < part.length - 1) {
          tokens.push(part[i] + part[i + 1])  // bigram（重叠二元组）
        }
      }
    } else {
      tokens.push(part)
    }
  }

  return tokens
}

export function buildSearchIndex(articles: Article[]): MiniSearch<SearchIndex> {
  const ms = new MiniSearch<SearchIndex>({
    fields: ['title', 'summary', 'category'],
    storeFields: ['title', 'summary', 'category', 'date'],
    idField: 'slug',
    tokenize,
    searchOptions: {
      tokenize,
      boost: { title: 3, summary: 2, category: 1 },
      fuzzy: 0.2,
    },
  })

  const docs: SearchIndex[] = articles.map(a => ({
    slug: a.slug,
    title: a.title,
    summary: a.summary,
    category: a.category,
    date: a.date,
  }))

  ms.addAll(docs)
  miniSearch = ms
  return ms
}

export function search(query: string): SearchIndex[] {
  if (!miniSearch) return []
  return miniSearch.search(query) as unknown as SearchIndex[]
}
