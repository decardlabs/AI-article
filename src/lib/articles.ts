import { Article } from './types'
import { CATEGORIES } from './categories'
import articlesData from './articles-data.json'

export function getAllArticles(): Article[] {
  return articlesData as Article[]
}

export function getArticleBySlug(slug: string): Article | null {
  const articles = getAllArticles()
  return articles.find(a => a.slug === slug) || null
}

export function getArticlesByCategory(categorySlug: string): Article[] {
  const articles = getAllArticles()
  return articles.filter(a => a.categorySlug === categorySlug)
}

export function getLatestArticles(count: number): Article[] {
  const articles = getAllArticles()
  const today = new Date().toISOString().slice(0, 10)
  return articles
    .filter(a => a.date === today)
    .slice(0, count)
}

export function getCategoriesWithCounts() {
  const articles = getAllArticles()
  return CATEGORIES.map(cat => ({
    ...cat,
    count: articles.filter(a => a.categorySlug === cat.slug).length,
  })).filter(cat => cat.count > 0)
}
