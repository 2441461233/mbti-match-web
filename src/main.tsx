import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AdminApp from './admin.tsx'

const isAdminRoute = window.location.pathname.startsWith('/admin')
const element = isAdminRoute ? <AdminApp /> : <App />

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {element}
  </StrictMode>,
)
