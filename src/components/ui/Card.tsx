import { cn } from '@/lib/utils'

interface CardProps {
  children: React.ReactNode
  className?: string
  padding?: 'none' | 'sm' | 'md' | 'lg'
  hover?: boolean
  onClick?: () => void
}

const paddingMap = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export default function Card({ children, className, padding = 'md', hover, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'bg-white rounded-[14px] border border-[#E7E5E4]',
        'shadow-[0_1px_3px_0_rgb(0_0_0/0.06),0_1px_2px_-1px_rgb(0_0_0/0.06)]',
        paddingMap[padding],
        hover && 'cursor-pointer transition-shadow duration-200 hover:shadow-[0_4px_16px_-2px_rgb(0_0_0/0.10),0_2px_6px_-2px_rgb(0_0_0/0.06)]',
        className,
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('mb-4 flex min-w-0 flex-wrap items-center justify-between gap-3 [&>*]:max-w-full [&>*]:min-w-0 [&>*]:flex-wrap', className)}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={cn('min-w-0 text-base font-semibold text-[#292524] font-display break-words', className)}>
      {children}
    </h3>
  )
}
