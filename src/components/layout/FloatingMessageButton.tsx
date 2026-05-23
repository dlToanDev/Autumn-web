import { Link, useLocation } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { messageApi } from '@/api/messageApi'
import { useAuthStore } from '@/store/authStore'

export default function FloatingMessageButton() {
  const location = useLocation()
  const { isLoggedIn } = useAuthStore()

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: messageApi.getConversations,
    enabled: isLoggedIn,
    refetchInterval: 10000,
  })

  if (!isLoggedIn || location.pathname.startsWith('/messages')) return null

  const unreadCount = conversations.reduce((total, item) => total + Number(item.unreadCount || 0), 0)

  return (
    <Link
      to="/messages"
      className="fixed right-4 bottom-4 z-40 flex items-center gap-3 rounded-full bg-[#2C1F14] text-white px-4 py-3 shadow-[0_18px_48px_-18px_rgb(0_0_0/0.45)] hover:bg-[#3A291C] transition-colors"
      aria-label="Mở tin nhắn"
    >
      <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-[#C96A3D]">
        <MessageCircle size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-white text-[#2C1F14] text-[10px] font-bold flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </span>
      <span className="hidden sm:block">
        <span className="block text-sm font-semibold">Tin nhắn</span>
        <span className="block text-xs text-white/70">Mở hộp thư nhanh</span>
      </span>
    </Link>
  )
}
