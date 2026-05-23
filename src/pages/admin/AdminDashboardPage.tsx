import { useQuery } from '@tanstack/react-query'
import { Users, BedDouble, FileText, CreditCard, Building2, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import ManagementLayout from '@/components/layout/ManagementLayout'
import StatCard from '@/components/ui/StatCard'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Skeleton'
import { adminApi } from '@/api/adminApi'
import { formatCurrency, formatDate } from '@/lib/utils'

export default function AdminDashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: adminApi.getDashboard,
  })

  if (isLoading) return <ManagementLayout role="ADMIN"><PageLoader /></ManagementLayout>

  return (
    <ManagementLayout role="ADMIN">
      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-2xl font-display font-bold text-[#292524] mb-6">Tổng quan hệ thống</h1>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatCard title="Tổng người dùng" value={stats?.totalUsers ?? 0} icon={<Users size={20} />} color="primary" />
          <StatCard title="Tổng phòng" value={stats?.totalRooms ?? 0} icon={<BedDouble size={20} />} color="brown" />
          <StatCard title="Hợp đồng đang thuê" value={stats?.activeContracts ?? 0} icon={<FileText size={20} />} color="accent" />
          <StatCard title="Doanh thu tháng này" value={formatCurrency(stats?.monthlyRevenue ?? 0)} icon={<CreditCard size={20} />} color="secondary" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-5">
          {/* Pending rooms */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Phòng chờ duyệt</CardTitle>
                <Link to="/admin/rooms" className="text-xs text-[#C96A3D] flex items-center gap-1 hover:underline">Xem tất <ArrowRight size={12} /></Link>
              </div>
            </CardHeader>
            <div className="px-5 pb-5">
              <p className="text-3xl font-display font-bold text-[#C96A3D]">{stats?.pendingRooms ?? 0}</p>
              <p className="text-sm text-[#78716C]">phòng chờ kiểm duyệt</p>
            </div>
          </Card>

          {/* Pending applications */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Đơn chủ trọ chờ duyệt</CardTitle>
                <Link to="/admin/landlord-applications" className="text-xs text-[#C96A3D] flex items-center gap-1 hover:underline">Xem tất <ArrowRight size={12} /></Link>
              </div>
            </CardHeader>
            <div className="px-5 pb-5">
              <p className="text-3xl font-display font-bold text-amber-600">{stats?.pendingApplications ?? 0}</p>
              <p className="text-sm text-[#78716C]">đơn chờ xét duyệt</p>
            </div>
          </Card>

          {/* Commission */}
          <Card>
            <CardHeader><CardTitle>Hoa hồng tháng này</CardTitle></CardHeader>
            <div className="px-5 pb-5">
              <p className="text-3xl font-display font-bold text-emerald-600">{formatCurrency(stats?.monthlyCommission ?? 0)}</p>
              <p className="text-sm text-[#78716C]">đã thu</p>
            </div>
          </Card>
        </div>
      </div>
    </ManagementLayout>
  )
}
