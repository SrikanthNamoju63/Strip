import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import AdminAuthProvider from './context/AdminAuthContext.jsx'
import ErrorBoundary from './components/ErrorBoundary.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ErrorBoundary>
      <AdminAuthProvider>
        <App />
      </AdminAuthProvider>
    </ErrorBoundary>
  </StrictMode>,
)
