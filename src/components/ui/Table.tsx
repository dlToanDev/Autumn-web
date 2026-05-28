import { cn } from '@/lib/utils'

// Table wrapper
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('w-full max-w-full overflow-x-auto overflow-y-hidden', className)}>
      <table className="w-full min-w-[760px] border-collapse text-sm">{children}</table>
    </div>
  )
}

export function TableHead({ children }: { children: React.ReactNode }) {
  return <thead className="border-b border-[#E8DED1] bg-[linear-gradient(180deg,#FCFAF7_0%,#F7F0E8_100%)]">{children}</thead>
}

export function TableBody({ children }: { children: React.ReactNode }) {
  return <tbody className="divide-y divide-[#F3EADF] bg-white/95">{children}</tbody>
}

export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'px-5 py-4 first:pl-6 last:pr-6 text-left text-[11px] font-semibold text-[#8A7663] uppercase tracking-[0.14em] whitespace-nowrap',
        className,
      )}
    >
      {children}
    </th>
  )
}

export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return (
    <td className={cn('px-5 py-4 first:pl-6 last:pr-6 text-[#3F352E] align-middle break-words', className)}>{children}</td>
  )
}

export function Tr({
  children,
  className,
  onClick,
}: {
  children: React.ReactNode
  className?: string
  onClick?: () => void
}) {
  return (
    <tr
      onClick={onClick}
      className={cn(
        'transition-colors duration-150',
        onClick ? 'cursor-pointer hover:bg-[#FAF6EF]' : 'hover:bg-[#FCF8F3]',
        className,
      )}
    >
      {children}
    </tr>
  )
}
