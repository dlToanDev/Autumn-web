import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  className?: string
}

export default function Pagination({ page, totalPages, onPageChange, className }: PaginationProps) {
  if (totalPages <= 1) return null

  const pages: (number | '...')[] = []
  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) pages.push(i)
  } else {
    pages.push(1)
    if (page > 3) pages.push('...')
    for (let i = Math.max(2, page - 1); i <= Math.min(totalPages - 1, page + 1); i++) pages.push(i)
    if (page < totalPages - 2) pages.push('...')
    pages.push(totalPages)
  }

  return (
    <div className={cn('flex items-center gap-1', className)}>
      <button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#78716C] hover:bg-[#F3E7D3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronLeft size={16} />
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="w-8 h-8 flex items-center justify-center text-[#A8A29E] text-sm">
            …
          </span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded-[8px] text-sm font-medium transition-colors',
              p === page
                ? 'bg-[#C96A3D] text-white'
                : 'text-[#44403C] hover:bg-[#F3E7D3]',
            )}
          >
            {p}
          </button>
        ),
      )}

      <button
        disabled={page === totalPages}
        onClick={() => onPageChange(page + 1)}
        className="w-8 h-8 flex items-center justify-center rounded-[8px] text-[#78716C] hover:bg-[#F3E7D3] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
