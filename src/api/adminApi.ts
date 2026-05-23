import apiClient from './client'
import type { AdminDashboardStats, Announcement, User, Room, AdminLandlord, AdminLandlordDetail } from '@/types'

type AdminUserRecord = {
    id: number
    fullName: string
    email?: string | null
    phone?: string | null
    roleCode: string
    roleName: string
    status: string
    isVerified: boolean
    hasPaymentConfig: boolean
    createdAt: string
    updatedAt: string
}

type AdminRoomRecord = {
    id: number
    title: string
    roomCode: string
    roomType?: string | null
    propertyId: number
    propertyName: string
    landlordId: number
    landlordName: string
    landlordEmail?: string | null
    landlordPhone?: string | null
    price: number
    status: string
    approvalStatus: string
    addressLine: string
    provinceName: string
    districtName: string
    wardName: string
    fullAddress: string
    createdAt: string
    updatedAt: string
}

type AdminLandlordTenantRecord = {
    tenantId: number
    tenantName: string
    tenantEmail?: string | null
    tenantPhone?: string | null
    bookingRequestId: number
    bookingCode: string
    contractId?: number | null
    contractCode?: string | null
    contractStatus?: string | null
    moveInDate?: string | null
    confirmedAt?: string | null
    monthlyRent?: number
}

type AdminLandlordRoomRecord = {
    id: number
    propertyId: number
    title: string
    roomCode: string
    roomType?: string | null
    price: number
    maxTenants: number
    status: string
    approvalStatus: string
    activeTenantCount: number
    tenants?: AdminLandlordTenantRecord[]
}

type AdminLandlordPropertyRecord = {
    id: number
    name: string
    description?: string | null
    status: string
    addressLine: string
    provinceName?: string | null
    districtName?: string | null
    wardName?: string | null
    fullAddress?: string | null
    roomCount: number
    activeTenantCount: number
    createdAt: string
    updatedAt?: string | null
    rooms?: AdminLandlordRoomRecord[]
}

type AdminLandlordRecord = {
    id: number
    fullName: string
    email?: string | null
    phone?: string | null
    status: string
    isVerified: boolean
    hasPaymentConfig: boolean
    propertyCount: number
    roomCount: number
    activeTenantCount: number
    totalGrossRevenue?: number
    thisMonthGrossRevenue?: number
    latestCommissionPaymentCode?: string | null
    latestCommissionPaymentStatus?: string | null
    latestCommissionPaymentCreatedAt?: string | null
    latestCommissionPaymentPaidAt?: string | null
    createdAt: string
    updatedAt?: string | null
}

type AdminLandlordDetailRecord = AdminLandlordRecord & {
    address?: string | null
    hometown?: string | null
    vietQrBankId?: string | null
    bankAccountNo?: string | null
    bankAccountName?: string | null
    properties?: AdminLandlordPropertyRecord[]
}

const upper = (value?: string | null) => (value || '').trim().toUpperCase()

function mapAdminUser(record: AdminUserRecord): User & { status: string; hasPaymentConfig?: boolean } {
    const status = upper(record.status)

    return {
        id: record.id,
        fullName: record.fullName,
        email: record.email || '',
        phone: record.phone || undefined,
        roleCode: upper(record.roleCode),
        roleName: record.roleName,
        createdAt: record.createdAt,
        isActive: status === 'ACTIVE',
        status,
        hasPaymentConfig: record.hasPaymentConfig,
    } as User & { status: string; hasPaymentConfig?: boolean }
}

function mapAdminRoom(record: AdminRoomRecord): Room & {
    roomCode?: string
    roomType?: string
    landlordEmail?: string
    landlordPhone?: string
    fullAddress?: string
    approvalStatus?: string
} {
    const status = upper(record.status)
    const moderationStatus = upper(record.approvalStatus)

    return {
        id: record.id,
        title: record.title,
        price: Number(record.price || 0),
        propertyId: record.propertyId,
        propertyName: record.propertyName,
        address: record.addressLine || record.fullAddress,
        provinceName: record.provinceName,
        districtName: record.districtName,
        wardName: record.wardName,
        status: status as Room['status'],
        moderationStatus: moderationStatus as Room['moderationStatus'],
        landlordId: record.landlordId,
        landlordName: record.landlordName,
        createdAt: record.createdAt,
        roomCode: record.roomCode,
        roomType: record.roomType || undefined,
        landlordEmail: record.landlordEmail || undefined,
        landlordPhone: record.landlordPhone || undefined,
        fullAddress: record.fullAddress,
        approvalStatus: moderationStatus,
    } as Room & {
        roomCode?: string
        roomType?: string
        landlordEmail?: string
        landlordPhone?: string
        fullAddress?: string
        approvalStatus?: string
    }
}

function mapAdminLandlord(record: AdminLandlordRecord): AdminLandlord {
    return {
        id: record.id,
        fullName: record.fullName,
        email: record.email || undefined,
        phone: record.phone || undefined,
        status: upper(record.status),
        isVerified: Boolean(record.isVerified),
        hasPaymentConfig: Boolean(record.hasPaymentConfig),
        propertyCount: Number(record.propertyCount || 0),
        roomCount: Number(record.roomCount || 0),
        activeTenantCount: Number(record.activeTenantCount || 0),
        totalGrossRevenue: Number(record.totalGrossRevenue || 0),
        thisMonthGrossRevenue: Number(record.thisMonthGrossRevenue || 0),
        latestCommissionPaymentCode: record.latestCommissionPaymentCode || undefined,
        latestCommissionPaymentStatus: record.latestCommissionPaymentStatus ? upper(record.latestCommissionPaymentStatus) : undefined,
        latestCommissionPaymentCreatedAt: record.latestCommissionPaymentCreatedAt || undefined,
        latestCommissionPaymentPaidAt: record.latestCommissionPaymentPaidAt || undefined,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt || undefined,
    }
}

function mapAdminLandlordDetail(record: AdminLandlordDetailRecord): AdminLandlordDetail {
    return {
        ...mapAdminLandlord(record),
        address: record.address || undefined,
        hometown: record.hometown || undefined,
        vietQrBankId: record.vietQrBankId || undefined,
        bankAccountNo: record.bankAccountNo || undefined,
        bankAccountName: record.bankAccountName || undefined,
        properties: (record.properties || []).map((property) => ({
            id: property.id,
            name: property.name,
            description: property.description || undefined,
            status: upper(property.status),
            addressLine: property.addressLine,
            provinceName: property.provinceName || undefined,
            districtName: property.districtName || undefined,
            wardName: property.wardName || undefined,
            fullAddress: property.fullAddress || undefined,
            roomCount: Number(property.roomCount || 0),
            activeTenantCount: Number(property.activeTenantCount || 0),
            createdAt: property.createdAt,
            updatedAt: property.updatedAt || undefined,
            rooms: (property.rooms || []).map((room) => ({
                id: room.id,
                propertyId: room.propertyId,
                title: room.title,
                roomCode: room.roomCode,
                roomType: room.roomType || undefined,
                price: Number(room.price || 0),
                maxTenants: Number(room.maxTenants || 0),
                status: upper(room.status),
                approvalStatus: upper(room.approvalStatus),
                activeTenantCount: Number(room.activeTenantCount || 0),
                tenants: (room.tenants || []).map((tenant) => ({
                    tenantId: tenant.tenantId,
                    tenantName: tenant.tenantName,
                    tenantEmail: tenant.tenantEmail || undefined,
                    tenantPhone: tenant.tenantPhone || undefined,
                    bookingRequestId: tenant.bookingRequestId,
                    bookingCode: tenant.bookingCode,
                    contractId: tenant.contractId || undefined,
                    contractCode: tenant.contractCode || undefined,
                    contractStatus: tenant.contractStatus ? upper(tenant.contractStatus) : undefined,
                    moveInDate: tenant.moveInDate || undefined,
                    confirmedAt: tenant.confirmedAt || undefined,
                    monthlyRent: Number(tenant.monthlyRent || 0),
                })),
            })),
        })),
    }
}

export const adminApi = {
    getDashboard: async (): Promise<AdminDashboardStats> => {
        const { data } = await apiClient.get('/api/admin/dashboard')
        return {
            totalUsers: data?.overview?.totalUsers ?? 0,
            totalRooms: data?.overview?.totalRooms ?? 0,
            totalContracts: data?.systemManagement?.confirmedBookings ?? 0,
            totalRevenue: Number(data?.revenueSummary?.grossRentRevenue ?? 0),
            pendingApplications: data?.systemManagement?.pendingRoomApproval ?? 0,
            pendingBookings: data?.systemManagement?.pendingBookings ?? 0,
            activeContracts: data?.systemManagement?.confirmedBookings ?? 0,
            pendingRooms: data?.systemManagement?.pendingRoomApproval ?? 0,
            monthlyRevenue: Number(data?.revenueSummary?.grossRentRevenueThisMonth ?? data?.overview?.grossRentRevenueThisMonth ?? 0),
            monthlyCommission: Number(data?.revenueSummary?.collectedCommissionThisMonth ?? 0),
        }
    },

    getUsers: async (): Promise<User[]> => {
        const { data } = await apiClient.get<AdminUserRecord[]>('/api/admin/users')
        return data.map(mapAdminUser)
    },

    setUserStatus: async (userId: number, isActive: boolean): Promise<void> => {
        await apiClient.put(`/api/admin/users/${userId}/status`, {
            status: isActive ? 'active' : 'locked',
        })
    },

    getAdminRooms: async (): Promise<Room[]> => {
        const { data } = await apiClient.get<AdminRoomRecord[]>('/api/admin/rooms')
        return data.map(mapAdminRoom)
    },

    getLandlords: async (): Promise<AdminLandlord[]> => {
        const { data } = await apiClient.get<AdminLandlordRecord[]>('/api/admin/landlords')
        return data.map(mapAdminLandlord)
    },

    getLandlordDetail: async (landlordId: number): Promise<AdminLandlordDetail> => {
        const { data } = await apiClient.get<AdminLandlordDetailRecord>(`/api/admin/landlords/${landlordId}`)
        return mapAdminLandlordDetail(data)
    },

    moderateRoom: async (
        roomId: number,
        payload: { status?: 'APPROVE' | 'REJECT'; moderationStatus?: 'APPROVED' | 'REJECTED'; moderationNote?: string },
    ): Promise<void> => {
        const approvalStatus =
            payload.moderationStatus?.toLowerCase() ||
            (payload.status === 'APPROVE' ? 'approved' : payload.status === 'REJECT' ? 'rejected' : undefined)

        await apiClient.put(`/api/admin/rooms/${roomId}/moderation`, {
            approvalStatus,
        })
    },

    getAnnouncements: async (): Promise<Announcement[]> => {
        const { data } = await apiClient.get('/api/admin/announcements')
        return data
    },

    createAnnouncement: async (payload: { title: string; content: string; targetRole?: string }): Promise<Announcement> => {
        const { data } = await apiClient.post('/api/admin/announcements', payload)
        return data
    },
}
