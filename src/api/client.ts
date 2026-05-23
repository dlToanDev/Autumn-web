import axios, { type AxiosError } from 'axios'
import toast from 'react-hot-toast'
import { useAuthStore } from '@/store/authStore'

const apiClient = axios.create({
    baseURL: '',
    timeout: 30000,
})

// Request interceptor – attach Bearer token
apiClient.interceptors.request.use((config) => {
    const token = useAuthStore.getState().token
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Response interceptor – unified error handling
apiClient.interceptors.response.use(
    (response) => response,
    (error: AxiosError<{ message?: string; errors?: Record<string, string[]> }>) => {
        const status = error.response?.status

        if (status === 401) {
            useAuthStore.getState().clearAuth()
            window.location.href = '/login'
            return Promise.reject(error)
        }

        if (status === 403) {
            toast.error('Bạn không có quyền thực hiện thao tác này')
            return Promise.reject(error)
        }

        // Collect validation errors if returned as object
        const data = error.response?.data
        const message =
            data?.message ||
            (data?.errors ? Object.values(data.errors).flat().join(', ') : null) ||
            error.message ||
            'Đã có lỗi xảy ra'

        toast.error(message)
        return Promise.reject(error)
    },
)

export default apiClient
