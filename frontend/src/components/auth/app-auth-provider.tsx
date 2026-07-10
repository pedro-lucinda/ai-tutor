import { useAuth0 } from '@auth0/auth0-react'
import { Auth0Provider } from '@auth0/auth0-react'
import type { ReactNode } from 'react'
import { AuthTokenSync } from '@/components/auth/auth-token-sync'

const domain = import.meta.env.VITE_AUTH0_DOMAIN
const clientId = import.meta.env.VITE_AUTH0_CLIENT_ID
const audience = import.meta.env.VITE_AUTH0_AUDIENCE

export function AppAuthProvider({ children }: { children: ReactNode }) {
  if (!domain || !clientId) {
    throw new Error('Missing VITE_AUTH0_DOMAIN or VITE_AUTH0_CLIENT_ID')
  }

  return (
    <Auth0Provider
      domain={domain}
      clientId={clientId}
      authorizationParams={{
        redirect_uri: window.location.origin,
        ...(audience ? { audience } : {}),
      }}
      cacheLocation="localstorage"
    >
      <AuthTokenSync />
      {children}
    </Auth0Provider>
  )
}

export function useAuthUser() {
  const { user, isAuthenticated } = useAuth0()
  return { user, isAuthenticated, sub: user?.sub }
}
