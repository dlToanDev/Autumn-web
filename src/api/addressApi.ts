import apiClient from './client'
import type { Province, District, Ward } from '@/types'


export const addressApi = {
    getProvinces: async (): Promise<Province[]> => {
        const { data } = await apiClient.get('/api/provinces')
        return data
    },

    getDistricts: async (provinceId?: string | number): Promise<District[]> => {
        const normalizedProvinceId = Number(provinceId)
        const { data } = await apiClient.get('/api/districts', {
            params: Number.isFinite(normalizedProvinceId) && normalizedProvinceId > 0
                ? { provinceId: normalizedProvinceId }
                : undefined,
        })
        return data
    },

    getWards: async (districtId?: string | number): Promise<Ward[]> => {
        const normalizedDistrictId = Number(districtId)
        const { data } = await apiClient.get('/api/wards', {
            params: Number.isFinite(normalizedDistrictId) && normalizedDistrictId > 0
                ? { districtId: normalizedDistrictId }
                : undefined,
        })
        return data
    },
}
