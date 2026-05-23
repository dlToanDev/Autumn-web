import { useState, useRef } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, Phone, Mail, Save, AlertTriangle, Camera,
  MapPin, Calendar, BadgeCheck, Clock, QrCode,
} from 'lucide-react'
import PublicLayout from '@/components/layout/PublicLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import { ConfirmDialog } from '@/components/ui/Modal'
import { PageLoader, ErrorState } from '@/components/ui/Skeleton'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'
import { Link, useNavigate } from 'react-router-dom'

const profileSchema = z.object({
  fullName: z.string().min(2, 'Tên quá ngắn'),
  phone: z.string().min(9, 'Số điện thoại không hợp lệ').optional().or(z.literal('')),
  gender: z.string().optional(),
  dateOfBirth: z.string().optional(),
  address: z.string().optional(),
  hometown: z.string().optional(),
  avatarUrl: z.string().optional(),
  // Bank fields (landlord/admin only)
  bankName: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankAccountName: z.string().optional(),
  vietQrTemplate: z.string().optional(),
})
type ProfileForm = z.infer<typeof profileSchema>

function ReadOnlyField({ label, value, icon }: { label: string; value?: string | boolean | null; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-[#A8A29E] mb-1">{label}</p>
      <div className="flex items-center gap-2 px-3 py-2 bg-[#F5F0EC] rounded-[10px] min-h-[38px]">
        {icon && <span className="text-[#A8A29E] shrink-0">{icon}</span>}
        <span className="text-sm text-[#57534E]">
          {value === true ? 'Có' : value === false ? 'Không' : (value || '—')}
        </span>
      </div>
    </div>
  )
}

export default function ProfilePage() {
  const qc = useQueryClient()
  const navigate = useNavigate()
  const { updateUser, clearAuth } = useAuthStore()
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: me, isLoading, error } = useQuery({ queryKey: ['me'], queryFn: authApi.getMe })

  const paymentAccountPath = me?.roleCode === 'ADMIN'
    ? '/admin/qr-settings'
    : me?.roleCode === 'LANDLORD'
      ? '/landlord/qr-settings'
      : '/user/qr-settings'

  const { register, handleSubmit, setValue, formState: { errors, isDirty } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    values: me ? {
      fullName: me.fullName || '',
      phone: me.phone || '',
      gender: me.gender || '',
      dateOfBirth: me.dateOfBirth ? String(me.dateOfBirth).slice(0, 10) : '',
      address: me.address || '',
      hometown: me.hometown || '',
      avatarUrl: me.avatarUrl || '',
      bankName: me.bankName || '',
      bankAccountNumber: me.bankAccountNumber || '',
      bankAccountName: me.bankAccountName || '',
      vietQrTemplate: me.vietQrTemplate || 'compact2',
    } : undefined,
  })

  const { mutate: save, isPending: saving } = useMutation({
    mutationFn: (data: ProfileForm) => authApi.updateMe(data),
    onSuccess: (updated) => {
      updateUser(updated)
      qc.invalidateQueries({ queryKey: ['me'] })
      setAvatarPreview(null)
      toast.success('Cập nhật thành công!')
    },
  })

  const { mutate: deleteAccount, isPending: deleting } = useMutation({
    mutationFn: authApi.deleteMe,
    onSuccess: () => {
      clearAuth()
      navigate('/')
      toast.success('Tài khoản đã được xóa.')
    },
  })

  const handleAvatarFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Vui lòng chọn file ảnh hợp lệ.'); return }
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setAvatarPreview(result)
      setValue('avatarUrl', result, { shouldDirty: true })
    }
    reader.readAsDataURL(file)
  }

  if (isLoading) return <PublicLayout><PageLoader /></PublicLayout>
  if (error || !me) return <PublicLayout><ErrorState /></PublicLayout>

  const displayAvatar = avatarPreview || me.avatarUrl
  const initials = (me.fullName || me.email || 'U').charAt(0).toUpperCase()

  return (
    <PublicLayout>
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-2xl font-display font-bold text-[#292524] mb-6">Hồ sơ của tôi</h1>

        <form onSubmit={handleSubmit((d) => save(d))} className="space-y-5">

          {/* ── Avatar + identity card ─────────────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin cơ bản</CardTitle>
            </CardHeader>
            <div className="px-5 pb-5 space-y-5">

              {/* Avatar upload */}
              <div className="flex items-center gap-5">
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 rounded-full overflow-hidden bg-[#C96A3D] flex items-center justify-center ring-4 ring-[#F5F0EC]">
                    {displayAvatar ? (
                      <img src={displayAvatar} alt="avatar" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-white text-2xl font-bold">{initials}</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-[#C96A3D] hover:bg-[#B55C32] text-white flex items-center justify-center shadow-md transition-colors"
                    title="Đổi ảnh"
                  >
                    <Camera size={13} />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                </div>
                <div>
                  <h2 className="font-semibold text-[#292524]">{me.fullName || '(chưa đặt tên)'}</h2>
                  <p className="text-sm text-[#78716C]">{me.email}</p>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {me.roleName && (
                      <span className="text-xs bg-[#C96A3D]/10 text-[#C96A3D] px-2 py-0.5 rounded-full font-medium">
                        {me.roleName}
                      </span>
                    )}
                    {me.isVerified && (
                      <span className="text-xs bg-green-50 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <BadgeCheck size={10} /> Đã xác minh
                      </span>
                    )}
                    {me.status && (
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                        me.status === 'ACTIVE' ? 'bg-green-50 text-green-700' : 'bg-[#F5F0EC] text-[#78716C]'
                      }`}>{me.status}</span>
                    )}
                  </div>
                </div>
              </div>
              {avatarPreview && (
                <p className="text-xs text-[#C96A3D] -mt-2">
                  Ảnh mới đã chọn — nhấn "Lưu thay đổi" để cập nhật.
                </p>
              )}

              {/* Editable fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Họ tên *"
                  leftIcon={<User size={15} />}
                  error={errors.fullName?.message}
                  {...register('fullName')}
                />
                <Input
                  label="Số điện thoại"
                  leftIcon={<Phone size={15} />}
                  error={errors.phone?.message}
                  {...register('phone')}
                />
              </div>

              {/* Email (read-only) */}
              <div>
                <p className="text-xs text-[#A8A29E] mb-1">Email</p>
                <div className="flex items-center gap-2 px-3 py-2 bg-[#F5F0EC] rounded-[10px]">
                  <Mail size={15} className="text-[#A8A29E]" />
                  <span className="text-sm text-[#57534E] flex-1">{me.email}</span>
                  <span className="text-xs text-[#A8A29E]">Không thể đổi</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#A8A29E] block mb-1">Giới tính</label>
                  <select
                    {...register('gender')}
                    className="w-full h-10 border border-[#D6D3D1] rounded-[10px] px-3 text-sm text-[#292524] outline-none focus:ring-2 focus:ring-[#C96A3D]/30 focus:border-[#C96A3D]"
                  >
                    <option value="">-- chọn --</option>
                    <option value="male">Nam</option>
                    <option value="female">Nữ</option>
                    <option value="other">Khác</option>
                  </select>
                </div>
                <Input
                  label="Ngày sinh"
                  type="date"
                  leftIcon={<Calendar size={15} />}
                  {...register('dateOfBirth')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Địa chỉ hiện tại"
                  leftIcon={<MapPin size={15} />}
                  {...register('address')}
                />
                <Input
                  label="Quê quán"
                  leftIcon={<MapPin size={15} />}
                  {...register('hometown')}
                />
              </div>
            </div>
          </Card>

          {/* ── Account metadata (read-only) ───────────────────── */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin tài khoản</CardTitle>
            </CardHeader>
            <div className="px-5 pb-5">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <ReadOnlyField label="Vai trò" value={me.roleName || me.roleCode} icon={<User size={13} />} />
                <ReadOnlyField label="Trạng thái" value={me.status} icon={<BadgeCheck size={13} />} />
                <ReadOnlyField label="Đã xác minh" value={me.isVerified} icon={<BadgeCheck size={13} />} />
                <ReadOnlyField
                  label="Ngày tạo"
                  value={me.createdAt ? new Date(me.createdAt).toLocaleDateString('vi-VN') : undefined}
                  icon={<Clock size={13} />}
                />
                <ReadOnlyField
                  label="Cập nhật lần cuối"
                  value={me.updatedAt ? new Date(me.updatedAt).toLocaleDateString('vi-VN') : undefined}
                  icon={<Clock size={13} />}
                />
              </div>
            </div>
          </Card>

          {/* ── Payment account shortcut ──────────── */}
          {me && (
            <Card>
              <CardHeader>
                <CardTitle>Tài khoản VietQR</CardTitle>
              </CardHeader>
              <div className="px-5 pb-5">
                <div className="rounded-[14px] border border-[#E8DED1] bg-[#FFFBF7] p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 rounded-[10px] bg-[#C96A3D]/10 text-[#C96A3D] flex items-center justify-center shrink-0">
                      <QrCode size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#292524]">Cấu hình nhận tiền đã được tách riêng</p>
                      <p className="text-xs text-[#78716C] mt-1">Cập nhật ngân hàng, số tài khoản và template QR tại màn hình VietQR chuyên biệt.</p>
                    </div>
                  </div>
                  <Link to={paymentAccountPath}>
                    <Button type="button" variant="outline" size="sm" leftIcon={<QrCode size={14} />}>
                      Mở VietQR
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          )}

          {/* ── Save button ─────────────────────────────────────── */}
          <div className="flex justify-end">
            <Button type="submit" loading={saving} disabled={!isDirty} leftIcon={<Save size={16} />}>
              Lưu thay đổi
            </Button>
          </div>
        </form>

        {/* ── Danger zone ─────────────────────────────────────── */}
        <Card className="mt-5 border-red-100">
          <CardHeader>
            <CardTitle className="text-red-600">Vùng nguy hiểm</CardTitle>
          </CardHeader>
          <div className="px-5 pb-5">
            <p className="text-sm text-[#78716C] mb-4">
              Xóa tài khoản sẽ xóa vĩnh viễn tất cả dữ liệu của bạn và không thể khôi phục.
            </p>
            <Button variant="danger" leftIcon={<AlertTriangle size={16} />} onClick={() => setDeleteOpen(true)}>
              Xóa tài khoản
            </Button>
          </div>
        </Card>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={() => deleteAccount()}
        title="Xóa tài khoản?"
        message="Hành động này không thể hoàn tác. Tất cả dữ liệu sẽ bị xóa vĩnh viễn."
        confirmLabel="Xóa"
        danger
        loading={deleting}
      />
    </PublicLayout>
  )
}
