import { describe, it, expect } from 'vitest'
import { getLatestArticles, getAllArticles } from '@/lib/articles'

describe('getLatestArticles', () => {
  it('returns at most the requested number of articles', () => {
    const articles = getLatestArticles(5)
    expect(articles.length).toBeLessThanOrEqual(5)
  })

  it('returns only articles from today', () => {
    const today = new Date().toISOString().slice(0, 10)
    const articles = getLatestArticles(10)
    for (const article of articles) {
      expect(article.date).toBe(today)
    }
  })

  it('returns fewer than requested if not enough match', () => {
    const allArticles = getAllArticles()
    const today = new Date().toISOString().slice(0, 10)
    const todayCount = allArticles.filter(a => a.date === today).length
    const desiredCount = todayCount + 10
    const articles = getLatestArticles(desiredCount)
    expect(articles.length).toBe(todayCount)
  })

  it('returns empty array when count is 0', () => {
    const articles = getLatestArticles(0)
    expect(articles).toEqual([])
  })
})
