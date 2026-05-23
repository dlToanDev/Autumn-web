import { Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { BedDouble, FileText, CreditCard, Bell, ArrowRight } from 'lucide-react'
import PublicLayout from '@/components/layout/PublicLayout'
import StatCard from '@/components/ui/StatCard'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Skeleton'
import { bookingApi } from '@/api/bookingApi'
import { contractApi } from '@/api/contractApi'
import { paymentApi } from '@/api/paymentApi'
import { notificationApi } from '@/api/notificationApi'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function UserHomePage() {
  const { user } = useAuthStore()

  const { data: bookings = [], isLoading: loadingB } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: bookingApi.getMyBookings,
  })
  const { data: contracts = [], isLoading: loadingC } = useQuery({
    queryKey: ['my-contracts'],
    queryFn: contractApi.getMyContracts,
  })
  const { data: payments = [], isLoading: loadingP } = useQuery({
    queryKey: ['my-payments'],
    queryFn: paymentApi.getMyPayments,
  })
  const { data: notifications = [] } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: notificationApi.getMyNotifications,
  })

  const unread = notifications.filter((n) => !n.isRead).length
  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE').length
  const pendingBookings = bookings.filter((b) => b.status === 'PENDING').length

  if (loadingB || loadingC || loadingP) return <PublicLayout><PageLoader /></PublicLayout>

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-display font-bold text-[#292524]">Xin chào, {user?.fullName || user?.email}!</h1>
          <p className="text-sm text-[#78716C] mt-1">Quản lý đặt phòng và hợp đồng của bạn</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Yêu cầu chờ" value={pendingBookings} icon={<BedDouble size={20} />} color="primary" />
          <StatCard title="Hợp đồng đang thuê" value={activeContracts} icon={<FileText size={20} />} color="brown" />
          <StatCard title="Thông báo chưa đọc" value={unread} icon={<Bell size={20} />} color="accent" />
          <StatCard title="Thanh toán" value={payments.length} icon={<CreditCard size={20} />} color="secondary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent bookings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Yêu cầu thuê phòng gần đây</CardTitle>
                <Link to="/rooms" className="text-xs text-[#C96A3D] flex items-center gap-1 hover:underline">
                  Tìm phòng <ArrowRight size={12} />
                </Link>
              </div>
            </CardHeader>
            <div className="px-5 pb-5 space-y-3">
              {bookings.slice(0, 4).length > 0 ? (
                bookings.slice(0, 4).map((b) => (
                  <div key={b.id} className="flex items-center justify-between py-2.5 border-b border-[#F5F5F4] last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#292524] truncate">{b.roomTitle || `Phòng #${b.roomId}`}</p>
                      <p className="text-xs text-[#A8A29E]">{formatDate(b.createdAt)}</p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(b.status)} size="sm">{getStatusLabel(b.status)}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#A8A29E] py-4 text-center">Chưa có yêu cầu nào</p>
              )}
            </div>
          </Card>

          {/* Recent contracts */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Hợp đồng của tôi</CardTitle>
                <Link to="/user/contracts" className="text-xs text-[#C96A3D] flex items-center gap-1 hover:underline">
                  Xem tất cả <ArrowRight size={12} />
                </Link>
              </div>
            </CardHeader>
            <div className="px-5 pb-5 space-y-3">
              {contracts.slice(0, 4).length > 0 ? (
                contracts.slice(0, 4).map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-2.5 border-b border-[#F5F5F4] last:border-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[#292524] truncate">{c.roomTitle || `HĐ #${c.id}`}</p>
                      <p className="text-xs text-[#A8A29E]">
                        {c.startDate && c.endDate ? `${formatDate(c.startDate)} – ${formatDate(c.endDate)}` : formatDate(c.createdAt)}
                      </p>
                    </div>
                    <Badge variant={getStatusBadgeVariant(c.status)} size="sm">{getStatusLabel(c.status)}</Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-[#A8A29E] py-4 text-center">Chưa có hợp đồng nào</p>
              )}
            </div>
          </Card>
        </div>

        {/* Quick links */}
        <div className="mt-5 flex flex-wrap gap-3">
          <Link to="/rooms">
            <button className="flex items-center gap-2 text-sm font-medium text-[#C96A3D] border border-[#C96A3D]/40 px-4 py-2 rounded-[10px] hover:bg-[#C96A3D]/5 transition-colors">
              <BedDouble size={16} /> Tìm phòng trọ
            </button>
          </Link>
          <Link to="/notifications">
            <button className="flex items-center gap-2 text-sm font-medium text-[#57534E] border border-[#E7E5E4] px-4 py-2 rounded-[10px] hover:bg-[#F5F5F4] transition-colors">
              <Bell size={16} /> Thông báo {unread > 0 && `(${unread})`}
            </button>
          </Link>
          <Link to="/messages">
            <button className="flex items-center gap-2 text-sm font-medium text-[#57534E] border border-[#E7E5E4] px-4 py-2 rounded-[10px] hover:bg-[#F5F5F4] transition-colors">
              Nhắn tin
            </button>
          </Link>
        </div>
      </div>
    </PublicLayout>
  )
}
