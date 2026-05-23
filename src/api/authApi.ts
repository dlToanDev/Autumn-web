import apiClient from './client'
import type { LoginPayload, LoginResponse, RegisterPayload, User } from '@/types'
import { useAuthStore } from '@/store/authStore'

type ApiUser = User & {
    roleId?: number
    vietQrBankId?: string
    bankAccountNo?: string
    sepayApiKey?: string
}

function normalizeUser(data: ApiUser): User {
    return {
        ...data,
        bankName: data.bankName ?? data.vietQrBankId ?? '',
        bankAccountNumber: data.bankAccountNumber ?? data.bankAccountNo ?? '',
        bankAccountName: data.bankAccountName ?? '',
        vietQrTemplate: data.vietQrTemplate ?? 'compact2',
        vietQrBankId: data.vietQrBankId ?? data.bankName,
        bankAccountNo: data.bankAccountNo ?? data.bankAccountNumber,
    }
}

function valueOrCurrent<T>(value: T | undefined, current: T | undefined, fallback: T): T {
    return value ?? current ?? fallback
}

function toUpdateProfileRequest(payload: Partial<User>) {
    const current = useAuthStore.getState().user
    const rawPayload = payload as Partial<ApiUser>
    const rawCurrent = current as Partial<ApiUser> | null

    return {
        fullName: valueOrCurrent(payload.fullName, current?.fullName, ''),
        email: valueOrCurrent(payload.email, current?.email, ''),
        phone: valueOrCurrent(payload.phone, current?.phone, ''),
        avatarUrl: valueOrCurrent(payload.avatarUrl, current?.avatarUrl, ''),
        gender: valueOrCurrent(payload.gender, current?.gender, 'other'),
        dateOfBirth: valueOrCurrent(payload.dateOfBirth, current?.dateOfBirth, '') || null,
        address: valueOrCurrent(payload.address, current?.address, ''),
        hometown: valueOrCurrent(payload.hometown, current?.hometown, ''),
        vietQrBankId: valueOrCurrent(payload.bankName ?? rawPayload.vietQrBankId, current?.bankName ?? rawCurrent?.vietQrBankId, ''),
        bankAccountNo: valueOrCurrent(payload.bankAccountNumber ?? rawPayload.bankAccountNo, current?.bankAccountNumber ?? rawCurrent?.bankAccountNo, ''),
        bankAccountName: valueOrCurrent(payload.bankAccountName, current?.bankAccountName, ''),
        vietQrTemplate: valueOrCurrent(payload.vietQrTemplate, current?.vietQrTemplate, 'compact2'),
        sepayApiKey: valueOrCurrent(rawPayload.sepayApiKey, rawCurrent?.sepayApiKey, ''),
    }
}

export const authApi = {
    login: async (payload: LoginPayload): Promise<LoginResponse> => {
        const { data } = await apiClient.post('/api/auth/login', {
            account: payload.account,
            password: payload.password,
        })
        return { ...data, user: normalizeUser(data.user) }
    },

    register: async (payload: RegisterPayload): Promise<void> => {
        await apiClient.post('/api/auth/register', payload)
    },

    forgotPassword: async (email: string): Promise<void> => {
        await apiClient.post('/api/auth/forgot-password', { email })
    },

    resetPassword: async (payload: { token: string; newPassword: string }): Promise<void> => {
        await apiClient.post('/api/auth/reset-password', payload)
    },

    getMe: async (): Promise<User> => {
        const { data } = await apiClient.get('/api/auth/me')
        return normalizeUser(data)
    },

    updateMe: async (payload: Partial<User>): Promise<User> => {
        const { data } = await apiClient.put('/api/auth/me', toUpdateProfileRequest(payload))
        return normalizeUser(data)
    },

    deleteMe: async (): Promise<void> => {
        await apiClient.delete('/api/auth/me')
    },
}
