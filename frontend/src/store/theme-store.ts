import { create } from 'zustand'

export type Theme = 'light' | 'dark' | 'system'

const STORAGE_KEY = 'ai-tutor-theme'

function getSystemTheme(): 'light' | 'dark' {
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function resolveTheme(theme: Theme): 'light' | 'dark' {
  return theme === 'system' ? getSystemTheme() : theme
}

export function applyTheme(resolved: 'light' | 'dark') {
  document.documentElement.classList.toggle('dark', resolved === 'dark')
  document.documentElement.style.colorScheme = resolved
}

function readStoredTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    return stored
  }
  return 'system'
}

function persistTheme(theme: Theme): 'light' | 'dark' {
  const resolved = resolveTheme(theme)
  applyTheme(resolved)
  localStorage.setItem(STORAGE_KEY, theme)
  return resolved
}

const initialTheme = readStoredTheme()
const initialResolved = resolveTheme(initialTheme)
applyTheme(initialResolved)

interface ThemeStore {
  theme: Theme
  resolvedTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
  toggleTheme: () => void
}

export const useThemeStore = create<ThemeStore>((set, get) => ({
  theme: initialTheme,
  resolvedTheme: initialResolved,
  setTheme: (theme) => {
    const resolved = persistTheme(theme)
    set({ theme, resolvedTheme: resolved })
  },
  toggleTheme: () => {
    const resolved = get().resolvedTheme
    const next: Theme = resolved === 'dark' ? 'light' : 'dark'
    const newResolved = persistTheme(next)
    set({ theme: next, resolvedTheme: newResolved })
  },
}))
