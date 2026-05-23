import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle, XCircle, FileText, Plus } from 'lucide-react'
import ManagementLayout from '@/components/layout/ManagementLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table'
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton'
import Tabs from '@/components/ui/Tabs'
import { bookingApi } from '@/api/bookingApi'
import { contractApi } from '@/api/contractApi'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { BookingRequest } from '@/types'

const contractSchema = z.object({
  startDate: z.string().min(1, 'Nhập ngày bắt đầu'),
  endDate: z.string().min(1, 'Nhập ngày kết thúc'),
  terms: z.string().optional(),
})
type ContractFormInput = z.input<typeof contractSchema>
type ContractForm = z.output<typeof contractSchema>

export default function LandlordBookingsPage() {
  const qc = useQueryClient()
  const tabs = ['ALL', 'PENDING', 'APPROVED', 'REJECTED']
  const tabLabels: Record<string, string> = { ALL: 'Tất cả', PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' }
  const [activeTab, setActiveTab] = useState('ALL')
  const [contractBooking, setContractBooking] = useState<BookingRequest | null>(null)
  const [rejectTarget, setRejectTarget] = useState<BookingRequest | null>(null)
  const [rejectNote, setRejectNote] = useState('')

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['landlord-bookings'],
    queryFn: bookingApi.getLandlordBookings,
  })

  const { mutate: approve, isPending: approving } = useMutation({
    mutationFn: (id: number) => bookingApi.reviewBooking(id, { status: 'APPROVED' }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['landlord-bookings'] }); toast.success('Đã duyệt yêu cầu!') },
  })

  const { mutate: reject, isPending: rejecting } = useMutation({
    mutationFn: () => bookingApi.reviewBooking(rejectTarget!.id, { status: 'REJECTED', note: rejectNote }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['landlord-bookings'] }); toast.success('Đã từ chối.'); setRejectTarget(null); setRejectNote('') },
  })

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContractFormInput, unknown, ContractForm>({
    resolver: zodResolver(contractSchema),
  })

  const { mutate: createContract, isPending: contractLoading } = useMutation({
    mutationFn: (data: ContractForm) => contractApi.createContract({ ...data, bookingRequestId: contractBooking!.id }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['landlord-bookings'] }); toast.success('Hợp đồng đã tạo!'); setContractBooking(null); reset() },
  })

  const filtered = activeTab === 'ALL' ? bookings : bookings.filter((b) => b.status === activeTab)

  return (
    <ManagementLayout role="LANDLORD">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-[#292524]">Yêu cầu thuê phòng</h1>
          <p className="text-sm text-[#78716C] mt-1">Xem xét và phê duyệt các yêu cầu</p>
        </div>

        <Tabs
          tabs={tabs.map((t) => ({ id: t, label: tabLabels[t], count: t === 'ALL' ? bookings.length : bookings.filter((b) => b.status === t).length }))}
          activeId={activeTab}
          onChange={setActiveTab}
          className="mb-5"
        />

        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : filtered.length === 0 ? (
          <EmptyState title="Không có yêu cầu" icon={<FileText size={28} />} />
        ) : (
          <div className="rounded-[22px] border border-[#E8DED1] bg-white/95 shadow-[0_18px_48px_-28px_rgb(91_70_54/0.34)] overflow-hidden backdrop-blur-sm">
            <Table>
              <TableHead><tr><Th>Người thuê</Th><Th>Phòng</Th><Th>Ngày yêu cầu</Th><Th>Ngày dọn vào</Th><Th>Trạng thái</Th><Th>Thao tác</Th></tr></TableHead>
              <TableBody>
                {filtered.map((b) => (
                  <Tr key={b.id}>
                    <Td className="font-medium">{b.tenantName || `#${b.tenantId}`}</Td>
                    <Td className="text-[#57534E]">{b.roomTitle || `#${b.roomId}`}</Td>
                    <Td>{formatDate(b.createdAt)}</Td>
                    <Td>{b.moveInDate ? formatDate(b.moveInDate) : '—'}</Td>
                    <Td><Badge variant={getStatusBadgeVariant(b.status)} size="sm">{getStatusLabel(b.status)}</Badge></Td>
                    <Td>
                      <div className="flex gap-2">
                        {b.status === 'PENDING' && (
                          <>
                            <Button size="sm" leftIcon={<CheckCircle size={14} />} onClick={() => approve(b.id)} loading={approving}>Duyệt</Button>
                            <Button size="sm" variant="danger" leftIcon={<XCircle size={14} />} onClick={() => setRejectTarget(b)}>Từ chối</Button>
                          </>
                        )}
                        {b.status === 'APPROVED' && (
                          <Button size="sm" variant="outline" leftIcon={<Plus size={14} />} onClick={() => setContractBooking(b)}>Tạo HĐ</Button>
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

      {/* Create contract modal */}
      <Modal
        open={!!contractBooking}
        onClose={() => { setContractBooking(null); reset() }}
        title="Tạo hợp đồng"
        description={`Khách: ${contractBooking?.tenantName} · Phòng: ${contractBooking?.roomTitle}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setContractBooking(null); reset() }}>Hủy</Button>
            <Button form="contract-form" type="submit" loading={contractLoading}>Tạo hợp đồng</Button>
          </>
        }
      >
        <form id="contract-form" onSubmit={handleSubmit((d) => createContract(d))} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Ngày bắt đầu *" type="date" error={errors.startDate?.message} {...register('startDate')} />
            <Input label="Ngày kết thúc *" type="date" error={errors.endDate?.message} {...register('endDate')} />
          </div>
          <div>
            <label className="text-sm font-medium text-[#44403C] block mb-1.5">Nội dung hợp đồng (tùy chọn)</label>
            <textarea rows={4} {...register('terms')} placeholder="Điều khoản, quy định..."
              className="w-full rounded-[10px] border border-[#D6D3D1] px-3 py-2.5 text-sm text-[#292524] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30 focus:border-[#C96A3D] resize-none" />
          </div>
        </form>
      </Modal>

      {/* Reject modal */}
      <Modal
        open={!!rejectTarget}
        onClose={() => { setRejectTarget(null); setRejectNote('') }}
        title="Từ chối yêu cầu"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setRejectTarget(null); setRejectNote('') }}>Hủy</Button>
            <Button variant="danger" onClick={() => reject()} loading={rejecting}>Từ chối</Button>
          </>
        }
      >
        <div>
          <label className="text-sm font-medium text-[#44403C] block mb-1.5">Lý do từ chối (tùy chọn)</label>
          <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} rows={3} placeholder="Ghi chú lý do..."
            className="w-full rounded-[10px] border border-[#D6D3D1] px-3 py-2.5 text-sm text-[#292524] focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30 focus:border-[#C96A3D] resize-none" />
        </div>
      </Modal>
    </ManagementLayout>
  )
}
