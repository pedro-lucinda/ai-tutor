import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { Link, useLocation } from 'react-router-dom'
import { GraduationCap, LogOut, Menu, Plus, Settings, X } from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ThemeToggle } from '@/components/modules/theme-toggle'

const LANGUAGES = [
  { code: 'en', label: 'EN' },
  { code: 'pt-BR', label: 'PT' },
]

function LanguageSwitcher({ className }: { className?: string }) {
  const { i18n } = useTranslation()

  return (
    <div className={cn('flex items-center overflow-hidden rounded-md border border-border', className)}>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
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
  )
}

function NavCoursesButton({ pathname, className }: { pathname: string; className?: string }) {
  const { t } = useTranslation()

  return (
    <Button
      variant="ghost"
      size="sm"
      render={<Link to="/" />}
      className={cn(pathname === '/' && 'bg-muted text-foreground', className)}
    >
      {t('nav.courses')}
    </Button>
  )
}

interface MobileNavItemProps {
  to: string
  icon: ReactNode
  label: string
  active?: boolean
  onNavigate?: () => void
}

function MobileNavItem({ to, icon, label, active, onNavigate }: MobileNavItemProps) {
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

export function Navbar() {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const { user, logout } = useAuth0()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!mobileOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [mobileOpen])

  const closeMobileMenu = () => setMobileOpen(false)

  const handleLogout = () => {
    closeMobileMenu()
    logout({ logoutParams: { returnTo: window.location.origin } })
  }

  return (
    <header className="relative z-50 shrink-0 border-b border-border bg-background/80 backdrop-blur">
      <nav className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:gap-4">
        <Link to="/" className="flex min-w-0 items-center gap-2 font-semibold text-foreground">
          <GraduationCap className="size-5 shrink-0 text-primary" />
          <span className="truncate">AI Tutor</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          <NavCoursesButton pathname={pathname} />
        </div>

        <div className="ml-auto hidden items-center gap-2 md:flex">
          {user?.picture ? (
            <img
              src={user.picture}
              alt={user.name ?? 'User'}
              className="hidden size-7 rounded-full border border-border lg:block"
            />
          ) : null}

          <Button
            variant="ghost"
            size="icon-sm"
            render={<Link to="/settings" />}
            aria-label={t('nav.settings')}
            className={cn(pathname === '/settings' && 'bg-muted text-foreground')}
          >
            <Settings className="size-4" />
          </Button>

          <ThemeToggle />

          <LanguageSwitcher />

          <Button size="sm" render={<Link to="/courses/new" />}>
            <Plus className="size-4 lg:hidden" />
            <span className="hidden lg:inline">{t('nav.newCourse')}</span>
          </Button>

          <Button
            variant="outline"
            size="icon-sm"
            onClick={handleLogout}
            aria-label={t('nav.logout')}
          >
            <LogOut className="size-4" />
          </Button>
        </div>

        <div className="ml-auto md:hidden">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={() => setMobileOpen((open) => !open)}
            aria-expanded={mobileOpen}
            aria-controls="mobile-nav"
            aria-label={mobileOpen ? t('nav.closeMenu') : t('nav.openMenu')}
          >
            {mobileOpen ? <X className="size-4" /> : <Menu className="size-4" />}
          </Button>
        </div>
      </nav>

      {mobileOpen
        ? createPortal(
            <>
              <button
                type="button"
                aria-label={t('nav.closeMenu')}
                className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] md:hidden dark:bg-black/70"
                onClick={closeMobileMenu}
              />

              <aside
                id="mobile-nav"
                role="dialog"
                aria-modal="true"
                aria-label={t('nav.menu')}
                className="fixed inset-y-0 right-0 z-[110] flex w-[min(100vw,18rem)] flex-col border-l border-border bg-background shadow-2xl md:hidden"
              >
                <div className="flex items-center justify-between border-b border-border bg-background px-4 py-3">
                  <span className="text-sm font-semibold text-foreground">{t('nav.menu')}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={closeMobileMenu}
                    aria-label={t('nav.closeMenu')}
                  >
                    <X className="size-4" />
                  </Button>
                </div>

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
                      onNavigate={closeMobileMenu}
                    />
                    <MobileNavItem
                      to="/courses/new"
                      icon={<Plus className="size-4" />}
                      label={t('nav.newCourse')}
                      active={pathname === '/courses/new'}
                      onNavigate={closeMobileMenu}
                    />
                    <MobileNavItem
                      to="/settings"
                      icon={<Settings className="size-4" />}
                      label={t('nav.settings')}
                      active={pathname === '/settings'}
                      onNavigate={closeMobileMenu}
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
                  <Button variant="outline" size="sm" onClick={handleLogout} className="w-full">
                    <LogOut className="size-4" />
                    {t('nav.logout')}
                  </Button>
                </div>
              </aside>
            </>,
            document.body,
          )
        : null}
    </header>
  )
}
