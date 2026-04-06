import BookingStatusBadge from './BookingStatusBadge.jsx'

const sampleRows = [
  {
    id: 'BK-4011',
    resource: 'Lecture Hall A',
    location: 'Block A',
    slot: '09:00 - 10:00',
    status: 'Available',
  },
  {
    id: 'BK-4012',
    resource: 'Physics Lab',
    location: 'Science Wing',
    slot: '10:00 - 11:00',
    status: 'Reserved',
  },
]

export default function BookingTable({ rows = sampleRows }) {
  return (
    <div className="dash-table-wrap">
      <table className="dash-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Resource</th>
            <th>Location</th>
            <th>Time Slot</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{row.id}</td>
              <td>{row.resource}</td>
              <td>{row.location}</td>
              <td>{row.slot}</td>
              <td>
                <BookingStatusBadge status={row.status} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
