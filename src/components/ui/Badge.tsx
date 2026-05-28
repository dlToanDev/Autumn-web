import { cn } from '@/lib/utils'

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info' | 'neutral' | 'autumn'

interface BadgeProps {
  children: React.ReactNode
  variant?: BadgeVariant
  className?: string
  size?: 'sm' | 'md'
}

const variantMap: Record<BadgeVariant, string> = {
  default: 'bg-[#C96A3D]/10 text-[#C96A3D]',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-600',
  info: 'bg-blue-50 text-blue-600',
  neutral: 'bg-[#F5F5F4] text-[#57534E]',
  autumn: 'bg-[#D4A373]/20 text-[#5B4636]',
}

const sizeMap = {
  sm: 'text-xs px-2 py-0.5',
  md: 'text-xs px-2.5 py-1',
}

export default function Badge({ children, variant = 'default', className, size = 'md' }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full',
        'max-w-full text-center leading-tight break-words',
        variantMap[variant],
        sizeMap[size],
        className,
      )}
    >
      {children}
    </span>
  )
}

// Helper to map status strings to badge variants
export function getStatusBadgeVariant(status: string): BadgeVariant {
  const s = status?.toUpperCase()
  if (['ACTIVE', 'APPROVED', 'CONFIRMED', 'AVAILABLE', 'PAID', 'SUCCESS', 'SIGNED'].includes(s)) return 'success'
  if (['PENDING', 'SUBMITTED', 'PROOF_SUBMITTED', 'WAITING_CONFIRM', 'AWAITING_SIGNATURES', 'PENDING_SIGNATURE'].includes(s)) return 'warning'
  if (['REJECTED', 'CANCELLED', 'INACTIVE', 'TERMINATED'].includes(s)) return 'danger'
  if (['OCCUPIED', 'EXPIRED', 'RESERVED', 'RENTED'].includes(s)) return 'info'
  return 'neutral'
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    ACTIVE: 'Đang hoạt động',
    APPROVED: 'Đã duyệt',
    REJECTED: 'Từ chối',
    PENDING: 'Chờ xử lý',
    PENDING_SIGNATURE: 'Chờ ký',
    AWAITING_SIGNATURES: 'Chờ ký',
    SIGNED: 'Đã ký đủ',
    CANCELLED: 'Đã hủy',
    CONFIRMED: 'Đã xác nhận',
    SUBMITTED: 'Đã nộp',
    PROOF_SUBMITTED: 'Chờ xác nhận',
    WAITING_CONFIRM: 'Chờ xác nhận',
    PAID: 'Đã thanh toán',
    SUCCESS: 'Đã thanh toán',
    EXPIRED: 'Hết hạn',
    TERMINATED: 'Đã chấm dứt',
    AVAILABLE: 'Còn phòng',
    OCCUPIED: 'Đã thuê',
    RESERVED: 'Đã giữ chỗ',
    RENTED: 'Đã thuê',
    INACTIVE: 'Không hoạt động',
    DEPOSIT: 'Đặt cọc',
    RENT: 'Tiền thuê',
    COMMISSION: 'Hoa hồng',
    LANDLORD_REGISTRATION: 'Phí đăng ký',
  }
  return map[status?.toUpperCase()] || status
}
