import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { UserX, UserCheck, Search } from 'lucide-react'
import ManagementLayout from '@/components/layout/ManagementLayout'
import Button from '@/components/ui/Button'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { ConfirmDialog } from '@/components/ui/Modal'
import { Table, TableHead, TableBody, Th, Td, Tr } from '@/components/ui/Table'
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton'
import Tabs from '@/components/ui/Tabs'
import { adminApi } from '@/api/adminApi'
import { formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { User } from '@/types'

export default function AdminUsersPage() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [target, setTarget] = useState<{ user: User; action: 'activate' | 'deactivate' } | null>(null)

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['admin-users'],
    queryFn: adminApi.getUsers,
  })

  const { mutate: setStatus, isPending } = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => adminApi.setUserStatus(id, active),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-users'] }); toast.success('Cập nhật thành công!'); setTarget(null) },
  })

  const normalizedSearch = search.trim().toLowerCase()
  const filtered = users.filter((u) => {
    const matchesRole = roleFilter === 'ALL' || (u.roleCode || '').toUpperCase() === roleFilter
    if (!matchesRole) return false

    if (!normalizedSearch) return true

    return [u.email, u.fullName, u.phone]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(normalizedSearch))
  })

  const tabs = ['ALL', 'USER', 'LANDLORD', 'ADMIN'].map((r) => ({
    key: r,
    label: r === 'ALL' ? 'Tất cả' : r,
    count: r === 'ALL' ? users.length : users.filter((u) => (u.roleCode || '').toUpperCase() === r).length,
  }))

  return (
    <ManagementLayout role="ADMIN">
      <div className="p-6 max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-[#292524]">Quản lý người dùng</h1>
          <p className="text-sm text-[#78716C] mt-1">Quản lý tất cả tài khoản trong hệ thống</p>
        </div>

        <Tabs tabs={tabs} activeTab={roleFilter} onChange={setRoleFilter} className="mb-5" />

        {/* Search */}
        <div className="flex items-center gap-2 bg-white border border-[#D6D3D1] rounded-[10px] px-3 h-10 w-full max-w-sm mb-5">
          <Search size={16} className="text-[#A8A29E]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Tìm kiếm người dùng..."
            className="flex-1 text-sm outline-none text-[#292524] placeholder:text-[#A8A29E] bg-transparent" />
        </div>

        {isLoading ? (
          <TableSkeleton rows={6} cols={6} />
        ) : filtered.length === 0 ? (
          <EmptyState title="Không tìm thấy người dùng" />
        ) : (
          <div className="rounded-[22px] border border-[#E8DED1] bg-white/95 shadow-[0_18px_48px_-28px_rgb(91_70_54/0.34)] overflow-hidden backdrop-blur-sm">
            <Table>
              <TableHead><tr><Th>Người dùng</Th><Th>Email</Th><Th>Vai trò</Th><Th>Ngày đăng ký</Th><Th>Trạng thái</Th><Th>Thao tác</Th></tr></TableHead>
              <TableBody>
                {filtered.map((u) => (
                  <Tr key={u.id}>
                    <Td>
                      <div className="flex items-center gap-2.5">
                        <Avatar src={u.avatarUrl} name={u.fullName || u.email} size="sm" />
                        <span className="text-sm font-medium text-[#292524]">{u.fullName || '(chưa đặt tên)'}</span>
                      </div>
                    </Td>
                    <Td className="text-[#57534E]">{u.email}</Td>
                    <Td><Badge variant="default" size="sm">{u.roleName || u.roleCode}</Badge></Td>
                    <Td>{formatDate(u.createdAt)}</Td>
                    <Td>
                      <Badge variant={u.isActive ? 'success' : 'danger'} size="sm">
                        {u.isActive ? 'Hoạt động' : 'Bị khóa'}
                      </Badge>
                    </Td>
                    <Td>
                      {u.isActive ? (
                        <Button size="sm" variant="danger" leftIcon={<UserX size={14} />} onClick={() => setTarget({ user: u, action: 'deactivate' })}>Khóa</Button>
                      ) : (
                        <Button size="sm" variant="outline" leftIcon={<UserCheck size={14} />} onClick={() => setTarget({ user: u, action: 'activate' })}>Mở khóa</Button>
                      )}
                    </Td>
                  </Tr>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={!!target}
        onClose={() => setTarget(null)}
        onConfirm={() => target && setStatus({ id: target.user.id, active: target.action === 'activate' })}
        title={target?.action === 'activate' ? 'Mở khóa tài khoản?' : 'Khóa tài khoản?'}
        message={`Bạn muốn ${target?.action === 'activate' ? 'mở khóa' : 'khóa'} tài khoản "${target?.user.email}"?`}
        danger={target?.action === 'deactivate'}
        loading={isPending}
      />
    </ManagementLayout>
  )
}
