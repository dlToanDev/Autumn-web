import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex min-w-0 flex-col gap-1.5">
        {label && (
          <label htmlFor={inputId} className="flex min-h-9 items-end text-sm font-medium leading-5 text-[#44403C]">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#78716C] pointer-events-none">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full h-10 rounded-[10px] border bg-white px-3 py-2 text-sm text-[#292524]',
              'placeholder:text-[#A8A29E]',
              'border-[#D6D3D1]',
              'transition-colors duration-150 shadow-sm shadow-black/[0.02]',
              'focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30 focus:border-[#C96A3D]',
              'disabled:bg-[#F5F5F4] disabled:cursor-not-allowed disabled:text-[#A8A29E]',
              error && 'border-red-400 focus:ring-red-300 focus:border-red-400',
              leftIcon && 'pl-9',
              rightIcon && 'pr-9',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[#78716C]">
              {rightIcon}
            </span>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs leading-4 text-[#78716C]">{hint}</p>}
      </div>
    )
  },
)

Input.displayName = 'Input'
export default Input
