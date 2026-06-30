import MiniSearch from 'minisearch'
import { Article, SearchIndex } from './types'

let miniSearch: MiniSearch<SearchIndex> | null = null

export function buildSearchIndex(articles: Article[]): MiniSearch<SearchIndex> {
  const ms = new MiniSearch<SearchIndex>({
    fields: ['title', 'summary', 'category'],
    storeFields: ['title', 'summary', 'category', 'date'],
    searchOptions: {
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
