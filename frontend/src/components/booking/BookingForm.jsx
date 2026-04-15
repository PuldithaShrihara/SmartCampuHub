import { useState } from 'react'

export default function BookingForm({ onSubmit, resources = [], submitting = false }) {
  const [formData, setFormData] = useState({
    resourceId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    attendees: '',
    purpose: '',
  })

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
        <label>Resource</label>
        <select
          name="resourceId"
          value={formData.resourceId}
          onChange={handleChange}
          required
          disabled={resources.length === 0 || submitting}
        >
          <option value="">Select a resource</option>
          {resources.map((resource) => (
            <option key={resource.id} value={resource.id}>
              {resource.name || 'Unnamed Resource'} ({resource.location || 'No location'})
            </option>
          ))}
        </select>
      </div>
      <div>
        <label>Purpose</label>
        <input
          name="purpose"
          placeholder="e.g. Study Session"
          value={formData.purpose}
          onChange={handleChange}
          disabled={submitting}
          required
        />
      </div>
      <div>
        <label>Date</label>
        <input type="date" name="date" value={formData.date} onChange={handleChange} disabled={submitting} required />
      </div>
      <div>
        <label>Start Time</label>
        <input type="time" name="startTime" value={formData.startTime} onChange={handleChange} disabled={submitting} required />
      </div>
      <div>
        <label>End Time</label>
        <input type="time" name="endTime" value={formData.endTime} onChange={handleChange} disabled={submitting} required />
      </div>
      <div>
        <label>Expected Attendees</label>
        <input
          type="number"
          name="attendees"
          min="1"
          placeholder="0"
          value={formData.attendees}
          onChange={handleChange}
          disabled={submitting}
          required
        />
      </div>
      <button type="submit" disabled={submitting || resources.length === 0}>
        {submitting ? 'Submitting...' : 'Submit Booking'}
      </button>
    </form>
  )
}

