import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, Building2, MapPin } from 'lucide-react'
import ManagementLayout from '@/components/layout/ManagementLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Modal, { ConfirmDialog } from '@/components/ui/Modal'
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table'
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton'
import Badge from '@/components/ui/Badge'
import { rentalApi } from '@/api/rentalApi'
import { addressApi } from '@/api/addressApi'
import toast from 'react-hot-toast'
import type { Property } from '@/types'

const schema = z.object({
  name: z.string().min(2, 'Tên quá ngắn'),
  addressLine: z.string().min(5, 'Nhập địa chỉ'),
  provinceId: z.string().min(1, 'Chọn tỉnh thành'),
  districtId: z.string().min(1, 'Chọn quận/huyện'),
  wardId: z.string().min(1, 'Chọn phường/xã'),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
})
type FormInput = z.input<typeof schema>
type FormData = z.output<typeof schema>

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wide mb-3 mt-5 border-t border-[#F0E9E0] pt-4 first:mt-0 first:border-0 first:pt-0">
      {children}
    </p>
  )
}

function PropertyForm({ initial, onClose, onSave }: { initial?: Property; onClose: () => void; onSave: (data: FormData) => void }) {
  const { register, handleSubmit, watch, formState: { errors } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
    defaultValues: initial ? {
      name: initial.name,
      addressLine: initial.addressLine || (initial as any).address || '',
      provinceId: initial.provinceId?.toString() || '',
      districtId: initial.districtId?.toString() || '',
      wardId: initial.wardId?.toString() || '',
      latitude: initial.latitude?.toString() || '',
      longitude: initial.longitude?.toString() || '',
      status: (initial as any).status || 'ACTIVE',
      description: initial.description || '',
    } : { status: 'ACTIVE' },
  })
  const provinceId = watch('provinceId')
  const districtId = watch('districtId')

  const { data: provinces = [] } = useQuery({ queryKey: ['provinces'], queryFn: addressApi.getProvinces })
  const { data: districts = [] } = useQuery({
    queryKey: ['districts', provinceId],
    queryFn: () => addressApi.getDistricts(provinceId),
    enabled: !!provinceId,
  })
  const { data: wards = [] } = useQuery({
    queryKey: ['wards', districtId],
    queryFn: () => addressApi.getWards(districtId),
    enabled: !!districtId,
  })

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-0">
      <SectionLabel>Thông tin cơ bản</SectionLabel>
      <div className="mb-4 space-y-3">
        <Input label="Tên khu trọ *" error={errors.name?.message} {...register('name')} />
        <Select label="Trạng thái" {...register('status')}>
          <option value="ACTIVE">Đang hoạt động</option>
          <option value="INACTIVE">Tạm dừng</option>
        </Select>
      </div>

      <SectionLabel>Địa chỉ</SectionLabel>
      <div className="space-y-3 mb-4">
        <Input
          label="Địa chỉ cụ thể (số nhà, tên đường) *"
          error={errors.addressLine?.message}
          leftIcon={<MapPin size={15} />}
          {...register('addressLine')}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Select label="Tỉnh/Thành phố *" error={errors.provinceId?.message} {...register('provinceId')}>
            <option value="">Chọn...</option>
            {provinces.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </Select>
          <Select label="Quận/Huyện *" error={errors.districtId?.message} {...register('districtId')}>
            <option value="">Chọn...</option>
            {districts.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
          <Select label="Phường/Xã *" error={errors.wardId?.message} {...register('wardId')}>
            <option value="">Chọn...</option>
            {wards.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </Select>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Vĩ độ (Latitude)" placeholder="vd: 10.762622" {...register('latitude')} />
          <Input label="Kinh độ (Longitude)" placeholder="vd: 106.660172" {...register('longitude')} />
        </div>
        <p className="text-xs text-[#A8A29E]">Latitude/Longitude dùng để hiển thị bản đồ (tùy chọn).</p>
      </div>

      <SectionLabel>Mô tả</SectionLabel>
      <Textarea label="Mô tả khu trọ" rows={3} placeholder="Mô tả vị trí, đặc điểm nổi bật..." {...register('description')} />

      <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-[#F0E9E0]">
        <Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
        <Button type="submit">{initial ? 'Lưu thay đổi' : 'Thêm khu trọ'}</Button>
      </div>
    </form>
  )
}

export default function LandlordPropertiesPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Property | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Property | null>(null)

  const { data: properties = [], isLoading } = useQuery({
    queryKey: ['landlord-properties'],
    queryFn: rentalApi.getLandlordProperties,
  })

  const buildPayload = (data: FormData) => ({
    name: data.name,
    description: data.description,
    addressLine: data.addressLine,
    provinceId: Number(data.provinceId),
    districtId: Number(data.districtId),
    wardId: Number(data.wardId),
    latitude: data.latitude ? Number(data.latitude) : undefined,
    longitude: data.longitude ? Number(data.longitude) : undefined,
    status: data.status || 'ACTIVE',
  })

  const { mutate: create } = useMutation({
    mutationFn: (data: FormData) => rentalApi.createProperty(buildPayload(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['landlord-properties'] }); toast.success('Thêm khu trọ thành công!'); setFormOpen(false) },
  })

  const { mutate: update } = useMutation({
    mutationFn: (data: FormData) => rentalApi.updateProperty(editing!.id, buildPayload(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['landlord-properties'] }); toast.success('Đã cập nhật!'); setEditing(null) },
  })

  const { mutate: del, isPending: deleting } = useMutation({
    mutationFn: () => rentalApi.deleteProperty(deleteTarget!.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['landlord-properties'] }); toast.success('Đã xóa!'); setDeleteTarget(null) },
  })

  return (
    <ManagementLayout role="LANDLORD">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-[#292524]">Khu trọ của tôi</h1>
            <p className="text-sm text-[#78716C] mt-1">Quản lý các khu trọ / nhà / tòa nhà</p>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={() => setFormOpen(true)}>Thêm khu trọ</Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={4} cols={5} />
        ) : properties.length === 0 ? (
          <EmptyState
            title="Chưa có khu trọ"
            description="Thêm khu trọ trước, sau đó mới có thể thêm phòng"
            icon={<Building2 size={28} />}
            action={<Button leftIcon={<Plus size={16} />} onClick={() => setFormOpen(true)}>Thêm khu trọ</Button>}
          />
        ) : (
          <div className="rounded-[22px] border border-[#E8DED1] bg-white/95 shadow-[0_18px_48px_-28px_rgb(91_70_54/0.34)] overflow-hidden backdrop-blur-sm">
            <Table>
              <TableHead>
                <tr>
                  <Th>Tên khu trọ</Th>
                  <Th>Địa chỉ</Th>
                  <Th>Tỉnh/Thành</Th>
                  <Th>Trạng thái</Th>
                  <Th>Thao tác</Th>
                </tr>
              </TableHead>
              <TableBody>
                {properties.map((p) => (
                  <Tr key={p.id}>
                    <Td className="font-medium">{p.name}</Td>
                    <Td className="text-[#57534E] max-w-[200px] truncate">{(p as any).addressLine || (p as any).address || '—'}</Td>
                    <Td className="text-[#57534E]">{p.provinceName || '—'}</Td>
                    <Td>
                      <Badge variant={(p as any).status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                        {(p as any).status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}
                      </Badge>
                    </Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" leftIcon={<Pencil size={14} />} onClick={() => setEditing(p)}>Sửa</Button>
                        <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} />} onClick={() => setDeleteTarget(p)} className="text-red-500 hover:text-red-600">Xóa</Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Modal open={formOpen} onClose={() => setFormOpen(false)} title="Thêm khu trọ mới">
        <PropertyForm onClose={() => setFormOpen(false)} onSave={(d) => create(d)} />
      </Modal>

      <Modal open={!!editing} onClose={() => setEditing(null)} title="Chỉnh sửa khu trọ">
        {editing && <PropertyForm initial={editing} onClose={() => setEditing(null)} onSave={(d) => update(d)} />}
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => del()}
        title="Xóa khu trọ?"
        message={`Bạn chắc chắn muốn xóa "${deleteTarget?.name}"? Tất cả phòng thuộc khu trọ này cũng có thể bị ảnh hưởng.`}
        danger
        loading={deleting}
      />
    </ManagementLayout>
  )
}
