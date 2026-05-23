import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { UserPlus, Home, Eye, EyeOff } from 'lucide-react'
import { useState } from 'react'
import { authApi } from '@/api/authApi'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

const schema = z.object({
  fullName: z.string().min(2, 'Tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Email không hợp lệ'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ'),
  password: z
    .string()
    .min(8, 'Mật khẩu ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Cần ít nhất 1 chữ hoa')
    .regex(/[0-9]/, 'Cần ít nhất 1 chữ số'),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Mật khẩu không khớp',
  path: ['confirmPassword'],
})

type FormData = z.infer<typeof schema>

export default function RegisterPage() {
  const navigate = useNavigate()
  const [showPw, setShowPw] = useState(false)

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: FormData) => authApi.register({
      fullName: data.fullName,
      email: data.email,
      phone: data.phone,
      password: data.password,
    }),
    onSuccess: () => {
      toast.success('Đăng ký thành công! Vui lòng đăng nhập.')
      navigate('/login')
    },
  })

  return (
    <div className="min-h-screen flex">
      {/* Left branding */}
      <div className="hidden lg:flex lg:w-1/2 gradient-autumn flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-white/20 flex items-center justify-center">
            <Home size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-white text-xl">Autumn</span>
        </Link>
        <div>
          <h1 className="text-4xl font-display font-bold text-white leading-tight mb-4">
            Tham gia cộng đồng<br />của chúng tôi
          </h1>
          <p className="text-white/70 text-lg">
            Đăng ký miễn phí, tìm phòng trọ ưng ý trong vài phút.
          </p>
        </div>
        <div />
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#FAF6EF] overflow-y-auto">
        <div className="w-full max-w-sm">
          <Link to="/" className="flex items-center gap-2 mb-6 lg:hidden">
            <div className="w-8 h-8 rounded-[8px] gradient-autumn flex items-center justify-center">
              <Home size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-[#292524] text-lg">
              Rental<span className="text-[#C96A3D]">Platform</span>
            </span>
          </Link>

          <h2 className="text-2xl font-display font-bold text-[#292524] mb-1">Tạo tài khoản</h2>
          <p className="text-sm text-[#78716C] mb-7">Hoàn toàn miễn phí</p>

          <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
            <Input label="Họ tên" placeholder="Nguyễn Văn A" error={errors.fullName?.message} {...register('fullName')} />
            <Input label="Email" type="email" placeholder="you@example.com" error={errors.email?.message} {...register('email')} />
            <Input label="Số điện thoại" placeholder="0901 234 567" error={errors.phone?.message} {...register('phone')} />
            <Input
              label="Mật khẩu"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              hint="Ít nhất 8 ký tự, 1 chữ hoa, 1 số"
              error={errors.password?.message}
              rightIcon={
                <button type="button" onClick={() => setShowPw((p) => !p)} className="text-[#78716C]">
                  {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register('password')}
            />
            <Input
              label="Xác nhận mật khẩu"
              type={showPw ? 'text' : 'password'}
              placeholder="••••••••"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />

            <Button type="submit" size="lg" loading={isPending} leftIcon={<UserPlus size={18} />} className="w-full">
              Đăng ký
            </Button>
          </form>

          <p className="text-sm text-center text-[#78716C] mt-6">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-[#C96A3D] font-medium hover:underline">
              Đăng nhập
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
