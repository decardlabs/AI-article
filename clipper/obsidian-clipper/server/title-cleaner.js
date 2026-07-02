// server/title-cleaner.js
const SITE_PATTERNS = [
  /[\s\-—·]+(知乎|微信公众号|简书|掘金|CSDN|博客园|腾讯云|InfoQ|GitHub|B站|bilibili|36氪|虎嗅|少数派|思否|segmentfault|v2ex|sspai|zhihu|jianshu|juejin)\s*$/i
]

export function cleanTitle(rawTitle) {
  if (!rawTitle) return ''
  let cleaned = rawTitle.trim()
  for (const p of SITE_PATTERNS) {
    cleaned = cleaned.replace(p, '')
  }
  return cleaned
}
