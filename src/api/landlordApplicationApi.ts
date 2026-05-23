import apiClient from './client'
import type { LandlordApplication } from '@/types'

type RawLandlordApplication = {
    id: number
    userId: number
    userFullName: string
    userEmail?: string | null
    userPhone?: string | null
    userAvatarUrl?: string | null
    userAddress?: string | null
    cccdNumber: string
    cccdFrontUrl: string
    cccdBackUrl: string
    rentalDocumentUrls: string[]
    note?: string | null
    status: string
    reviewedBy?: number | null
    reviewedByName?: string | null
    reviewedAt?: string | null
    rejectReason?: string | null
    registrationFeeAmount?: number
    registrationFeePaymentCode?: string | null
    registrationFeePaymentStatus?: string | null
    registrationFeePaidAt?: string | null
    registrationFeeExpiredAt?: string | null
    registrationFeeProofImageUrl?: string | null
    registrationFeeProofSubmittedAt?: string | null
    createdAt: string
    updatedAt: string
}

const upper = (value?: string | null) => (value || '').trim().toUpperCase()

function mapDocuments(item: RawLandlordApplication) {
    const docs: NonNullable<LandlordApplication['documents']> = []

    if (item.cccdFrontUrl) docs.push({ documentType: 'CCCD_FRONT', documentUrl: item.cccdFrontUrl, filePath: item.cccdFrontUrl, fileName: 'CCCD mặt trước' })
    if (item.cccdBackUrl) docs.push({ documentType: 'CCCD_BACK', documentUrl: item.cccdBackUrl, filePath: item.cccdBackUrl, fileName: 'CCCD mặt sau' })

    item.rentalDocumentUrls?.forEach((url, index) => {
        if (!url) return
        docs.push({ documentType: 'RENTAL_DOCUMENT', documentUrl: url, filePath: url, fileName: `Tài liệu ${index + 1}` })
    })

    return docs
}

function mapApplication(item: RawLandlordApplication): LandlordApplication {
    const status = upper(item.status)
    const feePaymentStatus = upper(item.registrationFeePaymentStatus)

    return {
        ...item,
        status: status as LandlordApplication['status'],
        userName: item.userFullName,
        userEmail: item.userEmail || undefined,
        note: item.note || item.rejectReason || undefined,
        documents: mapDocuments(item),
        applicantName: item.userFullName,
        applicantEmail: item.userEmail || undefined,
        applicantPhone: item.userPhone || undefined,
        businessAddress: item.userAddress || undefined,
        identityNumber: item.cccdNumber,
        description: item.note || undefined,
        reviewedByName: item.reviewedByName || undefined,
        rejectReason: item.rejectReason || undefined,
        isPaid: feePaymentStatus === 'SUCCESS',
        feePaymentCode: item.registrationFeePaymentCode || undefined,
        feePaymentStatus: feePaymentStatus || undefined,
        registrationFeePaymentCode: item.registrationFeePaymentCode || undefined,
        registrationFeePaymentStatus: feePaymentStatus || undefined,
        reviewedAt: item.reviewedAt || undefined,
        registrationFeePaidAt: item.registrationFeePaidAt || undefined,
        registrationFeeExpiredAt: item.registrationFeeExpiredAt || undefined,
        registrationFeeProofSubmittedAt: item.registrationFeeProofSubmittedAt || undefined,
        registrationFeeProofImageUrl: item.registrationFeeProofImageUrl || undefined,
    }
}

export const landlordApplicationApi = {
    submit: async (payload: {
        cccdNumber: string
        cccdFrontUrl: string
        cccdBackUrl: string
        rentalDocumentUrls: string[]
        note?: string
    }): Promise<LandlordApplication> => {
        const { data } = await apiClient.post('/api/landlord-applications/submit', payload)
        return mapApplication(data)
    },

    payRegistrationFee: async (payload?: { applicationId?: number }): Promise<{ paymentCode: string; qrUrl?: string; qrDataUrl?: string }> => {
        const { data } = await apiClient.post('/api/landlord-applications/registration-fee', payload)
        return {
            paymentCode: data.paymentCode,
            qrUrl: data.qrImageUrl || undefined,
            qrDataUrl: data.qrImageUrl || undefined,
        }
    },

    getMyApplication: async (): Promise<LandlordApplication | null> => {
        const { data } = await apiClient.get<RawLandlordApplication>('/api/landlord-applications/me')
        return data ? mapApplication(data) : null
    },

    getAdminApplications: async (filters?: { status?: string }): Promise<LandlordApplication[]> => {
        const { data } = await apiClient.get<RawLandlordApplication[]>('/api/landlord-applications/admin', {
            params: filters?.status ? { status: filters.status.toLowerCase() } : undefined,
        })
        return data.map(mapApplication)
    },

    getAdminApplicationById: async (id: number): Promise<LandlordApplication> => {
        const { data } = await apiClient.get<RawLandlordApplication>(`/api/landlord-applications/admin/${id}`)
        return mapApplication(data)
    },

    reviewApplication: async (
        id: number,
        payload: { status: 'APPROVED' | 'REJECTED'; note?: string },
    ): Promise<void> => {
        await apiClient.post(`/api/landlord-applications/admin/${id}/review`, {
            action: payload.status === 'APPROVED' ? 'approve' : 'reject',
            rejectReason: payload.status === 'REJECTED' ? payload.note?.trim() || undefined : undefined,
        })
    },
}
