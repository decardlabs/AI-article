import { NextResponse } from 'next/server'
import { getLatestArticles } from '@/lib/articles'

export async function GET() {
  const articles = getLatestArticles(5)
  return NextResponse.json({ count: articles.length })
}
