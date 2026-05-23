import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { BedDouble, Building2, CalendarDays, CheckCircle, Eye, QrCode, RefreshCw, Search, Users, WalletCards } from 'lucide-react'
import ManagementLayout from '@/components/layout/ManagementLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { EmptyState, TableSkeleton } from '@/components/ui/Skeleton'
import { Table, TableBody, TableHead, Td, Th, Tr } from '@/components/ui/Table'
import PaymentQrModal from '@/components/PaymentQrModal'
import { adminApi } from '@/api/adminApi'
import { paymentApi } from '@/api/paymentApi'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { AdminLandlord, AdminLandlordDetail, AdminLandlordProperty, CommissionBilling, Payment } from '@/types'

function getCurrentPeriod() {
  const today = new Date()
  return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`
}

function parsePeriod(period: string) {
  const [year, month] = period.split('-').map(Number)
  const today = new Date()
  return {
    year: Number.isFinite(year) && year > 0 ? year : today.getFullYear(),
    month: Number.isFinite(month) && month >= 1 && month <= 12 ? month : today.getMonth() + 1,
  }
}

function isPaid(status?: string) {
  const s = String(status || '').toUpperCase()
  return s === 'PAID' || s === 'SUCCESS'
}

function needsConfirmation(status?: string) {
  const s = String(status || '').toUpperCase()
  return s === 'PROOF_SUBMITTED' || s === 'WAITING_CONFIRM'
}

export default function AdminLandlordsPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [period, setPeriod] = useState(getCurrentPeriod)
  const [selectedLandlordId, setSelectedLandlordId] = useState<number | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [paymentError, setPaymentError] = useState('')
  const [paymentRefreshing, setPaymentRefreshing] = useState(false)

  const { year, month } = useMemo(() => parsePeriod(period), [period])

  const { data: landlords = [], isLoading: landlordsLoading } = useQuery({
    queryKey: ['admin-landlords'],
    queryFn: adminApi.getLandlords,
  })

  const { data: commissions = [], isLoading: commissionsLoading } = useQuery({
    queryKey: ['admin-commissions', year, month],
    queryFn: () => paymentApi.getAdminCommissionBilling({ year, month }),
  })

  const { data: landlordDetail, isFetching: detailLoading } = useQuery({
    queryKey: ['admin-landlord-detail', selectedLandlordId],
    queryFn: () => adminApi.getLandlordDetail(selectedLandlordId!),
    enabled: selectedLandlordId != null,
  })

  const commissionMap = useMemo(() => {
    return new Map(commissions.map((item) => [item.landlordId, item]))
  }, [commissions])

  const stats = useMemo(() => {
    return landlords.reduce(
      (acc, landlord) => {
        acc.landlords += 1
        acc.properties += landlord.propertyCount
        acc.rooms += landlord.roomCount
        acc.tenants += landlord.activeTenantCount
        acc.totalRevenue += landlord.totalGrossRevenue
        return acc
      },
      { landlords: 0, properties: 0, rooms: 0, tenants: 0, totalRevenue: 0 },
    )
  }, [landlords])

  const commissionTotal = useMemo(() => {
    return commissions.reduce((sum, item) => sum + Number(item.commissionAmount || item.amount || 0), 0)
  }, [commissions])

  const filteredLandlords = useMemo(() => {
    const normalized = search.trim().toLowerCase()
    if (!normalized) return landlords
    return landlords.filter((landlord) =>
      [landlord.fullName, landlord.email, landlord.phone]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(normalized)),
    )
  }, [landlords, search])

  const invalidateLandlords = () => {
    qc.invalidateQueries({ queryKey: ['admin-landlords'] })
    qc.invalidateQueries({ queryKey: ['admin-commissions'] })
    if (selectedLandlordId != null) {
      qc.invalidateQueries({ queryKey: ['admin-landlord-detail', selectedLandlordId] })
    }
  }

  const { mutate: genQr, isPending: qrLoading } = useMutation({
    mutationFn: (landlordId: number) => paymentApi.createAdminCommissionVietQr({ landlordId, year, month }),
    onSuccess: (payment) => {
      setSelectedPayment(payment)
      setPaymentError('')
      invalidateLandlords()
      toast.success('Đã tạo QR hoa hồng.')
    },
    onError: (error: Error) => toast.error(error.message || 'Không thể tạo QR hoa hồng.'),
  })

  const { mutate: openPayment, isPending: openingPayment } = useMutation({
    mutationFn: (paymentCode: string) => paymentApi.getPaymentByCode(paymentCode),
    onSuccess: (payment) => {
      setSelectedPayment(payment)
      setPaymentError('')
    },
    onError: (error: Error) => toast.error(error.message || 'Không thể mở QR hoa hồng.'),
  })

  const { mutate: markPaid, isPending: marking } = useMutation({
    mutationFn: (paymentCode: string) => paymentApi.adminMarkPaid(paymentCode),
    onSuccess: (payment) => {
      setSelectedPayment((prev) => (prev?.paymentCode === payment.paymentCode ? payment : prev))
      invalidateLandlords()
      toast.success('Đã xác nhận hoa hồng.')
    },
    onError: (error: Error) => toast.error(error.message || 'Không thể xác nhận hoa hồng.'),
  })

  const refreshSelectedPayment = async () => {
    if (!selectedPayment?.paymentCode) return
    setPaymentRefreshing(true)
    setPaymentError('')
    try {
      const payment = await paymentApi.getPaymentByCode(selectedPayment.paymentCode)
      setSelectedPayment(payment)
      invalidateLandlords()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setPaymentError(e?.response?.data?.message || e?.message || 'Không thể cập nhật trạng thái payment.')
    } finally {
      setPaymentRefreshing(false)
    }
  }

  const loading = landlordsLoading || commissionsLoading

  return (
    <ManagementLayout role="ADMIN">
      <div className="mx-auto max-w-7xl p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#F5E5D1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#B85C38]">
              <Building2 size={14} />
              Chủ trọ
            </div>
            <h1 className="font-display text-2xl font-bold text-[#292524]">Quản lý chủ trọ</h1>
            <p className="mt-1 text-sm text-[#78716C]">Xem khu trọ, phòng đang quản lý, người thuê hiện tại và tạo QR thu hoa hồng.</p>
          </div>
          <div className="grid w-full gap-3 sm:grid-cols-[minmax(0,1fr)_220px] lg:max-w-xl">
            <Input
              label="Tìm kiếm"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Tên, email, số điện thoại..."
              leftIcon={<Search size={16} />}
            />
            <Input
              label="Kỳ hoa hồng"
              type="month"
              value={period}
              onChange={(event) => setPeriod(event.target.value || getCurrentPeriod())}
              leftIcon={<CalendarDays size={16} />}
            />
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-6">
          <StatTile icon={<Building2 size={18} />} label="Chủ trọ" value={stats.landlords.toString()} />
          <StatTile icon={<Building2 size={18} />} label="Khu trọ" value={stats.properties.toString()} />
          <StatTile icon={<BedDouble size={18} />} label="Phòng" value={stats.rooms.toString()} />
          <StatTile icon={<Users size={18} />} label="Đang thuê" value={stats.tenants.toString()} />
          <StatTile icon={<WalletCards size={18} />} label="Tổng đã thu" value={formatCurrency(stats.totalRevenue)} />
          <StatTile icon={<WalletCards size={18} />} label="Hoa hồng kỳ" value={formatCurrency(commissionTotal)} highlight />
        </div>

        {loading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : filteredLandlords.length === 0 ? (
          <EmptyState title="Không tìm thấy chủ trọ" icon={<Building2 size={28} />} />
        ) : (
          <div className="overflow-hidden rounded-[22px] border border-[#E8DED1] bg-white/95 shadow-[0_18px_48px_-28px_rgb(91_70_54/0.34)] backdrop-blur-sm">
            <div className="flex flex-col gap-3 border-b border-[#E8DED1] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#292524]">Danh sách chủ trọ</h2>
                <p className="mt-1 text-sm text-[#78716C]">Bấm vào một dòng để xem chi tiết khu trọ, phòng và người thuê.</p>
              </div>
              <Button variant="outline" leftIcon={<RefreshCw size={16} />} onClick={invalidateLandlords}>
                Làm mới
              </Button>
            </div>

            <Table>
              <TableHead>
                <tr>
                  <Th>Chủ trọ</Th>
                  <Th>Quản lý</Th>
                  <Th>Người thuê</Th>
                  <Th>Hoa hồng kỳ này</Th>
                  <Th>Trạng thái</Th>
                  <Th>Thao tác</Th>
                </tr>
              </TableHead>
              <TableBody>
                {filteredLandlords.map((landlord) => (
                  <LandlordRow
                    key={landlord.id}
                    landlord={landlord}
                    commission={commissionMap.get(landlord.id)}
                    onOpenDetail={() => setSelectedLandlordId(landlord.id)}
                    onCreateQr={() => genQr(landlord.id)}
                    onOpenQr={(paymentCode) => openPayment(paymentCode)}
                    qrLoading={qrLoading}
                    openingPayment={openingPayment}
                  />
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <LandlordDetailModal
        open={selectedLandlordId != null}
        detail={landlordDetail}
        loading={detailLoading}
        onClose={() => setSelectedLandlordId(null)}
      />

      {selectedPayment && (
        <PaymentQrModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onRefresh={refreshSelectedPayment}
          refreshing={paymentRefreshing}
          error={paymentError}
          onPaymentChanged={(payment) => {
            setSelectedPayment(payment)
            invalidateLandlords()
          }}
          actionArea={
            needsConfirmation(selectedPayment.status) ? (
              <Button
                type="button"
                onClick={() => markPaid(selectedPayment.paymentCode)}
                loading={marking}
                leftIcon={<CheckCircle size={16} />}
              >
                Xác nhận đã nhận tiền
              </Button>
            ) : null
          }
        />
      )}
    </ManagementLayout>
  )
}

function LandlordRow({
  landlord,
  commission,
  onOpenDetail,
  onCreateQr,
  onOpenQr,
  qrLoading,
  openingPayment,
}: {
  landlord: AdminLandlord
  commission?: CommissionBilling
  onOpenDetail: () => void
  onCreateQr: () => void
  onOpenQr: (paymentCode: string) => void
  qrLoading: boolean
  openingPayment: boolean
}) {
  const paymentCode = commission?.paymentCode || commission?.latestPaymentCode
  const hasRevenue = Number(commission?.grossRevenue || 0) > 0
  const paid = isPaid(commission?.status)

  return (
    <Tr onClick={onOpenDetail}>
      <Td>
        <div className="min-w-[220px]">
          <p className="font-semibold text-[#292524]">{landlord.fullName || 'Chủ trọ'}</p>
          <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#78716C]">
            <span>{landlord.email || 'Chưa có email'}</span>
            <span>{landlord.phone || 'Chưa có SĐT'}</span>
          </div>
        </div>
      </Td>
      <Td>
        <div className="grid min-w-[160px] grid-cols-2 gap-2 text-sm">
          <MiniValue label="Khu" value={landlord.propertyCount.toString()} />
          <MiniValue label="Phòng" value={landlord.roomCount.toString()} />
        </div>
      </Td>
      <Td>
        <span className="font-semibold text-[#292524]">{landlord.activeTenantCount}</span>
        <span className="ml-1 text-xs text-[#78716C]">người</span>
      </Td>
      <Td>
        <div className="min-w-[180px]">
          <p className="font-semibold text-[#B85C38]">{formatCurrency(commission?.commissionAmount || 0)}</p>
          <p className="mt-1 text-xs text-[#78716C]">Doanh thu: {formatCurrency(commission?.grossRevenue || 0)}</p>
        </div>
      </Td>
      <Td>
        <div className="flex flex-col items-start gap-2">
          <Badge variant={getStatusBadgeVariant(landlord.status)} size="sm">{getStatusLabel(landlord.status)}</Badge>
          <Badge variant={landlord.hasPaymentConfig ? 'success' : 'warning'} size="sm">
            {landlord.hasPaymentConfig ? 'Có VietQR' : 'Thiếu VietQR'}
          </Badge>
        </div>
      </Td>
      <Td>
        <div className="flex min-w-[190px] flex-wrap justify-end gap-2" onClick={(event) => event.stopPropagation()}>
          <Button size="sm" variant="outline" leftIcon={<Eye size={14} />} onClick={onOpenDetail}>
            Chi tiết
          </Button>
          {paymentCode ? (
            <Button
              size="sm"
              variant={paid ? 'ghost' : 'outline'}
              leftIcon={<QrCode size={14} />}
              onClick={() => onOpenQr(paymentCode)}
              loading={openingPayment}
            >
              {paid ? 'Xem QR' : 'Mở QR'}
            </Button>
          ) : (
            <Button
              size="sm"
              leftIcon={<QrCode size={14} />}
              onClick={onCreateQr}
              loading={qrLoading}
              disabled={!hasRevenue}
              title={hasRevenue ? 'Tạo QR hoa hồng' : 'Chủ trọ chưa có doanh thu trong kỳ này'}
            >
              {hasRevenue ? 'Tạo QR' : 'Chưa có doanh thu'}
            </Button>
          )}
        </div>
      </Td>
    </Tr>
  )
}

function LandlordDetailModal({
  open,
  detail,
  loading,
  onClose,
}: {
  open: boolean
  detail?: AdminLandlordDetail
  loading: boolean
  onClose: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Chi tiết chủ trọ"
      description={detail?.fullName || 'Thông tin khu trọ, phòng và người thuê đang quản lý'}
      size="xl"
    >
      {loading ? (
        <TableSkeleton rows={4} cols={4} />
      ) : !detail ? (
        <EmptyState title="Không tải được thông tin chủ trọ" />
      ) : (
        <div className="space-y-5">
          <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)]">
            <div className="rounded-[18px] border border-[#E8DED1] bg-[#FFFCF8] p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h3 className="font-display text-xl font-bold text-[#292524]">{detail.fullName}</h3>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-[#78716C]">
                    <span>{detail.email || 'Chưa có email'}</span>
                    <span>{detail.phone || 'Chưa có SĐT'}</span>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Badge variant={getStatusBadgeVariant(detail.status)}>{getStatusLabel(detail.status)}</Badge>
                  <Badge variant={detail.isVerified ? 'success' : 'warning'}>
                    {detail.isVerified ? 'Đã xác minh' : 'Chưa xác minh'}
                  </Badge>
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <InfoLine label="Địa chỉ" value={detail.address || 'Chưa cập nhật'} />
                <InfoLine label="Quê quán" value={detail.hometown || 'Chưa cập nhật'} />
                <InfoLine label="Ngân hàng VietQR" value={detail.vietQrBankId || 'Chưa cấu hình'} />
                <InfoLine label="Tài khoản nhận tiền" value={detail.bankAccountNo && detail.bankAccountName ? `${detail.bankAccountNo} - ${detail.bankAccountName}` : 'Chưa cấu hình'} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <StatTile icon={<Building2 size={18} />} label="Khu trọ" value={detail.propertyCount.toString()} compact />
              <StatTile icon={<BedDouble size={18} />} label="Phòng" value={detail.roomCount.toString()} compact />
              <StatTile icon={<Users size={18} />} label="Đang thuê" value={detail.activeTenantCount.toString()} compact />
              <StatTile icon={<WalletCards size={18} />} label="Tổng thu" value={formatCurrency(detail.totalGrossRevenue)} compact highlight />
            </div>
          </div>

          {detail.properties.length === 0 ? (
            <EmptyState title="Chủ trọ chưa có khu trọ nào" icon={<Building2 size={28} />} />
          ) : (
            <div className="space-y-4">
              {detail.properties.map((property) => (
                <PropertyBlock key={property.id} property={property} />
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  )
}

function PropertyBlock({ property }: { property: AdminLandlordProperty }) {
  return (
    <section className="rounded-[18px] border border-[#E8DED1] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#F0E4D7] px-5 py-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="font-display text-base font-semibold text-[#292524]">{property.name}</h4>
            <Badge variant={getStatusBadgeVariant(property.status)} size="sm">{getStatusLabel(property.status)}</Badge>
          </div>
          <p className="mt-1 text-sm text-[#78716C]">{property.fullAddress || property.addressLine || 'Chưa có địa chỉ'}</p>
        </div>
        <div className="flex gap-2 text-sm">
          <MiniValue label="Phòng" value={property.roomCount.toString()} />
          <MiniValue label="Đang thuê" value={property.activeTenantCount.toString()} />
        </div>
      </div>

      {property.rooms.length === 0 ? (
        <div className="px-5 py-6 text-sm text-[#78716C]">Khu trọ này chưa có phòng.</div>
      ) : (
        <div className="divide-y divide-[#F3EADF]">
          {property.rooms.map((room) => (
            <div key={room.id} className="grid gap-3 px-5 py-4 lg:grid-cols-[minmax(0,1fr)_180px_minmax(220px,0.8fr)] lg:items-start">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-[#292524]">{room.title}</p>
                  <span className="font-mono text-xs text-[#A08A76]">{room.roomCode}</span>
                </div>
                <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#78716C]">
                  <span>{room.roomType || 'Chưa phân loại'}</span>
                  <span>{formatCurrency(room.price)}</span>
                  <span>Tối đa {room.maxTenants} người</span>
                </div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Badge variant={getStatusBadgeVariant(room.status)} size="sm">{getStatusLabel(room.status)}</Badge>
                  <Badge variant={getStatusBadgeVariant(room.approvalStatus)} size="sm">{getStatusLabel(room.approvalStatus)}</Badge>
                </div>
              </div>
              <MiniValue
                label="Trạng thái"
                value={room.activeTenantCount > 0 ? 'Hiện đang thuê' : 'Đang trống'}
              />
              <div className="space-y-2">
                {room.tenants.length === 0 ? (
                  <p className="text-sm text-[#A08A76]">Chưa có người thuê đang ở.</p>
                ) : (
                  room.tenants.map((tenant) => (
                    <div key={`${room.id}-${tenant.bookingRequestId}`} className="rounded-[12px] border border-[#E8DED1] bg-[#FFFCF8] px-3 py-2">
                      <p className="text-sm font-semibold text-[#292524]">{tenant.tenantName || 'Người thuê'}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#78716C]">
                        <span>{tenant.tenantPhone || tenant.tenantEmail || 'Chưa có liên hệ'}</span>
                        <span>{tenant.contractCode || tenant.bookingCode}</span>
                        <span>{formatCurrency(tenant.monthlyRent)}</span>
                        {tenant.moveInDate && <span>Vào ở {formatDate(tenant.moveInDate)}</span>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}

function StatTile({
  icon,
  label,
  value,
  highlight = false,
  compact = false,
}: {
  icon: React.ReactNode
  label: string
  value: string
  highlight?: boolean
  compact?: boolean
}) {
  return (
    <div className={`rounded-[16px] border border-[#E8DED1] bg-white shadow-[0_12px_30px_-24px_rgb(91_70_54/0.45)] ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}>
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#F5E5D1] text-[#B85C38]">
        {icon}
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9A8775]">{label}</p>
      <p className={`mt-2 font-display text-lg font-bold ${highlight ? 'text-[#B85C38]' : 'text-[#292524]'}`}>{value}</p>
    </div>
  )
}

function MiniValue({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[#E8DED1] bg-[#FFFCF8] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A8775]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#292524]">{value}</p>
    </div>
  )
}

function InfoLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[12px] border border-[#E8DED1] bg-white px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A8775]">{label}</p>
      <p className="mt-1 text-sm font-medium text-[#292524]">{value}</p>
    </div>
  )
}
