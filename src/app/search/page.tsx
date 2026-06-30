'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'

interface SearchResult {
  slug: string
  title: string
  summary: string
  category: string
  date: string
}

function SearchResults() {
  const searchParams = useSearchParams()
  const query = searchParams.get('q') || ''
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!query.trim()) {
      setResults([])
      setLoading(false)
      return
    }

    setLoading(true)
    fetch(`/api/search?q=${encodeURIComponent(query.trim())}`)
      .then(r => r.json())
      .then(data => {
        setResults(data.results || [])
        setLoading(false)
      })
      .catch(() => {
        setResults([])
        setLoading(false)
      })
  }, [query])

  return (
    <div>
      <h1 className="text-2xl font-bold text-text-primary mb-2">
        搜索结果
      </h1>
      <p className="text-sm text-text-secondary mb-8">
        查询：<span className="text-text-primary font-medium">{query}</span>
        {!loading && <span> · 共 {results.length} 条结果</span>}
      </p>

      {loading && (
        <p className="text-text-tertiary text-sm">搜索中...</p>
      )}

      {!loading && results.length === 0 && (
        <p className="text-text-tertiary text-sm">没有找到相关文章</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {results.map(result => {
          // Resolve the category info from the category field name
          const catIcon: Record<string, string> = {
            'AI 编程工程方法论': '⚡',
            'AI 设计体系': '🎨',
            'RAG / 知识库': '🧠',
            '端侧 AI / 嵌入式': '🤖',
            '模型 / 技术前沿': '🔬',
            '开源工具': '🛠',
            '宏观 / 商业': '📊',
          }
          const icon = catIcon[result.category] || '📄'

          return (
            <Link
              key={result.slug}
              href={`/article/${encodeURIComponent(result.slug)}`}
              className="block p-5 bg-surface border border-border rounded-lg hover:bg-surface-hover transition-all hover:-translate-y-0.5 no-underline"
            >
              <div className="mb-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-[4px] bg-tag-bg text-tag-text">
                  {icon} {result.category}
                </span>
              </div>
              <h3 className="text-lg font-medium text-text-primary line-clamp-2 mb-2 leading-7">
                {result.title}
              </h3>
              <p className="text-sm text-text-secondary line-clamp-2 leading-5 mb-3">
                {result.summary}
              </p>
              <span className="text-xs text-text-tertiary">{result.date}</span>
            </Link>
          )
        })}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div>
        <h1 className="text-2xl font-bold text-text-primary mb-2">搜索结果</h1>
        <p className="text-text-tertiary text-sm">加载中...</p>
      </div>
    }>
      <SearchResults />
    </Suspense>
  )
}
