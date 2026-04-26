import { apiPostAuth, apiGetAuth, apiPutAuth, apiDeleteAuth } from './client.js'

export async function createBooking(data) {
    return apiPostAuth('/api/bookings', data)
}

export async function createSpaceBooking(data) {
    return createBooking({ ...data, bookingType: 'SPACE' })
}

export async function createEquipmentBooking(data) {
    return createBooking({ ...data, bookingType: 'EQUIPMENT' })
}

export async function getMyBookings() {
    return apiGetAuth('/api/bookings/my')
}

export async function getAllBookings() {
    return apiGetAuth('/api/bookings/all')
}

export async function updateBookingStatus(bookingId, status, rejectionReason = '') {
    const res = await apiPutAuth(`/api/bookings/${bookingId}/status`, {
        status,
        rejectionReason,
    })
    if (res && typeof res === 'object' && 'data' in res) {
        return res.data
    }
    return res
}

export async function deleteBooking(bookingId) {
    return apiDeleteAuth(`/api/bookings/${bookingId}`)
}

export async function getBookingByQrToken(token) {
    const normalized = String(token || '').trim()
    if (!normalized) {
        throw new Error('QR token is required')
    }
    const res = await apiGetAuth(`/api/bookings/qr/${encodeURIComponent(normalized)}`)
    if (res && typeof res === 'object' && 'data' in res) {
        return {
            success: Boolean(res.success),
            message: String(res.message || ''),
            data: res.data ?? null,
        }
    }
    return {
        success: true,
        message: '',
        data: res ?? null,
    }
}
