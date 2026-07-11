import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { GraduationCap, LogOut, Plus, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/modules/language-switcher'
import { ThemeToggle } from '@/components/modules/theme-toggle'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

function MobileNavItem({
  to,
  icon,
  label,
  active,
  onNavigate,
}: {
  to: string
  icon: ReactNode
  label: string
  active?: boolean
  onNavigate?: () => void
}) {
  return (
    <Link
      to={to}
      onClick={onNavigate}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
        active
          ? 'bg-muted text-foreground'
          : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground',
      )}
    >
      {icon}
      <span>{label}</span>
    </Link>
  )
}

interface NavbarMobileMenuProps {
  pathname: string
  user?: { name?: string | null; email?: string | null; picture?: string | null }
  onClose: () => void
  onLogout: () => void
}

export function NavbarMobileMenu({
  pathname,
  user,
  onClose,
  onLogout,
}: NavbarMobileMenuProps) {
  const { t } = useTranslation()

  return (
    <>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto bg-background p-4">
        {user?.picture || user?.name ? (
          <div className="flex items-center gap-3 rounded-lg bg-muted px-3 py-3">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name ?? 'User'}
                className="size-10 rounded-full border border-border"
              />
            ) : (
              <div className="flex size-10 items-center justify-center rounded-full border border-border bg-background text-sm font-medium text-muted-foreground">
                {(user.name ?? 'U').slice(0, 1).toUpperCase()}
              </div>
            )}
            {user.name ? (
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{user.name}</p>
                {user.email ? (
                  <p className="truncate text-xs text-muted-foreground">{user.email}</p>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <nav className="flex flex-col gap-1">
          <MobileNavItem
            to="/"
            icon={<GraduationCap className="size-4" />}
            label={t('nav.courses')}
            active={pathname === '/'}
            onNavigate={onClose}
          />
          <MobileNavItem
            to="/courses/new"
            icon={<Plus className="size-4" />}
            label={t('nav.newCourse')}
            active={pathname === '/courses/new'}
            onNavigate={onClose}
          />
          <MobileNavItem
            to="/settings"
            icon={<Settings className="size-4" />}
            label={t('nav.settings')}
            active={pathname === '/settings'}
            onNavigate={onClose}
          />
        </nav>

        <Separator />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">{t('nav.themeLabel')}</span>
            <ThemeToggle />
          </div>
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-muted-foreground">{t('nav.language')}</span>
            <LanguageSwitcher />
          </div>
        </div>
      </div>

      <div className="border-t border-border bg-background p-4">
        <Button variant="outline" size="sm" onClick={onLogout} className="w-full">
          <LogOut className="size-4" />
          {t('nav.logout')}
        </Button>
      </div>
    </>
  )
}
