import apiClient from './client'
import type { TenantInfo } from '@/types'

type TenantInfoRecord = Partial<TenantInfo> & {
    tenantId?: number
    tenantName?: string
    tenantEmail?: string
    tenantPhone?: string
    tenantAvatarUrl?: string
}

function normalizeTenant(record: TenantInfoRecord): TenantInfo {
    return {
        ...record,
        userId: Number(record.userId ?? record.tenantId ?? 0),
        fullName: record.fullName || record.tenantName || '',
        email: record.email || record.tenantEmail || '',
        phone: record.phone || record.tenantPhone || undefined,
        avatarUrl: record.avatarUrl || record.tenantAvatarUrl || undefined,
        roomId: Number(record.roomId ?? 0),
    }
}

export const landlordTenantsApi = {
    getTenants: async (): Promise<TenantInfo[]> => {
        const { data } = await apiClient.get('/api/landlord/tenants')
        return Array.isArray(data) ? data.map((item) => normalizeTenant(item)) : []
    },
}
