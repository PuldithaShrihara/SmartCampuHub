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
    return apiPutAuth(`/api/bookings/${bookingId}/status`, {
        status,
        rejectionReason,
    })
}

export async function deleteBooking(bookingId) {
    return apiDeleteAuth(`/api/bookings/${bookingId}`)
}
