import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  CheckCircle2,
  CreditCard,
  Hourglass,
  MessageCircle,
  QrCode,
  ReceiptText,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react'
import ManagementLayout from '@/components/layout/ManagementLayout'
import PaymentHistoryTable from '@/components/payments/PaymentHistoryTable'
import PaymentQrModal from '@/components/PaymentQrModal'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import StatCard from '@/components/ui/StatCard'
import { PageLoader } from '@/components/ui/Skeleton'
import { authApi } from '@/api/authApi'
import { paymentApi } from '@/api/paymentApi'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency } from '@/lib/utils'
import {
  canConfirmIncomingPayment,
  isIncomingPayment,
  isOutgoingPayment,
  isPaidStatus,
  sumPaymentAmount,
} from '@/utils/paymentPresentation'
import type { Payment, User } from '@/types'

function hasPaymentAccountConfig(user: User | null) {
  return Boolean(user?.bankName && user?.bankAccountNumber && user?.bankAccountName)
}

export default function LandlordPaymentsPage() {
  const storeUser = useAuthStore((s) => s.user)
  const updateStoreUser = useAuthStore((s) => s.updateUser)
  const [payments, setPayments] = useState<Payment[]>([])
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [currentUserId, setCurrentUserId] = useState(storeUser?.id || 0)
  const [paymentAccountReady, setPaymentAccountReady] = useState(() => hasPaymentAccountConfig(storeUser))
  const [statusFilter, setStatusFilter] = useState('all')
  const [directionFilter, setDirectionFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [paymentRefreshing, setPaymentRefreshing] = useState(false)
  const [paymentOpeningCode, setPaymentOpeningCode] = useState('')
  const [confirmingPaymentCode, setConfirmingPaymentCode] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [paymentError, setPaymentError] = useState('')

  const loadPayments = async () => {
    const data = await paymentApi.getMyPayments()
    const next = Array.isArray(data)
      ? [...data].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      : []
    setPayments(next)
    return next
  }

  const loadCurrentUser = async () => {
    const user = await authApi.getMe()
    setCurrentUserId(user?.id || 0)
    setPaymentAccountReady(hasPaymentAccountConfig(user))
    updateStoreUser(user)
    return user
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setError('')
      try {
        await Promise.all([loadPayments(), loadCurrentUser()])
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } }
        setError(e?.response?.data?.message || 'Không thể tải lịch sử thanh toán của chủ trọ.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    const code = selectedPayment?.paymentCode
    const n = String(selectedPayment?.status || '').toLowerCase()
    if (!code || (n !== 'pending' && n !== 'waiting_confirm' && n !== 'proof_submitted')) return undefined
    const id = window.setInterval(async () => {
      try {
        const latest = await paymentApi.getPaymentByCode(code)
        setSelectedPayment(latest)
        setPayments((prev) => prev.map((p) => (p.paymentCode === latest.paymentCode ? latest : p)))
      } catch { /* allow manual refresh */ }
    }, 10000)
    return () => window.clearInterval(id)
  }, [selectedPayment?.paymentCode, selectedPayment?.status])

  const stats = useMemo(() => {
    const incoming = payments.filter((p) => isIncomingPayment(p, currentUserId))
    const outgoing = payments.filter((p) => isOutgoingPayment(p, currentUserId))
    return {
      total: payments.length,
      receivedAmount: sumPaymentAmount(incoming.filter((p) => isPaidStatus(p.status))),
      incomingPendingAmount: sumPaymentAmount(incoming.filter((p) => !isPaidStatus(p.status))),
      outgoingPaidAmount: sumPaymentAmount(outgoing.filter((p) => isPaidStatus(p.status))),
      outgoingPendingAmount: sumPaymentAmount(outgoing.filter((p) => !isPaidStatus(p.status))),
      paidCount: payments.filter((p) => isPaidStatus(p.status)).length,
    }
  }, [currentUserId, payments])

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const s = String(p.status || '').toLowerCase()
      const t = String(p.paymentType || '').toLowerCase()
      if (statusFilter === 'paid' && !isPaidStatus(p.status)) return false
      if (statusFilter === 'unpaid' && isPaidStatus(p.status)) return false
      if (directionFilter === 'incoming' && !isIncomingPayment(p, currentUserId)) return false
      if (directionFilter === 'outgoing' && !isOutgoingPayment(p, currentUserId)) return false
      if (typeFilter !== 'all' && t !== typeFilter) return false
      return s !== undefined
    })
  }, [currentUserId, directionFilter, payments, statusFilter, typeFilter])

  const handlePaymentChanged = (payment: Payment) => {
    setSelectedPayment(payment)
    setPayments((prev) => prev.map((p) => (p.paymentCode === payment.paymentCode ? payment : p)))
    setMessage('Đã cập nhật trạng thái payment mới nhất.')
  }

  const handlePaymentDeleted = async (payment: Payment) => {
    setPayments((prev) => prev.filter((p) => p.paymentCode !== payment.paymentCode))
    setSelectedPayment(null)
    setPaymentRefreshing(false)
    setPaymentError('')
    setMessage('Đã xóa QR hết hạn khỏi lịch sử thanh toán.')
  }

  const openPaymentDetail = async (paymentCode: string) => {
    if (!paymentCode) return
    setPaymentOpeningCode(paymentCode)
    setPaymentError('')
    setMessage('')
    try {
      const payment = await paymentApi.getPaymentByCode(paymentCode)
      setSelectedPayment(payment)
      setPayments((prev) => prev.map((p) => (p.paymentCode === payment.paymentCode ? payment : p)))
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setPaymentError(e?.response?.data?.message || 'Không thể mở payment này.')
    } finally {
      setPaymentOpeningCode('')
    }
  }

  const refreshSelectedPayment = async () => {
    if (!selectedPayment?.paymentCode) return
    setPaymentRefreshing(true)
    setPaymentError('')
    try {
      const payment = await paymentApi.getPaymentByCode(selectedPayment.paymentCode)
      setSelectedPayment(payment)
      setPayments((prev) => prev.map((p) => (p.paymentCode === payment.paymentCode ? payment : p)))
      setMessage('Đã cập nhật trạng thái payment mới nhất.')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setPaymentError(e?.response?.data?.message || 'Không thể cập nhật trạng thái payment.')
    } finally {
      setPaymentRefreshing(false)
    }
  }

  const confirmPaymentByCode = async (paymentCode: string) => {
    if (!paymentCode) return
    setConfirmingPaymentCode(paymentCode)
    setPaymentError('')
    setMessage('')
    try {
      const payment = await paymentApi.landlordMarkPaid(paymentCode)
      setSelectedPayment((prev) => (prev?.paymentCode === payment.paymentCode ? payment : prev))
      setPayments((prev) => prev.map((p) => (p.paymentCode === payment.paymentCode ? payment : p)))
      setMessage('Đã xác nhận thanh toán thành công.')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setPaymentError(e?.response?.data?.message || 'Không thể xác nhận thanh toán.')
    } finally {
      setConfirmingPaymentCode('')
    }
  }

  const handleMarkPaymentPaid = async () => {
    if (!selectedPayment?.paymentCode) return
    await confirmPaymentByCode(selectedPayment.paymentCode)
  }

  if (loading) {
    return (
      <ManagementLayout role="LANDLORD">
        <PageLoader />
      </ManagementLayout>
    )
  }

  return (
    <ManagementLayout role="LANDLORD">
      <div className="min-h-screen bg-[#FAF6EF] px-6 py-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#C96A3D]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#C96A3D]">
                <CreditCard size={14} />
                Landlord payments
              </div>
              <h1 className="font-display text-2xl font-bold text-[#292524]">Thu tiền & đối soát</h1>
              <p className="mt-2 text-sm leading-6 text-[#78716C]">
                Theo dõi khoản thu từ người thuê, khoản chi hoa hồng và các payment cần xác nhận.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/landlord/tenants" className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] bg-[#C96A3D] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[#B85C38] hover:text-white">
                <Users size={16} />
                Người thuê
              </Link>
              <Link to="/landlord/qr-settings" className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#E7D8C8] bg-white px-4 text-sm font-medium text-[#5B4636] transition-colors hover:bg-[#FAF6EF] hover:text-[#5B4636]">
                <QrCode size={16} />
                VietQR
              </Link>
              <Link to="/landlord/commission-payments" className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#E7D8C8] bg-white px-4 text-sm font-medium text-[#5B4636] transition-colors hover:bg-[#FAF6EF] hover:text-[#5B4636]">
                <Wallet size={16} />
                Hoa hồng
              </Link>
              <Link to="/messages" className="inline-flex h-10 items-center justify-center gap-2 rounded-[10px] border border-[#E7E5E4] bg-white px-4 text-sm font-medium text-[#78716C] transition-colors hover:bg-[#F5F5F4] hover:text-[#57534E]">
                <MessageCircle size={16} />
                Tin nhắn
              </Link>
            </div>
          </div>

          <div className="mb-5 rounded-[18px] border border-[#E8DED1] bg-[linear-gradient(135deg,#FFF8F3_0%,#FFFFFF_58%,#F3E7D3_100%)] p-5 shadow-[0_18px_48px_-32px_rgb(91_70_54/0.42)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#C96A3D]/10 text-[#C96A3D]">
                  <QrCode size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9A8775]">VietQR nhận tiền</p>
                  <h2 className="mt-1 font-display text-lg font-semibold text-[#2C241D]">
                    {paymentAccountReady ? 'Đã sẵn sàng tạo QR thu tiền' : 'Cần cấu hình tài khoản nhận tiền'}
                  </h2>
                  <p className="mt-1 text-sm text-[#78716C]">Phần cấu hình QR đã được tách sang màn VietQR riêng để trang này tập trung vào đối soát.</p>
                </div>
              </div>
              <Link to="/landlord/qr-settings">
                <Button type="button" variant={paymentAccountReady ? 'outline' : 'primary'} size="sm" leftIcon={<QrCode size={14} />}>
                  {paymentAccountReady ? 'Xem cấu hình' : 'Cấu hình ngay'}
                </Button>
              </Link>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-6">
            <StatCard title="Tổng payment" value={stats.total} icon={<ReceiptText size={20} />} color="primary" />
            <StatCard title="Đã thu" value={formatCurrency(stats.receivedAmount)} icon={<TrendingUp size={20} />} color="accent" />
            <StatCard title="Chưa thu xong" value={formatCurrency(stats.incomingPendingAmount)} icon={<Hourglass size={20} />} color="gold" />
            <StatCard title="Đã chi" value={formatCurrency(stats.outgoingPaidAmount)} icon={<TrendingDown size={20} />} color="brown" />
            <StatCard title="Còn phải chi" value={formatCurrency(stats.outgoingPendingAmount)} icon={<Wallet size={20} />} color="secondary" />
            <StatCard title="Payment đã xong" value={stats.paidCount} icon={<CheckCircle2 size={20} />} color="olive" />
          </div>

          <div className="mb-5 space-y-3">
            {message && <div className="rounded-[12px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div>}
            {error && <div className="rounded-[12px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}
            {paymentError && !selectedPayment && <div className="rounded-[12px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{paymentError}</div>}
          </div>

          <Card padding="none" className="overflow-hidden">
            <div className="border-b border-[#E8DED1] px-5 py-4">
              <CardHeader className="mb-4 items-start">
                <div>
                  <CardTitle>Lịch sử thanh toán</CardTitle>
                  <p className="mt-1 text-sm text-[#78716C]">Lọc khoản đã thanh toán, chưa thanh toán, thu vào hoặc chi ra để theo dõi dòng tiền.</p>
                </div>
                <Badge variant="autumn">{filteredPayments.length} kết quả</Badge>
              </CardHeader>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <Select label="Trạng thái" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">Tất cả</option>
                  <option value="unpaid">Chưa thanh toán</option>
                  <option value="paid">Đã thanh toán</option>
                </Select>
                <Select label="Dòng tiền" value={directionFilter} onChange={(e) => setDirectionFilter(e.target.value)}>
                  <option value="all">Tất cả</option>
                  <option value="incoming">Thu vào</option>
                  <option value="outgoing">Chi ra</option>
                </Select>
                <Select label="Loại payment" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="all">Tất cả</option>
                  <option value="rent">Tiền thuê</option>
                  <option value="deposit">Tiền cọc</option>
                  <option value="service">Phí dịch vụ</option>
                  <option value="listing_fee">Hoa hồng admin</option>
                </Select>
              </div>
            </div>

            <PaymentHistoryTable
              payments={filteredPayments}
              viewer="landlord"
              currentUserId={currentUserId}
              showDirection
              openingCode={paymentOpeningCode}
              confirmingCode={confirmingPaymentCode}
              emptyTitle={payments.length === 0 ? 'Chưa có payment' : 'Không có kết quả phù hợp'}
              emptyDescription={payments.length === 0 ? 'Hiện chưa có payment nào để theo dõi.' : 'Thử đổi bộ lọc để xem dữ liệu khác.'}
              onOpen={(payment) => openPaymentDetail(payment.paymentCode)}
              canConfirm={(payment) => canConfirmIncomingPayment(payment, currentUserId)}
              onConfirm={(payment) => confirmPaymentByCode(payment.paymentCode)}
            />
          </Card>

          {selectedPayment && (
            <PaymentQrModal
              payment={selectedPayment}
              onClose={() => { setSelectedPayment(null); setPaymentRefreshing(false); setPaymentError('') }}
              onRefresh={refreshSelectedPayment}
              refreshing={paymentRefreshing}
              error={paymentError}
              onPaymentChanged={handlePaymentChanged}
              onPaymentDeleted={handlePaymentDeleted}
              actionArea={canConfirmIncomingPayment(selectedPayment, currentUserId) ? (
                <Button
                  type="button"
                  leftIcon={<CheckCircle2 size={16} />}
                  disabled={confirmingPaymentCode === selectedPayment.paymentCode}
                  onClick={handleMarkPaymentPaid}
                >
                  {confirmingPaymentCode === selectedPayment.paymentCode ? 'Đang xác nhận...' : 'Đã thanh toán'}
                </Button>
              ) : null}
            />
          )}
        </div>
      </div>
    </ManagementLayout>
  )
}
