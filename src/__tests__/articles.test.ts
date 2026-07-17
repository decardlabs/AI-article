import { describe, it, expect } from 'vitest'
import { getLatestArticles, getAllArticles } from '@/lib/articles'

describe('getLatestArticles', () => {
  it('returns at most the requested number of articles', () => {
    const articles = getLatestArticles(5)
    expect(articles.length).toBeLessThanOrEqual(5)
  })

  it('returns the most recent articles sorted by date descending', () => {
    const articles = getLatestArticles(9)
    for (let i = 1; i < articles.length; i++) {
      expect(articles[i - 1].date >= articles[i].date).toBe(true)
    }
  })

  it('returns the newest articles (matches a manual descending sort)', () => {
    const all = getAllArticles()
    const expected = [...all]
      .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
      .slice(0, 9)
    const actual = getLatestArticles(9)
    expect(actual.map(a => a.slug)).toEqual(expected.map(a => a.slug))
  })

  it('returns empty array when count is 0', () => {
    const articles = getLatestArticles(0)
    expect(articles).toEqual([])
  })
})
