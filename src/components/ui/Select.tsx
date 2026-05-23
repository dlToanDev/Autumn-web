import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, placeholder, className, id, children, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex min-w-0 flex-col gap-1.5">
        {label && (
          <label htmlFor={selectId} className="flex min-h-9 items-end text-sm font-medium leading-5 text-[#44403C]">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          className={cn(
            'w-full h-10 rounded-[10px] border bg-white px-3 py-2 text-sm text-[#292524]',
            'border-[#D6D3D1]',
            'transition-colors duration-150 appearance-none shadow-sm shadow-black/[0.02]',
            'focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30 focus:border-[#C96A3D]',
            'disabled:bg-[#F5F5F4] disabled:cursor-not-allowed disabled:text-[#A8A29E]',
            'bg-[url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'%2378716C\' stroke-width=\'2\'%3E%3Cpath d=\'M6 9l6 6 6-6\'/%3E%3C/svg%3E")] bg-no-repeat bg-[right_0.75rem_center]',
            'pr-9',
            error && 'border-red-400 focus:ring-red-300',
            className,
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {children}
        </select>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs leading-4 text-[#78716C]">{hint}</p>}
      </div>
    )
  },
)

Select.displayName = 'Select'
export default Select
