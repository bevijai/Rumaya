import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'

export default function RequireAuth() {
  const { accessToken, loading } = useAuth()

  if (loading) return null
  if (!accessToken) return <Navigate to="/" replace />

  return <Outlet />
}
