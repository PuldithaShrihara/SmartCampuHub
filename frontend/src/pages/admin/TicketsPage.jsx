import { useEffect, useState } from 'react'
import { getAllIncidents, updateIncident } from '../../api/incidentApi.js'

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved']

export default function Tickets() {
  const [statusFilter, setStatusFilter] = useState('')
  const [incidents, setIncidents] = useState([])
  const [error, setError] = useState('')

  async function loadIncidents() {
    try {
      setError('')
      const res = await getAllIncidents(statusFilter)
      setIncidents(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      setError(err.message || 'Could not load incidents')
    }
  }

  useEffect(() => {
    loadIncidents()
  }, [statusFilter])

  async function handleStatusChange(incidentId, nextStatus) {
    try {
      await updateIncident(incidentId, { status: nextStatus })
      await loadIncidents()
    } catch (err) {
      setError(err.message || 'Could not update incident status')
    }
  }

  return (
    <section className="dash-card">
      <h2>All Incident Tickets</h2>
      {error ? <div className="dash-msg error">{error}</div> : null}

      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>Filter by status:</label>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>User</th>
              <th>Resource</th>
              <th>Status</th>
              <th>Technician Remarks</th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={5}>No incidents found.</td>
              </tr>
            ) : (
              incidents.map((item) => (
                <tr key={item.id}>
                  <td>{item.title}</td>
                  <td>{item.userId?.fullName || item.userId?.email || '-'}</td>
                  <td>{item.resourceId?.name || '-'}</td>
                  <td>
                    <select
                      value={item.status}
                      onChange={(e) => handleStatusChange(item.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>{item.technicianRemarks || '-'}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
