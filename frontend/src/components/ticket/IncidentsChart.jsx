import { useMemo } from 'react'
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts'

const COLORS = {
  Pending: '#f59e0b',     // Amber
  Open: '#f59e0b',        // Amber
  'In Progress': '#3b82f6', // Blue
  Resolved: '#10b981',      // Emerald
  Closed: '#64748b',        // Slate
  Rejected: '#ef4444'       // Red
}

export default function IncidentsChart({ incidents = [] }) {
  const data = useMemo(() => {
    const counts = incidents.reduce((acc, item) => {
      // Normalize status to match standard strings
      let status = item.status || 'Open'
      if (status.toLowerCase() === 'open' || status.toLowerCase() === 'pending') status = 'Open'
      else if (status.toLowerCase() === 'in progress') status = 'In Progress'
      else if (status.toLowerCase() === 'resolved') status = 'Resolved'
      else if (status.toLowerCase() === 'closed') status = 'Closed'
      else if (status.toLowerCase() === 'rejected') status = 'Rejected'

      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {})

    // Convert to array of { name, value } objects
    const dataArray = Object.entries(counts).map(([name, value]) => ({ name, value }))
    // Sort so chart looks consistent
    dataArray.sort((a, b) => b.value - a.value)
    return dataArray
  }, [incidents])

  if (!incidents || incidents.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 250, color: '#94a3b8', fontSize: '14px', fontWeight: 500 }}>
        No ticket data available to chart
      </div>
    )
  }

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          backgroundColor: '#ffffff',
          padding: '10px 14px',
          border: 'none',
          borderRadius: '12px',
          boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)'
        }}>
          <p style={{ margin: 0, fontWeight: 600, color: '#0f172a', fontSize: '14px' }}>
            {payload[0].name}: <span style={{ color: payload[0].payload.fill }}>{payload[0].value}</span>
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div style={{ width: '100%', height: 260, marginTop: '1rem', position: 'relative' }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={65}
            outerRadius={90}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[entry.name] || '#cbd5e1'}
                style={{ outline: 'none', filter: 'drop-shadow(0px 4px 6px rgba(0, 0, 0, 0.1))' }}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            wrapperStyle={{ fontSize: '13px', fontWeight: 500, color: '#475569' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}
