import apiClient from './client'
import type { BookingRequest } from '@/types'

type RawBookingRequest = {
    id: number
    roomId: number
    roomTitle?: string | null
    tenantId: number
    tenantName?: string | null
    tenantEmail?: string | null
    tenantPhone?: string | null
    landlordId?: number | null
    landlordName?: string | null
    message?: string | null
    moveInDate?: string | null
    createdAt: string
    requestedAt?: string | null
    status: string
}

function normalizeBookingStatus(status?: string | null): BookingRequest['status'] {
    const normalized = (status || '').trim().toLowerCase()

    if (normalized === 'confirmed') return 'APPROVED'
    if (normalized === 'rejected' || normalized === 'canceled' || normalized === 'cancelled') return 'REJECTED'
    return 'PENDING'
}

function mapBooking(record: RawBookingRequest): BookingRequest {
    return {
        id: record.id,
        roomId: record.roomId,
        roomTitle: record.roomTitle || undefined,
        tenantId: record.tenantId,
        tenantName: record.tenantName || undefined,
        tenantEmail: record.tenantEmail || undefined,
        tenantPhone: record.tenantPhone || undefined,
        landlordId: record.landlordId || undefined,
        landlordName: record.landlordName || undefined,
        message: record.message || undefined,
        moveInDate: record.moveInDate || undefined,
        createdAt: record.requestedAt || record.createdAt,
        status: normalizeBookingStatus(record.status),
    }
}

export const bookingApi = {
    getMyBookings: async (): Promise<BookingRequest[]> => {
        const { data } = await apiClient.get<RawBookingRequest[]>('/api/bookings/my')
        return data.map(mapBooking)
    },

    createBooking: async (payload: {
        roomId: number
        message?: string
        moveInDate?: string
    }): Promise<BookingRequest> => {
        const { data } = await apiClient.post<RawBookingRequest>('/api/bookings', payload)
        return mapBooking(data)
    },

    getLandlordBookings: async (): Promise<BookingRequest[]> => {
        const { data } = await apiClient.get<RawBookingRequest[]>('/api/bookings/landlord')
        return data.map(mapBooking)
    },

    getLandlordBookingById: async (bookingId: number): Promise<BookingRequest> => {
        const { data } = await apiClient.get<RawBookingRequest>(`/api/bookings/landlord/${bookingId}`)
        return mapBooking(data)
    },

    reviewBooking: async (
        bookingId: number,
        payload: { status: 'APPROVED' | 'REJECTED'; note?: string },
    ): Promise<void> => {
        await apiClient.post(`/api/bookings/landlord/${bookingId}/review`, {
            action: payload.status === 'APPROVED' ? 'confirm' : 'reject',
        })
    },
}
