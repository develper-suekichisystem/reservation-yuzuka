import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LoadingProvider } from './contexts/LoadingContext'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <LoadingProvider>
      <App />
    </LoadingProvider>
  </StrictMode>,
)
