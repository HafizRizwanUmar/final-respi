import { Link } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import { auth } from '../firebase'

export default function Navbar() {
  const handleLogout = async () => {
    await signOut(auth)
  }

  return (
    <div className="w-full sticky top-0 z-10 bg-[rgba(15,27,50,.8)] backdrop-blur border-b border-white/10">
      <div className="max-w-6xl mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="font-bold text-xl">Smart Pi-hole Admin</Link>
        <nav className="flex gap-4">
          <Link to="/" className="hover:underline">Dashboard</Link>
          <Link to="/logs" className="hover:underline">Logs</Link>
          <Link to="/control" className="hover:underline">Domain Control</Link>
          <Link to="/ml" className="hover:underline">ML Brain</Link>
          <Link to="/settings" className="hover:underline">Settings</Link>
          <button className="btn" onClick={handleLogout}>Logout</button>
        </nav>
      </div>
    </div>
  )
}
