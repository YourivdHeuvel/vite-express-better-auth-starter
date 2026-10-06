import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router'
import { Toaster } from '@/components/ui/sonner'
import { ProtectedRoute } from '@/components/protected-route'
import { DashboardPage } from '@/pages/dashboard'
import { SignInPage } from '@/pages/sign-in'
import { SignUpPage } from '@/pages/sign-up'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/sign-up" element={<SignUpPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<DashboardPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
    <Toaster />
  </StrictMode>,
)
