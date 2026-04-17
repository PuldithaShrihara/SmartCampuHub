import { useEffect, useMemo, useState } from 'react'
import { FaTools, FaCalendarCheck, FaClock, FaCheckCircle, FaArrowRight } from 'react-icons/fa'
import { getAllBookings } from '../../api/bookingApi.js'
import { fetchResources } from '../../api/resourceApi.js'
import { useAuth } from '../../context/useAuth.js'
import StatCard from '../../components/dashboard/StatCard.jsx'
import '../../styles/StudentHome.css'

export default function TechnicianHome() {
  const { user } = useAuth()
  const [bookings, setBookings] = useState([])
  const [resources, setResources] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const now = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })

  useEffect(() => {
    let cancelled = false
    async function loadDashboardData() {
      setLoading(true)
      setError('')
      try {
        const [bookingsData, resourcesData] = await Promise.all([
          getAllBookings(),
          fetchResources(),
        ])
        if (cancelled) return
        setBookings(Array.isArray(bookingsData) ? bookingsData : [])
        setResources(Array.isArray(resourcesData) ? resourcesData : [])
      } catch (err) {
        if (cancelled) return
        setError(err?.message || 'Failed to load technician dashboard data')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    loadDashboardData()
    return () => { cancelled = true }
  }, [])

  const bookingStats = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10)
    let pending = 0
    let approved = 0
    let resolvedToday = 0

    bookings.forEach((booking) => {
      const status = String(booking.status || '').toUpperCase()
      if (status === 'PENDING') pending += 1
      if (status === 'APPROVED') approved += 1
      if (status === 'COMPLETED' && booking.bookingDate === today) {
        resolvedToday += 1
      }
    })

    return { pending, approved, resolvedToday }
  }, [bookings])

  if (loading) {
    return <div className="student-home" style={{ textAlign: 'center', padding: '100px' }}>Loading technician dashboard...</div>
  }

  return (
    <div className="student-home">
      <div className="home-welcome">
        <div className="welcome-text">
          <p className="welcome-date">{now}</p>
          <h2>Welcome back, {user?.fullName?.split(' ')[0] || 'Technician'}! 👋</h2>
          <p className="welcome-sub">Maintenance & Resource Status: Operational.</p>
        </div>
      </div>

      <div className="stats-grid">
        <StatCard
          title="Pending Requests"
          value={bookingStats.pending}
          unit="Orders"
          icon={FaClock}
          color="#ef4444"
        />
        <StatCard
          title="Active Jobs"
          value={bookingStats.approved}
          unit="Current"
          icon={FaTools}
          color="#484fd1"
        />
        <StatCard
          title="Resolved Today"
          value={bookingStats.resolvedToday}
          unit="Tasks"
          icon={FaCheckCircle}
          color="#10b981"
        />
        <StatCard
          title="Inventory Assets"
          value={resources.length}
          unit="Resources"
          icon={FaCalendarCheck}
          color="#ffb86c"
        />
      </div>

      <div className="home-sections">
        {/* Mock sections removed to ensure data integrity */}
      </div>
    </div>
  )
}

