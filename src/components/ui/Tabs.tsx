import { cn } from '@/lib/utils'

interface Tab {
  key?: string
  id?: string
  label: string
  count?: number
}

interface TabsProps {
  tabs: Tab[]
  activeTab?: string
  activeId?: string
  onChange: (key: string) => void
  className?: string
}

export default function Tabs({ tabs, activeTab, activeId, onChange, className }: TabsProps) {
  const currentActiveTab = activeTab ?? activeId ?? ''

  return (
    <div className={cn('flex gap-1 bg-[#F5F5F4] rounded-[10px] p-1', className)}>
      {tabs.map((tab) => {
        // Support both { key } and legacy { id } callers during the TS migration.
        const tabKey = tab.key ?? tab.id ?? tab.label

        return (
          <button
            key={tabKey}
            onClick={() => onChange(tabKey)}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] text-sm font-medium transition-all duration-150',
              currentActiveTab === tabKey
                ? 'bg-white text-[#C96A3D] shadow-sm'
                : 'text-[#78716C] hover:text-[#44403C]',
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span
                className={cn(
                  'text-xs px-1.5 py-0.5 rounded-full',
                  currentActiveTab === tabKey
                    ? 'bg-[#C96A3D]/10 text-[#C96A3D]'
                    : 'bg-[#E7E5E4] text-[#78716C]',
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
