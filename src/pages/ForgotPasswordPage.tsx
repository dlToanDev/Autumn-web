import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Mail, ArrowLeft } from 'lucide-react'
import { useState } from 'react'
import { authApi } from '@/api/authApi'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

const schema = z.object({ email: z.string().email('Email không hợp lệ') })
type FormData = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({ resolver: zodResolver(schema) })
  const [sent, setSent] = useState(false)

  const { mutate, isPending, isSuccess } = useMutation({
    mutationFn: (data: FormData) => authApi.forgotPassword(data.email),
    onSuccess: () => {
      setSent(true)
      toast.success('Email đặt lại mật khẩu đã được gửi!')
    },
  })

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FAF6EF] px-4">
      <div className="w-full max-w-sm">
        <div className="bg-white rounded-[20px] border border-[#E7E5E4] shadow-[0_4px_16px_-2px_rgb(0_0_0/0.08)] p-8">
          <div className="w-12 h-12 rounded-full bg-[#C96A3D]/10 flex items-center justify-center mb-5">
            <Mail size={22} className="text-[#C96A3D]" />
          </div>

          <h2 className="text-xl font-display font-bold text-[#292524] mb-1">Quên mật khẩu?</h2>
          <p className="text-sm text-[#78716C] mb-6">
            Nhập email của bạn, chúng tôi sẽ gửi link đặt lại mật khẩu.
          </p>

          {sent || isSuccess ? (
            <div className="bg-emerald-50 border border-emerald-200 rounded-[10px] p-4 text-sm text-emerald-700">
              Email đã được gửi! Vui lòng kiểm tra hộp thư đến của bạn.
            </div>
          ) : (
            <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
              <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
              <Button type="submit" size="lg" loading={isPending} className="w-full">
                Gửi link đặt lại
              </Button>
            </form>
          )}

          <Link
            to="/login"
            className="flex items-center gap-2 justify-center mt-6 text-sm text-[#78716C] hover:text-[#292524] transition-colors"
          >
            <ArrowLeft size={14} />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </div>
  )
}
