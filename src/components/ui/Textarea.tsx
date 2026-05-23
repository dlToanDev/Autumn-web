import { cn } from '@/lib/utils'

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

export default function Textarea({ label, error, hint, className, id, ...props }: TextareaProps) {
  const textareaId = id || label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      {label && (
        <label htmlFor={textareaId} className="flex min-h-9 items-end text-sm font-medium leading-5 text-[#44403C]">
          {label}
        </label>
      )}
      <textarea
        id={textareaId}
        className={cn(
          'w-full rounded-[10px] border bg-white px-3 py-2.5 text-sm text-[#292524] shadow-sm shadow-black/[0.02]',
          'placeholder:text-[#A8A29E] border-[#D6D3D1] resize-none',
          'focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30 focus:border-[#C96A3D]',
          'disabled:bg-[#F5F5F4] disabled:cursor-not-allowed',
          error && 'border-red-400 focus:ring-red-300',
          className,
        )}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-red-500">{error}</p>}
      {hint && !error && <p className="text-xs leading-4 text-[#78716C]">{hint}</p>}
    </div>
  )
}
