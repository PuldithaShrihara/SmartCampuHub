import { useEffect, useState } from 'react'
import { getAllIncidents, updateIncident } from '../../api/incidentApi.js'

const STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved']

export default function TechnicianTicketsPage() {
  const [incidents, setIncidents] = useState([])
  const [error, setError] = useState('')
  const [remarksById, setRemarksById] = useState({})

  async function loadIncidents() {
    try {
      setError('')
      const res = await getAllIncidents('')
      setIncidents(Array.isArray(res?.data) ? res.data : [])
    } catch (err) {
      setError(err.message || 'Could not load incidents')
    }
  }

  useEffect(() => {
    loadIncidents()
  }, [])

  async function handleStatusChange(incidentId, status) {
    try {
      await updateIncident(incidentId, { status })
      await loadIncidents()
    } catch (err) {
      setError(err.message || 'Could not update status')
    }
  }

  async function saveRemarks(incidentId) {
    try {
      await updateIncident(incidentId, {
        technicianRemarks: remarksById[incidentId] || '',
      })
      await loadIncidents()
    } catch (err) {
      setError(err.message || 'Could not save remarks')
    }
  }

  return (
    <section className="dash-card">
      <h2>Incident Tickets</h2>
      {error ? <div className="dash-msg error">{error}</div> : null}

      <div className="dash-table-wrap">
        <table className="dash-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>User</th>
              <th>Resource</th>
              <th>Status</th>
              <th>Remarks</th>
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
                  <td>
                    <input
                      value={remarksById[item.id] ?? item.technicianRemarks ?? ''}
                      onChange={(e) =>
                        setRemarksById((prev) => ({ ...prev, [item.id]: e.target.value }))
                      }
                      placeholder="Add remarks"
                    />
                    <button
                      type="button"
                      onClick={() => saveRemarks(item.id)}
                      style={{ marginLeft: 8 }}
                    >
                      Save
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
