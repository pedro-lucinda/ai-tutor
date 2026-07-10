import type { ReactNode } from 'react'

interface CourseWorkspaceLayoutProps {
  sidebar?: ReactNode
  children: ReactNode
}

export function CourseWorkspaceLayout({ sidebar, children }: CourseWorkspaceLayoutProps) {
  return (
    <div className="flex h-full min-h-0 gap-6">
      {sidebar}
      <div className="min-h-0 min-w-0 flex-1 overflow-y-auto pr-1">{children}</div>
    </div>
  )
}
