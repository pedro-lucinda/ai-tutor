import type { ReactNode } from 'react'

interface PageScrollLayoutProps {
  children: ReactNode
}

export function PageScrollLayout({ children }: PageScrollLayoutProps) {
  return <div className="h-full min-h-0 overflow-y-auto pr-1">{children}</div>
}
