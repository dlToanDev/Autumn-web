import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { useQuery, useMutation } from '@tanstack/react-query'
import {
  MapPin, Star, BedDouble, Users, Wifi, ArrowLeft,
  MessageSquare, ChevronLeft, ChevronRight,
  Zap, Droplets, Wrench, UserCheck, Package, CalendarDays, Home, BadgeInfo
} from 'lucide-react'
import PublicLayout from '@/components/layout/PublicLayout'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Badge, { getStatusBadgeVariant, getStatusLabel } from '@/components/ui/Badge'
import Avatar from '@/components/ui/Avatar'
import { PageLoader, ErrorState } from '@/components/ui/Skeleton'
import { rentalApi } from '@/api/rentalApi'
import { bookingApi } from '@/api/bookingApi'
import { useAuthStore } from '@/store/authStore'
import { formatCurrency, formatDate } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function RoomDetailPage() {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { isLoggedIn, user } = useAuthStore()
  const [imgIndex, setImgIndex] = useState(0)
  const [bookingOpen, setBookingOpen] = useState(false)
  const [moveInDate, setMoveInDate] = useState('')
  const [message, setMessage] = useState('')

  const { data: room, isLoading, error } = useQuery({
    queryKey: ['room', roomId],
    queryFn: () => rentalApi.getRoomById(Number(roomId)),
    enabled: !!roomId,
  })

  const { data: reviews = [] } = useQuery({
    queryKey: ['room-reviews', roomId],
    queryFn: () => rentalApi.getRoomReviews(Number(roomId)),
    enabled: !!roomId,
  })

  const { mutate: createBooking, isPending: bookingLoading } = useMutation({
    mutationFn: () => bookingApi.createBooking({ roomId: Number(roomId), message, moveInDate: moveInDate || undefined }),
    onSuccess: () => {
      toast.success('Yêu cầu thuê phòng đã được gửi!')
      setBookingOpen(false)
    },
  })

  if (isLoading) return <PublicLayout><PageLoader /></PublicLayout>
  if (error || !room) return <PublicLayout><ErrorState message="Không thể tải thông tin phòng" /></PublicLayout>

  const images = room.images || []
  const coverCount = images.length
  const isAvailable = room.status?.toUpperCase() === 'AVAILABLE'

  const ROOM_TYPE_LABEL: Record<string, string> = {
    PHONG_TRO: 'Phòng trọ', PHONG_GHEP: 'Phòng ghép', CAN_HO_MINI: 'Căn hộ mini',
    STUDIO: 'Studio', CAN_HO: 'Căn hộ', NHA_NGUYEN_CAN: 'Nhà nguyên căn',
  }
  const GENDER_LABEL: Record<string, string> = { ALL: 'Tất cả', MALE: 'Nam', FEMALE: 'Nữ' }

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-[#78716C] hover:text-[#292524] mb-5 transition-colors">
          <ArrowLeft size={16} /> Quay lại
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left – main content */}
          <div className="lg:col-span-2 space-y-6">

            {/* Gallery */}
            <div className="space-y-2">
              <div className="relative rounded-[16px] overflow-hidden aspect-[16/9] bg-[#F3E7D3]">
                {coverCount > 0 ? (
                  <>
                    <img src={images[imgIndex].imageUrl} alt={room.title} className="w-full h-full object-cover" />
                    {/* Status overlay */}
                    <span className={`absolute top-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isAvailable ? 'bg-emerald-500 text-white' : 'bg-[#78716C] text-white'
                    }`}>
                      {isAvailable ? 'Còn phòng' : 'Hết phòng'}
                    </span>
                    {/* Counter */}
                    <span className="absolute top-3 right-3 text-xs bg-black/50 text-white px-2 py-0.5 rounded-full">
                      {imgIndex + 1}/{coverCount}
                    </span>
                    {coverCount > 1 && (
                      <>
                        <button onClick={() => setImgIndex((p) => (p - 1 + coverCount) % coverCount)}
                          className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors">
                          <ChevronLeft size={18} />
                        </button>
                        <button onClick={() => setImgIndex((p) => (p + 1) % coverCount)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/80 backdrop-blur flex items-center justify-center hover:bg-white transition-colors">
                          <ChevronRight size={18} />
                        </button>
                      </>
                    )}
                  </>
                ) : (
                  <div className="flex items-center justify-center h-full text-[#A8A29E]"><BedDouble size={48} /></div>
                )}
              </div>
              {/* Thumbnail strip */}
              {coverCount > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {images.map((img, i) => (
                    <button key={i} onClick={() => setImgIndex(i)}
                      className={`shrink-0 w-16 h-16 rounded-[8px] overflow-hidden border-2 transition-all ${
                        i === imgIndex ? 'border-[#C96A3D]' : 'border-transparent opacity-60 hover:opacity-100'
                      }`}>
                      <img src={img.imageUrl} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Title & location */}
            <div>
              <div className="flex items-start justify-between gap-4 flex-wrap mb-1.5">
                <h1 className="text-2xl font-display font-bold text-[#292524] flex-1">{room.title}</h1>
                <div className="flex items-center gap-2 shrink-0">
                  {room.roomType && (
                    <span className="text-xs bg-[#F3E7D3] text-[#5B4636] px-2.5 py-1 rounded-full font-medium">
                      {ROOM_TYPE_LABEL[room.roomType] || room.roomType}
                    </span>
                  )}
                  <Badge variant={getStatusBadgeVariant(room.status)}>{getStatusLabel(room.status)}</Badge>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[#78716C] text-sm">
                <MapPin size={14} className="shrink-0 text-[#A8A29E]" />
                <span>{[room.address, room.wardName, room.districtName, room.provinceName].filter(Boolean).join(', ')}</span>
              </div>
              {(room.averageRating ?? 0) > 0 && (
                <div className="flex items-center gap-1 mt-2 text-sm">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star key={i} size={14} className={i < Math.round(room.averageRating!) ? 'text-[#D4A373] fill-[#D4A373]' : 'text-[#E7E5E4]'} />
                  ))}
                  <span className="font-semibold text-[#44403C] ml-1">{room.averageRating!.toFixed(1)}</span>
                  <span className="text-[#78716C]">({room.reviewCount || reviews.length} đánh giá)</span>
                </div>
              )}
            </div>

            {/* Key stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {room.area && (
                <div className="bg-[#FAF6EF] rounded-[12px] p-3.5 text-center">
                  <BedDouble size={18} className="text-[#C96A3D] mx-auto mb-1" />
                  <p className="text-sm font-bold text-[#292524]">{room.area}m²</p>
                  <p className="text-xs text-[#78716C]">Diện tích</p>
                </div>
              )}
              {(room.maxOccupants || room.maxTenants) && (
                <div className="bg-[#FAF6EF] rounded-[12px] p-3.5 text-center">
                  <Users size={18} className="text-[#C96A3D] mx-auto mb-1" />
                  <p className="text-sm font-bold text-[#292524]">{room.maxOccupants || room.maxTenants} người</p>
                  <p className="text-xs text-[#78716C]">Tối đa</p>
                </div>
              )}
              {room.depositAmount && (
                <div className="bg-[#FAF6EF] rounded-[12px] p-3.5 text-center">
                  <BadgeInfo size={18} className="text-[#C96A3D] mx-auto mb-1" />
                  <p className="text-sm font-bold text-[#292524]">{formatCurrency(room.depositAmount)}</p>
                  <p className="text-xs text-[#78716C]">Tiền cọc</p>
                </div>
              )}
              {room.genderAllowed && (
                <div className="bg-[#FAF6EF] rounded-[12px] p-3.5 text-center">
                  <UserCheck size={18} className="text-[#C96A3D] mx-auto mb-1" />
                  <p className="text-sm font-bold text-[#292524]">{GENDER_LABEL[room.genderAllowed?.toUpperCase()] || room.genderAllowed}</p>
                  <p className="text-xs text-[#78716C]">Giới tính</p>
                </div>
              )}
            </div>

            {/* Price breakdown */}
            {(room.electricPrice || room.waterPrice || room.servicePrice) && (
              <div className="bg-white rounded-[14px] border border-[#E7E5E4] p-4">
                <h2 className="text-sm font-semibold text-[#292524] mb-3 font-display">Chi phí hàng tháng</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {room.electricPrice !== undefined && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                        <Zap size={14} className="text-amber-500" />
                      </div>
                      <div>
                        <p className="text-xs text-[#78716C]">Điện</p>
                        <p className="text-sm font-semibold text-[#292524]">{formatCurrency(room.electricPrice)}/kWh</p>
                      </div>
                    </div>
                  )}
                  {room.waterPrice !== undefined && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center shrink-0">
                        <Droplets size={14} className="text-blue-500" />
                      </div>
                      <div>
                        <p className="text-xs text-[#78716C]">Nước</p>
                        <p className="text-sm font-semibold text-[#292524]">{formatCurrency(room.waterPrice)}/m³</p>
                      </div>
                    </div>
                  )}
                  {room.servicePrice !== undefined && (
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                        <Wrench size={14} className="text-green-600" />
                      </div>
                      <div>
                        <p className="text-xs text-[#78716C]">Dịch vụ</p>
                        <p className="text-sm font-semibold text-[#292524]">{formatCurrency(room.servicePrice)}/tháng</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Furnishing & available */}
            {(room.furnished !== undefined || room.availableFrom) && (
              <div className="flex flex-wrap gap-3">
                {room.furnished !== undefined && (
                  <div className="flex items-center gap-2 bg-[#F5F0EC] rounded-[10px] px-3.5 py-2.5">
                    <Package size={15} className="text-[#C96A3D]" />
                    <span className="text-sm text-[#44403C]">
                      {room.furnished ? 'Có nội thất' : 'Không nội thất'}
                    </span>
                  </div>
                )}
                {room.availableFrom && (
                  <div className="flex items-center gap-2 bg-[#F5F0EC] rounded-[10px] px-3.5 py-2.5">
                    <CalendarDays size={15} className="text-[#C96A3D]" />
                    <span className="text-sm text-[#44403C]">Vào ở từ: <span className="font-medium">{formatDate(room.availableFrom)}</span></span>
                  </div>
                )}
              </div>
            )}

            {/* Furnishing detail */}
            {room.furnished && room.furnishingDetail && (
              <div className="bg-[#FAF6EF] rounded-[12px] p-4">
                <p className="text-sm font-semibold text-[#292524] mb-1">Chi tiết nội thất</p>
                <p className="text-sm text-[#57534E]">{room.furnishingDetail}</p>
              </div>
            )}

            {/* Description */}
            {room.description && (
              <div>
                <h2 className="text-base font-semibold text-[#292524] mb-2 font-display">Mô tả</h2>
                <p className="text-sm text-[#57534E] leading-relaxed whitespace-pre-line">{room.description}</p>
              </div>
            )}

            {/* Amenities */}
            {room.amenities && room.amenities.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-[#292524] mb-3 font-display">Tiện ích</h2>
                <div className="flex flex-wrap gap-2">
                  {room.amenities.map((a) => (
                    <span key={a.id} className="flex items-center gap-1.5 bg-[#F3E7D3] text-[#5B4636] text-sm px-3 py-1.5 rounded-full">
                      <Wifi size={13} />{a.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Reviews */}
            {reviews.length > 0 && (
              <div>
                <h2 className="text-base font-semibold text-[#292524] mb-4 font-display">Đánh giá ({reviews.length})</h2>
                <div className="space-y-4">
                  {reviews.map((r) => (
                    <div key={r.id} className="flex gap-3">
                      <Avatar src={r.avatarUrl} name={r.userName} size="sm" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-[#292524]">{r.userName || 'Người dùng ẩn danh'}</p>
                          <span className="text-xs text-[#A8A29E]">{formatDate(r.createdAt)}</span>
                        </div>
                        <div className="flex gap-0.5 mt-0.5 mb-1">
                          {Array.from({ length: 5 }).map((_, i) => (
                            <Star key={i} size={12} className={i < r.rating ? 'text-[#D4A373] fill-[#D4A373]' : 'text-[#E7E5E4]'} />
                          ))}
                        </div>
                        {r.comment && <p className="text-sm text-[#57534E]">{r.comment}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right – booking card */}
          <div>
            <div className="sticky top-24 bg-white rounded-[16px] border border-[#E7E5E4] shadow-[0_4px_16px_-2px_rgb(0_0_0/0.10)] overflow-hidden">
              {/* Price header */}
              <div className="bg-gradient-to-br from-[#C96A3D] to-[#B85C31] p-5 text-white">
                <p className="text-2xl font-bold font-display">{formatCurrency(room.price)}<span className="text-sm font-normal opacity-80 ml-1">đ/tháng</span></p>
                {room.depositAmount && (
                  <p className="text-sm opacity-80 mt-0.5">Cọc: {formatCurrency(room.depositAmount)}</p>
                )}
              </div>

              <div className="p-5 space-y-3">
                {isAvailable ? (
                  <>
                    {isLoggedIn && user ? (
                      <Button className="w-full" onClick={() => setBookingOpen(true)}>
                        Gửi yêu cầu thuê phòng
                      </Button>
                    ) : (
                      <Button className="w-full" onClick={() => navigate('/login')}>
                        Đăng nhập để đặt phòng
                      </Button>
                    )}
                    {room.landlordId && isLoggedIn && (
                      <Link to={`/messages?userId=${room.landlordId}`}>
                        <Button variant="outline" size="md" className="w-full" leftIcon={<MessageSquare size={16} />}>
                          Nhắn tin chủ trọ
                        </Button>
                      </Link>
                    )}
                  </>
                ) : (
                  <div className="bg-[#F5F5F4] rounded-[10px] p-3 text-center text-sm text-[#78716C]">
                    Phòng hiện đang được thuê
                  </div>
                )}

                {/* Info list */}
                <div className="border-t border-[#F5F5F4] pt-4 space-y-2.5 text-sm">
                  {room.roomType && (
                    <div className="flex justify-between">
                      <span className="text-[#78716C] flex items-center gap-1.5"><Home size={13} /> Loại phòng</span>
                      <span className="font-medium text-[#292524]">{ROOM_TYPE_LABEL[room.roomType] || room.roomType}</span>
                    </div>
                  )}
                  {room.area && (
                    <div className="flex justify-between">
                      <span className="text-[#78716C] flex items-center gap-1.5"><BedDouble size={13} /> Diện tích</span>
                      <span className="font-medium text-[#292524]">{room.area}m²</span>
                    </div>
                  )}
                  {(room.maxOccupants || room.maxTenants) && (
                    <div className="flex justify-between">
                      <span className="text-[#78716C] flex items-center gap-1.5"><Users size={13} /> Tối đa</span>
                      <span className="font-medium text-[#292524]">{room.maxOccupants || room.maxTenants} người</span>
                    </div>
                  )}
                  {room.genderAllowed && (
                    <div className="flex justify-between">
                      <span className="text-[#78716C] flex items-center gap-1.5"><UserCheck size={13} /> Giới tính</span>
                      <span className="font-medium text-[#292524]">{GENDER_LABEL[room.genderAllowed?.toUpperCase()] || room.genderAllowed}</span>
                    </div>
                  )}
                  {room.availableFrom && (
                    <div className="flex justify-between">
                      <span className="text-[#78716C] flex items-center gap-1.5"><CalendarDays size={13} /> Vào ở từ</span>
                      <span className="font-medium text-[#292524]">{formatDate(room.availableFrom)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-1 border-t border-[#F5F5F4]">
                    <span className="text-[#78716C]">Chủ trọ</span>
                    <span className="font-medium text-[#292524]">{room.landlordName || '—'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking modal */}
      <Modal
        open={bookingOpen}
        onClose={() => setBookingOpen(false)}
        title="Gửi yêu cầu thuê phòng"
        description={`Phòng: ${room.title}`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setBookingOpen(false)}>Hủy</Button>
            <Button onClick={() => createBooking()} loading={bookingLoading}>Gửi yêu cầu</Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#44403C] block mb-1.5">Ngày dự kiến chuyển vào</label>
            <input
              type="date"
              value={moveInDate}
              min={new Date().toISOString().split('T')[0]}
              onChange={(e) => setMoveInDate(e.target.value)}
              className="w-full h-10 rounded-[10px] border border-[#D6D3D1] px-3 text-sm text-[#292524] focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30 focus:border-[#C96A3D]"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#44403C] block mb-1.5">Tin nhắn cho chủ trọ (không bắt buộc)</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={3}
              placeholder="Giới thiệu bản thân hoặc câu hỏi..."
              className="w-full rounded-[10px] border border-[#D6D3D1] px-3 py-2.5 text-sm text-[#292524] placeholder:text-[#A8A29E] focus:outline-none focus:ring-2 focus:ring-[#C96A3D]/30 focus:border-[#C96A3D] resize-none"
            />
          </div>
        </div>
      </Modal>
    </PublicLayout>
  )
}
