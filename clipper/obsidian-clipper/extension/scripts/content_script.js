// extension/scripts/content_script.js
// Reads page content via Readability and responds to popup requests

(function () {
  function getMeta(name) {
    const el = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`)
    return el ? el.getAttribute('content') : ''
  }

  /** Strip non-content elements from HTML string */
  function stripNonContent(html) {
    // Remove <script>, <style>, <noscript>, <svg>, comments
    return html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<noscript[\s\S]*?<\/noscript>/gi, '')
      .replace(/<svg[\s\S]*?<\/svg>/gi, '')
      .replace(/<!--[\s\S]*?-->/g, '')
  }

  function extract() {
    const title = document.title || ''
    const url = window.location.href
    const author = getMeta('author') || getMeta('article:author')
    const pubTime = getMeta('article:published_time') || getMeta('date') || getMeta('pubdate')
    const siteName = getMeta('og:site_name')

    // Use Readability to parse article content
    let articleContent = ''
    let articleExcerpt = ''
    let isArticle = false

    try {
      const documentClone = document.cloneNode(true)
      const reader = new Readability(documentClone)
      const article = reader.parse()
      if (article && article.content) {
        articleContent = article.content
        articleExcerpt = article.excerpt || ''
        isArticle = true
      }
    } catch (e) {
      console.warn('Readability parse failed:', e)
    }

    // Fallback: if Readability couldn't extract, use raw HTML stripped of non-content elements
    const html = articleContent
      ? stripNonContent(articleContent)
      : stripNonContent(document.documentElement.outerHTML)

    return { title, url, html, author, pubTime, siteName, isArticle, excerpt: articleExcerpt }
  }

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'EXTRACT_PAGE') {
      sendResponse(extract())
    }
  })
})()
