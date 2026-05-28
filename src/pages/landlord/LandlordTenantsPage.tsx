import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertTriangle,
  Bolt,
  CalendarClock,
  CheckCircle2,
  CreditCard,
  Droplets,
  FileText,
  Home,
  Plus,
  QrCode,
  ReceiptText,
  Search,
  Users,
  UserX,
} from 'lucide-react'
import ManagementLayout from '@/components/layout/ManagementLayout'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import Button from '@/components/ui/Button'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Input from '@/components/ui/Input'
import Modal from '@/components/ui/Modal'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import StatCard from '@/components/ui/StatCard'
import { TableSkeleton, EmptyState } from '@/components/ui/Skeleton'
import ContractDetailModal from '@/components/ContractDetailModal'
import PaymentQrModal from '@/components/PaymentQrModal'
import { landlordTenantsApi } from '@/api/landlordTenantsApi'
import { contractApi } from '@/api/contractApi'
import { paymentApi } from '@/api/paymentApi'
import { authApi } from '@/api/authApi'
import { useAuthStore } from '@/store/authStore'
import { formatDate, formatCurrency } from '@/lib/utils'
import { isPaidStatus } from '@/utils/paymentPresentation'
import { getCurrentRentBillingPeriod } from '@/utils/rentBilling'
import type { Payment, RentalContract, TenantInfo } from '@/types'
import toast from 'react-hot-toast'

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr)
  d.setMonth(d.getMonth() + months)
  return d.toISOString().slice(0, 10)
}

function getTenantDisplayName(tenant: TenantInfo) {
  return tenant.fullName || tenant.tenantName || (tenant.userId ? `Người thuê #${tenant.userId}` : 'Người thuê')
}

function isActiveTenantContract(tenant: TenantInfo) {
  return Boolean(tenant.hasContract) && String(tenant.contractStatus || '').toLowerCase() !== 'terminated'
}

function getTenantCurrentRentAmount(tenant: TenantInfo) {
  const paymentAmount = Number(tenant.latestRentPaymentAmount || 0)
  if (paymentAmount > 0) return paymentAmount
  return Number(tenant.monthlyRent || 0)
}

type RentBillingForm = {
  baseRent: string
  electricityUsage: string
  electricityRate: string
  waterUsage: string
  waterRate: string
  otherFees: string
  notes: string
}

type RentBillingPayload = {
  baseRent: number
  electricityUsage: number
  electricityRate: number
  electricityAmount: number
  waterUsage: number
  waterRate: number
  waterAmount: number
  otherFees: number
  notes?: string
}

const emptyRentBillingForm: RentBillingForm = {
  baseRent: '',
  electricityUsage: '',
  electricityRate: '',
  waterUsage: '',
  waterRate: '',
  otherFees: '',
  notes: '',
}

function parseNumberField(value: string) {
  const raw = value.trim()
  if (!raw) return null
  const amount = Number(raw)
  return Number.isFinite(amount) ? amount : Number.NaN
}

function buildRentBillingPayload(form: RentBillingForm): { payload?: RentBillingPayload; error?: string } {
  const fields: Array<{ key: keyof Omit<RentBillingForm, 'notes'>; label: string; positive?: boolean }> = [
    { key: 'baseRent', label: 'Tiền phòng', positive: true },
    { key: 'electricityUsage', label: 'Số điện' },
    { key: 'electricityRate', label: 'Đơn giá điện' },
    { key: 'waterUsage', label: 'Số nước' },
    { key: 'waterRate', label: 'Đơn giá nước' },
    { key: 'otherFees', label: 'Phụ phí khác' },
  ]

  const values = {} as Record<keyof Omit<RentBillingForm, 'notes'>, number>
  for (const field of fields) {
    const amount = parseNumberField(form[field.key])
    if (amount === null) {
      return { error: `${field.label} phải được nhập trước khi tạo QR. Nếu không phát sinh, nhập 0.` }
    }
    if (!Number.isFinite(amount)) {
      return { error: `${field.label} không hợp lệ.` }
    }
    if (amount < 0) {
      return { error: `${field.label} không được âm.` }
    }
    if (field.positive && amount <= 0) {
      return { error: `${field.label} phải lớn hơn 0.` }
    }
    values[field.key] = amount
  }

  if (values.electricityUsage > 0 && values.electricityRate <= 0) {
    return { error: 'Phòng chưa cấu hình đơn giá điện. Hãy sửa phòng và nhập giá điện trước khi tạo QR.' }
  }
  if (values.waterUsage > 0 && values.waterRate <= 0) {
    return { error: 'Phòng chưa cấu hình đơn giá nước. Hãy sửa phòng và nhập giá nước trước khi tạo QR.' }
  }

  const electricityAmount = Math.round(values.electricityUsage * values.electricityRate)
  const waterAmount = Math.round(values.waterUsage * values.waterRate)

  return {
    payload: {
      baseRent: Math.round(values.baseRent),
      electricityUsage: values.electricityUsage,
      electricityRate: Math.round(values.electricityRate),
      electricityAmount,
      waterUsage: values.waterUsage,
      waterRate: Math.round(values.waterRate),
      waterAmount,
      otherFees: Math.round(values.otherFees),
      notes: form.notes.trim() || undefined,
    },
  }
}

function calculateRentCharge(usage: string, rate: string) {
  const parsedUsage = parseNumberField(usage)
  const parsedRate = parseNumberField(rate)
  if (!Number.isFinite(parsedUsage) || !Number.isFinite(parsedRate)) return 0
  return Math.max(0, Math.round((parsedUsage || 0) * (parsedRate || 0)))
}

function calculateRentBillingTotal(form: RentBillingForm) {
  const baseRent = parseNumberField(form.baseRent)
  const otherFees = parseNumberField(form.otherFees)
  return Math.max(0, Math.round(baseRent || 0)) +
    calculateRentCharge(form.electricityUsage, form.electricityRate) +
    calculateRentCharge(form.waterUsage, form.waterRate) +
    Math.max(0, Math.round(otherFees || 0))
}

export default function LandlordTenantsPage() {
  const qc = useQueryClient()
  const storeUser = useAuthStore((s) => s.user)
  const [selectedContract, setSelectedContract] = useState<RentalContract | null>(null)
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [paymentError, setPaymentError] = useState('')
  const [paymentRefreshing, setPaymentRefreshing] = useState(false)
  const [creatingQrBookingId, setCreatingQrBookingId] = useState(0)
  const [openingPaymentCode, setOpeningPaymentCode] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [contractFilter, setContractFilter] = useState('all')
  const [rentFilter, setRentFilter] = useState('all')
  const [paymentConfig, setPaymentConfig] = useState({
    bankName: storeUser?.bankName ?? '',
    bankAccountNumber: storeUser?.bankAccountNumber ?? '',
    bankAccountName: storeUser?.bankAccountName ?? '',
    vietQrTemplate: storeUser?.vietQrTemplate ?? 'compact2',
  })
  const [detailLoading, setDetailLoading] = useState(false)
  const [creatingFor, setCreatingFor] = useState<TenantInfo | null>(null)
  const [rentBillingTenant, setRentBillingTenant] = useState<TenantInfo | null>(null)
  const [rentBillingForm, setRentBillingForm] = useState<RentBillingForm>(emptyRentBillingForm)
  const [rentBillingError, setRentBillingError] = useState('')
  const [contractForm, setContractForm] = useState({ startDate: '', endDate: '', terms: '' })
  const [file, setFile] = useState<File | null>(null)
  // Terminate confirm modal
  const [terminateTenant, setTerminateTenant] = useState<TenantInfo | null>(null)
  const [terminateReason, setTerminateReason] = useState('')
  const [terminatingContract, setTerminatingContract] = useState(false)

  const { data: tenants = [], isLoading } = useQuery({
    queryKey: ['landlord-tenants'],
    queryFn: landlordTenantsApi.getTenants,
  })

  const { data: me } = useQuery({
    queryKey: ['auth-me'],
    queryFn: authApi.getMe,
  })

  useEffect(() => {
    if (!me) return
    setPaymentConfig({
      bankName: me.bankName ?? '',
      bankAccountNumber: me.bankAccountNumber ?? '',
      bankAccountName: me.bankAccountName ?? '',
      vietQrTemplate: me.vietQrTemplate ?? 'compact2',
    })
  }, [me])

  const currentRentPeriod = useMemo(() => getCurrentRentBillingPeriod(), [])
  const rentCollectionOpensAt = useMemo(
    () => new Date(currentRentPeriod.year, currentRentPeriod.month - 1, 5, 0, 0, 0, 0),
    [currentRentPeriod.month, currentRentPeriod.year],
  )
  const canCreateRentQrThisMonth = Date.now() >= rentCollectionOpensAt.getTime()

  const paymentConfigReady = Boolean(
    paymentConfig.bankName && paymentConfig.bankAccountNumber && paymentConfig.bankAccountName,
  )
  const electricityChargePreview = useMemo(
    () => calculateRentCharge(rentBillingForm.electricityUsage, rentBillingForm.electricityRate),
    [rentBillingForm.electricityRate, rentBillingForm.electricityUsage],
  )
  const waterChargePreview = useMemo(
    () => calculateRentCharge(rentBillingForm.waterUsage, rentBillingForm.waterRate),
    [rentBillingForm.waterRate, rentBillingForm.waterUsage],
  )
  const rentBillingTotal = useMemo(() => calculateRentBillingTotal(rentBillingForm), [rentBillingForm])

  const tenantStats = useMemo(() => {
    const withContract = tenants.filter((t) => t.hasContract).length
    const activeContracts = tenants.filter(isActiveTenantContract).length
    const waitingRent = tenants.filter((t) => isActiveTenantContract(t) && !isPaidStatus(t.latestRentPaymentStatus)).length
    const monthlyRevenue = tenants
      .filter(isActiveTenantContract)
      .reduce((sum, t) => sum + getTenantCurrentRentAmount(t), 0)
    return {
      total: tenants.length,
      withContract,
      withoutContract: tenants.length - withContract,
      activeContracts,
      waitingRent,
      monthlyRevenue,
    }
  }, [tenants])

  const filteredTenants = useMemo(() => {
    const keyword = searchTerm.trim().toLowerCase()
    return tenants.filter((tenant) => {
      const text = [
        getTenantDisplayName(tenant),
        tenant.fullName,
        tenant.tenantName,
        tenant.email,
        tenant.tenantEmail,
        tenant.phone,
        tenant.tenantPhone,
        tenant.roomTitle,
        tenant.propertyName,
        tenant.contractCode,
      ].filter(Boolean).join(' ').toLowerCase()

      if (keyword && !text.includes(keyword)) return false
      if (contractFilter === 'with' && !tenant.hasContract) return false
      if (contractFilter === 'without' && tenant.hasContract) return false
      if (rentFilter === 'waiting' && (!isActiveTenantContract(tenant) || isPaidStatus(tenant.latestRentPaymentStatus))) return false
      if (rentFilter === 'paid' && !isPaidStatus(tenant.latestRentPaymentStatus)) return false
      return true
    })
  }, [contractFilter, rentFilter, searchTerm, tenants])

  const { mutate: createContract, isPending: creating } = useMutation({
    mutationFn: () => contractApi.createContract({
      bookingRequestId: creatingFor!.bookingRequestId!,
      startDate: contractForm.startDate,
      endDate: contractForm.endDate,
      terms: contractForm.terms || undefined,
    }),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['landlord-tenants'] })
      toast.success('Đã tạo hợp đồng online thành công.')
      setCreatingFor(null)
      setSelectedContract(created)
    },
    onError: (err: unknown) => {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Không thể tạo hợp đồng.')
    },
  })

  const openCreateContract = (tenant: TenantInfo) => {
    const startDate = tenant.moveInDate ? String(tenant.moveInDate).slice(0, 10) : new Date().toISOString().slice(0, 10)
    const endDate = addMonths(startDate, Math.max(Number(tenant.monthsToRent || 1), 1))
    setContractForm({ startDate, endDate, terms: '' })
    setCreatingFor(tenant)
    setSelectedContract(null)
  }

  const openContractDetail = async (contractId: number) => {
    setDetailLoading(true)
    setSelectedContract({} as RentalContract)
    try {
      const data = await contractApi.getLandlordContractById(contractId)
      setSelectedContract(data)
    } catch {
      toast.error('Không thể tải chi tiết hợp đồng.')
      setSelectedContract(null)
    } finally {
      setDetailLoading(false)
    }
  }

  const { mutate: uploadFile, isPending: uploading } = useMutation({
    mutationFn: async () => {
      if (!file || !selectedContract?.id) throw new Error('Thiếu file')
      const { fileToDataUrl } = await import('@/utils/file')
      const fileUrl = await fileToDataUrl(file)
      return contractApi.uploadLandlordFile(selectedContract.id, fileUrl)
    },
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: ['landlord-tenants'] })
      setSelectedContract(updated)
      setFile(null)
      toast.success('Đã tải bản hợp đồng do chủ trọ ký lên hệ thống.')
    },
    onError: (err: unknown) => {
      toast.error((err as Error)?.message || 'Không thể tải file hợp đồng.')
    },
  })

  const openRentBillingModal = (tenant: TenantInfo) => {
    if (!paymentConfigReady) {
      const msg = 'Bạn cần cấu hình VietQR (ngân hàng, số tài khoản, tên tài khoản) trước khi tạo QR.'
      setPaymentError(msg)
      toast.error(msg)
      return
    }

    setRentBillingTenant(tenant)
    setRentBillingForm({
      ...emptyRentBillingForm,
      baseRent: String(Math.round(Number(tenant.monthlyRent || 0))),
      electricityRate: String(Math.round(Number(tenant.electricPrice || 0))),
      waterRate: String(Math.round(Number(tenant.waterPrice || 0))),
      otherFees: String(Math.round(Number(tenant.servicePrice || 0))),
    })
    setRentBillingError('')
    setPaymentError('')
  }

  const closeRentBillingModal = () => {
    setRentBillingTenant(null)
    setRentBillingForm(emptyRentBillingForm)
    setRentBillingError('')
  }

  const updateRentBillingField = (field: keyof RentBillingForm, value: string) => {
    setRentBillingForm((current) => ({ ...current, [field]: value }))
    setRentBillingError('')
  }

  const createRentQr = async (tenant: TenantInfo, billingPayload: RentBillingPayload) => {
    if (!tenant.bookingRequestId) return
    if (!paymentConfigReady) {
      const msg = 'Bạn cần cấu hình VietQR (ngân hàng, số tài khoản, tên tài khoản) trước khi tạo QR.'
      setPaymentError(msg)
      toast.error(msg)
      return
    }
    setCreatingQrBookingId(tenant.bookingRequestId)
    setPaymentError('')
    try {
      const payment = await paymentApi.createLandlordVietQr({
        bookingRequestId: tenant.bookingRequestId,
        paymentType: 'rent',
        ...billingPayload,
      })
      setSelectedPayment(payment)
      closeRentBillingModal()
      qc.invalidateQueries({ queryKey: ['landlord-tenants'] })
      toast.success('Đã tạo QR thu tiền cho người thuê.')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      const msg = e?.response?.data?.message || 'Không thể tạo QR thu tiền.'
      setPaymentError(msg)
      toast.error(msg)
    } finally {
      setCreatingQrBookingId(0)
    }
  }

  const submitRentBilling = async () => {
    if (!rentBillingTenant) return

    const result = buildRentBillingPayload(rentBillingForm)
    if (!result.payload) {
      setRentBillingError(result.error || 'Thông tin lập tiền thuê chưa hợp lệ.')
      return
    }

    await createRentQr(rentBillingTenant, result.payload)
  }

  const openPayment = async (paymentCode?: string) => {
    if (!paymentCode) return
    setOpeningPaymentCode(paymentCode)
    setPaymentError('')
    try {
      const payment = await paymentApi.getPaymentByCode(paymentCode)
      setSelectedPayment(payment)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      const msg = e?.response?.data?.message || 'Không thể mở QR payment.'
      setPaymentError(msg)
      toast.error(msg)
    } finally {
      setOpeningPaymentCode('')
    }
  }

  const refreshSelectedPayment = async () => {
    if (!selectedPayment?.paymentCode) return
    setPaymentRefreshing(true)
    setPaymentError('')
    try {
      const payment = await paymentApi.getPaymentByCode(selectedPayment.paymentCode)
      setSelectedPayment(payment)
      qc.invalidateQueries({ queryKey: ['landlord-tenants'] })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      setPaymentError(e?.response?.data?.message || 'Không thể cập nhật trạng thái payment.')
    } finally {
      setPaymentRefreshing(false)
    }
  }

  const openTerminateModal = (tenant: TenantInfo) => {
    setTerminateTenant(tenant)
    setTerminateReason('')
  }

  const handleTerminateContract = async () => {
    if (!terminateTenant?.contractId || !terminateReason.trim()) return

    setTerminatingContract(true)
    try {
      await contractApi.terminateContractWithReason(terminateTenant.contractId, terminateReason)
      qc.invalidateQueries({ queryKey: ['landlord-tenants'] })
      qc.invalidateQueries({ queryKey: ['landlord-contracts'] })
      toast.success('Đã đuổi người thuê trọ thành công.')
      setTerminateTenant(null)
      setTerminateReason('')
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } }
      toast.error(e?.response?.data?.message || 'Không thể đuổi người thuê trọ.')
    } finally {
      setTerminatingContract(false)
    }
  }

  return (
    <ManagementLayout role="LANDLORD">
      <div className="min-h-screen bg-[#FAF6EF] px-0 py-0 sm:px-2 sm:py-2">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#C96A3D]/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-[#C96A3D]">
                <Users size={14} />
                Tenants
              </div>
              <h1 className="font-display text-2xl font-bold text-[#292524]">Người thuê</h1>
              <p className="mt-2 text-sm leading-6 text-[#78716C]">
                Quản lý người đang thuê phòng, hợp đồng online và QR thu tiền thuê theo từng kỳ.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Link to="/landlord/qr-settings" className="inline-flex min-h-10 max-w-full flex-wrap items-center justify-center gap-2 rounded-[10px] border border-[#E7D8C8] bg-white px-4 py-2 text-center text-sm font-medium leading-snug text-[#5B4636] transition-colors hover:bg-[#FAF6EF] hover:text-[#5B4636]">
                <QrCode size={16} />
                VietQR
              </Link>
              <Link to="/landlord/contracts" className="inline-flex min-h-10 max-w-full flex-wrap items-center justify-center gap-2 rounded-[10px] border border-[#E7D8C8] bg-white px-4 py-2 text-center text-sm font-medium leading-snug text-[#5B4636] transition-colors hover:bg-[#FAF6EF] hover:text-[#5B4636]">
                <FileText size={16} />
                Hợp đồng
              </Link>
              <Link to="/landlord/rooms" className="inline-flex min-h-10 max-w-full flex-wrap items-center justify-center gap-2 rounded-[10px] bg-[#C96A3D] px-4 py-2 text-center text-sm font-medium leading-snug text-white shadow-sm transition-colors hover:bg-[#B85C38] hover:text-white">
                <Home size={16} />
                Phòng trọ
              </Link>
            </div>
          </div>

          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <StatCard title="Người thuê" value={tenantStats.total} icon={<Users size={20} />} color="primary" />
            <StatCard title="Có hợp đồng" value={tenantStats.withContract} icon={<FileText size={20} />} color="accent" />
            <StatCard title="Chưa có HĐ" value={tenantStats.withoutContract} icon={<AlertTriangle size={20} />} color="gold" />
            <StatCard title="Chờ tiền thuê" value={tenantStats.waitingRent} icon={<CreditCard size={20} />} color="secondary" />
            <StatCard title="Doanh thu tháng" value={formatCurrency(tenantStats.monthlyRevenue)} icon={<CheckCircle2 size={20} />} color="brown" />
          </div>

          <div className="mb-6 rounded-[18px] border border-[#E8DED1] bg-[linear-gradient(135deg,#FFF8F3_0%,#FFFFFF_58%,#F3E7D3_100%)] p-5 shadow-[0_18px_48px_-32px_rgb(91_70_54/0.42)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-[#C96A3D]/10 text-[#C96A3D]">
                  <QrCode size={22} />
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#9A8775]">VietQR nhận tiền</p>
                  <h2 className="mt-1 font-display text-lg font-semibold text-[#2C241D]">
                    {paymentConfigReady ? 'Đã sẵn sàng tạo QR thu tiền' : 'Cần cấu hình tài khoản nhận tiền'}
                  </h2>
                  <p className="mt-1 text-sm text-[#78716C]">
                    Cấu hình ngân hàng được quản lý ở màn VietQR riêng để trang người thuê tập trung vào hợp đồng và thu tiền.
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-medium text-[#8A7663]">
                    <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-3 py-1 ring-1 ring-[#E8DED1]">
                      <CalendarClock size={13} />
                      Kỳ {currentRentPeriod.label}
                    </span>
                    <span className="rounded-full bg-white/80 px-3 py-1 ring-1 ring-[#E8DED1]">
                      {canCreateRentQrThisMonth ? 'Đã mở nút tạo QR từ ngày 05' : 'Nút tạo QR mở từ ngày 05'}
                    </span>
                  </div>
                </div>
              </div>
              <Link to="/landlord/qr-settings">
                <Button type="button" size="sm" variant={paymentConfigReady ? 'outline' : 'primary'} leftIcon={<QrCode size={14} />}>
                  {paymentConfigReady ? 'Xem cấu hình' : 'Cấu hình ngay'}
                </Button>
              </Link>
            </div>
          </div>

        {/* Create contract inline form */}
        {creatingFor && (
          <div className="mb-6 rounded-[18px] border border-[#E8DED1] bg-white/95 shadow-[0_8px_24px_-8px_rgb(91_70_54/0.20)] p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-base font-semibold text-[#292524]">Tạo hợp đồng online</h2>
                <p className="text-sm text-[#78716C] mt-0.5">{getTenantDisplayName(creatingFor)} — {creatingFor.roomTitle}</p>
              </div>
              <Button variant="ghost" size="sm" onClick={() => setCreatingFor(null)}>Hủy</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#78716C]">Ngày bắt đầu</span>
                <input
                  type="date"
                  value={contractForm.startDate}
                  onChange={(e) => setContractForm((p) => ({ ...p, startDate: e.target.value }))}
                  className="rounded-xl border border-[#E8DED1] px-3 py-2 text-sm text-[#292524] bg-white focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30"
                />
              </label>
              <label className="flex flex-col gap-1">
                <span className="text-xs font-medium text-[#78716C]">Ngày kết thúc</span>
                <input
                  type="date"
                  value={contractForm.endDate}
                  onChange={(e) => setContractForm((p) => ({ ...p, endDate: e.target.value }))}
                  className="rounded-xl border border-[#E8DED1] px-3 py-2 text-sm text-[#292524] bg-white focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30"
                />
              </label>
            </div>
            <label className="flex flex-col gap-1 mb-4">
              <span className="text-xs font-medium text-[#78716C]">Điều khoản bổ sung</span>
              <textarea
                rows={3}
                value={contractForm.terms}
                onChange={(e) => setContractForm((p) => ({ ...p, terms: e.target.value }))}
                placeholder="Ví dụ: Thanh toán trước ngày 05 hằng tháng, không nuôi thú cưng..."
                className="rounded-xl border border-[#E8DED1] px-3 py-2 text-sm text-[#292524] bg-white resize-none focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30"
              />
            </label>
            <Button
              leftIcon={<Plus size={14} />}
              onClick={() => createContract()}
              loading={creating}
              disabled={!contractForm.startDate || !contractForm.endDate}
            >
              Tạo hợp đồng
            </Button>
          </div>
        )}

          <Card padding="none" className="overflow-hidden">
            <div className="border-b border-[#E8DED1] px-5 py-4">
              <CardHeader className="mb-4 items-start">
                <div>
                  <CardTitle>Danh sách người thuê</CardTitle>
                  <p className="mt-1 text-sm text-[#78716C]">Tìm nhanh người thuê, lọc hợp đồng và trạng thái tiền thuê.</p>
                </div>
                <Badge variant="autumn">{filteredTenants.length} kết quả</Badge>
              </CardHeader>

              <div className="grid grid-cols-1 gap-3 lg:grid-cols-[minmax(260px,1fr)_220px_220px]">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Tìm theo tên, SĐT, phòng, mã hợp đồng..."
                  leftIcon={<Search size={15} />}
                />
                <Select value={contractFilter} onChange={(e) => setContractFilter(e.target.value)} label="Hợp đồng">
                  <option value="all">Tất cả</option>
                  <option value="with">Đã có hợp đồng</option>
                  <option value="without">Chưa có hợp đồng</option>
                </Select>
                <Select value={rentFilter} onChange={(e) => setRentFilter(e.target.value)} label="Tiền thuê">
                  <option value="all">Tất cả</option>
                  <option value="waiting">Chưa xong</option>
                  <option value="paid">Đã thanh toán</option>
                </Select>
              </div>
            </div>

            {isLoading ? (
              <TableSkeleton rows={5} cols={8} />
            ) : tenants.length === 0 ? (
              <EmptyState title="Chưa có người thuê" description="Hiện chưa có người thuê nào đã chốt phòng" icon={<Users size={28} />} />
            ) : filteredTenants.length === 0 ? (
              <EmptyState title="Không có kết quả phù hợp" description="Thử đổi từ khóa hoặc bộ lọc để xem người thuê khác." icon={<Users size={28} />} />
            ) : (
              <div className="divide-y divide-[#F3EADF]">
                <div className="hidden grid-cols-[minmax(220px,1.2fr)_minmax(210px,1fr)_120px_150px_140px_190px] gap-4 bg-[linear-gradient(180deg,#FCFAF7_0%,#F7F0E8_100%)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#8A7663] xl:grid">
                  <span>Người thuê</span>
                  <span>Phòng</span>
                  <span>Kỳ thuê</span>
                  <span>Hợp đồng</span>
                  <span>Tiền thuê</span>
                  <span className="text-right">Thao tác</span>
                </div>
                {filteredTenants.map((t) => {
                  const tenantName = getTenantDisplayName(t)
                  const rentPaid = isPaidStatus(t.latestRentPaymentStatus)
                  const activeContract = isActiveTenantContract(t)
                  const hasCurrentQr = Boolean(t.latestRentPaymentCode)
                  const currentRentAmount = getTenantCurrentRentAmount(t)
                  const showCreateQr = activeContract && canCreateRentQrThisMonth && !rentPaid && !hasCurrentQr
                  const showPendingQr = activeContract && hasCurrentQr && !rentPaid
                  const paidMessage = `Người thuê đã thanh toán tiền thuê ${currentRentPeriod.label}.`

                  return (
                    <div
                      key={t.bookingRequestId ?? t.userId}
                      className="grid grid-cols-1 gap-4 bg-white/95 px-5 py-4 transition-colors hover:bg-[#FCF8F3] xl:grid-cols-[minmax(220px,1.2fr)_minmax(210px,1fr)_120px_150px_140px_190px] xl:items-center"
                    >
                      <div className="flex min-w-0 items-center gap-3">
                        <Avatar src={t.avatarUrl} name={tenantName || t.email} size="sm" />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[#292524]">{tenantName}</p>
                          <p className="mt-0.5 truncate text-xs text-[#A8A29E]">{t.phone || t.email || '---'}</p>
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="min-w-0 truncate text-sm font-semibold text-[#292524]">{t.roomTitle || `#${t.roomId}`}</p>
                          <Badge variant={getStatusBadgeVariant(t.roomStatus || '')} size="sm">
                            {getStatusLabel(t.roomStatus || '')}
                          </Badge>
                        </div>
                        {t.propertyName && <p className="mt-0.5 truncate text-xs text-[#9A8775]">{t.propertyName}</p>}
                        <p className="mt-0.5 text-xs font-semibold text-[#C96A3D]">{formatCurrency(t.monthlyRent || 0)}/tháng</p>
                      </div>

                      <div className="text-sm text-[#5F5146]">
                        <p className="font-medium text-[#292524]">{t.moveInDate ? formatDate(t.moveInDate) : '—'}</p>
                        <p className="mt-0.5 text-xs text-[#9A8775]">{t.monthsToRent ? `${t.monthsToRent} tháng` : '—'}</p>
                      </div>

                      <div className="min-w-0">
                        {t.hasContract ? (
                          <>
                            <p className="truncate text-sm font-medium text-[#292524]">{t.contractCode}</p>
                            <div className="mt-1">
                              <Badge variant={getStatusBadgeVariant(t.contractStatus || '')} size="sm">
                                {getStatusLabel(t.contractStatus || '')}
                              </Badge>
                            </div>
                          </>
                        ) : (
                          <Badge variant="warning" size="sm">Chưa có</Badge>
                        )}
                      </div>

                      <div className="space-y-1.5">
                        <div>
                          <p className="text-sm font-semibold text-[#292524]">{formatCurrency(currentRentAmount)}</p>
                          {Number(t.latestRentPaymentAmount || 0) > 0 && (
                            <p className="text-[11px] font-medium text-[#9A8775]">Đã gồm điện/nước/phí</p>
                          )}
                        </div>
                        {rentPaid ? (
                          <button
                            type="button"
                            className="inline-flex items-center rounded-full bg-[#2C241D] px-3 py-1 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#1F1712]"
                            onClick={() => toast.success(paidMessage)}
                          >
                            Đã thanh toán
                          </button>
                        ) : t.latestRentPaymentStatus ? (
                          <button
                            type="button"
                            className="inline-flex items-center rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 ring-1 ring-amber-100 transition-colors hover:bg-amber-100"
                            onClick={() => t.latestRentPaymentCode && openPayment(t.latestRentPaymentCode)}
                          >
                            Chưa xong
                          </button>
                        ) : activeContract ? (
                          <span className="inline-flex items-center rounded-full bg-[#F5F0EC] px-3 py-1 text-xs font-semibold text-[#8A7663]">
                            Chưa tạo QR
                          </span>
                        ) : (
                          <span className="text-sm text-[#A8A29E]">Chưa có HĐ</span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2 xl:justify-end">
                        {!t.hasContract && t.bookingRequestId && (
                          <Button
                            size="sm"
                            leftIcon={<Plus size={13} />}
                            onClick={() => openCreateContract(t)}
                          >
                            Tạo HĐ
                          </Button>
                        )}
                        {t.hasContract && t.contractId && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              leftIcon={<FileText size={13} />}
                              onClick={() => openContractDetail(t.contractId!)}
                            >
                              HĐ
                            </Button>
                            {rentPaid ? (
                              <Button
                                size="sm"
                                className="bg-[#2C241D] text-white hover:bg-[#1F1712]"
                                leftIcon={<CheckCircle2 size={13} />}
                                onClick={() => toast.success(paidMessage)}
                              >
                                Đã trả
                              </Button>
                            ) : showPendingQr ? (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  leftIcon={<QrCode size={13} />}
                                  loading={openingPaymentCode === t.latestRentPaymentCode}
                                  onClick={() => openPayment(t.latestRentPaymentCode)}
                                >
                                  QR
                                </Button>
                                {String(t.latestRentPaymentStatus || '').toLowerCase() === 'pending' && (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    leftIcon={<CreditCard size={13} />}
                                    onClick={() => openRentBillingModal(t)}
                                  >
                                    Sửa phí
                                  </Button>
                                )}
                              </>
                            ) : showCreateQr ? (
                              <Button
                                variant="outline"
                                size="sm"
                                leftIcon={<QrCode size={13} />}
                                loading={creatingQrBookingId === Number(t.bookingRequestId || 0)}
                                onClick={() => openRentBillingModal(t)}
                              >
                                Tạo QR
                              </Button>
                            ) : activeContract ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled
                                leftIcon={<CalendarClock size={13} />}
                              >
                                Chưa tới kỳ
                              </Button>
                            ) : null}
                          </>
                        )}
                        {activeContract && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300"
                            leftIcon={<UserX size={13} />}
                            onClick={() => openTerminateModal(t)}
                          >
                            Đuổi
                          </Button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </Card>

          {paymentError && !selectedPayment && (
            <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {paymentError}
            </div>
          )}
        </div>
      </div>

      {/* View contract detail + upload */}
      <ContractDetailModal
        open={!!selectedContract}
        onClose={() => { setSelectedContract(null); setFile(null) }}
        contract={selectedContract}
        loading={detailLoading}
        title="Chi tiết hợp đồng người thuê"
        actionArea={
          selectedContract?.id && !detailLoading && !selectedContract.landlordSignedFileUrl && !selectedContract.landlordFileUrl ? (
            <div className="rounded-xl border border-[#E8DED1] bg-[#FAF7F4] p-4 flex flex-col gap-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-[#78716C]">Tải bản chủ trọ đã ký</p>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                className="w-full text-sm text-[#57534E] file:mr-3 file:py-1.5 file:px-3 file:rounded-[8px] file:border-0 file:bg-[#F3E7D3] file:text-[#5B4636] file:text-xs file:font-medium hover:file:bg-[#E8D5BC] cursor-pointer"
              />
              <Button
                size="sm"
                onClick={() => uploadFile()}
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

      <Modal
        open={!!rentBillingTenant}
        onClose={closeRentBillingModal}
        title={`Lập tiền thuê ${currentRentPeriod.label}`}
        description={rentBillingTenant ? `${getTenantDisplayName(rentBillingTenant)} - ${rentBillingTenant.roomTitle || 'Phòng thuê'}` : undefined}
        size="xl"
        footer={
          <>
            <Button
              type="button"
              variant="ghost"
              onClick={closeRentBillingModal}
              disabled={creatingQrBookingId === Number(rentBillingTenant?.bookingRequestId || 0)}
            >
              Hủy
            </Button>
            <Button
              type="button"
              onClick={submitRentBilling}
              loading={creatingQrBookingId === Number(rentBillingTenant?.bookingRequestId || 0)}
              leftIcon={<QrCode size={16} />}
            >
              Tạo và gửi QR
            </Button>
          </>
        }
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-[16px] border border-[#E8DED1] bg-[#FAF7F4] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9A8775]">Kỳ thu</p>
              <p className="mt-1 text-sm font-semibold text-[#2C241D]">{currentRentPeriod.label}</p>
            </div>
            <div className="rounded-[16px] border border-[#E8DED1] bg-[#FAF7F4] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9A8775]">Người thuê</p>
              <p className="mt-1 truncate text-sm font-semibold text-[#2C241D]">{rentBillingTenant ? getTenantDisplayName(rentBillingTenant) : '---'}</p>
            </div>
            <div className="rounded-[16px] border border-[#E8DED1] bg-[#FAF7F4] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9A8775]">Phòng</p>
              <p className="mt-1 truncate text-sm font-semibold text-[#2C241D]">{rentBillingTenant?.roomTitle || '---'}</p>
            </div>
          </div>

          <div className="rounded-[18px] border border-[#E8DED1] bg-white p-4 shadow-[0_12px_36px_-30px_rgb(91_70_54/0.5)]">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-[#C96A3D]/10 text-[#C96A3D]">
                <ReceiptText size={17} />
              </span>
              <div>
                <h3 className="font-display text-base font-semibold text-[#292524]">Tiền phòng & phụ phí</h3>
                <p className="text-xs text-[#8A7663]">Các khoản cố định trong kỳ này</p>
              </div>
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Tiền phòng"
                type="number"
                min="0"
                step="1000"
                value={rentBillingForm.baseRent}
                onChange={(e) => updateRentBillingField('baseRent', e.target.value)}
                placeholder="Ví dụ: 2500000"
              />
              <Input
                label="Phụ phí khác"
                type="number"
                min="0"
                step="1000"
                value={rentBillingForm.otherFees}
                onChange={(e) => updateRentBillingField('otherFees', e.target.value)}
                placeholder="Dịch vụ, vệ sinh, gửi xe..."
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <section className="rounded-[18px] border border-[#E8DED1] bg-white p-4 shadow-[0_12px_36px_-30px_rgb(91_70_54/0.5)]">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-amber-50 text-amber-700">
                  <Bolt size={17} />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-[#292524]">Điện</h3>
                  <p className="text-xs text-[#8A7663]">Theo đơn giá phòng đã lưu</p>
                </div>
              </div>
              <Input
                label="Số điện (kWh)"
                type="number"
                min="0"
                step="0.1"
                value={rentBillingForm.electricityUsage}
                onChange={(e) => updateRentBillingField('electricityUsage', e.target.value)}
                placeholder="Ví dụ: 50"
              />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[14px] bg-[#FAF7F4] px-3 py-2">
                  <p className="text-xs font-medium text-[#9A8775]">Đơn giá</p>
                  <p className="mt-0.5 text-sm font-semibold text-[#2C241D]">{formatCurrency(Number(rentBillingForm.electricityRate || 0))}/kWh</p>
                </div>
                <div className="rounded-[14px] bg-[#FFF7ED] px-3 py-2">
                  <p className="text-xs font-medium text-[#C96A3D]">Tiền điện</p>
                  <p className="mt-0.5 text-sm font-semibold text-[#2C241D]">{formatCurrency(electricityChargePreview)}</p>
                </div>
              </div>
            </section>

            <section className="rounded-[18px] border border-[#E8DED1] bg-white p-4 shadow-[0_12px_36px_-30px_rgb(91_70_54/0.5)]">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-[10px] bg-sky-50 text-sky-700">
                  <Droplets size={17} />
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-[#292524]">Nước</h3>
                  <p className="text-xs text-[#8A7663]">Theo đơn giá phòng đã lưu</p>
                </div>
              </div>
              <Input
                label="Số nước (m³)"
                type="number"
                min="0"
                step="0.1"
                value={rentBillingForm.waterUsage}
                onChange={(e) => updateRentBillingField('waterUsage', e.target.value)}
                placeholder="Ví dụ: 12"
              />
              <div className="mt-4 grid grid-cols-2 gap-3">
                <div className="rounded-[14px] bg-[#FAF7F4] px-3 py-2">
                  <p className="text-xs font-medium text-[#9A8775]">Đơn giá</p>
                  <p className="mt-0.5 text-sm font-semibold text-[#2C241D]">{formatCurrency(Number(rentBillingForm.waterRate || 0))}/m³</p>
                </div>
                <div className="rounded-[14px] bg-sky-50 px-3 py-2">
                  <p className="text-xs font-medium text-sky-700">Tiền nước</p>
                  <p className="mt-0.5 text-sm font-semibold text-[#2C241D]">{formatCurrency(waterChargePreview)}</p>
                </div>
              </div>
            </section>
          </div>

          <Textarea
            label="Ghi chú"
            value={rentBillingForm.notes}
            onChange={(e) => updateRentBillingField('notes', e.target.value)}
            placeholder="Ví dụ: Điện tháng này 120kWh, đã cộng phí vệ sinh..."
          />

          {rentBillingError && (
            <div className="rounded-[14px] border border-red-100 bg-red-50 px-4 py-3 text-sm font-medium text-red-600">
              {rentBillingError}
            </div>
          )}

          <div className="flex flex-col gap-2 rounded-[18px] bg-[#2C241D] px-5 py-4 text-white sm:flex-row sm:items-center sm:justify-between">
            <span className="text-sm font-medium text-white/75">Tổng tiền gửi QR</span>
            <strong className="font-display text-2xl font-bold">{formatCurrency(rentBillingTotal)}</strong>
          </div>
        </div>
      </Modal>

      {selectedPayment && (
        <PaymentQrModal
          payment={selectedPayment}
          onClose={() => {
            setSelectedPayment(null)
            setPaymentRefreshing(false)
            setPaymentError('')
          }}
          onRefresh={refreshSelectedPayment}
          refreshing={paymentRefreshing}
          error={paymentError}
          onPaymentChanged={(payment) => {
            setSelectedPayment(payment)
            qc.invalidateQueries({ queryKey: ['landlord-tenants'] })
          }}
          onPaymentDeleted={async () => {
            setSelectedPayment(null)
            setPaymentRefreshing(false)
            setPaymentError('')
            await qc.invalidateQueries({ queryKey: ['landlord-tenants'] })
            toast.success('Đã xóa QR hết hạn.')
          }}
        />
      )}

      {/* Terminate contract modal */}
      <Modal
        open={!!terminateTenant}
        onClose={() => {
          setTerminateTenant(null)
          setTerminateReason('')
        }}
        title="Đuổi người thuê trọ"
        size="md"
      >
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600 mb-4">
              Bạn có chắc chắn muốn đuổi <strong>{terminateTenant ? getTenantDisplayName(terminateTenant) : 'người thuê'}</strong> khỏi phòng trọ không?
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Hành động này sẽ chấm dứt hợp đồng thuê trọ và người thuê sẽ không thể truy cập vào hệ thống nữa.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Lý do đuổi <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="Nhập lý do đuổi người thuê trọ..."
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
              setTerminateTenant(null)
              setTerminateReason('')
            }}
          >
            Hủy
          </Button>
          <Button
            className="bg-red-600 hover:bg-red-700 text-white"
            loading={terminatingContract}
            disabled={!terminateReason.trim()}
            onClick={handleTerminateContract}
          >
            Xác nhận đuổi
          </Button>
        </div>
      </Modal>
    </ManagementLayout>
  )
}
