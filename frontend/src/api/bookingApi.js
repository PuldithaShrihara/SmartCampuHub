import { apiPostAuth, apiGetAuth } from './client.js'

export async function createBooking(data) {
    return apiPostAuth('/api/bookings', data)
}

export async function getMyBookings() {
    return apiGetAuth('/api/bookings/my')
}
