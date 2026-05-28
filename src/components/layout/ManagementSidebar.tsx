import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import {
  LayoutDashboard, Home, BedDouble, BookOpen, CreditCard,
  Users, FileText, Megaphone, Settings, ChevronLeft,
  LogOut, ChevronRight, Wallet, UserCheck, QrCode, Building2,
  MessageSquare,
} from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import Avatar from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: React.ReactNode
}

const adminNav: NavItem[] = [
  { to: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/messages', label: 'Tin nhắn', icon: <MessageSquare size={18} /> },
  { to: '/admin/users', label: 'Người dùng', icon: <Users size={18} /> },
  { to: '/admin/landlords', label: 'Chủ trọ', icon: <Building2 size={18} /> },
  { to: '/admin/rooms', label: 'Phòng trọ', icon: <BedDouble size={18} /> },
  { to: '/admin/landlord-applications', label: 'Đơn chủ trọ', icon: <UserCheck size={18} /> },
  { to: '/admin/contracts', label: 'Hợp đồng', icon: <FileText size={18} /> },
  { to: '/admin/payments', label: 'Thanh toán', icon: <CreditCard size={18} /> },
  { to: '/admin/qr-settings', label: 'VietQR', icon: <QrCode size={18} /> },
  { to: '/admin/commission-payments', label: 'Hoa hồng', icon: <Wallet size={18} /> },
  { to: '/admin/announcements', label: 'Thông báo', icon: <Megaphone size={18} /> },
  { to: '/admin/payment-settings', label: 'Cài đặt', icon: <Settings size={18} /> },
]

const landlordNav: NavItem[] = [
  { to: '/landlord', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { to: '/messages', label: 'Tin nhắn', icon: <MessageSquare size={18} /> },
  { to: '/landlord/properties', label: 'Nhà/Cơ sở', icon: <Home size={18} /> },
  { to: '/landlord/rooms', label: 'Phòng trọ', icon: <BedDouble size={18} /> },
  { to: '/landlord/bookings', label: 'Yêu cầu thuê', icon: <BookOpen size={18} /> },
  { to: '/landlord/tenants', label: 'Người thuê', icon: <Users size={18} /> },
  { to: '/landlord/contracts', label: 'Hợp đồng', icon: <FileText size={18} /> },
  { to: '/landlord/payments', label: 'Thu tiền', icon: <CreditCard size={18} /> },
  { to: '/landlord/qr-settings', label: 'VietQR', icon: <QrCode size={18} /> },
  { to: '/landlord/commission-payments', label: 'Hoa hồng', icon: <Wallet size={18} /> },
]

interface Props {
  role: 'ADMIN' | 'LANDLORD'
}

export default function ManagementSidebar({ role }: Props) {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, clearAuth } = useAuthStore()
  const qc = useQueryClient()
  const [collapsed, setCollapsed] = useState(false)

  const navItems = role === 'ADMIN' ? adminNav : landlordNav

  const isActive = (to: string) => {
    if (to === '/admin' || to === '/landlord') return location.pathname === to
    return location.pathname.startsWith(to)
  }

  const handleLogout = () => {
    qc.clear()
    clearAuth()
    navigate('/')
  }

  return (
    <aside
      className={cn(
        'sticky top-0 z-50 flex shrink-0 flex-col bg-[#2C1F14] text-white',
        'w-full border-b border-white/10 transition-all duration-300 md:h-screen md:border-b-0',
        collapsed ? 'md:w-16' : 'md:w-60',
      )}
    >
      {/* Logo */}
      <div className={cn('flex h-16 shrink-0 items-center border-b border-white/10 px-4', collapsed && 'md:justify-center md:px-2')}>
        <Link to="/" className={cn('flex min-w-0 items-center gap-2', collapsed && 'md:hidden')}>
            <div className="w-7 h-7 rounded-[6px] bg-[#C96A3D] flex items-center justify-center shrink-0">
              <Home size={14} className="text-white" />
            </div>
            <span className="font-display font-bold text-sm truncate">
              Au<span className="text-[#D4A373]">Tumn</span>
            </span>
          </Link>
        <button
          onClick={() => setCollapsed((p) => !p)}
          className={cn(
            'ml-auto hidden shrink-0 rounded-[6px] p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white md:inline-flex',
            collapsed && 'md:mx-auto',
          )}
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Role badge */}
      {!collapsed && (
        <div className="hidden px-4 pb-2 pt-4 md:block">
          <span className="text-[10px] font-bold uppercase tracking-widest text-[#D4A373]/70">
            {role === 'ADMIN' ? 'Quản trị viên' : 'Chủ trọ'}
          </span>
        </div>
      )}

      {/* Nav */}
      <nav className="flex gap-2 overflow-x-auto px-3 py-2 md:block md:flex-1 md:space-y-0.5 md:overflow-y-auto md:px-2">
        {navItems.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            title={collapsed ? item.label : undefined}
            className={cn(
              'flex shrink-0 items-center gap-2 rounded-[8px] px-3 py-2 text-sm font-medium transition-all duration-150 md:gap-3 md:py-2.5',
              isActive(item.to)
                ? 'bg-[#C96A3D] text-white shadow-sm'
                : 'text-white/70 hover:text-white hover:bg-white/8',
              collapsed && 'md:justify-center md:px-0',
            )}
          >
            <span className="shrink-0">{item.icon}</span>
            <span className={cn('max-w-32 truncate md:max-w-none', collapsed && 'md:hidden')}>{item.label}</span>
          </Link>
        ))}
      </nav>

      {/* User footer */}
      <div className="hidden shrink-0 border-t border-white/10 p-3 md:block">
        <Link
          to="/profile"
          className={cn(
            'flex items-center gap-2.5 p-2 rounded-[8px] hover:bg-white/8 transition-colors w-full',
            collapsed && 'justify-center',
          )}
        >
          <Avatar src={user?.avatarUrl} name={user?.fullName} size="sm" />
          {!collapsed && (
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-white truncate">{user?.fullName}</p>
              <p className="text-xs text-white/50 truncate">{user?.email}</p>
            </div>
          )}
        </Link>

        <button
          onClick={handleLogout}
          title={collapsed ? 'Đăng xuất' : undefined}
          className={cn(
            'flex items-center gap-2.5 mt-1 px-2 py-2 rounded-[8px] text-sm text-white/60 hover:text-white hover:bg-white/8 w-full transition-colors',
            collapsed && 'justify-center',
          )}
        >
          <LogOut size={16} className="shrink-0" />
          {!collapsed && 'Đăng xuất'}
        </button>
      </div>
    </aside>
  )
}
