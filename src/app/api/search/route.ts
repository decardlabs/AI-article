import { NextRequest, NextResponse } from 'next/server'
import { getAllArticles } from '@/lib/articles'
import { buildSearchIndex } from '@/lib/search'

export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')
  if (!q || q.trim().length === 0) {
    return NextResponse.json({ results: [] })
  }

  const articles = getAllArticles()
  const ms = buildSearchIndex(articles)
  const results = ms.search(q.trim()).map(r => ({
    ...r,
    slug: r.id,
  }))

  return NextResponse.json({ results })
}
