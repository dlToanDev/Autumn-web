import { useState, useEffect, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Send, MessageSquare, Search } from 'lucide-react'
import PublicLayout from '@/components/layout/PublicLayout'
import Avatar from '@/components/ui/Avatar'
import { PageLoader, EmptyState } from '@/components/ui/Skeleton'
import { messageApi } from '@/api/messageApi'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime, cn } from '@/lib/utils'

export default function MessagesPage() {
  const [params, setParams] = useSearchParams()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeUserId = params.get('userId') ? Number(params.get('userId')) : null
  const [text, setText] = useState('')
  const [convSearch, setConvSearch] = useState('')

  const { data: conversations = [], isLoading: loadingConv } = useQuery({
    queryKey: ['conversations'],
    queryFn: messageApi.getConversations,
    refetchInterval: 5000,
  })

  const { data: messages = [], isLoading: loadingMsgs } = useQuery({
    queryKey: ['messages', activeUserId],
    queryFn: () => messageApi.getMessagesWithUser(activeUserId!),
    enabled: !!activeUserId,
    refetchInterval: 5000,
  })

  const { mutate: send, isPending } = useMutation({
    mutationFn: () => messageApi.sendMessage(activeUserId!, text.trim()),
    onSuccess: () => { setText(''); qc.invalidateQueries({ queryKey: ['messages', activeUserId] }); qc.invalidateQueries({ queryKey: ['conversations'] }) },
  })

  // Mark as read when opening conversation
  useEffect(() => {
    if (activeUserId) messageApi.markRead(activeUserId).catch(() => {})
  }, [activeUserId])

  // Scroll to bottom when messages load
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const activeConv = conversations.find((c) => c.otherUserId === activeUserId)
  const filteredConversations = convSearch.trim()
    ? conversations.filter((c) => c.otherUserName?.toLowerCase().includes(convSearch.toLowerCase()))
    : conversations

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (text.trim() && activeUserId) send() }
  }

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 py-6 h-[calc(100vh-80px)] flex flex-col">
        <h1 className="text-xl font-display font-bold text-[#292524] mb-4 flex-shrink-0">Tin nhắn</h1>

        <div className="flex gap-4 flex-1 min-h-0 bg-white rounded-[16px] border border-[#E7E5E4] overflow-hidden">
          {/* Conversation list */}
          <div className="w-72 flex-shrink-0 border-r border-[#F0E9E0] flex flex-col overflow-hidden">
            {/* Search bar */}
            <div className="p-3 border-b border-[#F0E9E0] flex-shrink-0">
              <div className="flex items-center gap-2 bg-[#F5F0EC] rounded-[10px] px-3 h-9">
                <Search size={14} className="text-[#A8A29E] shrink-0" />
                <input
                  type="text"
                  value={convSearch}
                  onChange={(e) => setConvSearch(e.target.value)}
                  placeholder="Tìm người nhắn tin..."
                  className="flex-1 text-sm bg-transparent outline-none text-[#292524] placeholder:text-[#A8A29E]"
                />
              </div>
            </div>
            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loadingConv ? <PageLoader /> : filteredConversations.length === 0 ? (
                <div className="p-6">
                  <EmptyState
                    title={convSearch ? 'Không tìm thấy' : 'Chưa có cuộc trò chuyện'}
                    icon={<MessageSquare size={24} />}
                  />
                </div>
              ) : (
                filteredConversations.map((c) => (
                  <button key={c.otherUserId} onClick={() => setParams({ userId: String(c.otherUserId) })} className={cn(
                    'w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-[#FBF7F3] transition-colors border-b border-[#F5F0EC]',
                    activeUserId === c.otherUserId && 'bg-[#FFF8F3]',
                  )}>
                    <Avatar name={c.otherUserName} src={c.otherUserAvatarUrl} size="md" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className={cn('text-sm', c.unreadCount ? 'font-semibold text-[#292524]' : 'text-[#44403C]')}>{c.otherUserName}</p>
                        {c.unreadCount > 0 && (
                          <span className="w-5 h-5 rounded-full bg-[#C96A3D] text-white text-[10px] flex items-center justify-center font-bold">{c.unreadCount}</span>
                        )}
                      </div>
                      <p className="text-xs text-[#A8A29E] mt-0.5 line-clamp-1">{c.lastMessage}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Message thread */}
          <div className="flex-1 flex flex-col min-w-0">
            {!activeUserId ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState title="Chọn cuộc trò chuyện" description="Chọn một tin nhắn từ danh sách bên trái để bắt đầu" icon={<MessageSquare size={32} />} />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-4 py-3 border-b border-[#F0E9E0] flex items-center gap-3 flex-shrink-0">
                  {activeConv && <Avatar name={activeConv.otherUserName} src={activeConv.otherUserAvatarUrl} size="sm" />}
                  <span className="text-sm font-semibold text-[#292524]">{activeConv?.otherUserName || `User #${activeUserId}`}</span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {loadingMsgs ? <PageLoader /> : messages.map((m) => {
                    const isMe = m.senderId === user?.id
                    return (
                      <div key={m.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[65%] rounded-[12px] px-3.5 py-2.5 text-sm', isMe ? 'bg-[#C96A3D] text-white' : 'bg-[#F5F0EC] text-[#292524]')}>
                          <p className="whitespace-pre-wrap">{m.content}</p>
                          <p className={cn('text-[10px] mt-1', isMe ? 'text-white/70' : 'text-[#A8A29E]')}>{formatDateTime(m.createdAt)}</p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="px-4 py-3 border-t border-[#F0E9E0] flex gap-2 flex-shrink-0">
                  <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} rows={1} placeholder="Nhập tin nhắn..."
                    className="flex-1 rounded-[10px] border border-[#D6D3D1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30 focus:border-[#C96A3D] resize-none" />
                  <button onClick={() => { if (text.trim() && activeUserId) send() }} disabled={!text.trim() || isPending || !activeUserId}
                    className="w-10 h-10 rounded-[10px] bg-[#C96A3D] hover:bg-[#B55C32] disabled:opacity-40 flex items-center justify-center transition-colors flex-shrink-0">
                    <Send size={16} className="text-white" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}
