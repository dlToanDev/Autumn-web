import { ExternalLink } from 'lucide-react'
import Modal from '@/components/ui/Modal'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import type { RentalContract } from '@/types'
import { formatDate, formatDateTime, formatCurrency } from '@/lib/utils'

interface Props {
  open: boolean
  onClose: () => void
  contract: RentalContract | null
  loading?: boolean
  title?: string
  actionArea?: React.ReactNode
}

function SignatureCard({ label, fileUrl }: { label: string; fileUrl?: string | null }) {
  const isPdf = String(fileUrl ?? '').toLowerCase().startsWith('data:application/pdf')
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-[#E8DED1] bg-[#FAF7F4] p-4">
      <span className="text-xs font-medium text-[#78716C]">{label}</span>
      {fileUrl ? (
        isPdf ? (
          <a href={fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-[#C96A3D] font-medium hover:underline">
            <ExternalLink size={13} /> Mở file PDF
          </a>
        ) : (
          <img src={fileUrl} alt={label} className="max-h-48 w-full rounded-lg object-contain border border-[#E8DED1]" />
        )
      ) : (
        <span className="text-sm text-[#A8A29E] italic">Chưa có file đã ký.</span>
      )}
    </div>
  )
}

export default function ContractDetailModal({ open, onClose, contract, loading = false, title = 'Chi tiết hợp đồng', actionArea }: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="xl">
      {loading || !contract ? (
        <div className="py-12 text-center text-[#78716C]">Đang tải hợp đồng...</div>
      ) : (
        <div className="flex flex-col gap-5 pb-2">
          {/* Code & status */}
          <div className="flex flex-wrap items-center gap-3">
            {contract.contractCode && (
              <span className="rounded-lg bg-[#F5F0EC] px-3 py-1 text-sm font-mono font-semibold text-[#5F5146]">
                {contract.contractCode}
              </span>
            )}
            <Badge variant={getStatusBadgeVariant(contract.status)}>{getStatusLabel(contract.status)}</Badge>
          </div>

          {/* Key info grid */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <InfoCard label="Thời hạn" value={`${formatDate(contract.startDate)} – ${formatDate(contract.endDate)}`} />
            <InfoCard label="Giá thuê" value={formatCurrency(contract.monthlyRent)} highlight />
            <InfoCard label="Tiền cọc" value={contract.depositAmount ? formatCurrency(contract.depositAmount) : '—'} />
            <InfoCard label="Tạo lúc" value={contract.createdAt ? formatDateTime(contract.createdAt) : '—'} />
          </div>

          {/* People & room */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <PersonCard label="Bên thuê" name={contract.tenantName} contact={contract.tenantPhone || contract.tenantEmail} />
            <PersonCard label="Bên cho thuê" name={contract.landlordName} contact={contract.landlordPhone || contract.landlordEmail} />
            <div className="flex flex-col gap-1 rounded-xl border border-[#E8DED1] bg-[#FAF7F4] p-4">
              <span className="text-xs font-medium text-[#78716C]">Phòng</span>
              <span className="font-semibold text-[#2C241D]">{contract.roomTitle || `#${contract.roomId}`}</span>
              {contract.propertyName && <span className="text-xs text-[#9A8775]">{contract.propertyName}</span>}
            </div>
            <div className="flex flex-col gap-1 rounded-xl border border-[#E8DED1] bg-[#FAF7F4] p-4">
              <span className="text-xs font-medium text-[#78716C]">Địa chỉ</span>
              <span className="text-sm text-[#2C241D]">{contract.fullAddress || '—'}</span>
            </div>
          </div>

          {/* Terms */}
          {contract.terms && (
            <div className="rounded-xl border border-[#E8DED1] bg-[#FAF7F4] p-4">
              <span className="text-xs font-medium text-[#78716C]">Điều khoản bổ sung</span>
              <p className="mt-1 text-sm text-[#2C241D] whitespace-pre-wrap">{contract.terms}</p>
            </div>
          )}

          {/* Termination info */}
          {contract.status === 'terminated' && contract.terminatedAt && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4">
              <span className="text-xs font-medium text-red-700 uppercase tracking-wide">Thông tin chấm dứt</span>
              <div className="mt-2 space-y-1 text-sm text-red-800">
                <p><strong>Thời gian:</strong> {formatDateTime(contract.terminatedAt)}</p>
                <p><strong>Người chấm dứt:</strong> {contract.terminatedBy === 'landlord' ? 'Chủ trọ' : contract.terminatedBy === 'tenant' ? 'Người thuê' : contract.terminatedBy}</p>
                {contract.terminationReason && (
                  <p><strong>Lý do:</strong> {contract.terminationReason}</p>
                )}
              </div>
            </div>
          )}

          {/* Online contract content */}
          {contract.onlineContractContent && (
            <div className="rounded-xl border border-[#E8DED1] bg-[#FAF7F4] p-4">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[#78716C]">Bản hợp đồng online</p>
              <pre className="max-h-56 overflow-y-auto whitespace-pre-wrap break-words text-sm text-[#2C241D] font-sans leading-relaxed">
                {contract.onlineContractContent}
              </pre>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <SignatureCard label="Bản chủ trọ tải lên" fileUrl={contract.landlordSignedFileUrl || contract.landlordFileUrl} />
            <SignatureCard label="Bản người thuê tải lên" fileUrl={contract.tenantSignedFileUrl || contract.tenantFileUrl} />
          </div>

          {/* Slot for upload action or other controls */}
          {actionArea}
        </div>
      )}
    </Modal>
  )
}

function InfoCard({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[#E8DED1] bg-[#FAF7F4] p-3">
      <span className="text-xs font-medium text-[#78716C]">{label}</span>
              <span className={`text-sm font-semibold break-words ${highlight ? 'text-[#C96A3D]' : 'text-[#2C241D]'}`}>{value}</span>
    </div>
  )
}

function PersonCard({ label, name, contact }: { label: string; name?: string; contact?: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-xl border border-[#E8DED1] bg-[#FAF7F4] p-4">
      <span className="text-xs font-medium text-[#78716C]">{label}</span>
      <span className="font-semibold text-[#2C241D] break-words">{name || '—'}</span>
      {contact && <span className="text-xs text-[#9A8775] break-words">{contact}</span>}
    </div>
  )
}
