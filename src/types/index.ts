// ─── Auth ────────────────────────────────────────────────────────────────────

export interface User {
    id: number
    fullName: string
    email: string
    phone?: string
    avatarUrl?: string
    roleCode: string
    roleName?: string
    bankName?: string
    vietQrBankId?: string
    bankAccountNumber?: string
    bankAccountNo?: string
    bankAccountName?: string
    vietQrTemplate?: string
    sepayApiKey?: string
    createdAt?: string
    updatedAt?: string
    isActive?: boolean
    status?: string
    isVerified?: boolean
    gender?: string
    dateOfBirth?: string
    address?: string
    hometown?: string
}

export interface AuthState {
    token: string | null
    user: User | null
    isLoggedIn: boolean
}

export interface LoginPayload {
    account: string
    password: string
}

export interface RegisterPayload {
    fullName: string
    email: string
    phone: string
    password: string
}

export interface LoginResponse {
    token: string
    expiresAt: string
    user: User
}

// ─── Address ─────────────────────────────────────────────────────────────────

export interface Province {
    id: number
    code: string
    name: string
}

export interface District {
    id: number
    code: string
    name: string
    provinceId: number
    provinceCode?: string
    provinceName?: string
}

export interface Ward {
    id: number
    code: string
    name: string
    districtId: number
    provinceId?: number
    districtCode?: string
    districtName?: string
    provinceName?: string
    fullName?: string
}

// ─── Rental ──────────────────────────────────────────────────────────────────

export interface Amenity {
    id: number
    name: string
    icon?: string
}

export interface RoomImage {
    id: number
    imageUrl: string
}

export interface Property {
    id: number
    name: string
    address?: string
    addressLine?: string
    fullAddress?: string
    provinceId?: number
    districtId?: number
    wardId?: number
    provinceCode?: string
    districtCode?: string
    wardCode?: string
    provinceName?: string
    districtName?: string
    wardName?: string
    description?: string
    landlordId: number
    createdAt: string
    updatedAt?: string
    latitude?: number
    longitude?: number
    roomCount?: number
    status?: string
}

export interface Room {
    id: number
    title: string
    description?: string
    price: number
    area?: number
    maxOccupants?: number
    maxTenants?: number
    propertyId?: number
    propertyName?: string
    address?: string
    addressLine?: string
    fullAddress?: string
    provinceId?: number
    provinceName?: string
    districtId?: number
    districtName?: string
    wardId?: number
    wardName?: string
    status: string
    moderationStatus?: string
    moderationNote?: string
    approvalStatus?: string
    landlordId?: number
    landlordName?: string
    amenities?: Amenity[]
    images?: RoomImage[]
    averageRating?: number
    reviewCount?: number
    roomAverageRating?: number
    roomReviewCount?: number
    landlordAverageRating?: number
    landlordReviewCount?: number
    depositAmount?: number
    roomCode?: string
    roomType?: string
    electricPrice?: number
    waterPrice?: number
    servicePrice?: number
    genderAllowed?: string
    furnished?: boolean
    furnishingDetail?: string
    availableFrom?: string
    customAmenities?: string[]
    createdAt?: string
    updatedAt?: string
}

export interface RoomFilters {
    search?: string
    q?: string
    provinceId?: number
    districtId?: number
    wardId?: number
    provinceCode?: string
    districtCode?: string
    wardCode?: string
    minPrice?: number
    maxPrice?: number
    minArea?: number
    maxArea?: number
    roomType?: string
    genderAllowed?: string
    amenityIds?: number[]
    status?: string
    page?: number
    pageSize?: number
}

// ─── Booking ─────────────────────────────────────────────────────────────────

export type BookingStatus = string

export interface BookingRequest {
    id: number
    bookingCode?: string
    requestType?: string
    roomId: number
    roomTitle?: string
    roomImageUrl?: string
    roomStatus?: string
    propertyName?: string
    fullAddress?: string
    roomAddress?: string
    tenantId: number
    tenantName?: string
    tenantEmail?: string
    tenantPhone?: string
    tenantAvatarUrl?: string
    landlordId?: number
    landlordName?: string
    message?: string
    status: BookingStatus
    appointmentAt?: string
    moveInDate?: string
    monthsToRent?: number
    createdAt: string
    confirmedAt?: string
    canceledAt?: string
    note?: string
}

// ─── Contract ────────────────────────────────────────────────────────────────

export type ContractStatus = string

export interface RentalContract {
    id: number
    bookingRequestId?: number
    bookingCode?: string
    contractCode?: string
    roomId: number
    roomTitle?: string
    propertyName?: string
    fullAddress?: string
    roomStatus?: string
    tenantId: number
    tenantName?: string
    tenantEmail?: string
    tenantPhone?: string
    tenantAvatarUrl?: string
    landlordId?: number
    landlordName?: string
    landlordEmail?: string
    landlordPhone?: string
    contractTitle?: string
    onlineContractContent?: string
    startDate: string
    endDate: string
    monthlyRent: number
    depositAmount?: number
    status: ContractStatus
    terms?: string
    landlordFileUrl?: string
    tenantFileUrl?: string
    landlordSignedFileUrl?: string
    tenantSignedFileUrl?: string
    hasLandlordSignedFile?: boolean
    hasTenantSignedFile?: boolean
    terminatedAt?: string
    terminatedBy?: string
    terminationReason?: string
    createdAt?: string
    updatedAt?: string
    notes?: string
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export type PaymentStatus = string
export type PaymentType = string

export interface RentPaymentDetail {
    id: number
    paymentId: number
    baseRent: number
    baseRentFormatted: string
    electricityUsage?: number
    electricityRate?: number
    electricityAmount: number
    electricityFormatted: string
    waterUsage?: number
    waterRate?: number
    waterAmount: number
    waterFormatted: string
    otherFees: number
    otherFeesFormatted: string
    totalAmount: number
    totalAmountFormatted: string
    notes?: string
    createdAt: string
}

export interface Payment {
    id: number
    paymentCode: string
    type?: PaymentType
    paymentType?: PaymentType
    amount: number
    status: PaymentStatus
    description?: string
    qrCodeUrl?: string
    qrImageUrl?: string
    qrUrl?: string
    qrDataUrl?: string
    qrContent?: string
    transferProofImageUrl?: string
    payerId?: number
    payerName?: string
    payeeId?: number
    payeeName?: string
    payeeUserId?: number
    payeeUserName?: string
    tenantName?: string
    landlordName?: string
    roomId?: number
    roomTitle?: string
    contractId?: number
    bookingRequestId?: number
    bookingCode?: string
    bookingStatus?: string
    propertyName?: string
    paymentMethod?: string
    provider?: string
    bankCode?: string
    bankAccountNo?: string
    accountName?: string
    billingYear?: number
    billingMonth?: number
    commissionRate?: number
    commissionAmount?: number
    netAmount?: number
    transactionRef?: string
    createdAt: string
    paidAt?: string
    proofSubmittedAt?: string
    expiredAt?: string
    dueDate?: string
    updatedAt?: string
    rentPaymentDetail?: RentPaymentDetail
}

export interface CommissionBilling {
    id: number
    landlordId: number
    landlordName: string
    landlordEmail?: string
    landlordPhone?: string
    grossRevenue?: number
    totalGrossRevenue?: number
    totalRevenue?: number
    commissionRate?: number
    commissionAmount: number
    amount: number
    isPaid: boolean
    status: string
    paymentCode?: string
    latestPaymentCode?: string
    billingCode?: string
    billingMonth?: string
    billingYear?: number
    period?: string
    dueDate?: string
    createdAt?: string
    paidAt?: string
}

// ─── Admin Landlords ─────────────────────────────────────────────────────────

export interface AdminLandlord {
    id: number
    fullName: string
    email?: string
    phone?: string
    status: string
    isVerified: boolean
    hasPaymentConfig: boolean
    propertyCount: number
    roomCount: number
    activeTenantCount: number
    totalGrossRevenue: number
    thisMonthGrossRevenue: number
    latestCommissionPaymentCode?: string
    latestCommissionPaymentStatus?: string
    latestCommissionPaymentCreatedAt?: string
    latestCommissionPaymentPaidAt?: string
    createdAt: string
    updatedAt?: string
}

export interface AdminLandlordDetail extends AdminLandlord {
    address?: string
    hometown?: string
    vietQrBankId?: string
    bankAccountNo?: string
    bankAccountName?: string
    properties: AdminLandlordProperty[]
}

export interface AdminLandlordProperty {
    id: number
    name: string
    description?: string
    status: string
    addressLine: string
    provinceName?: string
    districtName?: string
    wardName?: string
    fullAddress?: string
    roomCount: number
    activeTenantCount: number
    createdAt: string
    updatedAt?: string
    rooms: AdminLandlordRoom[]
}

export interface AdminLandlordRoom {
    id: number
    propertyId: number
    title: string
    roomCode: string
    roomType?: string
    price: number
    maxTenants: number
    status: string
    approvalStatus: string
    activeTenantCount: number
    tenants: AdminLandlordTenant[]
}

export interface AdminLandlordTenant {
    tenantId: number
    tenantName: string
    tenantEmail?: string
    tenantPhone?: string
    bookingRequestId: number
    bookingCode: string
    contractId?: number
    contractCode?: string
    contractStatus?: string
    moveInDate?: string
    confirmedAt?: string
    monthlyRent: number
}

// ─── Notification ────────────────────────────────────────────────────────────

export type NotificationType =
    | 'BOOKING_CREATED'
    | 'BOOKING_APPROVED'
    | 'BOOKING_REJECTED'
    | 'CONTRACT_CREATED'
    | 'PAYMENT_CONFIRMED'
    | 'PAYMENT_SUBMITTED'
    | 'LANDLORD_APPLICATION_APPROVED'
    | 'LANDLORD_APPLICATION_REJECTED'
    | 'ANNOUNCEMENT'
    | 'SYSTEM'

export interface Notification {
    id: number
    userId?: number
    title: string
    body?: string
    content?: string
    type?: NotificationType | string
    isRead: boolean
    relatedId?: number
    createdAt: string
}

// ─── Message ─────────────────────────────────────────────────────────────────

export interface Message {
    id: number
    senderId: number
    senderName?: string
    senderAvatarUrl?: string
    senderRoleCode?: string
    receiverId: number
    receiverName?: string
    receiverAvatarUrl?: string
    receiverRoleCode?: string
    content: string
    isRead: boolean
    readAt?: string
    createdAt: string
    sentAt?: string
}

export interface Conversation {
    otherUserId: number
    otherUserName: string
    otherUserAvatarUrl?: string
    otherUserAvatar?: string
    otherUserRoleCode?: string
    otherUserRoleName?: string
    lastMessage?: string
    lastMessageAt?: string
    lastMessageSenderId?: number
    unreadCount: number
}

// ─── LandlordApplication ─────────────────────────────────────────────────────

export type ApplicationStatus = string

export interface LandlordApplication {
    id: number
    userId: number
    userName?: string
    userEmail?: string
    status: ApplicationStatus
    note?: string
    reviewedAt?: string
    createdAt: string
    documents?: ApplicationDocument[]
    feePaymentCode?: string
    feePaymentStatus?: PaymentStatus
    userFullName?: string
    applicantName?: string
    applicantEmail?: string
    applicantPhone?: string
    businessAddress?: string
    identityNumber?: string
    description?: string
    reviewedByName?: string
    rejectReason?: string
    isPaid?: boolean
    registrationFeeAmount?: number
    registrationFeePaymentCode?: string
    registrationFeePaymentStatus?: string
    registrationFeePaidAt?: string
    registrationFeeExpiredAt?: string
    registrationFeeProofImageUrl?: string
    registrationFeeProofSubmittedAt?: string
    updatedAt?: string
}

export interface ApplicationDocument {
    id?: number
    documentUrl?: string
    documentType?: string
    filePath?: string
    fileName?: string
}

// ─── Admin Dashboard ─────────────────────────────────────────────────────────

export interface AdminDashboardStats {
    totalUsers: number
    totalRooms: number
    totalContracts?: number
    totalRevenue?: number
    pendingApplications?: number
    pendingBookings?: number
    activeContracts?: number
    pendingRooms?: number
    monthlyRevenue?: number
    monthlyCommission?: number
}

// ─── Announcement ────────────────────────────────────────────────────────────

export interface Announcement {
    id: number
    title: string
    content: string
    targetRole?: string
    createdBy?: number
    createdAt: string
}

// ─── System Config ───────────────────────────────────────────────────────────

export interface SystemConfig {
    commissionRate?: number
    expireMinutes?: number
    paymentDeadlineDays?: number
    bankName?: string
    bankAccountNumber?: string
    bankAccountName?: string
    registrationFee?: number
}

// ─── Pagination / generic response ───────────────────────────────────────────

export interface PaginatedResponse<T> {
    items: T[]
    totalCount: number
    page: number
    pageSize: number
    totalPages: number
}

export interface ApiError {
    message: string
    errors?: Record<string, string[]>
}

// ─── Review ──────────────────────────────────────────────────────────────────

export interface RoomReview {
    id: number
    roomId: number
    userId: number
    userName?: string
    avatarUrl?: string
    rating: number
    comment?: string
    createdAt: string
}

// ─── Landlord tenants ────────────────────────────────────────────────────────

export interface TenantInfo {
    userId: number
    tenantId?: number
    fullName: string
    tenantName?: string
    email: string
    tenantEmail?: string
    phone?: string
    tenantPhone?: string
    avatarUrl?: string
    tenantAvatarUrl?: string
    roomId: number
    roomTitle?: string
    propertyName?: string
    fullAddress?: string
    roomStatus?: string
    electricPrice?: number
    waterPrice?: number
    servicePrice?: number
    bookingRequestId?: number
    bookingCode?: string
    moveInDate?: string
    monthsToRent?: number
    requestedAt?: string
    confirmedAt?: string
    monthlyRent?: number
    contractId?: number
    contractCode?: string
    contractStatus?: string
    hasContract?: boolean
    hasLandlordSignedFile?: boolean
    hasTenantSignedFile?: boolean
    latestRentPaymentCode?: string
    latestRentPaymentStatus?: string
    latestRentPaymentAmount?: number
    latestRentPaymentCreatedAt?: string
    latestRentPaymentPaidAt?: string
    latestRentPaymentExpiredAt?: string
    startDate?: string
    endDate?: string
}
