import { Navigate } from 'react-router-dom'
import { useAuthState } from 'react-firebase-hooks/auth'
import { auth } from '../firebase'

export default function ProtectedRoute({ children }) {
  const [user, loading] = useAuthState(auth)
  if (loading) return <div className="p-6">Loading...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}
