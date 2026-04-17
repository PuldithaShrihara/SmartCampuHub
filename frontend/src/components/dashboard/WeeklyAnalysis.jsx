import { useMemo } from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'
import { getWeekDays } from '../../utils/CalendarEngine'
import '../../styles/DashboardRedesign.css'

const hours = Array.from({ length: 14 }, (_, i) => i + 8) // 08:00 to 21:00

const mockBookings = [
  { day: 1, start: 9, end: 11, title: 'Lecture 1', color: 'blue' },
  { day: 1, start: 14, end: 16, title: 'Workshop', color: 'green' },
  { day: 2, start: 10, end: 12, title: 'Research Meet', color: 'yellow' },
  { day: 3, start: 13, end: 15, title: 'Maintenance', color: 'red' },
  { day: 4, start: 9, end: 10, title: 'Checkup', color: 'blue' },
  { day: 5, start: 15, end: 18, title: 'Event Prep', color: 'neutral' },
]

export default function WeeklyAnalysis({ venueName = 'Main Lecture Hall' }) {
  const weekDays = useMemo(() => getWeekDays(), [])

  return (
    <div>
      <div className="analysis-header">
        <div className="venue-info">
          <h1>{venueName}</h1>
          <p>Weekly Occupancy Analysis</p>
        </div>
        <div className="toolbar-left">
          <button className="cal-btn-icon cal-btn"><FaChevronLeft size={12} /></button>
          <span style={{ fontWeight: 600 }}>{weekDays[0].toLocaleDateString()} - {weekDays[6].toLocaleDateString()}</span>
          <button className="cal-btn-icon cal-btn"><FaChevronRight size={12} /></button>
        </div>
      </div>

      <div className="analysis-grid">
        <div className="time-header">Time</div>
        {weekDays.map((d, i) => (
          <div key={i} className="column-header">
            {d.toLocaleDateString('en-US', { weekday: 'short' })}
            <div style={{ fontSize: 11, fontWeight: 400, color: 'var(--cal-muted)' }}>{d.getDate()}</div>
          </div>
        ))}

        {hours.map(hour => (
          <>
            <div key={`h-${hour}`} className="time-cell">{String(hour).padStart(2, '0')}:00</div>
            {Array.from({ length: 7 }).map((_, dayIdx) => {
              const booking = mockBookings.find(b => b.day === dayIdx && b.start === hour)
              return (
                <div key={`slot-${hour}-${dayIdx}`} className="slot-cell">
                  {booking && (
                    <div
                      className={`booking-block label-${booking.color}`}
                      style={{
                        height: `${(booking.end - booking.start) * 60 - 4}px`,
                        top: '2px'
                      }}
                    >
                      {booking.title}
                    </div>
                  )}
                </div>
              )
            })}
          </>
        ))}
      </div>
    </div>
  )
}
