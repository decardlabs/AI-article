// server/__tests__/server.test.js
import { describe, it, before, after } from 'node:test'
import assert from 'node:assert/strict'
import { request } from 'node:http'
import { mkdtempSync, mkdirSync, rmSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const tmp = mkdtempSync(join(tmpdir(), 'oclip-srv-'))
const vaultDir = join(tmp, 'kb')
mkdirSync(vaultDir, { recursive: true })

process.env.VAULT_PATH = tmp
process.env.SAVE_DIR = 'kb'
process.env.PORT = '18765'

let server

before(() => {
  return import('../index.js').then(mod => {
    server = mod.server
  })
})

after(() => {
  if (server) server.close()
  rmSync(tmp, { recursive: true, force: true })
})

async function jsonReq(method, path, body) {
  return new Promise((resolve, reject) => {
    const opts = { hostname: 'localhost', port: 18765, path, method, headers: body ? { 'Content-Type': 'application/json' } : {} }
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

describe('HTTP Server', () => {
  it('GET /health returns ok', async () => {
    const r = await jsonReq('GET', '/health')
    assert.equal(r.status, 200)
    assert.equal(r.body.status, 'ok')
  })

  it('POST /save creates file', async () => {
    const r = await jsonReq('POST', '/save', {
      url: 'https://x.com/t', title: '服务测试', summary: 's', contentMd: '## t\n\nc', tags: ['t'], timestamp: '2026-07-01T12:00:00.000Z'
    })
    assert.equal(r.status, 200)
    assert.equal(r.body.status, 'ok')
    assert.match(r.body.file, /kb\/2026-07-01 - 服务测试\.md$/)
  })

  it('POST /save empty body returns 400', async () => {
    const r = await jsonReq('POST', '/save', {})
    assert.equal(r.status, 400)
  })
})
