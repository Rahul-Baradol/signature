import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/index.css'
import App from '@/App.tsx'
import { initPostHog } from '@/utils/posthog'
import { setupPWA } from '@/utils/pwa-register'

initPostHog()
setupPWA()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
