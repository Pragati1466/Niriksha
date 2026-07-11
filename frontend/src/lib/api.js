import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    // Add cache control header for non-cached requests
    if (!config.headers['Cache-Control']) {
      config.headers['Cache-Control'] = 'no-cache'
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    
    // Handle optimistic lock conflicts
    if (error.response?.status === 409) {
      const errorData = error.response.data
      if (errorData?.error?.code === 'VERSION_CONFLICT') {
        throw new OptimisticLockError(
          errorData.error.message || 'This record was modified by another user'
        )
      }
    }
    
    // Handle GPS validation errors
    if (error.response?.status === 400) {
      const errorData = error.response.data
      if (errorData?.error?.code === 'GPS_VALIDATION_ERROR') {
        throw new GPSValidationError(
          errorData.error.message || 'Invalid GPS coordinates'
        )
      }
    }
    
    // Handle file upload errors
    if (error.response?.status === 400) {
      const errorData = error.response.data
      if (errorData?.error?.code === 'FILE_UPLOAD_ERROR') {
        throw new FileUploadError(
          errorData.error.message || 'File upload validation failed'
        )
      }
    }
    
    return Promise.reject(error)
  }
)

// Custom error classes
class OptimisticLockError extends Error {
  constructor(message) {
    super(message)
    this.name = 'OptimisticLockError'
  }
}

class GPSValidationError extends Error {
  constructor(message) {
    super(message)
    this.name = 'GPSValidationError'
  }
}

class FileUploadError extends Error {
  constructor(message) {
    super(message)
    this.name = 'FileUploadError'
  }
}

export { OptimisticLockError, GPSValidationError, FileUploadError }
export default api
