import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, Settings } from 'lucide-react'
import ManagementLayout from '@/components/layout/ManagementLayout'
import Button from '@/components/ui/Button'
import { PageLoader } from '@/components/ui/Skeleton'
import { systemConfigApi } from '@/api/systemConfigApi'
import toast from 'react-hot-toast'

const schema = z.object({
  commissionRate: z.coerce.number().min(0).max(100),
  expireMinutes: z.coerce.number().min(1),
})
type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export default function AdminPaymentSettingsPage() {
  const qc = useQueryClient()

  const { data, isLoading } = useQuery({
    queryKey: ['system-config'],
    queryFn: systemConfigApi.getSettings,
  })

  const { register, handleSubmit, formState: { errors, isDirty } } = useForm<FormInput, unknown, FormValues>({
    resolver: zodResolver(schema),
    values: data
      ? {
          commissionRate: data.commissionRate ?? 0,
          expireMinutes: data.expireMinutes ?? 15,
        }
      : undefined,
  })

  const { mutate: save, isPending } = useMutation({
    mutationFn: systemConfigApi.updateSettings,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['system-config'] }); toast.success('Đã lưu cài đặt!') },
  })

  if (isLoading) return <ManagementLayout role="ADMIN"><PageLoader /></ManagementLayout>

  return (
    <ManagementLayout role="ADMIN">
      <div className="p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-[10px] bg-[#C96A3D]/10 flex items-center justify-center">
            <Settings size={18} className="text-[#C96A3D]" />
          </div>
          <div>
            <h1 className="text-2xl font-display font-bold text-[#292524]">Cài đặt hệ thống</h1>
            <p className="text-sm text-[#78716C]">Cấu hình thanh toán và phí dịch vụ</p>
          </div>
        </div>

        <form onSubmit={handleSubmit((d) => save(d))} className="space-y-6">
          <div className="bg-white rounded-[14px] border border-[#E7E5E4] p-5 space-y-4">
            <h2 className="text-base font-semibold text-[#292524]">Thiết lập thanh toán</h2>
            <Field label="Tỷ lệ hoa hồng (%)" error={errors.commissionRate?.message}>
              <input type="number" step="0.1" {...register('commissionRate')} className={inputCls} />
            </Field>
            <Field label="Thời hạn hiệu lực QR (phút)" error={errors.expireMinutes?.message}>
              <input type="number" {...register('expireMinutes')} className={inputCls} />
            </Field>
          </div>

          <div className="flex justify-end">
            <Button type="submit" leftIcon={<Save size={16} />} loading={isPending} disabled={!isDirty}>Lưu cài đặt</Button>
          </div>
        </form>
      </div>
    </ManagementLayout>
  )
}

const inputCls = 'w-full rounded-[10px] border border-[#D6D3D1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30 focus:border-[#C96A3D]'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-sm font-medium text-[#44403C] block mb-1.5">{label}</label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )
}
