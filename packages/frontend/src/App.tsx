import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Candidates from './pages/Candidates'
import Clients from './pages/Clients'
import Applications from './pages/Applications'
import Financial from './pages/Financial'
import Settings from './pages/Settings'
import Users from './pages/Users'
import Agents from './pages/Agents'
import Brokers from './pages/Brokers'
import ClientStatus from './pages/ClientStatus'

function App() {
  const { user } = useAuth()

  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={!user ? <Login /> : <Navigate to="/dashboard" />} />
      <Route path="/status/:shareableLink" element={<ClientStatus />} />
      
      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/candidates/*" element={<Candidates />} />
          <Route path="/clients/*" element={<Clients />} />
          <Route path="/applications/*" element={<Applications />} />
          
          {/* Super Admin only routes */}
          <Route path="/financial/*" element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <Financial />
            </ProtectedRoute>
          } />
          <Route path="/settings" element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <Settings />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/agents" element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <Agents />
            </ProtectedRoute>
          } />
          <Route path="/brokers" element={
            <ProtectedRoute requiredRole="SUPER_ADMIN">
              <Brokers />
            </ProtectedRoute>
          } />
        </Route>
      </Route>
      
      {/* Default redirect */}
      <Route path="/" element={<Navigate to="/dashboard" />} />
      <Route path="*" element={<Navigate to="/dashboard" />} />
    </Routes>
  )
}

export default App
