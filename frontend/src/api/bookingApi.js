import { apiPostAuth } from './client.js'

export async function createBooking(data) {
    return apiPostAuth('/api/bookings', data)
}
