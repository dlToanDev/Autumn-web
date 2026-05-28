import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-[#C96A3D] text-white hover:bg-[#B85C38] active:bg-[#A34F2E] shadow-sm hover:shadow-md',
  secondary:
    'bg-[#D4A373] text-[#5B4636] hover:bg-[#C9956A] active:bg-[#BE8A61]',
  outline:
    'border border-[#C96A3D] text-[#C96A3D] bg-transparent hover:bg-[#C96A3D]/8 active:bg-[#C96A3D]/15',
  ghost:
    'bg-transparent text-[#78716C] hover:bg-[#F3E7D3] active:bg-[#EDD9BB]',
  danger:
    'bg-red-500 text-white hover:bg-red-600 active:bg-red-700 shadow-sm',
}

const sizeClasses: Record<Size, string> = {
  sm: 'min-h-8 px-3 py-1.5 text-sm gap-1.5',
  md: 'min-h-10 px-4 py-2 text-sm gap-2',
  lg: 'min-h-12 px-6 py-2.5 text-base gap-2.5',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, className, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex min-w-0 shrink-0 items-center justify-center font-medium rounded-[10px] transition-all duration-150',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#C96A3D]/40 focus-visible:ring-offset-2',
          'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
          'max-w-full select-none text-center leading-snug break-words',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          leftIcon && <span className="shrink-0">{leftIcon}</span>
        )}
        {children && <span className="min-w-0">{children}</span>}
        {!loading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    )
  },
)

Button.displayName = 'Button'
export default Button
