import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/useAuth.js'
import { listNotifications } from '../../api/notifications.js'
import '../../styles/DashboardLayout.css'

export default function StudentHome() {
  const { user } = useAuth()
  const now = new Date().toLocaleString()

  return (
    <div>
      <div className="dash-card">
        <h2>Hello, {user?.fullName || 'Student'}!</h2>
        <p style={{ color: '#616161', margin: '0 0 8px' }}>{now}</p>
        <p style={{ color: '#616161', margin: 0 }}>
          Welcome to Smart Campus Hub.
        </p>
      </div>
    </div>
  )
}
