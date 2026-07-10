import { useAuth0 } from '@auth0/auth0-react'
import { useEffect } from 'react'
import { setAccessTokenGetter, setOnUnauthorized } from '@/api/auth'

const audience = import.meta.env.VITE_AUTH0_AUDIENCE

export function AuthTokenSync() {
  const { getAccessTokenSilently, isAuthenticated, loginWithRedirect } = useAuth0()

  useEffect(() => {
    setOnUnauthorized(() => {
      void loginWithRedirect()
    })
  }, [loginWithRedirect])

  useEffect(() => {
    if (!isAuthenticated) {
      setAccessTokenGetter(async () => '')
      return
    }

    setAccessTokenGetter(async () =>
      getAccessTokenSilently({
        authorizationParams: audience ? { audience } : undefined,
      }),
    )
  }, [getAccessTokenSilently, isAuthenticated])

  return null
}
