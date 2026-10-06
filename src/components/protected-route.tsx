import { Navigate, Outlet } from 'react-router'
import { useSession } from '@/lib/auth-client'

export function ProtectedRoute() {
  const { data: session, isPending } = useSession()

  if (isPending) {
    return null
  }
  if (!session) {
    return <Navigate to="/sign-in" replace />
  }
  return <Outlet />
}
