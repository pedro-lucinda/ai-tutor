import { useEffect, useState, type ReactNode } from 'react'
import { useLocation } from 'react-router-dom'
import { List } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { MobileNavDrawer } from '@/components/modules/mobile-nav-drawer'
import { Button } from '@/components/ui/button'

interface CourseWorkspaceLayoutProps {
  sidebar?: ReactNode
  children: ReactNode
}

export function CourseWorkspaceLayout({ sidebar, children }: CourseWorkspaceLayoutProps) {
  const { pathname } = useLocation()
  const { t } = useTranslation()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    setSidebarOpen(false)
  }, [pathname])

  return (
    <div className="flex h-full min-h-0 flex-col gap-4 lg:flex-row lg:gap-6">
      {sidebar ? (
        <>
          <div className="hidden h-full min-h-0 shrink-0 lg:flex">{sidebar}</div>

          <div className="shrink-0 lg:hidden">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSidebarOpen(true)}
              aria-expanded={sidebarOpen}
              aria-controls="course-sidebar-drawer"
            >
              <List className="size-4" />
              {t('sidebar.curriculum')}
            </Button>
          </div>

          <MobileNavDrawer
            open={sidebarOpen}
            onClose={() => setSidebarOpen(false)}
            title={t('sidebar.curriculum')}
            closeLabel={t('sidebar.closeCurriculum')}
            id="course-sidebar-drawer"
            side="left"
          >
            <div className="min-h-0 flex-1 overflow-hidden p-3">{sidebar}</div>
          </MobileNavDrawer>
        </>
      ) : null}

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">{children}</div>
    </div>
  )
}
