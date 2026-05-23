import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { KeyRound } from 'lucide-react'
import { authApi } from '@/api/authApi'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

const schema = z.object({
  newPassword: z.string().min(8, 'Mật khẩu ít nhất 8 ký tự'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const navigate = useNavigate()
  const token = params.get('token') || ''

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => authApi.resetPassword({ token, newPassword: data.newPassword }),
    onSuccess: () => {
      toast.success('Mật khẩu đã được đặt lại!')
      navigate('/login')
    },
  })

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF]">
        <p className="text-sm text-[#78716C]">Link không hợp lệ. <Link to="/forgot-password" className="text-[#C96A3D]">Thử lại</Link></p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF] px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-[20px] border border-[#E7E5E4] shadow-[0_4px_16px_-2px_rgb(0_0_0/0.08)] p-8">
          <div className="w-12 h-12 rounded-full bg-[#C96A3D]/10 flex items-center justify-center mb-5">
            <KeyRound size={22} className="text-[#C96A3D]" />
          </div>
          <h2 className="text-xl font-display font-bold text-[#292524] mb-1">Đặt lại mật khẩu</h2>
          <p className="text-sm text-[#78716C] mb-6">Nhập mật khẩu mới cho tài khoản của bạn.</p>

          <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
            <Input label="Mật khẩu mới" type="password" error={errors.newPassword?.message} {...register('newPassword')} />
            <Input label="Xác nhận mật khẩu" type="password" error={errors.confirmPassword?.message} {...register('confirmPassword')} />
            <Button type="submit" size="lg" loading={isPending} className="w-full">Đặt lại mật khẩu</Button>
          </form>
        </div>
      </div>
    </div>
  )
}
