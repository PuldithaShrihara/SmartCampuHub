import { useState } from 'react'

const fallbackData = {
  resourceId: 'res-cl2',
  resourceName: 'Computer Lab 2',
  location: 'Engineering Block',
  date: new Date().toISOString().split('T')[0],
  startTime: '09:00',
  endTime: '11:00',
  attendees: 32,
  purpose: 'Study Session',
}

export default function BookingForm({ initialValues = fallbackData, onSubmit }) {
  const [formData, setFormData] = useState({ ...fallbackData, ...initialValues })

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e) {
    e.preventDefault()
    if (onSubmit) {
      onSubmit({
        resourceId: formData.resourceId,
        bookingDate: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.purpose,
        expectedAttendees: parseInt(formData.attendees, 10),
      })
    }
  }

  return (
    <form className="dash-form-grid" onSubmit={handleSubmit}>
      <div>
        <label>Resource ID (e.g. res-lha, res-cl2)</label>
        <input name="resourceId" value={formData.resourceId} onChange={handleChange} required />
      </div>
      <div>
        <label>Purpose</label>
        <input name="purpose" value={formData.purpose} onChange={handleChange} required />
      </div>
      <div>
        <label>Date</label>
        <input type="date" name="date" value={formData.date} onChange={handleChange} required />
      </div>
      <div>
        <label>Start Time</label>
        <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} required />
      </div>
      <div>
        <label>End Time</label>
        <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} required />
      </div>
      <div>
        <label>Expected Attendees</label>
        <input type="number" name="attendees" min="1" value={formData.attendees} onChange={handleChange} required />
      </div>
      <button type="submit">Submit Booking</button>
    </form>
  )
}

