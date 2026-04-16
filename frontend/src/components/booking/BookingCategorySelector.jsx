export default function BookingCategorySelector({ onSelect, disabled = false }) {
  return (
    <div className="dash-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
      <button
        type="button"
        className="dash-btn-outline"
        disabled={disabled}
        onClick={() => onSelect('SPACE')}
        style={{ minHeight: 92, textAlign: 'left' }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Labs / Lectures</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Labs, halls, classrooms, meeting rooms</div>
      </button>
      <button
        type="button"
        className="dash-btn-outline"
        disabled={disabled}
        onClick={() => onSelect('EQUIPMENT')}
        style={{ minHeight: 92, textAlign: 'left' }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>Equipments</div>
        <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Cameras, kits, devices, shared equipment</div>
      </button>
    </div>
  )
}
