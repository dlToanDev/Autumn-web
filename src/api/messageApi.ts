import apiClient from './client'
import type { Conversation, Message, User } from '@/types'

type RawConversation = {
    otherUserId: number
    otherUserName: string
    otherUserAvatarUrl?: string | null
    otherUserRoleCode?: string
    otherUserRoleName?: string
    lastMessagePreview?: string
    lastMessageSenderId?: number
    lastMessageAt?: string
    unreadCount: number
}

export const messageApi = {
    getConversations: async (): Promise<Conversation[]> => {
        const { data } = await apiClient.get<RawConversation[]>('/api/messages/conversations')
        return data.map((item) => ({
            otherUserId: item.otherUserId,
            otherUserName: item.otherUserName,
            otherUserAvatarUrl: item.otherUserAvatarUrl || undefined,
            otherUserAvatar: item.otherUserAvatarUrl || undefined,
            otherUserRoleCode: item.otherUserRoleCode,
            otherUserRoleName: item.otherUserRoleName,
            lastMessage: item.lastMessagePreview || '',
            lastMessageSenderId: item.lastMessageSenderId,
            lastMessageAt: item.lastMessageAt,
            unreadCount: item.unreadCount,
        }))
    },

    getContacts: async (): Promise<User[]> => {
        const { data } = await apiClient.get('/api/messages/contacts')
        return data
    },

    getMessagesWithUser: async (otherUserId: number): Promise<Message[]> => {
        const { data } = await apiClient.get(`/api/messages/with/${otherUserId}`)
        return data
    },

    sendMessage: async (otherUserId: number, content: string): Promise<Message> => {
        const { data } = await apiClient.post(`/api/messages/with/${otherUserId}`, { content })
        return data
    },

    markRead: async (otherUserId: number): Promise<void> => {
        await apiClient.post(`/api/messages/with/${otherUserId}/read`)
    },
}
