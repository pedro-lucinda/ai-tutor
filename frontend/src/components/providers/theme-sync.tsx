import { useEffect } from 'react'
import { applyTheme, useThemeStore } from '@/store/theme-store'

/** Applies system-theme changes when preference is set to "system". Renders nothing. */
export function ThemeSync() {
  const theme = useThemeStore((s) => s.theme)

  useEffect(() => {
    if (theme !== 'system') return

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => {
      const resolved = media.matches ? 'dark' : 'light'
      applyTheme(resolved)
      useThemeStore.setState({ resolvedTheme: resolved })
    }

    media.addEventListener('change', onChange)
    return () => media.removeEventListener('change', onChange)
  }, [theme])

  return null
}
