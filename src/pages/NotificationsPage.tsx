import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import PublicLayout from '@/components/layout/PublicLayout'
import Button from '@/components/ui/Button'
import { PageLoader, EmptyState } from '@/components/ui/Skeleton'
import { notificationApi } from '@/api/notificationApi'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function NotificationsPage() {
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: notificationApi.getMyNotifications,
  })

  const { mutate: markAll, isPending } = useMutation({
    mutationFn: notificationApi.markAllRead,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-notifications'] }); toast.success('Đã đánh dấu đã đọc') },
  })

  const { mutate: markOne } = useMutation({
    mutationFn: notificationApi.markRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-notifications'] }),
  })

  const handleClick = (n: any) => {
    if (!n.isRead) markOne(n.id)
    navigate(`/notifications/${n.id}`)
  }

  const unread = notifications.filter((n) => !n.isRead).length

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-[#292524]">Thông báo</h1>
            {unread > 0 && <p className="text-sm text-[#78716C] mt-0.5">{unread} thông báo chưa đọc</p>}
          </div>
          {unread > 0 && (
            <Button size="sm" variant="outline" leftIcon={<CheckCheck size={14} />} onClick={() => markAll()} loading={isPending}>
              Đọc tất cả
            </Button>
          )}
        </div>

        {isLoading ? <PageLoader /> : notifications.length === 0 ? (
          <EmptyState title="Chưa có thông báo" description="Các thông báo từ hệ thống sẽ hiện tại đây" icon={<Bell size={28} />} />
        ) : (
          <div className="space-y-2">
            {notifications.map((n) => (
              <button key={n.id} onClick={() => handleClick(n)} className={cn(
                'w-full text-left rounded-[12px] border px-4 py-3.5 flex gap-3 hover:border-[#C96A3D]/30 transition-colors cursor-pointer',
                n.isRead ? 'bg-white border-[#E7E5E4]' : 'bg-[#FFF8F3] border-[#C96A3D]/20',
              )}>
                <div className={cn('w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5', n.isRead ? 'bg-[#F5F0EC]' : 'bg-[#C96A3D]/15')}>
                  <Bell size={16} className={n.isRead ? 'text-[#A8A29E]' : 'text-[#C96A3D]'} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={cn('text-sm', n.isRead ? 'text-[#57534E]' : 'font-semibold text-[#292524]')}>{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-[#C96A3D] flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-[#A8A29E] mt-0.5 line-clamp-2">{n.content}</p>
                  <p className="text-xs text-[#C0B8B0] mt-1">{formatDateTime(n.createdAt)}</p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
