import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Plus, Trash2, Megaphone } from 'lucide-react'
import ManagementLayout from '@/components/layout/ManagementLayout'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table'
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton'
import { adminApi } from '@/api/adminApi'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Announcement } from '@/types'

const schema = z.object({
  title: z.string().min(1, 'Bắt buộc'),
  content: z.string().min(1, 'Bắt buộc'),
  targetRole: z.enum(['ALL', 'USER', 'LANDLORD']),
})
type FormValues = z.infer<typeof schema>

export default function AdminAnnouncementsPage() {
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<Announcement | null>(null)

  const { data: announcements = [], isLoading } = useQuery({
    queryKey: ['admin-announcements'],
    queryFn: adminApi.getAnnouncements,
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { targetRole: 'ALL' },
  })

  const { mutate: create, isPending } = useMutation({
    mutationFn: (data: FormValues) => adminApi.createAnnouncement(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-announcements'] }); toast.success('Đã đăng thông báo!'); setOpen(false); reset() },
  })

  const roleLabel = (role?: string) => ({ ALL: 'Tất cả', USER: 'Người thuê', LANDLORD: 'Chủ trọ' }[role || 'ALL'] || role || 'Tất cả')
  const roleVariant = (role?: string): 'default' | 'info' | 'warning' => {
    const map = {
      ALL: 'default',
      USER: 'info',
      LANDLORD: 'warning',
    } as const
    return map[role as keyof typeof map] || 'default'
  }

  return (
    <ManagementLayout role="ADMIN">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-display font-bold text-[#292524]">Thông báo hệ thống</h1>
            <p className="text-sm text-[#78716C] mt-1">Tạo và quản lý thông báo cho người dùng</p>
          </div>
          <Button leftIcon={<Plus size={16} />} onClick={() => setOpen(true)}>Tạo thông báo</Button>
        </div>

        {isLoading ? <TableSkeleton rows={5} cols={4} /> : announcements.length === 0 ? (
          <EmptyState title="Chưa có thông báo nào" icon={<Megaphone size={28} />} />
        ) : (
          <div className="rounded-[22px] border border-[#E8DED1] bg-white/95 shadow-[0_18px_48px_-28px_rgb(91_70_54/0.34)] overflow-hidden backdrop-blur-sm">
            <Table>
              <TableHead><tr><Th>Tiêu đề</Th><Th>Đối tượng</Th><Th>Ngày đăng</Th><Th></Th></tr></TableHead>
              <TableBody>
                {announcements.map((a) => (
                  <Tr key={a.id}>
                    <Td>
                      <p className="font-medium text-[#292524]">{a.title}</p>
                      <p className="text-xs text-[#A8A29E] line-clamp-1 mt-0.5">{a.content}</p>
                    </Td>
                    <Td><Badge variant={roleVariant(a.targetRole)} size="sm">{roleLabel(a.targetRole)}</Badge></Td>
                    <Td>{a.createdAt ? formatDate(a.createdAt) : '—'}</Td>
                    <Td><Button size="sm" variant="ghost" leftIcon={<Trash2 size={14} />} onClick={() => setDeleteTarget(a)} className="text-red-500">Xóa</Button></Td>
                  </Tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Create modal */}
      <Modal
        open={open} onClose={() => { setOpen(false); reset() }}
        title="Tạo thông báo mới"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setOpen(false); reset() }}>Hủy</Button>
            <Button onClick={handleSubmit((d) => create(d))} loading={isPending}>Đăng thông báo</Button>
          </>
        }
      >
        <form className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#44403C] block mb-1.5">Tiêu đề <span className="text-red-500">*</span></label>
            <input {...register('title')} placeholder="Nhập tiêu đề..." className="w-full rounded-[10px] border border-[#D6D3D1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30 focus:border-[#C96A3D]" />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>}
          </div>
          <div>
            <label className="text-sm font-medium text-[#44403C] block mb-1.5">Đối tượng <span className="text-red-500">*</span></label>
            <select {...register('targetRole')} className="w-full rounded-[10px] border border-[#D6D3D1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30 focus:border-[#C96A3D] bg-white">
              <option value="ALL">Tất cả người dùng</option>
              <option value="USER">Người thuê</option>
              <option value="LANDLORD">Chủ trọ</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-medium text-[#44403C] block mb-1.5">Nội dung <span className="text-red-500">*</span></label>
            <textarea {...register('content')} rows={5} placeholder="Nhập nội dung thông báo..."
              className="w-full rounded-[10px] border border-[#D6D3D1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30 focus:border-[#C96A3D] resize-none" />
            {errors.content && <p className="text-xs text-red-500 mt-1">{errors.content.message}</p>}
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteTarget} onClose={() => setDeleteTarget(null)}
        onConfirm={() => { toast.success('Đã xóa'); setDeleteTarget(null) }}
        title="Xóa thông báo?" message={`Bạn muốn xóa thông báo "${deleteTarget?.title}"?`}
        danger
      />
    </ManagementLayout>
  )
}
