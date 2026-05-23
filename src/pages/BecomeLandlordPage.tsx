import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building2, CheckCircle, Clock, Upload, QrCode, ShieldCheck, ReceiptText } from 'lucide-react'
import PublicLayout from '@/components/layout/PublicLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Textarea from '@/components/ui/Textarea'
import Card, { CardHeader, CardTitle } from '@/components/ui/Card'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import { PageLoader } from '@/components/ui/Skeleton'
import PaymentQrModal from '@/components/PaymentQrModal'
import { landlordApplicationApi } from '@/api/landlordApplicationApi'
import { paymentApi } from '@/api/paymentApi'
import { fileToDataUrl } from '@/utils/file'
import { formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'
import type { Payment } from '@/types'

const schema = z.object({
  identityNumber: z.string().min(9, 'CCCD/CMND không hợp lệ'),
  note: z.string().optional(),
})
type FormData = z.output<typeof schema>

const REGISTRATION_FEE = 2_000_000

const steps = [
  { step: 1, title: 'Điền hồ sơ', desc: 'Nhập CCCD và đính kèm giấy tờ' },
  { step: 2, title: 'Quét QR', desc: `Thanh toán ${formatCurrency(REGISTRATION_FEE)} và gửi ảnh minh chứng ngay sau khi nộp` },
  { step: 3, title: 'Admin xác nhận', desc: 'Admin kiểm tra hồ sơ và minh chứng trước khi mở quyền chủ trọ' },
]

const landlordRequirements = [
  'CCCD/CMND phải là giấy tờ thật, còn hiệu lực và hiển thị rõ cả hai mặt.',
  'Cần cung cấp giấy tờ chứng minh quyền quản lý nhà trọ hoặc giấy phép kinh doanh liên quan.',
  'Thông tin phòng đăng tải sau khi duyệt phải đúng thực tế về giá, địa chỉ, ảnh và tiện ích.',
  'Không đăng tin giả, không thu phí trái cam kết, không dẫn người thuê sang giao dịch ngoài hệ thống để lách xác minh.',
  'Hồ sơ sai lệch hoặc không hợp tác xác minh có thể bị từ chối hoặc khóa quyền chủ trọ.',
]

export default function BecomeLandlordPage() {
  const qc = useQueryClient()
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null)
  const [paymentError, setPaymentError] = useState('')
  const [paymentRefreshing, setPaymentRefreshing] = useState(false)
  const [openingPayment, setOpeningPayment] = useState(false)
  const [cccdFrontFile, setCccdFrontFile] = useState<File | null>(null)
  const [cccdBackFile, setCccdBackFile] = useState<File | null>(null)
  const [rentalFiles, setRentalFiles] = useState<File[]>([])
  const [acceptedRequirements, setAcceptedRequirements] = useState(false)

  const { data: application, isLoading } = useQuery({
    queryKey: ['my-application'],
    queryFn: landlordApplicationApi.getMyApplication,
  })

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })

  const openRegistrationPayment = async (paymentCode?: string) => {
    setOpeningPayment(true)
    setPaymentError('')
    try {
      const code = paymentCode || (await landlordApplicationApi.payRegistrationFee()).paymentCode
      const payment = await paymentApi.getPaymentByCode(code)
      setSelectedPayment(payment)
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      const message = e?.response?.data?.message || e?.message || 'Không thể mở QR phí đăng ký lúc này.'
      setPaymentError(message)
      toast.error(message)
    } finally {
      setOpeningPayment(false)
    }
  }

  const refreshSelectedPayment = async () => {
    if (!selectedPayment?.paymentCode) return
    setPaymentRefreshing(true)
    setPaymentError('')
    try {
      const payment = await paymentApi.getPaymentByCode(selectedPayment.paymentCode)
      setSelectedPayment(payment)
      qc.invalidateQueries({ queryKey: ['my-application'] })
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } }; message?: string }
      setPaymentError(e?.response?.data?.message || e?.message || 'Không thể cập nhật trạng thái payment.')
    } finally {
      setPaymentRefreshing(false)
    }
  }

  const { mutate: submit, isPending: submitting } = useMutation({
    mutationFn: async (data: FormData) => {
      if (!cccdFrontFile || !cccdBackFile) {
        throw new Error('Bạn cần tải lên đủ CCCD mặt trước và mặt sau.')
      }
      if (!acceptedRequirements) {
        throw new Error('Bạn cần xác nhận đã đọc nội quy và yêu cầu đăng ký chủ trọ.')
      }

      const [cccdFrontUrl, cccdBackUrl, rentalDocumentUrls] = await Promise.all([
        fileToDataUrl(cccdFrontFile),
        fileToDataUrl(cccdBackFile),
        Promise.all(rentalFiles.map((file) => fileToDataUrl(file))),
      ])

      return landlordApplicationApi.submit({
        cccdNumber: data.identityNumber,
        cccdFrontUrl,
        cccdBackUrl,
        rentalDocumentUrls,
        note: data.note?.trim() || undefined,
      })
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ['my-application'] })
      toast.success('Đơn đã được nộp. Hãy thanh toán phí đăng ký và gửi ảnh minh chứng để admin xác nhận.')
      void openRegistrationPayment(created.registrationFeePaymentCode || created.feePaymentCode)
    },
    onError: (error: Error) => toast.error(error.message || 'Không thể nộp hồ sơ lúc này.'),
  })

  if (isLoading) return <PublicLayout><PageLoader /></PublicLayout>

  if (application) {
    const isApproved = application.status === 'APPROVED'
    const isRejected = application.status === 'REJECTED'
    const feeCode = application.registrationFeePaymentCode || application.feePaymentCode
    const feeStatus = application.registrationFeePaymentStatus || application.feePaymentStatus || 'PENDING'
    const feeAmount = application.registrationFeeAmount || REGISTRATION_FEE

    return (
      <PublicLayout>
        <div className="mx-auto max-w-3xl px-4 py-14">
          {isApproved ? (
            <div className="text-center">
              <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle size={32} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-display font-bold text-[#292524] mb-2">Đơn đã được duyệt</h2>
              <p className="text-[#78716C]">Tài khoản của bạn đã được kích hoạt quyền chủ trọ.</p>
            </div>
          ) : (
            <div className="text-center">
              <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full ${isRejected ? 'bg-red-100' : 'bg-amber-100'}`}>
                <Clock size={32} className="text-amber-600" />
              </div>
              <h2 className="text-2xl font-display font-bold text-[#292524] mb-2">
                {isRejected ? 'Hồ sơ chưa được duyệt' : 'Hồ sơ đang chờ admin xác nhận'}
              </h2>
              <p className="text-[#78716C]">
                Trạng thái hiện tại: <strong>{getStatusLabel(application.status)}</strong>.
              </p>
              {application.rejectReason && <p className="text-sm text-red-500 mt-3">Lý do từ chối: {application.rejectReason}</p>}
            </div>
          )}

          {!isApproved && !isRejected && (
            <Card className="mt-8 rounded-[22px] border-[#E8DED1] text-left shadow-[0_18px_48px_-28px_rgb(91_70_54/0.28)]">
              <CardHeader className="mb-0">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <CardTitle className="mb-1">Phí đăng ký chủ trọ</CardTitle>
                    <p className="text-sm text-[#78716C]">Quét QR, chuyển khoản đúng nội dung rồi gửi ảnh minh chứng để admin kiểm tra.</p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(feeStatus)}>{getStatusLabel(feeStatus)}</Badge>
                </div>
              </CardHeader>
              <div className="px-5 pb-5">
                <div className="grid gap-3 sm:grid-cols-3">
                  <InfoBox label="Số tiền" value={formatCurrency(feeAmount)} emphasis />
                  <InfoBox label="Mã payment" value={feeCode || 'Đang tạo'} />
                  <InfoBox label="Minh chứng" value={application.registrationFeeProofSubmittedAt ? 'Đã gửi' : 'Chưa gửi'} />
                </div>
                <div className="mt-5 flex flex-wrap items-center gap-3">
                  <Button
                    onClick={() => openRegistrationPayment(feeCode)}
                    loading={openingPayment}
                    leftIcon={<QrCode size={18} />}
                  >
                    {feeCode ? 'Mở QR và gửi minh chứng' : 'Tạo QR phí đăng ký'}
                  </Button>
                  <p className="text-sm text-[#78716C]">Admin chỉ duyệt hồ sơ sau khi khoản phí này được xác nhận thành công.</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {selectedPayment && (
          <PaymentQrModal
            payment={selectedPayment}
            onClose={() => setSelectedPayment(null)}
            onRefresh={refreshSelectedPayment}
            refreshing={paymentRefreshing}
            error={paymentError}
            onPaymentChanged={(payment) => {
              setSelectedPayment(payment)
              qc.invalidateQueries({ queryKey: ['my-application'] })
            }}
            onPaymentDeleted={() => {
              setSelectedPayment(null)
              qc.invalidateQueries({ queryKey: ['my-application'] })
            }}
          />
        )}
      </PublicLayout>
    )
  }

  return (
    <PublicLayout>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="text-center mb-10">
          <div className="w-14 h-14 rounded-[14px] gradient-autumn flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-white" />
          </div>
          <h1 className="text-3xl font-display font-bold text-[#292524] mb-2">Trở thành chủ trọ</h1>
          <p className="text-[#78716C] max-w-lg mx-auto">Nộp hồ sơ xác thực để mở quyền đăng phòng và quản lý người thuê trực tuyến.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-10">
          {steps.map((s) => (
            <div key={s.step} className="flex-1 flex items-start gap-3 p-4 bg-white rounded-[14px] border border-[#E7E5E4]">
              <div className="w-8 h-8 rounded-full bg-[#C96A3D] text-white text-sm font-bold flex items-center justify-center shrink-0">
                {s.step}
              </div>
              <div>
                <p className="text-sm font-semibold text-[#292524]">{s.title}</p>
                <p className="text-xs text-[#78716C] mt-0.5">{s.desc}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.9fr)]">
          <Card className="rounded-[22px] border-[#E8DED1] shadow-[0_18px_48px_-28px_rgb(91_70_54/0.34)]">
            <CardHeader><CardTitle>Hồ sơ xác thực chủ trọ</CardTitle></CardHeader>
            <div className="px-5 pb-5">
              <form onSubmit={handleSubmit((data) => submit(data))} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Số CCCD/CMND *" error={errors.identityNumber?.message} {...register('identityNumber')} />
                  <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FileField label="CCCD mặt trước *" onChange={(file) => setCccdFrontFile(file)} />
                    <FileField label="CCCD mặt sau *" onChange={(file) => setCccdBackFile(file)} />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-[#44403C] block mb-1.5">Giấy tờ nhà trọ / giấy phép kinh doanh</label>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,image/*"
                    onChange={(e) => setRentalFiles(Array.from(e.target.files || []))}
                    className="w-full text-sm text-[#57534E] file:mr-3 file:py-1.5 file:px-3 file:rounded-[8px] file:border-0 file:bg-[#F3E7D3] file:text-[#5B4636] file:text-xs file:font-medium hover:file:bg-[#E8D5BC] cursor-pointer"
                  />
                  {rentalFiles.length > 0 && <p className="text-xs text-[#A8A29E] mt-1">Đã chọn {rentalFiles.length} tài liệu.</p>}
                </div>

                <Textarea label="Ghi chú bổ sung" rows={4} error={errors.note?.message} {...register('note')} />

                <div className="rounded-[16px] border border-[#ECD8C3] bg-[#FCF7F1] px-4 py-3">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptedRequirements}
                      onChange={(e) => setAcceptedRequirements(e.target.checked)}
                      className="mt-1 h-4 w-4 rounded border-[#D6C2AE] text-[#C96A3D] focus:ring-[#C96A3D]/30"
                    />
                    <span className="text-sm leading-6 text-[#5B4636]">
                      Tôi xác nhận đã đọc nội quy và yêu cầu xét duyệt chủ trọ. Tôi hiểu rằng phí kích hoạt quyền chủ trọ là{' '}
                      <strong className="text-[#B85C38]">{formatCurrency(REGISTRATION_FEE)}</strong> và hệ thống sẽ mở QR ngay sau khi tôi nộp hồ sơ.
                    </span>
                  </label>
                </div>

                <Button type="submit" loading={submitting} size="lg" leftIcon={<Upload size={18} />} disabled={!acceptedRequirements}>
                  Nộp hồ sơ
                </Button>
              </form>
            </div>
          </Card>

          <div className="space-y-5">
            <Card className="rounded-[22px] border-[#E8DED1] bg-[linear-gradient(180deg,#FFFCF8_0%,#F7F0E8_100%)] shadow-[0_18px_48px_-28px_rgb(91_70_54/0.26)]">
              <CardHeader className="mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#C96A3D] text-white">
                    <ShieldCheck size={20} />
                  </div>
                  <div>
                    <CardTitle className="mb-1">Nội quy và yêu cầu</CardTitle>
                    <p className="text-sm text-[#7C6757]">Hồ sơ chỉ được duyệt khi đáp ứng đủ điều kiện bên dưới.</p>
                  </div>
                </div>
              </CardHeader>
              <div className="space-y-3">
                {landlordRequirements.map((item, index) => (
                  <div key={item} className="flex items-start gap-3 rounded-[14px] border border-[#EADBCB] bg-white/80 px-4 py-3">
                    <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#F3E7D3] text-xs font-semibold text-[#9A5B38]">
                      {index + 1}
                    </div>
                    <p className="text-sm leading-6 text-[#5B4636]">{item}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="rounded-[22px] border-[#E8DED1] shadow-[0_18px_48px_-28px_rgb(91_70_54/0.26)]">
              <CardHeader className="mb-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#F5E5D1] text-[#C96A3D]">
                    <ReceiptText size={20} />
                  </div>
                  <div>
                    <CardTitle className="mb-1">Phí đăng ký chủ trọ</CardTitle>
                    <p className="text-sm text-[#7C6757]">Tạo QR ngay sau khi nộp hồ sơ.</p>
                  </div>
                </div>
              </CardHeader>
              <div className="rounded-[18px] bg-[#FCF7F1] px-5 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#A08A76]">Mức phí kích hoạt</p>
                <p className="mt-2 text-3xl font-display font-bold text-[#B85C38]">{formatCurrency(REGISTRATION_FEE)}</p>
                <div className="mt-4 space-y-2 text-sm leading-6 text-[#5B4636]">
                  <p>Phí này dùng để kích hoạt quyền đăng phòng, quản lý phòng trọ và nhận booking trên hệ thống.</p>
                  <p>Sau khi nộp hồ sơ, hệ thống sẽ mở QR để bạn chuyển khoản và gửi ảnh minh chứng cho admin xác nhận.</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </PublicLayout>
  )
}

function InfoBox({ label, value, emphasis = false }: { label: string; value?: string; emphasis?: boolean }) {
  return (
    <div className="rounded-[16px] border border-[#E8DED1] bg-[#FFFCF8] px-4 py-3">
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#9A8775]">{label}</p>
      <p className={`mt-1 break-words text-sm font-semibold ${emphasis ? 'text-lg text-[#B85C38]' : 'text-[#292524]'}`}>{value || '—'}</p>
    </div>
  )
}

function FileField({ label, onChange }: { label: string; onChange: (file: File | null) => void }) {
  return (
    <div>
      <label className="text-sm font-medium text-[#44403C] block mb-1.5">{label}</label>
      <input
        type="file"
        accept=".pdf,image/*"
        onChange={(e) => onChange(e.target.files?.[0] || null)}
        className="w-full text-sm text-[#57534E] file:mr-3 file:py-1.5 file:px-3 file:rounded-[8px] file:border-0 file:bg-[#F3E7D3] file:text-[#5B4636] file:text-xs file:font-medium hover:file:bg-[#E8D5BC] cursor-pointer"
      />
    </div>
  )
}
