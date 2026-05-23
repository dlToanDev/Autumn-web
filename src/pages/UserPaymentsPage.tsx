import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  FileText,
  Hourglass,
  MessageCircle,
  QrCode,
  ReceiptText,
  XCircle,
} from 'lucide-react'
import PublicLayout from '@/components/layout/PublicLayout'
import PaymentHistoryTable from '@/components/payments/PaymentHistoryTable'
import PaymentQrModal from '@/components/PaymentQrModal'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Select from '@/components/ui/Select'
import StatCard from '@/components/ui/StatCard'
import { EmptyState, PageLoader } from '@/components/ui/Skeleton'
import { contractApi } from '@/api/contractApi'
import { paymentApi } from '@/api/paymentApi'
import {
  formatRentBillingLabel,
  getCurrentRentBillingPeriod,
  isContractActiveForBillingPeriod,
  isDueDatePassed,
  isRentPaymentSuccess,
  mapBillingPaymentsByBooking,
} from '@/utils/rentBilling'
import {
  formatBillingPeriod,
  formatPaymentStatusLabel,
  formatPaymentTypeLabel,
  getPaymentBadgeVariant,
  isPaidStatus,
  sumPaymentAmount,
  type BadgeTone,
} from '@/utils/paymentPresentation'
import { cn, formatCurrency, formatDateTime } from '@/lib/utils'
import { useAuthStore } from '@/store/authStore'
import type { Payment, RentalContract } from '@/types'

function getCurrentRentBillTone(payment: Payment | null, isOverdue: boolean) {
  const n = String(payment?.status || '').toLowerCase()
  if (n === 'success' || n === 'paid' || n === 'confirmed') return 'success'
  if (n === 'waiting_confirm' || n === 'proof_submitted') return 'waiting_confirm'
  if (n === 'pending') return 'pending'
  if (n === 'expired') return 'expired'
  return isOverdue ? 'due' : 'missing'
}

function getCurrentRentBillLabel(payment: Payment | null, isOverdue: boolean) {
  const n = String(payment?.status || '').toLowerCase()
  if (n === 'success' || n === 'paid' || n === 'confirmed') return 'Đã xác nhận thanh toán'
  if (n === 'waiting_confirm' || n === 'proof_submitted') return 'Đã gửi minh chứng, chờ xác nhận'
  if (n === 'pending') return 'Đã có QR, chờ bạn thanh toán'
  if (n === 'expired') return 'QR tháng này đã hết hạn'
  return isOverdue ? 'Đã tới hạn nhưng chủ trọ chưa tạo QR' : 'Đang chờ chủ trọ tạo QR'
}

function getCurrentRentBillBadgeVariant(payment: Payment | null, isOverdue: boolean): BadgeTone {
  const tone = getCurrentRentBillTone(payment, isOverdue)
  if (tone === 'success') return 'success'
  if (tone === 'waiting_confirm' || tone === 'pending') return 'warning'
  if (tone === 'due') return 'danger'
  if (tone === 'expired') return 'neutral'
  return 'autumn'
}

function getCurrentRentBillIcon(tone: string) {
  if (tone === 'success') return <CheckCircle2 size={18} />
  if (tone === 'waiting_confirm') return <Hourglass size={18} />
  if (tone === 'expired') return <XCircle size={18} />
  if (tone === 'due') return <AlertTriangle size={18} />
  return <CalendarClock size={18} />
}

type PaymentMetricTone = 'primary' | 'gold' | 'accent' | 'brown' | 'olive' | 'secondary'

interface PaymentMetric {
  title: string
  value: string | number
  icon: ReactNode
  tone: PaymentMetricTone
}

const mobileMetricToneClasses: Record<PaymentMetricTone, { card: string; icon: string }> = {
  primary: {
    card: 'border-[#E8DED1] bg-white',
    icon: 'bg-[#C96A3D]/10 text-[#C96A3D]',
  },
  gold: {
    card: 'border-[#E8DED1] bg-[#FFFBF5]',
    icon: 'bg-[#D4A373]/20 text-[#B88040]',
  },
  accent: {
    card: 'border-emerald-100 bg-emerald-50/40',
    icon: 'bg-emerald-100 text-emerald-700',
  },
  brown: {
    card: 'border-[#E8DED1] bg-[#FCFAF7]',
    icon: 'bg-[#5B4636]/10 text-[#5B4636]',
  },
  olive: {
    card: 'border-[#DDE2CD] bg-[#F7F9F1]',
    icon: 'bg-[#7A8450]/10 text-[#7A8450]',
  },
  secondary: {
    card: 'border-[#E7E5E4] bg-[#F8F7F5]',
    icon: 'bg-[#E7E5E4] text-[#57534E]',
  },
}

function MobileMetricTile({ title, value, icon, tone }: PaymentMetric) {
  const classes = mobileMetricToneClasses[tone] || mobileMetricToneClasses.primary

  return (
    <div className={cn('min-w-0 rounded-[12px] border p-3 shadow-[0_1px_2px_rgb(0_0_0/0.04)]', classes.card)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-[10px] font-semibold uppercase leading-4 tracking-[0.08em] text-[#8A7663]">
          {title}
        </p>
        <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px]', classes.icon)}>
          {icon}
        </span>
      </div>
      <p className="truncate font-display text-lg font-bold leading-6 text-[#292524]">{value}</p>
    </div>
  )
}

interface MobilePaymentHistoryProps {
  payments: Payment[]
  openingCode: string
  emptyTitle: string
  emptyDescription: string
  onOpen: (payment: Payment) => void
}

function MobilePaymentHistory({
  payments,
  openingCode,
  emptyTitle,
  emptyDescription,
  onOpen,
}: MobilePaymentHistoryProps) {
  if (payments.length === 0) {
    return (
      <div className="sm:hidden">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          icon={<ReceiptText size={28} />}
        />
      </div>
    )
  }

  return (
    <div className="divide-y divide-[#F1E6DA] bg-white sm:hidden">
      <div className="grid grid-cols-[minmax(0,1fr)_minmax(88px,0.62fr)_2rem] gap-2 border-b border-[#E8DED1] bg-[#FCFAF7] px-3 py-2 text-[10px] font-semibold uppercase leading-4 tracking-[0.08em] text-[#8A7663]">
        <span>Payment</span>
        <span className="text-right">Số tiền</span>
        <span />
      </div>
      {payments.map((payment) => {
        const paid = isPaidStatus(payment.status)
        const typeLabel = formatPaymentTypeLabel(payment.paymentType, 'tenant')
        const contentTitle = payment.description || typeLabel

        return (
          <article key={payment.paymentCode} className="px-3 py-3">
            <div className="grid grid-cols-[minmax(0,1fr)_minmax(88px,0.62fr)_2rem] items-start gap-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold leading-5 text-[#2C241D]">{payment.paymentCode}</p>
                <p className="mt-0.5 truncate text-xs leading-5 text-[#78716C]">
                  {payment.roomTitle || contentTitle || '---'}
                </p>
              </div>
              <div className="min-w-0 text-right">
                <p className="truncate font-display text-sm font-bold leading-5 text-[#292524]">
                  {formatCurrency(payment.amount)}
                </p>
                <Badge
                  variant={getPaymentBadgeVariant(payment.status)}
                  size="sm"
                  className="mt-1 max-w-full justify-center text-center text-[10px] leading-4"
                >
                  {formatPaymentStatusLabel(payment.status, 'tenant')}
                </Badge>
              </div>
              <Button
                type="button"
                aria-label={paid ? `Xem chi tiết ${payment.paymentCode}` : `Xem QR ${payment.paymentCode}`}
                size="sm"
                variant={paid ? 'ghost' : 'outline'}
                loading={openingCode === payment.paymentCode}
                leftIcon={<CreditCard size={14} />}
                className="h-8 w-8 px-0"
                onClick={() => onOpen(payment)}
              />
            </div>

            <div className="mt-2 grid grid-cols-3 gap-2 rounded-[10px] bg-[#FAF6EF] px-2 py-2 text-[11px] leading-4 text-[#8A7663]">
              <div className="min-w-0">
                <span className="block">Loại</span>
                <strong className="mt-0.5 block truncate font-medium text-[#2C241D]">{typeLabel}</strong>
              </div>
              <div className="min-w-0">
                <span className="block">Kỳ</span>
                <strong className="mt-0.5 block truncate font-medium text-[#2C241D]">{formatBillingPeriod(payment)}</strong>
              </div>
              <div className="min-w-0 text-right">
                <span className="block">{paid ? 'Đã trả' : 'Hạn'}</span>
                <strong className="mt-0.5 block truncate font-medium text-[#2C241D]">
                  {paid ? formatDateTime(payment.paidAt) : formatDateTime(payment.expiredAt)}
                </strong>
              </div>
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default function UserPaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [contracts, setContracts] = useState<RentalContract[]>([])
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [statusFilter, setStatusFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [openingCode, setOpeningCode] = useState('')
  const [refreshing, setRefreshing] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [paymentError, setPaymentError] = useState('')
  const currentUser = useAuthStore((s) => s.user)
  const currentUserId = Number(currentUser?.id || 0)
  const billingPeriod = useMemo(() => getCurrentRentBillingPeriod(), [])

  const payablePayments = useMemo(() => {
    return payments
      .filter((payment) => {
        const status = String(payment.status || '').toLowerCase()
        const isOutgoing = !currentUserId || Number(payment.payerId || 0) === currentUserId
        const isClosed = ['canceled', 'cancelled', 'failed', 'rejected'].includes(status)
        return isOutgoing && !isPaidStatus(payment.status) && !isClosed
      })
      .sort((a, b) => {
        const aExpired = String(a.status || '').toLowerCase() === 'expired'
        const bExpired = String(b.status || '').toLowerCase() === 'expired'
        return Number(aExpired) - Number(bExpired) || new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      })
  }, [currentUserId, payments])

  const stats = useMemo(() => ({
    total: payments.length,
    pendingCount: payablePayments.length,
    successCount: payments.filter((p) => isPaidStatus(p.status)).length,
    unpaidAmount: sumPaymentAmount(payablePayments),
    paidAmount: sumPaymentAmount(payments.filter((p) => isPaidStatus(p.status))),
    expiredCount: payments.filter((p) => String(p.status).toLowerCase() === 'expired').length,
  }), [payablePayments, payments])

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const t = String(p.paymentType || '').toLowerCase()
      if (statusFilter === 'paid' && !isPaidStatus(p.status)) return false
      if (statusFilter === 'unpaid' && isPaidStatus(p.status)) return false
      if (typeFilter !== 'all' && t !== typeFilter) return false
      return true
    })
  }, [payments, statusFilter, typeFilter])

  const currentRentPaymentMap = useMemo(
    () => mapBillingPaymentsByBooking(payments, billingPeriod.year, billingPeriod.month),
    [billingPeriod.month, billingPeriod.year, payments],
  )

  const currentRentBills = useMemo(() => {
    return contracts
      .filter((c) => isContractActiveForBillingPeriod(c, billingPeriod.year, billingPeriod.month))
      .map((c) => {
        const currentPayment = currentRentPaymentMap.get(Number(c.bookingRequestId)) || null
        const isCurrentRentPaid = isRentPaymentSuccess(currentPayment?.status)
        const isOverdue = !isCurrentRentPaid && isDueDatePassed(billingPeriod.dueDate)
        return { ...c, currentPayment, dueDate: billingPeriod.dueDate, isCurrentRentPaid, isOverdue }
      })
      .sort((a, b) => Number(b.isOverdue) - Number(a.isOverdue) || Number(a.isCurrentRentPaid) - Number(b.isCurrentRentPaid))
  }, [billingPeriod.dueDate, billingPeriod.month, billingPeriod.year, contracts, currentRentPaymentMap])

  const rentBillStats = useMemo(() => ({
    activeContracts: currentRentBills.length,
    paidThisMonth: currentRentBills.filter((b) => b.isCurrentRentPaid).length,
    dueThisMonth: currentRentBills.filter((b) => !b.isCurrentRentPaid).length,
    dueAmount: currentRentBills
      .filter((b) => !b.isCurrentRentPaid)
      .reduce((t, b) => t + Number(b.currentPayment?.amount || b.monthlyRent || 0), 0),
  }), [currentRentBills])

  const loadPayments = async () => {
    const data = await paymentApi.getMyPayments()
    const next = Array.isArray(data)
      ? [...data].sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      : []
    setPayments(next)
    return next
  }

  const loadContracts = async () => {
    const data = await contractApi.getMyContracts()
    const next = Array.isArray(data) ? data : []
    setContracts(next)
    return next
  }

  useEffect(() => {
    const init = async () => {
      setLoading(true)
      setError('')
      try {
        await Promise.all([loadPayments(), loadContracts()])
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } }
        setError(e?.response?.data?.message || 'Không thể tải danh sách thanh toán.')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [])

  useEffect(() => {
    const code = selectedPayment?.paymentCode
    const n = String(selectedPayment?.status || '').toLowerCase()
    if (!code || (n !== 'pending' && n !== 'waiting_confirm')) return undefined
    const id = window.setInterval(async () => {
      try {
        const latest = await paymentApi.getPaymentByCode(code)
        setSelectedPayment(latest)
        setPayments((prev) => prev.map((p) => (p.paymentCode === latest.paymentCode ? latest : p)))
      } catch { /* allow manual refresh */ }
    }, 10000)
    return () => window.clearInterval(id)
  }, [selectedPayment?.paymentCode, selectedPayment?.status])

  const openPayment = async (paymentCode: string) => {
    if (!paymentCode) return
    setOpeningCode(paymentCode)
    setPaymentError('')
    setMessage('')
    try {
      const payment = await paymentApi.getPaymentByCode(paymentCode)
      setSelectedPayment(payment)
      setPayments((prev) => {
        const exists = prev.some((p) => p.paymentCode === payment.paymentCode)
        return exists ? prev.map((p) => (p.paymentCode === payment.paymentCode ? payment : p)) : [payment, ...prev]
      })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setPaymentError(e?.response?.data?.message || 'Không thể mở chi tiết thanh toán.')
    } finally {
      setOpeningCode('')
    }
  }

  const refreshSelectedPayment = async () => {
    if (!selectedPayment?.paymentCode) return
    setRefreshing(true)
    setPaymentError('')
    try {
      const payment = await paymentApi.getPaymentByCode(selectedPayment.paymentCode)
      setSelectedPayment(payment)
      setPayments((prev) => {
        const exists = prev.some((p) => p.paymentCode === payment.paymentCode)
        return exists ? prev.map((p) => (p.paymentCode === payment.paymentCode ? payment : p)) : [payment, ...prev]
      })
      setMessage('Đã cập nhật trạng thái thanh toán mới nhất.')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setPaymentError(e?.response?.data?.message || 'Không thể kiểm tra trạng thái thanh toán.')
    } finally {
      setRefreshing(false)
    }
  }

  const handlePaymentChanged = (payment: Payment) => {
    setSelectedPayment(payment)
    setPayments((prev) => {
      const exists = prev.some((p) => p.paymentCode === payment.paymentCode)
      return exists ? prev.map((p) => (p.paymentCode === payment.paymentCode ? payment : p)) : [payment, ...prev]
    })
    setMessage('Đã gửi ảnh minh chứng chuyển khoản. Hãy chờ bên nhận xác nhận.')
  }

  const handlePaymentDeleted = async (payment: Payment) => {
    setPayments((prev) => prev.filter((p) => p.paymentCode !== payment.paymentCode))
    setSelectedPayment(null)
    setRefreshing(false)
    setPaymentError('')
    setMessage('Đã xóa QR hết hạn khỏi danh sách của bạn.')
  }

  const billingLabel = formatRentBillingLabel(billingPeriod.year, billingPeriod.month)
  const dueDateLabel = billingPeriod.dueDate.toLocaleDateString('vi-VN')

  if (loading) {
    return (
      <PublicLayout>
        <PageLoader />
      </PublicLayout>
    )
  }

  const primaryPaymentMetrics: PaymentMetric[] = [
    { title: 'Tổng payment', value: stats.total, icon: <ReceiptText size={18} />, tone: 'primary' },
    { title: 'Chưa thanh toán', value: stats.pendingCount, icon: <Hourglass size={18} />, tone: 'gold' },
    { title: 'Đã thanh toán', value: stats.successCount, icon: <CheckCircle2 size={18} />, tone: 'accent' },
    { title: 'Cần thanh toán', value: formatCurrency(stats.unpaidAmount), icon: <CreditCard size={18} />, tone: 'brown' },
    { title: 'Đã hết hạn', value: stats.expiredCount, icon: <XCircle size={18} />, tone: 'secondary' },
  ]

  const secondaryPaymentMetrics: PaymentMetric[] = [
    { title: 'Tổng đã thanh toán', value: formatCurrency(stats.paidAmount), icon: <CheckCircle2 size={18} />, tone: 'accent' },
    { title: 'Hợp đồng hiệu lực', value: rentBillStats.activeContracts, icon: <FileText size={18} />, tone: 'brown' },
    { title: 'Kỳ này đã trả', value: rentBillStats.paidThisMonth, icon: <CheckCircle2 size={18} />, tone: 'olive' },
    { title: 'Cần trả kỳ này', value: formatCurrency(rentBillStats.dueAmount), icon: <CreditCard size={18} />, tone: 'primary' },
  ]

  const mobilePaymentMetrics = [...primaryPaymentMetrics, ...secondaryPaymentMetrics]

  return (
    <PublicLayout>
      <div className="bg-[#FAF6EF]">
        <div className="mx-auto max-w-6xl px-3 py-5 sm:px-6 sm:py-10">
          <div className="mb-5 flex flex-col gap-4 sm:mb-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#C96A3D]/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.1em] text-[#C96A3D] sm:px-3 sm:text-xs sm:tracking-[0.14em]">
                <CreditCard size={14} />
                Thanh toán
              </div>
              <h1 className="font-display text-[22px] font-bold leading-8 text-[#292524] sm:text-3xl">Thanh toán của tôi</h1>
              <p className="mt-2 text-[13px] leading-5 text-[#78716C] sm:text-sm sm:leading-6">
                Theo dõi tiền thuê kỳ {billingLabel}, mở QR do chủ trọ tạo và kiểm tra lịch sử payment của bạn.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap">
              <Link
                to="/user/qr-settings"
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[10px] border border-[#E7D8C8] bg-white px-2 py-2 text-center text-[11px] font-medium leading-4 text-[#5B4636] transition-colors hover:bg-[#FAF6EF] hover:text-[#5B4636] sm:h-10 sm:gap-2 sm:px-4 sm:py-0 sm:text-sm"
              >
                <QrCode size={16} />
                VietQR
              </Link>
              <Link
                to="/messages"
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[10px] bg-[#C96A3D] px-2 py-2 text-center text-[11px] font-medium leading-4 text-white shadow-sm transition-colors hover:bg-[#B85C38] hover:text-white sm:h-10 sm:gap-2 sm:px-4 sm:py-0 sm:text-sm"
              >
                <MessageCircle size={16} />
                Nhắn chủ trọ
              </Link>
              <Link
                to="/user/contracts"
                className="inline-flex min-h-10 items-center justify-center gap-1.5 rounded-[10px] border border-[#E7D8C8] bg-white px-2 py-2 text-center text-[11px] font-medium leading-4 text-[#5B4636] transition-colors hover:bg-[#FAF6EF] hover:text-[#5B4636] sm:h-10 sm:gap-2 sm:px-4 sm:py-0 sm:text-sm"
              >
                <FileText size={16} />
                Hợp đồng
              </Link>
            </div>
          </div>

          <div className="mb-4 rounded-[14px] border border-[#E8DED1] bg-[linear-gradient(135deg,#FFF8F3_0%,#FFFFFF_58%,#F3E7D3_100%)] p-3 shadow-[0_14px_32px_-28px_rgb(91_70_54/0.42)] sm:mb-5 sm:rounded-[18px] sm:p-5 sm:shadow-[0_18px_48px_-32px_rgb(91_70_54/0.42)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3 sm:gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] bg-[#C96A3D]/10 text-[#C96A3D] sm:h-11 sm:w-11 sm:rounded-[12px]">
                  <CalendarClock size={22} />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9A8775] sm:text-xs sm:tracking-[0.14em]">Kỳ hiện tại</p>
                  <h2 className="mt-1 font-display text-base font-semibold text-[#2C241D] sm:text-lg">{billingLabel}</h2>
                  <p className="mt-1 text-xs leading-5 text-[#78716C] sm:text-sm">
                    Hạn thanh toán chung là ngày {dueDateLabel}. Nếu QR chưa xuất hiện, bạn cần nhắn chủ trọ tạo mã mới.
                  </p>
                </div>
              </div>
              <Badge variant={rentBillStats.dueThisMonth > 0 ? 'warning' : 'success'} className="self-start sm:self-center">
                {rentBillStats.dueThisMonth > 0 ? `${rentBillStats.dueThisMonth} kỳ chưa xong` : 'Đã xong kỳ này'}
              </Badge>
            </div>
          </div>

          <div className="mb-5 grid grid-cols-2 gap-2 sm:hidden">
            {mobilePaymentMetrics.map((metric) => (
              <MobileMetricTile key={metric.title} {...metric} />
            ))}
          </div>

          <div className="mb-6 hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-5">
            <StatCard title="Tổng payment" value={stats.total} icon={<ReceiptText size={20} />} color="primary" />
            <StatCard title="Chưa thanh toán" value={stats.pendingCount} icon={<Hourglass size={20} />} color="gold" />
            <StatCard title="Đã thanh toán" value={stats.successCount} icon={<CheckCircle2 size={20} />} color="accent" />
            <StatCard title="Cần thanh toán" value={formatCurrency(stats.unpaidAmount)} icon={<CreditCard size={20} />} color="brown" />
            <StatCard title="Đã hết hạn" value={stats.expiredCount} icon={<XCircle size={20} />} color="secondary" />
          </div>

          <div className="mb-6 hidden gap-4 sm:grid sm:grid-cols-2 xl:grid-cols-4">
            <StatCard title="Tổng đã thanh toán" value={formatCurrency(stats.paidAmount)} icon={<CheckCircle2 size={20} />} color="accent" />
            <StatCard title="Hợp đồng hiệu lực" value={rentBillStats.activeContracts} icon={<FileText size={20} />} color="brown" />
            <StatCard title="Kỳ này đã trả" value={rentBillStats.paidThisMonth} icon={<CheckCircle2 size={20} />} color="olive" />
            <StatCard title="Cần trả kỳ này" value={formatCurrency(rentBillStats.dueAmount)} icon={<CreditCard size={20} />} color="primary" />
          </div>

          <div className="mb-5 space-y-3">
            {message && (
              <div className="rounded-[12px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
                {message}
              </div>
            )}
            {error && (
              <div className="rounded-[12px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {error}
              </div>
            )}
            {paymentError && !selectedPayment && (
              <div className="rounded-[12px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
                {paymentError}
              </div>
            )}
          </div>

          <section className="mb-5 sm:mb-6">
            <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#292524] sm:text-xl">Khoản cần thanh toán</h2>
                <p className="mt-1 text-xs leading-5 text-[#78716C] sm:text-sm">Ưu tiên các QR còn đang chờ bạn xử lý, gồm tiền cọc, tiền thuê và các khoản phát sinh.</p>
              </div>
              <Badge variant={payablePayments.length > 0 ? 'warning' : 'success'}>
                {payablePayments.length > 0 ? `${payablePayments.length} khoản đang chờ` : 'Không còn khoản chờ'}
              </Badge>
            </div>

            {payablePayments.length === 0 ? (
              <Card padding="none">
                <EmptyState
                  title="Không có khoản cần thanh toán"
                  description="Các payment mới từ chủ trọ hoặc hệ thống sẽ xuất hiện ở đây để bạn mở QR nhanh."
                  icon={<CheckCircle2 size={28} />}
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
                {payablePayments.map((payment) => {
                  const status = String(payment.status || '').toLowerCase()
                  const isExpired = status === 'expired'
                  const isWaitingConfirm = status === 'waiting_confirm' || status === 'proof_submitted'
                  const isOpening = openingCode === payment.paymentCode

                  return (
                    <article
                      key={payment.paymentCode}
                      className={cn(
                        'rounded-[14px] border bg-white p-3 shadow-[0_1px_3px_0_rgb(0_0_0/0.06)] sm:rounded-[18px] sm:p-5',
                        isExpired && 'border-[#E7E5E4] bg-[#F8F7F5]',
                        isWaitingConfirm && 'border-amber-100 bg-amber-50/30',
                        !isExpired && !isWaitingConfirm && 'border-[#E8DED1]',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9A8775] sm:text-xs sm:tracking-[0.14em]">
                            {formatPaymentTypeLabel(payment.paymentType, 'tenant')}
                          </p>
                          <h3 className="mt-1 truncate font-display text-base font-semibold text-[#2C241D] sm:text-lg">
                            {payment.roomTitle || payment.description || payment.paymentCode}
                          </h3>
                          <p className="mt-0.5 truncate text-xs text-[#78716C] sm:text-sm">
                            {payment.propertyName || payment.payeeUserName || payment.payeeName || '---'}
                          </p>
                        </div>
                        <Badge
                          variant={isExpired ? 'neutral' : isWaitingConfirm ? 'warning' : 'info'}
                          size="sm"
                          className="max-w-[118px] shrink-0 justify-center text-center leading-4 sm:max-w-none"
                        >
                          {formatPaymentStatusLabel(payment.status, 'tenant')}
                        </Badge>
                      </div>

                      <div className="mt-3 rounded-[12px] border border-[#E8DED1] bg-white/75 px-3 py-2.5 sm:mt-5 sm:rounded-[14px] sm:px-4 sm:py-3">
                        <p className="text-xs font-medium text-[#9A8775]">Số tiền cần xử lý</p>
                        <p className="mt-1 truncate font-display text-xl font-bold text-[#292524] sm:text-2xl">{formatCurrency(payment.amount)}</p>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-[#5F5146] sm:mt-4 sm:text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="shrink-0 text-[#9A8775]">Mã payment</span>
                          <span className="min-w-0 break-all text-right font-medium text-[#2C241D]">{payment.paymentCode}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="shrink-0 text-[#9A8775]">Tạo lúc</span>
                          <span className="min-w-0 text-right font-medium text-[#2C241D]">{formatDateTime(payment.createdAt)}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="shrink-0 text-[#9A8775]">Hạn QR</span>
                          <span className="min-w-0 text-right font-medium text-[#2C241D]">{formatDateTime(payment.expiredAt)}</span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                        <Button
                          type="button"
                          size="sm"
                          variant={isExpired ? 'outline' : 'primary'}
                          loading={isOpening}
                          leftIcon={<CreditCard size={14} />}
                          className="max-sm:flex-1"
                          onClick={() => openPayment(payment.paymentCode)}
                        >
                          {isWaitingConfirm ? 'Xem minh chứng' : isExpired ? 'Xem QR hết hạn' : 'Thanh toán ngay'}
                        </Button>
                        {payment.bookingCode && (
                          <span className="inline-flex h-8 items-center rounded-[10px] bg-[#F5F0EC] px-3 text-xs font-semibold text-[#8A7663]">
                            Booking {payment.bookingCode}
                          </span>
                        )}
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <section className="mb-5 sm:mb-6">
            <div className="mb-3 flex flex-col gap-2 sm:mb-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="font-display text-lg font-semibold text-[#292524] sm:text-xl">Tiền thuê kỳ hiện tại</h2>
                <p className="mt-1 text-xs leading-5 text-[#78716C] sm:text-sm">Giữ nguyên từng khoản theo hợp đồng đang hiệu lực và mở QR ngay khi có mã.</p>
              </div>
            </div>

            {currentRentBills.length === 0 ? (
              <Card padding="none">
                <EmptyState
                  title="Chưa có hợp đồng hiệu lực"
                  description={`Bạn chưa có hợp đồng thuê nào còn hiệu lực trong kỳ ${billingLabel}.`}
                  icon={<FileText size={28} />}
                />
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 sm:gap-4 lg:grid-cols-2">
                {currentRentBills.map((bill) => {
                  const tone = getCurrentRentBillTone(bill.currentPayment, bill.isOverdue)
                  const isOpening = openingCode === bill.currentPayment?.paymentCode
                  return (
                    <article
                      key={bill.id}
                      className={cn(
                        'rounded-[14px] border bg-white p-3 shadow-[0_1px_3px_0_rgb(0_0_0/0.06)] sm:rounded-[18px] sm:p-5',
                        tone === 'success' && 'border-emerald-100 bg-emerald-50/30',
                        (tone === 'pending' || tone === 'waiting_confirm') && 'border-amber-100 bg-amber-50/30',
                        tone === 'due' && 'border-red-100 bg-red-50/30',
                        tone === 'expired' && 'border-[#E7E5E4] bg-[#F8F7F5]',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3 sm:gap-4">
                        <div className="flex min-w-0 gap-3">
                          <div className={cn(
                            'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] sm:h-10 sm:w-10',
                            tone === 'success' && 'bg-emerald-100 text-emerald-700',
                            (tone === 'pending' || tone === 'waiting_confirm') && 'bg-amber-100 text-amber-700',
                            tone === 'due' && 'bg-red-100 text-red-600',
                            (tone === 'missing' || tone === 'expired') && 'bg-[#F3E7D3] text-[#8A6244]',
                          )}>
                            {getCurrentRentBillIcon(tone)}
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-[#9A8775] sm:text-xs sm:tracking-[0.14em]">{billingLabel}</p>
                            <h3 className="mt-1 truncate font-display text-base font-semibold text-[#2C241D] sm:text-lg">{bill.roomTitle || 'Phòng thuê'}</h3>
                            <p className="truncate text-xs text-[#78716C] sm:text-sm">{bill.propertyName || '---'}</p>
                          </div>
                        </div>
                        <Badge
                          variant={getCurrentRentBillBadgeVariant(bill.currentPayment, bill.isOverdue)}
                          size="sm"
                          className="max-w-[124px] shrink-0 justify-center text-center leading-4 sm:max-w-none"
                        >
                          {getCurrentRentBillLabel(bill.currentPayment, bill.isOverdue)}
                        </Badge>
                      </div>

                      <div className="mt-3 rounded-[12px] border border-[#E8DED1] bg-white/70 px-3 py-2.5 sm:mt-5 sm:rounded-[14px] sm:px-4 sm:py-3">
                        <p className="text-xs font-medium text-[#9A8775]">Tiền thuê tháng này</p>
                        <p className="mt-1 truncate font-display text-xl font-bold text-[#292524] sm:text-2xl">
                          {formatCurrency(bill.currentPayment?.amount || bill.monthlyRent)}
                        </p>
                      </div>

                      <div className="mt-3 grid gap-2 text-xs text-[#5F5146] sm:mt-4 sm:text-sm">
                        <div className="flex items-center justify-between gap-3">
                          <span className="shrink-0 text-[#9A8775]">Hạn thanh toán</span>
                          <span className="min-w-0 text-right font-medium text-[#2C241D]">{bill.dueDate.toLocaleDateString('vi-VN')}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="shrink-0 text-[#9A8775]">Hợp đồng</span>
                          <span className="min-w-0 break-all text-right font-medium text-[#2C241D]">{bill.contractCode || '---'}</span>
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className="shrink-0 text-[#9A8775]">QR</span>
                          <span className="min-w-0 text-right font-medium text-[#2C241D]">
                            {bill.currentPayment ? formatDateTime(bill.currentPayment.createdAt) : 'Chưa phát hành'}
                          </span>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2 sm:mt-5">
                        {bill.currentPayment ? (
                          <Button
                            type="button"
                            size="sm"
                            variant={bill.isCurrentRentPaid ? 'outline' : bill.isOverdue ? 'danger' : 'primary'}
                            loading={isOpening}
                            leftIcon={<CreditCard size={14} />}
                            className="max-sm:flex-1"
                            onClick={() => bill.currentPayment && openPayment(bill.currentPayment.paymentCode)}
                          >
                            {bill.isCurrentRentPaid ? 'Xem chi tiết' : 'Mở QR tháng này'}
                          </Button>
                        ) : (
                          <Link
                            to="/messages"
                            className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[#E7D8C8] bg-white px-3 text-sm font-medium text-[#5B4636] transition-colors hover:bg-[#FAF6EF] hover:text-[#5B4636] sm:flex-none"
                          >
                            <MessageCircle size={14} />
                            Nhắn chủ trọ
                          </Link>
                        )}
                        <Link
                          to="/user/contracts"
                          className="inline-flex h-8 flex-1 items-center justify-center gap-1.5 rounded-[10px] border border-[#E7E5E4] bg-white px-3 text-sm font-medium text-[#78716C] transition-colors hover:bg-[#F5F5F4] hover:text-[#57534E] sm:flex-none"
                        >
                          <FileText size={14} />
                          Xem hợp đồng
                        </Link>
                      </div>
                    </article>
                  )
                })}
              </div>
            )}
          </section>

          <Card padding="none" className="overflow-hidden">
            <div className="border-b border-[#E8DED1] px-3 py-3 sm:px-5 sm:py-4">
              <CardHeader className="mb-3 items-start max-sm:flex-col max-sm:gap-2 sm:mb-4">
                <div>
                  <CardTitle className="text-base sm:text-base">Theo dõi payment</CardTitle>
                  <p className="mt-1 text-xs leading-5 text-[#78716C] sm:text-sm">Lọc nhanh các khoản đã thanh toán hoặc còn cần xử lý.</p>
                </div>
                <Badge variant="autumn">{filteredPayments.length} kết quả</Badge>
              </CardHeader>
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <Select label="Trạng thái" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                  <option value="all">Tất cả</option>
                  <option value="unpaid">Chưa thanh toán</option>
                  <option value="paid">Đã thanh toán</option>
                </Select>
                <Select label="Loại payment" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                  <option value="all">Tất cả</option>
                  <option value="deposit">Tiền cọc</option>
                  <option value="rent">Tiền thuê</option>
                  <option value="service">Phí dịch vụ</option>
                  <option value="listing_fee">Phí đăng tin</option>
                </Select>
              </div>
            </div>

            <MobilePaymentHistory
              payments={filteredPayments}
              openingCode={openingCode}
              emptyTitle={payments.length === 0 ? 'Chưa có payment' : 'Không có kết quả phù hợp'}
              emptyDescription={payments.length === 0 ? 'Chủ trọ chưa gửi payment nào cho bạn.' : 'Thử đổi trạng thái hoặc loại payment để xem dữ liệu khác.'}
              onOpen={(payment) => openPayment(payment.paymentCode)}
            />
            <div className="hidden sm:block">
              <PaymentHistoryTable
                payments={filteredPayments}
                viewer="tenant"
                openingCode={openingCode}
                emptyTitle={payments.length === 0 ? 'Chưa có payment' : 'Không có kết quả phù hợp'}
                emptyDescription={payments.length === 0 ? 'Chủ trọ chưa gửi payment nào cho bạn.' : 'Thử đổi trạng thái hoặc loại payment để xem dữ liệu khác.'}
                onOpen={(payment) => openPayment(payment.paymentCode)}
              />
            </div>
          </Card>

          {selectedPayment && (
            <PaymentQrModal
              payment={selectedPayment}
              onClose={() => { setSelectedPayment(null); setRefreshing(false); setPaymentError('') }}
              onRefresh={refreshSelectedPayment}
              refreshing={refreshing}
              error={paymentError}
              onPaymentChanged={handlePaymentChanged}
              onPaymentDeleted={handlePaymentDeleted}
            />
          )}
        </div>
      </div>
    </PublicLayout>
  )
}
