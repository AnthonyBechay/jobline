import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, LoginRequest, LoginResponse } from '../shared/types'
import api from '../services/api'

interface AuthContextType {
  user: User | null
  loading: boolean
  login: (credentials: LoginRequest) => Promise<void>
  logout: () => void
  updateUser: (user: User) => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      fetchCurrentUser()
    } else {
      setLoading(false)
    }
  }, [])

  const fetchCurrentUser = async () => {
    try {
      console.log('🔄 Fetching current user...')
      const response = await api.get<User>('/auth/me')
      setUser(response.data)
      console.log('✅ Current user loaded:', response.data.name, 'role:', response.data.role)
    } catch (error) {
      console.error('❌ Failed to fetch current user:', error)
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
    } finally {
      setLoading(false)
    }
  }

  const login = async (credentials: LoginRequest) => {
    console.log('🔐 Attempting login for:', credentials.email, 'at company:', credentials.companyName)
    
    try {
      const response = await api.post<LoginResponse>('/auth/login', credentials)
      const { token, user } = response.data
      
      console.log('✅ Login successful for user:', user.name, 'role:', user.role)
      
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
      setUser(user)
    } catch (error: any) {
      console.error('❌ Login failed:', error.response?.data?.error || error.message)
      throw error
    }
  }

  const logout = () => {
    console.log('🚪 Logging out user:', user?.name)
    localStorage.removeItem('token')
    delete api.defaults.headers.common['Authorization']
    setUser(null)
  }

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  )
}