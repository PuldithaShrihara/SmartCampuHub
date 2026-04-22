import { useEffect, useMemo, useState } from 'react'

const PURPOSE_REGEX = /^[A-Za-z0-9\s.,!?()'"&:/-]+$/

export default function CreateEquipmentBookingForm({ resources = [], submitting = false, onSubmit, initialResourceId }) {
  const [formData, setFormData] = useState({
    resourceId: '',
    bookingDate: new Date().toISOString().split('T')[0],
    pickupTime: '',
    returnTime: '',
    quantityRequested: '',
    purpose: '',
    notes: '',
  })
  const [errors, setErrors] = useState({})
  const [touched, setTouched] = useState({})
  const [submitted, setSubmitted] = useState(false)

  const activeEquipment = useMemo(
    () =>
      resources.filter((resource) => {
        const status = String(resource?.status || '').trim().toUpperCase()
        const category = String(resource?.category || '').trim().toUpperCase()
        const type = String(resource?.type || '').trim().toUpperCase()
        const isEquipment = category ? category === 'EQUIPMENT' : type === 'EQUIPMENT'
        return status === 'ACTIVE' && isEquipment
      }),
    [resources],
  )
  useEffect(() => {
    if (initialResourceId == null || initialResourceId === '') return
    const match = activeEquipment.find((resource) => String(resource.id) === String(initialResourceId))
    if (!match) return
    setFormData((prev) => {
      if (String(prev.resourceId) === String(match.id)) return prev
      const next = { ...prev, resourceId: String(match.id) }
      setErrors(validateEquipmentForm(next, activeEquipment))
      return next
    })
  }, [initialResourceId, activeEquipment])

  const selectedResource = activeEquipment.find(
    (resource) => String(resource.id) === String(formData.resourceId),
  )
  const selectedQuantity = Number(selectedResource?.quantity)
  const todayIso = new Date().toISOString().split('T')[0]

  function handleChange(e) {
    const { name, value } = e.target
    setFormData((prev) => {
      const next = { ...prev, [name]: value }
      setErrors(validateEquipmentForm(next, activeEquipment))
      return next
    })
  }

  function handleBlur(e) {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitted(true)
    const validation = validateEquipmentForm(formData, activeEquipment)
    setErrors(validation)
    if (Object.keys(validation).length > 0) return

    await onSubmit?.({
      bookingDate: formData.bookingDate,
      resourceId: formData.resourceId,
      startTime: formData.pickupTime,
      endTime: formData.returnTime,
      purpose: formData.purpose.trim(),
      quantityRequested: parseInt(formData.quantityRequested, 10),
      notes: formData.notes.trim(),
    })
  }

  const showError = (name) => Boolean(errors[name] && (submitted || touched[name]))

  return (
    <form className="dash-form-grid" onSubmit={handleSubmit} noValidate>
      <div>
        <label htmlFor="resourceId">Resource</label>
        <select id="resourceId" name="resourceId" value={formData.resourceId} onChange={handleChange} onBlur={handleBlur} disabled={submitting}>
          <option value="">Select equipment</option>
          {activeEquipment.map((resource) => (
            <option key={resource.id} value={String(resource.id)}>
              {resource.name || 'Unnamed Equipment'} ({resource.location || 'No location'})
            </option>
          ))}
        </select>
        {showError('resourceId') ? <FieldErrorText>{errors.resourceId}</FieldErrorText> : null}
      </div>
      <div>
        <label htmlFor="purpose">Purpose</label>
        <input id="purpose" name="purpose" placeholder="e.g. Media project recording" value={formData.purpose} onChange={handleChange} onBlur={handleBlur} disabled={submitting} />
        {showError('purpose') ? <FieldErrorText>{errors.purpose}</FieldErrorText> : null}
      </div>
      <div>
        <label htmlFor="bookingDate">Booking Date</label>
        <input id="bookingDate" type="date" name="bookingDate" min={todayIso} value={formData.bookingDate} onChange={handleChange} onBlur={handleBlur} disabled={submitting} />
        {showError('bookingDate') ? <FieldErrorText>{errors.bookingDate}</FieldErrorText> : null}
      </div>
      <div>
        <label htmlFor="pickupTime">Pickup Time</label>
        <input id="pickupTime" type="time" name="pickupTime" step={1800} value={formData.pickupTime} onChange={handleChange} onBlur={handleBlur} disabled={submitting} />
        {showError('pickupTime') ? <FieldErrorText>{errors.pickupTime}</FieldErrorText> : null}
      </div>
      <div>
        <label htmlFor="returnTime">Return Time</label>
        <input id="returnTime" type="time" name="returnTime" step={1800} value={formData.returnTime} onChange={handleChange} onBlur={handleBlur} disabled={submitting} />
        {showError('returnTime') ? <FieldErrorText>{errors.returnTime}</FieldErrorText> : null}
      </div>
      <div>
        <label htmlFor="quantityRequested">Quantity Requested</label>
        <input
          id="quantityRequested"
          type="number"
          name="quantityRequested"
          min="1"
          max={Number.isFinite(selectedQuantity) ? selectedQuantity : undefined}
          value={formData.quantityRequested}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={submitting}
          placeholder="1"
        />
        {Number.isFinite(selectedQuantity) ? (
          <small style={{ display: 'block', marginTop: 6, color: 'var(--text-muted)' }}>Available quantity: {selectedQuantity}</small>
        ) : null}
        {showError('quantityRequested') ? <FieldErrorText>{errors.quantityRequested}</FieldErrorText> : null}
      </div>
      <div style={{ gridColumn: '1 / -1' }}>
        <label htmlFor="notes">Optional Notes</label>
        <textarea id="notes" name="notes" value={formData.notes} onChange={handleChange} onBlur={handleBlur} disabled={submitting} rows={3} placeholder="Additional handling details (optional)" />
        {showError('notes') ? <FieldErrorText>{errors.notes}</FieldErrorText> : null}
      </div>
      <button type="submit" disabled={submitting || activeEquipment.length === 0}>
        {submitting ? 'Submitting...' : 'Submit Equipment Booking'}
      </button>
    </form>
  )
}

function validateEquipmentForm(formData, resources) {
  const validationErrors = {}
  const selectedResource = resources.find(
    (resource) => String(resource.id) === String(formData.resourceId),
  )
  const quantity = Number(formData.quantityRequested)
  const purpose = (formData.purpose || '').trim()
  const notes = (formData.notes || '').trim()

  const bookingDate = formData.bookingDate ? new Date(`${formData.bookingDate}T00:00:00`) : null
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  if (!formData.resourceId) {
    validationErrors.resourceId = 'Please select equipment.'
  } else if (!selectedResource) {
    validationErrors.resourceId = 'Selected equipment is invalid or inactive.'
  }

  if (!purpose) {
    validationErrors.purpose = 'Purpose is required.'
  } else if (purpose.length < 3 || purpose.length > 150) {
    validationErrors.purpose = 'Purpose must be between 3 and 150 characters.'
  } else if (!PURPOSE_REGEX.test(purpose)) {
    validationErrors.purpose = 'Purpose contains unsupported characters.'
  }

  if (!formData.bookingDate) {
    validationErrors.bookingDate = 'Booking date is required.'
  } else if (Number.isNaN(bookingDate?.getTime())) {
    validationErrors.bookingDate = 'Please enter a valid date.'
  } else if (bookingDate < today) {
    validationErrors.bookingDate = 'Booking date cannot be in the past.'
  }

  if (!formData.pickupTime) validationErrors.pickupTime = 'Pickup time is required.'
  if (!formData.returnTime) validationErrors.returnTime = 'Return time is required.'

  const pickupMinutes = toMinutes(formData.pickupTime)
  const returnMinutes = toMinutes(formData.returnTime)
  if (pickupMinutes != null && returnMinutes != null && returnMinutes <= pickupMinutes) {
    validationErrors.returnTime = 'Return time must be later than pickup time.'
  }
  if (pickupMinutes != null && returnMinutes != null && selectedResource) {
    const windows = Array.isArray(selectedResource.availabilityWindows) ? selectedResource.availabilityWindows : []
    if (windows.length > 0) {
      const withinWindow = windows.some((windowText) => {
        const parsed = parseWindow(windowText)
        if (!parsed) return false
        return pickupMinutes >= parsed.start && returnMinutes <= parsed.end
      })
      if (!withinWindow) {
        validationErrors.returnTime = 'Pickup and return time must be within equipment availability window.'
      }
    }
  }
  if (bookingDate && bookingDate.getTime() === today.getTime() && pickupMinutes != null) {
    const nowMinutes = now.getHours() * 60 + now.getMinutes()
    if (pickupMinutes <= nowMinutes) {
      validationErrors.pickupTime = 'Pickup time must be in the future for today.'
    }
  }

  if (!formData.quantityRequested) {
    validationErrors.quantityRequested = 'Quantity requested is required.'
  } else if (!Number.isInteger(quantity) || quantity <= 0) {
    validationErrors.quantityRequested = 'Quantity requested must be a positive whole number.'
  } else if (selectedResource?.quantity != null && quantity > Number(selectedResource.quantity)) {
    validationErrors.quantityRequested = `Quantity requested cannot exceed available quantity (${selectedResource.quantity}).`
  }

  if (notes.length > 250) {
    validationErrors.notes = 'Notes cannot exceed 250 characters.'
  }

  return validationErrors
}

function toMinutes(timeValue) {
  if (!timeValue || !/^\d{2}:\d{2}$/.test(timeValue)) return null
  const [hours, minutes] = timeValue.split(':').map(Number)
  return hours * 60 + minutes
}

function parseWindow(windowText) {
  if (typeof windowText !== 'string' || !windowText.includes('-')) return null
  const [start, end] = windowText.split('-').map((part) => toMinutes(part.trim()))
  if (start == null || end == null) return null
  return { start, end }
}

function FieldErrorText({ children }) {
  return (
    <small style={{ display: 'block', color: '#b91c1c', marginTop: 6, fontSize: 13, lineHeight: 1.3 }}>
      {children}
    </small>
  )
}
