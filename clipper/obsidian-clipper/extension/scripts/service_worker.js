// extension/scripts/service_worker.js
// Minimal service worker — handles install/update events

chrome.runtime.onInstalled.addListener(() => {
  // Set default settings — fill in any missing fields individually
  chrome.storage.sync.get(null, existing => {
    const defaults = {
      vaultPath: '/Users/macairm5/Documents/obsidian',
      saveDir: 'AI知识库',
      servicePort: '8765',
      provider: 'deepseek',
      apiBaseUrl: 'https://api.deepseek.com/v1',
      apiKey: '',
      model: 'deepseek-chat',
      defaultTags: 'daily-save, web-clip'
    }
    const toSet = {}
    for (const [key, val] of Object.entries(defaults)) {
      if (existing[key] === undefined) toSet[key] = val
    }
    if (Object.keys(toSet).length > 0) {
      chrome.storage.sync.set(toSet)
    }
  })
})
