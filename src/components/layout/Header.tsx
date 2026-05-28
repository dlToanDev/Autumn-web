import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Bell, MessageSquare, ChevronDown, User, LogOut, Menu, X, Home, QrCode } from 'lucide-react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuthStore, getDefaultRoute, getRoleCode } from '@/store/authStore'
import { notificationApi } from '@/api/notificationApi'
import { messageApi } from '@/api/messageApi'
import Avatar from '@/components/ui/Avatar'
import { cn } from '@/lib/utils'

export default function Header() {
  const { isLoggedIn, user, clearAuth } = useAuthStore()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.getMyNotifications,
    enabled: isLoggedIn,
    refetchInterval: 30000,
  })

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: messageApi.getConversations,
    enabled: isLoggedIn,
    refetchInterval: 30000,
  })

  const unreadNotifs = notifications.filter((n) => !n.isRead).length
  const unreadMessages = conversations.reduce((sum, c) => sum + c.unreadCount, 0)

  const handleLogout = () => {
    qc.clear()
    clearAuth()
    navigate('/')
  }

  const dashboardRoute = getDefaultRoute(isLoggedIn, user)
  const roleCode = getRoleCode(user)
  const isAdmin = roleCode === 'ADMIN'
  const isLandlord = roleCode === 'LANDLORD'

  const navLinks = [
    { to: '/', label: 'Trang chủ' },
    { to: '/rooms', label: 'Tìm phòng' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-[#E7E5E4] shadow-[0_1px_3px_0_rgb(0_0_0/0.04)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 min-w-0 items-center justify-between gap-3">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-[8px] gradient-autumn flex items-center justify-center">
              <Home size={16} className="text-white" />
            </div>
            <span className="font-display font-bold text-[#292524] text-lg tracking-tight">
              Au<span className="text-[#C96A3D]">tumn</span>
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  'px-3 py-2 rounded-[8px] text-sm font-medium transition-colors duration-150',
                  isActive(link.to)
                    ? 'text-[#C96A3D] bg-[#C96A3D]/8'
                    : 'text-[#57534E] hover:text-[#292524] hover:bg-[#F5F5F4]',
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
            {isLoggedIn ? (
              <>
                {/* Notifications */}
                <Link
                  to="/notifications"
                  className="relative p-2 rounded-[8px] text-[#78716C] hover:bg-[#F5F5F4] hover:text-[#292524] transition-colors"
                >
                  <Bell size={20} />
                  {unreadNotifs > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#C96A3D] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadNotifs > 9 ? '9+' : unreadNotifs}
                    </span>
                  )}
                </Link>

                {/* Messages */}
                <Link
                  to="/messages"
                  className="relative p-2 rounded-[8px] text-[#78716C] hover:bg-[#F5F5F4] hover:text-[#292524] transition-colors"
                >
                  <MessageSquare size={20} />
                  {unreadMessages > 0 && (
                    <span className="absolute top-1 right-1 w-4 h-4 bg-[#C96A3D] text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                      {unreadMessages > 9 ? '9+' : unreadMessages}
                    </span>
                  )}
                </Link>

                {/* User menu */}
                <div ref={menuRef} className="relative">
                  <button
                    onClick={() => setMenuOpen((p) => !p)}
                    className="flex min-w-0 items-center gap-2 rounded-[10px] py-1 pl-1 pr-2 transition-colors hover:bg-[#F5F5F4]"
                  >
                    <Avatar src={user?.avatarUrl} name={user?.fullName} size="sm" />
                    <span className="hidden sm:block text-sm font-medium text-[#292524] max-w-[100px] truncate">
                      {user?.fullName}
                    </span>
                    <ChevronDown
                      size={14}
                      className={cn('text-[#78716C] transition-transform duration-200', menuOpen && 'rotate-180')}
                    />
                  </button>

                  {menuOpen && (
                    <div className="absolute right-0 z-50 mt-2 w-52 max-w-[calc(100vw-2rem)] rounded-[12px] border border-[#E7E5E4] bg-white py-1 shadow-[0_8px_24px_-4px_rgb(0_0_0/0.12)]">
                      <div className="px-3 py-2 border-b border-[#F5F5F4] mb-1">
                        <p className="text-xs text-[#A8A29E]">Đã đăng nhập với</p>
                        <p className="text-sm font-medium text-[#292524] truncate">{user?.email}</p>
                        <span className="inline-flex items-center text-[10px] font-semibold uppercase tracking-wider bg-[#C96A3D]/10 text-[#C96A3D] px-1.5 py-0.5 rounded-full mt-0.5">
                          {roleCode}
                        </span>
                      </div>

                      <Link
                        to={dashboardRoute}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#44403C] hover:bg-[#FAF6EF] transition-colors"
                      >
                        <Home size={15} />
                        Dashboard
                      </Link>

                      {!isAdmin && !isLandlord && (
                        <>
                          <Link to="/user/contracts" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#44403C] hover:bg-[#FAF6EF] transition-colors">
                            Hợp đồng của tôi
                          </Link>
                          <Link to="/user/payments" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#44403C] hover:bg-[#FAF6EF] transition-colors">
                            Lịch sử thanh toán
                          </Link>
                          <Link to="/user/qr-settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#44403C] hover:bg-[#FAF6EF] transition-colors">
                            <QrCode size={15} />
                            VietQR của tôi
                          </Link>
                          <Link to="/become-landlord" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#44403C] hover:bg-[#FAF6EF] transition-colors">
                            Đăng ký chủ trọ
                          </Link>
                        </>
                      )}

                      {isLandlord && (
                        <>
                          <Link to="/landlord/properties" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#44403C] hover:bg-[#FAF6EF] transition-colors">
                            Khu trọ
                          </Link>
                          <Link to="/landlord/rooms" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#44403C] hover:bg-[#FAF6EF] transition-colors">
                            Phòng trọ
                          </Link>
                          <Link to="/landlord/commission-payments" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#44403C] hover:bg-[#FAF6EF] transition-colors">
                            Hoa hồng
                          </Link>
                        </>
                      )}

                      {isAdmin && (
                        <>
                          <Link to="/admin/landlord-applications" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#44403C] hover:bg-[#FAF6EF] transition-colors">
                            Duyệt chủ trọ
                          </Link>
                          <Link to="/admin/commission-payments" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#44403C] hover:bg-[#FAF6EF] transition-colors">
                            Hoa hồng
                          </Link>
                          <Link to="/admin/payment-settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#44403C] hover:bg-[#FAF6EF] transition-colors">
                            Cài đặt thanh toán
                          </Link>
                        </>
                      )}

                      <Link
                        to="/profile"
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-[#44403C] hover:bg-[#FAF6EF] transition-colors"
                      >
                        <User size={15} />
                        Hồ sơ cá nhân
                      </Link>

                      <hr className="my-1 border-[#F5F5F4]" />

                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2.5 px-3 py-2 text-sm text-red-500 hover:bg-red-50 w-full transition-colors"
                      >
                        <LogOut size={15} />
                        Đăng xuất
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="hidden sm:inline-flex items-center px-3 py-1.5 text-sm font-medium text-[#C96A3D] hover:bg-[#C96A3D]/8 rounded-[8px] transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-[#C96A3D] hover:bg-[#B85C38] rounded-[8px] transition-colors shadow-sm"
                >
                  Đăng ký
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              className="md:hidden p-2 rounded-[8px] text-[#78716C] hover:bg-[#F5F5F4]"
              onClick={() => setMobileOpen((p) => !p)}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 border-t border-[#F5F5F4] pt-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  'block px-3 py-2 rounded-[8px] text-sm font-medium transition-colors',
                  isActive(link.to)
                    ? 'text-[#C96A3D] bg-[#C96A3D]/8'
                    : 'text-[#57534E] hover:bg-[#F5F5F4]',
                )}
              >
                {link.label}
              </Link>
            ))}
            {!isLoggedIn && (
              <Link
                to="/login"
                onClick={() => setMobileOpen(false)}
                className="block px-3 py-2 text-sm font-medium text-[#C96A3D]"
              >
                Đăng nhập
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}
