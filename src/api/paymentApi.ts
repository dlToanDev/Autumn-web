import apiClient from './client'
import type { Payment, CommissionBilling } from '@/types'

type RawPayment = {
    id: number
    paymentCode: string
    bookingRequestId?: number
    bookingCode?: string
    bookingStatus?: string
    roomId?: number
    roomTitle?: string
    propertyName?: string
    payerId?: number
    payerName?: string
    payeeUserId?: number | null
    payeeUserName?: string | null
    amount: number
    commissionRate?: number
    commissionAmount?: number
    netAmount?: number
    paymentType?: string
    paymentMethod?: string
    provider?: string
    bankCode?: string | null
    bankAccountNo?: string | null
    accountName?: string | null
    qrContent?: string | null
    description?: string | null
    billingYear?: number | null
    billingMonth?: number | null
    transferProofImageUrl?: string | null
    proofSubmittedAt?: string | null
    qrImageUrl?: string | null
    transactionRef?: string | null
    status: string
    paidAt?: string | null
    expiredAt?: string | null
    createdAt: string
    updatedAt?: string | null
    rentPaymentDetail?: RawRentPaymentDetail | null
}

type RawRentPaymentDetail = {
    id: number
    paymentId: number
    baseRent?: number
    baseRentFormatted?: string
    electricityUsage?: number | null
    electricityRate?: number | null
    electricityAmount?: number
    electricityFormatted?: string
    waterUsage?: number | null
    waterRate?: number | null
    waterAmount?: number
    waterFormatted?: string
    otherFees?: number
    otherFeesFormatted?: string
    totalAmount?: number
    totalAmountFormatted?: string
    notes?: string | null
    createdAt?: string
}

type RawCommissionBilling = {
    landlordId: number
    landlordName: string
    landlordEmail?: string | null
    landlordPhone?: string | null
    grossRevenue?: number
    totalGrossRevenue?: number
    commissionRate?: number
    commissionAmount: number
    latestPaymentCode?: string | null
    latestPaymentStatus?: string | null
    latestPaymentCreatedAt?: string | null
    latestPaymentPaidAt?: string | null
    billingYear: number
    billingMonth: number
}

function normalizePaymentStatus(status?: string | null): string {
    const normalized = (status || '').trim().toUpperCase()
    if (normalized === 'WAITING_CONFIRM' || normalized === 'PROOF_SUBMITTED') return 'PROOF_SUBMITTED'
    if (normalized === 'SUCCESS' || normalized === 'CONFIRMED' || normalized === 'PAID') return 'PAID'
    if (normalized === 'FAILED') return 'REJECTED'
    return normalized || 'PENDING'
}

function normalizePaymentType(type?: string | null): string {
    const normalized = (type || '').trim().toUpperCase()
    if (normalized === 'LISTING_FEE') return 'COMMISSION'
    if (normalized === 'LANDLORD_APPLICATION_FEE') return 'LANDLORD_REGISTRATION'
    return normalized || 'RENT'
}

function mapPayment(record: RawPayment): Payment {
    const rentPaymentDetail = record.rentPaymentDetail
    return {
        id: record.id,
        paymentCode: record.paymentCode,
        bookingRequestId: record.bookingRequestId || undefined,
        bookingCode: record.bookingCode || undefined,
        bookingStatus: record.bookingStatus || undefined,
        roomId: record.roomId || undefined,
        roomTitle: record.roomTitle || undefined,
        propertyName: record.propertyName || undefined,
        payerId: record.payerId || undefined,
        payerName: record.payerName || undefined,
        payeeUserId: record.payeeUserId || undefined,
        payeeUserName: record.payeeUserName || undefined,
        payeeId: record.payeeUserId || undefined,
        payeeName: record.payeeUserName || undefined,
        tenantName: record.payerName || undefined,
        landlordName: record.payeeUserName || undefined,
        amount: Number(record.amount || 0),
        commissionRate: Number(record.commissionRate || 0),
        commissionAmount: Number(record.commissionAmount || 0),
        netAmount: Number(record.netAmount || 0),
        type: normalizePaymentType(record.paymentType),
        paymentType: normalizePaymentType(record.paymentType),
        paymentMethod: record.paymentMethod || undefined,
        provider: record.provider || undefined,
        bankCode: record.bankCode || undefined,
        bankAccountNo: record.bankAccountNo || undefined,
        accountName: record.accountName || undefined,
        qrContent: record.qrContent || undefined,
        description: record.description || undefined,
        billingYear: record.billingYear || undefined,
        billingMonth: record.billingMonth || undefined,
        transferProofImageUrl: record.transferProofImageUrl || undefined,
        proofSubmittedAt: record.proofSubmittedAt || undefined,
        qrImageUrl: record.qrImageUrl || undefined,
        qrCodeUrl: record.qrImageUrl || undefined,
        qrUrl: record.qrImageUrl || undefined,
        qrDataUrl: record.qrImageUrl || undefined,
        transactionRef: record.transactionRef || undefined,
        status: normalizePaymentStatus(record.status),
        paidAt: record.paidAt || undefined,
        expiredAt: record.expiredAt || undefined,
        dueDate: record.expiredAt || undefined,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt || undefined,
        rentPaymentDetail: rentPaymentDetail
            ? {
                id: rentPaymentDetail.id,
                paymentId: rentPaymentDetail.paymentId,
                baseRent: Number(rentPaymentDetail.baseRent || 0),
                baseRentFormatted: rentPaymentDetail.baseRentFormatted || '',
                electricityUsage: rentPaymentDetail.electricityUsage ?? undefined,
                electricityRate: rentPaymentDetail.electricityRate ?? undefined,
                electricityAmount: Number(rentPaymentDetail.electricityAmount || 0),
                electricityFormatted: rentPaymentDetail.electricityFormatted || '',
                waterUsage: rentPaymentDetail.waterUsage ?? undefined,
                waterRate: rentPaymentDetail.waterRate ?? undefined,
                waterAmount: Number(rentPaymentDetail.waterAmount || 0),
                waterFormatted: rentPaymentDetail.waterFormatted || '',
                otherFees: Number(rentPaymentDetail.otherFees || 0),
                otherFeesFormatted: rentPaymentDetail.otherFeesFormatted || '',
                totalAmount: Number(rentPaymentDetail.totalAmount || 0),
                totalAmountFormatted: rentPaymentDetail.totalAmountFormatted || '',
                notes: rentPaymentDetail.notes || undefined,
                createdAt: rentPaymentDetail.createdAt || record.createdAt,
            }
            : undefined,
    }
}

function mapCommissionBilling(record: RawCommissionBilling): CommissionBilling {
    const billingCode = record.latestPaymentCode || `COMM-${record.landlordId}-${record.billingYear}${String(record.billingMonth).padStart(2, '0')}`
    const status = normalizePaymentStatus(record.latestPaymentStatus || (record.latestPaymentPaidAt ? 'PAID' : 'PENDING'))
    return {
        id: record.landlordId,
        landlordId: record.landlordId,
        landlordName: record.landlordName,
        landlordEmail: record.landlordEmail || undefined,
        landlordPhone: record.landlordPhone || undefined,
        grossRevenue: Number(record.grossRevenue || 0),
        totalGrossRevenue: Number(record.totalGrossRevenue || record.grossRevenue || 0),
        totalRevenue: Number(record.totalGrossRevenue || record.grossRevenue || 0),
        commissionRate: Number(record.commissionRate || 0),
        commissionAmount: Number(record.commissionAmount || 0),
        amount: Number(record.commissionAmount || 0),
        isPaid: status === 'PAID',
        status,
        paymentCode: record.latestPaymentCode || undefined,
        latestPaymentCode: record.latestPaymentCode || undefined,
        billingCode,
        billingMonth: `${String(record.billingMonth).padStart(2, '0')}/${record.billingYear}`,
        billingYear: record.billingYear,
        period: `${String(record.billingMonth).padStart(2, '0')}/${record.billingYear}`,
        dueDate: record.latestPaymentCreatedAt || undefined,
        createdAt: record.latestPaymentCreatedAt || undefined,
        paidAt: record.latestPaymentPaidAt || undefined,
    }
}

export const paymentApi = {
    getMyPayments: async (): Promise<Payment[]> => {
        const { data } = await apiClient.get<RawPayment[]>('/api/payments/my')
        return data.map(mapPayment)
    },

    createVietQr: async (payload: {
        bookingRequestId: number
        paymentType?: string
    }): Promise<Payment> => {
        const { data } = await apiClient.post('/api/payments/create-vietqr', payload)
        return mapPayment(data)
    },

    createLandlordVietQr: async (payload: {
        bookingRequestId: number
        paymentType?: string
        baseRent?: number
        electricityUsage?: number
        electricityRate?: number
        electricityAmount?: number
        waterUsage?: number
        waterRate?: number
        waterAmount?: number
        otherFees?: number
        notes?: string
    }): Promise<Payment> => {
        const { data } = await apiClient.post('/api/payments/landlord/create-vietqr', payload)
        return mapPayment(data)
    },

    getAdminCommissionBilling: async (params?: { year?: number; month?: number }): Promise<CommissionBilling[]> => {
        const { data } = await apiClient.get<RawCommissionBilling[]>('/api/payments/admin/commission-billing', { params })
        return data.map(mapCommissionBilling)
    },

    createAdminCommissionVietQr: async (payload: { landlordId: number; year?: number; month?: number }): Promise<Payment> => {
        const { data } = await apiClient.post('/api/payments/admin/create-commission-vietqr', payload)
        return mapPayment(data)
    },

    getPaymentByCode: async (paymentCode: string): Promise<Payment> => {
        const { data } = await apiClient.get<RawPayment>(`/api/payments/${paymentCode}`)
        return mapPayment(data)
    },

    deletePayment: async (paymentCode: string): Promise<void> => {
        await apiClient.delete(`/api/payments/${paymentCode}`)
    },

    submitProof: async (paymentCode: string, proofImageUrl: string): Promise<Payment> => {
        const { data } = await apiClient.post<RawPayment>(`/api/payments/${paymentCode}/submit-proof`, { proofImageUrl })
        return mapPayment(data)
    },

    landlordMarkPaid: async (paymentCode: string): Promise<Payment> => {
        const { data } = await apiClient.post<RawPayment>(`/api/payments/landlord/${paymentCode}/mark-paid`)
        return mapPayment(data)
    },

    adminMarkPaid: async (paymentCode: string): Promise<Payment> => {
        const { data } = await apiClient.post<RawPayment>(`/api/payments/admin/${paymentCode}/mark-paid`)
        return mapPayment(data)
    },
}
