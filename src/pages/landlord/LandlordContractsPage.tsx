import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Upload } from 'lucide-react'
import ManagementLayout from '@/components/layout/ManagementLayout'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table'
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton'
import ContractDetailModal from '@/components/ContractDetailModal'
import { contractApi } from '@/api/contractApi'
import { fileToDataUrl } from '@/utils/file'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { RentalContract } from '@/types'
import toast from 'react-hot-toast'

export default function LandlordContractsPage() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<RentalContract | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['landlord-contracts'],
    queryFn: contractApi.getLandlordContracts,
  })

  const { mutate: upload, isPending: uploading } = useMutation({
    mutationFn: async () => {
      if (!file || !selected?.id) throw new Error('Thiếu file')
      const fileUrl = await fileToDataUrl(file)
      return contractApi.uploadLandlordFile(selected.id, fileUrl)
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['landlord-contracts'] })
      setSelected(updated)
      setFile(null)
      toast.success('Đã tải bản hợp đồng của bạn lên hệ thống.')
    },
    onError: (err: unknown) => {
      toast.error((err as Error)?.message || 'Không thể tải file hợp đồng.')
    },
  })

  const openDetail = async (contractId: number) => {
    setDetailLoading(true)
    setSelected({} as RentalContract)
    try {
      const data = await contractApi.getLandlordContractById(contractId)
      setSelected(data)
    } catch {
      toast.error('Không thể tải chi tiết hợp đồng.')
      setSelected(null)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <ManagementLayout role="LANDLORD">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-[#292524]">Hợp đồng</h1>
          <p className="text-sm text-[#78716C] mt-1">Lưu trữ hợp đồng với người thuê của bạn. Bạn có thể xem chi tiết và tải bản đã ký lên đây.</p>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} cols={7} />
        ) : contracts.length === 0 ? (
          <EmptyState title="Chưa có hợp đồng nào" description="Các hợp đồng với người thuê sẽ xuất hiện ở đây" icon={<FileText size={28} />} />
        ) : (
          <div className="rounded-[22px] border border-[#E8DED1] bg-white/95 shadow-[0_18px_48px_-28px_rgb(91_70_54/0.34)] overflow-hidden backdrop-blur-sm">
            <Table>
              <TableHead>
                <tr>
                  <Th>STT</Th>
                  <Th>Mã hợp đồng</Th>
                  <Th>Người thuê</Th>
                  <Th>Phòng</Th>
                  <Th>Tiền thuê</Th>
                  <Th>Thời hạn</Th>
                  <Th>Trạng thái</Th>
                  <Th>Bản của bạn</Th>
                  <Th>Thao tác</Th>
                </tr>
              </TableHead>
              <TableBody>
                {contracts.map((c, idx) => (
                  <Tr key={c.id}>
                    <Td className="text-[#A8A29E] text-sm">{idx + 1}</Td>
                    <Td className="font-mono text-sm text-[#5F5146]">{c.contractCode || `#${c.id}`}</Td>
                    <Td>
                      <p className="font-medium text-[#2C241D]">{c.tenantName || `#${c.tenantId}`}</p>
                      {(c.tenantPhone || c.tenantEmail) && (
                        <p className="text-xs text-[#9A8775] mt-0.5">{c.tenantPhone || c.tenantEmail}</p>
                      )}
                    </Td>
                    <Td>
                      <p className="font-medium text-[#2C241D]">{c.roomTitle || `#${c.roomId}`}</p>
                      {c.propertyName && <p className="text-xs text-[#9A8775] mt-0.5">{c.propertyName}</p>}
                    </Td>
                    <Td className="whitespace-nowrap font-semibold text-[#C96A3D] text-sm">
                      {formatCurrency(c.monthlyRent)}
                    </Td>
                    <Td className="whitespace-nowrap text-[#5F5146] text-sm">
                      {formatDate(c.startDate)} – {formatDate(c.endDate)}
                    </Td>
                    <Td>
                      <Badge variant={getStatusBadgeVariant(c.status)} size="sm">{getStatusLabel(c.status)}</Badge>
                    </Td>
                    <Td className="text-sm">
                      {c.hasLandlordSignedFile
                        ? <span className="text-emerald-600 font-medium">Đã tải lên</span>
                        : <span className="text-[#A8A29E]">Chưa tải</span>}
                    </Td>
                    <Td className="w-[1%] whitespace-nowrap">
                      <Button variant="ghost" size="sm" leftIcon={<FileText size={14} />} onClick={() => openDetail(c.id)}>
                        Xem hợp đồng
                      </Button>
                    </Td>
                  </Tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ContractDetailModal
        open={!!selected}
        onClose={() => { setSelected(null); setFile(null) }}
        contract={selected}
        loading={detailLoading}
        title="Hợp đồng của bạn"
        actionArea={
          selected?.id && !detailLoading ? (
            <div className="rounded-xl border border-[#E8DED1] bg-[#FAF7F4] p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">Tải bản chủ trọ đã ký</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-[#57534E] file:mr-3 file:py-1.5 file:px-3 file:rounded-[8px] file:border-0 file:bg-[#F3E7D3] file:text-[#5B4636] file:text-xs file:font-medium hover:file:bg-[#E8D5BC] cursor-pointer"
              />
              <Button
                size="sm"
                leftIcon={<Upload size={14} />}
                onClick={() => upload()}
                loading={uploading}
                disabled={!file}
                className="self-start"
              >
                Tải lên
              </Button>
            </div>
          ) : null
        }
      />
    </ManagementLayout>
  )
}
