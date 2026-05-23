import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { useAuthStore, getRoleCode, getDefaultRoute } from '@/store/authStore'
import type { ReactNode } from 'react'

// Auth pages
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'

// Public pages
import HomePage from '@/pages/HomePage'
import RoomSearchPage from '@/pages/RoomSearchPage'
import RoomDetailPage from '@/pages/RoomDetailPage'

// User pages
import ProfilePage from '@/pages/ProfilePage'
import UserHomePage from '@/pages/UserHomePage'
import UserContractsPage from '@/pages/UserContractsPage'
import UserPaymentsPage from '@/pages/UserPaymentsPage'
import BecomeLandlordPage from '@/pages/BecomeLandlordPage'
import NotificationsPage from '@/pages/NotificationsPage'
import NotificationDetailPage from '@/pages/NotificationDetailPage'
import MessagesPage from '@/pages/MessagesPage'
import PaymentAccountSettingsPage from '@/pages/PaymentAccountSettingsPage'

// Landlord pages
import LandlordDashboardPage from '@/pages/landlord/LandlordDashboardPage'
import LandlordPropertiesPage from '@/pages/landlord/LandlordPropertiesPage'
import LandlordRoomsPage from '@/pages/landlord/LandlordRoomsPage'
import LandlordBookingsPage from '@/pages/landlord/LandlordBookingsPage'
import LandlordPaymentsPage from '@/pages/landlord/LandlordPaymentsPage'
import LandlordCommissionPaymentsPage from '@/pages/landlord/LandlordCommissionPaymentsPage'
import LandlordTenantsPage from '@/pages/landlord/LandlordTenantsPage'
import LandlordContractsPage from '@/pages/landlord/LandlordContractsPage'

// Admin pages
import AdminDashboardPage from '@/pages/admin/AdminDashboardPage'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import AdminLandlordsPage from '@/pages/admin/AdminLandlordsPage'
import AdminRoomsPage from '@/pages/admin/AdminRoomsPage'
import AdminLandlordApplicationsPage from '@/pages/admin/AdminLandlordApplicationsPage'
import AdminContractsPage from '@/pages/admin/AdminContractsPage'
import AdminPaymentsPage from '@/pages/admin/AdminPaymentsPage'
import AdminCommissionPaymentsPage from '@/pages/admin/AdminCommissionPaymentsPage'
import AdminAnnouncementsPage from '@/pages/admin/AdminAnnouncementsPage'
import AdminPaymentSettingsPage from '@/pages/admin/AdminPaymentSettingsPage'

function RequireAuth({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuthStore()
  const location = useLocation()
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location }} replace />
  return <>{children}</>
}

function RequireRole({ role, children }: { role: string; children: ReactNode }) {
  const { user, isLoggedIn } = useAuthStore()
  const location = useLocation()
  if (!isLoggedIn) return <Navigate to="/login" state={{ from: location }} replace />
  if (getRoleCode(user) !== role) return <Navigate to="/" replace />
  return <>{children}</>
}

function GuestOnly({ children }: { children: ReactNode }) {
  const { isLoggedIn, user } = useAuthStore()
  if (isLoggedIn) {
    return <Navigate to={getDefaultRoute(isLoggedIn, user)} replace />
  }
  return <>{children}</>
}

export default function App() {
  const { isLoggedIn, user } = useAuthStore()
  const defaultRoute = getDefaultRoute(isLoggedIn, user)

  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<HomePage />} />
      <Route path="/rooms" element={<RoomSearchPage />} />
      <Route path="/rooms/:roomId" element={<RoomDetailPage />} />

      {/* Guest-only auth */}
      <Route path="/login" element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/register" element={<GuestOnly><RegisterPage /></GuestOnly>} />
      <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
      <Route path="/reset-password" element={<GuestOnly><ResetPasswordPage /></GuestOnly>} />

      {/* Authenticated user routes */}
      <Route path="/profile" element={<RequireAuth><ProfilePage /></RequireAuth>} />
      <Route path="/user" element={<RequireAuth><UserHomePage /></RequireAuth>} />
      <Route path="/dashboard" element={<RequireAuth><UserHomePage /></RequireAuth>} />
      <Route path="/user/rooms" element={<RequireAuth><RoomSearchPage /></RequireAuth>} />
      <Route path="/user/contracts" element={<RequireAuth><UserContractsPage /></RequireAuth>} />
      <Route path="/user/payments" element={<RequireAuth><UserPaymentsPage /></RequireAuth>} />
      <Route path="/user/qr-settings" element={<RequireAuth><PaymentAccountSettingsPage role="USER" /></RequireAuth>} />
      <Route path="/user/payment-account" element={<RequireAuth><PaymentAccountSettingsPage role="USER" /></RequireAuth>} />
      <Route path="/my-contracts" element={<RequireAuth><UserContractsPage /></RequireAuth>} />
      <Route path="/my-payments" element={<RequireAuth><UserPaymentsPage /></RequireAuth>} />
      <Route path="/become-landlord" element={<RequireAuth><BecomeLandlordPage /></RequireAuth>} />
      <Route path="/notifications" element={<RequireAuth><NotificationsPage /></RequireAuth>} />
      <Route path="/notifications/:notificationId" element={<RequireAuth><NotificationDetailPage /></RequireAuth>} />
      <Route path="/notifications/:id" element={<RequireAuth><NotificationDetailPage /></RequireAuth>} />
      <Route path="/messages" element={<RequireAuth><MessagesPage /></RequireAuth>} />

      {/* Landlord routes */}
      <Route path="/landlord" element={<RequireRole role="LANDLORD"><LandlordDashboardPage /></RequireRole>} />
      <Route path="/landlord/properties" element={<RequireRole role="LANDLORD"><LandlordPropertiesPage /></RequireRole>} />
      <Route path="/landlord/rooms" element={<RequireRole role="LANDLORD"><LandlordRoomsPage /></RequireRole>} />
      <Route path="/landlord/bookings" element={<RequireRole role="LANDLORD"><LandlordBookingsPage /></RequireRole>} />
      <Route path="/landlord/payments" element={<RequireRole role="LANDLORD"><LandlordPaymentsPage /></RequireRole>} />
      <Route path="/landlord/qr-settings" element={<RequireRole role="LANDLORD"><PaymentAccountSettingsPage role="LANDLORD" /></RequireRole>} />
      <Route path="/landlord/payment-account" element={<RequireRole role="LANDLORD"><PaymentAccountSettingsPage role="LANDLORD" /></RequireRole>} />
      <Route path="/landlord/commission-payments" element={<RequireRole role="LANDLORD"><LandlordCommissionPaymentsPage /></RequireRole>} />
      <Route path="/landlord/commission" element={<RequireRole role="LANDLORD"><LandlordCommissionPaymentsPage /></RequireRole>} />
      <Route path="/landlord/tenants" element={<RequireRole role="LANDLORD"><LandlordTenantsPage /></RequireRole>} />
      <Route path="/landlord/contracts" element={<RequireRole role="LANDLORD"><LandlordContractsPage /></RequireRole>} />

      {/* Admin routes */}
      <Route path="/admin" element={<RequireRole role="ADMIN"><AdminDashboardPage /></RequireRole>} />
      <Route path="/admin/users" element={<RequireRole role="ADMIN"><AdminUsersPage /></RequireRole>} />
      <Route path="/admin/landlords" element={<RequireRole role="ADMIN"><AdminLandlordsPage /></RequireRole>} />
      <Route path="/admin/rooms" element={<RequireRole role="ADMIN"><AdminRoomsPage /></RequireRole>} />
      <Route path="/admin/landlord-applications" element={<RequireRole role="ADMIN"><AdminLandlordApplicationsPage /></RequireRole>} />
      <Route path="/admin/applications" element={<RequireRole role="ADMIN"><AdminLandlordApplicationsPage /></RequireRole>} />
      <Route path="/admin/contracts" element={<RequireRole role="ADMIN"><AdminContractsPage /></RequireRole>} />
      <Route path="/admin/payments" element={<RequireRole role="ADMIN"><AdminPaymentsPage /></RequireRole>} />
      <Route path="/admin/qr-settings" element={<RequireRole role="ADMIN"><PaymentAccountSettingsPage role="ADMIN" /></RequireRole>} />
      <Route path="/admin/payment-account" element={<RequireRole role="ADMIN"><PaymentAccountSettingsPage role="ADMIN" /></RequireRole>} />
      <Route path="/admin/commission-payments" element={<RequireRole role="ADMIN"><AdminCommissionPaymentsPage /></RequireRole>} />
      <Route path="/admin/commission" element={<RequireRole role="ADMIN"><AdminCommissionPaymentsPage /></RequireRole>} />
      <Route path="/admin/announcements" element={<RequireRole role="ADMIN"><AdminAnnouncementsPage /></RequireRole>} />
      <Route path="/admin/payment-settings" element={<RequireRole role="ADMIN"><AdminPaymentSettingsPage /></RequireRole>} />
      <Route path="/admin/settings" element={<RequireRole role="ADMIN"><AdminPaymentSettingsPage /></RequireRole>} />

      {/* Fallback */}
      <Route path="*" element={<Navigate to={defaultRoute} replace />} />
    </Routes>
  )
}
