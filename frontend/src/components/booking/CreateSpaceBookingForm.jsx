import BookingForm from './BookingForm.jsx'

export default function CreateSpaceBookingForm({ resources, submitting, onSubmit, initialResourceId }) {
  return (
    <BookingForm
      resources={resources}
      submitting={submitting}
      onSubmit={onSubmit}
      initialResourceId={initialResourceId}
    />
  )
}
