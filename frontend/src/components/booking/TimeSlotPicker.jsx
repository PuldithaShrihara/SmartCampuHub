import { useState } from 'react'

const defaultSlots = [
  { id: 'S1', label: '08:00 - 09:00', status: 'Available' },
  { id: 'S2', label: '09:00 - 10:00', status: 'Reserved' },
  { id: 'S3', label: '10:00 - 11:00', status: 'Ongoing' },
  { id: 'S4', label: '11:00 - 12:00', status: 'Available' },
  { id: 'S5', label: '12:00 - 13:00', status: 'Out of Service' },
  { id: 'S6', label: '13:00 - 14:00', status: 'Available' },
]

const styleByStatus = {
  Available: { bg: '#ecfdf3', border: '#bbf7d0', text: '#166534' },
  Ongoing: { bg: '#fffbeb', border: '#fde68a', text: '#92400e' },
  Reserved: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
  'Out of Service': { bg: '#fef2f2', border: '#fecaca', text: '#991b1b' },
}

export default function TimeSlotPicker({ slots = defaultSlots }) {
  const [selected, setSelected] = useState(null)

  return (
    <section className="dash-card">
      <h3 style={{ marginBottom: 10 }}>Time Slot Picker</h3>
      <p style={{ margin: '0 0 12px', color: 'var(--text-muted)', fontSize: 14 }}>
        Select a slot for the chosen day (demo interaction).
      </p>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 10,
        }}
      >
        {slots.map((slot) => {
          const colors = styleByStatus[slot.status]
          const isSelected = selected === slot.id
          return (
            <button
              key={slot.id}
              type="button"
              onClick={() => setSelected(slot.id)}
              style={{
                textAlign: 'left',
                border: `1px solid ${isSelected ? '#2563eb' : colors.border}`,
                background: colors.bg,
                color: colors.text,
                borderRadius: 10,
                padding: 10,
                cursor: 'pointer',
              }}
            >
              <div style={{ fontWeight: 700, marginBottom: 4 }}>{slot.label}</div>
              <small>{slot.status}</small>
            </button>
          )
        })}
      </div>
    </section>
  )
}
