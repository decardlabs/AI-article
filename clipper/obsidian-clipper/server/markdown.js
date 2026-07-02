// server/markdown.js
import { cleanTitle } from './title-cleaner.js'

export function buildMarkdown(params) {
  const { url, date, title, summary, mainContent, keyParagraphs, tags } = params
  const cleaned = cleanTitle(title)

  const frontmatter = [
    '---',
    `source: ${url}`,
    `date: ${date}`,
    `tags: [${tags.join(', ')}]`,
    '---',
    ''
  ].join('\n')

  const body = [
    `# ${cleaned}`,
    '',
    `> 原文链接：${url}`,
    '',
    '## 摘要',
    '',
    summary || '',
    '',
    '## 主要内容',
    '',
    mainContent || '',
    '',
    '## 原文关键段落',
    '',
    keyParagraphs || '',
    ''
  ].join('\n')

  return frontmatter + body
}

export function dateFromTimestamp(ts) {
  return ts ? ts.slice(0, 10) : ''
}
