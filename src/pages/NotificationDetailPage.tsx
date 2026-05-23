import { useQuery } from '@tanstack/react-query'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Bell } from 'lucide-react'
import PublicLayout from '@/components/layout/PublicLayout'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/Skeleton'
import { notificationApi } from '@/api/notificationApi'
import { formatDateTime } from '@/lib/utils'

export default function NotificationDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: notification, isLoading } = useQuery({
    queryKey: ['notification', id],
    queryFn: () => notificationApi.getNotificationById(Number(id)),
    enabled: !!id,
  })

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Button variant="ghost" leftIcon={<ArrowLeft size={16} />} onClick={() => navigate('/notifications')} className="mb-5">
          Quay lại thông báo
        </Button>

        {isLoading ? <PageLoader /> : !notification ? (
          <p className="text-[#78716C] text-sm">Không tìm thấy thông báo.</p>
        ) : (
          <div className="bg-white rounded-[16px] border border-[#E7E5E4] overflow-hidden">
            <div className="bg-[#FFF8F3] px-6 py-5 border-b border-[#F0E9E0] flex gap-3">
              <div className="w-10 h-10 rounded-full bg-[#C96A3D]/15 flex items-center justify-center flex-shrink-0">
                <Bell size={18} className="text-[#C96A3D]" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-[#292524]">{notification.title}</h1>
                <p className="text-xs text-[#A8A29E] mt-0.5">{formatDateTime(notification.createdAt)}</p>
              </div>
            </div>
            <div className="px-6 py-5">
              <p className="text-sm text-[#44403C] leading-relaxed whitespace-pre-wrap">{notification.content}</p>
            </div>
          </div>
        )}
      </div>
    </PublicLayout>
  )
}
