import apiClient from './client'
import type { Notification } from '@/types'

type RawNotification = {
    id: number
    title: string
    content: string
    type?: string | null
    isRead: boolean
    createdAt: string
}

function mapNotification(item: RawNotification): Notification {
    return {
        id: item.id,
        title: item.title,
        body: item.content,
        content: item.content,
        type: item.type || undefined,
        isRead: item.isRead,
        createdAt: item.createdAt,
    }
}

export const notificationApi = {
    getMyNotifications: async (): Promise<Notification[]> => {
        const { data } = await apiClient.get<RawNotification[]>('/api/notifications/my')
        return data.map(mapNotification)
    },

    getNotificationById: async (id: number): Promise<Notification> => {
        const { data } = await apiClient.get<RawNotification>(`/api/notifications/${id}`)
        return mapNotification(data)
    },

    markRead: async (id: number): Promise<void> => {
        await apiClient.post(`/api/notifications/${id}/read`)
    },

    markAllRead: async (): Promise<void> => {
        await apiClient.post('/api/notifications/read-all')
    },
}
