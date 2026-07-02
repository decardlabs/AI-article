// server/__tests__/title-cleaner.test.js
import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { cleanTitle } from '../title-cleaner.js'

describe('cleanTitle', () => {
  it('removes trailing - 知乎', () => {
    assert.equal(cleanTitle('AI编程渐进式路径 - 知乎'), 'AI编程渐进式路径')
  })
  it('removes trailing - 微信公众号', () => {
    assert.equal(cleanTitle('指南 - 微信公众号'), '指南')
  })
  it('removes trailing - 简书', () => {
    assert.equal(cleanTitle('10个工具 - 简书'), '10个工具')
  })
  it('removes trailing - 掘金', () => {
    assert.equal(cleanTitle('RAG实战 - 掘金'), 'RAG实战')
  })
  it('removes trailing — CSDN', () => {
    assert.equal(cleanTitle('配置指南 — CSDN'), '配置指南')
  })
  it('removes trailing · 知乎', () => {
    assert.equal(cleanTitle('深入React · 知乎'), '深入React')
  })
  it('leaves title without site suffix alone', () => {
    assert.equal(cleanTitle('普通文章标题'), '普通文章标题')
  })
  it('removes English site suffixes', () => {
    assert.equal(cleanTitle('Getting Started - GitHub'), 'Getting Started')
  })
  it('handles empty string', () => {
    assert.equal(cleanTitle(''), '')
  })
})
