import { Link, useLocation } from 'react-router-dom'
import { GraduationCap } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ThemeToggle } from '@/components/modules/theme-toggle'

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'pt-BR', label: 'PT' },
]

export function Navbar() {
  const { pathname } = useLocation()
  const { t, i18n } = useTranslation()

  return (
    <header className="z-50 shrink-0 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
          <GraduationCap className="size-5 text-primary" />
          AI Tutor
        </Link>

        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            render={<Link to="/" />}
            className={cn(pathname === '/' && 'bg-muted text-foreground')}
          >
            {t('nav.courses')}
          </Button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />

          {/* Language switcher */}
          <div className="flex items-center rounded-md border border-border overflow-hidden">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                onClick={() => i18n.changeLanguage(lang.code)}
                className={cn(
                  'px-2.5 py-1 text-xs font-medium transition-colors',
                  i18n.resolvedLanguage === lang.code
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                )}
              >
                {lang.label}
              </button>
            ))}
          </div>

          <Button size="sm" render={<Link to="/courses/new" />}>
            {t('nav.newCourse')}
          </Button>
        </div>
      </nav>
    </header>
  )
}
