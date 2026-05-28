import { useState, useEffect, useMemo, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useSearchParams } from 'react-router-dom'
import { Send, MessageSquare, Search } from 'lucide-react'
import PublicLayout from '@/components/layout/PublicLayout'
import Avatar from '@/components/ui/Avatar'
import { PageLoader, EmptyState } from '@/components/ui/Skeleton'
import { messageApi } from '@/api/messageApi'
import { useAuthStore } from '@/store/authStore'
import { formatDateTime, cn } from '@/lib/utils'
import type { User } from '@/types'

function getRoleLabel(user?: User | null) {
  const role = String(user?.roleName || user?.roleCode || '').trim()
  if (!role) return user?.email || 'Người dùng'
  return user?.email ? `${role} · ${user.email}` : role
}

export default function MessagesPage() {
  const [params, setParams] = useSearchParams()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const activeUserId = params.get('userId') ? Number(params.get('userId')) : null
  const [text, setText] = useState('')
  const [convSearch, setConvSearch] = useState('')
  const [selectedContact, setSelectedContact] = useState<User | null>(null)
  const searchTerm = convSearch.trim()

  const { data: conversations = [], isLoading: loadingConv } = useQuery({
    queryKey: ['conversations'],
    queryFn: messageApi.getConversations,
    refetchInterval: 5000,
  })

  const { data: contacts = [], isLoading: loadingContacts } = useQuery({
    queryKey: ['message-contacts', searchTerm],
    queryFn: () => messageApi.getContacts(searchTerm),
    enabled: searchTerm.length >= 2,
    staleTime: 30000,
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
  const activeContact = selectedContact?.id === activeUserId
    ? selectedContact
    : contacts.find((c) => c.id === activeUserId)
  const activeName = activeConv?.otherUserName || activeContact?.fullName || `User #${activeUserId}`
  const activeAvatar = activeConv?.otherUserAvatarUrl || activeContact?.avatarUrl

  const filteredConversations = searchTerm
    ? conversations.filter((c) => {
      const keyword = searchTerm.toLowerCase()
      return [
        c.otherUserName,
        c.otherUserRoleName,
        c.otherUserRoleCode,
        c.lastMessage,
      ].filter(Boolean).some((value) => String(value).toLowerCase().includes(keyword))
    })
    : conversations
  const conversationResultIds = useMemo(
    () => new Set(filteredConversations.map((item) => item.otherUserId)),
    [filteredConversations],
  )
  const filteredContacts = searchTerm.length >= 2
    ? contacts.filter((item) => !conversationResultIds.has(item.id)).slice(0, 20)
    : []
  const hasSearchResults = filteredConversations.length > 0 || filteredContacts.length > 0

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); if (text.trim() && activeUserId) send() }
  }

  return (
    <PublicLayout>
      <div className="mx-auto flex min-h-[calc(100vh-80px)] max-w-5xl flex-col px-3 py-4 sm:px-4 sm:py-6 md:h-[calc(100vh-80px)]">
        <h1 className="text-xl font-display font-bold text-[#292524] mb-4 flex-shrink-0">Tin nhắn</h1>

        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[16px] border border-[#E7E5E4] bg-white md:flex-row">
          {/* Conversation list */}
          <div className="flex max-h-[42vh] w-full flex-shrink-0 flex-col overflow-hidden border-b border-[#F0E9E0] md:max-h-none md:w-72 md:border-b-0 md:border-r">
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
              {loadingConv ? <PageLoader /> : !hasSearchResults && !loadingContacts ? (
                <div className="p-6">
                  <EmptyState
                    title={searchTerm ? 'Không tìm thấy' : 'Chưa có cuộc trò chuyện'}
                    description={searchTerm && searchTerm.length < 2 ? 'Nhập ít nhất 2 ký tự để tìm người mới' : undefined}
                    icon={<MessageSquare size={24} />}
                  />
                </div>
              ) : (
                <>
                  {filteredConversations.map((c) => (
                  <button
                      key={`conversation-${c.otherUserId}`}
                      onClick={() => { setSelectedContact(null); setParams({ userId: String(c.otherUserId) }) }}
                      className={cn(
                        'w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-[#FBF7F3] transition-colors border-b border-[#F5F0EC] min-w-0',
                        activeUserId === c.otherUserId && 'bg-[#FFF8F3]',
                      )}
                    >
                      <Avatar name={c.otherUserName} src={c.otherUserAvatarUrl} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex min-w-0 items-center justify-between gap-2">
                          <p className={cn('text-sm truncate', c.unreadCount ? 'font-semibold text-[#292524]' : 'text-[#44403C]')}>{c.otherUserName}</p>
                          {c.unreadCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-[#C96A3D] text-white text-[10px] flex items-center justify-center font-bold shrink-0">{c.unreadCount}</span>
                          )}
                        </div>
                        <p className="text-xs text-[#A8A29E] mt-0.5 line-clamp-1">{c.lastMessage}</p>
                      </div>
                    </button>
                  ))}

                  {filteredContacts.map((contact) => (
                    <button
                      key={`contact-${contact.id}`}
                      onClick={() => { setSelectedContact(contact); setParams({ userId: String(contact.id) }) }}
                      className={cn(
                        'w-full text-left px-4 py-3.5 flex items-center gap-3 hover:bg-[#FBF7F3] transition-colors border-b border-[#F5F0EC]',
                        activeUserId === contact.id && 'bg-[#FFF8F3]',
                      )}
                    >
                      <Avatar name={contact.fullName} src={contact.avatarUrl} size="md" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[#292524] truncate">{contact.fullName}</p>
                        <p className="text-xs text-[#A8A29E] mt-0.5 line-clamp-1">{getRoleLabel(contact)}</p>
                      </div>
                    </button>
                  ))}

                  {loadingContacts && (
                    <div className="px-4 py-3 text-sm text-[#78716C]">Đang tìm người dùng...</div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Message thread */}
          <div className="flex min-h-[360px] min-w-0 flex-1 flex-col md:min-h-0">
            {!activeUserId ? (
              <div className="flex-1 flex items-center justify-center">
                <EmptyState title="Chọn cuộc trò chuyện" description="Chọn một tin nhắn từ danh sách bên trái để bắt đầu" icon={<MessageSquare size={32} />} />
              </div>
            ) : (
              <>
                {/* Header */}
                <div className="px-4 py-3 border-b border-[#F0E9E0] flex items-center gap-3 flex-shrink-0">
                  <Avatar name={activeName} src={activeAvatar} size="sm" />
                  <span className="min-w-0 truncate text-sm font-semibold text-[#292524]">{activeName}</span>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
                  {loadingMsgs ? <PageLoader /> : messages.map((m) => {
                    const isMe = m.senderId === user?.id
                    return (
                      <div key={m.id} className={cn('flex', isMe ? 'justify-end' : 'justify-start')}>
                        <div className={cn('max-w-[85%] rounded-[12px] px-3.5 py-2.5 text-sm sm:max-w-[75%] md:max-w-[65%]', isMe ? 'bg-[#C96A3D] text-white' : 'bg-[#F5F0EC] text-[#292524]')}>
                          <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          <p className={cn('text-[10px] mt-1', isMe ? 'text-white/70' : 'text-[#A8A29E]')}>{formatDateTime(m.createdAt)}</p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="flex flex-shrink-0 gap-2 border-t border-[#F0E9E0] px-3 py-3 sm:px-4">
                  <textarea value={text} onChange={(e) => setText(e.target.value)} onKeyDown={handleKeyDown} rows={1} placeholder="Nhập tin nhắn..."
                    className="min-w-0 flex-1 rounded-[10px] border border-[#D6D3D1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30 focus:border-[#C96A3D] resize-none" />
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
