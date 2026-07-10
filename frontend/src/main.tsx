import './i18n'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { AppAuthProvider } from '@/components/auth/app-auth-provider'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppAuthProvider>
      <App />
    </AppAuthProvider>
  </StrictMode>,
)
