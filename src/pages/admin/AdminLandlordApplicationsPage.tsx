import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, ExternalLink, ReceiptText, XCircle, Eye } from 'lucide-react'
import ManagementLayout from '@/components/layout/ManagementLayout'
import Button from '@/components/ui/Button'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Tabs from '@/components/ui/Tabs'
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table'
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton'
import { landlordApplicationApi } from '@/api/landlordApplicationApi'
import { paymentApi } from '@/api/paymentApi'
import { formatCurrency, formatDate, formatDateTime } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { LandlordApplication } from '@/types'

type AdminLandlordApplication = LandlordApplication & {
  applicantName?: string
  applicantEmail?: string
  applicantPhone?: string
  identityNumber?: string
  businessAddress?: string
  reviewedByName?: string
  rejectReason?: string
  documents?: Array<{ filePath: string; fileName: string }>
}

export default function AdminLandlordApplicationsPage() {
  const qc = useQueryClient()
  const [tab, setTab] = useState('ALL')
  const [detail, setDetail] = useState<AdminLandlordApplication | null>(null)
  const [action, setAction] = useState<{ app: AdminLandlordApplication; status: 'APPROVED' | 'REJECTED' } | null>(null)
  const [note, setNote] = useState('')

  const { data: apps = [], isLoading } = useQuery({
    queryKey: ['admin-applications', tab],
    queryFn: () => landlordApplicationApi.getAdminApplications({ status: tab === 'ALL' ? undefined : tab }),
  })

  const { mutate: review, isPending } = useMutation({
    mutationFn: () => landlordApplicationApi.reviewApplication(action!.app.id, { status: action!.status, note }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-applications'] }); toast.success('Đã cập nhật!'); setAction(null); setNote('') },
    onError: (error: Error) => toast.error(error.message || 'Không thể cập nhật hồ sơ.'),
  })

  const { mutate: markFeePaid, isPending: markingFee } = useMutation({
    mutationFn: (paymentCode: string) => paymentApi.adminMarkPaid(paymentCode),
    onSuccess: (payment) => {
      qc.invalidateQueries({ queryKey: ['admin-applications'] })
      setDetail((prev) => {
        if (!prev || (prev.registrationFeePaymentCode || prev.feePaymentCode) !== payment.paymentCode) return prev
        return {
          ...prev,
          isPaid: true,
          feePaymentStatus: 'SUCCESS',
          registrationFeePaymentStatus: 'SUCCESS',
          registrationFeePaidAt: payment.paidAt,
        }
      })
      toast.success('Đã xác nhận phí đăng ký.')
    },
    onError: (error: Error) => toast.error(error.message || 'Không thể xác nhận phí đăng ký.'),
  })

  const tabs = ['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((t) => ({
    key: t,
    label: { ALL: 'Tất cả', PENDING: 'Chờ duyệt', APPROVED: 'Đã duyệt', REJECTED: 'Từ chối' }[t]!,
  }))

  return (
    <ManagementLayout role="ADMIN">
      <div className="p-6 max-w-6xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-[#292524]">Đơn đăng ký chủ trọ</h1>
          <p className="text-sm text-[#78716C] mt-1">Xét duyệt các đơn xin trở thành chủ trọ</p>
        </div>

        <Tabs tabs={tabs} activeTab={tab} onChange={setTab} className="mb-5" />

        {isLoading ? <TableSkeleton rows={5} cols={6} /> : apps.length === 0 ? (
          <EmptyState title="Không có đơn nào" />
        ) : (
          <div className="rounded-[22px] border border-[#E8DED1] bg-white/95 shadow-[0_18px_48px_-28px_rgb(91_70_54/0.34)] overflow-hidden backdrop-blur-sm">
            <Table>
              <TableHead><tr><Th>Người nộp</Th><Th>CCCD/CMND</Th><Th>Ngày nộp</Th><Th>Phí đăng ký</Th><Th>Trạng thái</Th><Th>Thao tác</Th></tr></TableHead>
              <TableBody>
                {(apps as AdminLandlordApplication[]).map((a) => (
                  <Tr key={a.id}>
                    <Td>
                      <div>
                        <p className="text-sm font-medium text-[#292524]">{a.applicantName || '—'}</p>
                        <p className="text-xs text-[#A8A29E]">{a.applicantEmail}</p>
                      </div>
                    </Td>
                    <Td className="font-medium">{a.identityNumber || '—'}</Td>
                    <Td>{formatDate(a.createdAt)}</Td>
                    <Td>
                      <div className="flex flex-col gap-1">
                        <Badge variant={getStatusBadgeVariant(a.registrationFeePaymentStatus || a.feePaymentStatus || 'PENDING')} size="sm">
                          {getStatusLabel(a.registrationFeePaymentStatus || a.feePaymentStatus || 'PENDING')}
                        </Badge>
                        {a.registrationFeeProofSubmittedAt && <span className="text-xs text-[#7C6757]">Đã gửi minh chứng</span>}
                      </div>
                    </Td>
                    <Td><Badge variant={getStatusBadgeVariant(a.status)} size="sm">{getStatusLabel(a.status)}</Badge></Td>
                    <Td>
                      <div className="flex gap-2">
                        <Button size="sm" variant="ghost" leftIcon={<Eye size={14} />} onClick={() => setDetail(a)}>Chi tiết</Button>
                        {a.status === 'PENDING' && (
                          <>
                            <Button
                              size="sm"
                              leftIcon={<CheckCircle size={14} />}
                              onClick={() => setAction({ app: a, status: 'APPROVED' })}
                              disabled={!isFeePaid(a)}
                              title={isFeePaid(a) ? 'Duyệt hồ sơ' : 'Cần xác nhận phí đăng ký trước'}
                            >
                              Duyệt
                            </Button>
                            <Button size="sm" variant="danger" leftIcon={<XCircle size={14} />} onClick={() => setAction({ app: a, status: 'REJECTED' })}>Từ chối</Button>
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

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Chi tiết đơn đăng ký" footer={<Button onClick={() => setDetail(null)}>Đóng</Button>}>
        {detail && (
          <div className="space-y-3 text-sm">
            <Row label="Họ và tên" value={detail.applicantName} />
            <Row label="Email" value={detail.applicantEmail} />
            <Row label="Số điện thoại" value={detail.applicantPhone} />
            <Row label="Địa chỉ" value={detail.businessAddress} />
            <Row label="Số CCCD/CMND" value={detail.identityNumber} />
            {detail.note && <Row label="Ghi chú hồ sơ" value={detail.note} />}
            {detail.rejectReason && <Row label="Lý do từ chối" value={detail.rejectReason} />}
            {detail.reviewedByName && <Row label="Người duyệt" value={detail.reviewedByName} />}
            {detail.documents && detail.documents.length > 0 && (
              <div>
                <p className="text-xs font-medium text-[#78716C] mb-1">Giấy tờ đính kèm</p>
                {detail.documents.map((d, i) => (
                  <a key={i} href={d.filePath} target="_blank" rel="noopener noreferrer" className="text-[#C96A3D] hover:underline block text-xs">{d.fileName || `File ${i + 1}`}</a>
                ))}
              </div>
            )}

            <div className="rounded-[18px] border border-[#E8DED1] bg-[#FFFCF8] p-4">
              <div className="mb-3 flex items-start justify-between gap-3">
                <div>
                  <p className="font-semibold text-[#292524]">Phí đăng ký chủ trọ</p>
                  <p className="mt-1 text-xs text-[#78716C]">Admin xác nhận khoản này trước khi duyệt hồ sơ.</p>
                </div>
                <ReceiptText size={18} className="text-[#C96A3D]" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <Row label="Số tiền" value={formatCurrency(detail.registrationFeeAmount || 0)} />
                <Row label="Mã payment" value={detail.registrationFeePaymentCode || detail.feePaymentCode} />
                <Row label="Trạng thái phí" value={getStatusLabel(detail.registrationFeePaymentStatus || detail.feePaymentStatus || 'PENDING')} />
                <Row label="Gửi minh chứng lúc" value={formatDateTime(detail.registrationFeeProofSubmittedAt)} />
                <Row label="Đã xác nhận lúc" value={formatDateTime(detail.registrationFeePaidAt)} />
                <Row label="Hết hạn QR" value={formatDateTime(detail.registrationFeeExpiredAt)} />
              </div>

              {detail.registrationFeeProofImageUrl && (
                <div className="mt-4">
                  <p className="mb-2 text-xs font-medium text-[#78716C]">Ảnh minh chứng</p>
                  <a href={detail.registrationFeeProofImageUrl} target="_blank" rel="noopener noreferrer" className="group block">
                    <img
                      src={detail.registrationFeeProofImageUrl}
                      alt="Minh chứng phí đăng ký chủ trọ"
                      className="max-h-[260px] w-full rounded-[14px] border border-[#E8DED1] object-contain transition-opacity group-hover:opacity-90"
                    />
                  </a>
                </div>
              )}

              <div className="mt-4 flex flex-wrap items-center gap-2">
                {detail.registrationFeeProofImageUrl && (
                  <a
                    href={detail.registrationFeeProofImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-9 items-center justify-center gap-2 rounded-[10px] border border-[#E7D8C8] bg-white px-3 text-sm font-medium text-[#5B4636] transition-colors hover:bg-[#FAF6EF] hover:text-[#5B4636]"
                  >
                    <ExternalLink size={14} />
                    Mở ảnh
                  </a>
                )}
                {canConfirmFee(detail) && (
                  <Button
                    size="sm"
                    leftIcon={<CheckCircle size={14} />}
                    loading={markingFee}
                    onClick={() => markFeePaid((detail.registrationFeePaymentCode || detail.feePaymentCode)!)}
                  >
                    Xác nhận phí
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Review modal */}
      <Modal
        open={!!action}
        onClose={() => { setAction(null); setNote('') }}
        title={action?.status === 'APPROVED' ? 'Duyệt đơn' : 'Từ chối đơn'}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setAction(null); setNote('') }}>Hủy</Button>
            <Button variant={action?.status === 'APPROVED' ? 'primary' : 'danger'} onClick={() => review()} loading={isPending}>
              {action?.status === 'APPROVED' ? 'Xác nhận' : 'Từ chối'}
            </Button>
          </>
        }
      >
        <div>
          <label className="text-sm font-medium text-[#44403C] block mb-1.5">
            {action?.status === 'REJECTED' ? 'Lý do từ chối *' : 'Ghi chú (tùy chọn)'}
          </label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} placeholder={action?.status === 'REJECTED' ? 'Nhập lý do từ chối...' : 'Ghi chú duyệt...'}
            className="w-full rounded-[10px] border border-[#D6D3D1] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30 focus:border-[#C96A3D] resize-none" />
        </div>
      </Modal>
    </ManagementLayout>
  )
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs text-[#78716C] font-medium">{label}</p>
      <p className="text-[#292524]">{value || '—'}</p>
    </div>
  )
}

function isFeePaid(app: AdminLandlordApplication) {
  const status = String(app.registrationFeePaymentStatus || app.feePaymentStatus || '').toUpperCase()
  return !!app.isPaid || status === 'SUCCESS' || status === 'PAID'
}

function canConfirmFee(app: AdminLandlordApplication) {
  const status = String(app.registrationFeePaymentStatus || app.feePaymentStatus || '').toUpperCase()
  return !!(app.registrationFeePaymentCode || app.feePaymentCode) &&
    !!app.registrationFeeProofImageUrl &&
    !isFeePaid(app) &&
    (status === 'WAITING_CONFIRM' || status === 'PROOF_SUBMITTED')
}
