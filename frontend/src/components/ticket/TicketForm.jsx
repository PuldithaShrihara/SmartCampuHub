import { useMemo, useState } from 'react'

function getTodayDateString() {
  return new Date().toISOString().split('T')[0]
}

function normalizeInitialValues(initialValues) {
  return {
    title: initialValues?.title || '',
    description: initialValues?.description || '',
    resourceId: initialValues?.resourceId || '',
    expectedDate: initialValues?.expectedDate || '',
    attachment: null,
  }
}

export default function TicketForm({
  resources = [],
  initialValues,
  loading = false,
  submitLabel = 'Submit Ticket',
  onSubmit,
}) {
  const [formValues, setFormValues] = useState(() => normalizeInitialValues(initialValues))
  const [errors, setErrors] = useState({})

  const todayDate = useMemo(() => getTodayDateString(), [])

  function updateField(name, value) {
    setFormValues((prev) => ({ ...prev, [name]: value }))
  }

  function validate() {
    const nextErrors = {}
    if (!formValues.title.trim()) nextErrors.title = 'Title is required'
    if (!formValues.description.trim()) nextErrors.description = 'Description is required'
    if (!formValues.resourceId.trim()) nextErrors.resourceId = 'Please select a resource'
    if (!formValues.expectedDate) nextErrors.expectedDate = 'Expected date is required'
    if (formValues.expectedDate && formValues.expectedDate < todayDate) {
      nextErrors.expectedDate = 'Expected date cannot be in the past'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (!validate()) return
    if (typeof onSubmit !== 'function') return

    await onSubmit({
      title: formValues.title.trim(),
      description: formValues.description.trim(),
      resourceId: formValues.resourceId.trim(),
      expectedDate: formValues.expectedDate,
      attachment: formValues.attachment,
    })
  }

  return (
    <section className="dash-card">
      <form className="incident-form-grid" onSubmit={handleSubmit}>
        <div className="incident-field">
          <label htmlFor="ticket-title">Title</label>
          <input
            id="ticket-title"
            value={formValues.title}
            onChange={(e) => updateField('title', e.target.value)}
            placeholder="e.g. Lab projector not working"
            className={errors.title ? 'incident-input-error' : ''}
            required
          />
          {errors.title ? <small className="incident-field-error">{errors.title}</small> : null}
        </div>

        <div className="incident-field">
          <label htmlFor="ticket-description">Description</label>
          <textarea
            id="ticket-description"
            rows={4}
            value={formValues.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder="Describe the issue clearly."
            className={errors.description ? 'incident-input-error' : ''}
            required
          />
          {errors.description ? <small className="incident-field-error">{errors.description}</small> : null}
        </div>

        <div className="incident-form-row">
          <div className="incident-field incident-field-half">
            <label htmlFor="ticket-resource">Resource</label>
            <select
              id="ticket-resource"
              value={formValues.resourceId}
              onChange={(e) => updateField('resourceId', e.target.value)}
              className={errors.resourceId ? 'incident-input-error' : ''}
              required
            >
              <option value="">Select a resource</option>
              {resources.map((resource) => (
                <option key={resource.id} value={resource.id}>
                  {resource.name} ({resource.location || resource.id})
                </option>
              ))}
            </select>
            {errors.resourceId ? <small className="incident-field-error">{errors.resourceId}</small> : null}
          </div>

          <div className="incident-field incident-field-half">
            <label htmlFor="ticket-expected-date">Expected Date</label>
            <input
              id="ticket-expected-date"
              type="date"
              value={formValues.expectedDate}
              min={todayDate}
              onChange={(e) => updateField('expectedDate', e.target.value)}
              className={errors.expectedDate ? 'incident-input-error' : ''}
              required
            />
            {errors.expectedDate ? <small className="incident-field-error">{errors.expectedDate}</small> : null}
          </div>
        </div>

        <div className="incident-field">
          <label htmlFor="ticket-attachment">Attachment (optional)</label>
          <input
            id="ticket-attachment"
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => updateField('attachment', e.target.files?.[0] || null)}
          />
        </div>

        <button className="incident-submit-btn" type="submit" disabled={loading}>
          {loading ? 'Submitting...' : submitLabel}
        </button>
      </form>
    </section>
  )
}
