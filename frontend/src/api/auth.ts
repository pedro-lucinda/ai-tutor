type TokenGetter = () => Promise<string>

let accessTokenGetter: TokenGetter | null = null
let onUnauthorized: (() => void) | null = null

export function setAccessTokenGetter(getter: TokenGetter) {
  accessTokenGetter = getter
}

export function setOnUnauthorized(handler: () => void) {
  onUnauthorized = handler
}

export function triggerUnauthorized() {
  onUnauthorized?.()
}

export async function getAuthHeaders(): Promise<Record<string, string>> {
  if (!accessTokenGetter) {
    return {}
  }
  const token = await accessTokenGetter()
  return { Authorization: `Bearer ${token}` }
}
