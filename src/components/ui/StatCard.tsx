import { cn } from '@/lib/utils'

interface StatCardProps {
  label?: string
  title?: string
  value: string | number
  icon?: React.ReactNode
  trend?: { value: number; label?: string }
  color?: 'orange' | 'gold' | 'olive' | 'brown' | 'primary' | 'secondary' | 'accent'
  className?: string
}

const colorMap = {
  orange: { bg: 'bg-[#C96A3D]/10', icon: 'text-[#C96A3D]', accent: 'bg-[#C96A3D]' },
  gold: { bg: 'bg-[#D4A373]/20', icon: 'text-[#B88040]', accent: 'bg-[#D4A373]' },
  olive: { bg: 'bg-[#7A8450]/10', icon: 'text-[#7A8450]', accent: 'bg-[#7A8450]' },
  brown: { bg: 'bg-[#5B4636]/10', icon: 'text-[#5B4636]', accent: 'bg-[#5B4636]' },
  primary: { bg: 'bg-[#C96A3D]/10', icon: 'text-[#C96A3D]', accent: 'bg-[#C96A3D]' },
  secondary: { bg: 'bg-[#D4A373]/20', icon: 'text-[#B88040]', accent: 'bg-[#D4A373]' },
  accent: { bg: 'bg-[#7A8450]/10', icon: 'text-[#7A8450]', accent: 'bg-[#7A8450]' },
}

export default function StatCard({ label, title, value, icon, trend, color = 'orange', className }: StatCardProps) {
  const colors = colorMap[color] ?? colorMap.orange
  const heading = label ?? title ?? ''

  return (
    <div className={cn('bg-white rounded-[14px] border border-[#E7E5E4] p-5 shadow-[0_1px_3px_0_rgb(0_0_0/0.06)]', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[#78716C] uppercase tracking-wider mb-2">{heading}</p>
          <p className="text-2xl font-bold text-[#292524] font-display truncate">{value}</p>
          {trend && (
            <p className={cn('text-xs mt-1.5', trend.value >= 0 ? 'text-emerald-600' : 'text-red-500')}>
              {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label || ''}
            </p>
          )}
        </div>
        {icon && (
          <div className={cn('w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 ml-3', colors.bg, colors.icon)}>
            {icon}
          </div>
        )}
      </div>
    </div>
  )
}
