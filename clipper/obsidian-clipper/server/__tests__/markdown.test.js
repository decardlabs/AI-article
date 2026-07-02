// server/__tests__/markdown.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildMarkdown } from '../markdown.js'

describe('buildMarkdown', () => {
  const base = {
    url: 'https://example.com/a',
    date: '2026-07-01',
    title: '测试文章',
    summary: '这是一篇测试摘要。',
    mainContent: '- 要点一：某件事\n- 要点二：另一件事',
    keyParagraphs: '这是最重要的一段原文内容。',
    tags: ['daily-save', 'web-clip'],
    timestamp: '2026-07-01T09:00:00.000Z'
  }

  it('builds frontmatter with required fields', () => {
    const r = buildMarkdown(base)
    assert.match(r, /^---\nsource: https:\/\/example\.com\/a\n/)
    assert.match(r, /date: 2026-07-01/)
    assert.match(r, /tags: \[daily-save, web-clip\]/)
  })

  it('does NOT include author/platform/pubTime in frontmatter', () => {
    const r = buildMarkdown({ ...base, author: '张三', platform: '知乎', pubTime: '2026-06-30' })
    assert.doesNotMatch(r, /^author:/m)
    assert.doesNotMatch(r, /^platform:/m)
    assert.doesNotMatch(r, /^pubTime:/m)
  })

  it('does NOT include author/platform/pubTime in quote block', () => {
    const r = buildMarkdown({ ...base, author: '张三', platform: '知乎', pubTime: '2026-06-30' })
    assert.doesNotMatch(r, /作者：/)
    assert.doesNotMatch(r, /平台：/)
    assert.doesNotMatch(r, /发布时间：/)
  })

  it('builds h1 title', () => {
    assert.match(buildMarkdown(base), /\n# 测试文章\n/)
  })

  it('has quote block with original link only', () => {
    const r = buildMarkdown(base)
    assert.match(r, /> 原文链接：/)
    assert.doesNotMatch(r, /> 作者：/)
  })

  it('has ## 摘要 section', () => {
    assert.match(buildMarkdown(base), /## 摘要\n\n这是一篇测试摘要。/)
  })

  it('has ## 主要内容 section', () => {
    const r = buildMarkdown(base)
    assert.match(r, /## 主要内容\n\n- 要点一/)
    assert.match(r, /- 要点二/)
  })

  it('has ## 原文关键段落 section', () => {
    assert.match(buildMarkdown(base), /## 原文关键段落\n\n这是最重要的一段原文内容/)
  })

  it('handles empty mainContent gracefully', () => {
    const r = buildMarkdown({ ...base, mainContent: '' })
    assert.match(r, /## 主要内容\n\n\n\n## 原文关键段落/)
  })

  it('handles empty keyParagraphs gracefully', () => {
    const r = buildMarkdown({ ...base, keyParagraphs: '' })
    assert.match(r, /## 原文关键段落\n\n+\n*$/)
  })

  it('removes no `---` divider inside body', () => {
    const r = buildMarkdown(base)
    const lines = r.split('\n')
    const sepIndices = lines.map((l, i) => l === '---' ? i : -1).filter(i => i >= 0)
    // Only 2 `---` lines: frontmatter open and close
    assert.equal(sepIndices.length, 2, 'should only have frontmatter delimiters')
  })
})
