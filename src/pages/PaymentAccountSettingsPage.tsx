import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Landmark, QrCode, Save, ShieldCheck } from 'lucide-react'
import ManagementLayout from '@/components/layout/ManagementLayout'
import PublicLayout from '@/components/layout/PublicLayout'
import Badge from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import { PageLoader } from '@/components/ui/Skeleton'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import type { User } from '@/types'

interface Props {
  role: 'ADMIN' | 'LANDLORD' | 'USER'
}

type PaymentAccountConfig = {
  fullName: string
  email: string
  phone: string
  bankName: string
  bankAccountNumber: string
  bankAccountName: string
  vietQrTemplate: string
}

function mapUserToConfig(user: User | null): PaymentAccountConfig {
  return {
    fullName: user?.fullName ?? '',
    email: user?.email ?? '',
    phone: user?.phone ?? '',
    bankName: user?.bankName ?? '',
    bankAccountNumber: user?.bankAccountNumber ?? '',
    bankAccountName: user?.bankAccountName ?? '',
    vietQrTemplate: user?.vietQrTemplate ?? 'compact2',
  }
}

export default function PaymentAccountSettingsPage({ role }: Props) {
  const storeUser = useAuthStore((s) => s.user)
  const updateStoreUser = useAuthStore((s) => s.updateUser)
  const [config, setConfig] = useState(() => mapUserToConfig(storeUser))
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const backTo = role === 'ADMIN' ? '/admin/payments' : role === 'LANDLORD' ? '/landlord/payments' : '/user/payments'
  const roleLabel = role === 'ADMIN' ? 'admin' : role === 'LANDLORD' ? 'chủ trọ' : 'người dùng'
  const isReady = Boolean(config.bankName && config.bankAccountNumber && config.bankAccountName)

  const previewContent = useMemo(() => {
    const amount = role === 'ADMIN' ? 'Hoa hồng hệ thống' : role === 'LANDLORD' ? 'Tiền thuê phòng' : 'Nhận tiền hoàn/đối soát'
    return `${amount} - ${config.bankAccountName || 'TEN TAI KHOAN'}`
  }, [config.bankAccountName, role])

  const renderLayout = (children: React.ReactNode) => (
    role === 'USER' ? <PublicLayout>{children}</PublicLayout> : <ManagementLayout role={role}>{children}</ManagementLayout>
  )

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const user = await authApi.getMe()
        updateStoreUser(user)
        setConfig(mapUserToConfig(user))
      } catch (err: unknown) {
        const e = err as { response?: { data?: { message?: string } } }
        setError(e?.response?.data?.message || 'Không thể tải cấu hình VietQR.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [updateStoreUser])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setConfig((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const updated = await authApi.updateMe({
        fullName: config.fullName,
        email: config.email || undefined,
        phone: config.phone || undefined,
        bankName: config.bankName || undefined,
        bankAccountNumber: config.bankAccountNumber || undefined,
        bankAccountName: config.bankAccountName || undefined,
        vietQrTemplate: config.vietQrTemplate || undefined,
      } as Partial<User>)
      updateStoreUser(updated)
      setConfig(mapUserToConfig(updated))
      setMessage('Đã lưu cấu hình VietQR.')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setError(e?.response?.data?.message || 'Không thể lưu cấu hình VietQR.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return renderLayout(<PageLoader />)

  return renderLayout(
      <div className="min-h-screen bg-[#FAF6EF] px-4 py-8 sm:px-6">
        <div className="mx-auto max-w-5xl">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <Link to={backTo} className="mb-3 inline-flex items-center gap-1.5 text-sm font-medium text-[#9A6A47] hover:text-[#C96A3D]">
                <ArrowLeft size={16} />
                Quay lại thanh toán
              </Link>
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-[12px] bg-[#C96A3D]/10 text-[#C96A3D]">
                  <QrCode size={22} />
                </div>
                <div>
                  <h1 className="font-display text-2xl font-bold text-[#292524]">Tài khoản VietQR</h1>
                  <p className="mt-1 text-sm text-[#78716C]">
                    Cấu hình tài khoản nhận tiền cho {roleLabel}, tách riêng khỏi màn hình theo dõi thanh toán.
                  </p>
                </div>
              </div>
            </div>
            <Badge variant={isReady ? 'success' : 'warning'}>
              {isReady ? 'Đủ cấu hình tạo QR' : 'Cần bổ sung thông tin'}
            </Badge>
          </div>

          <div className="grid grid-cols-1 gap-5 lg:grid-cols-[minmax(0,1fr)_340px]">
            <Card>
              <CardHeader>
                <CardTitle>Thông tin nhận tiền</CardTitle>
              </CardHeader>
              <form onSubmit={handleSubmit} className="px-5 pb-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Tên / mã ngân hàng VietQR"
                    name="bankName"
                    value={config.bankName}
                    onChange={handleChange}
                    placeholder="mbbank, VCB, ACB..."
                    leftIcon={<Landmark size={15} />}
                    required
                  />
                  <Input
                    label="Template VietQR"
                    name="vietQrTemplate"
                    value={config.vietQrTemplate}
                    onChange={handleChange}
                    placeholder="compact2"
                  />
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Input
                    label="Số tài khoản"
                    name="bankAccountNumber"
                    value={config.bankAccountNumber}
                    onChange={handleChange}
                    placeholder="0123456789"
                    leftIcon={<Landmark size={15} />}
                    required
                  />
                  <Input
                    label="Tên tài khoản"
                    name="bankAccountName"
                    value={config.bankAccountName}
                    onChange={handleChange}
                    placeholder="NGUYEN VAN A"
                    required
                  />
                </div>

                <div className="mt-5 rounded-[14px] border border-[#E8DED1] bg-[#FFFBF7] p-4">
                  <div className="flex gap-3">
                    <ShieldCheck size={18} className="mt-0.5 shrink-0 text-[#7A8450]" />
                    <p className="text-sm leading-6 text-[#5F5146]">
                      Cấu hình này được dùng khi hệ thống tạo QR nhận tiền. Không lưu secret tại frontend; chỉ cập nhật các thông tin tài khoản thanh toán công khai cần thiết cho VietQR.
                    </p>
                  </div>
                </div>

                {message && <div className="mt-4 rounded-[12px] border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{message}</div>}
                {error && <div className="mt-4 rounded-[12px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">{error}</div>}

                <div className="mt-5 flex justify-end">
                  <Button type="submit" loading={saving} leftIcon={<Save size={16} />}>
                    Lưu cấu hình VietQR
                  </Button>
                </div>
              </form>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Xem nhanh</CardTitle>
              </CardHeader>
              <div className="px-5 pb-5">
                <div className="rounded-[18px] border border-[#E8DED1] bg-[linear-gradient(135deg,#FFF8F3_0%,#FFFFFF_100%)] p-5">
                  <div className="mx-auto flex h-40 w-40 items-center justify-center rounded-[16px] border border-[#E7E5E4] bg-white">
                    <QrCode size={74} className="text-[#C96A3D]" />
                  </div>
                  <div className="mt-5 space-y-3 text-sm">
                    <PreviewRow label="Ngân hàng" value={config.bankName || '---'} />
                    <PreviewRow label="Số tài khoản" value={config.bankAccountNumber || '---'} />
                    <PreviewRow label="Chủ tài khoản" value={config.bankAccountName || '---'} />
                    <PreviewRow label="Nội dung mẫu" value={previewContent} />
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>,
  )
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#A39283]">{label}</p>
      <p className="mt-1 break-words font-semibold text-[#2C241D]">{value}</p>
    </div>
  )
}
