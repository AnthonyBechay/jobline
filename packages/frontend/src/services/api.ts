import axios from 'axios'

// In production, use the environment variable if available
// In development, use direct backend URL
// Always append /api to the base URL
const getBaseURL = () => {
  if (import.meta.env.PROD) {
    const url = import.meta.env.VITE_API_URL || 'https://jobline-in2v.onrender.com'
    return `${url}/api`
  }
  return 'http://localhost:5000/api'
}

const baseURL = getBaseURL()

const api = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    console.log(`🌐 API Request: ${config.method?.toUpperCase()} ${config.url}`)
    return config
  },
  (error) => {
    console.error('❌ API Request Error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    console.log(`✅ API Response: ${response.status} ${response.config.method?.toUpperCase()} ${response.config.url}`)
    return response
  },
  (error) => {
    if (error.code === 'ERR_NETWORK') {
      console.error('🚫 Network Error: Backend server is not running or unreachable')
    } else if (error.response?.status === 401) {
      console.warn('🔒 Unauthorized: Token expired or invalid')
      localStorage.removeItem('token')
      // Only redirect if not already on login page
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'
      }
    } else {
      console.error(`❌ API Error: ${error.response?.status} ${error.config?.method?.toUpperCase()} ${error.config?.url}`)
    }
    return Promise.reject(error)
  }
)

// Create a separate axios instance for public endpoints
export const publicApi = axios.create({
  baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Public API doesn't need auth interceptors
publicApi.interceptors.response.use(
  (response) => response,
  (error) => {
    // Just pass through the error without redirecting
    return Promise.reject(error)
  }
)

export default api
