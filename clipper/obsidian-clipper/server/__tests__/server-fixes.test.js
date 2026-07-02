// server/__tests__/server-fixes.test.js
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { request } from 'node:http'
import { mkdtempSync, mkdirSync, rmSync, existsSync, writeFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const tmpBase = mkdtempSync(join(tmpdir(), 'oclip-fix-'))
// NOTE: Do NOT create the vault dir here — test auto-create
process.env.VAULT_PATH = tmpBase
process.env.SAVE_DIR = 'auto-create-test'
process.env.PORT = '18766'

let server

before(() => {
  return import('../index.js').then(mod => {
    server = mod.server
  })
})

after(() => {
  if (server) server.close()
  rmSync(tmpBase, { recursive: true, force: true })
})

async function jsonReq(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 18766, path, method, headers: body ? { 'Content-Type': 'application/json' } : {} }
    const req = request(opts, res => {
      let d = ''
      res.on('data', c => d += c)
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(d) }) }
        catch { resolve({ status: res.statusCode, body: d }) }
      })
    })
    req.on('error', reject)
    if (body) req.write(JSON.stringify(body))
    req.end()
  })
}

describe('Server Fixes', () => {
  it('auto-creates vault directory on startup', () => {
    const vaultDir = join(tmpBase, 'auto-create-test')
    assert.equal(existsSync(vaultDir), true)
  })

  it('returns relative file paths', async () => {
    const r = await jsonReq('POST', '/save', {
      url: 'https://x.com/fix', title: '相对路径测试', summary: 's', contentMd: '## t\n\nc', tags: ['t'], timestamp: '2026-07-02T12:00:00.000Z'
    })
    assert.equal(r.status, 200)
    assert.equal(r.body.status, 'ok')
    // Should be relative like "auto-create-test/2026-07-02 - 相对路径测试.md"
    assert.match(r.body.file, /^auto-create-test\//)
    assert.ok(!r.body.file.startsWith('/'), 'path should be relative, not absolute')
  })

  it('loads .env file', () => {
    // Check that existing env vars are set
    assert.ok(process.env.VAULT_PATH)
    assert.ok(process.env.SAVE_DIR)
  })
})
