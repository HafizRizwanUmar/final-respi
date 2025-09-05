import { Routes, Route, Navigate } from 'react-router-dom'
import Navbar from './components/Navbar'
import ProtectedRoute from './components/ProtectedRoute'
import Login from './components/Login'
import Dashboard from './components/Dashboard'
import Logs from './components/Logs'
import BlockControl from './components/BlockControl'
import Settings from './components/Settings'
import MLBrain from './components/MLBrain'

export default function App() {
  return (
    <div>
      <Routes>
        <Route path="/login" element={<Login />} />

        <Route path="/" element={<ProtectedRoute><Shell /></ProtectedRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="logs" element={<Logs />} />
          <Route path="control" element={<BlockControl />} />
          <Route path="ml" element={<MLBrain />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </div>
  )
}

import { Outlet } from 'react-router-dom'
function Shell() {
  return (
    <div>
      <Navbar />
      <Outlet />
    </div>
  )
}
