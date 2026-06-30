import { getArticlesByCategory, getCategoriesWithCounts } from '@/lib/articles'
import { getCategoryBySlug } from '@/lib/categories'
import ArticleCard from '@/components/ArticleCard'
import { notFound } from 'next/navigation'

// 服务器模式，不需要预生成静态页面，让 Next.js 按需渲染
export const dynamic = 'force-dynamic'

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const category = getCategoryBySlug(params.slug)
  if (!category) notFound()

  const articles = getArticlesByCategory(params.slug)

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-1">
          {category.icon} {category.name}
        </h1>
        <p className="text-sm text-text-secondary">{articles.length} 篇文章</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {articles.map(article => (
          <ArticleCard key={article.slug} article={article} />
        ))}
      </div>

      {articles.length === 0 && (
        <p className="text-text-tertiary text-sm">暂无文章</p>
      )}
    </div>
  )
}
