import { getArticleBySlug } from '@/lib/articles'
import { getCategoryBySlug } from '@/lib/categories'
import { notFound } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import Link from 'next/link'

// 服务器模式，文章按需渲染
export const dynamic = 'force-dynamic'

export default function ArticlePage({ params }: { params: { slug: string[] } }) {
  // 对于 catch-all [...slug]，params 不会自动 decode URL 编码，需要手动 decode
  const slug = decodeURIComponent(params.slug.join('/'))
  const article = getArticleBySlug(slug)
  if (!article) notFound()

  const category = getCategoryBySlug(article.categorySlug)

  return (
    <article className="max-w-[720px] mx-auto">
      {/* Header */}
      <header className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <Link
            href={`/category/${article.categorySlug}`}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-[4px] bg-tag-bg text-tag-text no-underline hover:bg-border"
          >
            {category?.icon} {category?.name || '未分类'}
          </Link>
          <span className="text-xs text-text-tertiary">{article.date}</span>
        </div>

        <h1 className="text-2xl font-bold text-text-primary leading-[34px] mb-2">
          {article.title}
        </h1>

        {article.source && (
          <a
            href={article.source}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-primary hover:underline inline-flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            原文链接
          </a>
        )}
      </header>

      {/* Article content */}
      <div className="prose-reading">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {article.content}
        </ReactMarkdown>
      </div>

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-border">
        <Link
          href="/"
          className="text-sm text-primary hover:underline inline-flex items-center gap-1"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          返回首页
        </Link>
      </footer>
    </article>
  )
}
