import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { FileText } from 'lucide-react'
import ManagementLayout from '@/components/layout/ManagementLayout'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import Button from '@/components/ui/Button'
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table'
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton'
import ContractDetailModal from '@/components/ContractDetailModal'
import { contractApi } from '@/api/contractApi'
import { formatDate } from '@/lib/utils'
import type { RentalContract } from '@/types'
import toast from 'react-hot-toast'

export default function AdminContractsPage() {
  const [selected, setSelected] = useState<RentalContract | null>(null)
  const [detailLoading, setDetailLoading] = useState(false)

  const { data: contracts = [], isLoading } = useQuery({
    queryKey: ['admin-contracts'],
    queryFn: contractApi.getAdminContracts,
  })

  const openDetail = async (contractId: number) => {
    setDetailLoading(true)
    setSelected({} as RentalContract)
    try {
      const data = await contractApi.getAdminContractById(contractId)
      setSelected(data)
    } catch {
      toast.error('Không thể tải chi tiết hợp đồng.')
      setSelected(null)
    } finally {
      setDetailLoading(false)
    }
  }

  return (
    <ManagementLayout role="ADMIN">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-[#292524]">Quản lý hợp đồng</h1>
          <p className="text-sm text-[#78716C] mt-1">Theo dõi toàn bộ hợp đồng trong hệ thống. Bạn có thể xem bản lưu và kiểm tra hồ sơ hai bên.</p>
        </div>

        {isLoading ? <TableSkeleton rows={6} cols={8} /> : contracts.length === 0 ? (
          <EmptyState title="Hệ thống chưa có hợp đồng nào" icon={<FileText size={28} />} />
        ) : (
          <div className="rounded-[22px] border border-[#E8DED1] bg-white/95 shadow-[0_18px_48px_-28px_rgb(91_70_54/0.34)] overflow-hidden backdrop-blur-sm">
            <Table>
              <TableHead>
                <tr>
                  <Th>STT</Th>
                  <Th>Mã hợp đồng</Th>
                  <Th>Chủ trọ</Th>
                  <Th>Người thuê</Th>
                  <Th>Phòng</Th>
                  <Th>Thời hạn</Th>
                  <Th>Trạng thái</Th>
                  <Th>Thao tác</Th>
                </tr>
              </TableHead>
              <TableBody>
                {contracts.map((c, idx) => (
                  <Tr key={c.id}>
                    <Td className="text-[#A8A29E] text-sm">{idx + 1}</Td>
                    <Td className="font-mono text-sm text-[#5F5146]">{c.contractCode || `#${c.id}`}</Td>
                    <Td>
                      <p className="font-medium text-[#2C241D]">{c.landlordName || '—'}</p>
                      {(c.landlordPhone || c.landlordEmail) && (
                        <p className="text-xs text-[#9A8775] mt-0.5">{c.landlordPhone || c.landlordEmail}</p>
                      )}
                    </Td>
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
                    <Td className="whitespace-nowrap text-[#5F5146] text-sm">
                      {formatDate(c.startDate)} – {formatDate(c.endDate)}
                    </Td>
                    <Td>
                      <Badge variant={getStatusBadgeVariant(c.status)} size="sm">{getStatusLabel(c.status)}</Badge>
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
        onClose={() => setSelected(null)}
        contract={selected}
        loading={detailLoading}
        title="Bản lưu hợp đồng của admin"
      />
    </ManagementLayout>
  )
}
