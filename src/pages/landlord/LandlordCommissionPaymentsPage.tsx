import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { QrCode, Upload } from 'lucide-react'
import ManagementLayout from '@/components/layout/ManagementLayout'
import Button from '@/components/ui/Button'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table'
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton'
import { paymentApi } from '@/api/paymentApi'
import { fileToDataUrl } from '@/utils/file'
import { formatDate, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Payment } from '@/types'

export default function LandlordCommissionPaymentsPage() {
  const qc = useQueryClient()
  const [qrOpen, setQrOpen] = useState(false)
  const [qrUrl, setQrUrl] = useState('')
  const [proofOpen, setProofOpen] = useState(false)
  const [selected, setSelected] = useState<Payment | null>(null)
  const [proofFile, setProofFile] = useState<File | null>(null)

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['landlord-commission-payments'],
    queryFn: paymentApi.getMyPayments,
    select: (items) => items.filter((item) => item.paymentType === 'COMMISSION' || item.type === 'COMMISSION'),
  })

  const { mutate: openPayment, isPending: qrLoading } = useMutation({
    mutationFn: (paymentCode: string) => paymentApi.getPaymentByCode(paymentCode),
    onSuccess: (payment) => {
      setSelected(payment)
      setQrUrl(payment.qrUrl || payment.qrDataUrl || '')
      setQrOpen(true)
    },
  })

  const { mutate: submitProof, isPending: proofLoading } = useMutation({
    mutationFn: async () => {
      if (!selected || !proofFile) throw new Error('Thiếu chứng từ')
      const proofImageUrl = await fileToDataUrl(proofFile)
      return paymentApi.submitProof(selected.paymentCode, proofImageUrl)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['landlord-commission-payments'] })
      toast.success('Đã gửi minh chứng thanh toán hoa hồng!')
      setProofOpen(false)
      setProofFile(null)
    },
  })

  return (
    <ManagementLayout role="LANDLORD">
      <div className="p-6 max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-[#292524]">Phí hoa hồng</h1>
          <p className="text-sm text-[#78716C] mt-1">Các khoản hoa hồng cần thanh toán cho nền tảng</p>
        </div>

        {isLoading ? (
          <TableSkeleton rows={4} cols={6} />
        ) : payments.length === 0 ? (
          <EmptyState title="Chưa có khoản phí nào" />
        ) : (
          <div className="rounded-[22px] border border-[#E8DED1] bg-white/95 shadow-[0_18px_48px_-28px_rgb(91_70_54/0.34)] overflow-hidden backdrop-blur-sm">
            <Table>
              <TableHead><tr><Th>Mã</Th><Th>Số tiền</Th><Th>Kỳ</Th><Th>Hạn thanh toán</Th><Th>Trạng thái</Th><Th>Thao tác</Th></tr></TableHead>
              <TableBody>
                {payments.map((payment) => (
                  <Tr key={payment.id}>
                    <Td className="font-mono text-xs">{payment.paymentCode || `#${payment.id}`}</Td>
                    <Td className="font-semibold text-[#C96A3D]">{formatCurrency(payment.amount)}</Td>
                    <Td>{payment.billingMonth && payment.billingYear ? `${String(payment.billingMonth).padStart(2, '0')}/${payment.billingYear}` : (payment.description || '—')}</Td>
                    <Td>{payment.dueDate ? formatDate(payment.dueDate) : '—'}</Td>
                    <Td><Badge variant={getStatusBadgeVariant(payment.status)} size="sm">{getStatusLabel(payment.status)}</Badge></Td>
                    <Td>
                      <div className="flex gap-2">
                        {payment.paymentCode && payment.status !== 'PAID' && (
                          <Button size="sm" variant="outline" leftIcon={<QrCode size={14} />} onClick={() => openPayment(payment.paymentCode)} loading={qrLoading}>
                            Mở QR
                          </Button>
                        )}
                        {payment.status !== 'PAID' && (
                          <Button size="sm" variant="ghost" leftIcon={<Upload size={14} />} onClick={() => { setSelected(payment); setProofOpen(true) }}>
                            Gửi chứng từ
                          </Button>
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

      <Modal open={qrOpen} onClose={() => setQrOpen(false)} title="QR thanh toán hoa hồng" footer={<Button onClick={() => setQrOpen(false)}>Đóng</Button>}>
        {qrUrl && (
          <div className="flex flex-col items-center gap-3">
            <img src={qrUrl} alt="QR" className="w-52 h-52 rounded-[12px] border border-[#E7E5E4]" />
            <p className="text-sm text-[#78716C] text-center">Quét mã này để thanh toán hoa hồng cho nền tảng.</p>
          </div>
        )}
      </Modal>

      <Modal
        open={proofOpen}
        onClose={() => { setProofOpen(false); setProofFile(null) }}
        title="Gửi minh chứng thanh toán hoa hồng"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setProofOpen(false); setProofFile(null) }}>Hủy</Button>
            <Button onClick={() => submitProof()} loading={proofLoading} disabled={!proofFile}>Gửi</Button>
          </>
        }
      >
        <div className="space-y-3">
          <p className="text-sm text-[#78716C]">Tải lên ảnh biên lai hoặc ảnh chụp màn hình giao dịch.</p>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProofFile(e.target.files?.[0] || null)}
            className="w-full text-sm text-[#57534E] file:mr-3 file:py-1.5 file:px-3 file:rounded-[8px] file:border-0 file:bg-[#F3E7D3] file:text-[#5B4636] file:text-xs file:font-medium hover:file:bg-[#E8D5BC] cursor-pointer"
          />
        </div>
      </Modal>
    </ManagementLayout>
  )
}
