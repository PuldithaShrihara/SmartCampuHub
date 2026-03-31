import { useMemo } from 'react'

const fallbackData = {
  resourceName: 'Computer Lab 2',
  location: 'Engineering Block',
  date: '2026-04-03',
  startTime: '09:00',
  endTime: '11:00',
  attendees: 32,
}

export default function BookingForm({ initialValues = fallbackData, onSubmit }) {
  const values = useMemo(() => ({ ...fallbackData, ...initialValues }), [initialValues])

  function handleSubmit(e) {
    e.preventDefault()
    if (onSubmit) {
      onSubmit(values)
    }
  }

  return (
    <form className="dash-form-grid" onSubmit={handleSubmit}>
      <div>
        <label>Hall/Lab Name</label>
        <input defaultValue={values.resourceName} placeholder="e.g. Seminar Hall A" />
      </div>
      <div>
        <label>Location</label>
        <input defaultValue={values.location} placeholder="e.g. Main Campus" />
      </div>
      <div>
        <label>Date</label>
        <input type="date" defaultValue={values.date} />
      </div>
      <div>
        <label>Start Time</label>
        <input type="time" defaultValue={values.startTime} />
      </div>
      <div>
        <label>End Time</label>
        <input type="time" defaultValue={values.endTime} />
      </div>
      <div>
        <label>Expected Attendees</label>
        <input type="number" min="1" defaultValue={values.attendees} />
      </div>
      <button type="submit">Save Draft Booking</button>
    </form>
  )
}
