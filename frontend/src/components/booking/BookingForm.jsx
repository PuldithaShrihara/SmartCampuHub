import { useEffect, useMemo, useState } from 'react'

const WORKING_HOUR_START_MINUTES = 8 * 60
const WORKING_HOUR_END_MINUTES = 18 * 60
const MIN_DURATION_MINUTES = 30
const MAX_DURATION_MINUTES = 4 * 60
const PURPOSE_REGEX = /^[A-Za-z0-9\s.,!?()'"&:/-]+$/

export default function BookingForm({ onSubmit, resources = [], submitting = false, initialResourceId }) {
  const activeResources = useMemo(
    () =>
      resources.filter((resource) => {
        const status = String(resource?.status || '').trim().toUpperCase()
        const category = String(resource?.category || '').trim().toUpperCase()
        const type = String(resource?.type || '').trim().toUpperCase()
        const isSpaceResource = category ? category === 'SPACE' : type !== 'EQUIPMENT'
        return status === 'ACTIVE' && isSpaceResource
      }),
    [resources],
  )
  const todayIso = new Date().toISOString().split('T')[0]
  const [formData, setFormData] = useState({
    resourceId: '',
    date: new Date().toISOString().split('T')[0],
    startTime: '',
    endTime: '',
    attendees: '',
    purpose: '',
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    if (initialResourceId == null || initialResourceId === '') return
    const match = activeResources.find((resource) => String(resource.id) === String(initialResourceId))
    if (!match) return
    setFormData((prev) => {
      if (String(prev.resourceId) === String(match.id)) return prev
      return { ...prev, resourceId: String(match.id) }
    })
  }, [initialResourceId, activeResources])

  const selectedResource = activeResources.find(
    (resource) => String(resource.id) === String(formData.resourceId),
  )
  const selectedResourceCapacity = Number(selectedResource?.capacity)

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      const validation = validateForm(next, activeResources)
      setErrors(validation)
      return next
    })
  }

  function handleBlur(e) {
    const { name } = e.target
    setTouched((prev) => ({ ...prev, [name]: true }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    const validation = validateForm(formData, activeResources)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    if (onSubmit) {
      await onSubmit({
        resourceId: formData.resourceId,
        bookingDate: formData.date,
        startTime: formData.startTime,
        endTime: formData.endTime,
        purpose: formData.purpose.trim(),
        expectedAttendees: parseInt(formData.attendees, 10),
      })
    }
  }

  function shouldShowError(fieldName) {
    return Boolean(errors[fieldName] && (submitted || touched[fieldName]))
  }

  const timeSlots = Array.from({ length: 21 }, (_, i) => {
    const totalMinutes = WORKING_HOUR_START_MINUTES + i * 30
    const hh = String(Math.floor(totalMinutes / 60)).padStart(2, '0')
    const mm = String(totalMinutes % 60).padStart(2, '0')
    return `${hh}:${mm}`
  })

  return (
    <form className="dash-form-grid" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="resourceId">Resource</label>
        <select
          id="resourceId"
          name="resourceId"
          value={formData.resourceId}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={activeResources.length === 0 || submitting}
        >
          <option value="">Select a resource</option>
          {activeResources.map((resource) => (
            <option key={resource.id} value={String(resource.id)}>
              {resource.name || 'Unnamed Resource'} ({resource.location || 'No location'})
            </option>
          ))}
        </select>
        {shouldShowError('resourceId') ? <FieldErrorText>{errors.resourceId}</FieldErrorText> : null}
      </div>
      <div>
        <label htmlFor="purpose">Purpose</label>
        <input
          id="purpose"
          name="purpose"
          placeholder="e.g. Study Session"
          value={formData.purpose}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={submitting}
        />
        {shouldShowError('purpose') ? <FieldErrorText>{errors.purpose}</FieldErrorText> : null}
      </div>
      <div>
        <label htmlFor="date">Date</label>
        <input
          id="date"
          type="date"
          name="date"
          min={todayIso}
          value={formData.date}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={submitting}
        />
        {shouldShowError('date') ? <FieldErrorText>{errors.date}</FieldErrorText> : null}
      </div>
      <div>
        <label htmlFor="startTime">Start Time (24h)</label>
        <select
          id="startTime"
          name="startTime"
          value={formData.startTime}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={submitting}
        >
          <option value="">--:--</option>
          {timeSlots.map(slot => (
            <option key={slot} value={slot}>{slot}</option>
          ))}
        </select>
        {shouldShowError('startTime') ? <FieldErrorText>{errors.startTime}</FieldErrorText> : null}
      </div>
      <div>
        <label htmlFor="endTime">End Time (24h)</label>
        <select
          id="endTime"
          name="endTime"
          value={formData.endTime}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={submitting}
        >
          <option value="">--:--</option>
          {timeSlots.map(slot => (
            <option key={slot} value={slot}>{slot}</option>
          ))}
        </select>
        {shouldShowError('endTime') ? <FieldErrorText>{errors.endTime}</FieldErrorText> : null}
      </div>
      <div>
        <label htmlFor="attendees">Expected Attendees</label>
        <input
          id="attendees"
          type="number"
          name="attendees"
          min="1"
          max={Number.isFinite(selectedResourceCapacity) ? selectedResourceCapacity : undefined}
          placeholder="0"
          value={formData.attendees}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={submitting}
        />
        {shouldShowError('attendees') ? <FieldErrorText>{errors.attendees}</FieldErrorText> : null}
      </div>
      <button type="submit" disabled={submitting || activeResources.length === 0}>
        {submitting ? 'Submitting...' : 'Submit Booking'}
      </button>
    </form>
  )
}

function FieldErrorText({ children }) {
  return (
    <small
      style={{
        display: 'block',
        color: '#b91c1c',
        marginTop: 6,
        fontSize: 13,
        lineHeight: 1.3,
      }}
    >
      {children}
    </small>
  )
}

function validateForm(formData, resources) {
  const validationErrors = {}
  const selectedResource = resources.find(
    (resource) => String(resource.id) === String(formData.resourceId),
  )
  const resourceCapacity = Number(selectedResource?.capacity)
  const attendees = Number(formData.attendees)
  const purpose = (formData.purpose || '').trim()
  const bookingDate = formData.date ? new Date(`${formData.date}T00:00:00`) : null
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (!formData.resourceId) {
    validationErrors.resourceId = 'Please select a resource.'
  } else if (!selectedResource) {
    validationErrors.resourceId = 'Selected resource does not exist.'
  } else if (selectedResource.status && selectedResource.status !== 'ACTIVE') {
    validationErrors.resourceId = 'Selected resource is currently unavailable.'
  }

  if (!purpose) {
    validationErrors.purpose = 'Purpose is required.'
  } else if (purpose.length < 3 || purpose.length > 150) {
    validationErrors.purpose = 'Purpose must be between 3 and 150 characters.'
  } else if (!PURPOSE_REGEX.test(purpose)) {
    validationErrors.purpose = 'Purpose contains unsupported characters.'
  }

  if (!formData.date) {
    validationErrors.date = 'Date is required.'
  } else if (Number.isNaN(bookingDate?.getTime())) {
    validationErrors.date = 'Please enter a valid date.'
  } else if (bookingDate < today) {
    validationErrors.date = 'Date cannot be in the past.'
  }

  if (!formData.startTime) {
    validationErrors.startTime = 'Start time is required.'
  }
  if (!formData.endTime) {
    validationErrors.endTime = 'End time is required.'
  }

  const startMinutes = toMinutes(formData.startTime)
  const endMinutes = toMinutes(formData.endTime)

  if (startMinutes !== null) {
    if (startMinutes < WORKING_HOUR_START_MINUTES || startMinutes > WORKING_HOUR_END_MINUTES) {
      validationErrors.startTime = 'Start time must be between 08:00 and 18:00.'
    } else if (startMinutes % 30 !== 0) {
      validationErrors.startTime = 'Start time must align to 30-minute slots.'
    } else if (bookingDate && bookingDate.getTime() === today.getTime()) {
      const nowMinutes = now.getHours() * 60 + now.getMinutes()
      if (startMinutes <= nowMinutes) {
        validationErrors.startTime = 'Start time must be in the future for today.'
      }
    }
  }

  if (endMinutes !== null) {
    if (endMinutes < WORKING_HOUR_START_MINUTES || endMinutes > WORKING_HOUR_END_MINUTES) {
      validationErrors.endTime = 'End time must be between 08:00 and 18:00.'
    } else if (endMinutes % 30 !== 0) {
      validationErrors.endTime = 'End time must align to 30-minute slots.'
    }
  }

  if (startMinutes !== null && endMinutes !== null) {
    if (endMinutes <= startMinutes) {
      validationErrors.endTime = 'End time must be later than start time.'
    } else {
      const duration = endMinutes - startMinutes
      if (duration < MIN_DURATION_MINUTES || duration > MAX_DURATION_MINUTES) {
        validationErrors.endTime = 'Booking duration must be between 30 minutes and 4 hours.'
      }
    }
  }

  if (!formData.attendees) {
    validationErrors.attendees = 'Expected attendees is required.'
  } else if (!Number.isInteger(attendees) || attendees <= 0) {
    validationErrors.attendees = 'Expected attendees must be a whole number greater than 0.'
  } else if (Number.isFinite(resourceCapacity) && attendees > resourceCapacity) {
    validationErrors.attendees = `Expected attendees cannot exceed resource capacity (${resourceCapacity}).`
  }

  return validationErrors
}

function toMinutes(timeValue) {
  if (!timeValue || !/^\d{2}:\d{2}$/.test(timeValue)) return null
  const [hours, minutes] = timeValue.split(':').map(Number)
  return hours * 60 + minutes
}

