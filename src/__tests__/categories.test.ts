import { describe, it, expect } from 'vitest'
import { CATEGORIES, getCategoryBySlug, classifyArticle } from '@/lib/categories'

describe('categories', () => {
  it('renames "未分类" to "其他未分类"', () => {
    const uncategorized = CATEGORIES.find(c => c.slug === 'uncategorized')
    expect(uncategorized).toBeDefined()
    expect(uncategorized!.name).toBe('其他未分类')
  })
})
