import apiClient from './client'
import type { Amenity, Room, RoomFilters, Property, RoomReview } from '@/types'

type RoomUpsertPayload = Record<string, unknown>

function normalizeRoomFilters(params: RoomFilters) {
    const provinceId = params.provinceId ?? (params.provinceCode ? Number(params.provinceCode) : undefined)
    const districtId = params.districtId ?? (params.districtCode ? Number(params.districtCode) : undefined)
    const wardId = params.wardId ?? (params.wardCode ? Number(params.wardCode) : undefined)

    return {
        q: params.q ?? params.search,
        provinceId: Number.isFinite(provinceId) ? provinceId : undefined,
        districtId: Number.isFinite(districtId) ? districtId : undefined,
        wardId: Number.isFinite(wardId) ? wardId : undefined,
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        minArea: params.minArea,
        maxArea: params.maxArea,
        roomType: params.roomType || undefined,
        genderAllowed: params.genderAllowed || undefined,
        amenityIds: params.amenityIds?.length ? params.amenityIds.join(',') : undefined,
        status: (params as any).status || undefined,
    }
}

export const rentalApi = {
    getAmenities: async (): Promise<Amenity[]> => {
        const { data } = await apiClient.get('/api/amenities')
        return data
    },

    getRooms: async (params: RoomFilters = {}): Promise<Room[]> => {
        const { data } = await apiClient.get('/api/rooms', { params: normalizeRoomFilters(params) })
        return data
    },

    getRoomById: async (roomId: number): Promise<Room> => {
        const { data } = await apiClient.get(`/api/rooms/${roomId}`)
        return data
    },

    getRoomReviews: async (roomId: number): Promise<RoomReview[]> => {
        const { data } = await apiClient.get(`/api/rooms/${roomId}/reviews`)
        return data
    },

    // Landlord Properties
    getLandlordProperties: async (): Promise<Property[]> => {
        const { data } = await apiClient.get('/api/landlord/properties')
        return data
    },

    getLandlordPropertyById: async (propertyId: number): Promise<Property> => {
        const { data } = await apiClient.get(`/api/landlord/properties/${propertyId}`)
        return data
    },

    createProperty: async (payload: Record<string, unknown>): Promise<Property> => {
        const { data } = await apiClient.post('/api/landlord/properties', payload)
        return data
    },

    updateProperty: async (propertyId: number, payload: Record<string, unknown>): Promise<Property> => {
        const { data } = await apiClient.put(`/api/landlord/properties/${propertyId}`, payload)
        return data
    },

    deleteProperty: async (propertyId: number): Promise<void> => {
        await apiClient.delete(`/api/landlord/properties/${propertyId}`)
    },

    // Landlord Rooms
    getLandlordRooms: async (): Promise<Room[]> => {
        const { data } = await apiClient.get('/api/landlord/rooms')
        return data
    },

    getLandlordRoomById: async (roomId: number): Promise<Room> => {
        const { data } = await apiClient.get(`/api/landlord/rooms/${roomId}`)
        return data
    },

    createRoom: async (payload: RoomUpsertPayload): Promise<Room> => {
        const { data } = await apiClient.post('/api/landlord/rooms', payload)
        return data
    },

    updateRoom: async (roomId: number, payload: RoomUpsertPayload): Promise<Room> => {
        const { data } = await apiClient.put(`/api/landlord/rooms/${roomId}`, payload)
        return data
    },

    deleteRoom: async (roomId: number): Promise<void> => {
        await apiClient.delete(`/api/landlord/rooms/${roomId}`)
    },

    createReview: async (bookingId: number, payload: { rating: number; comment?: string }): Promise<RoomReview> => {
        const { data } = await apiClient.post(`/api/bookings/${bookingId}/reviews`, payload)
        return data
    },
}
