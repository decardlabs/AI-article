import { getLatestArticles } from '@/lib/articles'
import ArticleCard from '@/components/ArticleCard'

export const dynamic = 'force-dynamic'

export default function LatestPage() {
  const articles = getLatestArticles(5)
  const today = new Date().toISOString().slice(0, 10)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          🆕 最新发布
        </h1>
        <p className="text-sm text-text-secondary">
          {today} · {articles.length} 篇
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map(article => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>

      {articles.length === 0 && (
        <p className="text-text-tertiary text-sm">今天暂无新文章</p>
      )}
    </div>
  )
}
