import Header from './Header'
import FloatingMessageButton from './FloatingMessageButton'
import { cn } from '@/lib/utils'

interface Props {
  children: React.ReactNode
  className?: string
  withFooter?: boolean
}

function Footer() {
  return (
    <footer className="bg-[#2C1F14] text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <h3 className="font-display font-bold text-lg mb-3">
              Au<span className="text-[#D4A373]">tumn</span>
            </h3>
            <p className="text-sm text-white/60 leading-relaxed">
              Nền tảng kết nối chủ trọ và người thuê phòng trọ, nhà ở hiện đại và tiện lợi.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-white/80">Khám phá</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li><a href="/rooms" className="hover:text-white transition-colors">Tìm phòng trọ</a></li>
              <li><a href="/become-landlord" className="hover:text-white transition-colors">Trở thành chủ trọ</a></li>
              <li><a href="/register" className="hover:text-white transition-colors">Đăng ký</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-sm mb-3 text-white/80">Liên hệ</h4>
            <ul className="space-y-2 text-sm text-white/60">
              <li>Email: daylatoan1310@gmail.com</li>
              <li>Hotline: 1900 1090</li>
            </ul>
          </div>
        </div>
        <div className="mt-10 pt-6 border-t border-white/10 text-xs text-white/40 text-center">
          © 2026 Autumn. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

export default function PublicLayout({ children, className, withFooter = false }: Props) {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className={cn('flex-1', className)}>{children}</main>
      <FloatingMessageButton />
      {withFooter && <Footer />}
    </div>
  )
}
