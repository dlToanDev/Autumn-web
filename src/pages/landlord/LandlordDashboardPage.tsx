import { useQuery } from '@tanstack/react-query'
import { BedDouble, FileText, CreditCard, Users } from 'lucide-react'
import ManagementLayout from '@/components/layout/ManagementLayout'
import StatCard from '@/components/ui/StatCard'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Skeleton'
import { rentalApi } from '@/api/rentalApi'
import { bookingApi } from '@/api/bookingApi'
import { contractApi } from '@/api/contractApi'
import { paymentApi } from '@/api/paymentApi'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function LandlordDashboardPage() {
  const currentUser = useAuthStore((s) => s.user)
  const currentUserId = Number(currentUser?.id || 0)
  const { data: rooms = [], isLoading: lr } = useQuery({ queryKey: ['landlord-rooms'], queryFn: () => rentalApi.getLandlordRooms() })
  const { data: properties = [] } = useQuery({ queryKey: ['landlord-properties'], queryFn: () => rentalApi.getLandlordProperties() })
  const { data: bookings = [], isLoading: lb } = useQuery({ queryKey: ['landlord-bookings'], queryFn: bookingApi.getLandlordBookings })
  const { data: contracts = [] } = useQuery({ queryKey: ['landlord-contracts'], queryFn: contractApi.getLandlordContracts })
  const { data: payments = [] } = useQuery({ queryKey: ['landlord-payments'], queryFn: paymentApi.getMyPayments })

  const available = rooms.filter((r) => r.status === 'AVAILABLE').length
  const totalRooms = properties.reduce((sum, p) => sum + (p.roomCount || 0), 0)
  const pendingBookings = bookings.filter((b) => b.status === 'PENDING').length
  const activeContracts = contracts.filter((c) => c.status === 'ACTIVE').length
  const totalRentRevenue = payments
    .filter((payment) => {
      const status = String(payment.status || '').toUpperCase()
      const type = String(payment.paymentType || payment.type || '').toUpperCase()
      return (status === 'PAID' || status === 'SUCCESS') &&
        type === 'RENT' &&
        (currentUserId <= 0 || Number(payment.payeeUserId || payment.payeeId || 0) === currentUserId)
    })
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0)

  if (lr || lb) return <ManagementLayout role="LANDLORD"><PageLoader /></ManagementLayout>

  return (
    <ManagementLayout role="LANDLORD">
      <div className="p-6 max-w-6xl mx-auto">
        <h1 className="text-2xl font-display font-bold text-[#292524] mb-6">Tổng quan</h1>

        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <StatCard title="Tổng số phòng" value={totalRooms} icon={<BedDouble size={20} />} color="primary" />
          <StatCard title="Phòng trống" value={available} icon={<BedDouble size={20} />} color="primary" />
          <StatCard title="Chờ phê duyệt" value={pendingBookings} icon={<FileText size={20} />} color="brown" />
          <StatCard title="Hợp đồng đang thuê" value={activeContracts} icon={<Users size={20} />} color="accent" />
          <StatCard title="Tổng doanh thu" value={formatCurrency(totalRentRevenue)} icon={<CreditCard size={20} />} color="secondary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Recent booking requests */}
          <Card>
            <CardHeader><CardTitle>Yêu cầu thuê gần đây</CardTitle></CardHeader>
            <div className="px-5 pb-5 space-y-3">
              {bookings.slice(0, 5).length > 0 ? bookings.slice(0, 5).map((b) => (
                <div key={b.id} className="flex items-center justify-between py-2 border-b border-[#F5F5F4] last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#292524] truncate">{b.tenantName || `Khách #${b.tenantId}`}</p>
                    <p className="text-xs text-[#A8A29E]">{b.roomTitle || `Phòng #${b.roomId}`} · {formatDate(b.createdAt)}</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(b.status)} size="sm">{getStatusLabel(b.status)}</Badge>
                </div>
              )) : <p className="text-sm text-center text-[#A8A29E] py-4">Chưa có yêu cầu nào</p>}
            </div>
          </Card>

          {/* Room summary */}
          <Card>
            <CardHeader><CardTitle>Danh sách phòng</CardTitle></CardHeader>
            <div className="px-5 pb-5 space-y-3">
              {rooms.slice(0, 5).length > 0 ? rooms.slice(0, 5).map((r) => (
                <div key={r.id} className="flex items-center justify-between py-2 border-b border-[#F5F5F4] last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[#292524] truncate">{r.title}</p>
                    <p className="text-xs text-[#A8A29E]">{formatCurrency(r.price)}/tháng</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(r.status)} size="sm">{getStatusLabel(r.status)}</Badge>
                </div>
              )) : <p className="text-sm text-center text-[#A8A29E] py-4">Chưa có phòng nào</p>}
            </div>
          </Card>
        </div>
      </div>
    </ManagementLayout>
  )
}
