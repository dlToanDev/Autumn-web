import { cn } from '@/lib/utils'

// ─── Skeleton base ────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn('animate-pulse rounded-[8px] bg-[#E7E5E4]', className)}
    />
  )
}

// ─── Card skeleton ────────────────────────────────────────────────────────────
export function CardSkeleton() {
  return (
    <div className="bg-white rounded-[14px] border border-[#E7E5E4] p-5 space-y-3">
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-3 w-1/2" />
      <Skeleton className="h-3 w-4/5" />
    </div>
  )
}

// ─── Table skeleton ───────────────────────────────────────────────────────────
export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="bg-white rounded-[14px] border border-[#E7E5E4] overflow-hidden">
      {/* header */}
      <div className="border-b border-[#E7E5E4] bg-[#FAF6EF] px-4 py-3 flex gap-4">
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={i} className="h-3 flex-1" />
        ))}
      </div>
      {/* rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="border-b border-[#F5F5F4] last:border-0 px-4 py-3 flex gap-4">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn('h-4 flex-1', c === 0 && 'w-8 flex-none')} />
          ))}
        </div>
      ))}
    </div>
  )
}

// ─── Page header skeleton ─────────────────────────────────────────────────────
export function PageHeaderSkeleton() {
  return (
    <div className="space-y-2 mb-6">
      <Skeleton className="h-7 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  title: string
  description?: string
  icon?: React.ReactNode
  action?: React.ReactNode
}

export function EmptyState({ title, description, icon, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      {icon && (
        <div className="mb-4 text-[#D6D3D1] flex items-center justify-center w-16 h-16 rounded-full bg-[#FAF6EF]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-semibold text-[#44403C] mb-1">{title}</h3>
      {description && <p className="text-sm text-[#78716C] max-w-xs">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

// ─── Error state ──────────────────────────────────────────────────────────────
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="mb-4 w-14 h-14 rounded-full bg-red-50 flex items-center justify-center text-red-400">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <p className="text-sm text-[#57534E]">{message || 'Đã có lỗi xảy ra. Vui lòng thử lại.'}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm text-[#C96A3D] font-medium hover:underline"
        >
          Thử lại
        </button>
      )}
    </div>
  )
}

// ─── Loading spinner ──────────────────────────────────────────────────────────
export function Spinner({ size = 24, className }: { size?: number; className?: string }) {
  return (
    <svg
      className={cn('animate-spin text-[#C96A3D]', className)}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  )
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <Spinner size={32} />
    </div>
  )
}
