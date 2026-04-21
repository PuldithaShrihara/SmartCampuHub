import { useEffect, useMemo, useState } from 'react'
import {
  FaBolt,
  FaCalendarAlt,
  FaChartLine,
  FaChartPie,
  FaClock,
  FaCubes,
  FaFire,
  FaLayerGroup,
} from 'react-icons/fa'
import { getAllBookings } from '../../api/bookingApi.js'
import './StatisticsPage.css'

const PERIOD_OPTIONS = [
  { value: 'ALL', label: 'All time' },
  { value: '7', label: 'Last 7 days' },
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
]

const SLOT_META = {
  MORNING: { label: 'Morning (06:00 - 11:59)' },
  AFTERNOON: { label: 'Afternoon (12:00 - 16:59)' },
  EVENING: { label: 'Evening (17:00 - 20:59)' },
  NIGHT: { label: 'Night (21:00 - 05:59)' },
}
const CHART_COLORS = ['#4f46e5', '#16a34a', '#f59e0b', '#ec4899', '#0ea5e9', '#64748b']

export default function StatisticsPage() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState('30')
  const [statusFilter, setStatusFilter] = useState('APPROVED')

  useEffect(() => {
    async function loadBookings() {
      try {
        setLoading(true)
        const all = await getAllBookings()
        setBookings(Array.isArray(all) ? all : [])
        setError('')
      } catch (err) {
        setError(err?.message || 'Failed to load booking statistics.')
      } finally {
        setLoading(false)
      }
    }
    loadBookings()
  }, [])

  const analytics = useMemo(() => {
    const dateFiltered = filterByPeriod(bookings, period)
    const statusFiltered = dateFiltered.filter((booking) => {
      if (statusFilter === 'ALL') return true
      return String(booking.status || '').toUpperCase() === statusFilter
    })

    const resourceMap = new Map()
    const slotMap = new Map([
      ['MORNING', 0],
      ['AFTERNOON', 0],
      ['EVENING', 0],
      ['NIGHT', 0],
    ])

    statusFiltered.forEach((booking) => {
      const resourceKey = booking.resourceId || booking.resourceName || 'UNKNOWN_RESOURCE'
      const resourceName = booking.resourceName || booking.resourceId || 'Unknown Resource'
      const bookingLoc = normalizeLocation(booking.resourceLocation)

      const prev = resourceMap.get(resourceKey)
      const count = (prev?.count || 0) + 1
      const location = prev?.location || bookingLoc

      resourceMap.set(resourceKey, { name: resourceName, location, count })

      const slot = getTimeSlot(booking.startTime)
      slotMap.set(slot, (slotMap.get(slot) || 0) + 1)
    })

    const resourceEntries = [...resourceMap.entries()]
      .map(([key, value]) => ({ id: key, ...value }))
      .sort(
        (a, b) =>
          b.count - a.count ||
          a.name.localeCompare(b.name) ||
          (a.location || '').localeCompare(b.location || '')
      )

    const topResources = resourceEntries.slice(0, 5)
    const lowResources = [...resourceEntries]
      .sort(
        (a, b) =>
          a.count - b.count ||
          a.name.localeCompare(b.name) ||
          (a.location || '').localeCompare(b.location || '')
      )
      .slice(0, 5)

    const slotEntries = [...slotMap.entries()].map(([key, value]) => ({
      key,
      label: SLOT_META[key].label,
      count: value,
    }))

    const highestSlot = slotEntries.reduce((acc, item) => (item.count > acc.count ? item : acc), slotEntries[0])
    const lowestSlot = slotEntries.reduce((acc, item) => (item.count < acc.count ? item : acc), slotEntries[0])

    const maxResourceCount = topResources[0]?.count || 0
    const maxSlotCount = Math.max(...slotEntries.map((s) => s.count), 0)
    const resourceShareData = buildResourceShareData(topResources, statusFiltered.length)
    const pieGradient = buildPieGradient(resourceShareData)
    const dailyTrend = buildDailyTrend(statusFiltered, period)
    const maxDailyCount = Math.max(...dailyTrend.map((item) => item.count), 0)

    const peakDay =
      dailyTrend.length > 0
        ? dailyTrend.reduce((best, d) => (d.count > best.count ? d : best), dailyTrend[0])
        : null

    const uniqueResourcesBooked = resourceEntries.length

    return {
      total: statusFiltered.length,
      sourceCount: bookings.length,
      topResource: topResources[0] || null,
      lowResource: lowResources[0] || null,
      highestSlot,
      lowestSlot,
      topResources,
      lowResources,
      slotEntries,
      maxResourceCount,
      maxSlotCount,
      resourceShareData,
      pieGradient,
      dailyTrend,
      maxDailyCount,
      peakDay,
      uniqueResourcesBooked,
    }
  }, [bookings, period, statusFilter])

  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label || 'Custom'

  if (loading) {
    return (
      <section className="stats-page stats-page--loading">
        <div className="stats-hero stats-hero--skeleton">
          <div className="stats-skeleton stats-skeleton--title" />
          <div className="stats-skeleton stats-skeleton--line" />
          <div className="stats-skeleton-row">
            <div className="stats-skeleton stats-skeleton--pill" />
            <div className="stats-skeleton stats-skeleton--pill" />
          </div>
        </div>
        <div className="stats-kpi-grid">
          {[1, 2, 3, 4].map((i) => (
            <div className="stats-kpi-card stats-kpi-card--skeleton" key={i}>
              <div className="stats-skeleton stats-skeleton--icon" />
              <div className="stats-skeleton-block">
                <div className="stats-skeleton stats-skeleton--line short" />
                <div className="stats-skeleton stats-skeleton--line" />
              </div>
            </div>
          ))}
        </div>
        <div className="stats-skeleton stats-skeleton--panel" />
      </section>
    )
  }

  if (error) {
    return (
      <section className="stats-page">
        <div className="dash-card stats-error-card">
          <div className="dash-msg error">{error}</div>
          <p className="stats-error-hint">Check your connection and try refreshing the page.</p>
        </div>
      </section>
    )
  }

  return (
    <section className="stats-page">
      <header className="stats-hero">
        <div className="stats-hero__bg" aria-hidden />
        <div className="stats-hero__inner">
          <span className="stats-hero__eyebrow">Admin · Analytics</span>
          <h1 className="stats-hero__title">Resource booking intelligence</h1>
          <p className="stats-hero__lead">
            Live breakdown of demand by resource, time slot, and day. Tune the window and status to match how you review operations.
          </p>
          <div className="stats-hero__filters">
            <label className="stats-filter-field">
              <span>Date range</span>
              <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                {PERIOD_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="stats-filter-field">
              <span>Booking status</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="APPROVED">Approved only</option>
                <option value="PENDING">Pending only</option>
                <option value="REJECTED">Rejected only</option>
                <option value="CANCELLED">Cancelled only</option>
                <option value="ALL">All statuses</option>
              </select>
            </label>
          </div>
          <div className="stats-hero__chips">
            <span className="stats-chip">
              <FaCalendarAlt aria-hidden />
              {periodLabel}
            </span>
            <span className="stats-chip">
              <FaLayerGroup aria-hidden />
              {analytics.total} bookings in view
            </span>
            <span className="stats-chip stats-chip--muted">
              {analytics.sourceCount} records in system
            </span>
          </div>
        </div>
      </header>

      <div className="stats-kpi-grid">
        <article className="stats-kpi-card stats-kpi-card--accent">
          <span className="stats-kpi-icon blue">
            <FaCalendarAlt aria-hidden />
          </span>
          <div className="stats-kpi-body">
            <p className="stats-kpi-label">Bookings in filter</p>
            <p className="stats-kpi-value">{analytics.total}</p>
            <span className="stats-kpi-meta">Matches your date &amp; status rules</span>
          </div>
        </article>
        <article className="stats-kpi-card">
          <span className="stats-kpi-icon green">
            <FaChartLine aria-hidden />
          </span>
          <div className="stats-kpi-body">
            <p className="stats-kpi-label">Top resource</p>
            {analytics.topResource ? (
              <>
                <p className="stats-kpi-value stats-kpi-value--text">{analytics.topResource.name}</p>
                <p className="stats-kpi-location">{analytics.topResource.location || 'Location not set'}</p>
                <span className="stats-kpi-meta">{analytics.topResource.count} bookings</span>
              </>
            ) : (
              <>
                <p className="stats-kpi-value stats-kpi-value--text">—</p>
                <span className="stats-kpi-meta">No data in range</span>
              </>
            )}
          </div>
        </article>
        <article className="stats-kpi-card">
          <span className="stats-kpi-icon amber">
            <FaClock aria-hidden />
          </span>
          <div className="stats-kpi-body">
            <p className="stats-kpi-label">Peak time band</p>
            <p className="stats-kpi-value stats-kpi-value--text sm">
              {analytics.highestSlot?.label || '—'}
            </p>
            <span className="stats-kpi-meta">
              {analytics.highestSlot ? `${analytics.highestSlot.count} bookings` : 'No data in range'}
            </span>
          </div>
        </article>
        <article className="stats-kpi-card">
          <span className="stats-kpi-icon pink">
            <FaCubes aria-hidden />
          </span>
          <div className="stats-kpi-body">
            <p className="stats-kpi-label">Lowest demand</p>
            {analytics.lowResource ? (
              <>
                <p className="stats-kpi-value stats-kpi-value--text">{analytics.lowResource.name}</p>
                <p className="stats-kpi-location">{analytics.lowResource.location || 'Location not set'}</p>
                <span className="stats-kpi-meta">{analytics.lowResource.count} bookings</span>
              </>
            ) : (
              <>
                <p className="stats-kpi-value stats-kpi-value--text">—</p>
                <span className="stats-kpi-meta">No data in range</span>
              </>
            )}
          </div>
        </article>
      </div>

      <div className="stats-insights">
        <article className="stats-insight">
          <FaFire className="stats-insight__icon" aria-hidden />
          <div>
            <h3>Busiest day</h3>
            <p>
              {analytics.peakDay && analytics.peakDay.count > 0
                ? `${analytics.peakDay.fullLabel} · ${analytics.peakDay.count} booking${analytics.peakDay.count === 1 ? '' : 's'}`
                : 'No daily activity for this filter.'}
            </p>
          </div>
        </article>
        <article className="stats-insight">
          <FaBolt className="stats-insight__icon" aria-hidden />
          <div>
            <h3>Quietest slot</h3>
            <p>
              {analytics.lowestSlot
                ? `${analytics.lowestSlot.label} · ${analytics.lowestSlot.count} booking${analytics.lowestSlot.count === 1 ? '' : 's'}`
                : '—'}
            </p>
          </div>
        </article>
        <article className="stats-insight">
          <FaLayerGroup className="stats-insight__icon" aria-hidden />
          <div>
            <h3>Resources with bookings</h3>
            <p>
              {analytics.uniqueResourcesBooked} distinct resource{analytics.uniqueResourcesBooked === 1 ? '' : 's'} in this view
            </p>
          </div>
        </article>
      </div>

      {(analytics.topResources.length > 0 || analytics.lowResources.length > 0) && (
        <div className="stats-lists-grid">
          <article className="dash-card stats-panel">
            <div className="stats-panel__head">
              <h2>
                <FaChartLine aria-hidden /> Top resources
              </h2>
              <p>Share of demand among the busiest assets.</p>
            </div>
            {analytics.topResources.length === 0 ? (
              <p className="stats-empty">No bookings for current filters.</p>
            ) : (
              <div className="stats-list">
                {analytics.topResources.map((r, index) => (
                  <div className="stats-list-item" key={`top-${r.id}`}>
                    <div className="stats-list-text">
                      <div className="stats-list-primary">
                        <strong>
                          <span className="stats-rank">{index + 1}</span>
                          {r.name}
                        </strong>
                        <span className="stats-list-location">{r.location || 'Location not set'}</span>
                      </div>
                      <span className="stats-list-count">{r.count} bookings</span>
                    </div>
                    <div className="stats-progress">
                      <div
                        className="stats-progress-fill"
                        style={{
                          width: `${widthPercent(r.count, analytics.maxResourceCount || 1)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>

          <article className="dash-card stats-panel">
            <div className="stats-panel__head">
              <h2>
                <FaChartPie aria-hidden /> Lower demand
              </h2>
              <p>Candidates for promotion or schedule changes.</p>
            </div>
            {analytics.lowResources.length === 0 ? (
              <p className="stats-empty">No bookings for current filters.</p>
            ) : (
              <div className="stats-list">
                {analytics.lowResources.map((r) => (
                  <div className="stats-list-item" key={`low-${r.id}`}>
                    <div className="stats-list-text">
                      <div className="stats-list-primary">
                        <strong>{r.name}</strong>
                        <span className="stats-list-location">{r.location || 'Location not set'}</span>
                      </div>
                      <span className="stats-list-count">{r.count} bookings</span>
                    </div>
                    <div className="stats-progress low">
                      <div
                        className="stats-progress-fill stats-progress-fill--muted"
                        style={{
                          width: `${widthPercent(r.count, analytics.maxResourceCount || 1)}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </article>
        </div>
      )}

      <div className="stats-panels-grid stats-panels-grid--wide">
        <article className="dash-card stats-line-panel stats-panel">
          <div className="stats-panel__head stats-line-head">
            <div>
              <h2>Daily booking trend</h2>
              <p>Volume per day for the selected filters.</p>
            </div>
          </div>
          {analytics.dailyTrend.length === 0 ? (
            <p className="stats-empty">No bookings found for current filters.</p>
          ) : (
            <DailyBookingsLineChart
              data={analytics.dailyTrend}
              maxCount={analytics.maxDailyCount}
            />
          )}
        </article>
      </div>

      <div className="stats-panels-grid">
        <article className="dash-card stats-panel">
          <div className="stats-panel__head">
            <h2>Bookings by time of day</h2>
            <p>Morning through night distribution.</p>
          </div>
          {analytics.slotEntries.every((item) => item.count === 0) ? (
            <p className="stats-empty">No bookings found for current filters.</p>
          ) : (
            <div className="stats-bar-chart">
              {analytics.slotEntries.map((slot) => (
                <div className="stats-bar-item" key={`bar-${slot.key}`}>
                  <div className="stats-bar-value">{slot.count}</div>
                  <div className="stats-bar-track">
                    <div
                      className="stats-bar-fill"
                      style={{ height: `${getPercent(slot.count, analytics.maxSlotCount)}%` }}
                    />
                  </div>
                  <div className="stats-bar-label">{shortLabel(slot.key)}</div>
                </div>
              ))}
            </div>
          )}
        </article>

        <article className="dash-card stats-panel">
          <div className="stats-panel__head">
            <h2>Top resource mix</h2>
            <p>Approximate share among top five plus others.</p>
          </div>
          {analytics.resourceShareData.length === 0 ? (
            <p className="stats-empty">No bookings found for current filters.</p>
          ) : (
            <div className="stats-pie-wrap">
              <div className="stats-pie" style={{ background: analytics.pieGradient }} />
              <div className="stats-legend">
                {analytics.resourceShareData.map((item) => (
                  <div className="stats-legend-item" key={`legend-${item.id}`}>
                    <span className="stats-legend-dot" style={{ backgroundColor: item.color }} />
                    <span className="stats-legend-label">
                      <span className="stats-legend-name">{item.name}</span>
                      {item.location ? (
                        <span className="stats-legend-loc">{item.location}</span>
                      ) : null}
                    </span>
                    <span className="stats-legend-value">{item.percent}%</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </article>
      </div>

      <p className="stats-footnote">
        Showing {analytics.total} filtered booking{analytics.total === 1 ? '' : 's'} out of {analytics.sourceCount} total record
        {analytics.sourceCount === 1 ? '' : 's'} in the system.
      </p>
    </section>
  )
}

function normalizeLocation(value) {
  if (value == null) return ''
  const s = String(value).trim()
  return s
}

function filterByPeriod(bookings, period) {
  if (period === 'ALL') return bookings
  const days = Number(period)
  if (!Number.isFinite(days) || days <= 0) return bookings

  const threshold = new Date()
  threshold.setHours(0, 0, 0, 0)
  threshold.setDate(threshold.getDate() - days + 1)

  return bookings.filter((booking) => {
    const bookingDate = parseBookingDate(booking.bookingDate)
    return bookingDate && bookingDate >= threshold
  })
}

function parseBookingDate(value) {
  if (!value) return null
  if (value instanceof Date && !Number.isNaN(value.getTime())) return value

  const trimmed = String(value).trim()
  if (!trimmed) return null

  const direct = new Date(trimmed)
  if (!Number.isNaN(direct.getTime())) return direct

  const parts = trimmed.split(/[-/]/).map((part) => Number(part))
  if (parts.length === 3 && parts.every((part) => Number.isFinite(part))) {
    const [year, month, day] = parts
    if (year > 1000 && month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return new Date(year, month - 1, day)
    }
  }

  return null
}

function getTimeSlot(startTime) {
  const hour = parseHour(startTime)
  if (hour >= 6 && hour < 12) return 'MORNING'
  if (hour >= 12 && hour < 17) return 'AFTERNOON'
  if (hour >= 17 && hour < 21) return 'EVENING'
  return 'NIGHT'
}

function parseHour(timeText) {
  if (!timeText) return 0
  const normalized = String(timeText).trim().toUpperCase().replace(/\./g, ':')
  const firstPart = normalized.split('-')[0].trim()
  const match = firstPart.match(/^(\d{1,2})(?::(\d{1,2}))?(?::(\d{1,2}))?\s*(AM|PM)?$/)
  if (!match) return 0

  let hour = Number(match[1])
  const minute = match[2] ? Number(match[2]) : 0
  const second = match[3] ? Number(match[3]) : 0
  const meridiem = match[4]
  if (!Number.isFinite(hour) || !Number.isFinite(minute) || !Number.isFinite(second)) return 0
  if (minute < 0 || minute > 59 || second < 0 || second > 59) return 0

  // Support 12-hour and 24-hour inputs:
  // - "1:30 PM" -> 13
  // - "13:30", "13:30:00", or "13.30" -> 13
  if (meridiem === 'PM' && hour < 12) hour += 12
  if (meridiem === 'AM' && hour === 12) hour = 0
  if (hour < 0 || hour > 23) return 0
  return hour
}

function getPercent(value, max) {
  if (!max || max <= 0) return 0
  return Math.max(4, Math.round((value / max) * 100))
}

function widthPercent(value, max) {
  if (!max || max <= 0) return 0
  return Math.min(100, Math.round((value / max) * 100))
}

function buildResourceShareData(topResources, total) {
  if (!total || total <= 0) return []

  const list = topResources.map((resource, index) => ({
    id: resource.id,
    name: resource.name,
    location: resource.location || '',
    count: resource.count,
    percent: Math.max(1, Math.round((resource.count / total) * 100)),
    color: CHART_COLORS[index % CHART_COLORS.length],
  }))

  const used = list.reduce((sum, item) => sum + item.count, 0)
  const others = total - used
  if (others > 0) {
    list.push({
      id: '__others__',
      name: 'Others',
      location: '',
      count: others,
      percent: Math.max(1, Math.round((others / total) * 100)),
      color: CHART_COLORS[list.length % CHART_COLORS.length],
    })
  }

  const totalPercent = list.reduce((sum, item) => sum + item.percent, 0)
  if (totalPercent !== 100 && list.length > 0) {
    list[0].percent += 100 - totalPercent
  }

  return list
}

function buildPieGradient(items) {
  if (!items.length) return '#e2e8f0'
  let progress = 0
  const segments = items.map((item) => {
    const start = progress
    progress += item.percent
    return `${item.color} ${start}% ${Math.min(progress, 100)}%`
  })
  return `conic-gradient(${segments.join(', ')})`
}

function shortLabel(slotKey) {
  if (slotKey === 'MORNING') return 'Morning'
  if (slotKey === 'AFTERNOON') return 'Afternoon'
  if (slotKey === 'EVENING') return 'Evening'
  return 'Night'
}

function buildDailyTrend(bookings, period) {
  if (!Array.isArray(bookings) || bookings.length === 0) return []

  const byDay = new Map()
  bookings.forEach((booking) => {
    const date = parseBookingDate(booking.bookingDate)
    if (!date) return
    const key = toIsoDateKey(date)
    byDay.set(key, (byDay.get(key) || 0) + 1)
  })

  if (byDay.size === 0) return []

  // Always start from the first booking day in the filtered dataset
  // so we don't render leading zero-only days before real activity.
  const sortedKeys = [...byDay.keys()].sort()
  const startDate = parseBookingDate(sortedKeys[0])
  const endDate = parseBookingDate(sortedKeys[sortedKeys.length - 1])

  if (!startDate || !endDate) return []

  const result = []
  const cursor = new Date(startDate)
  cursor.setHours(0, 0, 0, 0)
  const last = new Date(endDate)
  last.setHours(0, 0, 0, 0)

  while (cursor <= last) {
    const key = toIsoDateKey(cursor)
    const count = byDay.get(key) || 0
    result.push({
      key,
      label: formatAxisDate(cursor),
      fullLabel: formatTooltipDate(cursor),
      count,
    })
    cursor.setDate(cursor.getDate() + 1)
  }

  return result
}

function toIsoDateKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function formatAxisDate(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleString('en-US', { month: 'short' })
  return `${day} ${month}`
}

function formatTooltipDate(date) {
  const day = String(date.getDate()).padStart(2, '0')
  const month = date.toLocaleString('en-US', { month: 'long' })
  return `${day} ${month} ${date.getFullYear()}`
}

function DailyBookingsLineChart({ data, maxCount }) {
  if (!data.length) return null

  const width = 1100
  const height = 280
  const padding = { top: 22, right: 22, bottom: 56, left: 40 }
  const chartWidth = width - padding.left - padding.right
  const chartHeight = height - padding.top - padding.bottom
  const safeMax = Math.max(1, maxCount || 1)

  const points = data.map((item, index) => {
    const x = padding.left + (data.length === 1 ? chartWidth / 2 : (index / (data.length - 1)) * chartWidth)
    const y = padding.top + chartHeight - (item.count / safeMax) * chartHeight
    return { ...item, x, y }
  })

  const pathData = points
    .map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
    .join(' ')
  const areaPath = `${pathData} L ${points[points.length - 1].x} ${padding.top + chartHeight} L ${points[0].x} ${padding.top + chartHeight} Z`

  const gridValues = [0, 0.25, 0.5, 0.75, 1]
  const labelStep = Math.max(1, Math.ceil(points.length / 7))
  const peakCount = Math.max(...data.map((d) => d.count), 0)

  return (
    <div className="stats-line-chart-wrap">
      <svg viewBox={`0 0 ${width} ${height}`} className="stats-line-chart" role="img" aria-label="Daily booking trend line graph">
        <defs>
          <linearGradient id="dailyTrendArea" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#6366f1" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#6366f1" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridValues.map((v) => {
          const y = padding.top + chartHeight - v * chartHeight
          const label = Math.round(v * safeMax)
          return (
            <g key={`grid-${v}`}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} className="stats-line-grid" />
              <text x={padding.left - 10} y={y + 4} textAnchor="end" className="stats-line-y-label">{label}</text>
            </g>
          )
        })}

        <path d={areaPath} className="stats-line-area" />
        <path d={pathData} className="stats-line-path" />

        {points.map((p, index) => (
          <g key={`point-${p.key}`}>
            <circle
              cx={p.x}
              cy={p.y}
              r={p.count > 0 ? 4 : 3}
              className={`stats-line-point${p.count === peakCount && peakCount > 0 ? ' peak' : ''}`}
            />
            {index % labelStep === 0 || index === points.length - 1 ? (
              <text x={p.x} y={height - 18} textAnchor="middle" className="stats-line-x-label">{p.label}</text>
            ) : null}
            <title>{`${p.fullLabel}: ${p.count} bookings`}</title>
          </g>
        ))}
      </svg>
    </div>
  )
}
