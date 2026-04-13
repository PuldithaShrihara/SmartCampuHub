import { useState, useMemo } from 'react'
import { FaChevronLeft, FaChevronRight, FaEllipsisV } from 'react-icons/fa'
import { getCalendarDays, getMonthName } from '../../utils/CalendarEngine'
import '../../styles/DashboardRedesign.css'

const mockEvents = {
  '2022-07-01': [
    { label: 'Red Label', color: 'red' },
    { label: 'Neutral Label', color: 'neutral' },
  ],
  '2022-06-26': [
    { label: 'Green Label', color: 'green' },
    { label: 'Yellow Label', color: 'yellow' },
    { label: 'Blue Label', color: 'blue' },
  ],
  '2022-07-04': [
    { label: 'Yellow Label', color: 'yellow' },
    { label: 'Blue Label', color: 'blue' },
  ],
  '2022-07-13': [
    { label: 'Yellow Label', color: 'yellow' },
    { label: 'Blue Label', color: 'blue' },
  ],
  '2022-07-15': [
    { label: 'Green Label', color: 'green' },
    { label: 'Yellow Label', color: 'yellow' },
    { label: 'Blue Label', color: 'blue' },
  ],
  '2022-07-28': [
    { label: 'Green Label', color: 'green' },
    { label: 'Yellow Label', color: 'yellow' },
    { label: 'Blue Label', color: 'blue' },
  ],
  // Add more to match image...
}

export default function MainCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date(2022, 6, 1)) // July 2022 as per image
  const [view, setView] = useState('Month')

  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()

  const days = useMemo(() => getCalendarDays(year, month), [year, month])

  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1))
  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1))
  const goToToday = () => setCurrentDate(new Date())

  return (
    <div className="calendar-container">
      <div className="calendar-toolbar">
        <div className="toolbar-left">
          <button className="cal-btn cal-btn-icon primary" onClick={prevMonth}>
            <FaChevronLeft size={12} />
          </button>
          <button className="cal-btn cal-btn-icon primary" onClick={nextMonth}>
            <FaChevronRight size={12} />
          </button>
          <button className="cal-btn" onClick={goToToday}>Today</button>
        </div>
        
        <div className="toolbar-center">
          <h2>{getMonthName(month)} {year}</h2>
        </div>

        <div className="toolbar-right">
          <div className="cal-toggle-group">
            {['Month', 'Week', 'Day'].map((v) => (
              <button
                key={v}
                className={`cal-toggle-btn ${view === v ? 'active' : ''}`}
                onClick={() => setView(v)}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="cal-btn cal-btn-icon">
            <FaEllipsisV size={12} />
          </button>
        </div>
      </div>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div key={day} className="grid-header">{day}</div>
        ))}
        {days.map((dateObj, idx) => {
          const dateStr = `${dateObj.year}-${String(dateObj.month + 1).padStart(2, '0')}-${String(dateObj.day).padStart(2, '0')}`
          const events = mockEvents[dateStr] || []
          
          return (
            <div 
              key={idx} 
              className={`grid-cell ${!dateObj.isCurrentMonth ? 'other-month' : ''}`}
            >
              <span className="day-number">{dateObj.day}</span>
              <div className="events-container">
                {events.map((ev, i) => (
                  <div key={i} className={`cal-label label-${ev.color}`}>
                    {ev.label}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
