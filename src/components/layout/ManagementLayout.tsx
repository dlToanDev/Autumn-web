import ManagementSidebar from './ManagementSidebar'

interface Props {
  role: 'ADMIN' | 'LANDLORD'
  children: React.ReactNode
}

export default function ManagementLayout({ role, children }: Props) {
  return (
    <div className="flex h-screen bg-[#FAF6EF] overflow-hidden">
      <ManagementSidebar role={role} />
      <main className="flex-1 overflow-y-auto">
        <div className="p-6 lg:p-8 max-w-[1400px] mx-auto">{children}</div>
      </main>
    </div>
  )
}
