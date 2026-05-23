import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { Eye, EyeOff, LogIn, Home } from 'lucide-react'
import { useState } from 'react'
import { authApi } from '@/api/authApi'
import { useAuthStore, getDefaultRoute } from '@/store/authStore'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import toast from 'react-hot-toast'

const schema = z.object({
  account: z.string().trim().min(1, 'Vui lòng nhập email hoặc số điện thoại'),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu'),
})

type FormData = z.infer<typeof schema>

export default function LoginPage() {
  const navigate = useNavigate()
  const setAuth = useAuthStore((s) => s.setAuth)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  const { mutate, isPending } = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.token, data.user)
      toast.success(`Chào mừng, ${data.user.fullName || data.user.email || 'bạn'}!`)
      navigate(getDefaultRoute(true, data.user), { replace: true })
    },
  })

  return (
    <div className="min-h-screen flex">
      {/* Left – branding panel */}
      <div className="hidden lg:flex lg:w-1/2 gradient-autumn flex-col justify-between p-12">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[10px] bg-white/20 flex items-center justify-center">
            <Home size={18} className="text-white" />
          </div>
          <span className="font-display font-bold text-white text-xl">Autumn</span>
        </Link>

        <div>
          <h1 className="text-4xl font-display font-bold text-white leading-tight mb-4">
            Tìm phòng trọ<br />lý tưởng của bạn
          </h1>
          <p className="text-white/70 text-lg leading-relaxed">
            Nền tảng kết nối chủ trọ và người thuê với trải nghiệm mượt mà, hiện đại.
          </p>
        </div>

        <div className="flex gap-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-white font-display">1000+</p>
            <p className="text-white/60 text-sm">Phòng trọ</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white font-display">500+</p>
            <p className="text-white/60 text-sm">Chủ trọ</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white font-display">2000+</p>
            <p className="text-white/60 text-sm">Người thuê</p>
          </div>
        </div>
      </div>

      {/* Right – form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-[#FAF6EF]">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-[8px] gradient-autumn flex items-center justify-center">
              <Home size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-[#292524] text-lg">
              Rental<span className="text-[#C96A3D]">Platform</span>
            </span>
          </Link>

          <h2 className="text-2xl font-display font-bold text-[#292524] mb-1">Đăng nhập</h2>
          <p className="text-sm text-[#78716C] mb-8">Chào mừng bạn trở lại!</p>

          <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
            <Input
              label="Email hoặc số điện thoại"
              type="text"
              placeholder="Email hoặc số điện thoại"
              autoComplete="username"
              error={errors.account?.message}
              {...register('account')}
            />

            <Input
              label="Mật khẩu"
              type={showPassword ? 'text' : 'password'}
              placeholder="••••••••"
              autoComplete="current-password"
              error={errors.password?.message}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="text-[#78716C] hover:text-[#44403C]"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
              {...register('password')}
            />

            <div className="flex justify-end">
              <Link to="/forgot-password" className="text-sm text-[#C96A3D] hover:underline">
                Quên mật khẩu?
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={isPending}
              leftIcon={<LogIn size={18} />}
              className="w-full"
            >
              Đăng nhập
            </Button>
          </form>

          <p className="text-sm text-center text-[#78716C] mt-6">
            Chưa có tài khoản?{' '}
            <Link to="/register" className="text-[#C96A3D] font-medium hover:underline">
              Đăng ký ngay
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
