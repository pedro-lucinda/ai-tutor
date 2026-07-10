import { Outlet } from 'react-router-dom'
import { Navbar } from '@/components/modules/navbar'

export function AppLayout() {
  return (
    <div className="flex h-svh flex-col overflow-hidden bg-background text-foreground">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 min-h-0 flex-col overflow-hidden px-4 py-4">
        <Outlet />
      </main>
    </div>
  )
}
