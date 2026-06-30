'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Sidebar from '@/components/Sidebar'
import SearchBar from '@/components/SearchBar'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [categories, setCategories] = useState<{ name: string; slug: string; count: number; icon: string }[]>([])
  const [latestCount, setLatestCount] = useState(0)

  useEffect(() => {
    fetch('/api/categories')
      .then(r => r.json())
      .then(data => setCategories(data))
      .catch(() => {})
    fetch('/api/latest-count')
      .then(r => r.json())
      .then(data => setLatestCount(data.count))
      .catch(() => {})
  }, [])

  return (
    <html lang="zh-CN">
      <body>
        <div className="min-h-screen flex flex-col md:flex-row bg-bg">
          <Sidebar
            categories={categories}
            latestCount={latestCount}
            isOpen={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
          />

          {/* Main area */}
          <div className="flex-1 flex flex-col min-h-screen">
            {/* Top bar */}
            <header className="sticky top-0 z-20 bg-bg/95 backdrop-blur-sm border-b border-border h-14 flex items-center justify-between px-4 md:px-8">
              <button
                className="md:hidden p-2 -ml-2 text-text-secondary hover:text-text-primary"
                onClick={() => setSidebarOpen(true)}
                aria-label="打开菜单"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>

              <Link href="/" className="md:hidden text-lg font-bold text-text-primary no-underline">
                🔧 AI 知识库
              </Link>

              <div className="flex-1 md:flex-none" />

              <SearchBar />
            </header>

            {/* Page content */}
            <main className="flex-1 p-4 md:p-8">
              {children}
            </main>

            {/* Footer */}
            <footer className="border-t border-border py-6 px-4 md:px-8 text-center text-xs text-text-tertiary">
              <p>内容来自 Obsidian AI 知识库 · 每日自动更新</p>
            </footer>
          </div>
        </div>
      </body>
    </html>
  )
}
