// server/index.js
import { createServer } from 'node:http'
import { existsSync, mkdirSync, readFileSync } from 'node:fs'
import { saveNote } from './file-writer.js'

// Load .env file if present
if (existsSync('.env')) {
  const envContent = readFileSync('.env', 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eqIdx = trimmed.indexOf('=')
    if (eqIdx === -1) continue
    const key = trimmed.slice(0, eqIdx).trim()
    const val = trimmed.slice(eqIdx + 1).trim()
    // Don't override existing env vars
    if (!process.env[key]) {
      process.env[key] = val
    }
  }
}

const PORT = parseInt(process.env.PORT || '8765', 10)
const VAULT_PATH = process.env.VAULT_PATH || process.cwd()
const SAVE_DIR = process.env.SAVE_DIR || 'AI知识库'
const vaultDir = `${VAULT_PATH}/${SAVE_DIR}`

// Auto-create vault directory
if (!existsSync(vaultDir)) {
  mkdirSync(vaultDir, { recursive: true })
}

const server = createServer(async (req, res) => {
  const json = (code, data) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)) }

  if (req.method === 'GET' && req.url === '/health') return json(200, { status: 'ok' })

  if (req.method === 'POST' && req.url === '/save') {
    let body = ''
    req.on('error', () => json(400, { status: 'error', message: 'request aborted' }))
    req.on('data', c => body += c)
    req.on('end', async () => {
      try {
        const p = JSON.parse(body)
        if (!p.url || !p.title || !p.contentMd) return json(400, { status: 'error', message: 'missing required fields' })
        const r = await saveNote(p, vaultDir)
        json(200, r)
      } catch (e) {
        json(500, { status: 'error', message: e.message })
      }
    })
    return
  }

  json(404, { status: 'error', message: 'not found' })
})

server.on('error', err => { console.error('server error:', err.message); process.exit(1) })

server.listen(PORT, () => {
  console.log(`obsidian-clipper server running on http://localhost:${PORT}`)
})

process.on('SIGTERM', () => { server.close(); process.exit(0) })
process.on('SIGINT', () => { server.close(); process.exit(0) })

export { server }
