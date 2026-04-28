import { useMemo } from 'react'
import {
  AreaChart, Area,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import '../../styles/AdminTicketAnalytics.css'

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ec4899', '#3b82f6', '#64748b']

export default function AdminTicketAnalytics({ incidents = [] }) {
  // 1. Daily Trend Data (Last 7 Days)
  const trendData = useMemo(() => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date()
      d.setDate(d.getDate() - (6 - i))
      return {
        dateString: d.toISOString().slice(0, 10), // YYYY-MM-DD
        display: d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
        count: 0
      }
    })

    incidents.forEach(item => {
      // Handle timestamp or ISO date
      const d = item.createdAt ? new Date(item.createdAt) : new Date()
      const dateString = d.toISOString().slice(0, 10)
      const dayData = last7Days.find(day => day.dateString === dateString)
      if (dayData) {
        dayData.count += 1
      }
    })

    return last7Days
  }, [incidents])

  // 2. Tickets by Priority
  const priorityData = useMemo(() => {
    const counts = { Critical: 0, High: 0, Medium: 0, Low: 0 }
    incidents.forEach(item => {
      const p = item.priority || 'Low'
      if (counts[p] !== undefined) counts[p] += 1
      else counts.Low += 1
    })
    return [
      { name: 'Critical', count: counts.Critical, fill: '#ef4444' },
      { name: 'High', count: counts.High, fill: '#f59e0b' },
      { name: 'Medium', count: counts.Medium, fill: '#3b82f6' },
      { name: 'Low', count: counts.Low, fill: '#10b981' }
    ]
  }, [incidents])

  // 3. Top Resource Mix
  const resourceData = useMemo(() => {
    const counts = {}
    incidents.forEach(item => {
      const rName = item.resourceId?.name || 'Unknown'
      counts[rName] = (counts[rName] || 0) + 1
    })

    let sorted = Object.entries(counts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)

    // Keep top 4, group rest into "Others"
    if (sorted.length > 5) {
      const top4 = sorted.slice(0, 4)
      const othersVal = sorted.slice(4).reduce((sum, item) => sum + item.value, 0)
      top4.push({ name: 'Others', value: othersVal })
      sorted = top4
    }

    const total = sorted.reduce((sum, item) => sum + item.value, 0)
    return { data: sorted, total: total || 1 }
  }, [incidents])

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="analytics-tooltip">
          <p className="analytics-tooltip-label">{label}</p>
          <p className="analytics-tooltip-value">
            Tickets: <span style={{ color: payload[0].color || payload[0].payload.fill }}>{payload[0].value}</span>
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="analytics-dashboard">
      {/* Top Card: Daily Trend */}
      <div className="analytics-card full-width" style={{ marginTop: 0 }}>
        <div className="analytics-card-header">
          <h3>Daily ticket trend</h3>
          <p>Volume per day for the last 7 days.</p>
        </div>
        <div className="analytics-chart-container" style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="display" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="count" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" activeDot={{ r: 6, fill: '#6366f1', stroke: '#fff', strokeWidth: 2 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Card: Top Resource Mix (PieChart) */}
      <div className="analytics-card full-width">
        <div className="analytics-card-header">
          <h3>Top resource mix</h3>
          <p>Approximate share among top resources.</p>
        </div>
        <div className="analytics-pie-layout">
          <div style={{ width: '40%', minWidth: '300px', height: 260 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={resourceData.data}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={100}
                  dataKey="value"
                  stroke="#ffffff"
                  strokeWidth={2}
                >
                  {resourceData.data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          {/* Custom Legend */}
          <div className="analytics-custom-legend" style={{ maxWidth: '400px' }}>
            {resourceData.data.map((entry, index) => {
              const percent = Math.round((entry.value / resourceData.total) * 100)
              return (
                <div className="analytics-legend-item" key={index}>
                  <div className="analytics-legend-left">
                    <span className="analytics-legend-dot" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }}></span>
                    <span className="analytics-legend-name" title={entry.name}>{entry.name}</span>
                  </div>
                  <span className="analytics-legend-percent">{percent}%</span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
