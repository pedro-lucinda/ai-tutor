import { useAuth0 } from '@auth0/auth0-react'
import type { ReactNode } from 'react'

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0()

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Loading…
      </div>
    )
  }

  if (!isAuthenticated) {
    void loginWithRedirect()
    return (
      <div className="flex min-h-[50vh] items-center justify-center text-muted-foreground">
        Redirecting to login…
      </div>
    )
  }

  return children
}
