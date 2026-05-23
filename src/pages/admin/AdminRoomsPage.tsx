import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, XCircle, BedDouble } from 'lucide-react'
import ManagementLayout from '@/components/layout/ManagementLayout'
import Button from '@/components/ui/Button'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Tabs from '@/components/ui/Tabs'
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table'
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton'
import { adminApi } from '@/api/adminApi'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Room } from '@/types'

export default function AdminRoomsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('ALL')
  const [target, setTarget] = useState<{ room: Room; action: 'APPROVE' | 'REJECT' } | null>(null)
  const [note, setNote] = useState('')

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['admin-rooms'],
    queryFn: adminApi.getAdminRooms,
  })

  const { mutate: moderate, isPending } = useMutation({
    mutationFn: () => adminApi.moderateRoom(target!.room.id, { status: target!.action, moderationNote: note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-rooms'] }); toast.success('Đã cập nhật!'); setTarget(null); setNote('') },
  })

  const filteredRooms = tab === 'ALL'
    ? rooms
    : rooms.filter((room) => (room.moderationStatus || '').toUpperCase() === tab)

  const tabs = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((t) => ({
    key: t,
    label: { ALL: 'Tất cả', PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Bị từ chối' }[t]!,
    count: t === 'ALL' ? rooms.length : rooms.filter((room) => (room.moderationStatus || '').toUpperCase() === t).length,
  }))

  return (
    <ManagementLayout role="ADMIN">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-[#292524]">Kiểm duyệt phòng trọ</h1>
          <p className="text-sm text-[#78716C] mt-1">Duyệt hoặc từ chối các phòng trọ được đăng</p>
        </div>

        <Tabs tabs={tabs} activeTab={tab} onChange={setTab} className="mb-5" />

        {isLoading ? <TableSkeleton rows={5} cols={6} /> : filteredRooms.length === 0 ? (
          <EmptyState title="Không có phòng nào" icon={<BedDouble size={28} />} />
        ) : (
          <div className="rounded-[22px] border border-[#E8DED1] bg-white/95 shadow-[0_18px_48px_-28px_rgb(91_70_54/0.34)] overflow-hidden backdrop-blur-sm">
            <Table>
              <TableHead><tr><Th>Tiêu đề</Th><Th>Chủ trọ</Th><Th>Giá</Th><Th>Tỉnh</Th><Th>Kiểm duyệt</Th><Th>Thao tác</Th></tr></TableHead>
              <TableBody>
                {filteredRooms.map((r) => (
                  <Tr key={r.id}>
                    <Td className="font-medium max-w-[180px] truncate">{r.title}</Td>
                    <Td className="text-[#57534E]">{r.landlordName || '—'}</Td>
                    <Td className="font-semibold text-[#C96A3D]">{formatCurrency(r.price)}</Td>
                    <Td className="text-[#57534E]">{r.provinceName || '—'}</Td>
                    <Td><Badge variant={getStatusBadgeVariant(r.moderationStatus || r.status)} size="sm">{getStatusLabel(r.moderationStatus || r.status)}</Badge></Td>
                    <Td>
                      <div className="flex gap-2">
                        {(r.moderationStatus === 'PENDING' || !r.moderationStatus) && (
                          <>
                            <Button size="sm" leftIcon={<CheckCircle size={14} />} onClick={() => setTarget({ room: r, action: 'APPROVE' })}>Duyệt</Button>
                            <Button size="sm" variant="danger" leftIcon={<XCircle size={14} />} onClick={() => setTarget({ room: r, action: 'REJECT' })}>Từ chối</Button>
                          </>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <Modal
        open={!!target}
        onClose={() => { setTarget(null); setNote('') }}
        title={target?.action === 'APPROVE' ? 'Duyệt phòng' : 'Từ chối phòng'}
        description={target?.room.title}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setTarget(null); setNote('') }}>Hủy</Button>
            <Button variant={target?.action === 'APPROVE' ? 'primary' : 'danger'} onClick={() => moderate()} loading={isPending}>
              {target?.action === 'APPROVE' ? 'Xác nhận duyệt' : 'Từ chối'}
            </Button>
          </>
        }
      >
        <div>
          <label className="text-sm font-medium text-[#44403C] block mb-1.5">Ghi chú (tùy chọn)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder="Lý do..."
            className="w-full rounded-[10px] border border-[#D6D3D1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30 focus:border-[#C96A3D] resize-none" />
        </div>
      </Modal>
    </ManagementLayout>
  )
}
