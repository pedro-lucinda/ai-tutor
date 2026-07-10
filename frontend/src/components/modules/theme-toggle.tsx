import { Moon, Sun } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useTheme } from '@/components/providers/theme-provider'
import { Button } from '@/components/ui/button'

export function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme()
  const { t } = useTranslation()
  const isDark = resolvedTheme === 'dark'

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={toggleTheme}
      aria-label={isDark ? t('nav.theme.light') : t('nav.theme.dark')}
      title={isDark ? t('nav.theme.light') : t('nav.theme.dark')}
    >
      {isDark ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </Button>
  )
}
