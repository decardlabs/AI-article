// server/file-writer.js
import { writeFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import { cleanTitle } from './title-cleaner.js'
import { buildMarkdown, dateFromTimestamp } from './markdown.js'

export function resolveFilename(vaultDir, date, title, existingFiles) {
  const clean = cleanTitle(title)
  const base = `${date} - ${clean}`
  let candidate = `${base}.md`
  let counter = 2
  while (existingFiles.some(f => f.endsWith('/' + candidate) || f === join(vaultDir, candidate))) {
    candidate = `${base}-${counter}.md`
    counter++
  }
  return join(vaultDir, candidate)
}

export async function saveNote(params, vaultDir) {
  const date = params.date || dateFromTimestamp(params.timestamp)
  const content = buildMarkdown({ ...params, date })
  let existing = []
  try {
    existing = (await readdir(vaultDir)).filter(f => f.endsWith('.md')).map(f => join(vaultDir, f))
  } catch {}
  const fp = resolveFilename(vaultDir, date, params.title, existing)
  await writeFile(fp, content, 'utf-8')
  const saveDir = vaultDir.split('/').pop()
  const relativeFile = `${saveDir}/${fp.split('/').pop()}`
  return { status: 'ok', file: relativeFile }
}
