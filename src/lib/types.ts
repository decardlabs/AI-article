export interface Article {
  slug: string
  title: string
  date: string
  summary: string
  content: string
  source: string
  tags: string[]
  category: string
  categorySlug: string
}

export interface Category {
  name: string
  slug: string
  count: number
  icon: string
}

export interface SearchIndex {
  slug: string
  title: string
  summary: string
  category: string
  date: string
}
