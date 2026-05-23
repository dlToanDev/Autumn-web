import { useRef, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { FileText, Upload, UserX } from 'lucide-react'
import PublicLayout from '@/components/layout/PublicLayout'
import Button from '@/components/ui/Button'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import Modal from '@/components/ui/Modal'
import Textarea from '@/components/ui/Textarea'
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table'
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton'
import ContractDetailModal from '@/components/ContractDetailModal'
import { contractApi } from '@/api/contractApi'
import { fileToDataUrl } from '@/utils/file'
import { formatDate, formatCurrency } from '@/lib/utils'
import type { RentalContract } from '@/types'
import toast from 'react-hot-toast'

export default function UserContractsPage() {
  const qc = useQueryClient()
  const [selected, setSelected] = useState<RentalContract | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [terminateContract, setTerminateContract] = useState<RentalContract | null>(null)
  const [terminateReason, setTerminateReason] = useState('')
  const [terminating, setTerminating] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['my-contracts'],
    queryFn: contractApi.getMyContracts,
  })

  const { mutate: upload, isPending: uploading } = useMutation({
    mutationFn: async () => {
      if (!file || !selected?.id) throw new Error('Thiếu file')
      const fileUrl = await fileToDataUrl(file)
      return contractApi.uploadTenantFile(selected.id, fileUrl)
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['my-contracts'] })
      setSelected(updated)
      setFile(null)
      toast.success('Đã tải bản hợp đồng bạn ký lên hệ thống.')
    },
    onError: (err: unknown) => {
      toast.error((err as Error)?.message || 'Không thể tải file hợp đồng.')
    },
  })

  const openDetail = async (contractId: number) => {
    setDetailLoading(true)
    setSelected({} as RentalContract)
    try {
      const data = await contractApi.getMyContractById(contractId)
      setSelected(data)
    } catch {
      toast.error('Không thể tải chi tiết hợp đồng.')
      setSelected(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const openTerminateModal = (contract: RentalContract) => {
    setTerminateContract(contract)
    setTerminateReason('')
  }

  const handleTerminateContract = async () => {
    if (!terminateContract?.id || !terminateReason.trim()) return

    setTerminating(true)
    try {
      await contractApi.terminateMyContract(terminateContract.id, terminateReason)
      qc.invalidateQueries({ queryKey: ['my-contracts'] })
      toast.success('Đã gửi yêu cầu trả trọ. Vui lòng chờ chủ trọ xác nhận.')
      setTerminateContract(null)
      setTerminateReason('')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || 'Không thể gửi yêu cầu trả trọ.')
    } finally {
      setTerminating(false)
    }
  }

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-[#292524]">Hợp đồng của tôi</h1>
          <p className="text-sm text-[#78716C] mt-1">Bạn có thể xem lại toàn bộ hợp đồng thuê phòng và tải file đã ký tại đây.</p>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} cols={6} />
        ) : contracts.length === 0 ? (
          <EmptyState title="Chưa có hợp đồng" description="Bạn chưa có hợp đồng thuê phòng nào" icon={<FileText size={28} />} />
        ) : (
          <div className="rounded-[22px] border border-[#E8DED1] bg-white/95 shadow-[0_18px_48px_-28px_rgb(91_70_54/0.34)] overflow-hidden backdrop-blur-sm">
            <Table>
              <TableHead>
                <tr>
                  <Th>STT</Th>
                  <Th>Mã hợp đồng</Th>
                  <Th>Phòng</Th>
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
                    <Td>
                      <p className="font-semibold text-[#2C241D]">{c.contractCode || `HĐ #${c.id}`}</p>
                      {c.propertyName && <p className="text-xs text-[#9A8775] mt-0.5">{c.propertyName}</p>}
                    </Td>
                    <Td>
                      <p className="font-medium text-[#2C241D]">{c.roomTitle || `Phòng #${c.roomId}`}</p>
                      {c.fullAddress && <p className="text-xs text-[#9A8775] mt-0.5">{c.fullAddress}</p>}
                    </Td>
                    <Td className="whitespace-nowrap text-[#5F5146] text-sm">
                      {formatDate(c.startDate)} – {formatDate(c.endDate)}
                    </Td>
                    <Td className="whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(c.status)} size="sm">{getStatusLabel(c.status)}</Badge>
                    </Td>
                    <Td className="text-sm">
                      {c.hasTenantSignedFile
                        ? <span className="text-emerald-600 font-medium">Đã tải lên</span>
                        : <span className="text-[#A8A29E]">Chưa tải</span>}
                    </Td>
                    <Td className="w-[1%] whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" leftIcon={<FileText size={14} />} onClick={() => openDetail(c.id)}>
                          Xem hợp đồng
                        </Button>
                        {c.status !== 'terminated' && !c.terminatedAt && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                            leftIcon={<UserX size={14} />}
                            onClick={() => openTerminateModal(c)}
                          >
                            Trả trọ
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

      <ContractDetailModal
        open={!!selected}
        onClose={() => { setSelected(null); setFile(null) }}
        contract={selected}
        loading={detailLoading}
        title="Bản hợp đồng của bạn"
        actionArea={
          selected?.id && !detailLoading ? (
            <div className="rounded-xl border border-[#E8DED1] bg-[#FAF7F4] p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">Tải bản người thuê đã ký</p>
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

      {/* Terminate contract modal */}
      <Modal
        open={!!terminateContract}
        onClose={() => {
          setTerminateContract(null)
          setTerminateReason('')
        }}
        title="Yêu cầu trả trọ"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Bạn có chắc chắn muốn gửi yêu cầu trả trọ cho hợp đồng <strong>{terminateContract?.contractCode || `HĐ #${terminateContract?.id}`}</strong> không?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Yêu cầu này sẽ được gửi đến chủ trọ để xem xét. Bạn sẽ không thể hủy yêu cầu sau khi gửi.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do trả trọ <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Nhập lý do bạn muốn trả trọ..."
              value={terminateReason}
              onChange={(e) => setTerminateReason(e.target.value)}
              rows={3}
              required
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button
            variant="ghost"
            onClick={() => {
              setTerminateContract(null)
              setTerminateReason('')
            }}
          >
            Hủy
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            loading={terminating}
            disabled={!terminateReason.trim()}
            onClick={handleTerminateContract}
          >
            Gửi yêu cầu
          </Button>
        </div>
      </Modal>
    </PublicLayout>
  )
}
