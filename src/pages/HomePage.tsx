import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, MapPin, ArrowRight, BedDouble, Star, CheckCircle } from 'lucide-react'
import PublicLayout from '@/components/layout/PublicLayout'
import Button from '@/components/ui/Button'
import { rentalApi } from '@/api/rentalApi'
import { addressApi } from '@/api/addressApi'
import { formatCurrency } from '@/lib/utils'
import type { Room } from '@/types'

function RoomCard({ room }: { room: Room }) {
  const navigate = useNavigate()
  const cover = room.images?.[0]?.imageUrl || '/placeholder-room.jpg'

  return (
    <div
      onClick={() => navigate(`/rooms/${room.id}`)}
      className="bg-white rounded-[16px] border border-[#E7E5E4] overflow-hidden cursor-pointer
        shadow-[0_1px_3px_0_rgb(0_0_0/0.06)] hover:shadow-[0_8px_24px_-4px_rgb(0_0_0/0.12)]
        transition-all duration-200 hover:-translate-y-0.5 group"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-[#F3E7D3]">
        <img src={cover} alt={room.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        <div className="absolute top-3 left-3">
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${room.status?.toUpperCase() === 'AVAILABLE' ? 'bg-emerald-500 text-white' : 'bg-[#78716C] text-white'}`}>
            {room.status?.toUpperCase() === 'AVAILABLE' ? 'Còn phòng' : 'Hết phòng'}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-[#292524] text-sm mb-1 line-clamp-2 font-display">{room.title}</h3>
        <div className="flex items-center gap-1 text-[#78716C] text-xs mb-3">
          <MapPin size={12} className="shrink-0" />
          <span className="truncate">{[room.wardName, room.districtName, room.provinceName].filter(Boolean).join(', ')}</span>
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#C96A3D] font-bold text-base font-display">{formatCurrency(room.price)}</p>
            <p className="text-[#A8A29E] text-xs">/tháng</p>
          </div>
          <div className="flex items-center gap-3 text-xs text-[#78716C]">
            {room.area && (
              <span className="flex items-center gap-1">
                <BedDouble size={12} />
                {room.area}m²
              </span>
            )}
            {room.averageRating !== undefined && room.averageRating > 0 && (
              <span className="flex items-center gap-1">
                <Star size={12} className="text-[#D4A373] fill-[#D4A373]" />
                {room.averageRating.toFixed(1)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [searchText, setSearchText] = useState('')
  const [provinceCode, setProvinceCode] = useState('')

  const { data: rooms = [] } = useQuery({
    queryKey: ['rooms', { pageSize: 8 }],
    queryFn: () => rentalApi.getRooms({ pageSize: 8, status: 'AVAILABLE' }),
  })

  const { data: provinces = [] } = useQuery({
    queryKey: ['provinces'],
    queryFn: addressApi.getProvinces,
  })

  const handleSearch = () => {
    const params = new URLSearchParams()
    if (searchText) params.set('search', searchText)
    if (provinceCode) params.set('provinceCode', provinceCode)
    navigate(`/rooms?${params.toString()}`)
  }

  const features = [
    { icon: <Search size={20} />, title: 'Tìm kiếm thông minh', desc: 'Lọc phòng theo vị trí, giá cả, tiện ích một cách dễ dàng' },
    { icon: <CheckCircle size={20} />, title: 'Thông tin xác thực', desc: 'Tất cả phòng trọ đều được kiểm duyệt bởi đội ngũ của chúng tôi' },
    { icon: <Star size={20} />, title: 'Đánh giá thực tế', desc: 'Xem đánh giá từ người thuê trước để đưa ra quyết định đúng đắn' },
  ]

  return (
    <PublicLayout withFooter>
      {/* Hero */}
      <section className="relative overflow-hidden bg-[#FAF6EF] py-20 lg:py-28">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-[#C96A3D]/8" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-[#D4A373]/10" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-[#C96A3D]/10 text-[#C96A3D] text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-[#C96A3D] animate-pulse" />
            Nền tảng thuê phòng trọ số 1 Việt Nam
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-display font-bold text-[#292524] leading-tight mb-6 text-balance">
            Tìm phòng trọ<br />
            <span className="text-[#C96A3D]">lý tưởng</span> của bạn
          </h1>
          <p className="text-lg text-[#78716C] max-w-xl mx-auto mb-10">
            Hàng nghìn phòng trọ tại nhiều tỉnh thành. Tìm kiếm, liên hệ và thuê ngay hôm nay.
          </p>

          {/* Search bar */}
          <div className="bg-white rounded-[16px] border border-[#E7E5E4] shadow-[0_4px_24px_-4px_rgb(0_0_0/0.10)] p-3 flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
            <div className="flex items-center gap-2 flex-1 min-w-0 px-2">
              <Search size={18} className="text-[#A8A29E] shrink-0" />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Tìm theo tên phòng, địa chỉ..."
                className="flex-1 text-sm text-[#292524] placeholder:text-[#A8A29E] outline-none bg-transparent min-w-0"
              />
            </div>

            <div className="flex items-center gap-2 sm:w-48 px-2 sm:border-l border-[#E7E5E4]">
              <MapPin size={18} className="text-[#A8A29E] shrink-0" />
              <select
                value={provinceCode}
                onChange={(e) => setProvinceCode(e.target.value)}
                className="flex-1 text-sm text-[#292524] outline-none bg-transparent"
              >
                <option value="">Tất cả tỉnh thành</option>
                {provinces.map((p) => (
                  <option key={p.code} value={p.code}>{p.name}</option>
                ))}
              </select>
            </div>

            <Button onClick={handleSearch} size="md" className="shrink-0">
              Tìm kiếm
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-[#F3E7D3]/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="flex items-start gap-4 p-6 bg-white rounded-[14px] border border-[#E7E5E4] shadow-[0_1px_3px_0_rgb(0_0_0/0.06)]">
                <div className="w-10 h-10 rounded-[10px] bg-[#C96A3D]/10 text-[#C96A3D] flex items-center justify-center shrink-0">
                  {f.icon}
                </div>
                <div>
                  <h3 className="font-semibold text-[#292524] mb-1 font-display">{f.title}</h3>
                  <p className="text-sm text-[#78716C] leading-relaxed">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Room listings */}
      <section className="py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-display font-bold text-[#292524]">Phòng trọ nổi bật</h2>
              <p className="text-sm text-[#78716C] mt-1">Các phòng trọ được quan tâm nhiều nhất</p>
            </div>
            <Link
              to="/rooms"
              className="flex items-center gap-1.5 text-sm font-medium text-[#C96A3D] hover:underline"
            >
              Xem tất cả
              <ArrowRight size={16} />
            </Link>
          </div>

          {rooms.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {rooms.map((room) => (
                <RoomCard key={room.id} room={room} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 text-[#78716C] text-sm">
              Chưa có phòng trọ nào được đăng.
            </div>
          )}
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-[#2C1F14]">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-display font-bold text-white mb-4">
            Bạn là chủ trọ?
          </h2>
          <p className="text-white/70 mb-8 text-lg">
            Đăng tin phòng trọ của bạn và tiếp cận hàng nghìn người tìm thuê.
          </p>
          <Link to="/become-landlord">
            <Button variant="secondary" size="lg">
              Trở thành chủ trọ
            </Button>
          </Link>
        </div>
      </section>
    </PublicLayout>
  )
}
