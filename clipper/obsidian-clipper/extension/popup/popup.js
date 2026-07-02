// extension/popup/popup.js
let pageData = null
let state = {}

document.addEventListener('DOMContentLoaded', init)

async function init() {
  showState('loading')
  setupEventHandlers()

  const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
  if (!tabs[0]?.id) return showError('没有活动的标签页')

  // Ensure content script is running
  let data
  try {
    data = await sendMessage(tabs[0].id, { type: 'EXTRACT_PAGE' })
  } catch {
    await chrome.scripting.executeScript({ target: { tabId: tabs[0].id }, files: ['scripts/content_script.js'] })
    data = await sendMessage(tabs[0].id, { type: 'EXTRACT_PAGE' })
  }

  if (!data) return showError('无法提取页面内容')
  pageData = data

  // Show non-article warning
  if (data.isArticle === false) {
    document.getElementById('article-warning').classList.remove('hidden')
  }

  document.getElementById('domain').textContent = new URL(data.url).hostname

  // Generate AI summary
  const config = await chrome.storage.sync.get(['apiKey', 'apiBaseUrl', 'model', 'defaultTags'])
  document.getElementById('model-badge').textContent = config.model || 'llm'

  if (config.apiKey) {
    try {
      const result = await generateSummary(data.html, config)
      document.getElementById('input-summary').value = result.summary || ''
      state.mainContent = result.mainContent || ''
      state.keyParagraphs = result.keyParagraphs || ''
    } catch {
      document.getElementById('input-summary').placeholder = 'AI 摘要生成失败 — 请手动编辑'
    }
  } else {
    document.getElementById('input-summary').placeholder = '请先在设置中配置 API Key'
  }

  // Populate form
  let title = data.title || ''
  // Basic title cleanup in popup as well
  title = title.replace(/[\s\-—·]+(知乎|微信公众号|简书|掘金|CSDN|博客园|腾讯云|InfoQ|GitHub|B站|bilibili|36氪|虎嗅|少数派|思否|segmentfault|v2ex|sspai|zhihu|jianshu|juejin)\s*$/i, '')
  document.getElementById('input-title').value = title

  // Default tags
  const defaultTags = (config.defaultTags || 'daily-save, web-clip').split(',').map(t => t.trim()).filter(Boolean)
  renderTags(defaultTags)

  // Content preview
  const turndown = new TurndownService({ headingStyle: 'atx', codeBlockStyle: 'fenced' })
  const md = turndown.turndown(data.html)
  state.contentMd = md
  document.getElementById('preview-content').textContent = md
  document.getElementById('word-count').textContent = md.split(/\s+/).length

  showState('ready')
}

function setupEventHandlers() {
  document.getElementById('btn-cancel').addEventListener('click', () => window.close())
  document.getElementById('btn-save').addEventListener('click', onSave)
  document.getElementById('btn-regenerate').addEventListener('click', onRegenerate)
  document.getElementById('input-tag').addEventListener('keydown', e => {
    if (e.key === 'Enter' && e.target.value.trim()) {
      addTag(e.target.value.trim())
      e.target.value = ''
    }
  })
}

async function onSave() {
  const btn = document.getElementById('btn-save')
  btn.disabled = true
  btn.textContent = '保存中...'

  try {
    // Check server health
    const healthy = await fetch('http://localhost:8765/health').then(r => r.json()).catch(() => null)
    if (!healthy || healthy.status !== 'ok') {
      showError('本地服务未运行，请先启动服务')
      btn.disabled = false
      btn.textContent = '保存到 Obsidian'
      return
    }

    const tags = getCurrentTags()
    const res = await fetch('http://localhost:8765/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: pageData.url,
        title: document.getElementById('input-title').value,
        contentMd: state.contentMd,
        summary: document.getElementById('input-summary').value,
        mainContent: state.mainContent || '',
        keyParagraphs: state.keyParagraphs || '',
        tags,
        author: pageData.author || '',
        pubTime: pageData.pubTime || '',
        platform: pageData.siteName || '',
        timestamp: new Date().toISOString()
      })
    })
    const result = await res.json()
    showSuccess(result.file)
  } catch (e) {
    showError('保存失败：' + e.message)
    btn.disabled = false
    btn.textContent = '保存到 Obsidian'
  }
}

async function onRegenerate() {
  const config = await chrome.storage.sync.get(['apiKey', 'apiBaseUrl', 'model'])
  if (!config.apiKey) return showError('未配置 API Key')
  document.getElementById('input-summary').value = '重新生成中...'
  try {
    const result = await generateSummary(pageData.html, config)
    document.getElementById('input-summary').value = result.summary || ''
    state.mainContent = result.mainContent || ''
    state.keyParagraphs = result.keyParagraphs || ''
  } catch {
    document.getElementById('input-summary').value = '重新生成失败'
  }
}

async function generateSummary(html, config) {
  // Extract text from HTML for LLM input
  const temp = document.createElement('div')
  temp.innerHTML = html
  // Strip script/style content from text to avoid LLM seeing garbage JS
  const scripts = temp.querySelectorAll('script, style, noscript, svg')
  scripts.forEach(el => el.remove())
  const text = temp.textContent.slice(0, 8000)  // Limit input length

  const baseUrl = (config.apiBaseUrl || 'https://api.deepseek.com/v1').replace(/\/+$/, '')
  const model = config.model || 'deepseek-chat'

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 15000)

  const res = await fetch(`${baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: `你是一个内容处理助手。请对以下文章进行分析，严格按照下面的结构输出三个部分：

## 摘要
用2-3句中文概括核心内容，只陈述事实，不添加评论。

## 主要内容
提取文章的结构化要点，保留原文的层次结构，用 markdown 列表或标题呈现。

## 原文关键段落
摘录1-3段最重要的原文段落，保持原文措辞不变。`
        },
        { role: 'user', content: text }
      ],
      temperature: 0.3
    }),
    signal: controller.signal
  })

  clearTimeout(timeout)

  if (!res.ok) throw new Error(`LLM API error: ${res.status}`)
  const data = await res.json()
  const raw = data.choices?.[0]?.message?.content || ''
  return parseStructuredOutput(raw)
}

function parseStructuredOutput(content) {
  const result = { summary: '', mainContent: '', keyParagraphs: '' }

  function extract(sectionName) {
    const regex = new RegExp(`##\\s*${sectionName}\\s*\\n([\\s\\S]*?)(?=\\n##\\s|\\n*$)`, 'i')
    const m = content.match(regex)
    return m ? m[1].trim() : ''
  }

  result.summary = extract('摘要')
  result.mainContent = extract('主要内容')
  result.keyParagraphs = extract('原文关键段落')

  return result
}

function getCurrentTags() {
  return Array.from(document.querySelectorAll('.tag-chip')).map(el => el.textContent)
}

function renderTags(tags) {
  const wrap = document.getElementById('tags-wrap')
  // Remove existing chips (keep the input)
  wrap.querySelectorAll('.tag-chip').forEach(el => el.remove())
  tags.forEach(t => addTag(t))
}

function addTag(name) {
  const wrap = document.getElementById('tags-wrap')
  const chip = document.createElement('div')
  chip.className = 'tag-chip'
  chip.textContent = name
  wrap.insertBefore(chip, document.getElementById('input-tag'))
}

function showSuccess(filename) {
  document.getElementById('saved-filename').textContent = filename || ''
  showState('success')
  setTimeout(() => window.close(), 2000)
}

function showState(s) {
  document.querySelectorAll('.state').forEach(el => el.classList.add('hidden'))
  const el = document.getElementById('state-' + s)
  if (el) el.classList.remove('hidden')
  document.getElementById('error-banner')?.classList.add('hidden')
}

function showError(msg) {
  const b = document.getElementById('error-banner')
  if (b) { b.textContent = msg; b.classList.remove('hidden') }
}

function sendMessage(tabId, msg) {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, msg, r => {
      if (chrome.runtime.lastError) reject(chrome.runtime.lastError)
      else resolve(r)
    })
  })
}
