import { useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, SlidersHorizontal, MapPin, BedDouble, Star, X, Heart, User, ChevronDown } from 'lucide-react'
import PublicLayout from '@/components/layout/PublicLayout'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Pagination from '@/components/ui/Pagination'
import { PageLoader, EmptyState } from '@/components/ui/Skeleton'
import { rentalApi } from '@/api/rentalApi'
import { addressApi } from '@/api/addressApi'
import { formatCurrency } from '@/lib/utils'
import type { Room, RoomFilters } from '@/types'

const ROOM_TYPES = [
  { value: '', label: 'Tất cả loại phòng' },
  { value: 'PHONG_TRO', label: 'Phòng trọ' },
  { value: 'PHONG_GHEP', label: 'Phòng ở ghép' },
  { value: 'CAN_HO_MINI', label: 'Căn hộ mini' },
  { value: 'STUDIO', label: 'Studio' },
  { value: 'CAN_HO', label: 'Căn hộ' },
  { value: 'NHA_NGUYEN_CAN', label: 'Nhà nguyên căn' },
]

const GENDER_OPTIONS = [
  { value: '', label: 'Tất cả' },
  { value: 'ALL', label: 'Đủ giới tính' },
  { value: 'MALE', label: 'Nam' },
  { value: 'FEMALE', label: 'Nữ' },
]

const PRICE_PRESETS = [
  { label: 'Dưới 2 triệu', min: undefined, max: 2_000_000 },
  { label: '2 – 4 triệu', min: 2_000_000, max: 4_000_000 },
  { label: '4 – 7 triệu', min: 4_000_000, max: 7_000_000 },
  { label: 'Trên 7 triệu', min: 7_000_000, max: undefined },
]

const ROOM_TYPE_LABEL: Record<string, string> = {
  PHONG_TRO: 'Phòng trọ', PHONG_GHEP: 'Phòng ghép', CAN_HO_MINI: 'Căn hộ mini',
  STUDIO: 'Studio', CAN_HO: 'Căn hộ', NHA_NGUYEN_CAN: 'Nhà nguyên căn',
}

function RoomCard({ room }: { room: Room }) {
  const navigate = useNavigate()
  const cover = room.images?.find((i) => (i as any).isThumbnail)?.imageUrl || room.images?.[0]?.imageUrl || '/placeholder-room.jpg'
  const [liked, setLiked] = useState(false)
  const isAvailable = room.status?.toUpperCase() === 'AVAILABLE'

  return (
    <div
      onClick={() => navigate(`/rooms/${room.id}`)}
      className="bg-white rounded-[16px] border border-[#E7E5E4] overflow-hidden cursor-pointer
        shadow-[0_1px_3px_0_rgb(0_0_0/0.06)]
        hover:shadow-[0_8px_24px_-4px_rgb(0_0_0/0.12)] hover:-translate-y-0.5
        transition-all duration-200 group flex flex-row h-[160px] sm:h-[176px]"
    >
      {/* Image */}
      <div className="relative w-[200px] sm:w-[240px] shrink-0 overflow-hidden bg-[#F3E7D3]">
        <img
          src={cover}
          alt={room.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        {/* Status badge */}
        <span className={`absolute top-2.5 left-2.5 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
          isAvailable ? 'bg-emerald-500 text-white' : 'bg-[#78716C] text-white'
        }`}>
          {isAvailable ? 'Còn phòng' : 'Hết phòng'}
        </span>
        {/* Heart */}
        <button
          onClick={(e) => { e.stopPropagation(); setLiked((l) => !l) }}
          className="absolute top-2 right-2 w-7 h-7 rounded-full bg-white/90 backdrop-blur-sm
            flex items-center justify-center hover:bg-white transition-colors shadow-sm z-10"
        >
          <Heart size={13} className={liked ? 'fill-red-500 text-red-500' : 'text-[#78716C]'} />
        </button>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 p-3.5 min-w-0">
        {/* Title row */}
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-[#1C1917] text-sm font-display line-clamp-2 leading-snug flex-1">
            {room.title}
          </h3>
          {room.roomType && (
            <span className="text-[10px] bg-[#F3E7D3] text-[#5B4636] px-2 py-0.5 rounded-full shrink-0 font-medium">
              {ROOM_TYPE_LABEL[room.roomType] || room.roomType}
            </span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center gap-1 text-[#78716C] text-xs mb-1.5">
          <MapPin size={10} className="shrink-0 text-[#A8A29E]" />
          <span className="line-clamp-1">
            {[room.wardName, room.districtName, room.provinceName].filter(Boolean).join(', ')}
          </span>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-[#78716C] mb-2">
          {room.area && (
            <span className="flex items-center gap-0.5">
              <BedDouble size={11} className="text-[#A8A29E]" />
              {room.area}m²
            </span>
          )}
          {room.maxOccupants && (
            <span className="flex items-center gap-0.5">
              <User size={11} className="text-[#A8A29E]" />
              {room.maxOccupants} người
            </span>
          )}
          {(room.averageRating ?? 0) > 0 && (
            <span className="flex items-center gap-0.5">
              <Star size={11} className="text-[#D4A373] fill-[#D4A373]" />
              <span className="font-semibold text-[#292524]">{room.averageRating!.toFixed(1)}</span>
              {(room.reviewCount ?? 0) > 0 && <span className="text-[#A8A29E]">({room.reviewCount})</span>}
            </span>
          )}
        </div>

        {/* Amenities */}
        {room.amenities && room.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-auto">
            {room.amenities.slice(0, 4).map((a) => (
              <span key={a.id} className="text-[10px] bg-[#F5F0EC] text-[#78716C] px-2 py-0.5 rounded-full">{a.name}</span>
            ))}
            {room.amenities.length > 4 && (
              <span className="text-[10px] bg-[#F5F0EC] text-[#78716C] px-2 py-0.5 rounded-full">+{room.amenities.length - 4}</span>
            )}
          </div>
        )}

        {/* Price + landlord */}
        <div className="flex items-end justify-between mt-auto pt-2 border-t border-[#F5F0EC]">
          <div>
            <span className="text-base font-bold text-[#C96A3D]">{formatCurrency(room.price)}</span>
            <span className="text-xs text-[#A8A29E] ml-0.5">đ/tháng</span>
          </div>
          {room.landlordName && (
            <span className="text-xs text-[#78716C]">
              <span className="font-medium text-[#44403C]">{room.landlordName}</span>
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

const PAGE_SIZE = 12

export default function RoomSearchPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [page, setPage] = useState(1)

  const [filters, setFilters] = useState<RoomFilters>({
    search: searchParams.get('search') || '',
    provinceCode: searchParams.get('provinceCode') || '',
    districtCode: '',
    wardCode: '',
    minPrice: undefined,
    maxPrice: undefined,
    minArea: undefined,
    maxArea: undefined,
    roomType: '',
    genderAllowed: '',
  })

  const { data: rooms = [], isLoading } = useQuery({
    queryKey: ['rooms', filters, page],
    queryFn: () => rentalApi.getRooms({ ...filters, page, pageSize: PAGE_SIZE, status: 'AVAILABLE' }),
  })

  const { data: provinces = [] } = useQuery({ queryKey: ['provinces'], queryFn: addressApi.getProvinces })
  const { data: districts = [] } = useQuery({
    queryKey: ['districts', filters.provinceCode],
    queryFn: () => addressApi.getDistricts(filters.provinceCode),
    enabled: !!filters.provinceCode,
  })
  const { data: wards = [] } = useQuery({
    queryKey: ['wards', filters.districtCode],
    queryFn: () => addressApi.getWards(filters.districtCode),
    enabled: !!filters.districtCode,
  })

  const applyFilters = () => {
    setPage(1)
    const p: Record<string, string> = {}
    if (filters.search) p.search = filters.search
    if (filters.provinceCode) p.provinceCode = filters.provinceCode
    setSearchParams(p)
  }

  const clearFilters = () => {
    setFilters({ search: '', provinceCode: '', districtCode: '', wardCode: '', roomType: '', genderAllowed: '' })
    setSearchParams({})
    setPage(1)
  }

  const applyPricePreset = (min?: number, max?: number) => {
    setFilters((p) => ({ ...p, minPrice: min, maxPrice: max }))
  }

  const hasActiveFilters = !!(
    filters.search || filters.provinceCode || filters.districtCode || filters.wardCode ||
    filters.minPrice || filters.maxPrice || filters.minArea || filters.maxArea ||
    filters.roomType || filters.genderAllowed
  )

  return (
    <PublicLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-display font-bold text-[#292524]">Tìm phòng trọ</h1>
          <p className="text-sm text-[#78716C] mt-1">Tìm kiếm và lọc phòng trọ theo nhu cầu của bạn</p>
        </div>

        {/* Search bar */}
        <div className="bg-white rounded-[14px] border border-[#E7E5E4] p-4 mb-4 flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2 flex-1 border border-[#D6D3D1] rounded-[10px] px-3 h-10">
            <Search size={16} className="text-[#A8A29E] shrink-0" />
            <input
              type="text"
              value={filters.search}
              onChange={(e) => setFilters((p) => ({ ...p, search: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && applyFilters()}
              placeholder="Tên phòng, địa chỉ, khu vực..."
              className="flex-1 text-sm outline-none text-[#292524] placeholder:text-[#A8A29E] bg-transparent"
            />
          </div>

          <select
            value={filters.provinceCode}
            onChange={(e) => setFilters((p) => ({ ...p, provinceCode: e.target.value, districtCode: '', wardCode: '' }))}
            className="sm:w-48 h-10 border border-[#D6D3D1] rounded-[10px] px-3 text-sm text-[#292524] outline-none focus:ring-2 focus:ring-[#C96A3D]/30 focus:border-[#C96A3D]"
          >
            <option value="">Tất cả tỉnh thành</option>
            {provinces.map((p) => <option key={p.code} value={p.code}>{p.name}</option>)}
          </select>

          <div className="flex gap-2">
            <Button onClick={applyFilters} size="md">
              <Search size={16} />
              <span className="hidden sm:inline ml-1">Tìm kiếm</span>
            </Button>
            <Button
              variant={showFilters ? 'primary' : 'outline'}
              onClick={() => setShowFilters((p) => !p)}
              size="md"
              title="Bộ lọc nâng cao"
            >
              <SlidersHorizontal size={16} />
              <ChevronDown size={13} className={`transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </Button>
            {hasActiveFilters && (
              <Button variant="ghost" onClick={clearFilters} size="md" title="Xóa bộ lọc">
                <X size={16} />
              </Button>
            )}
          </div>
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="bg-white rounded-[14px] border border-[#E7E5E4] p-5 mb-5 space-y-5">
            {/* Location row */}
            <div>
              <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wide mb-3">Vị trí</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Select
                  label="Quận / Huyện"
                  value={filters.districtCode}
                  onChange={(e) => setFilters((p) => ({ ...p, districtCode: e.target.value, wardCode: '' }))}
                  disabled={!filters.provinceCode}
                >
                  <option value="">Tất cả quận/huyện</option>
                  {districts.map((d) => <option key={d.code} value={d.code}>{d.name}</option>)}
                </Select>
                <Select
                  label="Phường / Xã"
                  value={filters.wardCode}
                  onChange={(e) => setFilters((p) => ({ ...p, wardCode: e.target.value }))}
                  disabled={!filters.districtCode}
                >
                  <option value="">Tất cả phường/xã</option>
                  {wards.map((w) => <option key={w.code} value={w.code}>{w.name}</option>)}
                </Select>
              </div>
            </div>

            {/* Price row */}
            <div>
              <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wide mb-3">Giá thuê</p>
              {/* Quick presets */}
              <div className="flex flex-wrap gap-2 mb-3">
                {PRICE_PRESETS.map((preset) => {
                  const active = filters.minPrice === preset.min && filters.maxPrice === preset.max
                  return (
                    <button
                      key={preset.label}
                      onClick={() => applyPricePreset(active ? undefined : preset.min, active ? undefined : preset.max)}
                      className={`text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                        active
                          ? 'bg-[#C96A3D] text-white border-[#C96A3D]'
                          : 'bg-white text-[#44403C] border-[#D6D3D1] hover:border-[#C96A3D] hover:text-[#C96A3D]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  )
                })}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Giá tối thiểu (VNĐ)"
                  type="number"
                  placeholder="vd: 2000000"
                  value={filters.minPrice || ''}
                  onChange={(e) => setFilters((p) => ({ ...p, minPrice: e.target.value ? Number(e.target.value) : undefined }))}
                />
                <Input
                  label="Giá tối đa (VNĐ)"
                  type="number"
                  placeholder="vd: 5000000"
                  value={filters.maxPrice || ''}
                  onChange={(e) => setFilters((p) => ({ ...p, maxPrice: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
            </div>

            {/* Details row */}
            <div>
              <p className="text-xs font-semibold text-[#78716C] uppercase tracking-wide mb-3">Chi tiết phòng</p>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <Select
                  label="Loại phòng"
                  value={filters.roomType}
                  onChange={(e) => setFilters((p) => ({ ...p, roomType: e.target.value }))}
                >
                  {ROOM_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </Select>
                <Select
                  label="Giới tính"
                  value={filters.genderAllowed}
                  onChange={(e) => setFilters((p) => ({ ...p, genderAllowed: e.target.value }))}
                >
                  {GENDER_OPTIONS.map((g) => <option key={g.value} value={g.value}>{g.label}</option>)}
                </Select>
                <Input
                  label="Diện tích tối thiểu (m²)"
                  type="number"
                  placeholder="vd: 15"
                  value={filters.minArea || ''}
                  onChange={(e) => setFilters((p) => ({ ...p, minArea: e.target.value ? Number(e.target.value) : undefined }))}
                />
                <Input
                  label="Diện tích tối đa (m²)"
                  type="number"
                  placeholder="vd: 40"
                  value={filters.maxArea || ''}
                  onChange={(e) => setFilters((p) => ({ ...p, maxArea: e.target.value ? Number(e.target.value) : undefined }))}
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-[#F5F0EC]">
              <Button variant="ghost" size="sm" onClick={clearFilters}>Xóa tất cả</Button>
              <Button size="sm" onClick={applyFilters}>
                <Search size={14} className="mr-1" /> Áp dụng
              </Button>
            </div>
          </div>
        )}

        {/* Active filter chips */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2 mb-4">
            {filters.roomType && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#FFF1E9] text-[#C96A3D] border border-[#F5D5C0] px-2.5 py-1 rounded-full font-medium">
                {ROOM_TYPES.find((t) => t.value === filters.roomType)?.label}
                <button onClick={() => setFilters((p) => ({ ...p, roomType: '' }))}><X size={11} /></button>
              </span>
            )}
            {filters.genderAllowed && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#FFF1E9] text-[#C96A3D] border border-[#F5D5C0] px-2.5 py-1 rounded-full font-medium">
                {GENDER_OPTIONS.find((g) => g.value === filters.genderAllowed)?.label}
                <button onClick={() => setFilters((p) => ({ ...p, genderAllowed: '' }))}><X size={11} /></button>
              </span>
            )}
            {(filters.minPrice || filters.maxPrice) && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#FFF1E9] text-[#C96A3D] border border-[#F5D5C0] px-2.5 py-1 rounded-full font-medium">
                Giá: {filters.minPrice ? formatCurrency(filters.minPrice) : '0'} – {filters.maxPrice ? formatCurrency(filters.maxPrice) : '∞'}
                <button onClick={() => setFilters((p) => ({ ...p, minPrice: undefined, maxPrice: undefined }))}><X size={11} /></button>
              </span>
            )}
            {(filters.minArea || filters.maxArea) && (
              <span className="inline-flex items-center gap-1 text-xs bg-[#FFF1E9] text-[#C96A3D] border border-[#F5D5C0] px-2.5 py-1 rounded-full font-medium">
                DT: {filters.minArea || 0}–{filters.maxArea || '∞'} m²
                <button onClick={() => setFilters((p) => ({ ...p, minArea: undefined, maxArea: undefined }))}><X size={11} /></button>
              </span>
            )}
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <PageLoader />
        ) : rooms.length === 0 ? (
          <EmptyState
            title="Không tìm thấy phòng trọ"
            description="Thử điều chỉnh bộ lọc hoặc tìm kiếm với từ khóa khác"
            icon={<BedDouble size={28} />}
            action={<Button variant="outline" onClick={clearFilters}>Xóa bộ lọc</Button>}
          />
        ) : (
          <>
            <p className="text-sm text-[#78716C] mb-4">
              Tìm thấy <span className="font-semibold text-[#292524]">{rooms.length}</span> phòng trọ phù hợp
            </p>
            <div className="flex flex-col gap-3">
              {rooms.map((room) => <RoomCard key={room.id} room={room} />)}
            </div>
            <div className="flex justify-center mt-8">
              <Pagination page={page} totalPages={Math.ceil(rooms.length / PAGE_SIZE)} onPageChange={setPage} />
            </div>
          </>
        )}
      </div>
    </PublicLayout>
  )
}
