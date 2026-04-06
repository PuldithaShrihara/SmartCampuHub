import AvailabilityLegend from '../../components/booking/AvailabilityLegend.jsx'
import BookingCalendar from '../../components/booking/BookingCalendar.jsx'
import BookingGrid from '../../components/booking/BookingGrid.jsx'
import TimeSlotPicker from '../../components/booking/TimeSlotPicker.jsx'

const resources = [
  {
    id: 'LH-A',
    name: 'Lecture Hall A',
    location: 'Academic Block A',
    capacity: 120,
    status: 'Available',
  },
  {
    id: 'CL-2',
    name: 'Computer Lab 2',
    location: 'Engineering Wing',
    capacity: 45,
    status: 'Ongoing',
  },
  {
    id: 'SR-3',
    name: 'Seminar Room 3',
    location: 'Library Complex',
    capacity: 60,
    status: 'Reserved',
  },
  {
    id: 'IH-1',
    name: 'Innovation Hub',
    location: 'Tech Park',
    capacity: 80,
    status: 'Out of Service',
  },
]

export default function BookingGridViewPage() {
  return (
    <>
      <section className="dash-card">
        <h2>Booking Grid View</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Explore halls and labs with real-time availability indicators.
        </p>
      </section>

      <AvailabilityLegend />

      <section className="dash-card">
        <h3 style={{ marginBottom: 12 }}>Resource Availability</h3>
        <BookingGrid resources={resources} />
      </section>

      <BookingCalendar />
      <TimeSlotPicker />
    </>
  )
}
