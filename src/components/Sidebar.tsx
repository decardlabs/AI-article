'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface SidebarCategory {
  name: string
  slug: string
  count: number
  icon: string
}

export default function Sidebar({ categories, latestCount, isOpen, onClose }: {
  categories: SidebarCategory[]
  latestCount: number
  isOpen: boolean
  onClose: () => void
}) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed md:sticky top-0 left-0 z-40 md:z-10
        h-full md:h-screen
        w-[220px] bg-surface border-r border-border
        transform transition-transform duration-200
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
        overflow-y-auto
      `}>
        <div className="p-4 border-b border-border">
          <Link href="/" className="text-xl font-bold text-text-primary no-underline">
            🔧 AI 知识库
          </Link>
        </div>

        <nav className="p-3">
          <Link
            href="/"
            className={`
              flex items-center gap-2 px-3 py-2 rounded-md text-sm transition-colors
              ${pathname === '/'
                ? 'text-primary bg-primary-bg'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}
            `}
          >
            <span>🏠</span>
            <span>全部文章</span>
          </Link>

          <Link
            href="/latest"
            className={`
              flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors mt-1
              ${pathname === '/latest'
                ? 'text-primary bg-primary-bg border-l-[3px] border-primary rounded-l-none'
                : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}
            `}
          >
            <span className="flex items-center gap-2">
              <span>🆕</span>
              <span>最新发布</span>
            </span>
            <span className="text-xs text-text-tertiary">{latestCount}</span>
          </Link>

          <div className="mt-4 space-y-1">
            {categories.map(cat => {
              const isActive = pathname === `/category/${cat.slug}`
              return (
                <Link
                  key={cat.slug}
                  href={`/category/${cat.slug}`}
                  className={`
                    flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors
                    ${isActive
                      ? 'text-primary bg-primary-bg border-l-[3px] border-primary rounded-l-none'
                      : 'text-text-secondary hover:text-text-primary hover:bg-surface-hover'}
                  `}
                >
                  <span className="flex items-center gap-2">
                    <span>{cat.icon}</span>
                    <span>{cat.name}</span>
                  </span>
                  <span className="text-xs text-text-tertiary">{cat.count}</span>
                </Link>
              )
            })}
          </div>
        </nav>
      </aside>
    </>
  )
}
