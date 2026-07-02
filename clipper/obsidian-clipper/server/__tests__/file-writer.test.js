// server/__tests__/file-writer.test.js
import { describe, it, before } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtempSync, mkdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import { resolveFilename, saveNote } from '../file-writer.js'

describe('resolveFilename', () => {
  it('base name when no collision', () => {
    assert.equal(
      resolveFilename('/v/kb', '2026-07-01', '文章', []),
      '/v/kb/2026-07-01 - 文章.md'
    )
  })
  it('adds -2 on exact match', () => {
    assert.equal(
      resolveFilename('/v/kb', '2026-07-01', '文章', ['/v/kb/2026-07-01 - 文章.md']),
      '/v/kb/2026-07-01 - 文章-2.md'
    )
  })
  it('adds -3 when -2 also exists', () => {
    assert.equal(
      resolveFilename('/v/kb', '2026-07-01', '文章', [
        '/v/kb/2026-07-01 - 文章.md',
        '/v/kb/2026-07-01 - 文章-2.md'
      ]),
      '/v/kb/2026-07-01 - 文章-3.md'
    )
  })
  it('different date is not collision', () => {
    assert.equal(
      resolveFilename('/v/kb', '2026-07-01', '文章', ['/v/kb/2026-06-30 - 文章.md']),
      '/v/kb/2026-07-01 - 文章.md'
    )
  })
})

describe('saveNote integration', () => {
  let tmp
  before(() => {
    tmp = mkdtempSync(join(tmpdir(), 'oclip-test-'))
    mkdirSync(join(tmp, 'kb'), { recursive: true })
  })

  it('writes file and returns path', async () => {
    const vaultDir = join(tmp, 'kb')
    const r = await saveNote({
      url: 'https://x.com',
      date: '2026-07-01',
      title: '集成测试',
      summary: '摘要',
      contentMd: '正文',
      tags: ['test'],
      timestamp: '2026-07-01T00:00:00.000Z'
    }, vaultDir)

    assert.equal(r.status, 'ok')
    assert.match(r.file, /^kb\/2026-07-01 - 集成测试\.md$/)
    assert.match(readFileSync(join(tmp, r.file), 'utf-8'), /# 集成测试/)
  })

  it('creates -2 on duplicate', async () => {
    const vaultDir = join(tmp, 'kb')
    await saveNote({ url: 'https://x.com/1', date: '2026-07-01', title: '重复', summary: 'a', contentMd: 'b', tags: ['t'], timestamp: '2026-07-01T00:00:00.000Z' }, vaultDir)
    const r = await saveNote({ url: 'https://x.com/2', date: '2026-07-01', title: '重复', summary: 'c', contentMd: 'd', tags: ['t'], timestamp: '2026-07-01T00:00:00.000Z' }, vaultDir)
    assert.match(r.file, /^kb\/2026-07-01 - 重复-2\.md$/)
  })
})
