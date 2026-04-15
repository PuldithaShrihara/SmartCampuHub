import { useEffect, useState } from 'react'
import BookingForm from '../../components/booking/BookingForm.jsx'
import { createBooking } from '../../api/bookingApi.js'
import { fetchResources } from '../../api/resourceApi.js'
import { useToast } from '../../components/toastContext.js'

export default function CreateBookingPage() {
  const { pushToast } = useToast()
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function loadResources() {
      setLoading(true)
      setError('')
      try {
        const data = await fetchResources()
        const normalized = Array.isArray(data)
          ? data
          : Array.isArray(data?.content)
            ? data.content
            : []
        if (!cancelled) setResources(normalized.filter((r) => r && r.id))
      } catch (err) {
        if (!cancelled) {
          setResources([])
          setError(err?.message || 'Failed to load resources')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadResources()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleCreateBooking(payload) {
    try {
      setSubmitting(true)
      await createBooking(payload)
      pushToast({ type: 'success', message: 'Booking request created successfully.' })
    } catch (err) {
      pushToast({ type: 'error', message: err?.message || 'Failed to create booking.' })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <section className="dash-card">
        <h2>Create Booking</h2>
        <p style={{ color: 'var(--text-muted)' }}>
          Submit bookings only for resources created by admins.
        </p>
      </section>

      <section className="dash-card">
        <h3 style={{ marginBottom: 12 }}>Booking Request</h3>
        {loading ? (
          <p>Loading available resources...</p>
        ) : error ? (
          <div className="dash-msg error">{error}</div>
        ) : resources.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>
            No resources are available right now. Ask admin to create resources first.
          </p>
        ) : (
          <BookingForm
            resources={resources}
            submitting={submitting}
            onSubmit={handleCreateBooking}
          />
        )}
      </section>
    </>
  )
}
