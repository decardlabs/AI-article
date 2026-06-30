const chokidar = require('chokidar')
const path = require('path')
const fs = require('fs')

const OBSIDIAN_DIR = '/Users/macairm5/Documents/obsidian/AI知识库'
const TRIGGER_FILE = path.join(__dirname, '..', '.watch-trigger')

console.log(`[watch] 🌐 Monitoring: ${OBSIDIAN_DIR}`)

chokidar.watch(OBSIDIAN_DIR, {
  ignoreInitial: true,
  awaitWriteFinish: {
    stabilityThreshold: 500,
    pollInterval: 100,
  },
}).on('all', (event, filePath) => {
  const fileName = path.basename(filePath)
  console.log(`[watch] ${event}: ${fileName}`)

  // Touch a trigger file to hint Next.js hot reload
  const now = Date.now().toString()
  fs.writeFileSync(TRIGGER_FILE, now)
})

console.log('[watch] ✅ Ready. Save a file in Obsidian to trigger reload.')

// Handle exit gracefully
process.on('SIGINT', () => {
  console.log('\n[watch] 👋 Stopping watcher')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.log('\n[watch] 👋 Stopping watcher')
  process.exit(0)
})
