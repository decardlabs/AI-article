import { getAllArticles, getCategoriesWithCounts } from '@/lib/articles'
import ArticleCard from '@/components/ArticleCard'
import Link from 'next/link'

export default function HomePage() {
  const articles = getAllArticles()
  const categories = getCategoriesWithCounts()
  const recentArticles = articles.slice(0, 30)

  return (
    <div>
      {/* Hero */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-2">AI 知识库</h1>
        <p className="text-text-secondary text-sm">
          共 {articles.length} 篇文章 · {categories.length} 个分类 · 每日自动更新
        </p>
      </div>

      {/* Category grid */}
      <section className="mb-10">
        <h2 className="text-xl font-semibold text-text-primary mb-4">分类浏览</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {categories.map(cat => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="flex items-center gap-3 p-4 bg-surface border border-border rounded-lg hover:bg-surface-hover transition-all hover:-translate-y-0.5 no-underline"
            >
              <span className="text-xl">{cat.icon}</span>
              <div>
                <div className="text-sm font-medium text-text-primary">{cat.name}</div>
                <div className="text-xs text-text-tertiary">{cat.count} 篇文章</div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent articles */}
      <section>
        <h2 className="text-xl font-semibold text-text-primary mb-4">最新文章</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {recentArticles.map(article => (
            <ArticleCard key={article.slug} article={article} />
          ))}
        </div>
      </section>
    </div>
  )
}
