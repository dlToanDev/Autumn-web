import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CalendarDays, CheckCircle, QrCode, ReceiptText, RefreshCw, WalletCards } from 'lucide-react'
import ManagementLayout from '@/components/layout/ManagementLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import { ConfirmDialog } from '@/components/ui/Modal'
import { EmptyState, TableSkeleton } from '@/components/ui/Skeleton'
import PaymentQrModal from '@/components/PaymentQrModal'
import { paymentApi } from '@/api/paymentApi'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { CommissionBilling, Payment } from '@/types'

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

export default function AdminCommissionPaymentsPage() {
  const qc = useQueryClient()
  const [period, setPeriod] = useState(getCurrentPeriod)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [paymentError, setPaymentError] = useState('')
  const [paymentRefreshing, setPaymentRefreshing] = useState(false)
  const [markTarget, setMarkTarget] = useState<CommissionBilling | null>(null)

  const { year, month } = useMemo(() => parsePeriod(period), [period])

  const { data: commissions = [], isLoading } = useQuery({
    queryKey: ['admin-commissions', year, month],
    queryFn: () => paymentApi.getAdminCommissionBilling({ year, month }),
  })

  const stats = useMemo(() => {
    return commissions.reduce(
      (acc, item) => {
        acc.landlords += 1
        acc.grossRevenue += Number(item.grossRevenue || 0)
        acc.totalGrossRevenue += Number(item.totalGrossRevenue || item.totalRevenue || item.grossRevenue || 0)
        acc.commission += Number(item.commissionAmount || item.amount || 0)
        if (isPaid(item.status)) acc.paid += 1
        if (needsConfirmation(item.status)) acc.waitingConfirm += 1
        return acc
      },
      { landlords: 0, grossRevenue: 0, totalGrossRevenue: 0, commission: 0, paid: 0, waitingConfirm: 0 },
    )
  }, [commissions])

  const invalidateCommission = () => {
    qc.invalidateQueries({ queryKey: ['admin-commissions'] })
  }

  const { mutate: genQr, isPending: qrLoading } = useMutation({
    mutationFn: (landlordId: number) => paymentApi.createAdminCommissionVietQr({ landlordId, year, month }),
    onSuccess: (payment) => {
      setSelectedPayment(payment)
      invalidateCommission()
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
      invalidateCommission()
      toast.success('Đã xác nhận hoa hồng.')
      setMarkTarget(null)
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
      invalidateCommission()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setPaymentError(e?.response?.data?.message || e?.message || 'Không thể cập nhật trạng thái payment.')
    } finally {
      setPaymentRefreshing(false)
    }
  }

  return (
    <ManagementLayout role="ADMIN">
      <div className="mx-auto max-w-6xl p-6">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#F5E5D1] px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em] text-[#B85C38]">
              <WalletCards size={14} />
              Hoa hồng
            </div>
            <h1 className="font-display text-2xl font-bold text-[#292524]">Hoa hồng theo tháng</h1>
            <p className="mt-1 text-sm text-[#78716C]">Danh sách chủ trọ có doanh thu trong kỳ để admin tạo QR thu hoa hồng.</p>
          </div>
          <div className="w-full max-w-xs">
            <Input
              label="Kỳ hoa hồng"
              type="month"
              value={period}
              onChange={(event) => setPeriod(event.target.value || getCurrentPeriod())}
              leftIcon={<CalendarDays size={16} />}
            />
          </div>
        </div>

        <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Chủ trọ trong kỳ" value={stats.landlords.toString()} />
          <StatCard label="Doanh thu kỳ này" value={formatCurrency(stats.grossRevenue)} />
          <StatCard label="Tổng đã thu" value={formatCurrency(stats.totalGrossRevenue)} />
          <StatCard label="Hoa hồng cần thu" value={formatCurrency(stats.commission)} highlight />
          <StatCard label="Chờ xác nhận" value={stats.waitingConfirm.toString()} />
        </div>

        <div className="rounded-[22px] border border-[#E8DED1] bg-white/95 shadow-[0_18px_48px_-28px_rgb(91_70_54/0.34)] backdrop-blur-sm">
          <div className="flex flex-col gap-3 border-b border-[#E8DED1] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold text-[#292524]">Danh sách chủ trọ tháng {String(month).padStart(2, '0')}/{year}</h2>
              <p className="mt-1 text-sm text-[#78716C]">Tạo QR một lần cho từng chủ trọ, sau đó chủ trọ sẽ thấy khoản này ở mục Hoa hồng.</p>
            </div>
            <Button variant="outline" leftIcon={<RefreshCw size={16} />} onClick={invalidateCommission}>
              Làm mới
            </Button>
          </div>

          {isLoading ? (
            <div className="p-5">
              <TableSkeleton rows={5} cols={5} />
            </div>
          ) : commissions.length === 0 ? (
            <div className="p-10">
              <EmptyState title="Chưa có hoa hồng trong kỳ này" />
            </div>
          ) : (
            <div className="divide-y divide-[#E8DED1]">
              {commissions.map((item) => {
                const paid = isPaid(item.status)
                const confirmable = needsConfirmation(item.status) && !!item.paymentCode

                return (
                  <div key={`${item.landlordId}-${item.billingMonth}`} className="grid gap-4 px-5 py-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,0.95fr)_minmax(0,0.8fr)_auto] lg:items-center">
                    <div className="min-w-0">
                      <p className="font-semibold text-[#292524]">{item.landlordName || 'Chủ trọ'}</p>
                      <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#78716C]">
                        <span>{item.landlordEmail || 'Chưa có email'}</span>
                        <span>{item.landlordPhone || 'Chưa có SĐT'}</span>
                      </div>
                      <p className="mt-2 font-mono text-xs text-[#A08A76]">{item.paymentCode || item.billingCode || 'Chưa tạo QR'}</p>
                    </div>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                      <MiniMetric label="Kỳ này" value={formatCurrency(item.grossRevenue || 0)} />
                      <MiniMetric label="Tổng đã thu" value={formatCurrency(item.totalGrossRevenue || item.totalRevenue || item.grossRevenue || 0)} />
                      <MiniMetric label={`Hoa hồng ${item.commissionRate || 0}%`} value={formatCurrency(item.commissionAmount || item.amount || 0)} highlight />
                    </div>

                    <div className="flex flex-col items-start gap-2">
                      <Badge variant={getStatusBadgeVariant(item.status)} size="sm">{getStatusLabel(item.status)}</Badge>
                      <span className="text-xs text-[#78716C]">
                        {item.paidAt ? `Đã trả ${formatDate(item.paidAt)}` : item.dueDate ? `Tạo QR ${formatDate(item.dueDate)}` : 'Chưa phát sinh payment'}
                      </span>
                    </div>

                    <div className="flex flex-wrap justify-start gap-2 lg:justify-end">
                      {item.paymentCode ? (
                        <Button
                          size="sm"
                          variant={paid ? 'ghost' : 'outline'}
                          leftIcon={<QrCode size={14} />}
                          onClick={() => openPayment(item.paymentCode!)}
                          loading={openingPayment}
                        >
                          {paid ? 'Chi tiết' : 'Mở QR'}
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          leftIcon={<QrCode size={14} />}
                          onClick={() => genQr(item.landlordId)}
                          loading={qrLoading}
                        >
                          Tạo QR
                        </Button>
                      )}
                      {confirmable && (
                        <Button size="sm" leftIcon={<CheckCircle size={14} />} onClick={() => setMarkTarget(item)}>
                          Xác nhận
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {selectedPayment && (
        <PaymentQrModal
          payment={selectedPayment}
          onClose={() => setSelectedPayment(null)}
          onRefresh={refreshSelectedPayment}
          refreshing={paymentRefreshing}
          error={paymentError}
          onPaymentChanged={(payment) => {
            setSelectedPayment(payment)
            invalidateCommission()
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

      <ConfirmDialog
        open={!!markTarget}
        onClose={() => setMarkTarget(null)}
        onConfirm={() => markTarget?.paymentCode && markPaid(markTarget.paymentCode)}
        title="Xác nhận đã thu hoa hồng?"
        message={`Xác nhận khoản hoa hồng ${formatCurrency(markTarget?.amount || 0)} của ${markTarget?.landlordName || 'chủ trọ'} đã được thanh toán?`}
        loading={marking}
      />
    </ManagementLayout>
  )
}

function StatCard({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-[18px] border border-[#E8DED1] bg-white px-5 py-4 shadow-[0_12px_30px_-24px_rgb(91_70_54/0.45)]">
      <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#F5E5D1] text-[#B85C38]">
        <ReceiptText size={17} />
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9A8775]">{label}</p>
      <p className={`mt-2 font-display text-xl font-bold ${highlight ? 'text-[#B85C38]' : 'text-[#292524]'}`}>{value}</p>
    </div>
  )
}

function MiniMetric({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="rounded-[14px] border border-[#E8DED1] bg-[#FFFCF8] px-3 py-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#9A8775]">{label}</p>
      <p className={`mt-1 text-sm font-semibold ${highlight ? 'text-[#B85C38]' : 'text-[#292524]'}`}>{value}</p>
    </div>
  )
}
