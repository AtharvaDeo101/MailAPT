'use client'

import { useTheme } from 'next-themes'
import { useEffect, useState } from 'react'

export function ThemeToggle({ isScrolled = false }: { isScrolled?: boolean }) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) {
    return (
      <div
        className="rounded-full animate-pulse"
        style={{
          width: isScrolled ? '32px' : '36px',
          height: isScrolled ? '32px' : '36px',
          background: 'color-mix(in srgb, var(--foreground) 10%, transparent)',
        }}
      />
    )
  }

  const isDark = resolvedTheme === 'dark'

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="relative rounded-full transition-all duration-500 group overflow-hidden"
      style={{
        width: isScrolled ? '32px' : '36px',
        height: isScrolled ? '32px' : '36px',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        border: '1px solid color-mix(in srgb, var(--foreground) 15%, transparent)',
        background: isDark
          ? 'linear-gradient(135deg, color-mix(in srgb, var(--foreground) 8%, transparent), color-mix(in srgb, var(--foreground) 4%, transparent))'
          : 'linear-gradient(135deg, color-mix(in srgb, var(--foreground) 4%, transparent), color-mix(in srgb, var(--foreground) 2%, transparent))',
        boxShadow: isDark
          ? '0 6px 20px color-mix(in srgb, black 28%, transparent)'
          : '0 6px 20px color-mix(in srgb, var(--foreground) 8%, transparent)',
        transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      id="theme-toggle-btn"
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          width: isScrolled ? '15px' : '17px',
          height: isScrolled ? '15px' : '17px',
          position: 'absolute',
          color: 'color-mix(in srgb, var(--foreground) 72%, transparent)',
          transform: isDark ? 'rotate(90deg) scale(0)' : 'rotate(0deg) scale(1)',
          opacity: isDark ? 0 : 1,
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2" />
        <path d="M12 20v2" />
        <path d="m4.93 4.93 1.41 1.41" />
        <path d="m17.66 17.66 1.41 1.41" />
        <path d="M2 12h2" />
        <path d="M20 12h2" />
        <path d="m6.34 17.66-1.41 1.41" />
        <path d="m19.07 4.93-1.41 1.41" />
      </svg>

      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          width: isScrolled ? '14px' : '16px',
          height: isScrolled ? '14px' : '16px',
          position: 'absolute',
          color: 'color-mix(in srgb, var(--foreground) 80%, transparent)',
          transform: isDark ? 'rotate(0deg) scale(1)' : 'rotate(-90deg) scale(0)',
          opacity: isDark ? 1 : 0,
          transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
        <path d="M19 3v4" />
        <path d="M21 5h-4" />
      </svg>
    </button>
  )
}