// extension/options/options.js
const DEFAULTS = {
  vaultPath: '/Users/macairm5/Documents/obsidian',
  saveDir: 'AI知识库',
  servicePort: '8765',
  provider: 'deepseek',
  apiBaseUrl: 'https://api.deepseek.com/v1',
  apiKey: '',
  model: 'deepseek-chat',
  defaultTags: 'daily-save, web-clip'
}

document.addEventListener('DOMContentLoaded', async () => {
  const data = await chrome.storage.sync.get(Object.keys(DEFAULTS))
  for (const [key, val] of Object.entries(DEFAULTS)) {
    const el = document.getElementById(key.replace(/[A-Z]/g, c => '-' + c.toLowerCase()))
    if (el) el.value = data[key] ?? val
  }

  // Provider presets
  document.getElementById('provider').addEventListener('change', e => {
    const presets = {
      deepseek: 'https://api.deepseek.com/v1',
      openai: 'https://api.openai.com/v1',
      custom: ''
    }
    document.getElementById('api-base-url').value = presets[e.target.value] || ''
  })

  document.getElementById('btn-save').addEventListener('click', async () => {
    const fields = {
      vaultPath: 'vault-path',
      saveDir: 'save-dir',
      servicePort: 'service-port',
      provider: 'provider',
      apiBaseUrl: 'api-base-url',
      apiKey: 'api-key',
      model: 'model',
      defaultTags: 'default-tags'
    }
    const toSave = {}
    for (const [key, id] of Object.entries(fields)) {
      toSave[key] = document.getElementById(id).value
    }
    await chrome.storage.sync.set(toSave)
    showStatus('设置已保存', 'success')
  })

  document.getElementById('btn-test').addEventListener('click', async () => {
    const baseUrl = (document.getElementById('api-base-url').value || 'https://api.deepseek.com/v1').replace(/\/+$/, '')
    const key = document.getElementById('api-key').value
    const model = document.getElementById('model').value || 'deepseek-chat'

    if (!key) return showStatus('请先输入 API Key', 'error')

    try {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model, messages: [{ role: 'user', content: 'Say "ok" in one word.' }], temperature: 0.1, max_tokens: 10 })
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      showStatus('连接成功', 'success')
    } catch (e) {
      showStatus('连接失败：' + e.message, 'error')
    }
  })

  document.getElementById('btn-reset').addEventListener('click', () => {
    for (const [key, val] of Object.entries(DEFAULTS)) {
      const el = document.getElementById(key.replace(/[A-Z]/g, c => '-' + c.toLowerCase()))
      if (el) el.value = val
    }
  })
})

function showStatus(msg, type) {
  const el = document.getElementById('status')
  el.textContent = msg
  el.className = type
}
