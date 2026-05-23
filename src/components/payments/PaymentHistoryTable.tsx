import { CheckCircle2, CreditCard, ReceiptText } from 'lucide-react'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { EmptyState } from '@/components/ui/Skeleton'
import { Table, TableBody, TableHead, Td, Th, Tr } from '@/components/ui/Table'
import { formatCurrency, formatDateTime } from '@/lib/utils'
import {
  formatBillingPeriod,
  formatPaymentStatusLabel,
  formatPaymentTypeLabel,
  getPaymentBadgeVariant,
  isIncomingPayment,
  isPaidStatus,
  type PaymentViewer,
} from '@/utils/paymentPresentation'
import type { Payment } from '@/types'

interface Props {
  payments: Payment[]
  viewer: PaymentViewer
  currentUserId?: number
  showDirection?: boolean
  openingCode?: string
  confirmingCode?: string
  emptyTitle: string
  emptyDescription: string
  onOpen: (payment: Payment) => void
  canConfirm?: (payment: Payment) => boolean
  onConfirm?: (payment: Payment) => void
}

export default function PaymentHistoryTable({
  payments,
  viewer,
  currentUserId = 0,
  showDirection = false,
  openingCode = '',
  confirmingCode = '',
  emptyTitle,
  emptyDescription,
  onOpen,
  canConfirm,
  onConfirm,
}: Props) {
  if (payments.length === 0) {
    return (
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        icon={<ReceiptText size={28} />}
      />
    )
  }

  return (
    <Table>
      <TableHead>
        <tr>
          <Th>STT</Th>
          <Th>Mã payment</Th>
          {showDirection ? <Th>Dòng tiền</Th> : <Th>Phòng</Th>}
          <Th>Nội dung</Th>
          <Th>Số tiền</Th>
          <Th>Trạng thái</Th>
          <Th>Thời gian</Th>
          <Th>Thao tác</Th>
        </tr>
      </TableHead>
      <TableBody>
        {payments.map((payment, index) => {
          const incoming = showDirection && isIncomingPayment(payment, currentUserId)
          const confirmable = Boolean(canConfirm?.(payment))
          const typeLabel = formatPaymentTypeLabel(payment.paymentType, viewer)
          const contentTitle = showDirection
            ? payment.roomTitle || payment.description || typeLabel
            : payment.description || typeLabel
          return (
            <Tr key={payment.paymentCode}>
              <Td className="text-sm text-[#A8A29E]">{index + 1}</Td>
              <Td>
                <p className="font-semibold text-[#2C241D]">{payment.paymentCode}</p>
                <p className="mt-0.5 text-xs text-[#9A8775]">Booking: {payment.bookingCode || '---'}</p>
              </Td>
              {showDirection ? (
                <Td>
                  <div className="flex items-center gap-2">
                    <span className={`h-2 w-2 rounded-full ${incoming ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                    <p className="font-medium text-[#2C241D]">{incoming ? 'Thu vào' : 'Chi ra'}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-[#9A8775]">
                    {incoming
                      ? `Người trả: ${payment.payerName || payment.tenantName || '---'}`
                      : `Người nhận: ${payment.payeeUserName || payment.payeeName || '---'}`}
                  </p>
                </Td>
              ) : (
                <Td>
                  <p className="font-medium text-[#2C241D]">{payment.roomTitle || '---'}</p>
                  <p className="mt-0.5 text-xs text-[#9A8775]">{payment.propertyName || '---'}</p>
                </Td>
              )}
              <Td>
                <p className="max-w-[260px] truncate font-medium text-[#2C241D]">
                  {contentTitle}
                </p>
                <p className="mt-0.5 text-xs text-[#9A8775]">{typeLabel}</p>
                <p className="mt-0.5 text-xs text-[#B2A292]">Kỳ: {formatBillingPeriod(payment)}</p>
              </Td>
              <Td className="whitespace-nowrap font-semibold text-[#2C241D]">{formatCurrency(payment.amount)}</Td>
              <Td className="whitespace-nowrap">
                <Badge variant={getPaymentBadgeVariant(payment.status)}>
                  {formatPaymentStatusLabel(payment.status, viewer)}
                </Badge>
              </Td>
              <Td className="whitespace-nowrap text-xs text-[#78716C]">
                <p>Tạo: {formatDateTime(payment.createdAt)}</p>
                <p className="mt-1">
                  {isPaidStatus(payment.status)
                    ? `Đã trả: ${formatDateTime(payment.paidAt)}`
                    : `Hạn: ${formatDateTime(payment.expiredAt)}`}
                </p>
              </Td>
              <Td className="w-[1%] whitespace-nowrap">
                <div className="flex flex-col gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={isPaidStatus(payment.status) ? 'ghost' : 'outline'}
                    loading={openingCode === payment.paymentCode}
                    leftIcon={<CreditCard size={14} />}
                    onClick={() => onOpen(payment)}
                  >
                    {isPaidStatus(payment.status) ? 'Xem chi tiết' : 'Xem QR'}
                  </Button>
                  {confirmable && (
                    <Button
                      type="button"
                      size="sm"
                      loading={confirmingCode === payment.paymentCode}
                      leftIcon={<CheckCircle2 size={14} />}
                      onClick={() => onConfirm?.(payment)}
                    >
                      Đã thanh toán
                    </Button>
                  )}
                </div>
              </Td>
            </Tr>
          )
        })}
      </TableBody>
    </Table>
  )
}
