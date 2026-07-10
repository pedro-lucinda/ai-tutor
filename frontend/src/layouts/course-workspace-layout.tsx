import { useEffect, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { useLocation } from 'react-router-dom'
import { List, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
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

  useEffect(() => {
    if (!sidebarOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSidebarOpen(false)
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [sidebarOpen])

  const closeSidebar = () => setSidebarOpen(false)

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

          {sidebarOpen
            ? createPortal(
                <>
                  <button
                    type="button"
                    aria-label={t('sidebar.closeCurriculum')}
                    className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[2px] lg:hidden dark:bg-black/70"
                    onClick={closeSidebar}
                  />

                  <aside
                    id="course-sidebar-drawer"
                    role="dialog"
                    aria-modal="true"
                    aria-label={t('sidebar.curriculum')}
                    className="fixed inset-y-0 left-0 z-[110] flex w-[min(100vw,20rem)] flex-col bg-background shadow-2xl lg:hidden"
                  >
                    <div className="flex items-center justify-end border-b border-border px-3 py-2">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={closeSidebar}
                        aria-label={t('sidebar.closeCurriculum')}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>

                    <div className="min-h-0 flex-1 overflow-hidden p-3">{sidebar}</div>
                  </aside>
                </>,
                document.body,
              )
            : null}
        </>
      ) : null}

      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">{children}</div>
    </div>
  )
}
