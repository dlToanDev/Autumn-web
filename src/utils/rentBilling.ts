import type { Payment, RentalContract } from '@/types'

const MONTHLY_RENT_DUE_DAY = 5

export function getCurrentRentBillingPeriod(date = new Date()) {
    const year = date.getFullYear()
    const month = date.getMonth() + 1
    return {
        year,
        month,
        key: getRentBillingKey(year, month),
        label: formatRentBillingLabel(year, month),
        dueDate: getRentDueDate(year, month),
    }
}

export function getRentBillingKey(year: number, month: number) {
    return `${year}-${String(month).padStart(2, '0')}`
}

export function formatRentBillingLabel(year: number, month: number) {
    return `tháng ${String(month).padStart(2, '0')}/${year}`
}

export function getRentDueDate(year: number, month: number, dueDay = MONTHLY_RENT_DUE_DAY) {
    const safeDay = Math.min(dueDay, new Date(year, month, 0).getDate())
    return new Date(year, month - 1, safeDay, 23, 59, 59, 999)
}

export function isDueDatePassed(dueDate: Date, date = new Date()) {
    return date.getTime() > new Date(dueDate).getTime()
}

export function isRentPaymentSuccess(status?: string | null) {
    const n = String(status || '').toLowerCase()
    return n === 'success' || n === 'paid' || n === 'confirmed'
}

export function mapBillingPaymentsByBooking(payments: Payment[], year: number, month: number): Map<number, Payment> {
    const grouped = new Map<number, Payment>()
    payments
        .filter(
            (p) =>
                String(p.paymentType || '').toLowerCase() === 'rent' &&
                Number(p.bookingRequestId) > 0 &&
                Number(p.billingYear) === Number(year) &&
                Number(p.billingMonth) === Number(month),
        )
        .forEach((p) => {
            const id = Number(p.bookingRequestId)
            const current = grouped.get(id)
            if (!current || new Date(p.createdAt || 0) > new Date(current.createdAt || 0)) {
                grouped.set(id, p)
            }
        })
    return grouped
}

export function isContractActiveForBillingPeriod(contract: RentalContract, year: number, month: number) {
    const monthStart = new Date(year, month - 1, 1)
    const nextMonthStart = new Date(year, month, 1)
    const startDate = new Date(contract.startDate)
    const endDate = new Date(contract.endDate)
    return startDate < nextMonthStart && endDate >= monthStart
}
