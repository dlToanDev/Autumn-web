import apiClient from './client'
import type { SystemConfig } from '@/types'

export const systemConfigApi = {
    getSettings: async (): Promise<SystemConfig> => {
        const { data } = await apiClient.get('/api/admin/payment-settings')
        return {
            commissionRate: Number(data?.commissionRate ?? 0),
            expireMinutes: Number(data?.expireMinutes ?? 15),
        }
    },

    updateSettings: async (payload: SystemConfig): Promise<SystemConfig> => {
        const { data } = await apiClient.put('/api/admin/payment-settings', {
            commissionRate: payload.commissionRate ?? 0,
            expireMinutes: payload.expireMinutes ?? payload.paymentDeadlineDays ?? 15,
        })
        return {
            commissionRate: Number(data?.commissionRate ?? 0),
            expireMinutes: Number(data?.expireMinutes ?? 15),
        }
    },
}
