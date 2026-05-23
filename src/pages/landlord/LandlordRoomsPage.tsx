import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Pencil, Trash2, BedDouble, X, Star } from 'lucide-react'
import ManagementLayout from '@/components/layout/ManagementLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Select from '@/components/ui/Select'
import Modal, { ConfirmDialog } from '@/components/ui/Modal'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table'
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton'
import { rentalApi } from '@/api/rentalApi'
import { fileToDataUrl } from '@/utils/file'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Room } from '@/types'

const schema = z.object({
  title: z.string().min(2, 'Tiêu đề quá ngắn'),
  propertyId: z.string().min(1, 'Chọn khu trọ'),
  roomType: z.string().optional(),
  roomCode: z.string().optional(),
  price: z.coerce.number().positive('Giá phải > 0'),
  depositAmount: z.coerce.number().min(0).optional(),
  area: z.coerce.number().positive().optional(),
  maxTenants: z.coerce.number().int().positive().optional(),
  electricPrice: z.coerce.number().min(0).optional(),
  waterPrice: z.coerce.number().min(0).optional(),
  servicePrice: z.coerce.number().min(0).optional(),
  genderAllowed: z.string().optional(),
  furnished: z.boolean().optional(),
  furnishingDetail: z.string().optional(),
  availableFrom: z.string().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
  amenityIds: z.array(z.string()).optional(),
  customAmenitiesText: z.string().optional(),
})
type FormInput = z.input<typeof schema>
type FormData = z.output<typeof schema>

interface ImageItem {
  id: string
  imageUrl: string
  fileName: string
  isThumbnail: boolean
}

function normalizeImages(items: ImageItem[]): ImageItem[] {
  if (!items.length) return []
  const hasThumbnail = items.some((i) => i.isThumbnail)
  return items.map((i, idx) => ({ ...i, isThumbnail: hasThumbnail ? i.isThumbnail : idx === 0 }))
}

export default function LandlordRoomsPage() {
  const qc = useQueryClient()
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Room | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null)
  const [imageItems, setImageItems] = useState<ImageItem[]>([])
  const [uploadingImages, setUploadingImages] = useState(false)

  const { data: rooms = [], isLoading } = useQuery({ queryKey: ['landlord-rooms'], queryFn: () => rentalApi.getLandlordRooms() })
  const { data: properties = [] } = useQuery({ queryKey: ['landlord-properties'], queryFn: rentalApi.getLandlordProperties })
  const { data: amenities = [] } = useQuery({ queryKey: ['amenities'], queryFn: rentalApi.getAmenities })

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormInput, unknown, FormData>({
    resolver: zodResolver(schema),
  })

  const furnished = watch('furnished')

  const openCreate = () => {
    reset({
      status: 'AVAILABLE', genderAllowed: 'ALL', furnished: false,
      electricPrice: 0, waterPrice: 0, servicePrice: 0, depositAmount: 0,
    })
    setImageItems([])
    setFormOpen(true)
  }

  const openEdit = (room: Room) => {
    reset({
      propertyId: String(room.propertyId || ''),
      title: room.title || '',
      description: room.description || '',
      roomType: room.roomType || '',
      roomCode: room.roomCode || '',
      area: room.area ?? undefined,
      price: room.price,
      depositAmount: room.depositAmount ?? 0,
      electricPrice: room.electricPrice ?? 0,
      waterPrice: room.waterPrice ?? 0,
      servicePrice: room.servicePrice ?? 0,
      maxTenants: room.maxTenants ?? room.maxOccupants ?? 1,
      genderAllowed: room.genderAllowed || 'ALL',
      furnished: Boolean(room.furnished),
      furnishingDetail: room.furnishingDetail || '',
      status: room.status || 'AVAILABLE',
      availableFrom: room.availableFrom ? room.availableFrom.slice(0, 10) : '',
      amenityIds: room.amenities?.map((a) => String(a.id)) || [],
    })
    setImageItems(normalizeImages(
      (room.images || []).map((img, idx) => ({
        id: String(img.id ?? `existing-${idx}`),
        imageUrl: img.imageUrl,
        fileName: `Ảnh ${idx + 1}`,
        isThumbnail: idx === 0,
      }))
    ))
    setEditing(room)
  }

  const handleSelectImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    setUploadingImages(true)
    try {
      const newItems = await Promise.all(files.map(async (file, idx) => ({
        id: `${file.name}-${file.lastModified}-${idx}`,
        imageUrl: await fileToDataUrl(file),
        fileName: file.name,
        isThumbnail: false,
      })))
      setImageItems((prev) => normalizeImages([...prev, ...newItems]))
    } catch { toast.error('Không thể đọc ảnh.') }
    finally { setUploadingImages(false); e.target.value = '' }
  }

  const removeImage = (id: string) => setImageItems((prev) => normalizeImages(prev.filter((i) => i.id !== id)))
  const setThumbnail = (id: string) => setImageItems((prev) => prev.map((i) => ({ ...i, isThumbnail: i.id === id })))

  const makePayload = (data: FormData) => ({
    propertyId: Number(data.propertyId),
    title: data.title,
    description: data.description || '',
    roomType: data.roomType || '',
    roomCode: data.roomCode || null,
    area: data.area ?? 0,
    price: data.price,
    depositAmount: data.depositAmount ?? 0,
    electricPrice: data.electricPrice ?? 0,
    waterPrice: data.waterPrice ?? 0,
    servicePrice: data.servicePrice ?? 0,
    maxTenants: data.maxTenants ?? 1,
    genderAllowed: data.genderAllowed || 'ALL',
    furnished: data.furnished ?? false,
    furnishingDetail: data.furnished ? (data.furnishingDetail || '') : '',
    status: data.status || 'AVAILABLE',
    availableFrom: data.availableFrom || null,
    amenityIds: (data.amenityIds || []).map(Number),
    customAmenities: data.customAmenitiesText
      ? data.customAmenitiesText.split(',').map((s) => s.trim()).filter(Boolean)
      : [],
    images: imageItems.map((img, idx) => ({
      imageUrl: img.imageUrl,
      isThumbnail: img.isThumbnail,
      sortOrder: idx,
    })),
  })

  const { mutate: create, isPending: creating } = useMutation({
    mutationFn: (data: FormData) => rentalApi.createRoom(makePayload(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['landlord-rooms'] }); toast.success('Thêm phòng thành công!'); setFormOpen(false); reset(); setImageItems([]) },
  })

  const { mutate: update, isPending: updating } = useMutation({
    mutationFn: (data: FormData) => rentalApi.updateRoom(editing!.id, makePayload(data)),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['landlord-rooms'] }); toast.success('Cập nhật thành công!'); setEditing(null); setImageItems([]) },
  })

  const { mutate: del, isPending: deleting } = useMutation({
    mutationFn: () => rentalApi.deleteRoom(deleteTarget!.id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['landlord-rooms'] }); toast.success('Đã xóa phòng!'); setDeleteTarget(null) },
  })

  const SectionLabel = ({ children }: { children: React.ReactNode }) => (
    <div className="mb-4 mt-6 border-t border-[#F0E9E0] pt-5 first:mt-0 first:border-0 first:pt-0">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#8A7663]">{children}</p>
    </div>
  )

  const RoomForm = ({ initial }: { initial?: Room }) => (
    <form onSubmit={handleSubmit((d) => initial ? update(d) : create(d))} className="space-y-0">

      <SectionLabel>Thông tin cơ bản</SectionLabel>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Input label="Tiêu đề phòng *" defaultValue={initial?.title} error={errors.title?.message} {...register('title')} />
        <Select label="Khu trọ *" defaultValue={initial?.propertyId?.toString()} error={errors.propertyId?.message} {...register('propertyId')}>
          <option value="">Chọn khu trọ...</option>
          {properties.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </Select>
        <Select label="Loại phòng" {...register('roomType')}>
          <option value="">-- Chọn loại --</option>
          <option value="PHONG_TRO">Phòng trọ</option>
          <option value="PHONG_GHEP">Phòng ở ghép</option>
          <option value="CAN_HO_MINI">Căn hộ mini</option>
          <option value="STUDIO">Studio</option>
          <option value="CAN_HO">Căn hộ</option>
          <option value="NHA_NGUYEN_CAN">Nhà nguyên căn</option>
        </Select>
        <Input label="Mã phòng" placeholder="vd: A01, P102" {...register('roomCode')} />
      </div>

      <SectionLabel>Giá cả</SectionLabel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input label="Giá thuê/tháng (VNĐ) *" type="number" defaultValue={initial?.price} error={errors.price?.message} {...register('price')} />
        <Input label="Tiền đặt cọc (VNĐ)" type="number" defaultValue={initial?.depositAmount} {...register('depositAmount')} />
        <Input label="Điện (VNĐ/kWh)" type="number" defaultValue={initial?.electricPrice} {...register('electricPrice')} />
        <Input label="Nước (VNĐ/m³)" type="number" defaultValue={initial?.waterPrice} {...register('waterPrice')} />
        <Input label="Phí dịch vụ (VNĐ/tháng)" type="number" defaultValue={initial?.servicePrice} {...register('servicePrice')} />
      </div>

      <SectionLabel>Chi tiết phòng</SectionLabel>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Input label="Diện tích (m²)" type="number" defaultValue={initial?.area} {...register('area')} />
        <Input label="Số người tối đa" type="number" defaultValue={initial?.maxTenants || initial?.maxOccupants} {...register('maxTenants')} />
        <Select label="Giới tính" {...register('genderAllowed')}>
          <option value="ALL">Đủ giới tính</option>
          <option value="MALE">Nam</option>
          <option value="FEMALE">Nữ</option>
        </Select>
        <Select label="Trạng thái" {...register('status')}>
          <option value="AVAILABLE">Còn trống</option>
          <option value="RENTED">Đã thuê</option>
          <option value="MAINTENANCE">Bảo trì</option>
        </Select>
        <Input label="Ngày có thể vào ở" type="date" defaultValue={initial?.availableFrom?.slice(0, 10)} {...register('availableFrom')} />
      </div>

      <div className="mt-4 rounded-[14px] border border-[#E8DED1] bg-[#FAF7F4] px-4 py-3">
        <label className="flex w-fit cursor-pointer items-center gap-2">
          <input type="checkbox" {...register('furnished')} className="rounded border-[#D6D3D1] text-[#C96A3D] focus:ring-[#C96A3D]" />
          <span className="text-sm font-medium text-[#44403C]">Phòng có nội thất</span>
        </label>
        {furnished && (
          <Input className="mt-2" label="Chi tiết nội thất" placeholder="Mô tả các nội thất có trong phòng..." {...register('furnishingDetail')} />
        )}
      </div>

      <SectionLabel>Tiện ích</SectionLabel>
      {amenities.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {amenities.map((a) => (
            <label key={a.id} className="flex items-center gap-1.5 cursor-pointer text-sm px-2.5 py-1 rounded-full border border-[#E7E5E4] hover:border-[#C96A3D] transition-colors">
              <input
                type="checkbox"
                value={a.id}
                defaultChecked={initial?.amenities?.some((item) => item.id === a.id)}
                {...register('amenityIds')}
                className="rounded border-[#D6D3D1] text-[#C96A3D] focus:ring-[#C96A3D]"
              />
              {a.name}
            </label>
          ))}
        </div>
      )}
      <Input label="Tiện ích khác (cách nhau bằng dấu phẩy)" placeholder="vd: Ban công, Trần cao, Cửa sổ lớn" {...register('customAmenitiesText')} />

      <SectionLabel>Mô tả</SectionLabel>
      <Textarea label="Mô tả chi tiết" rows={3} defaultValue={initial?.description} {...register('description')} />

      <SectionLabel>Ảnh phòng</SectionLabel>
      <div>
        <input type="file" multiple accept="image/*" id="room-images" onChange={handleSelectImages} className="hidden" />
        <label htmlFor="room-images"
          className="inline-flex items-center gap-2 px-3 py-2 text-sm rounded-[10px] border border-dashed border-[#D6D3D1] text-[#78716C] hover:border-[#C96A3D] hover:text-[#C96A3D] cursor-pointer transition-colors">
          + Chọn ảnh {uploadingImages && '(đang xử lý...)'}
        </label>
        {imageItems.length > 0 && (
          <div className="mt-3 grid grid-cols-3 sm:grid-cols-4 gap-2">
            {imageItems.map((img) => (
              <div key={img.id} className={`relative rounded-[10px] overflow-hidden aspect-square border-2 transition-colors ${img.isThumbnail ? 'border-[#C96A3D]' : 'border-[#E7E5E4]'}`}>
                <img src={img.imageUrl} alt={img.fileName} className="w-full h-full object-cover" />
                <button type="button" onClick={() => removeImage(img.id)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 text-white flex items-center justify-center">
                  <X size={10} />
                </button>
                <button type="button" onClick={() => setThumbnail(img.id)} title="Đặt làm ảnh bìa"
                  className={`absolute bottom-1 left-1 w-5 h-5 rounded-full flex items-center justify-center transition-colors ${img.isThumbnail ? 'bg-[#C96A3D] text-white' : 'bg-black/40 text-white/70 hover:bg-[#C96A3D] hover:text-white'}`}>
                  <Star size={10} />
                </button>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-[#A8A29E] mt-1.5">Nhấn ★ để đặt ảnh bìa. Nhấn ✕ để xóa ảnh.</p>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-2 border-t border-[#F0E9E0] pt-4">
        <Button type="button" variant="ghost" onClick={() => { initial ? setEditing(null) : setFormOpen(false); reset(); setImageItems([]) }}>Hủy</Button>
        <Button type="submit" loading={initial ? updating : creating}>{initial ? 'Lưu thay đổi' : 'Thêm phòng'}</Button>
      </div>
    </form>
  )

  return (
    <ManagementLayout role="LANDLORD">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-[#292524]">Phòng trọ</h1>
            <p className="text-sm text-[#78716C] mt-1">Quản lý tất cả phòng trọ của bạn</p>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={openCreate}>Thêm phòng</Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : rooms.length === 0 ? (
          <EmptyState title="Chưa có phòng nào" icon={<BedDouble size={28} />}
            action={<Button leftIcon={<Plus size={16} />} onClick={openCreate}>Thêm phòng</Button>} />
        ) : (
          <div className="rounded-[22px] border border-[#E8DED1] bg-white/95 shadow-[0_18px_48px_-28px_rgb(91_70_54/0.34)] overflow-hidden backdrop-blur-sm">
            <Table>
              <TableHead><tr><Th>Tiêu đề</Th><Th>Khu trọ</Th><Th>Loại</Th><Th>Giá thuê</Th><Th>Diện tích</Th><Th>Trạng thái</Th><Th>Thao tác</Th></tr></TableHead>
              <TableBody>
                {rooms.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-medium max-w-[160px] truncate">{r.title}{r.roomCode && <span className="ml-1 text-[10px] text-[#A8A29E]">#{r.roomCode}</span>}</Td>
                    <Td className="text-[#57534E]">{r.propertyName || '—'}</Td>
                    <Td className="text-[#57534E] text-xs">{r.roomType || '—'}</Td>
                    <Td className="font-semibold text-[#C96A3D]">{formatCurrency(r.price)}</Td>
                    <Td>{r.area ? `${r.area}m²` : '—'}</Td>
                    <Td><Badge variant={getStatusBadgeVariant(r.status)} size="sm">{getStatusLabel(r.status)}</Badge></Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button variant="ghost" size="sm" leftIcon={<Pencil size={14} />} onClick={() => openEdit(r)}>Sửa</Button>
                        <Button variant="ghost" size="sm" leftIcon={<Trash2 size={14} />} onClick={() => setDeleteTarget(r)} className="text-red-500">Xóa</Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Modal open={formOpen} onClose={() => { setFormOpen(false); reset(); setImageItems([]) }} title="Thêm phòng mới" size="xl">
        <RoomForm />
      </Modal>
      <Modal open={!!editing} onClose={() => { setEditing(null); reset(); setImageItems([]) }} title="Chỉnh sửa phòng" size="xl">
        {editing && <RoomForm initial={editing} />}
      </Modal>
      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={() => del()}
        title="Xóa phòng?" message={`Xóa "${deleteTarget?.title}"?`} danger loading={deleting}
      />
    </ManagementLayout>
  )
}
