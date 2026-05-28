import ManagementSidebar from './ManagementSidebar'
import FloatingMessageButton from './FloatingMessageButton'

interface Props {
  role: 'ADMIN' | 'LANDLORD'
  children: React.ReactNode
}

export default function ManagementLayout({ role, children }: Props) {
  return (
    <div className="flex min-h-screen flex-col overflow-x-hidden bg-[#FAF6EF] md:h-screen md:flex-row md:overflow-hidden">
      <ManagementSidebar role={role} />
      <main className="min-w-0 flex-1 overflow-y-auto">
        <div className="mx-auto max-w-[1400px] p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
      <FloatingMessageButton />
    </div>
  )
}
