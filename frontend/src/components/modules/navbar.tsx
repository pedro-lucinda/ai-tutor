import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { GraduationCap, LogOut, Menu, Plus, Settings } from 'lucide-react'
import { useAuth0 } from '@auth0/auth0-react'
import { useTranslation } from 'react-i18next'
import { LanguageSwitcher } from '@/components/modules/language-switcher'
import { MobileNavDrawer } from '@/components/modules/mobile-nav-drawer'
import { NavbarMobileMenu } from '@/components/modules/navbar-mobile-menu'
import { ThemeToggle } from '@/components/modules/theme-toggle'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

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

export function Navbar() {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const { user, logout } = useAuth0()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

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
            <Menu className="size-4" />
          </Button>
        </div>
      </nav>

      <MobileNavDrawer
        open={mobileOpen}
        onClose={closeMobileMenu}
        title={t('nav.menu')}
        closeLabel={t('nav.closeMenu')}
        id="mobile-nav"
        side="right"
      >
        <NavbarMobileMenu
          pathname={pathname}
          user={user}
          onClose={closeMobileMenu}
          onLogout={handleLogout}
        />
      </MobileNavDrawer>
    </header>
  )
}
