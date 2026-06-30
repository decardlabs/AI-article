import Link from 'next/link'
import { Article } from '@/lib/types'
import CategoryTag from './CategoryTag'

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <Link
      href={`/article/${encodeURIComponent(article.slug)}`}
      className="block p-5 bg-surface border border-border rounded-lg hover:bg-surface-hover transition-all hover:-translate-y-0.5 no-underline"
    >
      <div className="mb-2">
        <CategoryTag categorySlug={article.categorySlug} />
      </div>
      <h3 className="text-lg font-medium text-text-primary line-clamp-2 mb-2 leading-7">
        {article.title}
      </h3>
      <p className="text-sm text-text-secondary line-clamp-2 leading-5 mb-3">
        {article.summary}
      </p>
      <span className="text-xs text-text-tertiary">{article.date}</span>
    </Link>
  )
}
