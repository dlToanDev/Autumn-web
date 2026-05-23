import type { Payment } from '@/types'

export type PaymentViewer = 'tenant' | 'landlord' | 'admin'
export type BadgeTone = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'autumn'

export function formatPaymentStatusLabel(value?: string | null, viewer: PaymentViewer = 'tenant') {
  const n = String(value || '').toLowerCase()
  if (n === 'pending') return 'Đang chờ thanh toán'
  if (n === 'waiting_confirm' || n === 'proof_submitted') {
    if (viewer === 'admin') return 'Chờ admin xác nhận'
    if (viewer === 'landlord') return 'Chờ bạn xác nhận'
    return 'Chờ bên nhận xác nhận'
  }
  if (n === 'success' || n === 'paid' || n === 'confirmed') return 'Đã xác nhận thanh toán'
  if (n === 'failed' || n === 'rejected') return 'Thanh toán thất bại'
  if (n === 'canceled') return 'Đã hủy'
  if (n === 'expired') return 'QR đã hết hạn'
  return value || '---'
}

export function formatPaymentTypeLabel(value?: string | null, viewer: PaymentViewer = 'tenant') {
  const n = String(value || '').toLowerCase()
  if (n === 'deposit') return 'Tiền cọc'
  if (n === 'rent') return 'Tiền thuê'
  if (n === 'service') return 'Phí dịch vụ'
  if (n === 'listing_fee' || n === 'commission') {
    if (viewer === 'admin') return 'Hoa hồng chủ trọ'
    if (viewer === 'landlord') return 'Hoa hồng admin'
    return 'Phí đăng tin'
  }
  return value || '---'
}

export function getPaymentBadgeVariant(value?: string | null): BadgeTone {
  const n = String(value || '').toLowerCase()
  if (n === 'success' || n === 'paid' || n === 'confirmed') return 'success'
  if (n === 'waiting_confirm' || n === 'proof_submitted') return 'warning'
  if (n === 'pending') return 'info'
  if (n === 'failed' || n === 'rejected' || n === 'canceled') return 'danger'
  if (n === 'expired') return 'neutral'
  return 'neutral'
}

export function isPaidStatus(status?: string | null) {
  const n = String(status || '').toLowerCase()
  return n === 'success' || n === 'paid' || n === 'confirmed'
}

export function isWaitingConfirmStatus(status?: string | null) {
  const n = String(status || '').toLowerCase()
  return n === 'waiting_confirm' || n === 'proof_submitted'
}

export function isIncomingPayment(payment: Payment, currentUserId: number) {
  return Number(payment?.payeeUserId || payment?.payeeId || 0) === Number(currentUserId || 0)
}

export function isOutgoingPayment(payment: Payment, currentUserId: number) {
  return Number(payment?.payerId || 0) === Number(currentUserId || 0)
}

export function canConfirmIncomingPayment(payment: Payment, currentUserId: number) {
  return isWaitingConfirmStatus(payment?.status) && isIncomingPayment(payment, currentUserId)
}

export function sumPaymentAmount(payments: Payment[]) {
  return payments.reduce((total, payment) => total + Number(payment.amount || 0), 0)
}

export function formatBillingPeriod(payment: Payment) {
  if (payment.billingMonth && payment.billingYear) {
    return `${String(payment.billingMonth).padStart(2, '0')}/${payment.billingYear}`
  }
  return payment.bookingCode || '---'
}
