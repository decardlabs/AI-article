import { getCategoryBySlug } from '@/lib/categories'

export default function CategoryTag({ categorySlug }: { categorySlug: string }) {
  const cat = getCategoryBySlug(categorySlug)
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded-[4px] bg-tag-bg text-tag-text">
      {cat?.icon} {cat?.name || '未分类'}
    </span>
  )
}
