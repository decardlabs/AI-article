'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
    }
  }, [isOpen])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`)
      setIsOpen(false)
      setQuery('')
    }
  }

  return (
    <div className="relative">
      {/* Desktop: always visible */}
      <form onSubmit={handleSubmit} className="hidden md:block">
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="搜索文章..."
            className="w-64 pl-9 pr-3 py-2 text-sm border border-border rounded-md bg-surface text-text-primary placeholder:text-text-tertiary focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </form>

      {/* Mobile: icon toggle */}
      <button
        className="md:hidden p-2 text-text-secondary hover:text-text-primary"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="搜索"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </button>

      {/* Mobile search overlay */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-bg p-4">
          <div className="flex gap-2">
            <form onSubmit={handleSubmit} className="flex-1">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="搜索文章..."
                className="w-full px-4 py-3 text-base border border-border rounded-md bg-surface text-text-primary focus:outline-none focus:border-primary"
              />
            </form>
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-3 text-sm text-text-secondary"
            >
              取消
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
