import apiClient from './client'
import type { RentalContract } from '@/types'

export const contractApi = {
    getLandlordContracts: async (): Promise<RentalContract[]> => {
        const { data } = await apiClient.get('/api/contracts/landlord')
        return data
    },

    getLandlordContractById: async (contractId: number): Promise<RentalContract> => {
        const { data } = await apiClient.get(`/api/contracts/landlord/${contractId}`)
        return data
    },

    createContract: async (payload: {
        bookingRequestId: number
        startDate: string
        endDate: string
        monthlyRent?: number
        depositAmount?: number
        terms?: string
    }): Promise<RentalContract> => {
        const { data } = await apiClient.post('/api/contracts/landlord', payload)
        return data
    },

    uploadLandlordFile: async (contractId: number, fileUrl: string): Promise<RentalContract> => {
        const { data } = await apiClient.post(`/api/contracts/landlord/${contractId}/landlord-file`, { fileUrl })
        return data
    },

    updateContract: async (contractId: number, payload: { startDate: string; endDate: string; terms?: string }): Promise<RentalContract> => {
        const { data } = await apiClient.put(`/api/contracts/landlord/${contractId}`, payload)
        return data
    },

    terminateContract: async (contractId: number): Promise<RentalContract> => {
        const { data } = await apiClient.patch(`/api/contracts/landlord/${contractId}/terminate`)
        return data
    },

    terminateContractWithReason: async (contractId: number, reason: string): Promise<RentalContract> => {
        const { data } = await apiClient.patch(`/api/contracts/landlord/${contractId}/terminate-with-reason`, { reason })
        return data
    },

    terminateMyContract: async (contractId: number, reason: string): Promise<RentalContract> => {
        const { data } = await apiClient.patch(`/api/contracts/my/${contractId}/terminate`, { reason })
        return data
    },

    getMyContracts: async (): Promise<RentalContract[]> => {
        const { data } = await apiClient.get('/api/contracts/my')
        return data
    },

    getMyContractById: async (contractId: number): Promise<RentalContract> => {
        const { data } = await apiClient.get(`/api/contracts/my/${contractId}`)
        return data
    },

    uploadTenantFile: async (contractId: number, fileUrl: string): Promise<RentalContract> => {
        const { data } = await apiClient.post(`/api/contracts/my/${contractId}/tenant-file`, { fileUrl })
        return data
    },

    getAdminContracts: async (): Promise<RentalContract[]> => {
        const { data } = await apiClient.get('/api/contracts/admin')
        return data
    },

    getAdminContractById: async (contractId: number): Promise<RentalContract> => {
        const { data } = await apiClient.get(`/api/contracts/admin/${contractId}`)
        return data
    },
}
