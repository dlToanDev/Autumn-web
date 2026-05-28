import { useEffect, useState } from 'react'
import { AlertTriangle, CheckCircle2, Copy, ExternalLink, RefreshCw, Trash2, Upload, X } from 'lucide-react'
import { paymentApi } from '@/api/paymentApi'
import { fileToDataUrl } from '@/utils/file'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import type { Payment } from '@/types'

function formatPaymentStatusLabel(value?: string | null) {
  const n = String(value || '').toLowerCase()
  if (n === 'pending') return 'Đang chờ thanh toán'
  if (n === 'waiting_confirm' || n === 'proof_submitted') return 'Chờ bên nhận xác nhận'
  if (n === 'success' || n === 'paid' || n === 'confirmed') return 'Đã xác nhận thanh toán'
  if (n === 'failed' || n === 'rejected') return 'Thanh toán thất bại'
  if (n === 'canceled') return 'Đã hủy'
  if (n === 'expired') return 'QR đã hết hạn'
  return value || '---'
}

function formatPaymentTypeLabel(value?: string | null) {
  const n = String(value || '').toLowerCase()
  if (n === 'deposit') return 'Tiền cọc'
  if (n === 'rent') return 'Tiền thuê'
  if (n === 'service') return 'Phí dịch vụ / đăng ký'
  if (n === 'listing_fee' || n === 'commission') return 'Hoa hồng'
  return value || '---'
}

function formatBookingStatusLabel(value?: string | null) {
  const n = String(value || '').toLowerCase()
  if (n === 'pending') return 'Đang chờ xử lý'
  if (n === 'waiting_payment') return 'Chờ thanh toán'
  if (n === 'paid') return 'Đã thanh toán'
  if (n === 'confirmed') return 'Đã xác nhận'
  if (n === 'rejected') return 'Đã từ chối'
  if (n === 'canceled') return 'Đã hủy'
  if (n === 'expired') return 'Hết hạn'
  return value || '---'
}

function getPaymentBadgeVariant(value?: string | null) {
  const n = String(value || '').toLowerCase()
  if (n === 'success' || n === 'paid' || n === 'confirmed') return 'success'
  if (n === 'waiting_confirm' || n === 'proof_submitted' || n === 'pending') return 'warning'
  if (n === 'failed' || n === 'rejected' || n === 'canceled') return 'danger'
  return 'neutral'
}

function PaymentCopyField({ label, value }: { label: string; value?: string | null }) {
  const [copyState, setCopyState] = useState('')

  useEffect(() => {
    if (!copyState) return undefined
    const timer = window.setTimeout(() => setCopyState(''), 1800)
    return () => window.clearTimeout(timer)
  }, [copyState])

  const copyValue = async () => {
    if (!value) return
    try {
      await navigator.clipboard.writeText(String(value))
      setCopyState('Đã sao chép')
    } catch {
      setCopyState('Không sao chép được')
    }
  }

  return (
    <div className="rounded-[14px] border border-[#E8DED1] bg-white px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9A8775]">{label}</p>
          <p className="mt-1 break-words text-sm font-semibold text-[#2C241D]">{value || '---'}</p>
        </div>
        <button
          type="button"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border border-[#E7D8C8] text-[#8A6244] transition-colors hover:bg-[#FAF6EF] disabled:cursor-not-allowed disabled:opacity-40"
          onClick={copyValue}
          disabled={!value}
          title="Sao chép"
        >
          <Copy size={14} />
        </button>
      </div>
      {copyState && <p className="mt-2 text-xs font-medium text-[#7A8450]">{copyState}</p>}
    </div>
  )
}

function PaymentStatusMessage({ status, isPayer }: { status?: string | null; isPayer: boolean }) {
  const n = String(status || '').toLowerCase()

  if (n === 'success' || n === 'paid' || n === 'confirmed') {
    return (
      <div className="rounded-[14px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
        Bên nhận đã xác nhận thanh toán thành công.
      </div>
    )
  }
  if (n === 'waiting_confirm' || n === 'proof_submitted') {
    return (
      <div className="rounded-[14px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
        {isPayer
          ? 'Bạn đã gửi ảnh minh chứng chuyển khoản. Hãy chờ bên nhận kiểm tra và xác nhận.'
          : 'Người chuyển tiền đã gửi ảnh minh chứng. Hãy kiểm tra và bấm xác nhận nếu hợp lệ.'}
      </div>
    )
  }
  if (n === 'expired') {
    return (
      <div className="rounded-[14px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
        Mã QR này đã hết hạn. Nếu bạn đã chuyển khoản, vẫn có thể tải ảnh minh chứng để bên nhận kiểm tra thủ công.
      </div>
    )
  }
  if (n === 'canceled') {
    return (
      <div className="rounded-[14px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
        Payment này đã bị hủy vì booking không còn hợp lệ hoặc đã được xử lý theo hướng khác.
      </div>
    )
  }
  if (n === 'failed' || n === 'rejected') {
    return (
      <div className="rounded-[14px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
        Thanh toán chưa hoàn tất. Bạn có thể kiểm tra lại thông tin chuyển khoản và thử lại.
      </div>
    )
  }
  return (
    <div className="rounded-[14px] border border-blue-100 bg-blue-50 px-4 py-3 text-sm font-medium text-blue-700">
      Quét mã VietQR hoặc chuyển khoản đúng số tiền và nội dung bên dưới. Sau khi chuyển xong, hãy tải ảnh minh chứng và gửi cho bên nhận xác nhận.
    </div>
  )
}

interface PaymentQrModalProps {
  payment: Payment
  onClose: () => void
  onRefresh: () => void
  refreshing?: boolean
  error?: string
  actionArea?: React.ReactNode
  onPaymentChanged?: (payment: Payment) => void
  onPaymentDeleted?: (payment: Payment) => Promise<void> | void
}

export default function PaymentQrModal({
  payment,
  onClose,
  onRefresh,
  refreshing = false,
  error = '',
  actionArea = null,
  onPaymentChanged,
  onPaymentDeleted,
}: PaymentQrModalProps) {
  const [proofImageUrl, setProofImageUrl] = useState('')
  const [proofLoading, setProofLoading] = useState(false)
  const [proofSubmitting, setProofSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [proofError, setProofError] = useState('')

  useEffect(() => {
    setProofImageUrl(payment?.transferProofImageUrl || '')
    setProofError('')
  }, [payment?.paymentCode, payment?.transferProofImageUrl])

  if (!payment) return null

  // Read current user from Zustand-persisted storage
  const currentUserId = (() => {
    try {
      const raw = localStorage.getItem('auth-storage')
      if (!raw) return 0
      const parsed = JSON.parse(raw)
      return Number(parsed?.state?.user?.id || 0)
    } catch {
      return 0
    }
  })()

  const n = String(payment.status || '').toLowerCase()
  const canRefresh = n === 'pending' || n === 'waiting_confirm' || n === 'proof_submitted' || n === 'expired'
  const isPayer = currentUserId > 0 && Number(payment.payerId) === currentUserId
  const canSubmitProof = isPayer && n !== 'success' && n !== 'paid' && n !== 'confirmed' && n !== 'canceled' && n !== 'failed'
  const canDeleteExpired = n === 'expired'

  const handleProofFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    setProofLoading(true)
    setProofError('')
    try {
      const dataUrl = await fileToDataUrl(file)
      setProofImageUrl(dataUrl)
    } catch (err: unknown) {
      setProofError((err as Error)?.message || 'Không thể đọc file minh chứng.')
    } finally {
      setProofLoading(false)
      event.target.value = ''
    }
  }

  const handleSubmitProof = async () => {
    if (!proofImageUrl || proofSubmitting) return
    setProofSubmitting(true)
    setProofError('')
    try {
      const updated = await paymentApi.submitProof(payment.paymentCode, proofImageUrl)
      onPaymentChanged?.(updated)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setProofError(e?.response?.data?.message || 'Không thể gửi ảnh minh chứng lúc này.')
    } finally {
      setProofSubmitting(false)
    }
  }

  const handleDeleteExpired = async () => {
    if (!canDeleteExpired || deleting) return
    const ok = window.confirm('QR này đã hết hạn. Bạn có muốn xóa payment cũ để tạo QR mới không?')
    if (!ok) return
    setDeleting(true)
    setProofError('')
    try {
      await paymentApi.deletePayment(payment.paymentCode)
      await onPaymentDeleted?.(payment)
      onClose?.()
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setProofError(e?.response?.data?.message || 'Không thể xóa QR hết hạn lúc này.')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-[#1C1917]/55 p-3 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div
        className="flex max-h-[92vh] min-w-0 w-full max-w-6xl flex-col overflow-hidden rounded-[18px] border border-white/60 bg-[#FAF6EF] shadow-[0_28px_90px_-28px_rgb(28_25_23/0.65)] sm:rounded-[24px]"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E8DED1] bg-white px-4 py-4 sm:gap-4 sm:px-6 sm:py-5">
          <div className="min-w-0">
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <Badge variant={getPaymentBadgeVariant(payment.status)}>{formatPaymentStatusLabel(payment.status)}</Badge>
              <span className="rounded-full bg-[#F5F0EC] px-2.5 py-1 text-xs font-semibold text-[#8A7663]">
                {formatPaymentTypeLabel(payment.paymentType)}
              </span>
            </div>
            <h2 className="font-display text-xl font-bold text-[#292524]">Thanh toán QR</h2>
            <p className="mt-1 break-all text-sm text-[#78716C]">{payment.paymentCode}</p>
          </div>
          <button
            type="button"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] text-[#78716C] transition-colors hover:bg-[#F5F0EC] hover:text-[#292524]"
            onClick={onClose}
            title="Đóng"
          >
            <X size={18} />
          </button>
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
          <div className="mb-4 space-y-3">
            <PaymentStatusMessage status={payment.status} isPayer={isPayer} />
            {error && <div className="rounded-[14px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}
            {proofError && <div className="rounded-[14px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{proofError}</div>}
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-[minmax(280px,380px)_minmax(0,1fr)]">
            <section className="space-y-4">
              <div className="rounded-[22px] border border-[#E8DED1] bg-white p-5 shadow-[0_18px_48px_-32px_rgb(91_70_54/0.45)]">
                {payment.qrImageUrl ? (
                  <img src={payment.qrImageUrl} alt={`QR ${payment.paymentCode}`} className="mx-auto w-full max-w-[320px] rounded-[18px] bg-white" />
                ) : (
                  <div className="flex min-h-[320px] items-center justify-center rounded-[18px] border border-dashed border-[#D8C6B4] bg-[#FFFBF7] p-6 text-center text-sm text-[#78716C]">
                    Chưa tạo được ảnh QR. Bạn vẫn có thể chuyển khoản thủ công bằng thông tin bên cạnh.
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-[16px] border border-[#E8DED1] bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9A8775]">Số tiền</p>
                  <p className="mt-1 font-display text-2xl font-bold text-[#292524]">{formatCurrency(payment.amount)}</p>
                </div>
                <div className="rounded-[16px] border border-[#E8DED1] bg-white px-4 py-3">
                  <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9A8775]">Booking / phòng</p>
                  <p className="mt-1 text-sm font-semibold text-[#292524]">{payment.bookingCode || '---'}</p>
                  <p className="mt-0.5 text-xs text-[#78716C]">{payment.roomTitle || '---'}</p>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <PaymentCopyField label="Ngân hàng" value={payment.bankCode} />
                <PaymentCopyField label="Số tài khoản" value={payment.bankAccountNo} />
                <PaymentCopyField label="Tên tài khoản" value={payment.accountName} />
                <PaymentCopyField label="Nội dung chuyển khoản" value={payment.qrContent} />
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
                <MetaCard label="Tạo lúc" value={formatDateTime(payment.createdAt)} />
                <MetaCard label="Hết hạn lúc" value={formatDateTime(payment.expiredAt)} />
                <MetaCard label="Thanh toán lúc" value={formatDateTime(payment.paidAt)} />
                <MetaCard label="Mã tham chiếu" value={payment.transactionRef || 'Chưa có'} />
                <MetaCard label="Gửi minh chứng lúc" value={formatDateTime(payment.proofSubmittedAt)} />
                {payment.bookingStatus && <MetaCard label="Trạng thái booking" value={formatBookingStatusLabel(payment.bookingStatus)} />}
              </div>

              {payment.rentPaymentDetail && (
                <div className="rounded-[18px] border border-[#E8DED1] bg-white p-5">
                  <div className="mb-4">
                    <h3 className="font-display text-base font-semibold text-[#292524]">Chi tiết tiền thuê tháng</h3>
                    <p className="mt-1 text-sm text-[#78716C]">Các khoản chủ trọ đã lập trước khi gửi QR.</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <MetaCard label="Tiền phòng" value={formatCurrency(payment.rentPaymentDetail.baseRent)} />
                    <MetaCard label="Tiền điện" value={payment.rentPaymentDetail.electricityFormatted || formatCurrency(payment.rentPaymentDetail.electricityAmount)} />
                    <MetaCard label="Tiền nước" value={payment.rentPaymentDetail.waterFormatted || formatCurrency(payment.rentPaymentDetail.waterAmount)} />
                    <MetaCard label="Phụ phí khác" value={formatCurrency(payment.rentPaymentDetail.otherFees)} />
                  </div>
                  {payment.rentPaymentDetail.notes && (
                    <div className="mt-3 rounded-[14px] border border-[#E8DED1] bg-[#FAF7F4] px-4 py-3">
                      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9A8775]">Ghi chú</p>
                      <p className="mt-1 whitespace-pre-line text-sm text-[#5F5146]">{payment.rentPaymentDetail.notes}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="rounded-[18px] border border-[#E8DED1] bg-white p-5">
              <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-display text-base font-semibold text-[#292524]">Ảnh minh chứng chuyển khoản</h3>
                    <p className="mt-1 text-sm text-[#78716C]">Tải ảnh xác nhận giao dịch sau khi chuyển khoản thành công.</p>
                  </div>
                  <Upload size={18} className="shrink-0 text-[#C96A3D]" />
                </div>

                {proofImageUrl ? (
                  <img src={proofImageUrl} alt={`Minh chứng ${payment.paymentCode}`} className="max-h-[260px] w-full rounded-[14px] border border-[#E8DED1] object-contain" />
                ) : (
                  <div className="rounded-[14px] border border-dashed border-[#D8C6B4] bg-[#FFFBF7] px-4 py-8 text-center text-sm text-[#9A8775]">
                    Chưa có ảnh minh chứng nào được gửi lên.
                  </div>
                )}

                {canSubmitProof && (
                  <div className="mt-4 space-y-3">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleProofFileChange}
                      disabled={proofLoading || proofSubmitting}
                      className="w-full text-sm text-[#57534E] file:mr-3 file:rounded-[8px] file:border-0 file:bg-[#F3E7D3] file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-[#5B4636] hover:file:bg-[#E8D5BC]"
                    />
                    <Button type="button" onClick={handleSubmitProof} loading={proofSubmitting} disabled={!proofImageUrl || proofLoading || proofSubmitting} leftIcon={<CheckCircle2 size={16} />}>
                      Tôi đã chuyển khoản, gửi xác nhận
                    </Button>
                  </div>
                )}
              </div>

              <div className="flex gap-3 rounded-[16px] border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertTriangle size={18} className="mt-0.5 shrink-0" />
                <p>Nếu app ngân hàng không quét được QR, hãy chuyển khoản thủ công đúng số tiền và đúng nội dung hiển thị.</p>
              </div>
            </section>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#E8DED1] bg-white px-4 py-4 sm:px-6">
          {canRefresh && (
            <Button type="button" onClick={onRefresh} loading={refreshing} leftIcon={<RefreshCw size={16} />}>
              Kiểm tra trạng thái
            </Button>
          )}
          {canDeleteExpired && (
            <Button type="button" variant="ghost" onClick={handleDeleteExpired} loading={deleting} leftIcon={<Trash2 size={16} />}>
              Xóa QR hết hạn
            </Button>
          )}
          {payment.qrImageUrl && (
            <a href={payment.qrImageUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-10 max-w-full items-center justify-center gap-2 rounded-[10px] border border-[#E7D8C8] bg-white px-4 py-2 text-center text-sm font-medium leading-snug text-[#5B4636] transition-colors hover:bg-[#FAF6EF] hover:text-[#5B4636]">
              <ExternalLink size={16} />
              Mở ảnh QR
            </a>
          )}
          {actionArea}
        </div>
      </div>
    </div>
  )
}

function MetaCard({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-[14px] border border-[#E8DED1] bg-white px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9A8775]">{label}</p>
      <p className="mt-1 break-words text-sm font-semibold text-[#2C241D]">{value || '---'}</p>
    </div>
  )
}
