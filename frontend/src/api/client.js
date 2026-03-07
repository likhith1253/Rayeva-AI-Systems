import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 60000, // 60s timeout for AI calls
})

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const message = error.response.data?.detail || 'An error occurred'
      return Promise.reject(new Error(message))
    } else if (error.request) {
      return Promise.reject(new Error('Network error — please check if the backend is running'))
    }
    return Promise.reject(error)
  }
)

export default api
