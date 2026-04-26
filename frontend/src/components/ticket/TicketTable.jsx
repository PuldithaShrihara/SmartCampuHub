import TicketStatusBadge from './TicketStatusBadge.jsx'

const DEFAULT_STATUS_OPTIONS = ['Pending', 'In Progress', 'Resolved']

export default function TicketTable({
  tickets = [],
  statusOptions = DEFAULT_STATUS_OPTIONS,
  technicians = [],
  loading = false,
  onStatusChange,
  onAssignTechnician,
  onDelete,
  onEdit,
}) {
  const rows = Array.isArray(tickets) ? tickets : []

  return (
    <section className="dash-card tickets-table-card">
      <div className="dash-table-wrap">
        <table className="dash-table tickets-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>User</th>
              <th>Resource</th>
              <th>Status</th>
              <th>Expected Date</th>
              <th>Assigned technician</th>
              <th>Remarks</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={8} className="tickets-empty-state">
                  {loading ? 'Loading tickets...' : 'No tickets found.'}
                </td>
              </tr>
            ) : (
              rows.map((item) => {
                const userLabel = item?.userId?.fullName || item?.userId?.email || '-'
                const resourceLabel = item?.resourceId?.name || item?.resourceId || '-'
                const assignedId =
                  typeof item?.assignedTo === 'object' ? item?.assignedTo?.id || '' : item?.assignedTo || ''

                return (
                  <tr key={item.id}>
                    <td className="tickets-title-cell">{item.title || '-'}</td>
                    <td>{userLabel}</td>
                    <td>{resourceLabel}</td>
                    <td>
                      <TicketStatusBadge status={item.status} />
                    </td>
                    <td>{item.expectedDate || '-'}</td>
                    <td>
                      <select
                        value={assignedId}
                        className="tickets-assign-select"
                        onChange={(e) => onAssignTechnician?.(item.id, e.target.value)}
                        disabled={loading}
                      >
                        <option value="">Unassigned</option>
                        {technicians.map((technician) => (
                          <option key={technician.id} value={technician.id}>
                            {technician.fullName || technician.email}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>{item.technicianRemarks || '-'}</td>
                    <td>
                      <div className="incident-action-group">
                        <select
                          value={item.status || 'Pending'}
                          onChange={(e) => onStatusChange?.(item.id, e.target.value)}
                          disabled={loading}
                        >
                          {statusOptions.map((statusOption) => (
                            <option key={statusOption} value={statusOption}>
                              {statusOption}
                            </option>
                          ))}
                        </select>
                        <button type="button" className="incident-row-edit-btn" onClick={() => onEdit?.(item)} disabled={loading}>
                          Edit
                        </button>
                        <button
                          type="button"
                          className="incident-row-delete-btn"
                          onClick={() => onDelete?.(item)}
                          disabled={loading}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
